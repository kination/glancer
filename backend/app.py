# backend/app.py
import atexit
import os
import subprocess
import sys
import time
import httpx
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import ollama
import platform

load_dotenv()

app = FastAPI()

# TODO: Allow origins during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    prompt: str

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "ollama")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma3:270m")  # Default to gemma:270m

# API endpoint for 'chat'
@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        if LLM_PROVIDER == "ollama":
            response = ollama.chat(
                model=OLLAMA_MODEL,
                messages=[{'role': 'user', 'content': request.prompt}],
            )
            return response
        elif LLM_PROVIDER == "openai":
            # TODO: Implement OpenAI API call
            # from openai import OpenAI
            # client = OpenAI(api_key="YOUR_OPENAI_API_KEY")
            # ...
            raise HTTPException(status_code=501, detail="OpenAI provider is not yet implemented.")
        elif LLM_PROVIDER == "gemini":
            # TODO: Implement Gemini API call
            raise HTTPException(status_code=501, detail="Gemini provider is not yet implemented.")
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported LLM provider: {LLM_PROVIDER}")

    except ollama.ResponseError as e:
        # Handle specific ollama errors, e.g., model not found
        raise HTTPException(status_code=500, detail=f"Ollama error: {e.error}")
    except ollama.ConnectError as e:
        # Handle connection errors
        raise HTTPException(status_code=503, detail=f"Could not connect to Ollama: {e}")
    except Exception as e:  # General exception
        # TODO: Need more detail error logging
        raise HTTPException(status_code=500, detail=str(e))

ollama_process = None

def is_ollama_running():
    """Check if the Ollama server is running."""
    try:
        # Use httpx for a quick, synchronous check.
        httpx.get("http://127.0.0.1:11434")
        return True
    except httpx.ConnectError:
        return False

def find_ollama_executable():
    """Find the path to the ollama executable."""
    # Case 1: Bundled with PyInstaller
    if getattr(sys, 'frozen', False) and hasattr(sys, '_MEIPASS'):
        # Running in a PyInstaller bundle
        bundle_dir = sys._MEIPASS
        ollama_path = os.path.join(bundle_dir, 'ollama')
        if platform.system() == "Windows":
            ollama_path += ".exe"
        if os.path.exists(ollama_path):
            return ollama_path

    # Case 2: Local development - check for executable in a project 'bin' directory
    # This allows running 'python app.py' without a system-wide ollama installation.
    # Assumes the script is run from the 'backend' directory or project root.
    local_bin_path = os.path.join(os.path.dirname(__file__), 'bin', 'ollama')
    if platform.system() == "Windows":
        local_bin_path += ".exe"
    
    if os.path.exists(local_bin_path):
        print(f"Found local ollama executable: {local_bin_path}")
        return local_bin_path
    else:
        print("Local ollama executable not found.")

    # Case 3: Fallback to system PATH (for local development)
    # from shutil import which
    # ollama_path = which('ollama')
    # if ollama_path:
    #     return ollama_path
    
    return None

def start_ollama():
    """Start the Ollama server as a background process."""
    global ollama_process
    if is_ollama_running():
        print("Ollama server is already running.")
        return

    ollama_executable = find_ollama_executable()
    if not ollama_executable:
        print("Ollama executable not found. Please install Ollama and ensure it's in the system's PATH.")
        # In a real application, you might want to exit or show a more user-friendly error.
        return

    print("Ollama server not found. Starting it in the background...")
    command = [ollama_executable, "serve"]
    
    creationflags = 0
    if platform.system() == "Windows":
        creationflags = subprocess.CREATE_NO_WINDOW

    ollama_process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, creationflags=creationflags)
    print(f"Ollama server started with PID: {ollama_process.pid}")
    time.sleep(5)  # Wait a moment for the server to initialize

def check_and_pull_model():
    """Check if the model is available locally and pull it if not."""
    try:
        print(f"Checking for model: {OLLAMA_MODEL}")
        local_models = ollama.list().get('models', [])
        model_names = [model['name'] for model in local_models if isinstance(model, dict) and 'name' in model]

        if OLLAMA_MODEL in model_names:
            print(f"Model '{OLLAMA_MODEL}' already exists locally.")
            return

        print(f"Model '{OLLAMA_MODEL}' not found. Pulling from Ollama Hub. This may take a while...")
        # A simple, non-streaming pull command.
        ollama.pull(OLLAMA_MODEL)
        print(f"Model '{OLLAMA_MODEL}' pull complete.")
    except Exception as e:
        print(f"An error occurred while pulling the model: {e}")
        # Depending on the desired behavior, you might want to exit or raise an exception

def main():
    if LLM_PROVIDER == "ollama":
        start_ollama()
        check_and_pull_model()
    uvicorn.run(app, host="127.0.0.1", port=5001)

if __name__ == "__main__":
    # Ensure the started ollama process is terminated when the app exits
    if ollama_process:
        atexit.register(ollama_process.terminate)
    main()
