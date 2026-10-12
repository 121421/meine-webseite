(() => {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const counts = [...document.querySelectorAll('[data-count]')];
  const frames = new Set();
  const completed = new WeakSet();
  const toggle = document.querySelector('.motion-toggle');
  let observer;
  function finalValues() { counts.forEach(el => el.textContent = el.dataset.count); }
  function stopMotion() {
    document.documentElement.classList.remove('motion-ready');
    observer?.disconnect();
    frames.forEach(cancelAnimationFrame); frames.clear(); finalValues();
    counts.forEach(el => completed.add(el));
  }
  function setup() {
    if (preference.matches || document.body.classList.contains('motion-paused')) return;
    document.documentElement.classList.add('motion-ready');
    observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      entry.target.querySelectorAll('[data-count]').forEach(el => {
        if (completed.has(el)) return;
        completed.add(el);
        const goal = Number(el.dataset.count), start = performance.now();
        function step(now) {
          if (preference.matches) { el.textContent = goal; return; }
          const progress = Math.min((now - start) / 1300, 1);
          el.textContent = Math.round(goal * (1 - Math.pow(1 - progress, 3)));
          if (progress < 1) { const id = requestAnimationFrame(t => { frames.delete(id); step(t); }); frames.add(id); }
        }
        const id = requestAnimationFrame(t => { frames.delete(id); step(t); }); frames.add(id);
      });
      observer.unobserve(entry.target);
    }), {threshold: .12});
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  }
  if ('IntersectionObserver' in window) setup();
  preference.addEventListener('change', () => {
    if (preference.matches) stopMotion();
    else if ('IntersectionObserver' in window) setup();
  });
  toggle?.addEventListener('click', () => {
    const paused = document.body.classList.toggle('motion-paused');
    toggle.textContent = paused ? 'Animationen fortsetzen' : 'Animationen pausieren';
    toggle.setAttribute('aria-pressed', String(paused));
    if (paused) stopMotion();
    else if ('IntersectionObserver' in window) setup();
  });
  if ('IntersectionObserver' in window) {
    const sections = [...document.querySelectorAll('#start, main section[id]')];
    const visibility = new Map();
    const active = new IntersectionObserver(entries => {
      entries.forEach(entry => visibility.set(entry.target, entry.isIntersecting));
      const current = sections.find(section => visibility.get(section));
      document.querySelectorAll('nav a').forEach(a => {
        if (current && a.hash === '#' + current.id) a.setAttribute('aria-current', 'location');
        else a.removeAttribute('aria-current');
      });
    }, {rootMargin:'-20% 0px -50% 0px'});
    sections.forEach(section => active.observe(section));
  }
})();
