// js/games/cartaParaLu.js
// La Carta Mágica - Un mensaje especial para Lu
// Tito o Lia te traen una carta que vuela y se abre

export class CartaParaLu {
    constructor(container) {
        this.container = container;
        this.canvas = null;
        this.ctx = null;
        
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        // Estado
        this.state = 'intro'; // intro, flying, opening, reading
        this.dog = Math.random() > 0.5 ? 'tito' : 'lia';
        
        // Perro
        this.dogImg = null;
        this.dogX = this.width * 0.2;
        this.dogY = this.height * 0.5;
        this.dogVx = 3.5;
        this.dogVy = 2.5;
        
        // Carta
        this.letter = {
            x: this.dogX + 50,
            y: this.dogY - 20,
            scale: 0.3,
            rotation: 0,
            targetScale: 1.5,
            flying: false,
            vx: 0,
            vy: 0
        };
        
        // Tiempo de vuelo
        this.flightStartTime = 0;
        this.flightDuration = 10000; // 10 segundos
        
        // Ondas de color (rastro)
        this.ripples = [];
        this.maxRipples = 40;
        this.hue = 0;
        
        // Texto de la carta
        this.letterText = '';
        this.displayedText = '';
        this.typewriterIndex = 0;
        this.typewriterInterval = null;
        
        // Carga
        this.isLoading = true;
        this.animationFrame = null;
        this.isAnimating = true;
        this.originalBodyBg = document.body.style.background;
    }
    
    initLetterText() {
        this.letterText = `
    Mi Lu Bonita,

    Sé que a veces la ansiedad te hace sentir que el mundo es demasiado grande y tú demasiado pequeña.

    Pero recuerda que un día te abrazaré tan fuerte que todas tus partes rotas volverán a pegarse en su lugar. Te abrazaré tan fuerte que entenderás por qué tuviste que pasar por el dolor, las dudas, los miedos, las rupturas y las traiciones. Te abrazaré tan fuerte que, aunque tengo miedo de que te lastimen, no querrás soltarte. Te abrazaré tan fuerte que tu mente y tu cuerpo sabrán quedarse; no querrás huir, querrás quedarte. Te abrazaré tan fuerte que el miedo se convertirá en paz y el tiempo en esperanza. Te abrazaré tan fuerte que también volverás a abrazarte a ti misma, mi Lu...

    Porque cuando la vida se sienta pesada o todo parezca demasiado, deja que esta carta te recuerde que no estás sola y que nunca lo estarás. Sobre todo, cuando las palabras no alcancen, esto es un recordatorio para pausar y respirar. Siempre puedes contar conmigo, pase lo que pase, estemos donde estemos. No importa el momento, el lugar o la distancia. Puedes estar segura de que ahí estaré para ti. Puedes volver a esta carta cada vez que lo necesites.

    Te quiere y con mucho cariño,
    El Tebs.
    `;
    }
    render() {
        this.initLetterText();
        
        const dogName = this.dog === 'tito' ? 'Tito 🦊' : 'Lia 🤍';
        
        this.container.innerHTML = `
            <div class="carta-magica-container">
                <canvas id="cartaCanvas"></canvas>
                
                <div class="carta-hint">
                    <span>💌 Quítale la carta a ${dogName}</span>
                </div>
                
                <button id="backFromCarta" class="carta-back-btn">← Volver</button>
            </div>
        `;
        
        this.initCanvas();
        this.loadDog();
        this.attachEvents();
        this.animate();
    }
    
    initCanvas() {
        this.canvas = document.getElementById('cartaCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }
    
    loadDog() {
        this.dogImg = new Image();
        this.dogImg.onload = () => {
            this.isLoading = false;
        };
        this.dogImg.src = this.dog === 'tito' 
            ? 'assets/img/perros/tito.png' 
            : 'assets/img/perros/lia.png';
    }
    
    attachEvents() {
        this.canvas.addEventListener('click', (e) => {
            if (this.state === 'intro') {
                const rect = this.canvas.getBoundingClientRect();
                const scaleX = this.canvas.width / rect.width;
                const scaleY = this.canvas.height / rect.height;
                
                const clickX = (e.clientX - rect.left) * scaleX;
                const clickY = (e.clientY - rect.top) * scaleY;
                
                const letterCenterX = this.letter.x;
                const letterCenterY = this.letter.y;
                const letterSize = 80 * this.letter.scale;
                
                const dist = Math.sqrt(
                    Math.pow(clickX - letterCenterX, 2) + 
                    Math.pow(clickY - letterCenterY, 2)
                );
                
                if (dist < letterSize) {
                    this.startFlight();
                }
            } else if (this.state === 'reading' && !this.typewriterInterval) {
                // Salir al tocar después de leer
                this.cleanup();
                if (window.app && window.app.router) {
                    window.app.router.showGamesView();
                }
            }
        });
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.state === 'intro') {
                const rect = this.canvas.getBoundingClientRect();
                const touch = e.touches[0];
                const scaleX = this.canvas.width / rect.width;
                const scaleY = this.canvas.height / rect.height;
                
                const touchX = (touch.clientX - rect.left) * scaleX;
                const touchY = (touch.clientY - rect.top) * scaleY;
                
                const dist = Math.sqrt(
                    Math.pow(touchX - this.letter.x, 2) + 
                    Math.pow(touchY - this.letter.y, 2)
                );
                
                if (dist < 80 * this.letter.scale) {
                    this.startFlight();
                }
            } else if (this.state === 'reading' && !this.typewriterInterval) {
                this.cleanup();
                if (window.app && window.app.router) {
                    window.app.router.showGamesView();
                }
            }
        });
        
