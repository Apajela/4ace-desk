export interface UserProfile {
  id: string;
  name: string;
  username: string;
  password?: string;
  pin: string;
  role: string;
  accessLevel: 'Full Access (Admin)' | 'Project Manager' | 'Field Engineer';
  avatarInitials: string;
  avatarColor?: string;
  avatarUrl?: string;
  email?: string;
  company?: string;
  companyName?: string;
  companyAddress?: string;
  licenseNumber?: string;
  prcLicense?: string;
  phone?: string;
  title?: string;
  signaturePreparedBy?: string;
  signaturePreparedTitle?: string;
  signatureCheckedBy?: string;
  signatureCheckedTitle?: string;
  signatureApprovedBy?: string;
  signatureApprovedTitle?: string;
  signatureEngineerName?: string;
  signatureEngineerTitle?: string;
  signatureClientTitle?: string;
}

export interface CompanySettings {
  companyName: string;
  licenseNumber: string;
  address: string;
  contactNumber: string;
  email: string;
  currency: string;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  client: string;
  location: string;
  category: 'Residential' | 'Commercial' | 'Industrial' | 'Infrastructure';
  status: 'In Progress' | 'Planning' | 'Completed' | 'On Hold' | 'Cancelled';
  budget: number;
  spent: number;
  startDate: string;
  targetDate: string;
  supervisor: string;
  progress: number;
  description: string;
}

export interface Worker {
  id: string;
  name: string;
  role: string;
  dailyRate: number;
  phone: string;
  status: 'Active' | 'Inactive';
  assignedProject?: string;
  username?: string;
  password?: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'half_day' | 'overtime';

export interface AttendanceStatusConfig {
  id: AttendanceStatus;
  label: string;
  dayMultiplier: number;
  badgeClass: string;
  dotColor: string;
  description: string;
}

export interface AttendanceRecord {
  id: string;
  workerId: string;
  workerName: string;
  trade?: string;
  projectId: string;
  date: string;
  timeIn: string;
  timeOut?: string;
  status: 'Present' | 'Late' | 'Half Day' | 'Absent' | AttendanceStatus;
  hoursWorked: number;
  overtimeHours: number;
  otHours?: number;
  dailyWage?: number;
  dailyRate?: number;
  notes?: string;
  remarks?: string;
  verifiedBy?: string;
}

export type DailyAttendanceRecord = AttendanceRecord;

export interface CashAdvance {
  id: string;
  workerId: string;
  workerName: string;
  projectId: string;
  amount: number;
  date: string;
  reason: string;
  deducted: boolean;
}

export type ExpenseCategory =
  | 'Materials'
  | 'Labor'
  | 'Equipment'
  | 'Subcontractor'
  | 'Permits & Fees'
  | 'Safety & Tools'
  | 'Fuel'
  | 'Food'
  | 'Utilities'
  | 'Others';

export interface Expense {
  id: string;
  projectId: string;
  projectName: string;
  category: ExpenseCategory | string;
  amount: number;
  date: string;
  vendor: string;
  supplier?: string;
  description?: string;
  invoiceNumber?: string;
  invoiceNo?: string;
  notes?: string;
  paymentStatus?: 'Paid' | 'Pending' | 'Reimbursed' | 'Approved' | 'Rejected';
  status?: 'Paid' | 'Pending' | 'Reimbursed' | 'Approved' | 'Rejected';
  paymentMode?: string;
  paymentMethod?: string;
  receiptImage?: string;
  receiptUrl?: string;
  tinNumber?: string;
}

export type ExpenseItem = Expense;

export type PriorityLevel = 'critical' | 'urgent' | 'high' | 'medium' | 'normal' | 'low';
export type TradeCategory = 'Structural' | 'Civil' | 'Safety' | 'MEPFS' | 'Architectural' | 'General';
export type TaskStatus = 'todo' | 'in_progress' | 'inspection' | 'done' | 'pending' | 'review';

export interface TaskStatusConfig {
  id: TaskStatus;
  label: string;
  badgeClass: string;
  dotColor: string;
  description: string;
}

export interface TaskChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface SitePriority {
  id: string;
  projectId?: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: PriorityLevel;
  trade?: TradeCategory;
  status?: TaskStatus;
  siteName: string;
  assignedTo?: string;
  dueDate?: string;
  targetDate?: string;
  createdAt: string;
  checklistItems?: TaskChecklistItem[];
}

export type SitePriorityItem = SitePriority;

export interface PayrollWorker {
  id: string;
  name: string;
  role: string;
  dailyRate: number;
  daysWorked: number;
  overtimeHours: number;
  cashAdvance: number;
  sssDeduction: number;
  isPaid: boolean;
}

export interface PayrollItemData {
  workerId: string;
  workerName: string;
  role: string;
  dailyRate: number;
  daysWorked: number;
  regularPay: number;
  overtimeHours: number;
  overtimePay: number;
  grossPay: number;
  cashAdvanceDeduction: number;
  netPay: number;
  isPaid?: boolean;
  projectWorkDays?: { projectName: string; days: number }[];
}

export interface PayrollEntry {
  id: string;
  workerId: string;
  workerName: string;
  role: string;
  dailyRate: number;
  daysWorked: number;
  otHours: number;
  overtimeHours?: number;
  regularPay: number;
  otPay: number;
  grossPay: number;
  cashAdvance: number;
  totalDeductions: number;
  netPay: number;
  paid: boolean;
  datePaid?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'budget' | 'attendance' | 'ocr' | 'payroll' | 'general' | 'milestone' | 'material' | 'alert' | 'info';
  timestamp: string;
  read: boolean;
  actionTab?: string;
  actionUrl?: string;
}

export type NotificationItem = AppNotification;

