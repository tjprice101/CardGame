import { contextBridge, ipcRenderer } from 'electron';

const pantheonSave = {
  read() {
    return ipcRenderer.sendSync('pantheon-save:read');
  },
  write(payload) {
    return ipcRenderer.sendSync('pantheon-save:write', payload);
  },
  remove() {
    return ipcRenderer.sendSync('pantheon-save:remove');
  },
};

const pantheonNotify = {
  isFocused() {
    return ipcRenderer.sendSync('pantheon-notify:is-focused') === true;
  },
  show(payload) {
    return ipcRenderer.invoke('pantheon-notify:show', payload);
  },
};

const pantheonAssets = {
  listMainMenuBackgrounds() {
    return ipcRenderer.invoke('pantheon-assets:list-main-menu-backgrounds');
  },
};

contextBridge.exposeInMainWorld('pantheonSave', pantheonSave);
contextBridge.exposeInMainWorld('pantheonNotify', pantheonNotify);
contextBridge.exposeInMainWorld('pantheonAssets', pantheonAssets);