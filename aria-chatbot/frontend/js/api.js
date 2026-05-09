const API_BASE = 'http://localhost:3000/api';

async function sendMessage(message, file) {
  try {
    const formData = new FormData();
    if (message) formData.append('message', message);
    if (file) formData.append('file', file);

    const headers = {
      'x-user-id': getUserId(),
      'x-session-id': getCurrentSessionId()
    };

    const response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: headers,
      body: formData
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return {
        reply: data.error || `API error: ${response.status}`,
        mood: "neutral"
      };
    }
    
    return data;
  } catch (error) {
    console.error("Chat API error:", error);
    return {
      reply: "Sorry, I am having trouble connecting to my local server right now.",
      mood: "neutral"
    };
  }
}

async function getSession(sessionId) {
  try {
    const headers = {
      'x-user-id': getUserId(),
      'x-session-id': sessionId || getCurrentSessionId()
    };
    const response = await fetch(`${API_BASE}/session`, { headers });
    if (!response.ok) throw new Error('API error');
    return await response.json();
  } catch (error) {
    console.error("Session API error:", error);
    return null;
  }
}

async function getHistoryList() {
  try {
    const response = await fetch(`${API_BASE}/history/list`, {
      headers: { 'x-user-id': getUserId() }
    });
    if (!response.ok) throw new Error('API error');
    return await response.json();
  } catch (error) {
    return [];
  }
}

async function clearSession() {
  try {
    const response = await fetch(`${API_BASE}/session`, {
      method: 'DELETE',
      headers: { 'x-session-id': getCurrentSessionId() }
    });
    if (!response.ok) throw new Error('API error');
    return await response.json();
  } catch (error) {
    console.error("Clear Session API error:", error);
    return { success: false };
  }
}

// Helpers for localStorage
function getUserId() {
  let id = localStorage.getItem('aria_user_id');
  if (!id) {
    id = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('aria_user_id', id);
  }
  return id;
}

function getCurrentSessionId() {
  let id = localStorage.getItem('aria_current_session');
  if (!id) {
    id = 'sess_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('aria_current_session', id);
  }
  return id;
}

function setNewSession() {
  const id = 'sess_' + Math.random().toString(36).substr(2, 9);
  localStorage.setItem('aria_current_session', id);
  return id;
}

function setActiveSession(id) {
  localStorage.setItem('aria_current_session', id);
}

window.ariaApi = { sendMessage, getSession, getHistoryList, clearSession, setNewSession, setActiveSession };
