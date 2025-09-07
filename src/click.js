// JavaScript
// STEP 1: 透過 querySelector 選擇到 HTML 中的「箭頭」元素
const upElement = document.querySelector('.click-up');
const downElement = document.querySelector('.click-down');

// STEP 2: 透過 querySelector 選擇到 HTML 中的「數字」元素
const numberElement = document.querySelector('.number');

// STEP 3: 監聽 click 事件，並執行對應的行為
upElement.addEventListener('click', (e) => {
  // STEP 4: 取得當前網頁上的數字
  const currentNumber = Number(numberElement.textContent);

  // STEP 5: 將數字增加後帶回網頁上
  numberElement.textContent = currentNumber + 1;
});

downElement.addEventListener('click', (e) => {
  const currentNumber = Number(numberElement.textContent);
  numberElement.textContent = currentNumber - 1;
});