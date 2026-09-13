export const protocolTitle = "807 · Protocolo maestro";
export const protocolUrl = "https://www.undertangoclub.com/807";
export const reviewedAt = "13 de septiembre de 2026";
export const introduction = "El punto de entrada al trabajo de UnderTango. Fuentes oficiales, protocolos y contexto mínimo para que una persona o una IA pueda continuar una tarea.";
export const accessNote = "Este directorio es público. Los documentos, repositorios privados y datos operativos conservan sus permisos. Tener un enlace no concede acceso: cada asistente necesita su conexión autorizada. Si una fuente no abre, indicar cuál falta y continuar sólo con lo que se pueda comprobar. Nunca compartir contraseñas, claves ni sesiones en un chat o documento.";

export const startPrompt = `Trabajás con Pablo Cieslik, director de UnderTango Club. Leé el protocolo maestro: ${protocolUrl}/protocolo.md
Para esta tarea, consultá sólo la fuente y el protocolo necesarios. Supabase contiene el estado operativo; Drive y Docs, los documentos; GitHub, el código y los protocolos. Airtable es histórico.
Buscá antes de crear y respetá la autorización y el alcance del pedido. No inventes datos ni accesos. Si una fuente privada no está disponible, indicá la conexión que falta; no des por realizada una acción.
Respondé en español. Al terminar, distinguí preparado, registrado, enviado, publicado y verificado, y dejá el siguiente paso real. Si necesitás otro asistente, entregá un traspaso breve con fuentes, resultado, pendiente y autorización.
Mi tarea concreta es: [describir el resultado que necesito].`;

export type Resource = { name: string; href: string; purpose: string; access: string };
export const resources: Resource[] = [
  { name: "Panel de control", href: "https://www.undertangoclub.com/panel-de-control", purpose: "Interfaz diaria: acciones, grupos, frentes, proyectos y seguimientos. Consultar aquí el trabajo disponible.", access: "Acceso operativo" },
  { name: "Supabase · Sistema Operativo", href: "https://supabase.com/dashboard/project/lqsnrqnmmeyzcnurfpos", purpose: "Fuente canónica de tareas, negociaciones, operaciones y finanzas. Proyecto: UnderTango — Sistema Operativo. Referencia: lqsnrqnmmeyzcnurfpos.", access: "Conexión o cuenta autorizada" },
  { name: "80 · Drive de Undertango", href: "https://drive.google.com/drive/folders/1f7SeSgRDiCUNCDMXEfvqaeoCmOP-lkVX", purpose: "Carpeta de entrada a materiales, documentos y archivos de la empresa. Usar el documento original y conservar sus enlaces.", access: "Permisos de Google Drive" },
  { name: "00 · UnderTango — Sistema Operativo", href: "https://drive.google.com/drive/folders/1ftfhCpxw8kXLwxrGvgmIHN5BnY3vEsdm", purpose: "Carpeta documental del sistema operativo. Es una ubicación separada de la carpeta 80; revisar la vigencia de cada documento.", access: "Privado · Google Drive" },
  { name: "GitHub · Sistema operativo", href: "https://github.com/O-UnderTango-Club/undertango-operating-system", purpose: "Repositorio de protocolos, reglas y decisiones duraderas. Empezar por README.md y abrir sólo el protocolo aplicable. Los resúmenes de estado pueden estar desactualizados: contrastarlos con Supabase.", access: "Repositorio privado" },
  { name: "GitHub · Web y panel", href: "https://github.com/O-UnderTango-Club/UnderTangoWEBNextJS", purpose: "Código de la web, del panel y de esta página. Rama de producción: main. Los cambios deben revisarse y verificarse antes de publicarlos.", access: "Lectura pública · escritura autorizada" },
  { name: "Vercel · Publicación web", href: "https://vercel.com/pablo-ciesliks-projects/undertangoweb", purpose: "Proyecto undertangoweb: despliegues y estado de publicación de www.undertangoclub.com. Verificar también el resultado visible en producción.", access: "Cuenta autorizada" },
  { name: "Google Calendar", href: "https://calendar.google.com/", purpose: "Eventos con fecha y horario: reuniones, ensayos, shows y compromisos. Confirmar el calendario y sus participantes antes de escribir. Las tareas van en Supabase.", access: "Calendario de destino por confirmar en cada tarea" },
];

