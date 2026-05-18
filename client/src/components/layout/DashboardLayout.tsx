import { type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import {
  Bell, Settings, LogOut, LayoutDashboard, FileText,
  FileBadge, Activity, LifeBuoy, ShieldAlert,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { APP_NAME } from "@/constants";

interface NavLinkProps {
  href: string;
  icon: ReactNode;
  children: ReactNode;
}

function NavLink({ href, icon, children }: NavLinkProps) {
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
    >
      {icon}
      {children}
    </Link>
  );
}

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { unreadCount } = useNotifications(user?.id);

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  return (
    <div className="flex h-screen w-full bg-muted/30">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col shadow-lg z-10 shrink-0">
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3 font-bold text-xl tracking-tight">
            <ShieldAlert className="w-8 h-8 text-secondary shrink-0" />
            <span>{APP_NAME}</span>
          </div>
          <p className="text-sidebar-foreground/60 text-xs mt-1">Domicile Management System</p>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          <p className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2 mt-2 px-2">
            Main Menu
          </p>
          <NavLink href="/dashboard"     icon={<LayoutDashboard size={18} />}>Dashboard</NavLink>
          <NavLink href="/applications"  icon={<FileText size={18} />}>My Applications</NavLink>
          <NavLink href="/dashboard"     icon={<FileBadge size={18} />}>Document Vault</NavLink>
          <NavLink href="/dashboard"     icon={<Activity size={18} />}>Status Tracker</NavLink>

          <p className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2 mt-8 px-2">
            Support & Info
          </p>
          <NavLink href="/notifications" icon={<Bell size={18} />}>
            <span className="flex-1">Notifications</span>
            {unreadCount > 0 && (
              <span className="bg-destructive text-destructive-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </NavLink>
          <NavLink href="/dashboard"     icon={<LifeBuoy size={18} />}>Support</NavLink>
          <NavLink href="/dashboard"     icon={<ShieldAlert size={18} />}>Privacy Policy</NavLink>
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2 text-sidebar-foreground/80 hover:text-white hover:bg-sidebar-accent rounded-md transition-colors text-sm font-medium"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-8 shadow-sm shrink-0">
          <p className="font-medium text-muted-foreground text-sm capitalize">
            {user?.role === "clerk" ? "Clerk Workstation" : user?.role === "admin" ? "Admin Panel" : "Citizen Portal"}
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/notifications"
              className="relative p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border border-card" />
              )}
            </Link>
            <button className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors">
              <Settings size={20} />
            </button>
            <div className="h-8 w-px bg-border mx-1" />
            <div className="flex items-center gap-3">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium leading-none text-foreground">{user?.name ?? "User"}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <Avatar className="w-9 h-9 border border-border">
                {user?.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user?.name ?? "Avatar"} /> : null}
                <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
                  {getInitials(user?.name ?? "U")}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">{children}</div>
        </div>
      </main>
    </div>
  );
}