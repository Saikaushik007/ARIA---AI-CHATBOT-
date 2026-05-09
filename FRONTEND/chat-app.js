const chatWindow = document.getElementById('chatWindow');
const userInput = document.getElementById('userInput');
const chatForm = document.getElementById('chatForm');
const quickChips = document.getElementById('quickChips');
const navHistoryBtn = document.getElementById('navHistoryBtn');
const historyDropdown = document.getElementById('historyDropdown');
const historyList = document.getElementById('historyList');
const navNewChatBtn = document.getElementById('navNewChatBtn');
const navLogoutBtn = document.getElementById('navLogoutBtn');
const statCount = document.getElementById('statCount');
const statDuration = document.getElementById('statDuration');
const statMood = document.getElementById('statMood');
const ariaMoodEmoji = document.getElementById('ariaMoodEmoji');
const ariaMoodLabel = document.getElementById('ariaMoodLabel');
const fileInput = document.getElementById('fileInput');
const filePreview = document.getElementById('filePreview');

let userId = localStorage.getItem('userId');
let selectedFile = null;
let sessionStartTime = Date.now();

if (!userId) {
  window.location.href = '/login.html';
}

const fallbackReplies = [
  "I'm not sure I understand yet. Try asking me: tell me a joke, what time is it, or flip a coin.",
  "That one is new to me. Ask me about a joke, the time, or a fun fact.",
  "Hmm, I couldn't parse that. Maybe try: tell me a joke, what time is it, or what can you do.",
  "I don't have that rule yet. How about: flip a coin, tell me a joke, or what's the date?",
  "Sorry, that one is outside my matrix. Try: what time is it, tell me a joke, or roll a dice."
];

const jokes = [
  "I asked the computer for a joke, it said: 'No bytes found.'",
  "Why did the programmer quit? Because he didn't get arrays.",
  "I would tell you a UDP joke, but you might not get it.",
  "Why do Java developers wear glasses? Because they don't C#.",
  "Why don't robots have brothers? Because they all share the same motherboard.",
  "I tried to tell a time-travel joke, but you guys didn't like it.",
  "What does a cloud wear under his raincoat? Thunderwear.",
  "Why was the computer cold? It left its Windows open.",
  "Why was the robot so bad at soccer? He kept rebooting the ball.",
  "How does ARIA shave? With a microprocessor."
];

const facts = [
  "A day on Venus is longer than a year on Venus.",
  "Honey never spoils; archaeologists have found edible honey in ancient tombs.",
  "Bananas glow blue under black light because of their potassium content.",
  "Octopuses have three hearts and blue blood.",
  "Wombat poop is cube-shaped so it doesn't roll away.",
  "The first computer bug was an actual moth trapped in a relay.",
  "There are more trees on Earth than stars in the Milky Way.",
  "A single strand of spaghetti is called a spaghetto.",
  "Venus rotates backwards compared to most planets.",
  "The Eiffel Tower can grow six inches during the summer heat."
];

const moods = {
  caring: { emoji: '💙', label: 'Caring' },
  excited: { emoji: '⭐', label: 'Excited' },
  calm: { emoji: '🌊', label: 'Calm' },
  neutral: { emoji: '🤖', label: 'Ready' }
};

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000) % 60;
  const minutes = Math.floor(ms / 60000) % 60;
  const hours = Math.floor(ms / 3600000);
  const padded = x => String(x).padStart(2, '0');
  return hours ? `${padded(hours)}:${padded(minutes)}:${padded(seconds)}` : `${padded(minutes)}:${padded(seconds)}`;
}

function updateMoodDisplay(moodKey) {
  const mood = moods[moodKey] || moods.neutral;
  ariaMoodEmoji.textContent = mood.emoji;
  ariaMoodLabel.textContent = mood.label;
  statMood.textContent = mood.label;
}

function refreshStats() {
  const messages = chatWindow.querySelectorAll('.message-row').length;
  statCount.textContent = messages;
  const durationMs = Date.now() - sessionStartTime;
  statDuration.textContent = formatDuration(durationMs);
}

