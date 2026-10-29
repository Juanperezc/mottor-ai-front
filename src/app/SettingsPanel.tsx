import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Ellipsis, Settings2, X } from 'lucide-react';
import { useSettingsStore, type ImportMode } from '../shared/settings/useSettingsStore';
import { IconButton } from '../shared/ui/IconButton';
import { InfoTooltip } from '../shared/ui/InfoTooltip';

const MODES: { value: ImportMode; label: string; detail: string }[] = [
  { value: 'queue', label: 'Con cola', detail: 'POST /imports · Horizon + Reverb' },
  { value: 'sync', label: 'Sincrónico', detail: 'POST /quotes/batch · secuencial' },
];

/** Floating settings popover (FT-07, WEB-02). */
export function SettingsPanel() {
  const [open, setOpen] = useState(false);
  const { importMode, setImportMode } = useSettingsStore();
  const panelId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLInputElement>('input:checked')?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="fixed right-4 bottom-4 z-40 flex flex-col items-end gap-4 sm:right-6 sm:bottom-6">
      {open && (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-label="Configuración"
          className="w-popover rounded-lg border border-border bg-surface shadow-popover"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
            <h2 className="text-sm font-semibold">Configuración</h2>
            <IconButton icon={X} aria-label="Cerrar configuración" onClick={close} />
          </div>
          <fieldset className="flex flex-col gap-2 px-4 pt-4 pb-3">
            <legend className="eyebrow mb-2 flex items-center gap-1.5">
              Modo de importación <InfoTooltip term="importMode" />
            </legend>
            {MODES.map((mode) => (
              <label
                key={mode.value}
                className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 ${
                  importMode === mode.value ? 'border-ink bg-bg-subtle' : 'border-border'
                }`}
              >
                <input
                  type="radio"
                  name="import-mode"
                  value={mode.value}
                  checked={importMode === mode.value}
                  onChange={() => setImportMode(mode.value)}
                  className="size-4 accent-ink"
                />
                <span className="flex flex-col">
                  <span className="text-sm font-medium">{mode.label}</span>
                  <span className="caption-mono">{mode.detail}</span>
                </span>
              </label>
            ))}
            <p className="mt-1 text-xs text-ink-secondary">
              Se guarda en este navegador (localStorage).
            </p>
          </fieldset>
          <p className="flex items-center gap-2 border-t border-border px-4 py-3 text-xs text-ink-muted">
            <Ellipsis aria-hidden className="size-4" />
            Más opciones próximamente
          </p>
        </div>
      )}
      <button
        ref={toggleRef}
        type="button"
        aria-label="Configuración"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((value) => !value)}
        className={`inline-flex size-12 items-center justify-center rounded-full text-white shadow-lg ${
          open ? 'bg-accent' : 'bg-ink'
        }`}
      >
        <Settings2 aria-hidden className="size-5" />
      </button>
    </div>
  );
}
