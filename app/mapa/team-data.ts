import type { Point } from "./ProjectMap";

export type TeamMember = {
  id: string; name: string; initials: string; role: string;
  city: string; location: string; coordinates: Point;
};

// City references authorized by Pablo; no personal addresses.
export const team80: TeamMember[] = [
  {
    id: "ale-miguez", name: "Ale Míguez", initials: "AM",
    role: "Representante institucional", city: "CABA",
    location: "Ciudad Autónoma de Buenos Aires · Argentina",
    coordinates: [-34.6095579, -58.3887904],
  },
  {
    id: "maximiliano-rodriguez", name: "Maximiliano Rodríguez", initials: "MR",
    role: "Programador", city: "Córdoba", location: "Córdoba · Argentina",
    coordinates: [-31.4166867, -64.1834193],
  },
  {
    id: "vanesa-cabello", name: "Vanesa Cabello", initials: "VC",
    role: "Inversora", city: "Posadas", location: "Posadas, Misiones · Argentina",
    coordinates: [-27.3664824, -55.8942950],
  },
];
