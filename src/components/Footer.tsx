export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        <p className="text-xs text-muted max-w-3xl">
          <strong className="font-semibold text-slate-700">Disclaimer:</strong> CuraNav helps you discover and compare hospitals. It does not diagnose conditions or recommend treatment. Some statistics in this prototype are simulated for demonstration — please confirm current costs, availability, and eligibility directly with the hospital.
        </p>
        <div className="flex-shrink-0">
          <p className="text-xs font-semibold text-primary/80 uppercase tracking-wider bg-primary/10 px-3 py-1 rounded-full">
            Prototype for TECHNOVA 2026
          </p>
          <p className="text-[10px] text-muted text-center mt-1 uppercase tracking-wider">
            Responsible AI Theme
          </p>
        </div>
      </div>
    </footer>
  );
}
