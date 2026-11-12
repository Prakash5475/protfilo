PRAKASH MUSMADE — CINEMATIC PORTFOLIO

1. Extract this folder.
2. Keep index.html and the assets folder together.
3. Open index.html in Chrome, Edge, Firefox or Safari.

Highlights:
- Warm light theme with cinematic accents and accessible contrast
- Cinematic preloader and letter-by-letter hero reveal
- Inertia smooth scrolling (Lenis) + scroll-driven animation (GSAP ScrollTrigger)
- Word-by-word scroll highlight, clip-path image reveals with parallax
- Magnetic buttons, custom cursor, hover spotlight cards
- Lightbox gallery with arrows and keyboard navigation
- Respects reduced-motion settings; works with basic scrolling if CDN scripts fail
- Works without JavaScript: content stays visible and mobile navigation remains usable

Files:
- assets/styles.css      Main stylesheet
- assets/app.js          Site behaviour and animations
- assets/noscript.css    Fallback styles used when JavaScript is disabled
- assets/*.png / *.mp4   Project screenshots and demo video
- _headers               Security headers for static hosts that support them
                         (Netlify, Cloudflare Pages, etc.)

Security notes:
- A strict Content-Security-Policy is set in index.html and in _headers.
  Inline scripts and inline event handlers are not allowed.
- The third-party animation libraries are pinned and protected with
  Subresource Integrity (SRI), so a tampered CDN response will be rejected.
- The page fails gracefully (with normal scrolling and visible content) when
  the animation libraries are unavailable or blocked.
- For full protection against clickjacking, serve the site over HTTPS with the
  _headers file (or configure the equivalent headers at your host). File-open
  mode cannot send HTTP response headers.

Note: Internet is needed for Google Fonts and the animation libraries
(cdnjs / jsDelivr). The site still works without them.
