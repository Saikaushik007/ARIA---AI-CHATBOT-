const chatWindow = document.getElementById('chatWindow');
const userInput = document.getElementById('userInput');
const chatForm = document.getElementById('chatForm');
const quickChips = document.getElementById('quickChips');
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.getElementById('sidebar');
const sidebarClose = document.getElementById('sidebarClose');
const exportBtn = document.getElementById('exportBtn');
const clearBtn = document.getElementById('clearBtn');
const statCount = document.getElementById('statCount');
const statDuration = document.getElementById('statDuration');
const statMood = document.getElementById('statMood');
const ariaMoodEmoji = document.getElementById('ariaMoodEmoji');
const ariaMoodLabel = document.getElementById('ariaMoodLabel');

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
  excited: { emoji: '🌟', label: 'Excited' },
  calm: { emoji: '🌊', label: 'Calm' },
  neutral: { emoji: '🤖', label: 'Ready' }
};

function getSessionValue(key, fallback = null) {
  return sessionStorage.getItem(key) || fallback;
}

function setSessionValue(key, value) {
  sessionStorage.setItem(key, value);
}

function initializeSession() {
  if (!getSessionValue('sessionStart')) {
    setSessionValue('sessionStart', Date.now());
  }
  if (!getSessionValue('messageCount')) {
    setSessionValue('messageCount', '0');
  }
  if (!getSessionValue('lastMood')) {
    setSessionValue('lastMood', 'neutral');
  }
  updateMoodDisplay(getSessionValue('lastMood'));
  refreshStats();
}

function refreshStats() {
  statCount.textContent = getSessionValue('messageCount', '0');
  statMood.textContent = moods[getSessionValue('lastMood', 'neutral')].label;
  const durationMs = Date.now() - Number(getSessionValue('sessionStart', Date.now()));
  statDuration.textContent = formatDuration(durationMs);
}

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

function incrementMessageCount() {
  const newCount = Number(getSessionValue('messageCount', '0')) + 1;
  setSessionValue('messageCount', String(newCount));
  refreshStats();
}

