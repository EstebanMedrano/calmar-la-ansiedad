// js/games/ritualFire.js
// Ritual de Soltar - Con fuego procedural ultra realista (Shadertoy)

export class RitualFire {
    constructor(container) {
        this.container = container;
        this.letters = this.loadLetters();
        this.isBurning = false;
        this.fireSound = null;
        this.recognition = null;
        this.isListening = false;
        
        // Shader de fuego
        this.fireCanvas = null;
        this.fireCtx = null;
        this.shaderCanvas = null;
        this.shaderCtx = null;
        this.startTime = Date.now();
    }
    
    loadLetters() {
        const saved = localStorage.getItem('calma_ritual_letters');
        return saved ? JSON.parse(saved) : [];
    }
    
    saveLetters() {
        localStorage.setItem('calma_ritual_letters', JSON.stringify(this.letters));
    }
    
    render() {
        this.container.innerHTML = `
            <div class="ritual-fire-container">
                <h2 class="text-center" style="margin-bottom: 8px;">
                    <span style="background: linear-gradient(135deg, #ef4444, #f59e0b, #fbbf24); -webkit-background-clip: text; background-clip: text; color: transparent;">
                        🔥 Ritual de Soltar
                    </span>
                </h2>
                <p class="text-center" style="color: #94a3b8; margin-bottom: 24px;">
                    Escribe o dicta. Guarda en la repisa. Desliza para quemar.
                </p>
                
                <!-- CARTA GRANDE -->
                <div class="letter-writing-area">
                    <div class="paper-card large" id="paperCard">
                        <div class="paper-texture"></div>
                        <textarea 
                            id="letterInput" 
                            class="letter-textarea" 
                            placeholder="Escribe lo que quieres soltar..."
                            maxlength="500"
                        ></textarea>
                        <div class="paper-lines"></div>
                    </div>
                    
                    <div class="writing-controls">
                        <button id="voiceInput" class="voice-btn" title="Dictar por voz">
                            <span>🎤</span> Dictar
                        </button>
                        <span id="letterCharCount" class="char-count">0/500</span>
                        <button id="finishLetter" class="finish-btn" disabled>
                            <span>✉️</span> Terminar
                        </button>
                    </div>
                    
                    <div id="recordingIndicator" class="recording-indicator" style="display: none;">
                        <span class="pulse"></span>
                        <span>Escuchando... habla ahora</span>
                    </div>
                </div>
                
                <!-- REPISA -->
                <div class="shelf-area">
                    <div class="shelf">
                        <div class="shelf-wood"></div>
                        <div class="letters-on-shelf" id="lettersOnShelf">
                            ${this.renderLetters()}
                        </div>
                    </div>
                    
                    <div class="shelf-lever-container">
                        <div class="lever-track">
                            <div class="lever-handle" id="leverHandle" style="left: 0%">
                                <span>⬇️</span>
                            </div>
                        </div>
                        <p class="lever-hint">← Desliza para quemar →</p>
                    </div>
                </div>
                
                <!-- FOGATA CON SHADER -->
                <div class="fire-pit-area">
                    <div class="fire-pit">
                        <!-- Troncos dibujados -->
                        <canvas id="logsCanvas" width="400" height="150"></canvas>
                        <!-- Shader de fuego -->
                        <canvas id="fireShaderCanvas" width="400" height="150"></canvas>
                        <!-- Partículas de humo/ceniza -->
                        <div class="ash-particles" id="ashParticles"></div>
                        <div class="fire-glow"></div>
                    </div>
                </div>
                
                <!-- Botones -->
                <div style="display: flex; gap: 16px; justify-content: center; margin-top: 24px;">
                    <button id="backFromRitual" class="btn-secondary">
                        ← Volver
                    </button>
                </div>
            </div>
        `;
        
        this.initCanvases();
        this.initSpeechRecognition();
        this.initFireSound();
        this.attachEvents();
        this.drawLogs();
        this.animateFireShader();
    }
    
