const COUNTER_DURATION = 1400;

function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

function animateCounter(el) {
    const target = parseInt(el.dataset.countTo, 10);
    const suffix = el.dataset.suffix || '';
    if (isNaN(target)) return;

    const startTime = performance.now();

    function tick(now) {
        const progress = Math.min((now - startTime) / COUNTER_DURATION, 1);
        const value = Math.round(easeOutCubic(progress) * target);
        el.textContent = value + suffix;

        if (progress < 1) {
            requestAnimationFrame(tick);
        } else {
            el.textContent = target + suffix;
            el.classList.add('counted');
        }
    }

    requestAnimationFrame(tick);
}

function animateStatic(el) {
    const finalSymbol = el.dataset.staticFinal || el.textContent.trim() || '∞';
    const symbols = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const startTime = performance.now();
    let lastUpdate = 0;
    let currentDelay = 45;

    function tick(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / COUNTER_DURATION, 1);

        if (elapsed - lastUpdate >= currentDelay) {
            lastUpdate = elapsed;
            el.textContent = symbols[Math.floor(Math.random() * symbols.length)];
            currentDelay = 45 + easeOutCubic(progress) * 260;
        }

        if (progress < 1) {
            requestAnimationFrame(tick);
        } else {
            el.textContent = finalSymbol;
            el.classList.add('counted');
        }
    }

    requestAnimationFrame(tick);
}

export function initCounters() {
    const grid = document.querySelector('.stats-grid');
    if (!grid) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const items = document.querySelectorAll('[data-count-to], [data-static]');

    if (prefersReducedMotion) {
        items.forEach(el => {
            if (el.hasAttribute('data-count-to')) {
                const target = parseInt(el.dataset.countTo, 10);
                const suffix = el.dataset.suffix || '';
                if (!isNaN(target)) el.textContent = target + suffix;
            }
            el.classList.add('counted');
        });
        return;
    }

    const animated = new WeakSet();

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el = entry.target;

            if (animated.has(el)) return;
            animated.add(el);

            if (el.hasAttribute('data-static')) {
                animateStatic(el);
            } else {
                animateCounter(el);
            }

            observer.unobserve(el);
        });
    }, {
        threshold: 0.4,
        rootMargin: '0px 0px -50px 0px'
    });

    items.forEach(el => observer.observe(el));
}