import { escapeHtml, debounce } from './utils.js';

const DATA_URL = '../../data/ide-hotkeys.json';
const HISTORY_KEY = 'cr_hotkeys_history';
const ERRORS_KEY = 'cr_hotkeys_errors';
const HISTORY_MAX = 8;
const SESSION_SIZE = 15;

const FALLBACK_DATA = {
    ides: [
        {
            id: 'vscode',
            label: 'VS Code',
            shortcuts: [
                { id: 'vsc-comment-line', category: 'editing', action: 'Закомментировать строку', keys: ['Ctrl', '/'] },
                { id: 'vsc-duplicate-line', category: 'editing', action: 'Дублировать строку', keys: ['Shift', 'Alt', 'Down'] },
                { id: 'vsc-command-palette', category: 'ui', action: 'Открыть палитру команд', keys: ['Ctrl', 'Shift', 'P'] },
                { id: 'vsc-goto-def', category: 'navigation', action: 'Перейти к определению', keys: ['F12'] }
            ]
        }
    ],
    categories: [
        { id: 'editing', label: 'Редактирование' },
        { id: 'navigation', label: 'Навигация' },
        { id: 'ui', label: 'Интерфейс' }
    ]
};

const state = {
    data: FALLBACK_DATA,
    ide: 'vscode',
    category: 'all',
    queue: [],
    index: 0,
    correct: 0,
    wrong: 0,
    streak: 0,
    bestStreak: 0,
    locked: false,
    current: null,
    sessionErrors: {},
    libraryCategory: 'all',
    librarySearch: ''
};

const els = {};

const KEYBOARD_LAYOUT = [
    [
        { code: 'Escape', label: 'Esc', w: 1.2 },
        { code: 'F1', label: 'F1' },
        { code: 'F2', label: 'F2' },
        { code: 'F3', label: 'F3' },
        { code: 'F4', label: 'F4' },
        { code: 'F5', label: 'F5' },
        { code: 'F6', label: 'F6' },
        { code: 'F7', label: 'F7' },
        { code: 'F8', label: 'F8' },
        { code: 'F9', label: 'F9' },
        { code: 'F10', label: 'F10' },
        { code: 'F11', label: 'F11' },
        { code: 'F12', label: 'F12' }
    ],
    [
        { code: 'Backquote', label: '`' },
        { code: 'Digit1', label: '1' },
        { code: 'Digit2', label: '2' },
        { code: 'Digit3', label: '3' },
        { code: 'Digit4', label: '4' },
        { code: 'Digit5', label: '5' },
        { code: 'Digit6', label: '6' },
        { code: 'Digit7', label: '7' },
        { code: 'Digit8', label: '8' },
        { code: 'Digit9', label: '9' },
        { code: 'Digit0', label: '0' },
        { code: 'Minus', label: '-' },
        { code: 'Equal', label: '=' },
        { code: 'Backspace', label: 'Backspace', w: 1.8 }
    ],
    [
        { code: 'Tab', label: 'Tab', w: 1.5 },
        { code: 'KeyQ', label: 'Q' },
        { code: 'KeyW', label: 'W' },
        { code: 'KeyE', label: 'E' },
        { code: 'KeyR', label: 'R' },
        { code: 'KeyT', label: 'T' },
        { code: 'KeyY', label: 'Y' },
        { code: 'KeyU', label: 'U' },
        { code: 'KeyI', label: 'I' },
        { code: 'KeyO', label: 'O' },
        { code: 'KeyP', label: 'P' },
        { code: 'BracketLeft', label: '[' },
        { code: 'BracketRight', label: ']' },
        { code: 'Backslash', label: '\\', w: 1.3 }
    ],
    [
        { code: 'CapsLock', label: 'Caps', w: 1.7 },
        { code: 'KeyA', label: 'A' },
        { code: 'KeyS', label: 'S' },
        { code: 'KeyD', label: 'D' },
        { code: 'KeyF', label: 'F' },
        { code: 'KeyG', label: 'G' },
        { code: 'KeyH', label: 'H' },
        { code: 'KeyJ', label: 'J' },
        { code: 'KeyK', label: 'K' },
        { code: 'KeyL', label: 'L' },
        { code: 'Semicolon', label: ';' },
        { code: 'Quote', label: "'" },
        { code: 'Enter', label: 'Enter', w: 2.1 }
    ],
    [
        { code: 'ShiftLeft', label: 'Shift', w: 2.3, modifier: 'shift' },
        { code: 'KeyZ', label: 'Z' },
        { code: 'KeyX', label: 'X' },
        { code: 'KeyC', label: 'C' },
        { code: 'KeyV', label: 'V' },
        { code: 'KeyB', label: 'B' },
        { code: 'KeyN', label: 'N' },
        { code: 'KeyM', label: 'M' },
        { code: 'Comma', label: ',' },
        { code: 'Period', label: '.' },
        { code: 'Slash', label: '/' },
        { code: 'ShiftRight', label: 'Shift', w: 2.3, modifier: 'shift' }
    ],
    [
        { code: 'ControlLeft', label: 'Ctrl', w: 1.5, modifier: 'ctrl' },
        { code: 'MetaLeft', label: 'Win', w: 1.2, modifier: 'meta' },
        { code: 'AltLeft', label: 'Alt', w: 1.2, modifier: 'alt' },
        { code: 'Space', label: '', w: 5.4 },
        { code: 'AltRight', label: 'Alt', w: 1.2, modifier: 'alt' },
        { code: 'MetaRight', label: 'Win', w: 1.2, modifier: 'meta' },
        { code: 'ContextMenu', label: 'Menu', w: 1.2 },
        { code: 'ControlRight', label: 'Ctrl', w: 1.5, modifier: 'ctrl' }
    ]
];

