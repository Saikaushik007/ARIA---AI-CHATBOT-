const SESSION = {
  msgCount: 0,
  startTime: Date.now(),
  userName: null,
  mood: 'neutral'
};

const MOODS = {
  neutral: { emoji: '🤖', label: 'Neutral' },
  happy: { emoji: '🌟', label: 'Happy' },
  caring: { emoji: '💙', label: 'Caring' },
  excited: { emoji: '🚀', label: 'Excited' },
  calm: { emoji: '🌊', label: 'Calm' },
  playful: { emoji: '🎉', label: 'Playful' },
  thoughtful: { emoji: '🤔', label: 'Thoughtful' }
};

function updateStats() {
  document.getElementById('stat-msgs').textContent = SESSION.msgCount;
  
  const elapsed = Math.floor((Date.now() - SESSION.startTime) / 1000);
  const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const s = String(elapsed % 60).padStart(2, '0');
  document.getElementById('stat-time').textContent = `${m}:${s}`;
  
  const currentMood = MOODS[SESSION.mood] || MOODS['neutral'];
  document.getElementById('stat-mood').textContent = currentMood.label;
  
  const badge = document.getElementById('mood-badge');
  if (badge.textContent !== currentMood.emoji) {
    badge.textContent = currentMood.emoji;
    badge.title = currentMood.label;
  }
}

function startTimer() {
  setInterval(updateStats, 1000);
}

function setMood(moodKey) {
  if (MOODS[moodKey]) {
    SESSION.mood = moodKey;
    updateStats();
  }
}

function updateUserName(name) {
  if (name !== SESSION.userName) {
    SESSION.userName = name;
    // Update all existing user avatars
    const initial = name ? name.charAt(0).toUpperCase() : 'U';
    document.querySelectorAll('.avatar.user-av').forEach(el => {
      el.textContent = initial;
    });
  }
}

function incrementMessages() {
  SESSION.msgCount++;
  updateStats();
}

window.ariaSession = {
  SESSION,
  startTimer,
  setMood,
  updateUserName,
  incrementMessages
};
