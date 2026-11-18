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
        className="hw-btn-compact flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold tracking-wide text-amber-300 whitespace-nowrap shrink-0"
      >
        <Download className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Instalează</span>
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
          className="hw-btn-compact flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold tracking-wide text-amber-300 whitespace-nowrap shrink-0"
        >
          <Download className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Adaugă</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
            <div className="hw-chassis w-full max-w-sm rounded-xl p-5 border border-slate-700 text-slate-200">
              <h3 className="font-display text-lg font-bold text-amber-400">
                Instalare pe iPhone / iPad
              </h3>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                1. Apasă butonul <strong>Share</strong> din bara de jos a Safari.<br />
                2. Derulează și alege <strong>Add to Home Screen</strong> pentru modul full-screen.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="hw-tactile-btn mt-4 w-full py-2.5 text-sm font-semibold text-slate-100"
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
