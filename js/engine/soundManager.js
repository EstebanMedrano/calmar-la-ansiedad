// js/engine/soundManager.js
// Gestor de sonidos con Howler.js
// Música ambiental 432Hz + efectos de sonido

export class SoundManager {
    constructor() {
        // Estado
        this.isMusicEnabled = this.loadMusicPreference();
        this.isSfxEnabled = true;
        
        // Sonidos
        this.ambientMusic = null;
        this.waterDropSound = null;
        
        // Volumen
        this.musicVolume = 0.3;
        this.sfxVolume = 0.5;
        
        // Inicializar
        this.initMusic();
        this.initSfx();
        this.setupVisibilityHandler();
        
        console.log('🔊 SoundManager inicializado');
    }
    
    loadMusicPreference() {
        const saved = localStorage.getItem('calma_music_enabled');
        return saved !== null ? saved === 'true' : false; // Por defecto APAGADO
    }
    
    saveMusicPreference() {
        localStorage.setItem('calma_music_enabled', this.isMusicEnabled);
    }
    
    initMusic() {
        try {
            this.ambientMusic = new Howl({
                src: ['assets/sounds/ambient-432hz.mp3'],
                loop: true,
                volume: this.musicVolume,
                preload: true,
                onload: () => {
                    console.log('🎵 Música ambiental 432Hz cargada');
                },
                onloaderror: (id, error) => {
                    console.warn('⚠️ No se pudo cargar la música ambiental:', error);
                }
            });
            
            // Si estaba activada, reproducir (con fade in)
            if (this.isMusicEnabled) {
                setTimeout(() => this.playMusic(), 500);
            }
        } catch (e) {
            console.warn('⚠️ Howler.js no disponible para música');
        }
    }
    
    initSfx() {
        try {
            this.waterDropSound = new Howl({
                src: ['assets/sounds/water-drop.mp3'],
                volume: this.sfxVolume,
                preload: true,
                onload: () => {
                    console.log('💧 Sonido de gota cargado');
                },
                onloaderror: (id, error) => {
                    console.warn('⚠️ No se pudo cargar el sonido de gota:', error);
                }
            });
        } catch (e) {
            console.warn('⚠️ Howler.js no disponible para efectos');
        }
    }
    
    setupVisibilityHandler() {
        // Pausar música cuando la pestaña no está visible
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                if (this.ambientMusic && this.ambientMusic.playing()) {
                    this.ambientMusic.pause();
                }
            } else {
                if (this.isMusicEnabled && this.ambientMusic) {
                    this.ambientMusic.play();
                }
            }
        });
    }
    
    // ========== MÚSICA AMBIENTAL ==========
    
    toggleMusic() {
        if (!this.ambientMusic) {
            this.showToast('🎵 Música no disponible', 'info');
            return false;
        }
        
        if (this.isMusicEnabled) {
            this.stopMusic();
        } else {
            this.playMusic();
        }
        
        return this.isMusicEnabled;
    }
    
    playMusic() {
        if (!this.ambientMusic) return;
        
        this.isMusicEnabled = true;
        this.saveMusicPreference();
        
        // Fade in suave
        this.ambientMusic.volume(0);
        this.ambientMusic.play();
        this.ambientMusic.fade(0, this.musicVolume, 2000);
        
        this.updateMusicButton(true);
        console.log('🎵 Música ambiental activada');
    }
    
    stopMusic() {
        if (!this.ambientMusic) return;
        
        // Fade out suave
        this.ambientMusic.fade(this.musicVolume, 0, 1500);
        setTimeout(() => {
            this.ambientMusic.pause();
            this.isMusicEnabled = false;
            this.saveMusicPreference();
            this.updateMusicButton(false);
        }, 1500);
        
        console.log('🔇 Música ambiental pausada');
    }
    
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.ambientMusic) {
            this.ambientMusic.volume(this.musicVolume);
        }
    }
    
    // ========== EFECTOS DE SONIDO ==========
    
    playWaterDrop() {
        if (!this.isSfxEnabled) return;
        if (!this.waterDropSound) return;
        
        try {
            // Reiniciar si ya está reproduciendo
            this.waterDropSound.stop();
            this.waterDropSound.play();
        } catch (e) {
            console.warn('💧 No se pudo reproducir sonido de gota');
        }
    }
    
    toggleSfx() {
        this.isSfxEnabled = !this.isSfxEnabled;
        return this.isSfxEnabled;
    }
    
    // ========== UI ==========
    
    updateMusicButton(isPlaying) {
        const musicBtn = document.getElementById('toggleMusicBtn');
        if (musicBtn) {
            const span = musicBtn.querySelector('span');
            if (span) {
                span.textContent = isPlaying ? '🔊' : '🎵';
            }
            
            // Efecto visual
            if (isPlaying) {
                musicBtn.style.background = 'rgba(16, 185, 129, 0.2)';
                musicBtn.style.borderColor = '#10b981';
            } else {
                musicBtn.style.background = '';
                musicBtn.style.borderColor = '';
            }
        }
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
    
    // ========== LIMPIEZA ==========
    
    cleanup() {
        if (this.ambientMusic) {
            this.ambientMusic.stop();
            this.ambientMusic.unload();
        }
        if (this.waterDropSound) {
            this.waterDropSound.unload();
        }
    }
}

// Singleton
let soundManagerInstance = null;

export function getSoundManager() {
    if (!soundManagerInstance) {
        soundManagerInstance = new SoundManager();
    }
    return soundManagerInstance;
}