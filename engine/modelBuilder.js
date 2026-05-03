// engine/modelBuilder.js
// Painel para criar novos objetos a partir de primitivas
import * as THREE from 'three';

export class ModelBuilder {
    constructor(editor, container) {
        this.editor = editor;
        this.container = container;
        this._build();
    }

    _build() {
        this.container.innerHTML = `
            <div class="engine-builder">
                <div class="engine-builder-section">
                    <div class="engine-builder-label">Primitivas</div>
                    <div class="engine-builder-grid">
                        <button class="engine-prim-btn" data-type="box" title="Caixa">
                            <span class="engine-prim-icon">▣</span>
                            <span>Box</span>
                        </button>
                        <button class="engine-prim-btn" data-type="cylinder" title="Cilindro">
                            <span class="engine-prim-icon">⬡</span>
                            <span>Cilindro</span>
                        </button>
                        <button class="engine-prim-btn" data-type="sphere" title="Esfera">
                            <span class="engine-prim-icon">●</span>
                            <span>Esfera</span>
                        </button>
                        <button class="engine-prim-btn" data-type="plane" title="Plano">
                            <span class="engine-prim-icon">▬</span>
                            <span>Plano</span>
                        </button>
                        <button class="engine-prim-btn" data-type="cone" title="Cone">
                            <span class="engine-prim-icon">▲</span>
                            <span>Cone</span>
                        </button>
                        <button class="engine-prim-btn" data-type="torus" title="Torus">
                            <span class="engine-prim-icon">◎</span>
                            <span>Torus</span>
                        </button>
                    </div>
                </div>

                <div class="engine-builder-section">
                    <div class="engine-builder-label">Containers</div>
                    <div class="engine-builder-grid">
                        <button class="engine-prim-btn" data-type="group" title="Grupo vazio">
                            <span class="engine-prim-icon">📁</span>
                            <span>Grupo</span>
                        </button>
                        <button class="engine-prim-btn" data-type="pointlight" title="Luz Pontual">
                            <span class="engine-prim-icon">💡</span>
                            <span>Luz Pont.</span>
                        </button>
                        <button class="engine-prim-btn" data-type="spotlight" title="Spot Light">
                            <span class="engine-prim-icon">🔦</span>
                            <span>Spot</span>
                        </button>
                    </div>
                </div>

                <div class="engine-builder-section">
                    <div class="engine-builder-label">Configuração do novo objeto</div>
                    <div class="engine-prop-row">
                        <label>Nome</label>
                        <input type="text" id="engine-new-name" value="" placeholder="auto" class="engine-num-input" style="width:100%">
                    </div>
                    <div class="engine-prop-row">
                        <label>Cor</label>
                        <input type="color" id="engine-new-color" value="#cccccc" class="engine-color-input">
                    </div>
                    <div class="engine-prop-row">
                        <label>Material</label>
                        <select id="engine-new-material" class="engine-select">
                            <option value="lambert">Lambert</option>
                            <option value="phong">Phong</option>
                            <option value="standard">Standard</option>
                            <option value="basic">Basic</option>
                        </select>
                    </div>
                    <div class="engine-prop-row">
                        <label>Adicionar em</label>
                        <select id="engine-new-parent" class="engine-select">
                            <option value="scene">Cena (raiz)</option>
                            <option value="selected">Objeto selecionado</option>
                        </select>
                    </div>
                </div>

                <div class="engine-builder-section">
                    <div class="engine-builder-label">Presets do TASK</div>
                    <div class="engine-builder-grid">
                        <button class="engine-prim-btn engine-preset-btn" data-preset="telefone" title="Telefone fixo de mesa">
                            <span class="engine-prim-icon">📞</span>
                            <span>Telefone</span>
                        </button>
                        <button class="engine-prim-btn engine-preset-btn" data-preset="xicara" title="Xícara de café">
                            <span class="engine-prim-icon">☕</span>
                            <span>Xícara</span>
                        </button>
                        <button class="engine-prim-btn engine-preset-btn" data-preset="celular" title="Celular sobre a mesa">
                            <span class="engine-prim-icon">📱</span>
                            <span>Celular</span>
                        </button>
                        <button class="engine-prim-btn engine-preset-btn" data-preset="teclado" title="Teclado de PC">
                            <span class="engine-prim-icon">⌨</span>
                            <span>Teclado</span>
                        </button>
                        <button class="engine-prim-btn engine-preset-btn" data-preset="mouse" title="Mouse de PC">
                            <span class="engine-prim-icon">🖱</span>
                            <span>Mouse</span>
                        </button>
                        <button class="engine-prim-btn engine-preset-btn" data-preset="portaretrato" title="Porta-retrato">
                            <span class="engine-prim-icon">🖼</span>
                            <span>Porta-ret.</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Bind primitives
        this.container.querySelectorAll('.engine-prim-btn:not(.engine-preset-btn)').forEach(btn => {
            btn.addEventListener('click', () => this._createPrimitive(btn.dataset.type));
        });

        // Bind presets
        this.container.querySelectorAll('.engine-preset-btn').forEach(btn => {
            btn.addEventListener('click', () => this._createPreset(btn.dataset.preset));
        });
    }

    // ==========================================
    // CRIAR PRIMITIVAS
    // ==========================================
    _createPrimitive(type) {
        const color = document.getElementById('engine-new-color').value;
        const matType = document.getElementById('engine-new-material').value;
        const name = document.getElementById('engine-new-name').value;
        const parentMode = document.getElementById('engine-new-parent').value;

        let obj;

        const mat = this._makeMaterial(matType, color);

        switch (type) {
            case 'box':
                obj = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), mat);
                obj.name = name || 'Box';
                break;
            case 'cylinder':
                obj = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.2, 8), mat);
                obj.name = name || 'Cylinder';
                break;
            case 'sphere':
                obj = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), mat);
                obj.name = name || 'Sphere';
                break;
            case 'plane':
                obj = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3), mat);
                obj.name = name || 'Plane';
                break;
            case 'cone':
                obj = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.2, 8), mat);
                obj.name = name || 'Cone';
                break;
            case 'torus':
                obj = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.03, 8, 16), mat);
                obj.name = name || 'Torus';
                break;
            case 'group':
                obj = new THREE.Group();
                obj.name = name || 'Group';
                break;
            case 'pointlight':
                obj = new THREE.PointLight(color, 0.5, 5, 2);
                obj.name = name || 'PointLight';
                break;
            case 'spotlight':
                obj = new THREE.SpotLight(color, 0.5, 10, Math.PI / 6);
                obj.name = name || 'SpotLight';
                break;
        }

        if (!obj) return;

        // Posiciona na frente da câmera
        const cam = this.editor.camera;
        const dir = new THREE.Vector3();
        cam.getWorldDirection(dir);
        obj.position.copy(cam.position).add(dir.multiplyScalar(1.5));

        // Adiciona ao parent correto
        const parent = (parentMode === 'selected' && this.editor.selected)
            ? this.editor.selected
            : this.editor.scene;
        parent.add(obj);

        this.editor.sceneTree.rebuild();
        this.editor.select(obj);
        console.log(`[Engine] Criado: ${obj.name} (${obj.type})`);
    }

    // ==========================================
    // PRESETS DO JOGO TASK
    // ==========================================
    _createPreset(preset) {
        let obj;

        switch (preset) {
            case 'telefone':
                obj = this._buildTelefone();
                break;
            case 'xicara':
                obj = this._buildXicara();
                break;
            case 'celular':
                obj = this._buildCelular();
                break;
            case 'teclado':
                obj = this._buildTeclado();
                break;
            case 'mouse':
                obj = this._buildMouse();
                break;
            case 'portaretrato':
                obj = this._buildPortaRetrato();
                break;
        }

        if (!obj) return;

        this.editor.scene.add(obj);
        this.editor.sceneTree.rebuild();
        this.editor.select(obj);
        console.log(`[Engine] Preset criado: ${obj.name}`);
    }

    _buildTelefone() {
        const group = new THREE.Group();
        group.name = 'telefone';
        const matPreto = new THREE.MeshLambertMaterial({ color: 0x1A1A1A });

        // Base
        const base = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.03, 0.12), matPreto);
        base.name = 'telefone_base';
        group.add(base);

        // Corpo com botões
        const corpo = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.10), matPreto);
        corpo.position.set(0, 0.035, 0);
        corpo.name = 'telefone_corpo';
        group.add(corpo);

        // Gancho esquerdo
        const ganchoE = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.03, 6), matPreto);
        ganchoE.position.set(-0.05, 0.065, 0);
        ganchoE.name = 'telefone_ganchoE';
        group.add(ganchoE);

        // Gancho direito
        const ganchoD = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.03, 6), matPreto);
        ganchoD.position.set(0.05, 0.065, 0);
        ganchoD.name = 'telefone_ganchoD';
        group.add(ganchoD);

        // Fone (handset)
        const fone = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.025, 0.035), matPreto);
        fone.position.set(0, 0.08, 0);
        fone.name = 'telefone_fone';
        group.add(fone);

        // Auriculares (pontas arredondadas do fone)
        const auriE = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.03, 6), matPreto);
        auriE.rotation.z = Math.PI / 2;
        auriE.position.set(-0.065, 0.08, 0);
        auriE.name = 'telefone_auriE';
        group.add(auriE);

        const auriD = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.03, 6), matPreto);
        auriD.rotation.z = Math.PI / 2;
        auriD.position.set(0.065, 0.08, 0);
        auriD.name = 'telefone_auriD';
        group.add(auriD);

        group.position.set(-0.5, 0.73, 0.5);
        return group;
    }

    _buildXicara() {
        const group = new THREE.Group();
        group.name = 'xicara';
        const matCeramica = new THREE.MeshLambertMaterial({ color: 0xF5F5DC });

        // Corpo da xícara
        const corpo = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.028, 0.06, 8), matCeramica);
        corpo.name = 'xicara_corpo';
        group.add(corpo);

        // Alça (torus cortado)
        const alca = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.005, 4, 8, Math.PI), matCeramica);
        alca.rotation.y = Math.PI / 2;
        alca.position.set(0.04, 0, 0);
        alca.name = 'xicara_alca';
        group.add(alca);

        // Líquido (café)
        const matCafe = new THREE.MeshLambertMaterial({ color: 0x3E2723 });
        const cafe = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.005, 8), matCafe);
        cafe.position.set(0, 0.025, 0);
        cafe.name = 'xicara_cafe';
        group.add(cafe);

        // Prato/pires
        const pires = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.005, 8), matCeramica);
        pires.position.set(0, -0.035, 0);
        pires.name = 'xicara_pires';
        group.add(pires);

        group.position.set(0.4, 0.73, 0.5);
        return group;
    }

    _buildCelular() {
        const group = new THREE.Group();
        group.name = 'celular';
        const matCorpo = new THREE.MeshLambertMaterial({ color: 0x2C2C2C });
        const matTela = new THREE.MeshLambertMaterial({
            color: 0x111111,
            emissive: 0x222244,
            emissiveIntensity: 0.1
        });

        // Corpo
        const corpo = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.008, 0.10), matCorpo);
        corpo.name = 'celular_corpo';
        group.add(corpo);

        // Tela
        const tela = new THREE.Mesh(new THREE.PlaneGeometry(0.045, 0.065), matTela);
        tela.rotation.x = -Math.PI / 2;
        tela.position.set(0, 0.005, -0.01);
        tela.name = 'celular_tela';
        group.add(tela);

        group.position.set(0.35, 0.73, 0.75);
        return group;
    }

    _buildTeclado() {
        const group = new THREE.Group();
        group.name = 'teclado';
        const matTeclado = new THREE.MeshLambertMaterial({ color: 0xD4C8A8 });

        // Base do teclado
        const base = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.012, 0.12), matTeclado);
        base.name = 'teclado_base';
        group.add(base);

        // Inclinação traseira
        const pe = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.008, 0.02), matTeclado);
        pe.position.set(0, 0.005, -0.05);
        pe.name = 'teclado_pe';
        group.add(pe);

        // Indicação de teclas (textura simplificada com grid de boxes)
        const matTecla = new THREE.MeshLambertMaterial({ color: 0xBEB8A0 });
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 12; col++) {
                const tecla = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.006, 0.022), matTecla);
                tecla.position.set(
                    -0.14 + col * 0.026,
                    0.012,
                    -0.035 + row * 0.028
                );
                group.add(tecla);
            }
        }

        group.position.set(0, 0.73, 0.8);
        return group;
    }

    _buildMouse() {
        const group = new THREE.Group();
        group.name = 'mouse';
        const matMouse = new THREE.MeshLambertMaterial({ color: 0xD4C8A8 });

        // Corpo do mouse (arredondado)
        const corpo = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 0.06), matMouse);
        corpo.name = 'mouse_corpo';
        group.add(corpo);

        // Botão esquerdo
        const btnE = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.003, 0.025), matMouse);
        btnE.position.set(-0.008, 0.012, -0.012);
        btnE.name = 'mouse_btnE';
        group.add(btnE);

        // Botão direito
        const btnD = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.003, 0.025), matMouse);
        btnD.position.set(0.008, 0.012, -0.012);
        btnD.name = 'mouse_btnD';
        group.add(btnD);

        // Scroll wheel
        const matScroll = new THREE.MeshLambertMaterial({ color: 0x888888 });
        const scroll = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.012, 6), matScroll);
        scroll.rotation.z = Math.PI / 2;
        scroll.position.set(0, 0.013, -0.012);
        scroll.name = 'mouse_scroll';
        group.add(scroll);

        group.position.set(0.28, 0.73, 0.8);
        return group;
    }

    _buildPortaRetrato() {
        const group = new THREE.Group();
        group.name = 'portaRetrato';
        const matMoldura = new THREE.MeshLambertMaterial({ color: 0x5C4033 });
        const matFoto = new THREE.MeshLambertMaterial({ color: 0xD2B48C }); // Placeholder sépia

        // Moldura
        const moldura = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.13, 0.01), matMoldura);
        moldura.name = 'portaRetrato_moldura';
        group.add(moldura);

        // Foto (plano na frente)
        const foto = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.10), matFoto);
        foto.position.set(0, 0, 0.006);
        foto.name = 'portaRetrato_foto';
        group.add(foto);

        // Pé de apoio (trás)
        const pe = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.10, 0.005), matMoldura);
        pe.position.set(0, -0.02, -0.03);
        pe.rotation.x = 0.3;
        pe.name = 'portaRetrato_pe';
        group.add(pe);

        group.position.set(-0.35, 0.80, 0.35);
        group.rotation.x = -0.15; // Levemente inclinado pra trás
        return group;
    }

    // ==========================================
    // HELPERS
    // ==========================================
    _makeMaterial(type, color) {
        const params = { color };
        switch (type) {
            case 'lambert': return new THREE.MeshLambertMaterial(params);
            case 'phong': return new THREE.MeshPhongMaterial(params);
            case 'standard': return new THREE.MeshStandardMaterial(params);
            case 'basic': return new THREE.MeshBasicMaterial(params);
            default: return new THREE.MeshLambertMaterial(params);
        }
    }
}
