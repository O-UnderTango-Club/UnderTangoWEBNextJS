'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';

export default function ChatRobot() {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const hostname = window.location.hostname.toLowerCase();
    const isAprendeHost = hostname.startsWith('aprende.');
    const isAprendePath = pathname?.startsWith('/aprende');
    const isElitrosHost = hostname.startsWith('elitros.');
    const isElitrosPath = pathname?.startsWith('/elitros');

    setEnabled(
      !isAprendeHost &&
      !isAprendePath &&
      !isElitrosHost &&
      !isElitrosPath
    );
  }, [pathname]);

  if (!enabled) return null;

  return (
    <Script
      src="https://script2.chat-robot.com/?token=ed1139a97e102e18ec88a20b30f97aa3"
      strategy="lazyOnload"
    />
  );
}