const PREVENT_KEYS = new Set([
    'Tab', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
    'Backspace', 'Enter', "'", '/', '\\', ';'
]);

const MODIFIER_KEYS = ['Control', 'Shift', 'Alt', 'Meta'];

const MODS = ['ctrl', 'meta', 'alt', 'shift'];

function cacheElements() {
    els.section = document.getElementById('hotkeysSection');
    els.ideChips = document.getElementById('ideChips');
    els.categoryChips = document.getElementById('categoryChips');
    els.statProgress = document.getElementById('statProgress');
    els.statCorrect = document.getElementById('statCorrect');
    els.statWrong = document.getElementById('statWrong');
    els.statStreak = document.getElementById('statStreak');
    els.progressFill = document.getElementById('progressFill');
    els.taskCard = document.getElementById('taskCard');
    els.taskCategory = document.getElementById('taskCategory');
    els.taskAction = document.getElementById('taskAction');
    els.taskPrompt = document.getElementById('taskPrompt');
    els.taskKeys = document.getElementById('taskKeys');
    els.taskHint = document.getElementById('taskHint');
    els.keyboard = document.getElementById('keyboard');
    els.skipBtn = document.getElementById('skipBtn');
    els.hintBtn = document.getElementById('hintBtn');
    els.restartBtn = document.getElementById('restartBtn');
    els.historyList = document.getElementById('historyList');
    els.historyEmpty = document.getElementById('historyEmpty');
    els.errorList = document.getElementById('errorList');
    els.errorEmpty = document.getElementById('errorEmpty');
    els.mobileWarning = document.getElementById('mobileWarning');
    els.tabs = document.querySelectorAll('.hotkeys-tab');
    els.views = document.querySelectorAll('.hotkeys-view');
    els.libraryIdeChips = document.getElementById('libraryIdeChips');
    els.libraryCategoryChips = document.getElementById('libraryCategoryChips');
    els.librarySearch = document.getElementById('librarySearch');
    els.librarySearchClear = document.getElementById('librarySearchClear');
    els.libraryResultsCount = document.getElementById('libraryResultsCount');
    els.libraryGrid = document.getElementById('libraryGrid');
    els.libraryEmpty = document.getElementById('libraryEmpty');
    els.libraryReset = document.getElementById('libraryReset');
}

