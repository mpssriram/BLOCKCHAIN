import React, { useEffect, useMemo, useState } from "react";
import { getCompanyTax, giveBonus, getEmployees } from "../../app/api";

export default function Bonuses() {

  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [companyTaxRate, setCompanyTaxRate] = useState(10);

  useEffect(() => {
    loadEmployees();
  }, []);

  async function loadEmployees() {
    const [employeeData, companyTax] = await Promise.all([
      getEmployees(),
      getCompanyTax(),
    ]);
    setEmployees(employeeData);
    setCompanyTaxRate(Number(companyTax?.default_tax_rate || 10));
  }

  const selectedEmployeeRecord = useMemo(
    () => employees.find((emp) => String(emp.id) === selectedEmployee),
    [employees, selectedEmployee]
  );

  const previewRate = useMemo(() => {
    if (
      selectedEmployeeRecord?.use_custom_tax &&
      selectedEmployeeRecord?.custom_tax_rate !== null &&
      selectedEmployeeRecord?.custom_tax_rate !== undefined
    ) {
      return Number(selectedEmployeeRecord.custom_tax_rate);
    }
    return companyTaxRate;
  }, [companyTaxRate, selectedEmployeeRecord]);

  const grossAmount = Number(amount) || 0;
  const taxPreview = grossAmount > 0 ? (grossAmount * previewRate) / 100 : 0;
  const netPreview = grossAmount > 0 ? grossAmount - taxPreview : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await giveBonus(
        Number(selectedEmployee),
        Number(amount),
        reason
      );

      alert("Bonus applied successfully!");

      setSelectedEmployee("");
      setAmount("");
      setReason("");

    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="p-8 space-y-6">

      <h1 className="text-2xl font-bold">Give Bonus</h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow max-w-md space-y-4">

        {/* Employee Dropdown */}
        <select
          value={selectedEmployee}
          onChange={(e) => setSelectedEmployee(e.target.value)}
          className="w-full p-2 border rounded"
          required
        >
          <option value="">Select Employee</option>
          {employees.map(emp => (
            <option key={emp.id} value={emp.id}>
              {emp.name}
            </option>
          ))}
        </select>

        {/* Gross Amount */}
        <input
          type="number"
          placeholder="Bonus Amount (Gross)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />

        {/* Reason */}
        <input
          type="text"
          placeholder="Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />

        {/* Preview Section */}
        {amount && (
          <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
            <p className="text-gray-600">
              Estimated using {selectedEmployeeRecord?.use_custom_tax ? "employee custom tax" : "company default tax"} at {previewRate.toFixed(2)}%.
              Final tax is calculated by the backend.
            </p>
            <p>Estimated Tax: Rs {taxPreview.toFixed(2)}</p>
            <p>Estimated Net: Rs {netPreview.toFixed(2)}</p>
          </div>
        )}

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700"
        >
          Give Bonus
        </button>
      </form>

    </div>
  );
}
