import { motion } from 'motion/react';
import { ExternalLink, Mail, Phone } from 'lucide-react';

const teamMembers = [
  'Akshith Reddy Gongireddy',
  'MPS Sriram',
  'Abhishek Gupta',
  'Aniket Singh',
];

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-[#f8fbff] px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-3xl font-semibold text-slate-950">CorePayroll on HeLa</h3>
            <p className="mt-4 max-w-xl text-base leading-8 text-slate-600">
              A cleaner payroll interface for employer treasury operations, employee withdrawals, and HeLa-aligned chain visibility.
            </p>
            <div className="mt-8 space-y-3">
              {teamMembers.map((member) => (
                <div key={member} className="flex items-center gap-3 text-slate-700">
                  <span className="h-2 w-2 rounded-full bg-cyan-500" />
                  <span>{member}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
          >
            <h4 className="text-lg font-semibold text-slate-950">Network References</h4>
            <div className="mt-5 space-y-3 text-sm">
              <a href="https://testnet-rpc.helachain.com" className="flex items-center gap-2 text-slate-600 hover:text-cyan-700">
                Testnet RPC
                <ExternalLink className="h-4 w-4" />
              </a>
              <a href="https://testnet-blockexplorer.helachain.com" className="flex items-center gap-2 text-slate-600 hover:text-cyan-700">
                Testnet Explorer
                <ExternalLink className="h-4 w-4" />
              </a>
              <a href="https://helascan.io/" className="flex items-center gap-2 text-slate-600 hover:text-cyan-700">
                Mainnet Explorer
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.16 }}
          >
            <h4 className="text-lg font-semibold text-slate-950">Contact</h4>
            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-cyan-600" />
                support@corepayroll.app
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-cyan-600" />
                HeLa payroll demo workspace
              </div>
            </div>
          </motion.div>
        </div>

        <div className="mt-12 border-t border-slate-200 pt-6 text-sm text-slate-500">
          © 2026 CorePayroll. Designed with HeLa documentation and explorer patterns in mind.
        </div>
      </div>
    </footer>
  );
}
