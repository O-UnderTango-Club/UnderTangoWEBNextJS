"use client";
import { ALL_DAYS, WEEKDAYS } from "../../src/lib/panel-model";
import css from "./panel.module.css";

export default function WeekdayPicker({value,onChange,disabled=false}:{value:number;onChange:(value:number)=>void;disabled?:boolean}) {
  return <fieldset className={css.weekdays} disabled={disabled}>
    <legend>Qué días aparece en Frentes</legend>
    <div>{WEEKDAYS.map((day,index)=>{const bit=1<<index,checked=!!(value&bit);return <label key={day}><input type="checkbox" checked={checked} onChange={()=>onChange(value^bit)}/><span>{day}</span></label>;})}</div>
    <button type="button" className={css.linkButton} disabled={disabled||value===ALL_DAYS} onClick={()=>onChange(ALL_DAYS)}>Todos los días</button>
    <p className={css.help}>Hora de Córdoba. Los otros días queda en Programadas, conservando su posición y estado. Al finalizarla no vuelve a aparecer.</p>
    {value===0&&<p className={css.error} role="alert">Elegí al menos un día de la semana.</p>}
  </fieldset>;
}
