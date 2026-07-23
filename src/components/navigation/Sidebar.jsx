import React, { createContext, useContext, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from '../AppIcon';
import { LogOut, User } from 'lucide-react';
import ApiTester from './ApiTester';
import { useTheme } from '../ThemeProvider';
import TenantSwitcher from './TenantSwitcher';

const SidebarContext = createContext();

export const SidebarProvider = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);
  const toggleMobile = () => setIsMobileOpen(!isMobileOpen);
  const closeMobile = () => setIsMobileOpen(false);

  return (
    <SidebarContext.Provider
      value={{ isCollapsed, isMobileOpen, toggleCollapse, toggleMobile, closeMobile }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) throw new Error('useSidebar must be used within SidebarProvider');
  return context;
};

const Sidebar = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { isCollapsed, isMobileOpen, toggleCollapse, closeMobile } = useSidebar();

  const navigationItems = [
    {
      label: 'Facility Management',
      items: [
        { label: 'Facilities Registry', path: '/facilities', icon: 'Table' },
        { label: 'Facilities Map', path: '/', icon: 'Map' },
        { label: 'Facility Editor', path: '/facility-editor-form', icon: 'Edit' },
      ],
    },
    {
      label: 'Workflow & Approvals',
      items: [
        { label: 'Workflow Console', path: '/workflow-management-console', icon: 'GitBranch' },
      ],
    },
    {
      label: 'Analytics & Insights',
      items: [
        { label: 'Analytics Dashboard', path: '/analytics-reporting-dashboard', icon: 'BarChart3' },
      ],
    },
    {
      label: 'Administration & Interoperability',
      items: [
        { label: 'User & Role Management', path: '/user-role-management', icon: 'Users' },
        { label: 'Spatial Hierarchy & Upload', path: '/admin-hierarchy', icon: 'Layers' },
        { label: 'Version Management', path: '/version-management', icon: 'History' },
        { label: 'Interoperability Hub', path: '/interoperability-hub', icon: 'Network' },
        { label: 'Data Dictionary', path: '/data-dictionary', icon: 'BookOpen' },
        { label: 'Reference Data', path: '/admin-console', icon: 'Database' },
        { label: 'System Audit Logs', path: '/audit-logs', icon: 'FileText' },
        { label: 'System Configuration', path: '/system-settings', icon: 'Settings' },
      ],
    },



    {
      label: 'Mobile Collection',
      items: [
        { label: 'Field Collection', path: '/mobile-field-collection-app', icon: 'Smartphone' },
      ],
    },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    closeMobile();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const isActive = (path) => location?.pathname === path;
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <>
      {isMobileOpen && <div className="sidebar-overlay animate-fade-in" onClick={closeMobile} />}
      <aside
        className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'animate-slide-in' : 'max-lg:hidden'}`}
        style={{ 
          '--sidebar-primary': theme.primaryColor,
          '--sidebar-secondary': theme.secondaryColor 
        }}
      >
        <div className="sidebar-header" style={{ borderBottom: `1px solid ${theme.primaryColor}22` }}>
          <div className="sidebar-logo">
            <img
              src={theme.logoUrl.startsWith('http') ? theme.logoUrl : (theme.logoUrl.startsWith('/uploads') ? `http://localhost:5002${theme.logoUrl}` : theme.logoUrl)}
              alt="Logo"
              className="w-10 h-10 object-contain"
              onError={(e) => { e.target.src = '/assets/images/emblem.png'; }}
            />
          </div>
          <span className="sidebar-brand-text" style={{ color: 'white' }}>{theme.systemName}</span>
          <button onClick={toggleCollapse} className="ml-auto hidden lg:flex items-center justify-center w-8 h-8 rounded-md hover:bg-white/10 transition-colors text-white">
            <Icon name={isCollapsed ? 'ChevronRight' : 'ChevronLeft'} size={20} />
          </button>
        </div>

        <div className="mt-4">
            <TenantSwitcher isCollapsed={isCollapsed} />
        </div>

        <nav className="sidebar-nav scrollbar-thin overflow-y-auto flex-1">
          {navigationItems.map((section, idx) => (
            <div key={idx} className="mb-6">
              {!isCollapsed && <div className="px-4 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">{section.label}</div>}
              <div className="flex flex-col gap-1">
                {section.items.map((item, iidx) => (
                  <button
                    key={iidx}
                    onClick={() => handleNavigation(item.path)}
                    className={`sidebar-nav-item ${isActive(item.path) ? 'active' : ''}`}
                    title={isCollapsed ? item.label : ''}
                  >
                    <Icon name={item.icon} size={20} />
                    <span className="sidebar-nav-item-text">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-4">
          <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 border border-indigo-500/30">
              <Icon name="User" size={16} />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{user.username || 'Administrator'}</div>
                <div className="text-xs text-slate-400 truncate">{user.email || 'admin@health.gov'}</div>
              </div>
            )}
            {!isCollapsed && <button onClick={handleLogout} className="p-1.5 hover:bg-white/10 rounded-md text-slate-400 hover:text-white"><LogOut size={16} /></button>}
          </div>
          <div className={`status-indicator success mb-2 ${isCollapsed ? 'justify-center' : ''}`}>
            <Icon name="Wifi" size={16} />
            {!isCollapsed && <span className="text-emerald-400">System Online</span>}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;