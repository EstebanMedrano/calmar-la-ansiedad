// js/games/waterCalm.js
// Lago de Calma - Efecto agua fotorrealista estilo RainbowHunt
// Con gotas de color que revelan claridad

import { getSoundManager } from '../engine/soundManager.js';
export class WaterCalm {
    constructor(container) {
        this.container = container;
        this.canvas = null;
        this.ctx = null;
        
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        // Sistema de partículas/ondas
        this.ripples = [];
        this.maxRipples = 40;
        
        // Color seleccionado
        this.colors = [
            { name: 'Calma', color: '#3b82f6', emoji: '🔵' },
            { name: 'Naturaleza', color: '#10b981', emoji: '🟢' },
            { name: 'Serenidad', color: '#8b5cf6', emoji: '🟣' },
            { name: 'Alegría', color: '#fbbf24', emoji: '🟡' },
            { name: 'Amor', color: '#f472b6', emoji: '🩷' },
            { name: 'Energía', color: '#fb923c', emoji: '🟠' },
            { name: 'Claridad', color: '#e5e7eb', emoji: '⚪' },
            { name: 'Sorpresa', color: 'rainbow', emoji: '🌈' }
        ];
        
        this.selectedColor = '#3b82f6';
        this.isAnimating = true;
        
        // Para el efecto de agua base
        this.waterOffset = 0;

        this.soundManager = null;
        this.initSoundManager();
    }
    
    initSoundManager() {
        try {
            this.soundManager = getSoundManager();
        } catch (e) {
            console.warn('💧 SoundManager no disponible aún');
        }
    }

    render() {
        this.container.innerHTML = `
            <div class="lake-calm-container">
                <canvas id="lakeCanvas"></canvas>
                
                <!-- Paleta de colores flotante -->
                <div class="color-palette-lake">
                    ${this.colors.map((c, i) => `
                        <div class="color-btn-lake ${c.color === 'rainbow' ? 'rainbow-btn' : ''}" 
                             data-color="${c.color}" 
                             style="${c.color !== 'rainbow' ? `background: ${c.color};` : ''}">
                            <span class="color-emoji">${c.emoji}</span>
                        </div>
                    `).join('')}
                </div>
                
                <!-- Controles -->
                <div class="lake-controls">
                    <button id="clearLake" class="lake-btn">🧹 Limpiar</button>
                    <button id="backFromLake" class="lake-btn">← Volver</button>
                </div>
                
                <!-- Hint -->
                <div class="lake-hint">
                    <span>💧 Toca el agua para crear ondas de color</span>
                </div>
            </div>
        `;
        
        this.initCanvas();
        this.attachEvents();
        this.animate();
    }
    
    initCanvas() {
        this.canvas = document.getElementById('lakeCanvas');
        this.ctx = this.canvas.getContext('2d', { 
            alpha: true,
            willReadFrequently: false 
        });
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }
    
