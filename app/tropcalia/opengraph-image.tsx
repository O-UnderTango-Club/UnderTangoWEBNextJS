import { ImageResponse } from 'next/og';

export const alt = 'Raízes da Tríplice Fronteira · UnderTango × TropCalia';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const dynamic = 'force-static';

export default function Image() {
  return new ImageResponse(
    <div style={{ display: 'flex', width: '100%', height: '100%', background: '#241318', color: '#f5ede2', padding: '64px 72px', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, letterSpacing: 3, color: '#e8b184' }}><span>Ø UNDERTANGO × TROPCALIA</span><span>FOZ DO IGUAÇU</span></div>
      <div style={{ display: 'flex', flexDirection: 'column', fontSize: 88, lineHeight: 1.08, letterSpacing: -4 }}><span>Raízes da</span><span style={{ color: '#e8b184' }}>Tríplice Fronteira.</span></div>
      <div style={{ display: 'flex', borderTop: '1px solid #735047', paddingTop: 26, justifyContent: 'space-between', fontSize: 22 }}><span>Paraguai · Argentina · Brasil</span><span style={{ color: '#e8b184' }}>Proposta artística · Out / Nov 2026</span></div>
    </div>,
    { ...size },
  );
}
