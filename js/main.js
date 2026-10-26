import { initCatalog } from './catalog.js';
import { initCounters } from './counters.js';
import { initCoursePage } from './course.js';
import { initLevelPage } from './level.js';
import { initLessonPage } from './lesson.js';
import { initFaq } from './faq.js';
import { initPrefetch } from './prefetch.js';
import { initTrainers } from './trainers.js';
import { initDictionary } from './dictionary.js';
import { initBurgerMenu } from './burger-menu.js';
import { initAnalytics } from './analytics.js';

document.addEventListener('DOMContentLoaded', () => {
    initAnalytics();
    initCatalog();
    initCounters();
    initCoursePage();
    initLevelPage();
    initLessonPage();
    initFaq();
    initPrefetch();
    initTrainers();
    initDictionary();
    initBurgerMenu();
});