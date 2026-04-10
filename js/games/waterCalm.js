// js/games/waterCalm.js
// Lago de Calma - Persigue a Tito y Lia
// Experiencia hipnótica con ondas de color

import { getSoundManager } from '../engine/soundManager.js';

export class WaterCalm {
    constructor(container) {
        this.container = container;
        this.canvas = null;
        this.ctx = null;
        
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        // Ondas
        this.ripples = [];
        this.maxRipples = 50;
        
        // Colores
        this.colors = [
            { name: 'Calma', color: '#3b82f6', emoji: '🔵', bgColor: '#0a1220' },
            { name: 'Naturaleza', color: '#10b981', emoji: '🟢', bgColor: '#0a1a10' },
            { name: 'Serenidad', color: '#8b5cf6', emoji: '🟣', bgColor: '#1a0a2a' },
            { name: 'Alegría', color: '#fbbf24', emoji: '🟡', bgColor: '#1a1a0a' },
            { name: 'Amor', color: '#f472b6', emoji: '🩷', bgColor: '#1a0a1a' },
            { name: 'Energía', color: '#fb923c', emoji: '🟠', bgColor: '#1a100a' },
            { name: 'Claridad', color: '#e5e7eb', emoji: '⚪', bgColor: '#1a1a2a' },
            { name: 'Sorpresa', color: 'rainbow', emoji: '🌈', bgColor: null }
        ];
        
        this.selectedColor = this.colors[0];
        this.originalBodyBg = document.body.style.background;
        
        // Estado de interacción
        this.isPressed = false;
        this.mouseX = 0;
        this.mouseY = 0;
        this.rippleInterval = null;
        this.soundInterval = null;
        this.frameCount = 0;
        
        // Perros
        this.tito = { x: 0, y: 0, vx: 0, vy: 0, size: 60, img: null };
        this.lia = { x: 0, y: 0, vx: 0, vy: 0, size: 50, img: null };
        this.dogsLoaded = false;
        this.dogMoveInterval = null;
        
        // Animación
        this.isAnimating = true;
        
        // Sonido y voz
        this.soundManager = null;
        this.lastColorChange = 0;
        this.voiceCooldown = 3000;
        
        this.initSoundManager();
        this.loadDogs();
    }
    
