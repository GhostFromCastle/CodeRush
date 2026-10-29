const state = {
    base: 10,
    textDirection: 'toBinary'
};

const MAX_INPUT_LEN = 256;

const BASE_REGEX = {
    2: /^[01]+$/,
    8: /^[0-7]+$/,
    10: /^\d+$/,
    16: /^[0-9a-fA-F]+$/
};

const EN_ASCII_ROWS = [
    { ch: 'A', dec: 65 },
    { ch: 'B', dec: 66 },
    { ch: 'C', dec: 67 },
    { ch: 'a', dec: 97 },
    { ch: 'b', dec: 98 },
    { ch: 'c', dec: 99 },
    { ch: '0', dec: 48 },
    { ch: '1', dec: 49 },
    { ch: '2', dec: 50 },
    { ch: ' ', dec: 32, label: 'Пробел' },
    { ch: '!', dec: 33 },
    { ch: '?', dec: 63 }
];

const RU_ENCODING_ROWS = {
    utf8: [
        { ch: 'А', hex: 'D0 90', bin: '11010000 10010000' },
        { ch: 'Б', hex: 'D0 91', bin: '11010000 10010001' },
        { ch: 'В', hex: 'D0 92', bin: '11010000 10010010' },
        { ch: 'Г', hex: 'D0 93', bin: '11010000 10010011' },
        { ch: 'Д', hex: 'D0 94', bin: '11010000 10010100' },
        { ch: 'а', hex: 'D0 B0', bin: '11010000 10110000' },
        { ch: 'б', hex: 'D0 B1', bin: '11010000 10110001' },
        { ch: 'в', hex: 'D0 B2', bin: '11010000 10110010' },
        { ch: 'г', hex: 'D0 B3', bin: '11010000 10110011' },
        { ch: 'д', hex: 'D0 B4', bin: '11010000 10110100' },
        { ch: 'ё', hex: 'D1 91', bin: '11010001 10010001' },
        { ch: 'Ё', hex: 'D0 81', bin: '11010000 10000001' }
    ],
    cp1251: [
        { ch: 'А', hex: 'C0', bin: '11000000' },
        { ch: 'Б', hex: 'C1', bin: '11000001' },
        { ch: 'В', hex: 'C2', bin: '11000010' },
        { ch: 'Г', hex: 'C3', bin: '11000011' },
        { ch: 'Д', hex: 'C4', bin: '11000100' },
        { ch: 'а', hex: 'E0', bin: '11100000' },
        { ch: 'б', hex: 'E1', bin: '11100001' },
        { ch: 'в', hex: 'E2', bin: '11100010' },
        { ch: 'г', hex: 'E3', bin: '11100011' },
        { ch: 'д', hex: 'E4', bin: '11100100' },
        { ch: 'ё', hex: 'B8', bin: '10111000' },
        { ch: 'Ё', hex: 'A8', bin: '10101000' }
    ]
};

const els = {};

function cacheElements() {
    els.section = document.querySelector('.ns-section');
    if (!els.section) return;

    els.tabs = document.querySelectorAll('.ns-tab');
    els.views = document.querySelectorAll('.ns-view');
    
    els.input = document.getElementById('nsInput');
    els.baseBtns = document.querySelectorAll('.ns-base-btn');
    els.res10 = document.getElementById('res10');
    els.res2 = document.getElementById('res2');
    els.res8 = document.getElementById('res8');
    els.res16 = document.getElementById('res16');
    els.error = document.getElementById('nsError');

    els.textInput = document.getElementById('textInput');
    els.inputLabel = document.getElementById('inputLabel');
    els.outputLabel = document.getElementById('outputLabel');
    els.binaryOutput = document.getElementById('binaryOutput');
    els.copyBtn = document.getElementById('copyBinary');
    els.swapBtn = document.getElementById('swapBtn');

    els.ruEncodingSelect = document.getElementById('ruEncodingSelect');
    els.ruEncodingBody = document.getElementById('ruEncodingBody');
    els.enEncodingBody = document.getElementById('enEncodingBody');
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function switchTab(tabId) {
    els.tabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabId);
    });
    els.views.forEach(view => {
        view.classList.toggle('active', view.dataset.view === tabId);
    });
}

function parseInBase(str, base) {
    const negative = str.startsWith('-');
    const clean = negative ? str.slice(1) : str;
    if (!clean) throw new Error('empty');
    if (clean.length > MAX_INPUT_LEN) throw new Error('too long');
    const regex = BASE_REGEX[base];
    if (!regex || !regex.test(clean)) throw new Error('invalid');

    let value = 0n;
    const baseBig = BigInt(base);
    for (const ch of clean) {
        const digit = parseInt(ch, 16);
        value = value * baseBig + BigInt(digit);
    }
    return negative ? -value : value;
}

function convertNumber() {
    const raw = els.input.value.trim();
    if (!raw) {
        clearResults();
        els.error.hidden = true;
        return;
    }

    try {
        const value = parseInBase(raw, state.base);
        els.res10.textContent = value.toString(10);
        els.res2.textContent = value.toString(2);
        els.res8.textContent = value.toString(8);
        els.res16.textContent = value.toString(16).toUpperCase();
        els.error.hidden = true;
    } catch (err) {
        clearResults();
        if (err.message === 'too long') {
            els.error.textContent = `Число слишком длинное (максимум ${MAX_INPUT_LEN} символов)`;
        } else {
            els.error.textContent = 'Некорректный ввод для выбранной системы счисления';
        }
        els.error.hidden = false;
    }
}

