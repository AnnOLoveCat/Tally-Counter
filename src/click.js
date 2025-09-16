// ===== helpers =====

// 判斷「這個值有沒有真的被設定」
const has = (v) => v !== undefined && v !== null && String(v).trim() !== '';

// 展開來的寫法
// function has(v) {
//   // 先排除 undefined / null
//   if (v === undefined || v === null) {
//     return false;
//   }

//   // 轉成字串後去除前後空白，再檢查是否為空字串
//   if (String(v).trim() === '') {
//     return false;
//   }
//   return true;
// }

// 把任何輸入轉成有限數字，轉不出來就回傳預設值 def
const toNum = (v, def = 0) => (Number.isFinite(Number(v)) ? Number(v) : def);

// 展開來的寫法
// const toNum = (v, def = 0) => {
//   const n = Number(v);
//   return Number.isFinite(n) ? n : def;
// };

// ===== elements =====

// 以 .container為根部，向內找兩個按鈕 .click-up、.click-down。
// ?. = 在 container 不存在時不會丟錯
const container    = document.querySelector('.container');
const upElement    = container?.querySelector('.click-up');
const downElement  = container?.querySelector('.click-down');

// 數字顯示的元素優先找counter
// 避免改.number 或 .counter 的 class忘了動JS。
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

// 初始值：從畫面文字讀，轉成數字，再 clamp 一次。
// 這裡處理了三件事：
// String → Int
// Illegal Value → Default 0
// 夾限 → 確保一開始就在合法範圍
let value = clamp(toNum(numberElement?.textContent, 0));
// clamp(value, min, max)——如果 value 小於 min 就回傳 min，大於 max 就回傳 max，否則回傳原值。

const render = (v) => { numberElement.textContent = String(v); };
render(value);
// 之後若要「同步 localStorage / 送到後端 / 觸發動畫」，可以在更新流程插入，或在 render 加上你的 hook。


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
  // 目前焦點元素是否為 INPUT 或 TEXTAREA
  // 或者它是 contenteditable（可編輯區塊），或被包在某個 contenteditable="true" 的祖先內。
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
