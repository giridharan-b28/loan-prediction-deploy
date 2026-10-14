// ============================================================
// LOAN PREDICTION APPLICATION
// ============================================================

const API_URL = "http://127.0.0.1:5000";

const STORAGE_KEY = "loanPredictionHistory";


// ============================================================
// PAGE ELEMENTS
// ============================================================

const homePage = document.getElementById("homePage");
const formPage = document.getElementById("formPage");
const resultPage = document.getElementById("resultPage");
const modelsPage = document.getElementById("modelsPage");
const historyPage = document.getElementById("historyPage");
const dashboardPage = document.getElementById("dashboardPage");


// ============================================================
// BUTTONS
// ============================================================

const startButton =
    document.getElementById("startButton");

const modelsButton =
    document.getElementById("modelsButton");

const historyButton =
    document.getElementById("historyButton");

const dashboardButton =
    document.getElementById("dashboardButton");

const backFromForm =
    document.getElementById("backFromForm");

const backFromModels =
    document.getElementById("backFromModels");

const backFromHistory =
    document.getElementById("backFromHistory");

const backFromDashboard =
    document.getElementById("backFromDashboard");

const newPredictionButton =
    document.getElementById("newPredictionButton");

const resultHistoryButton =
    document.getElementById("resultHistoryButton");

const resultDashboardButton =
    document.getElementById("resultDashboardButton");

const clearHistoryButton =
    document.getElementById("clearHistoryButton");

const loanForm =
    document.getElementById("loanForm");


// ============================================================
// RESULT ELEMENTS
// ============================================================

const resultIcon =
    document.getElementById("resultIcon");

const resultTitle =
    document.getElementById("resultTitle");

const resultMessage =
    document.getElementById("resultMessage");

const predictionValue =
    document.getElementById("predictionValue");

const modelValue =
    document.getElementById("modelValue");

const accuracyValue =
    document.getElementById("accuracyValue");


// ============================================================
// MODEL ELEMENTS
// ============================================================

const bestModelName =
    document.getElementById("bestModelName");

const bestModelAccuracy =
    document.getElementById("bestModelAccuracy");

const algorithmList =
    document.getElementById("algorithmList");


// ============================================================
// HISTORY ELEMENTS
// ============================================================

const historyCount =
    document.getElementById("historyCount");

const historyList =
    document.getElementById("historyList");


// ============================================================
// DASHBOARD ELEMENTS
// ============================================================

const totalPredictions =
    document.getElementById("totalPredictions");

const approvedCount =
    document.getElementById("approvedCount");

const rejectedCount =
    document.getElementById("rejectedCount");

const approvalRate =
    document.getElementById("approvalRate");

const dashboardBestModel =
    document.getElementById("dashboardBestModel");

const dashboardBestAccuracy =
    document.getElementById("dashboardBestAccuracy");

const dashboardRecent =
    document.getElementById("dashboardRecent");


// ============================================================
// PAGE NAVIGATION
// ============================================================

function hideAllPages() {

    homePage.classList.add("hidden");
    formPage.classList.add("hidden");
    resultPage.classList.add("hidden");
    modelsPage.classList.add("hidden");
    historyPage.classList.add("hidden");
    dashboardPage.classList.add("hidden");
}


