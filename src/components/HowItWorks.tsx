import { MessageSquareText, SlidersHorizontal, GitCompare } from "lucide-react";

const steps = [
  {
    number: 1,
    icon: MessageSquareText,
    heading: "Describe your needs",
    description:
      "Type one plain-language sentence — no medical jargon or category navigation required.",
  },
  {
    number: 2,
    icon: SlidersHorizontal,
    heading: "See transparent matches",
    description:
      "AI extracts your filters and shows matching hospitals, with each data point labeled by source and verification status.",
  },
  {
    number: 3,
    icon: GitCompare,
    heading: "Compare and decide",
    description:
      "Side-by-side comparison of cost, facilities, and distance — with clear labels distinguishing confirmed data from prototype estimates.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 max-w-5xl mx-auto px-4 sm:px-6">
      <div className="text-center mb-14">
        <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-widest rounded-full mb-3">
          Simple Process
        </span>
        <h2 className="text-3xl font-bold text-foreground">
          How CuraNav works
        </h2>
        <p className="mt-3 text-slate-500 max-w-xl mx-auto text-sm">
          From a single sentence to a confident, informed decision — in three steps.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
        {/* Connector line — visible on md+ only */}
        <div className="hidden md:block absolute top-10 left-[calc(16.67%+1.5rem)] right-[calc(16.67%+1.5rem)] h-px bg-primary/15 z-0" />

        {steps.map(({ number, icon: Icon, heading, description }) => (
          <div
            key={number}
            className="relative z-10 flex flex-col items-center text-center p-8 bg-white border border-border rounded-2xl shadow-sm"
          >
            {/* Number badge */}
            <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg mb-4 shadow-md shadow-primary/25">
              {number}
            </div>

            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <Icon className="w-5 h-5 text-primary" />
            </div>

            <h3 className="text-base font-bold text-foreground mb-2">
              {heading}
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              {description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
