"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronRight, LayoutDashboard, Activity, Server, Database, AlertTriangle, LineChart } from "lucide-react";

interface AdminNavItemProps {
  href: string;
  title: string;
  icon: React.ReactNode;
  isActive?: boolean;
}

function AdminNavItem({ href, title, icon, isActive }: AdminNavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center py-2 px-3 text-sm rounded-md hover:bg-muted transition-colors",
        isActive && "bg-muted font-medium"
      )}
    >
      {icon}
      <span className="ml-2">{title}</span>
      {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
    </Link>
  );
}

export function AdminNavigation() {
  const pathname = usePathname();
  
  const navItems = [
    {
      href: "/admin",
      title: "Dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      href: "/admin/workers",
      title: "Workers",
      icon: <Server className="h-4 w-4" />,
    },
    {
      href: "/admin/workers/health",
      title: "Worker Health",
      icon: <Activity className="h-4 w-4" />,
    },
    {
      href: "/admin/data-management",
      title: "Data Management",
      icon: <Database className="h-4 w-4" />,
    },
    {
      href: "/admin/database",
      title: "Database Pool",
      icon: <Database className="h-4 w-4" />,
    },
    {
      href: "/admin/monitoring",
      title: "System Monitoring",
      icon: <AlertTriangle className="h-4 w-4" />,
    },
    {
      href: "/admin/analytics",
      title: "Analytics",
      icon: <LineChart className="h-4 w-4" />,
    },
  ];
  
  return (
    <nav className="space-y-1">
      {navItems.map((item) => (
        <AdminNavItem
          key={item.href}
          href={item.href}
          title={item.title}
          icon={item.icon}
          isActive={pathname === item.href}
        />
      ))}
    </nav>
  );
} 