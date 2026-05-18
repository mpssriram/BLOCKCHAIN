import { useNavigate } from "react-router-dom";
import { ArrowRight, Mail, ShieldCheck, UserRound } from "lucide-react";

const options = [
    {
        title: "Employer email login",
        description: "Sign in with your email to reach the employer dashboard.",
        route: "/employer-login",
        icon: ShieldCheck,
    },
    {
        title: "Employee email login",
        description: "Use your email to open the employee portal.",
        route: "/employee-login",
        icon: UserRound,
    },
];

export default function AuthChoice() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 px-6 py-12 text-white">
            <div className="mx-auto flex max-w-5xl flex-col gap-8">
                <div className="rounded-3xl border border-white/10 bg-white/8 p-8 shadow-2xl backdrop-blur-xl">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-cyan-100">
                        <Mail className="h-4 w-4" />
                        Choose your login
                    </div>
                    <h1 className="mt-6 text-4xl font-semibold">Go straight to email auth</h1>
                    <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
                        Pick the right portal, then continue with your Gmail or company email address.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {options.map((option) => {
                        const Icon = option.icon;
                        return (
                            <button
                                key={option.route}
                                onClick={() => navigate(option.route)}
                                className="group rounded-3xl border border-white/10 bg-white/8 p-7 text-left shadow-xl transition hover:-translate-y-1 hover:bg-white/12"
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-950">
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-cyan-100 transition-transform group-hover:translate-x-1" />
                                </div>
                                <h2 className="mt-5 text-2xl font-semibold">{option.title}</h2>
                                <p className="mt-3 text-sm leading-7 text-slate-300">{option.description}</p>
                                <div className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 font-semibold text-slate-950">
                                    Open login
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
