// js/games/breathing.js
// Juego de Respiración 4-7-8 usando Canvas API

export class BreathingGame {
    constructor(container) {
        this.container = container;
        this.canvas = null;
        this.ctx = null;
        this.animationFrame = null;
        
        this.canvasSize = 300;
        this.circleMin = 80;
        this.circleMax = 200;
        this.currentRadius = this.circleMin;
        
        this.phases = [
            { name: 'Inhala', duration: 4, color: '#10b981', textColor: '#ffffff' },
            { name: 'Retén', duration: 7, color: '#8b5cf6', textColor: '#ffffff' },
            { name: 'Exhala', duration: 8, color: '#f59e0b', textColor: '#0f172a' }
        ];
        
        this.currentPhase = 0;
        this.cycleCount = 0;
        this.totalCycles = 3;
        this.isPlaying = false;
        this.phaseStartTime = 0;
        this.phaseProgress = 0;
        
        // 🆕 Logger
        this.gameName = 'Respiración 4-7-8';
        this.startTime = Date.now();
        
        this.animate = this.animate.bind(this);
        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);
        this.reset = this.reset.bind(this);
    }
    
    render() {
        // 🆕 Registrar entrada
        import('../engine/logger.js').then(module => {
            module.Logger.logGameVisit(this.gameName);
        });
        
        this.container.innerHTML = `
            <div class="breathing-game">
                <h2 class="text-center">🌬️ Respiración 4-7-8</h2>
                <p class="text-center" style="margin-bottom: 24px; color: #6c7a89;">
                    Sigue el ritmo del círculo. Completa 3 ciclos.
                </p>
                
                <div style="display: flex; justify-content: center; margin-bottom: 24px;">
                    <canvas id="breathingCanvas" width="${this.canvasSize}" height="${this.canvasSize}" 
                            style="border-radius: 50%; box-shadow: 0 4px 16px rgba(0,0,0,0.1);">
                    </canvas>
                </div>
                
                <div class="breathing-info text-center" style="margin-bottom: 24px;">
                    <div id="phaseText" style="font-size: 2rem; font-weight: bold; color: #5e63b6;">Listo</div>
                    <div id="timerText" style="font-size: 1.25rem; color: #6c7a89;">0:00</div>
                    <div id="cycleText" style="font-size: 1rem; color: #95a5a6; margin-top: 8px;">
                        Ciclo 0/${this.totalCycles}
                    </div>
                </div>
                
                <div style="display: flex; gap: 16px; justify-content: center;">
                    <button id="startBreathing" class="btn-primary">▶️ Comenzar</button>
                    <button id="stopBreathing" class="btn-primary" style="background: #6c7a89;">⏸️ Pausar</button>
                    <button id="resetBreathing" class="btn-primary" style="background: #95a5a6;">🔄 Reiniciar</button>
                </div>
                
                <div style="margin-top: 24px;">
                    <button id="backFromBreathing" class="btn-secondary">
                        ← Volver a juegos
                    </button>
                </div>
            </div>
        `;
        
        this.canvas = document.getElementById('breathingCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.drawCircle(this.circleMin);
        
        document.getElementById('startBreathing').addEventListener('click', this.start);
        document.getElementById('stopBreathing').addEventListener('click', this.stop);
        document.getElementById('resetBreathing').addEventListener('click', this.reset);
        
        document.getElementById('backFromBreathing').addEventListener('click', () => {
            this.cleanup();
            if (window.app && window.app.router) {
                window.app.router.showGamesView();
            }
        });
    }
    
    drawCircle(radius) {
        this.ctx.clearRect(0, 0, this.canvasSize, this.canvasSize);
        
        const gradient = this.ctx.createRadialGradient(
            this.canvasSize/2, this.canvasSize/2, radius * 0.3,
            this.canvasSize/2, this.canvasSize/2, radius
        );
        
        const phase = this.phases[this.currentPhase];
        gradient.addColorStop(0, phase.color);
        gradient.addColorStop(1, this.adjustColor(phase.color, -30));
        
        this.ctx.beginPath();
        this.ctx.arc(this.canvasSize/2, this.canvasSize/2, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        this.ctx.font = 'bold 24px Inter, sans-serif';
        this.ctx.fillStyle = phase.textColor;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(phase.name, this.canvasSize/2, this.canvasSize/2);
    }
    
    adjustColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const r = Math.min(255, Math.max(0, (num >> 16) + percent));
        const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + percent));
        const b = Math.min(255, Math.max(0, (num & 0x0000FF) + percent));
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }
    
    start() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.phaseStartTime = performance.now() / 1000;
        this.animate();
        document.getElementById('startBreathing').disabled = true;
        document.getElementById('startBreathing').style.opacity = '0.6';
    }
    
    stop() {
        this.isPlaying = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        document.getElementById('startBreathing').disabled = false;
        document.getElementById('startBreathing').style.opacity = '1';
    }
    
    reset() {
        this.stop();
        this.currentPhase = 0;
        this.cycleCount = 0;
        this.currentRadius = this.circleMin;
        this.drawCircle(this.circleMin);
        document.getElementById('phaseText').textContent = 'Listo';
        document.getElementById('timerText').textContent = '0:00';
        document.getElementById('cycleText').textContent = `Ciclo 0/${this.totalCycles}`;
    }
    
    animate() {
        if (!this.isPlaying) return;
        
        const now = performance.now() / 1000;
        const elapsed = now - this.phaseStartTime;
        const currentPhaseData = this.phases[this.currentPhase];
        
        this.phaseProgress = Math.min(elapsed / currentPhaseData.duration, 1);
        
        if (this.currentPhase === 0) {
            this.currentRadius = this.circleMin + (this.circleMax - this.circleMin) * this.phaseProgress;
        } else if (this.currentPhase === 1) {
            this.currentRadius = this.circleMax;
        } else {
            this.currentRadius = this.circleMax - (this.circleMax - this.circleMin) * this.phaseProgress;
        }
        
        this.drawCircle(this.currentRadius);
        
        const timeLeft = Math.ceil(currentPhaseData.duration - elapsed);
        document.getElementById('phaseText').textContent = currentPhaseData.name;
        document.getElementById('timerText').textContent = `${timeLeft}s`;
        
        if (this.phaseProgress >= 1) {
            this.nextPhase();
        }
        
        this.animationFrame = requestAnimationFrame(this.animate);
    }
    
    nextPhase() {
        this.currentPhase++;
        if (this.currentPhase >= this.phases.length) {
            this.currentPhase = 0;
            this.cycleCount++;
            document.getElementById('cycleText').textContent = `Ciclo ${this.cycleCount}/${this.totalCycles}`;
            if (this.cycleCount >= this.totalCycles) {
                this.completeGame();
                return;
            }
        }
        this.phaseStartTime = performance.now() / 1000;
    }
    
    completeGame() {
        this.stop();
        document.getElementById('phaseText').textContent = '¡Completado!';
        document.getElementById('timerText').textContent = '✨';
        
        if (window.app && window.app.anxietyState) {
            const newLevel = window.app.anxietyState.reduceLevel(this.gameName);
            const toast = document.createElement('div');
            toast.className = 'affirmation-toast';
            toast.innerText = '🌬️ ¡Respiración completada! Tu ansiedad ha disminuido.';
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
            
            if (newLevel === 0) {
                setTimeout(() => {
                    if (window.app && window.app.router) {
                        window.app.router.showVictoryMessage();
                    }
                }, 1500);
            } else {
                setTimeout(() => {
                    if (window.app && window.app.router) {
                        window.app.router.showGamesView();
                    }
                }, 2000);
            }
        }
    }
    
    cleanup() {
        this.stop();
        // 🆕 Registrar salida con duración
        const duration = Math.round((Date.now() - this.startTime) / 1000);
        import('../engine/logger.js').then(module => {
            module.Logger.logGameVisit(this.gameName, duration);
        });
        if (this.canvas) {
            this.ctx.clearRect(0, 0, this.canvasSize, this.canvasSize);
        }
    }
}

export function initBreathing(container) {
    const game = new BreathingGame(container);
    game.render();
    return game;
}