// USD.AI Learn - Interactive JavaScript
// ========================================

// ==================== STATE ====================

const state = {
    // Story
    currentScene: 1,

    // Infrastructure Panels
    currentPanel: 1,

    // Pool Builder
    poolSize: 10000000, // $10M base pool
    tbillRate: 0.05, // 5% T-bill rate
    addedLoans: [],

    // Exit Queue
    epoch: 1,
    epochLiquidity: 250000,
    depositors: {
        alice: { balance: 500000, withdraw: 0, bid: 30 },
        bob: { balance: 300000, withdraw: 0, bid: 50 }
    },
    epochHistory: [],

    // Simulation
    deposit: 10000,
    duration: 36, // months
    scenario: 'normal'
};

// ==================== NAVIGATION ====================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize navigation
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const section = tab.dataset.section;
            goToSection(section);
        });
    });

    // Initialize pool builder
    initPoolBuilder();

    // Initialize GPU scale visualization
    initGpuDragDrop();

    // Initialize simulation
    updateSimulation();

    // Initialize exit queue display
    updateQueueDisplay();
});

function goToSection(sectionId) {
    // Update sections
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');

    // Update nav tabs
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    const activeTab = document.querySelector(`.nav-tab[data-section="${sectionId}"]`);
    if (activeTab) activeTab.classList.add('active');

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==================== CHAPTER 1: STORY ====================

function nextScene(n) {
    // Hide current scene
    const currentEl = document.getElementById(`scene${state.currentScene}`);
    if (currentEl) currentEl.classList.add('hidden');

    // Show new scene
    state.currentScene = n;
    const newEl = document.getElementById(`scene${n}`);
    if (newEl) newEl.classList.remove('hidden');
}

// ==================== CHAPTER 2: INFRASTRUCTURE PANELS ====================

function initGpuDragDrop() {
    // Panel navigation dots
    document.querySelectorAll('.panel-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            const panelNum = parseInt(dot.dataset.panel);
            goToPanel(panelNum);
        });
    });

    // Datacenter markers - click to go to panel 2
    document.querySelectorAll('.dc-marker').forEach(marker => {
        marker.addEventListener('click', () => {
            goToPanel(2);
        });
    });
}

