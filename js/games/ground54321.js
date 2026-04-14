// js/games/ground54321.js
// Técnica de Grounding 5-4-3-2-1

export class GroundingGame {
    constructor(container) {
        this.container = container;
        
        this.steps = [
            { id: 'see', number: 5, label: 'COSAS QUE PUEDES VER', icon: '👁️', items: [] },
            { id: 'touch', number: 4, label: 'COSAS QUE PUEDES TOCAR', icon: '🖐️', items: [] },
            { id: 'hear', number: 3, label: 'COSAS QUE PUEDES OÍR', icon: '👂', items: [] },
            { id: 'smell', number: 2, label: 'COSAS QUE PUEDES OLER', icon: '👃', items: [] },
            { id: 'taste', number: 1, label: 'ALGO QUE PUEDES SABOREAR', icon: '👅', items: [] }
        ];
        
        this.currentStepIndex = 0;
        
        // 🆕 Logger
        this.gameName = 'Grounding 5-4-3-2-1';
        this.startTime = Date.now();
    }
    
    render() {
        // 🆕 Registrar entrada
        import('../engine/logger.js').then(module => {
            module.Logger.logGameVisit(this.gameName);
        });
        
        const step = this.steps[this.currentStepIndex];
        const remaining = step.number - step.items.length;
        const progressPercent = (step.items.length / step.number) * 100;
        const totalProgress = this.getTotalProgress();
        
        this.container.innerHTML = `
            <div class="grounding-game">
                <h2 class="text-center" style="margin-bottom: 8px;">
                    <span style="background: linear-gradient(135deg, #10b981, #8b5cf6); -webkit-background-clip: text; background-clip: text; color: transparent;">
                        🌍 Técnica 5-4-3-2-1
                    </span>
                </h2>
                
                <div class="grounding-steps-indicators" style="margin-bottom: 24px;">
                    <div class="steps-row">
                        ${this.steps.map((s, index) => `
                            <div class="step-indicator ${index === this.currentStepIndex ? 'active' : ''} ${s.items.length === s.number ? 'completed' : ''}" data-step="${index}">
                                <span class="step-icon">${s.icon}</span>
                                <span class="step-number">${s.number}</span>
                                ${s.items.length === s.number ? '<span class="step-check">✓</span>' : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="total-progress-bar" style="margin-bottom: 24px;">
                    <div class="total-progress-fill" style="width: ${totalProgress}%"></div>
                </div>
                
                <div class="current-step-container">
                    <div class="step-header">
                        <span class="step-main-icon">${step.icon}</span>
                        <h3>${step.label}</h3>
                        <span class="step-counter">${step.items.length}/${step.number}</span>
                    </div>
                    
                    <div class="step-progress-bar">
                        <div class="step-progress-fill" style="width: ${progressPercent}%"></div>
                    </div>
                    
                    <p class="step-description">${this.getDescription(step.id, remaining)}</p>
                    
                    <div class="items-list">
                        ${step.items.map(item => `<div class="item-pill"><span>✓</span> ${this.escapeHtml(item)}</div>`).join('')}
                    </div>
                    
                    ${step.items.length < step.number ? `
                        <div class="input-group">
                            <input type="text" id="groundingInput" class="grounding-input" placeholder="${this.getPlaceholder(step.id)}" autocomplete="off">
                            <button id="addItemBtn" class="btn-add" disabled><span>✚</span> <span class="btn-text">Añadir</span></button>
                        </div>
                    ` : `
                        <div class="step-completed-message"><span>✨</span> ¡Completado! <span>✨</span></div>
                        ${this.currentStepIndex < this.steps.length - 1 ? `
                            <button id="nextStepBtn" class="btn-primary" style="margin-top: 16px; width: 100%;">Siguiente paso →</button>
                        ` : `
                            <button id="finishGameBtn" class="btn-primary" style="margin-top: 16px; width: 100%; background: linear-gradient(135deg, #10b981, #059669);">🌟 Finalizar grounding</button>
                        `}
                    `}
                </div>
                
                <div style="display: flex; gap: 16px; justify-content: center; margin-top: 32px;">
                    <button id="backFromGrounding" class="btn-secondary">← Volver a juegos</button>
                </div>
            </div>
        `;
        
        this.attachEvents();
    }
    
    getTotalProgress() {
        const totalItems = this.steps.reduce((sum, step) => sum + step.number, 0);
        const completedItems = this.steps.reduce((sum, step) => sum + step.items.length, 0);
        return (completedItems / totalItems) * 100;
    }
    
    getDescription(stepId, remaining) {
        const descriptions = {
            see: `Observa detenidamente tu entorno. Te quedan ${remaining} por encontrar. (anota 1 a la vez)`,
            touch: `Siente las texturas a tu alcance. Te quedan ${remaining} por identificar. (anota 1 a la vez)`,
            hear: `Cierra los ojos un momento. Escucha con atención. Te quedan ${remaining}. (anota 1 a la vez)`,
            smell: `Inhala profundamente. ¿Qué aromas percibes? Te quedan ${remaining}. (anota 1 a la vez)`,
            taste: `¿Hay algún sabor en tu boca? Tómate un momento para notarlo.`
        };
        return descriptions[stepId] || '';
    }
    
    getPlaceholder(stepId) {
        const placeholders = {
            see: 'Ej: La luz de la ventana, mi taza favorita...',
            touch: 'Ej: La textura de mi ropa, el teclado...',
            hear: 'Ej: El viento, mi respiración...',
            smell: 'Ej: Café, aire fresco...',
            taste: 'Ej: Menta, agua...'
        };
        return placeholders[stepId] || 'Escribe aquí...';
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    attachEvents() {
        document.getElementById('backFromGrounding')?.addEventListener('click', () => {
            this.cleanup();
            if (window.app && window.app.router) window.app.router.showGamesView();
        });
        
        const input = document.getElementById('groundingInput');
        const addBtn = document.getElementById('addItemBtn');
        const nextBtn = document.getElementById('nextStepBtn');
        const finishBtn = document.getElementById('finishGameBtn');
        
        if (input && addBtn) {
            input.addEventListener('input', () => addBtn.disabled = input.value.trim() === '');
            input.addEventListener('keypress', (e) => { if (e.key === 'Enter' && input.value.trim() !== '') this.addItem(input.value.trim()); });
            addBtn.addEventListener('click', () => { if (input.value.trim() !== '') this.addItem(input.value.trim()); });
            input.focus();
        }
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextStep());
        if (finishBtn) finishBtn.addEventListener('click', () => this.finishGame());
    }
    
    addItem(value) {
        const step = this.steps[this.currentStepIndex];
        if (step.items.includes(value)) { this.showToast('✨ Ya anotaste eso, intenta con otra cosa', 'info'); return; }
        step.items.push(value);
        if (step.items.length === step.number) {
            import('../engine/logger.js').then(module => module.Logger.logGrounding(step.label, step.items.join(' | ')));
            this.showToast(`🎉 ¡Excelente! Completaste este paso`, 'success');
        }
        this.render();
    }
    
    nextStep() {
        if (this.currentStepIndex < this.steps.length - 1) { this.currentStepIndex++; this.render(); }
    }
    
    finishGame() {
        const allCompleted = this.steps.every(step => step.items.length === step.number);
        if (!allCompleted) { this.showToast('⚠️ Aún hay pasos sin completar', 'info'); return; }
        
        this.container.innerHTML = `
            <div class="completion-celebration">
                <div class="celebration-emoji">🌟</div><h3>¡Lo lograste!</h3><p>Has completado el grounding. Estás anclada al presente.</p>
                <div class="completion-summary">${this.steps.map(step => `<div class="summary-step"><span>${step.icon}</span><span>${step.number} ${step.label.toLowerCase()}</span><span style="font-size:0.8rem;color:#10b981;">✓</span></div>`).join('')}</div>
                <div style="margin-top:32px;"><button id="backAfterComplete" class="btn-primary" style="background:linear-gradient(135deg,#10b981,#059669);">← Volver a juegos</button></div>
            </div>
        `;
        
        if (window.app && window.app.anxietyState) {
            const newLevel = window.app.anxietyState.reduceLevel(this.gameName);
            const toast = document.createElement('div'); toast.className = 'grounding-toast-success'; toast.style.fontSize = '1.2rem'; toast.style.padding = '20px 40px'; toast.innerText = '🌍 ¡Grounding completado! Has vuelto al presente.'; document.body.appendChild(toast); setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 4000);
            if (newLevel === 0) setTimeout(() => { if (window.app && window.app.router) window.app.router.showVictoryMessage(); }, 2000);
        }
        document.getElementById('backAfterComplete')?.addEventListener('click', () => { if (window.app && window.app.router) window.app.router.showGamesView(); });
    }
    
    showToast(message, type = 'info') {
        const toast = document.createElement('div'); toast.className = type === 'success' ? 'grounding-toast-success' : 'grounding-toast-info'; toast.innerText = message; document.body.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 2000);
    }
    
    cleanup() {
        // 🆕 Registrar duración
        const duration = Math.round((Date.now() - this.startTime) / 1000);
        import('../engine/logger.js').then(module => module.Logger.logGameVisit(this.gameName, duration));
    }
}

export function initGrounding(container) { const game = new GroundingGame(container); game.render(); return game; }