// js/games/hurricane.js
// Huracán de Pensamientos - Destruye pensamientos negativos
// Efecto catártico y visualmente impactante

export class HurricaneGame {
    constructor(container) {
        this.container = container;
        this.canvas = null;
        this.ctx = null;
        
        this.width = 800;
        this.height = 500;
        
        // Pensamientos negativos predefinidos
        this.thoughts = [
            'No puedo con esto', 'tengo miedo', 'siento preocupación', 'y si no puedo?', 'siento pánico',
            'tengo inseguridad', 'me siento tristeza', 'me siento culpable', 'no soy suficiente',
            'y si fracaso?', 'siento mucho dolor', 'ya estoy cansada', 'no puedo con el estrés',
            'no lo lograré', 'no estoy mejorando', 'no volvere a mi prime','todo va a salir mal',
            'no puedo controlarlo', '¿y si pasa algo?', 'no merezco esto','no puedo respirar'
        ];
        
        this.particles = [];
        this.explosions = [];
        
        this.destroyedCount = 0;
        this.targetDestroyed = 10;
        
        this.isAnimating = true;
        this.animationFrame = null;
        
        this.mouseX = 0;
        this.mouseY = 0;
        
        // Control de interacción
        this.canInteract = true;
        this.isFinalSequence = false;
    }
    
    render() {
        this.container.innerHTML = `
            <div class="hurricane-game">
                <h2 class="text-center" style="margin-bottom: 8px;">
                    <span style="background: linear-gradient(135deg, #ef4444, #f59e0b, #8b5cf6); -webkit-background-clip: text; background-clip: text; color: transparent;">
                        🌀 Huracán de Pensamientos
                    </span>
                </h2>
                
                <div class="hurricane-progress">
                    <div class="progress-text">
                        <span>Pensamientos destruidos</span>
                        <span id="destroyedCounter">0/${this.targetDestroyed}</span>
                    </div>
                    <div class="progress-bar-bg">
                        <div id="hurricaneProgressBar" class="progress-bar-fill" style="width: 0%"></div>
                    </div>
                </div>
                
                <div class="hurricane-canvas-container">
                    <canvas id="hurricaneCanvas" width="${this.width}" height="${this.height}"></canvas>
                    <div class="canvas-hint">
                        <span>💥 Toca los pensamientos para destruirlos</span>
                    </div>
                </div>
                
                <div style="display: flex; gap: 16px; justify-content: center; margin-top: 24px;">
                    <button id="resetHurricane" class="btn-secondary">
                        🔄 Reiniciar tormenta
                    </button>
                    <button id="backFromHurricane" class="btn-secondary">
                        ← Volver
                    </button>
                </div>
            </div>
        `;
        
        this.initCanvas();
        this.initParticles();
        this.attachEvents();
        this.animate();
    }
    
