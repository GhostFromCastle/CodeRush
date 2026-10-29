const CHARS = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    digits: '0123456789',
    symbols: '!@#$%^&*()-_=+[]{};:,.<>?'
};

const COMMON_PASSWORDS = new Set([
    'password', '123456', '12345678', 'qwerty', 'abc123', 'monkey', 'letmein',
    'dragon', '111111', 'iloveyou', 'admin', 'welcome', 'login', 'passw0rd',
    'master', 'hello', 'freedom', 'whatever', 'qazwsx', 'trustno1', '1234567890',
    'qwerty123', '123456789', '1q2w3e4r', 'sunshine', 'princess', 'football',
    'baseball', 'shadow', 'superman', 'michael', 'batman', 'computer',
    'пароль', 'йцукен', 'привет', 'любовь'
]);

const state = {
    length: 16,
    useUpper: true,
    useLower: true,
    useDigits: true,
    useSymbols: true
};

const els = {};

function cacheElements() {
    els.section = document.getElementById('passwordGenerator');
    if (!els.section) return;
    els.output = document.getElementById('passwordOutput');
    els.copyBtn = document.getElementById('copyPasswordBtn');
    els.slider = document.getElementById('lengthSlider');
    els.lengthValue = document.getElementById('lengthValue');
    els.useUpper = document.getElementById('useUpper');
    els.useLower = document.getElementById('useLower');
    els.useDigits = document.getElementById('useDigits');
    els.useSymbols = document.getElementById('useSymbols');
    els.strengthFill = document.getElementById('strengthFill');
    els.strengthLabel = document.getElementById('strengthLabel');
    els.strengthBits = document.getElementById('strengthBits');
    els.generateBtn = document.getElementById('generateBtn');
    els.resetBtn = document.getElementById('resetBtn');
}

function randomInt(max) {
    if (max <= 0) return 0;
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
        const values = new Uint32Array(1);
        const limit = Math.floor(0x100000000 / max) * max;
        let v;
        do {
            crypto.getRandomValues(values);
            v = values[0];
        } while (v >= limit);
        return v % max;
    }
    console.warn('crypto.getRandomValues недоступен - используется Math.random (не криптографически стойкий)');
    return Math.floor(Math.random() * max);
}

function buildAlphabet() {
    let alphabet = '';
    if (state.useUpper) alphabet += CHARS.upper;
    if (state.useLower) alphabet += CHARS.lower;
    if (state.useDigits) alphabet += CHARS.digits;
    if (state.useSymbols) alphabet += CHARS.symbols;
    return alphabet;
}

function buildGroups() {
    const groups = [];
    if (state.useUpper) groups.push(CHARS.upper);
    if (state.useLower) groups.push(CHARS.lower);
    if (state.useDigits) groups.push(CHARS.digits);
    if (state.useSymbols) groups.push(CHARS.symbols);
    return groups;
}

function generatePassword() {
    const groups = buildGroups();
    if (!groups.length) return '';

    const all = groups.join('');
    const length = Math.max(state.length, groups.length);
    const chars = [];

    for (const group of groups) {
        chars.push(group[randomInt(group.length)]);
    }

    while (chars.length < length) {
        chars.push(all[randomInt(all.length)]);
    }

    for (let i = chars.length - 1; i > 0; i--) {
        const j = randomInt(i + 1);
        const tmp = chars[i];
        chars[i] = chars[j];
        chars[j] = tmp;
    }

    return chars.join('');
}

function calcEntropy(length, alphabetSize) {
    if (alphabetSize <= 1 || length <= 0) return 0;
    return Math.round(length * Math.log2(alphabetSize));
}

function getStrengthInfo(bits) {
    if (bits < 40) {
        return { label: 'Очень слабый', color: '#ef4444', percent: 20 };
    }
    if (bits < 60) {
        return { label: 'Слабый', color: '#f59e0b', percent: 40 };
    }
    if (bits < 80) {
        return { label: 'Хороший', color: '#eab308', percent: 65 };
    }
    if (bits < 100) {
        return { label: 'Надёжный', color: '#10b981', percent: 85 };
    }
    return { label: 'Отличный', color: '#10b981', percent: 100 };
}

function updateStrength() {
    const alphabet = buildAlphabet();
    const bits = alphabet.length === 0 ? 0 : calcEntropy(state.length, alphabet.length);
    const info = alphabet.length === 0
        ? { label: 'Выберите набор', color: '#666', percent: 0 }
        : getStrengthInfo(bits);

    els.strengthFill.style.width = info.percent + '%';
    els.strengthFill.style.background = info.color;
    els.strengthLabel.textContent = 'Надёжность: ' + info.label;
    els.strengthBits.textContent = bits + ' бит';
}

function updateOutput(password) {
    els.output.value = password;
    els.output.classList.remove('password-output-empty');
}

function regenerate() {
    const password = generatePassword();
    if (password) {
        updateOutput(password);
    } else {
        els.output.value = 'Выберите хотя бы один набор символов';
        els.output.classList.add('password-output-empty');
    }
    updateStrength();
}

function copyToClipboard() {
    const text = els.output.value;
    if (!text || text === 'Нажмите Сгенерировать' || els.output.classList.contains('password-output-empty')) {
        return;
    }

    const done = () => {
        const original = els.copyBtn.innerHTML;
        els.copyBtn.innerHTML = '<i class="ph-fill ph-check-circle"></i>';
        els.copyBtn.classList.add('copied');
        setTimeout(() => {
            els.copyBtn.innerHTML = original;
            els.copyBtn.classList.remove('copied');
        }, 1500);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(() => {
            fallbackCopy(text, done);
        });
    } else {
        fallbackCopy(text, done);
    }
}

