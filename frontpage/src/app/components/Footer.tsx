import { motion } from 'framer-motion';
import { ArrowRight, ExternalLink, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EntryButton } from './EntrySection';

const teamMembers = [
  'Akshith Reddy Gongireddy',
  'MPS Sriram',
  'Abhishek Gupta',
  'Aniket Singh',
];

export function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="bg-[#071118] px-4 py-16 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 md:p-8"
        >
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase text-cyan-200">Ready to enter PayStream?</p>
              <h3 className="mt-3 text-4xl font-semibold leading-tight">Start from the role that matches your work.</h3>
              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
                Employers manage the treasury and streams. Employees track earned payroll and withdraw from the
                wallet-connected portal.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <EntryButton onClick={() => navigate('/employer-login')}>
                Employer login
                <ArrowRight className="h-4 w-4" />
              </EntryButton>
              <EntryButton variant="dark" onClick={() => navigate('/employee-login')}>
                Employee login
                <ArrowRight className="h-4 w-4" />
              </EntryButton>
            </div>
          </div>
        </motion.div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_0.7fr_0.7fr]">
          <div>
            <h4 className="text-2xl font-semibold">PayStream</h4>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">
              A HeLa-aligned payroll streaming demo with employer treasury controls, employee wallet claims,
              and contract-backed stream state.
            </p>
          </div>

          <div>
            <h5 className="font-semibold">Network</h5>
            <div className="mt-4 space-y-3 text-sm">
              <a href="https://testnet-rpc.helachain.com" className="flex items-center gap-2 text-slate-300 hover:text-cyan-200">
                HeLa testnet RPC
                <ExternalLink className="h-4 w-4" />
              </a>
              <a href="https://testnet-blockexplorer.helachain.com" className="flex items-center gap-2 text-slate-300 hover:text-cyan-200">
                Testnet explorer
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h5 className="font-semibold">Team</h5>
            <div className="mt-4 space-y-2 text-sm text-slate-300">
              {teamMembers.map((member) => (
                <p key={member}>{member}</p>
              ))}
            </div>
            <div className="mt-5 flex items-center gap-2 text-sm text-slate-300">
              <Mail className="h-4 w-4 text-cyan-200" />
              support@corepayroll.app
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-sm text-slate-400">
          2026 PayStream. Built for payroll streaming on HeLa.
        </div>
      </div>
    </footer>
  );
}