function showPage(page) {

    hideAllPages();

    page.classList.remove("hidden");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// ============================================================
// HOME
// ============================================================

startButton.addEventListener(
    "click",
    function () {

        loanForm.reset();

        showPage(formPage);
    }
);


modelsButton.addEventListener(
    "click",
    function () {

        showPage(modelsPage);

        loadModelPerformance();
    }
);


historyButton.addEventListener(
    "click",
    function () {

        showPage(historyPage);

        loadHistory();
    }
);


dashboardButton.addEventListener(
    "click",
    function () {

        showPage(dashboardPage);

        loadDashboard();
    }
);


// ============================================================
// BACK BUTTONS
// ============================================================

backFromForm.addEventListener(
    "click",
    function () {

        showPage(homePage);
    }
);


backFromModels.addEventListener(
    "click",
    function () {

        showPage(homePage);
    }
);


backFromHistory.addEventListener(
    "click",
    function () {

        showPage(homePage);
    }
);


backFromDashboard.addEventListener(
    "click",
    function () {

        showPage(homePage);
    }
);


// ============================================================
// RESULT NAVIGATION
// ============================================================

newPredictionButton.addEventListener(
    "click",
    function () {

        loanForm.reset();

        showPage(formPage);
    }
);


resultHistoryButton.addEventListener(
    "click",
    function () {

        showPage(historyPage);

        loadHistory();
    }
);


resultDashboardButton.addEventListener(
    "click",
    function () {

        showPage(dashboardPage);

        loadDashboard();
    }
);


// ============================================================
// FORM SUBMISSION
// ============================================================

loanForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const predictButton =
            document.getElementById(
                "predictButton"
            );


        predictButton.disabled = true;

        predictButton.textContent =
            "Predicting...";


        try {

            // ------------------------------------------------
            // Applicant name
            // ------------------------------------------------

            const applicantName =
                document.getElementById(
                    "applicant_name"
                ).value.trim();


            // ------------------------------------------------
            // Form data
            // ------------------------------------------------

            const data = {

                no_of_dependents:
                    Number(
                        document.getElementById(
                            "no_of_dependents"
                        ).value
                    ),

                education:
                    document.getElementById(
                        "education"
                    ).value,

                self_employed:
                    document.getElementById(
                        "self_employed"
                    ).value,

                income_annum:
                    Number(
                        document.getElementById(
                            "income_annum"
                        ).value
                    ),

                loan_amount:
                    Number(
                        document.getElementById(
                            "loan_amount"
                        ).value
                    ),

                loan_term:
                    Number(
                        document.getElementById(
                            "loan_term"
                        ).value
                    ),

                cibil_score:
                    Number(
                        document.getElementById(
                            "cibil_score"
                        ).value
                    ),

                residential_assets_value:
                    Number(
                        document.getElementById(
                            "residential_assets_value"
                        ).value
                    ),

                commercial_assets_value:
                    Number(
                        document.getElementById(
                            "commercial_assets_value"
                        ).value
                    ),

                luxury_assets_value:
                    Number(
                        document.getElementById(
                            "luxury_assets_value"
                        ).value
                    ),

                bank_asset_value:
                    Number(
                        document.getElementById(
                            "bank_asset_value"
                        ).value
                    )
            };


            // ------------------------------------------------
            // Send ML data to Flask
            // ------------------------------------------------

            const response =
                await fetch(
                    `${API_URL}/predict`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(data)
                    }
                );


            const result =
                await response.json();


            // ------------------------------------------------
            // Flask error
            // ------------------------------------------------

            if (!response.ok) {

                throw new Error(
                    result.error ||
                    "Prediction failed."
                );
            }


            // ------------------------------------------------
            // Prediction
            // ------------------------------------------------

            const prediction =
                String(
                    result.prediction
                )
                .trim()
                .toLowerCase();


            const isApproved =
                prediction === "approved" ||
                prediction === "yes" ||
                prediction === "1";


            // ------------------------------------------------
            // APPROVED
            // ------------------------------------------------

            if (isApproved) {

                resultIcon.textContent =
                    "✓";

                resultIcon.style.background =
                    "#dcfce7";

                resultIcon.style.color =
                    "#16a34a";

                resultTitle.textContent =
                    "Loan Approved";

                resultTitle.style.color =
                    "#16a34a";

                resultMessage.textContent =
                    "Based on the trained machine learning model, your loan application is predicted to be approved.";

                predictionValue.textContent =
                    "Approved";

                predictionValue.style.color =
                    "#16a34a";
            }


            // ------------------------------------------------
            // REJECTED
            // ------------------------------------------------

            else {

                resultIcon.textContent =
                    "✕";

                resultIcon.style.background =
                    "#fee2e2";

                resultIcon.style.color =
                    "#dc2626";

                resultTitle.textContent =
                    "Loan Rejected";

                resultTitle.style.color =
                    "#dc2626";

                resultMessage.textContent =
                    "Based on the trained machine learning model, your loan application is predicted to be rejected.";

                predictionValue.textContent =
                    "Rejected";

                predictionValue.style.color =
                    "#dc2626";
            }


            // ------------------------------------------------
            // Model information
            // ------------------------------------------------

            modelValue.textContent =
                result.model ||
                "Unknown";


            accuracyValue.textContent =
                result.accuracy !== undefined
                    ? `${result.accuracy}%`
                    : "N/A";


            // ------------------------------------------------
            // Save prediction
            // ------------------------------------------------

            savePrediction({

                applicant_name:
                    applicantName,

                prediction:
                    isApproved
                        ? "Approved"
                        : "Rejected",

                model:
                    result.model ||
                    "Unknown",

                accuracy:
                    result.accuracy ||
                    0,

                cibil_score:
                    data.cibil_score,

                loan_amount:
                    data.loan_amount,

                income_annum:
                    data.income_annum,

                education:
                    data.education.trim(),

                self_employed:
                    data.self_employed.trim(),

                timestamp:
                    new Date().toISOString()
            });


            // ------------------------------------------------
            // Show result
            // ------------------------------------------------

            showPage(resultPage);

        }

        catch (error) {

            console.error(
                "Prediction error:",
                error
            );


            alert(
                "Unable to connect to the prediction server.\n\n" +
                "Make sure Flask is running:\n" +
                "python app.py"
            );
        }

        finally {

            predictButton.disabled =
                false;

            predictButton.textContent =
                "Predict Loan Eligibility";
        }
    }
);


