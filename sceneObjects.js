// sceneObjects.js
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
// Variáveis do Celular
export let celularGroup;
export let isPhoneVibrating = true;

// --- NOVAS VARIÁVEIS DO CAFÉ ---
export const vaporParticulas = [];
export let cafeTemperatura = 100; // Vai de 100 (Quente) a 0 (Frio)

// --- NOVAS VARIÁVEIS DO TECLADO ---
export let tecladoMesh;
let isTyping = false;
let typingTimer = 0;

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

// Função para tremer o celular (deve ser chamada no animate do main.js)
export function updatePhoneAnimation(time) {
    if (!celularGroup) return;

    if (isPhoneVibrating) {
        // Vibração: oscilação super rápida usando seno. 
        // time * 60 = velocidade do tremor. 0.05 = ângulo da inclinação.
        celularGroup.rotation.z = Math.sin(time * 60) * 0.05;
        
        // Bônus: um leve tremor no eixo X para parecer que está deslizando na mesa
        celularGroup.position.x = 0.4 + Math.sin(time * 80) * 0.002; 
    } else {
        // Retorna à posição e rotação estática
        celularGroup.rotation.z = 0;
        celularGroup.position.x = 0.4;
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
    // 2. A Mesa Base e os Pés
    // ==========================================
    // --- O Tampo da Mesa ---
    const mesa = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.05, 1.0), matMesa);
    mesa.name = 'mesa';
    mesa.position.set(0, 0.7, 0.5);
    mesa.receiveShadow = true; 
    mesa.castShadow = true; // Adicionado para a mesa projetar sombra nos próprios pés
    scene.add(mesa);

    // --- Os 4 Pés da Mesa ---
    const matPeMesa = new THREE.MeshLambertMaterial({ color: 0x2A2A2A }); // Metal cinza escuro
    const peGeo = new THREE.BoxGeometry(0.06, 0.7, 0.06); // 0.7 de altura
    
    // Posições (X e Z) calculadas para os 4 cantos da mesa
    // A mesa tem 1.35 de largura e 1.0 de profundidade (com centro em Z=0.5)
    const posicoesPes = [
        { x: -0.6, z: 0.1 }, // Trás Esquerda
        { x:  0.6, z: 0.1 }, // Trás Direita
        { x: -0.6, z: 0.9 }, // Frente Esquerda
        { x:  0.6, z: 0.9 }  // Frente Direita
    ];

    posicoesPes.forEach(pos => {
        const pe = new THREE.Mesh(peGeo, matPeMesa);
        
        // Y = 0.35 faz o pé nascer no chão (0) e encostar perfeitamente no tampo (0.7)
        pe.position.set(pos.x, 0.35, pos.z);
        
        pe.castShadow = true;
        pe.receiveShadow = true;
        scene.add(pe);
    });
    
    // ==========================================
    // 3. Monitor CRT (Isolado para Foco)
    // ==========================================
    const monitorGroup = new THREE.Group();
    monitorGroup.name = 'monitorCRT';

    const escalaGlobal = 0.45; 
    const L_TOTAL = 1.0 * escalaGlobal;
    const H_TOTAL = 0.95 * escalaGlobal;
    const P_TOTAL = 0.65 * escalaGlobal;

    const profFrente = P_TOTAL * 0.90;
    const frenteGeo = new RoundedBoxGeometry(L_TOTAL, H_TOTAL, profFrente, 2, 0.02);
    const frente = new THREE.Mesh(frenteGeo, matMonitor);
    frente.name = 'monitor_frente';
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
    tela.name = 'monitor_tela';
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
    paredeGroup.name = 'paredesFundo';
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
    paredeEsquerda.name = 'paredeEsquerda';
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
    paredeDireita.name = 'paredeDireita';
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
    chao.name = 'chao';
    chao.position.set(0, 0, (SALA_Z_FUNDO + SALA_Z_TRAS) / 2);
    chao.receiveShadow = true;
    scene.add(chao);

    // --- Teto ---
    const teto = new THREE.Mesh(
        new THREE.BoxGeometry(SALA_LARGURA, 0.05, SALA_PROF_FRENTE + PAREDE_ESPESSURA),
        matTeto
    );
    teto.name = 'teto';
    teto.position.set(0, SALA_ALTURA, (SALA_Z_FUNDO + SALA_Z_TRAS) / 2);
    scene.add(teto);

    // ==========================================
    // 9. Telefone Fixo (Esquerda da Mesa)
    // ==========================================
    const telefoneGroup = new THREE.Group();
    const matTelefone = new THREE.MeshLambertMaterial({ color: 0x1A1A1A }); // Preto fosco
    const matGancho = new THREE.MeshLambertMaterial({ color: 0xB32424 });   // Fone vermelho

    // --- A. Base do Aparelho ---
    // Uma caixa simples simulando os botões e a estrutura
    const baseTelGeo = new THREE.BoxGeometry(0.14, 0.04, 0.18);
    const baseTel = new THREE.Mesh(baseTelGeo, matTelefone);
    baseTel.position.set(0, 0.02, 0); 
    baseTel.rotation.x = Math.PI / 18; // Leve inclinação para frente, típico de telefones de mesa
    baseTel.castShadow = true;
    baseTel.receiveShadow = true;
    telefoneGroup.add(baseTel);

  // --- B. O Fone (Gancho) ---
    const foneGroup = new THREE.Group();

    // 1. Corpo do fone (onde seguramos) - Removido o matTelefone
    const corpoFoneGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.16, 8);
    const corpoFone = new THREE.Mesh(corpoFoneGeo, matGancho); 
    corpoFone.rotation.x = Math.PI / 2; 
    corpoFone.castShadow = true;
    foneGroup.add(corpoFone);

    // 2. Auricular (parte da orelha) e Bocal (parte da boca)
    const pontaFoneGeo = new THREE.CylinderGeometry(0.025, 0.03, 0.03, 12);
    
    // Removido o matTelefone
    const auricular = new THREE.Mesh(pontaFoneGeo, matGancho); 
    auricular.position.set(0, 0.01, -0.08); 
    auricular.rotation.x = Math.PI / 8; 
    auricular.castShadow = true;
    foneGroup.add(auricular);

    // Removido o matTelefone
    const bocal = new THREE.Mesh(pontaFoneGeo, matGancho); 
    bocal.position.set(0, 0.01, 0.08); 
    bocal.rotation.x = -Math.PI / 8;
    bocal.castShadow = true;
    foneGroup.add(bocal);

    // Posiciona o fone descansando no lado esquerdo da base
    foneGroup.position.set(-0.03, 0.055, 0.01); 
    telefoneGroup.add(foneGroup);

    // --- C. Posicionamento Final na Cena ---
    // x≈-0.5 (esquerda), y≈0.73 (topo da mesa), z≈0.5 (alinhado com o monitor)
    telefoneGroup.position.set(-0.45, 0.725, 0.55); 
    
    // Gira o telefone inteiro levemente para o centro da mesa
    telefoneGroup.rotation.y = Math.PI / 5; 

    scene.add(telefoneGroup);

   // ==========================================
    // 14. Teclado e Mouse (Primeiro Plano)
    // ==========================================
    const perifGroup = new THREE.Group();
    perifGroup.name = 'perifericos';

    // Cor escura típica de periféricos corporativos (quase preto, mas reage à luz)
    const matEscuro = new THREE.MeshLambertMaterial({ color: 0x222222 }); 

    // --- A. O Teclado ---
    const tecladoGeo = new THREE.BoxGeometry(0.35, 0.012, 0.12);
    tecladoMesh = new THREE.Mesh(tecladoGeo, matEscuro);
    tecladoMesh.position.set(0, 0.006, 0); 
    tecladoMesh.castShadow = true;
    tecladoMesh.receiveShadow = true;
    perifGroup.add(tecladoMesh);

    // Detalhe ergonômico: um pezinho na parte de trás para inclinar o teclado
    const peTecladoGeo = new THREE.BoxGeometry(0.35, 0.008, 0.02);
    const peTeclado = new THREE.Mesh(peTecladoGeo, matEscuro);
    peTeclado.position.set(0, 0.004, -0.05); 
    perifGroup.add(peTeclado);
    tecladoMesh.rotation.x = 0.05; // Leve inclinação para frente

    // --- B. O Mouse ---
    // Usamos o RoundedBoxGeometry para dar aquela curva natural nas bordas
    const mouseGeo = new RoundedBoxGeometry(0.04, 0.015, 0.06, 2, 0.005);
    const mouseMesh = new THREE.Mesh(mouseGeo, matEscuro);
    
    // Posiciona à direita do teclado
    mouseMesh.position.set(0.25, 0.0075, 0.02); 
    // Gira levemente para a esquerda, simulando o repouso natural da mão
    mouseMesh.rotation.y = -0.1;
    mouseMesh.castShadow = true;
    mouseMesh.receiveShadow = true;
    perifGroup.add(mouseMesh);

    // --- C. Posicionamento na Mesa ---
    // z = 0.8 coloca exatamente na beirada da mesa, no primeiro plano da câmera
    perifGroup.position.set(0, 0.725, 0.8);
    scene.add(perifGroup);


    // ==========================================
    // 10. Celular sobre a mesa (Canto Inferior)
    // ==========================================
    celularGroup = new THREE.Group();

    // --- A. Corpo do Aparelho ---
    const celularGeo = new THREE.BoxGeometry(0.06, 0.01, 0.10);
    const matCorpoCelular = new THREE.MeshLambertMaterial({ color: 0x333333 }); // Cinza chumbo/preto
    const corpoCelular = new THREE.Mesh(celularGeo, matCorpoCelular);
    corpoCelular.castShadow = true;
    corpoCelular.receiveShadow = true;
    celularGroup.add(corpoCelular);

    // --- B. Tela Escura (Emissiva) ---
    const telaCelularGeo = new THREE.PlaneGeometry(0.054, 0.09);
    const matTelaCelular = new THREE.MeshLambertMaterial({ 
        color: 0x050505, // Fundo escuro
        emissive: 0x222222, // Leve brilho de "tela desligada" (LCD clássico)
        emissiveIntensity: 0.5 
    });
    const telaCelular = new THREE.Mesh(telaCelularGeo, matTelaCelular);
    
    // Deita o plano para cima (-90 graus)
    telaCelular.rotation.x = -Math.PI / 2;
    // Sobe a tela 0.0051 (um pouquinho acima da metade do corpo de 0.01) para evitar Z-fighting
    telaCelular.position.set(0, 0.0051, 0);
    celularGroup.add(telaCelular);

    // --- C. Posicionamento na Mesa ---
    // x≈0.4, y≈0.73, z≈0.7 (canto direito inferior, perto do usuário)
    celularGroup.position.set(0.4, 0.725, 0.7);
    // Gira levemente para ficar apontado na direção da cadeira do jogador
    celularGroup.rotation.y = Math.PI / 6;

    scene.add(celularGroup);

    // ==========================================
    // 11. Xícara de Café com Vapor (Low-Poly)
    // ==========================================
    const xicaraGroup = new THREE.Group();

    // --- A. Corpo da Xícara (8 Segmentos para o visual PS1/N64) ---
    const xicaraGeo = new THREE.CylinderGeometry(0.04, 0.03, 0.08, 8);
    const matXicara = new THREE.MeshLambertMaterial({ color: 0x8B7355 }); // Cerâmica
    const corpoXicara = new THREE.Mesh(xicaraGeo, matXicara);
    corpoXicara.position.y = 0.04; 
    corpoXicara.castShadow = true;
    xicaraGroup.add(corpoXicara);

    // Alça da Xícara (TorusGeometry com poucos segmentos)
    const alcaGeo = new THREE.TorusGeometry(0.02, 0.006, 4, 8);
    const alca = new THREE.Mesh(alcaGeo, matXicara);
    alca.position.set(0.04, 0.04, 0);
    alca.castShadow = true;
    xicaraGroup.add(alca);

    // --- B. O Café (Líquido) ---
    const liquidoGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.07, 8);
    const matLiquido = new THREE.MeshLambertMaterial({ color: 0x1A0B02 }); // Preto escuro
    const liquido = new THREE.Mesh(liquidoGeo, matLiquido);
    liquido.position.y = 0.042; // Fica um pouquinho abaixo da borda
    xicaraGroup.add(liquido);

    // --- C. Sistema de Partículas (Vapor) ---
    const vaporGeo = new THREE.PlaneGeometry(0.02, 0.02);
    // Usamos BasicMaterial porque o vapor não precisa de sombra, ele próprio brilha/reflete
    const vaporMat = new THREE.MeshBasicMaterial({
        color: 0xFFFFFF,
        transparent: true,
        opacity: 0.5,
        depthWrite: false, // Evita que as transparências das partículas "briguem" entre si
        side: THREE.DoubleSide
    });

    // Criamos 6 partículas
    for (let i = 0; i < 6; i++) {
        // Clonamos o material para que cada partícula tenha sua própria opacidade depois
        const particula = new THREE.Mesh(vaporGeo, vaporMat.clone()); 
        
        // Posição inicial (nascem dentro da xícara, pouco acima do líquido)
        particula.position.set(
            (Math.random() - 0.5) * 0.04,
            0.08 + Math.random() * 0.05, 
            (Math.random() - 0.5) * 0.04
        );

        // Guardamos dados únicos em cada partícula para o cálculo do seno
        particula.userData = {
            offset: Math.random() * Math.PI * 2, // Momento diferente na onda
            velocidadeY: 0.01 + Math.random() * 0.015,
            vidaMaxima: 0.15 + Math.random() * 0.1, // Quão alto ela sobe antes de sumir
            alturaOriginal: 0.08
        };

        xicaraGroup.add(particula);
        vaporParticulas.push(particula);
    }

    // --- D. Posicionamento na Mesa ---
    // Colocamos à direita do monitor, pouco acima do celular
    xicaraGroup.position.set(0.45, 0.725, 0.5); 
    // Gira a alça para ficar confortável para destros
    xicaraGroup.rotation.y = -Math.PI / 4; 

    scene.add(xicaraGroup);


    // ==========================================
    // 12. Porta-retrato (Esquerda do Monitor)
    // ==========================================
    const portaRetratoGroup = new THREE.Group();

    // --- A. Moldura de Madeira ---
    const molduraGeo = new THREE.BoxGeometry(0.12, 0.15, 0.02);
    const matMoldura = new THREE.MeshLambertMaterial({ color: 0x3E2723 }); // Marrom escuro (madeira)
    const moldura = new THREE.Mesh(molduraGeo, matMoldura);
    moldura.castShadow = true;
    portaRetratoGroup.add(moldura);

    // --- B. A Foto (Textura) ---
    const textureLoader = new THREE.TextureLoader();
    
    // Substitua 'esposa.jpg' pelo nome real do arquivo da foto que você quer usar
    const fotoTextura = textureLoader.load('esposa.jpg', 
        undefined, undefined, 
        (err) => console.warn('Aviso: Imagem esposa.jpg não encontrada ainda.')
    );
    
    // O truque do Sépia: Usamos a textura, mas misturamos com uma cor quente
    const matFoto = new THREE.MeshBasicMaterial({ 
        map: fotoTextura,
        color: 0xFFE0B2 // Esse tom amarelado dá o aspecto sépia à textura!
    });

    // O plano da foto é levemente menor que a moldura (0.10 x 0.13)
    const fotoGeo = new THREE.PlaneGeometry(0.10, 0.13);
    const foto = new THREE.Mesh(fotoGeo, matFoto);
    
    // Traz a foto milímetros para frente para não "brigar" com a geometria da moldura
    foto.position.set(0, 0, 0.0101);
    portaRetratoGroup.add(foto);

    // --- C. Posicionamento na Mesa ---
    // Colocamos à esquerda (x = -0.25), entre o telefone e o monitor
    // A altura (Y) é 0.7 (mesa) + 0.075 (metade da altura do porta-retrato) = 0.775
    portaRetratoGroup.position.set(-0.45, 0.835, 0.2);
    
    // Gira levemente para olhar na direção da câmera e inclina para trás
    portaRetratoGroup.rotation.y = Math.PI / 8;
    portaRetratoGroup.rotation.x = -0.15; // O "pézinho" do porta-retrato

    scene.add(portaRetratoGroup);

    // ==========================================
    // 13. Post-its colados no Monitor
    // ==========================================
    
    // Lista de tarefas caóticas (e algumas referências para dar vida)
    const frasesPostIt = [
        'Call c/ Rodrigo', 
        'Passear com Nala', 
        'Jogo do Galo hj', 
        'Fix Z-fighting', 
        'Deploy Beyond Bits', 
        'Comprar café'
    ];
    
    // Cores clássicas: Amarelo, Rosa, Verde Água, Laranja
    const coresPostIt = ['#FFF350', '#FF9CEE', '#A1F0D4', '#FFB74D'];

    // Embaralha as frases para serem sempre diferentes a cada F5
    const frasesEmbaralhadas = frasesPostIt.sort(() => 0.5 - Math.random());

    const postItGeo = new THREE.PlaneGeometry(0.06, 0.06);

    // Pega o grupo do monitor que já criamos lá na Seção 3
    const monitorCRT = scene.getObjectByName('monitorCRT');

    if (monitorCRT) {
        // Z local da frente do monitor (baseado nas dimensões dele)
        const zFrente = 0.138; 

        for (let i = 0; i < 4; i++) {
            const texto = frasesEmbaralhadas[i];
            const cor = coresPostIt[i % coresPostIt.length];
            
            const tex = criarTexturaPostIt(texto, cor);
            // MeshBasicMaterial para o post-it não ficar escuro com as sombras
            const mat = new THREE.MeshBasicMaterial({ map: tex }); 
            const postIt = new THREE.Mesh(postItGeo, mat);

            // Distribuição: 2 na borda de baixo, 2 na borda lateral direita
            if (i < 2) {
                // Borda inferior
                const xPos = -0.1 + (i * 0.2); // Um na esquerda (-0.1), outro na direita (0.1)
                const yPos = -0.08; // Perto do painel de botões
                postIt.position.set(xPos, yPos, zFrente);
            } else {
                // Borda direita
                const xPos = 0.22; // Canto direito
                const yPos = 0.05 - ((i - 2) * 0.12); // Espalhados na vertical
                postIt.position.set(xPos, yPos, zFrente);
            }

            // A mágica da "naturalidade": rotação Z aleatória entre -15 e +15 graus
            postIt.rotation.z = (Math.random() - 0.5) * 0.5;

            // Cola o post-it no grupo do monitor!
            monitorCRT.add(postIt);
        }
    }


}