function createMessageBubble(text, sender = 'aria', meta = '', fileData = null) {
  const row = document.createElement('div');
  row.className = `message-row ${sender}`;
  const bubble = document.createElement('div');
  bubble.className = `bubble ${sender}`;

  if (fileData) {
    const fileEl = document.createElement('div');
    fileEl.className = 'file-attachment';
    if (fileData.type.startsWith('image/')) {
      const img = document.createElement('img');
      img.src = fileData.data;
      img.style.maxWidth = '100%';
      img.style.borderRadius = '12px';
      fileEl.appendChild(img);
    } else {
      const label = document.createElement('span');
      label.textContent = `📎 ${fileData.name}`;
      fileEl.appendChild(label);
    }
    bubble.appendChild(fileEl);
  }

  if (sender === 'aria' && typeof text === 'string' && /<ul>|<li>/.test(text)) {
    bubble.innerHTML += text;
  } else {
    const textEl = document.createElement('span');
    textEl.textContent = text;
    bubble.appendChild(textEl);
  }

  if (meta) {
    const metaNode = document.createElement('span');
    metaNode.className = 'metadata';
    metaNode.textContent = meta;
    bubble.appendChild(metaNode);
  }

  row.appendChild(bubble);
  chatWindow.appendChild(row);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return row;
}

function addTypingIndicator() {
  const row = document.createElement('div');
  row.className = 'message-row aria typing-row';
  const bubble = document.createElement('div');
  bubble.className = 'bubble aria typing-bubble';
  const loader = document.createElement('div');
  loader.className = 'dot-loader';
  loader.innerHTML = '<span></span><span></span><span></span>';
  bubble.appendChild(loader);
  row.appendChild(bubble);
  chatWindow.appendChild(row);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return row;
}

function setQuickReplies(options = []) {
  quickChips.innerHTML = '';
  const defaultChips = ['What can you do?', 'Tell me a joke', 'What time is it?'];
  const chips = options.length ? options.slice(0, 3) : defaultChips;
  chips.forEach(label => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chip';
    button.textContent = label;
    button.addEventListener('click', () => {
      userInput.value = label;
      submitMessage(label);
    });
    quickChips.appendChild(button);
  });
}

function resizeTextarea() {
  userInput.style.height = 'auto';
  userInput.style.height = `${Math.min(userInput.scrollHeight, 170)}px`;
}

function getBotResponse(rawInput) {
  const input = rawInput.toLowerCase().trim();
  const time = new Date();
  const hours = time.getHours();
  const period = hours < 12 ? 'morning' : hours < 18 ? 'afternoon' : 'evening';

  if (/tell me a joke/.test(input)) {
    return { reply: jokes[Math.floor(Math.random() * jokes.length)], mood: 'excited', quick: ['Another joke', 'Fun fact', 'Flip a coin'] };
  }

  if (/fun fact|give me a fact/.test(input)) {
    return { reply: facts[Math.floor(Math.random() * facts.length)], mood: 'excited', quick: ['Tell me a joke', 'What time is it?', 'Roll a dice'] };
  }

  if (/what time is it/.test(input)) {
    return { reply: `The current time is ${time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}.`, mood: 'neutral', quick: ['What day is it?', 'Tell me a joke', 'Flip a coin'] };
  }

  if (/what day is it|today('?s)? date/.test(input)) {
    return { reply: `Today is ${time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}.`, mood: 'neutral', quick: ['What time is it?', 'Tell me a joke', 'Fun fact'] };
  }

  if (/flip a coin/.test(input)) {
    const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
    return { reply: `I flipped a coin for you: ${result}!`, mood: 'neutral', quick: ['Roll a dice', 'Tell me a joke', 'Fun fact'] };
  }

  if (/roll a dice|roll a die|roll dice/.test(input)) {
    return { reply: `You rolled a ${Math.floor(Math.random() * 6) + 1}.`, mood: 'excited', quick: ['Flip a coin', 'Tell me a joke', 'What time is it?'] };
  }

  if (/what can you do/.test(input)) {
    return {
      reply: `I can:\n• Answer time, date, and mission-control questions.\n• Tell jokes and fun facts.\n• Remember your chat history.\n• Accept file and image uploads.\n• Process and analyze uploaded content.`,
      mood: 'excited',
      quick: ['Tell me a joke', 'Flip a coin', 'Give me a fact']
    };
  }

  const reply = fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
  return { reply, mood: 'neutral', quick: ['Tell me a joke', 'What time is it?', 'Flip a coin'] };
}

async function submitMessage(inputValue) {
  if (!inputValue.trim() && !selectedFile) return;

  const messageText = inputValue.trim();
  userInput.value = '';
  resizeTextarea();
  filePreview.innerHTML = '';

  const now = new Date();
  const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  let fileData = null;
  if (selectedFile) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      fileData = {
        name: selectedFile.name,
        type: selectedFile.type,
        data: e.target.result
      };
      createMessageBubble(messageText || '[File uploaded]', 'user', timestamp, fileData);
      selectedFile = null;

      incrementMessageCount();
      const typingRow = addTypingIndicator();
      const responseData = getBotResponse(messageText || selectedFile.name);
      updateMoodDisplay(responseData.mood);

      let delay = Math.min(1600, 850 + responseData.reply.length * 8 + Math.random() * 180);

      setTimeout(() => {
        typingRow.remove();
        createMessageBubble(responseData.reply, 'aria', timestamp);
        setQuickReplies(responseData.quick);
        saveChatMessage(messageText, 'user', fileData);
        saveChatMessage(responseData.reply, 'aria');
      }, delay);
    };
    reader.readAsDataURL(selectedFile);
  } else {
    createMessageBubble(messageText, 'user', timestamp);
    incrementMessageCount();
    const typingRow = addTypingIndicator();
    const responseData = getBotResponse(messageText);
    updateMoodDisplay(responseData.mood);

    let delay = Math.min(1600, 850 + responseData.reply.length * 8 + Math.random() * 180);

    setTimeout(() => {
      typingRow.remove();
      createMessageBubble(responseData.reply, 'aria', timestamp);
      setQuickReplies(responseData.quick);
      saveChatMessage(messageText, 'user');
      saveChatMessage(responseData.reply, 'aria');
    }, delay);
  }
}

