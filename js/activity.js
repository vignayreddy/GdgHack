class ActivityHub {
  constructor() {
    this.initialized = false;
    this.currentAudio = null;
    this.currentBtn = null;
    this.activeGame = null;
    this.canvas = null;
    this.ctx = null;
    this.animationFrame = null;
  }

  init() {
    if (this.initialized) return;
    this.canvas = document.getElementById('activity-game-canvas');
    if (this.canvas) this.ctx = this.canvas.getContext('2d');
    this._attachEventListeners();
    this.initialized = true;
  }

  _attachEventListeners() {
    // 1. Soundtrack play buttons (DIAGNOSTIC TEST LINKS)
    const playSrcs = [
      'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 
      'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', 
      'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
    ];

    const audioBtns = document.querySelectorAll('#page-activity .btn-secondary');
    
    audioBtns.forEach((btn, index) => {
      btn.addEventListener('click', () => {
        if (this.currentBtn === btn) {
          if (this.currentAudio && !this.currentAudio.paused) {
            this.currentAudio.pause();
            btn.textContent = 'PLAY';
            btn.closest('.brutal-card').classList.remove('audio-playing');
          } else if (this.currentAudio) {
            this.currentAudio.play();
            btn.textContent = 'PAUSE';
            btn.closest('.brutal-card').classList.add('audio-playing');
          }
          return;
        }

        if (this.currentAudio) {
          this.currentAudio.pause();
          if (this.currentBtn) {
            this.currentBtn.textContent = 'PLAY';
            this.currentBtn.closest('.brutal-card').classList.remove('audio-playing');
          }
        }

        this.currentAudio = new Audio(playSrcs[index % playSrcs.length]);
        this.currentAudio.loop = true;
        this.currentAudio.play().catch(e => console.log('Audio play prevented by browser:', e));
        
        btn.textContent = 'PAUSE';
        btn.closest('.brutal-card').classList.add('audio-playing');
        this.currentBtn = btn;
      });
    });

    // 2. Interactive Games buttons (LAUNCH)
    document.querySelectorAll('#page-activity .btn-primary').forEach((btn, idx) => {
      btn.addEventListener('click', () => {
        const type = idx === 0 ? 'pattern' : 'popper';
        this.launchGame(type);
      });
    });

    // 3. Game Overlay Close
    document.getElementById('activity-game-close')?.addEventListener('click', () => {
      this.closeGame();
    });

    // 4. YouTube Embed Video Cards
    const realVideoCards = document.querySelectorAll('#page-activity .brutal-card[style*="background: #fafafa"]');
    const videoEmbeds = [
      'https://www.youtube.com/embed/tEmt1Znux58', // Box breathing
      'https://www.youtube.com/embed/ZToicYcHIOU', // Body scan
      'https://www.youtube.com/embed/1nZEdqcGVzo'  // Muscle relaxation
    ];

    realVideoCards.forEach((card, index) => {
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => {
        const placeholder = card.querySelector('div');
        if (placeholder && placeholder.tagName === 'DIV' && placeholder.innerHTML.includes('▶')) {
           const iframe = document.createElement('iframe');
           iframe.width = "100%";
           iframe.height = "160px";
           iframe.src = videoEmbeds[index % videoEmbeds.length];
           iframe.title = "YouTube video player";
           iframe.frameBorder = "0";
           iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
           iframe.allowFullscreen = true;
           iframe.style.borderRadius = "4px";
           card.replaceChild(iframe, placeholder);
        }
      });
    });
  }

  launchGame(type) {
    const overlay = document.getElementById('activity-game-overlay');
    const title = document.getElementById('game-title');
    const subtitle = document.getElementById('game-subtitle');
    
    if (!overlay || !this.canvas) return;

    overlay.style.display = 'flex';
    this.activeGame = type;

    if (type === 'popper') {
      title.textContent = 'Zen Popper';
      subtitle.textContent = 'Pop bubbles to release stress.';
      this.initPopper();
    } else {
      title.textContent = 'Pattern Focus';
      subtitle.textContent = 'Follow the patterns to sharpen focus.';
      this.initPattern();
    }
  }

  closeGame() {
    document.getElementById('activity-game-overlay').style.display = 'none';
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    this.activeGame = null;
  }

  // --- ZEN POPPER ENGINE ---
  initPopper() {
    let bubbles = [];
    const colors = ['#5E4FE8', '#8B5CF6', '#A78BFA', '#C4B5FD'];

    const createBubble = () => {
      return {
        x: Math.random() * this.canvas.width,
        y: this.canvas.height + 50,
        r: 20 + Math.random() * 30,
        speed: 1 + Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)]
      };
    };

    const draw = () => {
      if (this.activeGame !== 'popper') return;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      if (Math.random() < 0.05 && bubbles.length < 15) bubbles.push(createBubble());

      bubbles.forEach((b, i) => {
        b.y -= b.speed;
        this.ctx.beginPath();
        this.ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        this.ctx.fillStyle = b.color;
        this.ctx.globalAlpha = 0.6;
        this.ctx.fill();
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        if (b.y < -b.r) bubbles.splice(i, 1);
      });

      this.animationFrame = requestAnimationFrame(draw);
    };

    this.canvas.onclick = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      bubbles.forEach((b, i) => {
        const dist = Math.sqrt((mx - b.x)**2 + (my - b.y)**2);
        if (dist < b.r) {
          bubbles.splice(i, 1);
          this._ripple(b.x, b.y, b.color);
        }
      });
    };

    draw();
  }

  _ripple(x, y, color) {
    let r = 0;
    const animate = () => {
      if (r > 50) return;
      this.ctx.beginPath();
      this.ctx.arc(x, y, r, 0, Math.PI * 2);
      this.ctx.strokeStyle = color;
      this.ctx.globalAlpha = 1 - (r/50);
      this.ctx.stroke();
      r += 5;
      requestAnimationFrame(animate);
    };
    animate();
  }

  // --- ZEN PATTERN FOCUS ENGINE (PATH TRACING) ---
  initPattern() {
    let focus = 0;
    let particles = [];
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const size = 180;
    
    // Infinity Loop (Lemniscate) Points
    const getPoint = (t) => {
       const scale = size / (Math.pow(Math.sin(t), 2) + 1);
       return {
         x: centerX + scale * Math.cos(t),
         y: centerY + scale * Math.sin(t) * Math.cos(t)
       };
    };

    let targetT = 0;
    let isBlooming = false;

    const drawFocusMeter = () => {
       this.ctx.fillStyle = 'rgba(255,255,255,0.1)';
       this.ctx.fillRect(50, this.canvas.height - 30, this.canvas.width - 100, 10);
       this.ctx.fillStyle = '#5E4FE8';
       this.ctx.fillRect(50, this.canvas.height - 30, (this.canvas.width - 100) * (focus / 100), 10);
    };

    const draw = () => {
      if (this.activeGame !== 'pattern') return;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      // 1. Draw Static Path (Shadow)
      this.ctx.beginPath();
      this.ctx.setLineDash([5, 10]);
      for (let t = 0; t < Math.PI * 2; t += 0.1) {
        const p = getPoint(t);
        if (t === 0) this.ctx.moveTo(p.x, p.y);
        else this.ctx.lineTo(p.x, p.y);
      }
      this.ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      this.ctx.lineWidth = 15;
      this.ctx.stroke();
      this.ctx.setLineDash([]);

      // 2. Draw Active Path (Glowing)
      const currentPos = getPoint(targetT);
      this.ctx.beginPath();
      this.ctx.arc(currentPos.x, currentPos.y, 8, 0, Math.PI * 2);
      this.ctx.fillStyle = '#5E4FE8';
      this.ctx.shadowBlur = 15;
      this.ctx.shadowColor = '#5E4FE8';
      this.ctx.fill();
      this.ctx.shadowBlur = 0;

      // 3. Update Particles
      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.01;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(94, 79, 232, ${p.alpha})`;
        this.ctx.fill();
        if (p.alpha <= 0) particles.splice(i, 1);
      });

      drawFocusMeter();
      if (!isBlooming) {
        this.animationFrame = requestAnimationFrame(draw);
      }
    };

    const handleSuccess = () => {
      isBlooming = true;
      for (let i = 0; i < 50; i++) {
        particles.push({
          x: centerX, y: centerY,
          vx: (Math.random() - 0.5) * 10,
          vy: (Math.random() - 0.5) * 10,
          size: Math.random() * 5,
          alpha: 1
        });
      }
      this.ctx.font = '20px Montserrat';
      this.ctx.fillStyle = 'white';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('ZEN BLOOM: PERFECT FOCUS', centerX, centerY);
      
      setTimeout(() => {
        focus = 0;
        targetT = 0;
        isBlooming = false;
        draw();
      }, 2000);
    };

    this.canvas.onmousemove = (e) => {
      if (isBlooming) return;
      const rect = this.canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const p = getPoint(targetT);
      const dist = Math.sqrt((mx - p.x)**2 + (my - p.y)**2);

      if (dist < 40) {
        focus += 0.5;
        targetT += 0.02;
        if (targetT > Math.PI * 2) targetT = 0;
        
        if (focus >= 100) handleSuccess();
        
        // Trail particles
        particles.push({
          x: mx, y: my,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          size: Math.random() * 3,
          alpha: 0.8
        });
      } else {
        focus = Math.max(0, focus - 0.2);
      }
    };

    draw();
  }
}

const Activity = new ActivityHub();
export default Activity;
