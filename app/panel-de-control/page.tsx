import type { Metadata } from "next";
import Panel from "./Panel";
export const metadata:Metadata={title:"Panel de control · UnderTango",description:"Panel privado de frentes y acciones de UnderTango.",robots:{index:false,follow:false},alternates:{canonical:"/panel-de-control"}};
export default function Page(){return <Panel/>;}
