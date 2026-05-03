// engine/exporter.js
// Exporta a cena atual como código Three.js limpo
import * as THREE from 'three';

export class Exporter {
    constructor(editor, container) {
        this.editor = editor;
        this.container = container;
        this._build();
    }

    _build() {
        this.container.innerHTML = `
            <div class="engine-exporter">
                <div class="engine-builder-label">Exportar código</div>

                <div class="engine-export-options">
                    <div class="engine-prop-row">
                        <label>Escopo</label>
                        <select id="engine-export-scope" class="engine-select">
                            <option value="selected">Objeto selecionado</option>
                            <option value="all">Cena inteira</option>
                            <option value="new">Apenas objetos novos (sem nome original)</option>
                        </select>
                    </div>
                    <div class="engine-prop-row">
                        <label>Nome da variável raiz</label>
                        <input type="text" id="engine-export-varname" value="novoObjeto" class="engine-num-input" style="width:100%">
                    </div>
                </div>

                <div class="engine-export-buttons">
                    <button id="engine-export-objects" class="engine-btn-export">📋 Exportar objetos (JS)</button>
                    <button id="engine-export-camera" class="engine-btn-export">🎥 Exportar modos de câmera</button>
                    <button id="engine-export-scene-json" class="engine-btn-export">💾 Exportar cena (JSON)</button>
                    <button id="engine-import-scene-json" class="engine-btn-export">📂 Importar cena (JSON)</button>
                </div>

                <div class="engine-export-output">
                    <div class="engine-builder-label">Código gerado</div>
                    <textarea id="engine-export-code" class="engine-code-output" readonly placeholder="Clique em um dos botões acima para gerar código..."></textarea>
                    <button id="engine-export-copy" class="engine-btn-small">📋 Copiar para clipboard</button>
                </div>
            </div>
        `;

        this._bindEvents();
    }

    // ==========================================
    // EXPORTAR OBJETOS COMO CÓDIGO THREE.JS
    // ==========================================
    exportObjects() {
        const scope = document.getElementById('engine-export-scope').value;
        const rootVar = document.getElementById('engine-export-varname').value || 'obj';

        let objects = [];

        if (scope === 'selected' && this.editor.selected) {
            objects = [this.editor.selected];
        } else if (scope === 'all') {
            this.editor.scene.children.forEach(child => {
                if (this._isExportable(child)) objects.push(child);
            });
        } else if (scope === 'new') {
            this.editor.scene.traverse(child => {
                if (this._isExportable(child) && child.userData._engineCreated) {
                    objects.push(child);
                }
            });
        }

        if (objects.length === 0) {
            this._setOutput('// Nenhum objeto para exportar.\n// Selecione um objeto ou mude o escopo.');
            return;
        }

        let code = '// Código gerado pelo Engine Editor — TASK\n';
        code += `// ${new Date().toLocaleString('pt-BR')}\n\n`;

        // Coletar materiais únicos
        const materials = new Map();
        objects.forEach(obj => this._collectMaterials(obj, materials));

        // Gerar declarações de material
        materials.forEach((mat, id) => {
            code += this._materialToCode(mat, id) + '\n';
        });
        if (materials.size > 0) code += '\n';

        // Gerar objetos
        objects.forEach(obj => {
            code += this._objectToCode(obj, rootVar, materials, 0) + '\n';
        });

        code += `\nscene.add(${rootVar});\n`;

        this._setOutput(code);
    }

