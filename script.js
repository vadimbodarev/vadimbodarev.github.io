/**
 * Natura & Zbor — Realistic 3D Bird Flock over a Seasonal Landscape
 * Features:
 * - Top-Left: Radiant Sunrise (Răsăritul Soarelui)
 * - Top-Right: Detailed Full Moon (Lună Plină) with craters & glow
 * - Background Landscape: Multi-layered Mountains, Pine Forest, Reflective Lake
 * - Bottom-Right: 4 Seasons (Primăvara, Vara, Toamna, Iarna) that transform the entire scene & particles
 * - Realistic articulated 3D Birds (Head, beak, body, tail, 2-jointed flapping wings) following cursor
 */

const canvas = document.getElementById('flock-canvas');
const ctx = canvas.getContext('2d');

let width = window.innerWidth;
let height = window.innerHeight;
let dpr = Math.min(window.devicePixelRatio || 1, 2);

// Landscape geometry cache
let mountainsFar = [];
let mountainsMid = [];
let pineTreesBack = [];
let pineTreesFront = [];
let shoreFlowers = [];
let weatherParticles = [];

// Seasonal Themes Configuration
const SEASONS = {
  spring: {
    name: 'Primăvara',
    skyTopLeft: '#ff8a5b',
    skyTopRight: '#1a2748',
    skyMid: '#4f6d9a',
    skyHorizon: '#ffd1b3',
    sunCore: '#fff6d6',
    sunHalo: 'rgba(255, 160, 85, 0.55)',
    moonGlow: 'rgba(210, 230, 255, 0.32)',
    mtnFar: '#3d4e78',
    mtnMid: '#2a3c5f',
    snowCapAlpha: 0.55,
    snowLine: 0.38,
    pineBack: '#1d4738',
    pineFront: '#133629',
    pineSnow: false,
    meadowColor: '#25523b',
    lakeTop: '#3c6e8f',
    lakeBottom: '#19324a',
    lakeFrozen: false,
    birdBody: '#1e2433',
    birdBelly: '#e2e8f0',
    birdWingTop: '#2d3748',
    birdWingUnder: '#cbd5e1',
    birdRim: '#fecdd3',
    particleType: 'petals',
    flowerColors: ['#f472b6', '#fb7185', '#fde047', '#ffffff']
  },
  summer: {
    name: 'Vara',
    skyTopLeft: '#fbbf24',
    skyTopRight: '#0f2042',
    skyMid: '#1d5b79',
    skyHorizon: '#fde68a',
    sunCore: '#ffffff',
    sunHalo: 'rgba(251, 191, 36, 0.65)',
    moonGlow: 'rgba(224, 242, 254, 0.3)',
    mtnFar: '#2b4c65',
    mtnMid: '#1c384e',
    snowCapAlpha: 0.15,
    snowLine: 0.18,
    pineBack: '#14452f',
    pineFront: '#0b2e1f',
    pineSnow: false,
    meadowColor: '#1b432c',
    lakeTop: '#16697a',
    lakeBottom: '#0b2b3c',
    lakeFrozen: false,
    birdBody: '#17202a',
    birdBelly: '#f1f5f9',
    birdWingTop: '#273746',
    birdWingUnder: '#d5dbdb',
    birdRim: '#fde047',
    particleType: 'fireflies',
    flowerColors: ['#fef08a', '#4ade80', '#38bdf8']
  },
  autumn: {
    name: 'Toamna',
    skyTopLeft: '#ea580c',
    skyTopRight: '#1c1936',
    skyMid: '#6b3e52',
    skyHorizon: '#fdba74',
    sunCore: '#ffedd5',
    sunHalo: 'rgba(249, 115, 22, 0.58)',
    moonGlow: 'rgba(254, 215, 170, 0.35)',
    mtnFar: '#4c3549',
    mtnMid: '#382638',
    snowCapAlpha: 0.35,
    snowLine: 0.28,
    pineBack: '#2d3a27',
    pineFront: '#1f291a',
    pineSnow: false,
    autumnMix: ['#d97706', '#b45309', '#991b1b', '#2d3a27', '#1f291a'],
    meadowColor: '#4a3219',
    lakeTop: '#5c475e',
    lakeBottom: '#1f1c2e',
    lakeFrozen: false,
    birdBody: '#271c19',
    birdBelly: '#fed7aa',
    birdWingTop: '#3e2723',
    birdWingUnder: '#fdba74',
    birdRim: '#fb923c',
    particleType: 'leaves',
    flowerColors: ['#f97316', '#eab308', '#dc2626']
  },
  winter: {
    name: 'Iarna',
    skyTopLeft: '#f59e0b',
    skyTopRight: '#091126',
    skyMid: '#274060',
    skyHorizon: '#bae6fd',
    sunCore: '#fffbeb',
    sunHalo: 'rgba(253, 224, 71, 0.42)',
    moonGlow: 'rgba(186, 230, 253, 0.45)',
    mtnFar: '#5c7696',
    mtnMid: '#3d5575',
    snowCapAlpha: 0.92,
    snowLine: 0.72,
    pineBack: '#1e3545',
    pineFront: '#122330',
    pineSnow: true,
    meadowColor: '#dbeafe',
    lakeTop: '#7dd3fc',
    lakeBottom: '#1e3a5f',
    lakeFrozen: true,
    birdBody: '#1e293b',
    birdBelly: '#ffffff',
    birdWingTop: '#334155',
    birdWingUnder: '#f8fafc',
    birdRim: '#7dd3fc',
    particleType: 'snow',
    flowerColors: []
  }
};

