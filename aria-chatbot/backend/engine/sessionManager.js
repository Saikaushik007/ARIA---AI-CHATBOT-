const db = require('./database');

function getSession(sessionId, userId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM sessions WHERE sessionId = ?', [sessionId], (err, row) => {
      if (err) reject(err);
      if (row) {
        resolve(row);
      } else {
        const sessionStart = Date.now();
        db.run('INSERT INTO sessions (sessionId, userId, userName, sessionStart) VALUES (?, ?, ?, ?)', 
          [sessionId, userId || 'anonymous', null, sessionStart], 
          (err) => {
            if (err) reject(err);
            resolve({ sessionId, userId, userName: null, sessionStart });
          }
        );
      }
    });
  });
}

function updateUserName(sessionId, userName) {
  return new Promise((resolve, reject) => {
    db.run('UPDATE sessions SET userName = ? WHERE sessionId = ?', [userName, sessionId], (err) => {
      if (err) reject(err);
      resolve();
    });
  });
}

function saveMessage(sessionId, role, content) {
  return new Promise((resolve, reject) => {
    const timestamp = Date.now();
    db.run('INSERT INTO messages (sessionId, role, content, timestamp) VALUES (?, ?, ?, ?)',
      [sessionId, role, content, timestamp],
      (err) => {
        if (err) reject(err);
        resolve();
      }
    );
  });
}

function getHistory(sessionId) {
  return new Promise((resolve, reject) => {
    db.all('SELECT role, content, timestamp FROM messages WHERE sessionId = ? ORDER BY timestamp ASC', 
      [sessionId], 
      (err, rows) => {
        if (err) reject(err);
        resolve(rows || []);
      }
    );
  });
}

function clearSession(sessionId) {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM messages WHERE sessionId = ?', [sessionId], (err) => {
      if (err) reject(err);
      resolve();
    });
  });
}

function getHistoryList(userId) {
  return new Promise((resolve, reject) => {
    db.all('SELECT sessionId, sessionStart FROM sessions WHERE userId = ? ORDER BY sessionStart DESC', 
      [userId], 
      (err, rows) => {
        if (err) reject(err);
        resolve(rows || []);
      }
    );
  });
}

module.exports = { getSession, updateUserName, saveMessage, getHistory, clearSession, getHistoryList };
