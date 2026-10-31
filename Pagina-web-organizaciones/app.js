/* ==========================================================
   Terraform Cyberspace — comportamiento de la página
   ========================================================== */

/* ===== Configuración ===== */
const CONFIG = {
    // URL del backend del chat (FastAPI).
    // En desarrollo: el backend local. En producción, si nginx hace de proxy
    // en el mismo dominio, alcanza con '/chat'.
    chatApiUrl: 'http://127.0.0.1:8000/chat',
    chatTimeoutMs: 30000
};

/* ===== Contenido del panel informativo ===== */
const SECCIONES = {
    inicio: {
        titulo: 'Terraform Cyberspace',
        texto: 'Somos Terraform Cyberspace, una empresa dedicada a crear soluciones digitales inteligentes. Desarrollamos páginas web modernas y funcionales, e implementamos sistemas de inteligencia artificial que potencian la experiencia del usuario y transforman ideas en plataformas innovadoras.'
    },
    quienes: {
        titulo: '¿Quiénes somos?',
        texto: 'Somos Terraform Cyberspace, expertos en IA y desarrollo web.'
    },
    servicios: {
        titulo: 'Servicios',
        texto: 'Ofrecemos servicios de programación, diseño web y soluciones inteligentes.'
    },
    contacto: {
        titulo: 'Contacto',
        texto: 'Contactanos en ',
        enlace: { label: 'contacto@terraformcyberspace.com', href: 'mailto:contacto@terraformcyberspace.com' },
        cierre: '.'
    },
    soporte: {
        titulo: 'Soporte',
        texto: 'Soporte técnico disponible las 24 horas.'
    },
    noticias: {
        titulo: 'Noticias',
        texto: 'Próximamente lanzaremos nuevas funcionalidades en nuestra plataforma.'
    }
};

/* ==========================================================
   Panel informativo (botones del menú)
   ========================================================== */
const nav = document.getElementById('nav');
const panelTitulo = document.getElementById('panel-titulo');
const panelTexto = document.getElementById('panel-texto');

function mostrarSeccion(clave) {
    const seccion = SECCIONES[clave];
    if (!seccion) return;

    panelTitulo.textContent = seccion.titulo;
    panelTexto.textContent = seccion.texto;

    if (seccion.enlace) {
        const a = document.createElement('a');
        a.href = seccion.enlace.href;
        a.textContent = seccion.enlace.label;
        panelTexto.append(a);
        if (seccion.cierre) panelTexto.append(seccion.cierre);
    }

    nav.querySelectorAll('button').forEach(boton => {
        const activo = boton.dataset.seccion === clave;
        boton.classList.toggle('activo', activo);
        boton.setAttribute('aria-pressed', String(activo));
    });
}

nav.addEventListener('click', evento => {
    const boton = evento.target.closest('button[data-seccion]');
    if (boton) mostrarSeccion(boton.dataset.seccion);
});

mostrarSeccion('inicio');
document.getElementById('anio').textContent = new Date().getFullYear();

/* ==========================================================
   Chat flotante
   ========================================================== */
const chatToggle = document.getElementById('chat-toggle');
const chatWindow = document.getElementById('chat-container');
const chatClose = document.getElementById('chat-close');
const chatBox = document.getElementById('chat-box');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatSend = document.getElementById('chat-send');

function setChatOpen(abierto) {
    chatWindow.classList.toggle('show', abierto);
    chatWindow.inert = !abierto;               // evita que se enfoque estando cerrado
    chatToggle.setAttribute('aria-expanded', String(abierto));
    chatToggle.setAttribute('aria-label', abierto ? 'Cerrar chat' : 'Abrir chat');
    if (abierto) chatInput.focus();
}

chatToggle.addEventListener('click', () => {
    setChatOpen(!chatWindow.classList.contains('show'));
});
chatClose.addEventListener('click', () => {
    setChatOpen(false);
    chatToggle.focus();
});
document.addEventListener('keydown', evento => {
    if (evento.key === 'Escape' && chatWindow.classList.contains('show')) {
        setChatOpen(false);
        chatToggle.focus();
    }
});

setChatOpen(false);

/* Agrega una burbuja al chat. Los mensajes del usuario siempre van como texto
   plano; los del bot pueden venir en Markdown y se sanitizan antes de mostrarse. */
function agregarMensaje(contenido, tipo, { markdown = false, escribiendo = false } = {}) {
    const burbuja = document.createElement('div');
    burbuja.className = `message ${tipo}`;

    if (escribiendo) {
        burbuja.classList.add('typing');
        burbuja.setAttribute('aria-label', 'Escribiendo');
        for (let i = 0; i < 3; i++) {
            const punto = document.createElement('span');
            punto.className = 'dot';
            burbuja.append(punto);
        }
    } else if (markdown && window.marked && window.DOMPurify) {
        burbuja.innerHTML = DOMPurify.sanitize(marked.parse(contenido, { breaks: true }));
        burbuja.querySelectorAll('a').forEach(enlace => {
            enlace.target = '_blank';
            enlace.rel = 'noopener noreferrer';
        });
    } else {
        burbuja.textContent = contenido;
    }

    chatBox.append(burbuja);
    chatBox.scrollTop = chatBox.scrollHeight;
    return burbuja;
}

async function enviarMensaje(texto) {
    agregarMensaje(texto, 'user-message');
    chatSend.disabled = true;
    const indicador = agregarMensaje('', 'bot-message', { escribiendo: true });

    const controlador = new AbortController();
    const temporizador = setTimeout(() => controlador.abort(), CONFIG.chatTimeoutMs);

    try {
        const respuesta = await fetch(CONFIG.chatApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: texto }),
            signal: controlador.signal
        });
        if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);

        const datos = await respuesta.json();
        indicador.remove();
        agregarMensaje(datos.response || 'No recibí una respuesta.', 'bot-message', { markdown: true });
    } catch (error) {
        indicador.remove();
        const aviso = error.name === 'AbortError'
            ? 'La consulta tardó demasiado. Probá de nuevo.'
            : 'No pude conectarme con el servidor. Probá de nuevo en un momento.';
        agregarMensaje(aviso, 'bot-message');
    } finally {
        clearTimeout(temporizador);
        chatSend.disabled = false;
        chatInput.focus();
    }
}

chatForm.addEventListener('submit', evento => {
    evento.preventDefault();
    const texto = chatInput.value.trim();
    if (!texto || chatSend.disabled) return;
    chatInput.value = '';
    enviarMensaje(texto);
});