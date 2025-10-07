# backend/utils.py
import atexit
import os
import platform
import subprocess
import sys
import time
import httpx
import ollama

from config import OLLAMA_MODEL

ollama_process = None

def is_ollama_running():
    """
    Checks if the Ollama server is running and accessible at its default address.
    """
    try:
        # A quick synchronous GET request to the Ollama server's root.
        httpx.get("http://127.0.0.1:11434")
        return True
    except httpx.ConnectError:
        return False

def find_ollama_executable():
    """
    Finds the path to the Ollama executable, prioritizing a bundled version.
    This allows the application to run without a system-wide Ollama installation.
    Search order:
    1. Bundled with PyInstaller (_MEIPASS).
    2. A local 'bin' directory within the project.
    (Deleted) 3. System's PATH. <- Removed for security concern
    """
    # Case 1: Bundled with PyInstaller. `_MEIPASS` is a temporary directory created by PyInstaller.
    if getattr(sys, 'frozen', False) and hasattr(sys, '_MEIPASS'):
        # In a packaged app, 'ollama' is an external resource next to the main executable.
        # sys.executable is the path to 'backend_server'. We look in the same directory.
        executable_dir = os.path.dirname(sys.executable)
        ollama_path = os.path.join(executable_dir, 'ollama.exe' if platform.system() == "Windows" else 'ollama')
        if os.path.exists(ollama_path):
            print(f"Found packaged ollama executable: {ollama_path}")
            return ollama_path

    # Case 2: Local development - check for an executable in a project 'bin' directory.
    local_bin_path = os.path.join(os.path.dirname(__file__), 'bin', 'ollama.exe' if platform.system() == "Windows" else 'ollama')
    if os.path.exists(local_bin_path):
        print(f"Found local ollama executable: {local_bin_path}")
        return local_bin_path

    # Case 3: Fallback to system PATH.
    # from shutil import which
    # ollama_path = which('ollama')
    # if ollama_path:
    #     return ollama_path
    
    return None

def start_ollama():
    """
    Starts the Ollama server as a background process if it's not already running.
    It finds the executable and runs 'ollama serve'.
    """
    global ollama_process
    if is_ollama_running():
        print("Ollama server is already running.")
        return

    ollama_executable = find_ollama_executable()
    if not ollama_executable:
        print("Ollama executable not found. Please install Ollama or place it in the 'backend/bin' directory.")
        return

    print("Ollama server not found. Starting it in the background...")
    command = [ollama_executable, "serve"]
    
    # For Windows, use CREATE_NO_WINDOW to prevent a console window from appearing.
    creationflags = subprocess.CREATE_NO_WINDOW if platform.system() == "Windows" else 0

    ollama_process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, creationflags=creationflags)
    print(f"Ollama server started with PID: {ollama_process.pid}")
    # Register the termination of the process when the application exits.
    atexit.register(ollama_process.terminate)
    time.sleep(5)  # Wait a moment for the server to initialize.

def check_and_pull_model():
    """
    Checks if the required Ollama model is available locally and pulls it if not.
    """
    try:
        print(f"Checking for model: {OLLAMA_MODEL}")
        local_models = [model['name'] for model in ollama.list().get('models', [])]
        if OLLAMA_MODEL in local_models:
            print(f"Model '{OLLAMA_MODEL}' already exists locally.")
            return

        print(f"Model '{OLLAMA_MODEL}' not found. Pulling from Ollama Hub. This may take a while...")
        ollama.pull(OLLAMA_MODEL)
        print(f"Model '{OLLAMA_MODEL}' pull complete.")
    except Exception as e:
        print(f"An error occurred while pulling the model: {e}")