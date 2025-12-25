// USD.AI Adventure - Interactive Learning App

// Game State
const gameState = {
    currentSection: 0,
    totalSections: 6,
    xp: 0,
    achievements: {
        'ach-start': false,
        'ach-mint': false,
        'ach-stake': false,
        'ach-flow': false,
        'ach-quiz': false
    },
    quizScore: 0,
    quizQuestion: 0,
    mintedTokens: 0,
    hasStaked: false
};

// Quiz Questions
const quizQuestions = [
    {
        question: "What is USDai?",
        options: [
            "A video game currency",
            "A magic stablecoin worth $1 that can always be exchanged back",
            "A type of cryptocurrency that changes value",
            "A bank account"
        ],
        correct: 1,
        feedback: {
            correct: "That's right! USDai is a stablecoin always worth $1!",
            wrong: "Not quite! USDai is a stablecoin that's always worth $1 and can be exchanged back anytime."
        }
    },
    {
        question: "What happens when you stake USDai?",
        options: [
            "It disappears forever",
            "You get sUSDai which grows over time",
            "It turns into regular dollars",
            "Nothing happens"
        ],
        correct: 1,
        feedback: {
            correct: "Exactly! Staking USDai gives you sUSDai which earns yield!",
            wrong: "Actually, when you stake USDai, you get sUSDai which grows and earns 10-15% APR!"
        }
    },
    {
        question: "Where does the yield (extra money) come from?",
        options: [
            "The government prints it",
            "Companies pay to use GPUs that your money helped buy",
            "It appears by magic",
            "From a secret bank"
        ],
        correct: 1,
        feedback: {
            correct: "Yes! Companies pay to use the AI computers (GPUs) that your money helped finance!",
            wrong: "The yield comes from companies paying to use the GPUs (super computers) that your money helped buy!"
        }
    },
    {
        question: "Who are the Curators in USD.AI?",
        options: [
            "People who clean the computers",
            "Guardians who check if borrowers are trustworthy",
            "Artists who draw pictures",
            "People who count money"
        ],
        correct: 1,
        feedback: {
            correct: "Correct! Curators are like guardians who protect depositors by checking borrowers!",
            wrong: "Curators are guardians who check if borrowers are trustworthy and protect your investment!"
        }
    },
    {
        question: "What is the target APR (yearly earnings) for sUSDai?",
        options: [
            "1-2%",
            "5-8%",
            "10-15%",
            "50-100%"
        ],
        correct: 2,
        feedback: {
            correct: "Perfect! USD.AI targets 10-15% APR from GPU financing!",
            wrong: "USD.AI targets 10-15% APR - that's like getting $100-$150 extra for every $1000 you stake for a year!"
        }
    }
];

// Character Details
const characterDetails = {
    depositor: {
        title: "You're the Depositor!",
        description: "As a depositor, you put your stablecoins (like USDC) into USD.AI. In return, you get USDai which you can stake to earn 10-15% APR. Your money helps finance AI infrastructure!",
        emoji: "🧑‍💼"
    },
    borrower: {
        title: "Borrowers Need GPUs!",
        description: "Borrowers are companies and data centers that need super computers (GPUs) to run AI. They borrow money to buy these GPUs and pay interest - which becomes YOUR yield!",
        emoji: "🏢"
    },
    curator: {
        title: "Curators Protect Everyone!",
        description: "Curators are like security guards. They put up their own money first (called 'first-loss capital') and carefully check which borrowers are safe. They earn premiums for keeping the system secure!",
        emoji: "🛡️"
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initNavDots();
    initPiggyCalculator();
    loadGameState();
    updateUI();

    // Award start achievement after a small delay
    setTimeout(() => {
        if (!gameState.achievements['ach-start']) {
            unlockAchievement('ach-start', 'Adventure Begins');
        }
    }, 1500);
});

// Navigation
function nextSection() {
    if (gameState.currentSection < gameState.totalSections - 1) {
        gameState.currentSection++;
        showSection(gameState.currentSection);
        addXP(20);
        saveGameState();
    }
}

function prevSection() {
    if (gameState.currentSection > 0) {
        gameState.currentSection--;
        showSection(gameState.currentSection);
    }
}

