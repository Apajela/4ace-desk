import React, { useState } from 'react';
import {
  X,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Check,
  Banknote,
  Package,
  ArrowRight,
} from 'lucide-react';
import { NotificationItem } from '../types';

export interface NotificationProps {
  notifications: NotificationItem[];
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearNotification: (id: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export const NotificationModal: React.FC<NotificationProps> = ({
  notifications,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearNotification,
  onNavigateTab,
}) => {
  const [filterType, setFilterType] = useState<string>('all');

  const filtered = notifications.filter((n) => {
    if (filterType === 'all') return true;
    if (filterType === 'unread') return !n.read;
    return n.type === filterType;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getTypeIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'payroll':
        return <Banknote className="w-4 h-4 text-[#18A999]" />;
      case 'milestone':
        return <CheckCircle2 className="w-4 h-4 text-[#123B5D]" />;
      case 'material':
        return <Package className="w-4 h-4 text-[#18A999]" />;
      case 'alert':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      default:
        return <Bell className="w-4 h-4 text-[#123B5D]" />;
    }
  };

  const handleActionClick = (notif: NotificationItem) => {
    onMarkAsRead(notif.id);
    const target = notif.actionTab || notif.actionUrl;
    if (target && onNavigateTab) {
      onNavigateTab(target);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-[#123B5D] text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#18A999] text-white flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Site &amp; System Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#18A999] text-white">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-[11px] text-white/80">
                Real-time updates on site milestones, weekly payrolls, and material deliveries
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1.5 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-3 bg-white border-b border-slate-200 flex items-center justify-between gap-2 text-xs overflow-x-auto">
          <div className="flex items-center gap-1.5">
            {[
              { id: 'all', label: 'All' },
              { id: 'unread', label: `Unread (${unreadCount})` },
              { id: 'payroll', label: 'Payroll' },
              { id: 'milestone', label: 'Milestones' },
              { id: 'material', label: 'Materials' },
              { id: 'alert', label: 'Alerts' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                  filterType === tab.id
                    ? 'bg-[#18A999] text-white shadow-xs'
                    : 'bg-[#EAF7FA] text-[#123B5D] hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="text-[11px] font-bold text-[#18A999] hover:text-[#148f81] shrink-0 flex items-center gap-1 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" /> Mark all read
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="max-h-[55vh] overflow-y-auto divide-y divide-slate-100 text-[#263238]">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-[#263238]/60 text-xs">
              <Bell className="w-8 h-8 mx-auto text-[#123B5D]/30 mb-2" />
              <p className="font-bold text-[#123B5D]">No notifications found</p>
              <p className="text-[11px] mt-0.5">You&apos;re completely caught up with all site alerts!</p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className={`p-4 transition-colors flex items-start gap-3 ${
                  item.read ? 'bg-white hover:bg-slate-50' : 'bg-[#EAF7FA]/50 hover:bg-[#EAF7FA]'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center shrink-0 mt-0.5">
                  {getTypeIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4
                      className={`text-xs truncate ${
                        item.read ? 'text-[#263238] font-medium' : 'text-[#123B5D] font-bold'
                      }`}
                    >
                      {item.title}
                    </h4>
                    <span className="text-[10px] text-[#263238]/60 shrink-0 font-medium">{item.timestamp}</span>
                  </div>
                  <p className="text-xs text-[#263238]/80 mt-1 leading-relaxed">{item.message}</p>
                  <div className="flex items-center gap-3 mt-2">
                    {(item.actionUrl || item.actionTab) && (
                      <button
                        onClick={() => handleActionClick(item)}
                        className="text-[11px] font-bold text-[#18A999] hover:text-[#148f81] flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>View Details</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                    {!item.read && (
                      <button
                        onClick={() => onMarkAsRead(item.id)}
                        className="text-[11px] font-medium text-[#263238]/60 hover:text-[#123B5D] transition-colors cursor-pointer"
                      >
                        Mark as read
                      </button>
                    )}
                    <button
                      onClick={() => onClearNotification(item.id)}
                      className="text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md p-1 ml-auto transition-colors cursor-pointer"
                      title="Delete notification"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-3 bg-[#EAF7FA] border-t border-slate-200 text-center">
          <p className="text-[11px] text-[#263238]/60 font-medium">
            Notifications are sent to site foremen and project managers in real time.
          </p>
        </div>
      </div>
    </div>
  );
};

export const Notification = NotificationModal;
export default NotificationModal;
