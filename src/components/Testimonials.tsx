import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Priya Sharma",
    role: "Patient",
    location: "Delhi",
    rating: 5,
    text: "CuraNav helped me find the right cardiac hospital within my budget. The comparison feature made it so easy to decide — I could see costs, facilities, and ratings side by side.",
    initials: "PS",
    color: "bg-rose-100 text-rose-700",
  },
  {
    name: "Arjun Mehta",
    role: "Caregiver",
    location: "Mumbai",
    rating: 5,
    text: "When my father needed kidney treatment, I was overwhelmed by options. CuraNav's AI search understood exactly what I needed and showed me verified hospitals near us.",
    initials: "AM",
    color: "bg-sky-100 text-sky-700",
  },
  {
    name: "Sneha Reddy",
    role: "Patient",
    location: "Hyderabad",
    rating: 4,
    text: "The transparency is what I love most. Every piece of data tells you if it's verified or estimated — no hidden surprises. Great platform for healthcare decisions!",
    initials: "SR",
    color: "bg-emerald-100 text-emerald-700",
  },
];

export function Testimonials() {
  return (
    <section className="section-padding bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-widest rounded-full mb-4">
            Testimonials
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            What Our <span className="gradient-text">Users Say</span>
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            Real experiences from people who used CuraNav to make informed
            healthcare decisions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="group p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < t.rating
                        ? "text-amber-400 fill-amber-400"
                        : "text-slate-200"
                    }`}
                  />
                ))}
              </div>

              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                &ldquo;{t.text}&rdquo;
              </p>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${t.color}`}
                >
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {t.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {t.role} · {t.location}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