function showSection(index) {
    // Hide all sections
    document.querySelectorAll('.game-section').forEach((section, i) => {
        section.classList.remove('active');
    });

    // Show target section
    const targetSection = document.getElementById(`section-${index}`);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Update nav dots
    document.querySelectorAll('.nav-dot').forEach((dot, i) => {
        dot.classList.remove('active');
        if (i < index) {
            dot.classList.add('completed');
        }
        if (i === index) {
            dot.classList.add('active');
        }
    });

    // Update progress bar
    const progress = ((index) / (gameState.totalSections - 1)) * 100;
    document.getElementById('progressBar').style.width = `${progress}%`;

    // Initialize quiz if on quiz section
    if (index === 5 && gameState.quizQuestion === 0) {
        initQuiz();
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initNavDots() {
    document.querySelectorAll('.nav-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            const sectionIndex = parseInt(dot.dataset.section);
            gameState.currentSection = sectionIndex;
            showSection(sectionIndex);
        });
    });
}

// XP System
function addXP(amount) {
    gameState.xp += amount;
    updateXPDisplay();
    saveGameState();
}

function updateXPDisplay() {
    const xpElement = document.getElementById('xpCount');
    const targetXP = gameState.xp;
    let currentXP = parseInt(xpElement.textContent) || 0;

    // Animate XP counting
    const step = Math.ceil((targetXP - currentXP) / 10);
    const interval = setInterval(() => {
        currentXP += step;
        if (currentXP >= targetXP) {
            currentXP = targetXP;
            clearInterval(interval);
        }
        xpElement.textContent = currentXP;
    }, 50);
}

// Achievements
function unlockAchievement(id, name) {
    if (gameState.achievements[id]) return;

    gameState.achievements[id] = true;
    addXP(50);

    // Update achievement item
    const achItem = document.getElementById(id);
    if (achItem) {
        achItem.classList.remove('locked');
        achItem.classList.add('unlocked');
    }

    // Update counter
    const count = Object.values(gameState.achievements).filter(v => v).length;
    document.getElementById('achievementCount').textContent = count;

    // Show popup
    const popup = document.getElementById('achievementPopup');
    document.getElementById('achievementName').textContent = name;
    popup.classList.add('show');

    setTimeout(() => {
        popup.classList.remove('show');
    }, 3000);

    saveGameState();
}

function toggleAchievements() {
    const list = document.getElementById('achievementsList');
    list.classList.toggle('open');
}

// Mint Demo
function mintUSDai() {
    const button = document.getElementById('mintButton');
    const usdcPile = document.getElementById('usdcPile');
    const usdaiPile = document.getElementById('usdaiPile');
    const result = document.getElementById('mintResult');

    button.disabled = true;

    // Animate USDC disappearing
    const tokens = usdcPile.querySelectorAll('.token');
    tokens.forEach((token, i) => {
        setTimeout(() => {
            token.style.transform = 'translateX(50px) scale(0)';
            token.style.opacity = '0';
        }, i * 200);
    });

    // Create USDai tokens
    setTimeout(() => {
        for (let i = 0; i < 3; i++) {
            const token = document.createElement('span');
            token.className = 'token';
            token.textContent = 'U';
            token.style.transform = 'scale(0)';
            usdaiPile.appendChild(token);

            setTimeout(() => {
                token.style.transform = 'scale(1)';
                token.style.transition = 'transform 0.3s ease';
            }, i * 200);
        }

        result.textContent = "You minted 3 USDai! They're always worth $1 each.";
        gameState.mintedTokens = 3;

        // Unlock achievement
        if (!gameState.achievements['ach-mint']) {
            setTimeout(() => {
                unlockAchievement('ach-mint', 'First Mint');
            }, 500);
        }

        // Reset for replay
        setTimeout(() => {
            button.disabled = false;
            tokens.forEach(token => {
                token.style.transform = '';
                token.style.opacity = '';
            });
            usdaiPile.innerHTML = '';
            result.textContent = '';
        }, 4000);

    }, 800);
}

