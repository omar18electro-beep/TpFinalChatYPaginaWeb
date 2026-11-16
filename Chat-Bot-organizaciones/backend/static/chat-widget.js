/*!
 * chat-widget.js — Carlitos, asistente virtual del ISFDyT N° 59
 *
 * Uso: una sola línea antes de </body> en la página donde se quiere el chat
 *
 *   <script src="https://TU-SERVIDOR/chat-widget.js" defer></script>
 *
 * Opciones (atributos data- del <script>; todas son opcionales):
 *   data-api          URL del endpoint /chat. Por defecto: /chat en el mismo servidor que sirve este archivo.
 *   data-title        Título de la ventana (por defecto "ISFDyT N° 59").
 *   data-bot-name     Nombre del asistente (por defecto "Carlitos").
 *   data-user-name    Cómo se muestra a quien escribe (por defecto "Vos").
 *   data-names        "off" para ocultar el nombre que aparece arriba de cada mensaje.
 *   data-welcome      Primer mensaje del asistente (admite **negrita** y enlaces).
 *   data-placeholder  Texto del campo de escritura.
 *   data-notice       Aviso bajo el campo de escritura ("" para ocultarlo).
 *   data-color        Color principal en hexadecimal (por defecto #003b73).
 *   data-position     "right" (por defecto) o "left".
 *   data-avatar       Imagen del botón flotante (por defecto /static/robot.png del servidor). "" = ícono simple.
 *   data-suggestions  Botones de preguntas frecuentes: JSON [{"label","question","answer"}], o "none" para ocultarlos.
 *   data-inactivity   Segundos de inactividad antes del recordatorio "¿Necesitás ayuda con algo más?" (0 = no avisar).
 *
 * Desde la página también se puede controlar:
 *   window.IsfdytChat.abrir()   window.IsfdytChat.cerrar()   window.IsfdytChat.reiniciar()
 *
 * No necesita librerías externas. Todo su HTML y CSS viven dentro de un Shadow DOM,
 * así que los estilos de la página (WordPress, etc.) no lo afectan ni él afecta a la página.
 */
