import Link from "next/link";
import type { ReactNode } from "react";
import { BrainCircuit, BriefcaseBusiness, GraduationCap } from "lucide-react";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/">
          <span className="brand-mark">
            <BrainCircuit size={24} aria-hidden="true" />
          </span>
          <span>
            <strong>AI Sapere Aude</strong>
            <small>Propuestas y formacion</small>
          </span>
        </Link>

        <nav className="nav-links" aria-label="Principal">
          <Link href="/">
            <BriefcaseBusiness size={18} aria-hidden="true" />
            Propuestas
          </Link>
          <Link href="/professors">
            <GraduationCap size={18} aria-hidden="true" />
            Profesores
          </Link>
        </nav>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}
