// In-memory store — works on Vercel serverless (no filesystem needed)
// Note: Data resets on server restart, which is expected on serverless platforms.

const sessions = new Map();   // sessionId -> { sessionId, userId, userName, sessionStart }
const messages = new Map();   // sessionId -> [ { role, content, timestamp } ]
const userSessions = new Map(); // userId -> [ sessionId ]

function getSession(sessionId, userId) {
  if (sessions.has(sessionId)) {
    return Promise.resolve(sessions.get(sessionId));
  }
  const sessionStart = Date.now();
  const session = { sessionId, userId: userId || 'anonymous', userName: null, sessionStart };
  sessions.set(sessionId, session);
  messages.set(sessionId, []);

  // Track sessions per user
  const uid = userId || 'anonymous';
  if (!userSessions.has(uid)) userSessions.set(uid, []);
  userSessions.get(uid).push(sessionId);

  return Promise.resolve(session);
}

function updateUserName(sessionId, userName) {
  if (sessions.has(sessionId)) {
    sessions.get(sessionId).userName = userName;
  }
  return Promise.resolve();
}

function saveMessage(sessionId, role, content) {
  if (!messages.has(sessionId)) messages.set(sessionId, []);
  messages.get(sessionId).push({ role, content, timestamp: Date.now() });
  return Promise.resolve();
}

function getHistory(sessionId) {
  return Promise.resolve(messages.get(sessionId) || []);
}

function clearSession(sessionId) {
  messages.set(sessionId, []);
  return Promise.resolve();
}

function getHistoryList(userId) {
  const uid = userId || 'anonymous';
  const sessionIds = userSessions.get(uid) || [];
  const list = sessionIds
    .filter(id => sessions.has(id))
    .map(id => sessions.get(id))
    .sort((a, b) => b.sessionStart - a.sessionStart);
  return Promise.resolve(list);
}

module.exports = { getSession, updateUserName, saveMessage, getHistory, clearSession, getHistoryList };
