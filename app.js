// USD.AI Interactive Learning - Complete JavaScript

// ==================== NAVIGATION ====================

function goToSection(sectionId) {
    // Update tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.section === sectionId) {
            tab.classList.add('active');
        }
    });

    // Update sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Tab click handlers
document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        goToSection(tab.dataset.section);
    });
});

// ==================== CHAPTER 1: STORY NAVIGATION ====================

function nextScene(sceneNumber) {
    // Hide all scenes
    document.querySelectorAll('.story-scene').forEach(scene => {
        scene.classList.add('hidden');
    });

    // Show target scene
    const targetScene = document.getElementById('scene' + sceneNumber);
    if (targetScene) {
        targetScene.classList.remove('hidden');
    }
}

// ==================== CHAPTER 2: POOL BUILDER ====================

const poolBuilderState = {
    totalPoolSize: 10000000, // $10M base pool
    tbillApr: 5.0,           // T-bill base rate
    loans: [],               // Added GPU loans
    gpuLoanTotal: 0,         // Total GPU loan amount
    blendedApy: 5.0          // Current blended APY
};

function initPoolBuilder() {
    // Add click handlers to all loan cards
    document.querySelectorAll('.gpu-loan .add-loan-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.gpu-loan');
            if (!card.classList.contains('added')) {
                addLoanToPool(card);
            }
        });
    });

    // Initial state
    updatePoolDisplay();
}

function addLoanToPool(card) {
    const loan = {
        id: card.dataset.id,
        amount: parseInt(card.dataset.amount),
        apr: parseInt(card.dataset.apr),
        gpus: parseInt(card.dataset.gpus)
    };

    poolBuilderState.loans.push(loan);
    poolBuilderState.gpuLoanTotal += loan.amount;

    // Mark card as added
    card.classList.add('added');
    card.querySelector('.add-loan-btn').textContent = 'Added';

    // Update display
    updatePoolDisplay();
}

function updatePoolDisplay() {
    const { totalPoolSize, tbillApr, gpuLoanTotal, loans } = poolBuilderState;

    // Calculate T-bill portion (remaining after GPU loans)
    const tbillPortion = Math.max(0, totalPoolSize - gpuLoanTotal);
    const gpuPortion = Math.min(gpuLoanTotal, totalPoolSize);

    // Calculate percentages
    const tbillPct = (tbillPortion / totalPoolSize) * 100;
    const gpuPct = (gpuPortion / totalPoolSize) * 100;

    // Calculate weighted average APY
    let weightedApr = 0;
    if (gpuLoanTotal > 0) {
        // Weighted sum of GPU loan APRs
        const gpuWeightedSum = loans.reduce((sum, l) => sum + (l.apr * l.amount), 0);
        const avgGpuApr = gpuWeightedSum / gpuLoanTotal;

        // Blend with T-bill rate
        weightedApr = ((tbillPortion * tbillApr) + (gpuPortion * avgGpuApr)) / totalPoolSize;
    } else {
        weightedApr = tbillApr;
    }

    poolBuilderState.blendedApy = weightedApr;

    // Update meter bar
    document.getElementById('meterTbill').style.width = tbillPct + '%';
    document.getElementById('meterGpu').style.width = gpuPct + '%';

    // Update text inside meter bars
    const tbillLabel = document.querySelector('#meterTbill span');
    const gpuLabel = document.querySelector('#meterGpu span');
    if (tbillLabel) tbillLabel.textContent = tbillPct > 20 ? 'T-Bills' : '';
    if (gpuLabel) gpuLabel.textContent = gpuPct > 20 ? 'GPU Loans' : '';

    // Update yield display with animation
    const yieldEl = document.getElementById('blendedApy');
    yieldEl.style.transform = 'scale(1.1)';
    yieldEl.textContent = weightedApr.toFixed(1) + '%';
    setTimeout(() => { yieldEl.style.transform = 'scale(1)'; }, 200);

    // Update breakdown
    document.getElementById('tbillPortion').textContent =
        `$${(tbillPortion / 1000000).toFixed(1)}M (${tbillPct.toFixed(0)}%)`;
    document.getElementById('gpuPortion').textContent =
        `$${(gpuPortion / 1000000).toFixed(1)}M (${gpuPct.toFixed(0)}%)`;
    document.getElementById('totalPool').textContent =
        `$${(totalPoolSize / 1000000).toFixed(0)}M`;

    // Update explanation text
    const explainText = document.getElementById('poolExplainText');
    if (loans.length === 0) {
        explainText.textContent = "Your pool starts 100% in T-bills earning ~5% APY. Click 'Add to Pool' on GPU loans to see how the blended APY increases.";
    } else if (gpuPct < 50) {
        explainText.textContent = `With ${gpuPct.toFixed(0)}% deployed to GPU loans, your blended APY is now ${weightedApr.toFixed(1)}%. Keep adding loans to increase yield further.`;
    } else if (gpuPct < 100) {
        explainText.textContent = `Excellent! ${gpuPct.toFixed(0)}% is now earning GPU loan rates. Your blended APY of ${weightedApr.toFixed(1)}% is significantly higher than T-bills alone.`;
    } else {
        explainText.textContent = `Pool is fully deployed to GPU loans. Maximum blended APY achieved at ${weightedApr.toFixed(1)}%!`;
    }
}