async function saveChatMessage(text, sender, fileData = null) {
  try {
    await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        sender,
        text,
        file: fileData
      })
    });
  } catch (e) {
    console.error('Error saving message:', e);
  }
}

function incrementMessageCount() {
  refreshStats();
}

async function loadChatHistory() {
  try {
    const response = await fetch(`/api/chat-history?userId=${userId}`);
    const data = await response.json();
    if (data.success && data.history.length > 0) {
      // Load into window
      data.history.forEach(msg => {
        const timestamp = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        createMessageBubble(msg.text, msg.sender, timestamp, msg.file);
      });

      // Populate dropdown (for demo purposes we just show the most recent message as a session)
      historyList.innerHTML = '';
      const btn = document.createElement('button');
      btn.className = 'history-item';
      btn.textContent = 'Current Session (' + data.history.length + ' msgs)';
      historyList.appendChild(btn);
    }
  } catch (e) {
    console.error('Error loading chat history:', e);
  }
}

fileInput.addEventListener('change', (e) => {
  selectedFile = e.target.files[0];
  if (selectedFile) {
    const preview = document.createElement('div');
    preview.className = 'file-preview-item';
    preview.textContent = `📎 ${selectedFile.name}`;
    filePreview.innerHTML = '';
    filePreview.appendChild(preview);
  }
});

chatForm.addEventListener('submit', event => {
  event.preventDefault();
  submitMessage(userInput.value);
});

userInput.addEventListener('input', resizeTextarea);

navHistoryBtn.addEventListener('click', (e) => {
  e.preventDefault();
  historyDropdown.classList.toggle('hidden');
});

navNewChatBtn.addEventListener('click', (e) => {
  e.preventDefault();
  if (!confirm('Start a new chat and clear current window?')) return;
  chatWindow.innerHTML = '';
  quickChips.innerHTML = '';
  sessionStartTime = Date.now();
  updateMoodDisplay('neutral');
  refreshStats();
});

navLogoutBtn.addEventListener('click', (e) => {
  e.preventDefault();
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('userId');
    window.location.href = '/login.html';
  }
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  if (!navHistoryBtn.contains(e.target) && !historyDropdown.contains(e.target)) {
    historyDropdown.classList.add('hidden');
  }
});

window.addEventListener('keydown', event => {
  if (event.key === 'Enter' && !event.shiftKey && document.activeElement === userInput) {
    event.preventDefault();
    submitMessage(userInput.value);
  }
});

loadChatHistory();
refreshStats();
setInterval(refreshStats, 1000);
