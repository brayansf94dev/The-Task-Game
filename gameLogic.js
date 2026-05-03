// gameLogic.js
// Aqui ficarão os estados do jogo no futuro
export const gameState = {
    timer: 300, // 5 minutos em segundos[cite: 1]
    kpis: {
        saudeMental: 100,
        satChefe: 100,
        satCliente: 100,
        climaEquipe: 100
    },
    fatorSorte: 5 // Valor default[cite: 1]
};

export function updateGameLogic(deltaTime) {
    // Lógica que rodará a cada frame (reduzir timer, verificar KPIs, etc)
}