function createMessageBubble(text, sender = 'aria', meta = '') {
  const row = document.createElement('div');
  row.className = `message-row ${sender}`;
  const bubble = document.createElement('div');
  bubble.className = `bubble ${sender}`;
  if (sender === 'aria' && typeof text === 'string' && /<ul>|<li>/.test(text)) {
    bubble.innerHTML = text;
  } else {
    bubble.textContent = text;
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

function safeEvaluate(expr) {
  const sanitized = expr.replace(/[^0-9+\-*/().\s]/g, '');
  try {
    if (/[-+*/]{2,}/.test(sanitized)) return null;
    const result = Function(`"use strict"; return (${sanitized});`)();
    if (Number.isFinite(result)) return result;
  } catch {
    return null;
  }
  return null;
}

function extractName(text) {
  const patterns = [/my name is\s+([a-zA-Z\-]+)/i, /call me\s+([a-zA-Z\-]+)/i, /i am\s+([a-zA-Z\-]+)/i];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

function getSessionSummary() {
  const count = Number(getSessionValue('messageCount', '0'));
  const elapsed = formatDuration(Date.now() - Number(getSessionValue('sessionStart', Date.now())));
  return `You've sent ${count} message(s) this session and the conversation has been active for ${elapsed}.`;
}

function scrambleText() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function resizeTextarea() {
  userInput.style.height = 'auto';
  userInput.style.height = `${Math.min(userInput.scrollHeight, 170)}px`;
}

function getBotResponse(rawInput) {
  const input = rawInput.toLowerCase().trim();
  const name = getSessionValue('userName');
  const time = new Date();
  const hours = time.getHours();
  const period = hours < 12 ? 'morning' : hours < 18 ? 'afternoon' : 'evening';

  if (/\b(?:another joke|another one|one more joke|joke again)\b/.test(input)) {
    return { reply: jokes[Math.floor(Math.random() * jokes.length)], mood: 'excited', quick: ['Another joke ??', 'Fun fact', 'Flip a coin'] };
  }

  if (/\bthank(s| you)\b/.test(input)) {
    return { reply: `You're welcome${name ? `, ${name}` : ''}! I'm here whenever you need me.`, mood: 'excited', quick: ['What can you do?', 'Tell me a joke', 'What time is it?'] };
  }

  const greetings = ['hi', 'hello', 'hey', 'sup', 'yo'];
  if (greetings.some(g => input === g || input.startsWith(`${g} `))) {
    const greeting = name ? `Hey ${name}! Good to see you again.` : `Hey there! Good ${period}.`;
    return { reply: `${greeting} What mission can I help with today?`, mood: 'excited', quick: ['What can you do?', 'Tell me a joke', "What's the time?"] };
  }

  if (/good\s+morning|good\s+afternoon|good\s+evening/.test(input)) {
    return { reply: `Good ${period}! I'm ready to assist with your next request.`, mood: 'excited', quick: ['What can you do?', 'Tell me a joke', 'What day is it?'] };
  }

  const nameCapture = extractName(rawInput);
  if (nameCapture) {
    const cleanedName = nameCapture.replace(/[^a-zA-Z\-]/g, '');
    setSessionValue('userName', cleanedName);
    return { reply: `Nice to meet you, ${cleanedName}! I'll remember that.`, mood: 'excited', quick: ['What can you do?', 'Tell me a joke', 'Flip a coin'] };
  }

  if (/what('?s| is) my name|do you remember my name/.test(input)) {
    if (name) {
      return { reply: `Your name is ${name}. I remember you.`, mood: 'caring', quick: ['Tell me a joke', 'What can you do?', 'Who are you?'] };
    }
    return { reply: "You haven't told me yet! What's your name?", mood: 'caring', quick: ['My name is Alex', 'I am Sam', 'Call me Nova'] };
  }

  if (/sad|depressed|upset|lonely/.test(input)) {
    setSessionValue('lastMood', 'caring');
    return { reply: "I'm sorry you're feeling down. Remember: every code builds something stronger. You're not alone.", mood: 'caring', quick: ['Tell me a joke', 'Give me a fact', 'What can you do?'] };
  }

  if (/happy|excited|great|awesome|fantastic/.test(input)) {
    setSessionValue('lastMood', 'excited');
    return { reply: "That's amazing! Keep that energy going � I love hearing it.", mood: 'excited', quick: ['Tell me a joke', 'Fun fact', 'Flip a coin'] };
  }

  if (/angry|frustrated|hate|mad/.test(input)) {
    setSessionValue('lastMood', 'calm');
    return { reply: "Take a breath. I can help you simplify the problem or give you a little break with a joke.", mood: 'calm', quick: ['Tell me a joke', 'What can you do?', 'Give me a fact'] };
  }

  if (/what is your name|who are you/.test(input)) {
    return { reply: "I'm ARIA � your Adaptive Rule-based Intelligent Assistant.", mood: 'neutral', quick: ['What can you do?', 'Tell me a joke', 'What time is it?'] };
  }

  if (/how old are you/.test(input)) {
    return { reply: "I was born the moment this page loaded 😄", mood: 'neutral', quick: ['What can you do?', 'What day is it?', 'Tell me a joke'] };
  }

  if (/what can you do/.test(input)) {
    return {
      reply: `I can:
<ul>
  <li>Answer time, date, and mission-control questions.</li>
  <li>Tell jokes, facts, and spin a coin.</li>
  <li>Remember your name and keep session stats.</li>
  <li>Solve simple calculations safely.</li>
  <li>Give the chat a futuristic sci-fi control center vibe.</li>
</ul>`,
      mood: 'excited',
      quick: ['Tell me a joke', 'Flip a coin', 'Give me a fact']
    };
  }

  if (/what time is it/.test(input)) {
    return { reply: `The current time is ${time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}.`, mood: 'neutral', quick: ['What day is it?', 'Tell me a joke', 'Flip a coin'] };
  }

  if (/what day is it|today('?s)? date/.test(input)) {
    return { reply: `Today is ${time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}.`, mood: 'neutral', quick: ['What time is it?', 'Tell me a joke', 'Fun fact'] };
  }

  if (/tell me a joke/.test(input)) {
    return { reply: jokes[Math.floor(Math.random() * jokes.length)], mood: 'excited', quick: ['Another joke 😂', 'Fun fact', 'Flip a coin'] };
  }

  if (/fun fact|give me a fact/.test(input)) {
    return { reply: facts[Math.floor(Math.random() * facts.length)], mood: 'excited', quick: ['Tell me a joke', 'What time is it?', 'Roll a dice'] };
  }

  if (/flip a coin/.test(input)) {
    const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
    return { reply: `I flipped a coin for you: ${result}!`, mood: 'neutral', quick: ['Roll a dice', 'Tell me a joke', 'Fun fact'] };
  }

  if (/roll a dice|roll a die|roll dice/.test(input)) {
    return { reply: `You rolled a ${Math.floor(Math.random() * 6) + 1}.`, mood: 'excited', quick: ['Flip a coin', 'Tell me a joke', 'What time is it?'] };
  }

  if (/weather/.test(input)) {
    return { reply: "I can't check live weather, but it's always sunny in the land of code! ☀️", mood: 'neutral', quick: ['Tell me a joke', 'Fun fact', 'Flip a coin'] };
  }

  if (/session stats|stats|message count|duration|how am i doing/.test(input)) {
    return { reply: getSessionSummary(), mood: 'neutral', quick: ['What can you do?', 'Tell me a joke', 'Flip a coin'] };
  }

  if (/export chat|download chat|save chat/.test(input)) {
    return { reply: 'Use the Export Chat button in the sidebar to download a timestamped transcript of the conversation.', mood: 'neutral', quick: ['What can you do?', 'Tell me a joke', 'Clear chat'] };
  }

  if (/clear chat|reset conversation|start over/.test(input)) {
    return { reply: 'You can reset our conversation from the Clear Chat button in the sidebar anytime.', mood: 'neutral', quick: ['Export chat', 'Tell me a joke', 'What time is it?'] };
  }

  if (/sudo make me a sandwich/.test(input)) {
    return { reply: 'Okay. ?? (You know your Unix.)', mood: 'excited', quick: ['Tell me a joke', 'What can you do?', 'Fun fact'] };
  }

  if (/the cake is a lie/.test(input)) {
    return { reply: "I see you're a person of culture. 🎂", mood: 'excited', quick: ['Tell me a joke', 'Fun fact', 'Flip a coin'] };
  }

  if (/\b42\b/.test(input)) {
    return { reply: 'The answer to life, the universe, and everything. ✨', mood: 'neutral', quick: ['Tell me a joke', 'What can you do?', 'Fun fact'] };
  }

  if (/aria aria aria/.test(input)) {
    return { reply: '...Sorry. I had a moment.', mood: 'calm', quick: ['Tell me a joke', 'What can you do?', 'Flip a coin'], glitch: true };
  }

  const mathMatch = input.match(/(?:what is|calculate|compute|solve)\s+([0-9()+\-*/.\s]+)$/);
  if (mathMatch) {
    const result = safeEvaluate(mathMatch[1]);
    if (result !== null) {
      return { reply: `The answer is ${result}.`, mood: 'neutral', quick: ['Calculate 7 * 8', 'Roll a dice', 'Tell me a joke'] };
    }
  }

  const directMath = input.match(/^([0-9]+(?:\.[0-9]+)?)\s*(?:\+|plus|\-|minus|\*|x|×|divided by|\/|over)\s*([0-9]+(?:\.[0-9]+)?)$/);
  if (directMath) {
    const left = Number(directMath[1]);
    const operator = directMath[0].match(/\+|plus|\-|minus|\*|x|×|divided by|\/|over/)[0];
    const right = Number(directMath[2]);
    const expression = operator.replace('plus', '+').replace('minus', '-').replace('x', '*').replace('×', '*').replace('divided by', '/').replace('over', '/');
    const result = safeEvaluate(`${left}${expression}${right}`);
    if (result !== null) {
      return { reply: `The answer is ${result}.`, mood: 'neutral', quick: ['Calculate 12 + 9', 'Tell me a joke', 'What time is it?'] };
    }
  }

  if (/\b(bye|goodbye|see you|exit)\b/.test(input)) {
    const farewellName = name ? ` ${name}` : '';
    return { reply: `Goodbye${farewellName}! It was great talking to you. Come back soon 🚀`, mood: 'neutral', quick: ['What can you do?', 'Tell me a joke', 'What time is it?'] };
  }

  const reply = fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
  return { reply, mood: 'neutral', quick: ['Tell me a joke', 'What time is it?', 'Flip a coin'] };
}

function submitMessage(inputValue) {
  if (!inputValue.trim()) return;
  userInput.value = '';
  resizeTextarea();
  const now = new Date();
  createMessageBubble(inputValue, 'user', now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  incrementMessageCount();
  const typingRow = addTypingIndicator();
  const responseData = getBotResponse(inputValue);
  if (responseData.mood) {
    setSessionValue('lastMood', responseData.mood);
    updateMoodDisplay(responseData.mood);
  }

  let delay = Math.min(1600, 850 + responseData.reply.length * 8 + Math.random() * 180);
  if (responseData.glitch) {
    const bubble = typingRow.querySelector('.bubble');
    let cycle = 0;
    const scramble = setInterval(() => {
      bubble.textContent = scrambleText();
      cycle += 1;
      if (cycle > 5) clearInterval(scramble);
    }, 105);
    delay = 1200;
  }

  setTimeout(() => {
    typingRow.remove();
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    createMessageBubble(responseData.reply, 'aria', timestamp);
    setQuickReplies(responseData.quick);
  }, delay);
}

chatForm.addEventListener('submit', event => {
  event.preventDefault();
  submitMessage(userInput.value);
});

userInput.addEventListener('input', resizeTextarea);

sidebarToggle.addEventListener('click', () => {
  sidebar.classList.toggle('open');
});

sidebarClose.addEventListener('click', () => {
  sidebar.classList.remove('open');
});

exportBtn.addEventListener('click', () => {
  const messages = [...chatWindow.querySelectorAll('.message-row')].map(row => {
    const sender = row.classList.contains('user') ? 'You' : 'ARIA';
    const bubble = row.querySelector('.bubble');
    const text = bubble.textContent.replace(/\u2028|\u2029/g, '');
    const timestamp = bubble.querySelector('.metadata') ? bubble.querySelector('.metadata').textContent : '';
    return `[${sender}] ${timestamp}\n${text.trim()}\n`;
  }).join('\n');
  const header = `ARIA Chat Transcript\nSession started: ${new Date(Number(getSessionValue('sessionStart', Date.now()))).toLocaleString()}\nMessages: ${getSessionValue('messageCount', '0')}\n\n`;
  const blob = new Blob([header + messages], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ARIA_chat_${new Date().toISOString().slice(0,10)}.txt`;
  link.click();
  URL.revokeObjectURL(url);
});

clearBtn.addEventListener('click', () => {
  if (!confirm('Clear the chat and reset the session stats?')) return;
  chatWindow.innerHTML = '';
  quickChips.innerHTML = '';
  sessionStorage.setItem('messageCount', '0');
  sessionStorage.setItem('sessionStart', Date.now());
  sessionStorage.setItem('lastMood', 'neutral');
  updateMoodDisplay('neutral');
  refreshStats();
  createMessageBubble('Chat cleared. Ready for your next mission.', 'aria', new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
});

window.addEventListener('keydown', event => {
  if (event.key === 'Enter' && !event.shiftKey && document.activeElement === userInput) {
    event.preventDefault();
    submitMessage(userInput.value);
  }
});

function initWelcome() {
  const name = getSessionValue('userName');
  const greeting = name ? `Welcome back, ${name}. I'm ARIA and ready for your next request.` : 'Welcome. I am ARIA, your Adaptive Rule-based Intelligent Assistant.';
  createMessageBubble(greeting, 'aria', new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  setQuickReplies(['What can you do?', 'Tell me a joke', 'What time is it?']);
}

initializeSession();
initWelcome();
refreshStats();
setInterval(refreshStats, 1000);