    attachEvents() {
        // Seleccionar color
        document.querySelectorAll('.color-btn-lake').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectedColor = btn.dataset.color;
                document.querySelectorAll('.color-btn-lake').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
            });
        });
        
        document.querySelector('.color-btn-lake')?.classList.add('selected');
        
        // Interacción con el agua
        this.canvas.addEventListener('mousemove', (e) => {
            if (e.buttons === 1) { // Click sostenido
                this.createRipple(e.clientX, e.clientY);
            }
        });
        
        this.canvas.addEventListener('click', (e) => {
            this.createRipple(e.clientX, e.clientY);
        });
        
        // Touch events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            Array.from(e.touches).forEach(touch => {
                this.createRipple(touch.clientX, touch.clientY);
            });
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            Array.from(e.touches).forEach(touch => {
                this.createRipple(touch.clientX, touch.clientY);
            });
        });
        
        // Limpiar
        document.getElementById('clearLake')?.addEventListener('click', () => {
            this.ripples = [];
        });
        
        // Volver
        document.getElementById('backFromLake')?.addEventListener('click', () => {
            this.cleanup();
            if (window.app && window.app.router) {
                window.app.router.showGamesView();
            }
        });
        
        // Ocultar hint
        setTimeout(() => {
            document.querySelector('.lake-hint')?.style.setProperty('opacity', '0');
        }, 4000);
    }
    
    createRipple(x, y) {
        let color;
        if (this.selectedColor === 'rainbow') {
            const hue = (Date.now() / 10) % 360;
            color = `hsl(${hue}, 80%, 60%)`;
        } else {
            color = this.selectedColor;
        }
        
        this.ripples.push({
            x, y,
            radius: 5,
            maxRadius: Math.min(this.width, this.height) * 0.4,
            color: color,
            strength: 1.0,
            speed: 2.5,
            lineWidth: 2,
            active: true
        });
        
        // Limitar cantidad de ondas
        if (this.ripples.length > this.maxRipples) {
            this.ripples.shift();
        }

        if (this.soundManager) {
            this.soundManager.playWaterDrop();
        }
    }
    
    animate() {
        if (!this.isAnimating) return;
        
        // 1. Dibujar fondo de agua oscuro (capa base)
        this.drawWaterBackground();
        
        // 2. Dibujar ondas activas
        this.drawRipples();
        
        // 3. Actualizar ondas
        this.updateRipples();
        
        // 4. Efecto de brillo/distorsión (como lente de agua)
        this.applyWaterDistortion();
        
        requestAnimationFrame(() => this.animate());
    }
    
    drawWaterBackground() {
        // Fondo oscuro profundo (agua)
        const gradient = this.ctx.createLinearGradient(0, 0, this.width, this.height);
        gradient.addColorStop(0, '#0a1220');
        gradient.addColorStop(0.5, '#0d1b2a');
        gradient.addColorStop(1, '#1b2d45');
        
        this.ctx.fillStyle = gradient;
        this.ctx.globalAlpha = 0.85;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Textura de ondas sutiles (caústicas)
        this.waterOffset += 0.005;
        this.ctx.globalAlpha = 0.15;
        
        for (let i = 0; i < 3; i++) {
            const offsetX = Math.sin(this.waterOffset + i) * 50;
            const offsetY = Math.cos(this.waterOffset * 0.7 + i) * 30;
            
            const radial = this.ctx.createRadialGradient(
                this.width/2 + offsetX, this.height/2 + offsetY, 0,
                this.width/2 + offsetX, this.height/2 + offsetY, Math.max(this.width, this.height)
            );
            radial.addColorStop(0, 'rgba(60, 120, 200, 0.05)');
            radial.addColorStop(1, 'transparent');
            
            this.ctx.fillStyle = radial;
            this.ctx.fillRect(0, 0, this.width, this.height);
        }
        
        this.ctx.globalAlpha = 1.0;
    }
    
    drawRipples() {
        this.ripples.forEach(ripple => {
            if (!ripple.active) return;
            
            const progress = ripple.radius / ripple.maxRadius;
            const alpha = Math.max(0, 0.7 - progress * 0.5);
            const lineAlpha = Math.max(0, 0.5 - progress * 0.3);
            
            // Onda principal (relleno con gradiente)
            const gradient = this.ctx.createRadialGradient(
                ripple.x, ripple.y, 0,
                ripple.x, ripple.y, ripple.radius
            );
            
            const color = this.hexToRgba(ripple.color, alpha * 0.6);
            const colorMid = this.hexToRgba(ripple.color, alpha * 0.3);
            
            gradient.addColorStop(0, color);
            gradient.addColorStop(0.5, colorMid);
            gradient.addColorStop(1, 'transparent');
            
            this.ctx.beginPath();
            this.ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
            
            // Anillos concéntricos (más realismo)
            for (let i = 0; i < 3; i++) {
                const ringRadius = ripple.radius - (i * 12);
                if (ringRadius > 5) {
                    this.ctx.beginPath();
                    this.ctx.arc(ripple.x, ripple.y, ringRadius, 0, Math.PI * 2);
                    this.ctx.strokeStyle = this.hexToRgba(ripple.color, lineAlpha * (1 - i * 0.2));
                    this.ctx.lineWidth = 1.5;
                    this.ctx.stroke();
                }
            }
            
            // Brillo central
            const glowGradient = this.ctx.createRadialGradient(
                ripple.x, ripple.y, 0,
                ripple.x, ripple.y, ripple.radius * 0.3
            );
            glowGradient.addColorStop(0, this.hexToRgba('#ffffff', alpha * 0.8));
            glowGradient.addColorStop(1, 'transparent');
            
            this.ctx.beginPath();
            this.ctx.arc(ripple.x, ripple.y, ripple.radius * 0.3, 0, Math.PI * 2);
            this.ctx.fillStyle = glowGradient;
            this.ctx.fill();
        });
    }
    
    applyWaterDistortion() {
        // Efecto sutil de "lente de agua" en las zonas donde hay ondas
        this.ctx.globalCompositeOperation = 'overlay';
        
        this.ripples.forEach(ripple => {
            if (!ripple.active || ripple.radius > ripple.maxRadius * 0.8) return;
            
            const distortion = this.ctx.createRadialGradient(
                ripple.x, ripple.y, 0,
                ripple.x, ripple.y, ripple.radius * 0.5
            );
            distortion.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
            distortion.addColorStop(1, 'transparent');
            
            this.ctx.beginPath();
            this.ctx.arc(ripple.x, ripple.y, ripple.radius * 0.5, 0, Math.PI * 2);
            this.ctx.fillStyle = distortion;
            this.ctx.fill();
        });
        
        this.ctx.globalCompositeOperation = 'source-over';
    }
    
    updateRipples() {
        this.ripples = this.ripples.filter(ripple => {
            ripple.radius += ripple.speed;
            
            if (ripple.radius >= ripple.maxRadius) {
                ripple.active = false;
                return false;
            }
            
            return true;
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
        window.removeEventListener('resize', this.resizeCanvas);
    }
}

export function initWaterCalm(container) {
    const game = new WaterCalm(container);
    game.render();
    return game;
}