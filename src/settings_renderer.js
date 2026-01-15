// Manage Settings Window Logic

const winCloseBtn = document.getElementById('win-close');
const saveSettingsBtn = document.getElementById('save-settings');
const resetSettingsBtn = document.getElementById('reset-settings');
const header = document.getElementById('settings-header'); // Get header

// Smart Sticky Header Logic (Hide on scroll down, Show on scroll up)
let lastScrollTop = 0;
const delta = 5;
const navbarHeight = header ? header.offsetHeight : 50;

window.addEventListener('scroll', function() {
    if (!header) return;
    
    let st = window.pageYOffset || document.documentElement.scrollTop;
    
    // Bounce effect handling (Safari/Bounce scroll)
    if (Math.abs(lastScrollTop - st) <= delta) return;
    
    // If scrolled down and past the navbar, hide it
    if (st > lastScrollTop && st > navbarHeight){
        // Scroll Down
        header.classList.add('nav-up');
    } else {
        // Scroll Up
        if(st + window.innerHeight < document.documentElement.scrollHeight) {
            header.classList.remove('nav-up');
        }
    }
    
    lastScrollTop = st;
});

// Form Elements
const iconSizeRange = document.getElementById('icon-size-range');
const iconSizeValue = document.getElementById('icon-size-value');
const appGapRange = document.getElementById('app-gap-range');
const appGapValue = document.getElementById('app-gap-value');
const folderGapRange = document.getElementById('folder-gap-range');
const folderGapValue = document.getElementById('folder-gap-value');
const customPaddingCheck = document.getElementById('custom-padding-check');
const paddingInputGroup = document.getElementById('padding-input-group');
const windowPaddingInput = document.getElementById('window-padding-input');
const windowPaddingHInput = document.getElementById('window-padding-h-input');
const winWidthInput = document.getElementById('win-width');
const winHeightInput = document.getElementById('win-height');
const startupPositionInput = document.getElementById('startup-position');
const showSearchInput = document.getElementById('show-search');
const showScrollInput = document.getElementById('show-scroll');
// Renamed Inputs
const showDesktopNamesInput = document.getElementById('show-desktop-names');
const showFolderContentNamesInput = document.getElementById('show-folder-content-names');
const oneRowModeInput = document.getElementById('one-row-mode');
const invertScrollInput = document.getElementById('invert-scroll');
const lockWindowInput = document.getElementById('lock-window');
const compactMenuInput = document.getElementById('compact-menu');
const bgUrlInput = document.getElementById('bg-url');
const bgBrowseBtn = document.getElementById('bg-browse-btn');
const bgPositionInput = document.getElementById('bg-position');

// New Elements for Background Selection
const bgPreview = document.getElementById('bg-preview');
const bgGrid = document.getElementById('bg-grid');

// New Elements
const enableFolderRename = document.getElementById('enable-folder-rename');
const enableAppRename = document.getElementById('enable-app-rename');
const desktopNameColor = document.getElementById('desktop-name-color');
const desktopNameBold = document.getElementById('desktop-name-bold');

let currentSettings = {};

if (winCloseBtn) {
    winCloseBtn.onclick = () => {
        window.electronAPI.send('window-close');
    };
}

async function init() {
    if (window.electronAPI) {
        currentSettings = await window.electronAPI.loadSettings();
        populateForm(currentSettings);
    }
}

