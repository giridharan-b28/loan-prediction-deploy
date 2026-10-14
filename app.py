"""Loan prediction API and mobile-friendly web application."""
import os
from pathlib import Path
import joblib
import mysql.connector
import numpy as np
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")
app = Flask(__name__, static_folder=str(BASE_DIR / "frontend"), static_url_path="")
CORS(app)
MYSQL_CONFIG = {
    "host": os.getenv("MYSQL_HOST"),
    "port": int(os.getenv("MYSQL_PORT", "4000")),
    "user": os.getenv("MYSQL_USER"),
    "password": os.getenv("MYSQL_PASSWORD"),
    "database": os.getenv("MYSQL_DATABASE"),
    "connection_timeout": int(os.getenv("MYSQL_CONNECT_TIMEOUT", "10")),
    "ssl_verify_cert": True,
    "ssl_verify_identity": True,
}
bundle = joblib.load(BASE_DIR / "models" / "all_models.pkl")
preprocessor, label_encoder, models, accuracies = bundle["preprocessor"], bundle["label_encoder"], bundle["models"], bundle["accuracies"]
REQUIRED = ("no_of_dependents", "education", "self_employed", "income_annum", "loan_amount", "loan_term", "cibil_score", "residential_assets_value", "commercial_assets_value", "luxury_assets_value", "bank_asset_value")
NUMERIC = ("no_of_dependents", "income_annum", "loan_amount", "loan_term", "cibil_score", "residential_assets_value", "commercial_assets_value", "luxury_assets_value", "bank_asset_value")

def get_db_connection():
    missing = [key for key in ("user", "password", "database") if not MYSQL_CONFIG[key]]
    if missing: raise RuntimeError(f"Database configuration is incomplete: {', '.join(missing)}")
    return mysql.connector.connect(**MYSQL_CONFIG)

def initialise_database():
    connection = get_db_connection(); cursor = connection.cursor()
    try:
        cursor.execute("""CREATE TABLE IF NOT EXISTS loan_predictions (
            id INT AUTO_INCREMENT PRIMARY KEY, applicant_name VARCHAR(255) NOT NULL,
            no_of_dependents INT NOT NULL, education VARCHAR(32) NOT NULL, self_employed VARCHAR(16) NOT NULL,
            income_annum BIGINT NOT NULL, loan_amount BIGINT NOT NULL, loan_term INT NOT NULL, cibil_score INT NOT NULL,
            residential_assets_value BIGINT NOT NULL, commercial_assets_value BIGINT NOT NULL,
            luxury_assets_value BIGINT NOT NULL, bank_asset_value BIGINT NOT NULL, prediction VARCHAR(64) NOT NULL,
            model VARCHAR(255) NOT NULL, accuracy DECIMAL(6,2) NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP)""")
        connection.commit()
    finally: cursor.close(); connection.close()

def parse_payload():
    data = request.get_json(silent=True)
    if not isinstance(data, dict): raise ValueError("Send a JSON object with all loan fields.")
    missing = [field for field in REQUIRED if data.get(field) in (None, "")]
    if missing: raise ValueError(f"Missing required field(s): {', '.join(missing)}")
    result = {"applicant_name": str(data.get("applicant_name", "Unknown Applicant")).strip()[:255], "education": str(data["education"]).strip(), "self_employed": str(data["self_employed"]).strip()}
    result["applicant_name"] = result["applicant_name"] or "Unknown Applicant"
    if result["education"] not in {"Graduate", "Not Graduate"}: raise ValueError("education must be Graduate or Not Graduate.")
    if result["self_employed"] not in {"Yes", "No"}: raise ValueError("self_employed must be Yes or No.")
    for field in NUMERIC:
        try: value = float(data[field])
        except (TypeError, ValueError) as error: raise ValueError(f"{field} must be a number.") from error
        if not np.isfinite(value) or value < 0: raise ValueError(f"{field} must be a non-negative finite number.")
        result[field] = int(value)
    if result["loan_term"] < 1: raise ValueError("loan_term must be at least 1.")
    if not 300 <= result["cibil_score"] <= 900: raise ValueError("cibil_score must be between 300 and 900.")
    return result

@app.get("/")
def home(): return app.send_static_file("index.html")

