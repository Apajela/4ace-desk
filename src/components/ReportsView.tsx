import React, { useState, useMemo } from 'react';
import {
  Project,
  ExpenseItem,
  PayrollEntry,
  SitePriorityItem,
} from '../types';
import {
  TrendingUp,
  Printer,
  Building,
  DollarSign,
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
  onCompleteProject?: (projectId: string) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  currentProject,
  expenses,
  payroll,
  priorities = [],
  onCompleteProject,
}) => {
  const [activeTab, setActiveTab] = useState<'executive' | 'financial' | 'labor' | 'materials' | 'daily_log'>('executive');
  const [completedSuccessToast, setCompletedSuccessToast] = useState(false);

  // Filter project-specific materials/expenses
  const projectExpenses = useMemo(() => {
    return expenses.filter(
      (e) => !e.projectId || e.projectId === currentProject.id || e.projectName === currentProject.name
    );
  }, [expenses, currentProject]);

  const totalMaterialsCost = projectExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

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
  const totalActualCost = totalMaterialsCost + laborAllocation.totalChargeableLaborExpense;
  const budgetUtilization = Math.round((totalActualCost / (currentProject.budget || 1)) * 100);

  // Browser print action
  const handlePrint = () => {
    triggerBrowserPrint();
  };

  // Direct PDF download action
  const handleDownloadPdf = () => {
    exportExecutiveReportPdf(currentProject, laborAllocation, projectExpenses);
  };

  // Mark as Completed Project Action (Allowed anytime, even if progress < 100%)
  const handleMarkAsCompleted = () => {
    if (onCompleteProject) {
      onCompleteProject(currentProject.id);
    }
    setCompletedSuccessToast(true);
    setTimeout(() => {
      setCompletedSuccessToast(false);
    }, 6000);
  };

  return (
    <div className="space-y-6 text-[#263238]">
      {/* Top Header & Completed Project Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-[#123B5D] tracking-tight">
              Executive &amp; Site Progress Reports
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
            Certified Accomplishment Reports, Prorated Labor Costing, and Turnover Documentation.
          </p>
        </div>

        {/* Action Buttons: Mark as Completed Project, Save PDF, and Print Report */}
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

          {/* Dedicated Save PDF Button (Direct Download) */}
          <button
            onClick={handleDownloadPdf}
            className="px-4 py-2.5 bg-[#18A999] hover:bg-[#148f81] text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
            title="Directly download clean PDF report file to your device"
          >
            <Download className="w-4 h-4" />
            <span>Save PDF</span>
          </button>

          {/* Dedicated Print Report Button (Browser Print) */}
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-[#123B5D] font-bold text-xs rounded-xl transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
            title="Open browser print dialog"
          >
            <Printer className="w-4 h-4 text-[#18A999]" />
            <span>Print Report</span>
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
          { id: 'executive', label: 'Executive & Site Progress', icon: TrendingUp },
          { id: 'financial', label: 'Financial & BOQ Variance', icon: BarChart3 },
          { id: 'labor', label: 'Manpower & Prorated Labor Cost', icon: Users },
          { id: 'materials', label: 'Materials & Delivery Ledger', icon: Package },
          { id: 'daily_log', label: 'Daily Log & Inspection', icon: FileCheck },
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

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#263238]/70 text-xs font-semibold mb-1">
            <span>Project Contract Sum</span>
            <Building className="w-4 h-4 text-[#123B5D]" />
          </div>
          <div className="text-xl font-black text-[#123B5D] font-mono">
            ₱{currentProject.budget.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-[#263238]/60 mt-1">
            Client: {currentProject.client}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#263238]/70 text-xs font-semibold mb-1">
            <span>Actual Cost to Date</span>
            <DollarSign className="w-4 h-4 text-[#18A999]" />
          </div>
          <div className="text-xl font-black text-[#123B5D] font-mono">
            ₱{totalActualCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-[#18A999] font-bold mt-1">
            {budgetUtilization}% of Total Allocation
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#263238]/70 text-xs font-semibold mb-1">
            <span>Physical Progress</span>
            <TrendingUp className="w-4 h-4 text-[#18A999]" />
          </div>
          <div className="text-xl font-black text-[#123B5D]">
            {currentProject.progress}% Accomplished
          </div>
          <div className="w-full h-1.5 bg-[#EAF7FA] rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-[#18A999]" style={{ width: `${currentProject.progress}%` }} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#263238]/70 text-xs font-semibold mb-1">
            <span>Total Man-Hours Logged</span>
            <Clock className="w-4 h-4 text-[#123B5D]" />
          </div>
          <div className="text-xl font-black text-[#123B5D]">
            14,800 Hours
          </div>
          <div className="text-[11px] text-[#263238]/60 mt-1">
            Recorded On-Site Shifts
          </div>
        </div>
      </div>

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
                  <span>Save PDF</span>
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

            {/* Engineering Sign-off Block for Print */}
            <div className="pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-center">
              <div className="space-y-1">
                <div className="h-10 border-b border-slate-300"></div>
                <p className="font-bold text-[#123B5D]">Engr. Arriana Daoag</p>
                <p className="text-[10px] text-slate-500">Managing Contractor (PRC-CE-0149204)</p>
              </div>
              <div className="space-y-1">
                <div className="h-10 border-b border-slate-300"></div>
                <p className="font-bold text-[#123B5D]">Engr. Mark Santos</p>
                <p className="text-[10px] text-slate-500">Project Engineer &amp; Estimator</p>
              </div>
              <div className="space-y-1">
                <div className="h-10 border-b border-slate-300"></div>
                <p className="font-bold text-[#123B5D]">{currentProject.client}</p>
                <p className="text-[10px] text-slate-500">Client / Project Owner (Conforme)</p>
              </div>
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
                    <span>Save PDF</span>
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
                  <span>Save PDF</span>
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
                  <span>Save PDF</span>
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
                  {projectExpenses.map((exp) => (
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

      {/* TAB 5: DAILY LOG & INSPECTION */}
      {activeTab === 'daily_log' && (
        <div className="space-y-4 printable-document">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-[#123B5D] uppercase tracking-wider flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-[#18A999]" />
                  Site Daily Log &amp; Supervision Summary
                </h3>
                <p className="text-xs text-[#263238]/70 mt-0.5">
                  Inspection records, daily tasks in-charge, and site condition tracking.
                </p>
              </div>
              <div className="flex items-center gap-2 print:hidden">
                <button
                  onClick={handleDownloadPdf}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#18A999] text-white rounded-xl text-xs font-bold hover:bg-[#148f81] cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Save PDF</span>
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
              {[
                {
                  date: '2026-10-25',
                  weather: 'Clear / Sunny (31°C)',
                  manpower: '8 Crew On-Site',
                  activity: 'Rebar tie-ins on second floor beams and continuous concrete cure.',
                  supervisor: 'Mang Nestor Dela Cruz (Foreman)',
                },
                {
                  date: '2026-10-24',
                  weather: 'Fair (29°C)',
                  manpower: '8 Crew On-Site',
                  activity: 'CHB laying for north elevation and MEP conduit roughing-in.',
                  supervisor: 'Engr. Arriana Daoag',
                },
                {
                  date: '2026-10-23',
                  weather: 'Isolated Showers (28°C)',
                  manpower: '7 Crew On-Site',
                  activity: 'Formwork inspection and scaffolding brace installation.',
                  supervisor: 'Engr. Mark Santos',
                },
              ].map((log, i) => (
                <div key={i} className="p-4 bg-[#EAF7FA]/40 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#123B5D] font-mono">{log.date}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white border border-slate-200 text-[#18A999] font-bold">
                      {log.weather}
                    </span>
                  </div>
                  <p className="text-[#263238] font-medium">{log.activity}</p>
                  <div className="flex items-center justify-between text-[11px] text-[#546e7a] pt-1">
                    <span>Manpower: <strong>{log.manpower}</strong></span>
                    <span>Inspector In-Charge: <strong>{log.supervisor}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsView;
