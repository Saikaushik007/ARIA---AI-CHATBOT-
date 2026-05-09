const chatWindow = document.getElementById('chat-window');
const typingStatus = document.getElementById('typing-status');
const toastEl = document.getElementById('toast');

// Basic markdown parser for bold, italic, code blocks, lists
function parseMarkdown(text) {
  let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  
  // Code blocks
  html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Newlines
  html = html.replace(/\n/g, '<br>');
  
  return html;
}

function addMessage(text, isUser) {
  const row = document.createElement('div');
  row.className = `msg-row ${isUser ? 'user' : 'aria'}`;

  const avatar = document.createElement('div');
  avatar.className = `avatar ${isUser ? 'user-av' : 'aria-av'}`;
  avatar.textContent = isUser ? 'U' : 'A';

  const wrap = document.createElement('div');
  wrap.className = 'bubble-wrap';

  const nameEl = document.createElement('div');
  nameEl.className = 'sender-name';
  nameEl.textContent = isUser ? 'You' : 'ARIA';

  const bubble = document.createElement('div');
  bubble.className = `bubble ${isUser ? 'user' : 'aria'}`;
  bubble.innerHTML = isUser ? text.replace(/\n/g, '<br>') : parseMarkdown(text);

  const timeEl = document.createElement('div');
  timeEl.className = 'bubble-time';
  timeEl.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  wrap.appendChild(nameEl);
  wrap.appendChild(bubble);
  wrap.appendChild(timeEl);

  row.appendChild(avatar);
  row.appendChild(wrap);

  chatWindow.appendChild(row);
  scrollToBottom();
}

function showTypingIndicator() {
  if (document.getElementById('typing-row')) return;

  const row = document.createElement('div');
  row.className = 'msg-row aria';
  row.id = 'typing-row';

  const avatar = document.createElement('div');
  avatar.className = 'avatar aria-av';
  avatar.textContent = 'A';

  const wrap = document.createElement('div');
  wrap.className = 'bubble-wrap';

  const bubble = document.createElement('div');
  bubble.className = 'bubble aria typing-bubble';
  
  for(let i=0; i<3; i++) {
    const dot = document.createElement('div');
    dot.className = 'dot';
    bubble.appendChild(dot);
  }

  wrap.appendChild(bubble);
  row.appendChild(avatar);
  row.appendChild(wrap);

  chatWindow.appendChild(row);
  scrollToBottom();
  
  typingStatus.classList.add('visible');
}

function removeTypingIndicator() {
  const row = document.getElementById('typing-row');
  if (row) row.remove();
  typingStatus.classList.remove('visible');
}

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  setTimeout(() => {
    toastEl.classList.remove('show');
  }, 2500);
}

function scrollToBottom() {
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

window.ariaUI = { addMessage, showTypingIndicator, removeTypingIndicator, showToast };
