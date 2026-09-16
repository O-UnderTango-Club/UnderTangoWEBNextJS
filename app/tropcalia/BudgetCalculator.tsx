"use client";

import { useState } from "react";
import { artistFee, brl, calculateScenario, capacity, commissionRate, defaultReserveRate, formats, type FormatId } from "./finance";
import styles from "./tropcalia.module.css";

const bounded = (value: string, minimum: number, maximum: number) => Math.min(maximum, Math.max(minimum, Number(value) || 0));

export default function BudgetCalculator() {
  const [formatId, setFormatId] = useState<FormatId>("pocket");
  const [people, setPeople] = useState(50);
  const [price, setPrice] = useState(50);
  const [production, setProduction] = useState(600);
  const [reserveRate, setReserveRate] = useState(defaultReserveRate);
  const format = formats.find((item) => item.id === formatId)!;
  const result = calculateScenario(formatId, people, price, reserveRate, production);
  function selectFormat(id: FormatId) {
    setFormatId(id);
    setProduction(formats.find((item) => item.id === id)!.production);
  }
  function reset() {
    selectFormat("pocket"); setPeople(50); setPrice(50); setReserveRate(defaultReserveRate);
  }
  return <div className={styles.calculator}>
    <div className={styles.calcControls}>
      <p className={styles.eyebrow}>SIMULE A NOITE</p>
      <h3>Qual formato a bilheteria sustenta?</h3>
      <div className={styles.formatSwitch} role="group" aria-label="Formato do espetáculo">
        {formats.map((item) => <button key={item.id} type="button" aria-pressed={formatId === item.id} onClick={() => selectFormat(item.id)}>{item.name}</button>)}
      </div>
      <div className={styles.inputHeading}><label htmlFor="people-count">Ingressos pagos</label><input id="people-count" type="number" min="0" max={capacity} step="1" value={people} onChange={(event) => setPeople(Math.floor(bounded(event.target.value, 0, capacity)))} /></div>
      <input aria-label="Ajustar ingressos pagos" className={styles.range} type="range" min="0" max={capacity} value={people} onChange={(event) => setPeople(Number(event.target.value))} />
      <div className={styles.rangeLabels}><span>0</span><span>Expectativa habitual: 50</span><span>150</span></div>
      <div className={styles.inputHeading}><label htmlFor="ticket-price">Preço médio do ingresso (R$)</label><input id="ticket-price" type="number" min="1" max="1000" step="0.01" value={price} onChange={(event) => setPrice(bounded(event.target.value, 1, 1000))} /></div>
      <p className={styles.note}>A proposta parte de R$50. Alterar este valor simula uma hipótese; não muda o preço proposto para o lançamento.</p>
      <details className={styles.advanced}>
        <summary>Ajustar estimativas de custos</summary>
        <div className={styles.inputHeading}><label htmlFor="production-cost">Produção por sessão (R$)</label><input id="production-cost" type="number" min="0" max="100000" step="50" value={production} onChange={(event) => setProduction(bounded(event.target.value, 0, 100000))} /></div>
        <div className={styles.inputHeading}><label htmlFor="fees-reserve">Reserva para taxas e tributos (%)</label><input id="fees-reserve" type="number" min="0" max="50" step="0.5" value={reserveRate} onChange={(event) => setReserveRate(bounded(event.target.value, 0, 50))} /></div>
        <p className={styles.note}>Os 5% iniciais são uma provisão de planejamento, não uma alíquota tributária confirmada. Substituir pelos custos reais antes de contratar ou vender. O piso de R$300 por artista e a comissão de {commissionRate}% de Carlos permanecem preservados.</p>
      </details>
      <button type="button" className={styles.resetButton} onClick={reset}>Restaurar cenário inicial</button>
    </div>
    <div className={styles.calcResult} aria-live="polite" aria-atomic="true">
      <p className={styles.eyebrow}>{format.name} · {people} INGRESSOS × {brl(price)}</p>
      <p className={styles.totalRevenue}>{brl(result.gross)}<span>Receita bruta de ingressos</span></p>
      <dl className={styles.ledger}>
        <div><dt>Artistas · {format.artists} × {brl(artistFee)}</dt><dd>{brl(result.artists)}</dd></div>
        <div><dt>Carlos · {commissionRate}% da bilheteria</dt><dd>{brl(result.commission)}</dd></div>
        <div><dt>Produção e logística</dt><dd>{brl(result.production)}</dd></div>
        <div><dt>Reserva para taxas · {reserveRate}%</dt><dd>{brl(result.reserve)}</dd></div>
        <div className={styles.balance}><dt>Resultado líquido estimado</dt><dd>{brl(result.company)}</dd></div>
      </dl>
      <div className={result.viable ? styles.viable : styles.shortfall} role="status">
        <strong>{result.viable ? "O cenário cobre a meta proposta." : "A bilheteria ainda não sustenta este formato."}</strong>
        <p>{result.viable ? `Cachês, produção, reserva e a meta mínima de ${brl(format.companyFloor)} para UnderTango estão cobertos nesta simulação.` : `Faltam ${brl(result.supportNeeded)} líquidos para cobrir todos os itens e a meta mínima de ${brl(format.companyFloor)} para UnderTango. Não reduzir os cachês para fechar a conta.`}</p>
      </div>
      <div className={styles.thresholds}><p><strong>{result.minimumTickets}</strong> ingressos pagos necessários a {brl(price)}{!result.withinCapacity && <b className={styles.capacityWarning}>Ultrapassa a capacidade de 150 pessoas.</b>}</p><p><strong>{result.minimumPrice === null ? "—" : brl(result.minimumPrice)}</strong> preço médio necessário com {people} pagantes</p></div>
      <p className={styles.note}>Simulação, não receita recebida nem lucro líquido apurado. Cortesias ocupam lugares e não entram na bilheteria. A lotação efetiva precisa respeitar o espaço de palco e dança.</p>
    </div>
  </div>;
}
