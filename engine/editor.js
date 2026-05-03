// engine/editor.js
// Motor principal do editor visual — orquestra todos os painéis
import * as THREE from 'three';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { SceneTree } from './sceneTree.js';
import { Inspector } from './inspector.js';
import { ModelBuilder } from './modelBuilder.js';
import { CameraEditor } from './cameraEditor.js';
import { Exporter } from './exporter.js';

export class Editor {
    constructor(scene, camera, renderer, orbitControls) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.orbitControls = orbitControls;
        this.active = false;
        this.selected = null;

        // Raycaster para seleção por clique
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // TransformControls (gizmo de mover/rotacionar/escalar)
        this.transformControls = new TransformControls(camera, renderer.domElement);
        this.transformControls.setSize(0.6);
        this.transformControls.visible = false;
        this.transformControls.enabled = false;
        scene.add(this.transformControls);

        // Quando o gizmo está sendo arrastado, desativa OrbitControls
        this.transformControls.addEventListener('dragging-changed', (e) => {
            if (this.orbitControls) this.orbitControls.enabled = !e.value;
        });

        // Atualiza o inspector quando o gizmo move o objeto
        this.transformControls.addEventListener('change', () => {
            if (this.selected && this.inspector) {
                this.inspector.refresh(this.selected);
            }
        });

