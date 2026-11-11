// Datos de ejemplo: reemplazalos por los reales del instituto.
const carreras = [
  { nombre: "Tecnicatura Superior en Análisis de Sistemas", tipo: "tecnica", duracion: "3 años", turno: "Noche", desc: "Programación, bases de datos, redes y desarrollo de software." },
  { nombre: "Tecnicatura Superior en Redes Informáticas", tipo: "tecnica", duracion: "3 años", turno: "Noche", desc: "Infraestructura, seguridad y administración de redes." },
  { nombre: "Profesorado de Educación Primaria", tipo: "docente", duracion: "4 años", turno: "Tarde", desc: "Formación para enseñar en todas las áreas del nivel primario." },
  { nombre: "Profesorado de Educación Secundaria en Matemática", tipo: "docente", duracion: "4 años", turno: "Tarde", desc: "Didáctica y contenidos de Matemática para el nivel secundario." }
];

const fechas = [
  { dia: "15 dic", texto: "Cierre de preinscripción" },
  { dia: "10 feb", texto: "Mesas de examen de verano" },
  { dia: "01 mar", texto: "Inicio de clases" }
];

const novedades = [
  { fecha: "2026-11-05", titulo: "Abre la preinscripción 2027", texto: "Ya podés reservar tu lugar. Revisá los requisitos en la sección Inscripción." },
  { fecha: "2026-10-28", titulo: "Jornada de puertas abiertas", texto: "Recorré el instituto y conversá con docentes y estudiantes de cada carrera." },
  { fecha: "2026-10-15", titulo: "Nuevo aula de informática", texto: "Se renovó el equipamiento para las cursadas de tecnicaturas." }
];

// MENÚ PRINCIPAL: para agregar una sección o subcategoría, sumá un objeto acá.
// - Sección simple:      { texto: "Nombre", href: "https://..." }
// - Sección con submenú: { texto: "Nombre", sub: [ { texto: "Opción", href: "..." }, ... ] }
// href puede ser un enlace externo (https://...), una página tuya (pagina.html) o una sección (#contacto).
const menu = [
  { texto: "El Instituto", sub: [
    { texto: "Carreras", href: "#carreras" },
    { texto: "Novedades", href: "#novedades" },
    { texto: "Contacto", href: "#contacto" }
  ]},
  { texto: "Secretaría", sub: [
    { texto: "Inscripción", href: "#inscripcion" }
  ]},
  { texto: "Preceptoría", sub: [
    { texto: "Horarios", href: "https://isfdyt59-bue.infd.edu.ar/sitio/horarios/" },
    { texto: "Solicitud de certificados", href: "https://isfdyt59-bue.infd.edu.ar/sitio/certificados/" },
    { texto: "Exámenes finales: inscripción", href: "https://isfdyt59-bue.infd.edu.ar/sitio/finales/" },
    { texto: "Turnos extraordinarios", href: "https://isfdyt59-bue.infd.edu.ar/sitio/examenes-finales-turnos-especiales/" },
    { texto: "Inscripción cursadas", href: "https://isfdyt59-bue.infd.edu.ar/sitio/info-cursadas/" },
    { texto: "Estudiantes itinerantes", href: "https://isfdyt59-bue.infd.edu.ar/sitio/estudiantes-itinerantes/" },
    { texto: "Equivalencias", href: "https://isfdyt59-bue.infd.edu.ar/sitio/equivalencias/" },
    { texto: "Salidas educativas: planillas para estudiantes", href: "https://isfdyt59-bue.infd.edu.ar/sitio/salidas-educativas-planillas-para-estudiantes/" }
  ]},
  { texto: "Campus virtual", href: "https://isfdyt59-bue.infd.edu.ar/aula/" },
  { texto: "Oferta académica 2027 (próximamente)", href: "https://isfdyt59-bue.infd.edu.ar/sitio/oferta-academica-2/" },
  { texto: "Cobertura de cátedras", href: "https://isfdyt59-bue.infd.edu.ar/sitio/concursos/" },
  { texto: "Diseños curriculares", href: "https://isfdyt59-bue.infd.edu.ar/sitio/disenos-curriculares/" },
  { texto: "Info: marco normativo", href: "https://isfdyt59-bue.infd.edu.ar/sitio/marco-normativo/" },
  { texto: "Trayectorias estudiantiles", sub: [
    { texto: "Trayectorias estudiantiles", href: "https://isfdyt59-bue.infd.edu.ar/sitio/trayectorias-estudiantiles/" }
    // Agregá acá las demás opciones de este submenú
  ]}
];

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

