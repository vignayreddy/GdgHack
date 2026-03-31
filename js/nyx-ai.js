/**
 * NyxAI — Mental Health Assessment Engine
 * Voice Analysis: Web Speech API + Groq sentiment scoring
 * Facial Analysis: face-api.js expression mapping (free, browser-native)
 */
class NyxAIEngine {
  constructor() {
    this.aiApiKey = "YOUR_GROQ_API_KEY";
    this.recognition = null;
    this.faceStream = null;
    this.faceInterval = null;
    this.faceAPILoaded = false;
    this.isListening = false;
    this._currentTranscript = '';
    this.MODEL_URL = 'https://vladmandic.github.io/face-api/model';
    window.NyxAI = this;
  }

  // ─────────────────────────────────────────
  //  VOICE ANALYSIS
  // ─────────────────────────────────────────

  startVoice() {
    const btn = document.getElementById('btn-voice-scan');
    if (this.isListening) {
      this._stopVoice();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      this._setVoiceStatus('⚠️ Speech recognition not supported in this browser. Try Chrome.', 'error');
      return;
    }

    this._currentTranscript = '';
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-IN';

    this.recognition.onstart = () => {
      this.isListening = true;
      btn.textContent = '⏹️ STOP & ANALYSE';
      btn.style.background = 'var(--coral)';
      btn.style.borderColor = 'var(--coral)';
      this._setVoiceStatus('🔴 Recording... Speak clearly about how you feel.', 'active');
      this._showTranscript('');
    };

    this.recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) this._currentTranscript += t + ' ';
        else interim += t;
      }
      this._showTranscript(this._currentTranscript + (interim ? `<em style="opacity:0.4">${interim}</em>` : ''));
    };

    this.recognition.onerror = (e) => {
      if (e.error === 'no-speech') return; // ignore silence, keep listening
      this._setVoiceStatus(`⚠️ Mic error: ${e.error}. Check permissions.`, 'error');
    };

    this.recognition.onend = () => {
      // Browser auto-stopped (common in Chrome after silence)
      // Re-start if user hasn't manually stopped
      if (this.isListening) {
        try { this.recognition.start(); } catch (_) {}
      }
    };

    this.recognition.start();

    // Stop after 30 seconds automatically
    this._voiceTimer = setTimeout(() => this._stopVoice(), 30000);
  }

  _stopVoice() {
    this.isListening = false;
    clearTimeout(this._voiceTimer);

    const transcript = this._currentTranscript.trim();

    if (this.recognition) {
      this.recognition.onend = null; // Prevent re-start loop
      this.recognition.onerror = null;
      try { this.recognition.stop(); } catch (_) {}
      this.recognition = null;
    }

    const btn = document.getElementById('btn-voice-scan');
    btn.textContent = '⏳ ANALYSING...';
    btn.disabled = true;
    btn.style.background = '';
    btn.style.borderColor = '';

    // Directly trigger analysis with whatever was captured
    this._analyseVoice(transcript);
  }

  async _analyseVoice(transcript) {
    const btn = document.getElementById('btn-voice-scan');

    if (!transcript || transcript.length < 5) {
      this._setVoiceStatus('No speech detected. Try again.', 'idle');
      btn.textContent = '🎙️ START VOICE SCAN';
      btn.disabled = false;
      return;
    }

    this._setVoiceStatus('🧠 AI analysing your speech patterns...', 'active');

    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.aiApiKey}`
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content: `You are a mental health assessment AI. Given what a user said, score their mental wellbeing from 0-100.
              Scoring guide:
              - 80-100: Excellent — calm, positive, energetic, hopeful
              - 60-79: Good — mostly stable with minor concerns
              - 40-59: Moderate — stress, anxiety, worry, fatigue present
              - 20-39: Low — sadness, hopelessness, overwhelm detected
              - 0-19: Critical — crisis signals, self-harm language, severe distress
              
              Reply ONLY in this exact JSON format (no markdown):
              {"score":75,"label":"GOOD","summary":"Brief 1-sentence explanation","tips":["Short tip 1","Short tip 2"]}`
            },
            {
              role: "user",
              content: `Analyse this speech: "${transcript}"`
            }
          ],
          temperature: 0.4
        })
      });

      const json = await res.json();
      const text = json.choices?.[0]?.message?.content?.trim();
      const data = JSON.parse(text);

      this._showVoiceResult(data.score, data.label, data.summary, data.tips || []);
    } catch (e) {
      // Fallback: local keyword-based sentiment
      console.warn("Groq AI failed, using local analysis:", e);
      const localResult = this._localSentimentScore(transcript);
      this._showVoiceResult(localResult.score, localResult.label, localResult.summary, localResult.tips);
    }

    btn.textContent = '🎙️ SCAN AGAIN';
    btn.disabled = false;
  }

  _localSentimentScore(text) {
    const t = text.toLowerCase();
    const positive = ['happy', 'good', 'great', 'fine', 'excited', 'hopeful', 'calm', 'peaceful', 'joy', 'grateful', 'okay', 'okay', 'nice', 'well', 'cheerful', 'content'];
    const negative = ['sad', 'depressed', 'anxious', 'stressed', 'tired', 'exhausted', 'worried', 'scared', 'bad', 'awful', 'worse', 'hopeless', 'cry', 'pain', 'hurt', 'lonely', 'lost', 'empty', 'fail', 'afraid'];
    const critical  = ['suicide', 'kill', 'die', 'end it', 'no point', 'give up', 'cant go on', 'worthless'];

    let score = 65;
    positive.forEach(w => { if (t.includes(w)) score += 5; });
    negative.forEach(w => { if (t.includes(w)) score -= 8; });
    critical.forEach(w => { if (t.includes(w)) score -= 30; });

    score = Math.max(5, Math.min(100, score));

    const label = score >= 80 ? 'EXCELLENT' : score >= 60 ? 'GOOD' : score >= 40 ? 'MODERATE' : score >= 20 ? 'LOW' : 'CRITICAL';
    const summary = score >= 60 ? 'Your words reflect a generally stable emotional state.' : score >= 40 ? 'Some stress or concern detected in your speech.' : 'Significant emotional distress signals detected.';
    const tips = score >= 60
      ? ['Keep up your positive momentum.', 'Consider journaling your wins today.']
      : ['Try a 5-minute breathing exercise.', 'Reach out to a peer mentor on NyxWell.'];

    return { score, label, summary, tips };
  }

  _showVoiceResult(score, label, summary, tips) {
    const panel = document.getElementById('voice-result-panel');
    const scoreEl = document.getElementById('voice-score-num');
    const labelEl = document.getElementById('voice-score-label');
    const detailEl = document.getElementById('voice-score-detail');
    const color = score >= 80 ? '#25a244' : score >= 60 ? 'var(--sage)' : score >= 40 ? '#e6a817' : score >= 20 ? 'var(--coral)' : '#e63946';

    panel.style.display = 'block';
    panel.style.borderColor = color;
    panel.style.background = score >= 60 ? 'var(--sage-light)' : 'var(--coral-light)';
    scoreEl.textContent = score;
    scoreEl.style.color = color;
    labelEl.textContent = `${label}`;

    const emoji = score >= 80 ? '🌿' : score >= 60 ? '🙂' : score >= 40 ? '😐' : score >= 20 ? '😔' : '🆘';
    detailEl.innerHTML = `${emoji} ${summary}<br><br>${tips.map(t => `▸ ${t}`).join('<br>')}`;

    this._setVoiceStatus(`✅ Analysis complete — Score: ${score}/100`, 'done');
  }

  _setVoiceStatus(msg, state = 'idle') {
    const el = document.getElementById('voice-status');
    if (!el) return;
    el.textContent = msg;
    el.style.borderColor = state === 'active' ? 'var(--coral)' : state === 'done' ? 'var(--sage)' : '#ddd';
    el.style.color = state === 'error' ? 'var(--coral)' : 'inherit';
  }

  _showTranscript(html) {
    const el = document.getElementById('voice-transcript-box');
    if (!el) return;
    el.style.display = 'block';
    el.innerHTML = `"${html}"`;
  }

  // ─────────────────────────────────────────
  //  FACIAL EXPRESSION ANALYSIS
  // ─────────────────────────────────────────

  async startFace() {
    const btn = document.getElementById('btn-face-scan');

    if (this.faceStream) {
      this._stopFace();
      return;
    }

    this._setFaceStatus('🔄 Loading face detection models...', 'active');
    btn.textContent = '⏳ LOADING...';
    btn.disabled = true;

    try {
      await this._loadFaceAPI();
      this._setFaceStatus('📷 Requesting camera access...', 'active');

      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
      this.faceStream = stream;

      const video = document.getElementById('face-video');
      const wrapper = document.getElementById('face-video-wrapper');
      video.srcObject = stream;
      wrapper.style.display = 'block';

      await new Promise(r => video.addEventListener('loadeddata', r, { once: true }));

      this._setFaceStatus('🔴 LIVE — Analysing expressions for 10 seconds...', 'active');
      btn.textContent = '⏹️ STOP SCAN';
      btn.style.background = '#555';
      btn.style.borderColor = '#555';
      btn.disabled = false;

      // Collect expression readings over 10 seconds
      const readings = [];
      this.faceInterval = setInterval(async () => {
        try {
          const detections = await faceapi
            .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceExpressions();

          if (detections) {
            readings.push(detections.expressions);
            this._drawExpressionOverlay(detections);
          }
        } catch (_) {}
      }, 500);

      // Auto-analyse after 10 seconds
      setTimeout(() => {
        this._stopFace();
        if (readings.length > 0) {
          this._analyseFaceReadings(readings);
        } else {
          this._setFaceStatus('⚠️ No face detected. Make sure your face is visible.', 'error');
          btn.textContent = '📷 TRY AGAIN';
          btn.disabled = false;
          btn.style.background = 'var(--coral)';
          btn.style.borderColor = 'var(--coral)';
        }
      }, 10000);

    } catch (err) {
      this._setFaceStatus(`⚠️ Camera error: ${err.message}`, 'error');
      btn.textContent = '📷 TRY AGAIN';
      btn.disabled = false;
      btn.style.background = 'var(--coral)';
      btn.style.borderColor = 'var(--coral)';
      this._stopFace();
    }
  }

  _stopFace() {
    clearInterval(this.faceInterval);
    this.faceInterval = null;
    if (this.faceStream) {
      this.faceStream.getTracks().forEach(t => t.stop());
      this.faceStream = null;
    }
    const btn = document.getElementById('btn-face-scan');
    if (btn && !btn.disabled) {
      btn.style.background = 'var(--coral)';
      btn.style.borderColor = 'var(--coral)';
    }
  }

  _drawExpressionOverlay(detection) {
    const canvas = document.getElementById('face-canvas');
    const video  = document.getElementById('face-video');
    if (!canvas || !video) return;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw bounding box
    const box = detection.detection.box;
    ctx.strokeStyle = '#7FA882';
    ctx.lineWidth = 2;
    ctx.strokeRect(box.x, box.y, box.width, box.height);

    // Show dominant expression
    const expr = detection.expressions;
    const top = Object.entries(expr).sort((a, b) => b[1] - a[1])[0];
    ctx.fillStyle = 'rgba(127,168,130,0.9)';
    ctx.fillRect(box.x, box.y - 26, box.width, 22);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`${top[0].toUpperCase()} ${Math.round(top[1] * 100)}%`, box.x + 6, box.y - 9);
  }

  _analyseFaceReadings(readings) {
    // Average all expression readings
    const keys = ['happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised', 'neutral'];
    const avg = {};
    keys.forEach(k => {
      avg[k] = readings.reduce((sum, r) => sum + (r[k] || 0), 0) / readings.length;
    });

    // Score mapping (0–100)
    const score = Math.round(
      (avg.happy * 100)     * 1.0  +   // Max boost
      (avg.neutral * 60)             +   // Neutral = moderate
      (avg.surprised * 50)           +   // Surprised = mixed
      (avg.sad * 20)                 +   // Low
      (avg.fearful * 10)             +   // Very low
      (avg.angry * 10)               +   // Very low
      (avg.disgusted * 10)               // Very low
    );

    const capped = Math.max(5, Math.min(100, Math.round(score)));

    const label = capped >= 80 ? 'EXCELLENT' : capped >= 60 ? 'GOOD' : capped >= 40 ? 'MODERATE' : capped >= 20 ? 'LOW' : 'CRITICAL';

    // Build expression summary
    const topExpressions = Object.entries(avg)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .filter(([, v]) => v > 0.05)
      .map(([k, v]) => `${k}: ${Math.round(v * 100)}%`);

    const summary = `Dominant expressions: ${topExpressions.join(', ')}`;

    const emotionEmoji = avg.happy > 0.4 ? '😊' : avg.sad > 0.3 ? '😔' : avg.fearful > 0.3 ? '😰' : avg.angry > 0.3 ? '😠' : '😐';
    const tips = capped >= 60
      ? ['Your expressions suggest emotional stability.', 'Continue your daily mindfulness practice.']
      : ['Consider a short walk or breathing exercise.', 'Try NyxWell\'s 4-7-8 breathing activity.'];

    this._showFaceResult(capped, label, emotionEmoji, summary, tips);

    const btn = document.getElementById('btn-face-scan');
    btn.textContent = '📷 SCAN AGAIN';
    btn.disabled = false;
    btn.style.background = 'var(--coral)';
    btn.style.borderColor = 'var(--coral)';

    // Hide video after scan
    document.getElementById('face-video-wrapper').style.display = 'none';
  }

  _showFaceResult(score, label, emoji, summary, tips) {
    const panel = document.getElementById('face-result-panel');
    const scoreEl = document.getElementById('face-score-num');
    const labelEl = document.getElementById('face-score-label');
    const detailEl = document.getElementById('face-score-detail');
    const color = score >= 80 ? '#25a244' : score >= 60 ? 'var(--sage)' : score >= 40 ? '#e6a817' : 'var(--coral)';

    panel.style.display = 'block';
    scoreEl.textContent = score;
    scoreEl.style.color = color;
    labelEl.textContent = label;
    detailEl.innerHTML = `${emoji} ${summary}<br><br>${tips.map(t => `▸ ${t}`).join('<br>')}`;

    this._setFaceStatus(`✅ Scan complete — Wellbeing Index: ${score}/100`, 'done');
  }

  _setFaceStatus(msg, state = 'idle') {
    const el = document.getElementById('face-status');
    if (!el) return;
    el.textContent = msg;
    el.style.borderColor = state === 'active' ? 'var(--coral)' : state === 'done' ? 'var(--sage)' : '#ddd';
    el.style.color = state === 'error' ? 'var(--coral)' : 'inherit';
  }

  async _loadFaceAPI() {
    if (this.faceAPILoaded && window.faceapi) return;

    // Load face-api.js from CDN if not loaded
    if (!window.faceapi) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js';
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }

    // Load models
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(this.MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(this.MODEL_URL)
    ]);

    this.faceAPILoaded = true;
  }
}

// Auto-initialise
const NyxAI = new NyxAIEngine();
export default NyxAI;
