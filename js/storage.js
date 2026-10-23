const STORAGE_KEY = 'mtd_progress';

export function getProgress() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
        return {};
    }
}

export function saveProgress(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function markLessonComplete(courseId, level, lessonId) {
    const progress = getProgress();
    if (!progress[courseId]) progress[courseId] = {};
    if (!progress[courseId][level]) progress[courseId][level] = { completed: [] };
    const completed = progress[courseId][level].completed;
    if (!completed.includes(lessonId)) {
        completed.push(lessonId);
        saveProgress(progress);
    }
    return progress;
}

export function isLessonComplete(courseId, level, lessonId) {
    const progress = getProgress();
    return progress[courseId]?.[level]?.completed?.includes(lessonId) || false;
}

export function getLevelProgress(courseId, level, totalLessons) {
    const progress = getProgress();
    const completed = progress[courseId]?.[level]?.completed?.length || 0;
    if (!totalLessons) return 0;
    return Math.round((completed / totalLessons) * 100);
}