// Render de contenido
function crearCard(c) {
  const el = document.createElement("article");
  el.className = "card " + c.tipo;
  el.innerHTML = `<h3></h3><p></p><p class="meta"></p>`;
  $("h3", el).textContent = c.nombre;
  $("p", el).textContent = c.desc;
  $(".meta", el).textContent = `${c.duracion} · Turno ${c.turno.toLowerCase()}`;
  return el;
}

function mostrarCarreras(filtro) {
  const cont = $("#listaCarreras");
  cont.replaceChildren();
  carreras
    .filter(c => filtro === "todas" || c.tipo === filtro)
    .forEach(c => cont.append(crearCard(c)));
}

$("#fechas").innerHTML = fechas
  .map(f => `<li><span class="fecha">${f.dia}</span><span>${f.texto}</span></li>`)
  .join("");

$("#listaNovedades").innerHTML = novedades.map(n => {
  const f = new Date(n.fecha + "T00:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
  return `<article><time datetime="${n.fecha}">${f}</time><h3>${n.titulo}</h3><p>${n.texto}</p></article>`;
}).join("");

mostrarCarreras("todas");
$("#anio").textContent = new Date().getFullYear();

// Filtro de carreras
$$(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    $$(".tab").forEach(b => {
      const activo = b === btn;
      b.classList.toggle("active", activo);
      b.setAttribute("aria-pressed", activo);
    });
    mostrarCarreras(btn.dataset.filtro);
  });
});

// Menú principal (se genera desde el arreglo `menu`)
const navEl = $("#nav");

function crearLink(item) {
  const a = document.createElement("a");
  a.textContent = item.texto;
  a.setAttribute("href", item.href || "#");
  if (/^https?:/.test(item.href || "")) { a.target = "_blank"; a.rel = "noopener"; }
  return a;
}

function cerrarSubmenus() {
  $$(".nav-item.open").forEach(li => {
    li.classList.remove("open");
    $(".nav-link", li).setAttribute("aria-expanded", "false");
  });
}

menu.forEach(item => {
  const li = document.createElement("div");
  li.className = "nav-item";
  if (item.sub && item.sub.length) {
    li.classList.add("has-sub");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "nav-link";
    btn.textContent = item.texto + " ▾";
    btn.setAttribute("aria-expanded", "false");
    const ul = document.createElement("ul");
    ul.className = "submenu";
    item.sub.forEach(s => {
      const l = document.createElement("li");
      l.append(crearLink(s));
      ul.append(l);
    });
    btn.addEventListener("click", () => {
      const abrir = !li.classList.contains("open");
      cerrarSubmenus();
      li.classList.toggle("open", abrir);
      btn.setAttribute("aria-expanded", abrir);
    });
    li.append(btn, ul);
  } else {
    li.append(crearLink(item));
  }
  navEl.append(li);
});

document.addEventListener("click", e => { if (!e.target.closest(".nav-item")) cerrarSubmenus(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") cerrarSubmenus(); });

// Menú móvil
const menuBtn = $("#menuBtn");
const nav = $("#nav");
menuBtn.addEventListener("click", () => {
  const abierto = nav.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", abierto);
});
$$("#nav a").forEach(a => a.addEventListener("click", () => {
  cerrarSubmenus();
  nav.classList.remove("open");
  menuBtn.setAttribute("aria-expanded", "false");
}));

// Enlace activo según la sección visible
const secciones = $$("main section[id]");
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      $$("#nav a").forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id));
    }
  });
}, { rootMargin: "-40% 0px -55% 0px" });
secciones.forEach(s => obs.observe(s));

// Formulario con validación
const form = $("#form");
const reglas = {
  nombre: v => v.trim().length >= 3 || "Escribí tu nombre y apellido.",
  email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || "Ingresá un correo válido, por ejemplo nombre@correo.com.",
  mensaje: v => v.trim().length >= 10 || "Contanos tu consulta en al menos 10 caracteres."
};

form.addEventListener("submit", e => {
  e.preventDefault();
  let valido = true;
  Object.keys(reglas).forEach(campo => {
    const input = form.elements[campo];
    const res = reglas[campo](input.value);
    const msg = $(`.error[data-for="${campo}"]`);
    msg.textContent = res === true ? "" : res;
    input.setAttribute("aria-invalid", res !== true);
    if (res !== true) valido = false;
  });
  const ok = $("#ok");
  if (valido) {
    // Acá iría el envío real (fetch a tu backend o servicio de formularios).
    ok.textContent = "Mensaje enviado. Te responderemos pronto.";
    form.reset();
  } else {
    ok.textContent = "";
    $('[aria-invalid="true"]', form).focus();
  }
});
