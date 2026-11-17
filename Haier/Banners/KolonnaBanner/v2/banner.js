/* Анимация баннера колонны — один общий цикл:
   A) плашки 1 → 2 → 3 (по 2 с), за это время курсор жмёт «вперёд» 4 раза — все 4 колонны;
   B) плашки уходят вверх, курсор идёт к «Начать подбор» и жмёт её;
   C) снизу выезжают плашки, курсор возвращается к стрелке — и снова A. */
(function () {
  const root = document.querySelector('.kb');
  if (!root) return;

  const SPEED = 2;                      // общий темп: 2 = вдвое быстрее исходного
  const wait = (ms) => new Promise((r) => setTimeout(r, ms / SPEED));
  const EASE = 'cubic-bezier(.65, 0, .35, 1)';

  /* ---------- плашки ---------- */
  const steps = root.querySelector('.kb__steps');
  const track = steps.querySelector('.kb__track');
  const VIEW_H = steps.clientHeight;
  const HOLD = 2000, MOVE = 750, OUT = 900, IN = 900;

  // позиция трека, при которой плашка i стоит по центру окна
  const focusY = (i) => {
    const c = track.children[i];
    return VIEW_H / 2 - (c.offsetTop + c.offsetHeight / 2);
  };
  const setY = (y, ms) => {
    track.style.transition = ms ? `transform ${ms / SPEED}ms ${EASE}` : 'none';
    track.style.transform = `translateY(${y}px)`;
  };

  async function stepsRun() {           // A: 1 → 2 → 3, всего 7.5 с
    await wait(HOLD);
    setY(focusY(1), MOVE); await wait(MOVE + HOLD);
    setY(focusY(2), MOVE); await wait(MOVE + HOLD);
  }
  async function stepsOut() {           // B: вся группа уходит вверх
    setY(-track.offsetHeight - 20, OUT); await wait(OUT);
  }
  async function stepsIn() {            // C: новая группа снизу, в фокусе плашка 1
    setY(VIEW_H + 20, 0); track.offsetHeight;
    setY(focusY(0), IN); await wait(IN);
  }

  /* ---------- колонны ---------- */
  const cols = [...root.querySelectorAll('.kb__col')];
  let idx = 0;
  // новая — сверху и проявляется сразу, старая гаснет под ней чуть позже (без «просвета» фона)
  const SHIFT = 30, LAG = 140;
  let z = 1;
  function showCol(dir) {
    const old = cols[idx];
    idx = (idx + dir + cols.length) % cols.length;
    const nw = cols[idx];
    old.style.transition = `opacity ${300 / SPEED}ms ease ${LAG / SPEED}ms, transform ${1000 / SPEED}ms var(--kb-col-ease)`;
    old.classList.remove('is-on');
    old.style.transform = `translateX(${-dir * SHIFT}px)`;
    nw.style.zIndex = ++z;
    nw.style.transition = 'none';
    nw.style.transform = `translateX(${dir * SHIFT}px)`;
    nw.offsetHeight;
    nw.style.transition = `opacity ${380 / SPEED}ms ease, transform ${1000 / SPEED}ms var(--kb-col-ease)`;
    nw.style.transform = '';
    nw.classList.add('is-on');
  }

  /* ---------- курсор ---------- */
  const cursor = root.querySelector('.kb__cursor');
  const next = root.querySelector('.kb__arrow--next');
  const cta = root.querySelector('.kb__cta');
  const pos = { x: 560, y: 205 };       // кончик стрелки, координаты баннера
  const arrows = [...root.querySelectorAll('.kb__arrow')];
  const place = () => {
    cursor.style.transform = `translate(${pos.x - 2}px, ${pos.y - 2}px)`;
    for (const a of arrows) {             // ховер под курсором анимации — как у мыши
      const over = pos.x >= a.offsetLeft && pos.x <= a.offsetLeft + a.offsetWidth &&
                   pos.y >= a.offsetTop && pos.y <= a.offsetTop + a.offsetHeight;
      a.classList.toggle('is-hover', over);
    }
  };
  const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  function moveTo(p, ms) {
    const x0 = pos.x, y0 = pos.y, { x, y } = p;
    const dx = x - x0, dy = y - y0;      // лёгкая дуга, как у руки
    const cx = x0 + dx / 2 - dy * .18, cy = y0 + dy / 2 + Math.abs(dx) * .12;
    return new Promise((res) => {
      const t0 = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - t0) / (ms / SPEED)), k = ease(t), u = 1 - k;
        pos.x = u * u * x0 + 2 * u * k * cx + k * k * x;
        pos.y = u * u * y0 + 2 * u * k * cy + k * k * y;
        place();
        t < 1 ? requestAnimationFrame(step) : res();
      };
      requestAnimationFrame(step);
    });
  }

  // точка нажатия — чуть ниже-правее центра кнопки
  const NEXT = { x: next.offsetLeft + 22, y: next.offsetTop + 23 };
  const ctaPoint = () => ({
    x: cta.parentElement.offsetLeft + cta.offsetLeft + cta.offsetWidth / 2 + 8,
    y: cta.parentElement.offsetTop + cta.offsetTop + cta.offsetHeight / 2 + 6,
  });

  async function press(el, onDown) {
    cursor.classList.add('is-pressed');
    el.classList.add('is-pressed');
    await wait(110 * SPEED);            // само нажатие — в прежнем темпе, чтобы читалось
    onDown && onDown();
    cursor.classList.remove('is-pressed');
    el.classList.remove('is-pressed');
    await wait(150);
  }

  const CLICKS = 4, CLICK_EVERY = 1650;
  async function cursorRun(first) {     // A: 4 клика по «вперёд» за 7.5 с
    if (first) await moveTo(NEXT, 900);
    await wait(first ? 200 : 450);
    for (let n = 0; n < CLICKS; n++) {
      const t0 = performance.now();
      await press(next, () => showCol(1));
      if (n === CLICKS - 1) break;
      const j = n % 2 ? 2 : -2;         // рука чуть «живёт» между кликами
      await moveTo({ x: NEXT.x + j, y: NEXT.y + 3 }, 500);
      await wait(CLICK_EVERY - (performance.now() - t0) * SPEED - 240);
      await moveTo(NEXT, 240);
    }
  }

  /* ---------- общий цикл ---------- */
  async function loop() {
    setY(focusY(0), 0);
    place();
    await wait(600);
    for (let first = true; ; first = false) {
      await Promise.all([stepsRun(), cursorRun(first)]);                 // A
      await Promise.all([stepsOut(), moveTo(ctaPoint(), 1100)]);         // B
      await wait(250);
      await press(cta);
      await wait(450);
      await Promise.all([stepsIn(), moveTo(NEXT, 1000)]);                // C
    }
  }

  document.fonts && document.fonts.ready ? document.fonts.ready.then(loop) : loop();
})();
