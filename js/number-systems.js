const state = {
    base: 10,
    textDirection: 'toBinary'
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
}

function switchTab(tabId) {
    els.tabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabId);
    });
    els.views.forEach(view => {
        view.classList.toggle('active', view.dataset.view === tabId);
    });
}

function convertNumber() {
    const raw = els.input.value.trim();
    if (!raw) {
        clearResults();
        return;
    }

    try {
        let num;
        if (state.base === 10) {
            if (!/^-?\d+$/.test(raw)) throw new Error();
            num = parseInt(raw, 10);
        } else if (state.base === 2) {
            if (!/^[01]+$/.test(raw)) throw new Error();
            num = parseInt(raw, 2);
        } else if (state.base === 8) {
            if (!/^[0-7]+$/.test(raw)) throw new Error();
            num = parseInt(raw, 8);
        } else if (state.base === 16) {
            if (!/^[0-9a-fA-F]+$/.test(raw)) throw new Error();
            num = parseInt(raw, 16);
        }

        if (isNaN(num)) throw new Error();

        els.res10.textContent = num.toString(10);
        els.res2.textContent = num.toString(2);
        els.res8.textContent = num.toString(8);
        els.res16.textContent = num.toString(16).toUpperCase();
        els.error.hidden = true;
    } catch {
        clearResults();
        els.error.hidden = false;
    }
}

function clearResults() {
    els.res10.textContent = '-';
    els.res2.textContent = '-';
    els.res8.textContent = '-';
    els.res16.textContent = '-';
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
    if (text && text !== 'Здесь появится результат...' && !text.startsWith('Ошибка')) {
        navigator.clipboard.writeText(text).then(() => {
            const original = els.copyBtn.innerHTML;
            els.copyBtn.innerHTML = '<i class="ph-fill ph-check-circle" style="color: var(--accent-green);"></i>';
            setTimeout(() => {
                els.copyBtn.innerHTML = original;
            }, 1500);
        });
    }
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
}

function init() {
    cacheElements();
    if (!els.section) return;
    bindEvents();
}

init();