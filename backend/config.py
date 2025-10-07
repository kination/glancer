# backend/config.py
import os
from dotenv import load_dotenv

# Load environment variables from a .env file
load_dotenv()

# --- LLM Provider Configuration ---
# Determines which Language Model provider to use.
# Defaults to 'ollama' if not specified in the environment.
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "ollama")

# --- Ollama Specific Configuration ---
# Specifies the default model to be used with Ollama.
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma3:270m")
