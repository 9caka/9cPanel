const hexToRgb = (hex) => { let r = 0, g = 0, b = 0; if (hex.length === 4) { r = "0x" + hex[1] + hex[1]; g = "0x" + hex[2] + hex[2]; b = "0x" + hex[3] + hex[3]; } else if (hex.length === 7) { r = "0x" + hex[1] + hex[2]; g = "0x" + hex[3] + hex[4]; b = "0x" + hex[5] + hex[6]; } return { r: +r, g: +g, b: +b }; };
const rgbToHex = (r, g, b) => "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
const rgbToHsl = (r, g, b) => { r /= 255; g /= 255; b /= 255; let max = Math.max(r, g, b), min = Math.min(r, g, b); let h, s, l = (max + min) / 2; if (max === min) { h = s = 0; } else { let d = max - min; s = l > 0.5 ? d / (2 - max - min) : d / (max + min); switch (max) { case r: h = (g - b) / d + (g < b ? 6 : 0); break; case g: h = (b - r) / d + 2; break; case b: h = (r - g) / d + 4; break; } h /= 6; } return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }; };
const hslToRgb = (h, s, l) => { s /= 100; l /= 100; let c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2, r = 0, g = 0, b = 0; if (0 <= h && h < 60) { r = c; g = x; b = 0; } else if (60 <= h && h < 120) { r = x; g = c; b = 0; } else if (120 <= h && h < 180) { r = 0; g = c; b = x; } else if (180 <= h && h < 240) { r = 0; g = x; b = c; } else if (240 <= h && h < 300) { r = x; g = 0; b = c; } else if (300 <= h && h < 360) { r = c; g = 0; b = x; } r = Math.round((r + m) * 255); g = Math.round((g + m) * 255); b = Math.round((b + m) * 255); return { r, g, b }; };


