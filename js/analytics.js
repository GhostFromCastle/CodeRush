export function initAnalytics() {
    const hostname = window.location.hostname;
    
    if (!localStorage.getItem('cr_cookie_accepted')) {
        showCookieBanner();
    }

    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '') {
        return;
    }

    const measurementId = 'G-Z8N4K0GRBW';

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', measurementId);
}

function showCookieBanner() {
    if (document.querySelector('.cookie-banner')) return;

    const banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.innerHTML = `
        <div class="cookie-banner-content">
            <div class="cookie-banner-icon">
                <i class="ph-fill ph-shield-check"></i>
            </div>
            <div class="cookie-banner-text">
                Мы используем файлы cookie и сервис Google Analytics для анализа трафика и улучшения работы сайта. Продолжая использовать сайт, вы соглашаетесь с этим.
            </div>
        </div>
        <button class="btn-primary cookie-banner-btn" type="button">Принять</button>
    `;
    
    document.body.appendChild(banner);

    const btn = banner.querySelector('.cookie-banner-btn');
    btn.addEventListener('click', () => {
        localStorage.setItem('cr_cookie_accepted', 'true');
        banner.remove();
    });
}