async function loadData() {
    try {
        const response = await fetch(DATA_URL, { cache: 'no-cache' });
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        if (!data || !Array.isArray(data.ides) || !data.ides.length) throw new Error('Invalid shape');
        state.data = data;
        state.ide = data.ides[0].id;
    } catch (error) {
        console.warn('Не удалось загрузить ide-hotkeys.json, используем встроенные данные:', error);
        state.data = FALLBACK_DATA;
        state.ide = FALLBACK_DATA.ides[0].id;
    }
}

function keyFromCode(code) {
    if (code.startsWith('Key')) return code.slice(3).toLowerCase();
    if (code.startsWith('Digit')) return code.slice(5);
    const map = {
        Backquote: '`',
        Minus: '-',
        Equal: '=',
        BracketLeft: '[',
        BracketRight: ']',
        Backslash: '\\',
        Semicolon: ';',
        Quote: "'",
        Comma: ',',
        Period: '.',
        Slash: '/',
        Space: 'space',
        Escape: 'escape',
        Enter: 'enter',
        Backspace: 'backspace',
        Tab: 'tab',
        Delete: 'delete',
        Insert: 'insert',
        Home: 'home',
        End: 'end',
        PageUp: 'pageup',
        PageDown: 'pagedown',
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
        CapsLock: 'capslock'
    };
    return map[code] || code.toLowerCase();
}

function comboFromEvent(e) {
    const parts = [];
    if (e.ctrlKey) parts.push('ctrl');
    if (e.metaKey) parts.push('meta');
    if (e.altKey) parts.push('alt');
    if (e.shiftKey) parts.push('shift');
    if (MODIFIER_KEYS.includes(e.key)) return parts;
    parts.push(keyFromCode(e.code));
    return parts;
}

function normalizeCombo(parts) {
    const lower = parts.map(p => String(p).toLowerCase());
    const modParts = MODS.filter(m => lower.includes(m));
    const keyParts = lower.filter(p => !MODS.includes(p));
    return [...modParts, ...keyParts].join('+');
}

function comboEquals(a, b) {
    return normalizeCombo(a) === normalizeCombo(b);
}

function parseExpectedKeys(keys) {
    return keys.map(k => {
        const lower = k.toLowerCase();
        if (lower === 'cmd' || lower === 'win') return 'meta';
        return lower;
    });
}

function displayLabel(key, hasShift) {
    const lower = String(key).toLowerCase();
    const map = {
        ctrl: 'Ctrl',
        shift: 'Shift',
        alt: 'Alt',
        meta: 'Win',
        cmd: 'Cmd',
        win: 'Win',
        space: 'Space',
        enter: 'Enter',
        escape: 'Esc',
        esc: 'Esc',
        tab: 'Tab',
        backspace: 'Backspace',
        up: '↑',
        down: '↓',
        left: '←',
        right: '→'
    };
    if (map[lower]) return map[lower];
    if (/^f\d+$/i.test(key)) return String(key).toUpperCase();
    if (String(key).length === 1 && /[a-z]/i.test(key)) {
        return hasShift ? String(key).toUpperCase() : String(key).toLowerCase();
    }
    return String(key);
}

