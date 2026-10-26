import React, { useState } from 'react';
import { AttendanceStatus, DailyAttendanceRecord, Worker } from '../types';
import { AttendanceStatusBadge, INITIAL_Attendance_Status_List } from './AttendanceStatus';
import {
  Calendar,
  Clock,
  UserCheck,
  UserX,
  Printer,
  Search,
  Filter,
  ShieldCheck,
  X,
  Save,
  Users,
  UserPlus,
  Pencil,
  Trash2,
  Phone,
  AlertTriangle,
  Building,
} from 'lucide-react';
import { INITIAL_Attendance_Records } from '../data/mockData';

export interface AttendanceRecordProps {
  records?: DailyAttendanceRecord[];
  onUpdateRecord?: (record: DailyAttendanceRecord) => void;
  projectName?: string;
  workers?: Worker[];
  projects?: { id: string; name: string }[];
  onSaveAttendance?: (
    date: string,
    records: Record<string, { status: AttendanceStatus; otHours: number; remarks: string }>
  ) => void;
  onClose?: () => void;
  onAddWorker?: (newWorker: Omit<Worker, 'id'>) => void;
  onEditWorker?: (worker: Worker) => void;
  onDeleteWorker?: (workerId: string) => void;
}

const COMMON_ROLES = [
  'General Foreman',
  'Lead Mason',
  'Finishing Mason',
  'Master Carpenter',
  'Rough Carpenter',
  'Lead Electrician',
  'Master Plumber',
  'Steelman / Rebar Fabricator',
  'Tile Setter',
  'Welder / Metal Fabricator',
  'Painter',
  'Safety Officer',
  'Skilled Laborer',
  'General Laborer / Helper',
];

