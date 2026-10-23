import { escapeHtml, debounce } from './utils.js';

const COURSES_URL = 'data/courses.json';
const DEFAULT_LIMIT = 4;
const SKELETON_COUNT = 4;

const FALLBACK_DATA = {
    courses: [
        { id: 'csharp', title: 'C# с нуля до профи', description: 'От первого Console.WriteLine до ООП, LINQ и асинхронности. Основной язык .NET-разработки.', icon: 'ph-code', gradient: 'purple-gradient', tags: ['3 уровня', '18 уроков'], category: 'backend', level: 'beginner-friendly' },
        { id: 'python', title: 'Python для начинающих', description: 'Самый дружелюбный язык для старта в программировании. Синтаксис, структуры данных, ООП.', icon: 'ph-terminal-window', gradient: 'blue-gradient', tags: ['3 уровня', '15 уроков'], category: 'backend', level: 'beginner-friendly' },
        { id: 'javascript', title: 'JavaScript в браузере', description: 'Язык веба: от переменных до асинхронности, DOM и работы с API.', icon: 'ph-brackets-curly', gradient: 'orange-gradient', tags: ['3 уровня', '16 уроков'], category: 'frontend', level: 'beginner-friendly' },
        { id: 'algorithms', title: 'Алгоритмы и структуры данных', description: 'Сортировки, поиск, деревья, графы. То, что спрашивают на собеседованиях.', icon: 'ph-graph', gradient: 'green-gradient', tags: ['3 уровня', '14 уроков'], category: 'fundamentals', level: 'intermediate' }
    ],
    filters: {
        categories: [
            { id: 'all', label: 'Все' },
            { id: 'backend', label: 'Backend' },
            { id: 'frontend', label: 'Frontend' },
            { id: 'data', label: 'Data' },
            { id: 'fundamentals', label: 'Fundamentals' }
        ],
        levels: [
            { id: 'all', label: 'Любой уровень' },
            { id: 'beginner-friendly', label: 'С нуля' },
            { id: 'intermediate', label: 'Средний' },
            { id: 'advanced', label: 'Продвинутый' }
        ]
    }
};

async function loadData() {
    try {
        const response = await fetch(COURSES_URL, { cache: 'no-cache' });
        if (!response.ok) throw new Error('Failed to fetch courses');
        const data = await response.json();
        if (!data || !Array.isArray(data.courses)) throw new Error('Invalid data shape');
        return {
            courses: data.courses,
            filters: data.filters || FALLBACK_DATA.filters
        };
    } catch (error) {
        console.warn('Не удалось загрузить courses.json, используем встроенные данные:', error);
        return FALLBACK_DATA;
    }
}

function getLimit(grid) {
    const raw = grid.dataset.limit;
    if (raw === undefined || raw === '') return DEFAULT_LIMIT;
    const n = parseInt(raw, 10);
    if (isNaN(n) || n <= 0) return null;
    return n;
}

function renderSkeletons(grid, count) {
    grid.innerHTML = Array(count).fill(`
        <div class="catalog-skeleton">
            <div class="skeleton-visual"></div>
            <div class="skeleton-body">
                <div class="skeleton-line short"></div>
                <div class="skeleton-line"></div>
                <div class="skeleton-line"></div>
                <div class="skeleton-line medium"></div>
            </div>
        </div>
    `).join('');
}

function renderCourses(grid, courses, animate = true) {
    grid.innerHTML = courses.map(course => {
        const tags = (course.tags || []).map(tag =>
            `<span class="tag">${escapeHtml(tag)}</span>`
        ).join('');

        return `
            <a href="courses/${encodeURIComponent(course.id)}/index.html" class="catalog-card">
                <div class="catalog-card-visual ${escapeHtml(course.gradient)}">
                    <i class="ph ${escapeHtml(course.icon)}"></i>
                </div>
                <div class="catalog-card-body">
                    <div class="card-tags">${tags}</div>
                    <h3>${escapeHtml(course.title)}</h3>
                    <p>${escapeHtml(course.description)}</p>
                    <div class="card-footer">
                        <span>Начать курс</span>
                        <i class="ph ph-arrow-right"></i>
                    </div>
                </div>
            </a>
        `;
    }).join('');

    if (animate) {
        grid.querySelectorAll('.catalog-card').forEach((card, index) => {
            card.style.animation = `cardEnter 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.05}s backwards`;
        });
    }
}

function renderEmptyState(grid, onReset) {
    grid.innerHTML = `
        <div class="catalog-empty">
            <div class="catalog-empty-icon">
                <i class="ph ph-magnifying-glass"></i>
            </div>
            <h3>Ничего не найдено</h3>
            <p>Попробуйте изменить запрос или сбросить фильтры</p>
            <button class="btn-secondary catalog-empty-reset" type="button">
                <i class="ph ph-arrow-counter-clockwise"></i> Сбросить фильтры
            </button>
        </div>
    `;

    const btn = grid.querySelector('.catalog-empty-reset');
    if (btn && onReset) btn.addEventListener('click', onReset);
}

