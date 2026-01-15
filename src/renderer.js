const toolbar = document.getElementById('main-toolbar');
// ツールバーがバックドロップ(z-index: 499)より上に来るように設定
if (toolbar) toolbar.style.zIndex = '1000';

const toolbarToggle = document.getElementById('toolbar-toggle');
const toolbarBackdrop = document.getElementById('toolbar-backdrop');
const winCloseBtn = document.getElementById('win-close');
const winMinBtn = document.getElementById('win-min');

if (winCloseBtn) {
    winCloseBtn.onclick = () => {
        window.electronAPI.send('window-close');
    };
}

if (winMinBtn) {
    winMinBtn.onclick = () => {
        window.electronAPI.send('window-minimize');
    };
}

function toggleToolbar(forceClose = false) {
    if (forceClose) {
        toolbar.classList.remove('open');
        // Icon animation is handled by CSS
        toolbarBackdrop.classList.add('hidden');
    } else {
        toolbar.classList.toggle('open');
        const isOpen = toolbar.classList.contains('open');
        // Icon animation is handled by CSS
        if (isOpen) {
            toolbarBackdrop.classList.remove('hidden');
        } else {
            toolbarBackdrop.classList.add('hidden');
        }
    }
}

toolbarToggle.onclick = () => toggleToolbar();
toolbarBackdrop.onclick = () => toggleToolbar(true);

const appGrid = document.getElementById('app-grid');
const overlay = document.getElementById('folder-overlay');
// FIX: Correctly map IDs to variables
const folderGrid = document.getElementById('folder-grid');
const folderTitle = document.getElementById('folder-title');
const closeBtn = document.getElementById('close-overlay');
// Select specific backdrops
const folderBackdrop = document.querySelector('#folder-overlay .overlay-backdrop');
const settingsBackdrop = document.querySelector('#settings-overlay .overlay-backdrop');

const editBtn = document.getElementById('edit-btn');
const addBtn = document.getElementById('add-btn');
const addFolderBtn = document.getElementById('add-folder-btn');
const settingsBtn = document.getElementById('settings-btn');
const settingsOverlay = document.getElementById('settings-overlay');
const closeSettingsBtn = document.getElementById('close-settings');
const saveSettingsBtn = document.getElementById('save-settings');
const iconSizeRange = document.getElementById('icon-size-range');
const iconSizeValue = document.getElementById('icon-size-value');
const winWidthInput = document.getElementById('win-width');
const winHeightInput = document.getElementById('win-height');
const bgUrlInput = document.getElementById('bg-url');
const bgBrowseBtn = document.getElementById('bg-browse-btn'); // Add this
const bgPositionInput = document.getElementById('bg-position'); // Add this
const appGapRange = document.getElementById('app-gap-range');
const appGapValue = document.getElementById('app-gap-value');
const folderGapRange = document.getElementById('folder-gap-range');
const folderGapValue = document.getElementById('folder-gap-value');
const resetSettingsBtn = document.getElementById('reset-settings');

// Target Selection Overlay
const targetSelectionOverlay = document.getElementById('target-selection-overlay');
const targetList = document.getElementById('target-list');
const closeSelectionBtn = document.getElementById('close-selection-btn');
const targetBackdrop = document.querySelector('#target-selection-overlay .overlay-backdrop');

// Context Menu Elements
const ctxMenu = document.getElementById('ui-context-menu');
const ctxChangeIcon = document.getElementById('ctx-change-icon');
const ctxRename = document.getElementById('ctx-rename'); // New element
let currentCtxCallbacks = {}; // Replace single action with object
let currentScale = 1; 
let activeCtxMenuTimer = null; // タイマーID管理用変数を追加
let ctxMenuBackdrop = null; // コンテキストメニュー用の透明バックドロップ

// バックドロップの初期化（メニュー表示時に確実に存在するようにする）
function ensureCtxBackdrop() {
    if (!ctxMenuBackdrop) {
        ctxMenuBackdrop = document.createElement('div');
        ctxMenuBackdrop.id = 'ctx-menu-backdrop';
        // 画面全体を覆う透明なレイヤーを作成
        Object.assign(ctxMenuBackdrop.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            zIndex: '99990', // メニュー(99999)より下、他の要素より上
            webkitAppRegion: 'no-drag', // ドラッグ領域上でもクリックを検知するために必須
            display: 'none',
            background: 'transparent'
        });
        
        // バックドロップをクリックしたら閉じる
        ctxMenuBackdrop.onmousedown = (e) => {
            // クリックイベントの伝播を止め、下の要素（アプリ起動など）が反応しないようにする
            e.stopPropagation();
            e.preventDefault();
            closeContextMenu();
        };

        // 右クリックでも閉じる
        ctxMenuBackdrop.oncontextmenu = (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeContextMenu();
        };

        document.body.appendChild(ctxMenuBackdrop);
    }
}

// Padding Settings
const customPaddingCheck = document.getElementById('custom-padding-check');
const paddingInputGroup = document.getElementById('padding-input-group');
const windowPaddingInput = document.getElementById('window-padding-input');
const windowPaddingHInput = document.getElementById('window-padding-h-input');

const searchInput = document.getElementById('app-search');
const showSearchInput = document.getElementById('show-search');
const showScrollInput = document.getElementById('show-scroll');
const showAppNamesInput = document.getElementById('show-app-names');
const showFolderNamesInput = document.getElementById('show-folder-names');
const oneRowModeInput = document.getElementById('one-row-mode');
const lockWindowInput = document.getElementById('lock-window');

const container = document.getElementById('app-grid').parentElement; // .content-wrapper? Check HTML
// Actually app-grid is .container. Main scrollable area in one row mode is .container?
// Check CSS: 
// .one-row-mode .container { display: flex; overflow-x: auto; ... }
// So we attach to appGrid logic?
// Wait, variable appGrid is document.getElementById('app-grid').
// One Row Mode -> .container is horizontal scrollable.
// Let's implement Drag Scroll on appGrid.

let isDown = false;
let startX;
let scrollLeft;

appGrid.addEventListener('mousedown', (e) => {
    if (!currentSettings.oneRowMode) return;
    // Don't init drag if clicking an app or control?
    // If clicking "app-item", we might want to drag-scroll IF we don't hold enough to drag-drop?
    // But we have drag-drop logic separately.
    // If we click background, easy.
    if(e.target.closest('.app-item') && !isEditMode) {
        // If clicking app, we might launch.
        // But if we move mouse while down, we should scroll.
        // "Mouse cursor de sayu ni idou" (Move left/right with cursor).
        // Let's allow drag scrolling even starting on app item, but prevent launch if moved?
        // Launch is handled by 'click'. Click doesn't fire if we drag?
    }
    
    isDown = true;
    appGrid.classList.add('active'); // Change cursor style?
    startX = e.pageX - appGrid.offsetLeft;
    scrollLeft = appGrid.scrollLeft;
});

appGrid.addEventListener('mouseleave', () => {
    isDown = false;
    appGrid.classList.remove('active');
});

