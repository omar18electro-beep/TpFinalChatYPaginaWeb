import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

app = FastAPI(title="Asistente ISFDyT 59")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str

@app.get("/")
def root():
    return {"status": "ok", "message": "Asistente ISFDyT 59 con IA de Google"}

@app.post("/chat")
def chat(request: ChatRequest):
    try:
        try:
            # Lee el archivo de información desde la carpeta raíz del proyecto
            with open("../informacion.txt", "r", encoding="utf-8") as file:
                informacion_instituto = file.read()
        except FileNotFoundError:
            informacion_instituto = "Error: No se encontró el archivo informacion.txt."

        prompt_completo = f"""Eres el asistente virtual oficial del instituto ISFDyT Nº 59. 
        Tu trabajo es responder las dudas de los alumnos basándote estrictamente en la siguiente información:

        {informacion_instituto}

        Pregunta del alumno: {request.message}"""

        response = client.models.generate_content(
            model='gemini-3.5-flash',
            contents=prompt_completo,
        )
        
        return {"response": response.text}
        
    except Exception as e:
        print(f"Error detallado en Gemini: {e}")
        raise HTTPException(status_code=500, detail=str(e))