function fallbackCopy(text, done) {
    els.output.select();
    els.output.setSelectionRange(0, text.length);
    try {
        document.execCommand('copy');
        done();
    } catch (e) { }
}

function bindEvents() {
    els.slider.addEventListener('input', (e) => {
        state.length = parseInt(e.target.value, 10);
        els.lengthValue.textContent = state.length;
        updateStrength();
    });

    els.useUpper.addEventListener('change', (e) => {
        state.useUpper = e.target.checked;
        updateStrength();
    });
    els.useLower.addEventListener('change', (e) => {
        state.useLower = e.target.checked;
        updateStrength();
    });
    els.useDigits.addEventListener('change', (e) => {
        state.useDigits = e.target.checked;
        updateStrength();
    });
    els.useSymbols.addEventListener('change', (e) => {
        state.useSymbols = e.target.checked;
        updateStrength();
    });

    els.generateBtn.addEventListener('click', regenerate);
    els.copyBtn.addEventListener('click', copyToClipboard);

    els.resetBtn.addEventListener('click', () => {
        state.length = 16;
        state.useUpper = true;
        state.useLower = true;
        state.useDigits = true;
        state.useSymbols = true;

        els.slider.value = 16;
        els.lengthValue.textContent = '16';
        els.useUpper.checked = true;
        els.useLower.checked = true;
        els.useDigits.checked = true;
        els.useSymbols.checked = true;

        els.output.value = 'Нажмите Сгенерировать';
        els.output.classList.remove('password-output-empty');
        updateStrength();
    });
}

const checkState = {
    visible: false
};

function cacheCheckerElements() {
    const section = document.getElementById('passwordChecker');
    if (!section) return false;
    els.checkSection = section;
    els.checkInput = document.getElementById('checkInput');
    els.toggleVisibility = document.getElementById('toggleVisibility');
    els.checkStrengthFill = document.getElementById('checkStrengthFill');
    els.checkStrengthLabel = document.getElementById('checkStrengthLabel');
    els.checkStrengthBits = document.getElementById('checkStrengthBits');
    els.checkCriteria = document.getElementById('checkCriteria');
    return true;
}

function analyzePassword(password) {
    const criteria = [
        {
            id: 'length',
            label: 'Минимум 12 символов',
            test: (p) => p.length >= 12
        },
        {
            id: 'lower',
            label: 'Строчные буквы a-z',
            test: (p) => /[a-zа-яё]/.test(p)
        },
        {
            id: 'upper',
            label: 'Заглавные буквы A-Z',
            test: (p) => /[A-ZА-ЯЁ]/.test(p)
        },
        {
            id: 'digit',
            label: 'Цифры 0-9',
            test: (p) => /[0-9]/.test(p)
        },
        {
            id: 'symbol',
            label: 'Спецсимволы !@#$%',
            test: (p) => /[^a-zA-Zа-яА-ЯёЁ0-9]/.test(p)
        },
        {
            id: 'unique',
            label: 'Не из списка частых паролей',
            test: (p) => p.length > 0 && !COMMON_PASSWORDS.has(p.toLowerCase())
        }
    ];

    return criteria.map(c => ({
        id: c.id,
        label: c.label,
        passed: c.test(password)
    }));
}

function estimateAlphabetSize(password) {
    let size = 0;
    if (/[a-z]/.test(password)) size += 26;
    if (/[A-Z]/.test(password)) size += 26;
    if (/[а-яё]/.test(password)) size += 33;
    if (/[А-ЯЁ]/.test(password)) size += 33;
    if (/[0-9]/.test(password)) size += 10;
    if (/[^a-zA-Zа-яА-ЯёЁ0-9]/.test(password)) size += 33;
    return size;
}

function renderCriteria(criteria) {
    els.checkCriteria.innerHTML = criteria.map(c => `
        <div class="password-criterion ${c.passed ? 'passed' : 'failed'}">
            <i class="ph-fill ${c.passed ? 'ph-check-circle' : 'ph-x-circle'}"></i>
            <span>${c.label}</span>
        </div>
    `).join('');
}

function updateChecker() {
    const password = els.checkInput.value;

    if (!password) {
        els.checkStrengthFill.style.width = '0%';
        els.checkStrengthFill.style.background = '#666';
        els.checkStrengthLabel.textContent = 'Начните вводить пароль';
        els.checkStrengthBits.textContent = '0 бит';
        els.checkCriteria.innerHTML = '';
        return;
    }

    const alphabetSize = estimateAlphabetSize(password);
    const bits = calcEntropy(password.length, alphabetSize);
    const info = getStrengthInfo(bits);

    els.checkStrengthFill.style.width = info.percent + '%';
    els.checkStrengthFill.style.background = info.color;
    els.checkStrengthLabel.textContent = 'Надёжность: ' + info.label;
    els.checkStrengthBits.textContent = bits + ' бит';

    const criteria = analyzePassword(password);
    renderCriteria(criteria);
}

function bindCheckerEvents() {
    els.checkInput.addEventListener('input', updateChecker);

    els.toggleVisibility.addEventListener('click', () => {
        checkState.visible = !checkState.visible;
        els.checkInput.type = checkState.visible ? 'text' : 'password';
        els.toggleVisibility.classList.toggle('revealed', checkState.visible);
        els.toggleVisibility.innerHTML = checkState.visible
            ? '<i class="ph ph-eye-slash"></i>'
            : '<i class="ph ph-eye"></i>';
    });
}

function init() {
    cacheElements();
    if (!els.section) return;
    bindEvents();
    updateStrength();

    if (cacheCheckerElements()) {
        bindCheckerEvents();
    }
}

init();