appGrid.addEventListener('mouseup', () => {
    isDown = false;
    appGrid.classList.remove('active');
    // Remove scrolling flag with slight delay to ensure click events finish processing
    setTimeout(() => {
        appGrid.classList.remove('is-scrolling');
    }, 50);
});

appGrid.addEventListener('mousemove', (e) => {
    if (!isDown || !currentSettings.oneRowMode) return;
    e.preventDefault();
    const x = e.pageX - appGrid.offsetLeft;
    // Direction multiplier
    const dir = currentSettings.invertScrollDirection ? -1 : 1;
    const walk = (x - startX) * 1.5 * dir; // Scroll-fast multiplier * direction
    
    // Check if we actually moved
    if (Math.abs(walk) > 5) {
        appGrid.classList.add('is-scrolling');
        appGrid.scrollLeft = scrollLeft - walk;
    }
});

// Wheel Horizontal Scroll
appGrid.addEventListener('wheel', (e) => {
    if (currentSettings.oneRowMode) {
        if (e.deltaY !== 0) {
            e.preventDefault(); // Stop vertical scroll if any
            const dir = currentSettings.invertScrollDirection ? -1 : 1;
            appGrid.scrollLeft += e.deltaY * dir;
        }
    }
});

// Target List Horizontal Scroll (Wheel)
if (targetList) {
    targetList.addEventListener('wheel', (e) => {
        if (e.deltaY !== 0) {
            e.preventDefault();
            const dir = currentSettings.invertScrollDirection ? -1 : 1;
            targetList.scrollLeft += e.deltaY * dir;
        }
    });
}

let draggedItem = null;
let draggedSource = null; // { type: 'desktop' | 'folder', index: number, parentIndex: number }
let activeFolder = null; // Track current folder for edit mode toggling
let activeFolderIndex = -1;

let isEditMode = false;
let globalApps = []; 
let currentSettings = {};

// Helper to create safe file URL for CSS
function getLocalFileUrl(path) {
    if (!path) return '';
    // Normalize slashes
    const normalized = path.replace(/\\/g, '/');
    // Encode components to handle spaces, #, japanese chars etc.
    const encoded = normalized.split('/').map(part => encodeURIComponent(part)).join('/');
    return `file:///${encoded}`;
}

// 非同期ロジックを削除し、単純なCSS URL生成に戻す
function getCustomIconUrl(path) {
    return `url('${getLocalFileUrl(path)}')`;
}

