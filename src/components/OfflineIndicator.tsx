import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[1150] flex items-center gap-2 det-dymo-label border border-[#e89b2d]/70 px-3 py-1.5 text-xs font-tech text-[#eceae2] shadow-lg"
    >
      <WifiOff className="w-3.5 h-3.5 text-[#e89b2d] shrink-0" aria-hidden="true" />
      <span>OFFLINE · MEMORIE LOCALĂ ACTIVĂ</span>
    </div>
  );
};
