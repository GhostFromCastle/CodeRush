import { escapeHtml } from './utils.js';

const TRAINERS_URL = 'data/trainers.json';

function renderTrainers(grid, trainers) {
    grid.innerHTML = trainers.map(trainer => {
        const tags = (trainer.tags || []).map(tag =>
            `<span class="tag">${escapeHtml(tag)}</span>`
        ).join('');

        return `
            <a href="${escapeHtml(trainer.href || `courses/simulators/${encodeURIComponent(trainer.id)}.html`)}" class="catalog-card">
                <div class="catalog-card-visual ${escapeHtml(trainer.gradient)}">
                    <i class="${escapeHtml(trainer.icon)}"></i>
                </div>
                <div class="catalog-card-body">
                    <div class="card-tags">${tags}</div>
                    <h3>${escapeHtml(trainer.title)}</h3>
                    <p>${escapeHtml(trainer.description)}</p>
                    <div class="card-footer">
                        <span>Открыть</span>
                        <i class="ph ph-arrow-right"></i>
                    </div>
                </div>
            </a>
        `;
    }).join('');

    grid.querySelectorAll('.catalog-card').forEach((card, index) => {
        card.style.animation = `cardEnter 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.05}s backwards`;
    });
}

export async function initTrainers() {
    const grid = document.querySelector('.tools-grid');
    if (!grid) return;

    const limitAttr = grid.dataset.limit;
    const limit = limitAttr ? parseInt(limitAttr, 10) : null;

    try {
        const response = await fetch(TRAINERS_URL, { cache: 'no-cache' });
        if (!response.ok) throw new Error('Failed to fetch trainers');
        const data = await response.json();
        if (!data || !Array.isArray(data.trainers)) throw new Error('Invalid shape');

        let visibleTrainers = data.trainers;
        if (limit && limit > 0) {
            visibleTrainers = data.trainers.slice(0, limit);
        }

        renderTrainers(grid, visibleTrainers);
    } catch (error) {
        console.warn('Не удалось загрузить trainers.json:', error);
    }
}