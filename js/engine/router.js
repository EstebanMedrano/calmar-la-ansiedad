export class Router {
    constructor() {
        this.container = document.getElementById('viewContainer');
    }
    
    showWelcomeView() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="welcome-card">
                <h2>Hola mi Luuu, ¿cómo te sientes?</h2>
                <p>Este es tu espacio seguro. Sin prisas. Sacalo todo mi Lu, no estaras sola :).</p>
                <div class="emojis-scale" id="emojisScale"></div>
                <button id="startBtn" class="btn-primary" disabled style="opacity: 0.5;">Comenzar</button>
                <p id="selectHint" style="color: #94a3b8; font-size: 0.875rem; margin-top: 12px; min-height: 20px;"></p>
            </div>
        `;
        
        // Generar emojis del 1 al 10
        const scaleContainer = document.getElementById('emojisScale');
        const startBtn = document.getElementById('startBtn');
        const selectHint = document.getElementById('selectHint');
        
        if (scaleContainer) {
            for (let i = 1; i <= 10; i++) {
                let emoji = i <= 3 ? '😊' : (i <= 7 ? '😟' : '😰');
                if (i === 10) emoji = '🌋';
                
                const btn = document.createElement('button');
                btn.className = 'emotion-btn';
                btn.innerHTML = `<span class="emotion-emoji">${emoji}</span><span class="emotion-label">${i}</span>`;
                
                btn.addEventListener('click', () => {
                    this.selectLevel(i);
                    
                    // Habilitar botón de comenzar
                    if (startBtn) {
                        startBtn.disabled = false;
                        startBtn.style.opacity = '1';
                    }
                    
                    // Ocultar hint
                    if (selectHint) {
                        selectHint.textContent = '';
                    }
                });
                
                scaleContainer.appendChild(btn);
            }
        }
        
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                // Verificar si se seleccionó un nivel
                if (window.app && window.app.anxietyState) {
                    const level = window.app.anxietyState.getLevel();
                    if (level > 0) {
                        this.showGamesView();
                    } else {
                        if (selectHint) {
                            selectHint.textContent = '⭐ Por favor, selecciona cómo te sientes primero';
                            selectHint.style.color = '#f59e0b';
                        }
                    }
                } else {
                    this.showGamesView();
                }
            });
        }
    }
    
    selectLevel(level) {
        if (window.app && window.app.anxietyState) {
            window.app.anxietyState.setLevel(level);
            console.log(`Nivel de ansiedad seleccionado: ${level}`);
            
            // Mostrar feedback visual
            const allBtns = document.querySelectorAll('.emotion-btn');
            allBtns.forEach(btn => {
                btn.style.opacity = '0.5';
            });
             // Agregar 'selected' al clickeado
            const clickedBtn = event.target.closest('.emotion-btn');
            if (clickedBtn) {
                clickedBtn.classList.add('selected');
            }
            event.target.closest('.emotion-btn').style.opacity = '1';
            event.target.closest('.emotion-btn').style.transform = 'scale(1.05)';
        }
    }
    
    showGamesView() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="games-view">
                <h2 class="text-center">¿Qué necesitas ahora?</h2>
                <div class="games-grid">
                    <div class="game-card" data-game="breathing">
                        <div class="game-icon">🌬️</div>
                        <div class="game-title">Respirar</div>
                        <div class="game-description">Respiremos juntos Lu, te ayudaré</div>
                    </div>
                    <div class="game-card" data-game="grounding">
                        <div class="game-icon">🫂</div>
                        <div class="game-title">Sentirme segura</div>
                        <div class="game-description">vamos a familiarizarte con tu entorno</div>
                    </div>
                    <div class="game-card" data-game="memory">
                        <div class="game-icon">🎴</div>
                        <div class="game-title">Memorama</div>
                        <div class="game-description">Encuentra los pareeeees</div>
                    </div>
                    <div class="game-card" data-game="water">
                        <div class="game-icon">🌊</div>
                        <div class="game-title">Lago de Calma</div>
                        <div class="game-description">Tito? Lia?</div>
                    </div>
                    <div class="game-card" data-game="hurricane">
                        <div class="game-icon">🌀</div>
                        <div class="game-title">Huracán</div>
                        <div class="game-description">Destruye esos pensamientos Lu</div>
                    </div>
                    <div class="game-card" data-game="ritual">
                        <div class="game-icon">🔥</div>
                        <div class="game-title">Ritual de Soltar</div>
                        <div class="game-description">Escribe, guarda, quema</div>
                    </div>
                    <div class="game-card" data-game="reverse">
                        <div class="game-icon">🔄</div>
                        <div class="game-title">Texto al Revés</div>
                        <div class="game-description">Aver decifra la frase</div>
                    </div>
                    <div class="game-card" data-game="rompecabezas">
                        <div class="game-icon">🧩</div>
                        <div class="game-title">Rompecabezas</div>
                        <div class="game-description">Una mision que se arma</div>
                    </div>
                    <div class="game-card" data-game="carta">
                        <div class="game-icon">💌</div>
                        <div class="game-title">¿Una carta?</div>
                        <div class="game-description">Tambien aqui te escribi una carta</div>
                    </div>
                </div>
                <div class="text-center" style="margin-top: 32px;">
                    <button id="backToWelcome" class="btn-primary" style="background: #6c7a89;">Volver al inicio</button>
                </div>
            </div>
        `;
        
        // Agregar event listeners a las tarjetas
        document.querySelectorAll('.game-card').forEach(card => {
            card.addEventListener('click', () => {
                const game = card.dataset.game;
                this.showGameInProgress(game);
            });
        });
        
        const backBtn = document.getElementById('backToWelcome');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.showWelcomeView();
            });
        }
    }
    
    showGameInProgress(gameName) {
        if (!this.container) return;
    
        // Limpiar container
        this.container.innerHTML = '';
    
        switch(gameName) {
            case 'breathing':
                // Import dinámico para cargar el juego de respiración
                import('../games/breathing.js')
                    .then(module => {
                       module.initBreathing(this.container);
                    })
                    .catch(err => {
                        console.error('Error cargando juego de respiración:', err);
                        this.container.innerHTML = `
                            <div class="text-center">
                                <h2>Error</h2>
                                <p>No se pudo cargar el juego. Intenta de nuevo.</p>
                                <button id="backToGames" class="btn-primary">← Volver</button>
                            </div>
                        `;
                        document.getElementById('backToGames')?.addEventListener('click', () => {
                            this.showGamesView();
                        });
                    });
                break;
                    
            case 'grounding':
            import('../games/ground54321.js')
                .then(module => {
                    module.initGrounding(this.container);
                })
                .catch(err => {
                    console.error('Error cargando grounding:', err);
                    this.container.innerHTML = `
                        <div class="text-center">
                            <h2>Error</h2>
                            <p>No se pudo cargar el juego.</p>
                            <button id="backToGames" class="btn-primary">← Volver</button>
                        </div>
                    `;
                    document.getElementById('backToGames')?.addEventListener('click', () => {
                        this.showGamesView();
                    });
                });
            break;
            
            case 'memory':
                import('../games/memoryGame.js')
                    .then(module => {
                        module.initMemory(this.container);
                    })
                    .catch(err => {
                        console.error('Error cargando memorama:', err);
                        this.container.innerHTML = `
                            <div class="text-center">
                                <h2>Error</h2>
                                <p>No se pudo cargar el juego.</p>
                                <button id="backToGames" class="btn-primary">← Volver</button>
                            </div>
                        `;
                        document.getElementById('backToGames')?.addEventListener('click', () => {
                            this.showGamesView();
                        });
                    });
                break;
            
            case 'water':
                import('../games/waterCalm.js')
                    .then(module => {
                        module.initWaterCalm(this.container);
                    })
                    .catch(err => {
                        console.error('Error cargando lago:', err);
                        this.container.innerHTML = `<div class="text-center"><h2>Error</h2><p>No se pudo cargar.</p><button id="backToGames" class="btn-primary">← Volver</button></div>`;
                        document.getElementById('backToGames')?.addEventListener('click', () => this.showGamesView());
                    });
                break;
            case 'hurricane':
                import('../games/hurricane.js')
                    .then(module => {
                        module.initHurricane(this.container);
                    })
                    .catch(err => {
                        console.error('Error cargando huracán:', err);
                        this.container.innerHTML = `<div class="text-center"><h2>Error</h2><p>No se pudo cargar.</p><button id="backToGames" class="btn-primary">← Volver</button></div>`;
                        document.getElementById('backToGames')?.addEventListener('click', () => this.showGamesView());
                    });
                break;
            case 'ritual':
                import('../games/ritualFire.js')
                    .then(module => {
                        module.initRitualFire(this.container);
                    })
                    .catch(err => {
                        console.error('Error cargando ritual:', err);
                        this.container.innerHTML = `<div class="text-center"><h2>Error</h2><p>No se pudo cargar.</p><button id="backToGames" class="btn-primary">← Volver</button></div>`;
                        document.getElementById('backToGames')?.addEventListener('click', () => this.showGamesView());
                    });
                break;
            case 'reverse':
                import('../games/reverseText.js')
                    .then(module => {
                        module.initReverseText(this.container);
                    })
                    .catch(err => {
                        console.error('Error cargando texto al revés:', err);
                        this.container.innerHTML = `<div class="text-center"><h2>Error</h2><p>No se pudo cargar.</p><button id="backToGames" class="btn-primary">← Volver</button></div>`;
                        document.getElementById('backToGames')?.addEventListener('click', () => this.showGamesView());
                    });
                break;
            case 'rompecabezas':
                import('../games/rompecabezasDeLu.js')
                    .then(module => module.initRompecabezasDeLu(this.container))
                    .catch(err => {
                        console.error('Error cargando rompecabezas:', err);
                        this.container.innerHTML = `<div class="text-center"><h2>Error</h2><p>No se pudo cargar.</p><button id="backToGames" class="btn-primary">← Volver</button></div>`;
                        document.getElementById('backToGames')?.addEventListener('click', () => this.showGamesView());
                    });
                break;
            case 'carta':
                import('../games/cartaParaLu.js')
                    .then(module => {
                        module.initCartaParaLu(this.container);
                    })
                    .catch(err => {
                        console.error('Error cargando carta:', err);
                        this.container.innerHTML = `<div class="text-center"><h2>Error</h2><p>No se pudo cargar.</p><button id="backToGames" class="btn-primary">← Volver</button></div>`;
                        document.getElementById('backToGames')?.addEventListener('click', () => this.showGamesView());
                    });
                break;
                this.showGamesView();
        }
    }
    
    showVictoryMessage() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="text-center" style="padding: 60px 20px;">
                <div style="font-size: 5rem; margin-bottom: 24px;">🎉</div>
                <h2 style="color: #5e63b6; margin-bottom: 16px;">¡Lo lograste!</h2>
                <p style="font-size: 1.25rem; margin-bottom: 32px;">Has reducido tu ansiedad a cero.</p>
                <p style="margin-bottom: 32px;">Respira profundo. Estás bien. Este momento es tuyo.</p>
                <button id="resetBtn" class="btn-primary">Comenzar de nuevo</button>
            </div>
        `;
        
        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (window.app && window.app.anxietyState) {
                    window.app.anxietyState.setLevel(0);
                }
                this.showWelcomeView();
            });
        }
    }
}