async function createAppElement(app, context = 'desktop', contextIndex = -1, parentIndex = -1) {
    const el = document.createElement('div');
    el.className = 'app-item';
    
    // Add Right Click Custom Context Menu
    el.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const actions = [];
        const callbacks = {};

        // アプリの場合は Change Icon を追加
        if (app.type === 'app') {
            actions.push('change-icon');
            callbacks.changeIcon = async () => {
                 if (window.electronAPI) {
                     const path = await window.electronAPI.selectImage();
                     if (path) {
                         // Update model logic ...
                         if (context === 'desktop') {
                             globalApps[contextIndex].customIcon = path.replace(/\\/g, '/');
                         } else if (context === 'folder') {
                             globalApps[parentIndex].content[contextIndex].customIcon = path.replace(/\\/g, '/');
                         }
                         saveConfig();
                         if (context === 'folder') {
                             openFolder(globalApps[parentIndex], parentIndex);
                             renderApps();
                         } else {
                             renderApps();
                         }
                     }
                 }
            };
        }

        // アプリまたはフォルダの場合は Rename を追加
        if (app.type === 'app' || app.type === 'folder') {
            actions.push('rename');
            callbacks.rename = () => {
                // 名前編集を開始
                const nameEl = el.querySelector('.app-name');
                if (nameEl) {
                    nameEl.contentEditable = true;
                    nameEl.classList.add('editable');
                    nameEl.focus();
                    
                    // 全選択
                    const range = document.createRange();
                    range.selectNodeContents(nameEl);
                    const sel = window.getSelection();
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
            };
        }

        if (actions.length === 0) return;

        // アイコン要素を取得 (位置基準)
        const icon = el.querySelector('.app-icon');
        const targetEl = icon || el; // fallback
        const rect = targetEl.getBoundingClientRect();
        
        const startX = rect.right + 2; 
        const startY = rect.top - 15;
        const iconSize = rect.height;

        showCustomContextMenu(startX, startY, iconSize, actions, callbacks);
    });

    // Check animation flag
    if (app.isNew) {
        el.classList.add('new-item');
        delete app.isNew; // Remove flag after rendering
    }
    
    // Class handling updated for spacer
    if (app.type === 'folder') {
        el.classList.add('type-folder');
    } else if (app.type === 'spacer') {
        el.classList.add('type-spacer');
    } else {
        el.classList.add('type-app');
    }
    
    const icon = document.createElement('div');
    icon.className = 'app-icon';
    
    if (app.type === 'folder') {
        icon.classList.add('folder-icon');
        
        // Custom Icon for Folder Itself (Prioritize over grid view)
        if (app.customIcon) {
            icon.classList.remove('folder-icon'); // Remove grid styling if custom image used
            // No await needed
            icon.style.backgroundImage = getCustomIconUrl(app.customIcon);
            icon.style.backgroundSize = 'cover';
            icon.style.backgroundRepeat = 'no-repeat';
            icon.style.backgroundPosition = 'center';
            // Ensure no grid layout
            icon.style.display = 'flex'; 
        } else {
            // Create mini icons for folder preview (first 9)
            const subApps = app.content.slice(0, 9);
            for (const subApp of subApps) {
                 const mini = document.createElement('div');
                mini.className = 'mini-icon';
                
                // Priority: Custom Icon -> System Icon -> Color
                if (subApp.customIcon) {
                     // No await needed
                     mini.style.backgroundImage = getCustomIconUrl(subApp.customIcon);
                     mini.style.backgroundSize = 'cover';
                     mini.style.backgroundRepeat = 'no-repeat';
                     mini.style.backgroundPosition = 'center';
                     mini.style.backgroundColor = 'transparent';
                } else if (window.electronAPI && subApp.path) {
                    try {
                         const iconData = await window.electronAPI.getIcon(subApp.path);
                         if (iconData) {
                             mini.style.backgroundImage = `url('${iconData}')`;
                             mini.style.backgroundSize = 'contain';
                             mini.style.backgroundRepeat = 'no-repeat';
                             mini.style.backgroundPosition = 'center';
                             mini.style.backgroundColor = 'transparent';
                         } else {
                             mini.style.backgroundColor = subApp.color || '#ccc';
                         }
                    } catch(e) {
                        mini.style.backgroundColor = subApp.color || '#ccc';
                    }
                } else {
                    mini.style.backgroundColor = subApp.color || '#ccc';
                }
                icon.appendChild(mini);
            }
        }
    } else if (app.type !== 'spacer') {
        // Try to load system icon for real apps only
        let iconLoaded = false;
        
        // Priority 1: Custom Icon
        if (app.customIcon) {
             // No await needed
             icon.style.backgroundImage = getCustomIconUrl(app.customIcon);
             icon.style.backgroundSize = 'cover'; // Custom icons usually fill
             icon.style.backgroundRepeat = 'no-repeat';
             icon.style.backgroundPosition = 'center';
             iconLoaded = true;
        } 
        // Priority 2: System Icon
        else if (window.electronAPI && app.path) {
             const iconData = await window.electronAPI.getIcon(app.path);
             if (iconData) {
                 icon.style.backgroundImage = `url('${iconData}')`;
                 icon.style.backgroundSize = '80%'; // System icons usually need padding/contain
                 icon.style.backgroundRepeat = 'no-repeat';
                 icon.style.backgroundPosition = 'center';
                 iconLoaded = true;
             }
        }
        
        if (!iconLoaded) {
            icon.style.backgroundColor = app.color || '#ccc';
            // Simple emoji or first letter for icon
            icon.textContent = app.name[0];
        }
    }
    // Spacer simply has an empty icon container or customized by CSS

    const name = document.createElement('div');
    name.className = 'app-name';
    name.textContent = app.type === 'spacer' && isEditMode ? 'Empty' : app.name;
    
    // Listeners are ALWAYS attached for rename updates, but activation depends on logic
    name.oninput = () => {
        if (context === 'desktop') {
            globalApps[contextIndex].name = name.textContent;
        } else if (context === 'folder') {
            globalApps[parentIndex].content[contextIndex].name = name.textContent;
        }
    };
    
    name.onblur = () => {
         name.contentEditable = false;
         name.classList.remove('editable');
         saveConfig();
    };
    
    name.onkeydown = (e) => {
        if(e.key === 'Enter') {
            e.preventDefault();
            name.blur();
        }
        e.stopPropagation(); // Stop propagation to avoid odd behaviors
    };

    // PERMISSIONS CHECK FOR CLICK-TO-RENAME
    const canClickEdit = (app.type === 'folder' && currentSettings.enableFolderRename !== false) || 
                    (app.type === 'app' && currentSettings.enableAppRename === true);

    name.onclick = (e) => {
        if (canClickEdit) {
            e.preventDefault();
            e.stopPropagation(); // Prevent launch
            name.contentEditable = true;
            name.classList.add('editable');
            name.focus();
        } 
        // If not allowed, let it bubble (or stop if we want text selection only? Usually bubbles to launch)
    };

    // Prevent dragging starting from text when editing
    name.draggable = true; 
    name.ondragstart = (e) => {
         if (name.isContentEditable) {
             e.preventDefault();
             e.stopPropagation();
         }
    };

    el.appendChild(icon);
    el.appendChild(name);

    if (isEditMode) {
        el.draggable = true;
        el.addEventListener('dragstart', (e) => {
             draggedItem = app;
             draggedSource = { context, index: contextIndex, parentIndex };
             e.dataTransfer.effectAllowed = 'move';
             e.dataTransfer.setData('text/plain', JSON.stringify(app)); // Just metadata
             el.style.opacity = '0.5';
        });

        el.addEventListener('dragend', (e) => {
            el.style.opacity = '1';
            draggedItem = null;
            draggedSource = null;
             // Remove highlights
             document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
        });
        
        // Allow dropping onto other apps to create folder (only on desktop main items)
        el.addEventListener('dragover', (e) => {
             e.preventDefault();
             e.dataTransfer.dropEffect = 'move';
             if (draggedItem && draggedItem !== app) {
                el.classList.add('drag-over');
             }
        });

        el.addEventListener('dragleave', () => {
             el.classList.remove('drag-over');
        });

        el.addEventListener('drop', async (e) => {
             e.preventDefault();
             el.classList.remove('drag-over');
             
             if (!draggedItem || draggedItem === app) return;
             
             // Handle Drop Logic
             // If target is folder -> add to folder
             // If target is app -> create folder
             // Be careful about circular structures or folder-in-folder (simplified: no nested folders)
             
             if (context === 'desktop') {
                 await handleDesktopDrop(contextIndex, app);
             } else if (context === 'folder') {
                 await handleFolderDrop(contextIndex, parentIndex, app);
             }
        });
    }

    // Delete Badge for Edit Mode
    const deleteBadge = document.createElement('div');
    deleteBadge.className = 'delete-badge hidden';
    // Use SVG to ensure perfect centering compared to text '×'
    deleteBadge.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
    deleteBadge.onclick = (e) => {
        e.stopPropagation();
        removeApp(contextIndex, parentIndex);
    };
    icon.appendChild(deleteBadge);

    // Toggle delete badge based on global state (will be handled by updateEditMode UI but initially hidden)
    if (isEditMode) {
        el.classList.add('edit-mode'); // Should apply wiggle
        deleteBadge.classList.remove('hidden');
    }

    el.onclick = (e) => {
        // Prevent launch if we just dragged for scrolling (simple check: did we move?)
        // Since we are not tracking global mouse move distance specifically for this element,
        // we can rely on isDown logic or add a check.
        // But appGrid mouseup sets isDown false.
        // A simple way is to use a flag that sets on mousemove if scrolling happened.
        if (appGrid.classList.contains('is-scrolling')) {
             e.preventDefault();
             e.stopPropagation();
             // Reset after small delay? Or mouseup handles it.
             return;
        }

        // Allow opening folder even in edit mode, so user can edit contents
        if (isEditMode && app.type !== 'folder') return; 
        
        if (app.type === 'folder') {
            openFolder(app, contextIndex);
        } else if (app.type !== 'spacer') {
            launchApp(app);
        }
    };

    return el;
}