    // ==========================================
    // EXPORTAR MODOS DE CÂMERA
    // ==========================================
    exportCameraModes() {
        const modes = this.editor.cameraEditor.cameraModes;
        let code = '// Modos de câmera — gerado pelo Engine Editor\n\n';

        code += 'function setCameraMode(mode) {\n';
        code += '    currentMode = mode;\n\n';

        modes.forEach((mode, i) => {
            const condition = i === 0 ? 'if' : 'else if';
            code += `    ${condition} (mode === '${mode.name}') {\n`;

            if (mode.name === 'LIVRE') {
                code += `        if (orbitControls) orbitControls.enabled = true;\n`;
            } else {
                code += `        if (orbitControls) orbitControls.enabled = false;\n`;
            }

            code += `        camera.position.set(${mode.position.x.toFixed(3)}, ${mode.position.y.toFixed(3)}, ${mode.position.z.toFixed(3)});\n`;
            code += `        camera.lookAt(${mode.lookAt.x.toFixed(3)}, ${mode.lookAt.y.toFixed(3)}, ${mode.lookAt.z.toFixed(3)});\n`;

            if (mode.fov && mode.fov !== 60) {
                code += `        camera.fov = ${mode.fov};\n`;
                code += `        camera.updateProjectionMatrix();\n`;
            }

            code += `        console.log("[Câmera] Modo: ${mode.name}");\n`;
            code += `    }\n`;
        });

        code += '}\n';

        // Exportar keyframes se existirem
        const keyframes = this.editor.cameraEditor.keyframes;
        if (keyframes.length > 0) {
            code += '\n// Keyframes de animação de câmera\n';
            code += 'const cameraKeyframes = [\n';
            keyframes.forEach((kf, i) => {
                code += `    { // KF ${i + 1}\n`;
                code += `        position: new THREE.Vector3(${kf.position.x.toFixed(3)}, ${kf.position.y.toFixed(3)}, ${kf.position.z.toFixed(3)}),\n`;
                code += `        lookAt: new THREE.Vector3(${kf.lookAt.x.toFixed(3)}, ${kf.lookAt.y.toFixed(3)}, ${kf.lookAt.z.toFixed(3)}),\n`;
                if (kf.fov) code += `        fov: ${kf.fov},\n`;
                code += `    },\n`;
            });
            code += '];\n';
        }

        this._setOutput(code);
    }

    // ==========================================
    // EXPORTAR / IMPORTAR JSON
    // ==========================================
    exportSceneJSON() {
        const data = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            cameraModes: this.editor.cameraEditor.cameraModes,
            keyframes: this.editor.cameraEditor.keyframes.map(kf => ({
                position: { x: kf.position.x, y: kf.position.y, z: kf.position.z },
                lookAt: { x: kf.lookAt.x, y: kf.lookAt.y, z: kf.lookAt.z },
                fov: kf.fov
            })),
            objects: []
        };

        this.editor.scene.children.forEach(child => {
            if (this._isExportable(child)) {
                data.objects.push(this._serializeObject(child));
            }
        });

        const json = JSON.stringify(data, null, 2);
        this._setOutput(json);

