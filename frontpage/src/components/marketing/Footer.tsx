import { motion } from 'framer-motion';
import { ExternalLink, WalletCards } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="bg-[#050816] px-4 py-14 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid gap-10 border-t border-white/10 pt-10 lg:grid-cols-[1fr_0.7fr_0.7fr]"
        >
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-950">
                <WalletCards className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-2xl font-semibold">PayStream</h4>
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/70">Payroll streaming on HeLa</p>
              </div>
            </div>
            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-300">
              Contract-driven payroll streams, backend-backed records, and wallet-connected user flows for employers
              and employees.
            </p>
          </div>

          <div>
            <h5 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Explore</h5>
            <div className="mt-4 space-y-3 text-sm">
              <button
                type="button"
                className="block text-slate-300 transition hover:text-white"
                onClick={() => navigate('/employer-login')}
              >
                Employer Login
              </button>
              <button
                type="button"
                className="block text-slate-300 transition hover:text-white"
                onClick={() => navigate('/employee-login')}
              >
                Employee Portal
              </button>
              <button
                type="button"
                className="block text-slate-300 transition hover:text-white"
                onClick={() => navigate('/auth')}
              >
                Login
              </button>
            </div>
          </div>

          <div>
            <h5 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Network</h5>
            <div className="mt-4 space-y-3 text-sm">
              <a
                href="https://testnet-rpc.helachain.com"
                className="flex items-center gap-2 text-slate-300 transition hover:text-cyan-200"
              >
                HeLa testnet RPC
                <ExternalLink className="h-4 w-4" />
              </a>
              <a
                href="https://testnet-blockexplorer.helachain.com"
                className="flex items-center gap-2 text-slate-300 transition hover:text-cyan-200"
              >
                HeLa testnet explorer
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </motion.div>

        <div className="mt-8 border-t border-white/10 pt-6 text-sm text-slate-400">
          2026 PayStream. Employer and employee payroll flows with contract-backed live state.
        </div>
      </div>
    </footer>
  );
}