const repository = "https://github.com/O-UnderTango-Club/undertango-operating-system/blob/main/";
export const protocols: Resource[] = [
  { name: "Operar en Supabase", href: `${repository}PROTOCOLO_SUPABASE.md`, purpose: "Antes de crear o modificar registros: fuentes, validaciones, auditoría y estados.", access: "GitHub privado" },
  { name: "Sistema nervioso operativo", href: `${repository}PROTOCOLO_SISTEMA_NERVIOSO.md`, purpose: "Distribución del trabajo y la información entre las herramientas.", access: "GitHub privado" },
  { name: "Frentes y prioridades", href: `${repository}PROTOCOLO_FRENTES.md`, purpose: "Planificación y orden de ejecución. Complementar con las reglas de grupos y descanso diario indicadas abajo, incorporadas el 13/09/2026.", access: "GitHub privado" },
  { name: "Cierre y memoria documental", href: `${repository}PROTOCOLO_CIERRE_DOCUMENTAL.md`, purpose: "Cerrar un proyecto preservando su memoria en Drive, sus asuntos abiertos en Supabase y sus aprendizajes reutilizables en GitHub.", access: "GitHub privado" },
  { name: "Instrucciones para agentes", href: `${repository}AGENTS.md`, purpose: "Reglas del repositorio del sistema operativo. En otros repositorios, leer también sus instrucciones locales.", access: "GitHub privado" },
];

export const historicalDoc: Resource = {
  name: "Google Docs · Protocolo del Sistema Nervioso Operativo",
  href: "https://docs.google.com/document/d/1wB3mhkS93XA8gyFP9SMybb6nNvKqjaRL7afy7xS5AGE/edit",
  purpose: "Referencia histórica. Al revisarlo el 13/09/2026 todavía menciona Airtable como sistema operativo. Para trabajar, prevalecen Supabase y los protocolos vigentes de GitHub. Este documento no fue actualizado por la creación de 807.",
  access: "Privado · contenido operativo desactualizado",
};

export const rules = [
  { title: "Una fuente para cada cosa", text: "Supabase conserva el estado; Drive y Docs, los documentos y la memoria; GitHub, el código y las reglas; Calendar, los eventos con horario. Airtable queda sólo como histórico, sin escrituras ni alternativa cuando Supabase no está disponible." },
  { title: "Registrar sin duplicar", text: "Buscar primero. Acciones en operativo.follow_ups; iniciativas en operativo.projects; deudas y compromisos en operativo.obligations; movimientos efectivamente realizados en operativo.movements. Para negociaciones, verificar la estructura y los vínculos vigentes. Usar el panel o los mecanismos auditados existentes; validar campos, relaciones y revisión antes de escribir y recargar después." },
  { title: "Ordenar acciones y grupos", text: "Los proyectos aportan contexto. Una acción independiente tiene su posición; un grupo de acciones puede ocupar una posición propia en el frente y ordenar sus pasos dentro del grupo, como Brasil / Pix. No duplicar sus miembros como acciones independientes al interpretar el ranking ni mover todo un proyecto por cambiar una acción. Usar los controles de grupos del panel y conservar los estados y dependencias de cada paso." },
  { title: "Mostrar trabajo que se puede hacer", text: "Respetar el orden y mostrar hasta tres unidades ejecutables por frente: acciones independientes o grupos con un paso disponible. Las unidades en espera conservan su posición y dejan pasar a las siguientes disponibles. No inventar trabajo para llenar espacios. «Por hoy está bien» es descanso hasta el día siguiente, no cierre definitivo; conservar posición y asuntos abiertos." },
  { title: "Comentarios escritos adrede", text: "El comentario visible de una acción contiene únicamente el texto escrito intencionalmente en su caja de comentario. El historial y la auditoría permanecen separados: no convertir cambios de estado o registros automáticos en comentarios del usuario." },
  { title: "Fechas, recurrencias y dinero", text: "Interpretar fechas en America/Argentina/Cordoba y guardar la fecha concreta. Registrar explícitamente la recurrencia; el título no demuestra una automatización. No crear tareas programadas de ChatGPT sin pedido explícito. Distinguir oportunidad, contratado y cobrado; separar monedas y no contar cuentas por cobrar como dinero disponible." },
  { title: "Actuar con autorización y comprobar", text: "Ejecutar lo autorizado sin repetir preguntas ya resueltas. Preparar y verificar antes de enviar comunicaciones, publicar o realizar efectos externos; la autorización de preparar no equivale a enviar. No afirmar que una acción se hizo si falló o no pudo comprobarse. «Voy a hacerlo» no significa «hecho»." },
];

