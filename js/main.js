document.addEventListener('DOMContentLoaded', () => {
  /* ── GEAR PATH GENERATOR ── */
  function gearPts(cx, cy, outerR, innerR, teeth, phase) {
    const pts = [];
    for (let i = 0; i < teeth * 2; i++) {
      const a = (i * Math.PI / teeth) + phase;
      const r = i % 2 === 0 ? outerR : innerR;
      pts.push((cx + r * Math.cos(a)).toFixed(2) + ',' + (cy + r * Math.sin(a)).toFixed(2));
    }
    return pts.join(' ');
  }

  /* ── CENTRAL GEAR ── */
  const gearMain = document.getElementById('gearMain');
  if (gearMain) {
    gearMain.setAttribute('points', gearPts(200, 200, 88, 68, 18, -Math.PI / 2));
  }

  /* ── SATELLITE GEARS ── (120° apart, center distance = 120px) */
  const dist = 120;
  const satData = [
    { pid: 'sg1', hid: 'sh1', angle: -Math.PI / 2 },
    { pid: 'sg2', hid: 'sh2', angle: -Math.PI / 2 + (2 * Math.PI) / 3 },
    { pid: 'sg3', hid: 'sh3', angle: -Math.PI / 2 + (4 * Math.PI) / 3 },
  ];

  satData.forEach(({ pid, hid, angle }) => {
    const cx = 200 + dist * Math.cos(angle);
    const cy = 200 + dist * Math.sin(angle);
    
    const pEl = document.getElementById(pid);
    if (pEl) {
      pEl.setAttribute('points', gearPts(cx, cy, 46, 36, 10, angle + Math.PI / 10));
    }
    
    const hEl = document.getElementById(hid);
    if (hEl) {
      hEl.setAttribute('cx', cx.toFixed(2));
      hEl.setAttribute('cy', cy.toFixed(2));
    }
  });

  /* ── SCROLL REVEAL ── */
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
});
