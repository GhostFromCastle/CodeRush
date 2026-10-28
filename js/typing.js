const WORDS_URL = '../../data/typing.json';
const HISTORY_KEY = 'cr_typing_history';
const ERRORS_KEY = 'cr_typing_errors';
const HISTORY_MAX = 5;
const TIME_MODE_INITIAL = 100;
const TIME_MODE_EXTEND_AT = 40;
const TIME_MODE_EXTEND_BY = 60;
const CODE_MODE_COUNT = 20;

const FALLBACK_WORDS = {
    ru: ["код", "байт", "цикл", "массив", "строка"],
    en: ["code", "byte", "loop", "array", "string"],
    symbols: ["12,5", "x = 5;", "print('hi')"],
    code: ['def greet(name):', 'return f"Hello, {name}!"', 'print(f"Result: {result}")', 'for i in range(10):', 'if x > 0:',]
}

const SHIFT_SYMBOLS = '!@#$%^&*()_+{}|:"<>?~';

const WORDS = { ru: [], en: [], symbols: [], code: [] };

const KEYBOARD_LAYOUT = [
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
        { code: 'AltLeft', label: 'Alt', w: 1.2, modifier: 'alt' },
        { code: 'Space', label: '', w: 6.4 },
        { code: 'AltRight', label: 'Alt', w: 1.2, modifier: 'alt' },
        { code: 'ControlRight', label: 'Ctrl', w: 1.5, modifier: 'ctrl' }
    ]
];

const CHAR_TO_CODE = {
    'a': 'KeyA', 'b': 'KeyB', 'c': 'KeyC', 'd': 'KeyD', 'e': 'KeyE',
    'f': 'KeyF', 'g': 'KeyG', 'h': 'KeyH', 'i': 'KeyI', 'j': 'KeyJ',
    'k': 'KeyK', 'l': 'KeyL', 'm': 'KeyM', 'n': 'KeyN', 'o': 'KeyO',
    'p': 'KeyP', 'q': 'KeyQ', 'r': 'KeyR', 's': 'KeyS', 't': 'KeyT',
    'u': 'KeyU', 'v': 'KeyV', 'w': 'KeyW', 'x': 'KeyX', 'y': 'KeyY', 'z': 'KeyZ',
    'а': 'KeyF', 'б': 'Comma', 'в': 'KeyD', 'г': 'KeyU', 'д': 'KeyL', 'е': 'KeyT',
    'ё': 'KeyT', 'ж': 'Semicolon', 'з': 'KeyP', 'и': 'KeyB', 'й': 'KeyQ',
    'к': 'KeyR', 'л': 'KeyK', 'м': 'KeyV', 'н': 'KeyY', 'о': 'KeyJ', 'п': 'KeyG',
    'р': 'KeyH', 'с': 'KeyC', 'т': 'KeyN', 'у': 'KeyE', 'ф': 'KeyA', 'х': 'BracketLeft',
    'ц': 'KeyW', 'ч': 'KeyX', 'ш': 'KeyI', 'щ': 'KeyO', 'ъ': 'BracketRight', 'ы': 'KeyS',
    'ь': 'KeyM', 'э': 'Quote', 'ю': 'Period', 'я': 'KeyZ',
    '0': 'Digit0', '1': 'Digit1', '2': 'Digit2', '3': 'Digit3', '4': 'Digit4',
    '5': 'Digit5', '6': 'Digit6', '7': 'Digit7', '8': 'Digit8', '9': 'Digit9',
    '-': 'Minus', '=': 'Equal', '[': 'BracketLeft', ']': 'BracketRight', '\\': 'Backslash',
    ';': 'Semicolon', "'": 'Quote', ',': 'Comma', '.': 'Period', '/': 'Slash', '`': 'Backquote',
    ' ': 'Space',
    '!': 'Digit1', '@': 'Digit2', '#': 'Digit3', '$': 'Digit4', '%': 'Digit5', '^': 'Digit6',
    '&': 'Digit7', '*': 'Digit8', '(': 'Digit9', ')': 'Digit0', '_': 'Minus', '+': 'Equal',
    '{': 'BracketLeft', '}': 'BracketRight', '|': 'Backslash', ':': 'Semicolon', '"': 'Quote',
    '<': 'Comma', '>': 'Period', '?': 'Slash', '~': 'Backquote'
};

