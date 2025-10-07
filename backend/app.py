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

from config import LLM_PROVIDER, OLLAMA_MODEL
from utils import start_ollama, check_and_pull_model
from llm import handle_chat_request

# Load environment variables

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

# Pydantic model for the chat request body
class ChatRequest(BaseModel):
    prompt: str

@app.post("/api/chat")
async def chat(request: ChatRequest):
    """
    API endpoint to handle chat requests.
    It receives a prompt and returns a response from the configured language model.
    """
    try:
        # Delegate the chat logic to the handler in the llm module
        return await handle_chat_request(request.prompt)
    except ollama.ResponseError as e:
        # Handle specific Ollama errors, e.g., model not found
        raise HTTPException(status_code=500, detail=f"Ollama error: {e.error}")
    except ollama.ConnectError as e:
        # Handle connection errors to the Ollama server
        raise HTTPException(status_code=503, detail=f"Could not connect to Ollama: {e}")
    except Exception as e:  # General exception
        # Catch any other exceptions and return a generic server error.
        # TODO: Implement more detailed error logging for better debugging.
        raise HTTPException(status_code=500, detail=str(e))

def main():
    """
    Main function to run the backend server.
    If Ollama is the selected provider, it ensures the server is running
    and the required model is downloaded before starting the FastAPI app.
    """
    if LLM_PROVIDER == "ollama":
        start_ollama()
        check_and_pull_model()
    uvicorn.run(app, host="127.0.0.1", port=5001)

if __name__ == "__main__":
    # This block runs when the script is executed directly.
    main()
