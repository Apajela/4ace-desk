import React from 'react';
import { AttendanceStatus, AttendanceStatusConfig } from '../types';

export {
  INITIAL_Attendance_Status,
  INITIAL_ATTENDANCE_STATUS,
  INITIAL_Attendance_Status_List,
} from '../data/mockData';

import { INITIAL_Attendance_Status, INITIAL_Attendance_Status_List } from '../data/mockData';

export interface AttendanceStatusBadgeProps {
  status: AttendanceStatus;
  onChange?: (newStatus: AttendanceStatus) => void;
  editable?: boolean;
  className?: string;
  size?: 'xs' | 'sm' | 'md';
}

export const AttendanceStatusBadge: React.FC<AttendanceStatusBadgeProps> = ({
  status = INITIAL_Attendance_Status,
  onChange,
  editable = false,
  className = '',
  size = 'sm',
}) => {
  const currentConfig =
    INITIAL_Attendance_Status_List.find((c: AttendanceStatusConfig) => c.id === status) ||
    INITIAL_Attendance_Status_List[0];

  const sizeStyles = {
    xs: 'text-[9px] px-1.5 py-0.5',
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  }[size];

  if (editable && onChange) {
    return (
      <select
        value={status}
        onChange={(e) => onChange(e.target.value as AttendanceStatus)}
        className={`font-extrabold uppercase rounded-lg border transition-all cursor-pointer focus:outline-none ${sizeStyles} ${currentConfig.badgeClass} ${className}`}
        title="Update attendance status"
      >
        {INITIAL_Attendance_Status_List.map((cfg: AttendanceStatusConfig) => (
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

export default AttendanceStatusBadge;