function keysToCodes(keys) {
    const codes = [];
    for (const k of keys) {
        const lower = String(k).toLowerCase();
        if (lower === 'ctrl') codes.push('ControlLeft');
        else if (lower === 'shift') codes.push('ShiftLeft');
        else if (lower === 'alt') codes.push('AltLeft');
        else if (lower === 'meta' || lower === 'cmd' || lower === 'win') codes.push('MetaLeft');
        else if (lower === 'space') codes.push('Space');
        else if (lower === 'enter') codes.push('Enter');
        else if (lower === 'escape' || lower === 'esc') codes.push('Escape');
        else if (lower === 'tab') codes.push('Tab');
        else if (lower === 'backspace') codes.push('Backspace');
        else if (/^f\d+$/.test(lower)) codes.push(lower.toUpperCase());
        else if (lower === 'up') codes.push('ArrowUp');
        else if (lower === 'down') codes.push('ArrowDown');
        else if (lower === 'left') codes.push('ArrowLeft');
        else if (lower === 'right') codes.push('ArrowRight');
        else if (lower === '/') codes.push('Slash');
        else if (lower === '\\') codes.push('Backslash');
        else if (lower === ';') codes.push('Semicolon');
        else if (lower === "'") codes.push('Quote');
        else if (lower === ',') codes.push('Comma');
        else if (lower === '.') codes.push('Period');
        else if (lower === '-') codes.push('Minus');
        else if (lower === '=') codes.push('Equal');
        else if (lower === '[') codes.push('BracketLeft');
        else if (lower === ']') codes.push('BracketRight');
        else if (lower === '`') codes.push('Backquote');
        else if (lower.length === 1 && /[a-z]/.test(lower)) codes.push('Key' + lower.toUpperCase());
        else if (/^\d$/.test(lower)) codes.push('Digit' + lower);
    }
    return codes;
}

function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function getCategoryLabel(id) {
    const cat = state.data.categories.find(c => c.id === id);
    return cat ? cat.label : id;
}

function getShortcutById(id) {
    for (const ide of state.data.ides) {
        const found = ide.shortcuts.find(s => s.id === id);
        if (found) return found;
    }
    return null;
}

function renderKeyboard() {
    els.keyboard.innerHTML = KEYBOARD_LAYOUT.map(row => `
        <div class="vkeyboard-row">
            ${row.map(k => `
                <div class="vkey" data-code="${k.code}"${k.w ? ` data-wide="${k.w}"` : ''}${k.modifier ? ` data-modifier="${k.modifier}"` : ''}>${escapeHtml(k.label)}</div>
            `).join('')}
        </div>
    `).join('');
}

function renderConfig() {
    els.ideChips.innerHTML = state.data.ides.map(ide => `
        <button type="button" class="hotkeys-chip${ide.id === state.ide ? ' active' : ''}" data-ide="${escapeHtml(ide.id)}">${escapeHtml(ide.label)}</button>
    `).join('');

    els.ideChips.querySelectorAll('[data-ide]').forEach(chip => {
        chip.addEventListener('click', () => {
            state.ide = chip.dataset.ide;
            renderConfig();
            renderLibraryConfig();
            restart();
            renderLibrary();
        });
    });

    const cats = [{ id: 'all', label: 'Все' }].concat(state.data.categories);
    els.categoryChips.innerHTML = cats.map(cat => `
        <button type="button" class="hotkeys-chip${cat.id === state.category ? ' active' : ''}" data-category="${escapeHtml(cat.id)}">${escapeHtml(cat.label)}</button>
    `).join('');

    els.categoryChips.querySelectorAll('[data-category]').forEach(chip => {
        chip.addEventListener('click', () => {
            if (state.locked) return;
            state.category = chip.dataset.category;
            renderConfig();
            restart();
        });
    });
}

function renderKeys(container, keys, highlight) {
    container.classList.remove('empty');
    const hasShift = keys.some(k => String(k).toLowerCase() === 'shift');
    container.innerHTML = keys.map((k, i) => {
        const label = displayLabel(k, hasShift);
        const cls = highlight ? 'keycap highlight' : 'keycap';
        return (i > 0 ? '<span class="keycap plus">+</span>' : '') +
            `<span class="${cls}">${escapeHtml(label)}</span>`;
    }).join('');
}

function clearKeys(container) {
    container.innerHTML = '';
    container.classList.add('empty');
}

function renderTask() {
    if (!state.current) return;
    els.taskCategory.textContent = getCategoryLabel(state.current.category);
    els.taskAction.textContent = state.current.action;
    els.taskPrompt.textContent = 'Нажмите комбинацию клавиш';
    els.taskPrompt.style.color = '';
    clearKeys(els.taskKeys);
    els.taskHint.hidden = true;
    els.taskHint.textContent = '';
    els.taskCard.classList.remove('correct', 'wrong');
}