function populateForm(settings) {
    if (!settings) return;

    iconSizeRange.value = settings.iconSize || 60;
    iconSizeValue.textContent = `${settings.iconSize || 60}px`;
    
    appGapRange.value = settings.appGap || 30;
    appGapValue.textContent = `${settings.appGap || 30}px`;
    
    folderGapRange.value = settings.folderGap !== undefined ? settings.folderGap : 20;
    folderGapValue.textContent = `${settings.folderGap !== undefined ? settings.folderGap : 20}px`;
    
    customPaddingCheck.checked = settings.customWindowPadding || false;
    windowPaddingInput.value = settings.windowPaddingSize !== undefined ? settings.windowPaddingSize : 15;
    windowPaddingHInput.value = settings.windowPaddingSizeH !== undefined ? settings.windowPaddingSizeH : 20;
    paddingInputGroup.style.display = customPaddingCheck.checked ? 'block' : 'none';

    winWidthInput.value = settings.windowWidth || 650;
    winHeightInput.value = settings.windowHeight || 150;
    if(startupPositionInput) startupPositionInput.value = settings.startupPosition || 'center';
    
    showSearchInput.checked = settings.showSearch !== false;
    showScrollInput.checked = settings.showScroll !== false;
    
    // Mapped Settings
    // Fallback for compatibility if old keys exist but new ones don't
    if (settings.showDesktopNames !== undefined) {
        showDesktopNamesInput.checked = settings.showDesktopNames;
    } else {
        // Migration: use old showFolderNames if available, else true
        showDesktopNamesInput.checked = settings.showFolderNames !== false; 
    }

    if (settings.showFolderContentNames !== undefined) {
        showFolderContentNamesInput.checked = settings.showFolderContentNames;
    } else {
         // Migration: use old showAppNames if available, else true
        showFolderContentNamesInput.checked = settings.showAppNames !== false;
    }

    oneRowModeInput.checked = settings.oneRowMode === true;
    invertScrollInput.checked = settings.invertScrollDirection === true;
    lockWindowInput.checked = settings.windowLocked === true;
    if(compactMenuInput) compactMenuInput.checked = settings.compactMenu === true;
    
    bgUrlInput.value = settings.backgroundImage || '';
    bgPositionInput.value = settings.backgroundPosition || 'center center';

    // Populate Background Grid (Received from main via _availableImages)
    if (settings._availableImages && bgGrid) {
        bgGrid.innerHTML = '';
        settings._availableImages.forEach(img => {
            const el = document.createElement('div');
            el.className = 'bg-option';
            // Use logical path for CSS
            el.style.backgroundImage = `url('${img}')`;
            
            // Check if selected
            if (settings.backgroundImage === img) {
                el.classList.add('active');
            }

            el.onclick = () => {
                bgUrlInput.value = img;
                updatePreview(img);
                
                // Update active state
                document.querySelectorAll('.bg-option').forEach(opt => opt.classList.remove('active'));
                el.classList.add('active');
            };
            bgGrid.appendChild(el);
        });
    }
    
    // Initial Preview
    updatePreview(settings.backgroundImage);

    // New Fields
    if(enableFolderRename) enableFolderRename.checked = settings.enableFolderRename !== false;
    if(enableAppRename) enableAppRename.checked = settings.enableAppRename === true;
    if(desktopNameColor) desktopNameColor.value = settings.desktopNameColor || '#ffffff';
    if(desktopNameBold) desktopNameBold.checked = settings.desktopNameBold === true;
}

function updatePreview(url) {
    if (!bgPreview) return;
    if (!url) {
        bgPreview.style.backgroundImage = 'none';
        return;
    }
    
    let cssUrl = url.replace(/\\/g, '/');
    // Handle local absolute paths vs relative assets vs http
    if (!cssUrl.startsWith('http') && !cssUrl.startsWith('assets/')) {
        cssUrl = `file:///${cssUrl}`;
    }
    
    bgPreview.style.backgroundImage = `url('${cssUrl}')`;
}

// Event Listeners
iconSizeRange.oninput = (e) => {
    iconSizeValue.textContent = `${e.target.value}px`;
};
appGapRange.oninput = (e) => {
    appGapValue.textContent = `${e.target.value}px`;
};
folderGapRange.oninput = (e) => {
    folderGapValue.textContent = `${e.target.value}px`;
};
customPaddingCheck.onchange = () => {
    paddingInputGroup.style.display = customPaddingCheck.checked ? 'block' : 'none';
};

