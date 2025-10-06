"use strict";const e=require("electron");e.contextBridge.exposeInMainWorld("electronAPI",{chatWithLLM:t=>e.ipcRenderer.invoke("chat-llm",t)});