let currentSeasonKey = 'spring';
let currentSeason = SEASONS.spring;

// Stars in the right/upper half near the Full Moon
const stars = Array.from({ length: 70 }, () => ({
  x: 0.35 + Math.random() * 0.65,
  y: Math.random() * 0.48,
  r: Math.random() * 1.4 + 0.4,
  phase: Math.random() * Math.PI * 2,
  speed: Math.random() * 0.02 + 0.008
}));

// Generate procedural mountains, pine forest, and lake shore details
function buildLandscapeGeometry() {
  const lakeTopY = height * 0.75;

  // Far Mountain Peaks
  mountainsFar = [];
  const stepFar = Math.max(45, width / 26);
  for (let x = 0; x <= width + stepFar; x += stepFar) {
    const n = Math.sin(x * 0.0038 + 0.8) * 95 + Math.cos(x * 0.0085 + 2.1) * 52 + Math.sin(x * 0.018) * 20;
    const peakY = lakeTopY - 120 - Math.abs(n);
    mountainsFar.push({ x, y: peakY });
  }

  // Mid Mountain Peaks
  mountainsMid = [];
  const stepMid = Math.max(40, width / 30);
  for (let x = 0; x <= width + stepMid; x += stepMid) {
    const n = Math.sin(x * 0.0045 + 3.5) * 70 + Math.cos(x * 0.011 + 1.1) * 38;
    const peakY = lakeTopY - 62 - Math.abs(n);
    mountainsMid.push({ x, y: peakY });
  }

  // Back Pine Forest Line
  pineTreesBack = [];
  const backCount = Math.floor(width / 16);
  for (let i = 0; i <= backCount; i++) {
    const x = (i / backCount) * width + (Math.random() - 0.5) * 10;
    const h = 38 + Math.random() * 34;
    const w = 14 + Math.random() * 10;
    pineTreesBack.push({
      x,
      baseY: lakeTopY - 10 + (Math.random() - 0.5) * 6,
      h,
      w,
      autumnColorIndex: Math.floor(Math.random() * 5)
    });
  }

  // Front Pine Forest Line (Closer to lake shore, taller on left & right)
  pineTreesFront = [];
  const frontCount = Math.floor(width / 22);
  for (let i = 0; i <= frontCount; i++) {
    const normX = i / frontCount;
    // Valley opening in the center so lake reflection is clearly visible
    const valleyFactor = Math.abs(normX - 0.5) * 2; // 0 at center, 1 at edges
    const h = (32 + Math.random() * 36) * (0.55 + valleyFactor * 0.75);
    const w = 16 + Math.random() * 12;
    pineTreesFront.push({
      x: normX * width + (Math.random() - 0.5) * 12,
      baseY: lakeTopY + 3 + (Math.random() - 0.5) * 4,
      h,
      w,
      autumnColorIndex: Math.floor(Math.random() * 5)
    });
  }

  // Shore Flowers / Reeds
  shoreFlowers = Array.from({ length: 45 }, () => ({
    x: Math.random() * width,
    y: lakeTopY - 6 + Math.random() * 12,
    size: 2 + Math.random() * 2.5,
    colorIndex: Math.floor(Math.random() * 4)
  }));
}

// Seasonal Weather Particles (Petals, Fireflies, Autumn Leaves, Snowflakes)
function initWeatherParticles() {
  const count = width < 640 ? 55 : 95;
  weatherParticles = Array.from({ length: count }, () => createWeatherParticle(true));
}

function createWeatherParticle(randomY = false) {
  return {
    x: Math.random() * width,
    y: randomY ? Math.random() * height : -15,
    vx: (Math.random() - 0.35) * 1.2,
    vy: 0.6 + Math.random() * 1.4,
    size: 2.5 + Math.random() * 3.5,
    angle: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.04,
    alpha: 0.45 + Math.random() * 0.5
  };
}

