const { app, BrowserWindow, shell, ipcMain, dialog, screen, Menu, MenuItem } = require('electron');
const path = require('path');
const fs = require('fs').promises; // Use promises for easier async/await
const fsSync = require('fs'); // Sync fs for close event

let mainWindow;
let settingsWindow; // Track settings window

// DEFAULT CONSTANTS
const DEFAULT_SETTINGS = {
    windowWidth: 650,
    windowHeight: 135,
    iconSize: 80,
    appGap: 5,
    folderGap: 5,
    customWindowPadding: true,
    windowPaddingSize: 5,
    windowPaddingSizeH: 5,
    oneRowMode: true,
    showDesktopNames: true,
    showFolderContentNames: true,
    invertScrollDirection: false,
    startupPosition: 'bottom-left',
    backgroundPosition: 'center center',
    backgroundImage: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=3270&auto=format&fit=crop",
    enableFolderRename: true,
    enableAppRename: false,
    desktopNameColor: '#ffffff',
    desktopNameBold: false,
    showSearch: false,
    showScroll: false,
    windowLocked: false,
    compactMenu: true
};

const DEFAULT_APPS = [
    {
        "id": 1,
        "name": "Explorer",
        "type": "app",
        "path": "C:\\Windows\\explorer.exe",
        "color": "#0078D7"
    },
    {
        "id": 2,
        "name": "Edge",
        "type": "app",
        "path": "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
        "color": "#0078D7"
    },
    {
        "id": 3,
        "name": "Tools",
        "type": "folder",
        "content": [
            {
                "id": 31,
                "name": "Notepad",
                "type": "app",
                "path": "C:\\Windows\\System32\\notepad.exe",
                "color": "#333"
            },
            {
                "id": 32,
                "name": "Calculator",
                "type": "app",
                "path": "C:\\Windows\\System32\\calc.exe",
                "color": "#333"
            }
        ]
    }
];

async function ensureDataFiles() {
    const settingsPath = path.join(__dirname, '../settings.json');
    const appsPath = path.join(__dirname, '../apps.json');

    try {
        await fs.access(settingsPath);
    } catch {
        console.log('settings.json not found. Creating default...');
        await fs.writeFile(settingsPath, JSON.stringify(DEFAULT_SETTINGS, null, 4), 'utf8');
    }

    try {
        await fs.access(appsPath);
    } catch {
        console.log('apps.json not found. Creating default...');
        await fs.writeFile(appsPath, JSON.stringify(DEFAULT_APPS, null, 4), 'utf8');
    }
}

async function loadSettings() {
    try {
        const settingsPath = path.join(__dirname, '../settings.json');
        const data = await fs.readFile(settingsPath, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        return DEFAULT_SETTINGS;
    }
}

function getWindowPosition(width, height, position) {
    try {
        const display = screen.getPrimaryDisplay();
        const workArea = display.workArea;
        let x, y;

        switch (position) {
            case 'top-left':
                x = workArea.x;
                y = workArea.y;
                break;
            case 'top-right':
                x = workArea.x + workArea.width - width;
                y = workArea.y;
                break;
            case 'bottom-left':
                x = workArea.x;
                y = workArea.y + workArea.height - height;
                break;
            case 'bottom-right':
                x = workArea.x + workArea.width - width;
                y = workArea.y + workArea.height - height;
                break;
            case 'center':
            default:
                x = workArea.x + (workArea.width - width) / 2;
                y = workArea.y + (workArea.height - height) / 2;
                break;
        }
        
        return { x: Math.round(x), y: Math.round(y) };
    } catch (e) {
        return null;
    }
}

async function createWindow() {
    const settings = await loadSettings();
    const iconSize = settings.iconSize || 60;
    
    // Calculate Min Height based on settings
    let minHeight;
    if (settings.customWindowPadding) {
        // Icon + (Padding * 2) * 2 (Body+Container) -> CSS Logic uses padding twice (body, container)
        // Body padding = p, Container padding = p. Total = 2p top, 2p bottom?
        // CSS: padding: var(--window-padding-v)
        // Body has padding: var(--window-padding-v).
        // Container has padding: var(--window-padding-v).
        // Vertical total padding = (p_body_top + p_container_top) + (p_body_bottom + p_container_bottom)
        // = 2p + 2p = 4p.
        // Wait, previous default was 0.25 * icon.
        // Total = 4 * 0.25 = 1.0 * icon. Total Height = 2.0 * icon. Correct.
        
        const p = settings.windowPaddingSize || 15;
        minHeight = iconSize + (p * 4);
    } else {
        // Default: 2.0 * IconSize
        minHeight = iconSize * 2;
    }

    const width = settings.windowWidth || 1200;
    const height = settings.windowHeight || 800;
    const pos = getWindowPosition(width, height, settings.startupPosition || 'center');

    const win = new BrowserWindow({
        width: width,
        height: height,
        x: pos ? pos.x : undefined,
        y: pos ? pos.y : undefined,
        minWidth: 100, /* Allow very small width */
        minHeight: Math.max(50, minHeight), /* Ensure safety */
        resizable: !settings.windowLocked, // Use locked setting
        frame: false, 
        // titleBarStyle: 'hidden', // Removed to be fully frameless
        // titleBarOverlay: { ... }, // Removed to regain space
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        autoHideMenuBar: true
    });

    // Modified to load from src/index.html
    win.loadFile(path.join(__dirname, 'index.html'));
    mainWindow = win;

    // Save window size on close
    win.on('close', () => {
        try {
            const bounds = win.getBounds();
            const settingsPath = path.join(__dirname, '../settings.json');
            
            let currentSettings = {};
            if (fsSync.existsSync(settingsPath)) {
                currentSettings = JSON.parse(fsSync.readFileSync(settingsPath, 'utf8'));
            }
            
            // Only update if not locked (or update regardless? User said "window size lock" implies fixed size)
            // If locked, we shouldn't save new size?  
            // The user said: "After adjustment, enabled window lock -> closed -> saved."
            // This implies manual save.
            // But if user RESIZES (which implies not locked) and closes, it should save.
            // If locked, resize is disabled, so bounds won't change.
            // So saving current bounds is safe.
            
            currentSettings.windowWidth = bounds.width;
            currentSettings.windowHeight = bounds.height;
            
            fsSync.writeFileSync(settingsPath, JSON.stringify(currentSettings, null, 4), 'utf8');
        } catch (e) {
            console.error("Failed to save settings on close:", e);
        }
    });

    // Handle opening external links or apps
    win.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });
}

