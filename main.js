import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
// 1. Importamos o initCameraManager
import { camera, updateCamera, initCameraManager } from './camera.js'; 
import { buildEnvironment, updateParallax } from './sceneObjects.js';
import { updateGameLogic } from './gameLogic.js';

const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });

const GAME_WIDTH = 640;
const GAME_HEIGHT = 480;
renderer.setSize(GAME_WIDTH, GAME_HEIGHT, false); 
renderer.setClearColor(0x87CEEB);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x87CEEB, 4, 12);

// Luz ambiente: tom azulado suave simulando céu nublado refletido
const luzAmbiente = new THREE.AmbientLight(0x8EAFC2, 0.6); 
scene.add(luzAmbiente);

// Luz do teto: fluorescente de escritório (branca fria, menos intensa que o sol)
const luzTeto = new THREE.PointLight(0xF0F0FF, 0.5, 10);
luzTeto.position.set(0, 2.5, 0);
scene.add(luzTeto);

// Hemisphere light: simula céu (azul de cima) + chão (tom quente de baixo)
const luzHemisfera = new THREE.HemisphereLight(0xB0D0E8, 0xD4C8A8, 0.4);
scene.add(luzHemisfera);

buildEnvironment(scene);

// ==========================================
// CONTROLES E GERENCIADOR DE CÂMERA
// ==========================================
const controls = new OrbitControls(camera, renderer.domElement);
// Trava o foco de giro exatemente onde o bloco do monitor está
controls.target.set(0, 0.95, 0.2); 
controls.update();

// 1. Limita o giro horizontal (Azimuth). Permite ir só até a lateral da mesa (90 graus)
controls.minAzimuthAngle = -Math.PI / 2; // Bloqueia ir para trás pela esquerda
controls.maxAzimuthAngle = Math.PI / 2;  // Bloqueia ir para trás pela direita

// 2. Limita o giro vertical (Polar). 
controls.maxPolarAngle = Math.PI / 2 - 0.05; // Não deixa a câmera ir para baixo do chão

// 3. Limita o Zoom (Distância)
controls.minDistance = 0.5; // Não deixa a câmera entrar dentro do vidro do monitor
controls.maxDistance = 2.5; // Não deixa a câmera ultrapassar a parede traseira (Z=1.6)

// 2. Entregamos o controle do OrbitControls para o camera.js gerenciar
initCameraManager(controls);

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    
    const deltaTime = clock.getDelta();

    updateGameLogic(deltaTime);
    
    // 3. O updateCamera agora roda a lógica de Parallax (Modo Cadeira) do camera.js
    updateCamera(); 
    updateParallax(camera);
    
    // Atualiza a física do controle livre a cada frame (o camera.js desativa isso sozinho quando necessário)
    controls.update();

    renderer.render(scene, camera);
}

animate();