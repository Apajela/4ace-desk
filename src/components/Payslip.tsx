import React, { useState } from 'react';
import {
  Printer,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { Worker, CompanySettings, Project, PayrollItemData } from '../types';
import { triggerBrowserPrint } from '../utils/printReport';

export interface PayslipProps {
  isOpen: boolean;
  onClose: () => void;
  selectedWorkerId?: string | null;
  payrollItems: PayrollItemData[];
  workers?: Worker[];
  company: CompanySettings;
  activeProject: Project;
  startDate: string;
  endDate: string;
}

export const Payslip: React.FC<PayslipProps> = ({
  isOpen,
  onClose,
  selectedWorkerId,
  payrollItems,
  company,
  activeProject,
  startDate,
  endDate,
}) => {
  const [currentIdx, setCurrentIdx] = useState<number>(() => {
    if (selectedWorkerId) {
      const idx = payrollItems.findIndex((p) => p.workerId === selectedWorkerId);
      return idx >= 0 ? idx : 0;
    }
    return 0;
  });
  const [mode, setMode] = useState<'single' | 'all'>('single');

  if (!isOpen || payrollItems.length === 0) return null;

  const currentItem = payrollItems[currentIdx] || payrollItems[0];
  const formatCurrency = (val: number) => '₱' + Math.round(val).toLocaleString('en-US');

  const handleNext = () => {
    setCurrentIdx((prev) => (prev + 1) % payrollItems.length);
  };

  const handlePrev = () => {
    setCurrentIdx((prev) => (prev - 1 + payrollItems.length) % payrollItems.length);
  };

  const handlePrint = () => {
    triggerBrowserPrint();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Controls (No-print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#123B5D] text-white print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#18A999]">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Official Worker Payslip &amp; Wage Voucher
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#18A999] text-white font-bold">
                  Weekly Cutoff
                </span>
              </div>
              <p className="text-[11px] text-white/80">
                Project: <span className="text-white font-semibold">{activeProject.name}</span> ({startDate} to {endDate})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-[#123B5D] border border-white/20 p-1 rounded-xl text-xs mr-1">
              <button
                onClick={() => setMode('single')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  mode === 'single' ? 'bg-[#18A999] text-white shadow-xs' : 'text-white/80 hover:text-white'
                }`}
              >
                Single Payslip
              </button>
              <button
                onClick={() => setMode('all')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  mode === 'all' ? 'bg-[#18A999] text-white shadow-xs' : 'text-white/80 hover:text-white'
                }`}
              >
                Print All ({payrollItems.length})
              </button>
            </div>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#18A999] hover:bg-[#148f81] text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
              title="Save as PDF or Print Payslips"
            >
              <Printer className="w-4 h-4" />
              <span>Save PDF / Print {mode === 'all' ? 'All Payslips' : 'Payslip'}</span>
            </button>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Bar for Individual Mode */}
        {mode === 'single' && (
          <div className="px-6 py-2.5 bg-[#EAF7FA] border-b border-slate-200 flex items-center justify-between text-xs print:hidden">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                className="p-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-[#123B5D] cursor-pointer"
                title="Previous worker"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[#263238] font-medium">
                Worker <strong className="text-[#123B5D]">{currentIdx + 1}</strong> of{' '}
                <strong className="text-[#123B5D]">{payrollItems.length}</strong>:{' '}
                <span className="text-[#18A999] font-bold">{currentItem?.workerName}</span>
              </span>
              <button
                onClick={handleNext}
                className="p-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-[#123B5D] cursor-pointer"
                title="Next worker"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <span className="text-[11px] text-[#263238]/70 font-mono">
              Role: <strong className="text-[#123B5D]">{currentItem?.role}</strong> | Rate:{' '}
              <strong className="text-[#18A999]">{formatCurrency(currentItem?.dailyRate || 0)}/day</strong>
            </span>
          </div>
        )}

        {/* Printable Sheet Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-100/60">
          {mode === 'single' ? (
            <div className="bg-white text-[#263238] rounded-2xl p-6 sm:p-8 shadow-md border border-slate-200 max-w-2xl mx-auto font-sans printable-document">
              <div className="border-b-2 border-[#123B5D] pb-3 flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-black uppercase tracking-wider text-[#123B5D]">
                    {company.companyName}
                  </h2>
                  <p className="text-[11px] text-[#263238]/70 mt-0.5 font-medium">{company.licenseNumber} | {company.address}</p>
                  <p className="text-[10px] text-[#263238]/60 font-mono">Tel: {company.contactNumber}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded bg-[#EAF7FA] text-[#123B5D] border border-[#18A999]/30">
                    OFFICIAL PAYSLIP VOUCHER
                  </span>
                  <div className="text-xs font-mono font-bold text-[#123B5D] mt-1.5">
                    PERIOD: {startDate} to {endDate}
                  </div>
                  <div className="text-[11px] text-[#263238]/70 mt-0.5">Project: {activeProject.name}</div>
                </div>
              </div>

              <div className="my-4 p-3.5 bg-[#EAF7FA] border border-slate-200 rounded-xl grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[#263238]/60 block text-[10px] uppercase font-bold">Worker Name:</span>
                  <strong className="text-sm text-[#123B5D] font-bold">{currentItem.workerName}</strong>
                </div>
                <div>
                  <span className="text-[#263238]/60 block text-[10px] uppercase font-bold">Trade / Role:</span>
                  <span className="font-bold text-[#263238]">{currentItem.role}</span>
                </div>
                <div>
                  <span className="text-[#263238]/60 block text-[10px] uppercase font-bold">Daily Wage Rate:</span>
                  <span className="font-mono font-bold text-[#18A999]">{formatCurrency(currentItem.dailyRate)} / day</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="border border-slate-200 rounded-xl p-4 space-y-2 bg-white">
                  <span className="font-bold text-[#123B5D] uppercase text-[10px] tracking-wider block border-b border-slate-100 pb-1.5">
                    Gross Earnings Breakdown
                  </span>
                  <div className="flex justify-between py-0.5">
                    <span className="text-[#263238]/70">Days Worked ({currentItem.daysWorked} days):</span>
                    <span className="font-mono font-bold text-[#263238]">{formatCurrency(currentItem.regularPay)}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-[#263238]/70">Overtime Pay ({currentItem.overtimeHours} hrs):</span>
                    <span className="font-mono text-[#18A999] font-bold">{formatCurrency(currentItem.overtimePay)}</span>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-slate-100 font-bold text-[#123B5D]">
                    <span>Gross Earnings:</span>
                    <span className="font-mono text-[#123B5D]">{formatCurrency(currentItem.grossPay)}</span>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 space-y-2 bg-white">
                  <span className="font-bold text-[#123B5D] uppercase text-[10px] tracking-wider block border-b border-slate-100 pb-1.5">
                    Payroll Deductions
                  </span>
                  <div className="flex justify-between py-0.5">
                    <span className="text-[#263238]/70">Cash Advance Deduction:</span>
                    <span className="font-mono text-rose-700 font-bold">
                      {currentItem.cashAdvanceDeduction > 0 ? `-${formatCurrency(currentItem.cashAdvanceDeduction)}` : '₱0'}
                    </span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-[#263238]/70">Other Deductions / Tax:</span>
                    <span className="font-mono text-[#263238]/60">₱0</span>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-slate-100 font-bold text-rose-700">
                    <span>Total Deductions:</span>
                    <span className="font-mono">-{formatCurrency(currentItem.cashAdvanceDeduction)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-[#EAF7FA] border border-[#18A999]/30 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase font-bold text-[#123B5D] block">
                    Net Take-Home Pay
                  </span>
                  <span className="text-[11px] text-[#263238]/70 font-medium">Total payable wages for this cutoff</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-[#18A999]">
                  {formatCurrency(currentItem.netPay)}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs text-center">
                <div>
                  <div className="h-10 border-b border-slate-400 mx-6 mt-4" />
                  <strong className="block text-[#123B5D] mt-1">{currentItem.workerName}</strong>
                  <span className="text-[10px] text-[#263238]/60">Worker Signature &amp; Date Received</span>
                </div>
                <div>
                  <div className="h-10 border-b border-slate-400 mx-6 mt-4" />
                  <strong className="block text-[#123B5D] mt-1">{activeProject.supervisor || 'Site Engineer / Foreman'}</strong>
                  <span className="text-[10px] text-[#263238]/60">Approved &amp; Disbursed By</span>
                </div>
              </div>

              <div className="mt-4 text-[9px] text-[#263238]/50 text-center font-medium">
                Official Wage Slip | 4Ace Desk Contractor Management System | {new Date().toLocaleDateString('en-US', { dateStyle: 'medium' })}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-3 bg-[#EAF7FA] border border-[#18A999]/30 rounded-xl text-xs text-[#123B5D] flex items-center justify-between print:hidden">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#18A999] shrink-0" />
                  <span>Displaying all <strong>{payrollItems.length}</strong> worker payslips for simultaneous batch printing. Click the Print button above.</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {payrollItems.map((item) => (
                  <div
                    key={item.workerId}
                    className="bg-white text-[#263238] rounded-xl p-5 shadow-sm border border-slate-200 text-xs font-sans payslip-card"
                  >
                    <div className="border-b border-[#123B5D] pb-2 flex justify-between items-start">
                      <div>
                        <strong className="text-xs uppercase text-[#123B5D]">{company.companyName}</strong>
                        <div className="text-[10px] text-[#263238]/70">{activeProject.name}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-[#EAF7FA] text-[#123B5D] rounded">
                          PAYSLIP
                        </span>
                        <div className="text-[10px] font-mono text-[#263238]/60 mt-0.5">{startDate} to {endDate}</div>
                      </div>
                    </div>

                    <div className="my-2.5 bg-[#EAF7FA] p-2.5 rounded-lg border border-slate-200 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-sm text-[#123B5D]">{item.workerName}</div>
                        <div className="text-[10px] text-[#263238]/70">{item.role}</div>
                      </div>
                      <div className="text-right font-mono font-bold text-[#18A999]">
                        {formatCurrency(item.dailyRate)}/day
                      </div>
                    </div>

                    <div className="space-y-1 py-1 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-[#263238]/70">Days ({item.daysWorked}d) + OT ({item.overtimeHours}h):</span>
                        <span className="font-mono text-[#263238] font-semibold">{formatCurrency(item.grossPay)}</span>
                      </div>
                      <div className="flex justify-between text-rose-700">
                        <span>Cash Advance Deductions:</span>
                        <span className="font-mono">-{formatCurrency(item.cashAdvanceDeduction)}</span>
                      </div>
                    </div>

                    <div className="mt-2 p-2 bg-[#EAF7FA] border border-[#18A999]/30 rounded-lg flex justify-between items-center font-bold">
                      <span className="text-[#123B5D] text-xs">NET WAGE:</span>
                      <span className="text-base font-black font-mono text-[#18A999]">{formatCurrency(item.netPay)}</span>
                    </div>

                    <div className="mt-4 pt-2 border-t border-slate-200 grid grid-cols-2 gap-4 text-center text-[10px]">
                      <div>
                        <div className="h-6 border-b border-slate-300 mx-2" />
                        <span className="text-[#263238]/60 mt-0.5 block">Worker Signature</span>
                      </div>
                      <div>
                        <div className="h-6 border-b border-slate-300 mx-2" />
                        <span className="text-[#263238]/60 mt-0.5 block">Disbursed By</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-3 bg-white border-t border-slate-200 flex justify-end print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#EAF7FA] text-[#123B5D] hover:bg-slate-200 text-xs font-bold cursor-pointer transition-colors"
          >
            Close Payslips
          </button>
        </div>
      </div>
    </div>
  );
};

export default Payslip;
