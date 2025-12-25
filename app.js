// USD.AI Explainer - Simple Interactive JS

// Scroll Progress
function updateScrollProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = (scrollTop / docHeight) * 100;
    document.getElementById('scrollProgress').style.width = progress + '%';
}

window.addEventListener('scroll', updateScrollProgress);

// Calculator Widget
function toggleCalc() {
    const panel = document.getElementById('calcPanel');
    panel.classList.toggle('open');
}

function initCalculator() {
    const amountInput = document.getElementById('depositAmount');
    const aprSlider = document.getElementById('aprSlider');

    if (amountInput && aprSlider) {
        amountInput.addEventListener('input', calculateYield);
        aprSlider.addEventListener('input', () => {
            document.getElementById('aprDisplay').textContent = aprSlider.value + '%';
            calculateYield();
        });
        calculateYield();
    }
}

function calculateYield() {
    const amount = parseFloat(document.getElementById('depositAmount').value) || 0;
    const apr = parseFloat(document.getElementById('aprSlider').value) / 100;

    const monthlyYield = amount * (apr / 12);
    const yearlyYield = amount * apr;
    const total = amount + yearlyYield;

    document.getElementById('monthlyYield').textContent = '+$' + monthlyYield.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });

    document.getElementById('yearlyYield').textContent = '+$' + yearlyYield.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });

    document.getElementById('totalValue').textContent = '$' + total.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

// Close calculator when clicking outside
document.addEventListener('click', (e) => {
    const widget = document.getElementById('calcWidget');
    if (widget && !widget.contains(e.target)) {
        document.getElementById('calcPanel').classList.remove('open');
    }
});

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    initCalculator();
    updateScrollProgress();
});

// Intersection Observer for slide animations
const observerOptions = {
    threshold: 0.3
};

const slideObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

document.querySelectorAll('.slide').forEach(slide => {
    slideObserver.observe(slide);
});
