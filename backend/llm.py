# backend/llm.py
import ollama
from fastapi import HTTPException

from config import LLM_PROVIDER, OLLAMA_MODEL

async def handle_chat_request(prompt: str):
    """
    Handles the chat request by routing it to the configured LLM provider.
    Currently supports Ollama and has placeholders for OpenAI and Gemini.

    Args:
        prompt: The user's prompt for the language model.

    Returns:
        The response from the language model.
    
    Raises:
        HTTPException: If the provider is unsupported or an API call fails.
    """
    if LLM_PROVIDER == "ollama":
        response = ollama.chat(
            model=OLLAMA_MODEL,
            messages=[{'role': 'user', 'content': prompt}],
        )
        return response
    elif LLM_PROVIDER == "openai":
        # TODO: Implement OpenAI API call using the 'openai' library.
        raise HTTPException(status_code=501, detail="OpenAI provider is not yet implemented.")
    elif LLM_PROVIDER == "gemini":
        # TODO: Implement Gemini API call using 'google-generativeai' library.
        raise HTTPException(status_code=501, detail="Gemini provider is not yet implemented.")
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported LLM provider: {LLM_PROVIDER}")