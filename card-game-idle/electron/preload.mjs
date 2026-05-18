import { contextBridge, ipcRenderer } from 'electron';

const heavenlySave = {
  read() {
    return ipcRenderer.sendSync('heavenly-save:read');
  },
  write(payload) {
    return ipcRenderer.sendSync('heavenly-save:write', payload);
  },
  remove() {
    return ipcRenderer.sendSync('heavenly-save:remove');
  },
};

contextBridge.exposeInMainWorld('heavenlySave', heavenlySave);