        // Também oferece download
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'task_scene.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    importSceneJSON() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                const text = await file.text();
                const data = JSON.parse(text);
                this._applySceneData(data);
                console.log('[Engine] Cena importada com sucesso');
            } catch (err) {
                console.error('[Engine] Erro ao importar:', err);
                alert('Erro ao importar arquivo JSON.');
            }
        });
        input.click();
    }

    _serializeObject(obj) {
        const data = {
            name: obj.name,
            type: obj.type,
            position: { x: obj.position.x, y: obj.position.y, z: obj.position.z },
            rotation: { x: obj.rotation.x, y: obj.rotation.y, z: obj.rotation.z },
            scale: { x: obj.scale.x, y: obj.scale.y, z: obj.scale.z },
            visible: obj.visible,
            children: []
        };

        if (obj.isMesh) {
            data.geometry = {
                type: obj.geometry.type,
                parameters: obj.geometry.parameters || {}
            };
            data.material = {
                type: obj.material.type,
                color: obj.material.color ? '#' + obj.material.color.getHexString() : null,
                emissive: obj.material.emissive ? '#' + obj.material.emissive.getHexString() : null,
                emissiveIntensity: obj.material.emissiveIntensity,
                opacity: obj.material.opacity,
                wireframe: obj.material.wireframe
            };
            data.castShadow = obj.castShadow;
            data.receiveShadow = obj.receiveShadow;
        }

        if (obj.isLight) {
            data.light = {
                color: '#' + obj.color.getHexString(),
                intensity: obj.intensity,
                distance: obj.distance,
                decay: obj.decay
            };
        }

        obj.children.forEach(child => {
            if (this._isExportable(child)) {
                data.children.push(this._serializeObject(child));
            }
        });

        return data;
    }

    _applySceneData(data) {
        // Restaurar modos de câmera
        if (data.cameraModes) {
            this.editor.cameraEditor.cameraModes = data.cameraModes;
            this.editor.cameraEditor._renderModes();
        }

        // Restaurar keyframes
        if (data.keyframes) {
            this.editor.cameraEditor.keyframes = data.keyframes.map(kf => ({
                position: new THREE.Vector3(kf.position.x, kf.position.y, kf.position.z),
                lookAt: new THREE.Vector3(kf.lookAt.x, kf.lookAt.y, kf.lookAt.z),
                fov: kf.fov
            }));
            this.editor.cameraEditor._renderKeyframes();
        }

        this.editor.sceneTree.rebuild();
    }

    // ==========================================
    // CONVERSÃO OBJETO → CÓDIGO
    // ==========================================
    _objectToCode(obj, varName, materials, depth) {
        const indent = '    '.repeat(depth);
        let code = '';

        if (obj.isGroup) {
            code += `${indent}const ${varName} = new THREE.Group();\n`;
            code += `${indent}${varName}.name = '${obj.name || ''}';\n`;
            code += this._transformToCode(obj, varName, indent);

            obj.children.forEach((child, i) => {
                if (this._isExportable(child)) {
                    const childVar = `${varName}_${child.name || 'child' + i}`.replace(/[^a-zA-Z0-9_]/g, '_');
                    code += '\n' + this._objectToCode(child, childVar, materials, depth);
                    code += `${indent}${varName}.add(${childVar});\n`;
                }
            });

        } else if (obj.isMesh) {
            const geoCode = this._geometryToCode(obj.geometry);
            const matId = this._getMaterialId(obj.material, materials);

            code += `${indent}const ${varName} = new THREE.Mesh(${geoCode}, ${matId});\n`;
            if (obj.name) code += `${indent}${varName}.name = '${obj.name}';\n`;
            code += this._transformToCode(obj, varName, indent);

            if (obj.castShadow) code += `${indent}${varName}.castShadow = true;\n`;
            if (obj.receiveShadow) code += `${indent}${varName}.receiveShadow = true;\n`;

        } else if (obj.isLight) {
            const lightType = obj.type;
            const colorHex = '0x' + obj.color.getHexString().toUpperCase();

            if (obj.isPointLight) {
                code += `${indent}const ${varName} = new THREE.PointLight(${colorHex}, ${obj.intensity}, ${obj.distance}, ${obj.decay});\n`;
            } else if (obj.isDirectionalLight) {
                code += `${indent}const ${varName} = new THREE.DirectionalLight(${colorHex}, ${obj.intensity});\n`;
            } else if (obj.isSpotLight) {
                code += `${indent}const ${varName} = new THREE.SpotLight(${colorHex}, ${obj.intensity});\n`;
            } else {
                code += `${indent}const ${varName} = new THREE.${lightType}(${colorHex}, ${obj.intensity});\n`;
            }

            if (obj.name) code += `${indent}${varName}.name = '${obj.name}';\n`;
            code += this._transformToCode(obj, varName, indent);
        }

        return code;
    }

    _transformToCode(obj, varName, indent) {
        let code = '';
        const p = obj.position;
        const r = obj.rotation;
        const s = obj.scale;

        if (p.x !== 0 || p.y !== 0 || p.z !== 0) {
            code += `${indent}${varName}.position.set(${this._f(p.x)}, ${this._f(p.y)}, ${this._f(p.z)});\n`;
        }
        if (r.x !== 0 || r.y !== 0 || r.z !== 0) {
            code += `${indent}${varName}.rotation.set(${this._f(r.x)}, ${this._f(r.y)}, ${this._f(r.z)});\n`;
        }
        if (s.x !== 1 || s.y !== 1 || s.z !== 1) {
            code += `${indent}${varName}.scale.set(${this._f(s.x)}, ${this._f(s.y)}, ${this._f(s.z)});\n`;
        }
        return code;
    }

    _geometryToCode(geo) {
        const p = geo.parameters;
        if (!p) return `new THREE.BufferGeometry() /* tipo desconhecido: ${geo.type} */`;

        switch (geo.type) {
            case 'BoxGeometry':
                return `new THREE.BoxGeometry(${this._f(p.width)}, ${this._f(p.height)}, ${this._f(p.depth)})`;
            case 'CylinderGeometry':
                return `new THREE.CylinderGeometry(${this._f(p.radiusTop)}, ${this._f(p.radiusBottom)}, ${this._f(p.height)}, ${p.radialSegments})`;
            case 'SphereGeometry':
                return `new THREE.SphereGeometry(${this._f(p.radius)}, ${p.widthSegments}, ${p.heightSegments})`;
            case 'PlaneGeometry':
                return `new THREE.PlaneGeometry(${this._f(p.width)}, ${this._f(p.height)})`;
            case 'ConeGeometry':
                return `new THREE.ConeGeometry(${this._f(p.radius)}, ${this._f(p.height)}, ${p.radialSegments})`;
            case 'TorusGeometry':
                return `new THREE.TorusGeometry(${this._f(p.radius)}, ${this._f(p.tube)}, ${p.radialSegments}, ${p.tubularSegments})`;
            default:
                return `new THREE.${geo.type}(/* exportação manual necessária */)`;
        }
    }

    _materialToCode(mat, id) {
        const colorHex = mat.color ? '0x' + mat.color.getHexString().toUpperCase() : '0xCCCCCC';
        let params = `{ color: ${colorHex}`;

        if (mat.emissive && mat.emissive.getHex() !== 0) {
            params += `, emissive: 0x${mat.emissive.getHexString().toUpperCase()}`;
            if (mat.emissiveIntensity !== 1) {
                params += `, emissiveIntensity: ${this._f(mat.emissiveIntensity)}`;
            }
        }
        if (mat.opacity < 1) {
            params += `, opacity: ${this._f(mat.opacity)}, transparent: true`;
        }
        params += ' }';

        return `const ${id} = new THREE.${mat.type}(${params});`;
    }

    _collectMaterials(obj, map) {
        if (obj.isMesh && obj.material) {
            const id = this._getMaterialId(obj.material, map);
        }
        obj.children.forEach(child => this._collectMaterials(child, map));
    }

    _getMaterialId(mat, map) {
        // Verifica se já temos este material
        for (const [id, existingMat] of map) {
            if (existingMat === mat) return id;
        }

        // Gera nome baseado na cor
        const colorName = mat.color ? mat.color.getHexString().toUpperCase() : 'CCCCCC';
        const prefix = mat.type.replace('Mesh', 'mat').replace('Material', '');
        let id = `${prefix}_${colorName}`;

        // Evita duplicatas de id
        let counter = 1;
        let finalId = id;
        while (map.has(finalId)) {
            finalId = `${id}_${counter++}`;
        }

        map.set(finalId, mat);
        return finalId;
    }

    _isExportable(obj) {
        if (!obj) return false;
        if (obj.isTransformControls) return false;
        if (obj.type === 'TransformControlsPlane') return false;
        if (obj.type === 'TransformControlsGizmo') return false;
        if (obj === this.editor.outlineMesh) return false;
        // Pula câmeras e luzes de setup que já existem no main.js
        if (obj.isCamera) return false;
        return true;
    }

    _f(n) {
        return Number(n.toFixed(4));
    }

    _setOutput(code) {
        const textarea = document.getElementById('engine-export-code');
        if (textarea) textarea.value = code;
    }

    // ==========================================
    // EVENTS
    // ==========================================
    _bindEvents() {
        document.getElementById('engine-export-objects')?.addEventListener('click', () => this.exportObjects());
        document.getElementById('engine-export-camera')?.addEventListener('click', () => this.exportCameraModes());
        document.getElementById('engine-export-scene-json')?.addEventListener('click', () => this.exportSceneJSON());
        document.getElementById('engine-import-scene-json')?.addEventListener('click', () => this.importSceneJSON());

        document.getElementById('engine-export-copy')?.addEventListener('click', () => {
            const code = document.getElementById('engine-export-code')?.value;
            if (code) {
                navigator.clipboard?.writeText(code);
                alert('Código copiado para o clipboard!');
            }
        });
    }
}
