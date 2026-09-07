/**
 * DJS NOVA - Logo Loading Sequence
 * Accurately renders the DJS NOVA emblem with the lunar 'O', orbital sweep,
 * and the continuous rotating star above the 'A' as the mission loading spinner.
 */

class LogoLoader {
  constructor(containerId, onComplete) {
    this.container = document.getElementById(containerId);
    this.onComplete = onComplete;
    this.init();
  }

  init() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="loader-backdrop">
        <div class="stars-particle-fx"></div>
        <div class="djs-nova-emblem-wrap">
          <svg class="djs-nova-svg" viewBox="0 0 600 320" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <!-- Radial gradient for Moon 'O' -->
              <radialGradient id="moonGlow" cx="40%" cy="40%" r="60%">
                <stop offset="0%" stop-color="#f0f3f8" />
                <stop offset="45%" stop-color="#b8c0cc" />
                <stop offset="80%" stop-color="#606673" />
                <stop offset="100%" stop-color="#242730" />
              </radialGradient>
              
              <!-- Starburst radiant gradient -->
              <radialGradient id="starFlare" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#ffffff" />
                <stop offset="25%" stop-color="#80d9ff" />
                <stop offset="70%" stop-color="rgba(0, 195, 255, 0.4)" />
                <stop offset="100%" stop-color="rgba(0, 195, 255, 0)" />
              </radialGradient>

              <filter id="cosmicGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <!-- DJS Header -->
            <text x="360" y="160" class="logo-djs-text" text-anchor="middle">D ' J S</text>

            <!-- Letter 'N' -->
            <path d="M 120 250 L 120 170 L 175 250 L 175 170" fill="none" stroke="#ffffff" stroke-width="12" stroke-linecap="square" stroke-linejoin="miter" />

            <!-- Letter 'O' (Realistic Cratered Moon) -->
            <g transform="translate(240, 210)">
              <!-- Moon base sphere -->
              <circle cx="0" cy="0" r="40" fill="url(#moonGlow)" stroke="#9ea8b8" stroke-width="1.5" />
              <!-- Lunar Maria & Craters -->
              <ellipse cx="-12" cy="-14" rx="14" ry="10" fill="rgba(45, 52, 65, 0.55)" />
              <ellipse cx="14" cy="8" rx="16" ry="12" fill="rgba(40, 48, 60, 0.5)" />
              <circle cx="-6" cy="18" r="9" fill="rgba(35, 42, 55, 0.6)" />
              <circle cx="8" cy="-18" r="7" fill="rgba(50, 58, 72, 0.45)" />
              <circle cx="-18" cy="4" r="5" fill="rgba(30, 36, 48, 0.6)" />
              <!-- Small high-contrast craters -->
              <circle cx="18" cy="-8" r="3.5" fill="#1b212b" stroke="#7a8494" stroke-width="0.8" />
              <circle cx="-2" cy="6" r="4.5" fill="#1b212b" stroke="#7a8494" stroke-width="0.8" />
              <circle cx="-16" cy="16" r="2.8" fill="#1b212b" stroke="#7a8494" stroke-width="0.8" />
            </g>

            <!-- Letter 'V' -->
            <path d="M 305 170 L 340 250 L 375 170" fill="none" stroke="#ffffff" stroke-width="12" stroke-linecap="square" stroke-linejoin="miter" />

            <!-- Letter 'A' -->
            <path d="M 395 250 L 430 170 L 465 250" fill="none" stroke="#ffffff" stroke-width="12" stroke-linecap="square" stroke-linejoin="miter" />

            <!-- Orbital Elliptical Arc Sweep -->
            <path d="M 305 210 C 315 110, 440 70, 485 105 C 515 130, 515 200, 440 242 C 400 262, 385 240, 425 224"
                  fill="none" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round" filter="url(#cosmicGlow)" />

            <!-- The Signature 4-Pointed Star Above the 'A' (Rotating Loading Indicator) -->
            <g class="rotating-star-group" transform="translate(475, 105)">
              <!-- Outer Glow Halo -->
              <circle cx="0" cy="0" r="38" fill="url(#starFlare)" />
              
              <!-- Rotating Star Core -->
              <g class="star-spokes">
                <!-- Vertical Spoke -->
                <path d="M 0 -34 Q 3 -8, 7 0 Q 3 8, 0 34 Q -3 8, -7 0 Q -3 -8, 0 -34 Z" fill="#ffffff" filter="url(#cosmicGlow)" />
                <!-- Horizontal Spoke -->
                <path d="M -34 0 Q -8 -3, 0 -7 Q 8 -3, 34 0 Q 8 3, 0 7 Q -8 3, -34 0 Z" fill="#ffffff" filter="url(#cosmicGlow)" />
                <!-- Diagonal Minor Spokes -->
                <path d="M -16 -16 Q -4 -4, 0 -5 Q 4 -4, 16 16 Q 4 4, 0 5 Q -4 4, -16 -16 Z" fill="#80e5ff" opacity="0.85" />
                <path d="M 16 -16 Q 4 -4, 5 0 Q 4 4, -16 16 Q -4 4, -5 0 Q -4 -4, 16 -16 Z" fill="#80e5ff" opacity="0.85" />
                <!-- Center Diamond Sparkle -->
                <circle cx="0" cy="0" r="4.5" fill="#ffffff" />
              </g>
            </g>
          </svg>

          <div class="loader-status-bar">
            <div class="loader-text">INITIALIZING MISSION SYSTEM...</div>
            <div class="loader-track">
              <div class="loader-progress"></div>
            </div>
            <div class="skip-btn" id="skipLoaderBtn">SKIP INTRO ›</div>
          </div>
        </div>
      </div>
    `;

    const skipBtn = document.getElementById('skipLoaderBtn');
    if (skipBtn) {
      skipBtn.addEventListener('click', () => this.finish());
    }

    // Automatically transition into the main solar system after loading completes (~2.8s)
    setTimeout(() => {
      this.finish();
    }, 2800);
  }

  finish() {
    if (!this.container || this.finished) return;
    this.finished = true;
    this.container.classList.add('fade-out');

    setTimeout(() => {
      this.container.style.display = 'none';
      if (typeof this.onComplete === 'function') {
        this.onComplete();
      }
    }, 700);
  }
}

window.LogoLoader = LogoLoader;