    initCanvas() {
        this.canvas = document.getElementById('hurricaneCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth;
        if (containerWidth < this.width) {
            this.canvas.style.width = '100%';
            this.canvas.style.height = 'auto';
        }
    }
    
    initParticles() {
        this.particles = [];
        for (let i = 0; i < 15; i++) {
            this.particles.push(this.createParticle());
        }
    }
    
    createParticle() {
        const thought = this.thoughts[Math.floor(Math.random() * this.thoughts.length)];
        
        return {
            text: thought,
            x: 60 + Math.random() * (this.width - 120),
            y: 60 + Math.random() * (this.height - 120),
            vx: (Math.random() - 0.5) * 1.2,
            vy: (Math.random() - 0.5) * 1.2,
            size: 18 + Math.floor(Math.random() * 10),
            originalSize: 18 + Math.floor(Math.random() * 10),
            color: this.getRandomColor(),
            opacity: 0.8,
            active: true,
            isExploding: false,
            // Propiedades para animación de explosión
            targetX: null,
            targetY: null,
            explosionPhase: null // 'moving', 'shaking', 'exploding'
        };
    }
    
    getRandomColor() {
        const colors = ['#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    attachEvents() {
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            this.mouseX = (e.clientX - rect.left) * scaleX;
            this.mouseY = (e.clientY - rect.top) * scaleY;
        });
        
        this.canvas.addEventListener('mousedown', (e) => {
            if (this.canInteract && !this.isFinalSequence) {
                this.checkCollision();
            }
        });
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.canInteract && !this.isFinalSequence) {
                const rect = this.canvas.getBoundingClientRect();
                const touch = e.touches[0];
                const scaleX = this.canvas.width / rect.width;
                const scaleY = this.canvas.height / rect.height;
                this.mouseX = (touch.clientX - rect.left) * scaleX;
                this.mouseY = (touch.clientY - rect.top) * scaleY;
                this.checkCollision();
            }
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.canInteract && !this.isFinalSequence) {
                const rect = this.canvas.getBoundingClientRect();
                const touch = e.touches[0];
                const scaleX = this.canvas.width / rect.width;
                const scaleY = this.canvas.height / rect.height;
                this.mouseX = (touch.clientX - rect.left) * scaleX;
                this.mouseY = (touch.clientY - rect.top) * scaleY;
                this.checkCollision();
            }
        });
        
        document.getElementById('resetHurricane')?.addEventListener('click', () => {
            this.resetGame();
        });
        
        document.getElementById('backFromHurricane')?.addEventListener('click', () => {
            this.cleanup();
            if (window.app && window.app.router) {
                window.app.router.showGamesView();
            }
        });
    }
    
    checkCollision() {
        if (!this.canInteract || this.isFinalSequence) return;
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            if (p.isExploding) continue;
            
            const dx = this.mouseX - p.x;
            const dy = this.mouseY - p.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const collisionRadius = p.size * 1.5;
            
            if (distance < collisionRadius) {
                this.startExplosionSequence(p);
                break;
            }
        }
    }
    
    startExplosionSequence(p) {
        p.isExploding = true;
        p.explosionPhase = 'moving';
        p.targetX = this.width / 2;
        p.targetY = this.height / 2;
        p.originalVx = p.vx;
        p.originalVy = p.vy;
        p.shakeIntensity = 0;
        
        // Detener movimiento normal
        p.vx = 0;
        p.vy = 0;
    }
    
    updateExplosionSequence(p) {
        if (!p.isExploding) return false;
        
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        
        if (p.explosionPhase === 'moving') {
            // Movimiento SUAVE hacia el centro
            const dx = centerX - p.x;
            const dy = centerY - p.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 10) {
                // Movimiento lento y elegante (3% por frame)
                p.x += dx * 0.03;
                p.y += dy * 0.03;
                // Rotación suave
                // Rotación limitada a ±30 grados (0.52 radianes)
                if (!p.rotationDirection) {
                    // Elegir dirección aleatoria: 1 = derecha, -1 = izquierda
                    p.rotationDirection = Math.random() > 0.5 ? 1 : -1;
                    // Ángulo inicial aleatorio entre -10 y +10 grados
                    p.rotation = (Math.random() - 0.5) * 0.35;
                }
                // Mover hacia el ángulo objetivo (máximo 30 grados = 0.52 rad)
                const targetRotation = p.rotationDirection * 0.35; // ~20 grados promedio
                p.rotation += (targetRotation - p.rotation) * 0.05;
            } else {
                // Llegó al centro - comenzar a temblar
                p.explosionPhase = 'shaking';
                p.shakeStartTime = Date.now();
                p.x = centerX;
                p.y = centerY;
            }
        }
        
        if (p.explosionPhase === 'shaking') {
            const elapsed = Date.now() - p.shakeStartTime;
            const shakeDuration = 800; // 0.8 segundos temblando
            
            // Aumentar intensidad del temblor con el tiempo
            const progress = Math.min(elapsed / shakeDuration, 1);
            p.shakeIntensity = progress * 8;
            
            // Temblor
            p.x = centerX + (Math.random() - 0.5) * p.shakeIntensity;
            p.y = centerY + (Math.random() - 0.5) * p.shakeIntensity;
            
            // Aumentar tamaño (efecto globo)
            p.size = p.originalSize + progress * 25;
            
            // Cambiar color a más brillante
            p.opacity = 0.8 + progress * 0.4;
            
            if (progress >= 1) {
                // ¡EXPLOTAR!
                p.explosionPhase = 'exploding';
                this.createDramaticExplosion(centerX, centerY, p.color, p.text);
                return true; // Partícula debe ser eliminada
            }
        }
        
        return false;
    }
    
    createDramaticExplosion(x, y, color, text) {
        // Fuegos artificiales principales
        for (let i = 0; i < 40; i++) {
            const angle = (Math.PI * 2 / 40) * i + Math.random() * 0.5;
            const speed = 4 + Math.random() * 10;
            
            this.explosions.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 5 + Math.random() * 12,
                color: color,
                opacity: 1,
                life: 1.0,
                gravity: 0.08,
                isFirework: true
            });
        }
        
        // Destellos blancos
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 5 + Math.random() * 15;
            
            this.explosions.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 8,
                color: '#ffffff',
                opacity: 1,
                life: 1.0,
                gravity: 0.06,
                isFirework: true
            });
        }
        
        // Partículas que caen
        for (let i = 0; i < 25; i++) {
            this.explosions.push({
                x: x + (Math.random() - 0.5) * 80,
                y: y + (Math.random() - 0.5) * 60,
                vx: (Math.random() - 0.5) * 4,
                vy: Math.random() * 6 - 2,
                size: 2 + Math.random() * 6,
                color: color,
                opacity: 0.9,
                life: 1.0,
                gravity: 0.12,
                isFirework: false
            });
        }
        
        this.showToast(`💥 "${text}" destruido`, 'success');
    }
    
    updateProgress() {
        const counter = document.getElementById('destroyedCounter');
        const bar = document.getElementById('hurricaneProgressBar');
        
        if (counter) {
            counter.textContent = `${this.destroyedCount}/${this.targetDestroyed}`;
        }
        
        if (bar) {
            const percent = (this.destroyedCount / this.targetDestroyed) * 100;
            bar.style.width = `${percent}%`;
        }
    }
    
    animate() {
        if (!this.isAnimating) return;
        
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Fondo
        const gradient = this.ctx.createRadialGradient(
            this.width/2, this.height/2, 0,
            this.width/2, this.height/2, this.width/2
        );
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.7, '#0f0f1a');
        gradient.addColorStop(1, '#050510');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Procesar partículas en explosión
        const toRemove = [];
        this.particles.forEach((p, index) => {
            if (p.isExploding) {
                const shouldRemove = this.updateExplosionSequence(p);
                if (shouldRemove) {
                    toRemove.push(index);
                }
            }
        });
        
        // Eliminar partículas que explotaron (de atrás hacia adelante)
        for (let i = toRemove.length - 1; i >= 0; i--) {
            const index = toRemove[i];
            this.particles.splice(index, 1);
            this.destroyedCount++;
            this.updateProgress();
            
            // Crear nueva partícula si no es secuencia final
            if (!this.isFinalSequence && this.destroyedCount < this.targetDestroyed) {
                this.particles.push(this.createParticle());
            }
        }
        
        // Verificar si completó
        if (!this.isFinalSequence && this.destroyedCount >= this.targetDestroyed) {
            this.startFinalSequence();
        }
        
        // Actualizar partículas normales
        this.particles.forEach(p => {
            if (p.isExploding) return;
            
            p.x += p.vx;
            p.y += p.vy;
            
            if (p.x < 20 || p.x > this.width - 20) p.vx *= -0.9;
            if (p.y < 20 || p.y > this.height - 20) p.vy *= -0.9;
            
            const maxSpeed = 1.8;
            if (Math.abs(p.vx) > maxSpeed) p.vx *= 0.98;
            if (Math.abs(p.vy) > maxSpeed) p.vy *= 0.98;
            
            const dx = this.width/2 - p.x;
            const dy = this.height/2 - p.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > 60) {
                p.vx += dx / distance * 0.02;
                p.vy += dy / distance * 0.02;
            }
        });
        
        // Dibujar explosiones
        this.explosions = this.explosions.filter(e => {
            if (e.gravity) e.vy += e.gravity;
            e.x += e.vx;
            e.y += e.vy;
            e.vx *= 0.98;
            e.life -= e.isFirework ? 0.012 : 0.018;
            e.opacity = e.life;
            
            if (e.life <= 0) return false;
            
            this.ctx.beginPath();
            this.ctx.arc(e.x, e.y, e.size * e.life, 0, Math.PI * 2);
            
            if (e.isFirework) {
                this.ctx.shadowColor = e.color;
                this.ctx.shadowBlur = 15;
            }
            
            this.ctx.fillStyle = this.hexToRgba(e.color, e.opacity);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
            
            return true;
        });
        
        // Dibujar partículas (palabras)
        this.particles.forEach(p => {
            this.ctx.font = `${p.size}px 'Inter', sans-serif`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            this.ctx.shadowColor = p.color;
            this.ctx.shadowBlur = p.isExploding ? 25 : 15;
            
            this.ctx.fillStyle = this.hexToRgba(p.color, p.opacity);
            
            // Rotación si está en fase de movimiento
            if (p.rotation) {
                this.ctx.save();
                this.ctx.translate(p.x, p.y);
                this.ctx.rotate(p.rotation);
                this.ctx.fillText(p.text, 0, 0);
                this.ctx.restore();
            } else {
                this.ctx.fillText(p.text, p.x, p.y);
            }
            
            this.ctx.shadowBlur = 0;
        });
        
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }
    
    startFinalSequence() {
        this.isFinalSequence = true;
        this.canInteract = false;
        
        // Ocultar hint
        const hint = document.querySelector('.canvas-hint');
        if (hint) hint.style.opacity = '0';
        
        // Marcar todas las partículas restantes para explotar
        const remainingParticles = this.particles.filter(p => !p.isExploding);
        
        remainingParticles.forEach((p, index) => {
            setTimeout(() => {
                if (!p.isExploding) {
                    this.startExplosionSequence(p);
                }
            }, index * 1000); // 1.2 seg
        });
        
        // Esperar a que todas exploten y mostrar mensaje
        const totalTime = remainingParticles.length * 1000 + 1500;
        setTimeout(() => {
            this.showVictoryMessage();
        }, totalTime);
    }
    
    showVictoryMessage() {
        this.isAnimating = false;
        
        this.container.innerHTML = `
            <div class="completion-celebration">
                <div class="celebration-emoji">🌈</div>
                <h3>¡Has calmado la tormenta, Lu!</h3>
                <p>Todos los pensamientos negativos se han disipado.</p>
                <p style="font-size: 14px; margin-top: 16px;">Respira profundo. Estás en calma.</p>
                <div style="margin-top: 32px;">
                    <button id="backAfterHurricane" class="btn-primary" style="background: linear-gradient(135deg, #8b5cf6, #10b981);">
                        ← Volver a juegos
                    </button>
                </div>
            </div>
        `;
        
        if (window.app && window.app.anxietyState) {
            const newLevel = window.app.anxietyState.reduceLevel('Huracán');
            this.showToast('🌈 ¡Tormenta calmada, Lu! Has recuperado el control.', 'success');
            
            if (newLevel === 0) {
                setTimeout(() => {
                    if (window.app && window.app.router) {
                        window.app.router.showVictoryMessage();
                    }
                }, 2000);
            }
        }
        
        document.getElementById('backAfterHurricane')?.addEventListener('click', () => {
            if (window.app && window.app.router) {
                window.app.router.showGamesView();
            }
        });
    }
    
    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    resetGame() {
        this.destroyedCount = 0;
        this.explosions = [];
        this.isFinalSequence = false;
        this.canInteract = true;
        this.initParticles();
        this.updateProgress();
        
        const hint = document.querySelector('.canvas-hint');
        if (hint) hint.style.opacity = '1';
        
        this.showToast('🔄 Tormenta reiniciada', 'info');
    }
    
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = type === 'success' ? 'grounding-toast-success' : 'grounding-toast-info';
        toast.innerText = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }
    
    cleanup() {
        this.isAnimating = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }
}

export function initHurricane(container) {
    const game = new HurricaneGame(container);
    game.render();
    return game;
}