import React, { useEffect, useState } from 'react';
import { api } from '../client/api.ts';
import { NavItem } from '../components/Sidebar.tsx';
import {
  Milk,
  Wheat,
  Truck,
  AlertCircle,
  TrendingUp,
  Activity,
  CheckCircle2,
  Calendar,
  ArrowRight,
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (tab: NavItem) => void;
  onOpenQuickAdd: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate, onOpenQuickAdd }) => {
  const [dateRange, setDateRange] = useState<'today' | 'yesterday' | '7d' | '30d' | '90d'>('30d');
  const [loading, setLoading] = useState(true);
  const [herdStats, setHerdStats] = useState<any>(null);
  const [financialStats, setFinancialStats] = useState<any>(null);
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);
  const [openHealthCases, setOpenHealthCases] = useState<number>(0);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);

  const todayStr = new Date().toISOString().slice(0, 10);

  function getDateBounds() {
    const end = todayStr;
    const d = new Date();
    if (dateRange === 'today') return { from: todayStr, to: todayStr };
    if (dateRange === 'yesterday') {
      d.setDate(d.getDate() - 1);
      const y = d.toISOString().slice(0, 10);
      return { from: y, to: y };
    }
    if (dateRange === '7d') {
      d.setDate(d.getDate() - 7);
      return { from: d.toISOString().slice(0, 10), to: end };
    }
    if (dateRange === '30d') {
      d.setDate(d.getDate() - 30);
      return { from: d.toISOString().slice(0, 10), to: end };
    }
    d.setDate(d.getDate() - 90);
    return { from: d.toISOString().slice(0, 10), to: end };
  }

  const loadData = async () => {
    try {
      setLoading(true);
      const bounds = getDateBounds();

      const [hStats, fStats, tasks, healthCases, inv] = await Promise.all([
        api.getHerdStatistics(),
        api.getFinancialReport(bounds.from, bounds.to),
        api.getTasks(),
        api.getHealthCases(undefined, 'Open'),
        api.getInventoryItems(),
      ]);

      setHerdStats(hStats);
      setFinancialStats(fStats);
      setPendingTasks(tasks.filter((t: any) => t.status !== 'Completed' && t.status !== 'Cancelled'));
      setOpenHealthCases(healthCases.length);
      setInventoryItems(inv);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const lowStockItems = inventoryItems.filter(i => i.isLowStock);

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Date Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-stone-200 shadow-xs">
        <div className="flex items-center gap-1.5 text-xs text-stone-600 font-medium">
          <Calendar className="w-4 h-4 text-emerald-700" />
          <span>Reporting Period:</span>
        </div>
        <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg border border-stone-200 text-xs">
          {[
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: '7d', label: 'Last 7 Days' },
            { id: '30d', label: 'Last 30 Days' },
            { id: '90d', label: 'Last 90 Days' },
          ].map(r => (
            <button
              key={r.id}
              onClick={() => setDateRange(r.id as any)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                dateRange === r.id
                  ? 'bg-white text-stone-900 shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
            <span>Milk Production</span>
            <Milk className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-stone-900">
            {financialStats?.kpis?.totalMilkLitres ?? 0}{' '}
            <span className="text-xs font-semibold text-stone-500">L</span>
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            Delivered: {financialStats?.kpis?.totalMilkDeliveredLitres ?? 0} L
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
            <span>Milk Sales Value</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-stone-900">
            Rs. {Number(financialStats?.kpis?.totalMilkSales || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            Cash collected: Rs. {Number(financialStats?.kpis?.totalCashReceived || 0).toLocaleString()}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
            <span>Feed & Expenses</span>
            <Wheat className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-stone-900">
            Rs. {Number(financialStats?.kpis?.totalCosts || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            Feed: Rs. {Number(financialStats?.kpis?.totalFeedCost || 0).toLocaleString()}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
            <span>Gross Margin</span>
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
          <div
            className={`text-2xl font-black ${
              (financialStats?.kpis?.netProfitOrLoss ?? 0) >= 0 ? 'text-emerald-700' : 'text-rose-600'
            }`}
          >
            Rs. {Number(financialStats?.kpis?.netProfitOrLoss || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">Sales minus operations cost</div>
        </div>
      </div>

      {/* Operations Quick Control & Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Today's Operational Status */}
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
            <h3 className="font-bold text-sm text-stone-900 flex items-center gap-1.5">
              <span>⚡ Today's Milestones</span>
            </h3>
            <span className="text-[11px] text-stone-500 font-mono">{todayStr}</span>
          </div>

          <div className="space-y-2">
            <div
              onClick={() => onNavigate('milk')}
              className="flex items-center justify-between p-2.5 rounded-lg border border-stone-100 bg-stone-50/50 hover:bg-stone-100/70 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Milk className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-semibold text-stone-800">Daily Milk Collection</span>
              </div>
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                Enter Milk <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>

            <div
              onClick={() => onNavigate('feed')}
              className="flex items-center justify-between p-2.5 rounded-lg border border-stone-100 bg-stone-50/50 hover:bg-stone-100/70 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Wheat className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-semibold text-stone-800">Group Feed Logs</span>
              </div>
              <span className="text-xs font-bold text-amber-700 flex items-center gap-1">
                Record Feed <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>

            <div
              onClick={() => onNavigate('deliveries')}
              className="flex items-center justify-between p-2.5 rounded-lg border border-stone-100 bg-stone-50/50 hover:bg-stone-100/70 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Truck className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-semibold text-stone-800">Milk Delivery Invoices</span>
              </div>
              <span className="text-xs font-bold text-blue-700 flex items-center gap-1">
                Create Invoice <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>

        {/* Actionable Reminders */}
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
            <h3 className="font-bold text-sm text-stone-900 flex items-center gap-1.5">
              <span>🔔 Pending Reminders</span>
              <span className="text-xs px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-full font-bold">
                {pendingTasks.length}
              </span>
            </h3>
            <button
              onClick={() => onNavigate('tasks')}
              className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
            >
              View all
            </button>
          </div>

          <div className="space-y-1.5 max-h-[165px] overflow-y-auto pr-1">
            {pendingTasks.length === 0 ? (
              <div className="p-4 text-center text-xs text-stone-400">
                🎉 No overdue or pending reminders!
              </div>
            ) : (
              pendingTasks.slice(0, 5).map(task => (
                <div
                  key={task.id}
                  onClick={() => onNavigate(task.sourceModule as NavItem)}
                  className="flex items-center justify-between p-2 rounded-lg border border-stone-100 bg-stone-50 hover:bg-stone-100 transition-colors cursor-pointer text-xs"
                >
                  <div className="truncate mr-2">
                    <span className="font-medium text-stone-800 truncate block">{task.title}</span>
                    <span className="text-[10px] text-stone-400">
                      Due: {task.dueDate} {task.dueTime}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                      task.status === 'Overdue'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {task.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Herd Summary & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Herd Summary */}
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
            <h3 className="font-bold text-sm text-stone-900">🐄 Herd Census & Lifecycle</h3>
            <button
              onClick={() => onNavigate('animals')}
              className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
            >
              Manage Herd
            </button>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
            <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-100">
              <div className="text-[10px] text-stone-500 font-medium">Active Females</div>
              <div className="text-lg font-bold text-stone-900 mt-0.5">
                {herdStats?.femalesCount ?? 0}
              </div>
            </div>
            <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-100">
              <div className="text-[10px] text-emerald-800 font-medium">Milking</div>
              <div className="text-lg font-bold text-emerald-900 mt-0.5">
                {herdStats?.milkingCount ?? 0}
              </div>
            </div>
            <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-100">
              <div className="text-[10px] text-amber-800 font-medium">Pregnant</div>
              <div className="text-lg font-bold text-amber-900 mt-0.5">
                {herdStats?.pregnantCount ?? 0}
              </div>
            </div>
            <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-100">
              <div className="text-[10px] text-blue-800 font-medium">Dry</div>
              <div className="text-lg font-bold text-blue-900 mt-0.5">
                {herdStats?.dryCount ?? 0}
              </div>
            </div>
            <div className="p-2.5 bg-purple-50 rounded-lg border border-purple-100">
              <div className="text-[10px] text-purple-800 font-medium">Heifers & Calves</div>
              <div className="text-lg font-bold text-purple-900 mt-0.5">
                {(herdStats?.heifersCount ?? 0) + (herdStats?.calvesCount ?? 0)}
              </div>
            </div>
            <div className="p-2.5 bg-rose-50 rounded-lg border border-rose-100">
              <div className="text-[10px] text-rose-800 font-medium">Open Sick Cases</div>
              <div className="text-lg font-bold text-rose-900 mt-0.5">{openHealthCases}</div>
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
            <h3 className="font-bold text-sm text-stone-900 flex items-center gap-1.5">
              <span>📦 Low Stock Warnings</span>
              {lowStockItems.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 bg-rose-100 text-rose-700 rounded-full font-bold">
                  {lowStockItems.length}
                </span>
              )}
            </h3>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
            >
              Inventory
            </button>
          </div>

          <div className="space-y-1.5 text-xs">
            {lowStockItems.length === 0 ? (
              <div className="p-3 text-center text-xs text-stone-400">
                All inventory items are well-stocked.
              </div>
            ) : (
              lowStockItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => onNavigate('inventory')}
                  className="p-2 bg-rose-50/60 border border-rose-100 rounded-lg flex items-center justify-between cursor-pointer hover:bg-rose-100/60"
                >
                  <div>
                    <span className="font-bold text-rose-900">{item.name}</span>
                    <div className="text-[10px] text-stone-500">
                      {item.currentStock} {item.unit} left · ~{item.daysRemaining ?? '?'} days
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-200 text-rose-800 rounded-full">
                    REORDER
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Production Trend SVG Chart */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs space-y-2">
        <div className="flex items-center justify-between border-b border-stone-100 pb-2">
          <h3 className="font-bold text-sm text-stone-900 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-700" />
            <span>Milk Production Trend</span>
          </h3>
          <span className="text-xs text-stone-500">Daily Total Litres</span>
        </div>

        {financialStats?.dailyTrend?.length > 0 ? (
          <div className="pt-2">
            <svg viewBox="0 0 700 160" className="w-full h-40">
              <line x1="20" y1="135" x2="680" y2="135" stroke="#e5e7eb" strokeWidth="1" />
              {(() => {
                const trend = financialStats.dailyTrend;
                const maxVal = Math.max(1, ...trend.map((t: any) => t.litres));
                const points = trend.map((t: any, i: number) => {
                  const x = 30 + (i / Math.max(1, trend.length - 1)) * 640;
                  const y = 135 - (t.litres / maxVal) * 110;
                  return `${x},${y}`;
                });
                return (
                  <>
                    <polyline
                      fill="none"
                      stroke="#16734b"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={points.join(' ')}
                    />
                    {trend.map((t: any, i: number) => {
                      const x = 30 + (i / Math.max(1, trend.length - 1)) * 640;
                      const y = 135 - (t.litres / maxVal) * 110;
                      return (
                        <circle
                          key={t.date}
                          cx={x}
                          cy={y}
                          r="3"
                          fill="#16734b"
                          className="hover:r-5 transition-all"
                        >
                          <title>{`${t.date}: ${t.litres} L`}</title>
                        </circle>
                      );
                    })}
                  </>
                );
              })()}
            </svg>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-stone-400">
            No milk records found in this reporting window.
          </div>
        )}
      </div>
    </div>
  );
};