const state = {
    lang: "ru",
    mode: "words",
    strict: false,
    wordCount: 25,
    timeLimit: 30,
    words: [],
    input: "",
    startTime: null,
    timerInterval: null,
    errorCount: 0,
    totalTyped: 0,
    isDone: false,
    focused: false,
    sessionErrors: {}
};

const els = {};

function cacheElements() {
    els.section = document.getElementById("typingSection");
    els.words = document.getElementById("words");
    els.wordsInner = document.getElementById("wordsInner");
    els.wpm = document.getElementById("wpm");
    els.accuracy = document.getElementById("accuracy");
    els.timeDisplay = document.getElementById("timeDisplay");
    els.progressDisplay = document.getElementById("progressDisplay");
    els.progressFill = document.getElementById("progressFill");
    els.overlay = document.getElementById("overlay");
    els.focusPrompt = document.getElementById("focusPrompt");
    els.wordsGroup = document.getElementById("wordsGroup");
    els.timeGroup = document.getElementById("timeGroup");
    els.finalWpm = document.getElementById("finalWpm");
    els.finalAccuracy = document.getElementById("finalAccuracy");
    els.finalTime = document.getElementById("finalTime");
    els.finalCleanAccuracy = document.getElementById("finalCleanAccuracy");
    els.restartBtn = document.getElementById("restartBtn");
    els.restartOverlay = document.getElementById("restartOverlay");
    els.historyList = document.getElementById("historyList");
    els.historyEmpty = document.getElementById("historyEmpty");
    els.errorHint = document.getElementById("errorHint");
    els.errorHintList = document.getElementById("errorHintList");
    els.errorHintEmpty = document.getElementById("errorHintEmpty");
    els.mobileWarning = document.getElementById("mobileWarning");
    els.strictToggle = document.getElementById("strictToggle");
    els.keyboard = document.getElementById("keyboard");
    els.chips = document.querySelectorAll('.typing-chip');
}

async function loadWords() {
    try {
        const response = await fetch(WORDS_URL, { cache: 'no-cache' });
        if (!response.ok) throw new Error('Failed to fetch words');
        const data = await response.json();
        if (!data || !Array.isArray(data.ru) || !Array.isArray(data.en)) {
            throw new Error('Invalid shape');
        }
        WORDS.ru = data.ru;
        WORDS.en = data.en;
        WORDS.symbols = Array.isArray(data.symbols) ? data.symbols : FALLBACK_WORDS.symbols;
        WORDS.code = Array.isArray(data.code) && data.code.length ? data.code : FALLBACK_WORDS.code;
    } catch (error) {
        console.warn('Не удалось загрузить typing-words.json, используем встроенные слова:', error);
        WORDS.ru = FALLBACK_WORDS.ru;
        WORDS.en = FALLBACK_WORDS.en;
        WORDS.symbols = FALLBACK_WORDS.symbols;
        WORDS.code = FALLBACK_WORDS.code;
    }
}

function pickWord() {
    if (state.mode === "symbols") {
        return WORDS.symbols[Math.floor(Math.random() * WORDS.symbols.length)];
    }
    if (state.mode === "code") {
        return WORDS.code[Math.floor(Math.random() * WORDS.code.length)];
    }
    let pool;
    if (state.lang === "mixed") {
        pool = Math.random() < 0.5 ? WORDS.ru : WORDS.en;
    } else {
        pool = WORDS[state.lang];
    }
    return pool[Math.floor(Math.random() * pool.length)];
}

function getTargetCount() {
    if (state.mode === "words") return state.wordCount;
    if (state.mode === "symbols") return 30;
    if (state.mode === "code") return CODE_MODE_COUNT;
    return TIME_MODE_INITIAL;
}

function generateWords() {
    const target = getTargetCount();
    state.words = [];
    for (let i = 0; i < target; i++) {
        state.words.push(pickWord());
    }
    render();
}

function extendWordsIfNeeded() {
    if (state.mode !== "time") return;
    const fullText = getFullText();
    if (state.input.length < fullText.length - TIME_MODE_EXTEND_AT) return;
    for (let i = 0; i < TIME_MODE_EXTEND_BY; i++) {
        state.words.push(pickWord());
    }
    render();
}