        document.getElementById('backFromCarta')?.addEventListener('click', () => {
            this.cleanup();
            if (window.app && window.app.router) {
                window.app.router.showGamesView();
            }
        });
    }
    
    startFlight() {
        this.state = 'flying';
        this.letter.flying = true;
        this.flightStartTime = Date.now();
        
        // Velocidad inicial aleatoria
        this.letter.vx = (Math.random() - 0.5) * 12;
        this.letter.vy = (Math.random() - 0.5) * 10 - 3;
        
        document.querySelector('.carta-hint')?.remove();
    }
    
    updateFlight() {
        if (!this.letter.flying) return;
        
        const elapsed = Date.now() - this.flightStartTime;
        const progress = Math.min(elapsed / this.flightDuration, 1);
        
        // Movimiento de vuelo
        this.letter.x += this.letter.vx;
        this.letter.y += this.letter.vy;
        
        // Gravedad suave
        this.letter.vy += 0.06;
        
        // Rotación
        this.letter.rotation += 0.05;
        
        // Aumentar escala gradualmente
        this.letter.scale = 0.3 + (progress * 1.2);
        
        // Crear ondas de color
        this.hue = (this.hue + 3) % 360;
        if (Math.random() > 0.3) {
            this.createRipple(this.letter.x, this.letter.y);
        }
        
        // Cambiar fondo del body
        document.body.style.background = `linear-gradient(135deg, hsl(${this.hue}, 45%, 12%), hsl(${(this.hue + 60) % 360}, 45%, 18%))`;
        document.body.style.backgroundSize = '400% 400%';
        document.body.style.animation = 'gradient-shift 8s ease infinite';
        
        // Rebotes en bordes
        const margin = 50;
        if (this.letter.x < margin) {
            this.letter.x = margin;
            this.letter.vx *= -0.85;
        }
        if (this.letter.x > this.width - margin) {
            this.letter.x = this.width - margin;
            this.letter.vx *= -0.85;
        }
        if (this.letter.y < margin) {
            this.letter.y = margin;
            this.letter.vy *= -0.8;
        }
        if (this.letter.y > this.height - margin) {
            this.letter.y = this.height - margin;
            this.letter.vy *= -0.6;
        }
        
        // Movimiento aleatorio adicional
        if (Math.random() > 0.9) {
            this.letter.vx += (Math.random() - 0.5) * 4;
            this.letter.vy += (Math.random() - 0.5) * 3;
        }
        
        // Limitar velocidad
        const maxSpeed = 15;
        const speed = Math.sqrt(this.letter.vx ** 2 + this.letter.vy ** 2);
        if (speed > maxSpeed) {
            this.letter.vx *= maxSpeed / speed;
            this.letter.vy *= maxSpeed / speed;
        }
        
        // Verificar si terminó el tiempo de vuelo
        if (progress >= 1) {
            this.openLetter();
        }
    }
    
    createRipple(x, y) {
        this.ripples.push({
            x, y,
            radius: 8,
            maxRadius: 120,
            color: `hsl(${this.hue}, 80%, 60%)`,
            speed: 3.5,
            active: true
        });
        
        if (this.ripples.length > this.maxRipples) {
            this.ripples.shift();
        }
    }
    
    openLetter() {
        this.state = 'opening';
        this.letter.flying = false;
        
        const startX = this.letter.x;
        const startY = this.letter.y;
        const startScale = this.letter.scale;
        const startRotation = this.letter.rotation;
        
        const startTime = Date.now();
        const duration = 2000; // 2 segundos para abrir
        
        const animateOpening = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing suave
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            // Mover al centro
            this.letter.x = startX + (this.width / 2 - startX) * easeProgress;
            this.letter.y = startY + (this.height / 2 - startY) * easeProgress;
            
            // Enderezar la carta (rotación a 0)
            this.letter.rotation = startRotation * (1 - easeProgress);
            
            // Aumentar escala
            this.letter.scale = startScale + (1.6 - startScale) * easeProgress;
            
            if (progress < 1) {
                requestAnimationFrame(animateOpening);
            } else {
                // Carta completamente abierta
                this.letter.rotation = 0;
                this.state = 'reading';
                this.startTypewriter();
            }
        };
        
        animateOpening();
    }
    
    startTypewriter() {
        this.displayedText = '';
        this.typewriterIndex = 0;
        
        this.typewriterInterval = setInterval(() => {
            if (this.typewriterIndex < this.letterText.length) {
                this.displayedText += this.letterText[this.typewriterIndex];
                this.typewriterIndex++;
            } else {
                clearInterval(this.typewriterInterval);
                this.typewriterInterval = null;
            }
        }, 35);
    }
    
    updateDog() {
        if (this.isLoading) return;
        
        // Movimiento aleatorio del perro
        this.dogVx += (Math.random() - 0.5) * 0.8;
        this.dogVy += (Math.random() - 0.5) * 0.8;
        
        // Limitar velocidad
        const maxSpeed = 6;
        const speed = Math.sqrt(this.dogVx ** 2 + this.dogVy ** 2);
        if (speed > maxSpeed) {
            this.dogVx *= maxSpeed / speed;
            this.dogVy *= maxSpeed / speed;
        }
        
        this.dogX += this.dogVx;
        this.dogY += this.dogVy;
        
        // Rebotes en bordes
        const margin = 80;
        if (this.dogX < margin) {
            this.dogX = margin;
            this.dogVx *= -0.8;
        }
        if (this.dogX > this.width - margin) {
            this.dogX = this.width - margin;
            this.dogVx *= -0.8;
        }
        if (this.dogY < margin + 50) {
            this.dogY = margin + 50;
            this.dogVy *= -0.8;
        }
        if (this.dogY > this.height - margin) {
            this.dogY = this.height - margin;
            this.dogVy *= -0.8;
        }
        
        // La carta sigue al perro (en la boca)
        this.letter.x = this.dogX + 40;
        this.letter.y = this.dogY - 30;
        this.letter.rotation = Math.sin(Date.now() / 150) * 0.08;
    }
    
    animate() {
        if (!this.isAnimating) return;
        
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Fondo oscuro
        const gradient = this.ctx.createRadialGradient(
            this.width/2, this.height/2, 0,
            this.width/2, this.height/2, this.width/2
        );
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#0a0a15');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Dibujar ondas
        this.drawRipples();
        this.updateRipples();
        
        if (this.state === 'intro') {
            this.updateDog();
            this.drawDog();
            this.drawLetter();
        } else if (this.state === 'flying') {
            this.updateFlight();
            this.drawLetter();
        } else if (this.state === 'opening') {
            this.drawLetter();
        } else if (this.state === 'reading') {
            this.drawOpenLetter();
        }
        
        requestAnimationFrame(() => this.animate());
    }
    
    drawDog() {
        if (!this.dogImg) return;
        
        const dogSize = 120;
        this.ctx.save();
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 20;
        this.ctx.shadowOffsetY = 5;
        
        // Reflejar según dirección
        if (this.dogVx > 0) {
            this.ctx.translate(this.dogX + dogSize, this.dogY);
            this.ctx.scale(-1, 1);
            this.ctx.drawImage(this.dogImg, 0, -dogSize/2, dogSize, dogSize);
        } else {
            this.ctx.drawImage(this.dogImg, this.dogX, this.dogY - dogSize/2, dogSize, dogSize);
        }
        
        this.ctx.restore();
        
        // Nombre del perro
        this.ctx.font = 'bold 16px Inter';
        this.ctx.fillStyle = 'white';
        this.ctx.shadowColor = 'black';
        this.ctx.shadowBlur = 10;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            this.dog === 'tito' ? '🦊 Tito' : '🤍 Lia', 
            this.dogX + 60, 
            this.dogY - 70
        );
        this.ctx.shadowBlur = 0;
    }
    
    drawLetter() {
        this.ctx.save();
        this.ctx.translate(this.letter.x, this.letter.y);
        this.ctx.rotate(this.letter.rotation);
        this.ctx.scale(this.letter.scale, this.letter.scale);
        
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 25;
        this.ctx.shadowOffsetY = 8;
        
        // Sobre
        this.ctx.fillStyle = '#f5e6d3';
        this.ctx.fillRect(-50, -35, 100, 70);
        
        // Solapa
        this.ctx.fillStyle = '#e8d5c0';
        this.ctx.beginPath();
        this.ctx.moveTo(-50, -35);
        this.ctx.lineTo(0, 0);
        this.ctx.lineTo(50, -35);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Sello
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.beginPath();
        this.ctx.arc(30, -20, 10, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#c0392b';
        this.ctx.beginPath();
        this.ctx.arc(30, -20, 7, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    drawOpenLetter() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Papel MÁS GRANDE - ocupa casi toda la pantalla
        const paperWidth = Math.min(800, this.width - 20);
        const paperHeight = Math.min(750, this.height - 20);
        const paperX = (this.width - paperWidth) / 2;
        const paperY = (this.height - paperHeight) / 2;
        
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 30;
        this.ctx.fillStyle = '#fdf6e3';
        this.ctx.fillRect(paperX, paperY, paperWidth, paperHeight);
        this.ctx.shadowBlur = 0;
        
        this.ctx.strokeStyle = '#d4a76a';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(paperX + 8, paperY + 8, paperWidth - 16, paperHeight - 16);
        
        // Fuente un poco más pequeña
        this.ctx.font = '15px Georgia, serif';
        this.ctx.fillStyle = '#2c1810';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        
        const startX = paperX + 30;
        const startY = paperY + 30;
        const maxWidth = paperWidth - 60;
        const lineHeight = 25;
        
        const fullText = this.displayedText;
        const paragraphs = fullText.split('\n');
        
        let currentY = startY;
        const maxY = paperY + paperHeight - 45;
        
        paragraphs.forEach(paragraph => {
            if (currentY > maxY) return;
            
            if (paragraph.trim() === '') {
                currentY += lineHeight * 0.5;
                return;
            }
            
            const words = paragraph.split(' ');
            let currentLine = '';
            
            words.forEach(word => {
                const testLine = currentLine + (currentLine ? ' ' : '') + word;
                const metrics = this.ctx.measureText(testLine);
                
                if (metrics.width > maxWidth && currentLine) {
                    this.ctx.fillText(currentLine, startX, currentY);
                    currentLine = word;
                    currentY += lineHeight;
                } else {
                    currentLine = testLine;
                }
            });
            
            if (currentLine) {
                this.ctx.fillText(currentLine, startX, currentY);
                currentY += lineHeight;
            }
            
            currentY += lineHeight * 0.2;
        });
        
        // Cursor parpadeante
        if (this.typewriterInterval) {
            const lastLineY = currentY - lineHeight;
            const lastParagraph = paragraphs[paragraphs.length - 1] || '';
            const words = lastParagraph.split(' ');
            let lastDisplayedLine = '';
            
            words.forEach(word => {
                const testLine = lastDisplayedLine + (lastDisplayedLine ? ' ' : '') + word;
                if (this.ctx.measureText(testLine).width > maxWidth) {
                    lastDisplayedLine = word;
                } else {
                    lastDisplayedLine = testLine;
                }
            });
            
            this.ctx.fillStyle = '#2c1810';
            this.ctx.fillRect(startX + this.ctx.measureText(lastDisplayedLine).width, lastLineY, 2, 20);
        }
        
        // Mensaje final
        if (!this.typewriterInterval) {
            this.ctx.font = '13px Inter, sans-serif';
            this.ctx.fillStyle = '#8b5cf6';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('✨ Toca para volver ✨', this.width / 2, paperY + paperHeight - 20);
        }
    }
    
    drawRipples() {
        this.ripples.forEach(ripple => {
            if (!ripple.active) return;
            
            const progress = ripple.radius / ripple.maxRadius;
            const alpha = Math.max(0, 0.5 - progress * 0.4);
            
            const gradient = this.ctx.createRadialGradient(
                ripple.x, ripple.y, 0,
                ripple.x, ripple.y, ripple.radius
            );
            
            const color = this.hexToRgba(ripple.color, alpha * 0.35);
            gradient.addColorStop(0, color);
            gradient.addColorStop(1, 'transparent');
            
            this.ctx.beginPath();
            this.ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
            
            this.ctx.strokeStyle = this.hexToRgba(ripple.color, alpha * 0.25);
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        });
    }
    
    updateRipples() {
        this.ripples = this.ripples.filter(ripple => {
            ripple.radius += ripple.speed;
            return ripple.radius < ripple.maxRadius;
        });
    }
    
    hexToRgba(hex, alpha) {
        if (hex.startsWith('hsl')) return hex;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    cleanup() {
        this.isAnimating = false;
        if (this.typewriterInterval) clearInterval(this.typewriterInterval);
        document.body.style.background = this.originalBodyBg;
        document.body.style.animation = '';
        window.removeEventListener('resize', this.resizeCanvas);
    }
}

export function initCartaParaLu(container) {
    const game = new CartaParaLu(container);
    game.render();
    return game;
}