"use client";
import { ALL_DAYS, WEEKDAYS } from "../../src/lib/panel-model";
import { departments } from "../central/departments";
import css from "./panel.module.css";

export default function WeekdayPicker({value,onChange,disabled=false,department}:{value:number;onChange:(value:number)=>void;disabled?:boolean;department?:string|null}) {
  const assigned = departments.find(item => item.number === department);
  return <><fieldset className={css.weekdays} disabled={disabled}>
    <legend>Días en que aparece</legend>
    <div>{WEEKDAYS.map((day,index)=>{const bit=1<<index,checked=!!(value&bit);return <label key={day}><input type="checkbox" checked={checked} onChange={()=>onChange(value^bit)}/><span>{day}</span></label>;})}</div>
    <button type="button" className={css.linkButton} disabled={disabled||value===ALL_DAYS} onClick={()=>onChange(ALL_DAYS)}>Todos los días</button>
    <p className={css.help}>Se aplica a las acciones del día según la hora de Córdoba.</p>
    {value===0&&<p className={css.error} role="alert">Elegí al menos un día de la semana.</p>}
  </fieldset>{department !== undefined && <p className={css.help}><strong>Departamento</strong> · {assigned ? `${assigned.number} · ${assigned.keyword}` : "Sin departamento"}</p>}</>;
}
