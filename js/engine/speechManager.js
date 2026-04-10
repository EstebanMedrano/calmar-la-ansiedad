// js/engine/speechManager.js
// Gestor de voz con Web Speech API
// Lee afirmaciones en español con voz femenina

export class SpeechManager {
    constructor() {
        this.synth = window.speechSynthesis;
        this.isEnabled = this.loadPreference();
        this.isSpeaking = false;
        this.pendingMessages = [];
        
        // Voz preferida (femenina, español)
        this.preferredVoice = null;
        this.initVoice();
        
        console.log('🎤 SpeechManager inicializado');
    }
    
    loadPreference() {
        const saved = localStorage.getItem('calma_voice_enabled');
        return saved !== null ? saved === 'true' : true; // Por defecto ACTIVADO
    }
    
    savePreference() {
        localStorage.setItem('calma_voice_enabled', this.isEnabled);
    }
    
    initVoice() {
        const loadVoices = () => {
            const voices = this.synth.getVoices();
            
            // 1. PRIORIDAD MÁXIMA: Buscar voces "Natural" o "Premium" en español
            let bestVoice = voices.find(v => 
                v.lang.includes('es') && 
                (v.name.includes('Natural') || v.name.includes('Premium'))
            );

            // 2. SEGUNDA OPCIÓN: Buscar cualquier voz en español de Google o Microsoft
            if (!bestVoice) {
                bestVoice = voices.find(v => 
                    v.lang.includes('es') && 
                    (v.name.includes('Microsoft') || v.name.includes('Google'))
                );
            }

            // 3. TERCERA OPCIÓN: Voces conocidas de Apple (Samantha, Mónica, Paulina)
            if (!bestVoice) {
                const appleVoices = ['Samantha', 'Mónica', 'Paulina', 'Ava', 'María'];
                bestVoice = voices.find(v => 
                    v.lang.includes('es') && appleVoices.some(name => v.name.includes(name))
                );
            }

            // 4. ULTIMA OPCIÓN: Cualquier voz en español
            if (!bestVoice) {
                bestVoice = voices.find(v => v.lang.includes('es'));
            }

            this.preferredVoice = bestVoice || voices[0];
            console.log('🎤 Voz de alta calidad seleccionada:', this.preferredVoice?.name || 'Predeterminada');
        };
        
        loadVoices();
        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = loadVoices;
        }
    }
    
    speak(text, force = false) {
        if (!this.isEnabled && !force) {
            console.log('🎤 Voz desactivada, no se reproduce');
            return;
        }
        
        if (!this.synth) {
            console.warn('🎤 Speech Synthesis no soportada');
            return;
        }
        
        // Limpiar texto (máximo 200 caracteres)
        const cleanText = text.substring(0, 200);
        
        // Si ya está hablando, poner en cola
        if (this.isSpeaking && !force) {
            this.pendingMessages.push(cleanText);
            return;
        }
        
        this.speakNow(cleanText);
    }
    
    speakNow(text) {
        this.isSpeaking = true;
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Configuración
        utterance.lang = 'es-ES';
        utterance.rate = 0.85;  // Un poco más lento (calmante)
        utterance.pitch = 1.1;   // Ligeramente más agudo (voz suave)
        utterance.volume = 0.8;
        
        if (this.preferredVoice) {
            utterance.voice = this.preferredVoice;
        }
        
        // Eventos
        utterance.onstart = () => {
            console.log('🎤 Reproduciendo:', text);
            this.updateVoiceButton(true);
        };
        
        utterance.onend = () => {
            this.isSpeaking = false;
            this.updateVoiceButton(false);
            
            // Procesar siguiente mensaje en cola
            if (this.pendingMessages.length > 0) {
                const nextText = this.pendingMessages.shift();
                setTimeout(() => this.speakNow(nextText), 300);
            }
        };
        
        utterance.onerror = (event) => {
            console.warn('🎤 Error al hablar:', event.error);
            this.isSpeaking = false;
            this.updateVoiceButton(false);
        };
        
        this.synth.speak(utterance);
    }
    
    speakAffirmation(type = 'general') {
        const affirmations = {
            general: [
                "¡Vas increíble Lu! Cada pequeño paso cuenta.",
                "Estás retomando el control mi Lu",
                "Estoy orgulloso de ti",
                "sabia que lo lograrias y tu tambien",
                "Ves que eres increible? y todavia te preguntas porque sigo aqui",
                "yo si te veo capaz de cumplir tus sueños, confia en ti, como yo lo hago en ti"
            ],
            breathing: [
                'hasta en respirar te voy a acompañar',
                'eres increinle, sabia que podrias Lu'
            ],
            grounding: [
                'quiero que te sientas segura donde sea que estes',
                'yo me hubiera tardado mucho mas, pero tu, tu eres increible Lu'
            ],
            victory: [
                'Muy bien, lo haces como una profesional, o solamente eres increible',
                'ves lo increible que eres? solo necesitas una mano a ratos y yo te daré la mia'
            ]
        };
        
        const messages = affirmations[type] || affirmations.general;
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        
        this.speak(randomMessage);
    }
    
    toggle() {
        this.isEnabled = !this.isEnabled;
        this.savePreference();
        
        if (!this.isEnabled && this.isSpeaking) {
            this.stop();
        }
        
        this.updateVoiceButton(false);
        
        // Feedback
        if (this.isEnabled) {
            this.speak('Voz activada', true);
        }
        
        return this.isEnabled;
    }
    
    stop() {
        if (this.synth) {
            this.synth.cancel();
            this.isSpeaking = false;
            this.pendingMessages = [];
            this.updateVoiceButton(false);
        }
    }
    
    updateVoiceButton(isPlaying) {
        const voiceBtn = document.getElementById('voiceGuideBtn');
        if (voiceBtn) {
            const span = voiceBtn.querySelector('span');
            if (span) {
                span.textContent = isPlaying ? '🔊' : '🗣️';
            }
            
            if (isPlaying) {
                voiceBtn.style.background = 'rgba(139, 92, 246, 0.2)';
                voiceBtn.style.borderColor = '#8b5cf6';
            } else {
                voiceBtn.style.background = this.isEnabled ? '' : 'rgba(100, 100, 100, 0.1)';
                voiceBtn.style.borderColor = '';
            }
        }
    }
    
    // Para usar desde los juegos
    speakIfEnabled(text) {
        if (this.isEnabled) {
            this.speak(text);
        }
    }
}

// Singleton
let speechManagerInstance = null;

export function getSpeechManager() {
    if (!speechManagerInstance) {
        speechManagerInstance = new SpeechManager();
    }
    return speechManagerInstance;
}