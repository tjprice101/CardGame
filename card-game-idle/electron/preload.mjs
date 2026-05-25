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

contextBridge.exposeInMainWorld('pantheonSave', pantheonSave);