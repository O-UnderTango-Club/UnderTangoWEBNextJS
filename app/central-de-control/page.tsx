import type { Metadata } from "next";
import Control from "./Control";

export const metadata: Metadata = { title: "Central de control � UnderTango", description: "Vista operativa privada de UnderTango.", robots: { index: false, follow: false } };
export default function Page() { return <div id="control-route-scope"><style>{`#control-route-scope section{opacity:1!important;transform:none!important;transition:none!important}#control-route-scope section h2::after{content:none!important;display:none!important}`}</style><Control /></div>; }

