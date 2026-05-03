import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { camera, updateCamera, initCameraManager } from './camera.js'; 
import { buildEnvironment, updateParallax, updatePhoneAnimation, updateCoffeeSteam } from './sceneObjects.js';
import { updateGameLogic } from './gameLogic.js';
import { Editor } from './engine/editor.js';

const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });

const GAME_WIDTH = 640;
const GAME_HEIGHT = 480;
renderer.setSize(GAME_WIDTH, GAME_HEIGHT, false); 
renderer.setClearColor(0x87CEEB);

const scene = new THREE.Scene();
scene.name = 'TASK_Scene';
scene.fog = new THREE.Fog(0x87CEEB, 4, 12);

// Luz ambiente: tom azulado suave simulando céu nublado refletido
const luzAmbiente = new THREE.AmbientLight(0x8EAFC2, 0.6); 
luzAmbiente.name = 'luzAmbiente';
scene.add(luzAmbiente);

// Luz do teto: fluorescente de escritório (branca fria, menos intensa que o sol)
const luzTeto = new THREE.PointLight(0xF0F0FF, 0.5, 10);
luzTeto.position.set(0, 2.5, 0);
luzTeto.name = 'luzTeto';
scene.add(luzTeto);

// Hemisphere light: simula céu (azul de cima) + chão (tom quente de baixo)
const luzHemisfera = new THREE.HemisphereLight(0xB0D0E8, 0xD4C8A8, 0.4);
luzHemisfera.name = 'luzHemisfera';
scene.add(luzHemisfera);

buildEnvironment(scene);

// ==========================================
// CONTROLES E GERENCIADOR DE CÂMERA
// ==========================================
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.95, 0.2); 
controls.update();

controls.minAzimuthAngle = -Math.PI / 2;
controls.maxAzimuthAngle = Math.PI / 2;
controls.maxPolarAngle = Math.PI / 2 - 0.05;
controls.minDistance = 0.5;
controls.maxDistance = 2.5;

initCameraManager(controls);

// ==========================================
// ENGINE EDITOR (F1 para ativar/desativar)
// ==========================================
let editor = null;
try {
    editor = new Editor(scene, camera, renderer, controls);
    console.log('[TASK] Engine Editor disponível — pressione F1 para abrir');
} catch (e) {
    console.error('[TASK] Erro ao iniciar Engine Editor:', e);
}

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    
    const deltaTime = clock.getDelta();
    
    // A LINHA QUE FALTAVA ESTÁ AQUI EMBAIXO:
    const tempoTotal = clock.getElapsedTime(); 

    updateGameLogic(deltaTime);
    updateCamera(); 
    updateParallax(camera);
    
    // Agora o tempoTotal existe para ser passado para o celular vibrar
    updatePhoneAnimation(tempoTotal); 
    updateCoffeeSteam(tempoTotal);
    
    controls.update();
    renderer.render(scene, camera);
}

animate();