function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function getFullText() {
    return state.words.join(" ");
}

function needsShift(ch) {
    if (!ch) return false;
    if (SHIFT_SYMBOLS.includes(ch)) return true;
    const upper = ch.toUpperCase();
    const lower = ch.toLowerCase();
    return upper !== lower && ch === upper;
}

function normalizeChar(ch) {
    if (!ch) return ch;
    if (ch === 'ё') return 'е';
    if (ch === 'Ё') return 'Е';
    return ch;
}

function render() {
    const fullText = getFullText();
    const input = state.input;

    let html = "";
    let charIndex = 0;

    for (let w = 0; w < state.words.length; w++) {
        const word = state.words[w];
        let wordHtml = `<span class="word">`;

        for (let c = 0; c < word.length; c++) {
            const globalIdx = charIndex + c;
            let cls = "char";
            const isCurrent = globalIdx === input.length;
            if (globalIdx < input.length) {
                cls += normalizeChar(input[globalIdx]) === normalizeChar(word[c]) ? " correct" : " incorrect";
            } else if (isCurrent) {
                cls += " current";
                if (needsShift(word[c])) {
                    cls += " shift-needed";
                }
            }
            wordHtml += `<span class="${cls}">${escapeHtml(word[c])}</span>`;
        }

        charIndex += word.length;

        const spaceIdx = charIndex;
        if (spaceIdx < fullText.length) {
            let spaceCls = "char space";
            const isCurrent = spaceIdx === input.length;
            if (spaceIdx < input.length) {
                spaceCls += input[spaceIdx] === " " ? " correct" : " incorrect";
            } else if (isCurrent) {
                spaceCls += " current";
            }
            wordHtml += `<span class="${spaceCls}">&nbsp;</span>`;
            charIndex += 1;
        }

        wordHtml += `</span>`;
        html += wordHtml;
    }

    els.wordsInner.innerHTML = html;

    const typedCount = input.trim() === "" ? 0 : input.split(" ").length;
    const totalToType = state.mode === "time" ? 0 : getTargetCount();
    if (totalToType > 0) {
        els.progressDisplay.textContent = `${Math.min(typedCount, totalToType)}/${totalToType}`;
        els.progressFill.style.width = `${Math.min(100, (typedCount / totalToType) * 100)}%`;
    } else {
        els.progressDisplay.textContent = `${typedCount}`;
        els.progressFill.style.width = `0%`;
    }

    updateView();
    updateKeyboard();
}

function updateView() {
    const currentChar = els.wordsInner.querySelector(".char.current");
    if (!currentChar) {
        els.wordsInner.style.transform = "translateY(0)";
        return;
    }

    const innerStyle = getComputedStyle(els.wordsInner);
    const lineHeight = parseFloat(innerStyle.lineHeight);
    if (!lineHeight || isNaN(lineHeight)) return;

    const paddingTop = parseFloat(innerStyle.paddingTop) || 0;
    const charTop = currentChar.offsetTop;
    const relativeTop = charTop - paddingTop;

    let lineIndex = Math.floor(relativeTop / lineHeight);
    if (lineIndex < 0) lineIndex = 0;

    const offset = Math.max(0, lineIndex - 1) * lineHeight;
    els.wordsInner.style.transform = offset > 0 ? `translateY(-${offset}px)` : "translateY(0)";
}

function renderKeyboard() {
    if (!els.keyboard) return;
    els.keyboard.innerHTML = KEYBOARD_LAYOUT.map(row => `
        <div class="vkeyboard-row">
            ${row.map(k => `
                <div class="vkey" data-code="${k.code}"${k.w ? ` data-wide="${k.w}"` : ''}${k.modifier ? ` data-modifier="${k.modifier}"` : ''}>${escapeHtml(k.label)}</div>
            `).join('')}
        </div>
    `).join('');
}

function getNextChar() {
    const fullText = getFullText();
    return fullText[state.input.length] || null;
}

function charToCode(ch) {
    if (!ch) return null;
    const lower = ch.toLowerCase();
    return CHAR_TO_CODE[lower] || CHAR_TO_CODE[ch] || null;
}