function clearResults() {
    els.res10.textContent = '-';
    els.res2.textContent = '-';
    els.res8.textContent = '-';
    els.res16.textContent = '-';
}

function renderEnTable() {
    if (!els.enEncodingBody) return;
    els.enEncodingBody.innerHTML = EN_ASCII_ROWS.map(r => {
        const display = r.label || r.ch;
        const bin = r.dec.toString(2).padStart(8, '0');
        return `<tr><td>${escapeHtml(display)}</td><td>${r.dec}</td><td>${bin}</td></tr>`;
    }).join('');
}

function renderRuTable() {
    if (!els.ruEncodingBody || !els.ruEncodingSelect) return;
    const encoding = els.ruEncodingSelect.value;
    const rows = RU_ENCODING_ROWS[encoding] || RU_ENCODING_ROWS.utf8;
    els.ruEncodingBody.innerHTML = rows.map(r => {
        return `<tr><td>${escapeHtml(r.ch)}</td><td>${escapeHtml(r.hex)}</td><td>${escapeHtml(r.bin)}</td></tr>`;
    }).join('');
}

function renderEncodingTables() {
    renderEnTable();
    renderRuTable();
}

function processText() {
    const val = els.textInput.value;
    if (!val.trim()) {
        els.binaryOutput.textContent = 'Здесь появится результат...';
        return;
    }

    try {
        if (state.textDirection === 'toBinary') {
            const encoder = new TextEncoder();
            const bytes = encoder.encode(val);
            const binary = Array.from(bytes).map(byte => byte.toString(2).padStart(8, '0')).join(' ');
            els.binaryOutput.textContent = binary;
        } else {
            let cleanBin = val.replace(/\s+/g, '');
            if (!/^[01]+$/.test(cleanBin)) {
                els.binaryOutput.textContent = 'Ошибка: текст должен содержать только 0 и 1.';
                return;
            }
            if (cleanBin.length % 8 !== 0) {
                els.binaryOutput.textContent = 'Ошибка: количество символов должно быть кратно 8.';
                return;
            }

            const bytes = [];
            for (let i = 0; i < cleanBin.length; i += 8) {
                const byteStr = cleanBin.slice(i, i + 8);
                bytes.push(parseInt(byteStr, 2));
            }
            const decoder = new TextDecoder();
            const result = decoder.decode(new Uint8Array(bytes));
            els.binaryOutput.textContent = result;
        }
    } catch {
        els.binaryOutput.textContent = 'Ошибка при обработке данных.';
    }
}

function toggleDirection() {
    const currentOutput = els.binaryOutput.textContent;
    let textToMove = '';

    if (currentOutput && currentOutput !== 'Здесь появится результат...' && !currentOutput.startsWith('Ошибка')) {
        textToMove = currentOutput;
    }

    state.textDirection = state.textDirection === 'toBinary' ? 'toText' : 'toBinary';
    
    if (state.textDirection === 'toBinary') {
        els.inputLabel.textContent = 'Введите текст';
        els.outputLabel.textContent = 'Бинарный код';
        els.textInput.placeholder = 'Привет, мир!';
        els.swapBtn.classList.remove('rotated');
    } else {
        els.inputLabel.textContent = 'Введите бинарный код';
        els.outputLabel.textContent = 'Расшифрованный текст';
        els.textInput.placeholder = '01001000 01101001';
        els.swapBtn.classList.add('rotated');
    }
    
    if (textToMove) {
        els.textInput.value = textToMove;
    }
    
    processText();
}

function copyBinary() {
    const text = els.binaryOutput.textContent;
    if (!text || text === 'Здесь появится результат...' || text.startsWith('Ошибка')) {
        return;
    }

    const done = () => {
        const original = els.copyBtn.innerHTML;
        els.copyBtn.innerHTML = '<i class="ph-fill ph-check-circle" style="color: var(--accent-green);"></i>';
        setTimeout(() => {
            els.copyBtn.innerHTML = original;
        }, 1500);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
    } else {
        fallbackCopy(text, done);
    }
}

function fallbackCopy(text, done) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
        document.execCommand('copy');
        done();
    } catch (e) { }
    document.body.removeChild(ta);
}

function bindEvents() {
    els.tabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    els.input.addEventListener('input', convertNumber);

    els.baseBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            els.baseBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.base = parseInt(btn.dataset.base, 10);
            convertNumber();
        });
    });

    els.textInput.addEventListener('input', processText);
    els.copyBtn.addEventListener('click', copyBinary);
    els.swapBtn.addEventListener('click', toggleDirection);

    if (els.ruEncodingSelect) {
        els.ruEncodingSelect.addEventListener('change', renderRuTable);
    }
}

function init() {
    cacheElements();
    if (!els.section) return;
    bindEvents();
    renderEncodingTables();
}

init();