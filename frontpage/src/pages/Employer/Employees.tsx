import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, Eye, Plus, Search, Trash2, UserMinus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  createEmployee,
  deactivateEmployee,
  deleteEmployee,
  getAccessRequests,
  getEmployees,
  approveAccessRequest,
  rejectAccessRequest,
} from "../../lib/api";
import {
  ActionButton,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  PageShell,
  SectionCard,
  StatusBadge,
} from "../../components/dashboard/DashboardUI";

type EmployeeRecord = {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active?: boolean;
  is_streaming?: boolean;
  wallet_address?: string | null;
  use_custom_tax?: boolean;
  custom_tax_rate?: number | null;
};

type AccessRequest = {
  id: number;
  email: string;
  requested_role: string;
  created_at: string;
};

function Employees() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addRole, setAddRole] = useState("employee");
  const [addLoading, setAddLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [accessActionId, setAccessActionId] = useState<number | null>(null);

  useEffect(() => {
    loadEmployees();
  }, []);

  async function loadEmployees() {
    try {
      setLoading(true);
      setError("");
      const [data, pendingRequests] = await Promise.all([getEmployees(), getAccessRequests()]);
      setEmployees(Array.isArray(data) ? data : []);
      setAccessRequests(Array.isArray(pendingRequests) ? pendingRequests : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load employees.");
    } finally {
      setLoading(false);
    }
  }

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return employees;
    return employees.filter((emp) =>
      [emp.name, emp.email, emp.role].some((field) => field?.toLowerCase().includes(query))
    );
  }, [employees, search]);

  async function handleAddEmployee(e: React.FormEvent) {
    e.preventDefault();
    if (!addName || !addEmail) return;
    setAddLoading(true);
    try {
      await createEmployee(addName, addEmail, addRole);
      setAddName("");
      setAddEmail("");
      setAddRole("employee");
      setShowAddModal(false);
      await loadEmployees();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add employee");
    } finally {
      setAddLoading(false);
    }
  }

  async function handleDeactivate(employeeId: number) {
    try {
      setActionLoadingId(employeeId);
      await deactivateEmployee(employeeId);
      await loadEmployees();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to deactivate employee");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleDelete(employeeId: number) {
    if (!confirm("Delete this employee record? This only works when no payroll events are attached.")) return;
    try {
      setActionLoadingId(employeeId);
      await deleteEmployee(employeeId);
      await loadEmployees();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete employee");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleAccessRequest(requestId: number, action: "approve" | "reject") {
    try {
      setAccessActionId(requestId);
      if (action === "approve") {
        await approveAccessRequest(requestId);
      } else {
        await rejectAccessRequest(requestId);
      }
      await loadEmployees();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Unable to update the access request.");
    } finally {
      setAccessActionId(null);
    }
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Employees"
        title="Employees"
        actions={
          <ActionButton variant="primary" onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4" />
            Add employee
          </ActionButton>
        }
      />

      {accessRequests.length > 0 ? (
        <SectionCard title={`Pending access (${accessRequests.length})`}>
          <div className="divide-y divide-white/8 rounded-lg border border-white/10 bg-[#08111d]">
            {accessRequests.map((request) => (
              <div key={request.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-white">{request.email}</p>
                  <p className="text-xs text-slate-500">Employee access request</p>
                </div>
                <div className="flex gap-2">
                  <ActionButton
                    variant="primary"
                    disabled={accessActionId === request.id}
                    onClick={() => handleAccessRequest(request.id, "approve")}
                  >
                    <Check className="h-4 w-4" />
                    Approve
                  </ActionButton>
                  <ActionButton
                    variant="danger"
                    disabled={accessActionId === request.id}
                    onClick={() => handleAccessRequest(request.id, "reject")}
                  >
                    <X className="h-4 w-4" />
                    Reject
                  </ActionButton>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}

      <SectionCard
        title="All employees"
      >
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name, email, or role"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-[#08111d] py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300/40 focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-slate-400">
            <StatusBadge tone="info">{employees.length} total employees</StatusBadge>
            <StatusBadge tone="active">
              {employees.filter((emp) => emp.is_streaming).length} active streams
            </StatusBadge>
          </div>
        </div>

        {loading ? <LoadingState label="Loading employees..." /> : null}
        {!loading && error ? <ErrorState description={error} onRetry={loadEmployees} /> : null}
        {!loading && !error && filteredEmployees.length === 0 ? (
          <EmptyState
            title={employees.length === 0 ? "No employees yet" : "No matching employees"}
            description={
              employees.length === 0
                ? "Add your first employee to begin wallet linking, stream operations, and payroll actions."
                : "Try a different search term or clear the filter to see the full employee list."
            }
            actionLabel={employees.length === 0 ? "Add employee" : undefined}
            onAction={employees.length === 0 ? () => setShowAddModal(true) : undefined}
          />
        ) : null}

        {!loading && !error && filteredEmployees.length > 0 ? (
          <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#08111d]">
            <div className="hidden grid-cols-[1.35fr_0.75fr_0.95fr_0.9fr_1.1fr] gap-4 border-b border-white/10 px-5 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 lg:grid">
              <span>Employee</span>
              <span>Status</span>
              <span>Wallet</span>
              <span>Stream</span>
              <span>Actions</span>
            </div>

            <div className="divide-y divide-white/8">
              {filteredEmployees.map((emp, index) => {
                const isActive = emp.is_active !== false;
                const hasWallet = !!emp.wallet_address;
                const isStreaming = !!emp.is_streaming;
                return (
                  <motion.div
                    key={emp.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="grid gap-4 px-5 py-5 lg:grid-cols-[1.35fr_0.75fr_0.95fr_0.9fr_1.1fr] lg:items-center"
                  >
                    <div>
                      <p className="font-semibold text-white">{emp.name}</p>
                      <p className="mt-1 text-sm text-slate-400">{emp.email}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">{emp.role}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <StatusBadge tone={isActive ? "active" : "danger"}>
                        {isActive ? "active" : "inactive"}
                      </StatusBadge>
                    </div>

                    <div className="flex flex-col gap-2">
                      <StatusBadge tone={hasWallet ? "info" : "neutral"}>
                        {hasWallet ? "wallet linked" : "wallet missing"}
                      </StatusBadge>
                      <p className="text-xs text-slate-500">
                        {hasWallet ? `${emp.wallet_address?.slice(0, 8)}...${emp.wallet_address?.slice(-6)}` : "Link in employee details"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <StatusBadge tone={isStreaming ? "active" : "paused"}>
                        {isStreaming ? "stream active" : "stream paused"}
                      </StatusBadge>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <ActionButton variant="secondary" onClick={() => navigate(`/employer-dashboard/employees/${emp.id}`)}>
                        <Eye className="h-4 w-4" />
                        View
                      </ActionButton>
                      <ActionButton
                        variant="ghost"
                        disabled={actionLoadingId === emp.id || !isActive}
                        onClick={() => handleDeactivate(emp.id)}
                      >
                        <UserMinus className="h-4 w-4" />
                        Deactivate
                      </ActionButton>
                      <ActionButton
                        variant="danger"
                        disabled={actionLoadingId === emp.id}
                        onClick={() => handleDelete(emp.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </ActionButton>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ) : null}
      </SectionCard>

      {showAddModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/72 px-4 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
          <div
            className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-[#09111d] p-6 shadow-[0_30px_90px_rgba(2,6,23,0.55)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-semibold text-white">Add employee</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Create a backend employee record so wallet linking, stream management, and payroll actions can begin.
            </p>

            <form onSubmit={handleAddEmployee} className="mt-6 space-y-4">
              <input
                type="text"
                placeholder="Employee name"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300/40 focus:outline-none"
                required
              />
              <input
                type="email"
                placeholder="Employee email"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300/40 focus:outline-none"
                required
              />
              <input
                type="text"
                placeholder="Role"
                value={addRole}
                onChange={(e) => setAddRole(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300/40 focus:outline-none"
              />

              <div className="flex flex-wrap gap-3 pt-2">
                <ActionButton variant="secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </ActionButton>
                <ActionButton type="submit" variant="primary" disabled={addLoading}>
                  <Plus className="h-4 w-4" />
                  {addLoading ? "Adding..." : "Create employee"}
                </ActionButton>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}

export default React.memo(Employees);