function highlightTargetKey() {
    if (!els.keyboard) return;
    els.keyboard.querySelectorAll('.vkey').forEach(k => {
        k.classList.remove('target', 'pressed');
    });

    if (state.isDone) return;
    if (!state.startTime) return;

    const ch = getNextChar();
    if (!ch) return;

    const code = charToCode(ch);
    if (!code) return;

    const key = els.keyboard.querySelector(`[data-code="${code}"]`);
    if (key) key.classList.add('target');

    if (needsShift(ch)) {
        els.keyboard.querySelectorAll('[data-modifier="shift"]').forEach(k => {
            k.classList.add('target');
        });
    }
}

function flashKey(code, type) {
    if (!els.keyboard || !code) return;
    const key = els.keyboard.querySelector(`[data-code="${code}"]`);
    if (!key) return;
    key.classList.add(type + '-flash');
    setTimeout(() => key.classList.remove(type + '-flash'), 400);
}

function highlightPhysical(e, pressed) {
    if (!els.keyboard) return;
    const key = els.keyboard.querySelector(`[data-code="${e.code}"]`);
    if (key) key.classList.toggle('pressed', pressed);

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

function updateKeyboard() {
    highlightTargetKey();
}

function startTimer() {
    if (state.startTime) return;
    state.startTime = Date.now();
    state.timerInterval = setInterval(() => {
        const elapsed = (Date.now() - state.startTime) / 1000;
        els.timeDisplay.textContent = elapsed.toFixed(1);
        updateStats();

        if (state.mode === "time" && elapsed >= state.timeLimit) {
            finish();
        }
    }, 100);
}

function calcAccuracy() {
    if (state.totalTyped === 0) return 100;
    return Math.round(((state.totalTyped - state.errorCount) / state.totalTyped) * 100);
}

function calcCleanAccuracy() {
    const fullText = getFullText();
    const input = state.input;
    if (!input.length) return 100;
    let clean = 0;
    for (let i = 0; i < input.length; i++) {
        if (normalizeChar(input[i]) === normalizeChar(fullText[i])) clean++;
    }
    return Math.round((clean / input.length) * 100);
}

function calcWpm(elapsedSeconds) {
    const minutes = elapsedSeconds / 60;
    if (minutes <= 0) return 0;
    const correctChars = state.input.length - state.errorCount;
    return Math.round((correctChars / 5) / minutes);
}

function updateStats() {
    if (!state.startTime) return;
    const elapsed = (Date.now() - state.startTime) / 1000;
    const wpm = calcWpm(elapsed);
    const acc = calcAccuracy();

    els.wpm.textContent = wpm;
    els.accuracy.textContent = acc + "%";

    els.wpm.classList.remove("dim");
    els.accuracy.classList.remove("dim");
    els.timeDisplay.classList.remove("dim");
    els.progressDisplay.classList.remove("dim");
}

function finish() {
    if (state.isDone) return;
    state.isDone = true;
    clearInterval(state.timerInterval);
    state.timerInterval = null;

    const elapsed = state.startTime ? (Date.now() - state.startTime) / 1000 : 0;
    const wpm = calcWpm(elapsed);
    const acc = calcAccuracy();
    const cleanAcc = calcCleanAccuracy();

    els.finalWpm.textContent = wpm;
    els.finalAccuracy.textContent = acc + "%";
    els.finalTime.textContent = elapsed.toFixed(1) + "s";
    els.finalCleanAccuracy.textContent = cleanAcc + "%";

    els.overlay.classList.add("visible");
    els.section.classList.add("done");

    saveHistory({ wpm, accuracy: acc, cleanAccuracy: cleanAcc, time: elapsed, mode: state.mode, lang: state.lang, date: Date.now() });
    saveSessionErrors();
    updateHistoryDisplay();
    updateErrorHint();
    lockChips();
    highlightTargetKey();
}

function saveHistory(result) {
    try {
        const history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
        history.push(result);
        while (history.length > HISTORY_MAX) history.shift();
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (e) { }
}

function getHistory() {
    try {
        return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
    } catch {
        return [];
    }
}

function saveSessionErrors() {
    const keys = Object.keys(state.sessionErrors);
    if (!keys.length) return;
    try {
        const stored = JSON.parse(localStorage.getItem(ERRORS_KEY)) || {};
        keys.forEach(k => {
            stored[k] = (stored[k] || 0) + state.sessionErrors[k];
        });
        localStorage.setItem(ERRORS_KEY, JSON.stringify(stored));
    } catch (e) { }
}

function getTopErrors(n) {
    try {
        const stored = JSON.parse(localStorage.getItem(ERRORS_KEY)) || {};
        return Object.entries(stored)
            .sort((a, b) => b[1] - a[1])
            .slice(0, n);
    } catch {
        return [];
    }
}

function modeLabel(mode) {
    if (mode === "words") return "Слова";
    if (mode === "time") return "Время";
    if (mode === "symbols") return "Знаки";
    if (mode === "code") return "Код";
    return mode;
}

function langLabel(lang) {
    if (lang === "ru") return "RU";
    if (lang === "en") return "EN";
    return "MIX";
}

function updateHistoryDisplay() {
    if (!els.historyList) return;
    const history = getHistory();
    if (!history.length) {
        els.historyEmpty.hidden = false;
        els.historyList.innerHTML = '';
        return;
    }
    els.historyEmpty.hidden = true;

    els.historyList.innerHTML = history.map(item => `
        <div class="typing-history-item">
            <div class="typing-history-value">${item.wpm}</div>
            <div class="typing-history-meta">
                <span>${item.accuracy}%</span>
                <span>${item.cleanAccuracy || item.accuracy}% чистых</span>
                <span>${item.time.toFixed(1)}с</span>
            </div>
            <div class="typing-history-tags">
                <span class="typing-history-tag">${modeLabel(item.mode)}</span>
                <span class="typing-history-tag">${langLabel(item.lang)}</span>
            </div>
        </div>
    `).reverse().join('');
}

function updateErrorHint() {
    if (!els.errorHintList) return;
    const top = getTopErrors(3);
    if (!top.length) {
        els.errorHintEmpty.hidden = false;
        els.errorHintList.innerHTML = '';
        return;
    }
    els.errorHintEmpty.hidden = true;

    const display = (ch) => {
        if (ch === ' ') return 'пробел';
        if (ch === '\n') return 'Enter';
        return `«${escapeHtml(ch)}»`;
    };

    els.errorHintList.innerHTML = top.map(([ch, count]) => `
        <div class="typing-error-item">
            <span class="typing-error-char">${display(ch)}</span>
            <span class="typing-error-count">${count} раз</span>
        </div>
    `).join('');
}

function lockChips() {
    els.chips.forEach(chip => {
        chip.classList.add('locked');
        chip.disabled = true;
    });
}

function unlockChips() {
    els.chips.forEach(chip => {
        chip.classList.remove('locked');
        chip.disabled = false;
    });
}

function reset() {
    clearInterval(state.timerInterval);
    state.input = "";
    state.startTime = null;
    state.timerInterval = null;
    state.errorCount = 0;
    state.totalTyped = 0;
    state.isDone = false;
    state.focused = false;
    state.sessionErrors = {};

    els.wpm.textContent = "0";
    els.accuracy.textContent = "100%";
    els.timeDisplay.textContent = "0.0";
    els.wpm.classList.add("dim");
    els.accuracy.classList.add("dim");
    els.timeDisplay.classList.add("dim");
    els.progressDisplay.classList.add("dim");
    els.overlay.classList.remove("visible");
    els.words.classList.remove("focused");
    els.focusPrompt.classList.remove("hidden");
    els.wordsInner.style.transform = "translateY(0)";
    els.section.classList.remove("done");

    unlockChips();
    generateWords();
    updateHistoryDisplay();
    updateErrorHint();
}

function handleKey(e) {
    if (state.isDone) {
        if ((e.key === "Tab" && e.shiftKey) || e.key === "Escape") {
            e.preventDefault();
            reset();
        }
        return;
    }

    if (e.key === "Tab" && e.shiftKey) {
        e.preventDefault();
        reset();
        return;
    }

    if (e.key === "Escape") {
        e.preventDefault();
        reset();
        return;
    }

    if (!state.focused) {
        if (e.key.length === 1 || e.key === "Backspace" || e.key === " ") {
            state.focused = true;
            els.focusPrompt.classList.add("hidden");
            els.words.classList.add("focused");
        } else {
            return;
        }
    }

    if (e.key === "Backspace") {
        e.preventDefault();
        if (state.strict) return;
        if (state.input.length > 0) {
            state.input = state.input.slice(0, -1);
            render();
            updateStats();
        }
        return;
    }

    if (e.key.length === 1) {
        e.preventDefault();
        const fullText = getFullText();

        if (state.input.length >= fullText.length && state.mode === "time") {
            return;
        }

        if (!state.startTime) startTimer();

        const expected = fullText[state.input.length];
        state.totalTyped++;

        if (normalizeChar(e.key) !== normalizeChar(expected)) {
            state.errorCount++;
            const key = expected === " " ? " " : expected;
            state.sessionErrors[key] = (state.sessionErrors[key] || 0) + 1;
            flashKey(e.code, 'wrong');

            if (state.strict) {
                updateStats();
                return;
            }
        } else {
            flashKey(e.code, 'correct');
        }

        state.input += e.key;
        render();
        updateStats();

        if (state.mode === "time") {
            extendWordsIfNeeded();
        }

        if (state.mode !== "time" && state.input.length >= fullText.length) {
            finish();
        }
    }
}

function onKeyDownRaw(e) {
    if (!state.focused) return;
    highlightPhysical(e, true);
}

function onKeyUpRaw(e) {
    highlightPhysical(e, false);
    if (!e.ctrlKey) els.keyboard.querySelectorAll('[data-modifier="ctrl"]').forEach(n => n.classList.remove('pressed'));
    if (!e.altKey) els.keyboard.querySelectorAll('[data-modifier="alt"]').forEach(n => n.classList.remove('pressed'));
    if (!e.shiftKey) els.keyboard.querySelectorAll('[data-modifier="shift"]').forEach(n => n.classList.remove('pressed'));
    if (!e.metaKey) els.keyboard.querySelectorAll('[data-modifier="meta"]').forEach(n => n.classList.remove('pressed'));
}

function bindChipGroup(selector, attr, onChange) {
    document.querySelectorAll(selector).forEach(chip => {
        chip.addEventListener("click", () => {
            if (chip.disabled) return;
            const value = chip.dataset[attr];
            if (value !== undefined) {
                document.querySelectorAll(selector).forEach(c => c.classList.remove("active"));
                chip.classList.add("active");
                onChange(value);
            }
        });
    });
}

function bindEvents() {
    bindChipGroup('[data-lang]', 'lang', v => {
        state.lang = v;
        if (!state.startTime) reset();
    });

    bindChipGroup('[data-mode]', 'mode', v => {
        state.mode = v;
        els.wordsGroup.style.display = v === "words" ? "flex" : "none";
        els.timeGroup.style.display = v === "time" ? "flex" : "none";
        reset();
    });

    bindChipGroup('#wordsGroup [data-count]', 'count', v => {
        state.wordCount = parseInt(v, 10);
        reset();
    });

    bindChipGroup('#timeGroup [data-time]', 'time', v => {
        state.timeLimit = parseInt(v, 10);
        reset();
    });

    if (els.strictToggle) {
        els.strictToggle.addEventListener('click', () => {
            if (els.strictToggle.disabled) return;
            state.strict = !state.strict;
            els.strictToggle.classList.toggle('active', state.strict);
            reset();
        });
    }

    els.restartBtn.addEventListener("click", reset);
    els.restartOverlay.addEventListener("click", reset);

    els.words.addEventListener("click", () => {
        state.focused = true;
        els.focusPrompt.classList.add("hidden");
        els.words.classList.add("focused");
    });

    els.focusPrompt.addEventListener("click", () => {
        state.focused = true;
        els.focusPrompt.classList.add("hidden");
        els.words.classList.add("focused");
    });

    document.addEventListener("keydown", onKeyDownRaw, true);
    document.addEventListener("keyup", onKeyUpRaw, true);
    document.addEventListener("keydown", handleKey);
}

function checkMobile() {
    if (!els.mobileWarning) return;
    const isTouch = window.matchMedia('(hover: none)').matches || 'ontouchstart' in window;
    if (isTouch) {
        els.mobileWarning.hidden = false;
    }
}

async function init() {
    cacheElements();
    checkMobile();
    await loadWords();
    renderKeyboard();
    bindEvents();
    reset();
}

init();