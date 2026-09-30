'use client';

import { useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { isAcademiaHost, isAcademiaPath } from '../../src/lib/academia-routing';

const subscribeHostname = () => () => {};
const getHostname = () => window.location.hostname.toLowerCase();
const getServerHostname = () => '';

export default function ChatRobot() {
  const pathname = usePathname();
  const hostname = useSyncExternalStore(subscribeHostname, getHostname, getServerHostname);
    const isAprendeHost = hostname.startsWith('aprende.');
    const isAprendePath = pathname?.startsWith('/aprende');
    const isElitrosHost = hostname.startsWith('elitros.');
    const isElitrosPath = pathname?.startsWith('/elitros');

    const enabled = Boolean(hostname) && (
      pathname !== '/' &&
      hostname !== 'rave.undertangoclub.com' &&
      pathname !== '/rave' &&
      !pathname?.startsWith('/panel-de-control') &&
      !pathname?.startsWith('/rave/') &&
      !pathname?.startsWith('/la-cava') &&
      !pathname?.startsWith('/tropcalia') &&
      !pathname?.startsWith('/mapa') &&
      !isAprendeHost &&
      !isAprendePath &&
      !isElitrosHost &&
      !isElitrosPath &&
      !isAcademiaHost(hostname) &&
      !isAcademiaPath(pathname || '')
    );

  // The vendor iframe survives client-side navigation after its script loads.
  // Keep it hidden on home, including when returning from another page.
  if (pathname === '/') return <style>{'#___cr-iframe { display: none !important; }'}</style>;

  if (!enabled) return null;

  return (
    <Script
      src="https://script2.chat-robot.com/?token=ed1139a97e102e18ec88a20b30f97aa3"
      strategy="lazyOnload"
    />
  );
}
