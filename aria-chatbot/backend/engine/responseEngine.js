const rules = require('./rules');

const mockDb = {
  JOKES: [
    { setup: "Why do programmers prefer dark mode?", punch: "Because light attracts bugs!" },
    { setup: "How many programmers does it take to change a light bulb?", punch: "None, that's a hardware problem." },
    { setup: "Why did the developer go broke?", punch: "Because they used up all their cache!" }
  ],
  FACTS: [
    "The first computer bug was an actual real-life moth discovered in 1947.",
    "The word 'robot' comes from the Czech word 'robota', meaning 'forced labor'.",
    "There are more possible iterations of a game of chess than there are atoms in the known universe."
  ],
  QUOTES: [
    "The only way to do great work is to love what you do. - Steve Jobs",
    "Believe you can and you're halfway there. - Theodore Roosevelt",
    "It does not matter how slowly you go as long as you do not stop. - Confucius"
  ],
  CHIP_SETS: {
    default: ['Help', 'What can you do?', 'Joke'],
    greeting: ['Who are you?', 'Help'],
    joke: ['Another joke', 'Fact'],
    fact: ['Another fact', 'Joke'],
    time: ['What date is it?', 'Help'],
    coin: ['Flip again', 'Roll dice'],
    dice: ['Roll again', 'Flip coin'],
    math: ['Calculate 100 / 4', 'Help'],
    sad: ['Joke', 'Tell me a fact'],
    capabilities: ['Joke', 'Math', 'Coin Toss']
  },
  FALLBACKS: [
    "I'm operating in local offline mode! I didn't quite catch that. Could you rephrase?",
    "My AI capabilities are paused. I'm relying on local rules. Please try asking something else.",
    "I'm running locally right now! Try asking me for a 'joke', 'fact', or 'what can you do?'."
  ]
};

function getResponse(message, session) {
  const normalizedMessage = message.trim().toLowerCase();
  
  // Test rules in order
  for (const rule of rules) {
    if (rule.test(normalizedMessage)) {
      const result = rule.respond(normalizedMessage, session, mockDb);
      return {
        reply: result.html,
        mood: result.mood,
        chips: mockDb.CHIP_SETS[result.chips ? result.chips[0] : 'default'] || mockDb.CHIP_SETS['default'],
        sessionUpdate: result.sessionUpdate || {}
      };
    }
  }

  // Fallback
  const fallbackIndex = session.fallbackIndex || 0;
  const fallbackResponse = mockDb.FALLBACKS[fallbackIndex % mockDb.FALLBACKS.length];
  
  return {
    reply: fallbackResponse,
    mood: 'neutral',
    chips: mockDb.CHIP_SETS['default'],
    sessionUpdate: { fallbackIndex: fallbackIndex + 1 }
  };
}

module.exports = { getResponse };
