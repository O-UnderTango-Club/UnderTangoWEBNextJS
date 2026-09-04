export type AcademyProject = {
  id: string;
  number: string;
  name: string;
  category: string;
  description: string;
  href: string;
  action: string;
  image?: string;
};

// Add a project here to extend the directory without changing the page layout.
export const academyProjects: AcademyProject[] = [
  {
    id: "aprende",
    number: "01",
    name: "APRENDE",
    category: "Metodología de aprendizaje avanzado",
    description: "Herramientas para aprender, recordar y llevar lo que sabés a la práctica. Empezá con la guía de memoria y mnemotecnia.",
    href: "https://aprende.undertangoclub.com",
    action: "Explorar APRENDE",
  },
  {
    id: "tango",
    number: "02",
    name: "Academia de Tango",
    category: "Online y presencial",
    description: "El cuerpo también aprende. Un espacio para descubrir el tango o profundizar tu baile, a tu ritmo.",
    href: "/academia/tango",
    action: "Conocer las modalidades",
    image: "/assets/images/clasesImage1.png",
  },
  {
    id: "contador",
    number: "03",
    name: "Contador de palabras",
    category: "Herramienta gratuita",
    description: "Pegá tu texto y contá palabras y caracteres al instante. Sin registro. Tu texto se procesa en tu navegador.",
    href: "/academia/contador-de-palabras",
    action: "Abrir el contador",
  },
];

// Use the working address until ownership and DNS of 83.undertangoclub.com are verified.
export const academyOrigin = "https://www.undertangoclub.com/academia";
export const tangoContact = (modality: string) =>
  `https://wa.me/5493757618270?text=${encodeURIComponent(`Hola, llegué desde Academia Under Tango y quiero consultar por clases de tango ${modality}.`)}`;
