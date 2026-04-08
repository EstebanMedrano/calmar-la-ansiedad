export class PWAManager {
    constructor() {
        this.registerServiceWorker();
    }
    
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(reg => console.log('Service Worker registrado:', reg))
                .catch(err => console.log('Error al registrar SW:', err));
        }
    }
}