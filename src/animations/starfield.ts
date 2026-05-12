interface StarLayer {
  distance: 'distant' | 'mid' | 'near';
  speedFactor: number;
  parallaxFactor: number;
  minRadius: number;
  maxRadius: number;
  opacityRange: [number, number];
  count: number;
}

interface Star {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  radius: number;
  opacity: number;
  color: string;
  twinklePhase: number;
  twinkleSpeed: number;
  driftX: number;
  driftY: number;
  driftSpeed: number;
  layer: 'distant' | 'mid' | 'near';
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  trail: { x: number; y: number }[];
  color: string;
}

interface NebulaBlob {
  x: number;
  y: number;
  radius: number;
  color: string;
  alpha: number;
  baseX: number;
  baseY: number;
  phase: number;
  speed: number;
}

interface GridCell {
  stars: Star[];
}

const STAR_COLORS = [
  { color: '200, 220, 255', weight: 0.05 },
  { color: '220, 230, 255', weight: 0.08 },
  { color: '240, 240, 255', weight: 0.15 },
  { color: '255, 250, 240', weight: 0.12 },
  { color: '255, 240, 200', weight: 0.20 },
  { color: '255, 235, 210', weight: 0.15 },
  { color: '255, 215, 170', weight: 0.12 },
  { color: '255, 200, 160', weight: 0.08 },
  { color: '255, 180, 160', weight: 0.03 },
  { color: '255, 160, 150', weight: 0.02 },
];

function pickStarColor(): string {
  let r = Math.random();
  for (const c of STAR_COLORS) {
    r -= c.weight;
    if (r <= 0) return c.color;
  }
  return STAR_COLORS[4].color;
}

export class Starfield {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private stars: Star[] = [];
  private animationId: number | null = null;
  private observer: IntersectionObserver;
  private mouseX = 0;
  private mouseY = 0;
  private isDark = false;

  private milkyWayCanvas: HTMLCanvasElement | null = null;
  private nebulae: NebulaBlob[] = [];
  private shootingStars: ShootingStar[] = [];
  private shootingStarTimer = 180;

  private gridCellSize = 80;
  private spatialGrid: Map<string, Star[]> = new Map();

  private layers: StarLayer[];

  constructor(canvas: HTMLCanvasElement, totalStars = 900) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;

    const isMobile = window.innerWidth <= 768;
    const scale = isMobile ? 0.45 : 1;

    this.layers = [
      {
        distance: 'distant', speedFactor: 0.3, parallaxFactor: 5,
        minRadius: 0.3, maxRadius: 0.8, opacityRange: [0.15, 0.35],
        count: Math.round(500 * scale),
      },
      {
        distance: 'mid', speedFactor: 0.6, parallaxFactor: 15,
        minRadius: 0.6, maxRadius: 1.6, opacityRange: [0.3, 0.6],
        count: Math.round(300 * scale),
      },
      {
        distance: 'near', speedFactor: 1.0, parallaxFactor: 28,
        minRadius: 1.0, maxRadius: 2.8, opacityRange: [0.5, 0.9],
        count: Math.round(100 * scale),
      },
    ];

