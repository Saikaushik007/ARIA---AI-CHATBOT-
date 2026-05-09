document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById('canvas-bg');
  const ctx = canvas.getContext('2d');
  
  let width, height;
  let particles = [];
  
  const colors = ['#a855f7', '#38bdf8', '#14dca0', '#f472b6', '#fb923c'];

  class Particle {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.size = Math.random() * 2.5 + 0.5;
      this.speedX = (Math.random() - 0.5) * 0.4;
      this.speedY = (Math.random() - 0.5) * 0.4;
      this.color = colors[Math.floor(Math.random() * colors.length)];
      this.pulse = Math.random() * Math.PI * 2;
      this.baseOpacity = Math.random() * 0.5 + 0.1;
    }
    
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      
      if (this.x < 0) this.x = width;
      if (this.x > width) this.x = 0;
      if (this.y < 0) this.y = height;
      if (this.y > height) this.y = 0;
      
      this.pulse += 0.02;
    }
    
    draw() {
      const opacity = this.baseOpacity + Math.sin(this.pulse) * 0.2;
      ctx.globalAlpha = Math.max(0, opacity);
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function init() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    
    particles = [];
    const numParticles = Math.min(120, Math.floor((width * height) / 8000));
    
    for (let i = 0; i < numParticles; i++) {
      particles.push(new Particle());
    }
  }

  function drawNebula(x, y, r, color) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    
    ctx.globalAlpha = 1;
    drawNebula(width * 0.2, height * 0.2, 400, 'rgba(168, 85, 247, 0.05)');
    drawNebula(width * 0.8, height * 0.8, 500, 'rgba(56, 189, 248, 0.04)');
    drawNebula(width * 0.8, height * 0.2, 300, 'rgba(20, 220, 160, 0.03)');
    drawNebula(width * 0.2, height * 0.8, 350, 'rgba(244, 114, 182, 0.04)');
    
    for (let p of particles) {
      p.update();
      p.draw();
    }
    
    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', () => {
    init();
  });

  init();
  animate();
});