export const workingModes = [
  { title: "Gemini · Tareas ligeras", text: "Para el reparto elegido por Pablo: resumir material entregado, traducir, ordenar notas o preparar borradores. Darle un objetivo concreto y sólo las fuentes necesarias. Si debe registrar algo, necesita acceso autorizado y aplicar el mismo protocolo de Supabase." },
  { title: "Codex · Trabajo de mayor complejidad", text: "Reservar para cambios de sistema, integraciones, código, problemas que requieren varias fuentes o verificaciones complejas. Entregar el contexto resumido y el resultado buscado para no reconstruir toda la conversación." },
  { title: "Pablo · Criterio y decisiones", text: "Define objetivos, prioridades y decisiones que requieren su intervención. Cada tarea debe dejar un resultado comprobable y el siguiente paso real. Este reparto organiza el uso de recursos; no requiere abrir todos los documentos en cada conversación." },
];
export const handoff = "Objetivo · fuente y enlace · qué quedó preparado o realizado · evidencia de verificación · pendiente concreto · autorización existente o decisión que falta. No copiar conversaciones completas ni credenciales. Antes de continuar, volver a consultar los datos que puedan haber cambiado. Evitar que dos asistentes modifiquen a la vez la misma tarea.";
export const maintenance = "Revisar este índice cuando cambie una herramienta, enlace o regla. La fecha indica la revisión documental, no una comprobación permanente de los servicios. Conservar este maestro en el repositorio de la web; la página y su versión de texto se generan desde el mismo contenido. Las instrucciones actuales de Pablo prevalecen sobre copias históricas. Si dos fuentes vigentes se contradicen, identificar la diferencia y resolverla antes de una escritura que dependa de ella.";

export function protocolMarkdown() {
  const links = (items: Resource[]) => items.map(item => `### ${item.name}\n\n${item.href}\n\n${item.purpose}\n\nAcceso: ${item.access}.`).join("\n\n");
  const paragraphs = (items: { title: string; text: string }[]) => items.map(item => `### ${item.title}\n\n${item.text}`).join("\n\n");
  return `# ${protocolTitle}\n\nDepartamento 80 · UnderTango Club\n\nRevisión documental: ${reviewedAt}.\n\n${introduction}\n\n## Acceso\n\n${accessNote}\n\n## Empezar una tarea\n\n${startPrompt}\n\n## Dónde está cada cosa\n\n${links(resources)}\n\n## Protocolos de trabajo\n\n${links(protocols)}\n\n## Documento histórico en Google Docs\n\n${links([historicalDoc])}\n\n## Reglas operativas\n\n${paragraphs(rules)}\n\n## Reparto del trabajo\n\n${paragraphs(workingModes)}\n\n## Traspaso entre asistentes\n\n${handoff}\n\n## Mantener este maestro\n\n${maintenance}\n\nFuente: ${protocolUrl}\n`;
}
