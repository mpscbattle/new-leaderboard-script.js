// ============================================================
// COMMON ONLINE QUIZ SCRIPT
// Timer + Google Sheet Leaderboard + Analysis
// ============================================================

// ---------------- CONFIGURATION ----------------

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz3PpHdWV8wUTqIzQ1QCO9L4fMtM0eaK2Ha3CjAFBRl2gwAy_SE09fEVTd_KqS4YspI/exec";

// Blogger HTML मधून Test ID आणि Time घेणे
const quizConfig = document.getElementById("quizConfig");

const TEST_ID =
    quizConfig?.dataset.testId || "Default_Test";

const TIME_IN_MINUTES =
    parseInt(quizConfig?.dataset.time || "90", 10);


// ---------------- HTML ELEMENTS ----------------

const quizDiv = document.getElementById("quiz");
const timerDiv = document.getElementById("timer");
const submitBtn = document.getElementById("submitBtn");
const resetBtn = document.getElementById("resetBtn");

const reportCard = document.getElementById("reportCard");
const analysisCard = document.getElementById("analysisCard");

const viewAnalysisBtn = document.getElementById("viewAnalysisBtn");
const backToResultsBtn = document.getElementById("backToResultsBtn");

const initialStartScreen =
    document.getElementById("initialStartScreen");

const centerStartBtn =
    document.getElementById("centerStartBtn");

const quizBox =
    document.getElementById("quizBox");

const questionCountDisplay =
    document.getElementById("questionCountDisplay");

const progressBar =
    document.getElementById("progressBar");

const leaderboardCard =
    document.getElementById("leaderboardCard");

const viewLeaderboardBtnStart =
    document.getElementById("viewLeaderboardBtnStart");

const viewLeaderboardBtnReport =
    document.getElementById("viewLeaderboardBtnReport");

const saveScoreBtn =
    document.getElementById("saveScoreBtn");

const userNameInput =
    document.getElementById("userName");

const saveMessage =
    document.getElementById("saveMessage");

const returnToStartBtn =
    document.getElementById("returnToStartBtn");


// ---------------- QUIZ VARIABLES ----------------

let selectedAnswers = [];
let quizLocked = [];
let correctCount = 0;

let timer = TIME_IN_MINUTES * 60;
let timerInterval = null;

let quizStarted = false;
let quizSubmitted = false;

const questions = [];


// ============================================================
// 1. LOAD QUESTIONS FROM HTML
// ============================================================

function loadQuestionsFromHTML() {

    questions.length = 0;

    document.querySelectorAll(".question-data").forEach(qEl => {

        const qElement = qEl.querySelector(".q");

        const optionElements =
            qEl.querySelectorAll(".opt");

        if (!qElement || optionElements.length === 0) {
            return;
        }

        const question =
            qElement.innerHTML;

        const options =
            Array.from(optionElements).map(
                el => el.innerHTML
            );

        const answer =
            parseInt(
                qEl.getAttribute("data-answer"),
                10
            );

        const explanation =
            qEl.getAttribute("data-explanation") || "";

        questions.push({
            question: question,
            options: options,
            answer: answer,
            explanation: explanation
        });

    });

    selectedAnswers =
        new Array(questions.length);

    quizLocked =
        new Array(questions.length).fill(false);
}


// ============================================================
// 2. RENDER ALL QUESTIONS
// ============================================================

function renderAllQuestions() {

    if (!quizDiv) return;

    let html = "";

    let attemptedCount = 0;

    questions.forEach((q, index) => {

        if (selectedAnswers[index] !== undefined) {
            attemptedCount++;
        }

        html += `
        <div class="question-card">

            <div class="question-number-circle">
                ${index + 1}
            </div>

            <div class="question">
                ${q.question}
            </div>

            <div class="options">
        `;

        q.options.forEach((opt, i) => {

            const isSelected =
                selectedAnswers[index] === i
                    ? " selected"
                    : "";

            const onClickAttr =
                quizLocked[index]
                    ? ""
                    : `onclick="selectAnswer(${index}, ${i})"`;

            html += `
                <div class="option${isSelected}"
                     ${onClickAttr}>
                    ${opt}
                </div>
            `;
        });

        html += `
            </div>
        </div>
        `;
    });

    quizDiv.innerHTML = html;


    // Question count

    if (questionCountDisplay) {

        questionCountDisplay.textContent =
            `Questions : ${attemptedCount}/${questions.length}`;
    }


    // Progress bar

    if (progressBar) {

        const percentage =
            questions.length > 0
                ? (attemptedCount / questions.length) * 100
                : 0;

        progressBar.style.width =
            `${percentage}%`;
    }
}