async function openFolder(folder, index) {
    activeFolder = folder;
    activeFolderIndex = index;
    
    // Set Folder Name and setup renaming listeners
    if (folderTitle) {
        folderTitle.textContent = folder.name;
        
        folderTitle.oninput = () => {
             folder.name = folderTitle.textContent;
        };
        folderTitle.onblur = () => {
             saveConfig();
             renderApps(); // Update desktop name reference
        };
        folderTitle.onkeydown = (e) => {
            if(e.key === 'Enter') {
                e.preventDefault();
                folderTitle.blur();
            }
        };
    }
    
    // Prevent closing when clicking inside
    const folderContentArea = document.getElementById('folder-content-area');
    folderContentArea.onclick = (e) => e.stopPropagation();

    folderGrid.innerHTML = '';
    
    // Removed dynamic column calculation to rely on CSS Grid/Flex for consistent spacing
    folderGrid.style.gridTemplateColumns = '';
    
            // One Row Mode Adjustment: Fit all apps in one row if possible
    if (currentSettings.oneRowMode) {
        const numApps = folder.content.length;
        if (numApps > 0) {
            // Calculate available width based on overlay constraints (80% viewport - padding)
            
            // Use clientWidth to exclude scrollbars for safer calculation
            const viewportWidth = document.documentElement.clientWidth;
            
            // Check for small vertical height mode (CSS @media (max-height: 500px))
            const isSmallHeight = window.innerHeight <= 500;
            
            // Padding Analysis:
            // .overlay-content padding: 20px * 2 = 40px
            // Border + Scrollbar buffer: ~40px
            let totalPadding = 80; // Reduced from 120 to allow larger icons
            let gap = currentSettings.folderGap !== undefined ? currentSettings.folderGap : 20;

            if (isSmallHeight) {
                totalPadding = 60; 
                gap = 10; 
            }

            // Max Width is 80% of viewport
            const maxW = viewportWidth * 0.8; 
            const availableW = maxW - totalPadding;
            
            const baseIconSize = currentSettings.iconSize || 60;
            // Dynamic itemExtra: Standard is 20, but we can reduce to 0 if tight
            let itemExtra = 20; 

            // Force 1 Row
            let columns = numApps;
            let rows = 1;

            // Function to check if params fit
            // Now accepts optional overrideExtra to check fit with different padding
            const checkFit = (size, g, cols, extra = itemExtra) => {
                 const reqW = cols * (size + extra) + (cols - 1) * g;
                 return reqW <= availableW ? reqW : false;
            };

            // 1. Try Base Size with Standard Gap & Padding
            let fitW = checkFit(baseIconSize, gap, columns);
            
            // Reset compact mode
            folderGrid.classList.remove('compact');

            if (!fitW) {
                // Doesn't fit. 
                // Strategy A: Try Compact Mode (Remove extra padding around items: itemExtra = 0)
                // Use default gap first
                if (checkFit(baseIconSize, gap, columns, 0)) {
                    // Fits if we remove extra padding!
                    itemExtra = 0;
                    folderGrid.classList.add('compact');
                    // Recalculate GAP to fill space? 
                    // No, GAP is fine. Just set compact.
                } else {
                    // Strategy B: Shrink GAP to Min (5px)
                    // Still try keeping ItemExtra=20 first? No, if we are shrinking, go compact first.
                    itemExtra = 0;
                    folderGrid.classList.add('compact');
                    
                    const minGap = 5;
                    // Check if fits with compactness + min gap
                    if (checkFit(baseIconSize, minGap, columns, 0)) {
                         // It fits! 
                         // Maximize Gap
                         // availableW = cols * (base + 0) + (cols - 1) * newGap
                         let newGap = (availableW - columns * (baseIconSize + 0)) / (columns - 1);
                         newGap = Math.floor(newGap);
                         if (newGap < minGap) newGap = minGap;
                         folderGrid.style.setProperty('--folder-gap', `${newGap}px`);
                    } else {
                        // Strategy C: Shrink Icon Size
                        // Using Compact Mode + Min Gap
                        folderGrid.style.setProperty('--folder-gap', `${minGap}px`);
                        let activeGap = minGap;
                        
                        // availableW = cols * (newSize + 0) + (cols-1) * activeGap
                        let newSize = (availableW - (columns - 1) * activeGap) / columns; // itemExtra is 0
                        
                        newSize = Math.floor(newSize - 1); // Safety floor
                        if (newSize < 20) newSize = 20;
                        
                        folderGrid.style.setProperty('--icon-size', `${newSize}px`);
                    }
                }
            } else {
                folderGrid.style.removeProperty('--icon-size');
                folderGrid.style.removeProperty('--folder-gap');
            }
            
            // Force 1 row
            folderGrid.style.flexWrap = 'nowrap';
            folderGrid.style.justifyContent = 'center';
            // End Resize Logic

        }
    } else {
        // Normal Mode: Fit logic
        
        // Reset properties
        folderGrid.style.removeProperty('--icon-size');
        folderGrid.style.removeProperty('--folder-gap');
        folderGrid.style.flexWrap = 'wrap';
        folderGrid.style.justifyContent = 'center';

        const numApps = folder.content.length;
        if (numApps > 0) {
            // Viewport Constraints
            const viewportWidth = document.documentElement.clientWidth;
            const viewportHeight = window.innerHeight;
            
            // Available Width/Height (80% rule)
            // Padding: 40px (overlay) + 40px (buffer) = 80px
            const availableW = (viewportWidth * 0.8) - 80;
            // Subtract title height (~40px) and padding (~40px)
            const availableH = (viewportHeight * 0.8) - 80;

            const gap = currentSettings.folderGap !== undefined ? currentSettings.folderGap : 20;
            // Item Dimensions Estimates
            const itemExtraW = 20; // .app-item width = size + 20
            const itemExtraH = 40; // Approx height overhead (icon + name + margin)

            // Search for optimal column count (Prioritizing 3 columns/3x3 layout)
            let bestSize = 0;
            let bestConfig = null;

            // Range of columns to test
            const minCols = 1;
            const maxCols = Math.min(numApps, 8); // logical max

            for (let c = minCols; c <= maxCols; c++) {
                 const rows = Math.ceil(numApps / c);
                 
                 // Calculate Max Size allowed by Width
                 // S <= (availableW - (c-1)*gap) / c - ExtraW
                 let sizeW = (availableW - (c - 1) * gap) / c - itemExtraW;

                 // Calculate Max Size allowed by Height
                 // S <= (availableH - (rows-1)*gap) / rows - ExtraH
                 let sizeH = (availableH - (rows - 1) * gap) / rows - itemExtraH;

                 // Valid size for this specific column count constrained by container
                 let size = Math.floor(Math.min(sizeW, sizeH));
                 
                 if (size < 20) continue; // Too small to consider

                 // Scoring to prioritize 3x3 or balanced layouts
                 let score = size;
                 
                 // Prefer 3 columns (User Request: "3x3 priority")
                 if (c === 3) score *= 1.15;
                 
                 // Prefer 2 columns for small specific counts (4 apps -> 2x2, 2 apps -> 2x1)
                 if (numApps === 4 && c === 2) score *= 1.2;
                 if (numApps === 2 && c === 2) score *= 1.2;

                 if (score > bestSize) {
                     bestSize = score;
                     bestConfig = { size: size, cols: c };
                 }
            }
            
            let finalSize = bestConfig ? bestConfig.size : 60;
            
            // Cap nice size
            if (finalSize > 120) finalSize = 120;
            
            // Min size floor
            if (finalSize < 40) finalSize = 40;

            folderGrid.style.setProperty('--icon-size', `${finalSize}px`);
        }
    }
    
    // Pass parent index to sub-items
    let subIndex = 0;
    for (const app of folder.content) {
        // If app is folder, render it recursively or as folder icon?
        // Current logic: createAppElement handles 'folder' type if we pass it.
        // It should just work if we treat it as an app item.
        const el = await createAppElement(app, 'folder', subIndex, index);
        
        // Ensure Drag/Drop works inside folder
        if (isEditMode) {
             setupFolderDragDrop(el, app, subIndex, index);
        }
        
        folderGrid.appendChild(el);
        subIndex++;
    }

    if (isEditMode) {
        // Buttons removed as per user request to use global toolbar buttons
    }

    overlay.classList.remove('hidden');
    // Force reflow
    void overlay.offsetWidth;
    overlay.classList.add('visible');
}

async function addAppToFolder(folder, folderIndex) {
    if (window.electronAPI) {
        const filePath = await window.electronAPI.selectFile();
        if (filePath) {
            const name = filePath.split('\\').pop().split('.').shift();
            const newApp = {
                id: Date.now(),
                name: name,
                type: 'app',
                path: filePath,
                color: '#888'
            };
            folder.content.push(newApp);
            openFolder(folder, folderIndex); // Refresh
            renderApps(); // Refresh main grid badges etc
            saveConfig();
        }
    }
}

