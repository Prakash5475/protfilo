'use strict';

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const root = document.documentElement;
const year = $('#yr');
if (year) year.textContent = new Date().getFullYear();

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(pointer: fine)').matches;
const animate = !reducedMotion && Boolean(window.gsap && window.ScrollTrigger);

let lenis = null;
let heroLines = [];

function restoreHeroText() {
  heroLines.forEach(({ line, text }) => {
    line.textContent = text;
    line.removeAttribute('aria-label');
  });
  heroLines = [];
}

/* ------------------------------------------------------------------ *
 * Navigation (works without any third-party library)
 * ------------------------------------------------------------------ */
const nav = $('#nav');
const menuButton = $('#mb');

function setMenu(open) {
  nav.classList.toggle('open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.textContent = open ? 'Close' : 'Menu';
}

menuButton.addEventListener('click', () => {
  setMenu(!nav.classList.contains('open'));
});

function scrollToTarget(hash) {
  const target = $(hash);
  if (!target) return;

  if (lenis) {
    lenis.scrollTo(hash === '#home' ? 0 : target, {
      offset: -60,
      duration: 1.8,
      easing: (x) => 1 - Math.pow(1 - x, 4),
    });
  } else {
    target.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  }
}

$$('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    setMenu(false);
    scrollToTarget(link.getAttribute('href'));
  });
});

document.addEventListener('click', (event) => {
  if (nav.classList.contains('open') && !nav.contains(event.target)) {
    setMenu(false);
  }
});

/* ------------------------------------------------------------------ *
 * Lightbox (works without any third-party library)
 * ------------------------------------------------------------------ */
const lightbox = $('#lb');
const lightboxImage = $('#li');
const lightboxCaption = $('#lcap');
const main = $('main');
let group = [];
let groupIndex = 0;
let lastFocused = null;

function showLightboxImage() {
  const image = group[groupIndex];
  if (!image) return;

  lightboxImage.src = image.currentSrc || image.src;
  lightboxImage.alt = image.alt || '';
  lightboxCaption.textContent = `${image.dataset.c || image.alt || ''}  ·  ${groupIndex + 1} / ${group.length}`;
}

function openLightbox(name, trigger) {
  const safeName = window.CSS && CSS.escape ? CSS.escape(name) : name;
  group = $$(`[data-g="${safeName}"] img`);
  groupIndex = Math.max(0, group.indexOf($('img', trigger)));
  if (!group.length) return;

  lastFocused = document.activeElement;
  showLightboxImage();
  lightbox.classList.add('open');
  lightbox.inert = false;
  lightbox.removeAttribute('inert');
  document.body.classList.add('lock');
  if (main) main.inert = true;
  nav.inert = true;
  if (lenis) lenis.stop();

  setTimeout(() => {
    const closeButton = $('#lx');
    if (closeButton) closeButton.focus();
  }, 50);
}

function closeLightbox() {
  if (!lightbox.classList.contains('open')) return;

  lightbox.classList.remove('open');
  lightbox.inert = true;
  document.body.classList.remove('lock');
  if (main) main.inert = false;
  nav.inert = false;
  if (lenis) lenis.start();

  if (lastFocused && typeof lastFocused.focus === 'function') {
    lastFocused.focus();
  }
}

function stepLightbox(direction) {
  if (!group.length) return;

  groupIndex = (groupIndex + direction + group.length) % group.length;
  showLightboxImage();

  if (animate) {
    gsap.fromTo(
      lightboxImage,
      { opacity: 0, x: direction * 40 },
      { opacity: 1, x: 0, duration: 0.5, ease: 'power3.out' }
    );
  }
}

$$('[data-g]').forEach((trigger) => {
  trigger.addEventListener('click', () => openLightbox(trigger.dataset.g, trigger));
});

$('#lx').addEventListener('click', closeLightbox);
$('#lp').addEventListener('click', () => stepLightbox(-1));
$('#ln').addEventListener('click', () => stepLightbox(1));

lightbox.addEventListener('click', (event) => {
  if (event.target === lightbox) closeLightbox();
});

