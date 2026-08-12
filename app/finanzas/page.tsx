"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "../components/header";
import styles from "./finanzas.module.css";

type MoneyTotal = {
  currency: string;
  amount: number;
};

type Movement = {
  id: string;
  name: string;
  date: string;
  createdTime: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  concept: string;
  medium: string;
  notes: string;
};

type Obligation = {
  id: string;
  name: string;
  type: string;
  concept: string;
  currency: string;
  balance: number;
  status: string;
};

type FinancePayload = {
  balances: MoneyTotal[];
  foodFund: number;
  foodDailyBudget: number;
  foodRunwayDays: number | null;
  receivableTotals: MoneyTotal[];
  receivables: Obligation[];
  recentMovements: Movement[];
  source: "airtable" | "snapshot";
  live: boolean;
  updatedAt: string;
};

function money(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "ARS" ? 0 : 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString("es-AR")}`;
  }
}

function shortDate(value: string) {
  if (!value) return "Sin fecha";
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short" }).format(
    new Date(year, month - 1, day),
  );
}

function totalFor(items: MoneyTotal[], currency: string) {
  return items.find((item) => item.currency === currency)?.amount ?? 0;
}

export default function FinanzasPage() {
  const [payload, setPayload] = useState<FinancePayload | null>(null);
  const [error, setError] = useState("");
  const [currency, setCurrency] = useState("Todos");

  useEffect(() => {
    fetch("/api/finanzas", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then(setPayload)
      .catch(() => setError("No pude cargar el panel financiero."));
  }, []);

  const movements = payload?.recentMovements ?? [];
  const currencies = useMemo(
    () => ["Todos", ...Array.from(new Set(movements.map((movement) => movement.currency).filter(Boolean)))],
    [movements],
  );

  const visibleMovements = useMemo(
    () => movements.filter((movement) => currency === "Todos" || movement.currency === currency),
    [movements, currency],
  );

  const ars = payload ? totalFor(payload.balances, "ARS") : 0;
  const brl = payload ? totalFor(payload.balances, "BRL") : 0;
  const receivableBrl = payload ? totalFor(payload.receivableTotals, "BRL") : 0;

  return (
    <div className={styles.shell}>
      <Header />
      <main className={styles.main}>
        <section className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>Ø UnderTango · caja operativa</p>
            <h1 className={styles.title}>Panel financiero</h1>
            <p className={styles.subtitle}>
              Dinero disponible, fondos con destino y últimos movimientos. Airtable funciona como libro mayor; esta vista solo lee, calcula y ordena la información.
            </p>
          </div>

          <div className={styles.source}>
            <span className={payload?.live ? styles.liveDot : styles.snapshotDot} />
            {payload?.live ? "Airtable en vivo" : "Foto operativa"}
          </div>
        </section>

        {payload && !payload.live && (
          <p className={styles.notice}>
            Se está mostrando una foto de respaldo. Para activar lectura en vivo, la credencial de Airtable debe existir únicamente en el entorno seguro del servidor/Vercel.
          </p>
        )}

        <section className={styles.balanceGrid} aria-label="Saldos principales">
          <article className={`${styles.balanceCard} ${styles.primaryCard}`}>
            <span className={styles.cardLabel}>ARS disponible</span>
            <strong className={styles.balanceValue}>{payload ? money(ars, "ARS") : "—"}</strong>
            <span className={styles.cardHint}>Saldo confirmado registrado en movimientos.</span>
          </article>

          <article className={styles.balanceCard}>
            <span className={styles.cardLabel}>BRL disponible</span>
            <strong className={styles.balanceValue}>{payload ? money(brl, "BRL") : "—"}</strong>
            <span className={styles.cardHint}>Efectivo disponible después del cambio a pesos.</span>
          </article>

          <article className={styles.balanceCard}>
            <span className={styles.cardLabel}>Fondo comida</span>
            <strong className={styles.balanceValue}>{payload ? money(payload.foodFund, "ARS") : "—"}</strong>
            <span className={styles.cardHint}>
              {payload
                ? `${payload.foodRunwayDays ?? 0} días mínimos · ${money(payload.foodDailyBudget, "ARS")}/día`
                : "Calculando autonomía…"}
            </span>
          </article>

          <article className={`${styles.balanceCard} ${styles.receivableCard}`}>
            <span className={styles.cardLabel}>Por cobrar</span>
            <strong className={styles.balanceValue}>{payload ? money(receivableBrl, "BRL") : "—"}</strong>
            <span className={styles.cardHint}>No está incluido en el dinero disponible.</span>
          </article>
        </section>

        <section className={styles.ledgerSection}>
          <div className={styles.sectionHead}>
            <div>
              <p className={styles.sectionEyebrow}>Ledger</p>
              <h2 className={styles.sectionTitle}>Últimos movimientos</h2>
            </div>

            <div className={styles.filters} aria-label="Filtrar moneda">
              {currencies.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`${styles.filterButton} ${currency === item ? styles.activeFilter : ""}`}
                  onClick={() => setCurrency(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {!payload && !error && <div className={styles.stateBox}>Leyendo caja y movimientos…</div>}
          {error && <div className={styles.stateBox}>{error}</div>}

          {payload && (
            <div className={styles.ledger}>
              {visibleMovements.length === 0 && <div className={styles.stateBox}>No hay movimientos para este filtro.</div>}

              {visibleMovements.map((movement) => {
                const incoming = movement.type === "Ingreso";
                return (
                  <article key={movement.id} className={styles.movementRow}>
                    <div className={`${styles.direction} ${incoming ? styles.incoming : styles.outgoing}`}>
                      {incoming ? "+" : "−"}
                    </div>

                    <div className={styles.movementMain}>
                      <div className={styles.movementTopline}>
                        <span className={styles.movementName}>{movement.concept || movement.name}</span>
                        <strong className={`${styles.amount} ${incoming ? styles.positive : styles.negative}`}>
                          {incoming ? "+" : "−"}{money(movement.amount, movement.currency)}
                        </strong>
                      </div>

                      <div className={styles.movementMeta}>
                        <span>{shortDate(movement.date)}</span>
                        <span>{movement.currency}</span>
                        {movement.medium && <span>{movement.medium}</span>}
                        <span>{movement.status}</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {payload && payload.receivables.length > 0 && (
          <section className={styles.receivablesSection}>
            <div>
              <p className={styles.sectionEyebrow}>Futuro ingreso</p>
              <h2 className={styles.sectionTitle}>Cuentas por cobrar</h2>
            </div>

            <div className={styles.receivableList}>
              {payload.receivables.map((item) => (
                <article key={item.id} className={styles.receivableItem}>
                  <div>
                    <strong>{item.name}</strong>
                    <p>{item.concept}</p>
                  </div>
                  <div className={styles.receivableAmount}>
                    <strong>{money(item.balance, item.currency)}</strong>
                    <span>{item.status}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <footer className={styles.footerNote}>
          Disponible = ingresos confirmados − egresos confirmados por moneda. Los saldos por cobrar se muestran aparte y no inflan la caja actual.
        </footer>
      </main>
    </div>
  );
}