    renderLetters() {
        if (this.letters.length === 0) {
            return '<p class="empty-shelf-message">📭 La repisa está vacía</p>';
        }
        
        return this.letters.slice(-6).map((letter, index) => `
            <div class="envelope" style="z-index: ${index}; transform: rotate(${(index - 2) * 3}deg);">
                <div class="envelope-flap"></div>
                <div class="envelope-body">
                    <span class="envelope-icon">✉️</span>
                </div>
            </div>
        `).join('');
    }
    
    initCanvases() {
        // Canvas para troncos
        this.logsCanvas = document.getElementById('logsCanvas');
        this.logsCtx = this.logsCanvas.getContext('2d');
        
        // Canvas para fuego (animación simple)
        this.fireCanvas = document.getElementById('fireShaderCanvas');
        this.fireCtx = this.fireCanvas.getContext('2d');
        
        // Ajustar tamaño
        this.resizeCanvases();
        window.addEventListener('resize', () => this.resizeCanvases());
    }

    resizeCanvases() {
        const container = document.querySelector('.fire-pit');
        if (!container) return;
        
        const width = container.clientWidth || 350;
        const height = 120;
        
        if (this.logsCanvas) {
            this.logsCanvas.width = width;
            this.logsCanvas.height = height;
        }
        
        if (this.fireCanvas) {
            this.fireCanvas.width = width;
            this.fireCanvas.height = height;
        }
        
        this.drawLogs();
    }

    drawLogs() {
        const ctx = this.logsCtx;
        const w = this.logsCanvas.width;
        const h = this.logsCanvas.height;
        
        ctx.clearRect(0, 0, w, h);
        
        // Tronco 1 (izquierda)
        ctx.save();
        ctx.translate(w * 0.3, h - 20);
        ctx.rotate(-0.2);
        this.drawLog(ctx, 0, 0, w * 0.25, 18, '#5c3814');
        ctx.restore();
        
        // Tronco 2 (derecha)
        ctx.save();
        ctx.translate(w * 0.7, h - 15);
        ctx.rotate(0.15);
        this.drawLog(ctx, 0, 0, w * 0.22, 16, '#4a2c0f');
        ctx.restore();
        
        // Tronco 3 (centro)
        ctx.save();
        ctx.translate(w * 0.5, h - 10);
        ctx.rotate(0);
        this.drawLog(ctx, 0, 0, w * 0.28, 20, '#3d2208');
        ctx.restore();
    }

