import React, { useState } from 'react';
import {
  HardHat,
  LayoutDashboard,
  Users,
  DollarSign,
  Receipt,
  FileText,
  ListTodo,
  Bell,
  Camera,
  ChevronDown,
  LogOut,
  FolderKanban,
  Edit2,
  Menu,
  X,
  BookOpen,
  Globe,
} from 'lucide-react';
import {
  UserProfile,
  Project,
  CompanySettings,
  AppNotification,
} from '../types';
import { PWAInstallButton } from './PWAInstallButton';

export interface NavbarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  currentUser: UserProfile;
  allUsers?: UserProfile[];
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  company?: CompanySettings;
  notifications: AppNotification[];
  onOpenNotifications: () => void;
  onOpenProfileModal: () => void;
  onOpenReceiptScanner: () => void;
  onOpenNewProject?: () => void;
  onOpenGuideModal?: () => void;
  onOpenDomainModal?: () => void;
  onLogout: () => void;
  pendingPrioritiesCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  currentUser,
  projects,
  activeProjectId,
  onSelectProject,
  notifications,
  onOpenNotifications,
  onOpenProfileModal,
  onOpenReceiptScanner,
  onOpenGuideModal,
  onOpenDomainModal,
  onLogout,
  pendingPrioritiesCount,
}) => {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const unreadNotifCount = notifications.filter((notification) => !notification.read).length;

  const navLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'priorities',
      label: "Today's Priorities",
      icon: ListTodo,
      badge: pendingPrioritiesCount,
    },
    { id: 'attendance', label: 'Crew & Attendance', icon: Users },
    { id: 'payroll', label: 'Weekly Payroll', icon: DollarSign },
    { id: 'expenses', label: 'Expenses & Ledger', icon: Receipt },
    { id: 'reports', label: 'Reports & Costing', icon: FileText },
  ];

  const selectTab = (tabId: string) => {
    onSelectTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-40 border-b border-[#0d2b45] bg-[#123B5D] text-white shadow-md">
      {/* Top application bar */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3">
          {/* Logo and brand */}
          <button
            type="button"
            onClick={() => selectTab('dashboard')}
            aria-label="Go to Dashboard"
            className="flex min-w-0 flex-shrink-0 cursor-pointer items-center gap-3 text-left transition-opacity hover:opacity-95"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#18A999] text-white shadow-md shadow-teal-900/30">
              <HardHat className="h-6 w-6" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-2">
                <span className="text-base font-black tracking-tight text-white sm:text-lg">
                  4Ace Desk
                </span>
                <span className="hidden rounded border border-[#18A999]/30 bg-[#18A999]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#a2f0e7] sm:inline-block">
                  EMS
                </span>
              </span>
              <span className="hidden text-[11px] font-medium text-teal-100/70 md:block">
                Project Site Management &amp; Labor Workstation
              </span>
            </span>
          </button>

          {/* Active project selector — desktop */}
          <div className="hidden items-center gap-2 rounded-xl border border-[#1a4c75] bg-[#0e2e49] px-3 py-1.5 lg:flex">
            <FolderKanban
              className="h-4 w-4 flex-shrink-0 text-[#18A999]"
              aria-hidden="true"
            />
            <label htmlFor="desktop-project-select" className="text-xs font-medium text-teal-100/70">
              Site:
            </label>
            <select
              id="desktop-project-select"
              value={activeProjectId}
              onChange={(event) => onSelectProject(event.target.value)}
              aria-label="Select Site"
              className="max-w-[200px] cursor-pointer truncate bg-transparent text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-[#18A999]"
            >
              {projects.map((project) => (
                <option
                  key={project.id}
                  value={project.id}
                  className="bg-[#123B5D] text-white"
                >
                  {project.name} {project.code ? `(${project.code})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Right action controls */}
          <div className="flex flex-shrink-0 items-center gap-1.5 sm:gap-2">
            {/* Receipt scanner */}
            <button
              type="button"
              onClick={onOpenReceiptScanner}
              className="hidden cursor-pointer items-center gap-1.5 rounded-lg border border-[#1a4c75] bg-[#0e2e49] px-3 py-1.5 text-xs font-semibold text-teal-200 transition-colors hover:bg-[#164063] sm:flex"
              title="Camera Receipt Scanner (Smart AI OCR)"
              aria-label="Scan Receipt"
            >
              <Camera className="h-3.5 w-3.5 text-[#18A999]" aria-hidden="true" />
              <span>Scan Receipt</span>
            </button>

            {/* User guide */}
            {onOpenGuideModal && (
              <button
                type="button"
                onClick={onOpenGuideModal}
                className="cursor-pointer rounded-lg p-2 text-teal-100/70 transition-colors hover:bg-[#0e2e49] hover:text-white"
                title="User Manual & Guidelines"
                aria-label="Open User Manual and Guidelines"
              >
                <BookOpen className="h-4 w-4" aria-hidden="true" />
              </button>
            )}

            {/* Custom domain settings */}
            {onOpenDomainModal && (
              <button
                type="button"
                onClick={onOpenDomainModal}
                className="cursor-pointer rounded-lg p-2 text-teal-100/70 transition-colors hover:bg-[#0e2e49] hover:text-white"
                title="Custom Domain & White-Label Portal"
                aria-label="Open Custom Domain settings"
              >
                <Globe className="h-4 w-4" aria-hidden="true" />
              </button>
            )}

            {/* Notifications */}
            <button
              type="button"
              onClick={onOpenNotifications}
              className="relative cursor-pointer rounded-lg p-2 text-teal-100/70 transition-colors hover:bg-[#0e2e49] hover:text-white"
              title="Notifications & Operations Alert Center"
              aria-label={`Notifications${unreadNotifCount > 0 ? `, ${unreadNotifCount} unread` : ''}`}
            >
              <Bell className="h-4 w-4" aria-hidden="true" />
              {unreadNotifCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#18A999] px-1 text-[10px] font-bold text-white">
                  {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                </span>
              )}
            </button>

            <PWAInstallButton />

            {/* User profile dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen((isOpen) => !isOpen)}
                aria-expanded={userDropdownOpen}
                aria-haspopup="menu"
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#1a4c75] bg-[#0e2e49] p-1.5 text-left transition-all hover:border-[#18A999]/60 hover:bg-[#164063] sm:px-3 sm:py-1.5"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#18A999] text-xs font-bold text-white shadow-sm">
                  {currentUser.avatarInitials}
                </span>
                <span className="hidden min-w-0 max-w-[130px] md:block">
                  <span className="block truncate text-xs font-bold leading-tight text-white">
                    {currentUser.name}
                  </span>
                  <span className="block truncate text-[10px] font-medium leading-tight text-teal-300">
                    {currentUser.role}
                  </span>
                </span>
                <ChevronDown
                  className="hidden h-3.5 w-3.5 text-teal-200/70 sm:block"
                  aria-hidden="true"
                />
              </button>

              {userDropdownOpen && (
                <div
                  role="menu"
                  className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-[#1a4c75] bg-[#123B5D] py-2 text-xs shadow-2xl"
                >
                  <div className="border-b border-[#1a4c75] px-4 py-2">
                    <div className="font-bold text-white">{currentUser.name}</div>
                    <div className="text-[11px] text-teal-300">{currentUser.role}</div>
                    <div className="mt-0.5 font-mono text-[10px] text-teal-100/60">
                      User: @{currentUser.username} | {currentUser.accessLevel}
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenProfileModal();
                      }}
                      className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left text-slate-100 hover:bg-[#0e2e49]"
                    >
                      <Edit2 className="h-3.5 w-3.5 text-[#18A999]" aria-hidden="true" />
                      <span>Edit Profile / License</span>
                    </button>
                  </div>

                  <div className="border-t border-[#1a4c75] pt-1">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onLogout();
                      }}
                      className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left text-rose-300 hover:bg-rose-950/60"
                    >
                      <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Log Out Session</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((isOpen) => !isOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="cursor-pointer rounded-lg p-2 text-teal-100 transition-colors hover:bg-[#0e2e49] hover:text-white md:hidden"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop navigation */}
      <div className="hidden border-t border-[#1a4c75]/80 bg-[#0e2e49] md:block">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav
            aria-label="Main navigation"
            className="flex space-x-1 overflow-x-auto py-1.5"
          >
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => selectTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-[#18A999] font-bold text-white shadow-sm'
                      : 'text-slate-200 hover:bg-[#164063] hover:text-white'
                  }`}
                >
                  <Icon
                    className={`h-3.5 w-3.5 ${
                      isActive ? 'text-white' : 'text-teal-200/70'
                    }`}
                    aria-hidden="true"
                  />
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                        isActive
                          ? 'bg-[#123B5D] text-white'
                          : 'border border-[#18A999]/40 bg-[#18A999]/30 text-teal-200'
                      }`}
                    >
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <div className="space-y-1 border-t border-[#1a4c75] bg-[#0e2e49] px-4 pb-4 pt-2 md:hidden">
          <div className="mb-2 border-b border-[#1a4c75] p-2">
            <label
              htmlFor="mobile-project-select"
              className="mb-1 block text-[10px] font-bold uppercase text-teal-200/60"
            >
              Active Site
            </label>
            <select
              id="mobile-project-select"
              value={activeProjectId}
              onChange={(event) => onSelectProject(event.target.value)}
              className="w-full cursor-pointer rounded-lg border border-[#1a4c75] bg-[#123B5D] px-2.5 py-1.5 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-[#18A999]"
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Mobile receipt scanner shortcut */}
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenReceiptScanner();
            }}
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-slate-200 hover:bg-[#164063]"
          >
            <Camera className="h-4 w-4 text-teal-200" aria-hidden="true" />
            <span>Scan Receipt</span>
          </button>

          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                type="button"
                key={item.id}
                onClick={() => selectTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#18A999] font-semibold text-white'
                    : 'text-slate-200 hover:bg-[#164063]'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{item.label}</span>
                </span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      isActive
                        ? 'bg-[#123B5D] text-white'
                        : 'bg-[#18A999]/30 text-teal-200'
                    }`}
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {onOpenGuideModal && (
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenGuideModal();
              }}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-medium text-slate-200 hover:bg-[#164063]"
            >
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              <span>User Manual & Guidelines</span>
            </button>
          )}

          {onOpenDomainModal && (
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenDomainModal();
              }}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-medium text-slate-200 hover:bg-[#164063]"
            >
              <Globe className="h-4 w-4" aria-hidden="true" />
              <span>Custom Domain & White-Label Portal</span>
            </button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
