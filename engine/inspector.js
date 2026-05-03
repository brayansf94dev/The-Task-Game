// engine/inspector.js
// Painel de propriedades — edita transform e material em tempo real
import * as THREE from 'three';

export class Inspector {
    constructor(editor, container) {
        this.editor = editor;
        this.container = container;
        this._currentObj = null;
        this._inputs = {};
    }

    refresh(obj) {
        this._currentObj = obj;
        this.container.innerHTML = '';
        this._inputs = {};

        if (!obj) {
            this.container.innerHTML = '<div class="engine-empty">Nenhum objeto selecionado</div>';
            return;
        }

        // Header com nome editável
        this._buildHeader(obj);

        // Transform (position, rotation, scale)
        this._buildTransformSection(obj);

        // Material (cor, emissive, etc)
        if (obj.isMesh && obj.material) {
            this._buildMaterialSection(obj);
        }

        // Geometria (dimensões, se for primitiva)
        if (obj.isMesh && obj.geometry) {
            this._buildGeometrySection(obj);
        }

        // Luz
        if (obj.isLight) {
            this._buildLightSection(obj);
        }

        // Flags
        this._buildFlagsSection(obj);
    }

    // ==========================================
    // HEADER
    // ==========================================
    _buildHeader(obj) {
        const header = document.createElement('div');
        header.className = 'engine-insp-header';

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.value = obj.name || '';
        nameInput.placeholder = obj.type;
        nameInput.className = 'engine-insp-name';
        nameInput.addEventListener('change', () => {
            obj.name = nameInput.value;
            this.editor.sceneTree.rebuild();
        });

        const typeLabel = document.createElement('span');
        typeLabel.className = 'engine-insp-type';
        typeLabel.textContent = obj.type;

        header.appendChild(nameInput);
        header.appendChild(typeLabel);
        this.container.appendChild(header);
    }

    // ==========================================
    // TRANSFORM
    // ==========================================
    _buildTransformSection(obj) {
        const section = this._createSection('Transform');

        // Position
        this._addVector3Row(section, 'Posição', obj.position, 0.01);

        // Rotation (mostra em graus, aplica em radianos)
        const rotRow = document.createElement('div');
        rotRow.className = 'engine-vec3-group';
        rotRow.innerHTML = `<label class="engine-vec3-label">Rotação</label>`;
        ['x', 'y', 'z'].forEach((axis, i) => {
            const colors = ['#e74c3c', '#2ecc71', '#3498db'];
            const wrapper = document.createElement('div');
            wrapper.className = 'engine-vec3-input';
            wrapper.style.borderLeftColor = colors[i];

            const label = document.createElement('span');
            label.textContent = axis.toUpperCase();
            label.className = 'engine-axis-label';

            const input = document.createElement('input');
            input.type = 'number';
            input.step = '1';
            input.value = this._round(THREE.MathUtils.radToDeg(obj.rotation[axis]));
            input.addEventListener('input', () => {
                obj.rotation[axis] = THREE.MathUtils.degToRad(parseFloat(input.value) || 0);
            });
            this._inputs[`rot_${axis}`] = { input, obj, prop: 'rotation', axis, isDeg: true };

            wrapper.appendChild(label);
            wrapper.appendChild(input);
            rotRow.appendChild(wrapper);
        });
        section.appendChild(rotRow);

        // Scale
        this._addVector3Row(section, 'Escala', obj.scale, 0.01);

        this.container.appendChild(section);
    }

    _addVector3Row(parent, label, vector, step) {
        const row = document.createElement('div');
        row.className = 'engine-vec3-group';
        row.innerHTML = `<label class="engine-vec3-label">${label}</label>`;

        ['x', 'y', 'z'].forEach((axis, i) => {
            const colors = ['#e74c3c', '#2ecc71', '#3498db'];
            const wrapper = document.createElement('div');
            wrapper.className = 'engine-vec3-input';
            wrapper.style.borderLeftColor = colors[i];

            const axisLabel = document.createElement('span');
            axisLabel.textContent = axis.toUpperCase();
            axisLabel.className = 'engine-axis-label';

            const input = document.createElement('input');
            input.type = 'number';
            input.step = String(step);
            input.value = this._round(vector[axis]);
            input.addEventListener('input', () => {
                vector[axis] = parseFloat(input.value) || 0;
            });

            // Drag para ajustar valor
            this._makeDraggable(input, (delta) => {
                const newVal = (parseFloat(input.value) || 0) + delta * step * 10;
                input.value = this._round(newVal);
                vector[axis] = newVal;
            });

            this._inputs[`${label}_${axis}`] = { input, vector, axis };

            wrapper.appendChild(axisLabel);
            wrapper.appendChild(input);
            row.appendChild(wrapper);
        });

        parent.appendChild(row);
    }