    initSoundManager() {
        try {
            this.soundManager = getSoundManager();
        } catch (e) {
            console.warn('💧 SoundManager no disponible aún');
        }
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
                this.initDogPositions();
                this.startDogMovement();
            }
        };
        
        this.tito.img.onload = onLoad;
        this.lia.img.onload = onLoad;
    }
    
    initDogPositions() {
        this.tito.x = this.width * 0.3;
        this.tito.y = this.height * 0.5;
        this.lia.x = this.width * 0.7;
        this.lia.y = this.height * 0.5;
    }
    
    startDogMovement() {
        this.dogMoveInterval = setInterval(() => {
            if (this.isPressed) {
                // Moverse alejándose del cursor
                const dxTito = this.tito.x - this.mouseX;
                const dyTito = this.tito.y - this.mouseY;
                const distTito = Math.sqrt(dxTito * dxTito + dyTito * dyTito);
                
                if (distTito < 200) {
                    const angle = Math.atan2(dyTito, dxTito);
                    this.tito.vx += Math.cos(angle) * 3;
                    this.tito.vy += Math.sin(angle) * 3;
                }
                
                const dxLia = this.lia.x - this.mouseX;
                const dyLia = this.lia.y - this.mouseY;
                const distLia = Math.sqrt(dxLia * dxLia + dyLia * dyLia);
                
                if (distLia < 200) {
                    const angle = Math.atan2(dyLia, dxLia);
                    this.lia.vx += Math.cos(angle) * 3.2;
                    this.lia.vy += Math.sin(angle) * 3.2;
                }
            }
            
            // Siempre hay movimiento aleatorio
            this.tito.vx += (Math.random() - 0.5) * 0.8;
            this.tito.vy += (Math.random() - 0.5) * 0.8;
            this.lia.vx += (Math.random() - 0.5) * 0.8;
            this.lia.vy += (Math.random() - 0.5) * 0.8;
            
            // Aplicar velocidad
            this.tito.x += this.tito.vx;
            this.tito.y += this.tito.vy;
            this.lia.x += this.lia.vx;
            this.lia.y += this.lia.vy;
            
            // Frenar
            this.tito.vx *= 0.9;
            this.tito.vy *= 0.9;
            this.lia.vx *= 0.9;
            this.lia.vy *= 0.9;
            
            // Límites
            const margin = 60;
            this.tito.x = Math.max(margin, Math.min(this.width - margin, this.tito.x));
            this.tito.y = Math.max(margin, Math.min(this.height - margin - 100, this.tito.y));
            this.lia.x = Math.max(margin, Math.min(this.width - margin, this.lia.x));
            this.lia.y = Math.max(margin, Math.min(this.height - margin - 100, this.lia.y));
        }, 33); // ~30 FPS
    }
    
    render() {
        this.container.innerHTML = `
            <div class="lake-calm-container">
                <canvas id="lakeCanvas"></canvas>
                
                <!-- Controles -->
                <div class="lake-controls">
                    <button id="clearLake" class="lake-btn">🧹 Limpiar</button>
                    <button id="backFromLake" class="lake-btn">← Volver</button>
                </div>
                
                <!-- Instrucción -->
                <div class="lake-hint">
                    <span>🎨 Selecciona un color, mantén pulsado y persigue a Tito y Lia</span>
                </div>
            </div>
        `;
        
        // Paleta de colores FUERA del container (en el body)
        const palette = document.createElement('div');
        palette.className = 'color-palette-lake';
        palette.innerHTML = this.colors.map((c, i) => `
            <div class="color-btn-lake ${c.color === 'rainbow' ? 'rainbow-btn' : ''}" 
                 data-color-index="${i}" 
                 style="${c.color !== 'rainbow' ? `background: ${c.color};` : ''}">
                <span class="color-emoji">${c.emoji}</span>
            </div>
        `).join('');
        document.body.appendChild(palette);
        this.paletteElement = palette;
        
        this.initCanvas();
        this.attachEvents();
        this.animate();
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
    }
    
    attachEvents() {
        // Seleccionar color (delegación de eventos en el body)
        document.body.addEventListener('click', (e) => {
            const btn = e.target.closest('.color-btn-lake');
            if (!btn) return;
            
            const index = parseInt(btn.dataset.colorIndex);
            this.selectedColor = this.colors[index];
            
            document.querySelectorAll('.color-btn-lake').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            
            // Cambiar fondo del BODY
            this.updateBodyBackground();
            
            // Voz al cambiar de color
            this.speakColorChange();
            
            // Sonido sutil
            if (this.soundManager) {
                this.soundManager.playWaterDrop();
            }
        });
        
        // Activar primer color
        setTimeout(() => {
            const firstBtn = document.querySelector('.color-btn-lake');
            if (firstBtn) firstBtn.classList.add('selected');
        }, 100);
        
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => {
            this.isPressed = true;
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
            this.startRippleStream();
            this.startSoundStream();
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.isPressed = false;
            this.stopRippleStream();
            this.stopSoundStream();
        });
        
        this.canvas.addEventListener('mouseleave', () => {
            this.isPressed = false;
            this.stopRippleStream();
            this.stopSoundStream();
        });
        
        // Touch events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.isPressed = true;
            const touch = e.touches[0];
            this.mouseX = touch.clientX;
            this.mouseY = touch.clientY;
            this.startRippleStream();
            this.startSoundStream();
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
        });
        
        // Limpiar
        document.getElementById('clearLake')?.addEventListener('click', () => {
            this.ripples = [];
        });
        
        // Volver
        document.getElementById('backFromLake')?.addEventListener('click', () => {
            this.cleanup();
            if (window.app && window.app.router) {
                window.app.router.showGamesView();
            }
        });
        
        // Ocultar hint
        setTimeout(() => {
            document.querySelector('.lake-hint')?.style.setProperty('opacity', '0');
        }, 5000);
    }
    
    startRippleStream() {
        this.stopRippleStream();
        this.rippleInterval = setInterval(() => {
            if (this.isPressed) {
                this.createRipple(this.mouseX, this.mouseY);
            }
        }, 25); // Muy seguido para efecto continuo
    }
    
    stopRippleStream() {
        if (this.rippleInterval) {
            clearInterval(this.rippleInterval);
            this.rippleInterval = null;
        }
    }
    
    startSoundStream() {
        this.stopSoundStream();
        this.soundInterval = setInterval(() => {
            if (this.isPressed && this.soundManager) {
                this.soundManager.playWaterDrop();
            }
        }, 120); // Sonido de gota continuo
    }
    
    stopSoundStream() {
        if (this.soundInterval) {
            clearInterval(this.soundInterval);
            this.soundInterval = null;
        }
    }
    
    updateBodyBackground() {
        if (this.selectedColor.color === 'rainbow') {
            document.body.style.background = 'linear-gradient(135deg, #0a1220, #1a2a4a, #0a1220)';
        } else {
            const color = this.selectedColor.color;
            // Convertir hex a RGB para crear gradiente
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            
            const darkColor = `rgb(${Math.floor(r * 0.2)}, ${Math.floor(g * 0.2)}, ${Math.floor(b * 0.2)})`;
            const midColor = `rgb(${Math.floor(r * 0.4)}, ${Math.floor(g * 0.4)}, ${Math.floor(b * 0.4)})`;
            
            document.body.style.background = `linear-gradient(135deg, ${darkColor}, ${midColor}, ${darkColor})`;
            document.body.style.backgroundSize = '400% 400%';
            document.body.style.animation = 'gradient-shift 15s ease infinite';
        }
    }
    
    speakColorChange() {
        const now = Date.now();
        if (now - this.lastColorChange < this.voiceCooldown) return;
        this.lastColorChange = now;
        
        const messages = [
            `Has elegido ${this.selectedColor.name}`,
            `El color ${this.selectedColor.name} te envuelve`
        ];
        
        const message = messages[Math.floor(Math.random() * messages.length)];
        
        import('../engine/speechManager.js').then(module => {
            const speech = module.getSpeechManager();
            speech.speak(message);
        }).catch(() => {});
    }
    
    createRipple(x, y) {
        let color;
        if (this.selectedColor.color === 'rainbow') {
            const hue = (Date.now() / 10) % 360;
            color = `hsl(${hue}, 80%, 60%)`;
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
        
        // Reducir ansiedad
        this.frameCount++;
        if (this.frameCount % 40 === 0) {
            if (window.app && window.app.anxietyState) {
                window.app.anxietyState.reduceLevel('🌊 Lago de Calma');
            }
        }
    }
    
    animate() {
        if (!this.isAnimating) return;
        
        this.frameCount++;
        
        // Fondo oscuro del canvas (agua)
        this.ctx.fillStyle = '#0a1220';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Dibujar ondas
        this.drawRipples();
        
        // Dibujar perros
        this.drawDogs();
        
        // Actualizar ondas
        this.updateRipples();
        
        requestAnimationFrame(() => this.animate());
    }
    
    drawDogs() {
        if (!this.dogsLoaded) return;
        
        this.ctx.save();
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 20;
        this.ctx.shadowOffsetY = 5;
        
        // Tito
        if (this.tito.img) {
            this.ctx.drawImage(this.tito.img, this.tito.x - 40, this.tito.y - 40, 80, 80);
            this.ctx.font = 'bold 14px Inter';
            this.ctx.fillStyle = 'white';
            this.ctx.shadowBlur = 10;
            this.ctx.textAlign = 'center';
            this.ctx.fillText('🦊 Tito', this.tito.x, this.tito.y - 50);
        }
        
        // Lia
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
            
            // Anillos brillantes
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
        if (this.dogMoveInterval) clearInterval(this.dogMoveInterval);
        if (this.paletteElement) this.paletteElement.remove();
        document.body.style.background = this.originalBodyBg;
        window.removeEventListener('resize', this.resizeCanvas);
    }
}

export function initWaterCalm(container) {
    const game = new WaterCalm(container);
    game.render();
    return game;
}