// Função para animar a fumaça subindo e sumindo
export function updateCoffeeSteam(time) {
    // Calcula um multiplicador global com base na temperatura (de 0 a 1)
    const opacidadeGlobal = Math.max(0, cafeTemperatura / 100);

    vaporParticulas.forEach((p) => {
        // Se o café esfriou totalmente, a partícula fica invisível e para de subir
        if (opacidadeGlobal === 0) {
            p.material.opacity = 0;
            return;
        }

        // Faz a partícula subir
        p.position.y += p.userData.velocidadeY * 0.016; // Considerando ~60fps

        // Movimento ondulatório (dança do vapor) usando Seno e Cosseno
        // Usamos time * 2 para ser um movimento suave e relaxante
        p.position.x += Math.sin(time * 2 + p.userData.offset) * 0.0005;
        p.position.z += Math.cos(time * 1.5 + p.userData.offset) * 0.0005;

        // Calcula a "vida" restante da partícula baseada na altura
        const alturaSubida = p.position.y - p.userData.alturaOriginal;
        const percentualVida = 1.0 - (alturaSubida / p.userData.vidaMaxima);
        
        if (percentualVida <= 0) {
            // Se chegou no topo e "morreu", renasce na base da xícara
            p.position.y = p.userData.alturaOriginal;
            p.position.x = (Math.random() - 0.5) * 0.04; // Sorteia nova posição X
            p.position.z = (Math.random() - 0.5) * 0.04; // Sorteia nova posição Z
            p.material.opacity = 0; 
        } else {
            // Opacidade desvanece conforme sobe, multiplicada pela temperatura atual
            // O 0.5 é a opacidade máxima do vapor
            p.material.opacity = percentualVida * 0.5 * opacidadeGlobal; 
        }

        // Rotação suave para dar dinâmica no plano 2D
        p.rotation.y += 0.01;
    });
}

