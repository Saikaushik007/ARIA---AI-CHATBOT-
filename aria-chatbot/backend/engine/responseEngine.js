const rules = require('./rules');
const db = require('./database');

function getResponse(message, session) {
  const normalizedMessage = message.trim().toLowerCase();
  
  // Test rules in order
  for (const rule of rules) {
    if (rule.test(normalizedMessage)) {
      const result = rule.respond(normalizedMessage, session, db);
      return {
        reply: result.html,
        mood: result.mood,
        chips: db.CHIP_SETS[result.chips[0]] || db.CHIP_SETS['default'],
        sessionUpdate: result.sessionUpdate
      };
    }
  }

  // Fallback
  const fallbackResponse = db.FALLBACKS[session.fallbackIndex % db.FALLBACKS.length];
  const nextFallbackIndex = session.fallbackIndex + 1;
  
  return {
    reply: fallbackResponse,
    mood: 'neutral',
    chips: db.CHIP_SETS['default'],
    sessionUpdate: { fallbackIndex: nextFallbackIndex }
  };
}

module.exports = { getResponse };
