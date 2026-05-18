import { type ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import {
  Bell, Settings, LogOut, LayoutDashboard, FileText,
  Search, FolderOpen, LifeBuoy, Shield, User, Menu, X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

interface NavLinkProps {
  href: string;
  icon: ReactNode;
  children: ReactNode;
  collapsed?: boolean;
  onClick?: () => void;
}

function NavLink({ href, icon, children, collapsed, onClick }: NavLinkProps) {
  const [location] = useLocation();
  const isActive = location === href;
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium ${
        isActive
          ? "bg-yellow-500 text-black"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
      }`}
      title={collapsed ? String(children) : undefined}
      onClick={onClick}
    >
      {icon}
      {!collapsed && <span>{children}</span>}
    </Link>
  );
}

interface CitizenLayoutProps {
  children: ReactNode;
}

export function CitizenLayout({ children }: CitizenLayoutProps) {
  const { user, logout, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { unreadCount } = useNotifications(user?.id);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const handleProfile = () => {
    setLocation("/citizen/profile");
    setIsCollapsed(false);
  };

  // Close sidebar on mobile when clicking a nav link
  const handleNavClick = () => {
    if (window.innerWidth < 768) {
      setIsCollapsed(true);
    }
  };

  return (
    <div className="flex h-screen w-full bg-muted/30">
      {/* Sidebar */}
      <aside
        className={`bg-sidebar text-sidebar-foreground flex flex-col shadow-lg z-10 shrink-0 transition-all duration-300 ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 font-bold text-lg tracking-tight">
              <Shield className="w-7 h-7 text-secondary shrink-0" />
              {!isCollapsed && <span>DMS Citizen</span>}
            </div>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 rounded hover:bg-sidebar-accent"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <Menu size={18} /> : <X size={18} />}
            </button>
          </div>
          {!isCollapsed && (
            <p className="text-sidebar-foreground/60 text-xs mt-1">Citizen Portal</p>
          )}
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className={`text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2 px-2 ${isCollapsed ? "text-center" : ""}`}>
            {!isCollapsed && "Navigation"}
          </p>
          <NavLink href="/citizen/dashboard" icon={<LayoutDashboard size={18} />} collapsed={isCollapsed} onClick={handleNavClick}>Dashboard</NavLink>
          <NavLink href="/citizen/applications" icon={<FileText size={18} />} collapsed={isCollapsed} onClick={handleNavClick}>My Applications</NavLink>
          <NavLink href="/citizen/track" icon={<Search size={18} />} collapsed={isCollapsed} onClick={handleNavClick}>Track Application</NavLink>
          <NavLink href="/citizen/documents" icon={<FolderOpen size={18} />} collapsed={isCollapsed} onClick={handleNavClick}>My Documents</NavLink>

          <p className={`text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2 mt-6 px-2 ${isCollapsed ? "text-center" : ""}`}>
            {!isCollapsed && "Information"}
          </p>
          <NavLink href="/citizen/support" icon={<LifeBuoy size={18} />} collapsed={isCollapsed} onClick={handleNavClick}>Support</NavLink>
          <NavLink href="/citizen/privacy-policy" icon={<Shield size={18} />} collapsed={isCollapsed} onClick={handleNavClick}>Privacy Policy</NavLink>
          <NavLink href="/citizen/notifications" icon={<Bell size={18} />} collapsed={isCollapsed} onClick={handleNavClick}>
            <span className="flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <span className="bg-destructive text-destructive-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </span>
          </NavLink>
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <button
            onClick={handleProfile}
            className={`flex items-center gap-3 w-full px-3 py-2 text-sidebar-foreground/80 hover:text-white hover:bg-sidebar-accent rounded-md transition-colors text-sm font-medium mb-1`}
          >
            <User size={18} />
            {!isCollapsed && <span>Profile</span>}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 text-sidebar-foreground/80 hover:text-white hover:bg-sidebar-accent rounded-md transition-colors text-sm font-medium"
          >
            <LogOut size={18} />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-card border-b border-border flex items-center justify-between px-6 shadow-sm shrink-0">
          <p className="font-medium text-muted-foreground text-sm capitalize">Citizen Portal</p>
          <div className="flex items-center gap-4">
            <Link
              href="/citizen/notifications"
              className="relative p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border border-card" />
              )}
            </Link>
            <button
              onClick={handleProfile}
              className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
            >
              <Settings size={20} />
            </button>
            <div className="h-8 w-px bg-border mx-1" />
            <div className="flex items-center gap-3">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium leading-none text-foreground">{user?.name ?? "Citizen"}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <Avatar className="w-9 h-9 border border-border cursor-pointer" onClick={handleProfile}>
                {user?.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user?.name ?? "Avatar"} /> : null}
                <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
                  {getInitials(user?.name ?? "C")}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">{children}</div>
        </div>
      </main>
    </div>
  );
}