    drawLog(ctx, x, y, w, h, color) {
        // Cuerpo del tronco
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(0, 0, w/2, h/2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Textura
        ctx.strokeStyle = '#2d1a06';
        ctx.lineWidth = 1;
        for (let i = -w/3; i < w/3; i += 6) {
            ctx.beginPath();
            ctx.moveTo(i, -h/2);
            ctx.lineTo(i + 3, h/2);
            ctx.stroke();
        }
        
        // Extremos
        ctx.fillStyle = '#d4a76a';
        ctx.beginPath();
        ctx.ellipse(-w/2 + 2, 0, 4, h/2.2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(w/2 - 2, 0, 4, h/2.2, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    animateFireShader() {
        const animate = () => {
            this.drawFire();
            requestAnimationFrame(animate);
        };
        animate();
    }

    drawFire() {
        const ctx = this.fireCtx;
        const w = this.fireCanvas.width;
        const h = this.fireCanvas.height;
        
        if (w === 0 || h === 0) return;
        
        ctx.clearRect(0, 0, w, h);
        
        const time = Date.now() / 1000;
        
        // Dibujar múltiples llamas
        for (let i = 0; i < 5; i++) {
            const offsetX = Math.sin(time * 2 + i) * 15;
            const flameX = w/2 + offsetX + (i - 2) * 25;
            const flameHeight = 50 + Math.sin(time * 3 + i * 2) * 20;
            
            // Gradiente de llama
            const gradient = ctx.createLinearGradient(flameX, h - 30, flameX, h - 30 - flameHeight);
            gradient.addColorStop(0, '#ff4500');
            gradient.addColorStop(0.4, '#ff8c00');
            gradient.addColorStop(0.7, '#ffd700');
            gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
            
            ctx.fillStyle = gradient;
            
            // Forma de llama
            ctx.beginPath();
            ctx.moveTo(flameX - 15, h - 30);
            ctx.quadraticCurveTo(flameX - 5, h - 50 - flameHeight/2, flameX, h - 30 - flameHeight);
            ctx.quadraticCurveTo(flameX + 5, h - 50 - flameHeight/2, flameX + 15, h - 30);
            ctx.fill();
        }
        
        // Brillo central
        const centerGlow = ctx.createRadialGradient(w/2, h - 20, 0, w/2, h - 20, 40);
        centerGlow.addColorStop(0, '#ff6600');
        centerGlow.addColorStop(0.5, '#ff4500');
        centerGlow.addColorStop(1, 'transparent');
        
        ctx.fillStyle = centerGlow;
        ctx.globalAlpha = 0.6;
        ctx.fillRect(0, h - 60, w, 60);
        ctx.globalAlpha = 1.0;
        
        // Chispas
        ctx.fillStyle = '#ffd700';
        for (let i = 0; i < 5; i++) {
            const sparkX = w/2 + Math.sin(time * 5 + i) * 30;
            const sparkY = h - 40 - (time * 20 + i * 10) % 50;
            ctx.beginPath();
            ctx.arc(sparkX, sparkY, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    renderFireShader() {
        const ctx = this.shaderCtx;
        const w = 400, h = 150;
        const imageData = ctx.createImageData(w, h);
        const data = imageData.data;
        
        const time = (Date.now() - this.startTime) / 1000;
        
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                // Coordenadas normalizadas
                const px = (x / w) * 2.0 - 1.0;
                const py = (y / h) * 2.0 - 1.0;
                
                // Posición 3D
                const p = vec3(px * 1.5, -py * 1.2 - 0.5, 0);
                
                // Ruido de fuego
                const flameValue = this.flame(p, time);
                
                // Color basado en la intensidad
                let r, g, b, a;
                
                if (flameValue < 0.1) {
                    // Fuego intenso (centro)
                    const intensity = 1.0 - flameValue * 2;
                    r = 255;
                    g = 140 + intensity * 80;
                    b = 0;
                    a = 255;
                } else if (flameValue < 0.3) {
                    // Fuego medio
                    const intensity = (0.3 - flameValue) * 5;
                    r = 255;
                    g = 80 + intensity * 100;
                    b = 0;
                    a = 200 + intensity * 55;
                } else if (flameValue < 0.6) {
                    // Llamas altas
                    const intensity = (0.6 - flameValue) * 2;
                    r = 255;
                    g = 40 + intensity * 60;
                    b = 0;
                    a = 100 + intensity * 100;
                } else {
                    // Transparente
                    a = 0;
                }
                
                // Humo adicional si está quemando
                if (this.isBurning && py > -0.3) {
                    const smokeNoise = this.noise(vec3(px * 3, py * 2 + time * 0.5, time * 0.3));
                    if (smokeNoise > 0.3) {
                        r = 100;
                        g = 100;
                        b = 100;
                        a = Math.min(a + 80, 255);
                    }
                }
                
                const idx = (y * w + x) * 4;
                if (a > 0) {
                    data[idx] = r || 0;
                    data[idx + 1] = g || 0;
                    data[idx + 2] = b || 0;
                    data[idx + 3] = a || 0;
                }
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    }
    
    // Funciones de ruido (adaptadas del shader)
    noise(p) {
        const i = {
            x: Math.floor(p.x),
            y: Math.floor(p.y),
            z: Math.floor(p.z)
        };
        
        const a = i.x + i.y * 57 + i.z * 21;
        const f = {
            x: (Math.cos((p.x - i.x) * Math.PI) * -0.5 + 0.5),
            y: (Math.cos((p.y - i.y) * Math.PI) * -0.5 + 0.5),
            z: (Math.cos((p.z - i.z) * Math.PI) * -0.5 + 0.5)
        };
        
        // Mix simplificado
        let v1 = Math.sin(Math.cos(a) * a);
        let v2 = Math.sin(Math.cos(1 + a) * (1 + a));
        let m1 = v1 * (1 - f.x) + v2 * f.x;
        
        v1 = Math.sin(Math.cos(a + 1) * (a + 1));
        v2 = Math.sin(Math.cos(2 + a) * (2 + a));
        let m2 = v1 * (1 - f.x) + v2 * f.x;
        
        const m3 = m1 * (1 - f.y) + m2 * f.y;
        
        return (m3 * 0.5 + 0.5);
    }
    
    flame(p, time) {
        // Escalar para efecto
        const scaledP = {
            x: p.x,
            y: p.y * 0.5,
            z: p.z
        };
        
        // Esfera base
        const d = Math.sqrt(scaledP.x * scaledP.x + (scaledP.y + 1) * (scaledP.y + 1) + scaledP.z * scaledP.z) - 1.0;
        
        // Ruido para las llamas
        const n1 = this.noise({
            x: p.x + 0,
            y: p.y + time * 2,
            z: p.z
        });
        
        const n2 = this.noise({
            x: p.x * 3,
            y: p.y * 3,
            z: p.z * 3
        });
        
        return d + (n1 + n2 * 0.5) * 0.25 * (p.y + 1.5);
    }
    
    initSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'es-ES';
            
            this.recognition.onresult = (event) => {
                let transcript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    transcript += event.results[i][0].transcript;
                }
                
                const textarea = document.getElementById('letterInput');
                if (textarea) {
                    textarea.value = transcript;
                    this.updateCharCount();
                }
            };
            
            this.recognition.onerror = (event) => {
                console.error('Error de reconocimiento:', event.error);
                this.isListening = false;
                this.updateVoiceButton();
                document.getElementById('recordingIndicator').style.display = 'none';
                this.showToast('❌ No se pudo acceder al micrófono', 'info');
            };
            
            this.recognition.onend = () => {
                this.isListening = false;
                this.updateVoiceButton();
                document.getElementById('recordingIndicator').style.display = 'none';
            };
        } else {
            console.warn('Web Speech API no soportada');
        }
    }
    
    initFireSound() {
        if (window.Howl) {
            this.fireSound = new Howl({
                src: ['assets/sounds/fire-crackling.mp3'],
                loop: true,
                volume: 0.15,
                onload: () => {
                    console.log('🔥 Sonido de fuego cargado');
                    // Reproducir automáticamente al cargar
                    this.fireSound.play();
                },
                onloaderror: (id, error) => {
                    console.warn('⚠️ No se pudo cargar el sonido de fuego:', error);
                }
            });
        }
    }
    
    attachEvents() {
        const textarea = document.getElementById('letterInput');
        const finishBtn = document.getElementById('finishLetter');
        const voiceBtn = document.getElementById('voiceInput');
        const leverHandle = document.getElementById('leverHandle');
        
        if (textarea) {
            textarea.addEventListener('input', () => {
                this.updateCharCount();
                if (finishBtn) {
                    finishBtn.disabled = textarea.value.trim() === '';
                }
            });
        }
        
        if (finishBtn) {
            finishBtn.addEventListener('click', () => {
                const text = textarea.value.trim();
                if (text) {
                    this.saveLetter(text);
                    textarea.value = '';
                    this.updateCharCount();
                    finishBtn.disabled = true;
                }
            });
        }
        
        if (voiceBtn) {
            voiceBtn.addEventListener('click', () => {
                this.toggleVoiceRecognition();
            });
        }
        
        // Palanca deslizante
        if (leverHandle) {
            let isDragging = false;
            
            const startDrag = (clientX) => {
                isDragging = true;
                leverHandle.style.transition = 'none';
            };
            
            const onDrag = (clientX) => {
                if (!isDragging) return;
                
                const track = document.querySelector('.lever-track');
                const trackRect = track.getBoundingClientRect();
                
                let newLeft = ((clientX - trackRect.left) / trackRect.width) * 100;
                newLeft = Math.max(0, Math.min(100, newLeft));
                
                leverHandle.style.left = newLeft + '%';
                
                if (newLeft >= 95 && this.letters.length > 0 && !this.isBurning) {
                    this.burnLetters();
                    leverHandle.style.left = '0%';
                    isDragging = false;
                }
            };
            
            const endDrag = () => {
                if (isDragging) {
                    isDragging = false;
                    leverHandle.style.transition = 'left 0.3s ease';
                    
                    const currentLeft = parseFloat(leverHandle.style.left) || 0;
                    if (currentLeft < 95) {
                        leverHandle.style.left = '0%';
                    }
                }
            };
            
            leverHandle.addEventListener('mousedown', (e) => startDrag(e.clientX));
            document.addEventListener('mousemove', (e) => onDrag(e.clientX));
            document.addEventListener('mouseup', endDrag);
            
            leverHandle.addEventListener('touchstart', (e) => {
                e.preventDefault();
                startDrag(e.touches[0].clientX);
            });
            document.addEventListener('touchmove', (e) => {
                e.preventDefault();
                onDrag(e.touches[0].clientX);
            });
            document.addEventListener('touchend', endDrag);
        }
        
        document.getElementById('backFromRitual')?.addEventListener('click', () => {
            if (this.fireSound) this.fireSound.stop();
            if (window.app && window.app.router) {
                window.app.router.showGamesView();
            }
        });
    }
    
    updateCharCount() {
        const textarea = document.getElementById('letterInput');
        const counter = document.getElementById('letterCharCount');
        const finishBtn = document.getElementById('finishLetter');
        
        if (textarea && counter) {
            const length = textarea.value.length;
            counter.textContent = `${length}/500`;
            
            if (finishBtn) {
                finishBtn.disabled = length === 0;
            }
        }
    }
    
    toggleVoiceRecognition() {
        // Verificar soporte
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            this.showToast('🎤 Tu navegador no soporta dictado por voz', 'info');
            return;
        }
        
        if (!this.recognition) {
            this.showToast('🎤 Inicializando reconocimiento de voz...', 'info');
            this.initSpeechRecognition();
            return;
        }
        
        if (this.isListening) {
            this.recognition.stop();
            this.isListening = false;
            document.getElementById('recordingIndicator').style.display = 'none';
            this.updateVoiceButton();
            this.showToast('🎤 Grabación detenida', 'info');
        } else {
            // Solicitar permiso de micrófono
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then((stream) => {
                    // Detener el stream inmediatamente (solo necesitamos el permiso)
                    stream.getTracks().forEach(track => track.stop());
                    
                    // Iniciar reconocimiento
                    try {
                        this.recognition.start();
                        this.isListening = true;
                        document.getElementById('recordingIndicator').style.display = 'flex';
                        this.updateVoiceButton();
                        this.showToast('🎤 Escuchando... habla ahora', 'success');
                    } catch (e) {
                        console.error('Error al iniciar:', e);
                        this.showToast('❌ Error al iniciar grabación', 'info');
                    }
                })
                .catch((err) => {
                    console.error('Permiso denegado:', err);
                    this.showToast('❌ Necesitas permitir acceso al micrófono', 'info');
                    
                    // Mostrar instrucciones para Chrome
                    if (navigator.userAgent.includes('Chrome')) {
                        this.showToast('🔧 Haz clic en el ícono de candado 🔒 en la barra de direcciones y permite el micrófono', 'info');
                    }
                });
        }
    }
    
    updateVoiceButton() {
        const voiceBtn = document.getElementById('voiceInput');
        if (voiceBtn) {
            voiceBtn.innerHTML = this.isListening ? 
                '<span>🔴</span> Grabando...' : 
                '<span>🎤</span> Dictar';
            voiceBtn.style.background = this.isListening ? '#ef4444' : '';
        }
    }
    
    saveLetter(text) {
        const letter = {
            text: text,
            date: new Date().toISOString(),
            id: Date.now()
        };
        
        this.letters.push(letter);
        this.saveLetters();
        
        // Animación de carta doblándose
        this.animateLetterFolding(text);
        
        setTimeout(() => {
            this.updateShelf();
            this.showToast('✉️ Carta guardada en la repisa', 'success');
        }, 1500);
    }
    
    animateLetterFolding(text) {
        const paperCard = document.getElementById('paperCard');
        if (!paperCard) return;
        
        // Crear carta voladora
        const flyingLetter = document.createElement('div');
        flyingLetter.className = 'folding-letter';
        flyingLetter.innerHTML = `
            <div class="folding-paper">
                <div class="fold fold-1"></div>
                <div class="fold fold-2"></div>
                <div class="fold fold-3"></div>
            </div>
        `;
        
        const cardRect = paperCard.getBoundingClientRect();
        flyingLetter.style.left = cardRect.left + cardRect.width / 2 + 'px';
        flyingLetter.style.top = cardRect.top + cardRect.height / 2 + 'px';
        
        document.body.appendChild(flyingLetter);
        
        // Secuencia de doblado
        setTimeout(() => {
            flyingLetter.classList.add('folding');
        }, 100);
        
        setTimeout(() => {
            const shelf = document.querySelector('.shelf');
            if (shelf) {
                const shelfRect = shelf.getBoundingClientRect();
                flyingLetter.style.left = shelfRect.left + shelfRect.width / 2 + 'px';
                flyingLetter.style.top = shelfRect.top + 'px';
                flyingLetter.style.transform = 'translate(-50%, -100%) scale(0.3) rotate(180deg)';
                flyingLetter.style.opacity = '0';
            }
        }, 800);
        
        setTimeout(() => {
            flyingLetter.remove();
        }, 1500);
    }
    
    updateShelf() {
        const shelfContainer = document.getElementById('lettersOnShelf');
        if (shelfContainer) {
            shelfContainer.innerHTML = this.renderLetters();
        }
    }
    
    burnLetters() {
        if (this.letters.length === 0) return;
        
        this.isBurning = true;
        
        if (this.fireSound) {
            this.fireSound.play();
            setTimeout(() => this.fireSound.stop(), 4000);
        }
        
        const shelf = document.querySelector('.letters-on-shelf');
        if (shelf) {
            shelf.style.animation = 'burnAway 2.5s ease forwards';
        }
        
        this.createSmokeParticles();
        
        const burnedCount = this.letters.length;
        
        setTimeout(() => {
            this.letters = [];
            this.saveLetters();
            this.updateShelf();
            
            const newShelf = document.querySelector('.letters-on-shelf');
            if (newShelf) {
                newShelf.style.animation = '';
                newShelf.innerHTML = '<p class="empty-shelf-message">📭 La repisa está vacía</p>';
            }
            
            this.isBurning = false;
            
            if (window.app && window.app.anxietyState) {
                for (let i = 0; i < Math.min(burnedCount, 3); i++) {
                    window.app.anxietyState.reduceLevel();
                }
                
                this.showToast(`🔥 ${burnedCount} preocupaciones convertidas en cenizas`, 'success');
            }
        }, 2500);
    }
    
    createSmokeParticles() {
        const ashContainer = document.getElementById('ashParticles');
        if (!ashContainer) return;
        
        ashContainer.innerHTML = '';
        
        for (let i = 0; i < 40; i++) {
            const particle = document.createElement('div');
            particle.className = 'smoke-particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 2 + 's';
            particle.style.width = (10 + Math.random() * 30) + 'px';
            particle.style.height = particle.style.width;
            ashContainer.appendChild(particle);
            
            setTimeout(() => particle.remove(), 5000);
        }
    }
    
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = type === 'success' ? 'ritual-toast-success' : 'ritual-toast-info';
        toast.innerHTML = `<span>${type === 'success' ? '✨' : '🔥'}</span> ${message}`;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }
}

// Función auxiliar
function vec3(x, y, z) { return { x, y, z }; }

export function initRitualFire(container) {
    const game = new RitualFire(container);
    game.render();
    return game;
}