import { escapeHtml } from './utils.js';

const DICT_URL = '../../../data/dictionary.json';

const state = {
    terms: [],
    activeTag: 'all',
    searchQuery: ''
};

function renderSkeletons(grid, count) {
    grid.innerHTML = Array(count).fill(`
        <div class="dict-card dict-skeleton">
            <div class="skeleton-line short"></div>
            <div class="skeleton-line" style="height: 24px; margin-bottom: 12px;"></div>
            <div class="skeleton-line"></div>
            <div class="skeleton-line medium"></div>
        </div>
    `).join('');
}

function renderFilters(tags) {
    const container = document.getElementById('dictFilters');
    if (!container) return;

    const allChip = `<button type="button" class="dict-chip ${state.activeTag === 'all' ? 'active' : ''}" data-tag="all">Все</button>`;
    const tagChips = tags.map(tag =>
        `<button type="button" class="dict-chip ${state.activeTag === tag ? 'active' : ''}" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`
    ).join('');

    container.innerHTML = allChip + tagChips;

    container.querySelectorAll('.dict-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            state.activeTag = chip.dataset.tag;
            renderFilters(tags);
            renderCards();
        });
    });
}

function renderCards() {
    const grid = document.querySelector('.dict-grid');
    if (!grid) return;

    let filtered = state.terms;

    if (state.activeTag !== 'all') {
        filtered = filtered.filter(item => item.tags && item.tags.includes(state.activeTag));
    }

    if (state.searchQuery) {
        const q = state.searchQuery.toLowerCase();
        filtered = filtered.filter(item =>
            item.term.toLowerCase().includes(q) ||
            item.definition.toLowerCase().includes(q)
        );
    }

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="dict-empty">
                <i class="ph ph-magnifying-glass"></i>
                <p>По вашему запросу ничего не найдено</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = filtered.map((item, index) => {
        const tagsHtml = (item.tags || []).map(t =>
            `<span class="dict-card-tag">${escapeHtml(t)}</span>`
        ).join('');

        const codeHtml = item.code ? `
            <div class="dict-card-code-wrapper">
                <button type="button" class="dict-code-btn" data-code-toggle>
                    <i class="ph ph-code"></i> Показать код
                </button>
                <div class="dict-code-collapse">
                    <pre class="dict-code-block"><code>${escapeHtml(item.code)}</code></pre>
                </div>
            </div>
        ` : '';

        return `
            <div class="dict-card" style="animation-delay: ${index * 0.03}s">
                <div class="dict-card-header">
                    <span class="dict-category">${escapeHtml(item.category)}</span>
                    <div class="dict-card-tags">${tagsHtml}</div>
                </div>
                <div class="dict-term">${escapeHtml(item.term)}</div>
                <div class="dict-def">${escapeHtml(item.definition)}</div>
                ${codeHtml}
            </div>
        `;
    }).join('');

    grid.querySelectorAll('[data-code-toggle]').forEach(btn => {
        btn.addEventListener('click', () => {
            const collapse = btn.nextElementSibling;
            const isOpen = collapse.classList.contains('open');

            if (isOpen) {
                collapse.style.height = collapse.scrollHeight + 'px';
                void collapse.offsetHeight;
                collapse.style.height = '0px';
                collapse.classList.remove('open');
                btn.innerHTML = '<i class="ph ph-code"></i> Показать код';
                btn.classList.remove('active');
            } else {
                collapse.classList.add('open');
                collapse.style.height = collapse.scrollHeight + 'px';
                btn.innerHTML = '<i class="ph ph-eye-slash"></i> Скрыть код';
                btn.classList.add('active');

                setTimeout(() => {
                    if (collapse.classList.contains('open')) {
                        collapse.style.height = 'auto';
                    }
                }, 350);
            }
        });
    });
}

export async function initDictionary() {
    const grid = document.querySelector('.dict-grid');
    if (!grid) return;

    renderSkeletons(grid, 6);

    try {
        const response = await fetch(DICT_URL, { cache: 'no-cache' });
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();

        if (data && Array.isArray(data.terms)) {
            state.terms = data.terms;

            const allTags = new Set();
            data.terms.forEach(item => {
                if (item.tags) {
                    item.tags.forEach(t => allTags.add(t));
                }
            });

            const sortedTags = Array.from(allTags).sort();

            renderFilters(sortedTags);
            renderCards();
        }
    } catch (error) {
        console.warn('Не удалось загрузить dictionary.json:', error);
        grid.innerHTML = '<p style="color: #666;">Не удалось загрузить словарь.</p>';
        return;
    }

    const searchInput = document.querySelector('[data-dict-search]');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            state.searchQuery = e.target.value.trim();
            renderCards();
        });
    }
}