// USD.AI Sandbox - Interactive Learning

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

// ==================== POOL BUILDER ====================

const poolState = {
    loans: [],
    totalPrincipal: 0,
    totalGpus: 0,
    weightedApr: 0,
    avgTerm: 0
};

// Drag and Drop
function initDragDrop() {
    const loanCards = document.querySelectorAll('.loan-card');
    const dropzone = document.getElementById('poolDropzone');

    loanCards.forEach(card => {
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragend', handleDragEnd);
    });

    dropzone.addEventListener('dragover', handleDragOver);
    dropzone.addEventListener('dragleave', handleDragLeave);
    dropzone.addEventListener('drop', handleDrop);
}

function handleDragStart(e) {
    e.target.classList.add('dragging');
    e.dataTransfer.setData('text/plain', e.target.dataset.id);
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    document.getElementById('poolDropzone').classList.add('dragover');
}

function handleDragLeave(e) {
    document.getElementById('poolDropzone').classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    document.getElementById('poolDropzone').classList.remove('dragover');

    const loanId = e.dataTransfer.getData('text/plain');
    const loanCard = document.querySelector(`.loan-card[data-id="${loanId}"]`);

    if (loanCard && !poolState.loans.find(l => l.id === loanId)) {
        addLoanToPool(loanCard);
    }
}

function addLoanToPool(card) {
    const loan = {
        id: card.dataset.id,
        principal: parseInt(card.dataset.principal),
        apr: parseInt(card.dataset.apr),
        term: parseInt(card.dataset.term),
        gpus: parseInt(card.dataset.gpus)
    };

    poolState.loans.push(loan);

    // Hide from available list
    card.style.display = 'none';

    // Add chip to pool
    const chip = document.createElement('div');
    chip.className = 'pool-loan-chip';
    chip.textContent = `Loan #${loan.id} • $${(loan.principal / 1000).toFixed(0)}K • ${loan.apr}%`;
    document.getElementById('poolLoans').appendChild(chip);

    // Hide empty state
    document.getElementById('dropzoneEmpty').style.display = 'none';

    // Update stats
    updatePoolStats();

    // Update explanation
    updateExplanation();
}

function updatePoolStats() {
    if (poolState.loans.length === 0) {
        document.getElementById('poolApy').textContent = '0%';
        document.getElementById('poolPrincipal').textContent = '$0';
        document.getElementById('poolGpus').textContent = '0';
        document.getElementById('poolTerm').textContent = '0 mo';
        return;
    }

    // Calculate totals
    poolState.totalPrincipal = poolState.loans.reduce((sum, l) => sum + l.principal, 0);
    poolState.totalGpus = poolState.loans.reduce((sum, l) => sum + l.gpus, 0);

    // Weighted average APR
    const weightedSum = poolState.loans.reduce((sum, l) => sum + (l.apr * l.principal), 0);
    poolState.weightedApr = weightedSum / poolState.totalPrincipal;

    // Average term
    poolState.avgTerm = poolState.loans.reduce((sum, l) => sum + l.term, 0) / poolState.loans.length;

    // Update UI with animation
    animateValue('poolApy', poolState.weightedApr.toFixed(1) + '%');
    document.getElementById('poolPrincipal').textContent = '$' + (poolState.totalPrincipal / 1000000).toFixed(1) + 'M';
    document.getElementById('poolGpus').textContent = poolState.totalGpus.toLocaleString();
    document.getElementById('poolTerm').textContent = Math.round(poolState.avgTerm) + ' mo';
}

function animateValue(elementId, newValue) {
    const el = document.getElementById(elementId);
    el.style.transform = 'scale(1.2)';
    el.style.color = '#22c55e';
    el.textContent = newValue;

    setTimeout(() => {
        el.style.transform = 'scale(1)';
    }, 200);

    setTimeout(() => {
        el.style.color = '';
    }, 500);
}

