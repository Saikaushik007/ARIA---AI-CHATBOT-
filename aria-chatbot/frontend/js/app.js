document.addEventListener('DOMContentLoaded', async () => {
  const { sendMessage: apiSend, getSession, clearSession } = window.ariaApi;
  const { addMessage, showTypingIndicator, removeTypingIndicator, showToast } = window.ariaUI;

  const msgInput = document.getElementById('msg-input');
  const sendBtn = document.getElementById('send-btn');
  const fileUpload = document.getElementById('file-upload');
  const filePreviewWrap = document.getElementById('file-preview-wrap');
  
  const btnClear = document.getElementById('btn-clear');
  const chatWindow = document.getElementById('chat-window');

  let currentFile = null;
  let voiceOutputEnabled = true;

  // Voice setup
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
  }

  const btnToggleVoice = document.getElementById('btn-toggle-voice');
  const micBtn = document.getElementById('mic-btn');
  const historyStatus = document.getElementById('history-status');
  const historyListContainer = document.getElementById('history-list');
  const btnNewChat = document.getElementById('btn-new-chat');
  const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
  const sidebar = document.getElementById('sidebar');

  // Sidebar Toggle Logic
  btnToggleSidebar.addEventListener('click', () => {
    sidebar.classList.toggle('hidden');
  });

  // Load Initial State
  await loadHistoryList();
  await loadSessionData();

  async function loadHistoryList() {
    const list = await window.ariaApi.getHistoryList();
    historyListContainer.innerHTML = '';
    
    if (list.length === 0) {
      historyListContainer.innerHTML = '<div style="color: #666; font-size: 12px; padding: 10px;">No past conversations.</div>';
      return;
    }

    list.forEach(item => {
      const date = new Date(item.sessionStart);
      const btn = document.createElement('button');
      btn.className = 'history-item';
      btn.textContent = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      btn.onclick = async () => {
        window.ariaApi.setActiveSession(item.sessionId);
        await loadSessionData();
      };
      
      historyListContainer.appendChild(btn);
    });
  }

  async function loadSessionData() {
    chatWindow.innerHTML = ''; // Clear chat
    try {
      historyStatus.innerHTML = '<span class="dot-green" style="background:#f59e0b; box-shadow:0 0 10px #f59e0b;"></span> Loading...';
      const session = await window.ariaApi.getSession();
      
      if (session && session.history && session.history.length > 0) {
        session.history.forEach(msg => {
          addMessage(msg.content, msg.role === 'user');
        });
        historyStatus.innerHTML = '<span class="dot-green"></span> History Restored';
      } else {
        addMessage("Greetings! I am ARIA, your advanced AI companion. I am fully equipped to analyze documents, process images, and engage in high-level problem solving. How may I assist you today?", false);
        historyStatus.innerHTML = '<span class="dot-green"></span> New Session';
      }
    } catch (e) {
      addMessage("Welcome to ARIA. Ready to assist.", false);
      historyStatus.innerHTML = '<span class="dot-green" style="background:#ef4444; box-shadow:0 0 10px #ef4444;"></span> Error';
    }
  }

  btnNewChat.addEventListener('click', async () => {
    window.ariaApi.setNewSession();
    await loadSessionData();
    await loadHistoryList();
  });

  // Voice Toggle Logic
  btnToggleVoice.addEventListener('click', () => {
    voiceOutputEnabled = !voiceOutputEnabled;
    btnToggleVoice.innerHTML = voiceOutputEnabled ? '🔊 Voice Output: ON' : '🔇 Voice Output: OFF';
    if (!voiceOutputEnabled) window.speechSynthesis.cancel();
  });

  // Speech Recognition Logic
  if (micBtn && recognition) {
    micBtn.addEventListener('click', () => {
      if (micBtn.classList.contains('recording')) {
        recognition.stop();
      } else {
        recognition.start();
        micBtn.classList.add('recording');
        msgInput.placeholder = "Listening...";
      }
    });

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      msgInput.value = transcript;
      handleSend();
    };

    recognition.onend = () => {
      micBtn.classList.remove('recording');
      msgInput.placeholder = "Message ARIA...";
    };

    recognition.onerror = (event) => {
      micBtn.classList.remove('recording');
      msgInput.placeholder = "Message ARIA...";
      console.error("Speech recognition error", event.error);
    };
  } else if (micBtn) {
    micBtn.style.display = 'none'; // Hide if unsupported
  }

  // 2. File Upload Handling
  fileUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    currentFile = file;
    filePreviewWrap.style.display = 'flex';
    filePreviewWrap.innerHTML = '';

    if (file.type.startsWith('image/')) {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.className = 'preview-thumb';
      filePreviewWrap.appendChild(img);
    }

    const name = document.createElement('span');
    name.className = 'preview-name';
    name.textContent = file.name;
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'preview-remove';
    removeBtn.textContent = '✕';
    removeBtn.onclick = clearFile;

    filePreviewWrap.appendChild(name);
    filePreviewWrap.appendChild(removeBtn);
  });

  function clearFile() {
    currentFile = null;
    fileUpload.value = '';
    filePreviewWrap.style.display = 'none';
    filePreviewWrap.innerHTML = '';
  }

  // 3. Bind input events
  sendBtn.addEventListener('click', handleSend);
  msgInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  msgInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 150) + 'px';
  });

  // Clear chat
  btnClear.addEventListener('click', async () => {
    await window.ariaApi.clearSession();
    chatWindow.innerHTML = '';
    addMessage("Session cleared. How can I help you next?", false);
    showToast('Chat history cleared!');
    loadHistoryList();
  });

  // Core send logic
  async function handleSend() {
    const text = msgInput.value.trim();
    if (!text && !currentFile) return;

    msgInput.value = '';
    msgInput.style.height = 'auto';
    
    let displayMsg = text;
    if (currentFile) {
        displayMsg = `[Attached: ${currentFile.name}]\n` + text;
    }
    
    addMessage(displayMsg, true);
    showTypingIndicator();
    
    const fileToSend = currentFile;
    clearFile();

    const response = await window.ariaApi.sendMessage(text, fileToSend);
    removeTypingIndicator();
    addMessage(response.reply, false);
    
    // Refresh history list so the new session pops up if it was newly created
    loadHistoryList();

    // Text to Speech
    if (voiceOutputEnabled) {
      // Strip markdown for speech
      const plainText = response.reply.replace(/[*_#`]/g, '');
      const utterance = new SpeechSynthesisUtterance(plainText);
      // Try to find a good female English voice if available
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(v => v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Google UK English Female'));
      if (femaleVoice) utterance.voice = femaleVoice;
      window.speechSynthesis.speak(utterance);
    }
  }

  // Expose global methods
  window.appController = {
    sendQuick: (text) => {
      msgInput.value = text;
      handleSend();
      if(window.innerWidth <= 700) sidebar.classList.remove('open');
    }
  };
});
