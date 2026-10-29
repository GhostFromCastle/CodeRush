const DATA_URL = '../../data/debug-quest.json';

const state = {
    allTasks: [],
    filteredTasks: [],
    currentIndex: 0,
    lives: 3,
    timeLeft: 30,
    timerInterval: null,
    selectedLine: null,
    isFixing: false,
    isGameOver: false,
    language: 'all',
    mode: 'easy',
    isAnimating: false
};

const els = {};

function cacheElements() {
    els.section = document.getElementById('debugQuest');
    if (!els.section) return;

    els.langSelector = document.getElementById('debugLangSelector');
    els.modeSelector = document.getElementById('debugModeSelector');
    els.wrapper = document.getElementById('debugWrapper');
    els.codeArea = document.getElementById('debugCodeArea');
    els.taskDesc = document.getElementById('debugTaskDesc');
    els.fixesList = document.getElementById('debugFixes');
    els.livesDisplay = document.getElementById('debugLivesValue');
    els.timerDisplay = document.getElementById('debugTimerValue');
    els.levelDisplay = document.getElementById('debugLevelValue');
    els.langDisplay = document.getElementById('debugLang');
    els.editorWrapper = document.getElementById('editorWrapper');
    els.modal = document.getElementById('debugModal');
    els.modeBtns = document.querySelectorAll('.debug-mode-btn');
}

async function loadData() {
    try {
        const response = await fetch(DATA_URL, { cache: 'no-cache' });
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        state.allTasks = data.tasks;
    } catch (error) {
        console.warn('Не удалось загрузить данные, используем заглушку:', error);
        state.allTasks = [
            {
                id: "e1",
                level: "easy",
                language: "JavaScript",
                description: "Функция должна складывать два числа.",
                code: ["function sum(a, b) {", "  return a - b;", "}"],
                bugLineIndex: 1,
                correctFixIndex: 1,
                fixes: ["return a - b;", "return a + b;", "return a * b;"]
            }
        ];
    }
}

function getCorrectFixIndex(task) {
    if (!task || !Array.isArray(task.fixes) || task.fixes.length === 0) return 0;
    const idx = task.correctFixIndex;
    if (typeof idx === 'number' && Number.isInteger(idx) && idx >= 0 && idx < task.fixes.length) {
        return idx;
    }
    return 1;
}

function renderLanguageSelector() {
    const languages = ['all', ...new Set(state.allTasks.map(t => t.language))];
    
    els.langSelector.innerHTML = languages.map(lang => {
        const label = lang === 'all' ? 'Все языки' : lang;
        const active = state.language === lang ? 'active' : '';
        return `<button type="button" class="debug-lang-btn ${active}" data-lang="${lang}">${label}</button>`;
    }).join('');

    els.langSelector.querySelectorAll('.debug-lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (state.isAnimating) return;
            state.language = btn.dataset.lang;
            renderLanguageSelector();
            filterTasks();
            resetGame();
        });
    });
}

function filterTasks() {
    let filtered = state.allTasks;
    if (state.language !== 'all') {
        filtered = filtered.filter(t => t.language === state.language);
    }
    
    if (state.mode === 'progressive') {
        const easy = filtered.filter(t => t.level === 'easy').sort(() => Math.random() - 0.5);
        const medium = filtered.filter(t => t.level === 'medium').sort(() => Math.random() - 0.5);
        const hard = filtered.filter(t => t.level === 'hard').sort(() => Math.random() - 0.5);
        state.filteredTasks = [...easy, ...medium, ...hard];
    } else if (state.mode === 'random') {
        state.filteredTasks = filtered.sort(() => Math.random() - 0.5);
    } else {
        state.filteredTasks = filtered.filter(t => t.level === state.mode).sort(() => Math.random() - 0.5);
    }
}

function startTimer() {
    clearInterval(state.timerInterval);
    state.timeLeft = 30;
    els.timerDisplay.textContent = state.timeLeft;

    state.timerInterval = setInterval(() => {
        if (state.isGameOver || state.isFixing) return;
        state.timeLeft--;
        els.timerDisplay.textContent = state.timeLeft;
        if (state.timeLeft <= 0) {
            handleTimeout();
        }
    }, 1000);
}

function handleTimeout() {
    clearInterval(state.timerInterval);
    if (state.selectedLine !== null) return;
    state.lives--;
    updateLives();
    if (state.lives <= 0) {
        gameOver();
    } else {
        setTimeout(nextTask, 1000);
    }
}

function updateLives() {
    els.livesDisplay.textContent = state.lives;
}

function renderTask() {
    if (state.isAnimating) return;

    if (state.currentIndex >= state.filteredTasks.length) {
        gameWin();
        return;
    }

    state.isAnimating = true;
    els.wrapper.classList.add('fade-out');
    els.modal.classList.remove('visible');

    setTimeout(() => {
        const task = state.filteredTasks[state.currentIndex];
        els.langDisplay.textContent = task.language;
        els.taskDesc.textContent = task.description;
        els.levelDisplay.textContent = task.level.toUpperCase();
        
        state.selectedLine = null;
        state.isFixing = false;
        
        clearInterval(state.timerInterval);
        startTimer();

        els.codeArea.innerHTML = task.code.map((line, index) => {
            return `
                <div class="debug-code-line" data-line="${index}">
                    <span class="debug-line-number">${index + 1}</span>
                    <span class="debug-line-text">${escapeHtml(line) || '&nbsp;'}</span>
                </div>
            `;
        }).join('');

        els.codeArea.querySelectorAll('.debug-code-line').forEach(el => {
            el.addEventListener('click', () => handleLineClick(parseInt(el.dataset.line)));
        });

        els.wrapper.classList.remove('fade-out');
        setTimeout(() => {
            state.isAnimating = false;
        }, 300);

    }, 300);
}

