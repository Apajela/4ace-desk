import React, { useState, useMemo } from 'react';
import {
  Project,
  ExpenseItem,
  PayrollEntry,
  SitePriorityItem,
  UserProfile,
} from '../types';
import {
  TrendingUp,
  Printer,
  Building,
  PieChart,
  BarChart3,
  Clock,
  CheckCircle2,
  Calendar,
  Users,
  Package,
  FileCheck,
  AlertTriangle,
  Download,
  Award,
} from 'lucide-react';
import { triggerBrowserPrint } from '../utils/printReport';
import { calculateProjectLaborAllocation } from '../utils/payrollExpenseHelper';
import { exportExecutiveReportPdf } from '../utils/pdfExport';

export interface ReportsViewProps {
  currentProject: Project;
  expenses: ExpenseItem[];
  payroll: PayrollEntry[];
  priorities?: SitePriorityItem[];
  onCompleteProject?: (projectId: string) => boolean | void;
  onCancelProject?: (projectId: string) => void;
  currentUser?: UserProfile | null;
  attendance?: { projectId: string; date: string; hoursWorked: number; workerId: string }[];
  onUpdateProjectProgress?: (projectId: string, progress: number) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  currentProject,
  expenses,
  payroll,
  priorities = [],
  onCompleteProject,
  onCancelProject,
  currentUser,
  attendance = [],
  onUpdateProjectProgress,
}) => {
  const [activeTab, setActiveTab] = useState<'actual_cost' | 'labor' | 'materials' | 'daily_log'>('actual_cost');
  const [completedSuccessToast, setCompletedSuccessToast] = useState(false);

  // Filter project-specific materials/expenses
  const projectExpenses = useMemo(() => {
    return expenses.filter(
      (e) => !e.projectId || e.projectId === currentProject.id || e.projectName === currentProject.name
    );
  }, [expenses, currentProject]);

  const projectStartDate = currentProject.startDate || '0000-00-00';
  const materialExpenses = projectExpenses.filter((e) => String(e.category || '').toLowerCase().includes('material') && Boolean(e.date) && e.date >= projectStartDate);
  const otherExpenses = projectExpenses.filter((e) => !String(e.category || '').toLowerCase().includes('material') && String(e.category || '').toLowerCase() !== 'labor' && Boolean(e.date) && e.date >= projectStartDate);
  const totalMaterialsCost = materialExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalOtherCost = otherExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Project-date-bound labor allocation (Oct 19-25 with Oct 22 start = 3 days duty charged)
  const laborAllocation = useMemo(() => {
    return calculateProjectLaborAllocation(
      payroll,
      '2026-10-19',
      '2026-10-25',
      currentProject
    );
  }, [payroll, currentProject]);

  // Actual cost: materials + prorated labor charged to this project
  const postedLaborExpenses = projectExpenses.filter((e) => String(e.category || '').toLowerCase() === 'labor' && Boolean(e.date) && e.date >= projectStartDate);
  const totalLaborCost = postedLaborExpenses.length ? postedLaborExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0) : laborAllocation.totalChargeableLaborExpense;
  const totalActualCost = totalMaterialsCost + totalLaborCost + totalOtherCost;
  const totalManHours = attendance.filter((record) => record.projectId === currentProject.id && record.date >= projectStartDate).reduce((sum, record) => sum + (Number(record.hoursWorked) || 0), 0);
  const budgetUtilization = Math.round((totalActualCost / (currentProject.budget || 1)) * 100);

  // Browser print action
  const handlePrint = () => {
    triggerBrowserPrint();
  };

  // Direct PDF download action
  const handleDownloadPdf = () => {
    exportExecutiveReportPdf(currentProject, laborAllocation, projectExpenses, currentUser || undefined);
  };

  // Mark as Completed Project Action (Allowed anytime, even if progress < 100%)
  const handleMarkAsCompleted = () => {
    const completed = onCompleteProject?.(currentProject.id);
    if (completed === false) return;
    setCompletedSuccessToast(true);
    setTimeout(() => setCompletedSuccessToast(false), 6000);
  };

  const handleCancelProject = () => {
    onCancelProject?.(currentProject.id);
  };

  return (
    <div className="space-y-6 text-[#263238]">
      {/* Top Header & Completed Project Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-[#123B5D] tracking-tight">
              Project Reports &amp; Site Ledgers
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#EAF7FA] text-[#123B5D] font-bold border border-[#18A999]/30">
              {currentProject.name}
            </span>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                currentProject.status === 'Completed'
                  ? 'bg-teal-100 text-teal-800 border-teal-300'
                  : currentProject.status === 'Cancelled'
                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                  : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}
            >
              Status: {currentProject.status}
            </span>
          </div>
          <p className="text-xs text-[#263238]/70 mt-1">
            Site labor allocation, materials ledger, and daily site priorities.
          </p>
        </div>

        {/* Project lifecycle actions; site-record editing is available from the main navigation. */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Mark as Completed Project Button (No download triggered here) */}
          <button
            onClick={handleMarkAsCompleted}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#123B5D] hover:bg-[#0c273e] text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer border border-[#18A999]/50"
            title="Mark project as Completed and archive to Project History (Allowed anytime, regardless of physical progress)"
          >
            <CheckCircle2 className="w-4 h-4 text-[#18A999]" />
            <span>Mark as Completed Project</span>
          </button>
          <button
            onClick={handleCancelProject}
            disabled={currentProject.status === 'Completed' || currentProject.status === 'Cancelled'}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
            title="Cancel this project and remove it from active projects"
          >
            <span>Cancel Project</span>
          </button>

        </div>
      </div>

      {/* Toast Notification when Completed is clicked */}
      {completedSuccessToast && (
        <div className="p-4 bg-teal-50 border-2 border-[#18A999] rounded-2xl text-[#0d786d] text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-[#18A999] shrink-0" />
            <div>
              <p className="text-sm font-black text-[#123B5D]">
                Project Status Successfully Updated to COMPLETED!
              </p>
              <p className="font-normal text-[#263238]">
                Site project has been archived to the Project History page and removed from active site selection.
              </p>
            </div>
          </div>
          <span className="text-[10px] bg-[#18A999] text-white px-2.5 py-1 rounded-md font-bold">
            Turnover Ready
          </span>
        </div>
      )}

      {/* Report Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 text-xs font-bold">
        {[
          { id: 'actual_cost', label: 'Actual Total Cost', icon: PieChart },
          { id: 'labor', label: 'Manpower & Prorated Labor Cost', icon: Users },
          { id: 'materials', label: 'Materials & Delivery Ledger', icon: Package },
          { id: 'daily_log', label: 'Daily Site Priority Log', icon: FileCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-[#123B5D] text-white shadow-xs'
                  : 'bg-[#EAF7FA] text-[#123B5D] hover:bg-[#d6f0f5]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#18A999]' : 'text-[#123B5D]'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === 'actual_cost' && <div className="space-y-4 printable-document">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 mb-4">
            <div><h3 className="text-sm font-black text-[#123B5D] uppercase tracking-wider">Total Actual Cost Summary</h3><p className="text-xs text-slate-500 mt-1">All recorded project expenses since project start, including materials, labor, and other costs.</p></div>
            <div className="text-right"><div className="text-xs text-slate-500">Total Actual Cost</div><div className="text-2xl font-black text-[#123B5D]">₱{totalActualCost.toLocaleString('en-US',{minimumFractionDigits:2})}</div><div className="text-xs font-bold text-[#18A999]">{budgetUtilization}% of contract sum</div></div>
          </div>
          <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="bg-[#EAF7FA] text-[#123B5D] font-bold"><tr><th className="p-3">Expense Category</th><th className="p-3">Summary</th><th className="p-3 text-right">Amount</th></tr></thead><tbody className="divide-y divide-slate-100">
            <tr><td className="p-3">Materials</td><td className="p-3">Supplier invoices and material purchases ({materialExpenses.length} records)</td><td className="p-3 text-right font-bold">₱{totalMaterialsCost.toLocaleString('en-US',{minimumFractionDigits:2})}</td></tr>
            <tr><td className="p-3">Labor</td><td className="p-3">Prorated labor cost ({postedLaborExpenses.length} posted labor records)</td><td className="p-3 text-right font-bold">₱{totalLaborCost.toLocaleString('en-US',{minimumFractionDigits:2})}</td></tr>
            <tr><td className="p-3">Other Expenses</td><td className="p-3">Equipment, subcontractor, permits, and other recorded expenses ({otherExpenses.length} records)</td><td className="p-3 text-right font-bold">₱{totalOtherCost.toLocaleString('en-US',{minimumFractionDigits:2})}</td></tr>
          </tbody><tfoot className="bg-[#EAF7FA] font-black"><tr><td colSpan={2} className="p-3">TOTAL ACTUAL COST</td><td className="p-3 text-right text-[#18A999]">₱{totalActualCost.toLocaleString('en-US',{minimumFractionDigits:2})}</td></tr></tfoot></table></div>
          <div className="flex justify-end gap-2 mt-4 print:hidden"><button onClick={handleDownloadPdf} className="px-3 py-2 rounded-lg bg-[#18A999] text-white text-xs font-bold">Save</button><button onClick={handlePrint} className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold">Print</button></div>
        </div>
      </div>}

      {activeTab === 'actual_cost' && currentUser?.accessLevel === 'Full Access (Admin)' && <div className="bg-white border border-slate-200 rounded-xl p-4"><label className="block text-xs font-bold text-[#123B5D]">Physical Progress (%) — Full Access only<input type="number" min={0} max={100} value={currentProject.progress} onChange={(event) => onUpdateProjectProgress?.(currentProject.id, Math.max(0, Math.min(100, Number(event.target.value) || 0)))} className="mt-2 w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label><div className="mt-3 h-2 w-full rounded-full bg-[#EAF7FA] overflow-hidden"><div className="h-full bg-[#18A999]" style={{width:`${currentProject.progress}%`}} /></div><p className="text-xs text-slate-500 mt-1">The saved percentage is shared with the project dashboard.</p></div>}

      {/* Legacy executive/financial panels are intentionally not exposed as tabs. */}
      {/* TAB 1: EXECUTIVE & SITE PROGRESS REPORT */}
      {activeTab === 'executive' && (
        <div className="space-y-5 printable-document">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-[#123B5D] uppercase tracking-wider">
                  Executive Progress &amp; Milestone Accomplishment
                </h3>
                <p className="text-xs text-[#263238]/70 mt-0.5">
                  Official engineering progress certification for {currentProject.name} ({currentProject.code})
                </p>
              </div>
              <div className="flex items-center gap-2 print:hidden">
                <button
                  onClick={handleDownloadPdf}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#18A999] text-white rounded-xl text-xs font-bold hover:bg-[#148f81] cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-[#123B5D] rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-[#18A999]" />
                  <span>Print</span>
                </button>
              </div>
            </div>

            {/* Milestones Schedule */}
            <div className="space-y-3 pt-1">
              {[
                { phase: 'Phase 1: Mobilization, Demolition & Site Layout', planned: 100, actual: 100, status: 'Completed' },
                { phase: 'Phase 2: Substructure & Foundation Retrofit', planned: 100, actual: 100, status: 'Completed' },
                { phase: 'Phase 3: Ground Floor Expansion & Masonry Enclosure', planned: 60, actual: 55, status: 'Active Stage' },
                { phase: 'Phase 4: Tile Fit-out, Carpentry & Drywall Ceilings', planned: 20, actual: 0, status: 'Upcoming' },
                { phase: 'Phase 5: Punchlisting & Final Turnover', planned: 0, actual: 0, status: 'Upcoming' },
              ].map((milestone, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-slate-200 bg-[#EAF7FA]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#263238]">{milestone.phase}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-slate-200 text-[#123B5D] font-semibold">
                        {milestone.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="text-[11px] text-[#263238]/60">Accomplishment</div>
                      <div className="font-bold text-[#123B5D]">
                        {milestone.actual}% / {milestone.planned}%
                      </div>
                    </div>
                    <div className="w-28 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#18A999] rounded-full"
                        style={{ width: `${milestone.actual}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Minimal report sign-off: Prepared By and Client only */}
            <div className="pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs text-center">
              <div className="space-y-1"><div className="h-10 border-b border-slate-300"></div><p className="font-bold text-[#123B5D]">{currentUser?.signaturePreparedBy || currentUser?.name || ''}</p><p className="text-[10px] text-slate-500">Prepared By</p></div>
              <div className="space-y-1"><div className="h-10 border-b border-slate-300"></div><p className="font-bold text-[#123B5D]">{currentProject.client}</p><p className="text-[10px] text-slate-500">Client</p></div>
            </div>
            </div>
          </div>
      )}

      {/* TAB 2: FINANCIAL & BOQ VARIANCE */}
      {activeTab === 'financial' && (
        <div className="space-y-4 printable-document">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h3 className="text-sm font-bold text-[#123B5D] flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#18A999]" />
                  Budget vs. Actual Expenditure Analysis
                </h3>
                <div className="flex items-center gap-2 print:hidden">
                  <button
                    onClick={handleDownloadPdf}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#18A999] text-white rounded-xl text-xs font-bold hover:bg-[#148f81] cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </button>
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-[#123B5D] rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#18A999]" />
                    <span>Print</span>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { name: 'Structural Works & Concrete Ready-Mix', budget: 120000, actual: 50150, pct: 41 },
                  { name: 'Substructure & Masonry Expansion', budget: 60000, actual: 32000, pct: 53 },
                  { name: 'MEPFS Roughing-in & Electrical', budget: 40000, actual: 18500, pct: 46 },
                  { name: 'Field Labor & Carpenters', budget: 30000, actual: laborAllocation.totalChargeableLaborExpense || 18000, pct: 60 },
                ].map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-[#EAF7FA]/50 border border-slate-200/80">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-bold text-[#263238]">{item.name}</span>
                      <span className="text-[#263238]/70 font-mono font-medium">
                        ₱{item.actual.toLocaleString()} / ₱{item.budget.toLocaleString()} ({item.pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#18A999] rounded-full"
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#123B5D] mb-4 flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-[#18A999]" />
                  Contract Variance &amp; Profitability
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-[#263238]/70">Total Contract Value:</span>
                    <strong className="text-[#123B5D] font-mono">₱{currentProject.budget.toLocaleString()}</strong>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-[#263238]/70">Billed to Client:</span>
                    <strong className="text-[#18A999] font-mono font-bold">₱{(currentProject.budget * 0.4).toLocaleString()}</strong>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-[#263238]/70">10% Retention Fund:</span>
                    <strong className="text-[#263238] font-mono">₱{(currentProject.budget * 0.1).toLocaleString()}</strong>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-[#263238]/70">Site Materials Invoiced:</span>
                    <strong className="text-[#263238] font-mono">₱{totalMaterialsCost.toLocaleString()}</strong>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-[#263238]/70">Prorated Weekly Labor:</span>
                    <strong className="text-[#263238] font-mono">₱{laborAllocation.totalChargeableLaborExpense.toLocaleString()}</strong>
                  </div>
                  <div className="flex items-center justify-between py-2.5 bg-[#EAF7FA] rounded-xl px-3 mt-3">
                    <span className="font-bold text-[#123B5D]">Projected Margin:</span>
                    <strong className="text-[#18A999] font-black text-sm">22.4%</strong>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 text-[11px] text-[#263238]/60">
                Audited based on Philippine Construction Contract Standards.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MANPOWER & PRORATED LABOR COST LEDGER */}
      {activeTab === 'labor' && (
        <div className="space-y-4 printable-document">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-[#123B5D] uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#18A999]" />
                  Site Labor Expense Allocation &amp; Start-Date Rule
                </h3>
                <p className="text-xs text-[#263238]/70 mt-0.5">
                  Labor duty charged strictly from project start date: <strong className="text-[#123B5D]">{currentProject.startDate}</strong>
                </p>
              </div>
              <div className="flex items-center gap-2 print:hidden">
                <button
                  onClick={handleDownloadPdf}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#18A999] text-white rounded-xl text-xs font-bold hover:bg-[#148f81] cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-[#123B5D] rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-[#18A999]" />
                  <span>Print</span>
                </button>
              </div>
            </div>

            {/* Rule Callout Box */}
            <div className="p-4 bg-[#EAF7FA] border border-[#18A999]/30 rounded-xl text-xs space-y-1">
              <div className="font-bold text-[#123B5D] flex items-center gap-1.5">
                <Building className="w-4 h-4 text-[#18A999]" />
                <span>Proration Policy Notice:</span>
              </div>
              <p className="text-[#263238]">
                Labor expenses are strictly charged starting from the project start date (<strong>{currentProject.startDate}</strong>).
                For the cutoff period from <strong>{laborAllocation.cutoffStartDate} to {laborAllocation.cutoffEndDate}</strong>,
                only <strong>{laborAllocation.maxChargeableWindowDays} duty days</strong> of worker labor are allocated to this site project.
                Labor shifts prior to project commencement are excluded from this project budget.
              </p>
            </div>

            {/* Worker Prorated Breakdown Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#EAF7FA] text-[#123B5D] font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Crew Member / Trade</th>
                    <th className="py-2.5 px-3 text-right">Daily Rate</th>
                    <th className="py-2.5 px-3 text-center">Cutoff Total Days</th>
                    <th className="py-2.5 px-3 text-center text-[#18A999]">Days Charged to Project</th>
                    <th className="py-2.5 px-3 text-right">Labor Charge</th>
                    <th className="py-2.5 px-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {laborAllocation.breakdown.map((row) => (
                    <tr key={row.workerId} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3">
                        <strong className="text-[#123B5D]">{row.workerName}</strong>
                        <span className="block text-[11px] text-slate-500">{row.role}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">₱{row.dailyRate}</td>
                      <td className="py-2.5 px-3 text-center">{row.totalDaysWorkedInCutoff} days</td>
                      <td className="py-2.5 px-3 text-center font-bold text-[#18A999]">
                        {row.chargeableDutyDays} days
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#123B5D]">
                        ₱{row.totalChargeableLabor.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-500">
                        {row.notes}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-[#EAF7FA] font-bold border-t border-slate-200">
                  <tr>
                    <td colSpan={4} className="py-2.5 px-3 text-[#123B5D]">
                      Total Labor Cost Charged to {currentProject.name}:
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[#18A999] text-sm">
                      ₱{laborAllocation.totalChargeableLaborExpense.toLocaleString()}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MATERIALS & DELIVERY LEDGER */}
      {activeTab === 'materials' && (
        <div className="space-y-4 printable-document">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-[#123B5D] uppercase tracking-wider flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#18A999]" />
                  Material Delivery &amp; Supplier Invoices Ledger
                </h3>
                <p className="text-xs text-[#263238]/70 mt-0.5">
                  Official bill of materials, receipt tracking, and hardware supplies delivered to site.
                </p>
              </div>
              <div className="flex items-center gap-2 print:hidden">
                <button
                  onClick={handleDownloadPdf}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#18A999] text-white rounded-xl text-xs font-bold hover:bg-[#148f81] cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-[#123B5D] rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-[#18A999]" />
                  <span>Print</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#EAF7FA] text-[#123B5D] font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Item Description / Category</th>
                    <th className="py-2.5 px-3">Supplier / Vendor</th>
                    <th className="py-2.5 px-3">Invoice #</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {materialExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono">{exp.date}</td>
                      <td className="py-2.5 px-3">
                        <strong className="text-[#123B5D]">{exp.description || exp.category}</strong>
                        <span className="block text-[11px] text-slate-500">{exp.category}</span>
                      </td>
                      <td className="py-2.5 px-3">{exp.vendor || exp.supplier || 'Site Hardware'}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px]">{exp.invoiceNumber || exp.invoiceNo || 'INV-SITE'}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#123B5D]">
                        ₱{Number(exp.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold">
                          {exp.paymentStatus || exp.status || 'Paid'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-[#EAF7FA] font-bold border-t border-slate-200">
                  <tr>
                    <td colSpan={4} className="py-2.5 px-3 text-[#123B5D]">
                      Total Materials Invoiced:
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[#18A999] text-sm">
                      ₱{totalMaterialsCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* DAILY SITE PRIORITY LOG */}
      {activeTab === 'daily_log' && (
        <div className="space-y-4 printable-document">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-[#123B5D] uppercase tracking-wider flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-[#18A999]" />
                  Daily Site Priority Log
                </h3>
                <p className="text-xs text-[#263238]/70 mt-0.5">
                  Current priorities, assigned crew members, checklist progress, and completion status.
                </p>
              </div>
              <div className="flex items-center gap-2 print:hidden">
                <button
                  onClick={handleDownloadPdf}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#18A999] text-white rounded-xl text-xs font-bold hover:bg-[#148f81] cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-[#123B5D] rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-[#18A999]" />
                  <span>Print</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {priorities.filter((item) => (item.projectId ? item.projectId === currentProject.id : item.siteName === currentProject.name)).length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-xs text-slate-500">
                  No site priorities have been recorded for this project yet.
                </div>
              ) : priorities
                .filter((item) => (item.projectId ? item.projectId === currentProject.id : item.siteName === currentProject.name))
                .map((item) => {
                  const checks = item.checklistItems || [];
                  const closed = item.completed || ['done', 'completed', 'closed'].includes(String(item.status || '').toLowerCase());
                  return (
                    <div key={item.id} className="p-4 bg-[#EAF7FA]/40 border border-slate-200 rounded-xl space-y-2 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-white border border-slate-200 px-2 py-1 font-bold text-[#123B5D]">{closed ? 'Completed & Closed' : item.status || 'Open'}</span>
                          <span className="rounded bg-amber-50 border border-amber-200 px-2 py-1 font-bold text-amber-800">{item.priority}</span>
                          {item.trade && <span className="rounded bg-white border border-slate-200 px-2 py-1 text-slate-600">{item.trade}</span>}
                        </div>
                        <span className="text-[10px] text-[#546e7a]">{item.dueDate || item.targetDate || (item.createdAt ? item.createdAt.slice(0,10) : '')}</span>
                      </div>
                      <p className="font-bold text-[#123B5D]">{item.title}</p>
                      {item.description && <p className="text-slate-600">{item.description}</p>}
                      {checks.length > 0 && <ul className="list-disc pl-5 text-slate-600">{checks.map((check) => <li key={check.id} className={check.completed ? 'line-through' : ''}>{check.text}</li>)}</ul>}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-2 text-[11px] text-[#546e7a]">
                        <span>{item.assignedTo || 'Unassigned'}</span>
                        <span>Status: <strong className={closed ? 'text-emerald-700' : 'text-amber-700'}>{closed ? 'Done' : item.status || 'Pending'}</strong></span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsView;