function goToPanel(panelNum) {
    state.currentPanel = panelNum;

    // Update panels
    document.querySelectorAll('.infra-panel').forEach(p => p.classList.remove('active'));
    const targetPanel = document.getElementById(`panel${panelNum}`);
    if (targetPanel) targetPanel.classList.add('active');

    // Update panel dots
    document.querySelectorAll('.panel-dot').forEach((dot, i) => {
        const dotPanel = i + 1;
        dot.classList.remove('active', 'completed');
        if (dotPanel < panelNum) {
            dot.classList.add('completed');
        } else if (dotPanel === panelNum) {
            dot.classList.add('active');
        }
    });

    // Show/hide back button
    const backBtn = document.getElementById('panelBack');
    if (backBtn) backBtn.classList.toggle('visible', panelNum > 1);

    // Scroll to top of section
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goToPrevPanel() {
    if (state.currentPanel > 1) {
        goToPanel(state.currentPanel - 1);
    }
}

// ==================== CHAPTER 3: POOL BUILDER ====================

function initPoolBuilder() {
    const loanCards = document.querySelectorAll('.loan-card');
    loanCards.forEach(card => {
        card.addEventListener('click', () => toggleLoan(card));
    });
}

function toggleLoan(card) {
    const id = card.dataset.id;
    const amount = parseFloat(card.dataset.amount);
    const apr = parseFloat(card.dataset.apr);

    if (card.classList.contains('added')) {
        // Remove loan
        card.classList.remove('added');
        state.addedLoans = state.addedLoans.filter(l => l.id !== id);
    } else {
        // Add loan
        card.classList.add('added');
        state.addedLoans.push({ id, amount, apr });
    }

    updatePoolDisplay();
}

function updatePoolDisplay() {
    // Calculate totals
    const gpuTotal = state.addedLoans.reduce((sum, l) => sum + l.amount, 0);
    const tbillTotal = state.poolSize - gpuTotal;

    const gpuPercent = (gpuTotal / state.poolSize) * 100;
    const tbillPercent = 100 - gpuPercent;

    // Calculate blended APY
    // T-bill portion earns 5%, GPU loans earn their APRs (minus protocol fee)
    const tbillYield = tbillTotal * state.tbillRate;
    const gpuYield = state.addedLoans.reduce((sum, l) => {
        // After 10% NIM, ~90% goes to pool (simplified: ~13% net for sUSDai from 15% gross)
        const netRate = (l.apr / 100) * 0.87; // 13% NIM to protocol
        return sum + (l.amount * netRate);
    }, 0);

    const totalYield = tbillYield + gpuYield;
    const blendedApy = (totalYield / state.poolSize) * 100;

    // Update UI
    const meterTbill = document.getElementById('meterTbill');
    const meterGpu = document.getElementById('meterGpu');

    if (meterTbill) {
        meterTbill.style.width = `${tbillPercent}%`;
        const tbillSpan = meterTbill.querySelector('span');
        if (tbillSpan) tbillSpan.textContent = gpuPercent > 50 ? '' : `T-Bills ${state.tbillRate * 100}%`;
    }

    if (meterGpu) {
        meterGpu.style.width = `${gpuPercent}%`;
        const gpuSpan = meterGpu.querySelector('span');
        if (gpuSpan) gpuSpan.textContent = gpuPercent < 20 ? '' : 'GPU Loans';
    }

    const blendedApyEl = document.getElementById('blendedApy');
    if (blendedApyEl) blendedApyEl.textContent = `${blendedApy.toFixed(1)}%`;

    const tbillPortionEl = document.getElementById('tbillPortion');
    if (tbillPortionEl) tbillPortionEl.textContent = `$${formatNumber(tbillTotal)} (${tbillPercent.toFixed(0)}%)`;

    const gpuPortionEl = document.getElementById('gpuPortion');
    if (gpuPortionEl) gpuPortionEl.textContent = `$${formatNumber(gpuTotal)} (${gpuPercent.toFixed(0)}%)`;

    const totalPoolEl = document.getElementById('totalPool');
    if (totalPoolEl) totalPoolEl.textContent = `$${formatNumber(state.poolSize)}`;

    // Update explanation based on composition
    const explainEl = document.getElementById('poolExplain');
    if (explainEl) {
        if (gpuPercent === 0) {
            explainEl.innerHTML = `<p>Your pool starts 100% in T-bills earning ~5% APY. Click GPU loans above to add them to the pool.</p>`;
        } else if (gpuPercent < 30) {
            explainEl.innerHTML = `<p>You've added ${state.addedLoans.length} GPU loan(s). The blended APY is now <strong>${blendedApy.toFixed(1)}%</strong>. Add more loans to increase yield.</p>`;
        } else if (gpuPercent < 70) {
            explainEl.innerHTML = `<p>Nice balance! With ${gpuPercent.toFixed(0)}% in GPU loans, you're earning <strong>${blendedApy.toFixed(1)}%</strong> blended APY while maintaining T-bill liquidity.</p>`;
        } else {
            explainEl.innerHTML = `<p>Aggressive allocation! <strong>${blendedApy.toFixed(1)}%</strong> APY is strong, but less T-bill buffer means less instant liquidity.</p>`;
        }
    }
}

// ==================== CHAPTER 4: EXIT QUEUE (QEV) ====================

function requestWithdraw(depositor, amount) {
    const dep = state.depositors[depositor];
    const newAmount = Math.min(dep.withdraw + amount, dep.balance);
    dep.withdraw = newAmount;
    updateQueueDisplay();
}

function clearWithdraw(depositor) {
    state.depositors[depositor].withdraw = 0;
    updateQueueDisplay();
}

function setBid(depositor, bps) {
    state.depositors[depositor].bid = bps;

    // Update button states
    const card = document.getElementById(depositor);
    if (card) {
        card.querySelectorAll('.bid-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.textContent) === bps);
        });
    }

    updateQueueDisplay();
}

