export function initBurgerMenu() {
    const burger = document.querySelector('.burger-menu');
    const nav = document.querySelector('.top-nav');
    if (!burger || !nav) return;

    const icon = burger.querySelector('i');

    function open() {
        nav.classList.add('nav-open');
        document.body.style.overflow = 'hidden';
        if (icon) {
            icon.classList.remove('ph-list');
            icon.classList.add('ph-x');
        }
    }

    function close() {
        nav.classList.remove('nav-open');
        document.body.style.overflow = '';
        if (icon) {
            icon.classList.remove('ph-x');
            icon.classList.add('ph-list');
        }
    }

    function toggle() {
        if (nav.classList.contains('nav-open')) {
            close();
        } else {
            open();
        }
    }

    burger.addEventListener('click', (e) => {
        e.stopPropagation();
        toggle();
    });

    nav.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', close);
    });

    document.addEventListener('click', (e) => {
        if (!nav.classList.contains('nav-open')) return;
        if (!nav.contains(e.target)) {
            close();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && nav.classList.contains('nav-open')) {
            close();
        }
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && nav.classList.contains('nav-open')) {
            close();
        }
    });
}