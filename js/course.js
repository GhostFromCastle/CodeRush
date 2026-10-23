import { getLevelProgress } from './storage.js';

export function initCoursePage() {
    const courseId = document.body.dataset.courseId;
    if (!courseId) return;

    document.querySelectorAll('[data-level]').forEach(card => {
        const level = card.dataset.level;
        const total = parseInt(card.dataset.totalLessons) || 0;
        const percent = getLevelProgress(courseId, level, total);
        const fill = card.querySelector('.progress-bar-fill');
        const label = card.querySelector('.level-progress-value');
        if (fill) fill.style.width = percent + '%';
        if (label) label.textContent = percent + '%';
    });
}