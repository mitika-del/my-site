/* airTENO — scripts.js */

/* ── Sticky nav shadow + scroll state ─────── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

/* ── Scroll progress bar ─────────────────── */
const scrollProgress = document.getElementById('scrollProgress');
window.addEventListener('scroll', () => {
  const scrolled  = window.scrollY;
  const maxScroll = document.body.scrollHeight - window.innerHeight;
  scrollProgress.style.width = Math.min((scrolled / maxScroll) * 100, 100) + '%';
}, { passive: true });

/* ── Mobile nav toggle ─────────────────────── */
const navToggle = document.getElementById('navToggle');
navToggle.addEventListener('click', () => {
  navbar.classList.toggle('menu-open');
  navToggle.classList.toggle('open');
});
// Close on link click
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    navbar.classList.remove('menu-open');
    navToggle.classList.remove('open');
  });
});

/* ── Scroll reveal (IntersectionObserver) ──── */
const reveals = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
reveals.forEach(el => revealObserver.observe(el));

/* ── Stat counter animation ────────────────── */
function animateCounter(el, target, duration = 1800) {
  const start = performance.now();
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  function tick(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const current = Math.round(easeOut(progress) * target);
    el.textContent = current;
    if (progress < 1) requestAnimationFrame(tick);
    else el.textContent = target;
  }
  requestAnimationFrame(tick);
}

const statNums = document.querySelectorAll('.stat-num[data-target]');
const statsObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el     = entry.target;
      const target = parseInt(el.dataset.target, 10);
      const block  = el.closest('.stat-block');
      animateCounter(el, target);
      if (block) {
        setTimeout(() => {
          block.classList.add('lit');
          block.addEventListener('animationend', () => block.classList.remove('lit'), { once: true });
        }, 400);
      }
      statsObserver.unobserve(el);
    }
  });
}, { threshold: 0.4 });
statNums.forEach(el => statsObserver.observe(el));

/* ── Contact form → WhatsApp ───────────────── */
const form = document.getElementById('assessmentForm');
if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name     = document.getElementById('name').value.trim();
    const phone    = document.getElementById('phone').value.trim();
    const area     = document.getElementById('area').value.trim();
    const homeType = document.getElementById('home-type').value;

    // Store lead in database
    fetch('/api/assessment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, area, home_type: homeType })
    }).catch(() => {});

    // Show success state
    form.innerHTML = `
      <div class="form-success">
        <div class="form-success-icon">✓</div>
        <h3>Request accepted.</h3>
        <p>We'll be in touch to schedule your free site assessment.</p>
      </div>
    `;
  });
}

/* ── FAQ Accordion ─────────────────────────── */
document.querySelectorAll('.faq-q').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.faq-item');
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
});

/* ── Smooth scroll offset for fixed nav ────── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offset = navbar.offsetHeight + 16;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});


