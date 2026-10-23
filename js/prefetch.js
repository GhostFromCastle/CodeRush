export function initPrefetch() {
    if (!('requestIdleCallback' in window)) return;

    const prefetched = new Set();

    document.addEventListener('mouseover', (e) => {
        const link = e.target.closest('a');
        if (!link) return;

        const href = link.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
        if (link.target === '_blank' || link.hasAttribute('download')) return;

        let url;
        try {
            url = new URL(link.href, window.location.href);
        } catch {
            return;
        }

        if (url.origin !== window.location.origin) return;
        if (url.pathname.endsWith('.json')) return;

        const key = url.href;
        if (prefetched.has(key)) return;
        prefetched.add(key);

        requestIdleCallback(() => {
            const prefetchLink = document.createElement('link');
            prefetchLink.rel = 'prefetch';
            prefetchLink.href = key;
            document.head.appendChild(prefetchLink);
        });
    }, { passive: true });
}