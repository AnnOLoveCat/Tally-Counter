// ===== helpers =====
const has = (v) => v !== undefined && v !== null && String(v).trim() !== '';
const toNum = (v, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};

// ===== elements =====
const container    = document.querySelector('.container');
const upElement    = container?.querySelector('.click-up');
const downElement  = container?.querySelector('.click-down');
const numberElement =
  document.getElementById('counter') ||
  container?.querySelector('.number') ||
  container?.querySelector('.counter'); // 最後防呆

if (!container || !upElement || !downElement || !numberElement) {
  console.error('[tally] required elements not found');
}

// ===== config from data-* (以數字元素為主，容器為備援) =====
const ds = numberElement?.dataset ?? {};
const dsFallback = container?.dataset ?? {};

const STEP = has(ds.step)   ? toNum(ds.step, 1)       : toNum(dsFallback.step, 1);
const MIN  = has(ds.min)    ? toNum(ds.min, -Infinity): toNum(dsFallback.min, -Infinity);
const MAX  = has(ds.max)    ? toNum(ds.max,  Infinity): toNum(dsFallback.max,  Infinity);

const clamp = (v) => Math.max(MIN, Math.min(MAX, v));

// ===== state & render =====
let value = clamp(toNum(numberElement?.textContent, 0));
const render = (v) => { numberElement.textContent = String(v); };
render(value);

// ===== interactions: click =====
upElement?.addEventListener('click', () => {
  value = clamp(value + STEP);
  render(value);
});

downElement?.addEventListener('click', () => {
  value = clamp(value - STEP);
  render(value);
});

const isTypingTarget = (el) => {
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable || el.closest?.('[contenteditable="true"]');
};

let delayTimer = null;
let repeatTimer = null;

function stopRepeat() {
  clearTimeout(delayTimer); delayTimer = null;
  clearInterval(repeatTimer); repeatTimer = null;
}

function stepOnce(dir) {
  value = clamp(value + dir * STEP);
  render(value);
}

document.addEventListener('keydown', (e) => {
  if (isTypingTarget(document.activeElement)) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;

  const lower = e.key.toLowerCase();
  let dir = 0;
  if (e.key === 'ArrowUp'   || lower === 'w') dir = +1;
  if (e.key === 'ArrowDown' || lower === 's') dir = -1;
  if (!dir) return;

  e.preventDefault();

  // 先執行一次
  stepOnce(dir);

  // 首次按下才開啟重複（避免瀏覽器 key repeat 與我們的定時器打架）
  if (!e.repeat) {
    stopRepeat();
    delayTimer = setTimeout(() => {
      repeatTimer = setInterval(() => stepOnce(dir), 80); // 80ms 一步，可自行調整速度
    }, 300); // 300ms 延遲後開始連發，可自行調整
  }
});

document.addEventListener('keyup', stopRepeat);
window.addEventListener('blur', stopRepeat);


// ===== optional controls: reset / set =====
const resetBtn = document.getElementById('resetBtn');
const setBtn   = document.getElementById('setBtn');
const setInput = document.getElementById('setInput');

resetBtn?.addEventListener('click', () => {
  value = clamp(0);
  render(value);
  if (setInput && setBtn) { setInput.value = ''; setBtn.disabled = true; }
});

if (setBtn && setInput) {
  const updateApplyState = () => {
    const str = setInput.value.trim();
    setBtn.disabled = (str === '' || !Number.isFinite(Number(str)));
  };
  setInput.addEventListener('input', updateApplyState);
  updateApplyState();

  setBtn.addEventListener('click', () => {
    const n = toNum(setInput.value, value);
    value = clamp(n);
    render(value);
  });
}
