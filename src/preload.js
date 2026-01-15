const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    launchApp: (path) => ipcRenderer.invoke('launch-app', path),
    getIcon: (path) => ipcRenderer.invoke('get-icon', path),
    loadConfig: () => ipcRenderer.invoke('load-config'),
    saveConfig: (apps) => ipcRenderer.invoke('save-config', apps),
    loadSettings: () => ipcRenderer.invoke('load-settings'),
    saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
    selectFile: () => ipcRenderer.invoke('select-file'),
    selectImage: () => ipcRenderer.invoke('select-image'),
    send: (channel, data) => ipcRenderer.send(channel, data),
    
    // Context Menu & Icon Updates
    showContextMenu: (data) => ipcRenderer.send('show-context-menu', data),
    
    /* 追加: バージョン情報の取得と外部リンクを開く機能 */
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    openExternalLink: (url) => ipcRenderer.send('open-external-link', url),

    on: (channel, func) => {
        // Allow list extension
        const validChannels = ['settings-updated', 'app-icon-updated'];
        if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
    }
});
