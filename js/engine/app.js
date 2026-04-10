import { AnxietyState } from './anxietyState.js';
import { Router } from './router.js';

class App {
    constructor() {
        this.anxietyState = new AnxietyState();
        this.router = new Router();
        this.init();
    }
    
    init() {
        console.log('🌿 Espacio de Calma iniciado');
        
        // Mostrar la vista de bienvenida
        this.router.showWelcomeView();
        
        // Configurar botones del footer
        this.setupFooterButtons();
        
        // Configurar modal de estadísticas
        this.setupStatsModal();

        // 🍔 NUEVO: Configurar menú hamburguesa
        this.setupMenu();
    }
    
    setupFooterButtons() {
        const musicBtn = document.getElementById('toggleMusicBtn');
        const voiceBtn = document.getElementById('voiceGuideBtn');
        const statsBtn = document.getElementById('statsBtn');
        
        // Inicializar SoundManager
        if (!this.soundManager) {
            import('./soundManager.js').then(module => {
                this.soundManager = module.getSoundManager();
            });
        }
        
        if (musicBtn) {
            musicBtn.addEventListener('click', () => {
                if (!this.soundManager) {
                    import('./soundManager.js').then(module => {
                        this.soundManager = module.getSoundManager();
                        this.soundManager.toggleMusic();
                    });
                } else {
                    this.soundManager.toggleMusic();
                }
            });
        }
        
        if (voiceBtn) {
            voiceBtn.addEventListener('click', () => {
                import('./speechManager.js').then(module => {
                    const speech = module.getSpeechManager();
                    const isEnabled = speech.toggle();
                    
                    const toast = document.createElement('div');
                    toast.className = 'affirmation-toast';
                    toast.innerText = isEnabled ? '🗣️ Guía por voz activada' : '🔇 Guía por voz desactivada';
                    document.body.appendChild(toast);
                    setTimeout(() => toast.remove(), 2000);
                });
            });
        }
        
        if (statsBtn) {
            statsBtn.addEventListener('click', () => {
                this.showStatsModal();
            });
        }
    }

    showStatsModal() {
        const modal = document.getElementById('statsModal');
        const statsContent = document.getElementById('statsContent');
        
        if (statsContent) {
            const historial = JSON.parse(localStorage.getItem('calma_historial') || '[]');
            
            if (historial.length === 0) {
                statsContent.innerHTML = `
                    <div style="text-align: center; padding: 20px;">
                        <span style="font-size: 3rem; display: block; margin-bottom: 16px;">📊</span>
                        <p style="color: #94a3b8;">Aún no hay estadísticas.</p>
                        <p style="color: #94a3b8; font-size: 0.875rem; margin-top: 8px;">Completa algunos ejercicios para ver tu progreso.</p>
                    </div>
                `;
            } else {
                // Calcular estadísticas
                const totalSesiones = historial.length;
                const mejoraTotal = historial.reduce((sum, s) => sum + (s.mejora || 0), 0);
                const nivelPromedio = (historial.reduce((sum, s) => sum + s.nivelInicial, 0) / totalSesiones).toFixed(1);
                
                // Juego más usado
                const juegoCount = {};
                historial.forEach(s => {
                    const juego = s.juego || 'general';
                    juegoCount[juego] = (juegoCount[juego] || 0) + 1;
                });
                const juegoMasUsado = Object.entries(juegoCount).sort((a, b) => b[1] - a[1])[0];
                
                // Última sesión
                const ultima = historial[historial.length - 1];
                const fechaUltima = new Date(ultima.fecha).toLocaleDateString('es-ES', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                });
                
                statsContent.innerHTML = `
                    <div style="margin-bottom: 20px;">
                        <div style="display: flex; justify-content: space-around; text-align: center;">
                            <div>
                                <div style="font-size: 2rem; font-weight: bold; color: #10b981;">${totalSesiones}</div>
                                <div style="font-size: 0.75rem; color: #94a3b8;">Sesiones</div>
                            </div>
                            <div>
                                <div style="font-size: 2rem; font-weight: bold; color: #8b5cf6;">${mejoraTotal}</div>
                                <div style="font-size: 0.75rem; color: #94a3b8;">Puntos mejorados</div>
                            </div>
                            <div>
                                <div style="font-size: 2rem; font-weight: bold; color: #f59e0b;">${nivelPromedio}</div>
                                <div style="font-size: 0.75rem; color: #94a3b8;">Nivel promedio</div>
                            </div>
                        </div>
                    </div>
                    
                    <hr style="margin: 16px 0; border-color: rgba(255,255,255,0.1);">
                    
                    <p style="margin-bottom: 8px;"><strong>🎮 Juego más usado:</strong></p>
                    <p style="color: #06b6d4; margin-bottom: 16px;">${juegoMasUsado ? juegoMasUsado[0] : '---'} (${juegoMasUsado ? juegoMasUsado[1] : 0} veces)</p>
                    
                    <p style="margin-bottom: 8px;"><strong>🕐 Última sesión:</strong></p>
                    <p style="color: #94a3b8; font-size: 0.875rem;">${fechaUltima}</p>
                    <p style="color: #94a3b8; font-size: 0.875rem;">${ultima.juego || 'general'} • Mejora: ${ultima.mejora || 0} pts</p>
                    
                    <hr style="margin: 16px 0; border-color: rgba(255,255,255,0.1);">
                    
                    <button id="clearStats" class="btn-secondary" style="width: 100%; padding: 8px; font-size: 0.75rem;">
                        🗑️ Reiniciar estadísticas
                    </button>
                `;
                
                document.getElementById('clearStats')?.addEventListener('click', () => {
                    if (confirm('¿Borrar todo el historial de estadísticas?')) {
                        localStorage.removeItem('calma_historial');
                        this.showStatsModal();
                    }
                });
            }
        }
        
