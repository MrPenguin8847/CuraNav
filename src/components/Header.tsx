import Link from "next/link";
import { Activity } from "lucide-react";

export function Header() {
  return (
    <header className="border-b border-border bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground leading-none tracking-tight">
              CuraNav
            </h1>
            <p className="text-[10px] text-muted font-medium uppercase tracking-wider mt-0.5">
              Find. Compare. Navigate.
            </p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm font-medium text-primary">
            Home
          </Link>
          <Link
            href="#"
            className="text-sm font-medium text-slate-500 hover:text-foreground transition-colors"
          >
            Compare
          </Link>
          <Link
            href="/admin"
            className="text-sm font-medium text-slate-500 hover:text-foreground transition-colors"
          >
            Admin
          </Link>
        </nav>

        <div className="flex md:hidden items-center">
          <button className="btn-ghost !px-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-menu"
            >
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="4" x2="20" y1="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