function updateQueueDisplay() {
    const alice = state.depositors.alice;
    const bob = state.depositors.bob;
    const liquidity = state.epochLiquidity;

    // Update withdraw displays
    const aliceWithdrawEl = document.getElementById('aliceWithdraw');
    const bobWithdrawEl = document.getElementById('bobWithdraw');
    if (aliceWithdrawEl) aliceWithdrawEl.innerHTML = `<span>Requesting: $${formatNumber(alice.withdraw)}</span>`;
    if (bobWithdrawEl) bobWithdrawEl.innerHTML = `<span>Requesting: $${formatNumber(bob.withdraw)}</span>`;

    // Update status
    const aliceStatusEl = document.getElementById('aliceStatus');
    const bobStatusEl = document.getElementById('bobStatus');
    if (aliceStatusEl) aliceStatusEl.textContent = alice.withdraw > 0 ? 'Requesting' : 'Holding';
    if (bobStatusEl) bobStatusEl.textContent = bob.withdraw > 0 ? 'Requesting' : 'Holding';

    // SMOOTHENED QEV: Pro-rata distribution - everyone gets proportional share
    // Bids act as exit fees paid to stayers, NOT priority
    const totalRequested = alice.withdraw + bob.withdraw;

    let aliceGets = 0;
    let bobGets = 0;

    if (totalRequested > 0) {
        if (totalRequested <= liquidity) {
            // Full liquidity available - everyone gets what they want
            aliceGets = alice.withdraw;
            bobGets = bob.withdraw;
        } else {
            // Pro-rata distribution: everyone gets same % of their request
            const fillRatio = liquidity / totalRequested;
            aliceGets = Math.floor(alice.withdraw * fillRatio);
            bobGets = Math.floor(bob.withdraw * fillRatio);
        }
    }

    // Update gets display
    const aliceGetsEl = document.getElementById('aliceGets');
    const bobGetsEl = document.getElementById('bobGets');
    if (aliceGetsEl) aliceGetsEl.textContent = `$${formatNumber(aliceGets)}`;
    if (bobGetsEl) bobGetsEl.textContent = `$${formatNumber(bobGets)}`;

    // Update queue bar
    const alicePercent = liquidity > 0 ? (aliceGets / liquidity) * 100 : 0;
    const bobPercent = liquidity > 0 ? (bobGets / liquidity) * 100 : 0;
    const unusedPercent = 100 - alicePercent - bobPercent;

    const aliceSegEl = document.getElementById('aliceSeg');
    const bobSegEl = document.getElementById('bobSeg');
    const unusedSegEl = document.getElementById('unusedSeg');

    if (aliceSegEl) aliceSegEl.style.width = `${alicePercent}%`;
    if (bobSegEl) bobSegEl.style.width = `${bobPercent}%`;
    if (unusedSegEl) unusedSegEl.style.width = `${unusedPercent}%`;

    // Update Carol's rewards (stayer benefits)
    const totalBidsPaid = (aliceGets * alice.bid / 10000) + (bobGets * bob.bid / 10000);
    const carolShare = totalBidsPaid; // Carol gets bid redistribution

    const carolBidRewardEl = document.getElementById('carolBidReward');
    if (carolBidRewardEl) carolBidRewardEl.textContent = `$${formatNumber(carolShare)}`;

    // Extra yield share from reduced pool
    const poolReduction = (aliceGets + bobGets) / (alice.balance + bob.balance + 1000000);
    const extraYield = poolReduction * 0.5; // Simplified extra yield calc
    const carolExtraYieldEl = document.getElementById('carolExtraYield');
    if (carolExtraYieldEl) carolExtraYieldEl.textContent = `+${(extraYield * 100).toFixed(2)}%`;
}

