export function initFaq() {
    const items = document.querySelectorAll('.faq-item');
    if (!items.length) return;

    const DURATION = 380;
    const EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';

    items.forEach(item => {
        const summary = item.querySelector('summary');
        const answer = item.querySelector('.faq-answer');
        if (!summary || !answer) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'faq-answer-wrapper';
        answer.parentNode.insertBefore(wrapper, answer);
        wrapper.appendChild(answer);

        let animating = false;

        const openItem = () => {
            item.setAttribute('open', '');

            wrapper.style.transition = 'none';
            wrapper.style.height = '0px';
            wrapper.style.opacity = '0';

            requestAnimationFrame(() => {
                const target = wrapper.scrollHeight;

                wrapper.style.transition = `height ${DURATION}ms ${EASING}, opacity ${DURATION}ms ${EASING}`;
                wrapper.style.height = target + 'px';
                wrapper.style.opacity = '1';

                setTimeout(() => {
                    wrapper.style.height = '';
                    wrapper.style.opacity = '';
                    wrapper.style.transition = '';
                    animating = false;
                }, DURATION);
            });
        };

        const closeItem = () => {
            const from = wrapper.scrollHeight;

            wrapper.style.transition = 'none';
            wrapper.style.height = from + 'px';
            wrapper.style.opacity = '1';

            requestAnimationFrame(() => {
                wrapper.style.transition = `height ${DURATION}ms ${EASING}, opacity ${DURATION}ms ${EASING}`;
                wrapper.style.height = '0px';
                wrapper.style.opacity = '0';

                setTimeout(() => {
                    item.removeAttribute('open');
                    wrapper.style.height = '';
                    wrapper.style.opacity = '';
                    wrapper.style.transition = '';
                    animating = false;
                }, DURATION);
            });
        };

        summary.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (animating) return;
            animating = true;

            if (item.hasAttribute('open')) {
                closeItem();
            } else {
                openItem();
            }
        });
    });
}