function updateExplanation() {
    const steps = document.querySelectorAll('.explain-step');
    steps.forEach(step => step.classList.remove('active'));

    let stepToShow = 'empty';
    if (poolState.loans.length === 1) {
        stepToShow = 'first';
    } else if (poolState.loans.length >= 2 && poolState.loans.length < 6) {
        stepToShow = 'multiple';
    } else if (poolState.loans.length >= 6) {
        stepToShow = 'full';
    }

    document.querySelector(`.explain-step[data-step="${stepToShow}"]`).classList.add('active');
}

// ==================== QEV EXIT SIMULATOR ====================

const qevState = {
    availableLiquidity: 250000,
    bidders: {
        A: { wants: 100000, bid: 50 },
        B: { wants: 150000, bid: 25 },
        C: { wants: 200000, bid: 10 }
    }
};

function initQevSimulator() {
    const sliders = document.querySelectorAll('.bid-slider');
    sliders.forEach(slider => {
        slider.addEventListener('input', (e) => {
            const bidder = e.target.dataset.bidder;
            const value = parseInt(e.target.value);
            qevState.bidders[bidder].bid = value;
            document.getElementById(`bid${bidder}`).textContent = value + ' bps';
            calculateQevAllocations();
        });
    });

    // Initial calculation
    calculateQevAllocations();
}

function calculateQevAllocations() {
    const { A, B, C } = qevState.bidders;

    // Total bids
    const totalBids = A.bid + B.bid + C.bid;

    if (totalBids === 0) {
        // No bids, no allocation
        updateQevUI(0, 0, 0, 0);
        return;
    }

    // Calculate proportional allocations
    const allocA = (A.bid / totalBids) * qevState.availableLiquidity;
    const allocB = (B.bid / totalBids) * qevState.availableLiquidity;
    const allocC = (C.bid / totalBids) * qevState.availableLiquidity;

    // Cap at what they want
    const finalA = Math.min(allocA, A.wants);
    const finalB = Math.min(allocB, B.wants);
    const finalC = Math.min(allocC, C.wants);

    // Calculate passive reward (simplified: 10% of total bids go to passive holders)
    const totalBidValue = (A.bid * finalA / 10000) + (B.bid * finalB / 10000) + (C.bid * finalC / 10000);
    const passiveReward = totalBidValue * 0.1;

    updateQevUI(finalA, finalB, finalC, passiveReward);
}

function updateQevUI(allocA, allocB, allocC, passiveReward) {
    // Update result values
    document.getElementById('resultA').textContent = '$' + Math.round(allocA).toLocaleString();
    document.getElementById('resultB').textContent = '$' + Math.round(allocB).toLocaleString();
    document.getElementById('resultC').textContent = '$' + Math.round(allocC).toLocaleString();
    document.getElementById('passiveReward').textContent = '$' + Math.round(passiveReward).toLocaleString();

    // Update bar segments
    const total = qevState.availableLiquidity;
    const pctA = (allocA / total) * 100;
    const pctB = (allocB / total) * 100;
    const pctC = (allocC / total) * 100;

    document.getElementById('segmentA').style.width = pctA + '%';
    document.getElementById('segmentB').style.width = pctB + '%';
    document.getElementById('segmentC').style.width = pctC + '%';

    // Show/hide labels based on width
    document.querySelector('#segmentA .segment-label').style.opacity = pctA > 10 ? 1 : 0;
    document.querySelector('#segmentB .segment-label').style.opacity = pctB > 10 ? 1 : 0;
    document.querySelector('#segmentC .segment-label').style.opacity = pctC > 10 ? 1 : 0;
}

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', () => {
    initDragDrop();
    initQevSimulator();
});

// ==================== TOUCH SUPPORT FOR MOBILE ====================

// For mobile, we'll add click-to-add functionality
document.querySelectorAll('.loan-card').forEach(card => {
    card.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            if (!poolState.loans.find(l => l.id === card.dataset.id)) {
                addLoanToPool(card);
            }
        }
    });
});