function updateStats() {
    els.statProgress.textContent = `${state.index}/${state.queue.length}`;
    els.statCorrect.textContent = state.correct;
    els.statWrong.textContent = state.wrong;
    els.statStreak.textContent = state.streak;
    const percent = state.queue.length ? (state.index / state.queue.length) * 100 : 0;
    els.progressFill.style.width = percent + '%';
}

function buildQueue() {
    const ide = state.data.ides.find(i => i.id === state.ide);
    if (!ide) return [];
    let list = ide.shortcuts.slice();
    if (state.category !== 'all') {
        list = list.filter(s => s.category === state.category);
    }
    return shuffle(list).slice(0, SESSION_SIZE);
}

function clearKeyboardHighlight() {
    els.keyboard.querySelectorAll('.vkey').forEach(el => {
        el.classList.remove('pressed', 'correct', 'wrong');
    });
}

function highlightKeyboard(type) {
    clearKeyboardHighlight();
    const codes = keysToCodes(state.current.keys);
    codes.forEach(code => {
        const el = els.keyboard.querySelector(`[data-code="${code}"]`);
        if (el) el.classList.add(type);
    });
}

function highlightPhysical(e, pressed) {
    if (!e) return;
    const el = els.keyboard.querySelector(`[data-code="${e.code}"]`);
    if (el) el.classList.toggle('pressed', pressed);

    const mods = [
        ['ctrl', e.ctrlKey],
        ['alt', e.altKey],
        ['shift', e.shiftKey],
        ['meta', e.metaKey]
    ];
    mods.forEach(([name, active]) => {
        els.keyboard.querySelectorAll(`[data-modifier="${name}"]`).forEach(node => {
            node.classList.toggle('pressed', !!active);
        });
    });
}

function getHistory() {
    try {
        const raw = JSON.parse(localStorage.getItem(HISTORY_KEY));
        return Array.isArray(raw) ? raw : [];
    } catch {
        return [];
    }
}

function pushHistory(entry) {
    const history = getHistory();
    history.push(entry);
    while (history.length > HISTORY_MAX) history.shift();
    try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch { }
    renderHistory();
}

function renderHistory() {
    const history = getHistory();
    if (!history.length) {
        els.historyEmpty.hidden = false;
        els.historyList.innerHTML = '';
        return;
    }
    els.historyEmpty.hidden = true;
    els.historyList.innerHTML = history.slice().reverse().map(item => {
        const keys = (item.keys || []).join(' + ');
        const cls = item.correct ? 'correct' : 'wrong';
        const icon = item.correct ? 'ph-fill ph-check-circle' : 'ph-fill ph-x-circle';
        return `
            <div class="hotkeys-history-item ${cls}">
                <i class="ph ${icon} hotkeys-history-icon"></i>
                <span class="hotkeys-history-action">${escapeHtml(item.action || '')}</span>
                <span class="hotkeys-history-keys">${escapeHtml(keys)}</span>
            </div>
        `;
    }).join('');
}

function saveErrors() {
    const ids = Object.keys(state.sessionErrors);
    if (!ids.length) return;
    let stored = {};
    try {
        stored = JSON.parse(localStorage.getItem(ERRORS_KEY)) || {};
    } catch { }
    ids.forEach(id => {
        stored[id] = (stored[id] || 0) + state.sessionErrors[id];
    });
    try {
        localStorage.setItem(ERRORS_KEY, JSON.stringify(stored));
    } catch { }
}

function getErrors() {
    try {
        const raw = JSON.parse(localStorage.getItem(ERRORS_KEY));
        return raw && typeof raw === 'object' ? raw : {};
    } catch {
        return {};
    }
}

