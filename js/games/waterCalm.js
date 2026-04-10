// js/games/waterCalm.js
// Lago de Calma - ¡Escapa de Tito y Lia!
// Evita que te atrapen mientras creas ondas de color
// Sonido con Audio nativo (FUNCIONAL)

export class WaterCalm {
    constructor(container) {
        this.container = container;
        this.canvas = null;
        this.ctx = null;
        
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        this.ripples = [];
        this.maxRipples = 50;
        
        this.colors = [
            { name: 'Calma', color: '#3b82f6', emoji: '🔵' },
            { name: 'Naturaleza', color: '#10b981', emoji: '🟢' },
            { name: 'Serenidad', color: '#8b5cf6', emoji: '🟣' },
            { name: 'Alegría', color: '#fbbf24', emoji: '🟡' },
            { name: 'Amor', color: '#f472b6', emoji: '🩷' },
            { name: 'Energía', color: '#fb923c', emoji: '🟠' },
            { name: 'Claridad', color: '#e5e7eb', emoji: '⚪' },
            { name: 'Sorpresa', color: 'rainbow', emoji: '🌈' }
        ];
        
        this.selectedColor = this.colors[0];
        this.originalBodyBg = document.body.style.background;
        
        this.isPressed = false;
        this.mouseX = this.width / 2;
        this.mouseY = this.height / 2;
        this.rippleInterval = null;
        this.soundInterval = null;
        
        // Perros
        this.tito = { x: 100, y: 100, vx: 0, vy: 0, size: 60, img: null };
        this.lia = { x: this.width - 100, y: 100, vx: 0, vy: 0, size: 50, img: null };
        this.dogsLoaded = false;
        
        // Contador de atrapadas
        this.catchCount = 0;
        this.maxCatches = 10;
        this.gameActive = true;
        this.lastCatchTime = 0;
        this.catchCooldown = 800;
        
        this.isAnimating = true;
        this.paletteElement = null;
        
        // Sonido nativo
        this.waterSound = new Audio('assets/sounds/water-drop.mp3');
        this.waterSound.loop = true;
        this.waterSound.volume = 0.25;
        
        this.loadDogs();
    }
    
    loadDogs() {
        this.tito.img = new Image();
        this.tito.img.src = 'assets/img/perros/tito.png';
        this.lia.img = new Image();
        this.lia.img.src = 'assets/img/perros/lia.png';
        
        let loaded = 0;
        const onLoad = () => {
            loaded++;
            if (loaded === 2) {
                this.dogsLoaded = true;
            }
        };
        
        this.tito.img.onload = onLoad;
        this.lia.img.onload = onLoad;
    }
    
    render() {
        this.container.innerHTML = `
            <div class="lake-calm-container">
                <canvas id="lakeCanvas"></canvas>
                <button id="backFromLake" class="lake-back-btn">← Volver</button>
                <div class="catch-counter">
                    <span>🦊</span>
                    <span id="catchCount">0</span>
                    <span>/</span>
                    <span>${this.maxCatches}</span>
                    <span>🤍</span>
                </div>
                <div class="lake-hint">
                    <span>🎨 ¡Escapa de Tito y Lia! Mantén pulsado y huye</span>
                </div>
            </div>
        `;
        
        this.createColorPalette();
        this.initCanvas();
        this.attachEvents();
        this.animate();
    }
    
    createColorPalette() {
        if (this.paletteElement) this.paletteElement.remove();
        
        this.paletteElement = document.createElement('div');
        this.paletteElement.className = 'color-palette-lake';
        this.paletteElement.innerHTML = this.colors.map((c, i) => `
            <div class="color-btn-lake ${c.color === 'rainbow' ? 'rainbow-btn' : ''}" 
                 data-color-index="${i}" 
                 style="${c.color !== 'rainbow' ? `background: ${c.color};` : ''}">
                <span class="color-emoji">${c.emoji}</span>
            </div>
        `).join('');
        
        document.body.appendChild(this.paletteElement);
        
        setTimeout(() => {
            const firstBtn = this.paletteElement.querySelector('.color-btn-lake');
            if (firstBtn) firstBtn.classList.add('selected');
        }, 100);
    }
    
    initCanvas() {
        this.canvas = document.getElementById('lakeCanvas');
        this.ctx = this.canvas.getContext('2d', { alpha: false });
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.mouseX = this.width / 2;
        this.mouseY = this.height / 2;
    }
    
