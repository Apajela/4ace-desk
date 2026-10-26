import React, { useState } from 'react';
import {
  DollarSign,
  Users,
  Building2,
  ArrowRight,
  TrendingUp,
  Receipt,
  CheckCircle2,
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Camera,
  MapPin,
  User,
} from 'lucide-react';
import {
  Project,
  Expense,
  Worker,
  AttendanceRecord,
  CashAdvance,
  SitePriority,
  UserProfile,
  CompanySettings,
} from '../types';

export interface DashboardViewProps {
  activeProject: Project;
  allProjects: Project[];
  expenses: Expense[];
  workers: Worker[];
  attendance: AttendanceRecord[];
  cashAdvances: CashAdvance[];
  priorities: SitePriority[];
  currentUser: UserProfile;
  company: CompanySettings;
  onNavigateTab: (tab: string) => void;
  onOpenAttendanceModal: () => void;
  onOpenReceiptScanner: () => void;
  onOpenProjectModal: () => void;
  onTogglePriority: (id: string) => void;
  onAddPriority: (priority: Omit<SitePriority, 'id' | 'createdAt'>) => void;
  onDeletePriority: (id: string) => void;
  onClearCompletedPriorities: () => void;
  onSelectProject: (id: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  activeProject,
  allProjects,
  expenses,
  workers,
  attendance,
  priorities,
  onNavigateTab,
  onOpenAttendanceModal,
  onOpenReceiptScanner,
  onOpenProjectModal,
  onTogglePriority,
  onAddPriority,
  onDeletePriority,
  onClearCompletedPriorities,
  onSelectProject,
}) => {
  const [newPriorityTitle, setNewPriorityTitle] = useState('');
  const [priorityLevel, setPriorityLevel] = useState<SitePriority['priority']>('medium');
  const [priorityAssignee, setPriorityAssignee] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [isAddingPriority, setIsAddingPriority] = useState(false);
  const [txFilter, setTxFilter] = useState<'all' | 'materials' | 'labor'>('all');

  const projectExpenses = expenses.filter(
    (e) => !e.projectId || e.projectId === activeProject.id || e.projectName === activeProject.name
  );
  const totalBudgetSpent = projectExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const remainingBudget = Math.max(0, activeProject.budget - totalBudgetSpent);
  const budgetPercentSpent =
    activeProject.budget > 0 ? (totalBudgetSpent / activeProject.budget) * 100 : 0;

  const materialsSpent = projectExpenses
    .filter((e) => e.category === 'Materials' || e.category === 'Equipment' || e.category === 'Fuel')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const laborSpent = projectExpenses
    .filter((e) => e.category === 'Labor' || e.category === 'Subcontractor')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.filter((a) => !a.date || a.date === todayStr);
  const currentDailyLaborCost = todayAttendance.reduce(
    (sum, a) => sum + (Number(a.dailyWage) || 0),
    0
  );
  const dailyLaborCeiling = 8000;
  const dailyLaborPercent = Math.min(100, Math.round((currentDailyLaborCost / dailyLaborCeiling) * 100));
  const totalCrewCount = workers.length || 8;
  const timedInCount = todayAttendance.length || 8;
  const timedOutCount = todayAttendance.filter((a) => Boolean(a.timeOut && a.timeOut !== '05:00 PM')).length;
  const activeOnSiteCount = Math.max(1, timedInCount - timedOutCount);

  const formatCurrency = (val: number) => '₱' + Math.round(val).toLocaleString('en-US');

  const projectPriorities = priorities.filter(
    (p) => !p.projectId || p.projectId === activeProject.id || p.siteName === activeProject.name
  );
  const completedPrioritiesCount = projectPriorities.filter((p) => p.completed).length;
  const totalPrioritiesCount = projectPriorities.length;
  const prioritiesProgress =
    totalPrioritiesCount > 0
      ? Math.round((completedPrioritiesCount / totalPrioritiesCount) * 100)
      : 0;

  const filteredPriorities = projectPriorities.filter((p) => {
    if (priorityFilter === 'pending') return !p.completed;
    if (priorityFilter === 'completed') return p.completed;
    return true;
  });

  const handleCreatePriority = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPriorityTitle.trim()) return;
    onAddPriority({
      projectId: activeProject.id,
      title: newPriorityTitle.trim(),
      completed: false,
      priority: priorityLevel,
      siteName: activeProject.name,
      assignedTo: priorityAssignee.trim() || 'Site Foreman',
      dueDate: 'Today',
      status: 'todo',
      checklistItems: [
        { id: `c-1-${Date.now()}`, text: 'Initial inspection', completed: false },
      ],
    });
    setNewPriorityTitle('');
    setPriorityAssignee('');
    setIsAddingPriority(false);
  };

  interface CombinedTx {
    id: string;
    type: 'labor' | 'material';
    title: string;
    subtitle: string;
    amount: number;
    badge: string;
    date: string;
  }

  const laborTransactions: CombinedTx[] = todayAttendance.slice(0, 4).map((att) => ({
    id: `labor-${att.id}`,
    type: 'labor',
    title: att.workerName,
    subtitle: `Crew Shift | ${att.timeIn || '07:00 AM'} - ${att.timeOut || 'Working on site'} | ${att.trade || 'Worker'}`,
    amount: att.dailyWage || 750,
    badge: 'Daily Wage',
    date: att.date || todayStr,
  }));

  const materialTransactions: CombinedTx[] = projectExpenses.slice(0, 6).map((exp) => ({
    id: `mat-${exp.id}`,
    type: 'material',
    title: exp.vendor || exp.supplier || 'Site Supplier',
    subtitle: `${exp.category} | ${exp.invoiceNumber ? `Inv: ${exp.invoiceNumber} | ` : ''}${exp.description || exp.notes || ''}`,
    amount: Number(exp.amount) || 0,
    badge: exp.paymentStatus || 'Materials',
    date: exp.date,
  }));

  const allTransactions = [...laborTransactions, ...materialTransactions];
  const filteredTransactions = allTransactions.filter((tx) => {
    if (txFilter === 'materials') return tx.type === 'material';
    if (txFilter === 'labor') return tx.type === 'labor';
    return true;
  });

  return (
    <div className="space-y-6 text-[#263238]">
      {/* 1. Top Command Center Header - Navy #123B5D with Teal #18A999 Accents */}
      <div className="bg-[#123B5D] text-white rounded-3xl p-6 shadow-lg border border-[#0d2b45] relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#18A999] flex items-center justify-center text-white shadow-md shadow-teal-900/40 shrink-0">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Project Command Center
                </h1>
                <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-[#18A999]/20 text-[#a2f0e7] border border-[#18A999]/40">
                  Site Operations
                </span>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-teal-100/70 font-medium">
                Real-time project financials, crew wage ledger, and site priorities
              </p>
            </div>
          </div>

          {/* Quick Action Tools */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={onOpenReceiptScanner}
              className="px-3.5 py-2.5 rounded-xl bg-[#0e2e49] hover:bg-[#164063] text-teal-200 border border-[#1a4c75] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Camera Receipt Scanner (Smart AI OCR)"
            >
              <Camera className="w-4 h-4 text-[#18A999]" />
              <span>Scan Receipt</span>
            </button>
            <button
              onClick={onOpenAttendanceModal}
              className="px-3.5 py-2.5 rounded-xl bg-[#0e2e49] hover:bg-[#164063] text-teal-100 border border-[#1a4c75] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Users className="w-4 h-4 text-teal-300" />
              <span>Attendance Terminal</span>
            </button>
            <button
              onClick={() => onNavigateTab('payroll')}
              className="px-3.5 py-2.5 rounded-xl bg-[#0e2e49] hover:bg-[#164063] text-white text-xs font-bold flex items-center gap-1.5 border border-[#1a4c75] transition-colors cursor-pointer"
            >
              <Receipt className="w-4 h-4 text-[#18A999]" />
              <span>Weekly Payroll</span>
            </button>
            <button
              onClick={onOpenProjectModal}
              className="px-4 py-2.5 rounded-xl bg-[#18A999] hover:bg-[#148f81] text-white text-xs font-black shadow-md transition-colors cursor-pointer"
            >
              + New Site
            </button>
          </div>
        </div>

        {/* Active Project Dropdown Box */}
        <div className="mt-5 pt-4 border-t border-[#1a4c75] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1 max-w-md">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-teal-200/70 mb-1.5">
              ACTIVE CONSTRUCTION PROJECT
            </label>
            <div className="relative">
              <select
                value={activeProject.id}
                onChange={(e) => onSelectProject(e.target.value)}
                aria-label="Active Project"
                className="w-full px-4 py-2.5 bg-[#0e2e49] border border-[#1a4c75] rounded-xl text-white font-bold text-sm focus:outline-none focus:border-[#18A999] transition-colors cursor-pointer pr-10 shadow-inner"
              >
                {allProjects.filter((p) => p.status !== 'Completed' && p.status !== 'Cancelled').map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#123B5D] text-white py-2">
                    {p.name} {p.code ? `(${p.code})` : ''} - Budget: {formatCurrency(p.budget)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-teal-100/70">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#18A999]" />
              <span className="text-white font-medium">{activeProject.location}</span>
            </div>
            <span aria-hidden="true" className="text-[#1a4c75]">|</span>
            <div>
              Supervisor: <strong className="text-white">{activeProject.supervisor}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Budget & Labor Operations Summary - Section Background: Ice Blue #EAF7FA */}
      <section className="bg-[#EAF7FA] border border-[#cbeaf0] rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 px-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#18A999]" />
            <h2 className="text-base font-bold text-[#123B5D] tracking-tight">
              Budget &amp; Labor Operations Summary
            </h2>
          </div>
          <span className="text-xs text-[#546e7a]">Real-time project financials &amp; labor shift monitoring</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Card 1: TOTAL BUDGET SPENT - White Card #FFFFFF */}
          <div className="bg-white border border-[#cbeaf0] rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#EAF7FA] border border-[#cbeaf0] flex items-center justify-center text-[#18A999] shrink-0">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#546e7a]">
                      TOTAL BUDGET SPENT
                    </span>
                    <p className="text-xs text-[#546e7a] mt-0.5">
                      Cumulative expenditures on materials and labor
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EAF7FA] border border-[#bce6ed] text-[#0d786d] text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-[#18A999]" />
                  <span>
                    {budgetPercentSpent > 90
                      ? 'Critical'
                      : budgetPercentSpent > 75
                      ? 'Approaching Cap'
                      : 'Within Budget'}
                  </span>
                </div>
              </div>

              {/* Big Numbers */}
              <div className="mt-5 flex flex-wrap items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-[#123B5D] font-mono tracking-tight">
                  {formatCurrency(totalBudgetSpent)}
                </span>
                <span className="text-xs font-mono text-[#546e7a] font-medium">
                  / {formatCurrency(activeProject.budget)} allocation
                </span>
              </div>

              {/* Progress */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-[#546e7a]">
                    Budget Spent: <strong className="text-[#123B5D] font-bold">{budgetPercentSpent.toFixed(1)}%</strong>
                  </span>
                  <span className="text-[#546e7a]">
                    Remaining Funds: <strong className="text-[#0d786d] font-bold">{formatCurrency(remainingBudget)}</strong>
                  </span>
                </div>
                <div className="w-full h-2.5 bg-[#EAF7FA] rounded-full overflow-hidden border border-[#cbeaf0]">
                  <div
                    className="h-full bg-[#18A999] rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, budgetPercentSpent)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Sub-Cards for Materials vs Labor */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div className="p-3 bg-[#EAF7FA]/60 border border-[#cbeaf0] rounded-xl flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-[#18A999] shrink-0" />
                <div>
                  <span className="text-[11px] text-[#546e7a] block font-medium">Materials &amp; Supplies</span>
                  <span className="text-sm font-bold text-[#123B5D] font-mono">{formatCurrency(materialsSpent)}</span>
                </div>
              </div>
              <div className="p-3 bg-[#EAF7FA]/60 border border-[#cbeaf0] rounded-xl flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-[#123B5D] shrink-0" />
                <div>
                  <span className="text-[11px] text-[#546e7a] block font-medium">Labor &amp; Subcontractors</span>
                  <span className="text-sm font-bold text-[#123B5D] font-mono">{formatCurrency(laborSpent)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: CURRENT DAILY LABOR COST - White Card #FFFFFF */}
          <div className="bg-white border border-[#cbeaf0] rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#EAF7FA] border border-[#cbeaf0] flex items-center justify-center text-[#123B5D] shrink-0">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#546e7a]">
                      CURRENT DAILY LABOR COST
                    </span>
                    <p className="text-xs text-[#546e7a] mt-0.5">
                      Active crew shift wages &amp; on-site headcount
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EAF7FA] border border-[#bce6ed] text-[#123B5D] text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#18A999] animate-pulse" />
                  <span>{timedInCount} of {totalCrewCount} Active on Site</span>
                </div>
              </div>

              {/* Big Labor Cost */}
              <div className="mt-5 flex flex-wrap items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-[#123B5D] font-mono tracking-tight">
                  {formatCurrency(currentDailyLaborCost)}
                </span>
                <span className="text-xs font-mono text-[#546e7a] font-medium">
                  / {formatCurrency(dailyLaborCeiling)} daily ceiling
                </span>
              </div>

              {/* Progress */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-[#546e7a]">
                    Daily Utilization: <strong className="text-[#123B5D] font-bold">{dailyLaborPercent}%</strong>
                  </span>
                  <span className="text-[#546e7a]">
                    Active Shift: <strong className="text-[#0d786d] font-bold">{activeOnSiteCount} On Duty</strong>
                  </span>
                </div>
                <div className="w-full h-2.5 bg-[#EAF7FA] rounded-full overflow-hidden border border-[#cbeaf0]">
                  <div
                    className="h-full bg-[#123B5D] rounded-full transition-all duration-700"
                    style={{ width: `${dailyLaborPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Quick terminal launch button */}
            <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-[#546e7a]">
                Site Foreman: <strong className="text-[#123B5D]">{activeProject.supervisor}</strong>
              </span>
              <button
                onClick={onOpenAttendanceModal}
                className="text-xs font-bold text-[#18A999] hover:text-[#148f81] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Open Terminal &rarr;</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Recent Project Transactions - Section Background: Ice Blue #EAF7FA */}
      <section className="bg-[#EAF7FA] border border-[#cbeaf0] rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-[#123B5D] tracking-tight">
              Recent Project Transactions
            </h2>
            <p className="text-xs text-[#546e7a] mt-0.5">
              Latest recorded material receipts, operating expenses, and crew labor logs
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-white rounded-2xl border border-[#cbeaf0] text-xs">
            <button
              onClick={() => setTxFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                txFilter === 'all'
                  ? 'bg-[#18A999] text-white shadow-xs'
                  : 'text-[#546e7a] hover:text-[#123B5D]'
              }`}
            >
              All ({allTransactions.length})
            </button>
            <button
              onClick={() => setTxFilter('materials')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                txFilter === 'materials'
                  ? 'bg-[#18A999] text-white shadow-xs'
                  : 'text-[#546e7a] hover:text-[#123B5D]'
              }`}
            >
              Materials &amp; Expenses ({materialTransactions.length})
            </button>
            <button
              onClick={() => setTxFilter('labor')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                txFilter === 'labor'
                  ? 'bg-[#18A999] text-white shadow-xs'
                  : 'text-[#546e7a] hover:text-[#123B5D]'
              }`}
            >
              Labor &amp; Wages ({laborTransactions.length})
            </button>
          </div>
        </div>

        {/* Transaction Rows List */}
        <div className="divide-y divide-slate-100 rounded-2xl overflow-hidden border border-[#cbeaf0] bg-white">
          {filteredTransactions.length === 0 ? (
            <div className="p-8 text-center text-[#546e7a] text-xs">
              No transactions recorded for the selected filter.
            </div>
          ) : (
            filteredTransactions.slice(0, 7).map((tx) => (
              <div
                key={tx.id}
                className="p-4 sm:px-5 flex items-center justify-between gap-3 hover:bg-[#EAF7FA]/50 transition-colors group"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      tx.type === 'labor'
                        ? 'bg-[#EAF7FA] text-[#123B5D] border border-[#cbeaf0]'
                        : 'bg-[#EAF7FA] text-[#18A999] border border-[#cbeaf0]'
                    }`}
                  >
                    {tx.type === 'labor' ? <User className="w-5 h-5" /> : <Receipt className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-[#123B5D] truncate group-hover:text-[#18A999] transition-colors">
                      {tx.title}
                    </div>
                    <div className="text-xs text-[#546e7a] truncate mt-0.5">
                      {tx.subtitle}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-right">
                  <div>
                    <div className="text-base font-black text-[#123B5D] font-mono">
                      {formatCurrency(tx.amount)}
                    </div>
                    <div className="text-[11px] text-[#546e7a] font-medium">
                      {tx.badge}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#18A999] group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 4. Today's Site Priorities Checklist - Section Background: Ice Blue #EAF7FA */}
      <section className="bg-white border border-[#cbeaf0] rounded-3xl overflow-hidden shadow-xs">
        <div className="p-6 border-b border-[#cbeaf0] bg-[#EAF7FA]/70">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#18A999]/15 border border-[#18A999]/30 flex items-center justify-center text-[#18A999]">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-black text-[#123B5D] tracking-tight">
                  Today&apos;s Site Priorities
                </h2>
              </div>
              <p className="mt-1 text-xs text-[#546e7a]">
                Daily task checklist, safety inspections, supplier follow-ups, and field checkpoints
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs font-bold text-[#123B5D]">
                  {completedPrioritiesCount} of {totalPrioritiesCount} Completed ({prioritiesProgress}%)
                </span>
                <div className="w-32 h-2 bg-slate-100 rounded-full mt-1.5 overflow-hidden border border-slate-200">
                  <div
                    className="h-full bg-[#18A999] rounded-full transition-all duration-500"
                    style={{ width: `${prioritiesProgress}%` }}
                  />
                </div>
              </div>
              <button
                onClick={() => setIsAddingPriority(!isAddingPriority)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#18A999] hover:bg-[#148f81] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Task</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="mt-4 pt-3 border-t border-[#cbeaf0] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#cbeaf0] text-xs">
              <button
                onClick={() => setPriorityFilter('all')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  priorityFilter === 'all'
                    ? 'bg-[#123B5D] text-white'
                    : 'text-[#546e7a] hover:text-[#123B5D]'
                }`}
              >
                All ({projectPriorities.length})
              </button>
              <button
                onClick={() => setPriorityFilter('pending')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  priorityFilter === 'pending'
                    ? 'bg-[#123B5D] text-white'
                    : 'text-[#546e7a] hover:text-[#123B5D]'
                }`}
              >
                Pending ({projectPriorities.filter((p) => !p.completed).length})
              </button>
              <button
                onClick={() => setPriorityFilter('completed')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  priorityFilter === 'completed'
                    ? 'bg-[#123B5D] text-white'
                    : 'text-[#546e7a] hover:text-[#123B5D]'
                }`}
              >
                Completed ({completedPrioritiesCount})
              </button>
            </div>

            {completedPrioritiesCount > 0 && (
              <button
                onClick={onClearCompletedPriorities}
                className="text-xs text-[#546e7a] hover:text-rose-600 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Completed</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Add Form Drawer */}
        {isAddingPriority && (
          <form
            onSubmit={handleCreatePriority}
            className="p-5 bg-[#EAF7FA]/30 border-b border-[#cbeaf0] space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#123B5D] uppercase tracking-wider">
                Add New Site Priority Task
              </span>
              <button
                type="button"
                onClick={() => setIsAddingPriority(false)}
                className="text-xs text-[#546e7a] hover:text-[#123B5D] cursor-pointer"
              >
                Cancel
              </button>
            </div>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Call ready-mix supplier for 2 PM pour, inspect scaffolding..."
              value={newPriorityTitle}
              onChange={(e) => setNewPriorityTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#cbeaf0] rounded-xl text-xs text-[#263238] placeholder-slate-400 focus:outline-none focus:border-[#18A999]"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div>
                <label className="block text-[11px] text-[#546e7a] mb-1">Priority Level</label>
                <select
                  value={priorityLevel}
                  onChange={(e) => setPriorityLevel(e.target.value as SitePriority['priority'])}
                  className="w-full px-3 py-2 bg-white border border-[#cbeaf0] rounded-xl text-[#263238] focus:outline-none focus:border-[#18A999] cursor-pointer"
                >
                  <option value="urgent">Urgent / Critical</option>
                  <option value="medium">Medium Priority</option>
                  <option value="normal">Normal Routine</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-[#546e7a] mb-1">Assignee</label>
                <input
                  type="text"
                  placeholder="e.g. Foreman Dan"
                  value={priorityAssignee}
                  onChange={(e) => setPriorityAssignee(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#cbeaf0] rounded-xl text-[#263238] placeholder-slate-400 focus:outline-none focus:border-[#18A999]"
                />
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#18A999] hover:bg-[#148f81] text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                Save Priority
              </button>
            </div>
          </form>
        )}

        {/* Priority items list */}
        <div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto">
          {filteredPriorities.length === 0 ? (
            <div className="p-8 text-center text-[#546e7a] text-xs">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-[#18A999]" />
              <span>No priorities found matching current filter.</span>
            </div>
          ) : (
            filteredPriorities.map((item) => (
              <div
                key={item.id}
                className={`group flex items-start justify-between gap-3 p-4 sm:px-6 hover:bg-[#EAF7FA]/40 transition-colors ${
                  item.completed ? 'bg-slate-50/60 opacity-70' : ''
                }`}
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => onTogglePriority(item.id)}
                    className="mt-0.5 text-slate-400 hover:text-[#18A999] shrink-0 cursor-pointer"
                  >
                    {item.completed ? (
                      <CheckSquare className="w-4 h-4 text-[#18A999]" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 hover:text-[#18A999]" />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div
                      onClick={() => onTogglePriority(item.id)}
                      className={`text-xs cursor-pointer select-none leading-snug font-medium ${
                        item.completed
                          ? 'text-slate-400 line-through'
                          : 'text-[#263238] group-hover:text-[#123B5D]'
                      }`}
                    >
                      {item.title}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-[#546e7a]">
                      {item.priority === 'urgent' || item.priority === 'critical' ? (
                        <span className="text-rose-600 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                          Urgent
                        </span>
                      ) : item.priority === 'medium' ? (
                        <span className="text-[#18A999] font-medium">Medium</span>
                      ) : (
                        <span className="text-[#546e7a]">Normal</span>
                      )}
                      <span aria-hidden="true">|</span>
                      <span className="text-[#546e7a] truncate max-w-[180px]">{item.siteName}</span>
                      {item.assignedTo && (
                        <>
                          <span aria-hidden="true">|</span>
                          <span className="text-[#263238]">{item.assignedTo}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onDeletePriority(item.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-1 transition-opacity cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default DashboardView;