function renderErrors() {
    const stored = getErrors();
    const entries = Object.entries(stored)
        .map(([id, count]) => ({ shortcut: getShortcutById(id), count }))
        .filter(e => e.shortcut && e.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    if (!entries.length) {
        els.errorEmpty.hidden = false;
        els.errorList.innerHTML = '';
        return;
    }
    els.errorEmpty.hidden = true;
    els.errorList.innerHTML = entries.map(({ shortcut, count }) => `
        <div class="hotkeys-error-item">
            <span class="hotkeys-error-action">${escapeHtml(shortcut.action)}</span>
            <span class="hotkeys-error-count">${count} ошибок</span>
        </div>
    `).join('');
}

function loadCurrent() {
    if (state.index >= state.queue.length) {
        finish();
        return;
    }
    state.current = state.queue[state.index];
    renderTask();
    updateStats();
}

function advance() {
    state.index++;
    state.locked = false;
    clearKeyboardHighlight();
    if (state.index >= state.queue.length) {
        finish();
        return;
    }
    loadCurrent();
}

function handleCorrect() {
    state.locked = true;
    state.correct++;
    state.streak++;
    if (state.streak > state.bestStreak) state.bestStreak = state.streak;

    els.taskCard.classList.add('correct');
    els.taskPrompt.textContent = 'Правильно!';
    els.taskPrompt.style.color = 'var(--accent-green)';
    renderKeys(els.taskKeys, state.current.keys, true);
    highlightKeyboard('correct');

    if (state.current.hint) {
        els.taskHint.hidden = false;
        els.taskHint.textContent = state.current.hint;
    }

    pushHistory({
        action: state.current.action,
        keys: state.current.keys,
        correct: true,
        ide: state.ide,
        date: Date.now()
    });

    updateStats();

    setTimeout(() => {
        els.taskPrompt.style.color = '';
        advance();
    }, 900);
}

function handleWrong(pressed) {
    state.locked = true;
    state.wrong++;
    state.streak = 0;

    const id = state.current.id;
    state.sessionErrors[id] = (state.sessionErrors[id] || 0) + 1;

    els.taskCard.classList.add('wrong');
    els.taskPrompt.textContent = 'Не то. Правильно:';
    els.taskPrompt.style.color = '#ef4444';
    renderKeys(els.taskKeys, state.current.keys, true);
    highlightKeyboard('wrong');

    if (state.current.hint) {
        els.taskHint.hidden = false;
        els.taskHint.textContent = state.current.hint;
    }

    pushHistory({
        action: state.current.action,
        keys: state.current.keys,
        pressed: pressed,
        correct: false,
        ide: state.ide,
        date: Date.now()
    });

    updateStats();

    setTimeout(() => {
        els.taskPrompt.style.color = '';
        advance();
    }, 1400);
}

function handleSkip() {
    if (state.locked || !state.current) return;
    state.locked = true;
    state.wrong++;
    state.streak = 0;

    const id = state.current.id;
    state.sessionErrors[id] = (state.sessionErrors[id] || 0) + 1;

    els.taskCard.classList.add('wrong');
    els.taskPrompt.textContent = 'Пропущено. Правильно:';
    els.taskPrompt.style.color = '#ef4444';
    renderKeys(els.taskKeys, state.current.keys, true);

    pushHistory({
        action: state.current.action,
        keys: state.current.keys,
        correct: false,
        ide: state.ide,
        date: Date.now()
    });

    updateStats();

    setTimeout(() => {
        els.taskPrompt.style.color = '';
        advance();
    }, 1200);
}

function handleHint() {
    if (!state.current) return;
    const hintText = state.current.hint || `Правильный ответ: ${state.current.keys.join(' + ')}`;
    if (!els.taskHint.hidden && els.taskHint.textContent === hintText) return;
    els.taskHint.hidden = false;
    els.taskHint.textContent = hintText;
}

function restart() {
    state.queue = buildQueue();
    state.index = 0;
    state.correct = 0;
    state.wrong = 0;
    state.streak = 0;
    state.bestStreak = 0;
    state.locked = false;
    state.current = null;
    state.sessionErrors = {};
    clearKeyboardHighlight();
    if (!state.queue.length) {
        els.taskCategory.textContent = 'Пусто';
        els.taskAction.textContent = 'Нет комбинаций для выбранной категории';
        els.taskPrompt.textContent = 'Выберите другую категорию';
        clearKeys(els.taskKeys);
        updateStats();
        return;
    }
    loadCurrent();
    updateStats();
}

function finish() {
    state.current = null;
    state.locked = true;
    els.taskCategory.textContent = 'Готово';
    const total = state.queue.length;
    els.taskAction.textContent = `Правильно: ${state.correct} из ${total}`;
    els.taskPrompt.textContent = 'Нажмите Заново, чтобы начать новую сессию';
    els.taskPrompt.style.color = '';
    clearKeys(els.taskKeys);
    els.taskHint.hidden = true;
    saveErrors();
    renderErrors();
    updateStats();
}

function shouldPrevent(e) {
    if (!state.current) return false;
    if (PREVENT_KEYS.has(e.key)) return true;
    if ((e.ctrlKey || e.metaKey) && !e.altKey) return true;
    return false;
}

function onKeyDown(e) {
    if (e.repeat) return;
    if (els.section.querySelector('[data-view="trainer"]').hidden) return;
    if (shouldPrevent(e)) e.preventDefault();

    highlightPhysical(e, true);

    if (!state.current || state.locked) return;
    if (MODIFIER_KEYS.includes(e.key)) return;

    const pressed = comboFromEvent(e);
    const expected = parseExpectedKeys(state.current.keys);

    if (comboEquals(pressed, expected)) {
        handleCorrect();
    } else {
        handleWrong(pressed);
    }
}

function onKeyUp(e) {
    highlightPhysical(e, false);
    const el = els.keyboard.querySelector(`[data-code="${e.code}"]`);
    if (el) el.classList.remove('pressed');
    if (!e.ctrlKey) els.keyboard.querySelectorAll('[data-modifier="ctrl"]').forEach(n => n.classList.remove('pressed'));
    if (!e.altKey) els.keyboard.querySelectorAll('[data-modifier="alt"]').forEach(n => n.classList.remove('pressed'));
    if (!e.shiftKey) els.keyboard.querySelectorAll('[data-modifier="shift"]').forEach(n => n.classList.remove('pressed'));
    if (!e.metaKey) els.keyboard.querySelectorAll('[data-modifier="meta"]').forEach(n => n.classList.remove('pressed'));
}

function checkMobile() {
    if (!els.mobileWarning) return;
    const isTouch = window.matchMedia('(hover: none)').matches || 'ontouchstart' in window;
    if (isTouch) els.mobileWarning.hidden = false;
}

function switchTab(tabName) {
    els.tabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    els.views.forEach(view => {
        const isTarget = view.dataset.view === tabName;
        if (isTarget) {
            view.hidden = false;
            view.style.animation = 'none';
            void view.offsetWidth;
            view.style.animation = '';
        } else {
            view.hidden = true;
        }
    });

    if (tabName === 'library') {
        renderLibrary();
    }
}

function renderLibraryConfig() {
    els.libraryIdeChips.innerHTML = state.data.ides.map(ide => `
        <button type="button" class="hotkeys-chip${ide.id === state.ide ? ' active' : ''}" data-lib-ide="${escapeHtml(ide.id)}">${escapeHtml(ide.label)}</button>
    `).join('');

    els.libraryIdeChips.querySelectorAll('[data-lib-ide]').forEach(chip => {
        chip.addEventListener('click', () => {
            state.ide = chip.dataset.libIde;
            renderConfig();
            renderLibraryConfig();
            renderLibrary();
            restart();
        });
    });

    const cats = [{ id: 'all', label: 'Все' }].concat(state.data.categories);
    els.libraryCategoryChips.innerHTML = cats.map(cat => `
        <button type="button" class="hotkeys-chip${cat.id === state.libraryCategory ? ' active' : ''}" data-lib-cat="${escapeHtml(cat.id)}">${escapeHtml(cat.label)}</button>
    `).join('');

    els.libraryCategoryChips.querySelectorAll('[data-lib-cat]').forEach(chip => {
        chip.addEventListener('click', () => {
            state.libraryCategory = chip.dataset.libCat;
            renderLibraryConfig();
            renderLibrary();
        });
    });
}

function filterLibrary() {
    const ide = state.data.ides.find(i => i.id === state.ide);
    if (!ide) return [];
    let list = ide.shortcuts.slice();
    if (state.libraryCategory !== 'all') {
        list = list.filter(s => s.category === state.libraryCategory);
    }
    const search = state.librarySearch.trim().toLowerCase();
    if (search) {
        list = list.filter(s => {
            const haystack = [s.action, ...(s.keys || [])].join(' ').toLowerCase();
            return haystack.includes(search);
        });
    }
    return list;
}

function renderLibraryCard(shortcut) {
    const hasShift = (shortcut.keys || []).some(k => String(k).toLowerCase() === 'shift');
    const keysHtml = (shortcut.keys || []).map((k, i) => {
        const label = displayLabel(k, hasShift);
        return (i > 0 ? '<span class="keycap plus">+</span>' : '') +
            `<span class="keycap">${escapeHtml(label)}</span>`;
    }).join('');

    return `
        <div class="library-card">
            <div class="library-card-top">
                <div class="library-card-action">${escapeHtml(shortcut.action)}</div>
                <span class="library-card-category">${escapeHtml(getCategoryLabel(shortcut.category))}</span>
            </div>
            <div class="library-card-keys">${keysHtml}</div>
            ${shortcut.hint ? `<div class="library-card-hint">${escapeHtml(shortcut.hint)}</div>` : ''}
        </div>
    `;
}

function renderLibrary() {
    const list = filterLibrary();
    const total = (state.data.ides.find(i => i.id === state.ide)?.shortcuts || []).length;

    if (els.libraryResultsCount) {
        if (list.length === total) {
            els.libraryResultsCount.textContent = `Всего: ${total} комбинаций`;
        } else {
            els.libraryResultsCount.textContent = `Найдено: ${list.length} из ${total}`;
        }
    }

    if (!list.length) {
        els.libraryGrid.innerHTML = '';
        els.libraryEmpty.hidden = false;
        return;
    }
    els.libraryEmpty.hidden = true;
    els.libraryGrid.innerHTML = list.map(renderLibraryCard).join('');
    els.libraryGrid.querySelectorAll('.library-card').forEach((card, i) => {
        card.style.animationDelay = `${Math.min(i * 0.02, 0.3)}s`;
    });

    if (els.librarySearchClear) {
        els.librarySearchClear.hidden = !state.librarySearch.trim();
    }
}

function bindEvents() {
    els.skipBtn.addEventListener('click', handleSkip);
    els.hintBtn.addEventListener('click', handleHint);
    els.restartBtn.addEventListener('click', restart);

    els.tabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    if (els.librarySearch) {
        els.librarySearch.addEventListener('input', debounce((e) => {
            state.librarySearch = e.target.value;
            renderLibrary();
        }, 200));
    }

    if (els.librarySearchClear) {
        els.librarySearchClear.addEventListener('click', () => {
            state.librarySearch = '';
            if (els.librarySearch) {
                els.librarySearch.value = '';
                els.librarySearch.focus();
            }
            renderLibrary();
        });
    }

    if (els.libraryReset) {
        els.libraryReset.addEventListener('click', () => {
            state.librarySearch = '';
            state.libraryCategory = 'all';
            if (els.librarySearch) els.librarySearch.value = '';
            renderLibraryConfig();
            renderLibrary();
        });
    }

    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('keyup', onKeyUp, true);
}

async function init() {
    cacheElements();
    checkMobile();
    await loadData();
    renderKeyboard();
    renderConfig();
    renderLibraryConfig();
    renderHistory();
    renderErrors();
    bindEvents();
    restart();
}

init();