    this.resize();
    this.initStars();
    this.initNebulae();
    this.renderMilkyWay();
    this.bindEvents();
    this.setupObserver();
    this.updateTheme();
  }

  private resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.milkyWayCanvas = null;
  }

  private initStars() {
    this.stars = [];
    for (const layer of this.layers) {
      for (let i = 0; i < layer.count; i++) {
        const x = Math.random() * this.canvas.width;
        const y = Math.random() * this.canvas.height;
        this.stars.push({
          x,
          y,
          baseX: x,
          baseY: y,
          radius: layer.minRadius + Math.random() * (layer.maxRadius - layer.minRadius),
          opacity: layer.opacityRange[0] + Math.random() * (layer.opacityRange[1] - layer.opacityRange[0]),
          color: pickStarColor(),
          twinklePhase: Math.random() * Math.PI * 2,
          twinkleSpeed: (Math.random() * 0.02 + 0.005) * layer.speedFactor,
          driftX: (Math.random() - 0.5) * 0.3 * layer.speedFactor,
          driftY: (Math.random() - 0.5) * 0.25 - 0.08 * layer.speedFactor,
          driftSpeed: (Math.random() * 0.0003 + 0.0001) * layer.speedFactor,
          layer: layer.distance,
        });
      }
    }
  }

  private initNebulae() {
    const colors = this.isDark
      ? ['120, 100, 180', '80, 120, 180', '180, 100, 140', '100, 150, 180']
      : ['180, 160, 200', '140, 170, 200', '200, 160, 180', '160, 190, 200'];
    this.nebulae = [];
    const count = 6;
    for (let i = 0; i < count; i++) {
      this.nebulae.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        baseX: Math.random() * this.canvas.width,
        baseY: Math.random() * this.canvas.height,
        radius: 120 + Math.random() * 200,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 0.015 + Math.random() * 0.025,
        phase: Math.random() * Math.PI * 2,
        speed: 0.0001 + Math.random() * 0.0002,
      });
    }
  }

  private renderMilkyWay() {
    const mw = document.createElement('canvas');
    mw.width = this.canvas.width;
    mw.height = this.canvas.height;
    const mwCtx = mw.getContext('2d')!;

    const w = this.canvas.width;
    const h = this.canvas.height;

    const positions = [
      { x: w * 0.25, y: h * 0.1, r: w * 0.35, a: this.isDark ? 0.035 : 0.025, c: this.isDark ? '160, 190, 230' : '100, 120, 155' },
      { x: w * 0.5, y: h * 0.35, r: w * 0.3, a: this.isDark ? 0.04 : 0.03, c: this.isDark ? '190, 175, 215' : '135, 120, 160' },
      { x: w * 0.7, y: h * 0.6, r: w * 0.25, a: this.isDark ? 0.03 : 0.02, c: this.isDark ? '150, 175, 215' : '105, 125, 160' },
      { x: w * 0.15, y: h * 0.55, r: w * 0.2, a: this.isDark ? 0.02 : 0.015, c: this.isDark ? '170, 195, 230' : '110, 130, 165' },
    ];

    for (const p of positions) {
      const gradient = mwCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      gradient.addColorStop(0, `rgba(${p.c}, ${p.a})`);
      gradient.addColorStop(0.5, `rgba(${p.c}, ${p.a * 0.5})`);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      mwCtx.fillStyle = gradient;
      mwCtx.fillRect(0, 0, w, h);
    }

    this.milkyWayCanvas = mw;
  }

  private rebuildSpatialGrid() {
    this.spatialGrid.clear();
    for (const star of this.stars) {
      if (star.layer !== 'near') continue;
      const cx = Math.floor(star.x / this.gridCellSize);
      const cy = Math.floor(star.y / this.gridCellSize);
      const key = `${cx},${cy}`;
      const cell = this.spatialGrid.get(key);
      if (cell) {
        cell.push(star);
      } else {
        this.spatialGrid.set(key, [star]);
      }
    }
  }

  private bindEvents() {
    window.addEventListener('resize', () => {
      const wasW = this.canvas.width;
      const wasH = this.canvas.height;
      this.resize();
      const scaleX = this.canvas.width / (wasW || 1);
      const scaleY = this.canvas.height / (wasH || 1);

      for (const star of this.stars) {
        star.baseX *= scaleX;
        star.baseY *= scaleY;
        star.x = star.baseX;
        star.y = star.baseY;
      }
      for (const neb of this.nebulae) {
        neb.baseX *= scaleX;
        neb.baseY *= scaleY;
        neb.x = neb.baseX;
        neb.y = neb.baseY;
      }
      this.renderMilkyWay();
    });

    window.addEventListener('mousemove', (e) => {
      this.mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      this.mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    const observer = new MutationObserver(() => {
      this.updateTheme();
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
  }

  private updateTheme() {
    this.isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    this.initNebulae();
    this.renderMilkyWay();
  }

  private setupObserver() {
    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          this.start();
        } else {
          this.stop();
        }
      },
      { threshold: 0 }
    );
    this.observer.observe(this.canvas);
  }

  start() {
    if (this.animationId !== null) return;
    this.animate();
  }

  stop() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private animate = () => {
    this.animationId = requestAnimationFrame(this.animate);
    this.draw();
  };

  private draw() {
    const { ctx, canvas, stars } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Milky Way background
    if (this.milkyWayCanvas) {
      ctx.drawImage(this.milkyWayCanvas, 0, 0);
    }

    // Nebulae
    for (const neb of this.nebulae) {
      neb.phase += neb.speed;
      const driftX = Math.sin(neb.phase) * 30;
      const driftY = Math.cos(neb.phase * 0.7) * 20;
      neb.x = neb.baseX + driftX;
      neb.y = neb.baseY + driftY;

      const gradient = ctx.createRadialGradient(neb.x, neb.y, 0, neb.x, neb.y, neb.radius);
      gradient.addColorStop(0, `rgba(${neb.color}, ${neb.alpha})`);
      gradient.addColorStop(0.6, `rgba(${neb.color}, ${neb.alpha * 0.3})`);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Shooting stars
    this.updateShootingStars();

    this.rebuildSpatialGrid();

    // Draw stars by layer: distant first, then mid, then near
    const layerOrder: Star['layer'][] = ['distant', 'mid', 'near'];

    for (const layer of layerOrder) {
      for (const star of stars) {
        if (star.layer !== layer) continue;

        // Organic twinkle
        star.twinklePhase += star.twinkleSpeed;
        const twinkle = (
          Math.sin(star.twinklePhase) * 0.35
          + Math.sin(star.twinklePhase * 2.7 + 1.3) * 0.15
          + Math.sin(star.twinklePhase * 0.7 + 0.5) * 0.1
        ) * 0.5 + 0.5;
        const alpha = Math.max(0.05, twinkle * star.opacity);

        // Drift
        star.baseX += star.driftX * star.driftSpeed;
        star.baseY += star.driftY * star.driftSpeed;

        // Wrap around
        if (star.baseX < -10) star.baseX = canvas.width + 10;
        if (star.baseX > canvas.width + 10) star.baseX = -10;
        if (star.baseY < -10) star.baseY = canvas.height + 10;
        if (star.baseY > canvas.height + 10) star.baseY = -10;

        // Parallax
        const layerConfig = this.layers.find((l) => l.distance === star.layer)!;
        const parallaxX = this.mouseX * layerConfig.parallaxFactor;
        const parallaxY = this.mouseY * layerConfig.parallaxFactor;
        star.x = star.baseX + parallaxX * (star.radius / layerConfig.maxRadius);
        star.y = star.baseY + parallaxY * (star.radius / layerConfig.maxRadius);

        // Draw star
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);

        // Brightest stars get a subtle glow
        if (star.layer === 'near' && alpha > 0.6) {
          const glowGrad = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.radius * 3);
          glowGrad.addColorStop(0, `rgba(${star.color}, ${alpha * 0.3})`);
          glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = glowGrad;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        }

        ctx.fillStyle = `rgba(${star.color}, ${alpha})`;
        ctx.fill();
      }

      // Constellation lines only for near-layer stars
      if (layer === 'near') {
        const processed = new Set<Star>();
        for (const star of stars) {
          if (star.layer !== 'near') continue;
          processed.add(star);

          const cx = Math.floor(star.x / this.gridCellSize);
          const cy = Math.floor(star.y / this.gridCellSize);

          for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
              const key = `${cx + dx},${cy + dy}`;
              const cell = this.spatialGrid.get(key);
              if (!cell) continue;

              for (const other of cell) {
                if (processed.has(other)) continue;
                const ddx = star.x - other.x;
                const ddy = star.y - other.y;
                const dist = Math.sqrt(ddx * ddx + ddy * ddy);
                if (dist < 80) {
                  const avgAlpha = (
                    (Math.sin(star.twinklePhase) * 0.5 + 0.5) * star.opacity
                    + (Math.sin(other.twinklePhase) * 0.5 + 0.5) * other.opacity
                  ) / 2;
                  const lineAlpha = (1 - dist / 80) * 0.05 * avgAlpha;
                  ctx.beginPath();
                  ctx.moveTo(star.x, star.y);
                  ctx.lineTo(other.x, other.y);
                  ctx.strokeStyle = `rgba(${star.color}, ${lineAlpha})`;
                  ctx.lineWidth = 0.3;
                  ctx.stroke();
                }
              }
            }
          }
        }
      }
    }

    // Draw shooting stars on top
    for (const ss of this.shootingStars) {
      this.drawShootingStar(ss);
    }
  }

  private updateShootingStars() {
    this.shootingStarTimer++;
    if (this.shootingStarTimer > 180 + Math.random() * 300) {
      this.spawnShootingStar();
      this.shootingStarTimer = 0;
    }

    const alive: ShootingStar[] = [];
    for (const ss of this.shootingStars) {
      ss.life -= 1 / ss.maxLife;
      ss.x += ss.vx;
      ss.y += ss.vy;
      ss.trail.push({ x: ss.x, y: ss.y });
      if (ss.trail.length > 20) ss.trail.shift();
      if (ss.life > 0) alive.push(ss);
    }
    this.shootingStars = alive;
  }

  private spawnShootingStar() {
    const angle = Math.PI * 0.2 + Math.random() * Math.PI * 0.2;
    const speed = 3 + Math.random() * 7;
    this.shootingStars.push({
      x: Math.random() * this.canvas.width * 0.8 + this.canvas.width * 0.1,
      y: Math.random() * this.canvas.height * 0.25,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      maxLife: 35 + Math.random() * 35,
      trail: [],
      color: '255, 245, 230',
    });
  }

  private drawShootingStar(ss: ShootingStar) {
    const ctx = this.ctx;

    // Trail
    if (ss.trail.length > 1) {
      for (let i = 1; i < ss.trail.length; i++) {
        const t = i / ss.trail.length;
        ctx.beginPath();
        ctx.moveTo(ss.trail[i - 1].x, ss.trail[i - 1].y);
        ctx.lineTo(ss.trail[i].x, ss.trail[i].y);
        ctx.strokeStyle = `rgba(${ss.color}, ${t * 0.35 * ss.life})`;
        ctx.lineWidth = t * 2;
        ctx.stroke();
      }
    }

    // Head glow
    const glowGrad = ctx.createRadialGradient(ss.x, ss.y, 0, ss.x, ss.y, 10);
    glowGrad.addColorStop(0, `rgba(${ss.color}, ${0.7 * ss.life})`);
    glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(ss.x, ss.y, 10, 0, Math.PI * 2);
    ctx.fill();

    // Head dot
    ctx.beginPath();
    ctx.arc(ss.x, ss.y, 1.2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * ss.life})`;
    ctx.fill();
  }

  destroy() {
    this.stop();
    this.observer.disconnect();
  }
}
