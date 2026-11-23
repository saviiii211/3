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
        className="mech-toggle flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-tech text-amber-300 whitespace-nowrap shrink-0 cursor-pointer"
      >
        <Download className="w-3.5 h-3.5" aria-hidden="true" />
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
          className="mech-toggle flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-tech text-amber-300 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">Adaugă</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/80 p-4">
            <div className="chassis-plate w-full max-w-sm p-5 text-stone-200">
              <h3 className="font-display text-lg font-bold text-amber-300">
                Instalare pe iPhone / iPad
              </h3>
              <p className="mt-2 text-sm text-stone-300 leading-relaxed">
                1. Apasă butonul <strong>Share</strong> din bara de jos a Safari.<br />
                2. Derulează și alege <strong>Add to Home Screen</strong> pentru modul full-screen.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mech-key mt-4 w-full py-2.5 text-sm font-semibold text-stone-100 cursor-pointer"
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
