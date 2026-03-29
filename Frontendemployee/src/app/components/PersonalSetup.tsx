import { User, Mail, Briefcase, Calendar } from 'lucide-react';

interface PersonalSetupProps {
  profile: any;
}

export function PersonalSetup({ profile }: PersonalSetupProps) {
  const emp = profile?.employee;
  const userDetails = {
    name: emp?.name || 'User',
    email: profile?.email || '--',
    position: (emp?.role || 'Employee').charAt(0).toUpperCase() + (emp?.role || 'Employee').slice(1),
    joinDate: 'March 1, 2026',
    employeeId: emp?.id ? `EMP-2026-${emp.id.toString().padStart(3, '0')}` : '--',
    streamStatus: emp?.is_streaming ? 'Active' : 'Paused',
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Profile Snapshot</h3>
          <p className="mt-2 text-sm text-gray-500">
            Showing the fields currently backed by your account data.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <User className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Full Name</p>
              <p className="text-gray-900 font-medium">{userDetails.name}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Email Address</p>
              <p className="text-gray-900 font-medium">{userDetails.email}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-pink-100 rounded-lg">
              <Briefcase className="w-5 h-5 text-pink-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Position</p>
              <p className="text-gray-900 font-medium">{userDetails.position}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-cyan-100 rounded-lg">
              <Calendar className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Join Date</p>
              <p className="text-gray-900 font-medium">{userDetails.joinDate}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-purple-600 mb-1">Employee ID</p>
            <p className="text-lg font-semibold text-purple-900">{userDetails.employeeId}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-purple-600 mb-1">Stream Status</p>
            <p className="text-lg font-semibold text-purple-900">{userDetails.streamStatus}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