document.addEventListener('keydown', (event) => {
  if (!lightbox.classList.contains('open')) {
    if (event.key === 'Escape' && nav.classList.contains('open')) setMenu(false);
    return;
  }

  if (event.key === 'Escape') {
    event.preventDefault();
    closeLightbox();
    return;
  }

  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    stepLightbox(-1);
    return;
  }

  if (event.key === 'ArrowRight') {
    event.preventDefault();
    stepLightbox(1);
    return;
  }

  if (event.key === 'Tab') {
    const buttons = $$('button', lightbox);
    if (!buttons.length) return;

    const first = buttons[0];
    const last = buttons[buttons.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});

/* ------------------------------------------------------------------ *
 * Skill detail modal (works without any third-party library)
 * ------------------------------------------------------------------ */
const skillModal = $('#skm');

if (skillModal && typeof SKILL_GROUPS === 'object' && typeof SKILL_ICONS === 'object') {
  const skillPanel = $('.skm-panel', skillModal);
  const skillBody = $('#skmBody');
  const skillTitle = $('#skmTitle');
  const skillEyebrow = $('#skmEyebrow');
  const skillSummary = $('#skmSummary');
  const skillClose = $('#skmClose');
  let lastSkillTrigger = null;

  function skillIcon(key) {
    const body = SKILL_ICONS[key];
    return body
      ? `<svg class="skm-svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">${body}</svg>`
      : '';
  }

  function renderSkillGroup(group) {
    skillTitle.textContent = group.title;
    skillEyebrow.textContent = group.eyebrow;
    skillSummary.textContent = group.summary;

    skillBody.innerHTML = `<ul class="skm-list">${group.items
      .map((item) => `
        <li class="skm-item">
          <span class="skm-ico">${skillIcon(item.icon)}</span>
          <div class="skm-copy">
            <div class="skm-top"><h3 class="skm-name">${item.name}</h3><span class="skm-level">${item.label} · ${item.level}%</span></div>
            <p class="skm-desc">${item.desc}</p>
            <span class="skm-track" role="progressbar" aria-label="${item.name} proficiency" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${item.level}" aria-valuetext="${item.label}, ${item.level} percent"><span class="skm-fill bar-${item.level}"></span></span>
          </div>
        </li>`)
      .join('')}</ul>`;
  }

  function skillFocusables() {
    return $$('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])', skillPanel)
      .filter((element) => !element.disabled && element.offsetParent !== null);
  }

  function openSkillModal(key, trigger) {
    const group = SKILL_GROUPS[key];
    if (!group) return;

    lastSkillTrigger = trigger || document.activeElement;
    skillModal.classList.remove('open');
    renderSkillGroup(group);

    skillModal.inert = false;
    skillModal.removeAttribute('inert');
    document.body.classList.add('lock');
    if (main) main.inert = true;
    nav.inert = true;
    if (lenis) lenis.stop();

    void skillPanel.offsetWidth;
    skillModal.classList.add('open');

    setTimeout(() => skillClose.focus({ preventScroll: true }), 60);
  }

  function closeSkillModal() {
    if (!skillModal.classList.contains('open')) return;

    skillModal.classList.remove('open');
    skillModal.inert = true;
    document.body.classList.remove('lock');
    if (main) main.inert = false;
    nav.inert = false;
    if (lenis) lenis.start();

    if (lastSkillTrigger && typeof lastSkillTrigger.focus === 'function') {
      lastSkillTrigger.focus({ preventScroll: true });
    }
  }

  $$('[data-skill]').forEach((card) => {
    card.addEventListener('click', () => openSkillModal(card.dataset.skill, card));
  });

  skillClose.addEventListener('click', closeSkillModal);

  skillModal.addEventListener('click', (event) => {
    if (event.target === skillModal) closeSkillModal();
  });

  document.addEventListener('keydown', (event) => {
    if (!skillModal.classList.contains('open')) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      closeSkillModal();
      return;
    }

    if (event.key === 'Tab') {
      const focusables = skillFocusables();
      if (!focusables.length) {
        event.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });
}

/* ------------------------------------------------------------------ *
 * GSAP / Lenis powered presentation
 * ------------------------------------------------------------------ */
function initAnimations() {
  root.classList.add('js');
  gsap.registerPlugin(ScrollTrigger);

  if (window.Lenis) {
    lenis = new Lenis({
      lerp: 0.085,
      wheelMultiplier: 0.95,
      smoothWheel: true,
      syncTouch: false,
      respectReducedMotion: true,
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  if (lenis) lenis.stop();

  /* split the hero heading into animated characters.
     The original text is restored after the intro so the gradient line keeps
     its background-clip:text rendering. */
  heroLines = $$('#h1 .ln').map((line) => ({ line, text: line.textContent }));

  heroLines.forEach(({ line, text }) => {
    line.setAttribute('aria-label', text);
    line.textContent = '';

    for (const character of text) {
      const span = document.createElement('span');
      span.className = 'ch';
      span.setAttribute('aria-hidden', 'true');
      span.textContent = character;
      line.appendChild(span);
    }
  });

  gsap.set('.ch', { yPercent: 115, rotate: 6 });
  gsap.set('.kick,.hb,.nav', { opacity: 0, y: 30 });

  /* preloader -> intro */
  const counterElement = $('#cnt');
  const counter = { value: 0 };

  gsap
    .timeline()
    .to(counter, {
      value: 100,
      duration: 1.8,
      ease: 'power2.inOut',
      onUpdate: () => {
        counterElement.textContent = Math.round(counter.value);
      },
    })
    .to('#pre', { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, '+=.15')
    .add(() => {
      if (lenis) lenis.start();
      const preloader = $('#pre');
      if (preloader) preloader.remove();
    }, '-=.2')
    .to('.ch', { yPercent: 0, rotate: 0, duration: 1.4, ease: 'expo.out', stagger: 0.035 }, '-=.7')
    .add(restoreHeroText)
    .to('.kick,.hb', { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: 0.15 }, '-=1')
    .to('.nav', { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }, '-=.8');

  /* hero scroll-away */
  gsap.to('#hin', {
    yPercent: -18,
    opacity: 0,
    scale: 0.95,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });
  gsap.to('#o1', {
    yPercent: 40,
    xPercent: 20,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });
  gsap.to('#o2', {
    yPercent: -50,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });

  if (finePointer) {
    const quickX = gsap.quickTo('#o1', 'x', { duration: 1.6, ease: 'power3' });
    const quickY = gsap.quickTo('#o1', 'y', { duration: 1.6, ease: 'power3' });
    addEventListener('pointermove', (event) => {
      quickX((event.clientX / innerWidth - 0.5) * 90);
      quickY((event.clientY / innerHeight - 0.5) * 90);
    }, { passive: true });
  }

  /* reveals */
  $$('[data-r]').forEach((element) => {
    gsap.to(element, {
      opacity: 1,
      y: 0,
      duration: 1.2,
      ease: 'expo.out',
      scrollTrigger: { trigger: element, start: 'top 88%', once: true },
    });
  });

  /* scrubbed words */
  const scrub = $('#scrub');
  if (scrub) {
    const words = scrub.textContent.trim().split(/\s+/);
    scrub.textContent = '';

    words.forEach((word, index) => {
      if (index) scrub.appendChild(document.createTextNode(' '));
      const span = document.createElement('span');
      span.className = 'w';
      span.textContent = word;
      scrub.appendChild(span);
    });

    gsap.to('.big .w', {
      opacity: 1,
      stagger: 0.1,
      ease: 'none',
      scrollTrigger: { trigger: scrub, start: 'top 80%', end: 'bottom 45%', scrub: true },
    });
  }

  /* project images: cinematic clip reveal + parallax */
  $$('.cover').forEach((cover) => {
    gsap.to(cover, {
      clipPath: 'inset(0% 0% round 22px)',
      ease: 'none',
      scrollTrigger: { trigger: cover, start: 'top 95%', end: 'top 35%', scrub: true },
    });

    const image = $('img', cover);
    if (image) {
      gsap.fromTo(image, { yPercent: -7, scale: 1.12 }, {
        yPercent: 7,
        scale: 1,
        ease: 'none',
        scrollTrigger: { trigger: cover, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    }
  });

  /* thumbnails */
  gsap.set('.th', { opacity: 0 });
  ScrollTrigger.batch('.th', {
    start: 'top 92%',
    once: true,
    onEnter: (batch) => {
      gsap.fromTo(batch, { opacity: 0, y: 60, scale: 0.92 }, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 1,
        ease: 'expo.out',
        stagger: 0.09,
      });
    },
  });

  /* big numbers drift */
  $$('.pn,.xd').forEach((number) => {
    gsap.fromTo(number, { y: 40 }, {
      y: -40,
      ease: 'none',
      scrollTrigger: { trigger: number, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });

  /* contact heading */
  gsap.from('.ct h2', {
    scale: 0.9,
    ease: 'none',
    scrollTrigger: { trigger: '.ct', start: 'top bottom', end: 'top 30%', scrub: true },
  });

  /* magnetic buttons */
  if (finePointer) {
    $$('.mag').forEach((element) => {
      const quickX = gsap.quickTo(element, 'x', { duration: 0.6, ease: 'power3' });
      const quickY = gsap.quickTo(element, 'y', { duration: 0.6, ease: 'power3' });

      element.addEventListener('pointermove', (event) => {
        const rect = element.getBoundingClientRect();
        quickX((event.clientX - rect.left - rect.width / 2) * 0.3);
        quickY((event.clientY - rect.top - rect.height / 2) * 0.4);
      });

      element.addEventListener('pointerleave', () => {
        quickX(0);
        quickY(0);
      });
    });
  }

  /* hide the nav while scrolling down / progress bar */
  let lastY = 0;
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      const y = self.scroll();
      nav.classList.toggle('hide', y > lastY && y > 300 && !nav.classList.contains('open'));
      lastY = y;
      gsap.set('#bar', { scaleX: self.progress });
    },
  });
}

if (!animate) {
  const preloader = $('#pre');
  if (preloader) preloader.remove();
} else {
  try {
    initAnimations();
  } catch (error) {
    console.error('Animation setup failed:', error);
    root.classList.remove('js');
    restoreHeroText();
    if (lenis) lenis.start();

    const preloader = $('#pre');
    if (preloader) preloader.remove();

    if (window.ScrollTrigger && typeof ScrollTrigger.getAll === 'function') {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    }

    if (window.gsap) {
      gsap.set(['.ch', '.kick', '.hb', '.nav', '[data-r]', '.th', '.big .w'], { clearProps: 'all' });
    }
  }
}

/* ------------------------------------------------------------------ *
 * Small enhancements
 * ------------------------------------------------------------------ */
/* skill spotlight */
$$('.sk').forEach((card) => {
  card.addEventListener('pointermove', (event) => {
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--x', `${event.clientX - rect.left}px`);
    card.style.setProperty('--y', `${event.clientY - rect.top}px`);
  });
});

/* custom cursor */
if (finePointer && !reducedMotion) {
  root.classList.add('cursor-on');
  const cursor = $('#cur');
  const cursorDot = $('i', cursor);
  let targetX = 0;
  let targetY = 0;
  let x = 0;
  let y = 0;

  cursor.style.opacity = '0';

  addEventListener('pointermove', (event) => {
    targetX = event.clientX;
    targetY = event.clientY;
    cursor.style.opacity = '1';
  }, { passive: true });

  (function frame() {
    x += (targetX - x) * 0.18;
    y += (targetY - y) * 0.18;
    cursor.style.transform = `translate(${x}px,${y}px)`;
    requestAnimationFrame(frame);
  })();

  $$('[data-cur]').forEach((element) => {
    element.addEventListener('pointerenter', () => {
      cursor.classList.add('big');
      cursorDot.textContent = element.dataset.cur;
    });
    element.addEventListener('pointerleave', () => {
      cursor.classList.remove('big');
      cursorDot.textContent = '';
    });
  });

  $$('a,button:not([data-cur])').forEach((element) => {
    element.addEventListener('pointerenter', () => {
      cursorDot.style.transform = 'scale(2.2)';
    });
    element.addEventListener('pointerleave', () => {
      cursorDot.style.transform = '';
    });
  });
}

/* active nav link */
const navLinks = $$('.nav a.l');
const sections = $$('#home,#about,#projects,#experience,#skills,#contact');

if ('IntersectionObserver' in window && sections.length) {
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      navLinks.forEach((link) => {
        const active = link.getAttribute('href') === `#${entry.target.id}`;
        link.classList.toggle('on', active);
        if (active) {
          link.setAttribute('aria-current', 'location');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });

  sections.forEach((section) => spy.observe(section));
}