// ==================== CHAPTER 4: EXIT QUEUE SIMULATOR ====================

const epochState = {
    currentEpoch: 1,
    baseLiquidity: 250000,
    liquidity: 250000,
    depositors: {
        alice: { balance: 500000, withdraw: 0, bid: 30, queued: 0, received: 0 },
        bob: { balance: 300000, withdraw: 0, bid: 50, queued: 0, received: 0 }
    },
    carol: { balance: 1000000, reward: 0, extraYield: 0 },
    history: []
};

function initExitSimulator() {
    // Withdraw input handlers
    document.querySelectorAll('.withdraw-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const depositor = e.target.closest('.depositor');
            const id = depositor.dataset.id;
            const name = id === '1' ? 'alice' : 'bob';
            epochState.depositors[name].withdraw = parseInt(e.target.value) || 0;
            calculateEpochAllocations();
        });
    });

    // Bid slider handlers
    document.querySelectorAll('.bid-range').forEach(slider => {
        slider.addEventListener('input', (e) => {
            const depositor = e.target.closest('.depositor');
            const id = depositor.dataset.id;
            const name = id === '1' ? 'alice' : 'bob';
            const value = parseInt(e.target.value);
            epochState.depositors[name].bid = value;
            depositor.querySelector('.bid-display').textContent = value;
            calculateEpochAllocations();
        });
    });

    // Advance epoch button
    document.getElementById('advanceEpoch').addEventListener('click', advanceEpoch);

    // Initial calculation
    calculateEpochAllocations();
}

function calculateEpochAllocations() {
    const { alice, bob } = epochState.depositors;
    const { liquidity } = epochState;

    // Get requested amounts (either new request or queued from previous)
    const aliceRequest = alice.withdraw + alice.queued;
    const bobRequest = bob.withdraw + bob.queued;
    const totalRequest = aliceRequest + bobRequest;

    // Reset current epoch results
    alice.received = 0;
    bob.received = 0;

    if (totalRequest === 0 || liquidity === 0) {
        updateExitUI();
        return;
    }

    // Calculate bid-weighted allocations
    const totalBidWeight = (alice.bid * aliceRequest) + (bob.bid * bobRequest);

    if (totalBidWeight === 0) {
        // Pro-rata if no bids
        alice.received = Math.min(aliceRequest, (aliceRequest / totalRequest) * liquidity);
        bob.received = Math.min(bobRequest, (bobRequest / totalRequest) * liquidity);
    } else {
        // Bid-weighted allocation
        const aliceWeight = (alice.bid * aliceRequest) / totalBidWeight;
        const bobWeight = (bob.bid * bobRequest) / totalBidWeight;

        alice.received = Math.min(aliceRequest, aliceWeight * liquidity);
        bob.received = Math.min(bobRequest, bobWeight * liquidity);
    }

    // Calculate remaining queue
    alice.queued = Math.max(0, aliceRequest - alice.received);
    bob.queued = Math.max(0, bobRequest - bob.received);

    // Calculate bid fee redistribution to Carol (stayer)
    const aliceFee = (alice.bid / 10000) * alice.received;
    const bobFee = (bob.bid / 10000) * bob.received;
    epochState.carol.reward = aliceFee + bobFee;

    // Extra yield from reduced pool size
    const totalExited = alice.received + bob.received;
    if (totalExited > 0) {
        epochState.carol.extraYield = (totalExited / epochState.carol.balance) * 0.5; // Simplified calculation
    }

    updateExitUI();
}