(function () {
    'use strict';

    if (window.__isfdytChatCargado) return;
    window.__isfdytChatCargado = true;

    /* ================================================================
       Configuración
       ================================================================ */
    var script = document.currentScript || document.querySelector('script[src*="chat-widget"]');
    var datos = (script && script.dataset) || {};

    function colorValido(valor) {
        return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(valor || '') ? valor : '#003b73';
    }

    function colorTexto(hex) {
        var h = hex.replace('#', '');
        if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
        var r = parseInt(h.slice(0, 2), 16);
        var g = parseInt(h.slice(2, 4), 16);
        var b = parseInt(h.slice(4, 6), 16);
        return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? '#111111' : '#ffffff';
    }

    // Dirección de algo que vive en el mismo servidor que entregó este archivo
    function urlDelServidor(ruta) {
        try {
            return script && script.src ? new URL(ruta, script.src).href : '';
        } catch (e) { return ''; }
    }

    // Solo se aceptan imágenes http(s): nada de javascript: ni similares
    function urlSegura(valor) {
        if (!valor) return '';
        try {
            var url = new URL(valor, location.href);
            return (url.protocol === 'http:' || url.protocol === 'https:') ? url.href : '';
        } catch (e) { return ''; }
    }

    var SUGERIDOS_POR_DEFECTO = [
        {
            etiqueta: '📚 Carreras',
            pregunta: '¿Cuáles son las carreras disponibles?',
            respuesta: 'Ofrecemos Profesorados (Educación Primaria, Educación Especial e Inglés) y Tecnicaturas (Análisis de Sistemas, Enfermería, Acompañamiento Terapéutico, Trabajo Social, Bibliotecología, entre otras). Podés ver el listado completo en nuestra web: https://isfdyt59-bue.infd.edu.ar/sitio/oferta-academica-2/'
        },
        {
            etiqueta: '📅 Inscripciones',
            pregunta: '¿Cuándo son las fechas de inscripción?',
            respuesta: 'Las inscripciones para el ciclo 2027 comenzarán a partir de fines noviembre a través de SIU Guaraní. Cada carrera tiene un cupo máximo de 50 personas.'
        },
        {
            etiqueta: '📝 Constancia',
            pregunta: '¿Cómo pido la constancia de alumno regular?',
            respuesta: 'Debés llevar el certificado impreso o fotocopiado y entregarlo en Preceptoría durante el horario de atención: de lunes a viernes de 13:00 a 22:00 hs.'
        },
        {
            etiqueta: '⏰ Horarios',
            pregunta: '¿Cuáles son los horarios de cursada?',
            respuesta: 'Las grillas con los horarios detallados de cada materia y carrera están publicadas en nuestra carpeta oficial. Podés acceder desde este enlace: https://drive.google.com/drive/folders/1bgBLM-QDQ6GRH5PkFtyrFnyRXuHlvWMr'
        },
        {
            etiqueta: '📞 Contactos',
            pregunta: '¿Cuáles son los medios de contacto?',
            respuesta: 'Podés visitarnos en Martínez Ituño 213, llamarnos al 02267 420175, o escribir a isfdyt59@yahoo.com.ar.'
        }
    ];

    function leerSugeridos() {
        var crudo = datos.suggestions;
        if (crudo === undefined) return SUGERIDOS_POR_DEFECTO;
        if (crudo === '' || crudo === 'none') return [];
        try {
            var lista = JSON.parse(crudo);
            if (Array.isArray(lista)) {
                return lista.filter(function (s) {
                    return s && typeof s.label === 'string' && typeof s.question === 'string' && typeof s.answer === 'string';
                }).map(function (s) {
                    return { etiqueta: s.label, pregunta: s.question, respuesta: s.answer };
                });
            }
        } catch (e) {
            console.error('[chat-widget] data-suggestions no es un JSON válido.');
        }
        return SUGERIDOS_POR_DEFECTO;
    }

    var segundosInactividad = datos.inactivity !== undefined ? parseInt(datos.inactivity, 10) : 120;
    if (isNaN(segundosInactividad) || segundosInactividad < 0) segundosInactividad = 120;

    var CONFIG = {
        api: datos.api || urlDelServidor('/chat'),
        titulo: datos.title || 'ISFDyT N° 59',
        nombreBot: datos.botName || 'Carlitos',
        nombreUsuario: datos.userName || 'Vos',
        mostrarNombres: datos.names !== 'off',
        bienvenida: datos.welcome || '¡Hola! 🤖 Soy **Carlitos**, del ISFDyT Nº 59. Estoy acá para ayudarte con las carreras, inscripciones y dudas sobre el instituto. ¿Qué te gustaría consultar hoy?',
        placeholder: datos.placeholder || 'Escribe tu consulta...',
        aviso: datos.notice !== undefined
            ? datos.notice
            : 'Respuestas orientativas: confirmá los datos importantes en preceptoría. No escribas datos personales.',
        color: colorValido(datos.color),
        posicion: datos.position === 'left' ? 'izq' : 'der',
        avatar: urlSegura(datos.avatar !== undefined ? datos.avatar : urlDelServidor('/static/robot.png')),
        sugeridos: leerSugeridos(),
        inactividadMs: segundosInactividad * 1000,
        timeoutMs: 60000,        // el servidor puede tardar si estaba "dormido" (planes gratuitos)
        avisoLentoMs: 8000,
        pausaBienvenidaMs: 1200,
        pausaSugeridoMs: 800,
        mensajesEnviados: 6,     // cuántos mensajes se mandan al backend (él usa los últimos 4)
        mensajesGuardados: 30,   // cuántos se recuerdan al navegar por el sitio
        maxCaracteres: 500
    };

    if (!CONFIG.api) {
        console.error('[chat-widget] No se pudo determinar la URL del backend. Agregá data-api="https://.../chat".');
        return;
    }

    /* ================================================================
       HTML y CSS (dentro del Shadow DOM)
       ================================================================ */
    var CSS = [
        ':host { all: initial; }',
        '*, *::before, *::after { box-sizing: border-box; }',
        '.raiz { --acento: #003b73; --texto-acento: #ffffff; --link: #0275d8; --bg-chat: #e5ddd5; --bg-header: var(--acento); --text-header: var(--texto-acento); --bg-messages: transparent; --bg-bot: #ffffff; --text-bot: #303030; --bg-user: #dcf8c6; --text-user: #111b21; --bg-input: #ffffff; --bg-panel: #f2f2f2; --bg-btn: #ffffff; --text-btn: var(--acento); --text-aviso: #6b7280;',
        '  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; font-size: 14px; line-height: 1.35; color: #303030; }',
        '.raiz.oscuro { --bg-chat: #1e1e1e; --bg-header: #112233; --text-header: #e0e0e0; --bg-messages: #121212; --bg-bot: #2d2d2d; --text-bot: #e0e0e0; --bg-user: #005c4b; --text-user: #ffffff; --bg-input: #1e1e1e; --bg-panel: #121212; --bg-btn: #2d2d2d; --text-btn: #4da3ff; --link: #66b2ff; --text-aviso: #9aa4b2; }',
        'button, input { font: inherit; }',

        /* Botón flotante con el robot */
        '.lanzador { position: fixed; bottom: 20px; z-index: 2147483000; width: 90px; height: 90px; padding: 0; display: flex; align-items: center; justify-content: center; background: none; border: none; cursor: pointer; transition: transform .3s; }',
        '.lanzador:hover { transform: scale(1.1); }',
        '.lanzador img { width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 4px 8px rgba(0,0,0,.25)); }',
        '.lanzador .icono { display: none; width: 64px; height: 64px; padding: 16px; color: var(--texto-acento); background: var(--acento); border-radius: 50%; box-shadow: 0 4px 14px rgba(0,0,0,.3); }',
        '.lanzador.sin-imagen img { display: none; }',
        '.lanzador.sin-imagen .icono { display: block; }',
        '.der .lanzador { right: 25px; }',
        '.izq .lanzador { left: 25px; }',
        '.abierto .lanzador { display: none; }',

        /* Ventana */
        '.ventana { position: fixed; bottom: 15px; z-index: 2147483000; width: 400px; max-width: 95vw; height: 88vh; max-height: calc(100vh - 30px); max-height: calc(100dvh - 30px); display: flex; flex-direction: column; overflow: hidden; background: var(--bg-chat); border-radius: 15px; box-shadow: 0 8px 30px rgba(0,0,0,.4); opacity: 0; visibility: hidden; transform: translateY(20px); transition: opacity .25s, transform .25s, visibility .25s, background .3s; }',
        '.ventana.abierta { opacity: 1; visibility: visible; transform: none; }',
        '.der .ventana { right: 20px; }',
        '.izq .ventana { left: 20px; }',

        '.cabecera { flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; color: var(--text-header); background: var(--bg-header); box-shadow: 0 2px 5px rgba(0,0,0,.2); transition: background .3s; }',
        '.titulo { font-size: 16px; font-weight: bold; letter-spacing: .5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }',
        '.acciones { display: flex; align-items: center; flex-shrink: 0; gap: 4px; }',
        '.acciones button { padding: 4px 6px; font-size: 18px; color: var(--text-header); background: none; border: none; cursor: pointer; transition: transform .2s; }',
        '.acciones button:hover { transform: scale(1.2); }',

        /* Mensajes */
        '.mensajes { flex: 1; display: flex; flex-direction: column; gap: 8px; padding: 12px; overflow-y: auto; background: var(--bg-messages); transition: background .3s; }',
        '.mensaje { max-width: 85%; padding: 6px 12px; font-size: 14px; line-height: 1.35; overflow-wrap: anywhere; border-radius: 10px; box-shadow: 0 1px 2px rgba(0,0,0,.15); transition: background .3s, color .3s; }',
        '.mensaje.bot { align-self: flex-start; color: var(--text-bot); background: var(--bg-bot); border-bottom-left-radius: 4px; }',
        '.mensaje.usuario { align-self: flex-end; color: var(--text-user); background: var(--bg-user); border-bottom-right-radius: 4px; }',
        '.mensaje.usuario .texto { white-space: pre-wrap; }',
        '.remitente { display: flex; align-items: center; gap: 6px; margin-bottom: 3px; font-size: 11.5px; font-weight: 700; letter-spacing: .2px; }',
        '.mensaje.bot .remitente { color: var(--text-btn); }',
        '.mensaje.usuario .remitente { justify-content: flex-end; color: var(--text-user); opacity: .65; }',
        '.avatar-mini { flex-shrink: 0; width: 22px; height: 22px; object-fit: contain; background: #ffffff; border: 1px solid rgba(0,0,0,.15); border-radius: 50%; }',
        '.mensaje p { margin: 4px 0; }',
        '.mensaje ul, .mensaje ol { margin: 4px 0; padding-left: 20px; }',
        '.mensaje code { padding: 1px 4px; font-family: ui-monospace, Consolas, monospace; font-size: 13px; background: rgba(127,127,127,.2); border-radius: 4px; }',
        '.enlace { display: inline-block; margin-top: 2px; font-weight: 600; color: var(--link); text-decoration: none; word-break: break-all; }',
        '.enlace:hover { text-decoration: underline; filter: brightness(.8); }',
        '.escribiendo { font-style: italic; opacity: .85; animation: parpadeo 1.5s infinite ease-in-out; }',
        '@keyframes parpadeo { 0%, 100% { opacity: .4; } 50% { opacity: 1; } }',

        /* Preguntas frecuentes */
        '.sugeridos { flex-shrink: 0; display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; padding: 8px 10px; background: var(--bg-panel); border-top: 1px solid rgba(0,0,0,.1); transition: background .3s; }',
        '.sugeridos:empty { display: none; }',
        '.sugeridos button { padding: 6px 11px; font-size: 12px; font-weight: bold; color: var(--text-btn); background: var(--bg-btn); border: 1px solid var(--text-btn); border-radius: 20px; box-shadow: 0 2px 4px rgba(0,0,0,.05); cursor: pointer; transition: all .2s; }',
        '.sugeridos button:hover:not(:disabled) { color: var(--bg-btn); background: var(--text-btn); transform: translateY(-2px); }',
        '.sugeridos button:disabled { opacity: .5; cursor: not-allowed; }',

        /* Escritura */
        '.fila { flex-shrink: 0; display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: var(--bg-input); transition: background .3s; }',
        '.mic { flex-shrink: 0; padding: 4px; font-size: 20px; background: none; border: none; cursor: pointer; filter: grayscale(100%); transition: .2s; }',
        '.mic:hover { transform: scale(1.1); filter: none; }',
        '.mic.grabando { filter: none; animation: pulso 1s infinite; }',
        '@keyframes pulso { 0% { transform: scale(1); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }',
        '.entrada { flex: 1; min-width: 0; padding: 10px 14px; font-size: 14px; color: var(--text-bot); background: var(--bg-btn); border: 1px solid #ccc; border-radius: 25px; outline: none; transition: border .3s, background .3s; }',
        '.entrada:focus { border-color: var(--text-btn); }',
        '.enviar { flex-shrink: 0; padding: 10px 16px; font-weight: bold; color: var(--texto-acento); background: var(--acento); border: none; border-radius: 25px; cursor: pointer; transition: all .2s; }',
        '.enviar:hover:not(:disabled) { filter: brightness(.8); transform: scale(1.05); }',
        '.enviar:disabled { opacity: .5; cursor: not-allowed; }',
        '.aviso { flex-shrink: 0; margin: 0; padding: 0 12px 8px; font-size: 11px; line-height: 1.3; color: var(--text-aviso); background: var(--bg-input); transition: background .3s; }',
        '.aviso:empty { display: none; }',
        'button:focus-visible, input:focus-visible { outline: 2px solid #0b57d0; outline-offset: 2px; }',

        /* Celulares: pantalla completa, como el chat original */
        '@media (max-width: 480px) {',
        '  .ventana { left: 0; right: 0; bottom: 0; width: 100vw; max-width: 100vw; height: 100vh; height: 100dvh; max-height: 100vh; max-height: 100dvh; border-radius: 0; }',
        '  .cabecera { padding: 10px 14px; }',
        '  .titulo { font-size: 15px; }',
        '  .sugeridos { gap: 5px; padding: 6px 8px; }',
        '  .sugeridos button { padding: 5px 9px; font-size: 11.5px; }',
        '  .fila { gap: 6px; padding: 8px 10px calc(8px + env(safe-area-inset-bottom, 0px)); }',
        '  .enviar { padding: 9px 14px; font-size: 13px; }',
        '}',
        '@media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }'
    ].join('\n');

    // Plantilla fija: no contiene ningún dato externo.
    var PLANTILLA =
        '<div class="raiz">' +
        '  <button type="button" class="lanzador">' +
        '    <img alt="">' +
        '    <svg class="icono" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 3h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/></svg>' +
        '  </button>' +
        '  <section class="ventana" role="dialog" aria-label="Chat con el asistente virtual">' +
        '    <header class="cabecera">' +
        '      <span class="titulo"></span>' +
        '      <div class="acciones">' +
        '        <button type="button" class="tema">&#127769;</button>' +
        '        <button type="button" class="limpiar" title="Limpiar conversación" aria-label="Limpiar conversación">&#128465;&#65039;</button>' +
        '        <button type="button" class="cerrar" title="Cerrar" aria-label="Cerrar chat">&#10006;</button>' +
        '      </div>' +
        '    </header>' +
        '    <div class="mensajes" aria-live="polite"></div>' +
        '    <div class="sugeridos"></div>' +
        '    <form class="fila" autocomplete="off">' +
        '      <button type="button" class="mic" title="Hablar por micrófono" aria-label="Hablar por micrófono">&#127908;</button>' +
        '      <input type="text" class="entrada" aria-label="Tu consulta" required>' +
        '      <button type="submit" class="enviar">Enviar</button>' +
        '    </form>' +
        '    <p class="aviso"></p>' +
        '  </section>' +
        '</div>';

    /* ================================================================
       Markdown mínimo y seguro: construye nodos DOM, nunca usa innerHTML
       con texto del bot, así que no hay forma de inyectar HTML o scripts.
       Soporta: **negrita**, *cursiva*, `código`, [texto](url), URLs sueltas,
       correos y teléfono del instituto (se vuelven enlaces), listas con
       viñetas o numeradas, títulos (#) y saltos de línea.
       ================================================================ */
    var INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\)|https?:\/\/[^\s<>)]+|[A-Za-z0-9._+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+|\(?02267\)?[\s-]?420175|\*[^*\s][^*]*\*)/g;

    function agregarEnlace(padre, texto, href) {
        var url = null;
        try { url = new URL(href, location.href); } catch (e) { /* inválida */ }
        if (!url || ['http:', 'https:', 'mailto:', 'tel:'].indexOf(url.protocol) === -1) {
            padre.append(texto);   // protocolos como javascript: se muestran como texto
            return;
        }
        var a = document.createElement('a');
        a.className = 'enlace';
        a.href = url.href;
        a.textContent = texto;
        if (url.protocol === 'http:' || url.protocol === 'https:') {
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
        }
        padre.append(a);
    }

    function inline(texto, padre) {
        var ultimo = 0;
        for (var m of texto.matchAll(INLINE)) {
            var t = m[0];
            if (m.index > ultimo) padre.append(texto.slice(ultimo, m.index));

            if (t.indexOf('**') === 0) {
                var fuerte = document.createElement('strong');
                inline(t.slice(2, -2), fuerte);
                padre.append(fuerte);
            } else if (t.charAt(0) === '*') {
                var cursiva = document.createElement('em');
                cursiva.textContent = t.slice(1, -1);
                padre.append(cursiva);
            } else if (t.charAt(0) === '`') {
                var codigo = document.createElement('code');
                codigo.textContent = t.slice(1, -1);
                padre.append(codigo);
            } else if (t.charAt(0) === '[') {
                var partes = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(t);
                agregarEnlace(padre, partes[1], partes[2]);
            } else if (/^https?:\/\//.test(t)) {
                var limpio = t.replace(/[.,;:!?]+$/, '');
                agregarEnlace(padre, limpio, limpio);
                if (t.length > limpio.length) padre.append(t.slice(limpio.length));
            } else if (t.indexOf('@') > 0) {
                agregarEnlace(padre, t, 'mailto:' + t);
            } else {
                agregarEnlace(padre, t, 'tel:02267420175');
            }
            ultimo = m.index + t.length;
        }
        if (ultimo < texto.length) padre.append(texto.slice(ultimo));
    }

    function renderMarkdown(texto, contenedor) {
        var lineas = texto.replace(/\r/g, '').split('\n');
        var parrafo = [];
        var lista = null;

        function cerrarParrafo() {
            if (!parrafo.length) return;
            var p = document.createElement('p');
            parrafo.forEach(function (linea, i) {
                if (i) p.append(document.createElement('br'));
                inline(linea, p);
            });
            contenedor.append(p);
            parrafo = [];
        }

        function agregarItem(tag, contenido) {
            cerrarParrafo();
            if (!lista || lista.tag !== tag) {
                lista = { tag: tag, el: document.createElement(tag) };
                contenedor.append(lista.el);
            }
            var li = document.createElement('li');
            inline(contenido, li);
            lista.el.append(li);
        }

        lineas.forEach(function (cruda) {
            var linea = cruda.trimEnd();
            var m;
            if (!linea.trim()) { cerrarParrafo(); lista = null; return; }
            if ((m = /^\s*[-*\u2022]\s+(.*)$/.exec(linea))) { agregarItem('ul', m[1]); return; }
            if ((m = /^\s*\d+[.)]\s+(.*)$/.exec(linea))) { agregarItem('ol', m[1]); return; }
            if ((m = /^#{1,6}\s+(.*)$/.exec(linea))) {
                cerrarParrafo(); lista = null;
                var p = document.createElement('p');
                var s = document.createElement('strong');
                inline(m[1], s);
                p.append(s);
                contenedor.append(p);
                return;
            }
            lista = null;
            parrafo.push(linea.trim());
        });
        cerrarParrafo();
    }

    /* ================================================================
       Estado y almacenamiento (solo en esta pestaña; se borra al cerrarla)
       ================================================================ */
    var CLAVE = 'isfdyt-chat-v2';

    function cargarEstado() {
        var vacio = { abierto: false, oscuro: false, bienvenida: false, historial: [] };
        try {
            var guardado = JSON.parse(sessionStorage.getItem(CLAVE));
            if (guardado && Array.isArray(guardado.historial)) {
                var historial = guardado.historial.filter(function (m) {
                    return m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string';
                });
                return {
                    abierto: !!guardado.abierto,
                    oscuro: !!guardado.oscuro,
                    bienvenida: !!guardado.bienvenida || historial.length > 0,
                    historial: historial
                };
            }
        } catch (e) { /* sin almacenamiento */ }
        return vacio;
    }

    /* ================================================================
       Inicio
       ================================================================ */
    function iniciar() {
        var host = document.createElement('div');
        host.id = 'isfdyt-chat-host';
        var shadow = host.attachShadow({ mode: 'open' });
        shadow.innerHTML = '<style>' + CSS + '</style>' + PLANTILLA;
        document.body.appendChild(host);

        var $ = function (selector) { return shadow.querySelector(selector); };
        var raiz = $('.raiz');
        var lanzador = $('.lanzador');
        var imagen = $('.lanzador img');
        var ventana = $('.ventana');
        var mensajes = $('.mensajes');
        var panel = $('.sugeridos');
        var formulario = $('.fila');
        var entrada = $('.entrada');
        var enviar = $('.enviar');
        var mic = $('.mic');
        var botonTema = $('.tema');

        /* ---- Aspecto según la configuración ---- */
        raiz.classList.add(CONFIG.posicion);
        raiz.style.setProperty('--acento', CONFIG.color);
        raiz.style.setProperty('--texto-acento', colorTexto(CONFIG.color));
        $('.titulo').textContent = CONFIG.titulo;
        $('.aviso').textContent = CONFIG.aviso;
        entrada.placeholder = CONFIG.placeholder;
        entrada.maxLength = CONFIG.maxCaracteres;
        lanzador.setAttribute('aria-label', 'Abrir chat con ' + CONFIG.nombreBot);
        lanzador.setAttribute('aria-expanded', 'false');

        if (CONFIG.avatar) {
            imagen.src = CONFIG.avatar;
            imagen.addEventListener('error', function () { lanzador.classList.add('sin-imagen'); });
        } else {
            lanzador.classList.add('sin-imagen');
        }

        /* ---- Estado ---- */
        var estado = cargarEstado();
        var historial = estado.historial;
        var abierto = false;
        var oscuro = estado.oscuro;
        var bienvenidaMostrada = estado.bienvenida;
        var ocupado = false;
        var recordatorioEnviado = false;
        var temporizador = null;

        function guardar() {
            try {
                sessionStorage.setItem(CLAVE, JSON.stringify({
                    abierto: abierto,
                    oscuro: oscuro,
                    bienvenida: bienvenidaMostrada,
                    historial: historial.slice(-CONFIG.mensajesGuardados)
                }));
            } catch (e) { /* sin almacenamiento */ }
        }

        function bajar() { mensajes.scrollTop = mensajes.scrollHeight; }

        function setOcupado(valor) {
            ocupado = valor;
            enviar.disabled = valor;
            panel.querySelectorAll('button').forEach(function (b) { b.disabled = valor; });
        }

        /* ---- Recordatorio por inactividad ---- */
        function programarRecordatorio() {
            clearTimeout(temporizador);
            if (!CONFIG.inactividadMs || !abierto || recordatorioEnviado || historial.length === 0) return;
            temporizador = setTimeout(function () {
                if (abierto && !recordatorioEnviado && historial.length > 0) {
                    agregarMensaje('¿Necesitás ayuda con algo más? 😊', 'assistant', { recordatorio: true });
                    recordatorioEnviado = true;
                }
            }, CONFIG.inactividadMs);
        }

        /* ---- Mensajes ---- */
        // Nombre (y foto del robot) que aparece arriba de cada mensaje
        function crearEtiqueta(rol) {
            var etiqueta = document.createElement('div');
            etiqueta.className = 'remitente';
            if (rol !== 'user' && CONFIG.avatar) {
                var foto = document.createElement('img');
                foto.className = 'avatar-mini';
                foto.alt = '';
                foto.src = CONFIG.avatar;
                foto.addEventListener('error', function () { foto.remove(); });
                etiqueta.append(foto);
            }
            var nombre = document.createElement('span');
            nombre.className = 'nombre';
            nombre.textContent = rol === 'user' ? CONFIG.nombreUsuario : CONFIG.nombreBot;
            etiqueta.append(nombre);
            return etiqueta;
        }

        function agregarMensaje(contenido, rol, opciones) {
            opciones = opciones || {};
            var burbuja = document.createElement('div');
            burbuja.className = 'mensaje ' + (rol === 'user' ? 'usuario' : 'bot');

            if (CONFIG.mostrarNombres) burbuja.append(crearEtiqueta(rol));

            if (rol === 'user' || opciones.plano) {
                var texto = document.createElement('div');
                texto.className = 'texto';
                texto.textContent = contenido;
                burbuja.append(texto);
            } else {
                renderMarkdown(contenido, burbuja);
            }

            mensajes.append(burbuja);
            bajar();

            if (rol === 'user') recordatorioEnviado = false;
            if (!opciones.recordatorio) programarRecordatorio();
            return burbuja;
        }

        function mostrarEscribiendo(texto) {
            clearTimeout(temporizador);
            var indicador = document.createElement('div');
            indicador.className = 'mensaje bot escribiendo';
            indicador.textContent = texto || (CONFIG.nombreBot + ' está escribiendo...');
            mensajes.append(indicador);
            bajar();
            return indicador;
        }

        function dibujarConversacion() {
            mensajes.textContent = '';
            agregarMensaje(CONFIG.bienvenida, 'assistant');
            historial.forEach(function (m) { agregarMensaje(m.content, m.role); });
        }

        function bienvenidaAnimada() {
            bienvenidaMostrada = true;
            setOcupado(true);
            var indicador = mostrarEscribiendo();
            setTimeout(function () {
                indicador.remove();
                agregarMensaje(CONFIG.bienvenida, 'assistant');
                setOcupado(false);
                guardar();
            }, CONFIG.pausaBienvenidaMs);
        }

        /* ---- Abrir / cerrar / tema / limpiar ---- */
        function abrir(valor, enfocar) {
            abierto = valor;
            ventana.classList.toggle('abierta', valor);
            raiz.classList.toggle('abierto', valor);
            ventana.inert = !valor;      // cerrado: no se puede enfocar con Tab
            lanzador.setAttribute('aria-expanded', String(valor));
            if (valor) {
                if (!bienvenidaMostrada) bienvenidaAnimada();
                bajar();
                programarRecordatorio();
                if (enfocar !== false) entrada.focus();
            } else {
                clearTimeout(temporizador);
            }
            guardar();
        }

        function aplicarTema() {
            raiz.classList.toggle('oscuro', oscuro);
            botonTema.textContent = oscuro ? '☀️' : '🌙';
            var etiqueta = oscuro ? 'Modo claro' : 'Modo oscuro';
            botonTema.title = etiqueta;
            botonTema.setAttribute('aria-label', etiqueta);
        }

        function reiniciar() {
            clearTimeout(temporizador);
            historial.length = 0;
            recordatorioEnviado = false;
            bienvenidaMostrada = true;
            dibujarConversacion();
            guardar();
        }

        /* ---- Preguntas frecuentes (respuesta inmediata, sin consultar al servidor) ---- */
        function responderFrecuente(item) {
            if (ocupado) return;
            agregarMensaje(item.pregunta, 'user');
            historial.push({ role: 'user', content: item.pregunta });
            historial.push({ role: 'assistant', content: item.respuesta });

            setOcupado(true);
            var indicador = mostrarEscribiendo();
            setTimeout(function () {
                indicador.remove();
                agregarMensaje(item.respuesta, 'assistant');
                setOcupado(false);
                guardar();
            }, CONFIG.pausaSugeridoMs);
        }

        CONFIG.sugeridos.forEach(function (item) {
            var boton = document.createElement('button');
            boton.type = 'button';
            boton.textContent = item.etiqueta;
            boton.addEventListener('click', function () { responderFrecuente(item); });
            panel.append(boton);
        });

        /* ---- Consulta al servidor ---- */
        async function consultar(texto) {
            agregarMensaje(texto, 'user');
            historial.push({ role: 'user', content: texto });
            setOcupado(true);
            var indicador = mostrarEscribiendo();

            var controlador = new AbortController();
            var temporizadorRed = setTimeout(function () { controlador.abort(); }, CONFIG.timeoutMs);
            var temporizadorLento = setTimeout(function () {
                if (indicador.isConnected) indicador.textContent = 'Un momento, el servidor está arrancando...';
            }, CONFIG.avisoLentoMs);

            try {
                var respuesta = await fetch(CONFIG.api, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ historial: historial.slice(-CONFIG.mensajesEnviados) }),
                    signal: controlador.signal
                });
                if (!respuesta.ok) {
                    var fallo = new Error('HTTP ' + respuesta.status);
                    fallo.codigo = respuesta.status;
                    throw fallo;
                }
                var datosRespuesta = await respuesta.json();
                var textoRespuesta = (datosRespuesta && datosRespuesta.response) || 'No recibí una respuesta.';
                indicador.remove();
                historial.push({ role: 'assistant', content: textoRespuesta });
                agregarMensaje(textoRespuesta, 'assistant');
            } catch (error) {
                historial.pop();    // la pregunta quedó sin respuesta
                indicador.remove();
                var aviso;
                if (error.name === 'AbortError') aviso = 'La consulta tardó demasiado. Probá de nuevo.';
                else if (error.codigo === 429) aviso = 'Hiciste muchas consultas seguidas. Esperá un momento y probá de nuevo.';
                else aviso = 'Error al conectar con el servidor. Probá de nuevo en un momento.';
                agregarMensaje(aviso, 'assistant', { plano: true });
            } finally {
                clearTimeout(temporizadorRed);
                clearTimeout(temporizadorLento);
                setOcupado(false);
                entrada.focus();
                guardar();
            }
        }

        /* ---- Dictado por voz (si el navegador lo permite) ---- */
        var Reconocimiento = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!Reconocimiento) {
            mic.style.display = 'none';
        } else {
            mic.addEventListener('click', function () {
                if (ocupado) return;
                var reconocimiento = new Reconocimiento();
                reconocimiento.lang = 'es-AR';
                reconocimiento.continuous = false;
                reconocimiento.onstart = function () {
                    mic.classList.add('grabando');
                    entrada.placeholder = 'Escuchando...';
                };
                reconocimiento.onresult = function (evento) {
                    var texto = evento.results[0][0].transcript.trim().slice(0, CONFIG.maxCaracteres);
                    if (texto) consultar(texto);
                };
                reconocimiento.onerror = function () { /* permiso denegado o sin audio: se restablece en onend */ };
                reconocimiento.onend = function () {
                    mic.classList.remove('grabando');
                    entrada.placeholder = CONFIG.placeholder;
                };
                reconocimiento.start();
            });
        }

        /* ---- Eventos ---- */
        lanzador.addEventListener('click', function () { abrir(true); });
        $('.cerrar').addEventListener('click', function () { abrir(false); lanzador.focus(); });
        $('.limpiar').addEventListener('click', reiniciar);
        botonTema.addEventListener('click', function () { oscuro = !oscuro; aplicarTema(); guardar(); });
        formulario.addEventListener('submit', function (evento) {
            evento.preventDefault();
            var texto = entrada.value.trim();
            if (!texto || ocupado) return;
            entrada.value = '';
            consultar(texto);
        });
        document.addEventListener('keydown', function (evento) {
            if (evento.key === 'Escape' && abierto) { abrir(false); lanzador.focus(); }
        });

        /* ---- Arranque ---- */
        aplicarTema();
        if (bienvenidaMostrada) dibujarConversacion();
        abrir(estado.abierto, false);

        window.IsfdytChat = {
            abrir: function () { abrir(true); },
            cerrar: function () { abrir(false); },
            reiniciar: reiniciar
        };
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciar);
    } else {
        iniciar();
    }
})();
