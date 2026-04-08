// js/games/memoryGame.js
// Juego de Memorama - Ayuda a desviar la atención y ejercitar la memoria
// 8 pares de emojis calmantes

export class MemoryGame {
    constructor(container) {
        this.container = container;
        
        // Emojis terapéuticos y calmantes
        this.emojis = [
            '🌿', '🌸', '🦋', '🌙',  // Naturaleza y calma
            '⭐', '☁️', '🌈', '🕊️'   // Paz y serenidad
        ];
        
        // Duplicar para crear pares
        this.cards = [...this.emojis, ...this.emojis];
        
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.canFlip = true;
        this.gameCompleted = false;
    }
    
    render() {
        // Barajar cartas
        this.shuffleCards();
        
        this.container.innerHTML = `
            <div class="memory-game">
                <h2 class="text-center" style="margin-bottom: 8px;">
                    <span style="background: linear-gradient(135deg, #f59e0b, #8b5cf6); -webkit-background-clip: text; background-clip: text; color: transparent;">
                        🎴 Memorama Calmante
                    </span>
                </h2>
                <p class="text-center" style="color: #94a3b8; margin-bottom: 24px;">
                    Encuentra los pares. Tómate tu tiempo.
                </p>
                
                <!-- Panel de estadísticas -->
                <div class="memory-stats">
                    <div class="stat-item">
                        <span class="stat-icon">🎯</span>
                        <span class="stat-label">Movimientos</span>
                        <span class="stat-value" id="movesCount">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-icon">✅</span>
                        <span class="stat-label">Pares</span>
                        <span class="stat-value" id="pairsCount">0/${this.emojis.length}</span>
                    </div>
                </div>
                
                <!-- Grid del memorama -->
                <div class="memory-grid" id="memoryGrid">
                    ${this.cards.map((emoji, index) => `
                        <div class="memory-card" data-index="${index}" data-emoji="${emoji}">
                            <div class="card-front">❓</div>
                            <div class="card-back">${emoji}</div>
                        </div>
                    `).join('')}
                </div>
                
                <!-- Botones de control -->
                <div style="display: flex; gap: 16px; justify-content: center; margin-top: 32px;">
                    <button id="resetMemory" class="btn-secondary">
                        🔄 Reiniciar
                    </button>
                    <button id="backFromMemory" class="btn-secondary">
                        ← Volver
                    </button>
                </div>
            </div>
        `;
        
        this.attachEvents();
    }
    
    shuffleCards() {
        // Algoritmo Fisher-Yates
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }
    
    attachEvents() {
        const cards = document.querySelectorAll('.memory-card');
        const resetBtn = document.getElementById('resetMemory');
        const backBtn = document.getElementById('backFromMemory');
        
        cards.forEach(card => {
            card.addEventListener('click', () => {
                const index = parseInt(card.dataset.index);
                this.flipCard(card, index);
            });
        });
        
        resetBtn?.addEventListener('click', () => {
            this.resetGame();
        });
        
        backBtn?.addEventListener('click', () => {
            if (window.app && window.app.router) {
                window.app.router.showGamesView();
            }
        });
    }
    
    flipCard(card, index) {
        // Validaciones
        if (!this.canFlip || this.gameCompleted) return;
        if (card.classList.contains('flipped')) return;
        if (card.classList.contains('matched')) return;
        if (this.flippedCards.length >= 2) return;
        
        // Voltear carta
        card.classList.add('flipped');
        this.flippedCards.push({ card, index });
        
        // Reproducir sonido suave (opcional - placeholder)
        this.playFlipSound();
        
        // Si hay 2 cartas volteadas, verificar par
        if (this.flippedCards.length === 2) {
            this.canFlip = false;
            this.moves++;
            this.updateStats();
            
            setTimeout(() => {
                this.checkMatch();
            }, 600);
        }
    }
    
    checkMatch() {
        const [card1, card2] = this.flippedCards;
        const emoji1 = card1.card.dataset.emoji;
        const emoji2 = card2.card.dataset.emoji;
        const index1 = card1.index;
        const index2 = card2.index;
        
        if (emoji1 === emoji2 && index1 !== index2) {
            // ¡Es un par!
            card1.card.classList.add('matched');
            card2.card.classList.add('matched');
            this.matchedPairs++;
            
            // Efecto visual de éxito
            this.showMatchEffect(card1.card);
            this.showMatchEffect(card2.card);
            
            this.updateStats();
            
            // Verificar si completó el juego
            if (this.matchedPairs === this.emojis.length) {
                this.completeGame();
            }
        } else {
            // No es par, voltear de vuelta
            setTimeout(() => {
                card1.card.classList.remove('flipped');
                card2.card.classList.remove('flipped');
            }, 200);
        }
        
        // Limpiar array de cartas volteadas
        this.flippedCards = [];
        
        // Permitir voltear de nuevo
        setTimeout(() => {
            this.canFlip = true;
        }, 600);
    }
    
    showMatchEffect(card) {
        // Efecto de brillo temporal
        card.style.boxShadow = '0 0 30px #10b981';
        setTimeout(() => {
            card.style.boxShadow = '';
        }, 500);
    }
    
    playFlipSound() {
        // Placeholder para sonido (se implementará con Howler.js)
        // Por ahora solo un console.log suave
        console.log('🎴 Flip!');
    }
    
    updateStats() {
        const movesEl = document.getElementById('movesCount');
        const pairsEl = document.getElementById('pairsCount');
        
        if (movesEl) {
            movesEl.textContent = this.moves;
        }
        
        if (pairsEl) {
            pairsEl.textContent = `${this.matchedPairs}/${this.emojis.length}`;
        }
    }
    
    resetGame() {
        // Resetear estado
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.canFlip = true;
        this.gameCompleted = false;
        
        // Volver a barajar
        this.shuffleCards();
        
        // Re-renderizar
        this.render();
        
        this.showToast('🔄 Juego reiniciado', 'info');
    }
    
    completeGame() {
        this.gameCompleted = true;
        
        // Mostrar mensaje de victoria
        setTimeout(() => {
            const grid = document.getElementById('memoryGrid');
            if (grid) {
                grid.insertAdjacentHTML('afterend', `
                    <div class="memory-completion">
                        <div class="completion-message">
                            <span class="completion-emoji">🎉</span>
                            <h3>¡Lo lograste!</h3>
                            <p>Completaste el memorama en ${this.moves} movimientos.</p>
                        </div>
                    </div>
                `);
            }
            
            // Reducir nivel de ansiedad
            if (window.app && window.app.anxietyState) {
                const newLevel = window.app.anxietyState.reduceLevel();
                
                this.showToast('🎴 ¡Memorama completado! Tu mente está más tranquila.', 'success');
                
                if (newLevel === 0) {
                    setTimeout(() => {
                        if (window.app && window.app.router) {
                            window.app.router.showVictoryMessage();
                        }
                    }, 2000);
                }
            }
        }, 500);
    }
    
    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = type === 'success' ? 'grounding-toast-success' : 'grounding-toast-info';
        toast.innerText = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }
}

export function initMemory(container) {
    const game = new MemoryGame(container);
    game.render();
    return game;
}