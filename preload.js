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
    send: (channel, data) => ipcRenderer.send(channel, data), // Generic send for controls
    on: (channel, func) => {
        const validChannels = ['settings-updated'];
        if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
    }
});
