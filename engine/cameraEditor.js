// engine/cameraEditor.js
// Editor de câmera — keyframes, modos, animações, preview
import * as THREE from 'three';

export class CameraEditor {
    constructor(editor, container) {
        this.editor = editor;
        this.container = container;

        // Sistema de keyframes
        this.keyframes = [];
        this.isPlaying = false;
        this.playStartTime = 0;
        this.currentKeyframeIndex = 0;

        // Modos de câmera salvos
        this.cameraModes = [
            {
                name: 'LIVRE',
                position: { x: 0, y: 1.5, z: 2.5 },
                lookAt: { x: 0, y: 0.95, z: 0.2 },
                fov: 60
            },
            {
                name: 'CADEIRA',
                position: { x: 0, y: 1.3, z: 1.4 },
                lookAt: { x: 0, y: 1.0, z: 0.5 },
                fov: 60
            },
            {
                name: 'MONITOR',
                position: { x: 0, y: 1.17, z: 1.0 },
                lookAt: { x: 0, y: 1.17, z: 0.5 },
                fov: 60
            }
        ];

        this._build();
    }

    _build() {
        this.container.innerHTML = `
            <div class="engine-camera">
                <!-- Info da câmera atual -->
                <div class="engine-cam-info">
                    <div class="engine-builder-label">Câmera atual</div>
                    <div class="engine-cam-live">
                        <div class="engine-prop-row">
                            <label>Pos</label>
                            <span id="engine-cam-pos" class="engine-cam-val">0, 0, 0</span>
                        </div>
                        <div class="engine-prop-row">
                            <label>Rot</label>
                            <span id="engine-cam-rot" class="engine-cam-val">0, 0, 0</span>
                        </div>
                        <div class="engine-prop-row">
                            <label>FOV</label>
                            <input type="range" id="engine-cam-fov" min="20" max="120" value="60" class="engine-slider">
                            <span id="engine-cam-fov-val" class="engine-cam-val">60°</span>
                        </div>
                    </div>
                    <button id="engine-cam-copy" class="engine-btn-small">Copiar posição atual</button>
                </div>

                <!-- Modos de câmera -->
                <div class="engine-cam-modes">
                    <div class="engine-builder-label">Modos de câmera</div>
                    <div id="engine-cam-modes-list"></div>
                    <button id="engine-cam-add-mode" class="engine-btn-small">+ Novo modo</button>
                </div>

                <!-- Timeline de Keyframes -->
                <div class="engine-cam-timeline">
                    <div class="engine-builder-label">Animação (keyframes)</div>
                    <div id="engine-cam-keyframes-list"></div>
                    <div class="engine-cam-timeline-controls">
                        <button id="engine-cam-add-kf" class="engine-btn-small">+ Keyframe aqui</button>
                        <button id="engine-cam-play" class="engine-btn-small">▶ Reproduzir</button>
                        <button id="engine-cam-stop" class="engine-btn-small" style="display:none">⏹ Parar</button>
                        <button id="engine-cam-clear-kf" class="engine-btn-small">🗑 Limpar</button>
                    </div>
                    <div class="engine-prop-row">
                        <label>Duração total</label>
                        <input type="number" id="engine-cam-duration" value="3" step="0.5" min="0.5" max="30" class="engine-num-input">
                        <span class="engine-cam-val">seg</span>
                    </div>
                    <div class="engine-prop-row">
                        <label>Easing</label>
                        <select id="engine-cam-easing" class="engine-select">
                            <option value="linear">Linear</option>
                            <option value="easeInOut" selected>Ease In/Out</option>
                            <option value="easeIn">Ease In</option>
                            <option value="easeOut">Ease Out</option>
                        </select>
                    </div>
                </div>
            </div>
        `;

        this._bindEvents();
        this._renderModes();
        this._renderKeyframes();
        this._startLiveUpdate();
    }

    // ==========================================
    // LIVE UPDATE (mostra posição da câmera em tempo real)
    // ==========================================
    _startLiveUpdate() {
        const update = () => {
            if (!this.editor.active) {
                requestAnimationFrame(update);
                return;
            }

            const cam = this.editor.camera;
            const posEl = document.getElementById('engine-cam-pos');
            const rotEl = document.getElementById('engine-cam-rot');

            if (posEl) {
                posEl.textContent = `${cam.position.x.toFixed(2)}, ${cam.position.y.toFixed(2)}, ${cam.position.z.toFixed(2)}`;
            }
            if (rotEl) {
                const deg = (r) => (THREE.MathUtils.radToDeg(r)).toFixed(1);
                rotEl.textContent = `${deg(cam.rotation.x)}°, ${deg(cam.rotation.y)}°, ${deg(cam.rotation.z)}°`;
            }

            // Animação de keyframes
            if (this.isPlaying) {
                this._updatePlayback();
            }

            requestAnimationFrame(update);
        };
        requestAnimationFrame(update);
    }