    attachEvents() {
        document.body.addEventListener('click', (e) => {
            const btn = e.target.closest('.color-btn-lake');
            if (!btn) return;
            
            const index = parseInt(btn.dataset.colorIndex);
            this.selectedColor = this.colors[index];
            
            document.querySelectorAll('.color-btn-lake').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        });
        
        this.canvas.addEventListener('mousedown', (e) => {
            if (!this.gameActive) return;
            this.isPressed = true;
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
            this.startRippleStream();
            this.startSoundStream();
            this.applyBodyBackground();
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.isPressed = false;
            this.stopRippleStream();
            this.stopSoundStream();
            this.resetBodyBackground();
        });
        
        this.canvas.addEventListener('mouseleave', () => {
            this.isPressed = false;
            this.stopRippleStream();
            this.stopSoundStream();
            this.resetBodyBackground();
        });
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (!this.gameActive) return;
            this.isPressed = true;
            const touch = e.touches[0];
            this.mouseX = touch.clientX;
            this.mouseY = touch.clientY;
            this.startRippleStream();
            this.startSoundStream();
            this.applyBodyBackground();
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.mouseX = touch.clientX;
            this.mouseY = touch.clientY;
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.isPressed = false;
            this.stopRippleStream();
            this.stopSoundStream();
            this.resetBodyBackground();
        });
        
        document.getElementById('backFromLake')?.addEventListener('click', () => {
            this.cleanup();
            if (window.app && window.app.router) {
                window.app.router.showGamesView();
            }
        });
        
        setTimeout(() => {
            document.querySelector('.lake-hint')?.style.setProperty('opacity', '0');
        }, 4000);
    }
    
    startRippleStream() {
        this.stopRippleStream();
        this.rippleInterval = setInterval(() => {
            if (this.isPressed && this.gameActive) {
                this.createRipple(this.mouseX, this.mouseY);
            }
        }, 30);
    }
    
    stopRippleStream() {
        if (this.rippleInterval) {
            clearInterval(this.rippleInterval);
            this.rippleInterval = null;
        }
    }
    
    startSoundStream() {
        if (this.gameActive) {
            this.waterSound.currentTime = 0;
            this.waterSound.play().catch(e => {});
        }
    }

    stopSoundStream() {
        this.waterSound.pause();
        this.waterSound.currentTime = 0;
    }
    
    applyBodyBackground() {
        if (this.selectedColor.color === 'rainbow') {
            const hue = (Date.now() / 10) % 360;
            document.body.style.background = `linear-gradient(135deg, hsl(${hue}, 40%, 12%), hsl(${(hue + 60) % 360}, 40%, 18%))`;
            document.body.style.backgroundSize = '400% 400%';
            document.body.style.animation = 'gradient-shift 10s ease infinite';
        } else {
            const color = this.selectedColor.color;
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            
            const darkColor = `rgb(${Math.floor(r * 0.15)}, ${Math.floor(g * 0.15)}, ${Math.floor(b * 0.15)})`;
            const midColor = `rgb(${Math.floor(r * 0.35)}, ${Math.floor(g * 0.35)}, ${Math.floor(b * 0.35)})`;
            
            document.body.style.background = `linear-gradient(135deg, ${darkColor}, ${midColor}, ${darkColor})`;
            document.body.style.backgroundSize = '400% 400%';
            document.body.style.animation = 'gradient-shift 15s ease infinite';
        }
    }
    
    resetBodyBackground() {
        document.body.style.background = this.originalBodyBg || '';
        document.body.style.animation = '';
    }
    
    createRipple(x, y) {
        let color;
        if (this.selectedColor.color === 'rainbow') {
            const hue = (Date.now() / 10) % 360;
            color = `hsl(${hue}, 80%, 60%)`;
            
            if (this.isPressed) {
                document.body.style.background = `linear-gradient(135deg, hsl(${hue}, 40%, 12%), hsl(${(hue + 60) % 360}, 40%, 18%))`;
                document.body.style.backgroundSize = '400% 400%';
            }
        } else {
            color = this.selectedColor.color;
        }
        
        this.ripples.push({
            x, y,
            radius: 10,
            maxRadius: Math.min(this.width, this.height) * 0.5,
            color: color,
            speed: 4,
            active: true
        });
        
        if (this.ripples.length > this.maxRipples) {
            this.ripples.shift();
        }
    }
    
    updateDogs() {
        if (!this.dogsLoaded || !this.gameActive) return;
        
        const baseSpeed = this.isPressed ? 3.5 : 2.0;
        
        const dxTito = this.mouseX - this.tito.x;
        const dyTito = this.mouseY - this.tito.y;
        const distTito = Math.sqrt(dxTito * dxTito + dyTito * dyTito);
        
        if (distTito > 5) {
            this.tito.vx = (dxTito / distTito) * baseSpeed;
            this.tito.vy = (dyTito / distTito) * baseSpeed;
        }
        
        const dxLia = this.mouseX - this.lia.x;
        const dyLia = this.mouseY - this.lia.y;
        const distLia = Math.sqrt(dxLia * dxLia + dyLia * dyLia);
        
        if (distLia > 5) {
            this.lia.vx = (dxLia / distLia) * baseSpeed;
            this.lia.vy = (dyLia / distLia) * baseSpeed;
        }
        
        this.tito.vx += (Math.random() - 0.5) * 0.6;
        this.tito.vy += (Math.random() - 0.5) * 0.6;
        this.lia.vx += (Math.random() - 0.5) * 0.6;
        this.lia.vy += (Math.random() - 0.5) * 0.6;
        
        this.tito.x += this.tito.vx;
        this.tito.y += this.tito.vy;
        this.lia.x += this.lia.vx;
        this.lia.y += this.lia.vy;
        
        const margin = 50;
        const midX = this.width / 2;
        
        this.tito.x = Math.max(margin, Math.min(midX - 20, this.tito.x));
        this.tito.y = Math.max(margin, Math.min(this.height - margin - 100, this.tito.y));
        
        this.lia.x = Math.max(midX + 20, Math.min(this.width - margin, this.lia.x));
        this.lia.y = Math.max(margin, Math.min(this.height - margin - 100, this.lia.y));
        
        this.checkCatch();
    }
    
    checkCatch() {
        if (!this.isPressed) return;
        
        const now = Date.now();
        if (now - this.lastCatchTime < this.catchCooldown) return;
        
        const distToTito = Math.sqrt(
            Math.pow(this.mouseX - this.tito.x, 2) + 
            Math.pow(this.mouseY - this.tito.y, 2)
        );
        
        if (distToTito < 50) {
            this.catchCount++;
            this.lastCatchTime = now;
            this.updateCatchDisplay();
            this.tito.vx = (this.tito.x - this.mouseX) * 0.5;
            this.tito.vy = (this.tito.y - this.mouseY) * 0.5;
            
            if (this.catchCount >= this.maxCatches) {
                this.gameOver('tito');
            }
        }
        
        const distToLia = Math.sqrt(
            Math.pow(this.mouseX - this.lia.x, 2) + 
            Math.pow(this.mouseY - this.lia.y, 2)
        );
        
        if (distToLia < 45) {
            this.catchCount++;
            this.lastCatchTime = now;
            this.updateCatchDisplay();
            this.lia.vx = (this.lia.x - this.mouseX) * 0.5;
            this.lia.vy = (this.lia.y - this.mouseY) * 0.5;
            
            if (this.catchCount >= this.maxCatches) {
                this.gameOver('lia');
            }
        }
    }
    
    updateCatchDisplay() {
        const counter = document.getElementById('catchCount');
        if (counter) counter.textContent = this.catchCount;
    }
    
    gameOver(winner) {
        if (!this.gameActive) return;
        
        this.gameActive = false;
        this.isPressed = false;
        this.stopRippleStream();
        this.stopSoundStream();
        this.resetBodyBackground();
        
        const winnerName = winner === 'tito' ? 'Tito 🦊' : 'Lia 🤍';
        const winnerImg = winner === 'tito' ? this.tito.img : this.lia.img;
        
        const oldGameOver = this.container.querySelector('.catch-gameover');
        if (oldGameOver) oldGameOver.remove();
        
        const gameOverDiv = document.createElement('div');
        gameOverDiv.className = 'catch-gameover';
        gameOverDiv.innerHTML = `
            <div class="gameover-content">
                <img src="${winnerImg.src}" class="gameover-dog" alt="${winnerName}">
                <div class="gameover-bubble">
                    <p>¡Te atrapé! ¿Jugamos otra vez?</p>
                </div>
                <div class="gameover-buttons">
                    <button id="playAgain" class="gameover-btn yes">¡Sí! 🎮</button>
                    <button id="backToGames" class="gameover-btn no">← Volver</button>
                </div>
            </div>
        `;
        
        this.container.appendChild(gameOverDiv);
        
        requestAnimationFrame(() => {
            document.getElementById('playAgain')?.addEventListener('click', () => this.resetGame());
            document.getElementById('backToGames')?.addEventListener('click', () => {
                this.cleanup();
                if (window.app && window.app.router) {
                    window.app.router.showGamesView();
                }
            });
        });
    }
    
    resetGame() {
        this.catchCount = 0;
        this.gameActive = true;
        this.lastCatchTime = 0;
        this.updateCatchDisplay();
        
        this.tito.x = 100;
        this.tito.y = 100;
        this.lia.x = this.width - 100;
        this.lia.y = 100;
        
        const gameOverDiv = this.container.querySelector('.catch-gameover');
        if (gameOverDiv) gameOverDiv.remove();
        
        if (window.app && window.app.anxietyState) {
            window.app.anxietyState.currentLevel = Math.max(0, window.app.anxietyState.currentLevel - 1);
            window.app.anxietyState.updateUI();
        }
    }
    
    animate() {
        if (!this.isAnimating) return;
        
        if (this.gameActive) this.updateDogs();
        
        this.ctx.fillStyle = '#0a1220';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Línea divisoria
        this.ctx.beginPath();
        this.ctx.moveTo(this.width / 2, 0);
        this.ctx.lineTo(this.width / 2, this.height);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 20]);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        this.drawRipples();
        if (this.dogsLoaded) this.drawDogs();
        this.updateRipples();
        
        requestAnimationFrame(() => this.animate());
    }
    
    drawDogs() {
        this.ctx.save();
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 20;
        this.ctx.shadowOffsetY = 5;
        
        if (this.tito.img) {
            this.ctx.drawImage(this.tito.img, this.tito.x - 40, this.tito.y - 40, 80, 80);
            this.ctx.font = 'bold 14px Inter';
            this.ctx.fillStyle = 'white';
            this.ctx.shadowBlur = 10;
            this.ctx.textAlign = 'center';
            this.ctx.fillText('🦊 Tito', this.tito.x, this.tito.y - 50);
        }
        
        if (this.lia.img) {
            this.ctx.drawImage(this.lia.img, this.lia.x - 35, this.lia.y - 35, 70, 70);
            this.ctx.fillText('🤍 Lia', this.lia.x, this.lia.y - 45);
        }
        
        this.ctx.restore();
    }
    
    drawRipples() {
        this.ripples.forEach(ripple => {
            if (!ripple.active) return;
            
            const progress = ripple.radius / ripple.maxRadius;
            const alpha = Math.max(0, 0.7 - progress * 0.5);
            
            const gradient = this.ctx.createRadialGradient(
                ripple.x, ripple.y, 0,
                ripple.x, ripple.y, ripple.radius
            );
            
            const color = this.hexToRgba(ripple.color, alpha * 0.5);
            const colorMid = this.hexToRgba(ripple.color, alpha * 0.2);
            
            gradient.addColorStop(0, color);
            gradient.addColorStop(0.6, colorMid);
            gradient.addColorStop(1, 'transparent');
            
            this.ctx.beginPath();
            this.ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
            
            for (let i = 0; i < 2; i++) {
                const ringRadius = ripple.radius - (i * 20);
                if (ringRadius > 5) {
                    this.ctx.beginPath();
                    this.ctx.arc(ripple.x, ripple.y, ringRadius, 0, Math.PI * 2);
                    this.ctx.strokeStyle = this.hexToRgba('#ffffff', alpha * 0.2);
                    this.ctx.lineWidth = 2;
                    this.ctx.stroke();  
                }
            }
        });
    }
    
    updateRipples() {
        this.ripples = this.ripples.filter(ripple => {
            ripple.radius += ripple.speed;
            return ripple.radius < ripple.maxRadius;
        });
    }
    
    hexToRgba(hex, alpha) {
        if (hex.startsWith('hsl')) return hex;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    cleanup() {
        this.isAnimating = false;
        this.stopRippleStream();
        this.stopSoundStream();
        if (this.paletteElement) this.paletteElement.remove();
        this.resetBodyBackground();
        window.removeEventListener('resize', this.resizeCanvas);
    }
}

export function initWaterCalm(container) {
    const game = new WaterCalm(container);
    game.render();
    return game;
}