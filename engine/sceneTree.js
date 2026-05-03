// engine/sceneTree.js
// Árvore hierárquica de todos os objetos da cena

export class SceneTree {
    constructor(editor, container) {
        this.editor = editor;
        this.container = container;
        this.nodeMap = new Map(); // obj.uuid → DOM element
    }

    rebuild() {
        this.container.innerHTML = '';
        this.nodeMap.clear();

        const searchBar = document.createElement('input');
        searchBar.type = 'text';
        searchBar.placeholder = 'Buscar objeto...';
        searchBar.className = 'engine-search';
        searchBar.addEventListener('input', (e) => this._filter(e.target.value));
        this.container.appendChild(searchBar);

        const tree = document.createElement('div');
        tree.className = 'engine-tree';
        this._buildNode(this.editor.scene, tree, 0);
        this.container.appendChild(tree);
    }

    _buildNode(obj, parentEl, depth) {
        // Pula o helper do TransformControls e o outline
        if (obj.isTransformControlsPlane || obj === this.editor.outlineMesh) return;
        if (obj.type === 'TransformControlsPlane' || obj.type === 'TransformControlsGizmo') return;
        // Pula objetos internos do TransformControls
        if (obj.parent && obj.parent.isTransformControls) return;
        if (obj.isTransformControls) return;

        const row = document.createElement('div');
        row.className = 'engine-tree-row';
        row.dataset.uuid = obj.uuid;
        row.style.paddingLeft = `${depth * 16 + 4}px`;

        // Ícone por tipo
        let icon = '◆';
        if (obj.isScene) icon = '🌐';
        else if (obj.isGroup) icon = '📁';
        else if (obj.isMesh) icon = '▣';
        else if (obj.isLight) icon = '💡';
        else if (obj.isCamera) icon = '📷';

        // Nome
        const name = obj.name || obj.type || 'Object3D';
        const hasChildren = obj.children.length > 0 && !obj.isTransformControls;
        const expandIcon = hasChildren ? '▶ ' : '  ';

        row.innerHTML = `
            <span class="engine-tree-expand" data-uuid="${obj.uuid}">${expandIcon}</span>
            <span class="engine-tree-icon">${icon}</span>
            <span class="engine-tree-name">${name}</span>
            <span class="engine-tree-type">${obj.type}</span>
        `;

        // Clique para selecionar
        row.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!obj.isScene) {
                this.editor.select(obj);
            }
        });

        // Duplo-clique para focar
        row.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this.editor.select(obj);
            this.editor._focusSelected();
        });

        this.nodeMap.set(obj.uuid, row);
        parentEl.appendChild(row);

        // Container de filhos (colapsável)
        if (hasChildren) {
            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'engine-tree-children';
            childrenContainer.dataset.parentUuid = obj.uuid;

            for (const child of obj.children) {
                this._buildNode(child, childrenContainer, depth + 1);
            }

            parentEl.appendChild(childrenContainer);

            // Toggle collapse
            const expandBtn = row.querySelector('.engine-tree-expand');
            expandBtn.style.cursor = 'pointer';
            expandBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isCollapsed = childrenContainer.classList.toggle('collapsed');
                expandBtn.textContent = isCollapsed ? '▶ ' : '▼ ';
            });
        }
    }

    highlightSelected(obj) {
        // Remove highlight anterior
        this.nodeMap.forEach((el) => el.classList.remove('selected'));

        if (obj && this.nodeMap.has(obj.uuid)) {
            const el = this.nodeMap.get(obj.uuid);
            el.classList.add('selected');
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    _filter(query) {
        const q = query.toLowerCase();
        this.nodeMap.forEach((el, uuid) => {
            const name = el.querySelector('.engine-tree-name')?.textContent.toLowerCase() || '';
            const type = el.querySelector('.engine-tree-type')?.textContent.toLowerCase() || '';
            const match = !q || name.includes(q) || type.includes(q);
            el.style.display = match ? '' : 'none';
        });
    }
}
