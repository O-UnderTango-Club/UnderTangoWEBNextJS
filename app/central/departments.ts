export type DepartmentMember = { name: string; role: string };

export type Department = {
  number: string;
  keyword: string;
  title: string;
  description: string;
  members: DepartmentMember[];
  projects: string[];
};

// Orden espacial de Ø Central: tres filas de tres y la franja transversal 89.
export const departments: Department[] = [
  {
    number: "82", keyword: "Moda", title: "Moda",
    description: "Diseño, vestuario, indumentaria e imagen material. El departamento lleva la identidad de UnderTango al cuerpo, la escena y sus piezas comerciales.",
    members: [],
    projects: ["Video institucional Ø UnderTango — sistema de diez departamentos"],
  },
  {
    number: "83", keyword: "Academia", title: "Academia Under Tango",
    description: "Formación, aprendizaje y herramientas educativas: APRENDE, la Academia de Tango online y presencial y recursos gratuitos para aprender mejor.",
    members: [
      { name: "Pablo Cieslik", role: "Producción y docencia" },
      { name: "Evayan Behr", role: "Práctica escénica" },
    ],
    projects: [
      "APRENDE — Metodología de aprendizaje avanzado",
      "Academia de Tango — online y presencial",
      "Contador de palabras — herramienta gratuita",
      "Video institucional Ø UnderTango — sistema de diez departamentos",
    ],
  },
  {
    number: "84", keyword: "Marketing", title: "Marketing, audiovisual y medios",
    description: "Comunicación, prensa, campañas, redes y producción audiovisual. Convierte la actividad real del sistema en presencia, relato, difusión y demanda.",
    members: [],
    projects: ["Video institucional Ø UnderTango — sistema de diez departamentos"],
  },
  {
    number: "88", keyword: "Equipo central", title: "Equipo central",
    description: "Núcleo humano de dirección, gobernanza y coordinación. Define prioridades, reglas de funcionamiento y los equipos que ejecutan cada proyecto.",
    members: [{ name: "Pablo Cieslik", role: "Dirección general" }],
    projects: [
      "88 — Gobernanza — Manual operativo + Fondo de Decisión",
      "Video institucional Ø UnderTango — sistema de diez departamentos",
    ],
  },
  {
    number: "80", keyword: "Programación", title: "Documentación, programación y sistema operativo",
    description: "Sistema nervioso digital de UnderTango. Construye productos, conecta información y transforma procesos de trabajo en herramientas confiables.",
    members: [{ name: "Pablo Cieslik", role: "Dirección tecnológica" }],
    projects: [
      "Startup Ø UnderTango — Gerencia de proyectos + arquitectura digital",
      "Tablero central — Proyectos activos",
      "Presencia digital y reputación pública",
      "Sistema Bajo Fuego — red internacional de artistas",
      "Experiencia Tango UnderTango — Triple Frontera",
      "Posicionamiento — Productora artística integral Triple Frontera",
      "Brasil — CPF + residente fronteiriço + Pix + MEI/NFS-e",
      "Electrotango + cantante + cuarteto — noviembre",
      "Video institucional Ø UnderTango — sistema de diez departamentos",
    ],
  },
  {
    number: "81", keyword: "Shows", title: "Producción, shows y propuestas",
    description: "Produce y opera propuestas escénicas para hoteles, eventos, espacios, marcas y audiencias, desde la idea inicial hasta la negociación y la función.",
    members: [
      { name: "Pablo Cieslik", role: "Producción" },
      { name: "Evayan Behr", role: "Bailarina" },
      { name: "Eva Janberg", role: "Bailarina" },
      { name: "Thays Andrade", role: "Bailarina" },
      { name: "Renan", role: "Equipo artístico" },
    ],
    projects: [
      "Producto estrella — saxo + dupla de tango",
      "Sistema Bajo Fuego — red internacional de artistas",
      "Estrategia de pricing — shows por segmento de cliente",
      "Experiencia Tango UnderTango — Triple Frontera",
      "Posicionamiento — Productora artística integral Triple Frontera",
      "Alianzas B2B — productoras técnicas y organizadores Triple Frontera",
      "Ø Peña Rave — Peña Los Amigos — septiembre 2026",
      "Brasil — CPF + residente fronteiriço + Pix + MEI/NFS-e",
      "Video institucional Ø UnderTango — sistema de diez departamentos",
    ],
  },
  {
    number: "85", keyword: "Taller", title: "Taller y fábrica",
    description: "Construcción, fabricación, reparación y prototipado. Resuelve objetos, escenografía, equipamiento, utilería y soportes físicos para los proyectos.",
    members: [{ name: "Johnny Wagner", role: "Diseñador, constructor y carpintero" }],
    projects: ["Video institucional Ø UnderTango — sistema de diez departamentos"],
  },
  {
    number: "86", keyword: "Música", title: "Música, ensayos y repertorio",
    description: "Preparación musical y escénica, ensayos, repertorio, arreglos e identidad sonora para las distintas experiencias de UnderTango.",
    members: [],
    projects: [
      "Producto estrella — saxo + dupla de tango",
      "Ø Peña Rave — Peña Los Amigos — septiembre 2026",
      "Electrotango + cantante + cuarteto — noviembre",
      "Video institucional Ø UnderTango — sistema de diez departamentos",
    ],
  },
  {
    number: "87", keyword: "Finanzas", title: "Finanzas, caja y deudas",
    description: "Ordena cobros, pagos, obligaciones, saldos y movimientos para sostener el trabajo y permitir decisiones económicas con información real.",
    members: [],
    projects: ["Ø87 — Tablero financiero", "Video institucional Ø UnderTango — sistema de diez departamentos"],
  },
  {
    number: "89", keyword: "Extensión", title: "Extensión, auditoría y acompañamiento",
    description: "Capa transversal para diagnosticar, ordenar, auditar y acompañar proyectos externos activando las capacidades de los demás departamentos.",
    members: [],
    projects: ["Sistema Bajo Fuego — red internacional de artistas", "Video institucional Ø UnderTango — sistema de diez departamentos"],
  },
];
