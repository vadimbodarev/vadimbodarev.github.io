/**
 * Aether Flock — Interactive 3D Boids Bird Murmuration
 * Birds emerge in formation and smoothly follow the user's cursor in real-time.
 */

const canvas = document.getElementById('flock-canvas');
const ctx = canvas.getContext('2d');

let width = window.innerWidth;
let height = window.innerHeight;
let dpr = Math.min(window.devicePixelRatio || 1, 2);

function resizeCanvas() {
  width = window.innerWidth;
  height = window.innerHeight;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Themes configuration
const THEMES = {
  twilight: {
    skyStops: [
      { pos: 0.0, color: '#070b19' },
      { pos: 0.45, color: '#131c38' },
      { pos: 0.78, color: '#382a52' },
      { pos: 1.0, color: '#c45b52' }
    ],
    sunColor: 'rgba(245, 158, 11, 0.22)',
    birdLit: '#ffd8a8',
    birdDark: '#121324',
    birdAccent: '#f59e0b',
    trailColor: 'rgba(251, 191, 36, 0.14)',
    mountainBack: '#16172b',
    mountainFront: '#0b0c18'
  },
  dawn: {
    skyStops: [
      { pos: 0.0, color: '#0f1b2d' },
      { pos: 0.4, color: '#2b4263' },
      { pos: 0.75, color: '#9c5a67' },
      { pos: 1.0, color: '#f6a36b' }
    ],
    sunColor: 'rgba(253, 224, 71, 0.28)',
    birdLit: '#fff3c4',
    birdDark: '#1e1b2e',
    birdAccent: '#fbbf24',
    trailColor: 'rgba(254, 240, 138, 0.16)',
    mountainBack: '#262038',
    mountainFront: '#151221'
  },
  midnight: {
    skyStops: [
      { pos: 0.0, color: '#02040a' },
      { pos: 0.5, color: '#071124' },
      { pos: 0.85, color: '#0f2547' },
      { pos: 1.0, color: '#1e3f66' }
    ],
    sunColor: 'rgba(56, 189, 248, 0.18)',
    birdLit: '#bae6fd',
    birdDark: '#091326',
    birdAccent: '#38bdf8',
    trailColor: 'rgba(56, 189, 248, 0.15)',
    mountainBack: '#081426',
    mountainFront: '#040914'
  }
};

let currentTheme = THEMES.twilight;

// Stars in the upper sky
const stars = Array.from({ length: 85 }, () => ({
  x: Math.random(),
  y: Math.random() * 0.65,
  r: Math.random() * 1.4 + 0.4,
  phase: Math.random() * Math.PI * 2,
  speed: Math.random() * 0.02 + 0.008
}));

// Cursor tracking & smooth virtual leader
const pointer = {
  x: width * 0.5,
  y: height * 0.45,
  smoothX: width * 0.5,
  smoothY: height * 0.45,
  active: false,
  lastMoveTime: 0,
  ripples: []
};

window.addEventListener('pointermove', (e) => {
  pointer.x = e.clientX;
  pointer.y = e.clientY;
  pointer.active = true;
  pointer.lastMoveTime = performance.now();
});

window.addEventListener('touchmove', (e) => {
  if (e.touches.length > 0) {
    pointer.x = e.touches[0].clientX;
    pointer.y = e.touches[0].clientY;
    pointer.active = true;
    pointer.lastMoveTime = performance.now();
  }
}, { passive: true });

// Click shockwave / scatter effect
function triggerScatter(cx, cy) {
  pointer.ripples.push({
    x: cx,
    y: cy,
    radius: 5,
    maxRadius: 220,
    alpha: 0.75
  });

  for (const b of birds) {
    const dx = b.x - cx;
    const dy = b.y - cy;
    const dist = Math.hypot(dx, dy) || 1;
    if (dist < 360) {
      const force = (1 - dist / 360) * 14;
      b.vx += (dx / dist) * force + (Math.random() - 0.5) * 3;
      b.vy += (dy / dist) * force + (Math.random() - 0.5) * 3;
      b.vz += (Math.random() - 0.5) * 6;
    }
  }
}

canvas.addEventListener('pointerdown', (e) => {
  triggerScatter(e.clientX, e.clientY);
});

// Bird Class with 3D Boids Physics + Wing Flapping Geometry
class Bird {
  constructor(index, total) {
    // Opening formation: start in an expanding spiral/card formation near center
    const angle = (index / total) * Math.PI * 10;
    const radius = 15 + (index / total) * Math.min(width, height) * 0.35;
    this.x = width * 0.5 + Math.cos(angle) * radius;
    this.y = height * 0.48 + Math.sin(angle) * radius * 0.65;
    this.z = (Math.random() - 0.5) * 260; // Depth: -130 (far) to +130 (near)

    const speed = 3.5 + Math.random() * 2;
    this.vx = Math.cos(angle + 1.4) * speed;
    this.vy = Math.sin(angle + 1.4) * speed;
    this.vz = (Math.random() - 0.5) * 1.5;

    this.ax = 0;
    this.ay = 0;
    this.az = 0;

    this.wingPhase = Math.random() * Math.PI * 2;
    this.wingSpeed = 0.16 + Math.random() * 0.07;
    this.baseSize = 7.5 + Math.random() * 3.8;
    this.maxSpeed = 6.2 + Math.random() * 1.6;
    this.maxForce = 0.24 + Math.random() * 0.06;

    // Short subtle motion trail
    this.history = [];
  }

  flock(birds, targetX, targetY, time) {
    let sepX = 0, sepY = 0, sepZ = 0, sepCount = 0;
    let aliX = 0, aliY = 0, aliZ = 0, aliCount = 0;
    let cohX = 0, cohY = 0, cohZ = 0, cohCount = 0;

    const desiredSeparation = 34;
    const neighborDist = 92;

    for (let i = 0; i < birds.length; i++) {
      const other = birds[i];
      if (other === this) continue;

      const dx = this.x - other.x;
      const dy = this.y - other.y;
      const dz = this.z - other.z;

      // Fast bounding check
      if (Math.abs(dx) > neighborDist || Math.abs(dy) > neighborDist) continue;

      const dSq = dx * dx + dy * dy + dz * dz;
      if (dSq > 0 && dSq < neighborDist * neighborDist) {
        const d = Math.sqrt(dSq);

        // Separation
        if (d < desiredSeparation) {
          const invD = 1 / d;
          sepX += dx * invD;
          sepY += dy * invD;
          sepZ += dz * invD;
          sepCount++;
        }

        // Alignment
        aliX += other.vx;
        aliY += other.vy;
        aliZ += other.vz;
        aliCount++;

        // Cohesion
        cohX += other.x;
        cohY += other.y;
        cohZ += other.z;
        cohCount++;
      }
    }

    // Apply Separation
    if (sepCount > 0) {
      sepX /= sepCount;
      sepY /= sepCount;
      sepZ /= sepCount;
      const mag = Math.hypot(sepX, sepY, sepZ) || 1;
      sepX = (sepX / mag) * this.maxSpeed - this.vx;
      sepY = (sepY / mag) * this.maxSpeed - this.vy;
      sepZ = (sepZ / mag) * this.maxSpeed - this.vz;
      this.ax += sepX * 0.065;
      this.ay += sepY * 0.065;
      this.az += sepZ * 0.065;
    }

    // Apply Alignment
    if (aliCount > 0) {
      aliX /= aliCount;
      aliY /= aliCount;
      aliZ /= aliCount;
      const mag = Math.hypot(aliX, aliY, aliZ) || 1;
      aliX = (aliX / mag) * this.maxSpeed - this.vx;
      aliY = (aliY / mag) * this.maxSpeed - this.vy;
      aliZ = (aliZ / mag) * this.maxSpeed - this.vz;
      this.ax += aliX * 0.04;
      this.ay += aliY * 0.04;
      this.az += aliZ * 0.04;
    }

    // Apply Cohesion
    if (cohCount > 0) {
      cohX = cohX / cohCount - this.x;
      cohY = cohY / cohCount - this.y;
      cohZ = cohZ / cohCount - this.z;
      const mag = Math.hypot(cohX, cohY, cohZ) || 1;
      cohX = (cohX / mag) * this.maxSpeed - this.vx;
      cohY = (cohY / mag) * this.maxSpeed - this.vy;
      cohZ = (cohZ / mag) * this.maxSpeed - this.vz;
      this.ax += cohX * 0.032;
      this.ay += cohY * 0.032;
      this.az += cohZ * 0.032;
    }

    // Steer strongly and gracefully toward the cursor / target
    const tdx = targetX - this.x;
    const tdy = targetY - this.y;
    const tdz = 0 - this.z;
    const tDist = Math.hypot(tdx, tdy) || 1;

    // Orbit gently when very close to cursor so the flock swirls instead of collapsing to 1 pixel
    let steerX = tdx;
    let steerY = tdy;
    if (tDist < 120) {
      // Add tangential swirl around cursor
      steerX += -tdy * 0.65;
      steerY += tdx * 0.65;
    }

    const sMag = Math.hypot(steerX, steerY) || 1;
    const desiredVx = (steerX / sMag) * this.maxSpeed;
    const desiredVy = (steerY / sMag) * this.maxSpeed;

    const cursorPull = pointer.active ? 0.068 : 0.038;
    this.ax += (desiredVx - this.vx) * cursorPull;
    this.ay += (desiredVy - this.vy) * cursorPull;
    this.az += (tdz * 0.01 - this.vz) * 0.03;

    // Gentle organic wind wave
    this.ax += Math.sin(time * 0.0015 + this.y * 0.008) * 0.035;
    this.ay += Math.cos(time * 0.0012 + this.x * 0.008) * 0.035;

    // Soft screen margin containment
    const margin = 90;
    if (this.x < margin) this.ax += 0.25;
    if (this.x > width - margin) this.ax -= 0.25;
    if (this.y < margin) this.ay += 0.25;
    if (this.y > height - margin) this.ay -= 0.25;
    if (this.z < -160) this.az += 0.2;
    if (this.z > 160) this.az -= 0.2;
  }

  update() {
    this.vx += this.ax;
    this.vy += this.ay;
    this.vz += this.az;

    // Clamp speed
    const speed = Math.hypot(this.vx, this.vy, this.vz) || 1;
    if (speed > this.maxSpeed) {
      this.vx = (this.vx / speed) * this.maxSpeed;
      this.vy = (this.vy / speed) * this.maxSpeed;
      this.vz = (this.vz / speed) * this.maxSpeed;
    } else if (speed < 2.2) {
      this.vx = (this.vx / speed) * 2.2;
      this.vy = (this.vy / speed) * 2.2;
    }

    // Save short trail for closest birds
    if (this.z > 30) {
      this.history.push({ x: this.x, y: this.y });
      if (this.history.length > 5) this.history.shift();
    } else if (this.history.length > 0) {
      this.history.shift();
    }

    this.x += this.vx;
    this.y += this.vy;
    this.z += this.vz;

    this.ax = 0;
    this.ay = 0;
    this.az = 0;

    // Flap faster when climbing or accelerating
    const climbFactor = Math.max(0.7, 1 - this.vy * 0.08);
    this.wingPhase += this.wingSpeed * (speed / 4.2) * climbFactor;
  }

  draw(ctx) {
    // Perspective scale from z (-160 to +160)
    const depthNorm = (this.z + 160) / 320; // 0 (far) to 1 (near)
    const scale = 0.42 + depthNorm * 0.95;
    const size = this.baseSize * scale;

    const angle = Math.atan2(this.vy, this.vx);
    const flap = Math.sin(this.wingPhase);
    const wingTipY = flap * size * 0.85;

    // Draw subtle wind ribbon trail for foreground birds
    if (this.history.length > 2) {
      ctx.beginPath();
      ctx.moveTo(this.history[0].x, this.history[0].y);
      for (let i = 1; i < this.history.length; i++) {
        ctx.lineTo(this.history[i].x, this.history[i].y);
      }
      ctx.strokeStyle = currentTheme.trailColor;
      ctx.lineWidth = 1.2 * scale;
      ctx.stroke();
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(angle);

    // Bird silhouette with swept wings and forked tail
    ctx.beginPath();
    // Beak / Head tip
    ctx.moveTo(size * 1.35, 0);
    // Left Wing
    ctx.quadraticCurveTo(size * 0.25, -size * 0.55 + wingTipY * 0.35, -size * 0.45, -size * 1.45 + wingTipY);
    ctx.quadraticCurveTo(-size * 0.3, -size * 0.35, -size * 1.05, -size * 0.18);
    // Tail center notch
    ctx.lineTo(-size * 0.75, 0);
    ctx.lineTo(-size * 1.05, size * 0.18);
    // Right Wing
    ctx.quadraticCurveTo(-size * 0.3, size * 0.35, -size * 0.45, size * 1.45 - wingTipY);
    ctx.quadraticCurveTo(size * 0.25, size * 0.55 - wingTipY * 0.35, size * 1.35, 0);
    ctx.closePath();

    // Dynamic rim lighting based on depth & wing angle
    const alpha = 0.38 + depthNorm * 0.62;
    if (depthNorm > 0.68 && flap > 0.2) {
      ctx.fillStyle = currentTheme.birdLit;
      ctx.shadowColor = currentTheme.birdAccent;
      ctx.shadowBlur = 8;
    } else {
      ctx.fillStyle = currentTheme.birdDark;
      ctx.globalAlpha = alpha;
    }

    ctx.fill();
    ctx.restore();
  }
}

// Create the flock
const BIRD_COUNT = width < 640 ? 110 : 180;
const birds = [];
for (let i = 0; i < BIRD_COUNT; i++) {
  birds.push(new Bird(i, BIRD_COUNT));
}

const birdCountLabel = document.getElementById('bird-count-label');
if (birdCountLabel) {
  birdCountLabel.textContent = `${BIRD_COUNT} Păsări`;
}

// Background Sky, Sun Glow, Stars & Horizon Silhouette
function drawEnvironment(time) {
  // Sky Gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
  for (const stop of currentTheme.skyStops) {
    skyGrad.addColorStop(stop.pos, stop.color);
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  // Twinkling Stars in upper sky
  ctx.fillStyle = '#ffffff';
  for (const s of stars) {
    const twinkle = 0.25 + 0.55 * Math.sin(time * s.speed + s.phase);
    ctx.globalAlpha = Math.max(0.05, twinkle);
    ctx.beginPath();
    ctx.arc(s.x * width, s.y * height, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Atmospheric Sun / Moon Glow following cursor subtly
  const glowX = pointer.smoothX * 0.35 + width * 0.325;
  const glowY = height * 0.78;
  const sunRadius = Math.max(width, height) * 0.48;
  const sunGrad = ctx.createRadialGradient(glowX, glowY, 10, glowX, glowY, sunRadius);
  sunGrad.addColorStop(0, currentTheme.sunColor);
  sunGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = sunGrad;
  ctx.fillRect(0, 0, width, height);

  // Distant Mountain Range 1 (Back)
  ctx.beginPath();
  ctx.moveTo(0, height);
  for (let x = 0; x <= width + 40; x += 40) {
    const y = height - 65 - Math.sin(x * 0.0035 + 1.2) * 32 - Math.cos(x * 0.009) * 18;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(width, height);
  ctx.closePath();
  ctx.fillStyle = currentTheme.mountainBack;
  ctx.fill();

  // Distant Mountain Range 2 (Front Silhouette)
  ctx.beginPath();
  ctx.moveTo(0, height);
  for (let x = 0; x <= width + 40; x += 35) {
    const y = height - 32 - Math.sin(x * 0.005 + 3.1) * 22 - Math.cos(x * 0.014) * 12;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(width, height);
  ctx.closePath();
  ctx.fillStyle = currentTheme.mountainFront;
  ctx.fill();
}

// Draw Cursor Aura & Click Shockwaves
function drawCursorEffects() {
  // Subtle glowing attractor orb at cursor
  const orbGrad = ctx.createRadialGradient(
    pointer.smoothX, pointer.smoothY, 2,
    pointer.smoothX, pointer.smoothY, 64
  );
  orbGrad.addColorStop(0, currentTheme.birdLit);
  orbGrad.addColorStop(0.25, currentTheme.trailColor);
  orbGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.save();
  ctx.fillStyle = orbGrad;
  ctx.beginPath();
  ctx.arc(pointer.smoothX, pointer.smoothY, 64, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Ripples on click
  for (let i = pointer.ripples.length - 1; i >= 0; i--) {
    const r = pointer.ripples[i];
    r.radius += (r.maxRadius - r.radius) * 0.08 + 1.8;
    r.alpha *= 0.94;

    ctx.save();
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
    ctx.strokeStyle = currentTheme.birdLit;
    ctx.globalAlpha = r.alpha;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    if (r.alpha < 0.02) {
      pointer.ripples.splice(i, 1);
    }
  }
}

// Main Animation Loop
function animate(time) {
  // If user hasn't moved mouse for 4 seconds, glide along a graceful figure-8 path
  if (time - pointer.lastMoveTime > 4200) {
    pointer.active = false;
    pointer.x = width * 0.5 + Math.cos(time * 0.0007) * (width * 0.28);
    pointer.y = height * 0.42 + Math.sin(time * 0.0014) * (height * 0.18);
  }

  // Smooth interpolation of target cursor
  pointer.smoothX += (pointer.x - pointer.smoothX) * 0.12;
  pointer.smoothY += (pointer.y - pointer.smoothY) * 0.12;

  drawEnvironment(time);
  drawCursorEffects();

  // Sort birds back-to-front by Z depth for true 3D occlusion
  birds.sort((a, b) => a.z - b.z);

  for (let i = 0; i < birds.length; i++) {
    const bird = birds[i];
    bird.flock(birds, pointer.smoothX, pointer.smoothY, time);
    bird.update();
    bird.draw(ctx);
  }

  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);

// UI Controls Wiring
const themeButtons = document.querySelectorAll('[data-theme]');
themeButtons.forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const themeKey = btn.getAttribute('data-theme');
    currentTheme = THEMES[themeKey] || THEMES.twilight;

    if (themeKey === 'twilight') {
      document.body.removeAttribute('data-sky');
    } else {
      document.body.setAttribute('data-sky', themeKey);
    }

    themeButtons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

const scatterBtn = document.getElementById('btn-scatter');
if (scatterBtn) {
  scatterBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    triggerScatter(pointer.smoothX, pointer.smoothY);
  });
}

const toggleUiBtn = document.getElementById('btn-toggle-ui');
const heroCard = document.getElementById('hero-card');
if (toggleUiBtn && heroCard) {
  toggleUiBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isHidden = heroCard.classList.toggle('hidden');
    toggleUiBtn.querySelector('span').textContent = isHidden ? 'Arată Text' : 'Ascunde Text';
  });
}
