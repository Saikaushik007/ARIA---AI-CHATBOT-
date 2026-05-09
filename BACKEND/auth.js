const fs = require('fs');
const path = require('path');

const usersFile = path.join(__dirname, 'users.json');
const chatsDir = path.join(__dirname, 'chats');

if (!fs.existsSync(chatsDir)) {
  fs.mkdirSync(chatsDir, { recursive: true });
}

function loadUsers() {
  try {
    if (fs.existsSync(usersFile)) {
      return JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    }
  } catch (e) {
    console.error('Error loading users:', e);
  }
  return {};
}

function saveUsers(users) {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), 'utf8');
}

function loadChatHistory(userId) {
  try {
    const chatFile = path.join(chatsDir, `${userId}.json`);
    if (fs.existsSync(chatFile)) {
      return JSON.parse(fs.readFileSync(chatFile, 'utf8'));
    }
  } catch (e) {
    console.error('Error loading chat history:', e);
  }
  return [];
}

function saveChatHistory(userId, messages) {
  const chatFile = path.join(chatsDir, `${userId}.json`);
  fs.writeFileSync(chatFile, JSON.stringify(messages, null, 2), 'utf8');
}

function registerUser(username, password) {
  const users = loadUsers();
  if (users[username]) {
    return { success: false, error: 'User already exists' };
  }
  users[username] = { password, createdAt: new Date().toISOString() };
  saveUsers(users);
  return { success: true, message: 'User registered successfully' };
}

function loginUser(username, password) {
  const users = loadUsers();
  if (!users[username] || users[username].password !== password) {
    return { success: false, error: 'Invalid credentials' };
  }
  return { success: true, userId: username };
}

function addMessage(userId, message) {
  const history = loadChatHistory(userId);
  history.push({
    ...message,
    timestamp: new Date().toISOString()
  });
  saveChatHistory(userId, history);
  return history;
}

module.exports = {
  registerUser,
  loginUser,
  loadChatHistory,
  addMessage
};
