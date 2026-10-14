// Flask serves this file, so the browser always uses the laptop's current Wi-Fi address.
const API_URL = window.location.origin;
const $ = (id) => document.getElementById(id);
const pages = ["homePage", "formPage", "resultPage", "modelsPage", "historyPage", "dashboardPage"].map($);
const show = (page) => { pages.forEach((item) => item.classList.add("hidden")); page.classList.remove("hidden"); window.scrollTo({ top: 0, behavior: "smooth" }); };
const esc = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
const formatNumber = (value) => value == null ? "-" : Number(value).toLocaleString("en-IN");
const formatDate = (value) => value ? new Date(value).toLocaleString("en-IN") : "Unknown date";
const homePage = $("homePage"), formPage = $("formPage"), resultPage = $("resultPage"), modelsPage = $("modelsPage"), historyPage = $("historyPage"), dashboardPage = $("dashboardPage"), loanForm = $("loanForm");

async function api(path, options) {
    const response = await fetch(`${API_URL}${path}`, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
    return data;
}

$("startButton").onclick = () => { loanForm.reset(); show(formPage); };
$("modelsButton").onclick = async () => { show(modelsPage); await loadModels(); };
$("historyButton").onclick = async () => { show(historyPage); await loadHistory(); };
$("dashboardButton").onclick = async () => { show(dashboardPage); await loadDashboard(); };
["backFromForm", "backFromModels", "backFromHistory", "backFromDashboard"].forEach((id) => $(id).onclick = () => show(homePage));
$("newPredictionButton").onclick = () => { loanForm.reset(); show(formPage); };
$("resultHistoryButton").onclick = async () => { show(historyPage); await loadHistory(); };
$("resultDashboardButton").onclick = async () => { show(dashboardPage); await loadDashboard(); };

loanForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = $("predictButton"); button.disabled = true; button.textContent = "Predicting...";
    const fields = ["applicant_name", "no_of_dependents", "education", "self_employed", "income_annum", "loan_amount", "loan_term", "cibil_score", "residential_assets_value", "commercial_assets_value", "luxury_assets_value", "bank_asset_value"];
    const data = Object.fromEntries(fields.map((field) => [field, $(field).value]));
    ["no_of_dependents", "income_annum", "loan_amount", "loan_term", "cibil_score", "residential_assets_value", "commercial_assets_value", "luxury_assets_value", "bank_asset_value"].forEach((field) => data[field] = Number(data[field]));
    try {
        const result = await api("/predict", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
        const approved = ["approved", "yes", "1"].includes(String(result.prediction).trim().toLowerCase());
        $("resultIcon").textContent = approved ? "✓" : "✕"; $("resultIcon").style.background = approved ? "#dcfce7" : "#fee2e2"; $("resultIcon").style.color = approved ? "#16a34a" : "#dc2626";
        $("resultTitle").textContent = approved ? "Loan Approved" : "Loan Rejected"; $("resultTitle").style.color = approved ? "#16a34a" : "#dc2626";
        $("resultMessage").textContent = `The prediction was saved to the database for ${result.applicant_name}.`;
        $("predictionValue").textContent = approved ? "Approved" : "Rejected"; $("predictionValue").style.color = approved ? "#16a34a" : "#dc2626";
        $("modelValue").textContent = result.model; $("accuracyValue").textContent = `${result.accuracy}%`; show(resultPage);
    } catch (error) { console.error(error); alert(`Prediction could not be completed.\n\n${error.message}`); }
    finally { button.disabled = false; button.textContent = "Predict Loan Eligibility"; }
});

function renderHistory(history) {
    $("historyCount").textContent = history.length;
    if (!history.length) { $("historyList").innerHTML = '<div class="empty-history"><div class="empty-history-icon">📭</div><h3>No Predictions Yet</h3><p>Saved database predictions appear here.</p></div>'; return; }
    $("historyList").innerHTML = history.map((item) => {
        const approved = String(item.prediction).toLowerCase() === "approved";
        return `<div class="history-card"><div class="history-card-top"><div><h3>${esc(item.applicant_name)}</h3><p>${formatDate(item.created_at)}</p></div><span class="history-status ${approved ? "history-approved" : "history-rejected"}">${approved ? "✓ Approved" : "✕ Rejected"}</span></div><div class="history-details"><div><span>CIBIL Score</span><strong>${item.cibil_score}</strong></div><div><span>Loan Amount</span><strong>${formatNumber(item.loan_amount)}</strong></div><div><span>Income</span><strong>${formatNumber(item.income_annum)}</strong></div><div><span>Model</span><strong>${esc(item.model)}</strong></div><div><span>Accuracy</span><strong>${item.accuracy}%</strong></div><div><span>Education</span><strong>${esc(item.education)}</strong></div></div></div>`;
    }).join("");
}
async function loadHistory() { try { renderHistory((await api("/history")).history); } catch (error) { $("historyList").innerHTML = `<div class="empty-history"><h3>Unable to load database history</h3><p>${esc(error.message)}</p></div>`; } }
$("clearHistoryButton").onclick = async () => { if (!confirm("Delete every saved prediction from the database?")) return; try { await api("/history", { method: "DELETE" }); await loadHistory(); await loadDashboard(); } catch (error) { alert(`History was not deleted.\n\n${error.message}`); } };

async function loadModels() { try { const data = await api("/models"); $("bestModelName").textContent = data.best_model; $("bestModelAccuracy").textContent = `${data.best_accuracy}%`; $("algorithmList").innerHTML = data.models.map((model, i) => `<div class="algorithm-card"><div class="algorithm-number">${i + 1}</div><div class="algorithm-info"><h3>${esc(model.model)}</h3><p>Machine Learning Algorithm</p></div><div class="algorithm-accuracy">${model.accuracy}%</div></div>`).join(""); } catch (error) { $("algorithmList").innerHTML = `<p>Unable to load models: ${esc(error.message)}</p>`; } }
async function loadDashboard() {
    try { const [historyResponse, models] = await Promise.all([api("/history"), api("/models")]); const history = historyResponse.history, approved = history.filter((item) => String(item.prediction).toLowerCase() === "approved").length;
        $("totalPredictions").textContent = history.length; $("approvedCount").textContent = approved; $("rejectedCount").textContent = history.length - approved; $("approvalRate").textContent = `${history.length ? ((approved / history.length) * 100).toFixed(1) : 0}%`; $("dashboardBestModel").textContent = models.best_model; $("dashboardBestAccuracy").textContent = `${models.best_accuracy}%`;
        $("dashboardRecent").innerHTML = history.slice(0, 5).map((item) => `<div class="history-card"><strong>${esc(item.applicant_name)}</strong><p>${esc(item.prediction)} · ${formatDate(item.created_at)}</p></div>`).join("") || '<div class="empty-history"><p>No saved predictions yet.</p></div>';
    } catch (error) { $("dashboardRecent").innerHTML = `<p>Unable to load database dashboard: ${esc(error.message)}</p>`; }
}
show(homePage);