document.addEventListener('DOMContentLoaded', () => {
    try {
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
            refreshSteamBtn: document.getElementById('refresh-steam-btn'),
            editModal: document.getElementById('edit-modal'),
            editForm: document.getElementById('edit-form'),
            iconPickerModal: document.getElementById('icon-picker-modal'),
            gameDetailsModal: document.getElementById('game-details-modal'),
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
            currentGames: [],
            currentFilePath: '',
            settings: { theme: 'dark', accentColor: '#2563eb' },
            devToolsInitialized: false,
            settingsInitialized: false,
        };

       function showCustomNotification(message, type = 'success') {
            const toast = document.createElement('div');
            toast.className = `notification-toast ${type}`;
            const iconClass = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
            toast.innerHTML = `<i class="fas ${iconClass}"></i><span>${message}</span>`;
            dom.notificationContainer.appendChild(toast);
            setTimeout(() => { toast.remove(); }, 3000);
        }

        function showConfirmationModal(message) {
            return new Promise(resolve => {
                dom.confirmMessage.textContent = message;
                dom.confirmModal.classList.remove('is-inactive');
                const handleOk = () => { cleanup(); resolve(true); };
                const handleCancel = () => { cleanup(); resolve(false); };
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

            const themeVars = ['--color-bg-primary', '--color-bg-secondary', '--color-bg-tertiary', '--color-text-main', '--color-text-secondary', '--color-border-primary'];
            themeVars.forEach(v => document.documentElement.style.removeProperty(v));

            if (state.settings.customTheme) {
                for (const [key, value] of Object.entries(state.settings.customTheme)) {
                    document.documentElement.style.setProperty(key, value);
                }
            }
            
            document.documentElement.style.setProperty('--accent-color', state.settings.accentColor);
            const accentRGB = hexToRgb(state.settings.accentColor);
            document.documentElement.style.setProperty('--accent-color-translucent', `rgba(${accentRGB.r}, ${accentRGB.g}, ${accentRGB.b}, 0.1)`);

            const hljsTheme = document.getElementById('hljs-theme');
            hljsTheme.href = state.settings.theme === 'light' 
                ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-light.min.css'
                : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css';

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
            
                const themeEditorContainer = document.getElementById('theme-editor-container');
                const resetThemeBtn = document.getElementById('reset-theme-btn');
                const themeColors = [
                    { var: '--color-bg-primary', label: 'Fond Principal' },
                    { var: '--color-bg-secondary', label: 'Fond Secondaire' },
                    { var: '--color-bg-tertiary', label: 'Fond Tertiaire' },
                    { var: '--color-text-main', label: 'Texte Principal' },
                    { var: '--color-text-secondary', label: 'Texte Secondaire' },
                    { var: '--color-border-primary', label: 'Bordure' },
                ];

            const githubTokenInput = document.getElementById('github-token-input');
            const steamApiKeyInput = document.getElementById('steam-api-key-input');
            const steamIdInput = document.getElementById('steam-id-input');
            const launchOnStartupToggle = document.getElementById('launch-on-startup-toggle');
            const appVersionEl = document.getElementById('app-version');

            if (state.settings.githubToken) githubTokenInput.value = state.settings.githubToken;
            if (state.settings.steamApiKey) steamApiKeyInput.value = state.settings.steamApiKey;
            if (state.settings.steamId) steamIdInput.value = state.settings.steamId;
            if (!state.settings.customTheme) { state.settings.customTheme = {};}

            githubTokenInput.addEventListener('change', () => {
                state.settings.githubToken = githubTokenInput.value;
                saveSettings();
                showCustomNotification('Jeton GitHub sauvegardé.');
            });
            steamApiKeyInput.addEventListener('change', () => {
                state.settings.steamApiKey = steamApiKeyInput.value;
                saveSettings();
                showCustomNotification('Clé d\'API Steam sauvegardée.');
            });
            steamIdInput.addEventListener('change', () => {
                state.settings.steamId = steamIdInput.value;
                saveSettings();
                showCustomNotification('SteamID sauvegardé.');
            });

                window.electronAPI.getAppVersion().then(version => {
                    if (appVersionEl) {
                        appVersionEl.textContent = `v${version}`;
                    }
                });

                window.electronAPI.getLaunchOnStartup().then(isEnabled => {
                    launchOnStartupToggle.checked = isEnabled;
                });

                launchOnStartupToggle.addEventListener('change', () => {
                    const shouldLaunch = launchOnStartupToggle.checked;
                    window.electronAPI.setLaunchOnStartup(shouldLaunch);
                });

                function buildThemeEditor() {
                    themeEditorContainer.innerHTML = '';
                    themeColors.forEach(({ var: cssVar, label }) => {
                        const row = document.createElement('div');
                        row.className = 'theme-editor-row';

                        const labelEl = document.createElement('span');
                        labelEl.className = 'theme-editor-label';
                        labelEl.textContent = label;

                        const inputEl = document.createElement('input');
                        inputEl.type = 'color';
                        inputEl.className = 'theme-editor-input';

                        const savedColor = state.settings.customTheme?.[cssVar];
                        const currentColor = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
                        inputEl.value = savedColor || currentColor;

                        inputEl.addEventListener('input', () => {
                            const newColor = inputEl.value;
                            if (!state.settings.customTheme) state.settings.customTheme = {};
                            document.documentElement.style.setProperty(cssVar, newColor);
                            state.settings.customTheme[cssVar] = newColor;
                            saveSettings();
                        });

                        row.appendChild(labelEl);
                        row.appendChild(inputEl);
                        themeEditorContainer.appendChild(row);
                    });
                }

                resetThemeBtn.addEventListener('click', () => {
                    state.settings.customTheme = {};
                    saveSettings();
                    applySettings();
                    buildThemeEditor();
                    showCustomNotification('Thème réinitialisé.');
                });

            buildThemeEditor();    
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
                    <div class="github-stats-container"></div>
                    <div class="card-actions-container"></div>
                    <div class="npm-scripts-container"></div>
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
                        const npmScriptsContainer = itemCard.querySelector('.npm-scripts-container');
                        const githubStatsContainer = itemCard.querySelector('.github-stats-container');

                        if (detailsContainer) {
                            let detailsHtml = '';
                            if (details.branch) {
                                const dirtyClass = details.hasChanges ? 'dirty' : '';
                                detailsHtml += `<div class="detail-item git-status ${dirtyClass}"><div class="git-dirty-indicator"></div><i class="fas fa-code-branch"></i><span>${details.branch}</span></div>`;
                            }
                            if (details.dependencies !== null) {
                                detailsHtml += `<div class="detail-item"><i class="fas fa-box-open"></i><span>${details.dependencies} dépendances</span></div>`;
                            }
                            if (detailsHtml) {
                                detailsContainer.innerHTML = `<div class="project-details">${detailsHtml}</div>`;
                            }
                        }
                        if (actionsContainer) {
                            let actionsHtml = `<div class="card-actions"><button class="action-btn" data-action="open-explorer" title="Ouvrir dans l'explorateur"><i class="fas fa-folder-open"></i></button><button class="action-btn" data-action="open-terminal" title="Ouvrir un terminal"><i class="fas fa-terminal"></i></button>`;
                            if(details.branch) {
                                actionsHtml += `<button class="action-btn git-btn" data-action="git-pull" title="Git Pull"><span class="btn-text"><i class="fas fa-arrow-down"></i></span><i class="fas fa-spinner spinner"></i></button><button class="action-btn git-btn" data-action="git-push" title="Git Push"><span class="btn-text"><i class="fas fa-arrow-up"></i></span><i class="fas fa-spinner spinner"></i></button>`;
                            }
                            actionsHtml += `</div>`;
                            actionsContainer.innerHTML = actionsHtml;
                        }
                        if (npmScriptsContainer && details.scripts) {
                            const scriptsHtml = Object.keys(details.scripts).map(script => 
                                `<button class="npm-script-btn" data-script="${script}" title="npm run ${script}">${script}</button>`
                            ).join('');
                            if(scriptsHtml) {
                                npmScriptsContainer.innerHTML = `<div class="npm-scripts-header">Scripts NPM</div><div class="npm-scripts-list">${scriptsHtml}</div>`;
                            }
                        }
                        if (githubStatsContainer && details.github) {
                            let updateHtml = '';
                            if (details.github.update && details.github.update.available) {
                                updateHtml = `<div class="github-stat-item" title="Mise à jour disponible : ${details.github.update.version}"><i class="fas fa-arrow-alt-circle-up update-available"></i></div>`;
                            }
                            let githubHtml = `<div class="github-stat-item" title="Pull Requests Ouvertes"><i class="fas fa-code-pull-request"></i><span class="count">${details.github.prs}</span></div><div class="github-stat-item" title="Issues Ouvertes"><i class="fas fa-exclamation-circle"></i><span class="count">${details.github.issues}</span></div>${updateHtml}`;
                            githubStatsContainer.innerHTML = githubHtml;
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
            document.getElementById('links-list').innerHTML = '';

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
                window.electronAPI.onSystemStats(stats => {
                const formatBytes = (bytes) => {
                    if (bytes === 0) return '0 B/s';
                    const k = 1024;
                    const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
                    const i = Math.floor(Math.log(bytes) / Math.log(k));
                    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
                };
                document.getElementById('cpu-bar').style.width = `${stats.cpu.toFixed(1)}%`;
                document.getElementById('cpu-percent').textContent = `${stats.cpu.toFixed(1)}%`;
                document.getElementById('mem-bar').style.width = `${stats.mem.toFixed(1)}%`;
                document.getElementById('mem-percent').textContent = `${stats.mem.toFixed(1)}%`;
                document.getElementById('disk-bar').style.width = `${stats.disk.toFixed(1)}%`;
                document.getElementById('disk-percent').textContent = `${stats.disk.toFixed(1)}%`;
                document.getElementById('net-download').textContent = formatBytes(stats.net.download);
                document.getElementById('net-upload').textContent = formatBytes(stats.net.upload);
            });
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

                const tabs = document.querySelectorAll('.tool-tab');
                const contents = document.querySelectorAll('.tool-content');
                tabs.forEach(tab => {
                    tab.addEventListener('click', () => {
                        tabs.forEach(t => t.classList.remove('active'));
                        contents.forEach(c => c.classList.add('is-inactive'));
                        tab.classList.add('active');
                        const targetContent = document.getElementById(tab.dataset.tab);
                        targetContent.classList.remove('is-inactive');
                        if (tab.dataset.tab === 'docker-manager') {
                            initDockerManager();
                        }
                        tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                    });
                });

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
                initDockerManager();
                initDatabaseWidget();
                initRssWidget();
                initEnvEditor();

                state.devToolsInitialized = true;
                console.log('[Init] Dev tools initialized successfully.');
            } catch (error) {
                console.error("Error initializing dev tools:", error);
            }
        }

        function initDockerManager() {
            const dockerContainerList = document.getElementById('docker-container-list');
            const refreshDockerBtn = document.getElementById('refresh-docker-btn');
            let dockerInitialized = false;

            if (dockerInitialized) return;

            const renderDockerContainers = (containers) => {
                dockerContainerList.innerHTML = '';
                if (!containers || containers.length === 0) {
                    dockerContainerList.innerHTML = `<p class="text-tertiary text-center p-4">Aucun conteneur Docker trouvé.</p>`;
                    return;
                }

                containers.forEach(container => {
                    const isRunning = container.State === 'running';
                    const statusClass = isRunning ? 'running' : 'stopped';
                    const item = document.createElement('div');
                    item.className = 'docker-item';
                    item.innerHTML = `
                        <div class="docker-status ${statusClass}" title="${container.Status}"></div>
                        <div class="docker-name" title="${container.Names} (${container.Image})">${container.Names}</div>
                        <div class="docker-actions">
                            <button data-action="start" data-id="${container.ID}" class="${isRunning ? 'hidden' : ''}" title="Démarrer"><i class="fas fa-play"></i></button>
                            <button data-action="stop" data-id="${container.ID}" class="${!isRunning ? 'hidden' : ''}" title="Arrêter"><i class="fas fa-stop"></i></button>
                            <button data-action="remove" data-id="${container.ID}" class="${isRunning ? 'hidden' : ''}" title="Supprimer"><i class="fas fa-trash"></i></button>
                        </div>
                    `;
                    dockerContainerList.appendChild(item);
                });
            };

            const loadDockerContainers = async () => {
                dockerContainerList.innerHTML = `<p class="text-tertiary text-center p-4">Chargement des conteneurs...</p>`;
                try {
                    const result = await window.electronAPI.dockerCommand({ action: 'list' });
                    if (result.success) {
                        renderDockerContainers(result.data);
                    } else {
                        throw new Error(result.error);
                    }
                } catch (error) {
                    dockerContainerList.innerHTML = `<div class="text-red-400 text-center p-4">Erreur: ${error.message}. Docker est-il installé et en cours d'exécution ?</div>`;
                    console.error("Docker Error:", error);
                }
            };

            dockerContainerList.addEventListener('click', async (e) => {
                const button = e.target.closest('button');
                if (!button) return;

                const { action, id } = button.dataset;
                if (!action || !id) return;

                button.disabled = true;
                let confirmed = true;

                if (action === 'remove') {
                    confirmed = await showConfirmationModal(`Supprimer le conteneur ${id.substring(0, 12)} ? Cette action est irréversible.`);
                }

                if (confirmed) {
                    try {
                        const result = await window.electronAPI.dockerCommand({ action, id });
                        if (result.success) {
                            showCustomNotification(`Action '${action}' réussie pour le conteneur.`);
                        } else {
                            throw new Error(result.error);
                        }
                    } catch (error) {
                        showCustomNotification(`Erreur lors de l'action '${action}': ${error.message}`, 'error');
                    } finally {
                        await loadDockerContainers();
                    }
                } else {
                    button.disabled = false;
                }
            });

            refreshDockerBtn.addEventListener('click', loadDockerContainers);

            if (!dockerInitialized) {
                loadDockerContainers();
                dockerInitialized = true;
            }
        }

        function initDatabaseWidget() {
            const dbSelectFileBtn = document.getElementById('db-select-file-btn');
            const dbInfo = document.getElementById('db-info');
            const dbMainArea = document.getElementById('db-main-area');
            const dbTablesList = document.getElementById('db-tables-list');
            const dbQueryInput = document.getElementById('db-query-input');
            const dbRunQueryBtn = document.getElementById('db-run-query-btn');
            const dbResultsArea = document.getElementById('db-results-area');

            let currentDbPath = null;

            const resetView = () => {
                dbInfo.textContent = 'Aucune base de données connectée';
                dbMainArea.classList.add('is-inactive');
                dbTablesList.innerHTML = '';
                dbResultsArea.innerHTML = '';
                dbQueryInput.value = '';
                if (currentDbPath) {
                    window.electronAPI.dbClose(currentDbPath);
                    currentDbPath = null;
                }
            };

            const renderResults = (data) => {
                dbResultsArea.innerHTML = '';
                if (!data || data.length === 0) {
                    dbResultsArea.innerHTML = '<p class="p-4 text-tertiary text-center">La requête n\'a retourné aucun résultat.</p>';
                    return;
                }

                const table = document.createElement('table');
                const thead = document.createElement('thead');
                const tbody = document.createElement('tbody');
                const headerRow = document.createElement('tr');

                Object.keys(data[0]).forEach(key => {
                    const th = document.createElement('th');
                    th.textContent = key;
                    headerRow.appendChild(th);
                });
                thead.appendChild(headerRow);

                data.forEach(rowData => {
                    const row = document.createElement('tr');
                    Object.values(rowData).forEach(value => {
                        const td = document.createElement('td');
                        td.textContent = value;
                        row.appendChild(td);
                    });
                    tbody.appendChild(row);
                });

                table.appendChild(thead);
                table.appendChild(tbody);
                dbResultsArea.appendChild(table);
            };

            dbSelectFileBtn.addEventListener('click', async () => {
                resetView();
                const filePath = await window.electronAPI.openDialog({
                    title: 'Ouvrir une base de données SQLite',
                    properties: ['openFile'],
                    filters: [{ name: 'Databases', extensions: ['db', 'sqlite', 'sqlite3'] }]
                });

                if (filePath) {
                    try {
                        const result = await window.electronAPI.dbConnect(filePath);
                        if (result.success) {
                            currentDbPath = filePath;
                            dbInfo.textContent = `Connecté à : ${filePath.split(/[\\/]/).pop()}`;
                            dbMainArea.classList.remove('is-inactive');

                            dbTablesList.innerHTML = '';
                            result.tables.forEach(tableName => {
                                const tableItem = document.createElement('div');
                                tableItem.className = 'db-table-item';
                                tableItem.textContent = tableName;
                                tableItem.addEventListener('click', () => {
                                    dbQueryInput.value = `SELECT * FROM ${tableName} LIMIT 100;`;
                                    dbRunQueryBtn.click();
                                });
                                dbTablesList.appendChild(tableItem);
                            });
                        } else {
                            throw new Error(result.error);
                        }
                    } catch (err) {
                        showCustomNotification(`Erreur de connexion: ${err.message}`, 'error');
                        resetView();
                    }
                }
            });

            dbRunQueryBtn.addEventListener('click', async () => {
                const query = dbQueryInput.value.trim();
                if (!query || !currentDbPath) return;

                try {
                    const result = await window.electronAPI.dbQuery({ filePath: currentDbPath, query });
                    if (result.success) {
                        renderResults(result.data);
                    } else {
                        throw new Error(result.error);
                    }
                } catch (err) {
                    showCustomNotification(`Erreur de requête: ${err.message}`, 'error');
                    dbResultsArea.innerHTML = `<p class="p-4 text-red-400 text-center">${err.message}</p>`;
                }
            });
        }

        function initRssWidget() {
            const feedsListEl = document.getElementById('rss-feeds-list');
            const newFeedUrlInput = document.getElementById('rss-new-feed-url');
            const addFeedBtn = document.getElementById('rss-add-feed-btn');
            const articlesListEl = document.getElementById('rss-articles-list');
            const currentFeedTitleEl = document.getElementById('rss-current-feed-title');

            const FEEDS_FILE_PATH = 'src/data/rss-feeds.json';
            let feeds = [];
            let activeFeedUrl = null;

            const saveFeeds = () => {
                window.electronAPI.saveItems({ filePath: FEEDS_FILE_PATH, data: feeds });
            };

            const renderFeeds = () => {
                feedsListEl.innerHTML = '';
                feeds.forEach(feed => {
                    const item = document.createElement('div');
                    item.className = 'rss-feed-item';
                    item.dataset.url = feed.url;
                    if (feed.url === activeFeedUrl) {
                        item.classList.add('active');
                    }
                    item.innerHTML = `
                <span class="rss-feed-item-name" title="${feed.url}">${feed.title || feed.url}</span>
                <button class="rss-feed-item-delete" title="Supprimer le flux"><i class="fas fa-trash-alt"></i></button>
            `;
                    feedsListEl.appendChild(item);
                });
            };

            const renderArticles = (items) => {
                articlesListEl.innerHTML = '';
                if (!items || items.length === 0) {
                    articlesListEl.innerHTML = '<p class="text-tertiary text-center pt-10">Aucun article dans ce flux.</p>';
                    return;
                }
                items.forEach(item => {
                    const articleEl = document.createElement('div');
                    articleEl.className = 'rss-article-item';
                    const snippet = item.contentSnippet ? item.contentSnippet.substring(0, 100) + '...' : 'Pas de description.';
                    const pubDate = item.pubDate ? new Date(item.pubDate).toLocaleDateString() : 'Date inconnue';

                    articleEl.innerHTML = `
                <a href="#" data-link="${item.link}" class="rss-article-title">${item.title}</a>
                <p class="rss-article-snippet">${snippet}</p>
                <p class="rss-article-meta">${pubDate}</p>
            `;
                    articlesListEl.appendChild(articleEl);
                });
            };

            const displayFeedContent = async (url) => {
                activeFeedUrl = url;
                const feed = feeds.find(f => f.url === url);
                currentFeedTitleEl.textContent = feed ? feed.title : 'Chargement...';
                articlesListEl.innerHTML = '<p class="text-tertiary text-center pt-10">Chargement des articles...</p>';
                renderFeeds();

                try {
                    const result = await window.electronAPI.fetchRss(url);
                    if (result.success) {
                        if (feed && !feed.title) {
                            feed.title = result.feed.title;
                            saveFeeds();
                            renderFeeds();
                        }
                        currentFeedTitleEl.textContent = result.feed.title;
                        renderArticles(result.feed.items);
                    } else {
                        throw new Error(result.error);
                    }
                } catch (error) {
                    articlesListEl.innerHTML = `<p class="text-red-400 text-center pt-10">Erreur: ${error.message}</p>`;
                }
            };

            const addFeed = async () => {
                const url = newFeedUrlInput.value.trim();
                if (!url || feeds.some(f => f.url === url)) {
                    showCustomNotification('URL invalide ou déjà existante.', 'error');
                    return;
                }

                try {
                    const result = await window.electronAPI.fetchRss(url);
                    if (result.success) {
                        feeds.push({ url: url, title: result.feed.title });
                        newFeedUrlInput.value = '';
                        saveFeeds();
                        renderFeeds();
                        showCustomNotification('Flux ajouté avec succès !');
                    } else {
                        throw new Error(result.error);
                    }
                } catch (error) {
                    showCustomNotification(`Impossible d'ajouter le flux: ${error.message}`, 'error');
                }
            };

            addFeedBtn.addEventListener('click', addFeed);
            newFeedUrlInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') addFeed();
            });

            feedsListEl.addEventListener('click', (e) => {
                const item = e.target.closest('.rss-feed-item');
                if (!item) return;

                if (e.target.closest('.rss-feed-item-delete')) {
                    const urlToDelete = item.dataset.url;
                    feeds = feeds.filter(f => f.url !== urlToDelete);
                    saveFeeds();
                    renderFeeds();
                    if (activeFeedUrl === urlToDelete) {
                        articlesListEl.innerHTML = '<p class="text-tertiary text-center pt-10">Les articles apparaîtront ici.</p>';
                        currentFeedTitleEl.textContent = 'Sélectionnez un flux';
                        activeFeedUrl = null;
                    }
                } else {
                    displayFeedContent(item.dataset.url);
                }
            });

            articlesListEl.addEventListener('click', (e) => {
                const link = e.target.closest('a[data-link]');
                if (link) {
                    e.preventDefault();
                    window.electronAPI.openExternalLink(link.dataset.link);
                }
            });

            const loadFeeds = async () => {
                feeds = await window.electronAPI.readFile(FEEDS_FILE_PATH) || [];
                renderFeeds();
            };

            loadFeeds();
        }

        function initEnvEditor() {
            const projectSelector = document.getElementById('env-project-selector');
            const refreshProjectsBtn = document.getElementById('env-refresh-projects-btn');
            const editorMain = document.getElementById('env-editor-main');
            const variablesList = document.getElementById('env-variables-list');
            const addVarBtn = document.getElementById('env-add-var-btn');
            const saveBtn = document.getElementById('env-save-btn');

            let projects = [];
            let currentProjectPath = null;

            const renderVariables = (data) => {
                variablesList.innerHTML = '';
                for (const key in data) {
                    addVariableRow(key, data[key]);
                }
            };

            const addVariableRow = (key = '', value = '') => {
                const row = document.createElement('div');
                row.className = 'env-variable-row';
                row.innerHTML = `
            <input type="text" class="modal-input env-key-input" placeholder="KEY" value="${key}">
            <input type="text" class="modal-input env-value-input" placeholder="VALUE" value="${value}">
            <button class="command-item-btn delete" title="Supprimer"><i class="fas fa-trash"></i></button>
        `;
                row.querySelector('.delete').addEventListener('click', () => row.remove());
                variablesList.appendChild(row);
            };

            projectSelector.addEventListener('change', async () => {
                currentProjectPath = projectSelector.value;
                if (!currentProjectPath) {
                    editorMain.classList.add('is-inactive');
                    return;
                }

                try {
                    const result = await window.electronAPI.envRead(currentProjectPath);
                    if (result.success) {
                        renderVariables(result.data);
                        editorMain.classList.remove('is-inactive');
                    } else {
                        throw new Error(result.error);
                    }
                } catch (error) {
                    showCustomNotification(`Erreur de lecture du fichier .env: ${error.message}`, 'error');
                    editorMain.classList.add('is-inactive');
                }
            });

            addVarBtn.addEventListener('click', () => addVariableRow());

            saveBtn.addEventListener('click', async () => {
                if (!currentProjectPath) return;

                const data = {};
                const rows = variablesList.querySelectorAll('.env-variable-row');
                rows.forEach(row => {
                    const key = row.querySelector('.env-key-input').value.trim();
                    const value = row.querySelector('.env-value-input').value.trim();
                    if (key) {
                        data[key] = value;
                    }
                });

                try {
                    const result = await window.electronAPI.envSave({ projectPath: currentProjectPath, data });
                    if (result.success) {
                        showCustomNotification('Fichier .env sauvegardé avec succès !');
                    } else {
                        throw new Error(result.error);
                    }
                } catch (error) {
                    showCustomNotification(`Erreur de sauvegarde: ${error.message}`, 'error');
                }
            });

            const loadProjects = async () => {
                try {
                    const result = await window.electronAPI.envGetProjects();
                    if (result.success) {
                        projects = result.projects;
                        projectSelector.innerHTML = '';

                        if (projects.length > 0) {
                            projectSelector.disabled = false;
                            const placeholder = document.createElement('option');
                            placeholder.value = "";
                            placeholder.textContent = "Sélectionnez un projet...";
                            projectSelector.appendChild(placeholder);

                            projects.forEach(p => {
                                const option = document.createElement('option');
                                option.value = p.path;
                                option.textContent = p.name;
                                projectSelector.appendChild(option);
                            });
                        } else {
                            projectSelector.disabled = true;
                            const option = document.createElement('option');
                            option.value = "";
                            option.textContent = "Aucun projet avec un .env trouvé";
                            projectSelector.appendChild(option);
                        }
                    } else {
                        throw new Error(result.error);
                    }
                } catch (error) {
                    console.error("Erreur de chargement des projets pour l'éditeur .env", error);
                    projectSelector.disabled = true;
                    projectSelector.innerHTML = '<option value="">Erreur de chargement</option>';
                }
            };

            refreshProjectsBtn.addEventListener('click', () => {
                loadProjects();
                showCustomNotification("Liste des projets rafraîchie.");
            });

            loadProjects();
        }

    async function loadSteamGames() {
            dom.mainTitle.textContent = 'Ma Bibliothèque Steam';
            dom.editModeBtn.style.display = 'none';
            dom.refreshSteamBtn.style.display = 'block';
            dom.itemsContainer.innerHTML = `<p class="text-center col-span-full text-tertiary">Chargement de vos jeux Steam...</p>`;

            try {
                const [ownedGamesResult, installedAppsResult] = await Promise.all([
                    window.electronAPI.steamGetOwnedGames(),
                    window.electronAPI.steamGetInstalledApps()
                ]);

                if (!ownedGamesResult.success) throw new Error(ownedGamesResult.error);
                
                const installedAppIds = installedAppsResult.success ? installedAppsResult.appids : [];
                
                state.currentGames = ownedGamesResult.games.map(game => ({
                    ...game,
                    is_installed: installedAppIds.includes(String(game.appid))
                }));

                renderSteamGames();

            } catch (error) {
                state.currentGames = [];
                dom.itemsContainer.innerHTML = `<p class="text-center col-span-full text-red-400">Erreur: ${error.message}<br>Veuillez configurer votre clé d'API et votre SteamID dans les paramètres, et assurez-vous que votre profil est public.</p>`;
            }
        }

       function renderSteamGames() {
            if (!state.currentGames) return;

            const searchTerm = dom.projectSearchInput.value.toLowerCase();
            const gamesToRender = state.currentGames.filter(game => game && game.name && game.name.toLowerCase().includes(searchTerm));
            
            gamesToRender.sort((a, b) => b.playtime_forever - a.playtime_forever);

            dom.itemsContainer.innerHTML = '';
            if (gamesToRender.length === 0) {
                dom.itemsContainer.innerHTML = `<p class="text-center col-span-full text-tertiary">${searchTerm ? 'Aucun jeu ne correspond à votre recherche.' : 'Aucun jeu trouvé.'}</p>`;
                return;
            }

            gamesToRender.forEach(game => {
                const card = document.createElement('div');
                card.className = `game-card ${game.is_installed ? 'is-installed' : 'not-installed'}`;
                card.dataset.appid = game.appid;
                const playtimeHours = game.playtime_forever ? (game.playtime_forever / 60).toFixed(1) : '0.0';

                card.innerHTML = `
                    <div class="game-card-banner" style="background-image: url('${game.banner_url}')">
                        ${game.is_installed ? '<div class="installed-badge">Installé</div>' : ''}
                    </div>
                    <div class="game-card-content">
                        <h3 class="game-card-title">${game.name}</h3>
                        <p class="game-card-playtime">${playtimeHours} heures de jeu</p>
                        <button class="game-card-launch-btn" data-appid="${game.appid}">Lancer le jeu</button>
                    </div>
                `;
                dom.itemsContainer.appendChild(card);
            });
        }

async function openGameDetailsModal(appid) {
    const modal = document.getElementById('game-details-modal');
    const contentEl = document.getElementById('game-details-content');
    
    modal.classList.remove('is-inactive');
    contentEl.innerHTML = '<p class="text-center text-tertiary p-10">Chargement des détails...</p>';

    try {
        const result = await window.electronAPI.steamGetGameDetails(appid);
        if (result.success) {
            const details = result.details;
            const gameData = state.currentGames.find(g => g.appid == appid);
            const playtimeHours = (gameData?.playtime_forever / 60 || 0).toFixed(1);

            const genres = details.genres ? details.genres.map(g => `<span class="game-details-tag">${g.description}</span>`).join('') : '';
            const categories = details.categories ? details.categories.map(c => `<span class="game-details-tag">${c.description}</span>`).join('') : '';
            const screenshots = details.screenshots ? details.screenshots.slice(0, 4).map(s => `<img src="${s.path_thumbnail}" alt="Screenshot">`).join('') : '';

            contentEl.innerHTML = `
                <div class="game-details-header">
                    <div class="game-details-background" style="background-image: url('${details.background_raw || details.header_image}')"></div>
                    <div class="game-details-header-content">
                        <img src="${details.header_image}" class="game-details-logo">
                        <div class="game-details-title-section">
                            <h1>${details.name}</h1>
                            <p>${details.release_date ? details.release_date.date : ''} - ${details.platforms.windows ? 'PC (Windows)' : ''}</p>
                        </div>
                    </div>
                </div>

                <div class="game-details-body">
                    <div class="game-details-left">
                        <h3 class="game-details-section-title">Vue d'ensemble</h3>
                        <div class="game-details-description">${details.detailed_description}</div>
                        <div class="game-details-screenshots">${screenshots}</div>
                        <h3 id="achievements-title" class="game-details-section-title mt-6">Succès</h3>
                        <div id="game-details-achievements-container" class="game-details-achievements">
                            <p class="text-tertiary">Chargement des succès...</p>
                        </div>
                    </div>
                    <div class="game-details-right">
                        <h3 class="game-details-section-title">Propriétés</h3>
                        <div class="game-details-properties">
                            <div class="prop-item"><span class="prop-key">Développeur</span><span class="prop-value">${details.developers ? details.developers.join(', ') : 'N/A'}</span></div>
                            <div class="prop-item"><span class="prop-key">Éditeur</span><span class="prop-value">${details.publishers ? details.publishers.join(', ') : 'N/A'}</span></div>
                            <div class="prop-item"><span class="prop-key">Temps de jeu</span><span class="prop-value">${playtimeHours} heures</span></div>
                        </div>
                        <h3 class="game-details-section-title mt-6">Genres</h3>
                        <div class="game-details-tags">${genres}</div>
                        <h3 class="game-details-section-title mt-6">Fonctionnalités</h3>
                        <div class="game-details-tags">${categories}</div>
                    </div>
                </div>

                <div class="game-details-footer">
                    <div class="flex items-center gap-3">
                        <button class="game-footer-btn" data-link="https://store.steampowered.com/app/${appid}">Page Steam</button>
                        <button class="game-footer-btn" data-link="https://steamcommunity.com/app/${appid}">Communauté</button>
                        <button id="scroll-to-achievements-btn" class="game-footer-btn">Succès</button>
                    </div>
                    <button class="btn-primary !py-3 !px-6 game-card-launch-btn game-footer-play-btn" data-appid="${appid}"><i class="fas fa-play mr-2"></i> Jouer</button>
                </div>
            `;

            loadAndRenderAchievements(appid);

            contentEl.querySelectorAll('[data-link]').forEach(link => {
                link.addEventListener('click', () => window.electronAPI.openExternalLink(link.dataset.link));
            });
            contentEl.querySelector('.game-card-launch-btn').addEventListener('click', (e) => {
                const appId = e.currentTarget.dataset.appid;
                if (appId) window.electronAPI.steamLaunchGame(appId);
            });
            contentEl.querySelector('#scroll-to-achievements-btn').addEventListener('click', () => {
                document.getElementById('achievements-title').scrollIntoView({ behavior: 'smooth' });
            });

        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        contentEl.innerHTML = `<p class="text-center text-red-400 p-10">Impossible de charger les détails : ${error.message}</p>`;
    }
}

async function loadAndRenderAchievements(appid) {
    const container = document.getElementById('game-details-achievements-container');
    try {
        const result = await window.electronAPI.steamGetPlayerAchievements(appid);
        if (result.success && result.achievements.length > 0) {
            container.innerHTML = '';
            result.achievements.forEach(ach => {
                const item = document.createElement('div');
                item.className = `achievement-item ${ach.unlocked ? 'unlocked' : 'locked'}`;
                item.innerHTML = `
                    <img src="${ach.icon}" class="achievement-icon" alt="${ach.name}">
                    <div class="achievement-details">
                        <h4>${ach.name}</h4>
                        <p>${ach.description || 'Succès secret'}</p>
                    </div>
                `;
                container.appendChild(item);
            });
        } else {
            container.innerHTML = `<p class="text-tertiary">${result.error || 'Ce jeu n\'a pas de succès.'}</p>`;
        }
    } catch (error) {
        container.innerHTML = `<p class="text-red-400">Erreur de chargement des succès.</p>`;
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
                        dom.editModeBtn.style.display = 'block';
                        dom.refreshSteamBtn.style.display = 'none';
                    } else if (button.id === 'devtools-btn') {
                        showView(dom.devtoolsView);
                        if (!state.devToolsInitialized) {
                            initDevTools();
                        }
                    } else if (button.id === 'gaming-btn') {
                        showView(dom.mainContent);
                        loadSteamGames();
                    }
                }, 250);
            });
        });

        document.getElementById('back-btn').addEventListener('click', () => showView(dom.welcomeScreen));
        document.getElementById('devtools-back-btn').addEventListener('click', () => showView(dom.welcomeScreen));
        dom.settingsBtn.addEventListener('click', () => showView(dom.settingsView));
        dom.settingsBackBtn.addEventListener('click', () => showView(dom.welcomeScreen));
        dom.editModeBtn.addEventListener('click', toggleEditMode);
        dom.refreshSteamBtn.addEventListener('click', loadSteamGames);
        document.getElementById('close-game-details-btn').addEventListener('click', () => {
            dom.gameDetailsModal.classList.add('is-inactive');
        });

        dom.projectSearchInput.addEventListener('input', () => {
            if (dom.mainTitle.textContent === 'Ma Bibliothèque Steam') {
                renderSteamGames();
            } else {
                renderItems();
            }
        });
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
            const isGamingView = dom.mainTitle.textContent === 'Ma Bibliothèque Steam';

            if (isGamingView) {
                const launchButton = e.target.closest('.game-card-launch-btn');
                if (launchButton) {
                    const appId = launchButton.dataset.appid;
                    if (appId) window.electronAPI.steamLaunchGame(appId);
                    return;
                }
                const gameCard = e.target.closest('.game-card');
                if (gameCard) {
                    const appid = gameCard.dataset.appid;
                    if (appid) openGameDetailsModal(appid);
                    return;
                }
            } else {
                const button = e.target.closest('button');
                if (!button) return;
                const card = button.closest('.item-card');
                if (!card) return;
                const index = parseInt(card.dataset.index, 10);
                const item = state.currentItems[index];

                if (button.classList.contains('npm-script-btn')) {
                    const script = button.dataset.script;
                    if (item && item.path && script) {
                        window.electronAPI.runNpmScript({ projectPath: item.path, script: script });
                    }
                } else if (button.classList.contains('launch-btn') && !state.isEditMode) {
                    if (item && item.commands) {
                        window.electronAPI.launchProject({ commands: item.commands, name: item.name });
                        showCustomNotification(`Lancement de ${item.name}...`);
                    }
                } else if (button.classList.contains('action-btn')) {
                    const action = button.dataset.action;
                    if (item && item.path) {
                        if (action.startsWith('git-')) {
                            button.classList.add('loading');
                            const command = action.replace('git-', '');
                            const result = await window.electronAPI.gitCommand({ command, path: item.path });
                            button.classList.remove('loading');
                            if (result.success) {
                                showCustomNotification(`Git ${command} réussi !`);
                                renderItems();
                            } else {
                                showCustomNotification(`Erreur Git: ${result.message}`, 'error');
                            }
                        } else {
                            window.electronAPI.projectAction({ action, path: item.path });
                        }
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
            }
        });
        
        loadAndApplySettings();

        const updateModal = document.getElementById('update-modal');
        const updateVersionEl = document.getElementById('update-version');
        const updateNotesEl = document.getElementById('update-notes');
        const updateProgressContainer = document.getElementById('update-progress-container');
        const updateProgressBar = document.getElementById('update-progress-bar');
        const updateProgressText = document.getElementById('update-progress-text');
        const updateLaterBtn = document.getElementById('update-later-btn');
        const updateNowBtn = document.getElementById('update-now-btn');

        window.electronAPI.onUpdateInfo((info) => {
            updateVersionEl.textContent = `v${info.version}`;
            updateNotesEl.innerHTML = info.releaseNotes.replace(/\n/g, '<br>');
            updateModal.classList.remove('is-inactive');
        });

        updateLaterBtn.addEventListener('click', () => {
            updateModal.classList.add('is-inactive');
        });

        updateNowBtn.addEventListener('click', () => {
            updateNowBtn.disabled = true;
            updateLaterBtn.disabled = true;
            updateNowBtn.textContent = 'Téléchargement...';
            updateProgressContainer.classList.remove('hidden');
            window.electronAPI.downloadUpdate();
        });

        window.electronAPI.onUpdateDownloadProgress((percent) => {
            console.log(`Progression reçue : ${percent}%`);
            updateProgressBar.style.width = `${percent.toFixed(1)}%`;
            updateProgressText.textContent = `Téléchargement... ${percent.toFixed(1)}%`;
        });

        window.electronAPI.onUpdateDownloaded(() => {
            updateProgressContainer.classList.add('hidden');
            updateNowBtn.textContent = 'Redémarrer et Installer';
            updateNowBtn.disabled = false;
            updateLaterBtn.disabled = false;
            updateNowBtn.onclick = () => {
                window.electronAPI.restartApp();
            };
            updateLaterBtn.textContent = 'Plus tard';
        });

    } catch (error) {
        console.error("Critical error during initialization:", error);
        document.body.innerHTML = `<div class="w-screen h-screen flex justify-center items-center bg-red-900 text-white p-8"><div><h1 class="text-2xl font-bold">Erreur Critique</h1><p>L'application n'a pas pu démarrer. Vérifiez la console (Ctrl+Shift+I).</p><pre class="mt-4 bg-red-800 p-4 rounded text-sm">${error.stack}</pre></div></div>`;
    }
});
