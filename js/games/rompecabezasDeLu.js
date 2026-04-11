// js/games/rompecabezasDeLu.js
// Rompecabezas de Lu - Piezas cuadradas simples
// Usando imágenes JPG del refugio

export class RompecabezasDeLu {
    constructor(container) {
        this.container = container;
        this.canvas = null;
        this.ctx = null;
        
        this.width = Math.min(750, window.innerWidth - 20);
        this.height = Math.min(550, window.innerHeight * 0.65);
        
        this.state = 'intro';
        this.currentPuzzle = 0;
        
        // SOLO las imágenes que existen en tu carpeta
        this.puzzles = [
            { name: 'Tu refugio', src: 'assets/img/refugio-webp/exterior-casa.webp', message: '🏡 Este es tu lugar seguro' },
            { name: 'Tulipanes', src: 'assets/img/refugio-webp/jardin-tulipanes.webp', message: '🌷 Floreces con cada respiración' },
            { name: 'Noche estrellada', src: 'assets/img/refugio-webp/noche-estrellas.webp', message: '✨ El universo conspira a tu favor' },
            { name: 'Patio con piscina', src: 'assets/img/refugio-webp/patio-piscina.webp', message: '🌊 Fluye con la calma del agua' },
            { name: 'Fuente de colores', src: 'assets/img/refugio-webp/fuente-colores.webp', message: '🌈 La magia está en ti' },
            { name: 'Interior sala', src: 'assets/img/refugio-webp/interior-sala.webp', message: '🛋️ Tu rincón de paz' }
        ];
        
        // Revolver y seleccionar 3 puzzles aleatorios
        this.selectedPuzzles = [];
        this.shufflePuzzles();
        
        this.pieces = [];
        this.pieceWidth = 0;
        this.pieceHeight = 0;
        this.gridSize = 4;
        
        // Perros
        this.titoImg = null;
        this.liaImg = null;
        this.currentDog = null;
        this.dogX = -150;
        this.dogY = 250;
        this.dogSpeed = 3.5;
        this.dogState = 'waiting';
        
        this.selectedPiece = null;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
        
        this.breakParticles = [];
        this.sounds = {};
        
        this.isLoading = true;
        this.loadedAssets = 0;
        this.totalAssets = 2 + 3; // Se actualizará en shufflePuzzles
        
        this.animationFrame = null;
        this.dogSequence = ['tito', 'lia', 'tito'];
        this.dogIndex = 0;
    }

    resizeCanvas() {
        this.width = Math.min(750, window.innerWidth - 20);
        this.height = Math.min(550, window.innerHeight * 0.65);
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }
    
    shufflePuzzles() {
        const shuffled = [...this.puzzles].sort(() => Math.random() - 0.5);
        this.selectedPuzzles = shuffled.slice(0, 3);
        this.totalAssets = 2 + this.selectedPuzzles.length;
    }
    
    render() {
        this.container.innerHTML = `
            <div class="puzzle-game">
                <div id="puzzleLoading" class="puzzle-loading">
                    <div class="loading-spinner"></div>
                    <p>Cargando rompecabezas... <span id="puzzleLoadProgress">0/${this.totalAssets}</span></p>
                </div>
                
                <canvas id="puzzleCanvas" width="${this.width}" height="${this.height}"></canvas>
                
                <div id="puzzleMessage" class="puzzle-message"></div>
                
                <div class="puzzle-controls">
                    <button id="nextPuzzle" class="puzzle-btn" style="display: none;">
                        <span>➡️</span> Siguiente
                    </button>
                    <button id="backFromPuzzle" class="puzzle-btn">
                        <span>←</span> Volver
                    </button>
                </div>
                
                <p id="puzzleHint" class="puzzle-hint">Tito y Lia quieren jugar...</p>
            </div>
        `;
        
        this.initCanvas();
        this.loadAssets();
        this.initSounds();
        this.attachEvents();
    }
    
