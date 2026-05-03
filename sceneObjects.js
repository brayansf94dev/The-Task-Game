// sceneObjects.js
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Referências para as 3 camadas de parallax
let camadaParallax = []; // { mesh, intensidade, baseX, baseY }
const JANELA_Y_BASE = 1.6;

/**
 * Atualiza o efeito parallax das 3 camadas da janela.
 * Camada 1 (fundo/céu) = move pouco
 * Camada 2 (meio/prédios distantes) = move médio  
 * Camada 3 (frente/prédios próximos) = move muito
 */
export function updateParallax(camera) {
    for (const camada of camadaParallax) {
        const offsetX = -camera.position.x * camada.intensidade;
        const offsetY = -(camera.position.y - 1.2) * camada.intensidade * 0.4;

        camada.mesh.position.x = camada.baseX + offsetX;
        camada.mesh.position.y = camada.baseY + offsetY;
    }
}


export function buildEnvironment(scene) {
    // ==========================================
    // 1. Materiais Básicos (Focados no Monitor)
    // ==========================================
    const matMesa = new THREE.MeshLambertMaterial({ color: 0xD4C8A8 });
    const matMonitor = new THREE.MeshLambertMaterial({ color: 0xECE9D8 });
    const matTela = new THREE.MeshLambertMaterial({ 
        color: 0x111111, 
        emissive: 0x4FAE3E, 
        emissiveIntensity: 0.02
    });

    // ==========================================
    // 2. A Mesa Base
    // ==========================================
    const mesa = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.05, 1.0), matMesa);
    mesa.position.set(0, 0.7, 0.5);
    mesa.receiveShadow = true; 
    scene.add(mesa);

    // ==========================================
    // 3. Monitor CRT (Isolado para Foco)
    // ==========================================
    const monitorGroup = new THREE.Group();

    const escalaGlobal = 0.45; 
    const L_TOTAL = 1.0 * escalaGlobal;
    const H_TOTAL = 0.95 * escalaGlobal;
    const P_TOTAL = 0.65 * escalaGlobal;

    const profFrente = P_TOTAL * 0.90;
    const frenteGeo = new RoundedBoxGeometry(L_TOTAL, H_TOTAL, profFrente, 2, 0.02);
    const frente = new THREE.Mesh(frenteGeo, matMonitor);
    frente.position.z = 0; 
    monitorGroup.add(frente);

    const profTubo = P_TOTAL * 0.65; 
    const tuboGeo = new THREE.CylinderGeometry(
        L_TOTAL * 0.25, L_TOTAL * 0.48, profTubo, 4
    );
    const tubo = new THREE.Mesh(tuboGeo, matMonitor);
    tubo.rotation.x = -Math.PI / 2; 
    tubo.rotation.y = Math.PI / 4; 
    tubo.position.set(0, 0, -(profFrente / 2) - (profTubo / 2));
    monitorGroup.add(tubo);

    const L_TELA = L_TOTAL * 0.85; 
    const H_TELA = H_TOTAL * 0.75; 
    const telaGeo = new RoundedBoxGeometry(L_TELA, H_TELA, 0.04, 4, 0.04);
    const tela = new THREE.Mesh(telaGeo, matTela);
    tela.position.set(0, H_TOTAL * 0.05, (profFrente / 2) + 0.01); 
    monitorGroup.add(tela);

    const painelGeo = new RoundedBoxGeometry(L_TOTAL * 0.8, H_TOTAL * 0.2, 0.02, 2, 0.005);
    const painelBotoes = new THREE.Mesh(painelGeo, matMonitor);
    painelBotoes.position.set(0, -H_TOTAL * 0.35, profFrente / 2 + 0.01);
    monitorGroup.add(painelBotoes);

    const pescocoGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.08, 8);
    const pescoco = new THREE.Mesh(pescocoGeo, matMonitor);
    pescoco.position.set(0, -H_TOTAL / 2 - 0.04, 0);
    monitorGroup.add(pescoco);

    const baseDiscoGeo = new THREE.CylinderGeometry(L_TOTAL * 0.25, L_TOTAL * 0.25, 0.02, 16);
    const baseDisco = new THREE.Mesh(baseDiscoGeo, matMonitor);
    baseDisco.position.set(0, -H_TOTAL / 2 - 0.08, 0);
    monitorGroup.add(baseDisco);

    const luzDaTela = new THREE.PointLight(0x4FAE3E, 0.3, 2, 2); 
    luzDaTela.position.set(0, H_TOTAL * 0.05, (profFrente / 2) + 0.1); 
    monitorGroup.add(luzDaTela);

    monitorGroup.position.set(0, 0.7 + (H_TOTAL / 2) + 0.1, 0.5); 
    scene.add(monitorGroup);

    // ==========================================
    // 5. Baia do Cubículo
    // ==========================================
    const matBaia = new THREE.MeshLambertMaterial({ color: 0xD3D3D3 }); 
    const alturaBaia = 0.35;
    const espessuraBaia = 0.03;
    const larguraMesa = 1.35;
    const profundidadeMesa = 1.0; 

    const paredeFundo = new THREE.Mesh(
        new THREE.BoxGeometry(larguraMesa, alturaBaia, espessuraBaia), matBaia
    );
    paredeFundo.position.set(0, 0.7 + (alturaBaia / 2), 0.5 - (profundidadeMesa / 2));
    paredeFundo.receiveShadow = true;
    paredeFundo.castShadow = true;
    scene.add(paredeFundo);

    const paredeEsq = new THREE.Mesh(
        new THREE.BoxGeometry(espessuraBaia, alturaBaia, profundidadeMesa), matBaia
    );
    paredeEsq.position.set(-(larguraMesa / 2), 0.7 + (alturaBaia / 2), 0.5);
    paredeEsq.receiveShadow = true;
    paredeEsq.castShadow = true;
    scene.add(paredeEsq);

    const paredeDir = new THREE.Mesh(
        new THREE.BoxGeometry(espessuraBaia, alturaBaia, profundidadeMesa), matBaia
    );
    paredeDir.position.set(larguraMesa / 2, 0.7 + (alturaBaia / 2), 0.5);
    paredeDir.receiveShadow = true;
    paredeDir.castShadow = true;
    scene.add(paredeDir);

    // ==========================================
    // 6. Parede de Fundo do Escritório e Janela
    // ==========================================
    const paredeGroup = new THREE.Group();
    const matParedeFundo = new THREE.MeshLambertMaterial({ color: 0x999999 });

    // Janela MAIS COMPRIDA (larga)
    const JANELA_W = 3.6;
    const JANELA_H = 1.4;
    const JANELA_Y = JANELA_Y_BASE;
    const PAREDE_Z = -1.5;
    const PAREDE_LARGURA = 5;
    const PAREDE_ESPESSURA = 0.1;

    // --- Parte inferior (abaixo da janela) ---
    const alturaBaixo = JANELA_Y - JANELA_H / 2;
    const paredeBaixo = new THREE.Mesh(
        new THREE.BoxGeometry(PAREDE_LARGURA, alturaBaixo, PAREDE_ESPESSURA), 
        matParedeFundo
    );
    paredeBaixo.position.set(0, alturaBaixo / 2, PAREDE_Z);
    paredeGroup.add(paredeBaixo);

    // --- Parte superior (acima da janela) ---
    const topoDaJanela = JANELA_Y + JANELA_H / 2;
    const alturaCima = 3.0 - topoDaJanela;
    const paredeCima = new THREE.Mesh(
        new THREE.BoxGeometry(PAREDE_LARGURA, alturaCima, PAREDE_ESPESSURA), 
        matParedeFundo
    );
    paredeCima.position.set(0, topoDaJanela + alturaCima / 2, PAREDE_Z);
    paredeGroup.add(paredeCima);

    // --- Laterais da janela ---
    const larguraLateral = (PAREDE_LARGURA - JANELA_W) / 2;
    const paredeEsqL = new THREE.Mesh(
        new THREE.BoxGeometry(larguraLateral, JANELA_H, PAREDE_ESPESSURA), 
        matParedeFundo
    );
    paredeEsqL.position.set(-(JANELA_W / 2 + larguraLateral / 2), JANELA_Y, PAREDE_Z);
    paredeGroup.add(paredeEsqL);

    const paredeDirL = new THREE.Mesh(
        new THREE.BoxGeometry(larguraLateral, JANELA_H, PAREDE_ESPESSURA), 
        matParedeFundo
    );
    paredeDirL.position.set(JANELA_W / 2 + larguraLateral / 2, JANELA_Y, PAREDE_Z);
    paredeGroup.add(paredeDirL);

    // ==========================================
    // 7. Parallax em 2 Camadas
    // ==========================================
    // Camada 1 = fundo (céu, prédios distantes) → move POUCO
    // Camada 2 = frente (prédios próximos) → move MAIS
    //
    // Cada camada é um plano maior que a janela, empilhado em Z atrás da parede.
    // A janela2.png deve ter transparência para que a camada de trás seja visível.

    const loader = new THREE.TextureLoader();
    const PARALLAX_MARGEM = 0.5;
    const paisagemW = JANELA_W + PARALLAX_MARGEM * 2;
    const paisagemH = JANELA_H + PARALLAX_MARGEM * 2;

    const camadasConfig = [
        { arquivo: 'janela1.png', z: PAREDE_Z - 0.12, intensidade: 0.06 },  // Fundo — quase estático
        { arquivo: 'janela2.png', z: PAREDE_Z - 0.05, intensidade: 0.20 },  // Frente — move mais
    ];

    camadaParallax = []; // Reset

    for (const cfg of camadasConfig) {
        const textura = loader.load(cfg.arquivo);
        textura.minFilter = THREE.LinearFilter;
        textura.magFilter = THREE.LinearFilter;

        const geo = new THREE.PlaneGeometry(paisagemW, paisagemH);
        const mat = new THREE.MeshBasicMaterial({ 
            map: textura,
            side: THREE.FrontSide,
            transparent: true,
            depthWrite: false // Evita Z-fighting entre camadas transparentes
        });

        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(0, JANELA_Y, cfg.z);
        paredeGroup.add(mesh);

        camadaParallax.push({
            mesh: mesh,
            intensidade: cfg.intensidade,
            baseX: 0,
            baseY: JANELA_Y
        });
    }

    // --- Luz da janela (simula luz natural de dia entrando) ---
    
    // Luz pontual principal da janela: branco-azulado quente, mais forte
    const luzJanela = new THREE.PointLight(0xDDE8F0, 0.8, 6, 1.5);
    luzJanela.position.set(0, JANELA_Y, PAREDE_Z + 0.5);
    paredeGroup.add(luzJanela);

    // Luz direcional simulando raios de sol oblíquos entrando pela janela
    const luzSol = new THREE.DirectionalLight(0xFFF8E7, 0.6);
    luzSol.position.set(0.5, 2.5, PAREDE_Z); // Vem de cima-direita, da direção da janela
    luzSol.target.position.set(0, 0.7, 0.5); // Aponta para a mesa
    paredeGroup.add(luzSol);
    paredeGroup.add(luzSol.target);

    // --- Moldura da Janela (só contorno, SEM divisória central) ---
    const molduraEsp = 0.04;
    const molduraMat = new THREE.MeshLambertMaterial({ color: 0x555555 });

    // Cima
    const mCima = new THREE.Mesh(
        new THREE.BoxGeometry(JANELA_W + molduraEsp * 2, molduraEsp, 0.06), molduraMat
    );
    mCima.position.set(0, JANELA_Y + JANELA_H / 2, PAREDE_Z + 0.02);
    paredeGroup.add(mCima);

    // Baixo
    const mBaixo = new THREE.Mesh(
        new THREE.BoxGeometry(JANELA_W + molduraEsp * 2, molduraEsp, 0.06), molduraMat
    );
    mBaixo.position.set(0, JANELA_Y - JANELA_H / 2, PAREDE_Z + 0.02);
    paredeGroup.add(mBaixo);

    // Esquerda
    const mEsq = new THREE.Mesh(
        new THREE.BoxGeometry(molduraEsp, JANELA_H, 0.06), molduraMat
    );
    mEsq.position.set(-JANELA_W / 2, JANELA_Y, PAREDE_Z + 0.02);
    paredeGroup.add(mEsq);

    // Direita
    const mDir = new THREE.Mesh(
        new THREE.BoxGeometry(molduraEsp, JANELA_H, 0.06), molduraMat
    );
    mDir.position.set(JANELA_W / 2, JANELA_Y, PAREDE_Z + 0.02);
    paredeGroup.add(mDir);

    scene.add(paredeGroup);

    // ==========================================
    // 8. Escritório Fechado (4 Paredes + Chão + Teto)
    // ==========================================
    const SALA_LARGURA = PAREDE_LARGURA;  // 5
    const SALA_ALTURA = 3.0;
    const SALA_PROF_FRENTE = 3.0;         // Z positivo (atrás da câmera)
    const SALA_Z_FUNDO = PAREDE_Z;        // -1.5 (parede do fundo já existe)
    const SALA_Z_TRAS = SALA_Z_FUNDO + SALA_PROF_FRENTE + PAREDE_ESPESSURA; // ~1.6

    const matParede = new THREE.MeshLambertMaterial({ color: 0xA0A0A0 });
    const matChao = new THREE.MeshLambertMaterial({ color: 0x707070 });
    const matTeto = new THREE.MeshLambertMaterial({ color: 0xBBBBBB });

    // --- Parede Esquerda ---
    const paredeEsquerda = new THREE.Mesh(
        new THREE.BoxGeometry(PAREDE_ESPESSURA, SALA_ALTURA, SALA_PROF_FRENTE + PAREDE_ESPESSURA),
        matParede
    );
    paredeEsquerda.position.set(
        -SALA_LARGURA / 2,
        SALA_ALTURA / 2,
        (SALA_Z_FUNDO + SALA_Z_TRAS) / 2
    );
    scene.add(paredeEsquerda);

    // --- Parede Direita ---
    const paredeDireita = new THREE.Mesh(
        new THREE.BoxGeometry(PAREDE_ESPESSURA, SALA_ALTURA, SALA_PROF_FRENTE + PAREDE_ESPESSURA),
        matParede
    );
    paredeDireita.position.set(
        SALA_LARGURA / 2,
        SALA_ALTURA / 2,
        (SALA_Z_FUNDO + SALA_Z_TRAS) / 2
    );
    scene.add(paredeDireita);

    

    // --- Chão ---
    const chao = new THREE.Mesh(
        new THREE.BoxGeometry(SALA_LARGURA, 0.05, SALA_PROF_FRENTE + PAREDE_ESPESSURA),
        matChao
    );
    chao.position.set(0, 0, (SALA_Z_FUNDO + SALA_Z_TRAS) / 2);
    chao.receiveShadow = true;
    scene.add(chao);

    // --- Teto ---
    const teto = new THREE.Mesh(
        new THREE.BoxGeometry(SALA_LARGURA, 0.05, SALA_PROF_FRENTE + PAREDE_ESPESSURA),
        matTeto
    );
    teto.position.set(0, SALA_ALTURA, (SALA_Z_FUNDO + SALA_Z_TRAS) / 2);
    scene.add(teto);
}