export const AttendanceRecord: React.FC<AttendanceRecordProps> = ({
  records = INITIAL_Attendance_Records,
  onUpdateRecord,
  projectName = 'Residential Renovation',
  workers = [],
  projects = [],
  onSaveAttendance,
  onClose,
  onAddWorker,
  onEditWorker,
  onDeleteWorker,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'attendance' | 'crew'>('attendance');
  const [data, setData] = useState<DailyAttendanceRecord[]>(records);
  const [filterDate, setFilterDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Worker Modal States
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [workerName, setWorkerName] = useState('');
  const [workerRole, setWorkerRole] = useState('Lead Mason');
  const [workerDailyRate, setWorkerDailyRate] = useState<number>(750);
  const [workerPhone, setWorkerPhone] = useState('+63 917 ');
  const [workerUsername, setWorkerUsername] = useState('');
  const [workerPassword, setWorkerPassword] = useState('');
  const [workerProject, setWorkerProject] = useState(projects[0]?.id || 'proj-1');
  const [workerStatus, setWorkerStatus] = useState<'Active' | 'Inactive'>('Active');
  const [workerToDelete, setWorkerToDelete] = useState<Worker | null>(null);

  React.useEffect(() => {
    if (workers && workers.length > 0) {
      const existingWorkerIds = new Set(data.map((r) => r.workerId));
      const missing = workers
        .filter((w) => !existingWorkerIds.has(w.id))
        .map((w, idx) => ({
          id: `att-gen-${w.id}-${Date.now() + idx}`,
          workerId: w.id,
          workerName: w.name,
          trade: w.role,
          dailyRate: w.dailyRate,
          projectId: w.assignedProject || 'proj-1',
          date: filterDate,
          timeIn: '07:00 AM',
          timeOut: '05:00 PM',
          status: 'present' as AttendanceStatus,
          hoursWorked: 8,
          overtimeHours: 0,
          otHours: 0,
          dailyWage: w.dailyRate,
          notes: 'Standard shift',
          remarks: 'Standard shift',
          verifiedBy: 'Site In-Charge',
        }));
      if (missing.length > 0) {
        setData((prev) => [...prev, ...missing]);
      }
    }
  }, [workers, filterDate]);

  const filteredAttendance = data.filter((item) => {
    if (filterDate && item.date && item.date !== filterDate) return false;
    if (filterStatus !== 'all') {
      const s = String(item.status).toLowerCase();
      if (filterStatus === 'present' && s !== 'present' && s !== 'overtime') return false;
      if (filterStatus === 'overtime' && s !== 'overtime') return false;
      if (filterStatus === 'half_day' && s !== 'half day' && s !== 'half_day') return false;
      if (filterStatus === 'absent' && s !== 'absent') return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.workerName.toLowerCase().includes(q);
      const matchTrade = (item.trade || '').toLowerCase().includes(q);
      const matchRemarks = (item.remarks || item.notes || '').toLowerCase().includes(q);
      if (!matchName && !matchTrade && !matchRemarks) return false;
    }
    return true;
  });

  const filteredCrew = workers.filter((w) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      w.name.toLowerCase().includes(q) ||
      w.role.toLowerCase().includes(q) ||
      (w.phone && w.phone.toLowerCase().includes(q))
    );
  });

  const presentCount = data.filter((r) => {
    const s = String(r.status).toLowerCase();
    return s === 'present' || s === 'overtime';
  }).length;
  const otTotalHours = data.reduce((sum, r) => sum + (r.otHours ?? r.overtimeHours ?? 0), 0);
  const halfDayCount = data.filter((r) => {
    const s = String(r.status).toLowerCase();
    return s === 'half day' || s === 'half_day';
  }).length;
  const absentCount = data.filter((r) => String(r.status).toLowerCase() === 'absent').length;

  const handleStatusChange = (id: string, newStatus: AttendanceStatus) => {
    const updated = data.map((r) => (r.id === id ? { ...r, status: newStatus } : r));
    setData(updated);
    const item = updated.find((r) => r.id === id);
    if (item && onUpdateRecord) {
      onUpdateRecord(item);
    }
  };

  const handleOtChange = (id: string, otHours: number) => {
    const hours = Math.max(0, otHours);
    const updated = data.map((r) => (r.id === id ? { ...r, otHours: hours, overtimeHours: hours } : r));
    setData(updated);
    const item = updated.find((r) => r.id === id);
    if (item && onUpdateRecord) {
      onUpdateRecord(item);
    }
  };

  const handleBatchSave = () => {
    if (onSaveAttendance) {
      const recordsMap: Record<string, { status: AttendanceStatus; otHours: number; remarks: string }> = {};
      data.forEach((r) => {
        let normalizedStatus: AttendanceStatus = 'present';
        const s = String(r.status).toLowerCase();
        if (s === 'overtime') normalizedStatus = 'overtime';
        else if (s.includes('half')) normalizedStatus = 'half_day';
        else if (s === 'absent') normalizedStatus = 'absent';

        recordsMap[r.workerId] = {
          status: normalizedStatus,
          otHours: r.otHours || r.overtimeHours || 0,
          remarks: r.remarks || r.notes || '',
        };
      });
      onSaveAttendance(filterDate, recordsMap);
    }
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      if (onClose) onClose();
    }, 1000);
  };

  // Open modal to add worker
  const handleOpenAddModal = () => {
    setEditingWorker(null);
    setWorkerName('');
    setWorkerRole('Lead Mason');
    setWorkerDailyRate(750);
    setWorkerPhone('+63 917 ');
    setWorkerUsername(''); setWorkerPassword('');
    setWorkerProject(projects[0]?.id || 'proj-1');
    setWorkerStatus('Active');
    setShowWorkerModal(true);
  };

  // Open modal to edit worker
  const handleOpenEditModal = (worker: Worker) => {
    setEditingWorker(worker);
    setWorkerName(worker.name);
    setWorkerRole(worker.role);
    setWorkerDailyRate(worker.dailyRate);
    setWorkerPhone(worker.phone || '+63 917 ');
    setWorkerUsername(worker.username || ''); setWorkerPassword(worker.password || '');
    setWorkerProject(worker.assignedProject || projects[0]?.id || 'proj-1');
    setWorkerStatus(worker.status);
    setShowWorkerModal(true);
  };

  // Save worker (add or edit)
  const handleSaveWorkerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerName.trim()) return;

    if (editingWorker) {
      const updated: Worker = {
        ...editingWorker,
        name: workerName.trim(),
        role: workerRole.trim(),
        dailyRate: Number(workerDailyRate) || 700,
        phone: workerPhone.trim(),
        username: workerUsername.trim(), password: workerPassword || undefined,
        assignedProject: workerProject,
        status: workerStatus,
      };
      if (onEditWorker) {
        onEditWorker(updated);
      }
      // Also update attendance data workerName & dailyRate
      setData((prev) =>
        prev.map((r) =>
          r.workerId === updated.id
            ? { ...r, workerName: updated.name, trade: updated.role, dailyRate: updated.dailyRate }
            : r
        )
      );
    } else {
      const newWorker: Omit<Worker, 'id'> = {
        name: workerName.trim(),
        role: workerRole.trim(),
        dailyRate: Number(workerDailyRate) || 700,
        phone: workerPhone.trim(),
        username: workerUsername.trim(), password: workerPassword || undefined,
        assignedProject: workerProject,
        status: workerStatus,
      };
      if (onAddWorker) {
        onAddWorker(newWorker);
      }
    }

    setShowWorkerModal(false);
  };

  // Delete worker confirm
  const handleConfirmDelete = () => {
    if (workerToDelete) {
      if (onDeleteWorker) {
        onDeleteWorker(workerToDelete.id);
      }
      setData((prev) => prev.filter((r) => r.workerId !== workerToDelete.id));
      setWorkerToDelete(null);
    }
  };

  const content = (
    <div className="space-y-5 text-[#263238]">
      {/* Top Banner - Navy #123B5D */}
      <div className="bg-[#123B5D] text-white p-5 sm:p-6 rounded-3xl shadow-sm border border-[#0d2b45] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-300">
              Site Manpower &amp; Labor Masterlist
            </span>
            <span className="text-xs text-teal-100/50">|</span>
            <span className="text-xs text-teal-100/80 font-mono">Real-Time Crew Roster</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
            Site Crew Labor &amp; Attendance Management
          </h2>
          <p className="text-xs text-teal-100/70 mt-0.5">
            Project: <strong className="text-white">{projectName}</strong> | Active Crew: <strong className="text-white">{workers.length} Personnel</strong>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-[#18A999] hover:bg-[#148f81] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add Crew Member</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-[#0e2e49] hover:bg-[#164063] text-teal-100 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-[#1a4c75] transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#18A999]" />
            <span>Print Sheet</span>
          </button>
          {onSaveAttendance && activeSubTab === 'attendance' && (
            <button
              onClick={handleBatchSave}
              className="px-4 py-2 bg-[#18A999] hover:bg-[#148f81] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>{savedSuccess ? 'Saved to Payroll!' : 'Save & Sync'}</span>
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-teal-200 hover:text-white rounded-xl bg-[#0e2e49] hover:bg-[#164063] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#EAF7FA] p-2 rounded-2xl border border-[#cbeaf0]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('attendance')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'attendance'
                ? 'bg-white text-[#123B5D] shadow-xs'
                : 'text-[#263238]/70 hover:text-[#123B5D]'
            }`}
          >
            <Clock className="w-4 h-4 text-[#18A999]" />
            <span>Daily Attendance Sheet</span>
          </button>
          <button
            onClick={() => setActiveSubTab('crew')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'crew'
                ? 'bg-white text-[#123B5D] shadow-xs'
                : 'text-[#263238]/70 hover:text-[#123B5D]'
            }`}
          >
            <Users className="w-4 h-4 text-[#18A999]" />
            <span>Crew / Labor Masterlist ({workers.length})</span>
          </button>
        </div>

        <div className="text-xs text-[#123B5D] font-semibold px-2">
          {activeSubTab === 'attendance' ? (
            <span>Logging for date: <strong className="text-[#18A999]">{filterDate}</strong></span>
          ) : (
            <span>Total Registered Personnel: <strong className="text-[#18A999]">{workers.length}</strong></span>
          )}
        </div>
      </div>

      {/* KPI Cards - Only on Attendance tab */}
      {activeSubTab === 'attendance' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="bg-white p-4 rounded-2xl border border-[#cbeaf0] shadow-xs">
            <div className="flex items-center justify-between text-[#546e7a] text-xs font-semibold">
              <span>Present On-Site</span>
              <div className="w-7 h-7 rounded-lg bg-[#EAF7FA] flex items-center justify-center text-[#18A999]">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-[#123B5D] mt-1 font-mono">
              {presentCount} Workers
            </div>
            <div className="text-[10px] text-[#546e7a] mt-0.5">Full day regular shift</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#cbeaf0] shadow-xs">
            <div className="flex items-center justify-between text-[#546e7a] text-xs font-semibold">
              <span>Total OT Hours</span>
              <div className="w-7 h-7 rounded-lg bg-[#EAF7FA] flex items-center justify-center text-[#123B5D]">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-[#123B5D] mt-1 font-mono">
              {otTotalHours} Hours
            </div>
            <div className="text-[10px] text-[#18A999] font-medium mt-0.5">125% regular overtime rate</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#cbeaf0] shadow-xs">
            <div className="flex items-center justify-between text-[#546e7a] text-xs font-semibold">
              <span>Half Day (4 hrs)</span>
              <div className="w-7 h-7 rounded-lg bg-[#EAF7FA] flex items-center justify-center text-amber-500">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-[#123B5D] mt-1 font-mono">
              {halfDayCount}
            </div>
            <div className="text-[10px] text-[#546e7a] mt-0.5">0.5 daily wage multiplier</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#cbeaf0] shadow-xs">
            <div className="flex items-center justify-between text-[#546e7a] text-xs font-semibold">
              <span>Absent / Off</span>
              <div className="w-7 h-7 rounded-lg bg-[#EAF7FA] flex items-center justify-center text-rose-500">
                <UserX className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-rose-600 mt-1 font-mono">
              {absentCount}
            </div>
            <div className="text-[10px] text-rose-500 mt-0.5">No work, no pay standard</div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-[#EAF7FA] p-3.5 rounded-2xl border border-[#cbeaf0] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#546e7a]" />
          <input
            type="text"
            placeholder={activeSubTab === 'attendance' ? "Search worker name, trade or remarks..." : "Search crew member by name, trade or phone..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-white border border-[#cbeaf0] rounded-xl font-medium text-[#263238] placeholder-slate-400 focus:outline-none focus:border-[#18A999]"
          />
        </div>

        {activeSubTab === 'attendance' && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <div className="flex items-center gap-1.5 text-[#546e7a] shrink-0">
              <Calendar className="w-3.5 h-3.5 text-[#18A999]" />
              <span>Date:</span>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="bg-white border border-[#cbeaf0] rounded-xl px-2.5 py-1 font-semibold text-[#123B5D]"
              />
            </div>

            <div className="flex items-center gap-1 text-[#546e7a] shrink-0">
              <Filter className="w-3.5 h-3.5 text-[#18A999]" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-white border border-[#cbeaf0] rounded-xl px-2.5 py-1 font-semibold text-[#123B5D] cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="present">Present (Full Day)</option>
                <option value="overtime">Overtime Shift</option>
                <option value="half_day">Half Day</option>
                <option value="absent">Absent</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Tab 1: Attendance Table */}
      {activeSubTab === 'attendance' && (
        <div className="bg-white rounded-2xl border border-[#cbeaf0] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#EAF7FA] text-[#123B5D] font-bold uppercase tracking-wider border-b border-[#cbeaf0]">
                <tr>
                  <th className="py-3 px-3.5">Worker Name</th>
                  <th className="py-3 px-3">Trade &amp; Rate</th>
                  <th className="py-3 px-3 text-center">Time In</th>
                  <th className="py-3 px-3 text-center">Time Out</th>
                  <th className="py-3 px-3 text-center">OT Hrs</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3">Remarks / Scope</th>
                  <th className="py-3 px-3">Verified By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAttendance.map((item) => {
                  const normalizedStatus = (String(item.status).toLowerCase() === 'overtime'
                    ? 'overtime'
                    : String(item.status).toLowerCase().includes('half')
                    ? 'half_day'
                    : String(item.status).toLowerCase() === 'absent'
                    ? 'absent'
                    : 'present') as AttendanceStatus;

                  return (
                    <tr key={item.id} className="hover:bg-[#EAF7FA]/30 transition-colors">
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-[#123B5D]">{item.workerName}</div>
                        <div className="text-[10px] text-[#546e7a] font-mono">ID: {item.workerId}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-[#263238]">{item.trade || 'Worker'}</div>
                        <div className="text-[11px] text-[#546e7a] font-mono">₱{item.dailyRate}/day</div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-[#546e7a] whitespace-nowrap">
                        {item.timeIn || '07:00 AM'}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-[#546e7a] whitespace-nowrap">
                        {item.timeOut || '05:00 PM'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <input
                          type="number"
                          min={0}
                          max={8}
                          step={0.5}
                          value={item.otHours ?? item.overtimeHours ?? 0}
                          onChange={(e) => handleOtChange(item.id, Number(e.target.value))}
                          className="w-14 px-1 py-0.5 border border-[#cbeaf0] rounded-lg text-center font-bold text-[#123B5D] focus:outline-none focus:border-[#18A999]"
                        />
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <select
                          value={normalizedStatus}
                          onChange={(e) => handleStatusChange(item.id, e.target.value as AttendanceStatus)}
                          className={`text-[10px] font-extrabold uppercase px-2 py-1 rounded-full border cursor-pointer focus:outline-none ${
                            normalizedStatus === 'present'
                              ? 'bg-[#EAF7FA] text-[#0d786d] border-[#bce6ed]'
                              : normalizedStatus === 'overtime'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : normalizedStatus === 'half_day'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}
                        >
                          {INITIAL_Attendance_Status_List.map((cfg) => (
                            <option key={cfg.id} value={cfg.id} className="bg-white text-slate-800 font-bold normal-case">
                              {cfg.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-3 text-[#546e7a] text-[11px] max-w-[220px]">
                        {item.remarks || item.notes || 'Routine structural work'}
                      </td>
                      <td className="py-3 px-3 text-[#546e7a] text-[11px] whitespace-nowrap">
                        <span className="flex items-center gap-1 font-semibold text-[#123B5D]">
                          <span>{item.verifiedBy || 'Site In-Charge'}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Crew / Labor Masterlist Table (with Add, Edit, Delete) */}
      {activeSubTab === 'crew' && (
        <div className="bg-white rounded-2xl border border-[#cbeaf0] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#EAF7FA] text-[#123B5D] font-bold uppercase tracking-wider border-b border-[#cbeaf0]">
                <tr>
                  <th className="py-3 px-4">Crew Personnel</th>
                  <th className="py-3 px-3">Trade / Role</th>
                  <th className="py-3 px-3">Daily Wage Rate</th>
                  <th className="py-3 px-3">Contact Phone</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCrew.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      No crew members found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredCrew.map((worker) => (
                    <tr key={worker.id} className="hover:bg-[#EAF7FA]/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#123B5D] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                            {worker.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-[#123B5D] text-sm">{worker.name}</div>
                            <div className="text-[10px] text-[#546e7a] font-mono">ID: {worker.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold bg-[#EAF7FA] text-[#123B5D] border border-[#cbeaf0]">
                          {worker.role}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-[#123B5D] text-sm">
                        ₱{Number(worker.dailyRate).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        <span className="text-[10px] text-[#546e7a] font-normal"> /day</span>
                      </td>
                      <td className="py-3 px-3 text-[#263238] font-mono text-xs">
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-[#18A999]" />
                          <span>{worker.phone || 'N/A'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            worker.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {worker.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEditModal(worker)}
                            className="p-1.5 rounded-lg border border-slate-200 text-[#123B5D] hover:bg-[#EAF7FA] hover:border-[#18A999] transition-colors cursor-pointer"
                            title="Edit Crew Member"
                          >
                            <Pencil className="w-4 h-4 text-[#18A999]" />
                          </button>
                          <button
                            onClick={() => setWorkerToDelete(worker)}
                            className="p-1.5 rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-colors cursor-pointer"
                            title="Delete Crew Member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Worker Modal */}
      {showWorkerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-[#0d2b45] flex items-center justify-between bg-[#123B5D] text-white">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#18A999]" />
                <h3 className="text-sm font-bold">
                  {editingWorker ? 'Edit Crew / Laborer Profile' : 'Register New Crew / Laborer'}
                </h3>
              </div>
              <button
                onClick={() => setShowWorkerModal(false)}
                className="text-teal-200 hover:text-white p-1 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWorkerSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#123B5D] mb-1">
                  Full Name of Worker / Laborer *
                </label>
                <input
                  type="text"
                  required
                  value={workerName}
                  onChange={(e) => setWorkerName(e.target.value)}
                  placeholder="e.g. Danilo 'Jun' Ramos"
                  className="w-full px-3 py-2 border border-[#cbeaf0] rounded-xl text-[#263238] focus:outline-none focus:border-[#18A999]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#123B5D] mb-1">Trade / Role *</label>
                  <select
                    value={workerRole}
                    onChange={(e) => setWorkerRole(e.target.value)}
                    className="w-full px-3 py-2 border border-[#cbeaf0] rounded-xl text-[#263238] bg-white focus:outline-none focus:border-[#18A999]"
                  >
                    {COMMON_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                    {!COMMON_ROLES.includes(workerRole) && (
                      <option value={workerRole}>{workerRole}</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#123B5D] mb-1">Daily Wage Rate (₱) *</label>
                  <input
                    type="number"
                    required
                    min={350}
                    step={10}
                    value={workerDailyRate}
                    onChange={(e) => setWorkerDailyRate(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#cbeaf0] rounded-xl font-mono font-bold text-[#123B5D] focus:outline-none focus:border-[#18A999]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><label className="block font-semibold text-[#123B5D] mb-1">Login Username</label><input type="text" autoComplete="username" value={workerUsername} onChange={(e) => setWorkerUsername(e.target.value)} placeholder="Optional login username" className="w-full px-3 py-2 border border-[#cbeaf0] rounded-xl text-[#263238] focus:outline-none focus:border-[#18A999]" /></div>
                <div><label className="block font-semibold text-[#123B5D] mb-1">Login Password</label><input type="password" autoComplete="new-password" value={workerPassword} onChange={(e) => setWorkerPassword(e.target.value)} placeholder="Optional login password" className="w-full px-3 py-2 border border-[#cbeaf0] rounded-xl text-[#263238] focus:outline-none focus:border-[#18A999]" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#123B5D] mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={workerPhone}
                    onChange={(e) => setWorkerPhone(e.target.value)}
                    placeholder="+63 917 123 4567"
                    className="w-full px-3 py-2 border border-[#cbeaf0] rounded-xl text-[#263238] focus:outline-none focus:border-[#18A999]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#123B5D] mb-1">Status</label>
                  <select
                    value={workerStatus}
                    onChange={(e) => setWorkerStatus(e.target.value as 'Active' | 'Inactive')}
                    className="w-full px-3 py-2 border border-[#cbeaf0] rounded-xl text-[#263238] bg-white focus:outline-none focus:border-[#18A999]"
                  >
                    <option value="Active">Active On-Site</option>
                    <option value="Inactive">Inactive / On-Leave</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowWorkerModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-medium text-[#546e7a] hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#18A999] hover:bg-[#148f81] text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {editingWorker ? 'Save Changes' : 'Add to Crew Roster'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {workerToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#123B5D]">Remove Crew Member?</h3>
                <p className="text-[11px] text-[#546e7a]">This will delete them from the site roster.</p>
              </div>
            </div>

            <p className="text-xs text-[#263238] mb-4">
              Are you sure you want to remove <strong className="text-[#123B5D]">{workerToDelete.name}</strong> ({workerToDelete.role})?
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setWorkerToDelete(null)}
                className="px-3.5 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-[#546e7a] hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (onClose) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-[#cbeaf0] overflow-hidden my-auto p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
          {content}
        </div>
      </div>
    );
  }

  return content;
};

export default AttendanceRecord;