// Stake Demo
function stakeUSDai() {
    const token = document.getElementById('stakeToken');
    const button = document.getElementById('stakeButton');
    const chest = document.getElementById('treasureBox');
    const counter = document.getElementById('yieldCounter');

    button.disabled = true;

    // Animate token flying to chest
    token.classList.add('staking');

    setTimeout(() => {
        // Open chest
        chest.classList.add('open', 'glowing');

        // Start counting yield
        setTimeout(() => {
            chest.classList.add('counting');
            let yield_pct = 0;
            const yieldInterval = setInterval(() => {
                yield_pct += 0.5;
                counter.textContent = `+${yield_pct.toFixed(1)}%`;

                if (yield_pct >= 12) {
                    clearInterval(yieldInterval);
                    counter.textContent = '+12% APR!';

                    // Unlock achievement
                    if (!gameState.achievements['ach-stake']) {
                        unlockAchievement('ach-stake', 'Treasure Hunter');
                    }
                }
            }, 100);
        }, 500);

    }, 600);

    // Reset after delay
    setTimeout(() => {
        token.classList.remove('staking');
        token.style.transform = '';
        token.style.opacity = '';
        chest.classList.remove('open', 'glowing', 'counting');
        counter.textContent = '+0%';
        button.disabled = false;
    }, 6000);

    gameState.hasStaked = true;
}

// Flow Animation
function animateFlow() {
    const steps = document.querySelectorAll('.flow-step');
    const arrows = document.querySelectorAll('.flow-arrow');

    // Reset all
    steps.forEach(s => s.classList.remove('active'));
    arrows.forEach(a => a.classList.remove('active'));

    // Animate each step
    let delay = 0;
    steps.forEach((step, i) => {
        setTimeout(() => {
            step.classList.add('active');

            // Activate arrow after step
            if (arrows[i]) {
                setTimeout(() => {
                    arrows[i].classList.add('active');
                }, 300);
            }

            // On last step, unlock achievement
            if (i === steps.length - 1) {
                if (!gameState.achievements['ach-flow']) {
                    setTimeout(() => {
                        unlockAchievement('ach-flow', 'Flow Master');
                    }, 500);
                }
            }
        }, delay);
        delay += 800;
    });
}

// Character Selection
function selectCharacter(element, type) {
    // Remove selected from all
    document.querySelectorAll('.character-card').forEach(card => {
        card.classList.remove('selected');
    });

    // Add selected to clicked
    element.classList.add('selected');

    // Show detail
    const detail = document.getElementById('characterDetail');
    const info = characterDetails[type];

    detail.innerHTML = `
        <div style="display: flex; align-items: center; gap: 15px;">
            <span style="font-size: 2.5rem;">${info.emoji}</span>
            <div>
                <strong style="color: var(--accent);">${info.title}</strong>
                <p style="margin-top: 8px; color: var(--light);">${info.description}</p>
            </div>
        </div>
    `;

    addXP(10);
}

// Quiz
function initQuiz() {
    gameState.quizQuestion = 0;
    gameState.quizScore = 0;
    showQuizQuestion();
}

function showQuizQuestion() {
    const container = document.getElementById('quizContainer');
    const complete = document.getElementById('quizComplete');
    const restartBtn = document.getElementById('restartBtn');

    if (gameState.quizQuestion >= quizQuestions.length) {
        // Quiz complete
        container.style.display = 'none';
        complete.style.display = 'block';
        restartBtn.style.display = 'inline-flex';

        document.getElementById('finalScore').textContent = gameState.quizScore;

        const messages = [
            "Keep learning! You've got this!",
            "Good effort! Review the lessons and try again!",
            "Nice work! You're getting there!",
            "Great job! You really understand USD.AI!",
            "PERFECT! You're a USD.AI Expert!"
        ];
        document.getElementById('completionMessage').textContent = messages[gameState.quizScore];

        // Unlock quiz achievement if score is 4+
        if (gameState.quizScore >= 4 && !gameState.achievements['ach-quiz']) {
            unlockAchievement('ach-quiz', 'USD.AI Expert');
        }

        addXP(gameState.quizScore * 20);
        return;
    }

    container.style.display = 'block';
    complete.style.display = 'none';
    restartBtn.style.display = 'none';

    const q = quizQuestions[gameState.quizQuestion];

    document.getElementById('questionNum').textContent = gameState.quizQuestion + 1;
    document.getElementById('quizQuestion').textContent = q.question;
    document.getElementById('quizFeedback').textContent = '';
    document.getElementById('quizFeedback').className = 'quiz-feedback';

    const optionsContainer = document.getElementById('quizOptions');
    optionsContainer.innerHTML = '';

    q.options.forEach((option, i) => {
        const btn = document.createElement('button');
        btn.className = 'quiz-option';
        btn.textContent = option;
        btn.onclick = () => selectAnswer(i);
        optionsContainer.appendChild(btn);
    });
}