// IPC handler to launch apps (simulated)
ipcMain.handle('launch-app', async (event, appPath) => {
    try {
        console.log(`Launching: ${appPath}`);
        // In a real Windows env, you would use shell.openPath(appPath)
        // or child_process.execFile
        await shell.openPath(appPath); 
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Get Icon
ipcMain.handle('get-icon', async (event, appPath) => {
    try {
        let targetPath = appPath;
        // ショートカット(.lnk)の場合はリンク先を解決して本体のアイコンを取得する
        if (typeof appPath === 'string' && appPath.toLowerCase().endsWith('.lnk')) {
            try {
                const details = shell.readShortcutLink(appPath);
                if (details.target) {
                    targetPath = details.target;
                }
            } catch (err) {
                // リンク解決に失敗した場合は元のパスを使用
                console.warn(`Failed to resolve shortcut ${appPath}:`, err);
            }
        }

        const icon = await app.getFileIcon(targetPath, { size: 'large' });
        return icon.toDataURL();
    } catch (e) {
        return null; // Return null if failed, render will use default
    }
});

// Load Config
ipcMain.handle('load-config', async () => {
    try {
        const configPath = path.join(__dirname, '../apps.json');
        const data = await fs.readFile(configPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Failed to load config:", error);
        return [];
    }
});

// Save Config
ipcMain.handle('save-config', async (event, apps) => {
    try {
        const configPath = path.join(__dirname, '../apps.json');
        await fs.writeFile(configPath, JSON.stringify(apps, null, 4), 'utf8');
        return true;
    } catch (error) {
        console.error("Failed to save config:", error);
        return false;
    }
});

// Load Settings
ipcMain.handle('load-settings', async () => {
    const settings = await loadSettings();
    // Inject available background images from assets folder
    try {
        // Adjusted path to src/assets/images
        const imagesDir = path.join(__dirname, 'assets', 'images');
        // Check if directory exists
        const files = await fs.readdir(imagesDir).catch(() => []);
        
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        
        settings._availableImages = files
            .filter(file => imageExtensions.includes(path.extname(file).toLowerCase()))
            .map(file => `assets/images/${file}`); // Return relative paths for renderer (relative to src/)
    } catch (e) {
        // Ignore errors, just return empty list
        settings._availableImages = [];
    }
    return settings;
});

// Open Settings Window
ipcMain.on('open-settings', async () => {
    if (settingsWindow) {
        settingsWindow.focus();
        return;
    }

    const width = 450;
    const height = 650;
    let x, y;

    try {
        const mainBounds = mainWindow.getBounds();
        const display = screen.getDisplayMatching(mainBounds);
        const workArea = display.workArea;

        // Default: Align left with main window, place above main window
        x = mainBounds.x;
        y = mainBounds.y - height - 20;

        // Clamp Horizontal
        if (x < workArea.x) x = workArea.x + 10;
        if (x + width > workArea.x + workArea.width) x = workArea.x + workArea.width - width - 10;

        // Clamp Vertical
        // If placing above goes off-screen (top), try placing below
        if (y < workArea.y) {
            y = mainBounds.y + mainBounds.height + 20;
            // If placing below also goes off-screen (bottom), center vertically
            if (y + height > workArea.y + workArea.height) {
                y = workArea.y + (workArea.height - height) / 2;
            }
        }
    } catch (e) {
        // Fallback to center if calculation fails
        console.error("Failed to calculate position:", e);
    }

    settingsWindow = new BrowserWindow({
        width: width,
        height: height,
        x: x ? Math.round(x) : undefined,
        y: y ? Math.round(y) : undefined,
        center: !x, // Center if no coordinates
        resizable: true,
        frame: false, // Match iPad style
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        autoHideMenuBar: true,
        // parent: mainWindow, // Removed to allow independent positioning
    });

    // Modified to load from src/settings.html
    settingsWindow.loadFile(path.join(__dirname, 'settings.html'));

    settingsWindow.on('closed', () => {
        settingsWindow = null;
    });
});

// Save Settings
ipcMain.handle('save-settings', async (event, settings) => {
    try {
        const settingsPath = path.join(__dirname, 'settings.json');
        await fs.writeFile(settingsPath, JSON.stringify(settings, null, 4), 'utf8');
        // Update current window size/resizable if needed
        if (mainWindow) {
            mainWindow.setSize(parseInt(settings.windowWidth), parseInt(settings.windowHeight));
            
            // Snap to new position logic
            const pos = getWindowPosition(
                parseInt(settings.windowWidth), 
                parseInt(settings.windowHeight), 
                settings.startupPosition || 'center'
            );
            if (pos) {
                mainWindow.setPosition(pos.x, pos.y);
            }
            
            mainWindow.setResizable(!settings.windowLocked);
            
            // Update Minimum Size dynamically based on new settings
            const iconSize = settings.iconSize || 60;
            let minH;
            if (settings.customWindowPadding) {
                const p = settings.windowPaddingSize || 15;
                minH = iconSize + (p * 4); 
            } else {
                minH = iconSize * 2;
            }
            mainWindow.setMinimumSize(100, Math.max(50, minH));
            
            // Notify renderer
            mainWindow.webContents.send('settings-updated', settings);
        }
        return true;
    } catch (error) {
        console.error("Failed to save settings:", error);
        return false;
    }
});

// Select File Dialog
ipcMain.handle('select-file', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
            { name: 'Applications', extensions: ['exe', 'lnk', 'app'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    });
    if (result.canceled || result.filePaths.length === 0) {
        return null;
    }
    return result.filePaths[0];
});

// Select Image Dialog
ipcMain.handle('select-image', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
            { name: 'Images', extensions: ['jpg', 'png', 'jpeg', 'gif', 'webp'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    });
    if (result.canceled || result.filePaths.length === 0) {
        return null;
    }
    return result.filePaths[0];
});

// Window Controls
ipcMain.on('window-minimize', () => mainWindow?.minimize());
ipcMain.on('window-maximize', () => {
    if (mainWindow?.isMaximized()) {
        mainWindow.unmaximize();
    } else {
        mainWindow?.maximize();
    }
});
ipcMain.on('window-close', (event) => {
    const webContents = event.sender;
    const win = BrowserWindow.fromWebContents(webContents);
    if (win) win.close();
});

// Context Menu Logic
ipcMain.on('show-context-menu', (event, { context, index, parentIndex }) => {
    const template = [
        {
            label: 'Change Icon',
            click: async () => {
                const result = await dialog.showOpenDialog(mainWindow, {
                    properties: ['openFile'],
                    filters: [
                        // Displayable image formats only
                        { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'] }
                    ]
                });

                if (!result.canceled && result.filePaths.length > 0) {
                    // Send back the selected image path and the target identifiers
                    event.sender.send('app-icon-updated', {
                        context,
                        index,
                        parentIndex,
                        iconPath: result.filePaths[0]
                    });
                }
            }
        }
    ];
    const menu = Menu.buildFromTemplate(template);
    menu.popup({ window: BrowserWindow.fromWebContents(event.sender) });
});

app.whenReady().then(async () => {
    await ensureDataFiles();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
