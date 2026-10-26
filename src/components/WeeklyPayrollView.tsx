import React, { useState, useMemo } from 'react';
import {
  Users,
  Calendar,
  DollarSign,
  Download,
  CheckCircle,
  Clock,
  Printer,
  ChevronRight,
  FileSpreadsheet,
  Plus,
  Trash2,
  AlertCircle,
  Receipt,
  FileText,
  BadgeAlert,
  HelpCircle,
  Building,
} from 'lucide-react';
import { Worker, Project, PayrollEntry, PayrollItemData, CashAdvance } from '../types';
import { DEFAULT_WORKERS, DEFAULT_PAYROLL, DEFAULT_COMPANY, DEFAULT_PROJECTS, DEFAULT_CASH_ADVANCES } from '../data/defaultData';
import { Payslip } from './Payslip';
import { PayrollMasterPrinter } from './PayrollMasterPrinter';
import { calculateProjectLaborAllocation } from '../utils/payrollExpenseHelper';
import { exportPayrollMasterPdf, exportSinglePayslipPdf } from '../utils/pdfExport';

export interface WeeklyPayrollViewProps {
  currentProject?: Project;
  workers?: Worker[];
  payroll?: PayrollEntry[];
  cashAdvances?: CashAdvance[];
  onAddCashAdvance?: (ca: Omit<CashAdvance, 'id'>) => void;
  onDeleteCashAdvance?: (id: string) => void;
  onToggleCashAdvanceStatus?: (id: string) => void;
  onUpdatePayrollEntry?: (updated: PayrollEntry) => void;
  onMarkAllPaid?: () => void;
  onLogAttendanceClick?: () => void;
  onPostLaborExpense?: (amount: number, description: string) => void;
}

interface CutoffOption {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
}

const PRESET_CUTOFFS: CutoffOption[] = [
  {
    id: 'current',
    label: 'October 19 - October 25, 2026 (Current Cutoff)',
    startDate: '2026-10-19',
    endDate: '2026-10-25',
  },
  {
    id: 'past-week-2',
    label: 'October 12 - October 18, 2026 (Past Cutoff - Week 2)',
    startDate: '2026-10-12',
    endDate: '2026-10-18',
  },
  {
    id: 'past-week-1',
    label: 'October 05 - October 11, 2026 (Past Cutoff - Week 1)',
    startDate: '2026-10-05',
    endDate: '2026-10-11',
  },
  {
    id: 'past-sept',
    label: 'September 28 - October 04, 2026 (Past Cutoff - Sept End)',
    startDate: '2026-09-28',
    endDate: '2026-10-04',
  },
];

