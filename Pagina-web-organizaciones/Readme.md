# Sitio web del Instituto (ISFDyT Nº 59)

Sitio estático de un instituto de formación docente y técnica, hecho solo con HTML, CSS y JavaScript. No necesita instalar nada ni usar un framework.

## Estructura

```
.
├── index.html      # Estructura y contenido de la página
├── style.css       # Estilos y diseño responsive
├── script.js       # Datos, filtros, menú y formulario
├── README.md
└── img/
    ├── logo.svg    # Logo (provisorio)
    └── favicon.svg # Ícono de la pestaña del navegador
```

## Cómo verlo

La forma más simple es abrir `index.html` con doble clic en el navegador.

Para verlo como en un servidor, desde la carpeta del proyecto:

```bash
python3 -m http.server 8000
```

Después abrí `http://localhost:8000`.

## Qué incluye

- Barra superior fija, con menú desplegable en celular.
- Portada con una pizarra de próximas fechas.
- Listado de carreras con filtro (todas, docentes, técnicas).
- Pasos de inscripción.
- Novedades con fecha.
- Formulario de contacto con validación.
- Accesibilidad básica: enlace "Ir al contenido", foco visible y respeto por `prefers-reduced-motion`.

## Cómo personalizar

**Carreras, fechas y novedades:** están al inicio de `script.js`, en los arreglos `carreras`, `fechas` y `novedades`. Editá, agregá o borrá objetos y la página se actualiza sola.

```js
{ nombre: "Nombre de la carrera", tipo: "tecnica", duracion: "3 años", turno: "Noche", desc: "Descripción corta." }
```

El campo `tipo` debe ser `"docente"` o `"tecnica"` para que funcione el filtro.

**Datos de contacto y textos:** se editan directamente en `index.html` (sección `#contacto` y pasos de `#inscripcion`).

**Colores:** están como variables al inicio de `style.css`, dentro de `:root`.

**Logo:** reemplazá `img/logo.svg` por el del instituto. Si es PNG o JPG, cambiá la ruta en `index.html`:

```html
<img class="brand-mark" src="img/logo.png" alt="" width="42" height="42">
```

Hacé lo mismo con `img/favicon.svg` y la línea `<link rel="icon">`.

## Menú y submenús

El menú principal se genera desde el arreglo `menu`, al inicio de `script.js`. No hace falta tocar el HTML ni el CSS.

**Agregar una sección simple (un solo enlace):**

```js
{ texto: "Nueva sección", href: "https://ejemplo.com/pagina" }
```

**Agregar una sección con submenú:**

```js
{ texto: "Secretaría", sub: [
  { texto: "Trámites", href: "tramites.html" },
  { texto: "Constancias", href: "constancias.html" }
]}
```

**Agregar una subcategoría a una sección existente:** sumá un objeto dentro de su `sub`.

El `href` puede ser un enlace externo (`https://...`, se abre en otra pestaña), una página propia (`pagina.html`) o una sección de esta página (`#contacto`). El orden del arreglo es el orden del menú.

## Formulario de contacto

Por ahora solo valida los campos y muestra un mensaje de confirmación; **no envía nada**. Para que envíe de verdad, en `script.js` buscá el comentario `Acá iría el envío real` y conectalo a:

- una ruta de tu propio backend (por ejemplo Flask) usando `fetch`, o
- un servicio de formularios externo.

## Publicarlo

Al ser un sitio estático, alcanza con copiar la carpeta completa a cualquier servidor web. Ejemplo con nginx:

```nginx
server {
    listen 80;
    server_name tudominio.com.ar;
    root /var/www/instituto;
    index index.html;
}
```

## Notas

- Los datos de carreras, fechas, novedades y contacto son de **ejemplo**; hay que reemplazarlos por los reales.
- Las tipografías (Source Sans 3 y Source Serif 4) se cargan desde Google Fonts. Sin conexión, el sitio usa fuentes del sistema.