// ============================================================
// LOCAL STORAGE
// ============================================================

function getHistory() {

    try {

        const stored =
            localStorage.getItem(
                STORAGE_KEY
            );


        if (!stored) {

            return [];
        }


        return JSON.parse(
            stored
        );

    }

    catch (error) {

        console.error(
            "Unable to read history:",
            error
        );

        return [];
    }
}


function savePrediction(prediction) {

    const history =
        getHistory();


    history.unshift(
        prediction
    );


    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(history)
    );
}


// ============================================================
// HISTORY PAGE
// ============================================================

function loadHistory() {

    const history =
        getHistory();


    historyCount.textContent =
        history.length;


    historyList.innerHTML =
        "";


    if (history.length === 0) {

        historyList.innerHTML = `

            <div class="empty-history">

                <div class="empty-history-icon">
                    📭
                </div>

                <h3>
                    No Predictions Yet
                </h3>

                <p>
                    Your loan predictions will
                    appear here after you make
                    your first prediction.
                </p>

            </div>

        `;

        return;
    }


    history.forEach(
        function (item) {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "history-card";


            const approved =
                item.prediction ===
                "Approved";


            const statusClass =
                approved
                    ? "history-approved"
                    : "history-rejected";


            const date =
                formatDate(
                    item.timestamp
                );


            card.innerHTML = `

                <div class="history-card-top">

                    <div>

                        <h3>
                            ${escapeHTML(
                                item.applicant_name ||
                                "Applicant"
                            )}
                        </h3>

                        <p>
                            ${date}
                        </p>

                    </div>

                    <span
                        class="history-status ${statusClass}"
                    >
                        ${
                            approved
                                ? "✓ Approved"
                                : "✕ Rejected"
                        }
                    </span>

                </div>


                <div class="history-details">

                    <div>

                        <span>
                            CIBIL Score
                        </span>

                        <strong>
                            ${item.cibil_score ?? "-"}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Loan Amount
                        </span>

                        <strong>
                            ${formatNumber(
                                item.loan_amount
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Income
                        </span>

                        <strong>
                            ${formatNumber(
                                item.income_annum
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Model
                        </span>

                        <strong>
                            ${escapeHTML(
                                item.model ||
                                "-"
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Accuracy
                        </span>

                        <strong>
                            ${item.accuracy ?? "-"}%
                        </strong>

                    </div>


                    <div>

                        <span>
                            Education
                        </span>

                        <strong>
                            ${escapeHTML(
                                item.education ||
                                "-"
                            )}
                        </strong>

                    </div>

                </div>

            `;


            historyList.appendChild(
                card
            );
        }
    );
}


// ============================================================
// CLEAR HISTORY
// ============================================================

clearHistoryButton.addEventListener(
    "click",
    function () {

        const history =
            getHistory();


        if (history.length === 0) {

            alert(
                "There is no prediction history to clear."
            );

            return;
        }


        const confirmClear =
            confirm(
                "Are you sure you want to clear all prediction history?"
            );


        if (!confirmClear) {

            return;
        }


        localStorage.removeItem(
            STORAGE_KEY
        );


        loadHistory();

        loadDashboard();


        alert(
            "Prediction history cleared."
        );
    }
);


// ============================================================
// MODEL PERFORMANCE
// ============================================================

async function loadModelPerformance() {

    bestModelName.textContent =
        "Loading...";


    bestModelAccuracy.textContent =
        "--";


    algorithmList.innerHTML = `

        <div class="empty-history">

            <div class="empty-history-icon">
                ⏳
            </div>

            <p>
                Loading model performance...
            </p>

        </div>

    `;


    try {

        const response =
            await fetch(
                `${API_URL}/models`
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Unable to load models."
            );
        }


        bestModelName.textContent =
            data.best_model ||
            "Unknown";


        bestModelAccuracy.textContent =
            data.best_accuracy !== undefined
                ? `${data.best_accuracy}%`
                : "N/A";


        algorithmList.innerHTML =
            "";


        if (
            !data.models ||
            data.models.length === 0
        ) {

            algorithmList.innerHTML = `

                <div class="empty-history">

                    <p>
                        No model information available.
                    </p>

                </div>

            `;

            return;
        }


        data.models.forEach(
            function (model, index) {

                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "algorithm-card";


                card.innerHTML = `

                    <div class="algorithm-number">
                        ${index + 1}
                    </div>

                    <div class="algorithm-info">

                        <h3>
                            ${escapeHTML(
                                model.model
                            )}
                        </h3>

                        <p>
                            Machine Learning Algorithm
                        </p>

                    </div>

                    <div class="algorithm-accuracy">
                        ${model.accuracy}%
                    </div>

                `;


                algorithmList.appendChild(
                    card
                );
            }
        );

    }

    catch (error) {

        console.error(
            "Model loading error:",
            error
        );


        algorithmList.innerHTML = `

            <div class="empty-history">

                <div class="empty-history-icon">
                    ⚠️
                </div>

                <h3>
                    Unable to load models
                </h3>

                <p>
                    Make sure the Flask server
                    is running.
                </p>

            </div>

        `;
    }
}


