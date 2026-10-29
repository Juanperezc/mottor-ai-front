import { Outlet } from 'react-router';

export function AppShell() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="px-page flex h-14 shrink-0 items-center gap-2.5 border-b border-border">
        <img src="/logo.png" alt="" className="size-5.5 object-contain" />
        <span className="text-brand font-semibold">Mottor AI</span>
        <span aria-hidden className="h-3.5 w-px bg-border" />
        <span className="font-mono text-eyebrow tracking-label text-ink-secondary uppercase">
          Comercial
        </span>
      </header>
      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>
    </div>
  );
}