function addFolderToFolder(parentFolder, parentIndex) {
    const newFolder = {
        id: Date.now(),
        name: "New Folder",
        type: "folder",
        content: []
    };
    parentFolder.content.push(newFolder);
    openFolder(parentFolder, parentIndex); // Refresh
    renderApps();
    saveConfig();
}

function setupFolderDragDrop(el, app, index, parentIndex) {
    el.draggable = true;
    el.addEventListener('dragstart', (e) => {
         draggedItem = app;
         draggedSource = { context: 'folder', index, parentIndex };
         e.dataTransfer.effectAllowed = 'move';
         e.dataTransfer.setData('text/plain', JSON.stringify(app)); 
         el.style.opacity = '0.5';
         
         // Visual hint for dropping out
         document.getElementById('folder-content-area').classList.add('scale-down');
         
         e.stopPropagation();
    });
    
    el.addEventListener('dragend', (e) => {
        el.style.opacity = '1';
        
        // Remove hint
        document.getElementById('folder-content-area').classList.remove('scale-down');
        
        draggedItem = null;
        draggedSource = null;
        document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    });

    el.addEventListener('dragover', (e) => {
         e.preventDefault();
         e.dataTransfer.dropEffect = 'move';
         // Optional: Visual cue for reordering
    });
    
    // Drop inside folder (Reorder or Swap)
    el.addEventListener('drop', async (e) => {
         e.preventDefault();
         e.stopPropagation();
         
         if (!draggedItem || !draggedSource) return;
         
         // Only handle internal folder reorder here to keep it simple
         if (draggedSource.context === 'folder' && draggedSource.parentIndex === parentIndex) {
             const folder = globalApps[parentIndex];
             // Swap content
             const temp = folder.content[draggedSource.index];
             folder.content[draggedSource.index] = folder.content[index];
             folder.content[index] = temp;
             
             openFolder(folder, parentIndex); // Refresh folder view
         }
    });
}


function closeFolder() {
    activeFolder = null;
    activeFolderIndex = -1;
    overlay.classList.remove('visible');
    setTimeout(() => {
        overlay.classList.add('hidden');
    }, 300); // Match CSS transition
}

async function launchApp(app) {
    console.log('Launching', app.name);
    // Use the exposed API
    if (window.electronAPI) {
        const result = await window.electronAPI.launchApp(app.path || '');
        if (!result.success && result.error) {
            console.error(result.error);
            alert(`Launched ${app.name} (Simulation)\nPath: ${app.path || 'Not specified'}`);
        }
    } else {
        alert(`Launched ${app.name}`);
    }
}

// Initialize Desktop
async function init() {
    if (window.electronAPI) {
        globalApps = await window.electronAPI.loadConfig();
        currentSettings = await window.electronAPI.loadSettings();
    }
    
    if (!globalApps) globalApps = [];

    // 不正なデータ(nullなど)を除外してクリーンにする
    globalApps = globalApps.filter(app => app && typeof app === 'object');
    
    applySettings(currentSettings);
    renderApps();
}

function applySettings(settings) {
    if (!settings) return;
    
    if (settings.iconSize) {
        document.body.style.setProperty('--icon-size', `${settings.iconSize}px`);
    }

    if (settings.appGap !== undefined) {
        document.body.style.setProperty('--app-gap', `${settings.appGap}px`);
    }

    if (settings.folderGap !== undefined) {
        document.body.style.setProperty('--folder-gap', `${settings.folderGap}px`);
    }
    
    // Window Vertical Padding Logic
    if (settings.customWindowPadding) {
        const pv = settings.windowPaddingSize !== undefined ? settings.windowPaddingSize : 15;
        const ph = settings.windowPaddingSizeH !== undefined ? settings.windowPaddingSizeH : 20;
        // Apply fixed pixel padding
        document.body.style.setProperty('--window-padding-v', `${pv}px`);
        document.body.style.setProperty('--window-padding-h', `${ph}px`);
    } else {
        // Apply calculation based on icon size (0.25 * icon size)
        document.body.style.setProperty('--window-padding-v', `calc(var(--icon-size) * 0.25)`);
        document.body.style.setProperty('--window-padding-h', `20px`); // Default horizontal
    }
    
    if (settings.backgroundImage) {
        // Handle local paths by replacing backslashes and ensuring protocol if missing
        let url = settings.backgroundImage;
        // Check if it's NOT http, NOT file://, AND NOT assets path (relative)
        if (!url.startsWith('http') && !url.startsWith('file://') && !url.startsWith('assets/')) {
            // Assume local absolute path, escape backslashes
            url = `file:///${url.replace(/\\/g, '/')}`;
        }
        document.body.style.backgroundImage = `url('${url}')`;
    }
    
    if (settings.backgroundPosition) {
        document.body.style.backgroundPosition = settings.backgroundPosition;
    } else {
        document.body.style.backgroundPosition = 'center center';
    }

    if (settings.showSearch === false) {
        document.querySelector('.search-bar-container').classList.add('hidden');
        document.body.classList.add('no-search');
    } else {
        document.querySelector('.search-bar-container').classList.remove('hidden');
        document.body.classList.remove('no-search');
    }

    if (settings.showScroll === false) {
         document.body.classList.add('no-scroll');
    } else {
         document.body.classList.remove('no-scroll');
    }

    if (settings.showDesktopNames === false) {
        document.body.classList.add('hide-desktop-names');
    } else {
        document.body.classList.remove('hide-desktop-names');
    }

    if (settings.showFolderContentNames === false) {
        document.body.classList.add('hide-folder-content-names');
    } else {
        document.body.classList.remove('hide-folder-content-names');
    }

    // Toggle Compact Menu 
    const toolbar = document.getElementById('main-toolbar');
    if (toolbar) {
        if (settings.compactMenu === true) {
            toolbar.classList.add('compact-mode');
        } else {
            toolbar.classList.remove('compact-mode');
        }
    }

    if (settings.oneRowMode === true) {
        document.body.classList.add('one-row-mode');
        const devMsg = document.getElementById('dev-msg-overlay');
        if (devMsg) devMsg.remove();
    } else {
        document.body.classList.remove('one-row-mode');
        // Show "Under Development" message if not in oneRowMode
        // Check if message already exists
        let devMsg = document.getElementById('dev-msg-overlay');
        if (!devMsg) {
            devMsg = document.createElement('div');
            devMsg.id = 'dev-msg-overlay';
            devMsg.style.cssText = `
                position: fixed;
                bottom: 10px;
                right: 10px;
                background: rgba(0,0,0,0.7);
                color: white;
                padding: 5px 10px;
                border-radius: 5px;
                font-size: 12px;
                z-index: 9999;
                pointer-events: none;
            `;
            devMsg.textContent = '現在開発中 (Under Development)';
            document.body.appendChild(devMsg);
        }
    }

    // Apply Text Styles
    document.body.style.setProperty('--desktop-text-color', settings.desktopNameColor || '#ffffff');
    document.body.style.setProperty('--desktop-font-weight', settings.desktopNameBold ? 'bold' : 'normal');
}



