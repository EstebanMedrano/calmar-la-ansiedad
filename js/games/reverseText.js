// js/games/reverseText.js
// Texto al Revés - Ejercicio cognitivo con frases rotadas 180°
// 5 frases positivas para descifrar

export class ReverseText {
    constructor(container) {
        this.container = container;
        
        // Frases positivas (se mostrarán rotadas 180°)
        this.phrases = [
            'todo pasa',
            'estoy a salvo',
            'respira profundo',
            'confío en mí',
            'soy suficiente'
        ];
        
        this.currentIndex = 0;
        this.completedCount = 0;
        this.totalPhrases = this.phrases.length;
    }
    
    render() {
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
                
                <!-- Progreso -->
                <div class="reverse-progress">
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fill" style="width: ${progress}%"></div>
                    </div>
                </div>
                
                <!-- Frase rotada 180° -->
                <div class="rotated-phrase-container">
                    <div class="rotated-phrase">${phrase}</div>
                    <p class="hint-text">↑ Gira tu cabeza o el dispositivo ↑</p>
                </div>
                
                <!-- Input -->
                <div class="reverse-input-area">
                    <input 
                        type="text" 
                        id="reverseInput" 
                        class="reverse-input" 
                        placeholder="Escribe la frase correcta..."
                        autocomplete="off"
                        autofocus
                    >
                    <button id="checkAnswer" class="btn-check" disabled>
                        <span>✓</span> Comprobar
                    </button>
                </div>
                
                <!-- Mensaje de feedback -->
                <div id="feedbackMessage" class="feedback-message"></div>
                
                <!-- Botones -->
                <div style="display: flex; gap: 16px; justify-content: center; margin-top: 32px;">
                    <button id="resetReverse" class="btn-secondary">
                        🔄 Reiniciar
                    </button>
                    <button id="backFromReverse" class="btn-secondary">
                        ← Volver
                    </button>
                </div>
            </div>
        `;
        
        this.attachEvents();
    }
    
    attachEvents() {
        const input = document.getElementById('reverseInput');
        const checkBtn = document.getElementById('checkAnswer');
        
        // Habilitar/deshabilitar botón
        if (input) {
            input.addEventListener('input', () => {
                checkBtn.disabled = input.value.trim() === '';
            });
            
            // Enter para comprobar
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && input.value.trim() !== '') {
                    this.checkAnswer(input.value.trim());
                }
            });
        }
        
        // Comprobar respuesta
        if (checkBtn) {
            checkBtn.addEventListener('click', () => {
                const answer = input.value.trim();
                if (answer) {
                    this.checkAnswer(answer);
                }
            });
        }
        
        // Reiniciar
        document.getElementById('resetReverse')?.addEventListener('click', () => {
            this.resetGame();
        });
        
        // Volver
        document.getElementById('backFromReverse')?.addEventListener('click', () => {
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
        
        // Normalizar (minúsculas, sin espacios extra)
        const normalizedAnswer = answer.toLowerCase().trim();
        const normalizedOriginal = phrase.toLowerCase();
        
        if (normalizedAnswer === normalizedOriginal) {
            // ¡Correcto!
            feedback.textContent = '✅ ¡Correcto!';
            feedback.className = 'feedback-message success';
            
            this.completedCount++;
            
            if (this.completedCount >= this.totalPhrases) {
                this.completeGame();
                return;
            }
            
            // Avanzar a siguiente frase
            this.currentIndex++;
            
            // Actualizar UI
            setTimeout(() => {
                this.render();
            }, 800);
            
            this.showToast(`✨ ¡Bien! ${this.completedCount} de ${this.totalPhrases}`, 'success');
            
        } else {
            // Incorrecto
            feedback.textContent = '❌ No es correcto, intenta de nuevo';
            feedback.className = 'feedback-message error';
            
            input.value = '';
            checkBtn.disabled = true;
            input.focus();
            
            // Limpiar mensaje después de 2 segundos
            setTimeout(() => {
                feedback.textContent = '';
            }, 2000);
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
        
        // Reducir ansiedad
        if (window.app && window.app.anxietyState) {
            const newLevel = window.app.anxietyState.reduceLevel('Texto al Revés');
            
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
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }
}

export function initReverseText(container) {
    const game = new ReverseText(container);
    game.render();
    return game;
}