        if (modal) modal.style.display = 'flex';
    }
    
    setupStatsModal() {
        const modal = document.getElementById('statsModal');
        const closeBtn = document.querySelector('.modal-close');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (modal) modal.style.display = 'none';
            });
        }
        
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.style.display = 'none';
            });
        }
    }
    
    saveSession(initialLevel, finalLevel) {
        const historial = JSON.parse(localStorage.getItem('calma_historial') || '[]');
        historial.push({
            fecha: new Date().toISOString(),
            nivelInicial: initialLevel,
            nivelFinal: finalLevel,
            mejora: initialLevel - finalLevel
        });
        
        // Guardar solo últimas 20 sesiones
        if (historial.length > 20) historial.shift();
        localStorage.setItem('calma_historial', JSON.stringify(historial));
    }

    setupMenu() {
        const menuBtn = document.getElementById('menuBtn');
        if (!menuBtn) return;
        
        menuBtn.addEventListener('click', () => {
            // Crear menú flotante
            const menu = document.createElement('div');
            menu.className = 'floating-menu';
            menu.innerHTML = `
                <div class="menu-overlay"></div>
                <div class="menu-content">
                    <h3>🌿 Espacio de Calma</h3>
                    <button id="menuReset" class="menu-item">
                        <span>🔄</span> Reiniciar sesión
                    </button>
                    <button id="menuStats" class="menu-item">
                        <span>📊</span> Ver estadísticas
                    </button>
                    <button id="menuAbout" class="menu-item">
                        <span>ℹ️</span> Acerca de
                    </button>
                    <div class="menu-divider"></div>
                    <button id="menuClose" class="menu-item">
                        <span>✕</span> Cerrar
                    </button>
                </div>
            `;
            
            document.body.appendChild(menu);
            
            // Event listeners
            document.getElementById('menuReset').addEventListener('click', () => {
                if (this.anxietyState) {
                    this.anxietyState.setLevel(0);
                }
                this.router.showWelcomeView();
                menu.remove();
            });
            
            document.getElementById('menuStats').addEventListener('click', () => {
                this.showStatsModal();
                menu.remove();
            });
            
            document.getElementById('menuAbout').addEventListener('click', () => {
                alert('🌿 Espacio de Calma v1.0\n\nCreado con 💜 para Lu\n\nUn refugio interactivo para manejar la ansiedad con técnicas neurocientíficas.');
                menu.remove();
            });
            
            document.getElementById('menuClose').addEventListener('click', () => {
                menu.remove();
            });
            
            document.querySelector('.menu-overlay').addEventListener('click', () => {
                menu.remove();
            });
        });
    }
}

// Inicializar la app cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});