// Sync preview on manual input
bgUrlInput.oninput = (e) => {
    updatePreview(e.target.value);
    // Remove active state from grid since manual edit might differ
    document.querySelectorAll('.bg-option').forEach(opt => opt.classList.remove('active'));
};

bgBrowseBtn.onclick = async () => {
    if (window.electronAPI) {
        const filePath = await window.electronAPI.selectImage();
        if (filePath) {
            bgUrlInput.value = filePath;
            updatePreview(filePath);
        }
    }
};

saveSettingsBtn.onclick = async () => {
    const newSettings = {
        iconSize: parseInt(iconSizeRange.value),
        appGap: parseInt(appGapRange.value),
        folderGap: parseInt(folderGapRange.value),
        customWindowPadding: customPaddingCheck.checked,
        windowPaddingSize: windowPaddingInput.value === '' ? undefined : parseInt(windowPaddingInput.value),
        windowPaddingSizeH: windowPaddingHInput.value === '' ? undefined : parseInt(windowPaddingHInput.value),
        windowWidth: parseInt(winWidthInput.value),
        windowHeight: parseInt(winHeightInput.value),
        startupPosition: startupPositionInput.value,
        backgroundImage: bgUrlInput.value,
        backgroundPosition: bgPositionInput.value,
        showSearch: showSearchInput.checked,
        showScroll: showScrollInput.checked,
        // New Keys
        showDesktopNames: showDesktopNamesInput.checked,
        showFolderContentNames: showFolderContentNamesInput.checked,
        // Keep old keys synced for safety/backward compat if needed? 
        // Or just Drop them. Let's drop them to clean up.
        // showAppNames: showFolderContentNamesInput.checked, 
        // showFolderNames: showDesktopNamesInput.checked,

        oneRowMode: oneRowModeInput.checked,
        invertScrollDirection: invertScrollInput.checked,
        windowLocked: lockWindowInput.checked,
        compactMenu: compactMenuInput.checked,
        // New Settings
        enableFolderRename: enableFolderRename.checked,
        enableAppRename: enableAppRename.checked,
        desktopNameColor: desktopNameColor.value,
        desktopNameBold: desktopNameBold.checked
    };

    if (window.electronAPI) {
        const success = await window.electronAPI.saveSettings(newSettings);
        if (success) {
            window.electronAPI.send('window-close'); // Close settings window after save
        }
    }
};

resetSettingsBtn.onclick = async () => {
    if (confirm('Are you sure you want to reset all settings to default?')) {
        const defaultSettings = {
            windowWidth: 650,
            windowHeight: 135,
            startupPosition: 'bottom-left', // bottom left
            iconSize: 80,
            appGap: 5,
            folderGap: 5,
            customWindowPadding: true,
            windowPaddingSize: 5,
            windowPaddingSizeH: 5,
            showSearch: false, // off
            showScroll: false, // off
            showDesktopNames: true, // on
            showFolderContentNames: true, // on
            oneRowMode: true,
            invertScrollDirection: false,
            windowLocked: false,
            compactMenu: false, // off
            backgroundPosition: 'center center',
            backgroundImage: "assets/images/settings-bg-default.png",
            enableFolderRename: true,
            enableAppRename: false,
            desktopNameColor: '#ffffff',
            desktopNameBold: false 
        };
        
        if (window.electronAPI) {
            const success = await window.electronAPI.saveSettings(defaultSettings);
            if (success) {
                populateForm(defaultSettings);
                // Optionally close or just refresh form
                // window.electronAPI.send('window-close');
            }
        }
    }
};

// App Initialization
document.addEventListener('DOMContentLoaded', () => {
    init();

    loadApps();

    // Display App Version
    window.electronAPI.getAppVersion().then(version => {
        document.getElementById('app-version').textContent = `v${version}`;
    });

    // Handle License Link
    document.getElementById('license-link').addEventListener('click', (e) => {
        e.preventDefault();
        window.electronAPI.openExternalLink('https://github.com/ponz-NK/FrostyPad/blob/main/LICENSE');
    });
});

function loadApps() {
    // ...existing code...
}