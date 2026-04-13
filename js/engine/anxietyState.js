export class AnxietyState {
    constructor() {
        this.currentLevel = 0;
        this.loadFromStorage();
    }
    
    loadFromStorage() {
        const saved = localStorage.getItem('calma_last_level');
        if (saved !== null) {
            this.currentLevel = parseInt(saved);
        }
    }
    
    setLevel(level) {
        import('./logger.js').then(module => {
            module.Logger.logSession(level);
        });
        this.currentLevel = Math.min(10, Math.max(0, level));
        localStorage.setItem('calma_last_level', this.currentLevel);
        localStorage.setItem('calma_session_start', this.currentLevel);
        this.updateUI();
        
        // Mostrar el medidor si el nivel es mayor a 0
        const anxietyMeter = document.getElementById('anxietyMeter');
        if (anxietyMeter && this.currentLevel > 0) {
            anxietyMeter.style.display = 'block';
        }
        
        return this.currentLevel;
    }
    
    reduceLevel(gameName = 'general') {
        if (this.currentLevel > 0) {
            this.currentLevel--;
            localStorage.setItem('calma_last_level', this.currentLevel);
            this.updateUI();
            this.showAffirmation();
            this.speakAffirmation();
            this.logSession(gameName);
            
            // ✅ SOLO cuando llega a 0
            if (this.currentLevel === 0) {
                import('./logger.js').then(module => {
                    module.Logger.logSessionEnd(0, 'completado');
                });
            }
        }
        return this.currentLevel;
    }

    // 🆕 Nuevo método para guardar sesión detallada
    logSession(gameName) {
        const historial = JSON.parse(localStorage.getItem('calma_historial') || '[]');
        const sessionStart = parseInt(localStorage.getItem('calma_session_start') || this.currentLevel + 1);
        
        historial.push({
            fecha: new Date().toISOString(),
            nivelInicial: sessionStart,
            nivelFinal: this.currentLevel,
            mejora: sessionStart - this.currentLevel,
            juego: gameName
        });
        
        // Guardar solo últimas 30 sesiones
        if (historial.length > 30) historial.shift();
        localStorage.setItem('calma_historial', JSON.stringify(historial));
    }
    
    speakAffirmation() {
        import('./speechManager.js').then(module => {
            const speech = module.getSpeechManager();
            
            if (this.currentLevel === 0) {
                speech.speakAffirmation('victory');
            } else {
                speech.speakAffirmation('general');
            }
        }).catch(err => {
            console.warn('🎤 SpeechManager no disponible');
        });
    }

    getLevel() {
        return this.currentLevel;
    }
    
    updateUI() {
        const anxietyBar = document.getElementById('anxietyBar');
        const anxietyValue = document.getElementById('anxietyValue');
        const anxietyMeter = document.getElementById('anxietyMeter');
        
        if (anxietyBar && anxietyValue) {
            const percentage = (this.currentLevel / 10) * 100;
            anxietyBar.style.width = `${percentage}%`;
            anxietyValue.innerText = this.currentLevel;
            
            // Cambiar color según nivel
            if (this.currentLevel > 6) {
                anxietyBar.style.background = '#e74c3c';
            } else if (this.currentLevel > 3) {
                anxietyBar.style.background = '#f39c12';
            } else {
                anxietyBar.style.background = '#2ecc71';
            }
        }
        
        // Ocultar medidor si nivel es 0
        if (anxietyMeter && this.currentLevel === 0) {
            anxietyMeter.style.display = 'none';
        } else if (anxietyMeter && this.currentLevel > 0) {
            anxietyMeter.style.display = 'block';
        }
    }
    
    showAffirmation() {
        const messages = [
            "¡Vas increíble Lu! Cada pequeño paso cuenta.",
            "Estás retomando el control mi Lu",
            "Estoy orgulloso de ti",
            "sabia que lo lograrias y tu tambien",
            "Ves que eres increible? y todavia te preguntas porque sigo aqui",
            "yo si te veo capaz de cumplir tus sueños, confia en ti como yo lo hago en ti"
        ];
        
        const randomMsg = messages[Math.floor(Math.random() * messages.length)];
        const toast = document.createElement('div');
        toast.className = 'affirmation-toast';
        toast.innerText = randomMsg;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.remove(), 3000);
    }
}