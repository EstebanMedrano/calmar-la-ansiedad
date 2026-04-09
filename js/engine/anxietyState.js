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
        this.currentLevel = Math.min(10, Math.max(0, level));
        localStorage.setItem('calma_last_level', this.currentLevel);
        this.updateUI();
        
        // Mostrar el medidor si el nivel es mayor a 0
        const anxietyMeter = document.getElementById('anxietyMeter');
        if (anxietyMeter && this.currentLevel > 0) {
            anxietyMeter.style.display = 'block';
        }
        
        return this.currentLevel;
    }
    
    reduceLevel() {
        if (this.currentLevel > 0) {
            this.currentLevel--;
            localStorage.setItem('calma_last_level', this.currentLevel);
            this.updateUI();
            this.showAffirmation();
        }
        return this.currentLevel;
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
            "✨ ¡Vas increíble! Cada pequeño paso cuenta.",
            "💪 La ansiedad no te define. Estás retomando el control.",
            "🌼 Permítete sentir, pero recuerda que esto pasará.",
            "🌟 Respira. Este momento es solo tuyo.",
            "🌸 Has recorrido un largo camino hoy. Estoy orgullosa de ti.",
            "🍃 Suelta el control. Solo concéntrate en el ahora."
        ];
        
        const randomMsg = messages[Math.floor(Math.random() * messages.length)];
        const toast = document.createElement('div');
        toast.className = 'affirmation-toast';
        toast.innerText = randomMsg;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.remove(), 3000);
    }
}