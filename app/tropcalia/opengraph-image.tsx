import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
export const alt = "Rave Triple Frontera — Bailinho Fest na TropCalia, por Ø UnderTango";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-static";
export default async function TropCaliaImage(){
 const photo=await readFile(join(process.cwd(),"public/assets/images/grupal1.png"),"base64");
 return new ImageResponse(<div style={{display:"flex",width:"100%",height:"100%",background:"#160f12",position:"relative",color:"#fff4df"}}>
 {/* Original stage photograph, framed for social sharing. */}
 {/* eslint-disable-next-line @next/next/no-img-element */}
 <img src={`data:image/png;base64,${photo}`} alt="" width={760} height={630} style={{position:"absolute",right:0,top:0,objectFit:"cover"}}/>
 <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg, #160f12 0%, #160f12 34%, rgba(22,15,18,0.85) 46%, rgba(22,15,18,0) 72%)"}}/>
 <div style={{display:"flex",flexDirection:"column",position:"absolute",left:58,top:48,width:580,height:534}}>
 <div style={{fontSize:22,letterSpacing:4,color:"#e4bb7b"}}>Ø UNDERTANGO CLUB</div>
 <div style={{display:"flex",flexDirection:"column",fontSize:78,fontWeight:700,lineHeight:1.04,marginTop:67}}><span>Rave</span><span>Triple</span><span>Frontera.</span></div>
 <div style={{fontSize:29,color:"#e4bb7b",marginTop:32}}>Bailinho Fest · TropCalia</div>
 <div style={{fontSize:20,marginTop:22,color:"#e5d7cb"}}>Música ao vivo · Eletrônica · Dança</div>
 </div></div>,size);
}
