/* Entry point: starts each module once, in the order the page needs them. Nothing else lives here.
   underline.js and magnetic.js are no longer started (2026-09-28: template tells); delete them with their
   importmap and modulepreload lines in index.html. */
import { initTheme } from './modules/theme.js';
import { initNavState } from './modules/nav-state.js';
import { initMenu } from './modules/menu.js';
import { initCopyEmail } from './modules/copy-email.js';
import { initWork } from './modules/work.js';
import { initLightbox } from './modules/lightbox.js';
import { initReveal } from './modules/reveal.js';
import { initLiveTags } from './modules/live-tags.js';
import { initServiceLinks } from './modules/service-links.js';
import { initSlideshows } from './modules/slideshow.js';
import { initFooterLight } from './modules/footer-light.js';
import { initStat3d } from './modules/stat-3d.js';
import { initGlobe } from './modules/globe.js';
import { initBadge } from './modules/badge/index.js';

initTheme();
initBadge();
initNavState();
initMenu();
initCopyEmail();
initWork();
initLightbox();
initReveal();
initLiveTags();
initServiceLinks();
initSlideshows();
initFooterLight();
initStat3d();
initGlobe();
