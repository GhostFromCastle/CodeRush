import { isLessonComplete } from './storage.js';

export function initLevelPage() {
    const courseId = document.body.dataset.courseId;
    const level = document.body.dataset.level;
    if (!courseId || !level) return;

    document.querySelectorAll('[data-lesson-id]').forEach(item => {
        const lessonId = item.dataset.lessonId;
        if (isLessonComplete(courseId, level, lessonId)) {
            item.classList.add('completed');
            const statusIcon = item.querySelector('.lesson-status i');
            if (statusIcon) statusIcon.className = 'ph-fill ph-check-circle';
        }
    });
}