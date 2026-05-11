interface Star {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  radius: number;
  opacity: number;
  twinklePhase: number;
  twinkleSpeed: number;
  driftX: number;
  driftY: number;
  driftSpeed: number;
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

  constructor(canvas: HTMLCanvasElement, starCount = 200) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.resize();
    this.initStars(starCount);
    this.bindEvents();
    this.setupObserver();
    this.updateTheme();
  }

  private resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  private initStars(count: number) {
    this.stars = [];
    for (let i = 0; i < count; i++) {
      const x = Math.random() * this.canvas.width;
      const y = Math.random() * this.canvas.height;
      this.stars.push({
        x,
        y,
        baseX: x,
        baseY: y,
        radius: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.5 + 0.3,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        driftX: (Math.random() - 0.5) * 0.3,
        driftY: (Math.random() - 0.5) * 0.2 - 0.1,
        driftSpeed: Math.random() * 0.0003 + 0.0001,
      });
    }
  }

  private bindEvents() {
    window.addEventListener('resize', () => {
      this.resize();
      this.stars.forEach((s) => {
        s.baseX = Math.random() * this.canvas.width;
        s.baseY = Math.random() * this.canvas.height;
        s.x = s.baseX;
        s.y = s.baseY;
      });
    });

    window.addEventListener('mousemove', (e) => {
      this.mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      this.mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    // Observe data-theme changes
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

    const starColor = this.isDark
      ? '180, 200, 220'
      : '49, 67, 90';

    for (const star of stars) {
      // Twinkle
      star.twinklePhase += star.twinkleSpeed;
      const twinkle = Math.sin(star.twinklePhase) * 0.25 + 0.55;
      const alpha = twinkle * star.opacity;

      // Drift
      star.baseX += star.driftX * star.driftSpeed;
      star.baseY += star.driftY * star.driftSpeed;

      // Wrap around
      if (star.baseX < -10) star.baseX = canvas.width + 10;
      if (star.baseX > canvas.width + 10) star.baseX = -10;
      if (star.baseY < -10) star.baseY = canvas.height + 10;
      if (star.baseY > canvas.height + 10) star.baseY = -10;

      // Parallax
      const parallaxX = this.mouseX * 15;
      const parallaxY = this.mouseY * 15;
      star.x = star.baseX + parallaxX * (star.radius / 2);
      star.y = star.baseY + parallaxY * (star.radius / 2);

      // Draw star
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${starColor}, ${alpha})`;
      ctx.fill();

      // Constellation lines
      for (const other of stars) {
        if (other === star) continue;
        const dx = star.x - other.x;
        const dy = star.y - other.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 80) {
          const lineAlpha = (1 - dist / 80) * 0.06 * alpha;
          ctx.beginPath();
          ctx.moveTo(star.x, star.y);
          ctx.lineTo(other.x, other.y);
          ctx.strokeStyle = `rgba(${starColor}, ${lineAlpha})`;
          ctx.lineWidth = 0.3;
          ctx.stroke();
        }
      }
    }
  }

  destroy() {
    this.stop();
    this.observer.disconnect();
    window.removeEventListener('resize', this.resize);
  }
}