async function handleFolderDrop(targetIndex, parentIndex, targetApp) {
    if (!draggedItem || !draggedSource) return;
    
    // Only handle inside same folder reordering for now
    if (draggedSource.context === 'folder' && draggedSource.parentIndex === parentIndex) {
         // Swap
         const folder = globalApps[parentIndex];
         const A = folder.content[draggedSource.index];
         folder.content[draggedSource.index] = folder.content[targetIndex];
         folder.content[targetIndex] = A;
         
         openFolder(folder, parentIndex);
    }
    // If dragging from desktop to folder? (Should be handled by desktop logic, but if dropping ONTO folder content?)
    // This is weird UI. Usually you drop onto folder icon, not open folder contents.
}

async function handleDesktopDrop(targetIndex, targetApp) {
    if (!draggedItem || !draggedSource) return;

    // Prevent dropping on self
    if (draggedSource.context === 'desktop' && draggedSource.index === targetIndex) return;

    // Remove from original location FIRST to prevent duplication logic errors
    // BUT we need to be careful if we are swapping.
    
    // Case 1: Reordering (Swap) - if target is app and source is app (or folder/folder) and we are just moving
    // But wait, the requirement is "Create Folder" when dropping on app.
    // So "Reordering" on desktop is actually tricky without a "gap" logic.
    // Let's assume dropping on app = create folder.
    // Dropping on "Empty space" = move to end (implemented in renderApps).
    
    // If dropping ONTO a folder -> move into folder
    if (targetApp.type === 'folder') {
        if (draggedItem.type === 'folder') {
             // Logic Change: Allow nesting folder inside folder
             // Check for circular dependency (not possible here since we just move depth 1 to depth 2)
             // Check duplicates? ID based.
             if (!targetApp.content.find(a => a.id === draggedItem.id)) {
                targetApp.content.push(draggedItem);
             }

             // Remove from original location
             if (draggedSource.context === 'desktop') {
                 globalApps.splice(draggedSource.index, 1);
             } else if (draggedSource.context === 'folder') {
                 // Moving from another folder
                 globalApps[draggedSource.parentIndex].content.splice(draggedSource.index, 1);
             }
        } else {
             // Add app to folder
             // Check if already in content to avoid dupes (double safety)
             if (!targetApp.content.find(a => a.id === draggedItem.id)) {
                targetApp.content.push(draggedItem);
             }
             
             // Remove from original
             if (draggedSource.context === 'desktop') {
                 // Important: Check if index is still valid or if things shifted? 
                 // Since we haven't modified the array structure (only internal content of one item), indices match.
                 // BUT if we are adding to a folder that IS NOT the source (obviously), we just splice source.
                 
                 // However, "ghosting" might be because of rapid renders.
                 globalApps.splice(draggedSource.index, 1);
             } else if (draggedSource.context === 'folder') {
                  // Moving from one folder to another folder on desktop (if possible to drag out and in)
                  globalApps[draggedSource.parentIndex].content.splice(draggedSource.index, 1);
             }
        }
    } 
    // If dropping ONTO an app -> create folder
    else if (targetApp.type === 'app') {
        if (draggedItem.type === 'folder') {
             // Swap positions
             const temp = globalApps[draggedSource.index];
             globalApps[draggedSource.index] = globalApps[targetIndex];
             globalApps[targetIndex] = temp;
        } else {
            // Create New Folder
            const newFolder = {
                id: Date.now(),
                name: "New Folder",
                type: "folder",
                content: [targetApp, draggedItem]
            };
            
            // Remove dragged item from old place
             if (draggedSource.context === 'desktop') {
                 // If source index is different from target index
                 // We need to handle indices carefully.
                 
                 const sourceIdx = draggedSource.index;
                 let targetIdx = targetIndex; // This is the index of the app we dropped onto
                 
                 if (sourceIdx < targetIdx) {
                    // Remove source
                    globalApps.splice(sourceIdx, 1);
                    // Target index shifted
                    targetIdx--;
                    // Replace target with new folder
                    globalApps[targetIdx] = newFolder;
                 } else {
                    // Remove source
                    globalApps.splice(sourceIdx, 1);
                    // Replace target (index hasn't changed because source was after)
                    globalApps[targetIdx] = newFolder;
                 }
                 
             } else if (draggedSource.context === 'folder') {
                 // Remove from folder
                 globalApps[draggedSource.parentIndex].content.splice(draggedSource.index, 1);
                 // Replace target app on desktop with new folder
                 globalApps[targetIndex] = newFolder;
             }
        }
    }
    
    // Force a small delay or ensure state is clean
    draggedItem = null;
    draggedSource = null;
    renderApps();
}


async function renderApps(filterText = '') {
    appGrid.innerHTML = '';
    
    // Allow dropping on empty space (reorder to end, or move out of folder)
    appGrid.ondragover = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };
    appGrid.ondrop = (e) => {
        e.preventDefault();
        if (!draggedItem || !draggedSource) return;

        if (draggedSource.context === 'folder') {
            moveAppFromFolderToDesktop(draggedItem);
        } else if (draggedSource.context === 'desktop') {
            // Move to end of list
            // If dropping on empty space
            // Remove from current pos
            globalApps.splice(draggedSource.index, 1);
            if(draggedItem) globalApps.push(draggedItem);
            renderApps();
        }
    }

    // Simple filter that hides non-matching items but keeps indices for edit mode simplicity
    for (let i = 0; i < globalApps.length; i++) {
        const app = globalApps[i];
        
        // アプリデータがnullの場合はスキップする（クラッシュ防止）
        if (!app) continue;

        // Filter Logic
        if (filterText && app.name && !app.name.toLowerCase().includes(filterText.toLowerCase())) {
            continue;
        }

        const el = await createAppElement(app, 'desktop', i);
        if (isEditMode) {
             el.querySelector('.delete-badge').classList.remove('hidden');
             el.classList.add('edit-mode');
        }
        appGrid.appendChild(el);
    }
}


init();

// Edit Mode Logic
async function saveConfig() {
    if (window.electronAPI) {
        await window.electronAPI.saveConfig(globalApps);
    }
}

