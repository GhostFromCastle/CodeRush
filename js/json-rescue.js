const DATA_URL = '../../data/json-rescue.json';
const MAX_STRIKES = 3;

const state = {
    allTasks: [],
    currentTask: null,
    mode: 'easy',
    strikes: 0,
    streak: 0,
    solved: 0,
    progressiveLevel: 'easy',
    isAnimating: false
};

const els = {};

function cacheElements() {
    els.section = document.getElementById('jsonRescue');
    if (!els.section) return;

    els.textarea = document.getElementById('jsonInput');
    els.checkBtn = document.getElementById('checkBtn');
    els.resetBtn = document.getElementById('resetBtn');
    els.hintBtn = document.getElementById('hintBtn');
    els.giveUpBtn = document.getElementById('giveUpBtn');
    
    els.taskBadge = document.getElementById('taskBadge');
    els.statErrors = document.getElementById('statErrors');
    els.statStreak = document.getElementById('statStreak');
    els.statSolved = document.getElementById('statSolved');
    
    els.alertBox = document.getElementById('alertBox');
    els.solutionBox = document.getElementById('solutionBox');
    els.solutionCode = document.getElementById('solutionCode');
    els.nextTaskBtn = document.getElementById('nextTaskBtn');
    
    els.modeBtns = document.querySelectorAll('.json-mode-btn');
    els.editorCard = document.querySelector('.json-editor-card');
}

async function loadData() {
    try {
        const response = await fetch(DATA_URL, { cache: 'no-cache' });
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        if (!data || !Array.isArray(data.tasks)) throw new Error('Invalid shape');
        state.allTasks = data.tasks;
    } catch (error) {
        console.warn('Не удалось загрузить задания:', error);
        state.allTasks = [
            { id: "e1", level: "easy", broken: "{\n  'name': 'Alex'\n}", expected: { "name": "Alex" } }
        ];
    }
}

function deepEqual(a, b) {
    if (a === b) return true;
    if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return false;
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    if (Array.isArray(a)) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (!deepEqual(a[i], b[i])) return false;
        }
        return true;
    }
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
        if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
        if (!deepEqual(a[key], b[key])) return false;
    }
    return true;
}

function getRandomTask(level) {
    let pool = state.allTasks;
    if (level !== 'random' && level !== 'progressive') {
        pool = state.allTasks.filter(t => t.level === level);
    } else if (level === 'progressive') {
        pool = state.allTasks.filter(t => t.level === state.progressiveLevel);
    }
    
    if (pool.length === 0) return state.allTasks[0];
    return pool[Math.floor(Math.random() * pool.length)];
}

function updateUI() {
    els.statErrors.textContent = `${state.strikes} / ${MAX_STRIKES}`;
    els.statErrors.className = `json-stat-value ${state.strikes > 0 ? 'red' : ''}`;
    els.statStreak.textContent = state.streak;
    els.statSolved.textContent = state.solved;
}

function showAlert(message, type) {
    els.alertBox.className = `json-alert ${type}`;
    els.alertBox.innerHTML = message;
    els.alertBox.hidden = false;
    
    els.alertBox.style.animation = 'none';
    void els.alertBox.offsetWidth;
    els.alertBox.style.animation = 'slideInDown 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards';
}

function clearAlert() {
    els.alertBox.hidden = true;
    els.alertBox.innerHTML = '';
}

function lockControls() {
    els.checkBtn.disabled = true;
    els.hintBtn.disabled = true;
    els.giveUpBtn.disabled = true;
    els.textarea.disabled = true;
}

function unlockControls() {
    els.checkBtn.disabled = false;
    els.hintBtn.disabled = false;
    els.giveUpBtn.disabled = false;
    els.textarea.disabled = false;
}

function showSolution() {
    els.solutionCode.textContent = JSON.stringify(state.currentTask.expected, null, 2);
    els.solutionBox.hidden = false;
    lockControls();
}

