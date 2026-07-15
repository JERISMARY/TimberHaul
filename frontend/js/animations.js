/* ============================================================
   TimberHaul — Animations JS
   IntersectionObserver scroll reveals, 3D tilt, parallax,
   counter, particles
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initScrollReveal();
  initCounters();
  init3DTilt();
  initParallax();
  initParticles();
  initProgressiveImages();
  initGSAP();
});

// ─── Scroll Reveal ────────────────────────────────────────────
function initScrollReveal() {
  const elements = document.querySelectorAll('[data-reveal]');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        // Don't unobserve — allow re-animation on revisit? Keep observed for stagger parents
        if (!entry.target.classList.contains('stagger-children')) {
          observer.unobserve(entry.target);
        }
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -60px 0px'
  });

  elements.forEach(el => observer.observe(el));

  // Also handle stagger-children
  const staggerEls = document.querySelectorAll('.stagger-children');
  const staggerObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        staggerObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  staggerEls.forEach(el => staggerObserver.observe(el));
}

// ─── Counter Animation ────────────────────────────────────────
function initCounters() {
  const counters = document.querySelectorAll('[data-target]');
  if (!counters.length) return;

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const el = entry.target;
      const target = parseInt(el.dataset.target, 10);
      const duration = 2000;
      const start = performance.now();

      function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(eased * target);

        el.textContent = current >= 1000
          ? current.toLocaleString('en-IN')
          : current;

        if (progress < 1) requestAnimationFrame(update);
        else el.textContent = target >= 1000
          ? target.toLocaleString('en-IN')
          : target;
      }

      requestAnimationFrame(update);
      counterObserver.unobserve(el);
    });
  }, { threshold: 0.5 });

  counters.forEach(el => counterObserver.observe(el));
}

// ─── 3D Tilt Effect ───────────────────────────────────────────
function init3DTilt() {
  const cards = document.querySelectorAll('.tilt-card, .glass-card, .feature-card');

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      const tiltX = (y - 0.5) * -14;
      const tiltY = (x - 0.5) * 14;

      card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(8px)`;
      card.style.transition = 'transform 0.1s linear';

      // Update shine effect
      const shine = card.querySelector('.tilt-card-shine');
      if (shine) {
        shine.style.setProperty('--mouse-x', `${x * 100}%`);
        shine.style.setProperty('--mouse-y', `${y * 100}%`);
      }
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform 0.4s var(--ease-spring)';
    });
  });
}

// ─── Mouse Parallax ───────────────────────────────────────────
function initParallax() {
  const heroBg = document.querySelector('.hero-bg-img');
  if (!heroBg) return;

  let mouseX = 0, mouseY = 0;
  let currentX = 0, currentY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 20;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 12;
  });

  function animateParallax() {
    currentX += (mouseX - currentX) * 0.05;
    currentY += (mouseY - currentY) * 0.05;

    heroBg.style.transform = `scale(1.08) translate(${currentX}px, ${currentY}px)`;
    requestAnimationFrame(animateParallax);
  }

  animateParallax();

  // Scroll parallax for hero
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    if (scrollY < window.innerHeight) {
      heroBg.style.transform = `scale(1.08) translateY(${scrollY * 0.3}px)`;
    }
  }, { passive: true });
}

// ─── Particle Canvas ──────────────────────────────────────────
function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let particles = [];

  function resize() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }

  resize();
  window.addEventListener('resize', resize);

  // Floating wood dust particles
  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 2 + 0.5;
      this.speedX = (Math.random() - 0.5) * 0.4;
      this.speedY = -Math.random() * 0.5 - 0.2;
      this.opacity = Math.random() * 0.4 + 0.05;
      this.color = Math.random() > 0.5 ? '#D4A843' : '#C8A96E';
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.opacity -= 0.0005;
      if (this.y < -10 || this.opacity <= 0) this.reset();
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = this.opacity;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Create particles
  for (let i = 0; i < 60; i++) {
    const p = new Particle();
    p.y = Math.random() * canvas.height; // Spread initially
    particles.push(p);
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animate);
  }

  animate();
}

// ─── Progressive image loading ────────────────────────────────
function initProgressiveImages() {
  const images = document.querySelectorAll('img[loading="lazy"]');

  if ('IntersectionObserver' in window) {
    const imgObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.addEventListener('load', () => img.classList.add('loaded'));
          imgObserver.unobserve(img);
        }
      });
    }, { rootMargin: '200px' });

    images.forEach(img => imgObserver.observe(img));
  }
}

// ─── GSAP Animations ────────────────────────────────────────────
function initGSAP() {
  if (typeof gsap === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  // Hero section animations
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.from('.hero-content h1', { y: 50, opacity: 0, duration: 1, delay: 0.2 })
    .from('.hero-content p', { y: 30, opacity: 0, duration: 0.8 }, '-=0.6')
    .from('.hero-content .hero-buttons', { y: 20, opacity: 0, duration: 0.6 }, '-=0.4')
    .from('.hero-content .badges-container', { opacity: 0, duration: 0.5 }, '-=0.2');

  // Scroll-triggered animations for sections
  gsap.utils.toArray('.section-header').forEach(header => {
    gsap.from(header, {
      scrollTrigger: {
        trigger: header,
        start: 'top 85%',
      },
      y: 40,
      opacity: 0,
      duration: 0.8,
      ease: 'power2.out'
    });
  });
}

// ─── Testimonials Auto-Slider ─────────────────────────────────
window.initReviewsSlider = function() {
  const track = document.getElementById('reviews-track');
  const prevBtn = document.getElementById('reviews-prev');
  const nextBtn = document.getElementById('reviews-next');
  const dots = document.querySelectorAll('#reviews-dots .slider-dot');

  if (!track) return;

  const cards = track.querySelectorAll('.review-card');
  const visibleCount = window.innerWidth > 992 ? 3 : window.innerWidth > 768 ? 2 : 1;
  const cardWidth = cards[0]?.offsetWidth + 32 || 0;
  let currentIdx = 0;
  let autoInterval;
  const maxIdx = Math.max(0, cards.length - visibleCount);

  function goTo(idx) {
    currentIdx = Math.max(0, Math.min(idx, maxIdx));
    track.style.transform = `translateX(-${currentIdx * (cardWidth)}px)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === currentIdx));
  }

  prevBtn?.addEventListener('click', () => { goTo(currentIdx - 1); resetAuto(); });
  nextBtn?.addEventListener('click', () => { goTo(currentIdx + 1); resetAuto(); });

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => { goTo(i); resetAuto(); });
  });

  function autoPlay() {
    autoInterval = setInterval(() => {
      goTo(currentIdx >= maxIdx ? 0 : currentIdx + 1);
    }, 5000);
  }

  function resetAuto() {
    clearInterval(autoInterval);
    autoPlay();
  }

  autoPlay();

  // Touch/swipe support
  let touchStart = 0;
  track.addEventListener('touchstart', (e) => { touchStart = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', (e) => {
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? goTo(currentIdx + 1) : goTo(currentIdx - 1);
      resetAuto();
    }
  });
};
