// js/games/reverseText.js
// Texto al Revés - Ejercicio cognitivo con frases rotadas 180°

export class ReverseText {
    constructor(container) {
        this.container = container;
        
        this.phrases = [
            'este tebs cree que no puedo escribir textos al reves se equivoca',
            'como me encanta la coca zero la tomo todo el tiempo',
            'me antoje ir a comer sushi quiero un sushi',
            'que capa que soy escribiendo textos al reves xd',
            'si puedo escribir este texto bien al reves significa que merezco un premio por lo bien que lo hago y el tebs me invitara lo que yo quiera es un comodin'
        ];
        
        this.currentIndex = 0;
        this.completedCount = 0;
        this.totalPhrases = this.phrases.length;
        
        // 🆕 Logger
        this.gameName = 'Texto al Revés';
        this.startTime = Date.now();
    }
    
    render() {
        // 🆕 Registrar entrada
        import('../engine/logger.js').then(module => {
            module.Logger.logGameVisit(this.gameName);
        });
        
        const phrase = this.phrases[this.currentIndex];
        const progress = (this.completedCount / this.totalPhrases) * 100;
        
        this.container.innerHTML = `
            <div class="reverse-game">
                <h2 class="text-center" style="margin-bottom: 8px;">
                    <span style="background: linear-gradient(135deg, #06b6d4, #8b5cf6); -webkit-background-clip: text; background-clip: text; color: transparent;">
                        🔄 Texto al Revés
                    </span>
                </h2>
                <p class="text-center" style="color: #94a3b8; margin-bottom: 16px;">
                    Lee la frase rotada. ${this.completedCount} de ${this.totalPhrases} completadas
                </p>
                
                <div class="reverse-progress">
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fill" style="width: ${progress}%"></div>
                    </div>
                </div>
                
                <div class="rotated-phrase-container">
                    <div class="rotated-phrase">${phrase}</div>
                    <p class="hint-text">↑ Gira tu cabeza o el dispositivo ↑</p>
                </div>
                
                <div class="reverse-input-area">
                    <input type="text" id="reverseInput" class="reverse-input" 
                           placeholder="Escribe la frase correcta..." autocomplete="off" autofocus>
                    <button id="checkAnswer" class="btn-check" disabled>
                        <span>✓</span> Comprobar
                    </button>
                </div>
                
                <div id="feedbackMessage" class="feedback-message"></div>
                
                <div style="display: flex; gap: 16px; justify-content: center; margin-top: 32px;">
                    <button id="resetReverse" class="btn-secondary">🔄 Reiniciar</button>
                    <button id="backFromReverse" class="btn-secondary">← Volver</button>
                </div>
            </div>
        `;
        
        this.attachEvents();
    }
    
    attachEvents() {
        const input = document.getElementById('reverseInput');
        const checkBtn = document.getElementById('checkAnswer');
        
        if (input) {
            input.addEventListener('input', () => {
                checkBtn.disabled = input.value.trim() === '';
            });
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && input.value.trim() !== '') {
                    this.checkAnswer(input.value.trim());
                }
            });
        }
        
        if (checkBtn) {
            checkBtn.addEventListener('click', () => {
                const answer = input.value.trim();
                if (answer) this.checkAnswer(answer);
            });
        }
        
        document.getElementById('resetReverse')?.addEventListener('click', () => this.resetGame());
        document.getElementById('backFromReverse')?.addEventListener('click', () => {
            this.cleanup();
            if (window.app && window.app.router) {
                window.app.router.showGamesView();
            }
        });
    }
    
    checkAnswer(answer) {
        const phrase = this.phrases[this.currentIndex];
        const feedback = document.getElementById('feedbackMessage');
        const input = document.getElementById('reverseInput');
        const checkBtn = document.getElementById('checkAnswer');
        
        const normalizedAnswer = answer.toLowerCase().trim();
        const normalizedOriginal = phrase.toLowerCase();
        
        if (normalizedAnswer === normalizedOriginal) {
            feedback.textContent = '✅ ¡Correcto!';
            feedback.className = 'feedback-message success';
            this.completedCount++;
            
            if (this.completedCount >= this.totalPhrases) {
                this.completeGame();
                return;
            }
            
            this.currentIndex++;
            setTimeout(() => this.render(), 800);
            this.showToast(`✨ ¡Bien! ${this.completedCount} de ${this.totalPhrases}`, 'success');
        } else {
            feedback.textContent = '❌ No es correcto, intenta de nuevo';
            feedback.className = 'feedback-message error';
            input.value = '';
            checkBtn.disabled = true;
            input.focus();
            setTimeout(() => { feedback.textContent = ''; }, 2000);
        }
    }
    
    resetGame() {
        this.currentIndex = 0;
        this.completedCount = 0;
        this.render();
        this.showToast('🔄 Juego reiniciado', 'info');
    }
    
    completeGame() {
        this.container.innerHTML = `
            <div class="completion-celebration">
                <div class="celebration-emoji">🎉</div>
                <h3>¡Todas las frases descifradas!</h3>
                <p>Has ejercitado tu mente y desviado la atención.</p>
                <div class="completed-phrases">
                    ${this.phrases.map(p => `
                        <div class="phrase-item">
                            <span class="rotated-small">${p}</span>
                            <span class="arrow">→</span>
                            <span class="original-small">${p}</span>
                        </div>
                    `).join('')}
                </div>
                <div style="margin-top: 32px;">
                    <button id="backAfterReverse" class="btn-primary" style="background: linear-gradient(135deg, #06b6d4, #8b5cf6);">
                        ← Volver a juegos
                    </button>
                </div>
            </div>
        `;
        
        if (window.app && window.app.anxietyState) {
            const newLevel = window.app.anxietyState.reduceLevel(this.gameName);
            this.showToast('🧠 ¡Ejercicio completado! Tu mente está más clara.', 'success');
            if (newLevel === 0) {
                setTimeout(() => {
                    if (window.app && window.app.router) {
                        window.app.router.showVictoryMessage();
                    }
                }, 2000);
            }
        }
        
        document.getElementById('backAfterReverse')?.addEventListener('click', () => {
            if (window.app && window.app.router) {
                window.app.router.showGamesView();
            }
        });
    }
    
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = type === 'success' ? 'grounding-toast-success' : 'grounding-toast-info';
        toast.innerText = message;
        document.body.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 2000);
    }
    
    cleanup() {
        // 🆕 Registrar salida con duración
        const duration = Math.round((Date.now() - this.startTime) / 1000);
        import('../engine/logger.js').then(module => {
            module.Logger.logGameVisit(this.gameName, duration);
        });
    }
}

export function initReverseText(container) {
    const game = new ReverseText(container);
    game.render();
    return game;
}