    // ==========================================
    // MATERIAL
    // ==========================================
    _buildMaterialSection(obj) {
        const mat = obj.material;
        const section = this._createSection('Material');

        // Cor principal
        if (mat.color) {
            this._addColorRow(section, 'Cor', mat.color);
        }

        // Emissivo
        if (mat.emissive) {
            this._addColorRow(section, 'Emissivo', mat.emissive);

            const intRow = this._addNumberRow(section, 'Intens. Emissivo', mat.emissiveIntensity, 0.01, 0, 5);
            intRow.input.addEventListener('input', () => {
                mat.emissiveIntensity = parseFloat(intRow.input.value) || 0;
            });
        }

        // Opacidade
        const opRow = this._addNumberRow(section, 'Opacidade', mat.opacity, 0.01, 0, 1);
        opRow.input.addEventListener('input', () => {
            mat.opacity = parseFloat(opRow.input.value) || 1;
            mat.transparent = mat.opacity < 1;
        });

        // Wireframe
        this._addCheckboxRow(section, 'Wireframe', mat.wireframe || false, (val) => {
            mat.wireframe = val;
        });

        // Tipo de material (dropdown para trocar)
        this._addMaterialTypeRow(section, obj);

        this.container.appendChild(section);
    }

    _addColorRow(parent, label, colorObj) {
        const row = document.createElement('div');
        row.className = 'engine-prop-row';

        const lbl = document.createElement('label');
        lbl.textContent = label;

        const input = document.createElement('input');
        input.type = 'color';
        input.value = '#' + colorObj.getHexString();
        input.className = 'engine-color-input';
        input.addEventListener('input', () => {
            colorObj.set(input.value);
        });

        const hexSpan = document.createElement('span');
        hexSpan.className = 'engine-color-hex';
        hexSpan.textContent = colorObj.getHexString().toUpperCase();
        input.addEventListener('input', () => {
            hexSpan.textContent = input.value.replace('#', '').toUpperCase();
        });

        row.appendChild(lbl);
        row.appendChild(input);
        row.appendChild(hexSpan);
        parent.appendChild(row);
    }

