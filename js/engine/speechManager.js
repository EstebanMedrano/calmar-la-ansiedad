export class SpeechManager {
    speak(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 1.1;
            utterance.lang = 'es-ES';
            window.speechSynthesis.speak(utterance);
        }
    }
}