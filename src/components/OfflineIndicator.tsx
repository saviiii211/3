import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[1150] flex items-center gap-2 bakelite-surface border border-amber-600/70 px-3 py-1.5 text-xs font-tech text-amber-200 shadow-lg"
    >
      <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
      <span>OFFLINE · MEMORIE LOCALĂ ACTIVĂ</span>
    </div>
  );
};