    _addMaterialTypeRow(parent, obj) {
        const row = document.createElement('div');
        row.className = 'engine-prop-row';

        const lbl = document.createElement('label');
        lbl.textContent = 'Tipo Material';

        const select = document.createElement('select');
        select.className = 'engine-select';
        const types = ['MeshLambertMaterial', 'MeshPhongMaterial', 'MeshStandardMaterial', 'MeshBasicMaterial'];
        types.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t;
            opt.textContent = t.replace('Mesh', '').replace('Material', '');
            if (obj.material.type === t) opt.selected = true;
            select.appendChild(opt);
        });

        select.addEventListener('change', () => {
            const oldMat = obj.material;
            const color = oldMat.color ? oldMat.color.clone() : new THREE.Color(0xcccccc);
            const newMat = new THREE[select.value]({ color });
            if (oldMat.emissive && newMat.emissive) {
                newMat.emissive.copy(oldMat.emissive);
                newMat.emissiveIntensity = oldMat.emissiveIntensity;
            }
            obj.material = newMat;
            oldMat.dispose();
            this.refresh(obj);
        });

        row.appendChild(lbl);
        row.appendChild(select);
        parent.appendChild(row);
    }

    // ==========================================
    // GEOMETRIA
    // ==========================================
    _buildGeometrySection(obj) {
        const geo = obj.geometry;
        const section = this._createSection('Geometria');

        const typeRow = document.createElement('div');
        typeRow.className = 'engine-prop-row';
        typeRow.innerHTML = `<label>Tipo</label><span class="engine-geo-type">${geo.type}</span>`;
        section.appendChild(typeRow);

        // Mostra parâmetros da geometria se disponíveis
        if (geo.parameters) {
            const params = geo.parameters;
            Object.keys(params).forEach(key => {
                const val = params[key];
                if (typeof val === 'number') {
                    const numRow = this._addNumberRow(section, key, val, 0.01, 0, 100);
                    numRow.input.addEventListener('change', () => {
                        const newParams = { ...geo.parameters };
                        newParams[key] = parseFloat(numRow.input.value) || val;
                        const NewGeo = geo.constructor;
                        try {
                            const paramOrder = this._getGeoParamOrder(geo.type);
                            const args = paramOrder.map(p => newParams[p] !== undefined ? newParams[p] : geo.parameters[p]);
                            obj.geometry = new NewGeo(...args);
                            geo.dispose();
                        } catch (e) {
                            console.warn('[Engine] Não foi possível recriar geometria:', e);
                        }
                    });
                }
            });
        }

        // Info de vértices e triângulos
        const verts = geo.attributes?.position?.count || 0;
        const tris = geo.index ? geo.index.count / 3 : verts / 3;
        const statsRow = document.createElement('div');
        statsRow.className = 'engine-prop-row engine-geo-stats';
        statsRow.innerHTML = `<span>${verts} vértices</span><span>${Math.round(tris)} triângulos</span>`;
        section.appendChild(statsRow);

        this.container.appendChild(section);
    }

    _getGeoParamOrder(type) {
        const orders = {
            'BoxGeometry': ['width', 'height', 'depth', 'widthSegments', 'heightSegments', 'depthSegments'],
            'CylinderGeometry': ['radiusTop', 'radiusBottom', 'height', 'radialSegments', 'heightSegments', 'openEnded', 'thetaStart', 'thetaLength'],
            'SphereGeometry': ['radius', 'widthSegments', 'heightSegments'],
            'PlaneGeometry': ['width', 'height', 'widthSegments', 'heightSegments'],
            'ConeGeometry': ['radius', 'height', 'radialSegments', 'heightSegments'],
            'TorusGeometry': ['radius', 'tube', 'radialSegments', 'tubularSegments'],
        };
        return orders[type] || Object.keys(orders['BoxGeometry']);
    }

    // ==========================================
    // LUZ
    // ==========================================
    _buildLightSection(obj) {
        const section = this._createSection('Luz');

        if (obj.color) this._addColorRow(section, 'Cor', obj.color);

        const intRow = this._addNumberRow(section, 'Intensidade', obj.intensity, 0.05, 0, 20);
        intRow.input.addEventListener('input', () => {
            obj.intensity = parseFloat(intRow.input.value) || 0;
        });

        if (obj.distance !== undefined) {
            const distRow = this._addNumberRow(section, 'Distância', obj.distance, 0.1, 0, 100);
            distRow.input.addEventListener('input', () => {
                obj.distance = parseFloat(distRow.input.value) || 0;
            });
        }

        if (obj.decay !== undefined) {
            const decayRow = this._addNumberRow(section, 'Decay', obj.decay, 0.1, 0, 10);
            decayRow.input.addEventListener('input', () => {
                obj.decay = parseFloat(decayRow.input.value) || 0;
            });
        }

        this.container.appendChild(section);
    }

    // ==========================================
    // FLAGS
    // ==========================================
    _buildFlagsSection(obj) {
        const section = this._createSection('Flags');

        this._addCheckboxRow(section, 'Visível', obj.visible, (val) => { obj.visible = val; });

        if (obj.isMesh) {
            this._addCheckboxRow(section, 'Cast Shadow', obj.castShadow, (val) => { obj.castShadow = val; });
            this._addCheckboxRow(section, 'Receive Shadow', obj.receiveShadow, (val) => { obj.receiveShadow = val; });
        }

        this.container.appendChild(section);
    }

    // ==========================================
    // HELPERS DE UI
    // ==========================================
    _createSection(title) {
        const section = document.createElement('div');
        section.className = 'engine-insp-section';
        section.innerHTML = `<div class="engine-insp-section-title">${title}</div>`;
        return section;
    }

    _addNumberRow(parent, label, value, step, min, max) {
        const row = document.createElement('div');
        row.className = 'engine-prop-row';

        const lbl = document.createElement('label');
        lbl.textContent = label;

        const input = document.createElement('input');
        input.type = 'number';
        input.step = String(step);
        input.min = String(min);
        input.max = String(max);
        input.value = this._round(value);
        input.className = 'engine-num-input';

        row.appendChild(lbl);
        row.appendChild(input);
        parent.appendChild(row);
        return { row, input };
    }

    _addCheckboxRow(parent, label, value, onChange) {
        const row = document.createElement('div');
        row.className = 'engine-prop-row';

        const lbl = document.createElement('label');
        lbl.textContent = label;

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = value;
        input.className = 'engine-checkbox';
        input.addEventListener('change', () => onChange(input.checked));

        row.appendChild(lbl);
        row.appendChild(input);
        parent.appendChild(row);
    }

    _round(v) {
        return Math.round(v * 1000) / 1000;
    }

    // Drag horizontal em inputs numéricos para ajustar valor
    _makeDraggable(input, onDelta) {
        let dragging = false;
        let startX = 0;

        input.addEventListener('mousedown', (e) => {
            if (e.target === input && e.button === 1) { // Middle click
                dragging = true;
                startX = e.clientX;
                e.preventDefault();
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (!dragging) return;
            const delta = e.clientX - startX;
            startX = e.clientX;
            onDelta(delta);
        });

        window.addEventListener('mouseup', () => { dragging = false; });
    }
}
