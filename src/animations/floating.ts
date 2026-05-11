import gsap from 'gsap';

export function initFloatingAnimations() {
  // Subtle parallax for geometric circles on mouse move
  const circles = document.querySelectorAll('.geometric-circle');

  document.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 2;
    const y = (e.clientY / window.innerHeight - 0.5) * 2;

    circles.forEach((circle, i) => {
      const factor = 10 + i * 3;
      gsap.to(circle, {
        x: x * factor,
        y: y * factor,
        duration: 1.5,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    });
  });
}
