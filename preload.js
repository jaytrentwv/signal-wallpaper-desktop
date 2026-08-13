'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('signalDesktop', {
  isDesktop: true,
  platform: process.platform,
  saveFile: async (fileName, data) => {
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    return ipcRenderer.invoke('desktop:save-file', { fileName, data: bytes });
  },
  chooseImage: () => ipcRenderer.invoke('desktop:open-image-dialog'),
  onOpenImage: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('desktop-open-image', handler);
    return () => ipcRenderer.removeListener('desktop-open-image', handler);
  }
});
