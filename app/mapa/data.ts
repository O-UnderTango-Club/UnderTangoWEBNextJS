export type CityId = "iguazu" | "foz" | "santa-terezinha" | "ciudad-del-este";
export type Activity = {
  id: string;
  number: string;
  city: CityId;
  venue: string;
  title: string;
  status: "En preparación" | "Actividad en el lugar" | "Con fecha" | "Proyecto abierto";
  description: string;
  artists: string[];
  date?: string;
  dateLabel?: string;
  repertoires?: string[];
  coordinates: [number, number];
  location: string;
  approximate?: boolean;
  link?: string;
};

export const updatedLabel = "16 de septiembre de 2026";
export const cities: { id: CityId; name: string; country: string; code: string; coordinates: [number, number] }[] = [
  { id: "iguazu", name: "Puerto Iguazú", country: "Argentina", code: "AR", coordinates: [-25.6107508, -54.5764199] },
  { id: "foz", name: "Foz do Iguaçu", country: "Brasil", code: "BR", coordinates: [-25.5447203, -54.5844872] },
  { id: "santa-terezinha", name: "Santa Terezinha de Itaipu", country: "Brasil", code: "BR", coordinates: [-25.4390809, -54.4019902] },
  { id: "ciudad-del-este", name: "Ciudad del Este", country: "Paraguay", code: "PY", coordinates: [-25.5150091, -54.6061978] },
];

// Public editorial snapshot authorized by Pablo, 2026-09-16.
// These are public participation details, not private operational records.
export const activities: Activity[] = [
  {
    id: "banda-rave", number: "01", city: "iguazu", venue: "Puerto Iguazú", title: "Banda Rave",
    status: "En preparación", description: "Una banda preparando tres repertorios para distintos encuentros.",
    artists: ["Pablo Cieslik", "Agustín Aguilar", "Pablo Tevez", "Iván Escobar", "Sergio Peralta"],
    repertoires: ["Tango Rave", "Peña Rave", "Rave Triple Frontera"],
    coordinates: [-25.6107508, -54.5764199], location: "Puerto Iguazú · referencia de ciudad", approximate: true,
    link: "https://rave.undertangoclub.com/",
  },
  {
    id: "a-piacere", number: "02", city: "iguazu", venue: "A Piacere", title: "Tango en A Piacere",
    status: "Actividad en el lugar", description: "Danza y presencia de UnderTango en Puerto Iguazú. Fechas y horarios a coordinar.",
    artists: ["Evayan Behr", "Luján Rojas"], coordinates: [-25.5994322, -54.5713130], location: "Av. Córdoba 125",
  },
  {
    id: "pata-negra", number: "03", city: "iguazu", venue: "Pata Negra", title: "Tango en Pata Negra",
    status: "Actividad en el lugar", description: "Un punto de encuentro con el tango. Fechas y horarios a coordinar.",
    artists: ["Luján Rojas", "Evayan Behr"], coordinates: [-25.6040824, -54.5677563],
    location: "Tareferos 155 · ubicación aproximada sobre la calle", approximate: true,
  },
  {
    id: "la-cava", number: "04", city: "foz", venue: "La Cava · Grand Carimã", title: "Milonga Triple Fronteriza",
    status: "Con fecha", description: "Una milonga para encontrarnos desde los tres lados de la frontera. Horario por definir.",
    artists: [], date: "2026-10-02", dateLabel: "Viernes 2 de octubre", coordinates: [-25.5768507, -54.5485245],
    location: "Grand Carimã · Av. das Cataratas 4790",
  },
  {
    id: "raices", number: "05", city: "foz", venue: "Centro de Foz", title: "Raíces de la Triple Frontera",
    status: "Proyecto abierto", description: "Preparación de un show en el centro de Foz. Propuesta, espacio, fecha y elenco todavía por definir.",
    artists: [], coordinates: [-25.5447203, -54.5844872], location: "Centro de Foz · espacio por definir", approximate: true,
  },
  {
    id: "boleros-tango", number: "06", city: "santa-terezinha", venue: "Santa Terezinha de Itaipu", title: "Boleros + Tango",
    status: "Con fecha", description: "Preparación de la propuesta de boleros y tango para el 28 de noviembre. Plantel todavía por definir.",
    artists: [], date: "2026-11-28", dateLabel: "Sábado 28 de noviembre", coordinates: [-25.4390809, -54.4019902],
    location: "Santa Terezinha de Itaipu · referencia de ciudad", approximate: true,
  },
  {
    id: "shopping-china", number: "07", city: "ciudad-del-este", venue: "Shopping China", title: "UnderTango en Shopping China",
    status: "Con fecha", description: "Presentación de UnderTango en Ciudad del Este. Horario por definir.",
    artists: ["Aracely Maizares", "Agustín Aguilar", "Pablo Cieslik", "Evayan Behr"],
    date: "2026-09-18", dateLabel: "Viernes 18 de septiembre", coordinates: [-25.5150091, -54.6061978],
    location: "Av. Doctor Luis María Argaña",
  },
];

export const artistNames = Array.from(new Set(activities.flatMap(a => a.artists))).sort((a, b) => a.localeCompare(b, "es"));