// Chama essa função sempre que o jogador apertar uma tecla
export function triggerTypingAnimation() {
    isTyping = true;
    typingTimer = 0.1; // O tremor dura 0.1 segundos por tecla
}

// Atualiza a animação no loop principal
export function updateTyping(deltaTime) {
    if (!tecladoMesh) return;

    if (isTyping) {
        typingTimer -= deltaTime;
        // Tremor sutil no eixo Y (para cima e para baixo)
        tecladoMesh.position.y = 0.006 + (Math.random() - 0.5) * 0.003;
        
        if (typingTimer <= 0) {
            isTyping = false;
            tecladoMesh.position.y = 0.006; // Crava na posição original
        }
    }
}

// Função auxiliar para gerar textura de Post-it com texto dinâmico
function criarTexturaPostIt(texto, corHex) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Fundo do post-it
    ctx.fillStyle = corHex;
    ctx.fillRect(0, 0, 256, 256);

    // Configuração da fonte (simulando caligrafia de caneta preta/azul escura)
    ctx.fillStyle = '#222222';
    // Uma fonte mais descontraída para parecer escrito à mão
    ctx.font = 'bold 34px "Comic Sans MS", "Marker Felt", sans-serif'; 
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Lógica simples para quebrar o texto em duas linhas se for muito longo
    const palavras = texto.split(' ');
    if (palavras.length > 2) {
        const linha1 = palavras.slice(0, Math.ceil(palavras.length / 2)).join(' ');
        const linha2 = palavras.slice(Math.ceil(palavras.length / 2)).join(' ');
        ctx.fillText(linha1, 128, 100);
        ctx.fillText(linha2, 128, 156);
    } else {
        ctx.fillText(texto, 128, 128);
    }

    // Uma leve bordinha de sombra para dar volume
    ctx.strokeStyle = 'rgba(0,0,0,0.05)';
    ctx.lineWidth = 10;
    ctx.strokeRect(0, 0, 256, 256);

    return new THREE.CanvasTexture(canvas);
}