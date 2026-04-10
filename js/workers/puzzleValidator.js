// js/workers/puzzleValidator.js
// Web Worker para validar figuras geométricas
// Se ejecuta en segundo plano sin bloquear la UI

self.addEventListener('message', (e) => {
    const { type, pieces, targetShape } = e.data;
    
    if (type === 'validate') {
        const isValid = validatePuzzle(pieces, targetShape);
        self.postMessage({ type: 'validationResult', isValid });
    }
});

function validatePuzzle(pieces, targetShape) {
    // Calcular el centroide de todas las piezas
    const centroid = calculateCentroid(pieces);
    
    // Verificar que las piezas estén cerca del centro
    const tolerance = 50;
    const isNearCenter = pieces.every(piece => {
        const dx = piece.x - centroid.x;
        const dy = piece.y - centroid.y;
        return Math.sqrt(dx * dx + dy * dy) < tolerance;
    });
    
    // Verificar que no haya piezas superpuestas (simplificado)
    const noOverlap = checkNoOverlap(pieces);
    
    return isNearCenter && noOverlap;
}

function calculateCentroid(pieces) {
    const sum = pieces.reduce((acc, p) => {
        acc.x += p.x;
        acc.y += p.y;
        return acc;
    }, { x: 0, y: 0 });
    
    return {
        x: sum.x / pieces.length,
        y: sum.y / pieces.length
    };
}

function checkNoOverlap(pieces) {
    // Simplificado: verificar distancias mínimas
    const minDistance = 30;
    
    for (let i = 0; i < pieces.length; i++) {
        for (let j = i + 1; j < pieces.length; j++) {
            const dx = pieces[i].x - pieces[j].x;
            const dy = pieces[i].y - pieces[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < minDistance) {
                return false;
            }
        }
    }
    
    return true;
}