function resizeCanvas() {
  width = window.innerWidth;
  height = window.innerHeight;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  buildLandscapeGeometry();
  initWeatherParticles();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Pointer & Cursor Tracking
const pointer = {
  x: width * 0.5,
  y: height * 0.38,
  smoothX: width * 0.5,
  smoothY: height * 0.38,
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

function triggerScatter(cx, cy) {
  pointer.ripples.push({
    x: cx,
    y: cy,
    radius: 6,
    maxRadius: 230,
    alpha: 0.8
  });

  for (const b of birds) {
    const dx = b.x - cx;
    const dy = b.y - cy;
    const dist = Math.hypot(dx, dy) || 1;
    if (dist < 380) {
      const force = (1 - dist / 380) * 14;
      b.vx += (dx / dist) * force + (Math.random() - 0.5) * 3;
      b.vy += (dy / dist) * force + (Math.random() - 0.5) * 3;
      b.vz += (Math.random() - 0.5) * 6;
    }
  }
}

canvas.addEventListener('pointerdown', (e) => {
  triggerScatter(e.clientX, e.clientY);
});

/**
 * Realistic Articulated Bird Class
 * Renders anatomical silhouette with head, beak, streamlined body, fanned tail,
 * and dual-jointed flapping wings (inner humerus + outer primary feathers).
 */
class Bird {
  constructor(index, total) {
    const angle = (index / total) * Math.PI * 8;
    const radius = 20 + (index / total) * Math.min(width, height) * 0.32;
    this.x = width * 0.5 + Math.cos(angle) * radius;
    this.y = height * 0.38 + Math.sin(angle) * radius * 0.55;
    this.z = (Math.random() - 0.5) * 260;

    const speed = 3.4 + Math.random() * 2.0;
    this.vx = Math.cos(angle + 1.3) * speed;
    this.vy = Math.sin(angle + 1.3) * speed;
    this.vz = (Math.random() - 0.5) * 1.4;

    this.ax = 0;
    this.ay = 0;
    this.az = 0;

    this.wingPhase = Math.random() * Math.PI * 2;
    this.wingSpeed = 0.17 + Math.random() * 0.06;
    this.glideTimer = Math.random() * 100;
    this.baseSize = 8.5 + Math.random() * 4.2;
    this.maxSpeed = 5.8 + Math.random() * 1.5;
  }

  flock(birds, targetX, targetY, time) {
    let sepX = 0, sepY = 0, sepZ = 0, sepCount = 0;
    let aliX = 0, aliY = 0, aliZ = 0, aliCount = 0;
    let cohX = 0, cohY = 0, cohZ = 0, cohCount = 0;

    const desiredSeparation = 36;
    const neighborDist = 92;

    for (let i = 0; i < birds.length; i++) {
      const other = birds[i];
      if (other === this) continue;

      const dx = this.x - other.x;
      const dy = this.y - other.y;
      const dz = this.z - other.z;

      if (Math.abs(dx) > neighborDist || Math.abs(dy) > neighborDist) continue;

      const dSq = dx * dx + dy * dy + dz * dz;
      if (dSq > 0 && dSq < neighborDist * neighborDist) {
        const d = Math.sqrt(dSq);

        if (d < desiredSeparation) {
          const invD = 1 / d;
          sepX += dx * invD;
          sepY += dy * invD;
          sepZ += dz * invD;
          sepCount++;
        }

        aliX += other.vx;
        aliY += other.vy;
        aliZ += other.vz;
        aliCount++;

        cohX += other.x;
        cohY += other.y;
        cohZ += other.z;
        cohCount++;
      }
    }

    if (sepCount > 0) {
      sepX /= sepCount; sepY /= sepCount; sepZ /= sepCount;
      const mag = Math.hypot(sepX, sepY, sepZ) || 1;
      this.ax += ((sepX / mag) * this.maxSpeed - this.vx) * 0.068;
      this.ay += ((sepY / mag) * this.maxSpeed - this.vy) * 0.068;
      this.az += ((sepZ / mag) * this.maxSpeed - this.vz) * 0.068;
    }

    if (aliCount > 0) {
      aliX /= aliCount; aliY /= aliCount; aliZ /= aliCount;
      const mag = Math.hypot(aliX, aliY, aliZ) || 1;
      this.ax += ((aliX / mag) * this.maxSpeed - this.vx) * 0.042;
      this.ay += ((aliY / mag) * this.maxSpeed - this.vy) * 0.042;
      this.az += ((aliZ / mag) * this.maxSpeed - this.vz) * 0.042;
    }

    if (cohCount > 0) {
      cohX = cohX / cohCount - this.x;
      cohY = cohY / cohCount - this.y;
      cohZ = cohZ / cohCount - this.z;
      const mag = Math.hypot(cohX, cohY, cohZ) || 1;
      this.ax += ((cohX / mag) * this.maxSpeed - this.vx) * 0.032;
      this.ay += ((cohY / mag) * this.maxSpeed - this.vy) * 0.032;
      this.az += ((cohZ / mag) * this.maxSpeed - this.vz) * 0.032;
    }

    // Follow Cursor smoothly
    let steerX = targetX - this.x;
    let steerY = targetY - this.y;
    const tDist = Math.hypot(steerX, steerY) || 1;

    if (tDist < 115) {
      // Graceful banking orbit around cursor
      steerX += -(targetY - this.y) * 0.68;
      steerY += (targetX - this.x) * 0.68;
    }

    const sMag = Math.hypot(steerX, steerY) || 1;
    const desiredVx = (steerX / sMag) * this.maxSpeed;
    const desiredVy = (steerY / sMag) * this.maxSpeed;

    const cursorPull = pointer.active ? 0.072 : 0.04;
    this.ax += (desiredVx - this.vx) * cursorPull;
    this.ay += (desiredVy - this.vy) * cursorPull;
    this.az += (-this.z * 0.01 - this.vz) * 0.03;

    // Gentle organic air currents
    this.ax += Math.sin(time * 0.0014 + this.y * 0.008) * 0.03;
    this.ay += Math.cos(time * 0.0011 + this.x * 0.008) * 0.03;

    // Keep birds flying mostly above the lake surface
    const maxLowY = height * 0.78;
    if (this.x < 80) this.ax += 0.26;
    if (this.x > width - 80) this.ax -= 0.26;
    if (this.y < 65) this.ay += 0.26;
    if (this.y > maxLowY) this.ay -= 0.34;
    if (this.z < -160) this.az += 0.2;
    if (this.z > 160) this.az -= 0.2;
  }

  update() {
    this.vx += this.ax;
    this.vy += this.ay;
    this.vz += this.az;

    const speed = Math.hypot(this.vx, this.vy, this.vz) || 1;
    if (speed > this.maxSpeed) {
      this.vx = (this.vx / speed) * this.maxSpeed;
      this.vy = (this.vy / speed) * this.maxSpeed;
      this.vz = (this.vz / speed) * this.maxSpeed;
    } else if (speed < 2.2) {
      this.vx = (this.vx / speed) * 2.2;
      this.vy = (this.vy / speed) * 2.2;
    }

    this.x += this.vx;
    this.y += this.vy;
    this.z += this.vz;

    this.ax = 0;
    this.ay = 0;
    this.az = 0;

    // Natural intermittent gliding when descending
    this.glideTimer += 0.03;
    const isGliding = this.vy > 0.45 && Math.sin(this.glideTimer) > 0.4;
    if (isGliding) {
      // Smoothly relax wings toward horizontal glide
      this.wingPhase += (0.15 - Math.sin(this.wingPhase)) * 0.12;
    } else {
      const climbBoost = Math.max(0.75, 1.05 - this.vy * 0.08);
      this.wingPhase += this.wingSpeed * (speed / 4.2) * climbBoost;
    }
  }

  draw(ctx, isReflection = false) {
    const depthNorm = (this.z + 160) / 320; // 0 (far) to 1 (near)
    const scale = 0.45 + depthNorm * 0.92;
    const s = this.baseSize * scale;

    const angle = Math.atan2(this.vy, this.vx);
    // Articulated wing mechanics: inner wing (shoulder/elbow) + delayed outer wing tip
    const flap = Math.sin(this.wingPhase);
    const tipLag = Math.sin(this.wingPhase - 0.55);

    ctx.save();
    if (isReflection) {
      const lakeTopY = height * 0.75;
      const distAboveLake = lakeTopY - this.y;
      if (distAboveLake < 0 || distAboveLake > height * 0.45) {
        ctx.restore();
        return;
      }
      const refY = lakeTopY + distAboveLake * 0.55;
      ctx.translate(this.x, refY);
      ctx.scale(1, -0.55);
      ctx.rotate(angle);
      ctx.globalAlpha = 0.18 * depthNorm;
    } else {
      ctx.translate(this.x, this.y);
      ctx.rotate(angle);
      ctx.globalAlpha = 0.45 + depthNorm * 0.55;
    }

    // 1. Far Wing (drawn behind body)
    const farElbowY = -s * 0.55 + flap * s * 0.55;
    const farTipY = -s * 1.55 + tipLag * s * 1.15;

    ctx.beginPath();
    ctx.moveTo(s * 0.35, -s * 0.12);
    ctx.quadraticCurveTo(s * 0.15, farElbowY, -s * 0.38, farTipY);
    // Feathered trailing edge with subtle notches
    ctx.quadraticCurveTo(-s * 0.28, farElbowY * 0.65, -s * 0.45, -s * 0.08);
    ctx.closePath();
    ctx.fillStyle = currentSeason.birdWingUnder;
    ctx.fill();

    // 2. Streamlined Fuselage (Body + Head + Beak + Fanned Tail)
    ctx.beginPath();
    // Sharp Beak tip
    ctx.moveTo(s * 1.55, 0);
    // Head crown
    ctx.quadraticCurveTo(s * 1.15, -s * 0.24, s * 0.75, -s * 0.2);
    // Back contour
    ctx.quadraticCurveTo(0, -s * 0.28, -s * 0.85, -s * 0.12);
    // Forked swallow/falcon tail feathers
    ctx.lineTo(-s * 1.55, -s * 0.36);
    ctx.lineTo(-s * 1.22, 0);
    ctx.lineTo(-s * 1.55, s * 0.32);
    // Belly contour
    ctx.lineTo(-s * 0.85, s * 0.14);
    ctx.quadraticCurveTo(s * 0.1, s * 0.34, s * 0.8, s * 0.18);
    // Throat to beak
    ctx.quadraticCurveTo(s * 1.15, s * 0.14, s * 1.55, 0);
    ctx.closePath();
    ctx.fillStyle = currentSeason.birdBody;
    ctx.fill();

    // Subtle sunlit breast/head highlight for foreground birds
    if (!isReflection && depthNorm > 0.55) {
      ctx.beginPath();
      ctx.moveTo(s * 1.48, 0);
      ctx.quadraticCurveTo(s * 0.7, s * 0.22, -s * 0.3, s * 0.14);
      ctx.quadraticCurveTo(s * 0.4, s * 0.04, s * 1.48, 0);
      ctx.fillStyle = currentSeason.birdBelly;
      ctx.fill();
    }

    // 3. Near Wing (drawn in front of body with dynamic rim light)
    const nearElbowY = s * 0.55 - flap * s * 0.55;
    const nearTipY = s * 1.62 - tipLag * s * 1.18;

    ctx.beginPath();
    ctx.moveTo(s * 0.42, s * 0.08);
    ctx.quadraticCurveTo(s * 0.18, nearElbowY, -s * 0.42, nearTipY);
    ctx.quadraticCurveTo(-s * 0.25, nearElbowY * 0.58, -s * 0.52, s * 0.08);
    ctx.closePath();

    if (!isReflection && depthNorm > 0.62 && flap < -0.1) {
      ctx.fillStyle = currentSeason.birdRim;
    } else {
      ctx.fillStyle = currentSeason.birdWingTop;
    }
    ctx.fill();

    // Tiny eye glint on closest birds
    if (!isReflection && depthNorm > 0.75) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(s * 1.05, -s * 0.05, Math.max(0.8, s * 0.07), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

// Instantiate Flock
const BIRD_COUNT = width < 640 ? 105 : 160;
const birds = [];
for (let i = 0; i < BIRD_COUNT; i++) {
  birds.push(new Bird(i, BIRD_COUNT));
}

const birdCountLabel = document.getElementById('bird-count-label');
if (birdCountLabel) {
  birdCountLabel.textContent = `${BIRD_COUNT} Păsări`;
}

/**
 * Draw Top-Left Sunrise (Răsăritul Soarelui) & Top-Right Full Moon (Luna Plină)
 */
function drawCelestialBodies(time) {
  const sunX = width * 0.13;
  const sunY = height * 0.16;
  const sunRadius = Math.min(width, height) * 0.068;

  // 1. Sunrise Multi-layer Radiant Glow (Top-Left)
  const bigSunGlow = ctx.createRadialGradient(sunX, sunY, sunRadius * 0.2, sunX, sunY, sunRadius * 5.2);
  bigSunGlow.addColorStop(0, currentSeason.sunCore);
  bigSunGlow.addColorStop(0.22, currentSeason.sunHalo);
  bigSunGlow.addColorStop(0.55, currentSeason.skyTopLeft + '44');
  bigSunGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = bigSunGlow;
  ctx.fillRect(0, 0, width, height);

  // Subtle rotating sunbeams
  ctx.save();
  ctx.translate(sunX, sunY);
  ctx.rotate(time * 0.00008);
  for (let i = 0; i < 12; i++) {
    ctx.rotate(Math.PI / 6);
    const rayGrad = ctx.createLinearGradient(0, 0, sunRadius * 3.8, 0);
    rayGrad.addColorStop(0, 'rgba(255, 250, 220, 0.14)');
    rayGrad.addColorStop(1, 'rgba(255, 250, 220, 0)');
    ctx.fillStyle = rayGrad;
    ctx.beginPath();
    ctx.moveTo(0, -sunRadius * 0.18);
    ctx.lineTo(sunRadius * 3.8, -sunRadius * 0.55);
    ctx.lineTo(sunRadius * 3.8, sunRadius * 0.55);
    ctx.lineTo(0, sunRadius * 0.18);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Sun Disc
  ctx.save();
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
  ctx.fillStyle = currentSeason.sunCore;
  ctx.shadowColor = currentSeason.sunHalo;
  ctx.shadowBlur = 35;
  ctx.fill();
  ctx.restore();

  // 2. Full Moon (Luna Plină) in Top-Right + Twinkling Stars
  const moonX = width * 0.87;
  const moonY = height * 0.15;
  const moonRadius = Math.min(width, height) * 0.052;

  // Stars around the right side of the sky
  ctx.fillStyle = '#ffffff';
  for (const s of stars) {
    const twinkle = 0.2 + 0.6 * Math.sin(time * s.speed + s.phase);
    ctx.globalAlpha = Math.max(0.05, twinkle);
    ctx.beginPath();
    ctx.arc(s.x * width, s.y * height, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Moon Outer Aura
  const moonHalo = ctx.createRadialGradient(moonX, moonY, moonRadius * 0.5, moonX, moonY, moonRadius * 3.6);
  moonHalo.addColorStop(0, currentSeason.moonGlow);
  moonHalo.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = moonHalo;
  ctx.beginPath();
  ctx.arc(moonX, moonY, moonRadius * 3.6, 0, Math.PI * 2);
  ctx.fill();

  // Full Moon Disc
  ctx.save();
  const moonSurfaceGrad = ctx.createRadialGradient(
    moonX - moonRadius * 0.25,
    moonY - moonRadius * 0.25,
    moonRadius * 0.1,
    moonX,
    moonY,
    moonRadius
  );
  moonSurfaceGrad.addColorStop(0, '#ffffff');
  moonSurfaceGrad.addColorStop(0.7, '#e2e8f0');
  moonSurfaceGrad.addColorStop(1, '#cbd5e1');

  ctx.beginPath();
  ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
  ctx.fillStyle = moonSurfaceGrad;
  ctx.shadowColor = '#e0f2fe';
  ctx.shadowBlur = 24;
  ctx.fill();

  // Realistic Lunar Maria / Craters
  ctx.fillStyle = 'rgba(148, 163, 184, 0.28)';
  const craters = [
    { dx: -0.28, dy: -0.18, r: 0.22 },
    { dx: 0.22, dy: -0.25, r: 0.16 },
    { dx: 0.15, dy: 0.22, r: 0.25 },
    { dx: -0.32, dy: 0.28, r: 0.14 },
    { dx: 0.38, dy: 0.02, r: 0.11 }
  ];
  for (const c of craters) {
    ctx.beginPath();
    ctx.arc(moonX + c.dx * moonRadius, moonY + c.dy * moonRadius, c.r * moonRadius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Draw Single Layered Pine Tree with Optional Snow or Autumn Colors
 */
function drawPineTree(tree, baseColor, hasSnow) {
  const { x, baseY, h, w, autumnColorIndex } = tree;
  let treeColor = baseColor;
  if (currentSeasonKey === 'autumn' && currentSeason.autumnMix) {
    treeColor = currentSeason.autumnMix[autumnColorIndex % currentSeason.autumnMix.length];
  }

  // Trunk
  ctx.fillStyle = '#291d16';
  ctx.fillRect(x - w * 0.08, baseY - h * 0.15, w * 0.16, h * 0.16);

  // 3 Tiered Conifer Branches
  const tiers = 3;
  for (let t = 0; t < tiers; t++) {
    const tierTopY = baseY - h + t * (h * 0.24);
    const tierBottomY = baseY - h * 0.14 - (tiers - 1 - t) * (h * 0.22);
    const tierHalfW = w * (0.48 + t * 0.26);

    ctx.beginPath();
    ctx.moveTo(x, tierTopY);
    ctx.lineTo(x - tierHalfW, tierBottomY);
    ctx.lineTo(x + tierHalfW, tierBottomY);
    ctx.closePath();
    ctx.fillStyle = treeColor;
    ctx.fill();

    // Snow frost on pine branches in Winter
    if (hasSnow) {
      ctx.beginPath();
      ctx.moveTo(x, tierTopY);
      ctx.lineTo(x - tierHalfW * 0.65, tierTopY + (tierBottomY - tierTopY) * 0.55);
      ctx.lineTo(x + tierHalfW * 0.65, tierTopY + (tierBottomY - tierTopY) * 0.55);
      ctx.closePath();
      ctx.fillStyle = 'rgba(241, 245, 249, 0.82)';
      ctx.fill();
    }
  }
}

/**
 * Draw Full Landscape: Sky, Mountains with Snow Caps, Pine Forest, and Reflective Lake
 */
function drawLandscape(time) {
  const lakeTopY = height * 0.75;

  // 1. Base Sky Vertical Gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, lakeTopY);
  skyGrad.addColorStop(0, currentSeason.skyTopRight);
  skyGrad.addColorStop(0.52, currentSeason.skyMid);
  skyGrad.addColorStop(1, currentSeason.skyHorizon);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, lakeTopY + 2);

  // Warm diagonal sunrise wash from Top-Left
  const sunriseWash = ctx.createRadialGradient(0, 0, 10, width * 0.15, height * 0.15, width * 0.75);
  sunriseWash.addColorStop(0, currentSeason.skyTopLeft + 'aa');
  sunriseWash.addColorStop(0.5, currentSeason.skyTopLeft + '33');
  sunriseWash.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = sunriseWash;
  ctx.fillRect(0, 0, width, lakeTopY + 2);

  // 2. Celestial Bodies (Sunrise Top-Left & Full Moon Top-Right)
  drawCelestialBodies(time);

  // 3. Far Mountain Range
  ctx.beginPath();
  ctx.moveTo(0, lakeTopY);
  for (const pt of mountainsFar) {
    ctx.lineTo(pt.x, pt.y);
  }
  ctx.lineTo(width, lakeTopY);
  ctx.closePath();
  ctx.fillStyle = currentSeason.mtnFar;
  ctx.fill();

  // Snow Caps on Far Mountains
  if (currentSeason.snowCapAlpha > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, lakeTopY);
    for (const pt of mountainsFar) ctx.lineTo(pt.x, pt.y);
    ctx.lineTo(width, lakeTopY);
    ctx.closePath();
    ctx.clip();

    const snowGrad = ctx.createLinearGradient(0, lakeTopY - 230, 0, lakeTopY - 230 + 220 * currentSeason.snowLine);
    snowGrad.addColorStop(0, `rgba(255, 255, 255, ${currentSeason.snowCapAlpha})`);
    snowGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = snowGrad;
    ctx.fillRect(0, 0, width, lakeTopY);
    ctx.restore();
  }

  // 4. Mid Mountain Range
  ctx.beginPath();
  ctx.moveTo(0, lakeTopY);
  for (const pt of mountainsMid) {
    ctx.lineTo(pt.x, pt.y);
  }
  ctx.lineTo(width, lakeTopY);
  ctx.closePath();
  ctx.fillStyle = currentSeason.mtnMid;
  ctx.fill();

  // 5. Meadow / Forest Shore Bank
  ctx.fillStyle = currentSeason.meadowColor;
  ctx.fillRect(0, lakeTopY - 12, width, 16);

  // 6. Pine Forest (Back & Front rows)
  for (const tree of pineTreesBack) {
    drawPineTree(tree, currentSeason.pineBack, currentSeason.pineSnow);
  }
  for (const tree of pineTreesFront) {
    drawPineTree(tree, currentSeason.pineFront, currentSeason.pineSnow);
  }

  // Spring / Summer / Autumn shore flowers
  if (currentSeason.flowerColors && currentSeason.flowerColors.length > 0) {
    for (const f of shoreFlowers) {
      ctx.fillStyle = currentSeason.flowerColors[f.colorIndex % currentSeason.flowerColors.length];
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 7. Reflective Mountain Lake (Bottom 25% of screen)
  const lakeGrad = ctx.createLinearGradient(0, lakeTopY, 0, height);
  lakeGrad.addColorStop(0, currentSeason.lakeTop);
  lakeGrad.addColorStop(1, currentSeason.lakeBottom);
  ctx.fillStyle = lakeGrad;
  ctx.fillRect(0, lakeTopY, width, height - lakeTopY);

  // Sunrise & Moon Shimmer Reflections on the Lake Water
  const sunX = width * 0.13;
  const moonX = width * 0.87;
  const numRipples = 26;
  for (let i = 0; i < numRipples; i++) {
    const progress = i / numRipples;
    const ry = lakeTopY + 6 + progress * (height - lakeTopY - 10);
    const waveOffset = Math.sin(time * 0.003 + i * 0.7) * (8 + progress * 18);

    // Sunrise golden water shimmer (Left)
    const sunShimmerW = (24 + progress * 65) * (0.85 + 0.15 * Math.sin(time * 0.004 + i));
    ctx.fillStyle = currentSeason.sunHalo;
    ctx.globalAlpha = (1 - progress * 0.65) * 0.45;
    ctx.fillRect(sunX + waveOffset - sunShimmerW * 0.5, ry, sunShimmerW, 1.8 + progress * 2);

    // Full Moon silver water shimmer (Right)
    const moonShimmerW = (18 + progress * 48) * (0.85 + 0.15 * Math.cos(time * 0.004 + i));
    ctx.fillStyle = 'rgba(226, 232, 240, 0.55)';
    ctx.globalAlpha = (1 - progress * 0.65) * 0.4;
    ctx.fillRect(moonX - waveOffset - moonShimmerW * 0.5, ry, moonShimmerW, 1.6 + progress * 1.8);
  }
  ctx.globalAlpha = 1;

  // Winter crystalline ice sheen lines on the lake
  if (currentSeason.lakeFrozen) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const y = lakeTopY + 12 + i * ((height - lakeTopY) / 8);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y + Math.sin(i) * 6);
      ctx.stroke();
    }
  }
}

/**
 * Draw Seasonal Weather Particles (Blossom Petals, Summer Fireflies, Autumn Leaves, Winter Snow)
 */
function updateAndDrawParticles(time) {
  const type = currentSeason.particleType;

  for (let i = 0; i < weatherParticles.length; i++) {
    const p = weatherParticles[i];

    if (type === 'fireflies') {
      p.x += Math.sin(time * 0.0015 + i) * 0.6;
      p.y += Math.cos(time * 0.0012 + i * 0.5) * 0.45;
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < height * 0.35) p.y = height * 0.85;
    } else {
      p.x += p.vx + Math.sin(time * 0.002 + i) * 0.45;
      p.y += p.vy;
      p.angle += p.spin;
      if (p.y > height + 10) {
        weatherParticles[i] = createWeatherParticle(false);
      }
      if (p.x > width + 10) p.x = -10;
      if (p.x < -10) p.x = width + 10;
    }

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);

    if (type === 'snow') {
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(0, 0, p.size * 0.65, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'petals') {
      ctx.fillStyle = '#fbcfe8';
      ctx.globalAlpha = p.alpha * 0.85;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'leaves') {
      ctx.fillStyle = i % 2 === 0 ? '#f97316' : '#eab308';
      ctx.globalAlpha = p.alpha * 0.9;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size * 1.15, p.size * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'fireflies') {
      const glow = 0.25 + 0.75 * Math.max(0, Math.sin(time * 0.004 + i));
      ctx.fillStyle = '#fef08a';
      ctx.globalAlpha = glow * 0.8;
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(0, 0, p.size * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

/**
 * Draw Cursor Guiding Orb & Click Ripples
 */
function drawCursorEffects() {
  const orbGrad = ctx.createRadialGradient(
    pointer.smoothX, pointer.smoothY, 2,
    pointer.smoothX, pointer.smoothY, 55
  );
  orbGrad.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
  orbGrad.addColorStop(0.35, currentSeason.sunHalo);
  orbGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.save();
  ctx.fillStyle = orbGrad;
  ctx.beginPath();
  ctx.arc(pointer.smoothX, pointer.smoothY, 55, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  for (let i = pointer.ripples.length - 1; i >= 0; i--) {
    const r = pointer.ripples[i];
    r.radius += (r.maxRadius - r.radius) * 0.08 + 1.8;
    r.alpha *= 0.94;

    ctx.save();
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffffff';
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
  // Autonomous figure-8 flight over the valley when mouse is idle
  if (time - pointer.lastMoveTime > 4200) {
    pointer.active = false;
    pointer.x = width * 0.5 + Math.cos(time * 0.00065) * (width * 0.28);
    pointer.y = height * 0.36 + Math.sin(time * 0.0013) * (height * 0.16);
  }

  pointer.smoothX += (pointer.x - pointer.smoothX) * 0.12;
  pointer.smoothY += (pointer.y - pointer.smoothY) * 0.12;

  drawLandscape(time);
  drawCursorEffects();

  // Sort birds back-to-front by Z depth
  birds.sort((a, b) => a.z - b.z);

  // Update birds & draw subtle water reflections first, then the birds in the sky
  for (let i = 0; i < birds.length; i++) {
    const bird = birds[i];
    bird.flock(birds, pointer.smoothX, pointer.smoothY, time);
    bird.update();
    bird.draw(ctx, true); // Lake reflection
    bird.draw(ctx, false); // Sky bird
  }

  updateAndDrawParticles(time);

  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);

// UI Season Selector Wiring (Bottom-Right)
const seasonButtons = document.querySelectorAll('[data-season]');
const seasonStatus = document.getElementById('season-status');

seasonButtons.forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const key = btn.getAttribute('data-season');
    if (!SEASONS[key]) return;

    currentSeasonKey = key;
    currentSeason = SEASONS[key];
    document.body.setAttribute('data-season', key);

    if (seasonStatus) {
      seasonStatus.textContent = currentSeason.name;
    }

    seasonButtons.forEach((b) => b.classList.remove('active'));
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
