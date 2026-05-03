// camera.js
import * as THREE from 'three';

const GAME_WIDTH = 640;
const GAME_HEIGHT = 480;

// Cria a câmera
export const camera = new THREE.PerspectiveCamera(60, GAME_WIDTH / GAME_HEIGHT, 0.1, 100);
camera.rotation.order = 'YXZ'; 

// ==========================================
// ESTADOS E VARIÁVEIS INTERNAS
// ==========================================
let currentMode = 'LIVRE';
let orbitControls = null; // Vai guardar a referência dos controles do main.js

// Variáveis para o movimento Parallax (Modo Cadeira)
let mouseX = 0;
let mouseY = 0;
let targetRotationX = 0;
let targetRotationY = 0;
const maxLookHorizontal = 0.3; // Limite de olhar para os lados (aprox 17 graus)
const maxLookVertical = 0.2;   // Limite de olhar para cima/baixo

// ==========================================
// INICIALIZAÇÃO E GERENCIADOR DE ESTADOS
// ==========================================
// Esta função será chamada no main.js passando os controles
export function initCameraManager(controls) {
    orbitControls = controls;
    
    // 1. Escuta do Teclado para alternar os modos
    window.addEventListener('keydown', (event) => {
        const key = event.key.toLowerCase();
        if (key === 'c') setCameraMode('CADEIRA');
        if (key === 'm') setCameraMode('MONITOR');
        if (key === 'l') setCameraMode('LIVRE');
    });

    // 2. Escuta do Mouse para o movimento da cabeça
    window.addEventListener('mousemove', (event) => {
        if (currentMode !== 'CADEIRA') return; // Ignora se não estiver na cadeira

        // Normaliza posição do mouse (-1 a +1)
        mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

        // Calcula a rotação alvo com base nos limites
        targetRotationX = mouseY * maxLookVertical;
        targetRotationY = -mouseX * maxLookHorizontal;
    });

    // Inicia o jogo no modo de desenvolvimento
    setCameraMode('LIVRE');
}

// ==========================================
// MÁQUINA DE ESTADOS DA CÂMERA
// ==========================================
function setCameraMode(mode) {
    currentMode = mode;

    if (mode === 'LIVRE') {
        if (orbitControls) orbitControls.enabled = true;
        console.log("[Câmera] Modo: LIVRE (Desenvolvimento)");
    } 
    else if (mode === 'CADEIRA') {
        if (orbitControls) orbitControls.enabled = false;
        
        // Posição de quem está sentado na cadeira, um pouco recuado da mesa
        camera.position.set(0, 1.3, 1.8);
        camera.lookAt(0, 1.0, 0.5); 
        
        // Zera os alvos do mouse para a câmera não dar um "pulo" brusco
        targetRotationX = 0;
        targetRotationY = 0;
        console.log("[Câmera] Modo: CADEIRA (Imersão)");
    } 
    else if (mode === 'MONITOR') {
        if (orbitControls) orbitControls.enabled = false;
        
        // Câmera gruda na frente da tela do CRT
        camera.position.set(0, 1.17, 1.1); 
        // Olha diretamente para o centro da tela
        camera.lookAt(0, 1.17, 0.5); 
        
        console.log("[Câmera] Modo: MONITOR (Foco na UI)");
    }
}

// ==========================================
// LOOP DE ATUALIZAÇÃO (ANIMATE)
// ==========================================
export function updateCamera() {
    if (currentMode === 'CADEIRA') {
        // Interpolação Linear (Lerp) para a câmera perseguir o mouse suavemente
        camera.rotation.x += (targetRotationX - camera.rotation.x) * 0.05;
        camera.rotation.y += (targetRotationY - camera.rotation.y) * 0.05;
    }
}