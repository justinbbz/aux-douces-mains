/* Aux Douces Mains · mise en scène : film d'accueil, légendes calées sur la vidéo, révélations,
   défilement horizontal des soins, avis, visionneuse, horaires, demande de rendez-vous.
   Données : data.js · aucun appel réseau (la carte Google ne se charge qu'au clic). */
(() => {
  'use strict';

  const D = window.ADM;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasG = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  const qs = new URLSearchParams(location.search);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const api = (window.ADMX = window.ADMX || {});
  if (hasG) gsap.registerPlugin(ScrollTrigger);

  /* ------------------------------------------------------------ défilement doux (Lenis) */
  let lenis = null;
  if (typeof Lenis !== 'undefined' && !reduce) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    if (hasG) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }
  api.lenis = lenis;
  window.CSX = window.CSX || {};
  window.CSX.lenis = lenis;
  const navH = () => parseFloat(getComputedStyle(root).getPropertyValue('--nav-h')) || 78;
  const scrollToEl = (el, extra = 0) => {
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - navH() + extra;
    if (lenis) lenis.scrollTo(y, { duration: 1.5, easing: (t) => 1 - Math.pow(1 - t, 4) });
    else window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
  };
  const lock = (on) => { if (lenis) (on ? lenis.stop() : lenis.start()); root.style.overflow = on && !lenis ? 'hidden' : ''; };

  /* ------------------------------------------------------------ contenus construits */
  function buildAvis() {
    const host = $('#avisTrack');
    if (!host) return;
    const star = '<svg class="i"><use href="#i-star"/></svg>';
    host.innerHTML = D.avis.map((a) =>
      '<article class="rv"><span class="stars" role="img" aria-label="5 étoiles sur 5">' + star.repeat(5) + '</span>' +
      '<blockquote>' + esc(a.t) + '</blockquote>' +
      '<footer><span class="rv__av" aria-hidden="true">' + esc(a.n.charAt(0)) + '</span><span><b>' + esc(a.n) + '</b>Avis Google · ' + esc(a.when) + '</span></footer></article>'
    ).join('');
  }

  function buildHours() {
    const host = $('#hoursBody');
    if (!host) return;
    const fmt = (h) => h.replace(':00', '').replace(/^0/, '') + ' h';
    const order = [1, 2, 3, 4, 5, 6, 0];
    host.innerHTML = order.map((d) => {
      const r = D.hours[d];
      const label = D.days[d].charAt(0).toUpperCase() + D.days[d].slice(1);
      return '<tr data-d="' + d + '"><th scope="row">' + label + '</th><td>' + (r ? r.map((x) => fmt(x[0]) + ' – ' + fmt(x[1])).join(', ') : 'Fermé') + '</td></tr>';
    }).join('');
  }

  /* heure de Paris, quel que soit le fuseau du visiteur */
  function parisNow() {
    const f = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', weekday: 'long', hour: 'numeric', minute: 'numeric', hour12: false });
    const p = Object.fromEntries(f.formatToParts(new Date()).map((x) => [x.type, x.value]));
    const day = D.days.indexOf(p.weekday.toLowerCase());
    return { day, min: (parseInt(p.hour, 10) % 24) * 60 + parseInt(p.minute, 10) };
  }
  const toMin = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
  const hLabel = (m) => Math.floor(m / 60) + ' h' + (m % 60 ? ' ' + String(m % 60).padStart(2, '0') : '');

  function updateStatus() {
    const box = $('#status'), txt = $('#statusTxt');
    if (!box) return;
    const now = parisNow();
    $$('#hoursBody tr').forEach((tr) => tr.classList.toggle('is-today', Number(tr.dataset.d) === now.day));
    const today = D.hours[now.day];
    let open = false, msg = '';
    if (today) {
      for (const [a, b] of today) {
        if (now.min >= toMin(a) && now.min < toMin(b)) { open = true; msg = 'Ouvert maintenant · jusqu’à ' + hLabel(toMin(b)); }
        else if (now.min < toMin(a) && !msg) msg = 'Fermé · ouvre aujourd’hui à ' + hLabel(toMin(a));
      }
    }
    if (!msg) {
      for (let k = 1; k <= 7; k++) {
        const d = (now.day + k) % 7;
        if (D.hours[d]) { msg = 'Fermé · ouvre ' + (k === 1 ? 'demain' : D.days[d]) + ' à ' + hLabel(toMin(D.hours[d][0][0])); break; }
      }
    }
    box.classList.toggle('is-open', open);
    txt.textContent = msg;
  }

  /* ------------------------------------------------------------ film d'accueil + légendes */
  const video = $('#film');
  const cap = $('.cap');
  const capNum = $('#capNum'), capTitle = $('#capTitle'), capText = $('#capText');
  const ticksHost = $('#ticks');
  const SH = D.shots;
  let curShot = -1, userPaused = false, mode = null, tickEls = [];

  function buildTicks() {
    if (!ticksHost) return;
    ticksHost.innerHTML = D.captions.map((c, i) => '<button class="tick" type="button" aria-label="Aller au chapitre ' + (i + 1) + ' : ' + esc(c.t) + '"><i></i></button>').join('');
    tickEls = $$('.tick', ticksHost);
    tickEls.forEach((b, i) => b.addEventListener('click', () => {
      if (!video) return;
      video.currentTime = SH[i] + (i === 0 ? 0.7 : 0.45);
      if (!userPaused) playVideo();
    }));
  }

  const shotAt = (t) => { let k = 0; for (let i = 0; i < SH.length; i++) if (t >= SH[i] - 0.1) k = i; return k; };
  function setShot(i) {
    if (i === curShot || !cap) return;
    curShot = i;
    const c = D.captions[i];
    capNum.textContent = c.n; capTitle.textContent = c.t; capText.textContent = c.x;
    cap.classList.remove('is-swap'); void cap.offsetWidth; cap.classList.add('is-swap');
    if (hero) hero.classList.toggle('is-bright', i === D.captions.length - 1);
  }
  function tickFrame() {
    if (video && cap) {
      const t = video.currentTime || 0;
      const i = shotAt(t);
      setShot(i);
      for (let k = 0; k < tickEls.length; k++) {
        const end = SH[k + 1] !== undefined ? SH[k + 1] : D.total;
        const p = k < i ? 1 : k === i ? clamp((t - SH[k]) / (end - SH[k]), 0, 1) : 0;
        tickEls[k].firstElementChild.style.width = (p * 100).toFixed(1) + '%';
      }
    }
    requestAnimationFrame(tickFrame);
  }

  const wantMobile = () => matchMedia('(max-width: 820px), (max-aspect-ratio: 4/5)').matches;
  /* image « de repos » : si la lecture automatique est bloquée (économie d'énergie, mouvement réduit), on montre un plan éclairé plutôt que la 1re image, sombre (fondu d'entrée) */
  const REST = 1.3;
  function rest() { try { if (video.readyState > 0 && video.currentTime < REST) video.currentTime = REST; } catch (e) { /* ignoré */ } }
  function playVideo() { if (!video) return; const p = video.play(); if (p && p.catch) p.catch(() => { setPauseUi(true); rest(); }); }
  function setPauseUi(paused) {
    const b = $('#pause'); if (!b) return;
    b.setAttribute('aria-pressed', paused ? 'true' : 'false');
    b.setAttribute('aria-label', paused ? 'Relancer le film' : 'Mettre le film en pause');
    b.firstElementChild.firstElementChild.setAttribute('href', paused ? '#i-play' : '#i-pause');
  }
  function setSource() {
    if (!video) return;
    const m = wantMobile() ? 'mobile' : 'bureau';
    if (m === mode) return;
    mode = m;
    video.poster = 'assets/img/hero-poster-' + m + '.webp';
    video.src = 'assets/video/film-' + m + '.mp4';
    video.load();
    video.addEventListener('loadeddata', () => { if (video.paused) rest(); }, { once: true });
    if (!reduce && !userPaused) playVideo();
  }
  function initVideo() {
    if (!video) return;
    setSource();
    buildTicks();
    $('#pause') && $('#pause').addEventListener('click', () => {
      userPaused = !video.paused;
      if (userPaused) video.pause(); else playVideo();
      setPauseUi(userPaused);
    });
    if (reduce) { userPaused = true; video.pause(); setPauseUi(true); video.addEventListener('loadeddata', rest, { once: true }); if (video.readyState > 0) rest(); }
    let to;
    addEventListener('resize', () => { clearTimeout(to); to = setTimeout(setSource, 250); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => {
        if (userPaused) return;
        if (e.isIntersecting) playVideo(); else video.pause();
      }, { threshold: 0.05 }).observe($('.hero'));
    }
    requestAnimationFrame(tickFrame);
  }

  /* ------------------------------------------------------------ écran d'accueil + entrée du héros */
  const hero = $('.hero');
  function introHero(instant) {
    const items = $$('[data-hero]');
    const script = $('.hero__script');
    if (!hasG || instant || reduce) { hero && hero.classList.remove('is-pre'); return; }
    gsap.set(items, { opacity: 0, y: 26 });
    gsap.set(script, { clipPath: 'inset(0 100% 0 0)', y: 24 });
    hero.classList.remove('is-pre');
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.to($('[data-hero="1"]'), { opacity: 1, y: 0, duration: 1 }, 0)
      .to($('[data-hero="2"]'), { opacity: 1, y: 0, duration: 0.3 }, 0)
      .to(script, { clipPath: 'inset(0 -3% 0 0)', y: 0, duration: 2.2, ease: 'power2.inOut' }, 0.1)
      .to($('[data-hero="3"]'), { opacity: 1, y: 0, duration: 1.2 }, 1.1)
      .to($('[data-hero="4"]'), { opacity: 1, y: 0, duration: 1.1 }, 1.4)
      .to($$('[data-hero="5"]'), { opacity: 1, y: 0, duration: 1.1, stagger: 0.12 }, 1.7)
      .set(script, { clearProps: 'clipPath' });
  }
  function runPre() {
    const pre = $('#pre');
    let seen = false;
    try { seen = !!sessionStorage.getItem('adm-seen'); } catch (e) { /* stockage indisponible */ }
    if (!pre) return introHero(true);
    if (!hasG || reduce || qs.has('nopreload') || seen) {
      pre.classList.add('is-gone');
      return introHero(true);
    }
    hero.classList.add('is-pre');
    lock(true);
    const o = { v: 0 }, pct = $('#prePct');
    const tl = gsap.timeline({ onComplete() { pre.classList.add('is-gone'); lock(false); try { sessionStorage.setItem('adm-seen', '1'); } catch (e) { /* ignoré */ } } });
    tl.to('.pre__logo', { clipPath: 'inset(0 0% 0 0)', duration: 1.5, ease: 'power2.inOut' }, 0.15)
      .to('.pre__line i', { scaleX: 1, duration: 1.8, ease: 'power1.inOut' }, 0)
      .to(o, { v: 100, duration: 1.8, ease: 'power1.inOut', onUpdate() { pct.textContent = Math.round(o.v); } }, 0)
      .to(pre, { yPercent: -100, duration: 1.05, ease: 'power4.inOut' }, '+=0.25')
      .add(() => introHero(false), '-=0.6');
  }

  /* ------------------------------------------------------------ révélations (IntersectionObserver : robustes avec les sections épinglées) */
  function initReveals() {
    const els = $$('[data-reveal], .gal__i');
    $$('.stat').forEach((s, i) => s.style.setProperty('--i', i));
    $$('.timeline li, .res__cards .rcard, .info li').forEach((el, i) => el.style.setProperty('--d', (i % 3) * 0.08 + 's'));
    if (!('IntersectionObserver' in window) || reduce) { els.forEach((e) => e.classList.add('is-in')); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach((e) => io.observe(e));
  }

  /* manifeste : les mots s'allument au défilement */
  function initManifeste() {
    const el = $('[data-words]');
    if (!el || !hasG || reduce) return;
    const split = (node) => {
      Array.from(node.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((tok) => {
            if (!tok) return;
            if (/^\s+$/.test(tok)) frag.appendChild(document.createTextNode(' '));
            else { const s = document.createElement('span'); s.className = 'w'; s.textContent = tok; frag.appendChild(s); }
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) split(n);
      });
    };
    const label = el.textContent;
    split(el);
    el.setAttribute('aria-label', label);
    $$('.w', el).forEach((w) => w.setAttribute('aria-hidden', 'true'));
    gsap.fromTo($$('.w', el), { opacity: 0.14 }, { opacity: 1, ease: 'none', stagger: 0.12, scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 55%', scrub: true } });
  }

  function initCounters() {
    const els = $$('[data-count]');
    const fmt = (v, dec, plain) => {
      const s = v.toFixed(dec).replace('.', ',');
      return plain ? s : s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    };
    const run = (el) => {
      const to = parseFloat(el.dataset.count), dec = parseInt(el.dataset.dec || '0', 10), plain = 'plain' in el.dataset;
      const from = parseFloat(el.dataset.from || '0');
      if (!hasG || reduce) { el.textContent = fmt(to, dec, plain); return; }
      const o = { v: from };
      el.textContent = fmt(from, dec, plain);
      gsap.to(o, { v: to, duration: 2.2, ease: 'power3.out', onUpdate() { el.textContent = fmt(o.v, dec, plain); }, onComplete() { el.textContent = fmt(to, dec, plain); } });
    };
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } }), { threshold: 0.6 });
    els.forEach((el) => io.observe(el));
  }

  /* bandeau défilant : vitesse liée au défilement */
  function initMarquee() {
    const row = $('#marqueeRow');
    if (!row || !hasG || reduce) return;
    const unit = row.innerHTML;
    row.innerHTML = unit;
    const unitW = row.scrollWidth;
    const reps = Math.max(2, Math.ceil((innerWidth * 1.3) / unitW) + 1);
    row.innerHTML = unit.repeat(reps * 2);
    const half = () => row.scrollWidth / 2;
    let x = 0;
    gsap.ticker.add((time, dt) => {
      const v = lenis ? lenis.velocity : 0;
      x -= (0.7 + Math.min(Math.abs(v) * 0.14, 9)) * (dt / 16.7);
      const h = half();
      if (-x >= h) x += h;
      row.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
    });
  }

  /* ------------------------------------------------------------ soins : défilement horizontal épinglé (bureau) */
  function initSoins() {
    const track = $('#soinsTrack');
    if (!track || !hasG) return;
    const section = $('.soins');
    const num = $('#soinsNum'), bar = $('#soinsBar');
    const cards = $$('.soin:not(.soin--end)', track);
    const mm = gsap.matchMedia();
    mm.add('(min-width: 1000px) and (prefers-reduced-motion: no-preference)', () => {
      const dist = () => Math.max(0, track.scrollWidth - innerWidth);
      const tween = gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {
          trigger: section, start: 'top top', end: () => '+=' + Math.round(dist() * 1.05), pin: true, scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true,
          onUpdate(self) {
            const i = Math.min(cards.length - 1, Math.floor(self.progress * cards.length * 0.999));
            num.textContent = String(i + 1).padStart(2, '0');
            bar.style.transform = 'scaleX(' + (0.1 + 0.9 * self.progress).toFixed(3) + ')';
          }
        }
      });
      cards.forEach((card) => {
        const img = $('.soin__img img', card);
        gsap.fromTo(img, { xPercent: -6 }, { xPercent: 6, ease: 'none', scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
      });
      /* clavier : le focus d'un lien « Demander ce soin » amène la carte à l'écran */
      const onFocus = (e) => {
        const card = e.target.closest && e.target.closest('.soin');
        const st = tween.scrollTrigger;
        if (!card || !st || !cards.includes(card)) return;
        const left = card.offsetLeft - (innerWidth - card.offsetWidth) / 2;
        const target = st.start + clamp(left / dist(), 0, 1) * (st.end - st.start);
        if (lenis) lenis.scrollTo(target, { duration: 1 }); else window.scrollTo(0, target);
      };
      track.addEventListener('focusin', onFocus);
      return () => { track.removeEventListener('focusin', onFocus); };
    });
    /* mobile : suivi du compteur au glissement */
    track.addEventListener('scroll', () => {
      if (innerWidth >= 1000) return;
      const i = Math.round(track.scrollLeft / (cards[0].offsetWidth + 16));
      num.textContent = String(clamp(i + 1, 1, cards.length)).padStart(2, '0');
    }, { passive: true });
  }

  /* clic « Demander ce soin » : le soin est repris dans le message, puis on va au formulaire */
  let picked = '';
  function setPicked(v) {
    picked = v || '';
    const box = $('#rdvPick');
    if (box) { box.hidden = !picked; $('#rdvPickName').textContent = picked; }
    updatePreview();
  }
  function initPick() {
    $$('[data-pick]').forEach((a) => a.addEventListener('click', (e) => {
      e.preventDefault();
      setPicked(a.getAttribute('data-pick'));
      scrollToEl($('#rdv'), -10);
    }));
  }

  /* ------------------------------------------------------------ galerie : parallaxe + visionneuse */
  function initGallery() {
    if (hasG && !reduce) {
      $$('.gal__i').forEach((fig) => {
        const img = $('img', fig);
        gsap.fromTo(img, { yPercent: -7, scale: 1.14 }, { yPercent: 7, scale: 1.14, ease: 'none', scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
      gsap.utils.toArray('.rp').forEach((el, i) => {
        gsap.fromTo(el, { y: 26 * (i + 1) }, { y: -26 * (i + 1), ease: 'none', scrollTrigger: { trigger: '.res__pics', start: 'top bottom', end: 'bottom top', scrub: true } });
      });
    }
    const dlg = $('#lb');
    if (!dlg) return;
    const img = $('#lbImg'), capEl = $('#lbCap');
    const figs = $$('.gal__i');
    let idx = 0, opener = null;
    const show = (i) => {
      idx = (i + D.photos.length) % D.photos.length;
      const p = D.photos[idx];
      img.src = p.src; img.alt = p.alt; img.width = p.w; img.height = p.h;
      capEl.textContent = $('figcaption', figs[idx]).textContent;
    };
    const open = (i, btn) => {
      if (typeof dlg.showModal !== 'function') { window.open(D.photos[i].src, '_blank', 'noopener'); return; }
      opener = btn; show(i); dlg.showModal(); lock(true);
    };
    const close = () => { if (dlg.open) dlg.close(); };
    figs.forEach((f, i) => $('.gal__btn', f).addEventListener('click', (e) => open(i, e.currentTarget)));
    $('#lbClose').addEventListener('click', close);
    $('#lbPrev').addEventListener('click', () => show(idx - 1));
    $('#lbNext').addEventListener('click', () => show(idx + 1));
    dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); });
    dlg.addEventListener('close', () => { lock(false); if (opener) opener.focus({ preventScroll: true }); });
    dlg.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') show(idx + 1);
      if (e.key === 'ArrowLeft') show(idx - 1);
    });
  }

  /* ------------------------------------------------------------ avis : rail, boutons, glisser-déposer */
  function initAvis() {
    const rail = $('#avisRail'), prev = $('#avisPrev'), next = $('#avisNext'), bar = $('#avisBar');
    if (!rail) return;
    const step = () => { const c = $('.rv', rail); return c ? c.offsetWidth + 20 : 340; };
    const upd = () => {
      const max = rail.scrollWidth - rail.clientWidth;
      const p = max > 0 ? rail.scrollLeft / max : 1;
      bar.style.transform = 'scaleX(' + (0.08 + 0.92 * p).toFixed(3) + ')';
      prev.disabled = rail.scrollLeft < 8;
      next.disabled = rail.scrollLeft > max - 8;
    };
    rail.addEventListener('scroll', upd, { passive: true });
    addEventListener('resize', upd);
    prev.addEventListener('click', () => rail.scrollBy({ left: -step() * 1.5, behavior: 'smooth' }));
    next.addEventListener('click', () => rail.scrollBy({ left: step() * 1.5, behavior: 'smooth' }));
    rail.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); rail.scrollBy({ left: step(), behavior: 'smooth' }); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); rail.scrollBy({ left: -step(), behavior: 'smooth' }); }
    });
    let down = false, sx = 0, sl = 0, moved = 0;
    rail.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; down = true; moved = 0; sx = e.clientX; sl = rail.scrollLeft; });
    addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx));
      if (moved > 4) { rail.classList.add('is-drag'); rail.scrollLeft = sl - dx; }
    });
    addEventListener('pointerup', () => { if (!down) return; down = false; rail.classList.remove('is-drag'); });
    upd();
    setTimeout(upd, 400);
  }

  /* ------------------------------------------------------------ en-tête, menu, repères */
  function initNav() {
    const nav = $('#nav'), dots = $('#dots'), prog = $('#progress i'), menu = $('#menu'), burger = $('#burger');
    const secs = $$('[data-nav]');
    const links = $$('[data-link]');
    const dotEls = $$('[data-dot]');
    const ids = ['top', 'institut', 'soins', 'lieu', 'avis', 'contact'];
    let lastY = 0, ticking = false, menuOpen = false;

    const update = () => {
      ticking = false;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - innerHeight;
      prog.style.transform = 'scaleX(' + (max > 0 ? clamp(y / max, 0, 1) : 0).toFixed(4) + ')';
      nav.classList.toggle('is-solid', y > 40);
      const mid = navH() / 2;
      let light = false, dotLight = false;
      secs.forEach((s) => {
        const r = s.getBoundingClientRect();
        if (r.top <= mid && r.bottom > mid) light = s.dataset.nav === 'dark';
        if (r.top <= innerHeight / 2 && r.bottom > innerHeight / 2) dotLight = s.dataset.nav === 'dark';
      });
      nav.classList.toggle('is-light', light || menuOpen);
      dots.classList.toggle('is-light', dotLight);
      const hide = y > lastY + 4 && y > innerHeight * 0.9 && !menuOpen;
      const show = y < lastY - 4 || y < innerHeight * 0.6;
      if (hide) nav.classList.add('is-hidden'); else if (show) nav.classList.remove('is-hidden');
      lastY = y;
      /* section active */
      let cur = ids[0];
      ids.forEach((id) => { const el = document.getElementById(id); if (el && el.getBoundingClientRect().top <= innerHeight * 0.45) cur = id; });
      const contact = document.getElementById('contact');
      const ci = contact && contact.getBoundingClientRect().top <= innerHeight * 0.45;
      if (ci) cur = 'contact';
      links.forEach((a) => a.classList.toggle('is-on', a.getAttribute('href') === '#' + cur));
      dotEls.forEach((a) => a.classList.toggle('is-on', a.dataset.dot === cur));
    };
    const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    addEventListener('scroll', req, { passive: true });
    addEventListener('resize', req);
    if (lenis) lenis.on('scroll', req);
    update();

    /* ancres */
    $$('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const h = a.getAttribute('href');
        if (h.length < 2 || a.hasAttribute('data-pick')) return;
        const t = document.querySelector(h);
        if (!t) return;
        e.preventDefault();
        closeMenu();
        if (h === '#top') { lenis ? lenis.scrollTo(0, { duration: 1.4 }) : window.scrollTo({ top: 0, behavior: 'smooth' }); }
        else scrollToEl(t, h === '#rdv' ? -10 : 1);
        history.replaceState(null, '', h);
      });
    });

    /* menu mobile */
    function openMenu() {
      menuOpen = true; menu.hidden = false;
      requestAnimationFrame(() => menu.classList.add('is-open'));
      burger.setAttribute('aria-expanded', 'true'); burger.setAttribute('aria-label', 'Fermer le menu');
      lock(true); update();
    }
    function closeMenu() {
      if (!menuOpen) return;
      menuOpen = false; menu.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Ouvrir le menu');
      setTimeout(() => { if (!menuOpen) menu.hidden = true; }, 520);
      lock(false); update();
    }
    burger.addEventListener('click', () => (menuOpen ? closeMenu() : openMenu()));
    addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
    addEventListener('resize', () => { if (innerWidth > 1100) closeMenu(); });
  }

  /* ------------------------------------------------------------ curseur, boutons magnétiques, lueur du héros */
  function initPointer() {
    if (!fine || reduce) return;
    const cur = $('#cursor');
    let tx = 0, ty = 0, x = 0, y = 0, on = false;
    addEventListener('pointermove', (e) => {
      tx = e.clientX; ty = e.clientY;
      if (!on) { on = true; x = tx; y = ty; cur.classList.add('is-on'); }
    }, { passive: true });
    document.addEventListener('pointerleave', () => { on = false; cur.classList.remove('is-on'); });
    const loop = () => {
      x += (tx - x) * 0.22; y += (ty - y) * 0.22;
      cur.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    const label = $('.cursor__label', cur);
    document.addEventListener('pointerover', (e) => {
      const t = e.target.closest ? e.target.closest('[data-cursor], a, button, label.chip') : null;
      const lab = t && t.getAttribute && t.getAttribute('data-cursor');
      cur.classList.toggle('is-big', !!lab);
      cur.classList.toggle('has-label', !!lab);
      cur.classList.toggle('is-link', !!t && !lab);
      label.textContent = lab || '';
    });
    /* magnétisme */
    $$('[data-magnetic]').forEach((el) => {
      let r;
      el.addEventListener('pointerenter', () => { r = el.getBoundingClientRect(); });
      el.addEventListener('pointermove', (e) => {
        if (!r) r = el.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) * 0.22, dy = (e.clientY - (r.top + r.height / 2)) * 0.3;
        el.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px)';
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
    /* lueur qui suit la souris sur le film */
    const glow = $('#glow');
    if (glow && hero) {
      hero.addEventListener('pointermove', (e) => {
        const r = hero.getBoundingClientRect();
        glow.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        glow.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      }, { passive: true });
    }
  }

  function initHeroScroll() {
    if (!hasG || reduce || !hero) return;
    gsap.to('.hero__video', { yPercent: 7, scale: 1.07, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero__inner', { yPercent: -10, opacity: 0.0, ease: 'none', scrollTrigger: { trigger: hero, start: '15% top', end: '85% top', scrub: true } });
  }

  /* ------------------------------------------------------------ carte Google (au clic seulement) */
  function initMap() {
    const btn = $('#mapBtn'), box = $('#map');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const f = document.createElement('iframe');
      f.src = 'https://maps.google.com/maps?q=43.9272006,5.8905671&z=17&hl=fr&output=embed';
      f.title = 'Carte : 22 route des Alpes, La Brillanne';
      f.loading = 'lazy'; f.referrerPolicy = 'no-referrer-when-downgrade';
      box.innerHTML = ''; box.appendChild(f);
    });
  }

  /* ------------------------------------------------------------ demande de rendez-vous : un prénom (facultatif), puis SMS ou e-mail */
  const form = $('#rdv');
  function cleanName(v) {
    const n = v.replace(/[^\p{L}\p{M}'’\- ]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 40);
    return n ? n.charAt(0).toUpperCase() + n.slice(1) : '';
  }
  function buildMessage() {
    const n = cleanName(($('#rdvPrenom') || { value: '' }).value);
    return 'Bonjour Alexandra' + (n ? ', c’est ' + n : '') + '. ' +
      (picked ? 'Je souhaiterais prendre rendez-vous pour : ' + picked + '. ' : 'Je souhaiterais prendre rendez-vous. ') +
      'Pourriez-vous me proposer un créneau ? Merci beaucoup !';
  }
  function updatePreview() { const p = $('#rdvPreview'); if (p) p.textContent = buildMessage(); }
  const smsHref = () => 'sms:' + D.tel + '?&body=' + encodeURIComponent(buildMessage());
  const mailHref = () => 'mailto:' + D.mail + '?subject=' + encodeURIComponent('Demande de rendez-vous') + '&body=' + encodeURIComponent(buildMessage());
  api.smsHref = smsHref; api.mailHref = mailHref; api.buildMessage = buildMessage;
  function initForm() {
    if (!form) return;
    form.addEventListener('submit', (e) => e.preventDefault());
    $('#rdvPrenom').addEventListener('input', updatePreview);
    $('#rdvPickX').addEventListener('click', () => setPicked(''));
    $('#rdvSms').addEventListener('click', () => {
      $('#rdvOk').textContent = 'Votre messagerie s’ouvre avec le message prêt : il ne reste qu’à appuyer sur « Envoyer ».';
      location.href = smsHref();
    });
    $('#rdvMail').addEventListener('click', () => {
      $('#rdvOk').textContent = 'Votre messagerie e-mail s’ouvre avec le message prêt.';
      location.href = mailHref();
    });
    $('#rdvCopy').addEventListener('click', async () => {
      const body = buildMessage();
      try { await navigator.clipboard.writeText(body); }
      catch (e) {
        const ta = document.createElement('textarea'); ta.value = body; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); } catch (e2) { /* ignoré */ } ta.remove();
      }
      $('#rdvOk').textContent = 'Message copié : collez-le dans un SMS, un e-mail ou Messenger.';
    });
    updatePreview();
  }

  /* ------------------------------------------------------------ démarrage */
  buildAvis();
  buildHours();
  updateStatus();
  setInterval(updateStatus, 60000);
  initVideo();
  initReveals();
  initManifeste();
  initCounters();
  initMarquee();
  initSoins();
  initPick();
  initGallery();
  initAvis();
  initNav();
  initPointer();
  initHeroScroll();
  initMap();
  initForm();
  runPre();

  const refresh = () => { if (hasG) ScrollTrigger.refresh(); };
  addEventListener('load', () => { refresh(); setTimeout(refresh, 600); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  api.refresh = refresh;
  api.ScrollTrigger = hasG ? ScrollTrigger : null;
})();