// ============================================================
// 3. SELECT ANSWER
// ============================================================

window.selectAnswer = function(qIndex, aIndex) {

    if (quizLocked[qIndex]) {
        return;
    }

    if (quizSubmitted) {
        return;
    }

    selectedAnswers[qIndex] = aIndex;

    renderAllQuestions();
};


// ============================================================
// 4. TIMER
// ============================================================

function updateTimer() {

    if (!timerDiv) return;


    if (timer <= 0) {

        timer = 0;

        timerDiv.textContent = "🕛 00:00:00";

        clearInterval(timerInterval);

        submitResults();

        return;
    }


    const hours =
        Math.floor(timer / 3600);

    const minutes =
        Math.floor((timer % 3600) / 60);

    const seconds =
        timer % 60;


    const hDisplay =
        hours < 10
            ? "0" + hours
            : hours;

    const mDisplay =
        minutes < 10
            ? "0" + minutes
            : minutes;

    const sDisplay =
        seconds < 10
            ? "0" + seconds
            : seconds;


    timerDiv.textContent =
        `🕛 ${hDisplay}:${mDisplay}:${sDisplay}`;


    // Last 5 minutes

    if (timer <= 300) {

        timerDiv.style.color = "red";

        timerDiv.classList.add("timer-low");

    } else {

        timerDiv.style.color = "";

        timerDiv.classList.remove("timer-low");

    }


    timer--;
}


// ============================================================
// 5. START TIMER
// ============================================================

function startTimer() {

    clearInterval(timerInterval);

    timer =
        TIME_IN_MINUTES * 60;

    updateTimer();

    timerInterval =
        setInterval(updateTimer, 1000);
}


// ============================================================
// 6. SUBMIT TEST
// ============================================================

function submitResults() {

    if (quizSubmitted) {
        return;
    }

    quizSubmitted = true;

    clearInterval(timerInterval);


    // Lock all questions

    quizLocked =
        questions.map(() => true);

    renderAllQuestions();


    // Hide buttons

    if (submitBtn) {
        submitBtn.style.display = "none";
    }

    if (resetBtn) {
        resetBtn.style.display = "none";
    }


    // Show report

    if (reportCard) {
        reportCard.style.display = "block";
    }


    // Attempted questions

    const attempted =
        selectedAnswers.filter(
            v => v !== undefined
        ).length;


    // Correct answers

    correctCount =
        selectedAnswers.filter(
            (v, i) =>
                v !== undefined &&
                questions[i] &&
                v === questions[i].answer
        ).length;


    // Wrong answers

    const wrong =
        attempted - correctCount;


    // Score

    const score =
        correctCount;


    // Percentage

    const percent =
        questions.length > 0
            ? ((correctCount / questions.length) * 100).toFixed(2)
            : "0.00";


    // Report values

    const totalElement =
        document.getElementById("total");

    const attemptedElement =
        document.getElementById("attempted");

    const correctElement =
        document.getElementById("correct");

    const wrongElement =
        document.getElementById("wrong");

    const scoreElement =
        document.getElementById("score");

    const totalScoreElement =
        document.getElementById("totalScore");


    if (totalElement) {
        totalElement.textContent =
            questions.length;
    }

    if (attemptedElement) {
        attemptedElement.textContent =
            attempted;
    }

    if (correctElement) {
        correctElement.textContent =
            correctCount;
    }

    if (wrongElement) {
        wrongElement.textContent =
            wrong;
    }

    if (scoreElement) {
        scoreElement.textContent =
            score;
    }

    if (totalScoreElement) {
        totalScoreElement.textContent =
            questions.length;
    }


    // Percentage element असल्यास दाखवा
    // तुमच्या HTML मध्ये नसले तरी error येणार नाही

    const percentageElement =
        document.getElementById("percentage");

    if (percentageElement) {

        percentageElement.textContent =
            percent;
    }


    // Result message

    const resultMessage =
        document.getElementById("resultMessage");

    if (resultMessage) {

        resultMessage.innerHTML =
            `You scored <b>${correctCount}</b> out of <b>${questions.length}</b>
             (${percent}%)`;
    }


    // Scroll report

    setTimeout(() => {

        if (reportCard) {

            reportCard.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }

    }, 300);
}