// Function to show custom context menu
function showCustomContextMenu(x, y, referenceSize = 60, actions = [], callbacks = {}) {
    if (!ctxMenu) return;
    
    // バックドロップを準備・表示して、確実なクリック検知エリアを作る
    ensureCtxBackdrop();
    if (ctxMenuBackdrop) ctxMenuBackdrop.style.display = 'block';

    // 既存の非表示タイマーがあればキャンセルして、即座にクリーンな状態にする
    if (activeCtxMenuTimer) {
        clearTimeout(activeCtxMenuTimer);
        activeCtxMenuTimer = null;
    }
    // 即座に hidden を削除
    ctxMenu.classList.remove('hidden');

    currentCtxCallbacks = callbacks;

    // 表示項目の制御
    if (ctxChangeIcon) ctxChangeIcon.style.display = actions.includes('change-icon') ? 'flex' : 'none';
    if (ctxRename) ctxRename.style.display = actions.includes('rename') ? 'flex' : 'none';
    
    // アイコンサイズに依存したスケーリング (大きすぎないように調整)
    let scale = Math.min(0.9, Math.max(0.6, referenceSize / 65));
    currentScale = scale;

    // FIX: ウィンドウのドラッグ領域と重なるとクリックできない問題を回避
    ctxMenu.style.webkitAppRegion = 'no-drag';
    ctxMenu.style.zIndex = '99999';

    ctxMenu.style.visibility = 'hidden';
    ctxMenu.classList.remove('hidden');
    ctxMenu.classList.add('visible'); 
    
    // Reset transform to measure size correctly
    ctxMenu.style.transform = 'scale(1)'; 
    
    const menuRect = ctxMenu.getBoundingClientRect();
    const menuW = menuRect.width * scale;
    const menuH = menuRect.height * scale;
    
    ctxMenu.classList.remove('visible');
    ctxMenu.style.visibility = '';

    let posX = x;
    let posY = y;
    let originX = 'left';
    let originY = 'top';
    
    const winW = window.innerWidth;
    const winH = window.innerHeight;
    
    // Right Edge Check: 画面右端からはみ出る場合はアイコンの左側に出す
    if (posX + menuW > winW) {
        posX = x - menuW - referenceSize - 10; 
        originX = 'right';
    }
    
    // Bottom Edge Check
    if (posY + menuH > winH) {
        posY = winH - menuH - 5;
        originY = 'bottom';
    }
    
    // アイコンサイズが小さい時にメニューが極端に離れないように微調整
    // 右クリック呼び出し位置がアイコンの右端=X だが、アイコン左側に反転した時の位置調整ロジックは既存コード内にある前提

    ctxMenu.style.left = `${posX}px`;
    ctxMenu.style.top = `${posY}px`;
    ctxMenu.style.transformOrigin = `${originX} ${originY}`;
    
    // CSS変数にスケールを渡す
    ctxMenu.style.setProperty('--target-scale', scale);
    
    // Force reflow
    void ctxMenu.offsetWidth;
    ctxMenu.classList.add('visible');
}

// Bind Custom Menu Actions
if (ctxChangeIcon) {
    ctxChangeIcon.onclick = (e) => {
        e.stopPropagation(); 
        if (currentCtxCallbacks && currentCtxCallbacks.changeIcon) currentCtxCallbacks.changeIcon();
        closeContextMenu();
    };
}

if (ctxRename) {
    ctxRename.onclick = (e) => {
        e.stopPropagation();
        if (currentCtxCallbacks && currentCtxCallbacks.rename) currentCtxCallbacks.rename();
        closeContextMenu();
    }
}

function closeContextMenu() {
    if (ctxMenu) {
        // バックドロップを非表示にする
        if (ctxMenuBackdrop) ctxMenuBackdrop.style.display = 'none';

        // 既存のタイマーをクリア（重複実行防止）
        if (activeCtxMenuTimer) {
            clearTimeout(activeCtxMenuTimer);
        }
        
        // フェードアウト開始
        ctxMenu.classList.remove('visible');
        
        // アニメーション完了後に hidden を付与するタイマーを設定
        activeCtxMenuTimer = setTimeout(() => {
            ctxMenu.classList.add('hidden');
            // 次回表示時のために変形をリセット
            ctxMenu.style.transform = ''; 
            activeCtxMenuTimer = null;
        }, 150);
    }
}

editBtn.onclick = () => {
    isEditMode = !isEditMode;
    const textSpan = editBtn.querySelector('span');
    
    if (isEditMode) {
        // Enter Edit Mode
        if (textSpan) textSpan.textContent = 'Done';
        else editBtn.textContent = 'Done';
        
        addBtn.style.display = 'flex'; // Force display for animation
        addFolderBtn.style.display = 'flex';
        
        // Remove hidden class and add animation class
        // Use slight delay to ensure display:flex applies first
        requestAnimationFrame(() => {
            addBtn.classList.remove('hidden');
            addFolderBtn.classList.remove('hidden');
            addBtn.classList.add('entering');
            addFolderBtn.classList.add('entering');
        });

        // Clean up animation class
        setTimeout(() => {
            addBtn.classList.remove('entering');
            addFolderBtn.classList.remove('entering');
            addBtn.style.display = ''; // Clean inline style
            addFolderBtn.style.display = '';
        }, 400);

        document.body.classList.add('edit-mode');
    } else {
        // Exit Edit Mode
        document.body.classList.remove('edit-mode');
        saveConfig(); // Save on exit
        
        // Close menu with animation, then reset UI
        toggleToolbar(true); 
        
        // Wait for close animation (assuming ~350ms in CSS)
        setTimeout(() => {
             if (textSpan) textSpan.textContent = 'Edit Mode';
             else editBtn.textContent = 'Edit';
            
             addBtn.classList.add('hidden');
             addFolderBtn.classList.add('hidden');
        }, 350);
    }
    
    // If folder is open, refresh it
    if (activeFolder && activeFolderIndex !== -1) {
        openFolder(activeFolder, activeFolderIndex);
    }
    
    renderApps(); // Re-render to show/hide badges and animations
};

function removeApp(index, parentIndex = -1) {
    if (parentIndex !== -1) {
        // Remove from folder
        globalApps[parentIndex].content.splice(index, 1);
        // Refresh folder view
        openFolder(globalApps[parentIndex], parentIndex);
    } else {
        // Remove from desktop
        globalApps.splice(index, 1);
    }
    renderApps();
}

addBtn.onclick = async () => {
    // 1. If inside a folder, add to that folder directly
    if (activeFolder && activeFolderIndex !== -1) {
        await addAppToFolder(activeFolder, activeFolderIndex);
        return;
    } 

    // 2. If on desktop, check if there are folders to select from
    const folders = globalApps.filter(a => a.type === 'folder');
    
    if (folders.length > 0) {
        // Show selection modal
        showTargetSelectionModal(folders);
    } else {
        // No folders, add to desktop directly
        await addAppToDesktop();
    }
};

async function addAppToDesktop() {
    if (window.electronAPI) {
        const filePath = await window.electronAPI.selectFile();
        if (filePath) {
            const name = filePath.split('\\').pop().split('.').shift();
            const newApp = {
                id: Date.now(),
                name: name,
                type: 'app',
                path: filePath,
                color: '#888'
            };
            globalApps.push(newApp);
            renderApps();
            saveConfig();
        }
    }
}