function renderFilters(container, items, activeId, onSelect, type) {
    container.innerHTML = items.map(item => `
        <button
            type="button"
            class="catalog-chip ${item.id === activeId ? 'active' : ''}"
            data-filter-type="${type}"
            data-filter-id="${escapeHtml(item.id)}"
        >
            ${escapeHtml(item.label)}
        </button>
    `).join('');

    container.querySelectorAll('.catalog-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            onSelect(chip.dataset.filterId);
        });
    });
}

function applyFilters(courses, state) {
    const search = state.search.trim().toLowerCase();

    return courses.filter(course => {
        if (state.category !== 'all' && course.category !== state.category) return false;
        if (state.level !== 'all' && course.level !== state.level) return false;

        if (search) {
            const haystack = [
                course.title,
                course.description,
                ...(course.tags || [])
            ].join(' ').toLowerCase();
            if (!haystack.includes(search)) return false;
        }

        return true;
    });
}

function getStateFromURL() {
    const params = new URLSearchParams(window.location.search);
    return {
        category: params.get('category') || 'all',
        level: params.get('level') || 'all',
        search: params.get('q') || ''
    };
}

function updateURL(state) {
    const params = new URLSearchParams();
    if (state.category !== 'all') params.set('category', state.category);
    if (state.level !== 'all') params.set('level', state.level);
    if (state.search.trim()) params.set('q', state.search.trim());

    const query = params.toString();
    const url = window.location.pathname + (query ? `?${query}` : '');
    window.history.replaceState({}, '', url);
}

function pluralize(n, forms) {
    const abs = Math.abs(n) % 100;
    const last = abs % 10;
    if (abs > 10 && abs < 20) return forms[2];
    if (last > 1 && last < 5) return forms[1];
    if (last === 1) return forms[0];
    return forms[2];
}

function initFullCatalog(grid, data, limit) {
    const state = getStateFromURL();

    const searchWrap = document.querySelector('[data-search-wrap]');
    const searchInput = document.querySelector('[data-search]');
    const searchClear = document.querySelector('[data-search-clear]');
    const categoryContainer = document.querySelector('[data-filters="categories"]');
    const levelContainer = document.querySelector('[data-filters="levels"]');
    const resultsCount = document.querySelector('[data-results-count]');
    const allCourses = data.courses;

    if (searchInput) searchInput.value = state.search;
    if (searchClear) searchClear.hidden = !state.search;

    function updateResultsCount(visible, total) {
        if (!resultsCount) return;
        if (state.category === 'all' && state.level === 'all' && !state.search.trim()) {
            resultsCount.textContent = `Всего: ${total} ${pluralize(total, ['курс', 'курса', 'курсов'])}`;
        } else {
            const found = visible;
            resultsCount.textContent = `Найдено: ${found} из ${total}`;
        }
    }

    function render() {
        const visible = applyFilters(allCourses, state);
        const limited = limit ? visible.slice(0, limit) : visible;

        if (limited.length === 0) {
            renderEmptyState(grid, reset);
        } else {
            renderCourses(grid, limited);
        }

        updateResultsCount(visible.length, allCourses.length);

        if (searchClear) searchClear.hidden = !state.search.trim();
        updateURL(state);

        if (categoryContainer) {
            renderFilters(
                categoryContainer,
                data.filters.categories,
                state.category,
                (id) => {
                    state.category = id;
                    render();
                },
                'category'
            );
        }

        if (levelContainer) {
            renderFilters(
                levelContainer,
                data.filters.levels,
                state.level,
                (id) => {
                    state.level = id;
                    render();
                },
                'level'
            );
        }
    }

    function reset() {
        state.category = 'all';
        state.level = 'all';
        state.search = '';
        if (searchInput) searchInput.value = '';
        render();
    }

    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            state.search = e.target.value;
            render();
        }, 250));
    }

    if (searchClear) {
        searchClear.addEventListener('click', () => {
            state.search = '';
            if (searchInput) {
                searchInput.value = '';
                searchInput.focus();
            }
            render();
        });
    }

    if (searchWrap) {
        searchWrap.hidden = false;
    }

    render();
}

export async function initCatalog() {
    const grid = document.querySelector('.catalog-grid');
    if (!grid) return;

    const limit = getLimit(grid);
    const isFullCatalog = !!document.querySelector('.catalog-controls');

    renderSkeletons(grid, isFullCatalog ? 4 : (limit || SKELETON_COUNT));

    const data = await loadData();

    await new Promise(resolve => setTimeout(resolve, 250));

    if (isFullCatalog) {
        initFullCatalog(grid, data, limit);
    } else {
        const visible = limit ? data.courses.slice(0, limit) : data.courses;
        renderCourses(grid, visible);
    }
}