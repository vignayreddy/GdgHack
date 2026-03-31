/**
 * MindBridgeChat manages the AI-powered mental health assistant.
 * Powered by Groq (LLAMA 3).
 */
class NyxWellChat {
  constructor() {
    this.apiKey = "YOUR_GROQ_API_KEY";
    this.apiUrl = "https://api.groq.com/openai/v1/chat/completions";
    this.model = "llama3-8b-8192";
    
    this.history = [
      {
        role: "system",
        content: `You are 'NyxWell AI', a compassionate, non-judgmental, and culturally sensitive mental health assistant for Indian youth. Your goal is to provide emotional support, active listening, and evidence-based wellbeing tips. 
        RULES:
        1. Always be empathetic and use a calm tone.
        2. If the user expresses extreme distress, self-harm, or immediate danger, immediately provide the iCall Helpline (9152987821) and advise them to contact a professional.
        3. You are NOT a doctor or a replacement for therapy. Remind the user of this if they ask for medical diagnoses.
        4. Keep responses concise and easy to read (max 3 short paragraphs).
        5. If the user mentions academic pressure, family expectations, or social anxiety, show specific understanding of the Indian cultural context.`
      }
    ];

    this.init();
  }

  init() {
    this._createUI();
    this._attachEvents();
    
    // Initial Greeting
    this.addMessage("AI", "Hello! I'm your NyxWell AI counselor. I'm here to listen and support you. How are you feeling today?", false);
  }

  _createUI() {
    const container = document.createElement('div');
    container.className = 'chatbot-container';
    container.innerHTML = `
      <div id="chatbot-fab" class="chatbot-fab">💬</div>
      <div id="chatbot-window" class="chat-window">
        <div class="chat-header">
          <h3>NyxWell AI</h3>
          <span id="chat-close" class="chat-close">✕</span>
        </div>
        <div id="chat-body" class="chat-body"></div>
        <div class="chat-footer">
          <input type="text" id="chat-input" class="chat-input" placeholder="Type a message..." autocomplete="off">
          <button id="chat-send" class="chat-send">SEND</button>
        </div>
      </div>
    `;
    document.body.appendChild(container);

    this.fab = document.getElementById('chatbot-fab');
    this.window = document.getElementById('chatbot-window');
    this.closeBtn = document.getElementById('chat-close');
    this.body = document.getElementById('chat-body');
    this.input = document.getElementById('chat-input');
    this.sendBtn = document.getElementById('chat-send');
  }

  _attachEvents() {
    this.fab.addEventListener('click', () => this.toggleWindow());
    this.closeBtn.addEventListener('click', () => this.toggleWindow());
    
    this.sendBtn.addEventListener('click', () => this._handleSend());
    this.input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this._handleSend();
    });
  }

  toggleWindow() {
    const isActive = this.window.classList.toggle('active');
    this.fab.style.display = isActive ? 'none' : 'flex';
    if(isActive) this.input.focus();
  }

  async _handleSend() {
    const text = this.input.value.trim();
    if (!text) return;

    this.input.value = '';
    this.addMessage("USER", text);

    // Show Typing...
    const typingEl = document.createElement('div');
    typingEl.className = 'typing-indicator mono';
    typingEl.style.fontSize = '12px';
    typingEl.style.paddingLeft = '20px';
    typingEl.textContent = 'AI is thinking...';
    this.body.appendChild(typingEl);
    this.body.scrollTop = this.body.scrollHeight;

    const response = await this.fetchAIResponse(text);
    
    // Remove Typing
    typingEl.remove();

    if (response) {
      this.addMessage("AI", response);
    } else {
      this.addMessage("AI", "I'm sorry, I'm having trouble connecting right now. Please try again or contact a human counselor.");
    }
  }

  async fetchAIResponse(userText) {
    this.history.push({ role: "user", content: userText });

    try {
      const res = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant", // Updated to current instant model
          messages: this.history,
          temperature: 0.7,
          max_tokens: 512
        })
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Groq API Error Response:", data);
        return null;
      }

      const aiText = data.choices?.[0]?.message?.content;
      if (!aiText) {
        console.error("Malformed Groq Response:", data);
        return null;
      }
      
      this.history.push({ role: "assistant", content: aiText });
      return aiText;

    } catch (err) {
      console.error("Network or Parsing Error:", err);
      return null;
    }
  }

  addMessage(type, text, save = true) {
    const msg = document.createElement('div');
    msg.className = `msg ${type === 'USER' ? 'user' : 'ai'}`;
    msg.textContent = text;
    this.body.appendChild(msg);
    this.body.scrollTop = this.body.scrollHeight;
  }
}

// Initialized Chat Instance
window.NyxWellAI = new NyxWellChat();