function advanceEpoch() {
    const alice = state.depositors.alice;
    const bob = state.depositors.bob;
    const liquidity = state.epochLiquidity;

    // Calculate what was distributed
    const totalRequested = alice.withdraw + bob.withdraw;
    let distributed = Math.min(totalRequested, liquidity);
    let toStayers = liquidity - distributed;

    // Process withdrawals - pro-rata distribution
    if (totalRequested > 0) {
        let aliceGets = 0;
        let bobGets = 0;

        if (totalRequested <= liquidity) {
            // Everyone gets what they want
            aliceGets = alice.withdraw;
            bobGets = bob.withdraw;
        } else {
            // Pro-rata: everyone gets same % of their request
            const fillRatio = liquidity / totalRequested;
            aliceGets = Math.floor(alice.withdraw * fillRatio);
            bobGets = Math.floor(bob.withdraw * fillRatio);
        }

        alice.balance -= aliceGets;
        bob.balance -= bobGets;
        alice.withdraw = Math.max(0, alice.withdraw - aliceGets);
        bob.withdraw = Math.max(0, bob.withdraw - bobGets);
    }

    // Add to history
    state.epochHistory.push({
        epoch: state.epoch,
        distributed: distributed,
        toStayers: toStayers
    });

    // Update epoch
    state.epoch++;
    state.epochLiquidity = 200000 + Math.floor(Math.random() * 100000); // Vary liquidity

    // Update UI
    const epochNumEl = document.getElementById('epochNum');
    const epochLiquidityEl = document.getElementById('epochLiquidity');
    if (epochNumEl) epochNumEl.textContent = state.epoch;
    if (epochLiquidityEl) epochLiquidityEl.textContent = `$${formatNumber(state.epochLiquidity)}`;

    // Update epoch dates (30 day epochs)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const startMonth = (state.epoch - 1) % 12;
    const endDay = (state.epoch * 30) % 28 + 1;
    const epochDateEl = document.getElementById('epochDate');
    if (epochDateEl) epochDateEl.textContent = `${months[startMonth]} ${(state.epoch - 1) * 30 % 28 + 1} - ${months[startMonth]} ${endDay}`;

    // Update balance displays
    const aliceBalanceEl = document.querySelector('#alice .dep-balance');
    const bobBalanceEl = document.querySelector('#bob .dep-balance');
    if (aliceBalanceEl) aliceBalanceEl.textContent = `$${formatNumber(alice.balance)}`;
    if (bobBalanceEl) bobBalanceEl.textContent = `$${formatNumber(bob.balance)}`;

    // Render history
    renderEpochHistory();

    // Refresh queue display
    updateQueueDisplay();
}

function renderEpochHistory() {
    const container = document.getElementById('epochHistory');
    if (!container) return;

    // Clear old rows (keep header)
    container.querySelectorAll('.history-row').forEach(r => r.remove());

    // Add rows for recent epochs
    state.epochHistory.slice(-5).forEach(e => {
        const row = document.createElement('div');
        row.className = 'history-row';
        row.innerHTML = `
            <span>Epoch ${e.epoch}</span>
            <span>$${formatNumber(e.distributed)}</span>
            <span>$${formatNumber(e.toStayers)}</span>
        `;
        container.appendChild(row);
    });
}

// ==================== CHAPTER 5: YIELD SIMULATION ====================

function setDeposit(amount) {
    state.deposit = amount;

    // Update button states
    document.querySelectorAll('.amt-btn').forEach(btn => {
        const btnText = btn.textContent;
        let btnAmount = parseInt(btnText.replace(/\D/g, ''));
        if (btnText.includes('K')) btnAmount *= 1000;
        btn.classList.toggle('active', btnAmount === amount);
    });

    const depositDisplayEl = document.getElementById('depositDisplay');
    if (depositDisplayEl) depositDisplayEl.textContent = `$${formatNumber(amount)}`;
    updateSimulation();
}

function setDuration(months) {
    state.duration = months;

    // Update button states
    document.querySelectorAll('.time-btn').forEach(btn => {
        const years = parseInt(btn.textContent);
        btn.classList.toggle('active', years * 12 === months);
    });

    updateSimulation();
}

function setScenario(scenario) {
    state.scenario = scenario;

    // Update button states
    document.querySelectorAll('.scenario-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.toLowerCase() === scenario);
    });

    updateSimulation();
}

