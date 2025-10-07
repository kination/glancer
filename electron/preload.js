import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  chatWithLLM: (prompt) => ipcRenderer.invoke('chat-llm', prompt),
});
