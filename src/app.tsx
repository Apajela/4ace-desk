import React, { useState, useEffect } from 'react';
import { useLocalStorage } from './Storage';
import {
  Project,
  Worker,
  ExpenseItem,
  SitePriorityItem,
  PayrollEntry,
  NotificationItem,
  UserProfile as UserProfileType,
  CompanySettings,
  AttendanceRecord as AttendanceRecordType,
  CashAdvance,
  AttendanceStatus,
  TaskStatus,
} from './types';
import {
  DEFAULT_PROJECTS,
  DEFAULT_WORKERS,
  DEFAULT_PRIORITIES,
  DEFAULT_PAYROLL,
  DEFAULT_NOTIFICATIONS,
  DEFAULT_USERS,
  DEFAULT_COMPANY,
  DEFAULT_ATTENDANCE,
  DEFAULT_CASH_ADVANCES,
} from './data/defaultData';

// Component Views & Modals
import { Navbar } from './components/Navbar';
import { LoginScreen } from './components/LoginScreen';
import { DashboardView } from './components/DashboardView';
import { PrioritiesView } from './components/PrioritiesView';
import { AttendanceRecord } from './components/AttendanceRecord';
import { WeeklyPayrollView } from './components/WeeklyPayrollView';
import { ExpensesView } from './components/ExpensesView';
import { CompletedProjectsView } from './components/CompletedProjectsView';
import { ReceiptScannerModal as ReceiptScanner } from './components/ReceiptScanner';
import { NotificationModal as Notification } from './components/Notification';
import { UserProfileModal as UserProfile } from './components/UserProfile';
import { ProjectModal } from './components/Project';
import { ReportsView } from './components/ReportsView';

