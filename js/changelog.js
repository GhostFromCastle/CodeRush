import { escapeHtml, debounce } from './utils.js';

const CHANGELOG_URL = 'data/changelog.json';

const TYPE_LABELS = {
    added: 'Добавлено',
    fixed: 'Исправлено',
    improved: 'Улучшено',
    removed: 'Удалено'
};

const TYPE_ICONS = {
    added: 'ph-plus-circle',
    fixed: 'ph-wrench',
    improved: 'ph-arrow-up',
    removed: 'ph-minus-circle'
};

const state = {
    entries: [],
    activeType: 'all',
    search: ''
};

function pluralize(n, forms) {
    const abs = Math.abs(n) % 100;
    const last = abs % 10;
    if (abs > 10 && abs < 20) return forms[2];
    if (last > 1 && last < 5) return forms[1];
    if (last === 1) return forms[0];
    return forms[2];
}

function formatDate(iso) {
    const date = new Date(iso + 'T00:00:00');
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function renderEntry(entry) {
    const type = entry.type || 'added';
    const label = TYPE_LABELS[type] || type;
    const icon = TYPE_ICONS[type] || 'ph-info';
    const tags = (entry.tags || []).map(tag =>
        `<span class="tag">${escapeHtml(tag)}</span>`
    ).join('');

    return `
        <article class="changelog-entry changelog-entry-${type}">
            <div class="changelog-entry-header">
                <span class="changelog-badge changelog-badge-${type}">
                    <i class="ph ${icon}"></i>
                    ${escapeHtml(label)}
                </span>
                ${tags ? `<div class="changelog-tags">${tags}</div>` : ''}
            </div>
            <h3 class="changelog-title">${escapeHtml(entry.title)}</h3>
            ${entry.description ? `<p class="changelog-desc">${escapeHtml(entry.description)}</p>` : ''}
        </article>
    `;
}

function applyFilters(entries) {
    let filtered = entries;

    if (state.activeType !== 'all') {
        filtered = filtered.filter(entry => entry.type === state.activeType);
    }

    const search = state.search.trim().toLowerCase();
    if (search) {
        filtered = filtered.filter(entry => {
            const haystack = [
                entry.title,
                entry.description || '',
                ...(entry.tags || [])
            ].join(' ').toLowerCase();
            return haystack.includes(search);
        });
    }

    return filtered;
}

function updateResultsCount(visible, total) {
    const el = document.querySelector('[data-changelog-count]');
    if (!el) return;

    if (state.activeType === 'all' && !state.search.trim()) {
        el.textContent = `Всего: ${total} ${pluralize(total, ['запись', 'записи', 'записей'])}`;
    } else {
        el.textContent = `Найдено: ${visible} из ${total}`;
    }
}

function renderFilters() {
    const container = document.querySelector('[data-changelog-filters]');
    if (!container) return;

    const types = ['all', 'added', 'fixed', 'improved', 'removed'];
    container.innerHTML = types.map(type => {
        const label = type === 'all' ? 'Все' : TYPE_LABELS[type];
        const active = type === state.activeType ? ' active' : '';
        return `<button type="button" class="changelog-chip${active}" data-changelog-type="${type}">${label}</button>`;
    }).join('');

    container.querySelectorAll('[data-changelog-type]').forEach(chip => {
        chip.addEventListener('click', () => {
            state.activeType = chip.dataset.changelogType;
            renderFilters();
            render();
        });
    });
}

function renderEmpty() {
    return `
        <div class="catalog-empty">
            <div class="catalog-empty-icon">
                <i class="ph ph-magnifying-glass"></i>
            </div>
            <h3>Ничего не найдено</h3>
            <p>Попробуйте изменить запрос или сбросить фильтры</p>
            <button class="btn-secondary catalog-empty-reset" type="button" data-changelog-reset>
                <i class="ph ph-arrow-counter-clockwise"></i> Сбросить фильтры
            </button>
        </div>
    `;
}

function bindReset() {
    const list = document.querySelector('[data-changelog-list]');
    if (!list) return;
    const btn = list.querySelector('[data-changelog-reset]');
    if (!btn) return;
    btn.addEventListener('click', () => {
        state.activeType = 'all';
        state.search = '';
        const input = document.querySelector('[data-changelog-search]');
        if (input) input.value = '';
        renderFilters();
        render();
    });
}

function render() {
    const list = document.querySelector('[data-changelog-list]');
    if (!list) return;

    const visible = applyFilters(state.entries);
    updateResultsCount(visible.length, state.entries.length);

    if (!visible.length) {
        list.innerHTML = renderEmpty();
        bindReset();
        return;
    }

    const groups = new Map();
    visible.forEach(entry => {
        if (!groups.has(entry.date)) groups.set(entry.date, []);
        groups.get(entry.date).push(entry);
    });

    const sortedDates = Array.from(groups.keys()).sort((a, b) => b.localeCompare(a));

    list.innerHTML = sortedDates.map(date => {
        const entries = groups.get(date);
        return `
            <div class="changelog-date-group">
                <div class="changelog-date-title">
                    <i class="ph ph-calendar-blank"></i>
                    <span>${formatDate(date)}</span>
                </div>
                <div class="changelog-date-entries">
                    ${entries.map(renderEntry).join('')}
                </div>
            </div>
        `;
    }).join('');
}

async function loadData() {
    try {
        const response = await fetch(CHANGELOG_URL, { cache: 'no-cache' });
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        if (!data || !Array.isArray(data.entries)) throw new Error('Invalid shape');
        state.entries = data.entries;
    } catch (error) {
        console.warn('Не удалось загрузить changelog.json:', error);
        state.entries = [];
    }
}

function bindSearch() {
    const input = document.querySelector('[data-changelog-search]');
    if (!input) return;
    input.addEventListener('input', debounce((e) => {
        state.search = e.target.value;
        render();
    }, 250));
}

export async function initChangelog() {
    const list = document.querySelector('[data-changelog-list]');
    if (!list) return;

    await loadData();
    renderFilters();
    bindSearch();
    render();
}