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
  Archive,
  DownloadCloud,
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

  // Filter out completed and cancelled projects from active site selector
  const activeProjects = projects.filter(
    (p) => p.status !== 'Completed' && p.status !== 'Cancelled'
  );

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
    { id: 'archive', label: 'Project History', icon: Archive },
  ];

  const selectTab = (tabId: string) => {
    onSelectTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-40 border-b border-[#0d2b45] bg-[#123B5D] text-white shadow-md">
      {/* Top Application Bar */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3">
          {/* Logo and Brand */}
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

          {/* Active project selector — desktop (Shows ONLY active/in-progress sites) */}
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
              onChange={(e) => onSelectProject(e.target.value)}
              aria-label="Select Active Site"
              className="max-w-[210px] cursor-pointer truncate bg-transparent text-xs font-semibold text-white focus:outline-none"
            >
              {activeProjects.length === 0 ? (
                <option value="" className="bg-[#123B5D] text-white">
                  No Active Sites (All Archived)
                </option>
              ) : (
                activeProjects.map((project) => (
                  <option
                    key={project.id}
                    value={project.id}
                    className="bg-[#123B5D] text-white"
                  >
                    {project.name} {project.code ? `(${project.code})` : ''}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            {/* Quick Receipt Scanner shortcut */}
            <button
              onClick={onOpenReceiptScanner}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0e2e49] hover:bg-[#164063] text-teal-200 border border-[#1a4c75] text-xs font-semibold transition-colors cursor-pointer"
              title="Camera Receipt Scanner (Smart AI OCR)"
            >
              <Camera className="w-3.5 h-3.5 text-[#18A999]" />
              <span>Scan Receipt</span>
            </button>

            {/* Software Guide */}
            {onOpenGuideModal && (
              <button
                onClick={onOpenGuideModal}
                className="p-2 rounded-lg text-teal-100/70 hover:text-white hover:bg-[#0e2e49] transition-colors cursor-pointer"
                title="User Manual &amp; Guidelines"
              >
                <BookOpen className="w-4 h-4" />
              </button>
            )}

            {/* Custom Domain White-Label */}
            {onOpenDomainModal && (
              <button
                onClick={onOpenDomainModal}
                className="p-2 rounded-lg text-teal-100/70 hover:text-white hover:bg-[#0e2e49] transition-colors cursor-pointer"
                title="Custom Domain &amp; White-Label Portal"
              >
                <Globe className="w-4 h-4" />
              </button>
            )}

            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-lg text-teal-100/70 hover:text-white hover:bg-[#0e2e49] transition-colors cursor-pointer"
              title="Notifications &amp; Operations Alert Center"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#18A999] text-white font-bold text-[10px] flex items-center justify-center animate-pulse">
                  {unreadNotifCount}
                </span>
              )}
            </button>

            <PWAInstallButton />

            {/* User Profile Pill with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-[#0e2e49] hover:bg-[#164063] border border-[#1a4c75] hover:border-[#18A999]/60 transition-all text-left cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold bg-[#18A999] text-white shadow-xs">
                  {currentUser.avatarInitials}
                </div>
                <div className="hidden md:block min-w-0 max-w-[130px]">
                  <div className="text-xs font-bold text-white truncate leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-teal-300 truncate leading-tight font-medium">
                    {currentUser.role}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-teal-200/70 hidden sm:block" />
              </button>

              {/* User Dropdown Menu */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-[#123B5D] border border-[#1a4c75] rounded-xl shadow-2xl py-2 z-50 text-xs">
                  <div className="px-4 py-2 border-b border-[#1a4c75]">
                    <div className="font-bold text-white">{currentUser.name}</div>
                    <div className="text-[11px] text-teal-300">{currentUser.role}</div>
                    <div className="text-[10px] text-teal-100/60 font-mono mt-0.5">
                      User: @{currentUser.username} | {currentUser.accessLevel}
                    </div>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenProfileModal();
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-[#0e2e49] text-slate-100 flex items-center gap-2 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-[#18A999]" />
                      <span>Edit Profile / Credentials</span>
                    </button>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        selectTab('archive');
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-[#0e2e49] text-teal-300 flex items-center gap-2 cursor-pointer"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>Project History &amp; Archive</span>
                    </button>
                  </div>
                  <div className="pt-1 border-t border-[#1a4c75]">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-rose-950/60 text-rose-300 flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out Session</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-teal-100 hover:text-white cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-bar (Desktop) */}
      <div className="hidden md:block bg-[#0e2e49] border-t border-[#1a4c75]/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 py-1.5 overflow-x-auto">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#18A999] text-white font-bold shadow-xs'
                      : 'text-slate-200 hover:text-white hover:bg-[#164063]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-teal-200/70'}`} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive
                          ? 'bg-[#123B5D] text-white'
                          : 'bg-[#18A999]/30 text-teal-200 border border-[#18A999]/40'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0e2e49] border-t border-[#1a4c75] px-4 pt-2 pb-4 space-y-1">
          {/* Site Selector in Mobile (Active only) */}
          <div className="p-2 border-b border-[#1a4c75] mb-2">
            <span className="text-[10px] uppercase font-bold text-teal-200/60 block mb-1">Active Site</span>
            <select
              value={activeProjectId}
              onChange={(e) => onSelectProject(e.target.value)}
              className="w-full bg-[#123B5D] border border-[#1a4c75] text-white text-xs font-semibold rounded-lg px-2.5 py-1.5"
            >
              {activeProjects.length === 0 ? (
                <option value="">No Active Sites (All Archived)</option>
              ) : (
                activeProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#18A999] text-white font-semibold'
                    : 'text-slate-200 hover:bg-[#164063]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isActive ? 'bg-[#123B5D] text-white' : 'bg-[#18A999]/30 text-teal-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
