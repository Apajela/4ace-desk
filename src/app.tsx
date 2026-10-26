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

  // Completed Project Handler
  const handleCompleteProject = (projId: string) => {
    const target = projects.find((p) => p.id === projId);
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

  // Daily Attendance Handler
  const handleSaveAttendance = (
    date: string,
    records: Record<string, { status: AttendanceStatus; otHours: number; remarks: string }>
  ) => {
    setPayroll((prev) =>
      prev.map((entry) => {
        const att = records[entry.workerId];
        if (!att) return entry;
        let addedDays = 0;
        if (att.status === 'present' || att.status === 'overtime') addedDays = 1;
        else if (att.status === 'half_day') addedDays = 0.5;

        const newDays = Math.min(6, (entry.daysWorked || 0) + addedDays);
        const newOt = (entry.otHours || 0) + (att.otHours || 0);
        const regularPay = newDays * entry.dailyRate;
        const hourlyRate = entry.dailyRate / 8;
        const otPay = hourlyRate * 1.25 * newOt;
        const grossPay = regularPay + otPay;
        const netPay = Math.max(0, grossPay - (entry.totalDeductions || 0));
        return {
          ...entry,
          daysWorked: newDays,
          otHours: newOt,
          regularPay,
          otPay,
          grossPay,
          netPay,
        };
      })
    );

    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'Daily Attendance Synced',
      message: `Site attendance logged for ${date}. Field wages automatically synchronized into weekly payroll.`,
      type: 'attendance',
      timestamp: 'Just now',
      read: false,
      actionTab: 'payroll',
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

  // Post Prorated Labor to Project Expenses
  const handlePostLaborExpense = (amount: number, description: string) => {
    const expense: ExpenseItem = {
      id: `exp-${Date.now()}`,
      projectId: activeProject.id,
      projectName: activeProject.name,
      category: 'Labor',
      amount,
      date: new Date().toISOString().split('T')[0],
      vendor: 'Site Field Crew & Subcontractors',
      supplier: 'Weekly Field Labor Payroll',
      description,
      paymentStatus: 'Paid',
      status: 'Paid',
    };
    handleAddExpense(expense);
  };

  const isFullAccess = !!currentUser && currentUser.accessLevel === 'Full Access (Admin)';
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

      {/* Responsive workspace sidebar and active module */}
      <div className="flex-1 max-w-7xl mx-auto w-full flex flex-col md:flex-row gap-5 px-4 sm:px-6 lg:px-8 py-6">
        <aside aria-label="Main navigation" className="md:w-52 md:shrink-0">
          <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
            {[{ id: 'dashboard', label: 'Projects', icon: '▦' }, { id: 'priorities', label: 'Sites', icon: '⌖' }, { id: 'attendance', label: 'Foremen', icon: '♙' }, { id: 'payroll', label: 'Labor', icon: '₱' }].filter((item) => allowedTabs.includes(item.id)).map((item) => (
              <button key={item.id} type="button" onClick={() => setActiveTab(item.id)} aria-current={activeTab === item.id ? 'page' : undefined} className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#18A999] ${activeTab === item.id ? 'bg-[#123B5D] text-white' : 'text-[#123B5D] hover:bg-[#EAF7FA]'}`}>
                <span className="w-6 text-center text-lg" aria-hidden="true">{item.icon}</span><span>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>
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
          <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center" aria-live="polite">
            <h1 className="text-xl font-black text-[#123B5D]">Reports</h1>
            <p className="mt-2 text-sm text-slate-600">Project reports have been cleared as requested.</p>
          </section>
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
