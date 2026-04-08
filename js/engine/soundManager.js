export class SoundManager {
    constructor() {
        this.isPlaying = false;
        this.setupButtons();
    }
    
    setupButtons() {
        const toggleBtn = document.getElementById('toggleMusicBtn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                console.log('Música relajante - Próximamente');
                // Aquí implementaremos Howler.js después
            });
        }
    }
}