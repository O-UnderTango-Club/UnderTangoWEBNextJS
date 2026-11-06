"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
export type SiteLanguage = "es" | "en" | "pt";
const dictionary: Record<string, {en:string;pt:string}> = {
  "¿Qué estás buscando?": {
    "en": "What are you looking for?",
    "pt": "O que você está procurando?"
  },
  "Mirá cómo se vive cada experiencia y elegí la que mejor encaja con lo que necesitás.": {
    "en": "Explore each experience and choose what fits you best.",
    "pt": "Conheça cada experiência e escolha a que combina com você."
  },
  "Así se vive un show de tango": {
    "en": "Experience a tango show",
    "pt": "Assim é um show de tango"
  },
  "Una pareja de tango en escena: un formato directo, elegante y adaptable a hoteles, eventos y gastronomía.": {
    "en": "A tango couple on stage: an elegant, flexible format for hotels, events and dining.",
    "pt": "Um casal de tango em cena: um formato elegante e adaptável a hotéis, eventos e gastronomia."
  },
  "Quiero este show →": {
    "en": "I want this show →",
    "pt": "Quero este show →"
  },
  "Así se vive una clase de tango": {
    "en": "Experience a tango class",
    "pt": "Assim é uma aula de tango"
  },
  "Una experiencia simple, participativa y pensada para disfrutar el tango desde el primer momento.": {
    "en": "A welcoming, hands-on experience to enjoy tango from the very first moment.",
    "pt": "Uma experiência simples e participativa para aproveitar o tango desde o primeiro momento."
  },
  "Quiero tomar una clase →": {
    "en": "I want a class →",
    "pt": "Quero fazer uma aula →"
  },
  "Quiero una clase para un paquete turístico →": {
    "en": "Add a class to a travel package →",
    "pt": "Incluir uma aula em pacote turístico →"
  },
  "Así se vive una producción Triple Frontera": {
    "en": "Experience a Triple Border production",
    "pt": "Assim é uma produção da Tríplice Fronteira"
  },
  "Música, danza y producción escénica integradas para experiencias de mayor escala y presencia.": {
    "en": "Music, dance and stage production come together for larger experiences.",
    "pt": "Música, dança e produção cênica integradas em experiências de maior escala."
  },
  "Quiero una producción completa →": {
    "en": "I want a full production →",
    "pt": "Quero uma produção completa →"
  },
  "04 · PRODUCTO DE AUTORÍA": {
    "en": "04 · ORIGINAL PRODUCTION",
    "pt": "04 · PRODUÇÃO AUTORAL"
  },
  "Banda en vivo, bailarines y electrónica en un formato original de Ø UnderTango Club.": {
    "en": "Live band, dancers and electronic music in an original Ø UnderTango Club production.",
    "pt": "Banda ao vivo, bailarinos e música eletrônica em uma produção original do Ø UnderTango Club."
  },
  "Conocer Tango Rave →": {
    "en": "Discover Tango Rave →",
    "pt": "Conheça Tango Rave →"
  },
  "PRODUCCIÓN ARTÍSTICA A MEDIDA": {
    "en": "TAILORED ARTISTIC PRODUCTION",
    "pt": "PRODUÇÃO ARTÍSTICA SOB MEDIDA"
  },
  "Contratá un show en la Triple Frontera": {
    "en": "Book a show in the Triple Border",
    "pt": "Contrate um show na Tríplice Fronteira"
  },
  "Tango, música en vivo y experiencias escénicas diseñadas para cada espacio, público y ocasión.": {
    "en": "Tango, live music and performances designed for each venue, audience and occasion.",
    "pt": "Tango, música ao vivo e experiências cênicas para cada espaço, público e ocasião."
  },
  "Solicitar una propuesta": {
    "en": "Request a proposal",
    "pt": "Solicitar uma proposta"
  },
  "Conocer los espectáculos": {
    "en": "Explore our shows",
    "pt": "Conhecer os espetáculos"
  },
  "Trabajamos por contratación y adaptamos artistas, duración, sonido y despliegue técnico a las necesidades de cada producción.": {
    "en": "We tailor artists, duration, sound and technical production to each event.",
    "pt": "Adaptamos artistas, duração, som e estrutura técnica às necessidades de cada produção."
  },
  "¿Buscás actividades abiertas al público? Ver agenda": {
    "en": "Looking for public activities? View the calendar",
    "pt": "Procurando atividades abertas ao público? Ver agenda"
  },
  "APRENDER TANGO": {
    "en": "LEARN TANGO",
    "pt": "APRENDER TANGO"
  },
  "Clases de tango en la Triple Frontera": {
    "en": "Tango classes in the Triple Border",
    "pt": "Aulas de tango na Tríplice Fronteira"
  },
  "Elegí una clase privada o grupal y descubrí nuestros encuentros en Puerto Iguazú y Foz do Iguaçu.": {
    "en": "Choose a private or group class in Puerto Iguazú or Foz do Iguaçu.",
    "pt": "Escolha uma aula particular ou em grupo em Puerto Iguazú ou Foz do Iguaçu."
  },
  "Clases Privadas": {
    "en": "Private classes",
    "pt": "Aulas particulares"
  },
  "Clases Grupales": {
    "en": "Group classes",
    "pt": "Aulas em grupo"
  },
  "Moda de Tango en Misiones": {
    "en": "Tango fashion in Misiones",
    "pt": "Moda de tango em Misiones"
  },
  "Viste con elegancia y estilo para cada milonga y evento de tango en Iguazú.": {
    "en": "Dress with elegance for milongas and tango events in Iguazú.",
    "pt": "Vista-se com elegância para milongas e eventos de tango em Iguazú."
  },
  "Taller": {
    "en": "Workshop",
    "pt": "Ateliê"
  },
  "Ver Catálogo": {
    "en": "View collection",
    "pt": "Ver catálogo"
  },
  "Nuestra Pasión por el Tango en Iguazú": {
    "en": "Our passion for tango in Iguazú",
    "pt": "Nossa paixão pelo tango em Iguazú"
  },
  "En UnderTango, vivimos y respiramos tango. Nuestra misión es compartir esta pasión con el mundo, creando experiencias únicas que trascienden el baile y conectan personas en la Triple Frontera.": {
    "en": "At UnderTango, we live and breathe tango. We share that passion through experiences that connect people across the Triple Border.",
    "pt": "No UnderTango, vivemos o tango. Compartilhamos essa paixão em experiências que conectam pessoas na Tríplice Fronteira."
  },
  "Nuestra Historia": {
    "en": "Our story",
    "pt": "Nossa história"
  },
  "Fundación de UnderTango como academia de tango moderno.": {
    "en": "UnderTango is founded as a modern tango academy.",
    "pt": "Fundação do UnderTango como academia de tango moderno."
  },
  "Comenzamos a realizar shows como compañía de tango.": {
    "en": "We begin performing as a tango company.",
    "pt": "Começamos a fazer shows como companhia de tango."
  },
  "Expandimos nuestros servicios como productora artística.": {
    "en": "We expand into artistic production.",
    "pt": "Ampliamos nossos serviços como produtora artística."
  },
  "Registro de la marca en el Instituto de la Propiedad Industrial (INPI).": {
    "en": "The brand is registered with the National Institute of Industrial Property (INPI).",
    "pt": "Registro da marca no Instituto Nacional da Propriedade Industrial (INPI)."
  },
  "Lanzamiento de Moda UnderTango para expandir nuestra pasión.": {
    "en": "UnderTango Fashion launches.",
    "pt": "Lançamento da Moda UnderTango."
  },
  "Fundación de la startup tecnológica y la red social de UnderTango Club, aún en construcción.": {
    "en": "The technology startup and UnderTango Club network are founded and remain under development.",
    "pt": "Fundação da startup tecnológica e da rede UnderTango Club, ainda em desenvolvimento."
  },
  "Encuéntranos": {
    "en": "Find us",
    "pt": "Encontre-nos"
  },
  "Información de Contacto": {
    "en": "Contact information",
    "pt": "Informações de contato"
  },
  "Dirección: 1 de Mayo 850, Puerto Iguazú, Misiones": {
    "en": "Address: 1 de Mayo 850, Puerto Iguazú, Misiones",
    "pt": "Endereço: 1 de Mayo 850, Puerto Iguazú, Misiones"
  },
  "Teléfono: +54 9 3757 61-8270": {
    "en": "Phone: +54 9 3757 61-8270",
    "pt": "Telefone: +54 9 3757 61-8270"
  },
  "Nuestros Clientes": {
    "en": "Our clients",
    "pt": "Nossos clientes"
  },
  "Contacto": {
    "en": "Contact",
    "pt": "Contato"
  },
  "Clases": {
    "en": "Classes",
    "pt": "Aulas"
  },
  "Cursos Online": {
    "en": "Online courses",
    "pt": "Cursos online"
  },
  "Mapa de proyectos": {
    "en": "Project map",
    "pt": "Mapa de projetos"
  },
  "Galería de presentaciones": {
    "en": "Performance gallery",
    "pt": "Galeria de apresentações"
  },
  "Próximos Shows": {
    "en": "Upcoming shows",
    "pt": "Próximos shows"
  },
  "Reservas": {
    "en": "Bookings",
    "pt": "Reservas"
  },
  "Equipo": {
    "en": "Team",
    "pt": "Equipe"
  },
  "Fondo de Inversión": {
    "en": "Investment fund",
    "pt": "Fundo de investimento"
  },
  "Página de Inversiones": {
    "en": "Investment page",
    "pt": "Página de investimentos"
  },
  "Boletín Semanal": {
    "en": "Weekly newsletter",
    "pt": "Boletim semanal"
  },
  "Red Cripto": {
    "en": "Crypto network",
    "pt": "Rede cripto"
  },
  "Juego Cripto": {
    "en": "Crypto game",
    "pt": "Jogo cripto"
  },
  "Ayuda": {
    "en": "Help",
    "pt": "Ajuda"
  },
  "Preguntas Frecuentes": {
    "en": "Frequently asked questions",
    "pt": "Perguntas frequentes"
  },
  "Síguenos": {
    "en": "Follow us",
    "pt": "Siga-nos"
  },
  "Un lugar para encontrarnos en el tango.": {
    "en": "A place to meet through tango.",
    "pt": "Um lugar para nos encontrarmos no tango."
  },
  "Clases grupales en Puerto Iguazú y Foz do Iguaçu. Dos ciudades, un mismo abrazo.": {
    "en": "Group tango classes in Puerto Iguazú and Foz do Iguaçu. Two cities, one embrace.",
    "pt": "Aulas de tango em grupo em Puerto Iguazú e Foz do Iguaçu. Duas cidades, um abraço."
  },
  "Ver días y lugares": {
    "en": "See days and places",
    "pt": "Ver dias e locais"
  },
  "Consultar por WhatsApp": {
    "en": "Ask us on WhatsApp",
    "pt": "Fale conosco no WhatsApp"
  },
  "El tango se aprende compartiéndolo.": {
    "en": "Tango is learned together.",
    "pt": "O tango se aprende compartilhando."
  },
  "ENCUENTROS SEMANALES": {
    "en": "WEEKLY GATHERINGS",
    "pt": "ENCONTROS SEMANAIS"
  },
  "Elegí dónde bailar": {
    "en": "Choose where to dance",
    "pt": "Escolha onde dançar"
  },
  "Todos los domingos, en dos espacios de la Triple Frontera.": {
    "en": "Every Sunday in two Triple Border venues.",
    "pt": "Todos os domingos, em dois espaços da Tríplice Fronteira."
  },
  "BRASIL · FOZ DO IGUAÇU": {
    "en": "BRAZIL · FOZ DO IGUAÇU",
    "pt": "BRASIL · FOZ DO IGUAÇU"
  },
  "ARGENTINA · PUERTO IGUAZÚ": {
    "en": "ARGENTINA · PUERTO IGUAZÚ",
    "pt": "ARGENTINA · PUERTO IGUAZÚ"
  },
  "Clase grupal de tango para principiantes": {
    "en": "Group tango class for beginners",
    "pt": "Aula de tango em grupo para iniciantes"
  },
  "Clase grupal de tango": {
    "en": "Group tango class",
    "pt": "Aula de tango em grupo"
  },
  "Domingos": {
    "en": "Sundays",
    "pt": "Domingos"
  },
  "Espacio Gaia Apometria, Foz do Iguaçu.": {
    "en": "Gaia Apometria, Foz do Iguaçu.",
    "pt": "Espaço Gaia Apometria, Foz do Iguaçu."
  },
  "1 de Mayo 815, Puerto Iguazú, Misiones.": {
    "en": "1 de Mayo 815, Puerto Iguazú, Misiones.",
    "pt": "1 de Mayo 815, Puerto Iguazú, Misiones."
  },
  "Consultar por esta clase": {
    "en": "Ask about this class",
    "pt": "Consultar esta aula"
  },
  "Consultanos para conocer los detalles y confirmar la actividad.": {
    "en": "Contact us for details and to confirm the activity.",
    "pt": "Fale conosco para conhecer os detalhes e confirmar a atividade."
  },
  "TAMBIÉN PODÉS VERNOS BAILAR": {
    "en": "WATCH US DANCE TOO",
    "pt": "VOCÊ TAMBÉM PODE NOS VER DANÇAR"
  },
  "Tango en vivo": {
    "en": "Live tango",
    "pt": "Tango ao vivo"
  },
  "Dos encuentros semanales para disfrutar de nuestros shows.": {
    "en": "Two weekly performances to enjoy.",
    "pt": "Dois encontros semanais para aproveitar nossos shows."
  },
  "VIERNES · 21:00": {
    "en": "FRIDAYS · 21:00",
    "pt": "SEXTAS · 21:00"
  },
  "SÁBADOS · 21:00": {
    "en": "SATURDAYS · 21:00",
    "pt": "SÁBADOS · 21:00"
  },
  "Foz do Iguaçu, Brasil": {
    "en": "Foz do Iguaçu, Brazil",
    "pt": "Foz do Iguaçu, Brasil"
  },
  "Puerto Iguazú, Argentina": {
    "en": "Puerto Iguazú, Argentina",
    "pt": "Puerto Iguazú, Argentina"
  },
  "Ver agenda completa": {
    "en": "View full calendar",
    "pt": "Ver agenda completa"
  },
  "NOS GUSTARÍA CONOCERTE": {
    "en": "WE WOULD LOVE TO MEET YOU",
    "pt": "QUEREMOS CONHECER VOCÊ"
  },
  "¿Tenés ganas de bailar?": {
    "en": "Feel like dancing?",
    "pt": "Vamos dançar?"
  },
  "Escribinos y te contamos más sobre las clases y las próximas actividades.": {
    "en": "Contact us to learn about classes and upcoming activities.",
    "pt": "Fale conosco para saber mais sobre aulas e próximas atividades."
  },
  "Hablar con UnderTango": {
    "en": "Talk to UnderTango",
    "pt": "Falar com UnderTango"
  },
  "Shows": {
    "en": "Shows",
    "pt": "Shows"
  },
  "Todos los departamentos": {
    "en": "All departments",
    "pt": "Todos os departamentos"
  },
  "Elegí un país": {
    "en": "Choose a country",
    "pt": "Escolha um país"
  },
  "Más información": {
    "en": "More information",
    "pt": "Mais informações"
  },
  "Argentina": {
    "en": "Argentina",
    "pt": "Argentina"
  },
  "Brasil": {
    "en": "Brazil",
    "pt": "Brasil"
  },
  "Sábados · 21:00": {
    "en": "Saturdays · 21:00",
    "pt": "Sábados · 21:00"
  },
  "Viernes · 21:00": {
    "en": "Fridays · 21:00",
    "pt": "Sextas · 21:00"
  },
  "Domingos · 20:00": {
    "en": "Sundays · 20:00",
    "pt": "Domingos · 20:00"
  },
  "Domingos · 16:00–17:00": {
    "en": "Sundays · 16:00–17:00",
    "pt": "Domingos · 16:00–17:00"
  },
  "Argentina · Puerto Iguazú": {
    "en": "Argentina · Puerto Iguazú",
    "pt": "Argentina · Puerto Iguazú"
  },
  "Brasil · Foz do Iguaçu": {
    "en": "Brazil · Foz do Iguaçu",
    "pt": "Brasil · Foz do Iguaçu"
  },
  "Explorá nuestras áreas y participá de la red.": {
    "en": "Explore our departments and join the network.",
    "pt": "Conheça nossos departamentos e participe da rede."
  },
  "Conocer la red": {
    "en": "Explore the network",
    "pt": "Conhecer a rede"
  },
  "Ver actividades en Argentina": {
    "en": "See activities in Argentina",
    "pt": "Ver atividades na Argentina"
  },
  "Ver actividades en Brasil": {
    "en": "See activities in Brazil",
    "pt": "Ver atividades no Brasil"
  },
  "Navegación principal": {
    "en": "Main navigation",
    "pt": "Navegação principal"
  },
  "Idiomas": {
    "en": "Languages",
    "pt": "Idiomas"
  },
  "Inicio": {
    "en": "Home",
    "pt": "Início"
  },
  "Descubrí las experiencias": {
    "en": "Discover our experiences",
    "pt": "Descubra nossas experiências"
  },
  "Desplegar opciones": {
    "en": "Show options",
    "pt": "Abrir opções"
  },
  "Ir a la Red UnderTango": {
    "en": "Visit the UnderTango Network",
    "pt": "Ir para a Rede UnderTango"
  },
  "Tango Rave en vivo · Ver en YouTube ↗": {
    "en": "Tango Rave live · Watch on YouTube ↗",
    "pt": "Tango Rave ao vivo · Ver no YouTube ↗"
  },
  "Todos los derechos reservados.": {
    "en": "All rights reserved.",
    "pt": "Todos os direitos reservados."
  }
};
const Context = createContext<{language:SiteLanguage;change:(value:SiteLanguage)=>void}>({language:"es",change:()=>{}});
export function HomeLanguageProvider({children}:{children:ReactNode}) {
  const [language,setLanguage]=useState<SiteLanguage>("es");
  useEffect(()=>{ const saved=window.localStorage.getItem("undertango-language"); if(saved==="es"||saved==="en"||saved==="pt") setLanguage(saved); },[]);
  useEffect(()=>{document.documentElement.lang=language==="pt"?"pt-BR":language==="en"?"en":"es-AR";},[language]);
  const change=(value:SiteLanguage)=>{setLanguage(value);window.localStorage.setItem("undertango-language",value);};
  return <Context.Provider value={{language,change}}>{children}</Context.Provider>;
}
export function useHomeLanguage(){
  const {language,change}=useContext(Context);
  return {language,change,t:(value:string)=>language==="es"?value:dictionary[value]?.[language]||value};
}
