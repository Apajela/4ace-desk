import React, { useState, useMemo } from 'react';
import {
  Users,
  Calendar,
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
} from 'lucide-react';
import { Worker, Project, PayrollEntry, PayrollItemData, CashAdvance, UserProfile } from '../types';
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
  onUpdatePayrollEntry?: (updated: PayrollEntry, laborExpense?: { amount: number; projectId: string; projectName: string; cutoffStartDate: string; cutoffEndDate: string; workerId: string; workerName: string; date: string }) => void;
  onMarkAllPaid?: (entries: PayrollEntry[]) => void;
  onLogAttendanceClick?: () => void;
  onPostLaborExpense?: (amount: number, description: string) => boolean;
  currentUser?: UserProfile | null;
  expenses?: { projectId: string; category: string; description?: string; date?: string }[];
  attendance?: { id: string; workerId: string; workerName: string; projectId: string; date: string; status: string; timeIn: string; timeOut?: string; hoursWorked: number }[];
  projects?: Project[];
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
    label: 'October 26 - November 01, 2026 (Current Cutoff)',
    startDate: '2026-10-26',
    endDate: '2026-11-01',
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
  currentUser,
  expenses = [],
  attendance = [],
  projects = [],
}) => {
  // Cutoff selection state
  const [selectedCutoffId, setSelectedCutoffId] = useState<string>('current');
  const [customStartDate, setCustomStartDate] = useState('2026-10-26');
  const [customEndDate, setCustomEndDate] = useState('2026-11-01');

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
  const [caInstallment, setCaInstallment] = useState<number>(500);
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
      const workerCAs = activeCashAdvances.filter((ca) => ca.workerId === entry.workerId && ca.projectId === currentProject.id && !ca.deducted);
      const totalCA = workerCAs.reduce((sum, item) => sum + Math.min(item.deductionPerPayroll ?? 500, item.remainingBalance ?? item.amount), 0);
      const weekRecords = attendance.filter((record) => record.workerId === entry.workerId && record.date >= cutoffStartDate && record.date <= cutoffEndDate);
      // A worker can appear on multiple project records on the same date; count the date once.
      const byDate = new Map<string, typeof weekRecords>();
      weekRecords.forEach((record) => byDate.set(record.date, [...(byDate.get(record.date) || []), record]));
      const uniqueDays = [...byDate.values()];
      const days = weekRecords.length ? Math.min(6, uniqueDays.reduce((sum, recordsForDay) => {
        const multipliers = recordsForDay.map((record) => { const status = String(record.status).toLowerCase(); return status === 'absent' ? 0 : status === 'half_day' || status === 'half day' ? 0.5 : 1; });
        return sum + Math.max(...multipliers);
      }, 0)) : (entry.daysWorked || 0);
      const ot = weekRecords.length ? uniqueDays.reduce((sum, recordsForDay) => sum + Math.max(0, ...recordsForDay.map((record) => Number(record.otHours ?? (record as any).overtimeHours) || 0)), 0) : (entry.otHours ?? entry.overtimeHours ?? 0);
      const rate = entry.dailyRate || 0;
      const regularPay = days * rate;
      const otPay = (rate / 8) * 1.25 * ot;
      const grossPay = regularPay + otPay;
      const sssPhilhealth = 150;
      const totalDeductions = totalCA + sssPhilhealth;
      const netPay = Math.max(0, grossPay - totalDeductions);
      return { ...entry, daysWorked: days, otHours: ot, overtimeHours: ot, regularPay, otPay, grossPay, cashAdvance: totalCA, totalDeductions, netPay };
    });
  }, [basePayroll, activeCashAdvances, attendance, cutoffStartDate, cutoffEndDate]);

  // Project-date-bound labor allocation calculation
  const laborAllocation = useMemo(() => {
    const hasAnyAttendanceInCutoff = attendance.some((record) => record.date >= cutoffStartDate && record.date <= cutoffEndDate);
    const projectPayroll = activePayroll.map((entry) => {
      const projectRecords = attendance.filter((record) => record.workerId === entry.workerId && record.projectId === currentProject.id && record.date >= cutoffStartDate && record.date <= cutoffEndDate);
      const projectDays = new Map<string, typeof projectRecords>();
      projectRecords.forEach((record) => projectDays.set(record.date, [...(projectDays.get(record.date) || []), record]));
      const projectDaysWorked = [...projectDays.entries()].reduce((days, [date, recordsForProjectDay]) => {
        const allWorkerRecordsForDate = attendance.filter((record) => record.workerId === entry.workerId && record.date === date);
        const distinctProjectCount = new Set(allWorkerRecordsForDate.map((record) => record.projectId)).size || 1;
        const multipliers = recordsForProjectDay.map((record) => { const status = String(record.status).toLowerCase(); return status === 'absent' ? 0 : status === 'half day' || status === 'half_day' ? 0.5 : 1; });
        return days + Math.max(...multipliers) / distinctProjectCount;
      }, 0);
      const projectOvertimeHours = [...projectDays.entries()].reduce((hours, [date, recordsForProjectDay]) => {
        const allWorkerRecordsForDate = attendance.filter((record) => record.workerId === entry.workerId && record.date === date);
        const distinctProjectCount = new Set(allWorkerRecordsForDate.map((record) => record.projectId)).size || 1;
        return hours + Math.max(0, ...recordsForProjectDay.map((record) => Number((record as any).otHours ?? (record as any).overtimeHours) || 0)) / distinctProjectCount;
      }, 0);
      // Older/imported payroll entries may have no DTR records. Use payroll-wide fallback
      // only when the selected cutoff has no attendance records for any project.
      const daysWorked = projectRecords.length ? projectDaysWorked : (!hasAnyAttendanceInCutoff ? (Number(entry.daysWorked) || 0) : 0);
      const overtimeHours = projectRecords.length ? projectOvertimeHours : (!hasAnyAttendanceInCutoff ? (Number(entry.otHours ?? entry.overtimeHours) || 0) : 0);
      const otPay = (entry.dailyRate / 8) * 1.25 * overtimeHours;
      const grossPay = daysWorked * entry.dailyRate + otPay;
      return { ...entry, daysWorked, otHours: overtimeHours, overtimeHours, otPay, grossPay };
    });
    return calculateProjectLaborAllocation(projectPayroll, cutoffStartDate, cutoffEndDate, currentProject);
  }, [activePayroll, attendance, cutoffStartDate, cutoffEndDate, currentProject]);

  const isAdmin = currentUser?.accessLevel === 'Full Access (Admin)';
  const laborDescription = `Site Labor Duty (${laborAllocation.maxChargeableWindowDays} days duty from project start ${currentProject.startDate}) - Cutoff ${cutoffStartDate} to ${cutoffEndDate}`;
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  const cutoffMarker = `cutoff ${cutoffStartDate} to ${cutoffEndDate}`.toLowerCase();
  const laborAlreadyPosted = expenses.some((expense) => expense.projectId === currentProject.id && expense.category === 'Labor' && (expense.description || '').toLowerCase().includes(cutoffMarker));
  const isFridayCompletionPosting = today.getDay() === 5 && currentProject.targetDate === todayKey;
  const postingDayAllowed = true;
  const projectIsClosed = ['Completed','Cancelled'].includes(currentProject.status);
  const totalWeeklyPayroll = activePayroll.reduce((acc, curr) => acc + (curr.netPay || 0), 0);

  const markAllPaidWithExpenses = () => {
    if (onUpdatePayrollEntry) {
      activePayroll.filter((entry) => !entry.paid).forEach((entry) => {
        onUpdatePayrollEntry({ ...entry, paid: true, datePaid: todayKey });
      });
    }
    onMarkAllPaid?.(activePayroll);
  };

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
    projectWorkDays: (() => {
      const workerRecords = attendance.filter((record) => record.workerId === p.workerId && record.date >= cutoffStartDate && record.date <= cutoffEndDate);
      const byDate = new Map<string, typeof workerRecords>();
      workerRecords.forEach((record) => byDate.set(record.date, [...(byDate.get(record.date) || []), record]));
      const totals: Record<string, number> = {};
      byDate.forEach((recordsForDate) => {
        const projectCount = new Set(recordsForDate.map((record) => record.projectId)).size || 1;
        recordsForDate.forEach((record) => {
          const status = String(record.status).toLowerCase();
          const dayValue = status === 'absent' ? 0 : status === 'half day' || status === 'half_day' ? 0.5 : 1;
          totals[record.projectId] = (totals[record.projectId] || 0) + dayValue / projectCount;
        });
      });
      return Object.entries(totals).map(([projectId, days]) => ({ projectName: projects.find((project) => project.id === projectId)?.name || projectId, days }));
    })(),
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
      deductionPerPayroll: Math.max(1, Math.min(Number(caInstallment) || 500, Number(caAmount))),
      remainingBalance: Number(caAmount),
    };

    if (onAddCashAdvance) {
      onAddCashAdvance(newCA);
    } else {
      const created: CashAdvance = { ...newCA, id: `ca-${Date.now()}` };
      setInternalCashAdvances((prev) => [created, ...prev]);
    }

    setShowCashAdvanceModal(false);
    setCaAmount(500);
    setCaInstallment(500);
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
    if (!isAdmin || !onPostLaborExpense || !postingDayAllowed || laborAlreadyPosted || projectIsClosed) return;
    const amount = Math.round((Number(laborAllocation.totalChargeableLaborExpense) || 0) * 100) / 100;
    if (amount <= 0) {
      setLaborPostedMessage('Hindi na-post: â‚±0.00 ang chargeable labor. Tingnan ang DTR/project assignment at cutoff.');
      setTimeout(() => setLaborPostedMessage(null), 5000);
      return;
    }
    const posted = onPostLaborExpense(
      amount,
      `Site Labor Duty (${laborAllocation.maxChargeableWindowDays} days duty from project start ${currentProject.startDate}) - Cutoff ${cutoffStartDate} to ${cutoffEndDate}`
    );
    if (posted) {
      setLaborPostedMessage(`Successfully posted â‚±${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} to Project Expenses for cutoff ${cutoffStartDate} to ${cutoffEndDate}.`);
    } else {
      setLaborPostedMessage('Hindi na-post ang payroll expense. Maaaring naka-post na ito para sa cutoff na ito, o hindi pinapayagan ang project/account.');
    }
    setTimeout(() => setLaborPostedMessage(null), 5000);
  };

  if (!isAdmin) {
    const ownItem = payslipItems.find((item) => item.workerId === activePayroll[0]?.workerId) || payslipItems[0];
    const ownRecords = attendance.filter((record) => record.workerName?.toLowerCase() === currentUser?.name?.toLowerCase()).sort((a,b) => b.date.localeCompare(a.date));
    return (
      <div className="space-y-5 text-[#263238]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h1 className="text-xl font-black text-[#123B5D]">My Weekly Payroll</h1>
          <p className="mt-1 text-sm text-slate-500">Your own weekly payslip and daily time record only.</p>
          {ownItem ? <div className="mt-4 rounded-xl bg-slate-50 p-4"><p className="font-bold text-[#123B5D]">{ownItem.workerName}</p><p className="mt-1 text-sm text-slate-600">{cutoffStartDate} to {cutoffEndDate}</p><div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4"><div><p className="text-xs text-slate-500">Days Worked</p><p className="text-lg font-bold">{ownItem.daysWorked}</p></div><div><p className="text-xs text-slate-500">Gross Pay</p><p className="text-lg font-bold">â‚±{ownItem.grossPay.toLocaleString()}</p></div><div><p className="text-xs text-slate-500">Deductions</p><p className="text-lg font-bold">â‚±{ownItem.cashAdvanceDeduction.toLocaleString()}</p></div><div><p className="text-xs text-slate-500">Net Pay</p><p className="text-lg font-bold text-emerald-700">â‚±{ownItem.netPay.toLocaleString()}</p></div></div><button type="button" onClick={() => { setSelectedWorkerForPayslip(ownItem.workerId); setShowPayslipModal(true); }} className="mt-4 rounded-lg bg-[#123B5D] px-4 py-2 text-sm font-bold text-white">View My Payslip</button></div> : <p className="mt-4 text-sm text-slate-600">No payslip is available for this account yet.</p>}
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"><h2 className="text-lg font-black text-[#123B5D]">My Daily Time Record (DTR)</h2><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[540px] text-left text-xs"><thead><tr className="border-b bg-slate-50 text-slate-600"><th className="p-3">Date</th><th className="p-3">Project</th><th className="p-3">Status</th><th className="p-3">Time In</th><th className="p-3">Time Out</th><th className="p-3">Hours</th></tr></thead><tbody>{ownRecords.map((record) => <tr key={record.id} className="border-b border-slate-100"><td className="p-3">{record.date}</td><td className="p-3">{projects.find((project) => project.id === record.projectId)?.name || record.projectId}</td><td className="p-3">{record.status}</td><td className="p-3">{record.timeIn || 'â€”'}</td><td className="p-3">{record.timeOut || 'â€”'}</td><td className="p-3">{record.hoursWorked || 0}</td></tr>)}</tbody></table>{ownRecords.length === 0 && <p className="py-5 text-sm text-slate-500">No DTR entries are available yet.</p>}</div></section>
        <Payslip isOpen={showPayslipModal} onClose={() => setShowPayslipModal(false)} selectedWorkerId={selectedWorkerForPayslip} payrollItems={ownItem ? [ownItem] : []} company={DEFAULT_COMPANY} activeProject={currentProject} startDate={cutoffStartDate} endDate={cutoffEndDate} />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-[#263238]">
      {/* Top Header & Cutoff Selector */}
      <div className="flex flex-col lg:flex-row-reverse justify-between items-start lg:items-start gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[#123B5D]">Weekly Payroll &amp; Wages</h1>

          </div>
          <p className="text-xs sm:text-sm text-[#546e7a] mt-0.5">
            Release payroll on any day. Wages are based on saved DTR entries, overtime, and cash advance deductions.
          </p>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-row flex-wrap items-center justify-start gap-2 w-full lg:w-auto lg:shrink-0">
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

          {isAdmin && <>
          {/* View Cash Advance Ledger */}
          <button
            onClick={() => setShowCashAdvanceLedger(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-[#123B5D] border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
            title="View complete cash advance deduction ledger"
          >
            <Receipt className="w-4 h-4 text-[#18A999]" />
            <span>Cash Advance</span>
          </button>

          {/* Save PDF (Master Sheet) */}
          <button
            onClick={handleDownloadMasterPdf}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#18A999] hover:bg-[#148f81] text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
            title="Directly download clean Master Payroll PDF"
          >
            <Download className="w-4 h-4" />
            <span>Save</span>
          </button>

          {/* View Payroll */}
          <button
            onClick={() => setShowMasterPrinter(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-[#123B5D] rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
            title="View the master payroll registry"
          >
            <FileText className="w-4 h-4 text-[#18A999]" />
            <span>View Payroll</span>
          </button>

          {/* Print Master Registry */}
          <button
            onClick={() => setShowMasterPrinter(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-[#123B5D] rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
            title="Open printable Master Payroll Sheet"
          >
            <Printer className="w-4 h-4 text-[#18A999]" />
            <span>Print</span>
          </button>

          </>}
          {/* View own payslip for regular account; master payslips for admin */}
          <button
            onClick={isAdmin ? handleOpenAllPayslips : () => handleOpenSinglePayslip(externalPayroll?.[0]?.workerId || externalWorkers[0]?.id || '')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#123B5D] hover:bg-[#0e2e49] text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
            title="Open printable worker payslips"
          >
            <FileText className="w-4 h-4 text-[#18A999]" />
            <span>{isAdmin ? 'Payslips' : 'My Payslip'}</span>
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

      {laborPostedMessage && (
        <div className="p-3 bg-teal-50 border border-[#18A999] rounded-xl text-[#0d786d] text-xs font-bold animate-in fade-in flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-[#18A999]" />
          <span>{laborPostedMessage}</span>
        </div>
      )}

      {!isAdmin && <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <h2 className="text-lg font-black text-[#123B5D]">My Daily Time Record (DTR)</h2>
        <p className="mt-1 text-xs text-slate-500">Only your own attendance records are shown.</p>
        <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[560px] text-left text-xs"><thead><tr className="border-b bg-slate-50 text-slate-600"><th className="p-3">Date</th><th className="p-3">Project</th><th className="p-3">Status</th><th className="p-3">Time In</th><th className="p-3">Time Out</th><th className="p-3">Hours</th></tr></thead><tbody>{attendance.filter((record) => record.workerName?.toLowerCase() === currentUser?.name?.toLowerCase()).sort((a,b) => b.date.localeCompare(a.date)).map((record) => <tr key={record.id} className="border-b border-slate-100"><td className="p-3">{record.date}</td><td className="p-3">{projects.find((project) => project.id === record.projectId)?.name || record.projectId}</td><td className="p-3">{record.status}</td><td className="p-3">{record.timeIn || 'â€”'}</td><td className="p-3">{record.timeOut || 'â€”'}</td><td className="p-3">{record.hoursWorked || 0}</td></tr>)}</tbody></table></div>
      </section>}

      {/* Summary Banner */}
      <div className="bg-[#123B5D] text-white p-5 sm:p-6 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-md border border-[#0d2b45]">
        <div>
          <p className="text-teal-200/80 text-xs font-semibold uppercase tracking-wider">
            Total Weekly Wage Payout (Take-Home Net)
          </p>
          <h2 className="text-3xl sm:text-4xl font-black mt-1 font-mono tracking-tight text-[#18A999]">
            â‚±{totalWeeklyPayroll.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
              â‚±{activeCashAdvances.filter((c) => !c.deducted).reduce((sum, c) => sum + c.amount, 0).toLocaleString()}
            </p>
          </div>
          {onMarkAllPaid && activePayroll.some((w) => !w.paid) && (
            <button
              onClick={markAllPaidWithExpenses}
              title="Mark all unpaid workers as paid for this cutoff."
              className="px-4 py-2.5 bg-[#18A999] hover:bg-[#148f81] text-white font-bold text-xs rounded-xl transition shadow-sm cursor-pointer"
            >
              Select Paid All
            </button>
          )}
        </div>
      </div>

      {/* Project labor expense posting: explicit, consolidated posting for the selected cutoff. */}
      {isAdmin && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Project Labor Expense Allocation</p>
              <h2 className="mt-1 text-lg font-black text-[#123B5D]">Chargeable Labor to Project</h2>
              <p className="mt-1 text-xs text-slate-500">{currentProject.name} Â· Cutoff {cutoffStartDate} to {cutoffEndDate}</p>
              <p className="mt-1 text-xs text-slate-500">{laborAllocation.maxChargeableWindowDays} chargeable duty days Â· Gross labor cost before cash-advance deductions.</p>
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <p className="text-2xl font-black tabular-nums text-[#123B5D]">â‚±{laborAllocation.totalChargeableLaborExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <button
                type="button"
                onClick={handlePostLaborToProject}
                disabled={!onPostLaborExpense || laborAlreadyPosted || projectIsClosed || laborAllocation.totalChargeableLaborExpense <= 0}
                className="rounded-xl bg-[#18A999] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#148f81] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
              >
                {laborAlreadyPosted ? 'Already Posted for This Cutoff' : projectIsClosed ? 'Project Closed' : 'Post to Expenses'}
              </button>
            </div>
          </div>
        </section>
      )}

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
                  <td className="py-3 px-3 text-right text-[#546e7a] font-mono">â‚±{worker.dailyRate}</td>
                  <td className="py-3 px-3 text-center font-bold text-[#263238]">{worker.daysWorked}d</td>
                  <td className="py-3 px-3 text-center text-[#18A999] font-bold">{ot}h</td>
                  <td className="py-3 px-3 text-right text-[#546e7a] font-mono">â‚±{worker.grossPay?.toFixed(2)}</td>
                  <td className="py-3 px-3 text-right text-rose-600 font-bold font-mono">
                    {worker.cashAdvance > 0 ? (
                      <span className="inline-flex items-center gap-1">
                        -â‚±{worker.cashAdvance.toLocaleString()}
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
                    â‚±{worker.netPay?.toFixed(2)}
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
                      {worker.paid ? 'Paid' : 'Unpaid / Not Paid'}
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
      {isAdmin && showCashAdvanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-[#123B5D] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-white font-bold">
                  <span className="text-lg font-black">â‚±</span>
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
                âœ•
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
                      {w.name} â€” {w.role} (Rate: â‚±{w.dailyRate}/day)
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#123B5D] mb-1">Deduction per Payday (PHP) *</label>
                  <input type="number" required min="1" max={caAmount} value={caInstallment} onChange={(e) => setCaInstallment(Math.min(caAmount || 1, Math.max(1, Number(e.target.value) || 1)))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-[#123B5D]" />
                </div>
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-[11px] text-amber-800 flex items-center">
                  <strong>Installment Deduction:</strong>&nbsp; â‚±{Math.min(caInstallment, caAmount).toLocaleString()} per payday until the â‚±{caAmount.toLocaleString()} advance is fully repaid.
                </div>
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
      {isAdmin && showCashAdvanceLedger && (
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
                âœ•
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
                          â‚±{ca.amount.toLocaleString()}
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
                  â‚±{activeCashAdvances.filter((c) => !c.deducted).reduce((s, c) => s + c.amount, 0).toLocaleString()}
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
      {isAdmin && <PayrollMasterPrinter
        isOpen={showMasterPrinter}
        onClose={() => setShowMasterPrinter(false)}
        currentProject={currentProject}
        company={DEFAULT_COMPANY}
        payroll={activePayroll}
        cutoffPeriod={cutoffLabel}
        currentUser={currentUser}
      />}
    </div>
  );
};

export default WeeklyPayrollView;

