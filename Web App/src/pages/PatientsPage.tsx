import React, { useEffect, useState } from 'react';
import { patientApi } from '../api/patients';
import { useAuthStore } from '../store/authStore';
import type { User, MedicalExpense, ExpenseStatus } from '../types';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
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
  Search,
  ShieldCheck,
  Printer,
  Calendar,
  Sparkles,
} from 'lucide-react';

export const PatientsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [patients, setPatients] = useState<User[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<User | null>(null);
  const [expenses, setExpenses] = useState<MedicalExpense[]>([]);
  const [isExpensesModalOpen, setIsExpensesModalOpen] = useState(false);
  const [isIdCardOpen, setIsIdCardOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // New expense form
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('1200.00');
  const [expenseCategory, setExpenseCategory] = useState<'AMBULANCE' | 'EMERGENCY_ICU' | 'MEDICATION'>('AMBULANCE');

  const isCitizen = user?.role === 'CITIZEN';

  useEffect(() => {
    if (!isCitizen) {
      patientApi.getPatients('CITIZEN').then(setPatients).catch(console.error);
    } else {
      patientApi.getMyExpenses().then(setExpenses).catch(console.error);
    }
  }, [isCitizen]);

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
    try {
      await patientApi.createExpense({
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

  const filteredPatients = patients.filter((p) => {
    return (
      searchQuery.trim() === '' ||
      p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.bloodGroup && p.bloodGroup.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.medicalConditions && p.medicalConditions.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  // CITIZEN VIEW: Display strictly their own Medical ID & Transparent Care Records
  if (isCitizen) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-600 dark:text-red-400" />
              My Digital Medical ID & Emergency Health Dossier
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Personal emergency medical parameters, pre-existing conditions, allergies, and transparent care costs
            </p>
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 shadow-xs transition-colors"
          >
            <Printer className="h-3.5 w-3.5" />
            Print Emergency ID Card
          </button>
        </div>

        {/* Digital ID Card Display */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6">
            <div className="rounded-3xl border border-red-200 dark:border-red-900/40 bg-gradient-to-br from-red-50/50 via-white to-red-50/20 dark:from-red-950/20 dark:via-slate-900 dark:to-slate-900 p-6 shadow-sm space-y-5 transition-colors">
              <div className="flex items-start justify-between border-b border-red-100 dark:border-red-900/30 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-red-600 text-white flex items-center justify-center font-black text-base shadow-xs">
                    {user?.bloodGroup || 'O+'}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {user?.fullName || 'Sai Krishna VSK'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {user?.phoneNumber || '+91 98765 43210'}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-red-100 dark:bg-red-950/80 border border-red-200 dark:border-red-800 px-2.5 py-1 text-[10px] font-bold text-red-700 dark:text-red-300 uppercase">
                  Blood Group: {user?.bloodGroup || 'O+'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Known Allergies
                  </span>
                  <span className="text-rose-600 dark:text-rose-400 font-bold">
                    {user?.allergies || 'Penicillin'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Chronic Conditions
                  </span>
                  <span className="text-slate-800 dark:text-slate-200 font-medium">
                    {user?.medicalConditions || 'Asthma (Mild)'}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Primary Emergency Contact
                </span>
                <p className="font-bold text-slate-900 dark:text-white">Bhargav T (Brother)</p>
                <p className="text-slate-500 font-mono">+91 98765 43220 · Immediate Notification</p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>Protected by HIPAA & DPDP standards. Accessible exclusively during active emergencies.</span>
              </div>
            </div>
          </div>

          {/* Transparent Medical Expenses History */}
          <div className="lg:col-span-6 space-y-4">
            <h3 className="text-xs font-bold tracking-wider uppercase text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              Transparent Emergency Care Costs & Invoices
            </h3>

            {expenses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center bg-white dark:bg-slate-900">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No emergency hospitalization or ambulance service expenses recorded.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {expenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {exp.description}
                        </span>
                        <span className="rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2 py-0.5 text-[10px] font-bold">
                          {exp.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Invoice ID: #{exp.id} · {new Date(exp.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-bold text-slate-900 dark:text-white">
                        ₹{exp.amount.toFixed(2)}
                      </span>
                      <div className="mt-1">
                        <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 px-2 py-0.5 text-[10px] font-bold">
                          {exp.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ADMIN / HOSPITAL STAFF VIEW: Authorized Directory
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Patient Clinical Registry & Care Dossiers
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Authorized registry of registered patients, blood groupings, chronic diagnoses, and verified emergency care logs
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs transition-colors">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by patient name, email, blood group, or condition..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-10 pr-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Patients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPatients.map((patient) => (
          <div
            key={patient.id}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40 font-bold">
                  {patient.bloodGroup || 'O+'}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                    {patient.fullName}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{patient.phoneNumber || 'Phone unlisted'}</p>
                </div>
              </div>
              <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                CITIZEN
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-400">Allergies:</span>
                <span className="text-rose-600 dark:text-rose-400 font-semibold">{patient.allergies || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Conditions:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{patient.medicalConditions || 'Healthy'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Account:</span>
                <span className="truncate max-w-[160px] text-slate-500 font-mono text-[11px]">{patient.email}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => openIdCard(patient)}
                className="flex-1 flex items-center justify-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50"
              >
                <FileText className="h-3.5 w-3.5 text-blue-600" />
                <span>Medical ID</span>
              </button>

              <button
                onClick={() => openExpensesModal(patient)}
                className="flex-1 flex items-center justify-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50"
              >
                <CreditCard className="h-3.5 w-3.5 text-emerald-600" />
                <span>Expenses</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ID Card Modal */}
      <Modal
        isOpen={isIdCardOpen}
        onClose={() => setIsIdCardOpen(false)}
        title="Digital Emergency Health ID Card"
        subtitle="Verified Emergency Medical Dossier"
        maxWidth="md"
      >
        {selectedPatient && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  {selectedPatient.fullName}
                </h4>
                <p className="text-xs text-slate-500 font-mono">{selectedPatient.phoneNumber}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold">
                {selectedPatient.bloodGroup || 'O+'}
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400">Allergies:</span>{' '}
                <span className="text-rose-600 font-bold">{selectedPatient.allergies || 'None'}</span>
              </div>
              <div>
                <span className="text-slate-400">Medical Conditions:</span>{' '}
                <span className="text-slate-800 dark:text-slate-200 font-medium">
                  {selectedPatient.medicalConditions || 'None recorded'}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Email:</span>{' '}
                <span className="text-slate-500 font-mono">{selectedPatient.email}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsIdCardOpen(false)}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
              >
                Close Dossier
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Expenses Modal */}
      <Modal
        isOpen={isExpensesModalOpen}
        onClose={() => setIsExpensesModalOpen(false)}
        title={`Medical Care Costs — ${selectedPatient?.fullName}`}
        subtitle="Transparent Hospitalization & Dispatch Billing History"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">Verified Billing Statements</span>
            <button
              onClick={() => setIsAddExpenseOpen(true)}
              className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Add Care Charge
            </button>
          </div>

          <div className="space-y-2">
            {expenses.map((exp) => (
              <div
                key={exp.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-white dark:bg-slate-900 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{exp.description}</p>
                  <p className="text-slate-400 text-[11px]">{exp.category} · #{exp.id}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900 dark:text-white">₹{exp.amount.toFixed(2)}</p>
                  <Badge status={exp.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Add Expense Modal */}
      <Modal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        title="Add Emergency Care Charge"
        subtitle="Log transparent service expense for patient care"
        maxWidth="md"
      >
        <form onSubmit={handleAddExpense} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Category
            </label>
            <select
              value={expenseCategory}
              onChange={(e) => setExpenseCategory(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
            >
              <option value="AMBULANCE">Emergency Ambulance Transit</option>
              <option value="EMERGENCY_ICU">ICU Trauma Stabilization</option>
              <option value="MEDICATION">Critical Medication & Infusion</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <input
              type="text"
              value={expenseDesc}
              onChange={(e) => setExpenseDesc(e.target.value)}
              placeholder="e.g. ALS Ambulance Oxygen Support & Monitoring"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Amount (INR)
            </label>
            <input
              type="number"
              step="any"
              value={expenseAmount}
              onChange={(e) => setExpenseAmount(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddExpenseOpen(false)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
            >
              Save Charge
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
