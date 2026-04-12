/* airTENO — scripts.js */

/* ── Sticky nav shadow + scroll state ─────── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 20);
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
      const el = entry.target;
      const target = parseInt(el.dataset.target, 10);
      animateCounter(el, target);
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

    const msg = [
      `Hi, I'd like to book a free site assessment for airTENO.`,
      `Name: ${name}`,
      phone    ? `Phone: ${phone}` : null,
      area     ? `Area: ${area}` : null,
      homeType ? `Home type: ${homeType}` : null,
    ].filter(Boolean).join('\n');

    // Store in database — fire-and-forget, never blocks WhatsApp open
    fetch('/api/assessment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, area, home_type: homeType })
    }).catch(() => {});

    window.open(
      `https://wa.me/917758070490?text=${encodeURIComponent(msg)}`,
      '_blank',
      'noopener,noreferrer'
    );

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

/* ── Launcher show/hide (shared) ───────────── */
const chatLaunchers = document.getElementById('chatLaunchers');
function hideLaunchers() { chatLaunchers.setAttribute('hidden', ''); }
function showLaunchers() { chatLaunchers.removeAttribute('hidden'); }

/* ── Q&A Chat Widget ─────────────────────────── */
(function () {
  const chatWindow  = document.getElementById('chatWindow');
  const closeBtn    = document.getElementById('chatClose');
  const chatForm    = document.getElementById('chatForm');
  const chatInput   = document.getElementById('chatInput');
  const messagesDiv = document.getElementById('chatMessages');
  const toggle      = document.getElementById('chatToggle');

  let history = [];

  function openChat() {
    hideLaunchers();
    chatWindow.removeAttribute('hidden');
    chatInput.focus();
    scrollBottom();
  }

  function closeChat() {
    chatWindow.setAttribute('hidden', '');
    showLaunchers();
  }

  toggle.addEventListener('click', openChat);
  closeBtn.addEventListener('click', closeChat);

  function appendMessage(role, text) {
    const wrap   = document.createElement('div');
    wrap.className = `chat-msg chat-msg--${role === 'user' ? 'user' : 'bot'}`;
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    bubble.textContent = text;
    wrap.appendChild(bubble);
    messagesDiv.appendChild(wrap);
    scrollBottom();
  }

  function showTyping() {
    const wrap = document.createElement('div');
    wrap.id = 'chatTypingMsg';
    wrap.className = 'chat-msg chat-msg--bot chat-msg--typing';
    wrap.innerHTML = '<div class="chat-bubble"><span></span><span></span><span></span></div>';
    messagesDiv.appendChild(wrap);
    scrollBottom();
  }

  function hideTyping() {
    const el = document.getElementById('chatTypingMsg');
    if (el) el.remove();
  }

  function scrollBottom() { messagesDiv.scrollTop = messagesDiv.scrollHeight; }

  function setInputState(enabled) {
    chatInput.disabled = !enabled;
    chatForm.querySelector('.chat-send').disabled = !enabled;
  }

  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;

    chatInput.value = '';
    setInputState(false);
    appendMessage('user', text);
    history.push({ role: 'user', content: text });
    showTyping();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history })
      });
      hideTyping();

      let reply;
      if (res.ok) {
        const data = await res.json();
        reply = data.reply || "I'd suggest reaching out directly — WhatsApp us at +91-7758070490.";
      } else {
        reply = "I'd suggest reaching out directly — WhatsApp us at +91-7758070490.";
      }

      appendMessage('assistant', reply);
      history.push({ role: 'assistant', content: reply });
    } catch {
      hideTyping();
      appendMessage('assistant', "Something went wrong on my end. Reach us directly on WhatsApp at +91-7758070490.");
    }

    setInputState(true);
    chatInput.focus();
  });
})();

/* ── Proposal Widget ─────────────────────────── */
(function () {
  const proposalWindow  = document.getElementById('proposalWindow');
  const closeBtn        = document.getElementById('proposalClose');
  const proposalForm    = document.getElementById('proposalForm');
  const proposalInput   = document.getElementById('proposalInput');
  const messagesDiv     = document.getElementById('proposalMessages');
  const toggle          = document.getElementById('proposalToggle');
  const stepNumEl       = document.getElementById('proposalStepNum');
  const progressFill    = document.getElementById('proposalProgressFill');

  let history     = [];
  let started     = false;
  let complete    = false;

  function openProposal() {
    hideLaunchers();
    proposalWindow.removeAttribute('hidden');
    scrollBottom();
    if (!started) {
      started = true;
      startIntake();
    } else if (!complete) {
      proposalInput.focus();
    }
  }

  function closeProposal() {
    proposalWindow.setAttribute('hidden', '');
    showLaunchers();
  }

  toggle.addEventListener('click', openProposal);
  closeBtn.addEventListener('click', closeProposal);

  function appendMessage(role, text) {
    const wrap   = document.createElement('div');
    wrap.className = `chat-msg chat-msg--${role === 'user' ? 'user' : 'bot'}`;
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    bubble.textContent = text;
    wrap.appendChild(bubble);
    messagesDiv.appendChild(wrap);
    scrollBottom();
  }

  function showTyping() {
    const wrap = document.createElement('div');
    wrap.id = 'proposalTypingMsg';
    wrap.className = 'chat-msg chat-msg--bot chat-msg--typing';
    wrap.innerHTML = '<div class="chat-bubble"><span></span><span></span><span></span></div>';
    messagesDiv.appendChild(wrap);
    scrollBottom();
  }

  function hideTyping() {
    const el = document.getElementById('proposalTypingMsg');
    if (el) el.remove();
  }

  function scrollBottom() { messagesDiv.scrollTop = messagesDiv.scrollHeight; }

  function setInputState(enabled) {
    proposalInput.disabled = !enabled;
    proposalForm.querySelector('.chat-send').disabled = !enabled;
  }

  function updateProgress(step) {
    stepNumEl.textContent = step;
    progressFill.style.width = `${(step / 6) * 100}%`;
  }

  async function sendMessage(text, showUserBubble = true) {
    if (showUserBubble) appendMessage('user', text);
    history.push({ role: 'user', content: text });
    showTyping();
    setInputState(false);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history })
      });
      hideTyping();

      if (!res.ok) {
        appendMessage('assistant', "Something went wrong. Reach us on WhatsApp at +91-7758070490.");
        setInputState(true);
        return;
      }

      const data = await res.json();
      const reply = data.reply || "I'd suggest reaching out directly — WhatsApp us at +91-7758070490.";
      appendMessage('assistant', reply);
      history.push({ role: 'assistant', content: reply });

      if (data.intake_step) updateProgress(data.intake_step);

      if (data.intake_complete) {
        complete = true;
        setInputState(false);
        proposalInput.placeholder = 'Proposal request submitted';
        updateProgress(6);
        try {
          await fetch('/api/generate-proposal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ intakeData: data.intake_data, conversation: history })
          });
        } catch { /* fail silently — stub */ }
        return;
      }

      setInputState(true);
      proposalInput.focus();
    } catch {
      hideTyping();
      appendMessage('assistant', "Something went wrong. Reach us on WhatsApp at +91-7758070490.");
      setInputState(true);
    }
  }

  function startIntake() {
    sendMessage("I'd like to get a proposal.", false);
  }

  proposalForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (complete) return;
    const text = proposalInput.value.trim();
    if (!text) return;
    proposalInput.value = '';
    await sendMessage(text, true);
  });
})();