        // Outline para highlight do objeto selecionado
        this.outlineMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            wireframe: true,
            transparent: true,
            opacity: 0.6,
            depthTest: false
        });
        this.outlineMesh = null;

        // Cria a UI principal
        this._buildUI();

        // Sub-módulos
        this.sceneTree = new SceneTree(this, document.getElementById('engine-tree-content'));
        this.inspector = new Inspector(this, document.getElementById('engine-inspector-content'));
        this.modelBuilder = new ModelBuilder(this, document.getElementById('engine-builder-content'));
        this.cameraEditor = new CameraEditor(this, document.getElementById('engine-camera-content'));
        this.exporter = new Exporter(this, document.getElementById('engine-exporter-content'));

        // Listeners
        this._bindEvents();
    }

    // ==========================================
    // TOGGLE DO EDITOR
    // ==========================================
    toggle() {
        this.active = !this.active;
        const ui = document.getElementById('engine-root');
        ui.style.display = this.active ? 'flex' : 'none';

        if (this.active) {
            this.sceneTree.rebuild();
            this.transformControls.visible = !!this.selected;
            this.transformControls.enabled = !!this.selected;
            console.log('[Engine] Editor ATIVADO — F1 para desativar');
        } else {
            this.transformControls.visible = false;
            this.transformControls.enabled = false;
            this._clearOutline();
            if (this.orbitControls) this.orbitControls.enabled = true;
            console.log('[Engine] Editor DESATIVADO');
        }
    }

    // ==========================================
    // SELEÇÃO DE OBJETOS
    // ==========================================
    select(obj) {
        this.selected = obj;
        this._clearOutline();

        if (obj && obj.isMesh) {
            // Cria outline
            this.outlineMesh = new THREE.Mesh(obj.geometry.clone(), this.outlineMaterial);
            this.outlineMesh.position.copy(obj.position);
            this.outlineMesh.rotation.copy(obj.rotation);
            this.outlineMesh.scale.copy(obj.scale);
            this.outlineMesh.scale.multiplyScalar(1.03);
            this.outlineMesh.renderOrder = 999;

            // Attach no mesmo parent
            const parent = obj.parent || this.scene;
            parent.add(this.outlineMesh);

            // Posiciona gizmo
            this.transformControls.attach(obj);
            this.transformControls.visible = true;
            this.transformControls.enabled = true;
        } else if (obj && obj.isGroup) {
            this.transformControls.attach(obj);
            this.transformControls.visible = true;
            this.transformControls.enabled = true;
        } else {
            this.transformControls.detach();
            this.transformControls.visible = false;
            this.transformControls.enabled = false;
        }

        // Atualiza painéis
        this.inspector.refresh(obj);
        this.sceneTree.highlightSelected(obj);
    }

    deselect() {
        this.select(null);
    }

    deleteSelected() {
        if (!this.selected) return;
        const obj = this.selected;
        this.deselect();
        if (obj.parent) obj.parent.remove(obj);
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
            if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
            else obj.material.dispose();
        }
        this.sceneTree.rebuild();
        console.log('[Engine] Objeto deletado');
    }

    duplicateSelected() {
        if (!this.selected) return;
        const clone = this.selected.clone();
        clone.position.x += 0.2;
        clone.name = (this.selected.name || 'obj') + '_copia';
        const parent = this.selected.parent || this.scene;
        parent.add(clone);
        this.sceneTree.rebuild();
        this.select(clone);
        console.log('[Engine] Objeto duplicado');
    }

    // ==========================================
    // RAYCASTER (clique na viewport)
    // ==========================================
    _onViewportClick(event) {
        if (!this.active) return;

        // Ignora cliques na UI do editor
        if (event.target.closest('#engine-root')) return;

        // Ignora se estiver arrastando o gizmo
        if (this.transformControls.dragging) return;

        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Pega todos os meshes da cena (exceto outline e gizmo)
        const meshes = [];
        this.scene.traverse((child) => {
            if (child.isMesh && child !== this.outlineMesh && !child.isTransformControlsPlane) {
                meshes.push(child);
            }
        });

        const intersects = this.raycaster.intersectObjects(meshes, false);
        if (intersects.length > 0) {
            this.select(intersects[0].object);
        } else {
            this.deselect();
        }
    }

    // ==========================================
    // OUTLINE HELPER
    // ==========================================
    _clearOutline() {
        if (this.outlineMesh) {
            if (this.outlineMesh.parent) this.outlineMesh.parent.remove(this.outlineMesh);
            this.outlineMesh.geometry.dispose();
            this.outlineMesh = null;
        }
    }

    // Sincroniza outline com o objeto selecionado a cada frame
    updateOutline() {
        if (this.outlineMesh && this.selected && this.selected.isMesh) {
            this.outlineMesh.position.copy(this.selected.position);
            this.outlineMesh.rotation.copy(this.selected.rotation);
            this.outlineMesh.scale.copy(this.selected.scale).multiplyScalar(1.03);
        }
    }

    // Chamado a cada frame pelo main.js
    update() {
        if (!this.active) return;
        this.updateOutline();
    }

    // ==========================================
    // CONSTRUÇÃO DA UI
    // ==========================================
    _buildUI() {
        const root = document.createElement('div');
        root.id = 'engine-root';
        root.innerHTML = `
            <div id="engine-left-panel">
                <div class="engine-panel-section">
                    <div class="engine-panel-header" data-toggle="engine-tree-content">
                        <span>🌳 Cena</span>
                        <span class="engine-toggle-icon">▼</span>
                    </div>
                    <div id="engine-tree-content" class="engine-panel-body"></div>
                </div>
                <div class="engine-panel-section">
                    <div class="engine-panel-header" data-toggle="engine-builder-content">
                        <span>🔨 Criar Objeto</span>
                        <span class="engine-toggle-icon">▼</span>
                    </div>
                    <div id="engine-builder-content" class="engine-panel-body"></div>
                </div>
            </div>
            <div id="engine-right-panel">
                <div class="engine-panel-section">
                    <div class="engine-panel-header" data-toggle="engine-inspector-content">
                        <span>🔧 Propriedades</span>
                        <span class="engine-toggle-icon">▼</span>
                    </div>
                    <div id="engine-inspector-content" class="engine-panel-body"></div>
                </div>
                <div class="engine-panel-section">
                    <div class="engine-panel-header" data-toggle="engine-camera-content">
                        <span>🎥 Câmera</span>
                        <span class="engine-toggle-icon">▼</span>
                    </div>
                    <div id="engine-camera-content" class="engine-panel-body"></div>
                </div>
                <div class="engine-panel-section">
                    <div class="engine-panel-header" data-toggle="engine-exporter-content">
                        <span>📦 Exportar</span>
                        <span class="engine-toggle-icon">▼</span>
                    </div>
                    <div id="engine-exporter-content" class="engine-panel-body"></div>
                </div>
            </div>
            <div id="engine-toolbar">
                <button id="engine-btn-translate" class="engine-tool-btn active" title="Mover (W)">↔</button>
                <button id="engine-btn-rotate" class="engine-tool-btn" title="Rotacionar (E)">↻</button>
                <button id="engine-btn-scale" class="engine-tool-btn" title="Escalar (R)">⬡</button>
                <span class="engine-toolbar-sep"></span>
                <button id="engine-btn-duplicate" class="engine-tool-btn" title="Duplicar (Ctrl+D)">⧉</button>
                <button id="engine-btn-delete" class="engine-tool-btn" title="Deletar (Del)">🗑</button>
                <span class="engine-toolbar-sep"></span>
                <button id="engine-btn-snap" class="engine-tool-btn" title="Snap Grid (G)">⊞</button>
                <span class="engine-toolbar-sep"></span>
                <span id="engine-status" class="engine-status">Engine Editor — F1 para fechar</span>
            </div>
        `;
        root.style.display = 'none';
        document.body.appendChild(root);

        // Collapse toggles
        root.querySelectorAll('.engine-panel-header').forEach(header => {
            header.addEventListener('click', () => {
                const targetId = header.dataset.toggle;
                const body = document.getElementById(targetId);
                const icon = header.querySelector('.engine-toggle-icon');
                body.classList.toggle('collapsed');
                icon.textContent = body.classList.contains('collapsed') ? '▶' : '▼';
            });
        });
    }

    // ==========================================
    // EVENT BINDINGS
    // ==========================================
    _bindEvents() {
        // F1 toggle
        window.addEventListener('keydown', (e) => {
            if (e.key === 'F1') {
                e.preventDefault();
                this.toggle();
            }
            if (!this.active) return;

            // Gizmo mode shortcuts
            if (e.key === 'w' || e.key === 'W') this._setGizmoMode('translate');
            if (e.key === 'e' || e.key === 'E') this._setGizmoMode('rotate');
            if (e.key === 'r' || e.key === 'R') this._setGizmoMode('scale');
            if (e.key === 'g' || e.key === 'G') this._toggleSnap();
            if (e.key === 'Delete' || e.key === 'Backspace') this.deleteSelected();
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                this.duplicateSelected();
            }
            if (e.key === 'Escape') this.deselect();

            // Foco na câmera no objeto selecionado
            if (e.key === 'f' || e.key === 'F') this._focusSelected();
        });

        // Clique na viewport
        this.renderer.domElement.addEventListener('click', (e) => this._onViewportClick(e));

        // Toolbar buttons
        document.getElementById('engine-btn-translate')?.addEventListener('click', () => this._setGizmoMode('translate'));
        document.getElementById('engine-btn-rotate')?.addEventListener('click', () => this._setGizmoMode('rotate'));
        document.getElementById('engine-btn-scale')?.addEventListener('click', () => this._setGizmoMode('scale'));
        document.getElementById('engine-btn-duplicate')?.addEventListener('click', () => this.duplicateSelected());
        document.getElementById('engine-btn-delete')?.addEventListener('click', () => this.deleteSelected());
        document.getElementById('engine-btn-snap')?.addEventListener('click', () => this._toggleSnap());
    }

    _setGizmoMode(mode) {
        this.transformControls.setMode(mode);
        // Atualiza botões
        document.querySelectorAll('.engine-tool-btn').forEach(b => b.classList.remove('active'));
        const btnId = `engine-btn-${mode}`;
        document.getElementById(btnId)?.classList.add('active');
    }

    _toggleSnap() {
        const btn = document.getElementById('engine-btn-snap');
        const isSnap = this.transformControls.translationSnap !== null;
        if (isSnap) {
            this.transformControls.setTranslationSnap(null);
            this.transformControls.setRotationSnap(null);
            this.transformControls.setScaleSnap(null);
            btn?.classList.remove('active');
        } else {
            this.transformControls.setTranslationSnap(0.05);
            this.transformControls.setRotationSnap(THREE.MathUtils.degToRad(15));
            this.transformControls.setScaleSnap(0.1);
            btn?.classList.add('active');
        }
    }

    _focusSelected() {
        if (!this.selected || !this.orbitControls) return;
        const pos = new THREE.Vector3();
        if (this.selected.isGroup) {
            const box = new THREE.Box3().setFromObject(this.selected);
            box.getCenter(pos);
        } else {
            this.selected.getWorldPosition(pos);
        }
        this.orbitControls.target.copy(pos);
        this.orbitControls.update();
    }
}
