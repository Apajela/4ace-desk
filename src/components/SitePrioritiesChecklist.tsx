import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  AlertTriangle,
  Plus,
  Trash2,
  ShieldCheck,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { SitePriorityItem, PriorityLevel, TradeCategory, TaskStatus } from '../types';

export interface SitePrioritiesChecklistProps {
  priorities: SitePriorityItem[];
  onToggleItem: (priorityId: string, itemId: string) => void;
  onAddItem: (priorityId: string, itemText: string) => void;
  onDeleteItem?: (priorityId: string, itemId: string) => void;
  onStatusChange?: (priorityId: string, newStatus: TaskStatus) => void;
  onAddPriority?: () => void;
}

export const SitePrioritiesChecklist: React.FC<SitePrioritiesChecklistProps> = ({
  priorities,
  onToggleItem,
  onAddItem,
  onDeleteItem,
  onStatusChange,
  onAddPriority,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(priorities[0]?.id || null);
  const [newItemText, setNewItemText] = useState<{ [key: string]: string }>({});
  const [filterTrade, setFilterTrade] = useState<string>('All');
  const [filterPriority, setFilterPriority] = useState<string>('All');

  const filtered = priorities.filter((p) => {
    if (filterTrade !== 'All' && p.trade !== filterTrade) return false;
    if (filterPriority !== 'All' && p.priority !== filterPriority) return false;
    return true;
  });

  const getPriorityBadge = (lvl: PriorityLevel) => {
    switch (lvl) {
      case 'critical':
      case 'urgent':
        return 'bg-red-50 text-red-700 border-red-200 ring-1 ring-red-400/20';
      case 'high':
        return 'bg-[#EAF7FA] text-[#0d786d] border-[#bce6ed]';
      case 'medium':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'normal':
      case 'low':
      default:
        return 'bg-slate-50 text-[#546e7a] border-slate-200';
    }
  };

  const getTradeBadge = (trade?: TradeCategory) => {
    switch (trade) {
      case 'Structural':
        return 'bg-[#EAF7FA] text-[#123B5D] border-[#cbeaf0]';
      case 'Civil':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Safety':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'MEPFS':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'Architectural':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleAddChecklist = (priorityId: string) => {
    const text = newItemText[priorityId]?.trim();
    if (!text) return;
    onAddItem(priorityId, text);
    setNewItemText((prev) => ({ ...prev, [priorityId]: '' }));
  };

  return (
    <div className="space-y-4 text-[#263238]">
      <div className="bg-white rounded-2xl border border-[#cbeaf0] p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-[#123B5D] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#18A999]" />
              Site QA &amp; Safety Daily Priority Checklists
            </h3>
            <p className="text-xs text-[#546e7a] mt-0.5">
              National Building Code &amp; DOLE Department Order 13 site compliance checks
            </p>
          </div>
          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            {onAddPriority && (
              <button
                onClick={onAddPriority}
                className="px-3.5 py-1.5 bg-[#18A999] hover:bg-[#148f81] text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                New Priority
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
          <span className="text-[#546e7a] font-medium">Filter Trade:</span>
          {['All', 'Structural', 'Civil', 'Safety', 'MEPFS', 'Architectural'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterTrade(t)}
              className={`px-3 py-1 rounded-xl transition-colors cursor-pointer ${
                filterTrade === t
                  ? 'bg-[#123B5D] text-white font-bold'
                  : 'bg-[#EAF7FA] text-[#123B5D] hover:bg-[#d5eff4]'
              }`}
            >
              {t}
            </button>
          ))}
          <span className="text-[#546e7a] font-medium ml-2">Priority:</span>
          {['All', 'urgent', 'high', 'medium', 'normal'].map((p) => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={`px-3 py-1 rounded-xl capitalize transition-colors cursor-pointer ${
                filterPriority === p
                  ? 'bg-[#18A999] text-white font-bold'
                  : 'bg-[#EAF7FA] text-[#123B5D] hover:bg-[#d5eff4]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-[#cbeaf0] p-8 text-center">
            <AlertTriangle className="w-8 h-8 text-[#546e7a] mx-auto mb-2" />
            <p className="text-sm font-medium text-[#123B5D]">No site priorities match current filter</p>
            <p className="text-xs text-[#546e7a] mt-1">Adjust trade or priority filters above</p>
          </div>
        ) : (
          filtered.map((priority) => {
            const checklist = priority.checklistItems || [];
            const completedCount = checklist.filter((i) => i.completed).length;
            const totalCount = checklist.length;
            const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : (priority.completed ? 100 : 0);
            const isExpanded = expandedId === priority.id;

            return (
              <div
                key={priority.id}
                className={`bg-white rounded-2xl border transition-all duration-200 ${
                  isExpanded ? 'border-[#18A999] shadow-md ring-1 ring-[#18A999]/30' : 'border-[#cbeaf0] hover:border-slate-300 shadow-xs'
                }`}
              >
                <div
                  onClick={() => setExpandedId(isExpanded ? null : priority.id)}
                  className="p-4 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        percentage === 100 ? 'bg-[#EAF7FA] text-[#0d786d]' : 'bg-[#EAF7FA] text-[#123B5D]'
                      }`}
                    >
                      {percentage === 100 ? (
                        <CheckCircle2 className="w-5 h-5 text-[#18A999]" />
                      ) : (
                        <span className="text-xs font-bold font-mono">{percentage}%</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getPriorityBadge(priority.priority)}`}>
                          {priority.priority}
                        </span>
                        {priority.trade && (
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getTradeBadge(priority.trade)}`}>
                            {priority.trade}
                          </span>
                        )}
                        <span className="text-[11px] text-[#546e7a] flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#18A999]" /> Due {priority.dueDate || priority.targetDate || 'Today'}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-[#123B5D] truncate">{priority.title}</h4>
                      {priority.description && (
                        <p className="text-xs text-[#546e7a] mt-0.5 line-clamp-1">{priority.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                    <div className="text-right">
                      <div className="text-xs font-medium text-[#546e7a]">
                        {completedCount} of {totalCount} checkpoints
                      </div>
                      <div className="w-24 h-1.5 bg-[#EAF7FA] rounded-full overflow-hidden mt-1 border border-[#cbeaf0]">
                        <div
                          className={`h-full transition-all duration-300 ${
                            percentage === 100 ? 'bg-[#0d786d]' : 'bg-[#18A999]'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label="Expand checklist"
                      className="p-1 rounded-md text-slate-400 hover:text-[#123B5D] hover:bg-[#EAF7FA] cursor-pointer"
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-[#18A999]" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-[#cbeaf0] bg-[#EAF7FA]/30 rounded-b-2xl">
                    <div className="flex flex-wrap items-center justify-between gap-2 py-2 text-xs text-[#546e7a]">
                      {onStatusChange && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#546e7a]">Status:</span>
                          <select
                            value={priority.status || (priority.completed ? 'done' : 'todo')}
                            onChange={(e) => onStatusChange(priority.id, e.target.value as TaskStatus)}
                            className="bg-white border border-[#cbeaf0] text-xs rounded-xl px-2.5 py-1 text-[#123B5D] font-bold focus:outline-none focus:border-[#18A999] cursor-pointer"
                          >
                            <option value="todo">Pending / To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="inspection">QA / Inspection</option>
                            <option value="done">Completed &amp; Signed</option>
                          </select>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5 mt-2">
                      {checklist.map((item) => (
                        <div
                          key={item.id}
                          className={`group flex items-start gap-2.5 p-2.5 rounded-xl bg-white border transition-colors ${
                            item.completed ? 'border-[#bce6ed] bg-[#EAF7FA]/40' : 'border-[#cbeaf0] hover:border-slate-300'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => onToggleItem(priority.id, item.id)}
                            className="mt-0.5 text-slate-400 hover:text-[#18A999] transition-colors shrink-0 cursor-pointer"
                          >
                            {item.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-[#18A999]" />
                            ) : (
                              <Circle className="w-4 h-4 text-slate-300" />
                            )}
                          </button>
                          <span
                            onClick={() => onToggleItem(priority.id, item.id)}
                            className={`text-xs cursor-pointer flex-1 leading-relaxed ${
                              item.completed ? 'line-through text-slate-400' : 'text-[#263238]'
                            }`}
                          >
                            {item.text}
                          </span>
                          {onDeleteItem && (
                            <button
                              type="button"
                              onClick={() => onDeleteItem(priority.id, item.id)}
                              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-1 transition-opacity cursor-pointer"
                              title="Delete item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      <input
                        type="text"
                        value={newItemText[priority.id] || ''}
                        onChange={(e) =>
                          setNewItemText((prev) => ({ ...prev, [priority.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddChecklist(priority.id);
                        }}
                        placeholder="Add site inspection checkpoint (e.g., verify rebar cover blocks)..."
                        className="flex-1 bg-white border border-[#cbeaf0] rounded-xl px-3 py-1.5 text-xs text-[#263238] placeholder-slate-400 focus:outline-none focus:border-[#18A999]"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddChecklist(priority.id)}
                        className="px-3.5 py-1.5 bg-[#123B5D] hover:bg-[#0e2e49] text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#18A999]" /> Add
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