// ============================================================
// 7. QUESTION ANALYSIS
// ============================================================

function showAnalysis() {

    if (!analysisCard) return;

    analysisCard.style.display = "block";


    const container =
        document.getElementById("analysisContent");

    if (!container) return;


    container.innerHTML =
        questions.map((q, i) => {

            const userAns =
                selectedAnswers[i];


            const feedbackClass =
                userAns === undefined
                    ? "not-attempted-feedback"
                    : (
                        userAns === q.answer
                            ? "correct-feedback"
                            : "wrong-feedback"
                    );


            const feedbackText =
                userAns === undefined
                    ? "Not Attempted"
                    : (
                        userAns === q.answer
                            ? "Correct"
                            : "Wrong"
                    );


            const optionsHTML =
                q.options.map((opt, j) => {

                    let optionClass = "";

                    if (j === q.answer) {

                        optionClass = "correct";

                    } else if (
                        j === userAns &&
                        userAns !== q.answer
                    ) {

                        optionClass = "wrong";
                    }


                    return `
                        <div class="option ${optionClass}">
                            ${opt}
                        </div>
                    `;

                }).join("");


            const explanationHTML =
                q.explanation
                    ? `
                    <div class="explanation-box">
                        <b>📝 स्पष्टीकरण :</b>
                        ${q.explanation}
                    </div>
                    `
                    : "";


            return `
            <div class="analysis-box">

                <div class="question-number-circle">
                    ${i + 1}
                </div>

                <b>${q.question}</b>

                ${optionsHTML}

                <div class="feedback ${feedbackClass}">
                    ${feedbackText}
                </div>

                ${explanationHTML}

            </div>
            `;

        }).join("");


    setTimeout(() => {

        analysisCard.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }, 300);
}


// ============================================================
// 8. SAVE SCORE TO GOOGLE SHEET
// ============================================================

async function saveToGoogleSheet(name, score) {

    if (!name || name.trim() === "") {

        if (saveMessage) {

            saveMessage.textContent =
                "Please enter your name";

            saveMessage.style.color =
                "#cc0000";
        }

        return;
    }


    if (saveMessage) {

        saveMessage.textContent =
            "Saving...";

        saveMessage.style.color =
            "blue";
    }


    if (saveScoreBtn) {
        saveScoreBtn.disabled = true;
    }


    try {

        await fetch(
            SCRIPT_URL,
            {
                method: "POST",

                mode: "no-cors",

                body: JSON.stringify({
                    name: name.trim(),
                    score: score,
                    testId: TEST_ID
                })
            }
        );


        if (saveMessage) {

            saveMessage.textContent =
                "Saved";

            saveMessage.style.color =
                "#008f6b";
        }


        // Leaderboard refresh

        displayLeaderboard();


    } catch (error) {

        console.error(
            "Leaderboard Save Error:",
            error
        );


        if (saveMessage) {

            saveMessage.textContent =
                "Error. Try again";

            saveMessage.style.color =
                "#cc0000";
        }


        if (saveScoreBtn) {

            saveScoreBtn.disabled =
                false;
        }
    }
}


// ============================================================
// 9. DISPLAY LEADERBOARD
// ============================================================

