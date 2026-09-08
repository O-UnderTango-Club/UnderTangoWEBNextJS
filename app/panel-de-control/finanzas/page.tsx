import type { Metadata } from "next";
import Finance from "./Finance";
export const metadata: Metadata = { title:"Finanzas privadas · UnderTango",description:"Obligaciones y movimientos del sistema operativo de UnderTango.",robots:{index:false,follow:false} };
export default function Page() { return <Finance />; }