function updateSimulation() {
    const principal = state.deposit;
    const months = state.duration;
    const years = months / 12;

    // APR based on scenario
    const rates = {
        normal: { gross: 0.15, susdai: 0.13, filo: 0.005, protocol: 0.015 },
        conservative: { gross: 0.12, susdai: 0.10, filo: 0.005, protocol: 0.015 },
        stress: { gross: 0.10, susdai: 0.08, filo: 0.01, protocol: 0.01 }
    };

    const rate = rates[state.scenario];

    // Calculate compound growth
    const bankRate = 0.005;
    const tbillRate = 0.05;

    const bankFinal = principal * Math.pow(1 + bankRate, years);
    const tbillFinal = principal * Math.pow(1 + tbillRate, years);
    const usdaiFinal = principal * Math.pow(1 + rate.susdai, years);

    const gain = usdaiFinal - principal;
    const gainPercent = ((usdaiFinal / principal) - 1) * 100;

    // Update display
    const finalValueEl = document.getElementById('finalValue');
    const totalGainEl = document.getElementById('totalGain');
    if (finalValueEl) finalValueEl.textContent = `$${formatNumber(Math.round(usdaiFinal))}`;
    if (totalGainEl) totalGainEl.textContent = `+$${formatNumber(Math.round(gain))} (+${gainPercent.toFixed(1)}%)`;

    const bankFinalEl = document.getElementById('bankFinal');
    const tbillFinalEl = document.getElementById('tbillFinal');
    const usdaiFinalEl = document.getElementById('usdaiFinal');
    if (bankFinalEl) bankFinalEl.textContent = `$${formatNumber(Math.round(bankFinal))}`;
    if (tbillFinalEl) tbillFinalEl.textContent = `$${formatNumber(Math.round(tbillFinal))}`;
    if (usdaiFinalEl) usdaiFinalEl.textContent = `$${formatNumber(Math.round(usdaiFinal))}`;

    // Update breakdown
    const grossYieldEl = document.getElementById('grossYield');
    const protocolFeeEl = document.getElementById('protocolFee');
    const filoReserveEl = document.getElementById('filoReserve');
    const netApyEl = document.getElementById('netApy');
    if (grossYieldEl) grossYieldEl.textContent = `${(rate.gross * 100).toFixed(0)}% APR`;
    if (protocolFeeEl) protocolFeeEl.textContent = `-${(rate.protocol * 100).toFixed(1)}%`;
    if (filoReserveEl) filoReserveEl.textContent = `-${(rate.filo * 100).toFixed(1)}%`;
    if (netApyEl) netApyEl.textContent = `~${(rate.susdai * 100).toFixed(0)}%`;

    // Render chart
    renderGrowthChart();
}

function renderGrowthChart() {
    const container = document.getElementById('growthChart');
    if (!container) return;
    container.innerHTML = '';

    const principal = state.deposit;
    const months = state.duration;

    const rates = {
        normal: 0.13,
        conservative: 0.10,
        stress: 0.08
    };

    const monthlyRate = Math.pow(1 + rates[state.scenario], 1/12) - 1;

    // Generate monthly values
    const values = [];
    let current = principal;
    const step = Math.max(1, Math.floor(months / 24));

    for (let i = 0; i <= months; i += step) {
        values.push(current);
        for (let j = 0; j < step; j++) {
            current *= (1 + monthlyRate);
        }
    }

    const maxValue = Math.max(...values);
    const minValue = principal * 0.95;
    const range = maxValue - minValue;

    // Create bars
    values.forEach((val, i) => {
        const bar = document.createElement('div');
        bar.className = 'chart-bar';
        const height = ((val - minValue) / range) * 100;
        bar.style.height = `${Math.max(10, height)}%`;

        // Color gradient based on position
        const greenIntensity = Math.floor(50 + (i / values.length) * 150);
        bar.style.background = `rgb(0, ${greenIntensity}, 80)`;

        container.appendChild(bar);
    });
}

// ==================== UTILITIES ====================

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(0) + 'K';
    }
    return num.toLocaleString();
}
