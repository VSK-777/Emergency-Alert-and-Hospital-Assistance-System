import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { Sidebar } from '../components/common/Sidebar';
import { NotificationDrawer } from '../components/notifications/NotificationDrawer';
import { useEmergencyStore } from '../store/emergencyStore';

export const MainLayout: React.FC = () => {
  const { initSseStream, closeSseStream } = useEmergencyStore();

  useEffect(() => {
    // Start live real-time SSE stream on mount
    initSseStream();
    return () => {
      closeSseStream();
    };
  }, [initSseStream, closeSseStream]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <Navbar />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Real-time Notification Drawer */}
      <NotificationDrawer />
    </div>
  );
};