export default function App() {
  // Safe LocalStorage Helper
  const getInitialData = <T,>(key: string, fallback: T): T => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem(key);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(fallback) && Array.isArray(parsed) && parsed.length > 0) {
            return parsed as T;
          }
          if (!Array.isArray(fallback) && parsed && typeof parsed === 'object') {
            return { ...fallback, ...parsed };
          }
        }
      }
    } catch (err) {
      console.warn(`Error reading ${key} from localStorage:`, err);
    }
    return fallback;
  };

  // User Authentication State
  const [currentUser, setCurrentUser] = useState<UserProfileType | null>(() => {
    try { const restored = localStorage.getItem('4ace_remembered_credentials') ? getInitialData<UserProfileType | null>('4ace_current_user', null) : null; return restored ? { ...restored, accessLevel: restored.id === 'user-1' || restored.id === 'user-2' ? 'Full Access (Admin)' : 'Field Engineer' } : null; } catch { return null; }
  });
  const [users, setUsers] = useState<UserProfileType[]>(() =>
    getInitialData('4ace_users', DEFAULT_USERS)
  );
  useEffect(() => { setUsers((previous) => previous.map((user) => ({ ...user, accessLevel: user.id === 'user-1' || user.id === 'user-2' ? 'Full Access (Admin)' : 'Field Engineer' }))); }, []);
  const [company, setCompany] = useState<CompanySettings>(() =>
    getInitialData('4ace_company', DEFAULT_COMPANY)
  );

  // App Navigation & Loading State
  const [activeTab, setActiveTab] = useLocalStorage<string>('4ace_active_tab', 'dashboard');

  // Core Data Stores
  const [projects, setProjects] = useLocalStorage<Project[]>('4ace_projects', DEFAULT_PROJECTS);
  const [currentProjectId, setCurrentProjectId] = useLocalStorage<string>('4ace_current_project', () => {
    const active = projects.find((p) => p.status !== 'Completed' && p.status !== 'Cancelled');
    return active ? active.id : (projects[0]?.id || DEFAULT_PROJECTS[0].id);
  });
  const [workers, setWorkers] = useState<Worker[]>(() =>
    getInitialData('4ace_workers', DEFAULT_WORKERS)
  );
  const [attendance, setAttendance] = useState<AttendanceRecordType[]>(() =>
    getInitialData('4ace_attendance', DEFAULT_ATTENDANCE)
  );
  const [cashAdvances, setCashAdvances] = useState<CashAdvance[]>(() =>
    getInitialData('4ace_cash_advances', DEFAULT_CASH_ADVANCES)
  );
  const [expenses, setExpenses] = useLocalStorage<ExpenseItem[]>('4ace_expenses', []);
  const [priorities, setPriorities] = useState<SitePriorityItem[]>(() =>
    getInitialData('4ace_priorities', DEFAULT_PRIORITIES)
  );
  const [payroll, setPayroll] = useState<PayrollEntry[]>(() =>
    getInitialData('4ace_payroll', DEFAULT_PAYROLL)
  );
  const [notifications, setNotifications] = useLocalStorage<NotificationItem[]>('4ace_notifications', DEFAULT_NOTIFICATIONS);

  // Modal Control States
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);

  // Sync to LocalStorage on updates

  useEffect(() => {
    try {
      localStorage.setItem('4ace_users', JSON.stringify(users));
    } catch {}
  }, [users]);


  useEffect(() => {
    try {
      localStorage.setItem('4ace_workers', JSON.stringify(workers));
    } catch {}
  }, [workers]);

  useEffect(() => {
    try {
      localStorage.setItem('4ace_attendance', JSON.stringify(attendance));
    } catch {}
  }, [attendance]);

  useEffect(() => {
    try {
      localStorage.setItem('4ace_cash_advances', JSON.stringify(cashAdvances));
    } catch {}
  }, [cashAdvances]);


  useEffect(() => {
    try {
      localStorage.setItem('4ace_priorities', JSON.stringify(priorities));
    } catch {}
  }, [priorities]);

  useEffect(() => {
    try {
      localStorage.setItem('4ace_payroll', JSON.stringify(payroll));
    } catch {}
  }, [payroll]);



  const activeProject =
    projects.find((p) => p.id === currentProjectId) ||
    projects.find((p) => p.status !== 'Completed' && p.status !== 'Cancelled') ||
    projects[0] ||
    DEFAULT_PROJECTS[0];

  // Priorities Handlers
  const handleTogglePriority = (id: string) => {
    setPriorities((prev) =>
      prev.map((p) => (p.id === id ? { ...p, completed: !p.completed } : p))
    );
  };

  const handleToggleChecklistItem = (priorityId: string, itemId: string) => {
    setPriorities((prev) =>
      prev.map((p) => {
        if (p.id !== priorityId) return p;
        const items = p.checklistItems || [];
        return {
          ...p,
          checklistItems: items.map((item) =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
          ),
        };
      })
    );
  };

  const handleAddChecklistItem = (priorityId: string, text: string) => {
    setPriorities((prev) =>
      prev.map((p) => {
        if (p.id !== priorityId) return p;
        const items = p.checklistItems || [];
        return {
          ...p,
          checklistItems: [
            ...items,
            { id: `c-item-${Date.now()}`, text, completed: false },
          ],
        };
      })
    );
  };

  const handleDeleteChecklistItem = (priorityId: string, itemId: string) => {
    setPriorities((prev) =>
      prev.map((p) => {
        if (p.id !== priorityId) return p;
        const items = p.checklistItems || [];
        return {
          ...p,
          checklistItems: items.filter((i) => i.id !== itemId),
        };
      })
    );
  };

  const handleUpdatePriorityStatus = (priorityId: string, status: TaskStatus) => {
    setPriorities((prev) =>
      prev.map((p) =>
        p.id === priorityId
          ? {
              ...p,
              status,
              completed: status === 'done',
            }
          : p
      )
    );
  };

  const handleAddPriority = (newPriority: Omit<SitePriorityItem, 'id' | 'createdAt'>) => {
    const newItem: SitePriorityItem = {
      ...newPriority,
      id: `prio-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setPriorities((prev) => [newItem, ...prev]);

    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'New Site Priority Assigned',
      message: `Priority "${newItem.title}" added under ${newItem.trade || 'General'} trade.`,
      type: 'milestone',
      timestamp: 'Just now',
      read: false,
      actionTab: 'priorities',
      actionUrl: 'priorities',
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  const handleDeletePriority = (id: string) => {
    setPriorities((prev) => prev.filter((p) => p.id !== id));
  };

  const handleClearCompletedPriorities = () => {
    setPriorities((prev) => prev.filter((p) => !p.completed));
  };

  // Expenses Handlers
  const handleAddExpense = (newExpense: Omit<ExpenseItem, 'id'>) => {
    if (newExpense.category === 'Labor') {
      const now = new Date();
      const todayKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
      const day = now.getDay();
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((day + 6) % 7));
      const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6);
      const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
      const weekStartKey = dateKey(weekStart);
      const weekEndKey = dateKey(weekEnd);
      const targetProject = projects.find((project) => project.id === newExpense.projectId);
      const alreadyPosted = expenses.some((expense) => expense.projectId === newExpense.projectId && expense.category === 'Labor' && expense.date >= weekStartKey && expense.date <= weekEndKey);
      const allowedDay = day === 0 || day === 6 || (day === 5 && !!targetProject && targetProject.targetDate === todayKey);
      if (!isFullAccess || alreadyPosted || !allowedDay || newExpense.date !== todayKey || !targetProject || ['Completed','Cancelled'].includes(targetProject.status)) {
        setNotifications((prev) => [{ id: `notif-${Date.now()}`, title: 'Labor Expense Not Posted', message: alreadyPosted ? 'Labor expenses have already been posted for this project this week.' : 'Labor expenses may be posted with today’s date on Saturday or Sunday, or on Friday when the project ends that Friday.', type: 'alert', timestamp: 'Just now', read: false, actionTab: 'payroll' }, ...prev]);
        return;
      }
    }
    const newItem: ExpenseItem = {
      ...newExpense,
      id: `exp-${Date.now()}`,
    };
    setExpenses((prev) => [newItem, ...prev]);

    // Update active project spent
    setProjects((prev) =>
      prev.map((p) =>
        p.id === newItem.projectId
          ? { ...p, spent: (p.spent || 0) + Number(newItem.amount) }
          : p
      )
    );

    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'Expense Voucher Recorded',
      message: `₱${newItem.amount.toLocaleString()} for "${newItem.description || 'materials'}" recorded from ${newItem.vendor || newItem.supplier || 'supplier'}.`,
      type: 'material',
      timestamp: 'Just now',
      read: false,
      actionTab: 'expenses',
      actionUrl: 'expenses',
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  const handleDeleteExpense = (id: string) => {
    const target = expenses.find((e) => e.id === id);
    if (!target) return;

    setExpenses((prev) => prev.filter((e) => e.id !== id));

    // Deduct from project spent total
    if (target.projectId && target.amount) {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === target.projectId
            ? { ...p, spent: Math.max(0, (p.spent || 0) - Number(target.amount)) }
            : p
        )
      );
    }

    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'Expense Voucher Deleted',
      message: `Voucher for "${target.description || 'expense'}" (₱${Number(target.amount).toLocaleString()}) removed from project ledger.`,
      type: 'material',
      timestamp: 'Just now',
      read: false,
      actionTab: 'expenses',
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  const handleUpdateExpenseStatus = (id: string, status?: ExpenseItem['status']) => {
    if (!status) return;
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status, paymentStatus: status } : e))
    );
  };

  // Projects Handlers
  const handleAddProject = (newProj: Omit<Project, 'id'>) => {
    const project: Project = {
      ...newProj,
      id: `proj-${Date.now()}`,
    };
    setProjects((prev) => [project, ...prev]);
    setCurrentProjectId(project.id);

    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'New Site Project Created',
      message: `Site "${project.name}" (${project.code}) initialized with budget of ₱${project.budget.toLocaleString()}.`,
      type: 'general',
      timestamp: 'Just now',
      read: false,
      actionTab: 'dashboard',
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  // A project may only be completed after its labor for the current Monday–Sunday week is posted.
  const handleCompleteProject = (projId: string) => {
    const target = projects.find((p) => p.id === projId);
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - ((today.getDay() + 6) % 7));
    const weekStartKey = `${weekStart.getFullYear()}-${String(weekStart.getMonth()+1).padStart(2,'0')}-${String(weekStart.getDate()).padStart(2,'0')}`;
    const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6);
    const weekEndKey = `${weekEnd.getFullYear()}-${String(weekEnd.getMonth()+1).padStart(2,'0')}-${String(weekEnd.getDate()).padStart(2,'0')}`;
    const hasLaborExpense = expenses.some((expense) => expense.projectId === projId && expense.category === 'Labor' && expense.date >= weekStartKey && expense.date <= weekEndKey);
    if (target && target.status !== 'Completed' && !hasLaborExpense) {
      setNotifications((prev) => [{ id: `notif-${Date.now()}`, title: 'Post Labor Expenses First', message: `Post the final weekly labor expenses for ${target.name} before marking it completed.`, type: 'alert', timestamp: 'Just now', read: false, actionTab: 'payroll' }, ...prev]);
      setCurrentProjectId(projId);
      setActiveTab('payroll');
      return;
    }
    if (!target || ['Completed','Cancelled'].includes(target.status)) return;
    setProjects((prev) =>
      prev.map((p) => (p.id === projId ? { ...p, status: 'Completed' } : p))
    );

    // If current project is completed, switch active selector to another active project
    const remainingActive = projects.filter(
      (p) => p.id !== projId && p.status !== 'Completed' && p.status !== 'Cancelled'
    );
    if (remainingActive.length > 0) {
      setCurrentProjectId(remainingActive[0].id);
    }

    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'Project Status: Completed',
      message: `Project ${target?.name || ''} marked as Completed and moved to Project History.`,
      type: 'milestone',
      timestamp: 'Just now',
      read: false,
      actionTab: 'archive',
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  const handleDeleteProject = (projId: string) => {
    setProjects((prev) => prev.filter((project) => project.id !== projId));
    setExpenses((prev) => prev.filter((expense) => expense.projectId !== projId));
    setPriorities((prev) => prev.filter((priority) => priority.projectId !== projId));
    setAttendance((prev) => prev.filter((record) => record.projectId !== projId));
    setCashAdvances((prev) => prev.filter((advance) => advance.projectId !== projId));
    setPayroll((prev) => prev.filter((entry) => !workers.some((worker) => worker.id === entry.workerId && worker.assignedProject === projId)));
    if (currentProjectId === projId) {
      const next = projects.find((project) => project.id !== projId && project.status !== 'Completed' && project.status !== 'Cancelled');
      if (next) setCurrentProjectId(next.id);
    }
  };

  // Cancel Project Handler
  const handleCancelProject = (projId: string) => {
    const target = projects.find((p) => p.id === projId);
    setProjects((prev) =>
      prev.map((p) => (p.id === projId ? { ...p, status: 'Cancelled' } : p))
    );

    const remainingActive = projects.filter(
      (p) => p.id !== projId && p.status !== 'Completed' && p.status !== 'Cancelled'
    );
    if (remainingActive.length > 0) {
      setCurrentProjectId(remainingActive[0].id);
    }

    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'Project Status: Cancelled',
      message: `Project ${target?.name || ''} has been cancelled and moved to Project History.`,
      type: 'general',
      timestamp: 'Just now',
      read: false,
      actionTab: 'archive',
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  // Reopen Project Handler
  const handleReopenProject = (projId: string) => {
    const target = projects.find((p) => p.id === projId);
    setProjects((prev) =>
      prev.map((p) => (p.id === projId ? { ...p, status: 'In Progress' } : p))
    );
    setCurrentProjectId(projId);
    setActiveTab('dashboard');

    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'Project Reopened',
      message: `Project ${target?.name || ''} restored to In Progress and returned to active site selector.`,
      type: 'milestone',
      timestamp: 'Just now',
      read: false,
      actionTab: 'dashboard',
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  // Select project to view in reports
  const handleSelectProjectForReports = (projId: string) => {
    setCurrentProjectId(projId);
    setActiveTab('reports');
  };

  // Payroll Handlers
  const handleUpdatePayrollEntry = (updated: PayrollEntry) => {
    setPayroll((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleMarkAllPayrollPaid = () => {
    if (new Date().getDay() !== 0) {
      setNotifications((prev) => [{ id: `notif-${Date.now()}`, title: 'Weekly Payroll Release', message: 'Weekly wages can be released on Sunday only.', type: 'alert', timestamp: 'Just now', read: false, actionTab: 'payroll' }, ...prev]);
      setActiveTab('payroll');
      return;
    }
    setPayroll((prev) =>
      prev.map((p) => ({
        ...p,
        paid: true,
        datePaid: new Date().toISOString().split('T')[0],
      }))
    );
    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'Weekly Payroll Disbursed',
      message: 'All worker wage envelopes marked as paid and released for current cutoff.',
      type: 'payroll',
      timestamp: 'Just now',
      read: false,
      actionTab: 'payroll',
      actionUrl: 'payroll',
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  // Save each worker's attendance against the project they worked on for that specific date.
  const handleSaveAttendance = (
    date: string,
    records: Record<string, { status: AttendanceStatus; otHours: number; remarks: string; projectId: string }>
  ) => {
    const savedRecords = Object.entries(records).map(([workerId, record]) => {
      const worker = workers.find((item) => item.id === workerId);
      const existing = attendance.find((item) => item.workerId === workerId && item.date === date);
      const status = record.status;
      const absent = status === 'absent';
      const halfDay = status === 'half_day';
      const hoursWorked = absent ? 0 : halfDay ? 4 : 8;
      return {
        id: existing?.id || `att-${workerId}-${date}`,
        workerId,
        workerName: worker?.name || existing?.workerName || workerId,
        trade: worker?.role || existing?.trade || '',
        projectId: record.projectId || existing?.projectId || worker?.assignedProject || currentProjectId,
        date,
        timeIn: absent ? '' : existing?.timeIn || '07:00 AM',
        timeOut: absent ? '' : existing?.timeOut || '05:00 PM',
        status,
        hoursWorked,
        overtimeHours: Math.max(0, Number(record.otHours) || 0),
        otHours: Math.max(0, Number(record.otHours) || 0),
        dailyWage: worker?.dailyRate || existing?.dailyWage || 0,
        dailyRate: worker?.dailyRate || existing?.dailyRate || 0,
        notes: record.remarks || '',
        remarks: record.remarks || '',
        verifiedBy: currentUser?.name || existing?.verifiedBy || 'Site In-Charge',
      } as AttendanceRecordType;
    });
    const savedKeys = new Set(savedRecords.map((item) => `${item.workerId}:${item.date}`));
    const nextAttendance = attendance.filter((item) => !savedKeys.has(`${item.workerId}:${item.date}`)).concat(savedRecords);
    setAttendance(nextAttendance);
    const today = new Date();
    const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - ((today.getDay() + 6) % 7));
    const mondayKey = `${monday.getFullYear()}-${String(monday.getMonth()+1).padStart(2,'0')}-${String(monday.getDate()).padStart(2,'0')}`;
    const sunday = new Date(monday); sunday.setDate(monday.getDate()+6);
    const sundayKey = `${sunday.getFullYear()}-${String(sunday.getMonth()+1).padStart(2,'0')}-${String(sunday.getDate()).padStart(2,'0')}`;
    setPayroll((previousPayroll) => previousPayroll.map((entry) => {
      const weekRecords = nextAttendance.filter((item) => item.workerId === entry.workerId && item.date >= mondayKey && item.date <= sundayKey);
      if (weekRecords.length === 0) return entry;
      const daysWorked = Math.min(6, weekRecords.reduce((total, item) => {
        const state = String(item.status).toLowerCase();
        return total + (state === 'absent' ? 0 : state === 'half_day' || state === 'half day' ? 0.5 : 1);
      }, 0));
      const otHours = weekRecords.reduce((total, item) => total + (Number(item.otHours ?? item.overtimeHours) || 0), 0);
      const regularPay = daysWorked * entry.dailyRate;
      const otPay = (entry.dailyRate / 8) * 1.25 * otHours;
      const grossPay = regularPay + otPay;
      const netPay = Math.max(0, grossPay - (entry.totalDeductions || 0));
      return { ...entry, daysWorked, otHours, overtimeHours: otHours, regularPay, otPay, grossPay, netPay };
    }));
    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'Daily Attendance Saved',
      message: `Attendance for ${date} was saved with each worker's project assignment for that day. Weekly payroll was recalculated without duplicate day counting.`,
      type: 'attendance', timestamp: 'Just now', read: false, actionTab: 'payroll', actionUrl: 'payroll',
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  // Crew / Worker Handlers (Add, Edit, Delete)
  const handleAddWorker = (newWorker: Omit<Worker, 'id'>) => {
    const worker: Worker = {
      ...newWorker,
      id: `w-${Date.now()}`,
    };
    setWorkers((prev) => [...prev, worker]);
    if (worker.username?.trim() && worker.password?.trim()) {
      const workerAccount: UserProfileType = {
        id: `account-${worker.id}`, name: worker.name, username: worker.username.trim().toLowerCase(),
        password: worker.password, pin: worker.password, role: worker.role, accessLevel: 'Field Engineer',
        avatarInitials: worker.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase(),
        avatarColor: 'bg-[#123B5D] text-white font-bold',
      };
      setUsers((prev) => prev.some((user) => user.username.toLowerCase() === workerAccount.username) ? prev : [...prev, workerAccount]);
    }

    const newPayrollEntry: PayrollEntry = {
      id: `pr-${Date.now()}`,
      workerId: worker.id,
      workerName: worker.name,
      role: worker.role,
      dailyRate: worker.dailyRate,
      daysWorked: 6,
      otHours: 0,
      overtimeHours: 0,
      regularPay: worker.dailyRate * 6,
      otPay: 0,
      grossPay: worker.dailyRate * 6,
      cashAdvance: 0,
      totalDeductions: 150,
      netPay: Math.max(0, worker.dailyRate * 6 - 150),
      paid: false,
    };
    setPayroll((prev) => [...prev, newPayrollEntry]);

    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'Crew Member Added',
      message: `${worker.name} (${worker.role}) added to crew roster at ₱${worker.dailyRate.toLocaleString()}/day.`,
      type: 'attendance',
      timestamp: 'Just now',
      read: false,
      actionTab: 'attendance',
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  const handleEditWorker = (updatedWorker: Worker) => {
    setWorkers((prev) =>
      prev.map((w) => (w.id === updatedWorker.id ? updatedWorker : w))
    );
    setPayroll((prev) =>
      prev.map((p) =>
        p.workerId === updatedWorker.id
          ? {
              ...p,
              workerName: updatedWorker.name,
              role: updatedWorker.role,
              dailyRate: updatedWorker.dailyRate,
              regularPay: (p.daysWorked || 0) * updatedWorker.dailyRate,
              grossPay: (p.daysWorked || 0) * updatedWorker.dailyRate + (p.otPay || 0),
              netPay: Math.max(
                0,
                (p.daysWorked || 0) * updatedWorker.dailyRate + (p.otPay || 0) - (p.totalDeductions || 0)
              ),
            }
          : p
      )
    );
  };

  const handleDeleteWorker = (workerId: string) => {
    const target = workers.find((w) => w.id === workerId);
    setWorkers((prev) => prev.filter((w) => w.id !== workerId));
    setPayroll((prev) => prev.filter((p) => p.workerId !== workerId));
    if (target) {
      const notif: NotificationItem = {
        id: `notif-${Date.now()}`,
        title: 'Crew Member Removed',
        message: `${target.name} (${target.role}) removed from crew roster.`,
        type: 'attendance',
        timestamp: 'Just now',
        read: false,
        actionTab: 'attendance',
      };
      setNotifications((prev) => [notif, ...prev]);
    }
  };

  // Notifications Handlers
  const handleMarkNotifRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllNotifsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClearNotif = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // User Profile & Auth Handlers
  const handleSaveProfile = (prof: UserProfileType) => {
    const previousName = currentUser?.name?.trim();
    const nextProfile = {
      ...prof,
      signatureApprovedBy:
        !prof.signatureApprovedBy || prof.signatureApprovedBy.trim() === previousName
          ? prof.name
          : prof.signatureApprovedBy,
    };
    setCurrentUser(nextProfile);
    try { if (localStorage.getItem('4ace_remembered_credentials')) { localStorage.setItem('4ace_current_user', JSON.stringify(nextProfile)); localStorage.setItem('4ace_remembered_credentials', JSON.stringify({ username: nextProfile.username, password: nextProfile.password || '' })); } } catch {}
    setUsers((prev) => prev.map((u) => (u.id === nextProfile.id ? nextProfile : u)));
    if (previousName && previousName !== nextProfile.name.trim()) {
      setProjects((prev) => prev.map((p) => ({
        ...p,
        supervisor: p.supervisor?.trim() === previousName ? nextProfile.name : p.supervisor,
      })));
      setAttendance((prev) => prev.map((record) => ({
        ...record,
        verifiedBy: record.verifiedBy?.trim() === previousName ? nextProfile.name : record.verifiedBy,
      })));
    }
  };

  const handleCreateUser = (newUser: UserProfileType) => {
    setUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);
  };


  // Cash Advance Handlers
  const handleAddCashAdvance = (newCA: Omit<CashAdvance, 'id'>) => {
    const ca: CashAdvance = { ...newCA, id: `ca-${Date.now()}` };
    setCashAdvances((prev) => [ca, ...prev]);

    // Update payroll entry for worker
    setPayroll((prev) =>
      prev.map((p) => {
        if (p.workerId !== ca.workerId) return p;
        const newCAAmount = (p.cashAdvance || 0) + ca.amount;
        const totalDeds = (p.totalDeductions || 150) + ca.amount;
        const net = Math.max(0, (p.grossPay || 0) - totalDeds);
        return {
          ...p,
          cashAdvance: newCAAmount,
          totalDeductions: totalDeds,
          netPay: net,
        };
      })
    );

    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'Cash Advance Recorded',
      message: `₱${ca.amount.toLocaleString()} cash advance recorded for ${ca.workerName}. Automatically deducted from weekly payroll.`,
      type: 'payroll',
      timestamp: 'Just now',
      read: false,
      actionTab: 'payroll',
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  const handleDeleteCashAdvance = (id: string) => {
    setCashAdvances((prev) => prev.filter((c) => c.id !== id));
  };

  const handleToggleCashAdvanceStatus = (id: string) => {
    setCashAdvances((prev) =>
      prev.map((c) => (c.id === id ? { ...c, deducted: !c.deducted } : c))
    );
  };

  // Enforce labor posting rules in the data handler too (not just by disabling the UI).
  const handlePostLaborExpense = (amount: number, description: string) => {
    const now = new Date();
    const dateKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    const day = now.getDay();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((day + 6) % 7));
    const weekStartKey = `${weekStart.getFullYear()}-${String(weekStart.getMonth()+1).padStart(2,'0')}-${String(weekStart.getDate()).padStart(2,'0')}`;
    const alreadyPosted = expenses.some((item) => item.projectId === activeProject.id && item.category === 'Labor' && item.date >= weekStartKey && item.date <= dateKey);
    const fridayCompletionAllowed = day === 5 && activeProject.targetDate === dateKey;
    const allowedDay = day === 0 || day === 6 || fridayCompletionAllowed;
    if (!isFullAccess || !allowedDay || alreadyPosted || ['Completed','Cancelled'].includes(activeProject.status)) return;
    const expense: ExpenseItem = {
      id: `exp-${Date.now()}`,
      projectId: activeProject.id,
      projectName: activeProject.name,
      category: 'Labor',
      amount: Math.max(0, Number(amount) || 0),
      date: dateKey,
      vendor: 'Site Field Crew & Subcontractors',
      supplier: 'Weekly Field Labor Payroll',
      description,
      paymentStatus: 'Paid',
      status: 'Paid',
    };
    handleAddExpense(expense);
  };

  const isFullAccess = !!currentUser && currentUser.accessLevel === 'Full Access (Admin)';
  const exportLocalData = () => {
    const keys = ['4ace_projects','4ace_workers','4ace_attendance','4ace_cash_advances','4ace_priorities','4ace_payroll','4ace_expenses','4ace_notifications'];
    const name = currentUser?.name?.trim().toLowerCase() || '';
    const all: Record<string, any[]> = {};
    keys.forEach((key) => { try { const v = JSON.parse(localStorage.getItem(key) || '[]'); all[key] = Array.isArray(v) ? v : []; } catch { all[key] = []; } });
    const ownWorkers = all['4ace_workers'].filter((x) => x.name?.trim().toLowerCase() === name || x.username?.trim().toLowerCase() === currentUser?.username?.toLowerCase());
    const workerIds = new Set(ownWorkers.map((x) => x.id));
    const ownAttendance = all['4ace_attendance'].filter((x) => workerIds.has(x.workerId) || x.workerName?.trim().toLowerCase() === name);
    const projectIds = new Set<string>([...ownWorkers.map((x) => x.assignedProject), ...ownAttendance.map((x) => x.projectId), currentProjectId].filter((id): id is string => typeof id === 'string' && id.length > 0));
    const latestTen = (key: string, items: any[]) => {
      if (key === '4ace_attendance') return [...items].sort((a,b) => String(b.date || '').localeCompare(String(a.date || ''))).slice(0,10);
      if (['4ace_projects','4ace_expenses','4ace_priorities','4ace_notifications','4ace_cash_advances'].includes(key)) return items.slice(0,10);
      return items.slice(-10);
    };
    const filterOwn = (key: string, items: any[]) => {
      if (isFullAccess) return latestTen(key, items);
      if (key === '4ace_projects') return latestTen(key, items.filter((x) => projectIds.has(x.id)));
      if (key === '4ace_workers') return latestTen(key, ownWorkers);
      if (key === '4ace_attendance') return latestTen(key, ownAttendance);
      if (key === '4ace_cash_advances' || key === '4ace_payroll') return latestTen(key, items.filter((x) => workerIds.has(x.workerId) || x.workerName?.trim().toLowerCase() === name));
      if (key === '4ace_expenses' || key === '4ace_priorities') return latestTen(key, items.filter((x) => projectIds.has(x.projectId)));
      return latestTen(key, items.filter((x) => x.userId === currentUser?.id || x.accountId === currentUser?.id));
    };
    const data: Record<string, unknown> = { format: '4ace-desk-local-backup', version: 2, exportedAt: new Date().toISOString(), accountId: currentUser?.id, accountName: currentUser?.name };
    keys.forEach((key) => { data[key] = filterOwn(key, all[key]); });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `4ace-desk-backup-${new Date().toISOString().slice(0,10)}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const importLocalData = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (data?.format !== '4ace-desk-local-backup' || ![1,2].includes(Number(data.version))) throw new Error('Invalid 4Ace Desk backup file.');
        if (!isFullAccess && data.accountId !== currentUser?.id) throw new Error('This backup belongs to another account. Import was cancelled.');
        const keys = ['4ace_projects','4ace_workers','4ace_attendance','4ace_cash_advances','4ace_priorities','4ace_payroll','4ace_expenses','4ace_notifications'];
        const name = currentUser?.name?.trim().toLowerCase() || '';
        const existingProjects = (() => { try { const v=JSON.parse(localStorage.getItem('4ace_projects')||'[]'); return Array.isArray(v)?v:[]; } catch { return []; } })();
        const existingWorkers = (() => { try { const v=JSON.parse(localStorage.getItem('4ace_workers')||'[]'); return Array.isArray(v)?v:[]; } catch { return []; } })();
        const ownWorkers = existingWorkers.filter((x) => x.name?.trim().toLowerCase() === name || x.username?.trim().toLowerCase() === currentUser?.username?.toLowerCase());
        const workerIds = new Set(ownWorkers.map((x) => x.id));
        const backupWorkers = Array.isArray(data['4ace_workers']) ? data['4ace_workers'].filter((x:any) => x.name?.trim().toLowerCase() === name || x.username?.trim().toLowerCase() === currentUser?.username?.toLowerCase()) : [];
        const backupAttendance = Array.isArray(data['4ace_attendance']) ? data['4ace_attendance'].filter((x:any) => workerIds.has(x.workerId) || x.workerName?.trim().toLowerCase() === name) : [];
        const allowedProjects = new Set<string>([...existingProjects.filter((x) => x.supervisor?.trim().toLowerCase() === name || ownWorkers.some((w) => w.assignedProject === x.id)).map((x) => x.id), ...backupWorkers.map((x:any) => x.assignedProject), ...backupAttendance.map((x:any) => x.projectId), currentProjectId].filter((id): id is string => typeof id === 'string' && id.length > 0));
        keys.forEach((key) => {
          if (!Array.isArray(data[key])) return;
          const incoming = data[key].slice(-10);
          let safeIncoming = incoming;
          if (!isFullAccess) {
            if (key === '4ace_projects') safeIncoming = incoming.filter((x:any) => x.supervisor?.trim().toLowerCase() === name || allowedProjects.has(x.id));
            else if (key === '4ace_workers') safeIncoming = incoming.filter((x:any) => x.name?.trim().toLowerCase() === name || x.username?.trim().toLowerCase() === currentUser?.username?.toLowerCase());
            else if (key === '4ace_attendance') safeIncoming = incoming.filter((x:any) => workerIds.has(x.workerId) || x.workerName?.trim().toLowerCase() === name);
            else if (key === '4ace_payroll' || key === '4ace_cash_advances') safeIncoming = incoming.filter((x:any) => workerIds.has(x.workerId) || x.workerName?.trim().toLowerCase() === name);
            else if (key === '4ace_expenses' || key === '4ace_priorities') safeIncoming = incoming.filter((x:any) => allowedProjects.has(x.projectId));
            else safeIncoming = incoming.filter((x:any) => x.userId === currentUser?.id || x.accountId === currentUser?.id);
          }
          const existing = (() => { try { const v=JSON.parse(localStorage.getItem(key)||'[]'); return Array.isArray(v)?v:[]; } catch { return []; } })();
          const ids = new Set(safeIncoming.map((item:any) => item.id).filter(Boolean));
          const isOwned = (item:any) => {
            if (key === '4ace_projects') return allowedProjects.has(item.id) || item.supervisor?.trim().toLowerCase() === name;
            if (key === '4ace_workers') return item.name?.trim().toLowerCase() === name || item.username?.trim().toLowerCase() === currentUser?.username?.toLowerCase();
            if (key === '4ace_attendance') return workerIds.has(item.workerId) || item.workerName?.trim().toLowerCase() === name;
            if (key === '4ace_payroll' || key === '4ace_cash_advances') return workerIds.has(item.workerId) || item.workerName?.trim().toLowerCase() === name;
            if (key === '4ace_expenses' || key === '4ace_priorities') return allowedProjects.has(item.projectId);
            return item.userId === currentUser?.id || item.accountId === currentUser?.id;
          };
          const preserved = existing.filter((item:any) => !ids.has(item.id) || (!isFullAccess && !isOwned(item)));
          localStorage.setItem(key, JSON.stringify([...preserved, ...safeIncoming].slice(-Math.max(10, preserved.length + safeIncoming.length))));
        });
        window.alert('Import complete. Existing unrelated records were preserved. The page will reload to apply the imported data.'); window.location.reload();
      } catch (error) { window.alert(error instanceof Error ? error.message : 'Unable to import backup.'); }
    };
    reader.readAsText(file);
  };
  const allProjectsFinished = projects.length > 0 && projects.every((project) => project.status === 'Completed' || project.status === 'Cancelled') && projects.some((project) => project.status === 'Completed');
  const allowedTabs = isFullAccess ? ['dashboard', 'priorities', 'attendance', 'payroll', 'expenses', 'reports', 'archive'] : ['dashboard', 'priorities', 'payroll'];
  useEffect(() => { if (currentUser && !allowedTabs.includes(activeTab)) setActiveTab('dashboard'); }, [activeTab, currentUser?.accessLevel]);

  // If user is not logged in, render LoginScreen
  if (!currentUser) {
    return (
      <LoginScreen
        users={users}
        onLogin={(user, remember) => { setCurrentUser(user); try { if (remember) localStorage.setItem('4ace_current_user', JSON.stringify(user)); else localStorage.removeItem('4ace_current_user'); } catch {} }}
        onCreateUser={handleCreateUser}
        company={company}
      />
    );
  }

  const pendingPrioritiesCount = priorities.filter(
    (p) => (!p.projectId || p.projectId === activeProject.id) && !p.completed
  ).length;

  return (
    <div className="min-h-screen bg-white text-[#263238] flex flex-col font-sans antialiased selection:bg-[#18A999] selection:text-white">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:font-bold focus:text-[#123B5D]">Skip to main content</a>
      {/* Top Application Navbar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        currentUser={currentUser}
        allUsers={users}
        projects={projects}
        allowedTabs={allowedTabs}
        activeProjectId={activeProject.id}
        onSelectProject={(id) => setCurrentProjectId(id)}
        company={company}
        notifications={notifications}
        onOpenNotifications={() => setShowNotification(true)}
        onOpenProfileModal={() => setShowProfile(true)}
        onOpenReceiptScanner={() => setShowScanner(true)}
        onOpenNewProject={() => setShowProjectModal(true)}
        onLogout={() => { setCurrentUser(null); try { localStorage.removeItem('4ace_current_user'); } catch {} }}
        pendingPrioritiesCount={pendingPrioritiesCount}
      />

      <div className="mx-auto flex w-full max-w-7xl justify-end gap-2 px-4 sm:px-6 lg:px-8 pt-3">
        <button type="button" onClick={exportLocalData} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-[#123B5D] hover:bg-slate-50">Export Data (Last 10)</button>
        <label className="cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-[#123B5D] hover:bg-slate-50">Import Data<input type="file" accept="application/json,.json" className="hidden" onChange={(e) => { importLocalData(e.target.files?.[0]); e.currentTarget.value = ''; }} /></label>
      </div>
      {/* Responsive workspace sidebar and active module */}
      <div className="flex-1 max-w-7xl mx-auto w-full flex flex-col md:flex-row gap-5 px-4 sm:px-6 lg:px-8 py-6">
        <main id="main-content" tabIndex={-1} className="min-w-0 flex-1">
        {activeTab === 'dashboard' && (
          <DashboardView
            activeProject={activeProject}
            allProjects={projects}
            expenses={expenses}
            workers={isFullAccess ? workers : workers.filter((w) => w.name.toLowerCase() === currentUser.name.toLowerCase())}
            attendance={isFullAccess ? attendance : attendance.filter((a) => a.workerName?.toLowerCase() === currentUser.name.toLowerCase())}
            cashAdvances={isFullAccess ? cashAdvances : cashAdvances.filter((a) => a.workerName.toLowerCase() === currentUser.name.toLowerCase())}
            priorities={priorities}
            currentUser={currentUser}
            company={company}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenAttendanceModal={() => setShowAttendanceModal(true)}
            onOpenReceiptScanner={() => setShowScanner(true)}
            onOpenProjectModal={() => setShowProjectModal(true)}
            onTogglePriority={handleTogglePriority}
            onAddPriority={handleAddPriority}
            onDeletePriority={handleDeletePriority}
            onClearCompletedPriorities={handleClearCompletedPriorities}
            onSelectProject={(id) => setCurrentProjectId(id)}
          />
        )}

        {activeTab === 'priorities' && (
          <PrioritiesView
            currentProject={activeProject}
            priorities={priorities}
            onToggleChecklistItem={handleToggleChecklistItem}
            onAddChecklistItem={handleAddChecklistItem}
            onDeleteChecklistItem={handleDeleteChecklistItem}
            onUpdatePriorityStatus={handleUpdatePriorityStatus}
            onAddPriority={handleAddPriority}
          />
        )}

        {activeTab === 'attendance' && (
          <AttendanceRecord
            projectName={activeProject.name}
            workers={workers}
            projects={projects}
            records={attendance}
            onSaveAttendance={handleSaveAttendance}
            onAddWorker={handleAddWorker}
            onEditWorker={handleEditWorker}
            onDeleteWorker={handleDeleteWorker}
          />
        )}

        {activeTab === 'payroll' && (
          <WeeklyPayrollView
            currentProject={activeProject}
            workers={isFullAccess ? workers : workers.filter((w) => w.name.toLowerCase() === currentUser.name.toLowerCase())}
            payroll={isFullAccess ? payroll : payroll.filter((entry) => entry.workerName.toLowerCase() === currentUser.name.toLowerCase())}
            cashAdvances={isFullAccess ? cashAdvances : cashAdvances.filter((entry) => entry.workerName.toLowerCase() === currentUser.name.toLowerCase())}
            onAddCashAdvance={isFullAccess ? handleAddCashAdvance : undefined}
            onDeleteCashAdvance={isFullAccess ? handleDeleteCashAdvance : undefined}
            onToggleCashAdvanceStatus={isFullAccess ? handleToggleCashAdvanceStatus : undefined}
            onUpdatePayrollEntry={isFullAccess ? handleUpdatePayrollEntry : undefined}
            onMarkAllPaid={isFullAccess ? handleMarkAllPayrollPaid : undefined}
            onLogAttendanceClick={isFullAccess ? () => setShowAttendanceModal(true) : undefined}
            onPostLaborExpense={isFullAccess ? handlePostLaborExpense : undefined}
            currentUser={currentUser}
            expenses={expenses}
            attendance={attendance.filter((record) => isFullAccess || record.workerName?.toLowerCase() === currentUser.name.toLowerCase())}
            projects={projects}
          />
        )}

        {activeTab === 'expenses' && (allProjectsFinished ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center" role="status" aria-live="polite">
            <h1 className="text-xl font-black text-[#123B5D]">No project expenses</h1>
            <p className="mt-2 text-sm text-slate-600">All projects have been completed. Expense entries are hidden from this page.</p>
          </section>
        ) : (
          <ExpensesView
            currentProject={activeProject}
            expenses={expenses}
            onAddExpense={handleAddExpense}
            onUpdateExpenseStatus={handleUpdateExpenseStatus}
            onDeleteExpense={handleDeleteExpense}
            onOpenReceiptScanner={() => setShowScanner(true)}
          />
        ))}

        {activeTab === 'reports' && isFullAccess && (
          <ReportsView currentProject={activeProject} expenses={expenses} payroll={payroll} priorities={priorities} onCompleteProject={handleCompleteProject} onCancelProject={handleCancelProject} currentUser={currentUser} />
        )}

        {activeTab === 'archive' && (
          <CompletedProjectsView
            projects={projects}
            expenses={expenses}
            payroll={payroll}
            onReopenProject={handleReopenProject}
            onCancelProject={handleCancelProject}
            onDeleteProject={handleDeleteProject}
            onSelectProjectForReports={handleSelectProjectForReports}
          />
        )}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#0d2b45] bg-[#123B5D] py-4 px-6 text-center text-xs text-slate-300">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-white font-medium">4Ace Desk Project Site Management &amp; EMS</span>
          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setActiveTab('archive')}
              className="text-[#18A999] hover:text-[#a2f0e7] font-bold cursor-pointer"
            >
              Project History &amp; Archive
            </button>
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      {showAttendanceModal && (
        <AttendanceRecord
          projectName={activeProject.name}
          workers={workers}
          projects={projects}
          records={attendance}
          onClose={() => setShowAttendanceModal(false)}
          onSaveAttendance={handleSaveAttendance}
          onAddWorker={handleAddWorker}
          onEditWorker={handleEditWorker}
          onDeleteWorker={handleDeleteWorker}
        />
      )}

      {showScanner && (
        <ReceiptScanner
          projectId={activeProject.id}
          onClose={() => setShowScanner(false)}
          onSaveExpense={handleAddExpense}
        />
      )}

      {showNotification && (
        <Notification
          notifications={notifications}
          onClose={() => setShowNotification(false)}
          onMarkAsRead={handleMarkNotifRead}
          onMarkAllAsRead={handleMarkAllNotifsRead}
          onClearNotification={handleClearNotif}
          onNavigateTab={(tab) => setActiveTab(tab)}
        />
      )}

      {showProfile && (
        <UserProfile
          userProfile={currentUser}
          onClose={() => setShowProfile(false)}
          onSaveProfile={handleSaveProfile}
        />
      )}

      {showProjectModal && (
        <ProjectModal
          isOpen={showProjectModal}
          onClose={() => setShowProjectModal(false)}
          onAddProject={handleAddProject}
        />
      )}

    </div>
  );
}