function loadNextTask() {
    if (state.isAnimating) return;
    state.isAnimating = true;

    els.editorCard.classList.add('json-fade-out');
    if (!els.solutionBox.hidden) {
        els.solutionBox.classList.add('json-fade-out');
    }

    setTimeout(() => {
        state.strikes = 0;
        clearAlert();
        els.solutionBox.hidden = true;
        unlockControls();
        
        state.currentTask = getRandomTask(state.mode);
        els.taskBadge.textContent = `Сложность: ${state.currentTask.level.toUpperCase()}`;
        els.textarea.value = state.currentTask.broken;
        updateUI();

        els.editorCard.classList.remove('json-fade-out');
        els.solutionBox.classList.remove('json-fade-out');
        
        setTimeout(() => {
            state.isAnimating = false;
        }, 300);

    }, 300);
}

function checkJson() {
    const input = els.textarea.value;
    let parsed;

    try {
        parsed = JSON.parse(input);
    } catch (error) {
        state.strikes++;
        state.streak = 0;
        updateUI();

        if (state.strikes >= MAX_STRIKES) {
            showAlert(`<i class="ph ph-x-circle"></i> <strong>Лимит попыток исчерпан!</strong><br>Правильный ответ показан ниже.`, 'error');
            showSolution();
            return;
        }

        showAlert(`<i class="ph ph-warning"></i> <strong>Ошибка синтаксиса:</strong> ${error.message}`, 'error');
        return;
    }

    if (deepEqual(parsed, state.currentTask.expected)) {
        state.solved++;
        state.streak++;
        
        showAlert(`<i class="ph ph-check-circle"></i> <strong>Отлично!</strong> JSON валиден и структура совпадает.`, 'success');
        els.checkBtn.disabled = true;
        els.textarea.disabled = true;

        if (state.mode === 'progressive') {
            if (state.progressiveLevel === 'easy') state.progressiveLevel = 'medium';
            else if (state.progressiveLevel === 'medium') state.progressiveLevel = 'hard';
        }

        setTimeout(() => {
            loadNextTask();
        }, 1500);

    } else {
        state.strikes++;
        state.streak = 0;
        updateUI();

        if (state.strikes >= MAX_STRIKES) {
            showAlert(`<i class="ph ph-x-circle"></i> <strong>Лимит попыток исчерпан!</strong><br>JSON валиден, но структура не совпадает с ожидаемой.`, 'error');
            showSolution();
            return;
        }

        showAlert(`<i class="ph ph-info"></i> <strong>Структура не совпадает.</strong> JSON прочитан успешно, но данные отличаются. Проверьте ключи, типы и значения.`, 'error');
    }
}

function bindEvents() {
    els.checkBtn.addEventListener('click', checkJson);
    
    els.resetBtn.addEventListener('click', () => {
        if (state.currentTask) els.textarea.value = state.currentTask.broken;
        state.strikes = 0;
        clearAlert();
        els.solutionBox.hidden = true;
        unlockControls();
        updateUI();
    });
    
    els.hintBtn.addEventListener('click', () => {
        showAlert(`<i class="ph ph-lightbulb"></i> <strong>Подсказка:</strong> Обратите внимание на кавычки, запятые в конце объектов/массивов и правильность вложенности скобок.`, 'hint');
    });

    els.giveUpBtn.addEventListener('click', () => {
        state.strikes = MAX_STRIKES;
        updateUI();
        showAlert(`<i class="ph ph-flag"></i> Вы сдались. Изучите правильный ответ.`, 'error');
        showSolution();
    });

    els.nextTaskBtn.addEventListener('click', loadNextTask);

    els.modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (state.isAnimating) return;
            
            els.modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.mode = btn.dataset.mode;
            
            if (state.mode === 'progressive') state.progressiveLevel = 'easy';
            
            loadNextTask();
        });
    });

    els.textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = els.textarea.selectionStart;
            const end = els.textarea.selectionEnd;
            els.textarea.value = els.textarea.value.substring(0, start) + '  ' + els.textarea.value.substring(end);
            els.textarea.selectionStart = els.textarea.selectionEnd = start + 2;
        }
    });
}

async function init() {
    cacheElements();
    if (!els.section) return;
    
    await loadData();
    bindEvents();
    
    state.currentTask = getRandomTask(state.mode);
    els.taskBadge.textContent = `Сложность: ${state.currentTask.level.toUpperCase()}`;
    els.textarea.value = state.currentTask.broken;
    updateUI();
}

init();