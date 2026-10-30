import os
import time
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

# Modelo principal y modelos de respaldo, en orden de preferencia
MODELOS = ["gemini-3.5-flash", "gemini-2.5-flash"]
REINTENTOS_POR_MODELO = 3

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


def es_error_temporal(e: Exception) -> bool:
    texto = str(e)
    return "503" in texto or "UNAVAILABLE" in texto or "429" in texto


def generar_respuesta(prompt: str) -> str:
    ultimo_error = None
    for modelo in MODELOS:
        espera = 1
        for intento in range(REINTENTOS_POR_MODELO):
            try:
                response = client.models.generate_content(
                    model=modelo,
                    contents=prompt,
                )
                return response.text
            except Exception as e:
                ultimo_error = e
                print(f"[{modelo}] intento {intento + 1} falló: {e}")
                if not es_error_temporal(e):
                    raise  # error real (API key, request mal formado, etc.)
                if intento < REINTENTOS_POR_MODELO - 1:
                    time.sleep(espera)
                    espera *= 2  # 1s, 2s
        print(f"Cambiando de modelo tras fallar {modelo}")
    raise ultimo_error


@app.get("/")
def root():
    return {"status": "ok", "message": "Asistente ISFDyT 59 con IA de Google"}


@app.post("/chat")
def chat(request: ChatRequest):
    try:
        with open("../informacion.txt", "r", encoding="utf-8") as file:
            informacion_instituto = file.read()
    except FileNotFoundError:
        informacion_instituto = "Error: No se encontró el archivo informacion.txt."

    prompt_completo = f"""Eres el asistente virtual oficial del instituto ISFDyT Nº 59. 
    Tu trabajo es responder las dudas de los alumnos basándote estrictamente en la siguiente información:

    {informacion_instituto}

    Pregunta del alumno: {request.message}"""

    try:
        return {"response": generar_respuesta(prompt_completo)}
    except Exception as e:
        print(f"Error detallado en Gemini: {e}")
        if es_error_temporal(e):
            raise HTTPException(
                status_code=503,
                detail="El asistente está con mucha demanda. Probá de nuevo en unos segundos.",
            )
        raise HTTPException(status_code=500, detail="Error interno del asistente.")