async function displayLeaderboard() {

    if (!leaderboardCard) return;


    leaderboardCard.style.display =
        "block";


    leaderboardCard.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });


    const tbody =
        document.querySelector(
            "#leaderboardTable tbody"
        );


    if (!tbody) return;


    tbody.innerHTML =
        `
        <tr>
            <td colspan="3"
                style="text-align:center;">
                Loading...
            </td>
        </tr>
        `;


    try {

        const response =
            await fetch(
                `${SCRIPT_URL}?testId=${encodeURIComponent(TEST_ID)}`
            );


        const data =
            await response.json();


        tbody.innerHTML = "";


        if (!data || data.length === 0) {

            tbody.innerHTML =
                `
                <tr>
                    <td colspan="3">
                        No scores yet
                    </td>
                </tr>
                `;

            return;
        }


        data.forEach((row, i) => {

            const tr =
                document.createElement("tr");


            const name =
                row[0] ?? "";

            const score =
                row[1] ?? 0;


            tr.innerHTML =
                `
                <td>${i + 1}</td>
                <td>${name}</td>
                <td>${score} / ${questions.length}</td>
                `;


            tbody.appendChild(tr);

        });


    } catch (error) {

        console.error(
            "Leaderboard Loading Error:",
            error
        );


        tbody.innerHTML =
            `
            <tr>
                <td colspan="3">
                    Check Connection
                </td>
            </tr>
            `;
    }
}


// ============================================================
// 10. START TEST BUTTON
// ============================================================

if (centerStartBtn) {

    centerStartBtn.onclick = () => {

        if (quizStarted) {
            return;
        }


        quizStarted = true;


        loadQuestionsFromHTML();


        if (initialStartScreen) {

            initialStartScreen.style.display =
                "none";
        }


        if (leaderboardCard) {

            leaderboardCard.style.display =
                "none";
        }


        if (reportCard) {

            reportCard.style.display =
                "none";
        }


        if (analysisCard) {

            analysisCard.style.display =
                "none";
        }


        if (quizBox) {

            quizBox.style.display =
                "block";
        }


        if (submitBtn) {

            submitBtn.style.display =
                "block";
        }


        if (resetBtn) {

            resetBtn.style.display =
                "block";
        }


        renderAllQuestions();

        startTimer();
    };
}


// ============================================================
// 11. SUBMIT BUTTON
// ============================================================

if (submitBtn) {

    submitBtn.onclick =
        submitResults;
}


// ============================================================
// 12. RESET / RETAKE TEST
// ============================================================

function restartTest() {

    location.reload();
}


if (resetBtn) {

    resetBtn.onclick =
        restartTest;
}


if (returnToStartBtn) {

    returnToStartBtn.onclick =
        restartTest;
}


// ============================================================
// 13. ANALYSIS BUTTON
// ============================================================

if (viewAnalysisBtn) {

    viewAnalysisBtn.onclick =
        showAnalysis;
}


// ============================================================
// 14. BACK TO RESULTS
// ============================================================

if (backToResultsBtn) {

    backToResultsBtn.onclick = () => {

        if (analysisCard) {

            analysisCard.style.display =
                "none";
        }


        if (reportCard) {

            reportCard.style.display =
                "block";

            reportCard.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    };
}


// ============================================================
// 15. SAVE SCORE BUTTON
// ============================================================

if (saveScoreBtn) {

    saveScoreBtn.onclick = () => {

        saveToGoogleSheet(
            userNameInput
                ? userNameInput.value
                : "",
            correctCount
        );

    };
}


// ============================================================
// 16. LEADERBOARD BUTTONS
// ============================================================

if (viewLeaderboardBtnStart) {

    viewLeaderboardBtnStart.onclick =
        displayLeaderboard;
}


if (viewLeaderboardBtnReport) {

    viewLeaderboardBtnReport.onclick =
        displayLeaderboard;
}


// ============================================================
// 17. INITIAL LOAD
// ============================================================

loadQuestionsFromHTML();

renderAllQuestions();


// Timer display प्रारंभिक स्थितीत दाखवणे

if (timerDiv) {

    const initialHours =
        Math.floor(timer / 3600);

    const initialMinutes =
        Math.floor((timer % 3600) / 60);

    const initialSeconds =
        timer % 60;


    const h =
        initialHours < 10
            ? "0" + initialHours
            : initialHours;

    const m =
        initialMinutes < 10
            ? "0" + initialMinutes
            : initialMinutes;

    const s =
        initialSeconds < 10
            ? "0" + initialSeconds
            : initialSeconds;


    timerDiv.textContent =
        `🕛 ${h}:${m}:${s}`;
}
