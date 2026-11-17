/* Вариант 3b (v3b.html) — как вариант 3, но сушилка и соединитель прилетают сверху и сразу соединяются,
   на соединение камера возвращается: они раздвигаются, соединитель листаем, снова сдвигаются.
   Вариант 3 — крупные машины, камера едет по сцене. Один цикл:
   0) курсор жмёт «Начать подбор» → снизу выезжают плашки, из центра расходятся стрелки;
   A) камера внизу: стиральная крупно, плашка 1; курсор жмёт «вперёд» 3 раза — все 3 и снова тёмная;
   B) камера поднимается: над стиральной с зазором висит сушилка, плашка 2; 3 клика — все 3 и снова тёмная;
   C) камера на зазор, плашка 3: посередине соединитель другого цвета, клик — подходящий; он и сушилка опускаются;
   D) курсор жмёт «Начать подбор»; E) плашки снизу, камера вниз — и снова A.
   Баннер на каждом круге одинаковый: старт и финал — тёмная модель (3 клика по кругу из 3). */
(function () {
  const root = document.querySelector('.kb');
  const G = window.KB3_GEO;
  if (!root || !G) return;

  const SPEED = 2;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms / SPEED));
  const EASE = 'cubic-bezier(.65, 0, .35, 1)';

  /* ---------- сцена ---------- */
  const ORDER = [4, 1, 3];              // модели; круг всегда один и тот же: 3 клика возвращают к тёмной (4) — финал тёмная колонна
  // все товары листалки — ровно по центру между стрелками (по видимой части каждой картинки)
  const aPrev = root.querySelector('.kb__arrow--prev'), aNext = root.querySelector('.kb__arrow--next');
  const MID = (aPrev.offsetLeft + aNext.offsetLeft + aNext.offsetWidth) / 2;   // экранный x середины, 705.75
  const CW = G.cam0[0] + MID;           // та же середина в координатах сцены (камера A/B/C по x не двигается)
  const GAP = 44;                       // зазор под висящей сушилкой
  const worlds = [...root.querySelectorAll('.kb__world')];   // фон и машины — одна камера
  const bgImg = root.querySelector('.kb__bg3');
  bgImg.style.width = G.bgW + 'px'; bgImg.style.height = G.bgH + 'px';
  const mscene = root.querySelector('.kb__mscene');

  const washTop = (n) => G.floor - G.models[n].washBody;
  // картинка с AVIF (основной) и WebP (запасной): <picture> без своей коробки (display: contents)
  const pic = (im) => {
    if (/\/slab/.test(im.getAttribute('src'))) return im;   // соединители — только WebP
    const p = document.createElement('picture'), so = document.createElement('source');
    so.type = 'image/avif'; so.srcset = im.getAttribute('src').replace(/\.webp$/, '.avif');
    p.append(so, im); return p;
  };
  const mk = (box, src, n, top, cls, kind) => {
    const g = G.models[n], im = new Image();
    im.src = src; im.alt = ''; im.className = cls; im.decoding = 'async';
    const left = (box.classList.contains('kb__link') ? CW - parseFloat(box.style.left || 0) : CW) - g.cx[kind];
    Object.assign(im.style, { left: left + 'px', top: top + 'px', width: g.w + 'px' });
    box.appendChild(pic(im)); return im;
  };
  const dryBox = root.querySelector('.kb__dryers');
  const linkBox = root.querySelector('.kb__links');
  const washBox = root.querySelector('.kb__washers');
  const washers = ORDER.map((n) => mk(washBox, `assets/washer${n}.webp`, n, washTop(n), 'kb__m', 'washer'));
  // соединители модели: сначала неподходящий (другого цвета), стрелкой листаем к подходящему
  const links = ORDER.map((n) => {
    const wrap = document.createElement('div');
    wrap.className = 'kb__link';
    wrap.style.top = washTop(n) - G.models[n].linkH + 'px';
    linkBox.appendChild(wrap);
    // подходящий (в цвет модели) → другой цвет → серебристый → снова подходящий: 3 клика, ритм как у машин
    wrap.items = [mk(wrap, `assets/slab${n}.webp`, n, 0, 'kb__m', 'slab'), mk(wrap, `assets/slab${n}_bad.webp`, n, 0, 'kb__m', 'slab_bad'), mk(wrap, `assets/slab${n}_alt.webp`, n, 0, 'kb__m', 'slab_alt')];
    return wrap;
  });
  // корзинки — только в финале: проявляются при отдалении, соразмерно колонне как в варианте 1
  // (там фасад слева 707.85, низ машины 259.13, высота 276.7; корзинки 801.6 / 179.24, ширина 134.67)
  const baskets = (() => {
    const V1 = { mx: 707.85, bottom: 259.13, h: 276.7, bx: 801.6, by: 179.24, bw: 134.67 };
    const g = G.models[4], top = washTop(4) - g.linkH - g.dryH + g.dryTop;
    const r = (G.floor - top) / V1.h;
    const front = CW - g.cx.washer + g.xl;          // левый край фасада тёмной стиральной в сцене
    const b = new Image();
    b.src = 'assets/baskets.webp'; b.alt = ''; b.className = 'kb__baskets3'; b.decoding = 'async';
    Object.assign(b.style, { left: front + (V1.bx - V1.mx) * r + 'px', top: G.floor - (V1.bottom - V1.by) * r + 'px', width: V1.bw * r + 'px' });
    root.querySelector('.kb__mworld').appendChild(pic(b));  // поверх машин
    return b;
  })();
  const basketsShow = (on, ms) => {
    baskets.style.transition = `opacity ${ms / SPEED}ms ${ZOOM_EASE}`;
    baskets.style.opacity = on ? 1 : 0;
  };
  const dryers = ORDER.map((n) => {
    const g = G.models[n];
    return mk(dryBox, `assets/dryer${n}.webp`, n, washTop(n) - g.linkH - g.dryH, 'kb__m', 'dryer');
  });

  // камера: {x, y} — левый-верхний угол кадра в координатах сцены, s — масштаб (s < 1 — отдаление)
  const n0 = ORDER[0], m0 = G.models[n0];
  const X0 = G.cam0[0];
  const CAM = {
    washer: { x: X0, y: G.cam0[1] },                                          // кадр A — как состояние 0 гайда
    dryer: { x: X0, y: washTop(n0) - m0.linkH - m0.dryH - 3 },                 // сушилка (стоит на соединителе) целиком в кадре
    joint: { x: X0, y: washTop(n0) - (GAP + m0.linkH) / 2 - 121.5 },          // зазор с плитой — по центру кадра
  };
  // финал — колонна целиком в баннере, отступы 15 сверху и снизу, по центру между стрелками
  const PAD = 15;
  const outCam = (n) => {
    const g = G.models[n], top = washTop(n) - g.linkH - g.dryH + g.dryTop;   // видимый верх сушилки
    const s = (243 - 2 * PAD) / (G.floor - top);
    return { s, y: top - PAD / s, x: CW - MID / s };   // центр колонны — в середине между стрелками
  };
  // сдвиг — в экранных px до масштаба: при переходе каждая точка едет по прямой, без дуги
  const ZOOM_EASE = 'cubic-bezier(.645, .045, .355, 1)';      // отдаление — In Out Cubic (заказчик)
  // параллакс: при подъёме/спуске камеры фон смещается от кадра A в 1.5 раза меньше машин (кадр A не меняется)
  const PARALLAX = 1.5;
  const cam = (c, ms, ease = EASE) => {
    const s = c.s || 1;
    for (const w of worlds) {
      const bg = !w.classList.contains('kb__mworld') && s === 1;   // при отдалении — без параллакса, колонна стоит на ковре
      const x = bg ? X0 + (c.x - X0) / PARALLAX : c.x;
      const y = bg ? G.cam0[1] + (c.y - G.cam0[1]) / PARALLAX : c.y;
      w.style.transition = ms ? `transform ${ms / SPEED}ms ${ease}` : 'none';
      w.style.transform = `translate(${-x * s}px, ${-y * s}px) scale(${s})`;
    }
    return wait(ms || 0);
  };
  const hang = (on, ms) => {
    dryBox.style.transition = ms ? `transform ${ms / SPEED}ms cubic-bezier(.5, 0, .3, 1)` : 'none';
    dryBox.style.transform = on ? `translateY(${-GAP}px)` : 'none';
    return wait(ms || 0);
  };

  /* ---------- плашки ---------- */
  const STEP_MS = 2000 / 1.5;            // шаги — In Out Cubic, в 1.5 раза быстрее подъёма к сушилке (1 с) ≈ 0.67 с
  const steps = root.querySelector('.kb__steps');
  const track = steps.querySelector('.kb__track');
  const VIEW_H = steps.clientHeight;
  const focusY = (i) => {
    const c = track.children[i];
    return VIEW_H / 2 - (c.offsetTop + c.offsetHeight / 2);
  };
  // плашки едут «гусеницей»: верхняя (ведущая — всё движется вверх) первой, каждая следующая через 0.08 с
  const CATER = 80 * SPEED;              // задержка между плашками 0.08 с, ед. wait
  const cards = [...track.children];
  const setY = (y, ms, ease = EASE) => {
    cards.forEach((c, i) => {
      c.style.transition = ms ? `transform ${ms / SPEED}ms ${ease} ${i * CATER / SPEED}ms` : 'none';
      c.style.transform = `translateY(${y}px)`;
    });
    return wait(ms ? ms + (cards.length - 1) * CATER : 0);
  };

  /* ---------- смена машин (как смена колонн в варианте 1) ---------- */
  const SHIFT = 30, LAG = 140;
  let wi = 0, di = 0, z = 1;
  const SWAP_MS = 1000;                 // реальные мс
  const SWAP_EASE = 'cubic-bezier(.165, .84, .44, 1)';   // Out Quart (заказчик)
  function swap(list, i, dir, pulled = 0) {   // pulled — насколько палец уже утянул старую
    const old = list[i], j = (i + dir + list.length) % list.length, nw = list[j];
    const T = `${SWAP_MS}ms ${SWAP_EASE}`;   // смена — Out Quart, 1 с: старая влево в прозрачность, новая справа из прозрачности
    old.style.transition = `opacity ${T}, transform ${T}`;
    old.classList.remove('is-on');
    old.style.transform = `translateX(${-dir * SHIFT - pulled}px)`;
    nw.style.zIndex = ++z;
    nw.style.transition = 'none';
    nw.style.transform = `translateX(${dir * SHIFT}px)`;
    nw.offsetHeight;
    nw.style.transition = `opacity ${SWAP_MS / 2}ms ${SWAP_EASE}, transform ${T}`;   // новая проявляется вдвое быстрее — дольше непрозрачная
    nw.style.transform = '';
    nw.classList.add('is-on');
    return j;
  }
  let target = 'washer', li = 0;
  const nextItem = () => {
    if (target === 'washer') wi = swap(washers, wi, 1);
    else if (target === 'dryer') di = swap(dryers, di, 1);
    else li = swap(links[di].items, li, 1);
  };
  // иконка соединителя: обе плоскости 3 раза сходятся друг к другу (не до конца) и расходятся обратно
  async function icoJoin() {
    const t = root.querySelector('.kb__pl--t'), b = root.querySelector('.kb__pl--b');
    const set = (dy, ms) => {
      for (const [el, k] of [[t, 1], [b, -1]]) {
        el.style.transition = `transform ${ms / SPEED}ms ${EASE}`;
        el.style.transform = dy ? `translateY(${k * dy}px)` : 'none';
      }
      return wait(ms);
    };
    for (let n = 0; n < 3; n++) { await set(1.4, 520); await set(0, 520); }   // зазор 5.3 → 2.5, не до конца
  }

  // соединитель появляется посередине зазора, затем оба опускаются с разной скоростью:
  // соединитель ложится на стиральную первым, сушилка догоняет и садится на него
  // соединитель уже висит посередине зазора, когда поднимаемся к сушилке (в цвет модели — тёмный)
  function linkReady() {
    const l = links[di];
    l.items.forEach((im, k) => {         // виден подходящий, круг из 3 кликов вернёт к нему
      im.style.transition = 'none'; im.style.transform = ''; im.classList.toggle('is-on', k === 0);
    });
    l.style.transition = 'none';
    l.style.transform = `translateY(${-GAP / 2}px)`;   // зазор = GAP + плита → плита ровно посередине
    l.style.opacity = 1;
  }
  function flyIn(el, dy, ms) {          // сверху из прозрачности на место — обратный flyUp, In Out Cubic
    el.style.transition = 'none';
    el.style.transform = `translateY(${-dy}px)`;
    el.style.opacity = 0;
    el.offsetHeight;
    el.style.transition = `transform ${ms / SPEED}ms ${ZOOM_EASE}, opacity ${ms / SPEED}ms ${ZOOM_EASE}`;
    el.style.transform = 'none';
    el.style.opacity = 1;
  }
  function linkSeat() {                 // соединитель модели в цвет, лежит на стиральной; сушилка — на нём
    links[di].items.forEach((im, k) => {
      im.style.transition = 'none'; im.style.transform = ''; im.classList.toggle('is-on', k === 0);
    });
    hang(false, 0);
  }
  async function separate() {           // раздвигаются: сушилка вверх на зазор, соединитель — на середину (обратный join)
    const l = links[di];
    l.style.transition = `transform ${520 / SPEED}ms cubic-bezier(.5, 0, .4, 1)`;
    l.style.transform = `translateY(${-GAP / 2}px)`;
    await hang(true, 820);
  }
  async function join() {
    const l = links[di];
    target = 'link'; li = 0;
    await clicks(3);                    // перебираем 3 соединителя — как машины
    await wait(900);
    moveTo(REST, 1300);                 // курсор уходит в сторону, пока соединяются
    l.style.transition = `transform ${520 / SPEED}ms cubic-bezier(.5, 0, .4, 1)`;
    l.style.transform = 'none';
    await hang(false, 820);
  }
  const dryShow = (on, ms) => {         // в фазе A сушилки не видно (она над кадром)
    dryBox.style.opacity = on ? 1 : 0; dryBox.style.transitionProperty = 'transform, opacity';
  };
  function fadeTop() {
    dryBox.style.transition = `opacity ${700 / SPEED}ms ease`; dryBox.style.opacity = 0;
    links.forEach((l) => { l.style.transition = `opacity ${700 / SPEED}ms ease`; l.style.opacity = 0; });
  }
  function flyUp(el, dy, ms) {          // вверх и в прозрачность — In Out Cubic
    el.style.transition = `transform ${ms / SPEED}ms ${ZOOM_EASE}, opacity ${ms / SPEED}ms ${ZOOM_EASE}`;
    el.style.transform = `translateY(${-dy}px)`;
    el.style.opacity = 0;
  }
  function unjoin() {
    links.forEach((l) => { l.style.transition = 'none'; l.style.opacity = 0; });
    hang(true, 0);
  }

  /* ---------- курсор ---------- */
  const cursor = root.querySelector('.kb__cursor');
  const next = root.querySelector('.kb__arrow--next');
  const cta = root.querySelector('.kb__cta');
  const arrows = [...root.querySelectorAll('.kb__arrow')];
  const pos = { x: 300, y: 215 };
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
    const dx = x - x0, dy = y - y0;
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
  const NEXT = { x: next.offsetLeft + 22, y: next.offsetTop + 23 };
  const REST = { x: 480, y: 185 };      // курсор в стороне, пока соединение и отдаление
  const ctaPoint = () => ({
    x: cta.parentElement.offsetLeft + cta.offsetLeft + cta.offsetWidth / 2 + 8,
    y: cta.parentElement.offsetTop + cta.offsetTop + cta.offsetHeight / 2 + 6,
  });
  async function press(el, onDown) {
    cursor.classList.add('is-pressed');
    el.classList.add('is-pressed');
    await wait(110 * SPEED);
    onDown && onDown();
    cursor.classList.remove('is-pressed');
    el.classList.remove('is-pressed');
    await wait(150);
  }
  async function clicks(n) {            // n кликов по «вперёд», рука чуть «живёт» между ними
    for (let k = 0; k < n; k++) {
      await press(next, nextItem);
      if (k === n - 1) break;
      await moveTo({ x: NEXT.x + 2, y: NEXT.y + 3 }, 500);
      await wait(700);
      await moveTo(NEXT, 240);
    }
  }

  /* ---------- общий цикл ---------- */
  async function loop() {
    washers[0].classList.add('is-on');
    dryers[0].classList.add('is-on');
    dryShow(false); unjoin();
    cam(CAM.washer, 0);
    setY(VIEW_H + 20, 0);               // до «Начать подбор» плашек и стрелок нет
    root.classList.add('is-out');
    place();
    await wait(600);
    for (let first = true; ; first = false) {
      // старт — «Начать подбор»
      await moveTo(ctaPoint(), first ? 900 : 700);
      await wait(200);
      await press(cta);
      // после нажатия: плашки выезжают снизу, стрелки из центра расходятся — In Out Cubic, 1 с
      root.classList.add('is-arrows-in');
      root.classList.remove('is-out');
      await Promise.all([setY(focusY(0), STEP_MS, ZOOM_EASE), moveTo(NEXT, 1000)]);
      root.classList.remove('is-arrows-in');
      // A — стиральные
      target = 'washer';
      await wait(200);
      await clicks(3);   // тёмная → белая → белая с хромом → тёмная
      await wait(900);
      // B — сушилки
      // соединитель, через 0.25 с сушилка прилетают сверху из прозрачности и встают колонной; камера поднимается
      linkSeat();
      { const FLY = 25 / outCam(ORDER[di]).s;
        flyIn(links[di], FLY, 1200);
        setTimeout(() => flyIn(dryBox, FLY, 1200), 500 / SPEED); }
      await Promise.all([setY(focusY(1), STEP_MS, ZOOM_EASE), cam(CAM.dryer, 2000, ZOOM_EASE)]);   // подъём к сушилке — In Out Cubic, 1 с
      target = 'dryer';
      await wait(300);
      await clicks(3);   // тёмная → белая → белая с хромом → тёмная
      await wait(900);
      // C — соединение
      await Promise.all([setY(focusY(2), STEP_MS, ZOOM_EASE), cam(CAM.joint, 1300)]);
      icoJoin();                        // иконка соединителя «показывает» соединение
      await separate();                 // раздвигаются
      await join();                     // листаем соединитель и снова сдвигаем
      await wait(500);
      // отдаляемся: колонна целиком в баннере, стрелки уходят
      root.classList.add('is-arrows-in', 'is-gone');   // стрелки расходятся от машины и гаснут
      basketsShow(true, 2000);          // корзинки проявляются вместе с отдалением
      await cam(outCam(ORDER[di]), 2000, ZOOM_EASE);   // 1 с реального времени
      await wait(1400);
      // назад к стиральной, плашки — снизу заново, стрелки возвращаются
      await setY(-track.offsetHeight - 20, STEP_MS, ZOOM_EASE);
      setY(VIEW_H + 20, 0); track.offsetHeight;   // плашки ждут внизу следующего «Начать подбор»
      // уход из финала: сушилка улетает вверх и гаснет, через 0.25 с — соединитель, и камера приближается к стиральной
      const sOut = outCam(ORDER[di]).s, FLY = 25 / sOut;   // ~25 px на экране при отдалении
      flyUp(dryBox, FLY, 1200);
      basketsShow(false, 1200);
      await wait(500);                  // соединитель — через 0.25 с за сушилкой
      flyUp(links[di], FLY, 1200);
      await cam(CAM.washer, 1700);
      dryShow(false); unjoin();         // сушилка снова висит и спрятана
      root.classList.remove('is-arrows-in', 'is-gone'); root.classList.add('is-out');   // стрелки ждут у центра (невидимы)
    }
  }

  document.fonts && document.fonts.ready ? document.fonts.ready.then(loop) : loop();
})();
