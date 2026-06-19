import Link from "next/link";
import { StartBuildingLink } from "@/components/landing/StartBuildingLink";

export function LandingFooterCta() {
  return (
    <section id="get-started" className="scroll-mt-28 mx-auto max-w-5xl border-t border-white/10 px-5 py-24 pb-16">
      <div className="text-center">
        <p className="mono-label">Ready to start</p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">
          Turn your next idea into a build plan
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-lp-muted">
          Start an interview, run grounded research, and publish your first project to the workspace.
        </p>
        <StartBuildingLink />
      </div>

      <footer className="mt-16 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-white/10 pt-8 font-mono text-xs uppercase tracking-wider text-lp-subtle">
        <Link href="/settings" className="hover:text-white">
          Privacy
        </Link>
        <Link href="/dashboard" className="hover:text-white">
          Workspace
        </Link>
        <Link href="/#about" className="hover:text-white">
          About
        </Link>
        <span className="text-lp-subtle">© LaunchPilot AI</span>
      </footer>
    </section>
  );
}
