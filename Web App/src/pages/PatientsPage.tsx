import React, { useEffect, useState } from 'react';
import { patientApi } from '../api/patients';
import type { User, MedicalExpense, ExpenseStatus } from '../types';
import { Modal } from '../components/common/Modal';
import {
  Users,
  Heart,
  AlertCircle,
  Phone,
  FileText,
  CreditCard,
  PlusCircle,
  Shield,
  Download,
  CheckCircle,
} from 'lucide-react';

export const PatientsPage: React.FC = () => {
  const [patients, setPatients] = useState<User[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<User | null>(null);
  const [expenses, setExpenses] = useState<MedicalExpense[]>([]);
  const [isExpensesModalOpen, setIsExpensesModalOpen] = useState(false);
  const [isIdCardOpen, setIsIdCardOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  // New expense form
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('1200.00');
  const [expenseCategory, setExpenseCategory] = useState<'AMBULANCE' | 'EMERGENCY_ICU' | 'MEDICATION'>('AMBULANCE');

  const loadPatients = () => {
    patientApi.getPatients('CITIZEN').then(setPatients);
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const openExpensesModal = async (patient: User) => {
    setSelectedPatient(patient);
    try {
      const data = await patientApi.getMyExpenses();
      setExpenses(data);
      setIsExpensesModalOpen(true);
    } catch (e) {
      console.error(e);
    }
  };

  const openIdCard = (patient: User) => {
    setSelectedPatient(patient);
    setIsIdCardOpen(true);
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    try {
      await patientApi.createExpense({
        incidentId: 'inc-seed-001',
        category: expenseCategory,
        description: expenseDesc,
        amount: parseFloat(expenseAmount),
        status: 'VERIFIED',
      });
      const data = await patientApi.getMyExpenses();
      setExpenses(data);
      setIsAddExpenseOpen(false);
      setExpenseDesc('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateExpenseStatus = async (id: number, status: ExpenseStatus) => {
    try {
      await patientApi.updateExpenseStatus(id, status);
      const data = await patientApi.getMyExpenses();
      setExpenses(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-400" />
            Patient Directory & Medical Records
          </h2>
          <p className="text-xs text-slate-400">
            Digital emergency medical profiles, pre-existing conditions, allergies, and transparent care costs
          </p>
        </div>
      </div>

      {/* Patients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {patients.map((patient) => (
          <div
            key={patient.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md flex flex-col justify-between hover:border-slate-700 transition-all"
          >
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20 font-black text-lg">
                    {patient.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{patient.fullName}</h3>
                    <p className="text-xs text-slate-400">{patient.email}</p>
                  </div>
                </div>

                <span className="flex items-center gap-1 rounded-xl bg-red-500/15 border border-red-500/30 px-2.5 py-1 text-xs font-black text-red-400">
                  <Heart className="h-3 w-3 fill-red-500" />
                  {patient.bloodGroup || 'O+'}
                </span>
              </div>

              {/* Vitals & Clinical Info */}
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-3 space-y-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                    Pre-existing Medical Conditions
                  </span>
                  <p className="text-slate-300 font-medium">
                    {patient.medicalConditions || 'None reported'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                    Allergies & Sensitivities
                  </span>
                  <p className="text-amber-400 font-medium">{patient.allergies || 'None recorded'}</p>
                </div>
                <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800/80 text-slate-400 font-mono text-[11px]">
                  <Phone className="h-3 w-3 text-slate-500" />
                  {patient.phoneNumber || '+91 98765 43210'}
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 mt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2">
              <button
                onClick={() => openIdCard(patient)}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/60 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <Shield className="h-3.5 w-3.5 text-indigo-400" />
                Medical ID
              </button>

              <button
                onClick={() => openExpensesModal(patient)}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600/20 border border-indigo-500/40 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-600 hover:text-white transition-colors"
              >
                <CreditCard className="h-3.5 w-3.5" />
                Care Expenses
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Emergency Medical ID Card Modal */}
      {selectedPatient && (
        <Modal
          isOpen={isIdCardOpen}
          onClose={() => setIsIdCardOpen(false)}
          title="Emergency Medical ID Card"
          subtitle="Instant clinical identification and guardian contacts for paramedic units"
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="rounded-2xl border-2 border-red-500/40 bg-gradient-to-br from-red-950/40 via-slate-900 to-slate-950 p-5 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-red-500/30 pb-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-red-600 p-1.5 text-white">
                    <Heart className="h-5 w-5 fill-white" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black tracking-wider text-red-400 uppercase">
                      VVIT Emergency Medical ID
                    </h4>
                    <span className="text-[10px] text-slate-400">Card ID: VVIT-MED-00{selectedPatient.id}</span>
                  </div>
                </div>
                <div className="rounded-xl bg-red-600 px-3 py-1 text-sm font-black text-white shadow-md shadow-red-600/40">
                  {selectedPatient.bloodGroup || 'O+'}
                </div>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500">Patient Name</span>
                  <p className="text-base font-bold text-white">{selectedPatient.fullName}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500">Allergies</span>
                    <p className="text-amber-400 font-semibold">{selectedPatient.allergies || 'None'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500">Conditions</span>
                    <p className="text-slate-300 font-semibold">{selectedPatient.medicalConditions || 'None'}</p>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-2">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                    Emergency Guardian Contacts
                  </span>
                  <p className="text-slate-200 font-mono text-[11px]">
                    1. Bhargav T (Brother) — +91 98765 43220
                  </p>
                  <p className="text-slate-200 font-mono text-[11px] mt-0.5">
                    2. Teja Y (Friend) — +91 98765 43221
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-red-500/20 text-center text-[10px] text-slate-500">
                Department of CSE · Vasireddy Venkatadri Institute of Technology
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
              >
                <Download className="h-4 w-4" />
                Print / Save PDF
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Expenses Breakdown Modal */}
      {selectedPatient && (
        <Modal
          isOpen={isExpensesModalOpen}
          onClose={() => setIsExpensesModalOpen(false)}
          title={`Medical Expenses & Transparent Billing: ${selectedPatient.fullName}`}
          subtitle="Itemized emergency transport, medication, and clinical care fees"
          maxWidth="xl"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Logged Expense Records
              </span>
              <button
                onClick={() => setIsAddExpenseOpen(true)}
                className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1 text-xs font-bold text-white hover:bg-indigo-500"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                Add Care Fee
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 text-[10px] font-bold uppercase text-slate-400">
                  <tr>
                    <th className="p-3">Category</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-500">
                        No medical care expenses logged for this profile.
                      </td>
                    </tr>
                  ) : (
                    expenses.map((exp) => (
                      <tr key={exp.id}>
                        <td className="p-3 font-semibold text-indigo-400">{exp.category}</td>
                        <td className="p-3 text-slate-300">{exp.description}</td>
                        <td className="p-3 font-mono font-bold text-white">₹{exp.amount.toFixed(2)}</td>
                        <td className="p-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                              exp.status === 'PAID'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : exp.status === 'VERIFIED'
                                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            }`}
                          >
                            {exp.status}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-1">
                          {exp.status !== 'PAID' && (
                            <button
                              onClick={() => handleUpdateExpenseStatus(exp.id, 'PAID')}
                              className="rounded bg-emerald-600/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300 hover:bg-emerald-600 hover:text-white"
                            >
                              Mark Paid
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Expense Form Modal */}
      <Modal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        title="Add Medical Expense Entry"
        subtitle="Log an itemized charge for emergency transport or treatment"
      >
        <form onSubmit={handleAddExpense} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Expense Category
            </label>
            <select
              value={expenseCategory}
              onChange={(e) => setExpenseCategory(e.target.value as any)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="AMBULANCE">AMBULANCE (Emergency Rapid Response Transit)</option>
              <option value="EMERGENCY_ICU">EMERGENCY_ICU (Intensive Trauma Care Unit)</option>
              <option value="MEDICATION">MEDICATION (Critical Resuscitation Drugs)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Description
            </label>
            <input
              type="text"
              value={expenseDesc}
              onChange={(e) => setExpenseDesc(e.target.value)}
              placeholder="e.g. Rapid transit oxygen administration"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Amount (INR ₹)
            </label>
            <input
              type="number"
              step="0.01"
              value={expenseAmount}
              onChange={(e) => setExpenseAmount(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddExpenseOpen(false)}
              className="rounded-xl px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition-colors shadow-md"
            >
              Save Expense
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
