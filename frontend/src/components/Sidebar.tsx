import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  PlusCircle,
  Ticket,
  Activity,
  Monitor,
  ShieldAlert,
  Cloud,
  X,
  Server,
} from 'lucide-react';

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const { role } = useAuth();

  // Filter navigation links based on user role
  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      allowedRoles: ['USER'],
    },
    {
      name: 'Join Queue',
      path: '/services',
      icon: PlusCircle,
      allowedRoles: ['USER', 'ADMIN'],
    },
    {
      name: 'My Token',
      path: '/my-token',
      icon: Ticket,
      allowedRoles: ['USER'],
    },
    {
      name: 'Queue Status',
      path: '/queue-status',
      icon: Activity,
      allowedRoles: ['USER', 'COUNTER', 'ADMIN'],
    },
    {
      name: 'Counter Dashboard',
      path: '/counter',
      icon: Monitor,
      allowedRoles: ['COUNTER', 'ADMIN'],
    },
    {
      name: 'Admin Dashboard',
      path: '/admin',
      icon: ShieldAlert,
      allowedRoles: ['ADMIN'],
    },
  ];

  const filteredItems = navItems.filter(
    (item) => !role || item.allowedRoles.includes(role)
  );

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-bold shadow-md shadow-blue-500/30">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide">Smart Queue</h1>
            <p className="text-[10px] text-blue-400 font-medium">Cloud & Distributed</p>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
        <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Navigation
        </div>

        {filteredItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop permanent sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 lg:border-r lg:border-slate-800">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="fixed inset-y-0 left-0 w-64 shadow-xl z-50">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
