import { escapeHtml } from './utils.js';

const DEFAULT_DATA_URL = '../../data/roadmap.json';
const STORAGE_KEY = 'cr_user_roadmap';

const state = {
    items: []
};

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

function renderCard(item) {
    return `
        <div class="roadmap-card" draggable="true" data-id="${item.id}">
            <div class="roadmap-card-header">
                <div class="roadmap-card-category">${escapeHtml(item.category || 'Задача')}</div>
                <div class="roadmap-card-actions">
                    <button type="button" class="roadmap-card-btn delete-btn" data-id="${item.id}" title="Удалить">
                        <i class="ph ph-trash"></i>
                    </button>
                </div>
            </div>
            <div class="roadmap-card-title">${escapeHtml(item.title)}</div>
            ${item.description ? `<div class="roadmap-card-desc">${escapeHtml(item.description)}</div>` : ''}
        </div>
    `;
}

function updateCount(status, count) {
    const el = document.querySelector(`[data-count="${status}"]`);
    if (el) el.textContent = count;
}

function renderColumn(status, items) {
    const list = document.querySelector(`[data-list="${status}"]`);
    if (!list) return;

    updateCount(status, items.length);

    if (!items.length) {
        list.innerHTML = `<div class="roadmap-empty">Перетащите задачу сюда</div>`;
        return;
    }

    list.innerHTML = items.map(renderCard).join('');
    bindCardEvents(list);
}

function bindCardEvents(container) {
    container.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            state.items = state.items.filter(item => item.id !== id);
            saveState();
            render();
        });
    });

    container.querySelectorAll('.roadmap-card').forEach(card => {
        card.addEventListener('dragstart', (e) => {
            card.classList.add('dragging');
            e.dataTransfer.setData('text/plain', card.dataset.id);
        });

        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
        });
    });
}

function render() {
    const grouped = {
        planned: [],
        progress: [],
        done: []
    };

    state.items.forEach(item => {
        if (grouped[item.status]) {
            grouped[item.status].push(item);
        }
    });

    renderColumn('planned', grouped.planned);
    renderColumn('progress', grouped.progress);
    renderColumn('done', grouped.done);
}

function bindColumns() {
    document.querySelectorAll('.roadmap-column').forEach(col => {
        const list = col.querySelector('.roadmap-list');
        const status = col.dataset.status;

        col.addEventListener('dragover', (e) => {
            e.preventDefault();
            col.classList.add('drag-over');
        });

        col.addEventListener('dragleave', (e) => {
            if (!col.contains(e.relatedTarget)) {
                col.classList.remove('drag-over');
            }
        });

        col.addEventListener('drop', (e) => {
            e.preventDefault();
            col.classList.remove('drag-over');
            const id = e.dataTransfer.getData('text/plain');
            const item = state.items.find(i => i.id === id);
            
            if (item && item.status !== status) {
                item.status = status;
                saveState();
                render();
            }
        });
    });
}

function openModal(item = null) {
    const modal = document.getElementById('taskModal');
    const form = document.getElementById('taskForm');
    const titleInput = document.getElementById('taskTitle');
    const descInput = document.getElementById('taskDesc');
    const statusInput = document.getElementById('taskStatus');
    const idInput = document.getElementById('taskId');
    const modalTitle = document.getElementById('modalTitle');

    if (item) {
        modalTitle.textContent = 'Редактировать задачу';
        idInput.value = item.id;
        titleInput.value = item.title;
        descInput.value = item.description || '';
        statusInput.value = item.status;
    } else {
        modalTitle.textContent = 'Новая задача';
        form.reset();
        idInput.value = '';
    }

    modal.classList.add('active');
    titleInput.focus();
}

function closeModal() {
    const modal = document.getElementById('taskModal');
    modal.classList.remove('active');
}

async function loadDefaultData() {
    try {
        const response = await fetch(DEFAULT_DATA_URL, { cache: 'no-cache' });
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        if (data && Array.isArray(data.items)) {
            state.items = data.items.map(item => ({
                ...item,
                id: item.id || generateId()
            }));
            saveState();
            render();
        }
    } catch (error) {
        console.warn('Не удалось загрузить данные по умолчанию:', error);
    }
}

function initForm() {
    const form = document.getElementById('taskForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const idInput = document.getElementById('taskId');
        const title = document.getElementById('taskTitle').value.trim();
        const description = document.getElementById('taskDesc').value.trim();
        const status = document.getElementById('taskStatus').value;

        if (idInput.value) {
            const item = state.items.find(i => i.id === idInput.value);
            if (item) {
                item.title = title;
                item.description = description;
                item.status = status;
            }
        } else {
            state.items.push({
                id: generateId(),
                title,
                description,
                status,
                category: 'Мои планы'
            });
        }

        saveState();
        closeModal();
        render();
    });
}

export async function initRoadmap() {
    const board = document.querySelector('.roadmap-board');
    if (!board) return;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            state.items = JSON.parse(stored);
        } catch (e) {
            state.items = [];
        }
    } else {
        await loadDefaultData();
        if (!state.items.length) {
            state.items = [];
        }
    }

    render();
    bindColumns();
    initForm();

    document.getElementById('addTaskBtn')?.addEventListener('click', () => openModal());
    document.getElementById('closeModalBtn')?.addEventListener('click', closeModal);
    document.getElementById('resetRoadmapBtn')?.addEventListener('click', async () => {
        if (confirm('Сбросить все задачи до стандартных?')) {
            localStorage.removeItem(STORAGE_KEY);
            await loadDefaultData();
            if (!state.items.length) render();
        }
    });

    document.getElementById('taskModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'taskModal') closeModal();
    });
}