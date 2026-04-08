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
    }
    
    setupFooterButtons() {
        const musicBtn = document.getElementById('toggleMusicBtn');
        const voiceBtn = document.getElementById('voiceGuideBtn');
        const statsBtn = document.getElementById('statsBtn');
        
        if (musicBtn) {
            musicBtn.addEventListener('click', () => {
                console.log('Música - próximamente');
                const toast = document.createElement('div');
                toast.className = 'affirmation-toast';
                toast.innerText = '🎵 Música relajante próximamente';
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 2000);
            });
        }
        
        if (voiceBtn) {
            voiceBtn.addEventListener('click', () => {
                console.log('Guía por voz');
                const toast = document.createElement('div');
                toast.className = 'affirmation-toast';
                toast.innerText = '🗣️ La guía por voz estará disponible pronto';
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 2000);
            });
        }
        
        if (statsBtn) {
            statsBtn.addEventListener('click', () => {
                const modal = document.getElementById('statsModal');
                const statsContent = document.getElementById('statsContent');
                
                if (statsContent) {
                    const historial = JSON.parse(localStorage.getItem('calma_historial') || '[]');
                    if (historial.length === 0) {
                        statsContent.innerHTML = '<p>Aún no hay estadísticas. Completa algunos ejercicios primero.</p>';
                    } else {
                        const ultimaSesion = historial[historial.length - 1];
                        statsContent.innerHTML = `
                            <p><strong>Última sesión:</strong></p>
                            <p>Nivel inicial: ${ultimaSesion.nivelInicial || '?'}</p>
                            <p>Nivel final: ${ultimaSesion.nivelFinal || '?'}</p>
                            <p>Mejora: ${(ultimaSesion.nivelInicial - ultimaSesion.nivelFinal) || 0} puntos</p>
                            <hr>
                            <p><strong>Total de sesiones:</strong> ${historial.length}</p>
                        `;
                    }
                }
                
                if (modal) modal.style.display = 'flex';
            });
        }
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
}

// Inicializar la app cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});