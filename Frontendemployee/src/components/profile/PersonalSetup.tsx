import { Briefcase, Calendar, Mail, User } from 'lucide-react';

interface PersonalSetupProps {
  profile: any;
}

export function PersonalSetup({ profile }: PersonalSetupProps) {
  const emp = profile?.employee;
  const userDetails = {
    name: emp?.name || "User",
    email: profile?.email || "--",
    position: (emp?.role || "Employee").charAt(0).toUpperCase() + (emp?.role || "Employee").slice(1),
    joinDate: "Not available",
    employeeId: emp?.id ? `EMP-${emp.id.toString().padStart(4, "0")}` : "--",
    streamStatus: emp?.is_streaming ? "Active" : "Paused",
  };

  return (
    <div className="space-y-6">
      <div className="employee-panel rounded-[1.8rem] p-6">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-white">Profile snapshot</h3>
          <p className="mt-2 text-sm leading-7 text-slate-400">
            Showing the fields currently backed by your account data.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-cyan-300/12 p-3">
              <User className="h-5 w-5 text-cyan-200" />
            </div>
            <div>
              <p className="mb-1 text-sm text-slate-400">Full Name</p>
              <p className="font-medium text-white">{userDetails.name}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-emerald-300/12 p-3">
              <Mail className="h-5 w-5 text-emerald-200" />
            </div>
            <div>
              <p className="mb-1 text-sm text-slate-400">Email Address</p>
              <p className="font-medium text-white">{userDetails.email}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-violet-300/12 p-3">
              <Briefcase className="h-5 w-5 text-violet-200" />
            </div>
            <div>
              <p className="mb-1 text-sm text-slate-400">Position</p>
              <p className="font-medium text-white">{userDetails.position}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-amber-300/12 p-3">
              <Calendar className="h-5 w-5 text-amber-200" />
            </div>
            <div>
              <p className="mb-1 text-sm text-slate-400">Join Date</p>
              <p className="font-medium text-white">{userDetails.joinDate}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 border-t border-white/10 pt-6 md:grid-cols-2">
          <div className="employee-card rounded-[1.4rem] p-4">
            <p className="mb-1 text-sm text-cyan-200">Employee ID</p>
            <p className="text-lg font-semibold text-white">{userDetails.employeeId}</p>
          </div>
          <div className="employee-card rounded-[1.4rem] p-4">
            <p className="mb-1 text-sm text-cyan-200">Stream Status</p>
            <p className="text-lg font-semibold text-white">{userDetails.streamStatus}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
