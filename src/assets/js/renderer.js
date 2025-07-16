// Fichier à placer dans : MonPanel/src/assets/js/renderer.js

// --- Fonctions utilitaires (pures, sans dépendances externes) ---
const hexToRgb = (hex) => { let r = 0, g = 0, b = 0; if (hex.length === 4) { r = "0x" + hex[1] + hex[1]; g = "0x" + hex[2] + hex[2]; b = "0x" + hex[3] + hex[3]; } else if (hex.length === 7) { r = "0x" + hex[1] + hex[2]; g = "0x" + hex[3] + hex[4]; b = "0x" + hex[5] + hex[6]; } return { r: +r, g: +g, b: +b }; };
const rgbToHex = (r, g, b) => "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
const rgbToHsl = (r, g, b) => { r /= 255; g /= 255; b /= 255; let max = Math.max(r, g, b), min = Math.min(r, g, b); let h, s, l = (max + min) / 2; if (max === min) { h = s = 0; } else { let d = max - min; s = l > 0.5 ? d / (2 - max - min) : d / (max + min); switch (max) { case r: h = (g - b) / d + (g < b ? 6 : 0); break; case g: h = (b - r) / d + 2; break; case b: h = (r - g) / d + 4; break; } h /= 6; } return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }; };
const hslToRgb = (h, s, l) => { s /= 100; l /= 100; let c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2, r = 0, g = 0, b = 0; if (0 <= h && h < 60) { r = c; g = x; b = 0; } else if (60 <= h && h < 120) { r = x; g = c; b = 0; } else if (120 <= h && h < 180) { r = 0; g = c; b = x; } else if (180 <= h && h < 240) { r = 0; g = x; b = c; } else if (240 <= h && h < 300) { r = x; g = 0; b = c; } else if (300 <= h && h < 360) { r = c; g = 0; b = x; } r = Math.round((r + m) * 255); g = Math.round((g + m) * 255); b = Math.round((b + m) * 255); return { r, g, b }; };


