export default function ShareLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <main className="max-w-3xl mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="text-center py-6 text-xs text-text-dim">
        Erstellt mit <a href="https://simtest-tau.vercel.app" className="text-accent hover:underline">SimTest</a> — KI-Marktforschung in Minuten
      </footer>
    </div>
  );
}
