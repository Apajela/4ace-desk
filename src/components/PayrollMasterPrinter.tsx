import React from 'react';
import {
  Printer,
  Download,
  X,
  FileSpreadsheet,
  Banknote,
} from 'lucide-react';
import { Project, CompanySettings, PayrollEntry, UserProfile } from '../types';
import { triggerBrowserPrint } from '../utils/printReport';
import { exportPayrollMasterPdf } from '../utils/pdfExport';

export interface PayrollMasterPrinterProps {
  isOpen: boolean;
  onClose: () => void;
  currentProject: Project;
  company: CompanySettings;
  payroll: PayrollEntry[];
  cutoffPeriod: string;
  currentUser?: UserProfile | null;
}

export const PayrollMasterPrinter: React.FC<PayrollMasterPrinterProps> = ({
  isOpen,
  onClose,
  currentProject,
  company,
  payroll,
  cutoffPeriod,
  currentUser,
}) => {
  if (!isOpen) return null;

  const formatCurrency = (val: number) =>
    '₱' + Math.round(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const totalRegularPay = payroll.reduce((sum, p) => sum + (p.regularPay || (p.dailyRate * p.daysWorked)), 0);
  const totalOtHours = payroll.reduce((sum, p) => sum + (p.otHours || 0), 0);
  const totalOtPay = payroll.reduce((sum, p) => sum + (p.otPay || ((p.dailyRate / 8) * 1.25 * (p.otHours || 0))), 0);
  const totalGrossPay = payroll.reduce((sum, p) => sum + (p.grossPay || (p.regularPay + p.otPay)), 0);
  const totalCashAdvances = payroll.reduce((sum, p) => sum + (p.cashAdvance || 0), 0);
  const totalNetPay = payroll.reduce((sum, p) => sum + (p.netPay || Math.max(0, p.grossPay - p.totalDeductions)), 0);

  // Cash Denomination Calculator for Teller / Envelope Payouts
  const calculateDenominations = (totalAmount: number) => {
    let remainder = Math.round(totalAmount);
    const bills = [1000, 500, 200, 100, 50, 20];
    const breakdown: Record<number, number> = {};

    bills.forEach((bill) => {
      breakdown[bill] = Math.floor(remainder / bill);
      remainder = remainder % bill;
    });

    return { breakdown, looseCoins: remainder };
  };

  const denominations = calculateDenominations(totalNetPay);

  const handlePrint = () => {
    triggerBrowserPrint();
  };

  const handleDownloadPdf = () => {
    exportPayrollMasterPdf(currentProject, company, payroll, cutoffPeriod);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Modal Controls Header (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#123B5D] text-white print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#18A999]">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Master Weekly Payroll Summary &amp; Registry Sheet
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#18A999] text-white font-bold">
                  Official Master Voucher
                </span>
              </div>
              <p className="text-[11px] text-white/80">
                Project Site: <span className="text-white font-bold">{currentProject.name}</span> | Cutoff: {cutoffPeriod}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#18A999] hover:bg-[#148f81] text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
              title="Directly download PDF file"
            >
              <Download className="w-4 h-4" />
              <span>Save PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-[#123B5D] font-bold text-xs shadow-sm transition-colors cursor-pointer"
              title="Open browser print preview"
            >
              <Printer className="w-4 h-4 text-[#18A999]" />
              <span>Print Registry</span>
            </button>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Master Sheet Body */}
        <div className="p-4 sm:p-8 overflow-y-auto space-y-6 flex-1 bg-slate-100/50">
          <div className="bg-white text-[#263238] rounded-2xl p-6 sm:p-8 shadow-md border border-slate-200 max-w-4xl mx-auto font-sans printable-document">
            {/* Master Header */}
            <div className="border-b-2 border-[#123B5D] pb-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <h1 className="text-xl font-black uppercase tracking-wider text-[#123B5D]">
                    {company.companyName}
                  </h1>
                  <p className="text-xs text-[#263238] font-semibold mt-0.5">
                    {company.licenseNumber} | General Engineering &amp; Building Contractor
                  </p>
                  <p className="text-[11px] text-[#263238]/70">
                    {company.address} | Tel: {company.contactNumber}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded bg-[#123B5D] text-white">
                    WEEKLY PAYROLL MASTER REGISTRY
                  </span>
                  <div className="text-xs font-mono font-bold text-[#123B5D] mt-2">
                    CUTOFF: {cutoffPeriod}
                  </div>
                  <div className="text-[11px] text-[#263238]/60">
                    Printed: {new Date().toLocaleDateString('en-US', { dateStyle: 'medium' })}
                  </div>
                </div>
              </div>

              {/* Site Details Sub-bar */}
              <div className="mt-4 p-3 bg-[#EAF7FA] border border-slate-200 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-[#263238]/60 uppercase font-bold block">Site Project:</span>
                  <strong className="text-[#123B5D]">{currentProject.name}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#263238]/60 uppercase font-bold block">Site Code:</span>
                  <span className="font-mono text-[#263238] font-semibold">{currentProject.code}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#263238]/60 uppercase font-bold block">Location:</span>
                  <span className="text-[#263238]">{currentProject.location}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#263238]/60 uppercase font-bold block">Lead Supervisor:</span>
                  <strong className="text-[#123B5D]">{currentProject.supervisor}</strong>
                </div>
              </div>
            </div>

            {/* Master Payroll Table */}
            <div className="my-5 overflow-x-auto">
              <table className="w-full text-left text-[11px] border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-[#EAF7FA] text-[#123B5D] uppercase font-bold border-b border-slate-300 text-[10px]">
                    <th className="py-2.5 px-2 border-r border-slate-300 text-center w-8">#</th>
                    <th className="py-2.5 px-3 border-r border-slate-300">Worker &amp; Trade</th>
                    <th className="py-2.5 px-2 border-r border-slate-300 text-right">Daily Rate</th>
                    <th className="py-2.5 px-2 border-r border-slate-300 text-center">Days</th>
                    <th className="py-2.5 px-2 border-r border-slate-300 text-right">Reg Pay</th>
                    <th className="py-2.5 px-2 border-r border-slate-300 text-center">OT Hrs</th>
                    <th className="py-2.5 px-2 border-r border-slate-300 text-right">OT Pay</th>
                    <th className="py-2.5 px-2 border-r border-slate-300 text-right">Gross Pay</th>
                    <th className="py-2.5 px-2 border-r border-slate-300 text-right text-rose-700">Cash Adv.</th>
                    <th className="py-2.5 px-2 border-r border-slate-300 text-right text-[#18A999] font-black">Net Pay</th>
                    <th className="py-2.5 px-3 text-center w-28">Worker Signature</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {payroll.map((p, idx) => {
                    const regPay = p.regularPay || (p.dailyRate * p.daysWorked);
                    const otHours = p.otHours || 0;
                    const otPay = p.otPay || ((p.dailyRate / 8) * 1.25 * otHours);
                    const gross = p.grossPay || (regPay + otPay);
                    const ca = p.cashAdvance || 0;
                    const net = p.netPay || Math.max(0, gross - (p.totalDeductions || ca));

                    return (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="py-2 px-2 border-r border-slate-200 text-center font-mono text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200">
                          <strong className="text-[#123B5D] block">{p.workerName}</strong>
                          <span className="text-[10px] text-[#263238]/60">{p.role}</span>
                        </td>
                        <td className="py-2 px-2 border-r border-slate-200 text-right font-mono">
                          ₱{p.dailyRate}
                        </td>
                        <td className="py-2 px-2 border-r border-slate-200 text-center font-bold">
                          {p.daysWorked}
                        </td>
                        <td className="py-2 px-2 border-r border-slate-200 text-right font-mono">
                          ₱{Math.round(regPay).toLocaleString()}
                        </td>
                        <td className="py-2 px-2 border-r border-slate-200 text-center font-mono text-[#18A999] font-bold">
                          {otHours}h
                        </td>
                        <td className="py-2 px-2 border-r border-slate-200 text-right font-mono">
                          ₱{Math.round(otPay).toLocaleString()}
                        </td>
                        <td className="py-2 px-2 border-r border-slate-200 text-right font-mono font-semibold">
                          ₱{Math.round(gross).toLocaleString()}
                        </td>
                        <td className="py-2 px-2 border-r border-slate-200 text-right font-mono text-rose-700 font-semibold">
                          {ca > 0 ? `-₱${Math.round(ca).toLocaleString()}` : '—'}
                        </td>
                        <td className="py-2 px-2 border-r border-slate-200 text-right font-mono font-black text-[#123B5D] text-xs">
                          ₱{Math.round(net).toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <div className="h-6 border-b border-dashed border-slate-400 mt-1" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-[#EAF7FA] font-bold border-t-2 border-[#123B5D] text-[#123B5D] text-xs">
                    <td colSpan={3} className="py-2.5 px-3 border-r border-slate-300 uppercase">
                      Total Payout ({payroll.length} Workers)
                    </td>
                    <td className="py-2.5 px-2 border-r border-slate-300 text-center">
                      {payroll.reduce((sum, p) => sum + p.daysWorked, 0)}d
                    </td>
                    <td className="py-2.5 px-2 border-r border-slate-300 text-right font-mono">
                      ₱{Math.round(totalRegularPay).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-2 border-r border-slate-300 text-center font-mono text-[#18A999]">
                      {totalOtHours}h
                    </td>
                    <td className="py-2.5 px-2 border-r border-slate-300 text-right font-mono">
                      ₱{Math.round(totalOtPay).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-2 border-r border-slate-300 text-right font-mono">
                      ₱{Math.round(totalGrossPay).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-2 border-r border-slate-300 text-right font-mono text-rose-700">
                      -₱{Math.round(totalCashAdvances).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-2 border-r border-slate-300 text-right font-mono font-black text-sm text-[#123B5D]">
                      ₱{Math.round(totalNetPay).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-center text-[10px] text-[#263238]/60 font-normal">
                      Full Settlement
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Cash Breakdown for Envelope Withdrawals */}
            <div className="my-5 p-4 bg-[#EAF7FA] border border-slate-200 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#123B5D] flex items-center gap-1.5">
                  <Banknote className="w-4 h-4 text-[#18A999]" />
                  Bank Teller Cash Breakdown (Envelope Payout Calculator)
                </span>
                <span className="text-[11px] font-mono text-[#263238]/70">
                  Total Needed: <strong className="text-[#123B5D]">{formatCurrency(totalNetPay)}</strong>
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
                {[1000, 500, 200, 100, 50, 20].map((bill) => (
                  <div key={bill} className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                    <span className="text-[10px] text-[#263238]/60 font-bold block">₱{bill} Bills</span>
                    <strong className="text-sm font-black text-[#123B5D] font-mono">
                      {denominations.breakdown[bill]} pcs
                    </strong>
                    <span className="text-[10px] text-[#263238]/70 block mt-0.5">
                      = ₱{(denominations.breakdown[bill] * bill).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Certification Sign-Offs */}
            <div className="pt-6 border-t border-slate-200 grid grid-cols-3 gap-6 text-xs text-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#263238]/60 block mb-8">Prepared By:</span>
                <div className="border-b border-slate-800 mx-4" />
                {currentUser?.signaturePreparedBy && <strong className="block text-[#123B5D] mt-1">{currentUser.signaturePreparedBy}</strong>}
                {currentUser?.signaturePreparedTitle && <span className="text-[10px] text-[#263238]/60">{currentUser.signaturePreparedTitle}</span>}
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#263238]/60 block mb-8">Checked &amp; Audited By:</span>
                <div className="border-b border-slate-800 mx-4" />
                {currentUser?.signatureCheckedBy !== undefined ? (currentUser.signatureCheckedBy && <strong className="block text-[#123B5D] mt-1">{currentUser.signatureCheckedBy}</strong>) : <strong className="block text-[#123B5D] mt-1">{currentProject.supervisor}</strong>}
                {currentUser?.signatureCheckedTitle && <span className="text-[10px] text-[#263238]/60">{currentUser.signatureCheckedTitle}</span>}
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#263238]/60 block mb-8">Approved &amp; Released By:</span>
                <div className="border-b border-slate-800 mx-4" />
                {(currentUser?.signatureApprovedBy || currentUser?.name) && <strong className="block text-[#123B5D] mt-1">{currentUser?.signatureApprovedBy || currentUser?.name}</strong>}
                {currentUser?.signatureApprovedTitle && <span className="text-[10px] text-[#263238]/60">{currentUser.signatureApprovedTitle}</span>}
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-[#263238]/60">
              <span>DOLE DO 13 Compliant Labor Record | 4Ace Desk ERP</span>
              <span>Official Master Record</span>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between print:hidden">
          <span className="text-xs text-[#263238]/70">
            Click &quot;Save PDF&quot; to download the file directly, or &quot;Print Registry&quot; to open the browser print dialog.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#EAF7FA] text-[#123B5D] hover:bg-slate-200 text-xs font-bold cursor-pointer transition-colors"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};

export default PayrollMasterPrinter;
