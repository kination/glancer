// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge } from 'electron';

// You can expose APIs from your main process to your renderer process here.
// Note: This is a simple example. In a real app, you'll want to be more
// selective about what you expose.
contextBridge.exposeInMainWorld('myAPI', {
  // exampleFunction: () => 'Hello from preload!'
});
