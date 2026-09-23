import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function AurixPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <Header />
      <main className="flex-grow flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Aurix</h1>
          <p className="text-lg text-slate-600">Product page coming soon.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
