const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../aria.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    
    // Initialize sessions table
    db.run(`CREATE TABLE IF NOT EXISTS sessions (
      sessionId TEXT PRIMARY KEY,
      userId TEXT,
      userName TEXT,
      sessionStart INTEGER
    )`, (err) => {
      // Try to add userId if table already existed without it
      if (!err) {
        db.run(`ALTER TABLE sessions ADD COLUMN userId TEXT`, () => {});
      }
    });

    // Initialize messages table (history)
    db.run(`CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sessionId TEXT,
      role TEXT,
      content TEXT,
      timestamp INTEGER,
      FOREIGN KEY(sessionId) REFERENCES sessions(sessionId)
    )`);
  }
});

module.exports = db;
