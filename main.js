const fruitIcons = ["🍎", "🍞", "🍇", "🍉", "🥝", "🍔", "🍒", "🥑", "🐷", "🍪", "🍐", "🥥", "🍌", "🐶", "🍟", "🥦", "🫐"];


const gameContainer = document.getElementById("game-container");
const mergeBar = document.getElementById("merge-bar");
const statusText = document.getElementById("status-text");

let mergeSlots = [];
let history = [];
let currentLevel = 1;
let cardData = [];

function initLevel1() {
  currentLevel = 1;
  gameContainer.innerHTML = "";
  statusText.innerText = "Click a tile to move it into slot. Match 3 to clear.";
  cardData = [];

  const selectedFruits = shuffleArray(fruitIcons).slice(0, 3);
  const fullDeck = [];

  selectedFruits.forEach(fruit => {
    for (let i = 0; i < 6; i++) {
      fullDeck.push({ icon: fruit, layer: 0 });
    }
  });

  const shuffled = shuffleArray(fullDeck);
  const positions = [
    { x: 3, y: 2, layer: 1 }, { x: 4, y: 2, layer: 1 }, { x: 5, y: 2, layer: 1 },
    { x: 3, y: 3, layer: 1 }, { x: 4, y: 3, layer: 1 }, { x: 5, y: 3, layer: 1 },
    { x: 3, y: 4, layer: 1 }, { x: 4, y: 4, layer: 1 }, { x: 5, y: 4, layer: 1 },
    { x: 3.5, y: 2.5, layer: 2 }, { x: 4.5, y: 2.5, layer: 2 }, { x: 5.5, y: 2.5, layer: 2 },
    { x: 3.5, y: 3.5, layer: 2 }, { x: 4.5, y: 3.5, layer: 2 }, { x: 5.5, y: 3.5, layer: 2 },
    { x: 3.5, y: 4.5, layer: 2 }, { x: 4.5, y: 4.5, layer: 2 }, { x: 5.5, y: 4.5, layer: 2 },
  ];

  for (let i = 0; i < shuffled.length; i++) {
    const { x, y, layer } = positions[i];
    cardData.push({ id: generateId(), icon: shuffled[i].icon, x, y, layer });
  }

  renderCards();
  resetMergeSlots();
}

function initLevel2() {
  currentLevel = 2;
  gameContainer.innerHTML = "";
  statusText.innerText = "Level 2: Match 3 to clear 240 fruits!";
  cardData = [];

  const selected = shuffleArray(fruitIcons).slice(0, 16);
  let deck = [];
  selected.forEach(fruit => {
    for (let i = 0; i < 15; i++) {
      deck.push({ icon: fruit });
    }
  });

  deck = shuffleArray(deck);

  const gridSize = 7;
  const center = (gridSize - 1) / 2;

  const positions = [];
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      for (let z = 0; z < 2; z++) {
        positions.push({ x, y });
      }
    }
  }

  for (let i = 0; i < deck.length; i++) {
    const pos = positions[i % positions.length];
    const dx = pos.x - center;
    const dy = pos.y - center;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const baseLayer = Math.floor((1 - distance / center) * 25);
    const layer = Math.max(0, baseLayer + Math.floor(Math.random() * 3));

    cardData.push({
      id: generateId(),
      icon: deck[i].icon,
      x: pos.x + 1.5,  // ✅ 横向居中偏移
      y: pos.y + 1.5,  // ✅ 纵向居中偏移
      layer: layer
    });
  }

  renderCards();
  resetMergeSlots();
}




function renderCards() {
  gameContainer.innerHTML = "";
  const sorted = [...cardData].sort((a, b) => a.layer - b.layer);

  sorted.forEach(card => {
    const cardEl = document.createElement("div");
    cardEl.className = "card";
    cardEl.innerText = card.icon;
    cardEl.style.left = `${card.x * 50}px`;
    cardEl.style.top = `${card.y * 50}px`;
    cardEl.style.zIndex = card.layer;
    const clickable = isCardClickable(card);
    if (!clickable) {
      cardEl.classList.add("disabled");
    }
    cardEl.onclick = () => onCardClick(card.id);
    gameContainer.appendChild(cardEl);
  });
}

function isCardClickable(card) {
  return !cardData.some(other =>
    other !== card &&
    Math.round(other.x) === Math.round(card.x) &&
    Math.round(other.y) === Math.round(card.y) &&
    other.layer > card.layer
  );
}


function onCardClick(cardId) {
  const card = cardData.find(c => c.id === cardId);
  if (!card || !isCardClickable(card)) return;

  const slot = mergeSlots.find(s => !s.icon);
  if (!slot) return;

  // ✅ 正确：先保存历史状态
  saveHistory();

  slot.icon = card.icon;
  mergeSlots[mergeSlots.indexOf(slot)] = slot;
  cardData = cardData.filter(c => c.id !== cardId);

  renderCards();
  updateMergeBar();
  checkMatch();
}


function checkMatch() {
  const counts = {};
  for (let slot of mergeSlots) {
    if (slot.icon) {
      counts[slot.icon] = (counts[slot.icon] || 0) + 1;
    }
  }

  let matched = false;
  for (let icon in counts) {
    if (counts[icon] >= 3) {
      mergeSlots = mergeSlots.map(slot => slot.icon === icon ? { icon: null } : slot);
      statusText.innerText = `Matched 3!`;
      matched = true;
    }
  }

  updateMergeBar();

  // ✅ 检查是否游戏失败（全部满且没有可匹配的）
  const allFull = mergeSlots.every(slot => slot.icon !== null);
  const noMatchPossible = !Object.values(counts).some(count => count >= 3);

  if (allFull && noMatchPossible) {
    setTimeout(() => {
      if (confirm("游戏失败！是否重新开始？")) {
        initLevel1();
      }
    }, 100); // 加一点延迟避免 UI 闪烁
    return;
  }

  if (matched && cardData.length === 0) {
    if (currentLevel === 1) {
      statusText.innerText = "Level 1 Completed! Loading Level 2...";
      setTimeout(() => initLevel2(), 1000);
    } else {
      statusText.innerText = "🎉 Congratulations! You cleared Level 2!";
    }
  }
}


function undoStep() {
  if (history.length === 0) return;
  const last = history.pop();
  cardData = last.cardData;
  mergeSlots = last.mergeSlots;
  renderCards();
  updateMergeBar();
}

function saveHistory() {
  history.push({
    cardData: JSON.parse(JSON.stringify(cardData)),
    mergeSlots: JSON.parse(JSON.stringify(mergeSlots))
  });
}

function resetMergeSlots() {
  mergeSlots = new Array(7).fill(null).map(() => ({ icon: null }));
  updateMergeBar();
}

function updateMergeBar() {
  for (let i = 0; i < mergeBar.children.length; i++) {
    mergeBar.children[i].innerText = mergeSlots[i]?.icon || "";
  }
}

function shuffleArray(arr) {
  return arr.slice().sort(() => Math.random() - 0.5);
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

// 初始化游戏
