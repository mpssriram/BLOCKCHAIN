import { motion } from 'motion/react';
import { ArrowRight, Network, ShieldCheck, Waypoints } from 'lucide-react';

const layers = [
  {
    title: 'Execution Layer',
    description: 'Processes payroll streams, treasury actions, and contract state transitions.',
  },
  {
    title: 'Consensus Layer',
    description: 'Secures finality so salary and treasury operations settle predictably.',
  },
  {
    title: 'Guardian Layer',
    description: 'Adds integrity checks and operational trust for production-grade apps.',
  },
  {
    title: 'AI Layer',
    description: 'Creates space for intelligent automation and real-time protocol workflows.',
  },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-[linear-gradient(180deg,#f8fdff_0%,#eef8ff_52%,#ffffff_100%)] text-slate-900">
      <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_60%)]" />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.2fr_0.9fr] lg:px-8 lg:py-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white px-4 py-2 text-sm font-medium text-cyan-700 shadow-sm">
            <Network className="h-4 w-4" />
            HeLa-Aligned Payroll Infrastructure
          </div>

          <h1 className="mt-8 max-w-4xl text-5xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-6xl">
            Real-time payroll streaming built with the HeLa Chain playbook.
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
            CorePayroll combines employer treasury controls, employee claim flows, and on-chain stream tracking
            in a cleaner interface inspired by HeLa’s own documentation and explorer surfaces.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Network</p>
              <p className="mt-1 text-base font-semibold text-slate-900">HeLa Testnet</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Asset</p>
              <p className="mt-1 text-base font-semibold text-slate-900">HLUSD ecosystem</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Use case</p>
              <p className="mt-1 text-base font-semibold text-slate-900">Payroll + treasury orchestration</p>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <motion.button
              className="group rounded-2xl bg-cyan-600 px-6 py-4 text-base font-medium text-white shadow-[0_18px_35px_rgba(6,182,212,0.24)] transition hover:bg-cyan-700"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                const el = document.getElementById('login-panel');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <span className="flex items-center gap-2">
                Explore Portals
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </motion.button>
            <a
              href="#network-endpoints"
              className="rounded-2xl border border-slate-300 bg-white px-6 py-4 text-base font-medium text-slate-800 shadow-sm transition hover:border-cyan-300 hover:text-cyan-700"
            >
              View Network Details
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="rounded-[32px] border border-cyan-100 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.10)]"
        >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">HeLa deployment model</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-950">Chain Layers</h2>
            </div>
            <div className="rounded-2xl bg-cyan-50 p-3 text-cyan-700">
              <Waypoints className="h-6 w-6" />
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200">
            {layers.map((layer, index) => (
              <div
                key={layer.title}
                className={`grid gap-3 px-5 py-4 md:grid-cols-[180px_1fr] ${index !== layers.length - 1 ? 'border-b border-slate-200' : ''}`}
              >
                <p className="font-semibold text-slate-900">{layer.title}</p>
                <p className="text-sm leading-7 text-slate-600">{layer.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-950 px-5 py-4 text-white">
              <div className="flex items-center gap-2 text-cyan-300">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-sm font-medium">Explorer-style visibility</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Treasury, stream status, and wallet interactions surfaced in a more structured layout.
              </p>
            </div>
            <div className="rounded-2xl bg-cyan-50 px-5 py-4 text-slate-900">
              <p className="text-sm font-medium text-cyan-700">Stable fees, cleaner ops</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                The interface now leans into the official HeLa docs aesthetic instead of generic startup marketing UI.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