    // ==========================================
    // MODOS DE CÂMERA
    // ==========================================
    _renderModes() {
        const list = document.getElementById('engine-cam-modes-list');
        if (!list) return;
        list.innerHTML = '';

        this.cameraModes.forEach((mode, i) => {
            const row = document.createElement('div');
            row.className = 'engine-cam-mode-row';
            row.innerHTML = `
                <span class="engine-cam-mode-name">${mode.name}</span>
                <span class="engine-cam-mode-info">
                    pos(${mode.position.x.toFixed(1)}, ${mode.position.y.toFixed(1)}, ${mode.position.z.toFixed(1)})
                </span>
                <button class="engine-btn-tiny" data-action="goto" data-index="${i}" title="Ir para este modo">👁</button>
                <button class="engine-btn-tiny" data-action="update" data-index="${i}" title="Atualizar com posição atual">📌</button>
                <button class="engine-btn-tiny" data-action="delete" data-index="${i}" title="Remover modo">✕</button>
            `;
            list.appendChild(row);
        });

        // Bind botões dos modos
        list.querySelectorAll('[data-action="goto"]').forEach(btn => {
            btn.addEventListener('click', () => this._gotoMode(parseInt(btn.dataset.index)));
        });
        list.querySelectorAll('[data-action="update"]').forEach(btn => {
            btn.addEventListener('click', () => this._updateMode(parseInt(btn.dataset.index)));
        });
        list.querySelectorAll('[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', () => this._deleteMode(parseInt(btn.dataset.index)));
        });
    }

    _gotoMode(index) {
        const mode = this.cameraModes[index];
        if (!mode) return;
        const cam = this.editor.camera;
        cam.position.set(mode.position.x, mode.position.y, mode.position.z);
        cam.lookAt(mode.lookAt.x, mode.lookAt.y, mode.lookAt.z);
        if (mode.fov) {
            cam.fov = mode.fov;
            cam.updateProjectionMatrix();
        }
        if (this.editor.orbitControls) {
            this.editor.orbitControls.target.set(mode.lookAt.x, mode.lookAt.y, mode.lookAt.z);
            this.editor.orbitControls.update();
        }
    }

    _updateMode(index) {
        const cam = this.editor.camera;
        const target = this.editor.orbitControls?.target || new THREE.Vector3(0, 1, 0);
        this.cameraModes[index].position = { x: cam.position.x, y: cam.position.y, z: cam.position.z };
        this.cameraModes[index].lookAt = { x: target.x, y: target.y, z: target.z };
        this.cameraModes[index].fov = cam.fov;
        this._renderModes();
        console.log(`[Engine] Modo "${this.cameraModes[index].name}" atualizado`);
    }

    _deleteMode(index) {
        this.cameraModes.splice(index, 1);
        this._renderModes();
    }

    _addMode() {
        const cam = this.editor.camera;
        const target = this.editor.orbitControls?.target || new THREE.Vector3();
        const name = prompt('Nome do modo de câmera:', `MODO_${this.cameraModes.length + 1}`);
        if (!name) return;
        this.cameraModes.push({
            name,
            position: { x: cam.position.x, y: cam.position.y, z: cam.position.z },
            lookAt: { x: target.x, y: target.y, z: target.z },
            fov: cam.fov
        });
        this._renderModes();
    }

    // ==========================================
    // KEYFRAMES
    // ==========================================
    _addKeyframe() {
        const cam = this.editor.camera;
        const target = this.editor.orbitControls?.target || new THREE.Vector3();
        this.keyframes.push({
            position: cam.position.clone(),
            lookAt: target.clone(),
            fov: cam.fov
        });
        this._renderKeyframes();
        console.log(`[Engine] Keyframe ${this.keyframes.length} adicionado`);
    }

    _renderKeyframes() {
        const list = document.getElementById('engine-cam-keyframes-list');
        if (!list) return;
        list.innerHTML = '';

        if (this.keyframes.length === 0) {
            list.innerHTML = '<div class="engine-empty">Nenhum keyframe. Posicione a câmera e clique "+ Keyframe aqui".</div>';
            return;
        }

        this.keyframes.forEach((kf, i) => {
            const row = document.createElement('div');
            row.className = 'engine-cam-kf-row';
            row.innerHTML = `
                <span class="engine-cam-kf-index">KF ${i + 1}</span>
                <span class="engine-cam-kf-info">
                    (${kf.position.x.toFixed(2)}, ${kf.position.y.toFixed(2)}, ${kf.position.z.toFixed(2)})
                </span>
                <button class="engine-btn-tiny" data-action="goto-kf" data-index="${i}" title="Ir para este keyframe">👁</button>
                <button class="engine-btn-tiny" data-action="del-kf" data-index="${i}" title="Remover">✕</button>
            `;
            list.appendChild(row);
        });

        list.querySelectorAll('[data-action="goto-kf"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const kf = this.keyframes[parseInt(btn.dataset.index)];
                this.editor.camera.position.copy(kf.position);
                if (this.editor.orbitControls) {
                    this.editor.orbitControls.target.copy(kf.lookAt);
                    this.editor.orbitControls.update();
                }
            });
        });

        list.querySelectorAll('[data-action="del-kf"]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.keyframes.splice(parseInt(btn.dataset.index), 1);
                this._renderKeyframes();
            });
        });
    }

    // ==========================================
    // PLAYBACK DE ANIMAÇÃO
    // ==========================================
    _play() {
        if (this.keyframes.length < 2) {
            alert('Precisa de pelo menos 2 keyframes para animar.');
            return;
        }
        this.isPlaying = true;
        this.playStartTime = performance.now();
        this.currentKeyframeIndex = 0;

        // Desativa controles
        if (this.editor.orbitControls) this.editor.orbitControls.enabled = false;

        document.getElementById('engine-cam-play').style.display = 'none';
        document.getElementById('engine-cam-stop').style.display = '';
    }

    _stop() {
        this.isPlaying = false;
        if (this.editor.orbitControls) this.editor.orbitControls.enabled = true;
        document.getElementById('engine-cam-play').style.display = '';
        document.getElementById('engine-cam-stop').style.display = 'none';
    }

    _updatePlayback() {
        const duration = parseFloat(document.getElementById('engine-cam-duration')?.value || 3) * 1000;
        const elapsed = performance.now() - this.playStartTime;
        const totalSegments = this.keyframes.length - 1;
        const segmentDuration = duration / totalSegments;

        const globalT = elapsed / duration;
        if (globalT >= 1) {
            // Animação terminou
            const lastKf = this.keyframes[this.keyframes.length - 1];
            this.editor.camera.position.copy(lastKf.position);
            this._stop();
            return;
        }

        // Qual segmento estamos
        const segIndex = Math.min(Math.floor(globalT * totalSegments), totalSegments - 1);
        const segT = (globalT * totalSegments) - segIndex;

        const easingType = document.getElementById('engine-cam-easing')?.value || 'easeInOut';
        const t = this._applyEasing(segT, easingType);

        const kfA = this.keyframes[segIndex];
        const kfB = this.keyframes[segIndex + 1];

        // Interpola posição
        this.editor.camera.position.lerpVectors(kfA.position, kfB.position, t);

        // Interpola lookAt
        const lookAt = new THREE.Vector3().lerpVectors(kfA.lookAt, kfB.lookAt, t);
        this.editor.camera.lookAt(lookAt);

        // Interpola FOV
        if (kfA.fov !== undefined && kfB.fov !== undefined) {
            this.editor.camera.fov = kfA.fov + (kfB.fov - kfA.fov) * t;
            this.editor.camera.updateProjectionMatrix();
        }
    }

    _applyEasing(t, type) {
        switch (type) {
            case 'linear': return t;
            case 'easeIn': return t * t;
            case 'easeOut': return t * (2 - t);
            case 'easeInOut': return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            default: return t;
        }
    }

    // ==========================================
    // EVENTS
    // ==========================================
    _bindEvents() {
        document.getElementById('engine-cam-fov')?.addEventListener('input', (e) => {
            const fov = parseInt(e.target.value);
            this.editor.camera.fov = fov;
            this.editor.camera.updateProjectionMatrix();
            document.getElementById('engine-cam-fov-val').textContent = `${fov}°`;
        });

        document.getElementById('engine-cam-copy')?.addEventListener('click', () => {
            const cam = this.editor.camera;
            const target = this.editor.orbitControls?.target;
            const code = `camera.position.set(${cam.position.x.toFixed(3)}, ${cam.position.y.toFixed(3)}, ${cam.position.z.toFixed(3)});\ncamera.lookAt(${target?.x.toFixed(3) || 0}, ${target?.y.toFixed(3) || 0}, ${target?.z.toFixed(3) || 0});`;
            navigator.clipboard?.writeText(code);
            console.log('[Engine] Posição copiada:\n' + code);
            alert('Posição da câmera copiada para o clipboard!');
        });

        document.getElementById('engine-cam-add-mode')?.addEventListener('click', () => this._addMode());
        document.getElementById('engine-cam-add-kf')?.addEventListener('click', () => this._addKeyframe());
        document.getElementById('engine-cam-play')?.addEventListener('click', () => this._play());
        document.getElementById('engine-cam-stop')?.addEventListener('click', () => this._stop());
        document.getElementById('engine-cam-clear-kf')?.addEventListener('click', () => {
            this.keyframes = [];
            this._renderKeyframes();
        });
    }
}
