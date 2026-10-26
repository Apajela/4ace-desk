import React, { useState } from 'react';
import {
  SitePriorityItem,
  Project,
  TaskStatus,
  PriorityLevel,
  TradeCategory,
} from '../types';
import { SitePrioritiesChecklist } from './SitePrioritiesChecklist';
import {
  ListTodo,
  Kanban,
  Plus,
  AlertCircle,
  Clock,
  CheckCircle,
  Search,
  Filter,
  Calendar,
  User,
  ShieldCheck,
  Building2,
  X,
  FileCheck2,
} from 'lucide-react';

export interface PrioritiesViewProps {
  currentProject: Project;
  priorities: SitePriorityItem[];
  onToggleChecklistItem: (priorityId: string, itemId: string) => void;
  onAddChecklistItem: (priorityId: string, text: string) => void;
  onDeleteChecklistItem?: (priorityId: string, itemId: string) => void;
  onUpdatePriorityStatus: (priorityId: string, status: TaskStatus) => void;
  onAddPriority: (newPriority: Omit<SitePriorityItem, 'id' | 'createdAt'>) => void;
}

export const PrioritiesView: React.FC<PrioritiesViewProps> = ({
  currentProject,
  priorities,
  onToggleChecklistItem,
  onAddChecklistItem,
  onDeleteChecklistItem,
  onUpdatePriorityStatus,
  onAddPriority,
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'checklist'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrade, setSelectedTrade] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriorityLvl, setNewPriorityLvl] = useState<PriorityLevel>('high');
  const [newAssignedTo, setNewAssignedTo] = useState('Foreman Danilo Ramos');
  const [newTargetDate, setNewTargetDate] = useState('2026-10-28');
  const [initialChecklist, setInitialChecklist] = useState<string>(
    'Verify rebar spacing and clearance\nClean sawdust and tie wires from slab'
  );

  const projectPriorities = priorities.filter(
    (p) => !p.projectId || p.projectId === currentProject.id || p.siteName === currentProject.name
  );

  const filteredPriorities = projectPriorities.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.assignedTo && p.assignedTo.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTrade = selectedTrade === 'All' || p.trade === selectedTrade;
    return matchesSearch && matchesTrade;
  });

  const columns: { status: TaskStatus; label: string; icon: React.ReactNode }[] = [
    {
      status: 'todo',
      label: 'Scheduled / To Do',
      icon: <Clock className="w-4 h-4 text-[#546e7a]" />,
    },
    {
      status: 'in_progress',
      label: 'Site Execution (In Progress)',
      icon: <Building2 className="w-4 h-4 text-[#18A999]" />,
    },
    {
      status: 'inspection',
      label: 'QA / Structural Sign-Off',
      icon: <AlertCircle className="w-4 h-4 text-amber-500" />,
    },
    {
      status: 'done',
      label: 'Completed & Closed',
      icon: <CheckCircle className="w-4 h-4 text-[#0d786d]" />,
    },
  ];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const checklistItems = initialChecklist
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((text, idx) => ({
        id: `c-new-${Date.now()}-${idx}`,
        text,
        completed: false,
      }));

    onAddPriority({
      projectId: currentProject.id,
      siteName: currentProject.name,
      title: newTitle.trim(),
      description: newDescription.trim() || 'General site verification.',
      priority: newPriorityLvl,
      trade: 'General',
      status: 'todo',
      completed: false,
      assignedTo: newAssignedTo,
      dueDate: newTargetDate,
      targetDate: newTargetDate,
      checklistItems:
        checklistItems.length > 0
          ? checklistItems
          : [{ id: `c-default-${Date.now()}`, text: 'Initial site verification', completed: false }],
    });

    setNewTitle('');
    setNewDescription('');
    setShowAddModal(false);
  };

  const getPriorityStyle = (lvl: PriorityLevel) => {
    switch (lvl) {
      case 'critical':
      case 'urgent':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'high':
        return 'bg-[#EAF7FA] text-[#0d786d] border-[#bce6ed]';
      case 'medium':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'normal':
      case 'low':
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const criticalCount = projectPriorities.filter(
    (p) => (p.priority === 'critical' || p.priority === 'urgent') && !p.completed
  ).length;
  const inspectionCount = projectPriorities.filter((p) => p.status === 'inspection').length;
  const doneCount = projectPriorities.filter((p) => p.completed || p.status === 'done').length;

  return (
    <div className="space-y-5 text-[#263238]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[#123B5D]">
              Site Priorities &amp; Inspection Board
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#EAF7FA] text-[#123B5D] font-semibold border border-[#cbeaf0]">
              {currentProject.name}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#546e7a] mt-1">
            Track daily critical path milestones, pouring clearances, trade handovers, and safety checklists.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-[#EAF7FA] p-1 rounded-xl border border-[#cbeaf0] flex items-center">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-white text-[#123B5D] shadow-xs font-bold'
                  : 'text-[#546e7a] hover:text-[#123B5D]'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              Kanban Board
            </button>
            <button
              onClick={() => setViewMode('checklist')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'checklist'
                  ? 'bg-white text-[#123B5D] shadow-xs font-bold'
                  : 'text-[#546e7a] hover:text-[#123B5D]'
              }`}
            >
              <ListTodo className="w-3.5 h-3.5" />
              Detailed Checklists
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-[#18A999] hover:bg-[#148f81] text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Site Milestone</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white rounded-2xl border border-red-200 p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-[#546e7a]">Critical Site Blockers</div>
            <div className="text-lg font-black text-[#123B5D] font-mono">{criticalCount} Pending</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#cbeaf0] p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-[#EAF7FA] flex items-center justify-center text-[#18A999]">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-[#546e7a]">Awaiting QA / Inspection</div>
            <div className="text-lg font-black text-[#123B5D] font-mono">{inspectionCount} Tasks</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#cbeaf0] p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-[#EAF7FA] flex items-center justify-center text-[#0d786d]">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-[#546e7a]">Completed &amp; Signed Off</div>
            <div className="text-lg font-black text-[#123B5D] font-mono">{doneCount} of {projectPriorities.length}</div>
          </div>
        </div>
      </div>

      <div className="bg-[#EAF7FA] p-3.5 rounded-2xl border border-[#cbeaf0] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#546e7a]" />
          <input
            type="text"
            placeholder="Search tasks, foremen, inspections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#cbeaf0] rounded-xl text-[#263238] focus:outline-none focus:border-[#18A999]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto text-xs">
          <Filter className="w-3.5 h-3.5 text-[#546e7a] shrink-0" />
          <span className="text-[#546e7a] shrink-0 font-medium">Trade:</span>
          {['All', 'Structural', 'Civil', 'Safety', 'MEPFS', 'Architectural'].map((tr) => (
            <button
              key={tr}
              onClick={() => setSelectedTrade(tr)}
              className={`px-3 py-1 rounded-xl transition-colors shrink-0 cursor-pointer ${
                selectedTrade === tr
                  ? 'bg-[#123B5D] text-white font-bold'
                  : 'bg-white text-[#546e7a] hover:text-[#123B5D] border border-[#cbeaf0]'
              }`}
            >
              {tr}
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'checklist' ? (
        <SitePrioritiesChecklist
          priorities={filteredPriorities}
          onToggleItem={onToggleChecklistItem}
          onAddItem={onAddChecklistItem}
          onDeleteItem={onDeleteChecklistItem}
          onStatusChange={onUpdatePriorityStatus}
          onAddPriority={() => setShowAddModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {columns.map((col) => {
            const items = filteredPriorities.filter((p) => {
              const currentStatus = p.status || (p.completed ? 'done' : 'todo');
              return currentStatus === col.status;
            });

            return (
              <div key={col.status} className="bg-[#EAF7FA]/80 rounded-2xl p-3.5 border border-[#cbeaf0]">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    {col.icon}
                    <h3 className="text-xs font-bold text-[#123B5D]">{col.label}</h3>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white text-[#123B5D] border border-[#cbeaf0] shadow-xs">
                    {items.length}
                  </span>
                </div>

                <div className="space-y-3 min-h-[140px]">
                  {items.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-[#cbeaf0] bg-white/60 text-center text-xs text-[#546e7a]">
                      No items in this column
                    </div>
                  ) : (
                    items.map((task) => {
                      const checklist = task.checklistItems || [];
                      const completedCount = checklist.filter((i) => i.completed).length;
                      const totalCount = checklist.length;
                      const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : (task.completed ? 100 : 0);

                      return (
                        <div
                          key={task.id}
                          className="bg-white rounded-xl p-3.5 border border-[#cbeaf0] shadow-xs hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between gap-1.5 mb-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${getPriorityStyle(task.priority)}`}>
                              {task.priority}
                            </span>
                            {task.trade && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#EAF7FA] text-[#123B5D] border border-[#cbeaf0]">
                                {task.trade}
                              </span>
                            )}
                          </div>

                          <h4 className="text-xs font-bold text-[#123B5D] leading-snug mb-1">
                            {task.title}
                          </h4>

                          {task.description && (
                            <p className="text-[11px] text-[#546e7a] line-clamp-2 mb-3">
                              {task.description}
                            </p>
                          )}

                          {totalCount > 0 && (
                            <div className="mb-3 pt-2 border-t border-slate-100">
                              <div className="flex items-center justify-between text-[11px] text-[#546e7a] mb-1">
                                <span className="flex items-center gap-1 font-medium">
                                  <ShieldCheck className="w-3.5 h-3.5 text-[#18A999]" />
                                  Inspection checks
                                </span>
                                <span className="font-mono text-[#123B5D] font-semibold">{completedCount}/{totalCount} ({pct}%)</span>
                              </div>
                              <div className="w-full h-1.5 bg-[#EAF7FA] rounded-full overflow-hidden border border-[#cbeaf0]">
                                <div
                                  className={`h-full ${
                                    pct === 100 ? 'bg-[#0d786d]' : 'bg-[#18A999]'
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-[11px] text-[#546e7a] pt-1">
                            <span className="flex items-center gap-1 truncate max-w-[120px]" title={task.assignedTo}>
                              <User className="w-3 h-3 text-[#546e7a] shrink-0" />
                              <span className="truncate">{task.assignedTo || 'Site Foreman'}</span>
                            </span>
                            <span className="flex items-center gap-1 text-[#546e7a]">
                              <Calendar className="w-3 h-3 text-[#18A999]" />
                              {(task.dueDate || task.targetDate || 'Today').slice(0, 10)}
                            </span>
                          </div>

                          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-[11px]">
                            <span className="text-[10px] text-[#546e7a]">Status:</span>
                            <select
                              value={task.status || (task.completed ? 'done' : 'todo')}
                              onChange={(e) => onUpdatePriorityStatus(task.id, e.target.value as TaskStatus)}
                              className="text-[11px] bg-[#EAF7FA] border border-[#cbeaf0] rounded-lg px-2 py-0.5 text-[#123B5D] font-bold focus:outline-none focus:border-[#18A999] cursor-pointer"
                            >
                              <option value="todo">To Do</option>
                              <option value="in_progress">In Progress</option>
                              <option value="inspection">QA / Inspection</option>
                              <option value="done">Done</option>
                            </select>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-[#0d2b45] flex items-center justify-between bg-[#123B5D] text-white">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#18A999]" />
                <h3 className="text-sm font-bold">Add Site Priority &amp; Milestone</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-teal-200 hover:text-white p-1 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#123B5D] mb-1">
                  Milestone / Priority Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. 5th Floor Beam & Girder Rebar Slump Test"
                  className="w-full px-3 py-2 border border-[#cbeaf0] rounded-xl text-[#263238] focus:outline-none focus:border-[#18A999]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#123B5D] mb-1">
                  Detailed Scope &amp; Specifications
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Provide concrete mix design, bar diameter, or site standards..."
                  className="w-full px-3 py-2 border border-[#cbeaf0] rounded-xl text-[#263238] focus:outline-none focus:border-[#18A999]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#123B5D] mb-1">Priority Level</label>
                  <select
                    value={newPriorityLvl}
                    onChange={(e) => setNewPriorityLvl(e.target.value as PriorityLevel)}
                    className="w-full px-3 py-2 border border-[#cbeaf0] rounded-xl text-[#263238] bg-white focus:outline-none focus:border-[#18A999]"
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="normal">Normal Routine</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#123B5D] mb-1">In-Charge</label>
                  <input
                    type="text"
                    value={newAssignedTo}
                    onChange={(e) => setNewAssignedTo(e.target.value)}
                    placeholder="e.g. Lead In-Charge / Supervisor"
                    className="w-full px-3 py-2 border border-[#cbeaf0] rounded-xl text-[#263238] focus:outline-none focus:border-[#18A999]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#123B5D] mb-1">Target Completion Date</label>
                <input
                  type="date"
                  value={newTargetDate}
                  onChange={(e) => setNewTargetDate(e.target.value)}
                  className="w-full px-3 py-2 border border-[#cbeaf0] rounded-xl text-[#263238] focus:outline-none focus:border-[#18A999]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#123B5D] mb-1">
                  Checklist Inspection Points (1 line per item)
                </label>
                <textarea
                  rows={3}
                  value={initialChecklist}
                  onChange={(e) => setInitialChecklist(e.target.value)}
                  placeholder="Verify beam bottom clearance&#10;Check electrical conduit sleeve&#10;Clean debris before pouring"
                  className="w-full px-3 py-2 border border-[#cbeaf0] rounded-xl font-mono text-[11px] text-[#263238] focus:outline-none focus:border-[#18A999]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-medium text-[#546e7a] hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#18A999] hover:bg-[#148f81] text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Create Site Priority
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrioritiesView;
