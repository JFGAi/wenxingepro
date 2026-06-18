/* ============================================================
   问心阁 · 核心模块
   本地存储用户体系（雅号）、心光值、签到、导航与通用组件。
   未来接入后端时，把 Store 替换为 API 调用即可（见 README）。
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 本地存储 ---------- */
  const Store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem('wxg_' + key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem('wxg_' + key, JSON.stringify(value)); } catch (e) {}
    },
    remove(key) { try { localStorage.removeItem('wxg_' + key); } catch (e) {} }
  };

  /* ---------- 用户（雅号） ---------- */
  const NAME_POOL = ['听松', '枕流', '栖云', '拾露', '抱朴', '望舒', '观澜', '闻溪',
    '叩月', '步虚', '汲泉', '种菊', '扫雪', '伴鹤', '收霞', '问梅'];

  function ensureUser() {
    let u = Store.get('user', null);
    if (!u) {
      const word = NAME_POOL[Math.floor(Math.random() * NAME_POOL.length)];
      const num = String(Math.floor(100 + Math.random() * 900));
      u = { code: word + num, created: new Date().toISOString().slice(0, 10) };
      Store.set('user', u);
    }
    return u;
  }

  /* ---------- 心光值 ---------- */
  const Light = {
    get() { return Store.get('light', 0); },
    add(n, reason) {
      const v = this.get() + n;
      Store.set('light', v);
      const logs = Store.get('light_logs', []);
      logs.unshift({ n, reason, t: todayStr() });
      Store.set('light_logs', logs.slice(0, 100));
      if (reason) toast('心光 +' + n + ' · ' + reason);
      return v;
    }
  };

  /* ---------- 日期工具 ---------- */
  function todayStr() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  /* 以日期为种子的确定性伪随机（同一天结果一致） */
  function daySeed(extra) {
    const s = todayStr() + (extra || '');
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    return h;
  }
  function seededPick(arr, seed, count) {
    const pool = arr.slice();
    const out = [];
    let s = seed;
    while (out.length < count && pool.length) {
      s = (s * 1103515245 + 12345) >>> 0;
      out.push(pool.splice(s % pool.length, 1)[0]);
    }
    return out;
  }

  /* ---------- 签到 ---------- */
  function checkedInToday() { return Store.get('checkin', '') === todayStr(); }
  function checkin() {
    if (checkedInToday()) { toast('今日已签到，明日再来'); return false; }
    Store.set('checkin', todayStr());
    Light.add(3, '每日一省');
    return true;
  }

  /* ---------- Toast ---------- */
  let toastEl = null, toastTimer = null;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
  }

  /* ---------- 通用弹窗 ---------- */
  function modal(opts) {
    const mask = document.createElement('div');
    mask.className = 'modal-mask';
    mask.innerHTML =
      '<div class="modal">' +
      '<h3>' + opts.title + '</h3>' +
      '<p>' + opts.body + '</p>' +
      '<button class="btn sha block" id="_m_ok">' + (opts.okText || '好的') + '</button>' +
      (opts.cancel ? '<button class="btn ghost block" style="margin-top:10px" id="_m_no">' + opts.cancel + '</button>' : '') +
      '</div>';
    document.body.appendChild(mask);
    requestAnimationFrame(() => mask.classList.add('show'));
    const close = () => { mask.classList.remove('show'); setTimeout(() => mask.remove(), 250); };
    mask.querySelector('#_m_ok').onclick = () => { close(); opts.onOk && opts.onOk(); };
    const no = mask.querySelector('#_m_no');
    if (no) no.onclick = close;
    mask.onclick = (e) => { if (e.target === mask) close(); };
    return close;
  }

  /* ---------- 动效偏好 ---------- */
  const REDUCED = window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 玄曜星图背景 ---------- */
  function injectLiquidBg() {
    if (REDUCED) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'liquid-bg';
    document.body.prepend(canvas);
    const ctx = canvas.getContext('2d');
    if (!ctx) { canvas.remove(); return; }

    let stars = [];
    const starSeed = i => {
      const x = Math.sin(i * 999.73) * 10000;
      return x - Math.floor(x);
    };

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = Array.from({ length: 76 }, (_, i) => ({
        x: starSeed(i + 1) * window.innerWidth,
        y: starSeed(i + 101) * window.innerHeight,
        s: 0.7 + starSeed(i + 201) * 1.2,
        p: starSeed(i + 301) * Math.PI * 2
      }));
    }
    resize();
    window.addEventListener('resize', resize);

    function frame(t) {
      const w = window.innerWidth, h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      ctx.save();
      ctx.strokeStyle = 'rgba(216,183,109,.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 96) {
        ctx.beginPath(); ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += 96) {
        ctx.beginPath(); ctx.moveTo(0, y + .5); ctx.lineTo(w, y + .5); ctx.stroke();
      }

      const cx = w * .58;
      const cy = h * .42;
      const base = Math.min(w, h) * .34;
      ctx.translate(cx, cy);
      ctx.rotate(t * 0.000035);
      ctx.strokeStyle = 'rgba(216,183,109,.18)';
      [base, base * .72, base * .46].forEach(r => {
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          const a = Math.PI / 4 + i * Math.PI / 2;
          const px = Math.cos(a) * r;
          const py = Math.sin(a) * r;
          i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      });
      ctx.beginPath();
      ctx.arc(0, 0, base * .58, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(99,176,168,.16)';
      ctx.stroke();
      ctx.restore();

      stars.forEach((s, i) => {
        const a = .25 + Math.sin(t * .001 + s.p) * .18;
        ctx.fillStyle = i % 5 === 0 ? 'rgba(99,176,168,' + a + ')' : 'rgba(216,183,109,' + a + ')';
        ctx.fillRect(s.x, s.y, s.s, s.s);
      });
      ctx.strokeStyle = 'rgba(99,176,168,.09)';
      for (let i = 0; i < stars.length - 1; i += 7) {
        ctx.beginPath();
        ctx.moveTo(stars[i].x, stars[i].y);
        ctx.lineTo(stars[i + 1].x, stars[i + 1].y);
        ctx.stroke();
      }
    }
    frame(0);

    let rafId = null;
    function loop(t) { frame(t); rafId = requestAnimationFrame(loop); }
    rafId = requestAnimationFrame(loop);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { cancelAnimationFrame(rafId); rafId = null; }
      else if (rafId === null) rafId = requestAnimationFrame(loop);
    });
  }

  /* ---------- 水波涟漪 ---------- */
  function injectRipple() {
    if (REDUCED) return;
    document.addEventListener('pointerdown', (e) => {
      if (e.clientX === 0 && e.clientY === 0) return; /* 键盘触发的合成事件 */
      const dot = document.createElement('div');
      dot.className = 'ripple-dot';
      dot.style.left = e.clientX + 'px';
      dot.style.top = e.clientY + 'px';
      document.body.appendChild(dot);
      dot.addEventListener('animationend', () => dot.remove());
      setTimeout(() => dot.remove(), 1200); /* 兜底 */
    }, { passive: true });
  }

  /* ---------- 滚动浮现（视口外的区块滚到时再浮现） ---------- */
  function injectReveal() {
    if (REDUCED || !('IntersectionObserver' in window)) return;
    const targets = Array.from(document.querySelectorAll('main > section'))
      .filter(el => el.getBoundingClientRect().top > window.innerHeight);
    if (!targets.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        en.target.classList.add('reveal-in');
        en.target.classList.remove('reveal-init');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -40px 0px' });
    targets.forEach(el => {
      el.classList.remove('fade-up'); /* 改走滚动浮现，避免进场时已空放过动画 */
      el.classList.add('reveal-init');
      io.observe(el);
    });
  }

  /* ---------- 导航与页脚注入 ---------- */
  const TABS = [
    { id: 'home', name: '首页', icon: '☖', href: 'index.html' },
    { id: 'qian', name: '问签', icon: '☴', href: 'qian.html' },
    { id: 'ming', name: '命盘', icon: '◈', href: 'ming.html' },
    { id: 'today', name: '今日', icon: '☀', href: 'today.html' },
    { id: 'meng', name: '梦释', icon: '☾', href: 'meng.html' },
    { id: 'deng', name: '心灯', icon: '🕯', href: 'deng.html' },
    { id: 'xi', name: '静坐', icon: '◌', href: 'xi.html' },
    { id: 'me', name: '我的', icon: '◉', href: 'me.html' }
  ];

  function injectChrome() {
    const page = document.body.dataset.page || '';
    const nav = document.createElement('nav');
    nav.className = 'tabbar';
    nav.innerHTML = TABS.map(t =>
      '<a href="' + t.href + '" class="' + (t.id === page ? 'on' : '') + '">' +
      '<span class="ti">' + t.icon + '</span>' + t.name + '</a>'
    ).join('');
    document.body.appendChild(nav);

    const foot = document.createElement('footer');
    foot.className = 'sitefoot';
    foot.innerHTML = '问心阁 · 不问鬼神，只问本心<br>' +
      '本站内容仅作传统文化与心境调适参考，不构成医疗、法律、投资等任何专业建议。';
    const main = document.querySelector('main');
    if (main) main.appendChild(foot);
  }

  document.addEventListener('DOMContentLoaded', () => {
    ensureUser();
    injectLiquidBg();
    injectRipple();
    injectChrome();
    injectReveal();
  });

  /* ---------- 暴露全局 ---------- */
  window.WXG = {
    Store, Light, toast, modal,
    user: ensureUser, todayStr, daySeed, seededPick,
    checkin, checkedInToday
  };
})();
