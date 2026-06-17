import Link from "next/link";

export function Nav() {
  return (
    <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5">
      <Link href="/" className="text-sm font-semibold tracking-wide text-slate-950">
        LaunchPilot AI
      </Link>
      <nav className="flex items-center gap-2 text-sm text-slate-600">
        <Link className="rounded-full px-3 py-2 hover:bg-white" href="/dashboard">
          Workspace
        </Link>
        <Link className="rounded-full px-3 py-2 hover:bg-white" href="/settings">
          Privacy
        </Link>
      </nav>
    </header>
  );
}
