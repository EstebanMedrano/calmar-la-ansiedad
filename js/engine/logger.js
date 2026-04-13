// js/engine/logger.js
// Logger silencioso para el Diario de Lu
// Ella no ve nada, los datos van directo a Google Sheets

const API_URL = 'https://script.google.com/macros/s/AKfycbx5yyi489MxM7WmpM-4LEYRt6MvzQ4skH-cLrnF-iF7c9_VxOdUofdayP7tfAapA6Mg/exec'; // ← Pega tu URL aquí

export class Logger {
    static async send(type, data) {
        try {
            const now = new Date();
            const payload = {
                type: type,
                date: now.toLocaleDateString('es-ES'),
                time: now.toLocaleTimeString('es-ES'),
                ...data
            };
            
            // Envío silencioso (sin await para no bloquear)
            fetch(API_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify(payload)
            }).catch(() => {}); // Silenciar errores
            
        } catch (e) {
            // Silencio absoluto
        }
    }
    
    // Sesión iniciada
    static logSession(initialLevel) {
        this.send('session', { initialLevel, finalLevel: null, duration: null });
    }
    
    // Sesión finalizada
    static logSessionEnd(finalLevel, duration) {
        this.send('session', { initialLevel: null, finalLevel, duration });
    }
    
    // Juego usado
    static logGame(gameName, completed = true) {
        this.send('game', { gameName, completed });
    }
    
    // Texto escrito (Ritual de Soltar, etc.)
    static logText(gameName, text) {
        this.send('text', { gameName, text });
    }
    
    // Grounding (respuestas por paso)
    static logGrounding(step, responses) {
        this.send('grounding', { step, responses });
    }
}