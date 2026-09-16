export type FormatId = "pocket" | "premium";
export const artistFee = 300;
export const commissionRate = 10;
export const defaultReserveRate = 5;
export const capacity = 150;
export const formats = [
  { id: "pocket", name: "Pocket", artists: 7, production: 600, companyFloor: 150, recommended: 70,
    addition: "6 bailarinos + 1 harpista",
    description: "O núcleo completo do espetáculo: dança, harpa ao vivo e bases gravadas nos demais quadros." },
  { id: "premium", name: "Premium Deluxe", artists: 12, production: 1200, companyFloor: 300, recommended: 120,
    addition: "Pocket + 5 músicos",
    description: "O núcleo de sete artistas recebe cinco músicos adicionais. Mais música ao vivo, com produção e logística ampliadas." },
] as const;

export function calculateScenario(id: FormatId, people: number, price: number, reserveRate = defaultReserveRate, productionOverride?: number) {
  const format = formats.find((item) => item.id === id);
  if (!format) throw new Error("Formato inválido");
  const production = productionOverride ?? format.production;
  if (!Number.isInteger(people) || people < 0 || people > capacity || !Number.isFinite(price) || price < 0.01 ||
    !Number.isFinite(reserveRate) || reserveRate < 0 || reserveRate >= 100 - commissionRate ||
    !Number.isFinite(production) || production < 0) throw new Error("Valores inválidos para a simulação");
  const cents = (value: number) => Math.round(value * 100);
  const priceCents = cents(price);
  const gross = people * priceCents;
  const commission = Math.round(gross * commissionRate / 100);
  const reserve = Math.round(gross * reserveRate / 100);
  const artists = format.artists * cents(artistFee);
  const productionCents = cents(production);
  const company = gross - commission - reserve - artists - productionCents;
  const target = artists + productionCents + cents(format.companyFloor);
  const contributionRate = 1 - (commissionRate + reserveRate) / 100;
  const available = (revenue: number) => revenue - Math.round(revenue * commissionRate / 100) - Math.round(revenue * reserveRate / 100);
  let minimumTickets = Math.ceil(target / (priceCents * contributionRate));
  while (available(minimumTickets * priceCents) < target) minimumTickets++;
  while (minimumTickets > 0 && available((minimumTickets - 1) * priceCents) >= target) minimumTickets--;
  let minimumPriceCents = people ? Math.ceil(target / (people * contributionRate)) : null;
  if (minimumPriceCents !== null) {
    while (available(people * minimumPriceCents) < target) minimumPriceCents++;
    while (minimumPriceCents > 1 && available(people * (minimumPriceCents - 1)) >= target) minimumPriceCents--;
  }
  return {
    gross: gross / 100, commission: commission / 100, reserve: reserve / 100, artists: artists / 100,
    production: productionCents / 100, company: company / 100,
    supportNeeded: Math.max(0, cents(format.companyFloor) - company) / 100,
    minimumTickets, withinCapacity: minimumTickets <= capacity,
    minimumPrice: minimumPriceCents === null ? null : minimumPriceCents / 100,
    viable: company >= cents(format.companyFloor),
  };
}

export const brl = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