@app.get("/health")
def health():
    try:
        connection = get_db_connection(); connection.ping(reconnect=False, attempts=1, delay=0); connection.close()
        database = "connected"
    except Exception as error: database = f"unavailable: {error}"
    return jsonify({"status": "ok", "database": database})

@app.get("/models")
def get_models():
    best = max(accuracies, key=accuracies.get)
    return jsonify({"models": [{"model": name, "accuracy": round(accuracy * 100, 2)} for name, accuracy in accuracies.items()], "best_model": best, "best_accuracy": round(accuracies[best] * 100, 2)})

@app.post("/predict")
def predict():
    try: data = parse_payload()
    except ValueError as error: return jsonify({"error": str(error)}), 400
    try:
        row = np.array([[data["no_of_dependents"], data["education"], data["self_employed"], data["income_annum"], data["loan_amount"], data["loan_term"], data["cibil_score"], data["residential_assets_value"], data["commercial_assets_value"], data["luxury_assets_value"], data["bank_asset_value"]]], dtype=object)
        best = max(accuracies, key=accuracies.get)
        prediction = str(label_encoder.inverse_transform(models[best].predict(preprocessor.transform(row)))[0]).strip()
        accuracy = round(accuracies[best] * 100, 2)
    except Exception as error:
        app.logger.exception("Prediction failed"); return jsonify({"error": f"Prediction failed: {error}"}), 500
    values = (data["applicant_name"], data["no_of_dependents"], data["education"], data["self_employed"], data["income_annum"], data["loan_amount"], data["loan_term"], data["cibil_score"], data["residential_assets_value"], data["commercial_assets_value"], data["luxury_assets_value"], data["bank_asset_value"], prediction, best, accuracy)
    connection = cursor = None
    try:
        connection = get_db_connection(); cursor = connection.cursor()
        cursor.execute("""INSERT INTO loan_predictions (applicant_name, no_of_dependents, education, self_employed, income_annum, loan_amount, loan_term, cibil_score, residential_assets_value, commercial_assets_value, luxury_assets_value, bank_asset_value, prediction, model, accuracy) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""", values)
        connection.commit(); record_id = cursor.lastrowid
    except (mysql.connector.Error, RuntimeError) as error:
        app.logger.exception("Database write failed"); return jsonify({"error": f"Prediction was not saved to the database: {error}"}), 503
    finally:
        if cursor: cursor.close()
        if connection: connection.close()
    return jsonify({"id": record_id, "applicant_name": data["applicant_name"], "prediction": prediction, "model": best, "accuracy": accuracy, "database_saved": True})

@app.get("/history")
def get_history():
    connection = cursor = None
    try:
        connection = get_db_connection(); cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT * FROM loan_predictions ORDER BY created_at DESC, id DESC LIMIT 100")
        history = cursor.fetchall()
        for item in history:
            item["created_at"] = item["created_at"].isoformat() if item["created_at"] else None
            item["accuracy"] = float(item["accuracy"])
        return jsonify({"history": history})
    except (mysql.connector.Error, RuntimeError) as error: return jsonify({"error": str(error)}), 503
    finally:
        if cursor: cursor.close()
        if connection: connection.close()

@app.delete("/history")
def delete_history():
    connection = cursor = None
    try:
        connection = get_db_connection(); cursor = connection.cursor(); cursor.execute("DELETE FROM loan_predictions"); connection.commit()
        return jsonify({"deleted": cursor.rowcount})
    except (mysql.connector.Error, RuntimeError) as error: return jsonify({"error": str(error)}), 503
    finally:
        if cursor: cursor.close()
        if connection: connection.close()

@app.get("/database-test")
def database_test():
    try:
        initialise_database(); connection = get_db_connection(); cursor = connection.cursor(); cursor.execute("SELECT COUNT(*) FROM loan_predictions"); count = cursor.fetchone()[0]; cursor.close(); connection.close()
        return jsonify({"status": "success", "database": MYSQL_CONFIG["database"], "table": "loan_predictions", "records": count})
    except (mysql.connector.Error, RuntimeError) as error: return jsonify({"status": "failed", "error": str(error)}), 503

if __name__ == "__main__":
    try: initialise_database(); print("Database table is ready.")
    except (mysql.connector.Error, RuntimeError) as error: print(f"WARNING: database is unavailable; predictions will not be accepted until it is fixed: {error}")
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5000")), debug=False)