// ============================================================
// DASHBOARD
// ============================================================

async function loadDashboard() {

    const history =
        getHistory();


    const total =
        history.length;


    const approved =
        history.filter(
            function (item) {

                return item.prediction ===
                    "Approved";
            }
        ).length;


    const rejected =
        history.filter(
            function (item) {

                return item.prediction ===
                    "Rejected";
            }
        ).length;


    const rate =
        total > 0
            ? (
                (approved / total) *
                100
            ).toFixed(1)
            : "0";


    totalPredictions.textContent =
        total;


    approvedCount.textContent =
        approved;


    rejectedCount.textContent =
        rejected;


    approvalRate.textContent =
        `${rate}%`;


    loadDashboardRecent(
        history
    );


    try {

        const response =
            await fetch(
                `${API_URL}/models`
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Unable to load model."
            );
        }


        dashboardBestModel.textContent =
            data.best_model ||
            "Unknown";


        dashboardBestAccuracy.textContent =
            data.best_accuracy !== undefined
                ? `${data.best_accuracy}%`
                : "N/A";

    }

    catch (error) {

        console.error(
            "Dashboard model error:",
            error
        );


        dashboardBestModel.textContent =
            "Unavailable";


        dashboardBestAccuracy.textContent =
            "--";
    }
}


// ============================================================
// DASHBOARD RECENT PREDICTIONS
// ============================================================

function loadDashboardRecent(history) {

    dashboardRecent.innerHTML =
        "";


    if (history.length === 0) {

        dashboardRecent.innerHTML = `

            <div class="empty-history">

                <div class="empty-history-icon">
                    📭
                </div>

                <h3>
                    No Predictions Yet
                </h3>

                <p>
                    Make a prediction to see
                    your activity here.
                </p>

            </div>

        `;

        return;
    }


    const recent =
        history.slice(
            0,
            5
        );


    recent.forEach(
        function (item) {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "history-card";


            const approved =
                item.prediction ===
                "Approved";


            const statusClass =
                approved
                    ? "history-approved"
                    : "history-rejected";


            card.innerHTML = `

                <div class="history-card-top">

                    <div>

                        <h3>
                            ${escapeHTML(
                                item.applicant_name ||
                                "Applicant"
                            )}
                        </h3>

                        <p>
                            ${formatDate(
                                item.timestamp
                            )}
                        </p>

                    </div>

                    <span
                        class="history-status ${statusClass}"
                    >
                        ${
                            approved
                                ? "✓ Approved"
                                : "✕ Rejected"
                        }
                    </span>

                </div>


                <div class="history-details">

                    <div>

                        <span>
                            CIBIL Score
                        </span>

                        <strong>
                            ${item.cibil_score ?? "-"}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Model
                        </span>

                        <strong>
                            ${escapeHTML(
                                item.model ||
                                "-"
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Accuracy
                        </span>

                        <strong>
                            ${item.accuracy ?? "-"}%
                        </strong>

                    </div>


                    <div>

                        <span>
                            Loan Amount
                        </span>

                        <strong>
                            ${formatNumber(
                                item.loan_amount
                            )}
                        </strong>

                    </div>

                </div>

            `;


            dashboardRecent.appendChild(
                card
            );
        }
    );
}


// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(timestamp) {

    if (!timestamp) {

        return "Unknown date";
    }


    const date =
        new Date(timestamp);


    if (isNaN(
        date.getTime()
    )) {

        return "Unknown date";
    }


    return date.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


// ============================================================
// FORMAT NUMBER
// ============================================================

function formatNumber(value) {

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {

        return "-";
    }


    const number =
        Number(value);


    if (isNaN(number)) {

        return value;
    }


    return number.toLocaleString(
        "en-IN"
    );
}


// ============================================================
// SECURITY / HTML ESCAPING
// ============================================================

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// ============================================================
// INITIAL LOAD
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        hideAllPages();

        homePage.classList.remove(
            "hidden"
        );
    }
); 