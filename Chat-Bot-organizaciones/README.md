# Asistente Virtual ISFDyT Nº 59 🤖

Chatbot institucional desarrollado con **FastAPI**, **Google Gemini API** y un frontend web, diseñado específicamente para responder las consultas de los estudiantes del Instituto Superior de Formación Docente y Técnica Nº 59.

## 🚀 Estructura del Proyecto

```text
ChatBot-isfdyt59/
│
├── backend/
│   └── main.py          # Servidor principal con FastAPI y lógica de la IA
├── frontend/
│   └── index.html       # Interfaz de usuario (HTML, CSS y JavaScript)
├── .env                 # Variables de entorno (NO se sube a GitHub por seguridad)
├── .gitignore           # Archivos ignorados por Git
├── informacion.txt      # Base de conocimientos local del instituto
└── README.md            # Documentación y guía del proyecto
```

## 🛠️ Tecnologías Utilizadas

* **Backend**: Python, FastAPI, Uvicorn, Google GenAI SDK (`gemini-1.5-flash`), Python-Dotenv.
* **Frontend**: HTML5, CSS3, JavaScript (Fetch API), Marked.js (para procesar el texto).
* **Control de Versiones**: Git y GitHub.

## ⚙️ Guía de Instalación para el Equipo

Si eres integrante del equipo de desarrollo, sigue estos pasos para clonar y poner en marcha el proyecto en tu computadora local:

### 1. Clonar el repositorio
Abre tu terminal y ejecuta:
```bash
git clone https://github.com/NicolasRuau/Chat-Bot-organizaciones.git
cd Chat-Bot-organizaciones
```

### 2. Configurar el Entorno Virtual de Python
Crea y activa un entorno virtual en la raíz del proyecto para instalar las dependencias sin afectar tu sistema:

**En Windows (Git Bash o PowerShell):**
```bash
python -m venv .venv
.venv\Scripts\Activate
```

### 3. Instalar las dependencias
Con el entorno activado, instala las librerías necesarias ejecutando:
```bash
pip install fastapi uvicorn pydantic google-genai python-dotenv
```

### 4. Configurar tus Credenciales (Muy Importante)
1. Crea un archivo llamado exactamente **`.env`** en la carpeta principal del proyecto.
2. Solicita una API Key gratuita con tu cuenta de Google en [Google AI Studio](https://aistudio.google.com/).
3. Pega tu clave dentro del archivo `.env` de la siguiente manera:
```env
GEMINI_API_KEY=tu_clave_de_api_aqui
```
*(Nota: El archivo `.env` está ignorado en Git para que tus claves privadas nunca se suban a la nube).*

## ▶️ Cómo Ejecutar el Proyecto

Para probar el chatbot, necesitas levantar el servidor y abrir la página web.

### 1. Iniciar el Servidor (Backend)
Desde tu terminal, entra a la carpeta del backend y ejecuta FastAPI:
```bash
cd backend
python -m uvicorn main:app --reload
```
*(El servidor quedará funcionando en `http://127.0.0.1:8000`)*

### 2. Abrir el Chat (Frontend)
Abre el archivo **`frontend/index.html`** usando la extensión **Live Server** de Visual Studio Code, o simplemente haz doble clic en el archivo para abrirlo en tu navegador web. ¡Ya puedes chatear con el asistente!