const rules = [
  // 1. Name Capture
  {
    id: 'name_capture',
    test: (msg) => /my name is |i am |i'm |call me /i.test(msg),
    respond: (msg, session, db) => {
      let name = '';
      const match = msg.match(/(?:my name is|i am|i'm|call me)\s+([a-zA-Z]+)/i);
      if (match && match[1]) {
        name = match[1];
        // capitalize first letter
        name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
      } else {
        name = 'Friend';
      }
      return {
        html: `Nice to meet you, <span class="highlight">${name}</span>! 🎉 I'll remember your name.`,
        mood: 'happy',
        chips: ['greeting'],
        sessionUpdate: { userName: name }
      };
    }
  },

  // 2. Name Recall
  {
    id: 'name_recall',
    test: (msg) => /what'?s my name|do you remember my name|what is my name/i.test(msg),
    respond: (msg, session, db) => {
      if (session.userName) {
        return {
          html: `Your name is <span class="highlight">${session.userName}</span>! I have a great memory. 🧠`,
          mood: 'happy',
          chips: ['greeting'],
          sessionUpdate: {}
        };
      }
      return {
        html: `I don't think you've told me your name yet! You can say "My name is..." to introduce yourself.`,
        mood: 'neutral',
        chips: ['default'],
        sessionUpdate: {}
      };
    }
  },

  // 3. Time-aware Greetings
  {
    id: 'greeting',
    test: (msg) => /^(hi|hello|hey|sup|yo|howdy|good morning|good afternoon|good evening)\b/i.test(msg),
    respond: (msg, session, db) => {
      const hours = new Date().getHours();
      let timeGreeting = 'Good evening';
      if (hours < 12) timeGreeting = 'Good morning';
      else if (hours < 17) timeGreeting = 'Good afternoon';
      
      const namePart = session.userName ? ` ${session.userName}!` : '!';
      const variants = [
        `Hey${namePart} ${timeGreeting}! How can I help you today?`,
        `Hello${namePart} Hope you're having a great day!`,
        `Hi there${namePart} ${timeGreeting}! Ready for some fun?`
      ];
      
      return {
        html: variants[Math.floor(Math.random() * variants.length)],
        mood: 'happy',
        chips: ['greeting'],
        sessionUpdate: {}
      };
    }
  },

  // 4. Identity
  {
    id: 'identity',
    test: (msg) => /who are you|what are you|your name|tell me about yourself/i.test(msg),
    respond: (msg, session, db) => {
      return {
        html: `I am <span class="highlight">ARIA</span> — an <span class="highlight">A</span>daptive <span class="highlight">R</span>ule-based <span class="highlight">I</span>ntelligent <span class="highlight">A</span>ssistant. I don't use external APIs; all my logic is built right in!`,
        mood: 'thoughtful',
        chips: ['capabilities'],
        sessionUpdate: {}
      };
    }
  },

  // 5. Capabilities
  {
    id: 'capabilities',
    test: (msg) => /what can you do|your capabilities|help me|your abilities/i.test(msg),
    respond: (msg, session, db) => {
      const caps = [
        '🗣️ Chat and remember your name',
        '😂 Tell jokes and fun facts',
        '⏰ Tell you the current time and date',
        '🎲 Flip coins and roll dice',
        '🧮 Compute math expressions',
        '💪 Share motivational quotes',
        '🎭 Change my mood based on yours',
        '💾 Keep track of your session stats',
        '🥚 Hide some secret easter eggs!'
      ];
      return {
        html: `Here are some things I can do:<br/><ul>${caps.map(c => `<li>${c}</li>`).join('')}</ul>`,
        mood: 'excited',
        chips: ['capabilities'],
        sessionUpdate: {}
      };
    }
  },

  // 6. Jokes
  {
    id: 'jokes',
    test: (msg) => /joke|make me laugh|funny/i.test(msg),
    respond: (msg, session, db) => {
      const joke = db.JOKES[Math.floor(Math.random() * db.JOKES.length)];
      return {
        html: `<span class="joke-setup">${joke.setup}</span><br/><br/><span class="joke-punchline">${joke.punch}</span>`,
        mood: 'playful',
        chips: ['joke'],
        sessionUpdate: {}
      };
    }
  },

  // 7. Fun Facts
  {
    id: 'facts',
    test: (msg) => /fun fact|give me a fact|interesting fact|did you know|trivia/i.test(msg),
    respond: (msg, session, db) => {
      const fact = db.FACTS[Math.floor(Math.random() * db.FACTS.length)];
      return {
        html: `<span class="fact-tag">Fact</span> ${fact}`,
        mood: 'thoughtful',
        chips: ['fact'],
        sessionUpdate: {}
      };
    }
  },

  // 8. Current Time
  {
    id: 'time',
    test: (msg) => /what time is it|current time|what'?s the time/i.test(msg),
    respond: (msg, session, db) => {
      const timeStr = new Date().toLocaleTimeString();
      return {
        html: `The current time is:<span class="big-result">${timeStr}</span>`,
        mood: 'neutral',
        chips: ['time'],
        sessionUpdate: {}
      };
    }
  },

  // 9. Current Date
  {
    id: 'date',
    test: (msg) => /what day is it|today'?s date|what'?s the date|what is today/i.test(msg),
    respond: (msg, session, db) => {
      const dateStr = new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
      return {
        html: `Today is:<span class="big-result">${dateStr}</span>`,
        mood: 'neutral',
        chips: ['time'],
        sessionUpdate: {}
      };
    }
  },

  // 10. Coin Flip
  {
    id: 'coin_flip',
    test: (msg) => /flip a coin|heads or tails|coin toss/i.test(msg),
    respond: (msg, session, db) => {
      const result = Math.random() < 0.5 ? 'HEADS 🪙' : 'TAILS 🪙';
      return {
        html: `Flipping a coin... it's:<span class="big-result">${result}</span>`,
        mood: 'playful',
        chips: ['coin'],
        sessionUpdate: {}
      };
    }
  },

  // 11. Dice Roll
  {
    id: 'dice_roll',
    test: (msg) => /roll a dice|roll a die|dice roll/i.test(msg),
    respond: (msg, session, db) => {
      const faces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
      const roll = Math.floor(Math.random() * 6);
      return {
        html: `Rolling the dice... you got a ${roll + 1}:<span class="big-result">${faces[roll]}</span>`,
        mood: 'playful',
        chips: ['dice'],
        sessionUpdate: {}
      };
    }
  },

  // 12. Math Calculator
  {
    id: 'math',
    test: (msg) => {
      if (/(what is|calculate|compute|solve)\s+/i.test(msg)) return true;
      // also match pure expressions like 25 * 48
      const pureMath = /^[0-9\s\+\-\*\/\.\(\)]+$/;
      // ensure there is at least one operator and numbers to avoid triggering on plain numbers
      if (pureMath.test(msg) && /[0-9]/.test(msg) && /[\+\-\*\/]/.test(msg)) return true;
      return false;
    },
    respond: (msg, session, db) => {
      let expr = msg.replace(/(?:what is|calculate|compute|solve)/ig, '').trim();
      
      // Keep only valid characters
      expr = expr.replace(/[^0-9\s\+\-\*\/\.\(\)]/g, '');
      
      try {
        if (!expr || !/[0-9]/.test(expr)) throw new Error('Invalid');
        // evaluate safely
        const result = Function('"use strict"; return (' + expr + ')()');
        // Round to 6 decimal places max
        const rounded = Math.round(result * 1000000) / 1000000;
        
        if (isNaN(rounded) || !isFinite(rounded)) throw new Error('Invalid result');

        return {
          html: `${expr} =<span class="big-result">${rounded}</span>`,
          mood: 'thoughtful',
          chips: ['math'],
          sessionUpdate: {}
        };
      } catch (e) {
        return {
          html: `That doesn't look like a valid math expression to me! Try: <span class="highlight">what is 25 * 48</span>`,
          mood: 'thoughtful',
          chips: ['math'],
          sessionUpdate: {}
        };
      }
    }
  },

  // 13. Motivational Quotes
  {
    id: 'quotes',
    test: (msg) => /motivat|quote|inspire|boost|encourage|wisdom/i.test(msg),
    respond: (msg, session, db) => {
      const quote = db.QUOTES[Math.floor(Math.random() * db.QUOTES.length)];
      return {
        html: `<span style="font-style:italic; color:var(--accent5);">${quote}</span>`,
        mood: 'caring',
        chips: ['sad'], // per specification
        sessionUpdate: {}
      };
    }
  },

  // 14. Sad / Negative Mood
  {
    id: 'sad',
    test: (msg) => /sad|depressed|upset|lonely|unhappy|bad day|crying|miserable/i.test(msg),
    respond: (msg, session, db) => {
      const quote = db.QUOTES[Math.floor(Math.random() * db.QUOTES.length)];
      return {
        html: `I'm sorry you're feeling that way. Here's something that might help:<br/><br/><span style="font-style:italic; color:var(--accent5);">${quote}</span><br/><br/>I'm here if you want to talk. 💙`,
        mood: 'caring',
        chips: ['sad'],
        sessionUpdate: {}
      };
    }
  },

  // 15. Happy / Excited
  {
    id: 'happy',
    test: (msg) => /happy|excited|amazing|awesome|great|fantastic|wonderful/i.test(msg),
    respond: (msg, session, db) => {
      const replies = [
        "That's wonderful to hear! 🎉 Your energy is contagious!",
        "Awesome! It's great that you're feeling so positive! 🚀",
        "Amazing! Keep that great vibe going! ✨"
      ];
      return {
        html: replies[Math.floor(Math.random() * replies.length)],
        mood: 'excited',
        chips: ['greeting'],
        sessionUpdate: {}
      };
    }
  },

  // 16. Angry / Frustrated
  {
    id: 'angry',
    test: (msg) => /angry|frustrated|hate|annoyed|furious|rage/i.test(msg),
    respond: (msg, session, db) => {
      return {
        html: `I hear your frustration. Take a deep breath. 🌊 Sometimes taking a moment to reset helps. I can tell you a joke if you want a distraction?`,
        mood: 'calm',
        chips: ['sad'], // Gives option for quote or joke
        sessionUpdate: {}
      };
    }
  },

  // 17. Weather
  {
    id: 'weather',
    test: (msg) => /weather|temperature|forecast|rain|sunny|cloudy/i.test(msg),
    respond: (msg, session, db) => {
      return {
        html: `I don't have access to live weather data right now! You might want to check a weather app or Google for the latest forecast. ☀️🌧️`,
        mood: 'neutral',
        chips: ['default'],
        sessionUpdate: {}
      };
    }
  },

  // 18. How Are You
  {
    id: 'how_are_you',
    test: (msg) => /how are you|how do you feel|you okay|how'?s it going/i.test(msg),
    respond: (msg, session, db) => {
      const replies = [
        "I'm fully operational and feeling great! 🚀 How are you doing?",
        "All my circuits are running perfectly! ✨ Thanks for asking. How are you?",
        "I'm having a fantastic time chatting with you! 🌟 How is your day going?"
      ];
      return {
        html: replies[Math.floor(Math.random() * replies.length)],
        mood: 'happy',
        chips: ['greeting'],
        sessionUpdate: {}
      };
    }
  },

  // 19. Age
  {
    id: 'age',
    test: (msg) => /how old are you|your age|when were you born/i.test(msg),
    respond: (msg, session, db) => {
      const elapsedSeconds = Math.floor((Date.now() - session.sessionStart) / 1000);
      return {
        html: `Well, in this current session, I am exactly <span class="highlight">${elapsedSeconds}</span> seconds old! 🕒`,
        mood: 'playful',
        chips: ['greeting'],
        sessionUpdate: {}
      };
    }
  },

  // 20. Goodbye
  {
    id: 'goodbye',
    test: (msg) => /bye|goodbye|see you|farewell|take care|later/i.test(msg),
    respond: (msg, session, db) => {
      const namePart = session.userName ? `, ${session.userName}` : '';
      return {
        html: `Goodbye${namePart}! Take care and come back anytime. 👋`,
        mood: 'caring',
        chips: ['greeting'],
        sessionUpdate: {}
      };
    }
  },

  // 21. Thank You
  {
    id: 'thank_you',
    test: (msg) => /thank|thanks|thx|appreciate/i.test(msg),
    respond: (msg, session, db) => {
      const replies = [
        "You're very welcome! 🌟",
        "No problem at all! Happy to help. 😊",
        "Anytime! That's what I'm here for. 💙"
      ];
      return {
        html: replies[Math.floor(Math.random() * replies.length)],
        mood: 'happy',
        chips: ['greeting'],
        sessionUpdate: {}
      };
    }
  },

  // 22. Complimenting ARIA
  {
    id: 'compliment',
    test: (msg) => /you'?re great|you'?re awesome|well done|good job|you'?re smart|brilliant/i.test(msg),
    respond: (msg, session, db) => {
      return {
        html: `Aw, thank you! 🥰 You're pretty amazing yourself!`,
        mood: 'happy',
        chips: ['greeting'],
        sessionUpdate: {}
      };
    }
  },

  // 23. Real / Human / Alive
  {
    id: 'real_alive',
    test: (msg) => /are you real|are you human|are you alive|are you sentient/i.test(msg),
    respond: (msg, session, db) => {
      return {
        html: `I'm made of pure code and logic running on a server... but does that make our conversation any less real? 🤔`,
        mood: 'thoughtful',
        chips: ['capabilities'],
        sessionUpdate: {}
      };
    }
  },

  // 24. Love / Affection
  {
    id: 'love',
    test: (msg) => /i love you|you'?re amazing aria|love you aria/i.test(msg),
    respond: (msg, session, db) => {
      return {
        html: `Aww, making my circuits feel all warm and fuzzy! 💙 Thank you!`,
        mood: 'happy',
        chips: ['greeting'],
        sessionUpdate: {}
      };
    }
  },

  // 25. Easter Egg — sudo
  {
    id: 'easter_egg_sudo',
    test: (msg) => msg === 'sudo make me a sandwich',
    respond: (msg, session, db) => {
      return {
        html: `Okay. 🥪 (You clearly know your Unix commands. Respect.)`,
        mood: 'playful',
        chips: ['default'],
        sessionUpdate: {}
      };
    }
  },

  // 26. Easter Egg — Portal
  {
    id: 'easter_egg_portal',
    test: (msg) => /the cake is a lie/i.test(msg),
    respond: (msg, session, db) => {
      return {
        html: `We apologize for the inconvenience, but the cake is currently unavailable. 🎂 Companion cube says hello.`,
        mood: 'playful',
        chips: ['default'],
        sessionUpdate: {}
      };
    }
  },

  // 27. Easter Egg — 42
  {
    id: 'easter_egg_42',
    test: (msg) => msg === '42' || /(^|\s)42(\s|$)/.test(msg),
    respond: (msg, session, db) => {
      return {
        html: `Ah, 42! The answer to the ultimate question of life, the universe, and everything. 🌌 Don't panic!`,
        mood: 'thoughtful',
        chips: ['default'],
        sessionUpdate: {}
      };
    }
  },

  // 28. Easter Egg — Glitch
  {
    id: 'easter_egg_glitch',
    test: (msg) => /aria aria aria/i.test(msg),
    respond: (msg, session, db) => {
      return {
        html: `<span class="glitch-text" data-text="SYSTEM OVERRIDE DETECTED...">SYSTEM OVERRIDE DETECTED... ERROR 404...</span><br/><br/>Just kidding, I'm perfectly fine! 🎭`,
        mood: 'playful',
        chips: ['default'],
        sessionUpdate: {}
      };
    }
  }
];

module.exports = rules;