    initCanvas() {
        this.canvas = document.getElementById('puzzleCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas = this.resizeCanvas.bind(this);
        window.addEventListener('resize', this.resizeCanvas);
    }
    
    loadAssets() {
        this.titoImg = new Image();
        this.titoImg.onload = () => this.assetLoaded();
        this.titoImg.src = 'assets/img/perros/tito.png';
        
        this.liaImg = new Image();
        this.liaImg.onload = () => this.assetLoaded();
        this.liaImg.src = 'assets/img/perros/lia.png';
        
        // Cargar solo los 3 puzzles seleccionados
        this.selectedPuzzles.forEach((puzzle) => {
            puzzle.img = new Image();
            puzzle.img.onload = () => this.assetLoaded();
            puzzle.img.src = puzzle.src;
        });
    }
    
    assetLoaded() {
        this.loadedAssets++;
        const progressEl = document.getElementById('puzzleLoadProgress');
        if (progressEl) {
            progressEl.textContent = `${this.loadedAssets}/${this.totalAssets}`;
        }
        
        if (this.loadedAssets >= this.totalAssets) {
            this.finishLoading();
        }
    }
    
    finishLoading() {
        this.isLoading = false;
        const loadingEl = document.getElementById('puzzleLoading');
        if (loadingEl) {
            loadingEl.style.opacity = '0';
            setTimeout(() => loadingEl.style.display = 'none', 500);
        }
        
        this.startIntro();
        this.animate();
    }
    
    initSounds() {
        if (window.Howl) {
            this.sounds.bark = new Howl({ src: ['assets/sounds/lia-bark.mp3'], volume: 0.25 });
            this.sounds.break = new Howl({ src: ['assets/sounds/water-drop.mp3'], volume: 0.15 });
            this.sounds.success = new Howl({ src: ['assets/sounds/magia-brillo.mp3'], volume: 0.2 });
        }
    }
    
    attachEvents() {
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.onMouseUp());
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.onMouseDown(e);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.onMouseMove(e);
        });
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.onMouseUp();
        });
        
        document.getElementById('nextPuzzle')?.addEventListener('click', () => this.nextPuzzle());
        document.getElementById('backFromPuzzle')?.addEventListener('click', () => {
            this.cleanup();
            if (window.app && window.app.router) {
                window.app.router.showGamesView();
            }
        });
    }
    
    startIntro() {
        this.state = 'intro';
        this.currentDog = this.dogSequence[this.dogIndex % this.dogSequence.length];
        this.dogIndex++;
        
        this.dogX = -150;
        this.dogY = this.height - 180; // Posición inicial abajo
        this.dogState = 'waiting';
        
        const dogName = this.currentDog === 'tito' ? 'Tito' : 'Lia';
        this.showMessage(`¡${dogName} quiere jugar!`, 2000);
        
        setTimeout(() => {
            this.state = 'breaking';
            this.dogState = 'running';
        }, 1500);
    }
    
    breakImage() {
        const puzzle = this.selectedPuzzles[this.currentPuzzle];
        const img = puzzle.img;
        
        if (!img) return;
        
        const maxWidth = this.width * 0.7;
        const maxHeight = this.height * 0.65;
        const scale = Math.min(maxWidth / img.width, maxHeight / img.height);
        const imgWidth = img.width * scale;
        const imgHeight = img.height * scale;
        
        this.pieceWidth = imgWidth / this.gridSize;
        this.pieceHeight = imgHeight / this.gridSize;
        
        const startX = (this.width - imgWidth) / 2;
        const startY = (this.height - imgHeight) / 2 - 20;
        
        this.pieces = [];
        const margin = 40;
        
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const correctX = startX + col * this.pieceWidth;
                const correctY = startY + row * this.pieceHeight;
                
                const angle = Math.random() * Math.PI * 2;
                const distance = 100 + Math.random() * 150;
                
                let pieceX = this.width / 2 + Math.cos(angle) * distance;
                let pieceY = this.height / 2 + Math.sin(angle) * distance;
                
                pieceX = Math.max(margin, Math.min(this.width - this.pieceWidth - margin, pieceX));
                pieceY = Math.max(margin, Math.min(this.height - this.pieceHeight - margin, pieceY));
                
                this.pieces.push({
                    row, col,
                    correctX, correctY,
                    x: pieceX,
                    y: pieceY,
                    width: this.pieceWidth,
                    height: this.pieceHeight,
                    placed: false
                });
            }
        }
        
        this.breakParticles = [];
        for (let i = 0; i < 40; i++) {
            this.breakParticles.push({
                x: this.width / 2,
                y: this.height / 2,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10 - 2,
                size: 3 + Math.random() * 8,
                color: `hsl(${Math.random() * 60 + 180}, 70%, 60%)`,
                life: 1.0
            });
        }
        
        if (this.sounds.break) this.sounds.break.play();
        
        const dogName = this.currentDog === 'tito' ? 'Tito' : 'Lia';
        this.showMessage(`¡Oh no! ${dogName} rompió la imagen. ¿Puedes armarla?`, 3000);
    }
    
    onMouseDown(e) {
        if (this.state !== 'playing') return;
        
        const pos = this.getEventPos(e);
        
        for (let i = this.pieces.length - 1; i >= 0; i--) {
            const piece = this.pieces[i];
            if (piece.placed) continue;
            
            if (pos.x >= piece.x && pos.x <= piece.x + piece.width &&
                pos.y >= piece.y && pos.y <= piece.y + piece.height) {
                
                this.selectedPiece = piece;
                this.dragOffsetX = pos.x - piece.x;
                this.dragOffsetY = pos.y - piece.y;
                
                this.pieces.splice(i, 1);
                this.pieces.push(piece);
                
                break;
            }
        }
    }
    
    onMouseMove(e) {
        if (!this.selectedPiece) return;
        
        const pos = this.getEventPos(e);
        this.selectedPiece.x = pos.x - this.dragOffsetX;
        this.selectedPiece.y = pos.y - this.dragOffsetY;
    }
    
    onMouseUp() {
        if (!this.selectedPiece) return;
        
        const piece = this.selectedPiece;
        const dist = Math.sqrt(
            Math.pow(piece.x - piece.correctX, 2) + 
            Math.pow(piece.y - piece.correctY, 2)
        );
        
        if (dist < 50) {
            piece.x = piece.correctX;
            piece.y = piece.correctY;
            piece.placed = true;
            
            const animos = [
                '✨ ¡Va queriendo! ✨', '💪 ¡Bien hecho! 💪', '🌟 ¡Sigue así! 🌟',
                '🎯 ¡Perfecto! 🎯', '👏 ¡Muy bien! 👏', '💫 ¡Lo tienes! 💫',
                '🌷 ¡Pieza correcta! 🌷', '🦊 Tito está orgulloso', '🐩 Lia te anima',
                '🏡 ¡Armando tu refugio! 🏡', '🎨 ¡Qué bonito! 🎨'
            ];
            const mensaje = animos[Math.floor(Math.random() * animos.length)];
            this.showMessage(mensaje, 1000);
            
            if (this.pieces.every(p => p.placed)) {
                this.completePuzzle();
            }
        }
        
        this.selectedPiece = null;
    }
    
    getEventPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }
    
    completePuzzle() {
        this.state = 'completed';
        
        if (this.sounds.success) this.sounds.success.play();
        if (this.sounds.bark) this.sounds.bark.play();
        
        const puzzle = this.selectedPuzzles[this.currentPuzzle];
        this.showMessage(`✨ ¡Lo lograste! ${puzzle.message} ✨`, 4000);
        
        if (window.app && window.app.anxietyState) {
            window.app.anxietyState.reduceLevel('🧩 Rompecabezas');
        }
        
        if (this.currentPuzzle < this.selectedPuzzles.length - 1) {
            document.getElementById('nextPuzzle').style.display = 'flex';
        } else {
            this.showMessage('🎉 ¡Has completado todos los rompecabezas! Eres increíble. 🎉', 5000);
        }
    }
    
    nextPuzzle() {
        this.currentPuzzle++;
        document.getElementById('nextPuzzle').style.display = 'none';
        this.startIntro();
    }
    
    showMessage(text, duration) {
        const msgEl = document.getElementById('puzzleMessage');
        const hintEl = document.getElementById('puzzleHint');
        
        if (msgEl) {
            msgEl.textContent = text;
            msgEl.style.opacity = '1';
        }
        if (hintEl) hintEl.style.opacity = '0.5';
        
        setTimeout(() => {
            if (msgEl) msgEl.style.opacity = '0';
            if (hintEl) hintEl.style.opacity = '1';
        }, duration);
    }
    
    animate() {
        if (this.isLoading) return;
        
        this.draw();
        
        if (this.state === 'breaking') {
            this.updateBreaking();
        }
        
        if (this.state === 'playing') {
            this.updateParticles();
        }
        
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }
    
    updateBreaking() {
        if (this.dogState === 'running') {
            this.dogX += this.dogSpeed;
            
            if (this.dogX >= this.width / 2 - 80) {
                this.dogState = 'crashing';
                this.breakImage();
                
                setTimeout(() => {
                    this.dogState = 'waitingInCorner';
                    this.state = 'playing';
                }, 400);
            }
        }
    }
    
    updateParticles() {
        this.breakParticles = this.breakParticles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.15;
            p.life -= 0.012;
            return p.life > 0;
        });
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        const gradient = this.ctx.createRadialGradient(
            this.width/2, this.height/2, 0,
            this.width/2, this.height/2, this.width/2
        );
        gradient.addColorStop(0, '#2a1a3e');
        gradient.addColorStop(1, '#0f0a1a');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        if (this.state === 'intro' || this.state === 'breaking') {
            const puzzle = this.selectedPuzzles[this.currentPuzzle];
            const img = puzzle.img;
            
            if (img) {
                const maxWidth = this.width * 0.65;
                const maxHeight = this.height * 0.6;
                const scale = Math.min(maxWidth / img.width, maxHeight / img.height);
                const imgWidth = img.width * scale;
                const imgHeight = img.height * scale;
                const x = (this.width - imgWidth) / 2;
                const y = (this.height - imgHeight) / 2 - 20;
                
                this.ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
                this.ctx.shadowBlur = 20;
                this.ctx.drawImage(img, x, y, imgWidth, imgHeight);
                this.ctx.shadowBlur = 0;
            }
            
            this.drawDog();
            
        } else if (this.state === 'playing' || this.state === 'completed') {
            const puzzle = this.selectedPuzzles[this.currentPuzzle];
            const img = puzzle.img;
            
            if (img) {
                this.pieces.forEach(piece => {
                    const srcX = piece.col * (img.width / this.gridSize);
                    const srcY = piece.row * (img.height / this.gridSize);
                    const srcW = img.width / this.gridSize;
                    const srcH = img.height / this.gridSize;
                    
                    this.ctx.drawImage(
                        img,
                        srcX, srcY, srcW, srcH,
                        piece.x, piece.y, piece.width, piece.height
                    );
                    
                    this.ctx.strokeStyle = piece.placed ? '#10b981' : 'rgba(255, 255, 255, 0.3)';
                    this.ctx.lineWidth = piece.placed ? 3 : 1.5;
                    this.ctx.strokeRect(piece.x, piece.y, piece.width, piece.height);
                });
            }
            
            this.drawParticles();
            
            if (this.state === 'playing') {
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
                this.ctx.lineWidth = 1;
                this.ctx.setLineDash([5, 5]);
                this.pieces.forEach(piece => {
                    if (!piece.placed) {
                        this.ctx.strokeRect(piece.correctX, piece.correctY, piece.width, piece.height);
                    }
                });
                this.ctx.setLineDash([]);
            }
            
            // Dibujar al perro esperando en la esquina inferior derecha
            if (this.dogState === 'waitingInCorner' || this.dogState === 'waiting') {
                this.drawDogInCorner();
            }
        }
        
        const vignette = this.ctx.createRadialGradient(
            this.width/2, this.height/2, 200,
            this.width/2, this.height/2, this.width/2
        );
        vignette.addColorStop(0, 'transparent');
        vignette.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
        this.ctx.fillStyle = vignette;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
    
    drawDog() {
        const dogImg = this.currentDog === 'tito' ? this.titoImg : this.liaImg;
        if (!dogImg) return;
        
        const dogSize = 100;
        
        this.ctx.save();
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 15;
        this.ctx.shadowOffsetY = 5;
        
        this.ctx.drawImage(dogImg, this.dogX, this.dogY - 40, dogSize, dogSize);
        
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetY = 0;
        this.ctx.restore();
        
        if (this.dogState === 'running') {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            for (let i = 0; i < 4; i++) {
                this.ctx.beginPath();
                this.ctx.arc(this.dogX - i * 12, this.dogY + 10, 6 - i, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    }
    
    drawDogInCorner() {
        const dogImg = this.currentDog === 'tito' ? this.titoImg : this.liaImg;
        if (!dogImg) return;
        
        const dogSize = 80;
        // Cambiado a esquina inferior IZQUIERDA
        const cornerX = 20;
        const cornerY = this.height - dogSize - 10;
        
        this.ctx.save();
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 15;
        this.ctx.shadowOffsetY = 5;
        
        // Reflejar horizontalmente para que mire hacia la derecha (opcional)
        this.ctx.translate(cornerX + dogSize, cornerY);
        this.ctx.scale(-1, 1);
        this.ctx.drawImage(dogImg, 0, 0, dogSize, dogSize);
        
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetY = 0;
        this.ctx.restore();
        
        // Etiqueta con nombre (sin el reflejo)
        this.ctx.save();
        this.ctx.font = 'bold 14px Inter, sans-serif';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.shadowColor = '#000000';
        this.ctx.shadowBlur = 8;
        this.ctx.textAlign = 'center';
        
        const dogName = this.currentDog === 'tito' ? '🦊 Tito' : '🤍 Lia';
        this.ctx.fillText(dogName, cornerX + dogSize/2, cornerY - 10);
        
        this.ctx.shadowBlur = 0;
        this.ctx.restore();
    }
    
    drawParticles() {
        this.breakParticles.forEach(p => {
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.shadowColor = p.color;
            this.ctx.shadowBlur = 10;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.shadowBlur = 0;
        this.ctx.globalAlpha = 1;
    }
    
    cleanup() {
        if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    }
}

export function initRompecabezasDeLu(container) {
    const game = new RompecabezasDeLu(container);
    game.render();
    return game;
}