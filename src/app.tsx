import React, { useState, useEffect } from 'react';
import {
  Project,
  Worker,
  ExpenseItem,
  SitePriorityItem,
  PayrollEntry,
  NotificationItem,
  UserProfile as UserProfileType,
  CustomDomainConfig,
  CompanySettings,
  AttendanceRecord as AttendanceRecordType,
  CashAdvance,
  AttendanceStatus,
  TaskStatus,
} from './types';
import {
  DEFAULT_PROJECTS,
  DEFAULT_WORKERS,
  DEFAULT_EXPENSES,
  DEFAULT_PRIORITIES,
  DEFAULT_PAYROLL,
  DEFAULT_NOTIFICATIONS,
  DEFAULT_USERS,
  DEFAULT_COMPANY,
  DEFAULT_CUSTOM_DOMAIN,
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
import { ReportsView } from './components/ReportsView';
import { CompletedProjectsView } from './components/CompletedProjectsView';
import { ReceiptScannerModal as ReceiptScanner } from './components/ReceiptScanner';
import { NotificationModal as Notification } from './components/Notification';
import { UserProfileModal as UserProfile } from './components/UserProfile';
import { CustomDomain } from './components/CustomDomain';
import { SoftwareGuideModal as SoftwareGuide } from './components/SoftwareGuide';
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
    return getInitialData<UserProfileType | null>('4ace_current_user', DEFAULT_USERS[0]);
  });
  const [users, setUsers] = useState<UserProfileType[]>(() =>
    getInitialData('4ace_users', DEFAULT_USERS)
  );
  const [company, setCompany] = useState<CompanySettings>(() =>
    getInitialData('4ace_company', DEFAULT_COMPANY)
  );

  // App Navigation & Loading State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isLoadingApp, setIsLoadingApp] = useState(true);

  // Core Data Stores
  const [projects, setProjects] = useState<Project[]>(() =>
    getInitialData('4ace_projects', DEFAULT_PROJECTS)
  );
  const [currentProjectId, setCurrentProjectId] = useState<string>(() => {
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
  const [expenses, setExpenses] = useState<ExpenseItem[]>(() =>
    getInitialData('4ace_expenses', DEFAULT_EXPENSES)
  );
  const [priorities, setPriorities] = useState<SitePriorityItem[]>(() =>
    getInitialData('4ace_priorities', DEFAULT_PRIORITIES)
  );
  const [payroll, setPayroll] = useState<PayrollEntry[]>(() =>
    getInitialData('4ace_payroll', DEFAULT_PAYROLL)
  );
  const [notifications, setNotifications] = useState<NotificationItem[]>(() =>
    getInitialData('4ace_notifications', DEFAULT_NOTIFICATIONS)
  );
  const [domainConfig, setDomainConfig] = useState<CustomDomainConfig>(() =>
    getInitialData('4ace_domain', DEFAULT_CUSTOM_DOMAIN)
  );

  // Modal Control States
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showDomain, setShowDomain] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // App initialization timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoadingApp(false);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  // Sync to LocalStorage on updates
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('4ace_current_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('4ace_current_user');
      }
    } catch {}
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem('4ace_users', JSON.stringify(users));
    } catch {}
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem('4ace_projects', JSON.stringify(projects));
    } catch {}
  }, [projects]);

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
      localStorage.setItem('4ace_expenses', JSON.stringify(expenses));
    } catch {}
  }, [expenses]);

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

  useEffect(() => {
    try {
      localStorage.setItem('4ace_notifications', JSON.stringify(notifications));
    } catch {}
  }, [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem('4ace_domain', JSON.stringify(domainConfig));
    } catch {}
  }, [domainConfig]);

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
    setCurrentUser(prof);
    setUsers((prev) => prev.map((u) => (u.id === prof.id ? prof : u)));
  };

  const handleCreateUser = (newUser: UserProfileType) => {
    setUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);
  };

  const handleSaveDomain = (domain: string) => {
    setDomainConfig((prev) => ({
      ...prev,
      domain,
      configured: true,
      verified: true,
    }));
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

  // If user is not logged in, render LoginScreen
  if (!currentUser) {
    return (
      <LoginScreen
        users={users}
        onLogin={(user) => setCurrentUser(user)}
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
      {/* Top Application Navbar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        currentUser={currentUser}
        allUsers={users}
        projects={projects}
        activeProjectId={activeProject.id}
        onSelectProject={(id) => setCurrentProjectId(id)}
        company={company}
        notifications={notifications}
        onOpenNotifications={() => setShowNotification(true)}
        onOpenProfileModal={() => setShowProfile(true)}
        onOpenReceiptScanner={() => setShowScanner(true)}
        onOpenNewProject={() => setShowProjectModal(true)}
        onOpenGuideModal={() => setShowGuide(true)}
        onOpenDomainModal={() => setShowDomain(true)}
        onLogout={() => setCurrentUser(null)}
        pendingPrioritiesCount={pendingPrioritiesCount}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            activeProject={activeProject}
            allProjects={projects}
            expenses={expenses}
            workers={workers}
            attendance={attendance}
            cashAdvances={cashAdvances}
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
            workers={workers}
            payroll={payroll}
            cashAdvances={cashAdvances}
            onAddCashAdvance={handleAddCashAdvance}
            onDeleteCashAdvance={handleDeleteCashAdvance}
            onToggleCashAdvanceStatus={handleToggleCashAdvanceStatus}
            onUpdatePayrollEntry={handleUpdatePayrollEntry}
            onMarkAllPaid={handleMarkAllPayrollPaid}
            onLogAttendanceClick={() => setShowAttendanceModal(true)}
            onPostLaborExpense={handlePostLaborExpense}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesView
            currentProject={activeProject}
            expenses={expenses}
            onAddExpense={handleAddExpense}
            onUpdateExpenseStatus={handleUpdateExpenseStatus}
            onDeleteExpense={handleDeleteExpense}
            onOpenReceiptScanner={() => setShowScanner(true)}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            currentProject={activeProject}
            expenses={expenses}
            payroll={payroll}
            priorities={priorities}
            onCompleteProject={handleCompleteProject}
          />
        )}

        {activeTab === 'archive' && (
          <CompletedProjectsView
            projects={projects}
            expenses={expenses}
            payroll={payroll}
            onReopenProject={handleReopenProject}
            onCancelProject={handleCancelProject}
            onSelectProjectForReports={handleSelectProjectForReports}
          />
        )}
      </main>

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
            <button
              onClick={() => setShowGuide(true)}
              className="text-slate-300 hover:text-white cursor-pointer"
            >
              User Guide
            </button>
            <button
              onClick={() => setShowDomain(true)}
              className="text-slate-300 hover:text-white cursor-pointer"
            >
              Domain Config
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

      {showDomain && (
        <CustomDomain
          config={domainConfig}
          onClose={() => setShowDomain(false)}
          onSaveDomain={handleSaveDomain}
        />
      )}

      {showGuide && (
        <SoftwareGuide onClose={() => setShowGuide(false)} />
      )}
    </div>
  );
}
