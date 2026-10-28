import React, { useState } from 'react';
import {
  FolderKanban,
  CheckCircle2,
  XCircle,
  FileText,
  Printer,
  Download,
  RotateCcw,
  Search,
  Building,
  Calendar,
  Users,
  TrendingUp,
  Archive,
  ArrowRight,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { Project, ExpenseItem, PayrollEntry } from '../types';
import { exportExecutiveReportPdf } from '../utils/pdfExport';
import { triggerBrowserPrint } from '../utils/printReport';
import { calculateProjectLaborAllocation } from '../utils/payrollExpenseHelper';

export interface CompletedProjectsViewProps {
  projects: Project[];
  expenses: ExpenseItem[];
  payroll: PayrollEntry[];
  onReopenProject: (projectId: string) => void;
  onCancelProject?: (projectId: string) => void;
  onDeleteProject?: (projectId: string) => void;
  onSelectProjectForReports: (projectId: string) => void;
  isFullAccess?: boolean;
}

export const CompletedProjectsView: React.FC<CompletedProjectsViewProps> = ({
  projects,
  expenses,
  payroll,
  onReopenProject,
  onCancelProject,
  onDeleteProject,
  onSelectProjectForReports,
  isFullAccess = false,
}) => {
  const [filterStatus, setFilterStatus] = useState<'All' | 'Completed' | 'Cancelled'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Archived projects are those that are Completed or Cancelled
  const archivedProjects = projects.filter(
    (p) => p.status === 'Completed' || p.status === 'Cancelled'
  );

  const filtered = archivedProjects.filter((p) => {
    const matchesFilter =
      filterStatus === 'All'
        ? true
        : p.status === filterStatus;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(q) ||
      (p.code && p.code.toLowerCase().includes(q)) ||
      (p.client && p.client.toLowerCase().includes(q)) ||
      (p.location && p.location.toLowerCase().includes(q));
    return matchesFilter && matchesSearch;
  });

  const completedCount = archivedProjects.filter((p) => p.status === 'Completed').length;
  const cancelledCount = archivedProjects.filter((p) => p.status === 'Cancelled').length;
  const totalCompletedValue = archivedProjects
    .filter((p) => p.status === 'Completed')
    .reduce((sum, p) => sum + (Number(p.budget) || 0), 0);

  const handleDownloadPdf = (project: Project) => {
    const projExpenses = expenses.filter(
      (e) => !e.projectId || e.projectId === project.id || e.projectName === project.name
    );
    const labor = calculateProjectLaborAllocation(
      payroll,
      '2026-10-19',
      '2026-10-25',
      project
    );
    exportExecutiveReportPdf(project, labor, projExpenses);
  };

  const handlePrint = (project: Project) => {
    onSelectProjectForReports(project.id);
    setTimeout(() => {
      triggerBrowserPrint();
    }, 400);
  };

  return (
    <div className="space-y-6 text-[#263238]">
      {/* Full archive title is restricted to full-access accounts */}
      {isFullAccess && <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-[#123B5D] tracking-tight">
              Project History
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#EAF7FA] text-[#123B5D] font-bold border border-[#cbeaf0]">
              {archivedProjects.length} Archived
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#546e7a] mt-0.5">
            Permanent archive of all completed project turnovers and cancelled contracts. Removed from active site selection.
          </p>
        </div>
      </div>}

      {/* KPI Cards */}
      <div className={`grid grid-cols-1 ${isFullAccess ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-4`}>
        <div className="bg-white p-5 rounded-2xl border border-[#cbeaf0] shadow-xs">
          <div className="flex justify-between items-center text-xs font-semibold text-[#546e7a]">
            <span>Completed Turnovers</span>
            <div className="w-8 h-8 rounded-lg bg-[#EAF7FA] flex items-center justify-center text-[#18A999]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black mt-2 text-[#123B5D]">
            {completedCount} Sites
          </p>
          <div className="text-[11px] text-[#546e7a] mt-1">
            Successfully delivered &amp; certified projects
          </div>
        </div>

        {isFullAccess && (
        <div className="bg-white p-5 rounded-2xl border border-[#cbeaf0] shadow-xs">
          <div className="flex justify-between items-center text-xs font-semibold text-[#546e7a]">
            <span>Total Delivered Value</span>
            <div className="w-8 h-8 rounded-lg bg-[#EAF7FA] flex items-center justify-center text-[#123B5D]">
              <span className="font-black">₱</span>
            </div>
          </div>
          <p className="text-2xl font-black mt-2 text-[#123B5D] font-mono">
            ₱{totalCompletedValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <div className="text-[11px] text-[#546e7a] mt-1">
            Combined contract sum of completed sites
          </div>
        </div>
        )}

        <div className="bg-white p-5 rounded-2xl border border-[#cbeaf0] shadow-xs">
          <div className="flex justify-between items-center text-xs font-semibold text-[#546e7a]">
            <span>Cancelled Sites</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black mt-2 text-rose-700">
            {cancelledCount} Projects
          </p>
          <div className="text-[11px] text-[#546e7a] mt-1">
            Terminated or shelved contracts
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-[#EAF7FA] p-3.5 rounded-2xl border border-[#cbeaf0] shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#546e7a]" />
          <input
            type="text"
            placeholder="Search by project name, code, client, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-[#cbeaf0] rounded-xl text-[#263238] placeholder-slate-400 focus:outline-none focus:border-[#18A999]"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {(['All', 'Completed', 'Cancelled'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterStatus === status
                  ? 'bg-[#123B5D] text-white shadow-xs'
                  : 'bg-white text-[#123B5D] border border-[#cbeaf0] hover:bg-slate-50'
              }`}
            >
              {status}
              {status === 'Completed' && ` (${completedCount})`}
              {status === 'Cancelled' && ` (${cancelledCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Projects List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#EAF7FA] flex items-center justify-center text-[#18A999] mx-auto">
            <Archive className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-[#123B5D]">No Archived Projects Found</h3>
          <p className="text-xs text-[#546e7a] max-w-md mx-auto">
            When a site project is marked as Completed in Executive Reports or Cancelled, it will automatically appear here and be removed from the active site selector in the top bar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((proj) => {
            const isCompleted = proj.status === 'Completed';
            return (
              <div
                key={proj.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 hover:border-[#18A999]/60 transition"
              >
                {/* Project Card Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-[#123B5D]">{proj.name}</h3>
                      {proj.code && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                          {proj.code}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#546e7a] mt-0.5">
                      Client: <strong className="text-[#123B5D]">{proj.client || 'Project Owner'}</strong> • {proj.location}
                    </p>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-bold border shrink-0 ${
                      isCompleted
                        ? 'bg-teal-50 text-teal-800 border-teal-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                  >
                    {isCompleted ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#18A999]" />
                        <span>Completed</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Cancelled</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Financial metrics are full-access only */}
                {isFullAccess && <div className="grid grid-cols-3 gap-2 p-3 bg-[#EAF7FA]/50 border border-slate-200/80 rounded-xl text-xs">
                  <div>
                    <span className="text-[10px] text-[#546e7a] block uppercase font-bold">Contract Sum</span>
                    <strong className="text-xs text-[#123B5D] font-mono">
                      ₱{(proj.budget || 0).toLocaleString()}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#546e7a] block uppercase font-bold">Final Cost</span>
                    <strong className="text-xs text-[#18A999] font-mono">
                      ₱{(proj.spent || 0).toLocaleString()}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#546e7a] block uppercase font-bold">Accomplishment</span>
                    <strong className="text-xs text-[#123B5D]">
                      {proj.progress}%
                    </strong>
                  </div>
                </div>}

                {/* Regular accounts see only project dates; supervisor is restricted */}
                <div className={`flex ${isFullAccess ? 'items-center justify-between' : 'flex-col items-start gap-1'} text-[11px] text-[#546e7a] pt-1 border-t border-slate-100`}>
                  <span>Start Date: <strong>{proj.startDate || 'Not recorded'}</strong></span>
                  <span>End Date: <strong>{(proj as Project & { endDate?: string }).endDate || proj.targetDate || 'Not recorded'}</strong></span>
                  {isFullAccess && <span>Supervisor: <strong>{proj.supervisor}</strong></span>}
                </div>

                {/* Actions are full-access only */}
                {isFullAccess && <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    {/* Save PDF */}
                    <button
                      onClick={() => handleDownloadPdf(proj)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#18A999] hover:bg-[#148f81] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
                      title="Download Certified Progress Report PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Save PDF</span>
                    </button>

                    {/* Print Report */}
                    <button
                      onClick={() => handlePrint(proj)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-[#123B5D] text-xs font-bold rounded-xl transition cursor-pointer"
                      title="Print Official Progress Report"
                    >
                      <Printer className="w-3.5 h-3.5 text-[#18A999]" />
                      <span>Print Report</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* View in Reports */}
                    <button
                      onClick={() => onSelectProjectForReports(proj.id)}
                      className="flex items-center gap-1 text-xs text-[#123B5D] hover:text-[#18A999] font-bold px-2.5 py-1.5 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                    >
                      <span>Open Costing</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    {onDeleteProject && <button onClick={() => onDeleteProject(proj.id)} className="flex items-center gap-1 text-xs text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 font-bold px-2.5 py-1.5 rounded-xl transition cursor-pointer" title="Delete project from history"><Trash2 className="w-3.5 h-3.5" /><span>Delete Project</span></button>}
                    {/* Reopen / Restore Project */}
                    <button
                      onClick={() => onReopenProject(proj.id)}
                      className="flex items-center gap-1 text-xs text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 font-bold px-2.5 py-1.5 rounded-xl transition cursor-pointer"
                      title="Reopen project and restore to active site list"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reopen Site</span>
                    </button>
                  </div>
                </div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CompletedProjectsView;
