import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function initEntranceAnimations() {
  gsap.registerPlugin(ScrollTrigger);

  // Hero blur-fade
  gsap.from('#hero-title', {
    opacity: 0,
    filter: 'blur(8px)',
    duration: 1.2,
    ease: 'power2.out',
  });

  gsap.from('#hero-tagline', {
    opacity: 0,
    y: 20,
    duration: 1,
    delay: 0.3,
    ease: 'power2.out',
  });

  // Geometric circles stagger
  gsap.from('.geometric-circle', {
    opacity: 0,
    scale: 0.8,
    duration: 1,
    stagger: 0.2,
    delay: 0.5,
    ease: 'power2.out',
  });

  // Post cards fade-in on scroll
  gsap.from('.post-card', {
    opacity: 0,
    y: 40,
    duration: 0.8,
    stagger: 0.15,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: '.post-grid-wrapper',
      start: 'top 85%',
    },
  });

  // Post content stagger paragraphs
  gsap.from('.post-content > p', {
    opacity: 0,
    y: 20,
    duration: 0.6,
    stagger: 0.1,
    delay: 0.3,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: '.post-content',
      start: 'top 90%',
    },
  });
}
