import React from 'react';
import { TaskStatus, TaskStatusConfig } from '../types';

export { INITIAL_Task_Status, INITIAL_TASK_STATUS } from '../data/mockData';
import { INITIAL_Task_Status } from '../data/mockData';

export const INITIAL_Task_Status_List: TaskStatusConfig[] = [
  {
    id: 'todo',
    label: 'Pending / To Do',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
    dotColor: 'bg-slate-400',
    description: 'Scheduled task waiting for site crew.',
  },
  {
    id: 'in_progress',
    label: 'In Progress',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
    dotColor: 'bg-blue-500 animate-pulse',
    description: 'Active work being performed on site.',
  },
  {
    id: 'inspection',
    label: 'QA / Inspection',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    dotColor: 'bg-amber-500',
    description: 'Under structural inspection and QA sign-off.',
  },
  {
    id: 'done',
    label: 'Completed & Signed',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    dotColor: 'bg-emerald-500',
    description: 'Task inspected and accepted.',
  },
];

export interface TaskStatusBadgeProps {
  status?: TaskStatus;
  onChange?: (newStatus: TaskStatus) => void;
  editable?: boolean;
  className?: string;
  size?: 'xs' | 'sm' | 'md';
}

export const TaskStatusBadge: React.FC<TaskStatusBadgeProps> = ({
  status = INITIAL_Task_Status,
  onChange,
  editable = false,
  className = '',
  size = 'sm',
}) => {
  const currentConfig =
    INITIAL_Task_Status_List.find((c) => c.id === status) || INITIAL_Task_Status_List[0];

  const sizeStyles = {
    xs: 'text-[9px] px-1.5 py-0.5',
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  }[size];

  if (editable && onChange) {
    return (
      <select
        value={status}
        onChange={(e) => onChange(e.target.value as TaskStatus)}
        className={`font-extrabold uppercase rounded-lg border transition-all cursor-pointer focus:outline-none ${sizeStyles} ${currentConfig.badgeClass} ${className}`}
        title="Change task status"
      >
        {INITIAL_Task_Status_List.map((cfg) => (
          <option key={cfg.id} value={cfg.id} className="bg-white text-slate-800 font-bold normal-case">
            {cfg.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-extrabold uppercase rounded-full border shadow-2xs ${sizeStyles} ${currentConfig.badgeClass} ${className}`}
      title={currentConfig.description}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${currentConfig.dotColor}`} />
      <span>{currentConfig.label}</span>
    </span>
  );
};

export default TaskStatusBadge;