function showTargetSelectionModal(folders) {
    targetList.innerHTML = '';
    
    // Style helper for items
    const itemStyle = `
        display: flex; 
        flex-direction: column; 
        align-items: center; 
        justify-content: center; 
        min-width: 80px; 
        height: 100px;
        background: rgba(255, 255, 255, 0.8); 
        backdrop-filter: blur(10px);
        border-radius: 15px; 
        cursor: pointer; 
        box-shadow: 0 4px 10px rgba(0,0,0,0.2); 
        transition: transform 0.1s;
        border: none;
        padding: 10px;
    `;

    const iconStyle = `
        font-size: 40px; 
        margin-bottom: 5px;
    `;

    const textStyle = `
        font-size: 12px; 
        color: #333; 
        text-align: center;
        width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-weight: 600;
    `;

    // Option: Desktop
    const deskBtn = document.createElement('div'); // Div acts as button
    deskBtn.style.cssText = itemStyle;
    deskBtn.innerHTML = `<span style="${iconStyle}">🖥️</span><span style="${textStyle}">Desktop</span>`;
    deskBtn.onclick = () => {
        closeTargetSelection();
        addAppToDesktop();
    };
    deskBtn.onmousedown = () => deskBtn.style.transform = 'scale(0.95)';
    deskBtn.onmouseup = () => deskBtn.style.transform = 'scale(1)';
    targetList.appendChild(deskBtn);

    // Options: Folders
    folders.forEach(folder => {
        const btn = document.createElement('div');
        btn.style.cssText = itemStyle;
        btn.innerHTML = `<span style="${iconStyle}">📁</span><span style="${textStyle}">${folder.name}</span>`;
        
        // Find index of this folder in globalApps
        const fIndex = globalApps.indexOf(folder);
        
        btn.onclick = () => {
            closeTargetSelection();
            addAppToFolder(folder, fIndex);
        };
        btn.onmousedown = () => btn.style.transform = 'scale(0.95)';
        btn.onmouseup = () => btn.style.transform = 'scale(1)';
        targetList.appendChild(btn);
    });

    targetSelectionOverlay.classList.remove('hidden');
    void targetSelectionOverlay.offsetWidth;
    targetSelectionOverlay.classList.add('visible');
}

function closeTargetSelection() {
    targetSelectionOverlay.classList.remove('visible');
    setTimeout(() => {
        targetSelectionOverlay.classList.add('hidden');
    }, 200);
}

// Event Listeners for Selection Overlay
if (closeSelectionBtn) closeSelectionBtn.onclick = closeTargetSelection;
if (targetBackdrop) targetBackdrop.onclick = closeTargetSelection;

addFolderBtn.onclick = () => {
    if (activeFolder && activeFolderIndex !== -1) {
        addFolderToFolder(activeFolder, activeFolderIndex);
    } else {
        const newFolder = {
            id: Date.now(),
            name: "New Folder",
            type: "folder",
            content: [],
            isNew: true // Flag for animation
        };
        globalApps.push(newFolder);
        renderApps();
        saveConfig();
    }
};


// Settings Logic
settingsBtn.onclick = () => {
    // Open external settings window
    if (window.electronAPI) {
        window.electronAPI.send('open-settings');
    }
};

// Listen for updates from Main Process (when Settings Window saves)
if (window.electronAPI) {
    window.electronAPI.on('settings-updated', (newSettings) => {
        currentSettings = newSettings;
        applySettings(currentSettings);
        renderApps(); 
    });

    // Listen for icon updates from context menu
    window.electronAPI.on('app-icon-updated', (data) => {
        const { context, index, parentIndex, iconPath } = data;
        
        let targetApp;
        if (context === 'desktop') {
            targetApp = globalApps[index];
        } else if (context === 'folder') {
            targetApp = globalApps[parentIndex].content[index];
        }

        if (targetApp) {
            // Normalize path for consistency
            targetApp.customIcon = iconPath.replace(/\\/g, '/');
            
            saveConfig(); // Persist changes
            
            // Re-render appropriate view
            if (context === 'folder') {
                openFolder(globalApps[parentIndex], parentIndex);
                renderApps(); // Update desktop too (for mini icons)
            } else {
                renderApps();
            }
        }
    });
}

// Old settings code removed (moved to settings_renderer.js)
/* 
function closeSettings() { ... }
closeSettingsBtn.onclick = closeSettings;
saveSettingsBtn.onclick = ...
resetSettingsBtn.onclick = ...
*/

// Live preview logic handlers removed as they are now in settings window
/*
iconSizeRange.oninput = ...
appGapRange.oninput = ...
folderGapRange.oninput = ...
customPaddingCheck.onchange = ...
*/

// Search Logic
searchInput.oninput = (e) => {
    renderApps(e.target.value);
};


// Event Listeners
closeBtn.onclick = closeFolder;
if (folderBackdrop) {
    folderBackdrop.onclick = closeFolder;
    // Allow dropping on backdrop to move app out of folder
    folderBackdrop.ondragover = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };
    folderBackdrop.ondrop = (e) => {
        e.preventDefault();
        if (draggedSource && draggedSource.context === 'folder') {
            moveAppFromFolderToDesktop(draggedItem);
        }
    };
}

if (settingsBackdrop) {
    settingsBackdrop.onclick = closeSettings;
}

function moveAppFromFolderToDesktop(app) {
    if (!draggedSource || draggedSource.context !== 'folder') return;
    
    // Remove from folder
    globalApps[draggedSource.parentIndex].content.splice(draggedSource.index, 1);
    
    // Check if folder is now empty or has 1 item?
    // iOS behavior: if 1 item left, delete folder and move item to desktop.
    // For now, let's keep empty folder or folder with 1 item.
    
    // Add to Desktop
    globalApps.push(app);
    
    // Refresh Both
    openFolder(globalApps[draggedSource.parentIndex], draggedSource.parentIndex);
    renderApps();
}

// Add App Button Handler
const addAppBtn = document.getElementById('add-btn');
if (addAppBtn) {
    // 既存のリスナーと重複しないよう onclick を使用して確実に割り当てる
    addAppBtn.onclick = async () => {
        try {
            const filePath = await window.electronAPI.selectFile();
            if (filePath) {
                // ファイルパスからファイル名（拡張子なし）を抽出
                let name = filePath.split(/[\\/]/).pop();
                const lastDotIndex = name.lastIndexOf('.');
                if (lastDotIndex > 0) {
                    name = name.substring(0, lastDotIndex);
                }

                const newApp = {
                    id: Date.now(),
                    name: name,
                    type: 'app',
                    path: filePath,
                    color: '#333' // Default color
                };

                // フォルダを展開中かどうかチェック (folder-overlayが表示されているか)
                const folderOverlay = document.getElementById('folder-overlay');
                const isFolderOpen = folderOverlay && !folderOverlay.classList.contains('hidden');

                // グローバル変数のappsやcurrentOpenFolderIdを利用して追加先を決定
                if (isFolderOpen && typeof currentOpenFolderId !== 'undefined' && currentOpenFolderId) {
                    // 開いているフォルダに追加
                    const folder = apps.find(a => a.id === currentOpenFolderId);
                    if (folder) {
                        if (!folder.content) folder.content = [];
                        folder.content.push(newApp);
                        
                        // フォルダの中身を再描画
                        if (typeof renderFolderContent === 'function') {
                            renderFolderContent(folder);
                        }
                    }
                } else {
                    // デスクトップ（ルート）に追加
                    apps.push(newApp);
                    
                    // メイング 画面を再描画
                    if (typeof renderApps === 'function') {
                        renderApps();
                        // 新しいアイテムのアニメーション用クラス付与
                        setTimeout(() => {
                           const el = document.querySelector(`[data-id="${newApp.id}"]`);
                           if(el) el.classList.add('new-item');
                        }, 50);
                    }
                }

                await window.electronAPI.saveConfig(apps);
            }
        } catch (error) {
            console.error('Failed to add app:', error);
        }
    };
}

