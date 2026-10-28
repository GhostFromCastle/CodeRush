export function initProgressManager() {
    const topNav = document.querySelector('.top-nav');
    const navLinks = document.querySelector('.nav-links');
    const burger = document.querySelector('.burger-menu');

    if (topNav && navLinks) {
        const navRight = document.createElement('div');
        navRight.className = 'nav-right-wrapper';
        navRight.style.display = 'flex';
        navRight.style.alignItems = 'center';
        navRight.style.gap = '24px';
        navRight.style.marginLeft = 'auto';

        topNav.appendChild(navRight);
        navRight.appendChild(navLinks);

        const btn = document.createElement('button');
        btn.className = 'progress-nav-btn';
        btn.innerHTML = '<i class="ph ph-floppy-disk"></i> <span class="progress-btn-text">Прогресс</span>';
        navRight.appendChild(btn);

        if (burger) {
            navRight.appendChild(burger);
        }

        btn.addEventListener('click', () => {
            modal.classList.add('active');
        });
    }

    const modal = document.createElement('div');
    modal.className = 'progress-modal';
    modal.innerHTML = `
        <div class="progress-modal-content">
            <i class="ph ph-floppy-disk progress-modal-icon"></i>
            <div class="progress-modal-title">Прогресс</div>
            <div class="progress-modal-desc">
                Скачайте резервную копию, чтобы перенести её на другое устройство или сохранить перед очисткой кэша браузера.
            </div>
            <div class="progress-modal-actions">
                <button class="btn-primary" id="exportProgressBtn" style="width: 100%; justify-content: center;">
                    <i class="ph ph-download-simple"></i> Скачать файл
                </button>
                <label class="progress-file-label" for="importProgressInput">
                    <i class="ph ph-upload-simple"></i> Загрузить файл
                </label>
                <input type="file" id="importProgressInput" accept=".json" hidden>
            </div>
            <button class="progress-close-btn" id="closeProgressModal">Закрыть</button>
        </div>
    `;
    document.body.appendChild(modal);

    const closeBtn = document.getElementById('closeProgressModal');
    const exportBtn = document.getElementById('exportProgressBtn');
    const importInput = document.getElementById('importProgressInput');

    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });

    function showToast(message, type = 'success') {
        let toast = document.getElementById('cr-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'cr-toast';
            document.body.appendChild(toast);
        }
        toast.className = `cr-toast ${type}`;
        const icon = type === 'success' ? 'ph-check-circle' : 'ph-x-circle';
        toast.innerHTML = `<i class="ph-fill ${icon}" style="font-size: 1.4rem;"></i> <span>${message}</span>`;

        void toast.offsetWidth;
        toast.classList.add('show');

        clearTimeout(toast.hideTimeout);
        toast.hideTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    exportBtn.addEventListener('click', () => {
        const progressData = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('cr_')) {
                progressData[key] = localStorage.getItem(key);
            }
        }

        if (Object.keys(progressData).length === 0) {
            showToast('У вас пока нет сохранённого прогресса.', 'error');
            return;
        }

        const blob = new Blob([JSON.stringify(progressData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `coderush_progress_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('Файл прогресса успешно скачан!', 'success');
        modal.classList.remove('active');
    });

    importInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                let count = 0;
                for (const [key, value] of Object.entries(data)) {
                    if (key.startsWith('cr_')) {
                        localStorage.setItem(key, value);
                        count++;
                    }
                }
                
                if (count > 0) {
                    modal.classList.remove('active');
                    showToast('Прогресс успешно загружен! Перезагрузка...', 'success');
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                } else {
                    showToast('В файле не найдены данные CodeRush.', 'error');
                }
            } catch (err) {
                showToast('Ошибка чтения файла. Это не JSON-файл прогресса.', 'error');
            }
            importInput.value = '';
        };
        reader.readAsText(file);
    });
}