export const WeeklyPayrollView: React.FC<WeeklyPayrollViewProps> = ({
  currentProject = DEFAULT_PROJECTS[0],
  workers: externalWorkers = DEFAULT_WORKERS,
  payroll: externalPayroll,
  cashAdvances: externalCashAdvances = DEFAULT_CASH_ADVANCES,
  onAddCashAdvance,
  onDeleteCashAdvance,
  onToggleCashAdvanceStatus,
  onUpdatePayrollEntry,
  onMarkAllPaid,
  onLogAttendanceClick,
  onPostLaborExpense,
}) => {
  // Cutoff selection state
  const [selectedCutoffId, setSelectedCutoffId] = useState<string>('current');
  const [customStartDate, setCustomStartDate] = useState('2026-10-19');
  const [customEndDate, setCustomEndDate] = useState('2026-10-25');

  // Internal state fallbacks
  const [internalPayroll, setInternalPayroll] = useState<PayrollEntry[]>(DEFAULT_PAYROLL);
  const [internalCashAdvances, setInternalCashAdvances] = useState<CashAdvance[]>(DEFAULT_CASH_ADVANCES);

  // Modals state
  const [selectedWorkerForPayslip, setSelectedWorkerForPayslip] = useState<string | null>(null);
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [showMasterPrinter, setShowMasterPrinter] = useState(false);
  const [showCashAdvanceModal, setShowCashAdvanceModal] = useState(false);
  const [showCashAdvanceLedger, setShowCashAdvanceLedger] = useState(false);
  const [laborPostedMessage, setLaborPostedMessage] = useState<string | null>(null);

  // Cash Advance form state
  const [caWorkerId, setCaWorkerId] = useState<string>(externalWorkers[0]?.id || '');
  const [caAmount, setCaAmount] = useState<number>(500);
  const [caDate, setCaDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [caReason, setCaReason] = useState<string>('Emergency family allowance / Grocery');

  // Active data sources
  const activeCashAdvances = externalCashAdvances || internalCashAdvances;
  const basePayroll = externalPayroll || internalPayroll;

  // Determine active date range
  const { cutoffStartDate, cutoffEndDate, cutoffLabel } = useMemo(() => {
    if (selectedCutoffId === 'custom') {
      return {
        cutoffStartDate: customStartDate,
        cutoffEndDate: customEndDate,
        cutoffLabel: `${customStartDate} to ${customEndDate}`,
      };
    }
    const preset = PRESET_CUTOFFS.find((p) => p.id === selectedCutoffId) || PRESET_CUTOFFS[0];
    return {
      cutoffStartDate: preset.startDate,
      cutoffEndDate: preset.endDate,
      cutoffLabel: preset.label,
    };
  }, [selectedCutoffId, customStartDate, customEndDate]);

  // Merge cash advances into worker payroll entries dynamically
  const activePayroll: PayrollEntry[] = useMemo(() => {
    return basePayroll.map((entry) => {
      const workerCAs = activeCashAdvances.filter(
        (ca) => ca.workerId === entry.workerId && !ca.deducted
      );
      const totalCA = workerCAs.reduce((sum, item) => sum + item.amount, 0);

      const days = entry.daysWorked || 0;
      const rate = entry.dailyRate || 0;
      const ot = entry.otHours ?? entry.overtimeHours ?? 0;
      const regularPay = days * rate;
      const otPay = (rate / 8) * 1.25 * ot;
      const grossPay = regularPay + otPay;
      const sssPhilhealth = 150;
      const totalDeductions = totalCA + sssPhilhealth;
      const netPay = Math.max(0, grossPay - totalDeductions);

      return {
        ...entry,
        regularPay,
        otPay,
        grossPay,
        cashAdvance: totalCA,
        totalDeductions,
        netPay,
      };
    });
  }, [basePayroll, activeCashAdvances]);

  // Project-date-bound labor allocation calculation
  const laborAllocation = useMemo(() => {
    return calculateProjectLaborAllocation(
      activePayroll,
      cutoffStartDate,
      cutoffEndDate,
      currentProject
    );
  }, [activePayroll, cutoffStartDate, cutoffEndDate, currentProject]);

  const totalWeeklyPayroll = activePayroll.reduce((acc, curr) => acc + (curr.netPay || 0), 0);

  const togglePaidStatus = (id: string) => {
    const target = activePayroll.find((p) => p.id === id);
    if (!target) return;

    const updated = {
      ...target,
      paid: !target.paid,
      datePaid: !target.paid ? new Date().toISOString().split('T')[0] : undefined,
    };

    if (onUpdatePayrollEntry) {
      onUpdatePayrollEntry(updated);
    } else {
      setInternalPayroll((prev) => prev.map((p) => (p.id === id ? updated : p)));
    }
  };

  const payslipItems: PayrollItemData[] = activePayroll.map((p) => ({
    workerId: p.workerId,
    workerName: p.workerName,
    role: p.role,
    dailyRate: p.dailyRate,
    daysWorked: p.daysWorked,
    regularPay: p.regularPay,
    overtimeHours: p.otHours ?? p.overtimeHours ?? 0,
    overtimePay: p.otPay,
    grossPay: p.grossPay,
    cashAdvanceDeduction: p.cashAdvance,
    netPay: p.netPay,
    isPaid: p.paid,
  }));

  const handleOpenSinglePayslip = (workerId: string) => {
    setSelectedWorkerForPayslip(workerId);
    setShowPayslipModal(true);
  };

  const handleOpenAllPayslips = () => {
    setSelectedWorkerForPayslip(null);
    setShowPayslipModal(true);
  };

  const handleDownloadMasterPdf = () => {
    exportPayrollMasterPdf(currentProject, DEFAULT_COMPANY, activePayroll, cutoffLabel);
  };

  const handleDownloadSinglePayslipPdf = (workerId: string) => {
    const item = payslipItems.find((p) => p.workerId === workerId) || payslipItems[0];
    if (item) {
      exportSinglePayslipPdf(currentProject, DEFAULT_COMPANY, item, cutoffStartDate, cutoffEndDate);
    }
  };

  const handleCreateCashAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    const worker = externalWorkers.find((w) => w.id === caWorkerId) || externalWorkers[0];
    if (!worker || caAmount <= 0) return;

    const newCA: Omit<CashAdvance, 'id'> = {
      workerId: worker.id,
      workerName: worker.name,
      projectId: currentProject.id,
      amount: Number(caAmount),
      date: caDate,
      reason: caReason,
      deducted: false,
    };

    if (onAddCashAdvance) {
      onAddCashAdvance(newCA);
    } else {
      const created: CashAdvance = { ...newCA, id: `ca-${Date.now()}` };
      setInternalCashAdvances((prev) => [created, ...prev]);
    }

    setShowCashAdvanceModal(false);
    setCaAmount(500);
    setCaReason('Emergency family allowance / Grocery');
  };

  const handleDeleteCA = (id: string) => {
    if (onDeleteCashAdvance) {
      onDeleteCashAdvance(id);
    } else {
      setInternalCashAdvances((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const handlePostLaborToProject = () => {
    if (onPostLaborExpense) {
      onPostLaborExpense(
        laborAllocation.totalChargeableLaborExpense,
        `Site Labor Duty (${laborAllocation.maxChargeableWindowDays} days duty from project start ${currentProject.startDate}) - Cutoff ${cutoffStartDate} to ${cutoffEndDate}`
      );
      setLaborPostedMessage(
        `Successfully posted ₱${laborAllocation.totalChargeableLaborExpense.toLocaleString()} to Project Expenses (${laborAllocation.maxChargeableWindowDays} duty days charged starting from project commencement date)!`
      );
      setTimeout(() => setLaborPostedMessage(null), 5000);
    }
  };

  return (
    <div className="space-y-6 text-[#263238]">
      {/* Top Header & Cutoff Selector */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[#123B5D]">Weekly Payroll &amp; Wages</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#EAF7FA] text-[#123B5D] font-bold border border-[#cbeaf0]">
              {currentProject.name}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#546e7a] mt-0.5">
            Calculation of wages, overtime, cash advance deductions, past cutoff review, and printable payslips.
          </p>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
          {/* Cutoff Date Range Selector */}
          <div className="flex items-center gap-2 bg-[#EAF7FA] px-3 py-2 border border-[#cbeaf0] rounded-xl text-xs font-semibold text-[#123B5D] shadow-xs">
            <Calendar className="w-4 h-4 text-[#18A999] shrink-0" />
            <select
              value={selectedCutoffId}
              onChange={(e) => setSelectedCutoffId(e.target.value)}
              aria-label="Select Payroll Cutoff Period"
              className="bg-transparent border-none focus:outline-none text-[#123B5D] font-bold text-xs cursor-pointer max-w-[220px]"
            >
              {PRESET_CUTOFFS.map((c) => (
                <option key={c.id} value={c.id} className="bg-white text-[#123B5D]">
                  {c.label}
                </option>
              ))}
              <option value="custom" className="bg-white text-[#123B5D]">
                Custom Date Range...
              </option>
            </select>
          </div>

          {/* Cash Advance Entry Button */}
          <button
            onClick={() => setShowCashAdvanceModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
            title="Record a worker cash advance deduction"
          >
            <Plus className="w-4 h-4" />
            <span>+ Cash Advance Entry</span>
          </button>

          {/* View Cash Advance Ledger */}
          <button
            onClick={() => setShowCashAdvanceLedger(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-[#123B5D] border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
            title="View complete cash advance deduction ledger"
          >
            <Receipt className="w-4 h-4 text-[#18A999]" />
            <span>CA Ledger ({activeCashAdvances.filter((c) => !c.deducted).length})</span>
          </button>

          {/* Save PDF (Master Sheet) */}
          <button
            onClick={handleDownloadMasterPdf}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#18A999] hover:bg-[#148f81] text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
            title="Directly download clean Master Payroll PDF"
          >
            <Download className="w-4 h-4" />
            <span>Save PDF (Master)</span>
          </button>

          {/* Print Master Registry */}
          <button
            onClick={() => setShowMasterPrinter(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-[#123B5D] rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
            title="Open printable Master Payroll Sheet"
          >
            <Printer className="w-4 h-4 text-[#18A999]" />
            <span>Print Master</span>
          </button>

          {/* View / Print Worker Payslips */}
          <button
            onClick={handleOpenAllPayslips}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#123B5D] hover:bg-[#0e2e49] text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
            title="Open printable worker payslips"
          >
            <FileText className="w-4 h-4 text-[#18A999]" />
            <span>Payslips ({payslipItems.length})</span>
          </button>
        </div>
      </div>

      {/* Custom Date Range Picker when selected */}
      {selectedCutoffId === 'custom' && (
        <div className="p-3.5 bg-[#EAF7FA] border border-[#18A999]/30 rounded-2xl flex flex-wrap items-center gap-4 text-xs">
          <span className="font-bold text-[#123B5D] flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#18A999]" />
            Select Custom Cutoff Dates:
          </span>
          <div className="flex items-center gap-2">
            <label className="text-[#263238]/70">Start Date:</label>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-[#123B5D]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[#263238]/70">End Date:</label>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-[#123B5D]"
            />
          </div>
          <span className="text-[11px] text-[#263238]/60">
            Attendance and prorated duty calculations adjust automatically to the chosen range.
          </span>
        </div>
      )}

      {/* Project Start Date Labor Proration Banner */}
      <div className="bg-[#EAF7FA] border-2 border-[#18A999]/40 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-[#123B5D]" />
            <h3 className="text-xs font-black uppercase tracking-wider text-[#123B5D]">
              Project Start Date Labor Expense Allocation Rule
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#18A999] text-white font-bold">
              Automated Proration
            </span>
          </div>
          <p className="text-xs text-[#263238]">
            Project: <strong className="text-[#123B5D]">{currentProject.name}</strong> | Start Date:{' '}
            <strong className="text-[#123B5D] font-mono">{currentProject.startDate}</strong> | Cutoff:{' '}
            <strong className="text-[#123B5D] font-mono">{cutoffStartDate} to {cutoffEndDate}</strong>
          </p>
          <p className="text-[11px] text-[#546e7a]">
            {laborAllocation.isProrated ? (
              <span>
                Labor expenses are charged strictly starting from the project start date (<strong>{currentProject.startDate}</strong>).
                Only <strong className="text-[#18A999]">{laborAllocation.maxChargeableWindowDays} duty days</strong> are allocated to this site project.
                Labor shifts prior to project start date are excluded from project expenditures.
              </span>
            ) : (
              <span>
                Project was active throughout this entire week. All <strong>{laborAllocation.maxChargeableWindowDays} duty days</strong> are included in project labor costing.
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className="text-[10px] text-[#546e7a] block uppercase font-bold">
              Chargeable Labor to Project
            </span>
            <div className="text-lg font-black text-[#123B5D] font-mono">
              ₱{laborAllocation.totalChargeableLaborExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            {laborAllocation.excludedLaborPriorToStart > 0 && (
              <span className="text-[10px] text-amber-700 font-medium">
                (₱{laborAllocation.excludedLaborPriorToStart.toLocaleString()} excluded prior to start)
              </span>
            )}
          </div>
          {onPostLaborExpense && (
            <button
              onClick={handlePostLaborToProject}
              className="px-3.5 py-2 bg-[#18A999] hover:bg-[#148f81] text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
              title="Add this labor expense to project Expense & Ledger"
            >
              Post to Expenses
            </button>
          )}
        </div>
      </div>

      {laborPostedMessage && (
        <div className="p-3 bg-teal-50 border border-[#18A999] rounded-xl text-[#0d786d] text-xs font-bold animate-in fade-in flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-[#18A999]" />
          <span>{laborPostedMessage}</span>
        </div>
      )}

      {/* Summary Banner */}
      <div className="bg-[#123B5D] text-white p-5 sm:p-6 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-md border border-[#0d2b45]">
        <div>
          <p className="text-teal-200/80 text-xs font-semibold uppercase tracking-wider">
            Total Weekly Wage Payout (Take-Home Net)
          </p>
          <h2 className="text-3xl sm:text-4xl font-black mt-1 font-mono tracking-tight text-[#18A999]">
            ₱{totalWeeklyPayroll.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h2>
          <p className="text-xs text-teal-100/70 mt-1">
            Cutoff Period: {cutoffLabel}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="bg-[#0e2e49] border border-[#1a4c75] px-4 py-2.5 rounded-xl text-center flex-1 md:flex-initial">
            <span className="text-[11px] text-teal-200/80 block">Total Crew Count</span>
            <p className="text-lg font-bold text-white">{activePayroll.length}</p>
          </div>
          <div className="bg-[#0e2e49] border border-[#1a4c75] px-4 py-2.5 rounded-xl text-center flex-1 md:flex-initial">
            <span className="text-[11px] text-teal-200/80 block">Active Cash Advances</span>
            <p className="text-lg font-bold text-amber-300">
              ₱{activeCashAdvances.filter((c) => !c.deducted).reduce((sum, c) => sum + c.amount, 0).toLocaleString()}
            </p>
          </div>
          {onMarkAllPaid && activePayroll.some((w) => !w.paid) && (
            <button
              onClick={onMarkAllPaid}
              className="px-4 py-2.5 bg-[#18A999] hover:bg-[#148f81] text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-sm"
            >
              Disburse All
            </button>
          )}
        </div>
      </div>

      {/* Payroll Table */}
      <section className="bg-white rounded-2xl border border-[#cbeaf0] overflow-x-auto shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#EAF7FA] text-[#123B5D] font-bold uppercase tracking-wider border-b border-[#cbeaf0]">
            <tr>
              <th className="py-3 px-4">Worker Name / Role</th>
              <th className="py-3 px-3 text-right">Daily Rate</th>
              <th className="py-3 px-3 text-center">Days Worked</th>
              <th className="py-3 px-3 text-center">OT (Hrs)</th>
              <th className="py-3 px-3 text-right">Gross Pay</th>
              <th className="py-3 px-3 text-right text-rose-700">Cash Advance</th>
              <th className="py-3 px-3 text-right">Net Take-Home</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {activePayroll.map((worker) => {
              const ot = worker.otHours ?? worker.overtimeHours ?? 0;
              return (
                <tr key={worker.id} className="hover:bg-[#EAF7FA]/40 transition">
                  <td className="py-3 px-4">
                    <p className="font-bold text-[#123B5D]">{worker.workerName}</p>
                    <span className="text-[11px] text-[#546e7a] font-medium">{worker.role}</span>
                  </td>
                  <td className="py-3 px-3 text-right text-[#546e7a] font-mono">₱{worker.dailyRate}</td>
                  <td className="py-3 px-3 text-center font-bold text-[#263238]">{worker.daysWorked}d</td>
                  <td className="py-3 px-3 text-center text-[#18A999] font-bold">{ot}h</td>
                  <td className="py-3 px-3 text-right text-[#546e7a] font-mono">₱{worker.grossPay?.toFixed(2)}</td>
                  <td className="py-3 px-3 text-right text-rose-600 font-bold font-mono">
                    {worker.cashAdvance > 0 ? (
                      <span className="inline-flex items-center gap-1">
                        -₱{worker.cashAdvance.toLocaleString()}
                        <button
                          onClick={() => {
                            setCaWorkerId(worker.workerId);
                            setShowCashAdvanceModal(true);
                          }}
                          className="text-[10px] text-amber-700 hover:underline cursor-pointer"
                          title="Add cash advance"
                        >
                          (+)
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setCaWorkerId(worker.workerId);
                          setShowCashAdvanceModal(true);
                        }}
                        className="text-[11px] text-slate-400 hover:text-amber-700 cursor-pointer"
                        title="Enter Cash Advance"
                      >
                        + Cash Adv.
                      </button>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right font-black font-mono text-[#0d786d] text-sm">
                    ₱{worker.netPay?.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => togglePaidStatus(worker.id)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center justify-center gap-1 mx-auto transition cursor-pointer ${
                        worker.paid
                          ? 'bg-[#EAF7FA] text-[#0d786d] hover:bg-[#d5eff4] border border-[#bce6ed]'
                          : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                      }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      {worker.paid ? 'Paid' : 'Mark as Paid'}
                    </button>
                  </td>
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleOpenSinglePayslip(worker.workerId)}
                        className="px-2.5 py-1 text-xs font-semibold rounded bg-[#EAF7FA] hover:bg-[#d5eff4] text-[#123B5D] transition cursor-pointer border border-[#cbeaf0]"
                        title="View & Print Payslip"
                      >
                        View Slip
                      </button>
                      <button
                        onClick={() => handleDownloadSinglePayslipPdf(worker.workerId)}
                        className="p-1 text-slate-500 hover:text-[#18A999] cursor-pointer"
                        title="Direct Download Payslip PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Cash Advance Entry Modal */}
      {showCashAdvanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-[#123B5D] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-white font-bold">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Cash Advance Entry</h3>
                  <p className="text-[11px] text-teal-100/70">
                    Directly deducted from weekly payroll take-home pay
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCashAdvanceModal(false)}
                className="text-white/70 hover:text-white cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCashAdvance} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#123B5D] mb-1">Select Crew Member *</label>
                <select
                  value={caWorkerId}
                  onChange={(e) => setCaWorkerId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-[#263238] focus:bg-white focus:outline-none focus:border-[#18A999]"
                >
                  {externalWorkers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} — {w.role} (Rate: ₱{w.dailyRate}/day)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#123B5D] mb-1">Amount (PHP) *</label>
                  <input
                    type="number"
                    required
                    min="50"
                    step="50"
                    value={caAmount}
                    onChange={(e) => setCaAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-[#123B5D] focus:bg-white focus:outline-none focus:border-[#18A999]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#123B5D] mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={caDate}
                    onChange={(e) => setCaDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-[#263238] focus:bg-white focus:outline-none focus:border-[#18A999]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#123B5D] mb-1">Reason / Notes *</label>
                <input
                  type="text"
                  required
                  value={caReason}
                  onChange={(e) => setCaReason(e.target.value)}
                  placeholder="e.g. Emergency medical expense, Grocery advance"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-[#263238] focus:bg-white focus:outline-none focus:border-[#18A999]"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800">
                Note: This cash advance will be deducted automatically from the worker's net take-home wage envelope for the selected cutoff.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCashAdvanceModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-[#263238] font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#18A999] hover:bg-[#148f81] text-white font-bold rounded-xl cursor-pointer shadow-xs"
                >
                  Save Cash Advance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cash Advance Ledger Modal */}
      {showCashAdvanceLedger && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[85vh] flex flex-col">
            <div className="px-5 py-4 bg-[#123B5D] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#18A999]" />
                <div>
                  <h3 className="text-sm font-bold text-white">Cash Advance Ledger &amp; History</h3>
                  <p className="text-[11px] text-teal-100/70">
                    Complete ledger of cash advances and automated payroll deductions
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCashAdvanceLedger(false)}
                className="text-white/70 hover:text-white cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {activeCashAdvances.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No recorded cash advances found.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {activeCashAdvances.map((ca) => (
                    <div
                      key={ca.id}
                      className="p-3 bg-white flex items-center justify-between gap-3 text-xs hover:bg-[#EAF7FA]/30"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-[#123B5D]">{ca.workerName}</strong>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 font-mono text-slate-600">
                            {ca.date}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                              ca.deducted ? 'bg-teal-100 text-teal-800' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {ca.deducted ? 'Deducted' : 'Pending Deduction'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#546e7a] mt-0.5">{ca.reason}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono font-black text-rose-600 text-sm">
                          ₱{ca.amount.toLocaleString()}
                        </span>
                        <button
                          onClick={() => handleDeleteCA(ca.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                          title="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-[#546e7a]">
                Total Unsettled Cash Advances:{' '}
                <strong className="text-rose-600 font-mono">
                  ₱{activeCashAdvances.filter((c) => !c.deducted).reduce((s, c) => s + c.amount, 0).toLocaleString()}
                </strong>
              </span>
              <button
                onClick={() => {
                  setShowCashAdvanceLedger(false);
                  setShowCashAdvanceModal(true);
                }}
                className="px-3.5 py-1.5 bg-[#18A999] text-white rounded-xl text-xs font-bold hover:bg-[#148f81] cursor-pointer"
              >
                + Add Cash Advance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payslip Modal */}
      <Payslip
        isOpen={showPayslipModal}
        onClose={() => setShowPayslipModal(false)}
        selectedWorkerId={selectedWorkerForPayslip}
        payrollItems={payslipItems}
        company={DEFAULT_COMPANY}
        activeProject={currentProject}
        startDate={cutoffStartDate}
        endDate={cutoffEndDate}
      />

      {/* Weekly Payroll Master Sheet Printer Modal */}
      <PayrollMasterPrinter
        isOpen={showMasterPrinter}
        onClose={() => setShowMasterPrinter(false)}
        currentProject={currentProject}
        company={DEFAULT_COMPANY}
        payroll={activePayroll}
        cutoffPeriod={cutoffLabel}
      />
    </div>
  );
};

export default WeeklyPayrollView;
