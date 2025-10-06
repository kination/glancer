# backend/app.py
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import ollama

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

# API endpoint for 'chat'
@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        # TODO:
        # - Setup model as an option (currently use llama3)
        # - Add 'system' role for future
        response = ollama.chat(
            model='llama3',
            messages=[{'role': 'user', 'content': request.prompt}],
        )
        return response
    except Exception as e:
        # TODO: Need more detail error logging
        return {"error": str(e)}

def main():
    uvicorn.run(app, host="127.0.0.1", port=5001)

if __name__ == "__main__":
    main()
