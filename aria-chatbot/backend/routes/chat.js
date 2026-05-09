const express = require('express');
const router = express.Router();
const multer = require('multer');
const Groq = require('groq-sdk');
const sessionManager = require('../engine/sessionManager');
const fs = require('fs');

// Configure Multer for in-memory file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Initialize Groq Client
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_INSTRUCTION = `You are ARIA (Adaptive Rule-based Intelligent Assistant). You are a highly capable, professional, and intelligent assistant. Provide accurate, exact, and detailed responses. Do not act childish or overly casual. You are integrated into a premium, modern chat interface. Provide clean, readable text. Use markdown for formatting lists, code, and emphasis. If the user asks about an image, analyze it thoroughly.`;

// POST /api/chat
router.post('/chat', upload.single('file'), async (req, res) => {
  const userId = req.headers['x-user-id'] || 'anonymous';
  const sessionId = req.headers['x-session-id'] || req.sessionID;
  const messageText = req.body.message || "";
  const file = req.file;

  if (!messageText && !file) {
    return res.status(400).json({ error: "Message or file is required" });
  }

  try {
    // 1. Ensure session exists
    await sessionManager.getSession(sessionId, userId);

    // 2. Format user content for saving to DB
    let dbContent = messageText;
    let groqContent = [];
    
    if (messageText) {
      groqContent.push({ type: "text", text: messageText });
    }

    if (file) {
      dbContent = `[Attached File: ${file.originalname}]\n${messageText}`;
      // Format file for Groq Vision
      groqContent.push({
        type: "image_url",
        image_url: {
          url: `data:${file.mimetype};base64,${file.buffer.toString("base64")}`
        }
      });
    }

    // Save user message to history
    await sessionManager.saveMessage(sessionId, 'user', dbContent);

    // 3. Fetch past history to maintain context
    const history = await sessionManager.getHistory(sessionId);
    // Convert history to Groq format. We only keep recent history to avoid token limits.
    const recentHistory = history.slice(-10); // Last 10 messages
    
    const formattedHistory = recentHistory.map(msg => {
      // Basic formatting, mapping our DB roles to Groq roles
      const role = msg.role === 'user' ? 'user' : 'assistant';
      return {
        role: role,
        content: msg.content
      };
    });

    // 4. Call Groq API
    let responseText = "";
    
    if (groqContent.length > 0) {
        // Add the current message to the end of the history
        formattedHistory.push({
            role: 'user',
            content: file ? groqContent : messageText // Groq requires simple string if no image is present for standard models
        });

        // Use Vision model if there is a file, otherwise use the fast Llama 3 model
        const modelName = file ? 'llama-3.2-11b-vision-preview' : 'llama3-8b-8192';

        const response = await groq.chat.completions.create({
          messages: [
            { role: 'system', content: SYSTEM_INSTRUCTION },
            ...formattedHistory
          ],
          model: modelName,
        });
        
        responseText = response.choices[0]?.message?.content || "";
    }

    // Save AI response to history
    await sessionManager.saveMessage(sessionId, 'aria', responseText);

    // Return to client
    res.json({
      reply: responseText,
      mood: 'thoughtful',
      chips: [] // Chips removed for LLM mode
    });

  } catch (error) {
    console.error("Groq API Error:", error);
    
    // If we hit a quota limit or error, automatically fall back to the local response engine!
    const responseEngine = require('../engine/responseEngine');
    const localFallback = responseEngine.getResponse(messageText || "Attached a file", { fallbackIndex: 0 });
    
    const offlineReply = localFallback.reply + "\n\n*(Note: ARIA is currently in Offline Mode because the API returned an error. I am using my local rule-based engine to respond!)*";
    
    await sessionManager.saveMessage(sessionId, 'aria', offlineReply);
    
    return res.json({
      reply: offlineReply,
      mood: localFallback.mood,
      chips: localFallback.chips || []
    });
  }
});

// GET /api/session
router.get('/session', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 'anonymous';
    const sessionId = req.headers['x-session-id'] || req.sessionID;
    
    const session = await sessionManager.getSession(sessionId, userId);
    const history = await sessionManager.getHistory(sessionId);
    
    res.json({
      sessionId: sessionId,
      sessionStart: session.sessionStart,
      history: history.map(h => ({
        role: h.role,
        content: h.content,
        time: new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }))
    });
  } catch(e) {
    res.status(500).json({ error: "Error fetching session" });
  }
});

// GET /api/history/list
router.get('/history/list', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 'anonymous';
    const list = await sessionManager.getHistoryList(userId);
    res.json(list);
  } catch(e) {
    res.status(500).json({ error: "Error fetching history list" });
  }
});

// DELETE /api/session
router.delete('/session', async (req, res) => {
  const sessionId = req.headers['x-session-id'] || req.sessionID;
  await sessionManager.clearSession(sessionId);
  res.json({ success: true });
});

module.exports = router;
