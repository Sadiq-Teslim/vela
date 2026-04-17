export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-vela-cyan/20 flex items-center justify-center">
          <span className="text-vela-cyan font-display font-bold text-xl">V</span>
        </div>
        <h1 className="font-display font-extrabold text-4xl md:text-5xl text-vela-primary">
          vela
        </h1>
      </div>
      <p className="text-vela-muted font-body text-lg text-center max-w-md">
        get paid. on-chain.
      </p>
      <div className="flex gap-3 mt-4">
        <a
          href="/dashboard"
          className="bg-vela-cyan text-vela-void font-display font-bold px-6 py-3 rounded-[10px] text-sm hover:brightness-110 transition"
        >
          Open Dashboard
        </a>
        <a
          href="/invoice/new"
          className="border border-vela-cyan/30 text-vela-cyan font-display font-bold px-6 py-3 rounded-[10px] text-sm hover:bg-vela-cyan/10 transition"
        >
          Create Invoice
        </a>
      </div>
    </main>
  );
}