function handleLineClick(index) {
    if (state.selectedLine !== null || state.isGameOver || state.isAnimating) return;

    const task = state.filteredTasks[state.currentIndex];
    const lines = els.codeArea.querySelectorAll('.debug-code-line');
    const clickedLine = lines[index];

    if (index === task.bugLineIndex) {
        state.selectedLine = index;
        clickedLine.classList.add('selected');
        clearInterval(state.timerInterval);
        showFixes(task.fixes);
    } else {
        clickedLine.classList.add('wrong');
        setTimeout(() => clickedLine.classList.remove('wrong'), 500);
        state.lives--;
        updateLives();
        if (state.lives <= 0) {
            gameOver();
        }
    }
}

function showFixes(fixes) {
    state.isFixing = true;
    
    els.fixesList.innerHTML = fixes.map((fix, i) => `
        <button class="debug-fix-btn" data-fix="${i}">${escapeHtml(fix)}</button>
    `).join('');

    els.fixesList.querySelectorAll('.debug-fix-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const fixIndex = parseInt(btn.dataset.fix);
            applyFix(fixIndex);
        });
    });

    els.modal.classList.add('visible');
}

function applyFix(fixIndex) {
    if (!state.isFixing) return;
    const task = state.filteredTasks[state.currentIndex];
    const correctIndex = getCorrectFixIndex(task);
    const correctFix = task.fixes[correctIndex];

    if (fixIndex === correctIndex) {
        els.modal.classList.remove('visible');
        
        const lines = els.codeArea.querySelectorAll('.debug-code-line');
        const line = lines[state.selectedLine];
        
        line.classList.remove('selected');
        line.classList.add('correct');
        line.querySelector('.debug-line-text').textContent = correctFix;
        
        state.isFixing = false;

        setTimeout(nextTask, 1500);
    } else {
        state.lives--;
        updateLives();
        els.modal.classList.remove('visible');
        if (state.lives <= 0) {
            gameOver();
        }
    }
}

function nextTask() {
    state.currentIndex++;
    renderTask();
}

function resetGame() {
    state.currentIndex = 0;
    state.lives = 3;
    state.isGameOver = false;
    
    const existingOverlay = els.editorWrapper.querySelector('.debug-overlay');
    if (existingOverlay) existingOverlay.remove();
    
    filterTasks();
    renderTask();
}

function gameOver() {
    state.isGameOver = true;
    clearInterval(state.timerInterval);
    els.modal.classList.remove('visible');
    
    const existingOverlay = els.editorWrapper.querySelector('.debug-overlay');
    if (existingOverlay) existingOverlay.remove();

    const overlay = document.createElement('div');
    overlay.className = 'debug-overlay';
    overlay.innerHTML = `
        <h3 class="debug-overlay-title">Игра окончена</h3>
        <p class="debug-overlay-text">Вы поймали ${state.currentIndex} багов, но система упала.</p>
        <button class="btn-primary" id="restartGameBtn">
            <i class="ph ph-arrow-counter-clockwise"></i> Попробовать снова
        </button>
    `;
    els.editorWrapper.style.position = 'relative';
    els.editorWrapper.appendChild(overlay);

    const btn = overlay.querySelector('#restartGameBtn');
    if (btn) {
        btn.addEventListener('click', () => {
            overlay.remove();
            resetGame();
        });
    }
}

function gameWin() {
    state.isGameOver = true;
    clearInterval(state.timerInterval);
    els.modal.classList.remove('visible');
    
    const existingOverlay = els.editorWrapper.querySelector('.debug-overlay');
    if (existingOverlay) existingOverlay.remove();

    const overlay = document.createElement('div');
    overlay.className = 'debug-overlay';
    overlay.innerHTML = `
        <h3 class="debug-overlay-title" style="color: var(--accent-green);">Победа!</h3>
        <p class="debug-overlay-text">Вы обезвредили все баги и спасли проект.</p>
        <button class="btn-primary" id="restartGameBtn">
            <i class="ph ph-arrow-clockwise"></i> Играть снова
        </button>
    `;
    els.editorWrapper.style.position = 'relative';
    els.editorWrapper.appendChild(overlay);

    const btn = overlay.querySelector('#restartGameBtn');
    if (btn) {
        btn.addEventListener('click', () => {
            overlay.remove();
            resetGame();
        });
    }
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

async function init() {
    cacheElements();
    if (!els.section) return;
    
    await loadData();
    
    els.modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (state.isAnimating) return;
            els.modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.mode = btn.dataset.mode;
            filterTasks();
            resetGame();
        });
    });

    renderLanguageSelector();
    filterTasks();
    
    els.editorWrapper.style.position = 'relative';
    renderTask();
}

init();