document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('[Init] DOM loaded. Starting application initialization.');

        const dom = {
            allViews: document.querySelectorAll('.view-container'),
            allModals: document.querySelectorAll('.modal-overlay'),
            mainContent: document.getElementById('main-content'),
            devtoolsView: document.getElementById('devtools-view'),
            settingsView: document.getElementById('settings-view'),
            welcomeScreen: document.getElementById('welcome-screen'),
            mainTitle: document.getElementById('main-title'),
            itemsContainer: document.getElementById('items-container'),
            editModeBtn: document.getElementById('edit-mode-btn'),
            editModal: document.getElementById('edit-modal'),
            editForm: document.getElementById('edit-form'),
            iconPickerModal: document.getElementById('icon-picker-modal'),
            settingsBtn: document.getElementById('settings-btn'),
            settingsBackBtn: document.getElementById('settings-back-btn'),
            themeToggle: document.getElementById('theme-toggle'),
            accentColorPicker: document.getElementById('accent-color-picker'),
            notificationContainer: document.getElementById('notification-container'),
            confirmModal: document.getElementById('confirm-modal'),
            confirmMessage: document.getElementById('confirm-message'),
            confirmOkBtn: document.getElementById('confirm-ok-btn'),
            confirmCancelBtn: document.getElementById('confirm-cancel-btn'),
            projectSearchInput: document.getElementById('project-search-input'),
        };

        const state = {
            isEditMode: false,
            currentItems: [],
            currentFilePath: '',
            settings: { theme: 'dark', accentColor: '#2563eb' },
            devToolsInitialized: false,
            settingsInitialized: false,
        };

        function showCustomNotification(message, type = 'success') {
            const toast = document.createElement('div');
            toast.className = `notification-toast ${type}`;
            
            const iconClass = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
            
            toast.innerHTML = `
                <i class="fas ${iconClass}"></i>
                <span>${message}</span>
            `;
            
            dom.notificationContainer.appendChild(toast);
            
            setTimeout(() => {
                toast.remove();
            }, 3000);
        }
        
        function showConfirmationModal(message) {
            return new Promise(resolve => {
                dom.confirmMessage.textContent = message;
                dom.confirmModal.classList.remove('is-inactive');

                const handleOk = () => {
                    cleanup();
                    resolve(true);
                };

                const handleCancel = () => {
                    cleanup();
                    resolve(false);
                };
                
                const cleanup = () => {
                    dom.confirmModal.classList.add('is-inactive');
                    dom.confirmOkBtn.removeEventListener('click', handleOk);
                    dom.confirmCancelBtn.removeEventListener('click', handleCancel);
                };

                dom.confirmOkBtn.addEventListener('click', handleOk);
                dom.confirmCancelBtn.addEventListener('click', handleCancel);
            });
        }

        const showView = (viewToShow) => {
            dom.allViews.forEach(view => {
                view.classList.toggle('is-inactive', view !== viewToShow);
            });
        };

        function createRipple(event) {
            const button = event.currentTarget;
            const circle = document.createElement("span");
            const diameter = Math.max(button.clientWidth, button.clientHeight);
            const radius = diameter / 2;
            circle.style.width = circle.style.height = `${diameter}px`;
            circle.style.left = `${event.clientX - button.getBoundingClientRect().left - radius}px`;
            circle.style.top = `${event.clientY - button.getBoundingClientRect().top - radius}px`;
            circle.classList.add("ripple");
            const existingRipple = button.getElementsByClassName("ripple")[0];
            if (existingRipple) existingRipple.remove();
            button.appendChild(circle);
        }

        const applySettings = () => {
            document.documentElement.dataset.theme = state.settings.theme;
            document.documentElement.style.setProperty('--accent-color', state.settings.accentColor);
            
            const accentRGB = hexToRgb(state.settings.accentColor);
            document.documentElement.style.setProperty('--accent-color-translucent', `rgba(${accentRGB.r}, ${accentRGB.g}, ${accentRGB.b}, 0.1)`);

            const hljsTheme = document.getElementById('hljs-theme');
            if (state.settings.theme === 'light') {
                hljsTheme.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-light.min.css';
            } else {
                hljsTheme.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css';
            }
            if (state.settingsInitialized) {
                dom.themeToggle.checked = state.settings.theme === 'light';
                document.querySelectorAll('.color-swatch').forEach(swatch => {
                    swatch.classList.toggle('active', swatch.dataset.color === state.settings.accentColor);
                });
            }
        };

        const saveSettings = () => {
            window.electronAPI.saveItems({ filePath: 'src/data/settings.json', data: state.settings });
        };

        const loadAndApplySettings = async () => {
            const loadedSettings = await window.electronAPI.readFile('src/data/settings.json');
            state.settings = { ...state.settings, ...loadedSettings };
            applySettings();
            if (!state.settingsInitialized) {
                initSettings();
            }
        };

        function initSettings() {
            const accentColors = ['#2563eb', '#8b5cf6', '#db2777', '#f59e0b', '#10b981', '#ef4444'];
            dom.accentColorPicker.innerHTML = '';
            accentColors.forEach(color => {
                const swatch = document.createElement('div');
                swatch.className = 'color-swatch';
                swatch.dataset.color = color;
                swatch.style.backgroundColor = color;
                swatch.addEventListener('click', () => {
                    state.settings.accentColor = color;
                    applySettings();
                    saveSettings();
                });
                dom.accentColorPicker.appendChild(swatch);
            });

            dom.themeToggle.addEventListener('change', () => {
                state.settings.theme = dom.themeToggle.checked ? 'light' : 'dark';
                applySettings();
                saveSettings();
            });

            state.settingsInitialized = true;
            applySettings();
        }

        async function loadItems(jsonPath, title) {
            state.currentFilePath = jsonPath;
            dom.mainTitle.textContent = title;
            dom.itemsContainer.innerHTML = `<p class="text-center col-span-full text-tertiary">Chargement...</p>`;
            try {
                const items = await window.electronAPI.readFile(jsonPath);
                state.currentItems = items || [];
                renderItems();
            } catch (error) {
                console.error(`[Items] Failed to load items from ${jsonPath}:`, error);
                showCustomNotification('Erreur de chargement des projets.', 'error');
                dom.itemsContainer.innerHTML = `<div class="bg-red-800 border border-red-600 text-white p-4 rounded-lg col-span-full">${error.message}</div>`;
            }
        }

        function renderItems() {
            const searchTerm = dom.projectSearchInput.value.toLowerCase();
            const itemsToRender = state.currentItems
                .map((item, index) => ({ item, originalIndex: index }))
                .filter(({ item }) =>
                    item.name.toLowerCase().includes(searchTerm) ||
                    item.description.toLowerCase().includes(searchTerm)
                );

            dom.itemsContainer.innerHTML = '';
            if (itemsToRender.length === 0) {
                dom.itemsContainer.innerHTML = `<p class="text-center col-span-full text-tertiary">Aucun projet trouvé.</p>`;
                if (state.isEditMode) {
                     const addItemCard = document.createElement('div');
                    addItemCard.className = 'border-2 border-dashed border-secondary hover:border-accent hover:text-accent transition-all duration-300 rounded-xl flex justify-center items-center text-tertiary cursor-pointer min-h-[250px]';
                    addItemCard.innerHTML = `<div class="text-center"><i class="fas fa-plus fa-2x mb-2"></i><p>Ajouter un item</p></div>`;
                    addItemCard.addEventListener('click', () => openEditModal());
                    dom.itemsContainer.appendChild(addItemCard);
                }
                return;
            }

            itemsToRender.forEach(({ item, originalIndex }) => {
                const itemCard = document.createElement('div');
                itemCard.className = 'item-card group';
                itemCard.dataset.index = originalIndex;
                if (state.isEditMode) itemCard.draggable = true;
                
                itemCard.innerHTML = `
                    <div class="card-controls"><button class="card-control-btn edit" title="Modifier"><i class="fas fa-pencil-alt"></i></button><button class="card-control-btn delete" title="Supprimer"><i class="fas fa-trash"></i></button></div>
                    <div class="flex-grow pointer-events-none">
                        <div class="mb-5"><i class="${item.icon || 'fas fa-question-circle'} fa-2x text-tertiary group-hover:text-accent transition-colors"></i></div>
                        <h3 class="text-xl font-bold mb-2 text-main group-hover:text-accent transition-colors">${item.name}</h3>
                        <p class="text-secondary text-sm mb-6 h-12 overflow-hidden">${item.description}</p>
                    </div>
                    <div class="project-links-container"></div>
                    <div class="project-details-container"></div>
                    <div class="card-actions-container"></div>
                    <div class="mt-auto pt-4">
                        <button class="launch-btn w-full bg-tertiary/50 border border-secondary hover:bg-accent hover:border-accent hover:text-white text-secondary font-bold py-2.5 px-4 rounded-lg transition-all duration-300 flex items-center justify-center overflow-hidden">
                            <span>Lancer</span>
                        </button>
                    </div>`;
                dom.itemsContainer.appendChild(itemCard);

                if (item.links && item.links.length > 0) {
                    const linksContainer = itemCard.querySelector('.project-links-container');
                    linksContainer.innerHTML = `<div class="custom-links-container"></div>`;
                    const linkButtonsContainer = linksContainer.querySelector('.custom-links-container');
                    item.links.forEach(link => {
                        const linkBtn = document.createElement('button');
                        linkBtn.className = 'custom-link-btn';
                        linkBtn.textContent = link.name;
                        linkBtn.title = link.url;
                        linkBtn.addEventListener('click', () => window.electronAPI.openExternalLink(link.url));
                        linkButtonsContainer.appendChild(linkBtn);
                    });
                }

                if (item.path) {
                    window.electronAPI.getProjectDetails(item.path).then(details => {
                        const detailsContainer = itemCard.querySelector('.project-details-container');
                        const actionsContainer = itemCard.querySelector('.card-actions-container');
                        if (detailsContainer && (details.branch || details.dependencies)) {
                            const hasChangesClass = details.hasChanges ? 'dirty' : '';
                            detailsContainer.innerHTML = `<div class="project-details">${details.branch ? `<div class="detail-item git-status ${hasChangesClass}"><i class="fas fa-code-branch"></i><span>${details.branch}</span></div>` : ''}${details.dependencies ? `<div class="detail-item"><i class="fas fa-box-open"></i><span>${Object.keys(details.dependencies).length} deps</span></div>` : ''}</div>`;
                        }
                        if (actionsContainer) {
                            actionsContainer.innerHTML = `<div class="card-actions"><button class="action-btn" data-action="open-explorer" title="Ouvrir dans l'explorateur"><i class="fas fa-folder-open"></i></button><button class="action-btn" data-action="open-terminal" title="Ouvrir un terminal"><i class="fas fa-terminal"></i></button></div>`;
                        }
                    });
                }
            });

            if (state.isEditMode) {
                const addItemCard = document.createElement('div');
                addItemCard.className = 'border-2 border-dashed border-secondary hover:border-accent hover:text-accent transition-all duration-300 rounded-xl flex justify-center items-center text-tertiary cursor-pointer min-h-[250px]';
                addItemCard.innerHTML = `<div class="text-center"><i class="fas fa-plus fa-2x mb-2"></i><p>Ajouter un item</p></div>`;
                addItemCard.addEventListener('click', () => openEditModal());
                dom.itemsContainer.appendChild(addItemCard);
                addDragAndDropListeners();
            }
        }

        function toggleEditMode() {
            state.isEditMode = !state.isEditMode;
            dom.mainContent.classList.toggle('edit-mode', state.isEditMode);
            dom.editModeBtn.classList.toggle('active', state.isEditMode);
            renderItems();
        }

        function openEditModal(index = null) {
            dom.editForm.reset();
            document.getElementById('commands-list').innerHTML = '';
            document.getElementById('links-list').innerHTML = ''; // Vider les liens

            if (index !== null && state.currentItems[index]) {
                const item = state.currentItems[index];
                document.getElementById('modal-title').textContent = 'Modifier l\'item';
                document.getElementById('edit-index').value = index;
                document.getElementById('item-name').value = item.name;
                document.getElementById('item-description').value = item.description;
                document.getElementById('item-path').value = item.path || '';
                updateSelectedIcon(item.icon);
                if (item.commands) item.commands.forEach(cmd => addCommandInput(cmd));
                if (item.links) item.links.forEach(link => addLinkInput(link.name, link.url));
            } else {
                document.getElementById('modal-title').textContent = 'Ajouter un nouvel item';
                document.getElementById('edit-index').value = '';
                updateSelectedIcon(null);
            }
            dom.editModal.classList.remove('is-inactive');
        }

        function closeEditModal() {
            dom.editModal.classList.add('is-inactive');
        }
        
        function addCommandInput(command = '') {
            const commandsList = document.getElementById('commands-list');
            const div = document.createElement('div');
            div.className = 'command-item';
            div.innerHTML = `<input type="text" class="command-item-input" value="${command.replace(/"/g, '&quot;')}" placeholder="Entrez une commande..."><button type="button" class="command-item-btn delete" title="Supprimer la commande"><i class="fas fa-trash"></i></button>`;
            div.querySelector('.delete').addEventListener('click', () => div.remove());
            commandsList.appendChild(div);
        }

        // NOUVEAU : Fonction pour ajouter un champ de lien dans la modale
        function addLinkInput(name = '', url = '') {
            const linksList = document.getElementById('links-list');
            const div = document.createElement('div');
            div.className = 'link-item';
            div.innerHTML = `
                <input type="text" class="modal-input link-name-input" value="${name}" placeholder="Nom du lien (ex: GitHub)">
                <input type="text" class="modal-input link-url-input" value="${url}" placeholder="URL (ex: https://...)">
                <button type="button" class="command-item-btn delete" title="Supprimer le lien"><i class="fas fa-trash"></i></button>
            `;
            div.querySelector('.delete').addEventListener('click', () => div.remove());
            linksList.appendChild(div);
        }

        async function openIconPicker() {
            const iconGrid = document.getElementById('icon-grid');
            dom.iconPickerModal.classList.remove('is-inactive');
            iconGrid.innerHTML = '<p class="text-tertiary col-span-full text-center">Chargement des icônes...</p>';
            try {
                const icons = await window.electronAPI.readFile('src/data/icons.json');
                iconGrid.innerHTML = '';
                if (icons && icons.length > 0) {
                    icons.forEach(iconClass => {
                        const iconItem = document.createElement('div');
                        iconItem.className = 'icon-item';
                        iconItem.innerHTML = `<i class="${iconClass}"></i>`;
                        iconItem.addEventListener('click', () => {
                            updateSelectedIcon(iconClass);
                            closeIconPicker();
                        });
                        iconGrid.appendChild(iconItem);
                    });
                } else {
                   iconGrid.innerHTML = '<p class="text-tertiary col-span-full text-center">Aucune icône trouvée.</p>';
                }
            } catch (error) {
                console.error("Failed to load icons:", error);
                showCustomNotification("Erreur de chargement des icônes.", "error");
                iconGrid.innerHTML = '<p class="text-red-400 col-span-full text-center">Erreur de chargement des icônes.</p>';
            }
        }

        function closeIconPicker() {
            dom.iconPickerModal.classList.add('is-inactive');
        }

        function updateSelectedIcon(iconClass) {
            const itemIconInput = document.getElementById('item-icon');
            const selectedIconPreview = document.getElementById('selected-icon-preview');
            const selectedIconName = document.getElementById('selected-icon-name');
            if (iconClass) {
                itemIconInput.value = iconClass;
                selectedIconPreview.innerHTML = `<i class="${iconClass}"></i>`;
                selectedIconName.textContent = iconClass;
                selectedIconName.classList.remove('text-tertiary');
            } else {
                itemIconInput.value = '';
                selectedIconPreview.innerHTML = `<i class="fas fa-question-circle text-tertiary"></i>`;
                selectedIconName.textContent = 'Choisir une icône...';
                selectedIconName.classList.add('text-tertiary');
            }
        }
        
        function addDragAndDropListeners() {
            const cards = dom.itemsContainer.querySelectorAll('.item-card[draggable="true"]');
            let draggedItem = null;

            cards.forEach(card => {
                card.addEventListener('dragstart', () => {
                    draggedItem = card;
                    setTimeout(() => card.classList.add('dragging'), 0);
                });

                card.addEventListener('dragend', () => {
                    if (draggedItem) {
                        draggedItem.classList.remove('dragging');
                        draggedItem = null;
                    }
                });
            });

            dom.itemsContainer.addEventListener('dragover', e => {
                e.preventDefault();
                const afterElement = getDragAfterElement(dom.itemsContainer, e.clientY);
                if (draggedItem) {
                    if (afterElement == null) {
                        dom.itemsContainer.appendChild(draggedItem);
                    } else {
                        dom.itemsContainer.insertBefore(draggedItem, afterElement);
                    }
                }
            });

            dom.itemsContainer.addEventListener('drop', e => {
                e.preventDefault();
                if (draggedItem) {
                    const newOrder = Array.from(dom.itemsContainer.querySelectorAll('.item-card[draggable="true"]'))
                        .map(c => state.currentItems[parseInt(c.dataset.index)]);
                    state.currentItems = newOrder;
                    window.electronAPI.saveItems({ filePath: state.currentFilePath, data: state.currentItems });
                    renderItems();
                }
            });
        }

        function getDragAfterElement(container, y) {
            const draggableElements = [...container.querySelectorAll('.item-card[draggable="true"]:not(.dragging)')];
            return draggableElements.reduce((closest, child) => {
                const box = child.getBoundingClientRect();
                const offset = y - box.top - box.height / 2;
                if (offset < 0 && offset > closest.offset) {
                    return { offset: offset, element: child };
                } else {
                    return closest;
                }
            }, { offset: Number.NEGATIVE_INFINITY }).element;
        }

        function initDevTools() {
            if (state.devToolsInitialized) return;
            console.log('[Init] Initializing dev tools for the first time...');
            try {
                // Moniteur Système
                window.electronAPI.onSystemStats(stats => {
                    document.getElementById('cpu-bar').style.width = `${stats.cpu.toFixed(1)}%`;
                    document.getElementById('cpu-percent').textContent = `${stats.cpu.toFixed(1)}%`;
                    document.getElementById('mem-bar').style.width = `${stats.mem.toFixed(1)}%`;
                    document.getElementById('mem-percent').textContent = `${stats.mem.toFixed(1)}%`;
                });
                // To-Do List
                const todoList = document.getElementById('todo-list'); 
                const newTodoInput = document.getElementById('new-todo-input'); 
                const addTodoBtn = document.getElementById('add-todo-btn'); 
                let todos = [];
                const renderTodos = () => { 
                    todoList.innerHTML = ''; 
                    todos.forEach((todo, index) => { 
                        const li = document.createElement('li'); 
                        li.className = `todo-item ${todo.completed ? 'completed' : ''}`; 
                        li.innerHTML = `<input type="checkbox" data-index="${index}" ${todo.completed ? 'checked' : ''}><span class="flex-grow">${todo.text}</span><button class="command-item-btn delete" data-index="${index}"><i class="fas fa-trash"></i></button>`; 
                        todoList.appendChild(li); 
                    }); 
                    addTodoListeners(); 
                };
                const saveTodos = () => window.electronAPI.saveItems({ filePath: 'src/data/todos.json', data: todos });
                const loadTodos = async () => { 
                    todos = await window.electronAPI.readFile('src/data/todos.json') || []; 
                    renderTodos(); 
                };
                const addTodo = () => { 
                    const text = newTodoInput.value.trim(); 
                    if (text) { 
                        todos.push({ text: text, completed: false }); 
                        newTodoInput.value = ''; 
                        saveTodos(); 
                        renderTodos(); 
                    } 
                };
                const addTodoListeners = () => {
                    document.querySelectorAll('#todo-list input[type="checkbox"]').forEach(checkbox => { 
                        checkbox.addEventListener('change', (e) => { 
                            const index = e.target.dataset.index; 
                            todos[index].completed = e.target.checked; 
                            saveTodos(); 
                            renderTodos(); 
                        }); 
                    });
                    document.querySelectorAll('#todo-list .delete').forEach(button => { 
                        button.addEventListener('click', async (e) => { 
                            const index = e.currentTarget.dataset.index; 
                            const confirmed = await showConfirmationModal('Supprimer cette tâche ?');
                            if (confirmed) {
                                todos.splice(index, 1); 
                                saveTodos(); 
                                renderTodos(); 
                                showCustomNotification('Tâche supprimée.', 'error');
                            }
                        }); 
                    });
                };
                addTodoBtn.addEventListener('click', addTodo); 
                newTodoInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTodo(); });
                loadTodos();

                // Boîte à Outils
                const tabs = document.querySelectorAll('.tool-tab');
                const contents = document.querySelectorAll('.tool-content');
                tabs.forEach(tab => { 
                    tab.addEventListener('click', () => { 
                        tabs.forEach(t => t.classList.remove('active')); 
                        contents.forEach(c => c.classList.add('is-inactive')); 
                        tab.classList.add('active'); 
                        document.getElementById(tab.dataset.tab).classList.remove('is-inactive'); 
                        tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }); 
                    }); 
                });

                // Utilitaires
                const colorPicker = document.getElementById('color-picker'); const hexInput = document.getElementById('hex-input'); const rgbInput = document.getElementById('rgb-input'); const hslInput = document.getElementById('hsl-input');
                const updateColor = (source, value) => { let color; try { if (source === 'picker' || source === 'hex') { const hex = value.startsWith('#') ? value : `#${value}`; if (!/^#([A-F0-9]{3}){1,2}$/i.test(hex)) return; color = hexToRgb(hex); } else if (source === 'rgb') { const match = value.match(/(\d+),\s*(\d+),\s*(\d+)/); if (!match) return; color = { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) }; } else if (source === 'hsl') { const match = value.match(/(\d+),\s*(\d+)%?,\s*(\d+)%?/); if (!match) return; color = hslToRgb(parseInt(match[1]), parseInt(match[2]), parseInt(match[3])); } if (source !== 'picker') colorPicker.value = rgbToHex(color.r, color.g, color.b); if (source !== 'hex') hexInput.value = rgbToHex(color.r, color.g, color.b); if (source !== 'rgb') rgbInput.value = `${color.r}, ${color.g}, ${color.b}`; const hsl = rgbToHsl(color.r, color.g, color.b); if (source !== 'hsl') hslInput.value = `${hsl.h}, ${hsl.s}%, ${hsl.l}%`; } catch (e) { } };
                colorPicker.addEventListener('input', (e) => updateColor('picker', e.target.value)); hexInput.addEventListener('input', (e) => updateColor('hex', e.target.value)); rgbInput.addEventListener('input', (e) => updateColor('rgb', e.target.value)); hslInput.addEventListener('input', (e) => updateColor('hsl', e.target.value)); updateColor('picker', '#2563eb');
                
                const pxInput = document.getElementById('px-input'); const remInput = document.getElementById('rem-input'); const baseSizeInput = document.getElementById('base-font-size');
                pxInput.addEventListener('input', () => { const base = parseFloat(baseSizeInput.value) || 16; remInput.value = (parseFloat(pxInput.value) / base).toFixed(3); });
                remInput.addEventListener('input', () => { const base = parseFloat(baseSizeInput.value) || 16; pxInput.value = (parseFloat(remInput.value) * base).toFixed(3); });
                baseSizeInput.addEventListener('input', () => { const base = parseFloat(baseSizeInput.value) || 16; remInput.value = (parseFloat(pxInput.value) / base).toFixed(3); });
                
                document.getElementById('generate-lorem-btn').addEventListener('click', () => { const count = document.getElementById('lorem-paragraphs').value; const lorem = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi. Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat. Duis semper. Duis arcu massa, scelerisque vitae, consequat in, pretium a, enim. Pellentesque congue. Ut in risus volutpat libero pharetra tempor. Cras vestibulum bibendum augue. Praesent egestas leo in pede. Praesent blandit odio eu enim. Pellentesque sed dui ut augue blandit sodales. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Aliquam nibh. Mauris ac mauris sed pede pellentesque fermentum. Maecenas adipiscing ante non diam. Proin sed quam et quam."; document.getElementById('lorem-output').value = Array(parseInt(count) || 1).fill(lorem).join('\n\n'); });
                
                document.getElementById('format-json-btn').addEventListener('click', () => { const input = document.getElementById('json-input'); const status = document.getElementById('json-status'); try { const formatted = JSON.stringify(JSON.parse(input.value), null, 2); input.value = formatted; status.textContent = 'JSON valide et formaté !'; status.className = 'text-xs text-center h-4 text-green-400'; } catch (e) { status.textContent = 'Erreur: JSON invalide.'; status.className = 'text-xs text-center h-4 text-red-400'; } });

                const snippetListEl = document.getElementById('snippet-list');
                const titleInput = document.getElementById('snippet-title');
                const langInput = document.getElementById('snippet-lang');
                const codeInput = document.getElementById('snippet-code');
                const highlightEl = document.getElementById('snippet-highlight');
                let snippets = [];
                let activeSnippetIndex = -1;

                const syncHighlight = () => {
                    if (highlightEl && codeInput) {
                        highlightEl.textContent = codeInput.value + '\n';
                        highlightEl.className = `language-${langInput.value}`;
                        hljs.highlightElement(highlightEl);
                    }
                };
                const renderSnippets = () => {
                    snippetListEl.innerHTML = '';
                    snippets.forEach((snippet, index) => {
                        const div = document.createElement('div');
                        div.className = `snippet-item ${index === activeSnippetIndex ? 'active' : ''}`;
                        div.textContent = snippet.title || 'Snippet sans titre';
                        div.dataset.index = index;
                        div.addEventListener('click', () => selectSnippet(index));
                        snippetListEl.appendChild(div);
                    });
                };
                const selectSnippet = (index) => {
                    activeSnippetIndex = index;
                    if (index > -1 && snippets[index]) {
                        const snippet = snippets[index];
                        titleInput.value = snippet.title;
                        langInput.value = snippet.lang;
                        codeInput.value = snippet.code;
                    } else {
                        titleInput.value = '';
                        langInput.value = 'plaintext';
                        codeInput.value = '';
                    }
                    syncHighlight();
                    renderSnippets();
                };
                const saveSnippets = () => {
                    window.electronAPI.saveItems({ filePath: 'src/data/snippets.json', data: snippets });
                    showCustomNotification("Snippets sauvegardés !");
                };
                const loadSnippets = async () => {
                    snippets = await window.electronAPI.readFile('src/data/snippets.json') || [];
                    renderSnippets();
                    selectSnippet(snippets.length > 0 ? 0 : -1);
                };
                document.getElementById('add-snippet-btn').addEventListener('click', () => {
                    snippets.push({ title: 'Nouveau Snippet', lang: 'plaintext', code: '' });
                    selectSnippet(snippets.length - 1);
                });
                document.getElementById('save-snippet-btn').addEventListener('click', () => {
                    if (activeSnippetIndex > -1) {
                        snippets[activeSnippetIndex] = {
                            title: titleInput.value,
                            lang: langInput.value,
                            code: codeInput.value,
                        };
                        saveSnippets();
                        renderSnippets();
                    }
                });
                document.getElementById('delete-snippet-btn').addEventListener('click', async () => {
                    if (activeSnippetIndex > -1) {
                        const confirmed = await showConfirmationModal(`Supprimer le snippet "${snippets[activeSnippetIndex].title}" ?`);
                        if (confirmed) {
                            snippets.splice(activeSnippetIndex, 1);
                            saveSnippets();
                            selectSnippet(activeSnippetIndex > 0 ? activeSnippetIndex - 1 : (snippets.length > 0 ? 0 : -1));
                        }
                    }
                });
                codeInput.addEventListener('input', syncHighlight);
                langInput.addEventListener('change', syncHighlight);
                codeInput.addEventListener('scroll', () => {
                    highlightEl.scrollTop = codeInput.scrollTop;
                    highlightEl.scrollLeft = codeInput.scrollLeft;
                });
                loadSnippets();

                document.getElementById('doc-search-form').addEventListener('submit', (e) => { e.preventDefault(); const query = document.getElementById('doc-search-input').value; const engine = document.getElementById('doc-search-engine').value; if (!query) return; let url; switch (engine) { case 'mdn': url = `https://developer.mozilla.org/search?q=${encodeURIComponent(query)}`; break; case 'stackoverflow': url = `https://stackoverflow.com/search?q=${encodeURIComponent(query)}`; break; case 'devdocs': url = `https://devdocs.io/#q=${encodeURIComponent(query)}`; break; case 'google': url = `https://www.google.com/search?q=${encodeURIComponent(query)}`; break; } if (url) window.electronAPI.openExternalLink(url); });

                // NOUVEAU : Logique pour le bloc-notes (Scratchpad)
                const scratchpadInput = document.getElementById('scratchpad-input');
                let scratchpadTimeout;
                const loadScratchpad = async () => {
                    const content = await window.electronAPI.readFile('src/data/scratchpad.txt');
                    scratchpadInput.value = content || '';
                };
                const saveScratchpad = () => {
                    window.electronAPI.saveItems({ filePath: 'src/data/scratchpad.txt', data: scratchpadInput.value });
                    showCustomNotification('Note rapide sauvegardée.');
                };
                scratchpadInput.addEventListener('keyup', () => {
                    clearTimeout(scratchpadTimeout);
                    scratchpadTimeout = setTimeout(saveScratchpad, 1500);
                });
                loadScratchpad();


                state.devToolsInitialized = true;
                console.log('[Init] Dev tools initialized successfully.');
            } catch (error) {
                console.error("Error initializing dev tools:", error);
            }
        }

        document.getElementById('min-btn').addEventListener('click', () => window.electronAPI.minimizeWindow());
        document.getElementById('max-btn').addEventListener('click', () => window.electronAPI.maximizeWindow());
        document.getElementById('close-btn').addEventListener('click', () => window.electronAPI.closeWindow());

        document.querySelectorAll('.welcome-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                createRipple(event);
                setTimeout(() => {
                    if (button.id === 'dev-btn') {
                        showView(dom.mainContent);
                        loadItems('src/data/projects-dev.json', 'Mes Projets de Développement');
                    } else if (button.id === 'devtools-btn') {
                        showView(dom.devtoolsView);
                        if (!state.devToolsInitialized) {
                            initDevTools();
                        }
                    } else if (button.id === 'gaming-btn') {
                         showView(dom.mainContent);
                         loadItems('src/data/projects-gaming.json', 'Ma Ludothèque');
                    }
                }, 250);
            });
        });

        document.getElementById('back-btn').addEventListener('click', () => showView(dom.welcomeScreen));
        document.getElementById('devtools-back-btn').addEventListener('click', () => showView(dom.welcomeScreen));
        
        dom.settingsBtn.addEventListener('click', () => showView(dom.settingsView));
        dom.settingsBackBtn.addEventListener('click', () => showView(dom.welcomeScreen));
        
        dom.editModeBtn.addEventListener('click', toggleEditMode);
        document.getElementById('cancel-edit-btn').addEventListener('click', closeEditModal);
        document.getElementById('icon-picker-trigger').addEventListener('click', openIconPicker);
        document.getElementById('cancel-icon-picker-btn').addEventListener('click', closeIconPicker);

        document.getElementById('add-manual-command-btn').addEventListener('click', () => addCommandInput(''));
        document.getElementById('add-file-command-btn').addEventListener('click', async () => {
            const path = await window.electronAPI.openDialog({ title: 'Choisir un fichier à lancer', properties: ['openFile'] });
            if (path) addCommandInput(`start "" "${path}"`);
        });
        document.getElementById('add-folder-command-btn').addEventListener('click', async () => {
            const path = await window.electronAPI.openDialog({ title: 'Choisir un dossier à ouvrir', properties: ['openDirectory'] });
            if (path) addCommandInput(`code "${path}"`);
        });
        document.getElementById('add-link-btn').addEventListener('click', () => addLinkInput());

        dom.editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const index = document.getElementById('edit-index').value;
            const commands = Array.from(document.getElementById('commands-list').querySelectorAll('.command-item-input')).map(input => input.value).filter(cmd => cmd.trim() !== '');
            const links = Array.from(document.getElementById('links-list').querySelectorAll('.link-item')).map(item => ({
                name: item.querySelector('.link-name-input').value,
                url: item.querySelector('.link-url-input').value,
            })).filter(link => link.name && link.url);

            const newItem = {
                name: document.getElementById('item-name').value,
                description: document.getElementById('item-description').value,
                path: document.getElementById('item-path').value.trim(),
                icon: document.getElementById('item-icon').value,
                commands: commands,
                links: links,
            };
            if (index) {
                state.currentItems[index] = newItem;
            } else {
                state.currentItems.push(newItem);
            }
            window.electronAPI.saveItems({ filePath: state.currentFilePath, data: state.currentItems });
            showCustomNotification('Projet sauvegardé !');
            renderItems();
            closeEditModal();
        });
        
        dom.itemsContainer.addEventListener('click', async (e) => {
            const button = e.target.closest('button');
            if (!button) return;
            
            const card = button.closest('.item-card');
            if (!card) return;

            const index = parseInt(card.dataset.index, 10);
            const item = state.currentItems[index];

            if (button.classList.contains('launch-btn') && !state.isEditMode) {
                if (item && item.commands) {
                    window.electronAPI.launchProject({ commands: item.commands, name: item.name });
                    showCustomNotification(`Lancement de ${item.name}...`);
                }
            } else if (button.classList.contains('action-btn')) {
                const action = button.dataset.action;
                if (item && item.path) {
                    window.electronAPI.projectAction({ action, path: item.path });
                }
            } else if (button.classList.contains('edit')) {
                openEditModal(index);
            } else if (button.classList.contains('delete')) {
                const confirmed = await showConfirmationModal(`Êtes-vous sûr de vouloir supprimer "${item.name}" ?`);
                if (confirmed) {
                    state.currentItems.splice(index, 1);
                    window.electronAPI.saveItems({ filePath: state.currentFilePath, data: state.currentItems });
                    showCustomNotification('Projet supprimé.', 'error');
                    renderItems();
                }
            }
        });

        dom.projectSearchInput.addEventListener('input', renderItems);

        loadAndApplySettings();

    } catch (error) {
        console.error("Critical error during initialization:", error);
        document.body.innerHTML = `<div class="w-screen h-screen flex justify-center items-center bg-red-900 text-white p-8"><div><h1 class="text-2xl font-bold">Erreur Critique</h1><p>L'application n'a pas pu démarrer. Vérifiez la console (Ctrl+Shift+I).</p><pre class="mt-4 bg-red-800 p-4 rounded text-sm">${error.stack}</pre></div></div>`;
    }
});
