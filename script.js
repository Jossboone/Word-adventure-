// script.js
// Spelling Game logic

const words = [
  "apple",
  "banana",
  "orange",
  "grape",
  "kiwi",
  "melon",
  "pear",
  "peach"
];

let currentIndex = parseInt(localStorage.getItem('currentIndex') || '0', 10);
if (isNaN(currentIndex) || currentIndex < 0 || currentIndex >= words.length) currentIndex = 0;

let coins = parseInt(localStorage.getItem('coins') || '0', 10);
const wordContainer = document.getElementById('word-container');
const letterBank = document.getElementById('letter-bank');
const checkBtn = document.getElementById('check-btn');
const coinsEl = document.getElementById('coins');

const correctSound = document.getElementById('correct-sound');
const wrongSound = document.getElementById('wrong-sound');

function saveState() {
  localStorage.setItem('coins', coins);
  localStorage.setItem('currentIndex', currentIndex);
}

function updateCoinsDisplay() {
  coinsEl.textContent = coins;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function createLetterSlots(word) {
  wordContainer.innerHTML = '';
  for (let i = 0; i < word.length; i++) {
    const slot = document.createElement('button');
    slot.className = 'letter-slot empty';
    slot.dataset.index = i;
    slot.textContent = '';
    slot.addEventListener('click', () => {
      // If slot filled, return letter to bank
      if (!slot.classList.contains('empty')) {
        const letter = slot.textContent;
        slot.textContent = '';
        slot.classList.add('empty');
        addLetterToBank(letter);
      }
    });
    wordContainer.appendChild(slot);
  }
}

function addLetterToBank(letter) {
  // Add a single letter button to letter bank (append)
  const btn = document.createElement('button');
  btn.className = 'bank-letter';
  btn.textContent = letter;
  btn.addEventListener('click', () => {
    placeLetterInFirstEmptySlot(letter, btn);
  });
  letterBank.appendChild(btn);
}

function placeLetterInFirstEmptySlot(letter, bankBtn) {
  const slots = Array.from(wordContainer.querySelectorAll('.letter-slot'));
  const firstEmpty = slots.find(s => s.classList.contains('empty'));
  if (!firstEmpty) return; // no empty slot
  firstEmpty.textContent = letter;
  firstEmpty.classList.remove('empty');
  // remove bank button
  bankBtn.remove();
  // play letter audio (fallback to speech synthesis)
  playLetterAudio(letter);
}

function buildLetterBankForWord(word) {
  letterBank.innerHTML = '';
  const letters = word.split('');
  // Add a few decoy letters to make it interesting
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  const decoysNeeded = Math.max(0, Math.min(6, Math.floor(word.length / 2) + 2));
  for (let i = 0; i < decoysNeeded; i++) {
    const decoy = alphabet[Math.floor(Math.random() * alphabet.length)];
    letters.push(decoy);
  }
  shuffle(letters);
  letters.forEach(l => addLetterToBank(l));
}

function setUpWord() {
  const word = words[currentIndex];
  createLetterSlots(word);
  buildLetterBankForWord(word);
  updateCoinsDisplay();
}

function getUserAnswer() {
  const slots = Array.from(wordContainer.querySelectorAll('.letter-slot'));
  return slots.map(s => s.textContent || '').join('');
}

function checkAnswer() {
  const target = words[currentIndex];
  const answer = getUserAnswer();
  if (answer.toLowerCase() === target.toLowerCase()) {
    // correct
    coins += 10;
    playSound(correctSound);
    // brief success UI
    flashSlots('correct');
    // advance to next word after a short delay
    saveState();
    setTimeout(() => {
      currentIndex = (currentIndex + 1) % words.length;
      saveState();
      setUpWord();
    }, 700);
  } else {
    // wrong
    coins = Math.max(0, coins - 2);
    playSound(wrongSound);
    flashSlots('wrong');
    saveState();
  }
  updateCoinsDisplay();
}

function playSound(audioEl) {
  if (!audioEl) return;
  // try play, ignore errors
  audioEl.currentTime = 0;
  audioEl.play().catch(() => {});
}

function flashSlots(type) {
  const slots = Array.from(wordContainer.querySelectorAll('.letter-slot'));
  slots.forEach(s => {
    s.classList.add(type);
    setTimeout(() => s.classList.remove(type), 600);
  });
}

function playLetterAudio(letter) {
  // Prefer a <audio> element with a preloaded file named like audio/a.mp3 if present,
  // fallback to speechSynthesis
  const el = document.getElementById('letter-audio');
  const audioPath = `audio/${letter.toLowerCase()}.mp3`;
  // Try loading the file by setting src. If file not found, browser may throw on play; fallback to TTS.
  el.src = audioPath;
  el.currentTime = 0;
  el.play().catch(() => {
    // fallback to speech synthesis
    try {
      const u = new SpeechSynthesisUtterance(letter);
      u.lang = 'en-US';
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    } catch (e) {
      // nothing else to do
    }
  });
}

// allow keyboard typing
document.addEventListener('keydown', (e) => {
  const key = e.key;
  if (/^[a-zA-Z]$/.test(key)) {
    // find a bank button for this letter
    const bankBtns = Array.from(letterBank.querySelectorAll('.bank-letter'));
    const targetBtn = bankBtns.find(b => b.textContent.toLowerCase() === key.toLowerCase());
    if (targetBtn) {
      placeLetterInFirstEmptySlot(targetBtn.textContent, targetBtn);
    }
  } else if (key === 'Backspace') {
    // remove last filled slot (return letter)
    const slots = Array.from(wordContainer.querySelectorAll('.letter-slot'));
    const filled = slots.filter(s => !s.classList.contains('empty'));
    const last = filled[filled.length - 1];
    if (last) {
      const letter = last.textContent;
      last.textContent = '';
      last.classList.add('empty');
      addLetterToBank(letter);
    }
  } else if (key === 'Enter') {
    checkAnswer();
  } else if (key === 'ArrowRight') {
    // skip to next word (no coin change)
    currentIndex = (currentIndex + 1) % words.length;
    saveState();
    setUpWord();
  }
});

checkBtn.addEventListener('click', checkAnswer);

// initialize
setUpWord();