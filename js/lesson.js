import { isLessonComplete, markLessonComplete } from './storage.js';

export function initLessonPage() {
    const courseId = document.body.dataset.courseId;
    const level = document.body.dataset.level;
    const lessonId = document.body.dataset.lessonId;
    if (!courseId || !level || !lessonId) return;

    document.querySelectorAll('.sidebar-lesson').forEach(item => {
        const id = item.dataset.lessonId;
        if (id === lessonId) item.classList.add('active');
        if (isLessonComplete(courseId, level, id)) {
            item.classList.add('completed');
            const check = item.querySelector('.sidebar-lesson-check i');
            if (check) check.className = 'ph-fill ph-check-circle';
        }
    });

    const completeBtn = document.querySelector('.btn-complete');
    if (completeBtn) {
        if (isLessonComplete(courseId, level, lessonId)) {
            completeBtn.classList.add('completed');
            completeBtn.innerHTML = '<i class="ph-fill ph-check-circle"></i> Урок пройден';
        }
        completeBtn.addEventListener('click', () => {
            markLessonComplete(courseId, level, lessonId);
            completeBtn.classList.add('completed');
            completeBtn.innerHTML = '<i class="ph-fill ph-check-circle"></i> Урок пройден';
            const nextBtn = document.querySelector('[data-action="next"]');
            if (nextBtn) {
                nextBtn.classList.remove('btn-secondary');
                nextBtn.classList.add('btn-primary');
            }
        });
    }
}