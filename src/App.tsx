import React, { useState, useEffect } from 'react';
import { Sidebar, NavItem } from './components/Sidebar.tsx';
import { Header } from './components/Header.tsx';
import { QuickAddModal } from './components/QuickAddModal.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { AnimalsPage } from './pages/AnimalsPage.tsx';
import { MaleAnimalsPage } from './pages/MaleAnimalsPage.tsx';
import { MilkPage } from './pages/MilkPage.tsx';
import { SalesPage } from './pages/SalesPage.tsx';
import { CustomersPage } from './pages/CustomersPage.tsx';
import { FeedPage } from './pages/FeedPage.tsx';
import { InventoryPage } from './pages/InventoryPage.tsx';
import { HealthPage } from './pages/HealthPage.tsx';
import { VaccinationPage } from './pages/VaccinationPage.tsx';
import { BreedingPage } from './pages/BreedingPage.tsx';
import { RemindersPage } from './pages/RemindersPage.tsx';
import { WorkersPage } from './pages/WorkersPage.tsx';
import { ExpensesPage } from './pages/ExpensesPage.tsx';
import { ReportsPage } from './pages/ReportsPage.tsx';
import { SettingsPage } from './pages/SettingsPage.tsx';
import { api } from './client/api.ts';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavItem>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const fetchPendingCount = async () => {
    try {
      const summary = await api.getNotificationsSummary();
      setPendingCount(summary.totalPending || 0);
    } catch {
      // offline / starting up
    }
  };

  useEffect(() => {
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 15000);
    return () => clearInterval(interval);
  }, []);

  const pageTitles: Record<NavItem, string> = {
    dashboard: 'Farm Dashboard',
    animals: 'Female Herd Management',
    male: 'Male Animals',
    milk: 'Daily Milk Production',
    deliveries: 'Milk Sales & Invoices',
    customers: 'Customers & Receivables',
    feed: 'Daily Feed (Maund/KG)',
    inventory: 'Inventory & Stock Management',
    health: 'Health & Veterinary Cases',
    vaccination: 'Vaccination & Deworming Schedule',
    breeding: 'Breeding, Calving & Calf Growth',
    tasks: 'Task & Reminder Engine',
    workers: 'Workers, Advances & Salary',
    expenses: 'Farm Expenses & Cash Out',
    reports: 'Financial & Operational Reports',
    settings: 'Farm Settings, Health & Backup',
  };

  return (
    <div className="min-h-screen bg-[#f3f6f4] text-stone-900 flex font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={tab => {
          setCurrentTab(tab);
          fetchPendingCount();
        }}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        pendingCount={pendingCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Header */}
        <Header
          title={pageTitles[currentTab]}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenTasks={() => setCurrentTab('tasks')}
          onQuickAdd={() => setIsQuickAddOpen(true)}
          pendingCount={pendingCount}
        />

        {/* Content body */}
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          {currentTab === 'dashboard' && (
            <DashboardPage
              onNavigate={tab => setCurrentTab(tab)}
              onOpenQuickAdd={() => setIsQuickAddOpen(true)}
            />
          )}
          {currentTab === 'animals' && <AnimalsPage />}
          {currentTab === 'male' && <MaleAnimalsPage />}
          {currentTab === 'milk' && <MilkPage />}
          {currentTab === 'deliveries' && <SalesPage />}
          {currentTab === 'customers' && <CustomersPage />}
          {currentTab === 'feed' && <FeedPage />}
          {currentTab === 'inventory' && <InventoryPage />}
          {currentTab === 'health' && <HealthPage />}
          {currentTab === 'vaccination' && <VaccinationPage />}
          {currentTab === 'breeding' && <BreedingPage />}
          {currentTab === 'tasks' && (
            <RemindersPage onNavigateToModule={mod => setCurrentTab(mod)} />
          )}
          {currentTab === 'workers' && <WorkersPage />}
          {currentTab === 'expenses' && <ExpensesPage />}
          {currentTab === 'reports' && <ReportsPage />}
          {currentTab === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* Quick Add Modal */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onNavigate={tab => setCurrentTab(tab)}
      />
    </div>
  );
}
