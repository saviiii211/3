import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        aria-label="Instalează aplicația pe ecranul principal"
        className="det-arcade-btn min-w-[44px] min-h-[44px] flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-tech text-[#ffd9a0] whitespace-nowrap shrink-0 cursor-pointer"
      >
        <Download className="w-4 h-4" aria-hidden="true" />
        <span className="hidden sm:inline">Instalează</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          aria-label="Instrucțiuni instalare pe iPhone"
          className="det-arcade-btn min-w-[44px] min-h-[44px] flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-tech text-[#ffd9a0] whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline">Adaugă</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/85 p-4">
            <div className="det-dossier-paper relative w-full max-w-sm p-5">
              <h3 className="font-display text-lg font-bold text-[#15171a]">
                Instalare pe iPhone / iPad
              </h3>
              <p className="mt-2 font-tech text-sm text-[#15171a] leading-relaxed">
                1. Apasă butonul <strong>Share</strong> din bara de jos a Safari.<br />
                2. Derulează și alege <strong>Add to Home Screen</strong> pentru modul full-screen.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="det-arcade-btn mt-4 w-full min-h-[44px] py-2.5 text-sm font-semibold text-[#eceae2] cursor-pointer"
              >
                Închide
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
