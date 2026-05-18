import { type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import {
  Bell, Settings, LogOut, LayoutDashboard, FileText,
  Search, FolderOpen, LifeBuoy, Shield, User, Menu, X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { useState } from "react";

interface NavLinkProps {
  href: string;
  icon: ReactNode;
  children: ReactNode;
  collapsed?: boolean;
}

function NavLink({ href, icon, children, collapsed }: NavLinkProps) {
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
    >
      {icon}
      {!collapsed && <span>{children}</span>}
    </Link>
  );
}

export function CitizenSidebar({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const handleProfile = () => {
    setLocation("/citizen/profile");
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
          <div className="flex items-center gap-3 font-bold text-lg tracking-tight">
            <Shield className="w-7 h-7 text-secondary shrink-0" />
            {!isCollapsed && <span>DMS Citizen</span>}
          </div>
          {!isCollapsed && (
            <p className="text-sidebar-foreground/60 text-xs mt-1">Citizen Portal</p>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="mt-2 p-1 rounded hover:bg-sidebar-accent"
          >
            {isCollapsed ? <Menu size={18} /> : <X size={18} />}
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className={`text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2 px-2 ${isCollapsed ? "text-center" : ""}`}>
            {!isCollapsed && "Navigation"}
          </p>
          <NavLink href="/citizen/dashboard" icon={<LayoutDashboard size={18} />} collapsed={isCollapsed}>Dashboard</NavLink>
          <NavLink href="/citizen/applications" icon={<FileText size={18} />} collapsed={isCollapsed}>My Applications</NavLink>
          <NavLink href="/citizen/track" icon={<Search size={18} />} collapsed={isCollapsed}>Track Application</NavLink>
          <NavLink href="/citizen/documents" icon={<FolderOpen size={18} />} collapsed={isCollapsed}>My Documents</NavLink>

          <p className={`text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2 mt-6 px-2 ${isCollapsed ? "text-center" : ""}`}>
            {!isCollapsed && "Information"}
          </p>
          <NavLink href="/citizen/support" icon={<LifeBuoy size={18} />} collapsed={isCollapsed}>Support</NavLink>
          <NavLink href="/citizen/privacy-policy" icon={<Shield size={18} />} collapsed={isCollapsed}>Privacy Policy</NavLink>
          <NavLink href="/citizen/notifications" icon={<Bell size={18} />} collapsed={isCollapsed}>Notifications</NavLink>
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
          <p className="font-medium text-muted-foreground text-sm">Citizen Portal</p>
          <div className="flex items-center gap-4">
            <Link
              href="/citizen/notifications"
              className="relative p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
            >
              <Bell size={20} />
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
              <Avatar className="w-9 h-9 border border-border">
                {user?.avatarUrl ? (
                  <AvatarImage src={user.avatarUrl} alt={user?.name ?? "Avatar"} />
                ) : null}
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