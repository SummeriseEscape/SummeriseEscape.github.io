export function initClickEffects() {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (!target.closest('a, button, .cat-link, .post-card, .nav-link, [role="button"]')) return;
    createRipple(e.clientX, e.clientY);
  });
}

function createRipple(x: number, y: number) {
  const ripple = document.createElement('span');
  ripple.className = 'ripple-effect';
  const size = 40;
  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${x - size / 2}px`;
  ripple.style.top = `${y - size / 2}px`;
  document.body.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
}
