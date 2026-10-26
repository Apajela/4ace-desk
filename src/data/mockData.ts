import {
  DailyAttendanceRecord,
  AttendanceStatusConfig,
  AttendanceStatus,
  TaskStatus,
} from '../types';
import {
  DEFAULT_ATTENDANCE,
  DEFAULT_PROJECTS,
  DEFAULT_WORKERS,
  DEFAULT_EXPENSES,
  DEFAULT_PRIORITIES,
  DEFAULT_PAYROLL,
  DEFAULT_NOTIFICATIONS,
  DEFAULT_USERS,
  DEFAULT_COMPANY,
  DEFAULT_CUSTOM_DOMAIN,
} from './defaultData';

export const INITIAL_Attendance_Status: AttendanceStatus = 'present';
export const INITIAL_ATTENDANCE_STATUS = INITIAL_Attendance_Status;

export const INITIAL_Attendance_Status_List: AttendanceStatusConfig[] = [
  {
    id: 'present',
    label: 'Present (Full Day)',
    dayMultiplier: 1.0,
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    dotColor: 'bg-emerald-500',
    description: 'Present for regular 8-hour shift.',
  },
  {
    id: 'half_day',
    label: 'Half Day (4 hrs)',
    dayMultiplier: 0.5,
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    dotColor: 'bg-amber-500',
    description: 'Worked 4 hours (half-day wage rate).',
  },
  {
    id: 'overtime',
    label: 'Overtime Shift',
    dayMultiplier: 1.0,
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
    dotColor: 'bg-blue-500 animate-pulse',
    description: 'Full day shift with approved overtime (125% regular OT rate).',
  },
  {
    id: 'absent',
    label: 'Absent / Off',
    dayMultiplier: 0,
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
    dotColor: 'bg-rose-500',
    description: 'No work performed (No work, no pay policy).',
  },
];

export const INITIAL_Task_Status: TaskStatus = 'todo';
export const INITIAL_TASK_STATUS = INITIAL_Task_Status;

export const INITIAL_Attendance_Records: DailyAttendanceRecord[] = DEFAULT_ATTENDANCE;
export const INITIAL_PROJECTS = DEFAULT_PROJECTS;
export const INITIAL_WORKERS = DEFAULT_WORKERS;
export const INITIAL_EXPENSES = DEFAULT_EXPENSES;
export const INITIAL_PRIORITIES = DEFAULT_PRIORITIES;
export const INITIAL_PAYROLL = DEFAULT_PAYROLL;
export const INITIAL_NOTIFICATIONS = DEFAULT_NOTIFICATIONS;
export const INITIAL_USER_PROFILE = DEFAULT_USERS[0];
export const INITIAL_CUSTOM_DOMAIN = DEFAULT_CUSTOM_DOMAIN;
export const INITIAL_COMPANY = DEFAULT_COMPANY;
