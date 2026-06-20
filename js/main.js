/**
 * Yasir Arafat — Personal Engineering Portfolio Script
 * Handles dynamic mechanical gear path calculations for the blueprint SVG
 * and manages intersection-based scroll reveal animations.
 */

// =================================================================
// 0a. THEME INITIALISER (runs before DOMContentLoaded to prevent FOUC)
// Reads the saved preference from localStorage and applies it
// immediately so the page never flashes with the wrong theme.
// =================================================================
(function () {
  if (localStorage.getItem('theme') === 'dark')
    document.documentElement.setAttribute('data-theme', 'dark');
})();

// =================================================================
// 0b. CROSS-PAGE SMOOTH SCROLL
// When arriving from another page with a hash (e.g. index.html#projects),
// instantly jump to top then smoothly scroll to the target.
// =================================================================
(function () {
  if (location.hash) {
    // Disable browser's native scroll restoration so it doesn't auto-jump
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    // Force top before paint
    window.scrollTo(0, 0);
  }
})();

document.addEventListener('DOMContentLoaded', () => {
  // =================================================================
  // 1. THEME TOGGLE
  // =================================================================
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    // Sync aria-checked on load
    themeBtn.setAttribute('aria-checked',
      document.documentElement.getAttribute('data-theme') === 'dark' ? 'true' : 'false'
    );
    themeBtn.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      if (isDark) {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
        themeBtn.setAttribute('aria-checked', 'false');
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        themeBtn.setAttribute('aria-checked', 'true');
      }
    });
  }

  // Smooth scroll to hash target after page has rendered
  if (location.hash) {
    const target = document.querySelector(location.hash);
    if (target) {
      setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth' });
      }, 80); // Small delay lets the page fully render first
    }
  }


  // =================================================================
  // 1. GEAR CONFIGURATION (Geometric Specs & Mechanical Data)
  // =================================================================
  const GEAR_CONFIG = {
    // Central main gear specs
    main: {
      id: 'gearMain',
      centerX: 200,
      centerY: 200,
      outerRadius: 88,
      innerRadius: 68,
      teethCount: 18,
      phaseAngle: -Math.PI / 2
    },
    // Planetary/Satellite gears configuration
    satellites: {
      centerDistance: 120, // Distance of satellite centers from the main central gear
      outerRadius: 46,
      innerRadius: 36,
      teethCount: 10,
      gears: [
        { pid: 'sg1', hid: 'sh1', angle: -Math.PI / 2 },                     // Top satellite (at 90 deg / 12 o'clock)
        { pid: 'sg2', hid: 'sh2', angle: -Math.PI / 2 + (2 * Math.PI) / 3 },  // Bottom-right satellite (120 deg clockwise)
        { pid: 'sg3', hid: 'sh3', angle: -Math.PI / 2 + (4 * Math.PI) / 3 }   // Bottom-left satellite (240 deg clockwise)
      ]
    }
  };

  // =================================================================
  // 2. GEAR PATH GENERATOR (Trigonometric coordinate mapping)
  // =================================================================
  /**
   * Generates a coordinate points string for rendering a SVG polygon gear shape.
   * Maps out alternating points at outer and inner radii to create clean teeth notches.
   *
   * @param {number} centerX - X-axis center coordinate
   * @param {number} centerY - Y-axis center coordinate
   * @param {number} outerRadius - Peak radius of the teeth
   * @param {number} innerRadius - Base/trough radius of the teeth
   * @param {number} teethCount - Total number of gear teeth
   * @param {number} phaseAngle - Initial angular rotation phase (radians)
   * @returns {string} Space-separated string of X,Y coordinates
   */
  function generateGearPoints(centerX, centerY, outerRadius, innerRadius, teethCount, phaseAngle) {
    const pointsList = [];
    const totalSteps = teethCount * 2;

    for (let step = 0; step < totalSteps; step++) {
      // Divide the circle evenly into double the amount of teeth steps (peaks and troughs)
      const currentAngle = (step * Math.PI / teethCount) + phaseAngle;
      
      // Alternate between outer peak radius and inner trough radius to form the teeth profiles
      const currentRadius = (step % 2 === 0) ? outerRadius : innerRadius;
      
      // Calculate coordinates using basic polar-to-Cartesian trigonometry
      const coordX = centerX + currentRadius * Math.cos(currentAngle);
      const coordY = centerY + currentRadius * Math.sin(currentAngle);
      
      // Limit decimals to 2 places for clean SVG parsing
      pointsList.push(`${coordX.toFixed(2)},${coordY.toFixed(2)}`);
    }

    return pointsList.join(' ');
  }

  // =================================================================
  // 3. GEAR INITIALIZATION & RENDERING
  // =================================================================
  
  // Render central main gear
  const centralGearElement = document.getElementById(GEAR_CONFIG.main.id);
  if (centralGearElement) {
    const mainPoints = generateGearPoints(
      GEAR_CONFIG.main.centerX,
      GEAR_CONFIG.main.centerY,
      GEAR_CONFIG.main.outerRadius,
      GEAR_CONFIG.main.innerRadius,
      GEAR_CONFIG.main.teethCount,
      GEAR_CONFIG.main.phaseAngle
    );
    centralGearElement.setAttribute('points', mainPoints);
  }

  // Render three planetary/satellite gears and center their pivot holes
  const satDistance = GEAR_CONFIG.satellites.centerDistance;
  GEAR_CONFIG.satellites.gears.forEach(({ pid, hid, angle }) => {
    // Determine satellite gear centers using orbit projection coordinates
    const satCenterX = GEAR_CONFIG.main.centerX + satDistance * Math.cos(angle);
    const satCenterY = GEAR_CONFIG.main.centerY + satDistance * Math.sin(angle);
    
    // Set teeth point profiles on polygon path
    const satelliteElement = document.getElementById(pid);
    if (satelliteElement) {
      const satPoints = generateGearPoints(
        satCenterX,
        satCenterY,
        GEAR_CONFIG.satellites.outerRadius,
        GEAR_CONFIG.satellites.innerRadius,
        GEAR_CONFIG.satellites.teethCount,
        angle + Math.PI / GEAR_CONFIG.satellites.teethCount // Mesh phase offset
      );
      satelliteElement.setAttribute('points', satPoints);
    }
    
    // Set central pivot hole circles coordinates
    const pivotHoleElement = document.getElementById(hid);
    if (pivotHoleElement) {
      pivotHoleElement.setAttribute('cx', satCenterX.toFixed(2));
      pivotHoleElement.setAttribute('cy', satCenterY.toFixed(2));
    }
  });

  // =================================================================
  // 4. SCROLL REVEAL (Dynamic Fade-in and Rise Animations)
  // =================================================================
  const scrollObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          scrollObserver.unobserve(entry.target); // Animates only once
        }
      });
    },
    { 
      threshold: 0.1 // Triggers animation when 10% of element is visible
    }
  );

  // Observe all items registered with the .reveal class
  const elementsToReveal = document.querySelectorAll('.reveal');
  elementsToReveal.forEach((el) => scrollObserver.observe(el));
});
