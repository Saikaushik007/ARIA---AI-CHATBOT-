const express = require('express');
const router = express.Router();
const multer = require('multer');
const { GoogleGenAI } = require('@google/genai');
const sessionManager = require('../engine/sessionManager');
const fs = require('fs');

// Configure Multer for in-memory file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

    // 2. Format user content for saving to DB and for Gemini
    let dbContent = messageText;
    let geminiContents = [];
    
    if (messageText) {
      geminiContents.push(messageText);
    }

    if (file) {
      dbContent = `[Attached File: ${file.originalname}]\n${messageText}`;
      // Format file for Gemini GenAI SDK
      geminiContents.push({
        inlineData: {
          data: file.buffer.toString("base64"),
          mimeType: file.mimetype
        }
      });
    }

    // Save user message to history
    await sessionManager.saveMessage(sessionId, 'user', dbContent);

    // 3. Fetch past history to maintain context
    const history = await sessionManager.getHistory(sessionId);
    // Convert history to Gemini format. We only keep recent history to avoid token limits.
    const recentHistory = history.slice(-10); // Last 10 messages
    
    const formattedHistory = recentHistory.map(msg => {
      // Basic formatting, mapping our DB roles to Gemini roles
      const role = msg.role === 'user' ? 'user' : 'model';
      return {
        role: role,
        parts: [{ text: msg.content }]
      };
    });

    // 4. Call Gemini API
    let responseText = "";
    
    if (geminiContents.length > 0) {
        // Add the current message to the end of the history
        formattedHistory.push({
            role: 'user',
            parts: geminiContents.map(part => {
                if (typeof part === 'string') return { text: part };
                return part; // For inlineData
            })
        });

        const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: formattedHistory,
          config: {
              systemInstruction: SYSTEM_INSTRUCTION
          }
        });
        responseText = response.text;
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
    console.error("Gemini API Error:", error);
    let errorMsg = "Sorry, I encountered an error connecting to the AI servers.";
    if (error.status === 429) {
        errorMsg = "API Rate Limit Exceeded (429). The API key you provided has hit its quota limit. Please generate a new key or wait a moment.";
    } else if (error.status === 400) {
        errorMsg = "API Key Invalid (400). Please check that you copied the key correctly.";
    } else if (error.status === 503) {
        errorMsg = "Service Unavailable (503). The AI model is currently experiencing high demand. Please try again later.";
    }
    
    res.status(500).json({ error: errorMsg });
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