function selectAnswer(index) {
    const q = quizQuestions[gameState.quizQuestion];
    const options = document.querySelectorAll('.quiz-option');
    const feedback = document.getElementById('quizFeedback');

    // Disable all options
    options.forEach(opt => {
        opt.classList.add('disabled');
        opt.onclick = null;
    });

    // Mark correct/wrong
    if (index === q.correct) {
        options[index].classList.add('correct');
        feedback.textContent = q.feedback.correct;
        feedback.className = 'quiz-feedback correct';
        gameState.quizScore++;
    } else {
        options[index].classList.add('wrong');
        options[q.correct].classList.add('correct');
        feedback.textContent = q.feedback.wrong;
        feedback.className = 'quiz-feedback wrong';
    }

    // Move to next question after delay
    setTimeout(() => {
        gameState.quizQuestion++;
        showQuizQuestion();
    }, 2500);
}

function restartQuiz() {
    gameState.quizQuestion = 0;
    gameState.quizScore = 0;
    showQuizQuestion();
}

// Piggy Calculator
function togglePiggy() {
    const panel = document.getElementById('piggyPanel');
    panel.classList.toggle('open');
}

function initPiggyCalculator() {
    const amountInput = document.getElementById('depositAmount');
    const aprSlider = document.getElementById('aprSlider');

    amountInput.addEventListener('input', calculateYield);
    aprSlider.addEventListener('input', () => {
        document.getElementById('aprDisplay').textContent = aprSlider.value + '%';
        calculateYield();
    });

    calculateYield();
}

function calculateYield() {
    const amount = parseFloat(document.getElementById('depositAmount').value) || 0;
    const apr = parseFloat(document.getElementById('aprSlider').value) / 100;

    const monthly = amount * (apr / 12);
    const yearly = amount * apr;

    document.getElementById('result1m').textContent = '$' + (amount + monthly).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0});
    document.getElementById('result1y').textContent = '$' + (amount + yearly).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0});
    document.getElementById('resultEarn').textContent = '+$' + yearly.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0});
}

function animatePiggy() {
    const resultEarn = document.getElementById('resultEarn');
    resultEarn.style.animation = 'none';
    resultEarn.offsetHeight; // Trigger reflow
    resultEarn.style.animation = 'pulse 0.5s ease 3';
}

// Save/Load Game State
function saveGameState() {
    localStorage.setItem('usdai-learn-state', JSON.stringify(gameState));
}

function loadGameState() {
    const saved = localStorage.getItem('usdai-learn-state');
    if (saved) {
        const parsed = JSON.parse(saved);
        Object.assign(gameState, parsed);
    }
}

function updateUI() {
    // Update XP
    document.getElementById('xpCount').textContent = gameState.xp;

    // Update achievements
    let achCount = 0;
    Object.entries(gameState.achievements).forEach(([id, unlocked]) => {
        const item = document.getElementById(id);
        if (item) {
            if (unlocked) {
                item.classList.remove('locked');
                item.classList.add('unlocked');
                achCount++;
            }
        }
    });
    document.getElementById('achievementCount').textContent = achCount;

    // Show current section
    showSection(gameState.currentSection);
}

// Close panels when clicking outside
document.addEventListener('click', (e) => {
    const achievementsPanel = document.getElementById('achievementsPanel');
    const piggyWidget = document.getElementById('piggyWidget');

    if (!achievementsPanel.contains(e.target)) {
        document.getElementById('achievementsList').classList.remove('open');
    }

    if (!piggyWidget.contains(e.target)) {
        document.getElementById('piggyPanel').classList.remove('open');
    }
});