function updateExitUI() {
    const { alice, bob } = epochState.depositors;
    const { carol, liquidity } = epochState;

    // Update Alice
    const aliceCard = document.querySelector('.depositor[data-id="1"]');
    aliceCard.querySelector('.result-amount').textContent = '$' + Math.round(alice.received).toLocaleString();
    aliceCard.querySelector('.queue-amount').textContent = '$' + Math.round(alice.queued).toLocaleString();

    // Update Bob
    const bobCard = document.querySelector('.depositor[data-id="2"]');
    bobCard.querySelector('.result-amount').textContent = '$' + Math.round(bob.received).toLocaleString();
    bobCard.querySelector('.queue-amount').textContent = '$' + Math.round(bob.queued).toLocaleString();

    // Update Carol (stayer)
    document.getElementById('carolReward').textContent = '$' + Math.round(carol.reward).toLocaleString();
    document.getElementById('carolExtraYield').textContent = '+' + carol.extraYield.toFixed(2) + '%';

    // Update queue bar visualization
    const queueBar = document.getElementById('queueBar');
    queueBar.innerHTML = '';

    const alicePct = (alice.received / liquidity) * 100;
    const bobPct = (bob.received / liquidity) * 100;
    const remainingPct = 100 - alicePct - bobPct;

    if (alicePct > 0) {
        const aliceSeg = document.createElement('div');
        aliceSeg.className = 'queue-segment alice';
        aliceSeg.style.width = alicePct + '%';
        aliceSeg.innerHTML = alicePct > 15 ? '<span>Alice</span>' : '';
        queueBar.appendChild(aliceSeg);
    }

    if (bobPct > 0) {
        const bobSeg = document.createElement('div');
        bobSeg.className = 'queue-segment bob';
        bobSeg.style.width = bobPct + '%';
        bobSeg.innerHTML = bobPct > 15 ? '<span>Bob</span>' : '';
        queueBar.appendChild(bobSeg);
    }

    if (remainingPct > 0) {
        const remainSeg = document.createElement('div');
        remainSeg.className = 'queue-segment remaining';
        remainSeg.style.width = remainingPct + '%';
        remainSeg.innerHTML = remainingPct > 20 ? '<span>Unused</span>' : '';
        queueBar.appendChild(remainSeg);
    }
}

function advanceEpoch() {
    const { alice, bob } = epochState.depositors;
    const { carol } = epochState;

    // Record history
    epochState.history.push({
        epoch: epochState.currentEpoch,
        distributed: alice.received + bob.received,
        toStayers: carol.reward
    });

    // Update balances
    alice.balance -= alice.received;
    bob.balance -= bob.received;

    // Reset for next epoch
    alice.withdraw = 0;
    alice.received = 0;
    bob.withdraw = 0;
    bob.received = 0;
    carol.reward = 0;
    carol.extraYield = 0;

    // Advance epoch
    epochState.currentEpoch++;

    // Generate new liquidity (randomized for simulation)
    epochState.liquidity = 200000 + Math.floor(Math.random() * 100000);

    // Update UI
    document.getElementById('currentEpoch').textContent = epochState.currentEpoch;
    document.getElementById('epochLiquidity').textContent = '$' + epochState.liquidity.toLocaleString();

    // Update epoch date
    const startDay = (epochState.currentEpoch - 1) * 30 + 1;
    const endDay = epochState.currentEpoch * 30;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const startMonth = months[Math.floor((startDay - 1) / 30) % 12];
    const endMonth = months[Math.floor((endDay - 1) / 30) % 12];
    document.getElementById('epochDate').textContent = `${startMonth} ${((startDay - 1) % 30) + 1} - ${endMonth} ${((endDay - 1) % 30) + 1}`;

    // Update balance displays
    document.querySelector('.depositor[data-id="1"] .dep-balance').textContent = 'Balance: $' + alice.balance.toLocaleString();
    document.querySelector('.depositor[data-id="2"] .dep-balance').textContent = 'Balance: $' + bob.balance.toLocaleString();

    // Reset withdraw inputs
    document.querySelectorAll('.withdraw-input').forEach(input => {
        input.value = 0;
    });

    // Update history
    updateEpochHistory();

    // Recalculate
    calculateEpochAllocations();
}

