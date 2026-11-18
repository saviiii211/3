import React, { useState } from 'react';
import { KeyRound, MapPin, RotateCcw, ShieldCheck, Unlock, X } from 'lucide-react';
import { ADMIN_PIN, DESTINATIONS } from '../config';
import type { ModuleId, PersistedMissionState } from '../game/types';

interface AdminModalProps {
  open: boolean;
  state: PersistedMissionState;
  onClose: () => void;
  onUnlockModule: (id: ModuleId) => void;
  onForceDestination: (destId: number | null) => void;
  onToggleSimulatedGps: () => void;
  onTriggerVictory: () => void;
  onResetAll: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  open,
  state,
  onClose,
  onUnlockModule,
  onForceDestination,
  onToggleSimulatedGps,
  onTriggerVictory,
  onResetAll,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [pinError, setPinError] = useState(false);

  if (!open) return null;

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === ADMIN_PIN) {
      setAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Panou de Administrator"
      className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/80 p-4 overflow-y-auto"
    >
      <div className="hw-chassis w-full max-w-md rounded-xl p-5 border border-amber-500/40 relative">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" aria-hidden="true" />
            <h2 className="font-display text-base font-bold text-slate-100">
              Control Administrator
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Închide panoul de administrator"
            className="hw-btn-compact p-2 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {!authenticated ? (
          <form onSubmit={handlePinSubmit} className="space-y-3">
            <label className="block text-xs font-tech text-slate-300" htmlFor="admin-pin-input">
              Introdu codul PIN de acces:
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                <input
                  id="admin-pin-input"
                  type="password"
                  inputMode="numeric"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setPinError(false);
                  }}
                  placeholder="PIN"
                  autoFocus
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 pl-9 pr-3 py-2.5 font-lcd text-lg tracking-widest text-amber-300 focus:outline-none focus:border-amber-400"
                />
              </div>
              <button
                type="submit"
                className="hw-tactile-btn px-4 py-2 font-display text-xs font-bold text-amber-300"
              >
                ACCES
              </button>
            </div>
            {pinError && (
              <p className="font-tech text-xs text-red-400">PIN incorect.</p>
            )}
          </form>
        ) : (
          <div className="space-y-4">
            {/* Unlock Specific Modules */}
            <div>
              <p className="font-tech text-[11px] text-slate-400 mb-2">
                DEBLOCHEAZĂ / REZOLVĂ MANUAL MODUL:
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                {([1, 2, 3, 4, 5, 6, 7] as ModuleId[]).map((id) => {
                  const isSolved = state.solvedModules.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => onUnlockModule(id)}
                      className={`hw-btn-compact py-2 px-2 font-tech text-xs flex items-center justify-center gap-1 ${
                        isSolved ? 'text-emerald-300 border-emerald-500/40' : 'text-slate-200'
                      }`}
                    >
                      <Unlock className="w-3 h-3" aria-hidden="true" />
                      <span>M{id}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Force Destination Route */}
            <div>
              <p className="font-tech text-[11px] text-slate-400 mb-2">
                FORȚEAZĂ RUTĂ GPS CĂTRE OBIECTIV:
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {DESTINATIONS.map((dest) => {
                  const active = state.forcedDestinationId === dest.id;
                  return (
                    <button
                      key={dest.id}
                      type="button"
                      onClick={() => onForceDestination(active ? null : dest.id)}
                      className={`hw-btn-compact py-2 px-2 font-tech text-xs flex items-center justify-center gap-1 ${
                        active ? 'text-sky-300 border-sky-400' : 'text-slate-200'
                      }`}
                    >
                      <MapPin className="w-3 h-3" aria-hidden="true" />
                      <span>Dest #{dest.id}</span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => onForceDestination(null)}
                  className="hw-btn-compact py-2 px-2 font-tech text-xs text-slate-400"
                >
                  Auto
                </button>
              </div>
            </div>

            {/* Simulated GPS Toggle & Victory / Reset */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onToggleSimulatedGps}
                className={`hw-btn-compact w-full py-2.5 px-3 font-tech text-xs flex items-center justify-between ${
                  state.simulatedGps ? 'text-sky-300 border-sky-500/50' : 'text-slate-300'
                }`}
              >
                <span>Simulare GPS Sinaia (pentru test de acasă)</span>
                <span className="font-bold">{state.simulatedGps ? 'ACTIV' : 'OPRIT'}</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onTriggerVictory}
                  className="hw-tactile-btn py-2.5 px-3 font-tech text-xs text-amber-300"
                >
                  Test Ecran Victorie
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onResetAll();
                    onClose();
                  }}
                  className="hw-tactile-btn py-2.5 px-3 font-tech text-xs text-red-300 flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Reset Joc</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
