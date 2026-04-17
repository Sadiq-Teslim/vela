"use client";

import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="md:ml-[220px] pb-20 md:pb-0">
        {children}
      </main>
    </div>
  );
}