function updateEpochHistory() {
    const historyList = document.getElementById('epochHistory');

    // Keep header, add new entries
    const newEntry = document.createElement('div');
    newEntry.className = 'history-item';
    const lastRecord = epochState.history[epochState.history.length - 1];
    newEntry.innerHTML = `
        <span>Epoch ${lastRecord.epoch}</span>
        <span>$${Math.round(lastRecord.distributed).toLocaleString()}</span>
        <span>$${Math.round(lastRecord.toStayers).toLocaleString()}</span>
    `;
    historyList.appendChild(newEntry);
}

// ==================== CHAPTER 5: YIELD SIMULATION ====================

function initYieldSimulator() {
    // Range slider display updates
    document.getElementById('simDefaultRate').addEventListener('input', (e) => {
        document.getElementById('defaultRateDisplay').textContent = e.target.value + '%';
    });

    document.getElementById('simRecoveryRate').addEventListener('input', (e) => {
        document.getElementById('recoveryRateDisplay').textContent = e.target.value + '%';
    });

    // Run simulation button
    document.getElementById('runSimBtn').addEventListener('click', runYieldSimulation);

    // Run initial simulation
    runYieldSimulation();
}

function runYieldSimulation() {
    const deposit = parseFloat(document.getElementById('simDeposit').value) || 10000;
    const duration = parseInt(document.getElementById('simDuration').value) || 36;
    const defaultRate = parseFloat(document.getElementById('simDefaultRate').value) / 100;
    const recoveryRate = parseFloat(document.getElementById('simRecoveryRate').value) / 100;

    const grossApr = 0.125; // 12.5% base gross yield
    const years = duration / 12;

    // Calculate gross yield
    const grossYield = grossApr * years;

    // Calculate default losses
    const defaultLoss = defaultRate * (1 - recoveryRate) * years;

    // Net APY
    const netApy = (grossApr - (defaultRate * (1 - recoveryRate)));
    const totalReturn = deposit * Math.pow(1 + netApy, years);

    // Comparison values
    const bankFinal = deposit * Math.pow(1.005, years);
    const tbillFinal = deposit * Math.pow(1.05, years);

    // Update stats
    document.getElementById('grossYield').textContent = (grossApr * 100).toFixed(1) + '%';
    document.getElementById('defaultLosses').textContent = '-' + (defaultRate * (1 - recoveryRate) * 100).toFixed(1) + '%';
    document.getElementById('netApy').textContent = (netApy * 100).toFixed(1) + '%';
    document.getElementById('finalValue').textContent = '$' + Math.round(totalReturn).toLocaleString();

    // Update comparison table
    document.getElementById('compBank').textContent = '$' + Math.round(bankFinal).toLocaleString();
    document.getElementById('compTbill').textContent = '$' + Math.round(tbillFinal).toLocaleString();
    document.getElementById('compUsdaiApy').textContent = (netApy * 100).toFixed(1) + '%';
    document.getElementById('compUsdai').textContent = '$' + Math.round(totalReturn).toLocaleString();

    // Render chart
    renderYieldChart(deposit, duration, netApy, defaultRate, recoveryRate);
}

function renderYieldChart(deposit, months, netApy, defaultRate, recoveryRate) {
    const chart = document.getElementById('yieldChart');
    chart.innerHTML = '';

    const numBars = Math.min(months, 36); // Max 36 bars
    const barWidth = 100 / numBars;

    // Generate monthly values with occasional "default" events
    const values = [];
    let currentValue = deposit;

    for (let i = 0; i < numBars; i++) {
        const monthlyReturn = netApy / 12;
        const isDefault = Math.random() < (defaultRate / 12);

        if (isDefault) {
            currentValue *= (1 - (1 - recoveryRate) * 0.1); // Small default impact
            values.push({ value: currentValue, isDefault: true });
        } else {
            currentValue *= (1 + monthlyReturn);
            values.push({ value: currentValue, isDefault: false });
        }
    }

    // Normalize for display
    const maxValue = Math.max(...values.map(v => v.value));
    const minValue = deposit * 0.9;
    const range = maxValue - minValue;

    values.forEach((item, i) => {
        const bar = document.createElement('div');
        bar.className = 'chart-bar' + (item.isDefault ? ' default' : '');
        const height = ((item.value - minValue) / range) * 80 + 20; // Min 20% height
        bar.style.height = height + '%';
        chart.appendChild(bar);
    });
}

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', () => {
    initPoolBuilder();
    initExitSimulator();
    initYieldSimulator();
});

// ==================== TOUCH SUPPORT FOR MOBILE ====================

// Mobile tap support for story scenes
document.querySelectorAll('.continue-btn').forEach(btn => {
    btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        btn.click();
    });
});
