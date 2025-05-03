"use client";

import { AdminNavigation } from "@/components/AdminNavigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden md:flex w-64 flex-col border-r bg-card px-4 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage your application</p>
        </div>
        <AdminNavigation />
      </div>
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
} 