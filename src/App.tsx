import React, { useState, useEffect } from 'react';
import { Sidebar, NavItem } from './components/Sidebar.tsx';
import { Header } from './components/Header.tsx';
import { QuickAddModal } from './components/QuickAddModal.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { AnimalsPage } from './pages/AnimalsPage.tsx';
import { MaleAnimalsPage } from './pages/MaleAnimalsPage.tsx';
import { CowProfilesPage } from './pages/CowProfilesPage.tsx';
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
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { api } from './api/api.ts';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavItem>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickActionNonce, setQuickActionNonce] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  const handleQuickAddNavigate = (tab: NavItem) => {
    setCurrentTab(tab);
    setQuickActionNonce(prev => prev + 1);
  };

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
    cowprofiles: '🐄 All Cow Profiles – Visual Grid',
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
          <ErrorBoundary>
            {currentTab === 'dashboard' && (
              <DashboardPage
                onNavigate={tab => setCurrentTab(tab)}
                onOpenQuickAdd={() => setIsQuickAddOpen(true)}
              />
            )}
            {currentTab === 'animals' && <AnimalsPage autoOpenNonce={quickActionNonce} />}
            {currentTab === 'male' && <MaleAnimalsPage autoOpenNonce={quickActionNonce} />}
            {currentTab === 'cowprofiles' && <CowProfilesPage />}
            {currentTab === 'milk' && <MilkPage autoOpenNonce={quickActionNonce} />}
            {currentTab === 'deliveries' && <SalesPage autoOpenNonce={quickActionNonce} />}
            {currentTab === 'customers' && <CustomersPage autoOpenNonce={quickActionNonce} />}
            {currentTab === 'feed' && <FeedPage autoOpenNonce={quickActionNonce} />}
            {currentTab === 'inventory' && <InventoryPage autoOpenNonce={quickActionNonce} />}
            {currentTab === 'health' && <HealthPage autoOpenNonce={quickActionNonce} />}
            {currentTab === 'vaccination' && <VaccinationPage autoOpenNonce={quickActionNonce} />}
            {currentTab === 'breeding' && <BreedingPage autoOpenNonce={quickActionNonce} />}
            {currentTab === 'tasks' && (
              <RemindersPage
                onNavigateToModule={mod => setCurrentTab(mod)}
                autoOpenNonce={quickActionNonce}
              />
            )}
            {currentTab === 'workers' && <WorkersPage autoOpenNonce={quickActionNonce} />}
            {currentTab === 'expenses' && <ExpensesPage autoOpenNonce={quickActionNonce} />}
            {currentTab === 'reports' && <ReportsPage />}
            {currentTab === 'settings' && <SettingsPage />}
          </ErrorBoundary>
        </main>
      </div>

      {/* Quick Add Modal */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onNavigate={handleQuickAddNavigate}
      />
    </div>
  );
}
