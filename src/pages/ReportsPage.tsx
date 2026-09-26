import React, { useEffect, useState } from 'react';
import { api } from '../client/api.ts';
import { BarChart3, Calendar, Printer, Download, TrendingUp, AlertCircle } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [fromDate, setFromDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
  );
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10));
  const [report, setReport] = useState<any | null>(null);
  const [herdStats, setHerdStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const loadReport = async () => {
    try {
      setLoading(true);
      const [rep, hStats] = await Promise.all([
        api.getFinancialReport(fromDate, toDate),
        api.getHerdStatistics(),
      ]);
      setReport(rep);
      setHerdStats(hStats);
    } catch (err) {
      console.error('Error generating report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [fromDate, toDate]);

  const handleExportCSV = () => {
    if (!report) return;
    const lines = [
      ['Metric', 'Value'],
      ['Reporting From', fromDate],
      ['Reporting To', toDate],
      ['Total Milk Produced (L)', report.kpis.totalMilkLitres],
      ['Total Milk Delivered/Sold (L)', report.kpis.totalMilkDeliveredLitres],
      ['Milk Discrepancy (Retained/Loss) (L)', report.reconciliation.discrepancy],
      ['Total Milk Sales Revenue (Rs.)', report.kpis.totalMilkSales],
      ['Total Cash Collected (Rs.)', report.kpis.totalCashReceived],
      ['Total Feed Costs (Rs.)', report.kpis.totalFeedCost],
      ['Total Other Expenses (Rs.)', report.kpis.totalExpenses],
      ['Total Operational Costs (Rs.)', report.kpis.totalCosts],
      ['Net Margin (Profit / Loss) (Rs.)', report.kpis.netProfitOrLoss],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + lines.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `dairy_report_${fromDate}_to_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Top action toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-stone-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-stone-600 font-medium">
            <Calendar className="w-4 h-4 text-emerald-700" />
            <span>Date Range:</span>
          </div>
          <input
            type="date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            className="text-xs px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-700 font-medium"
          />
          <span className="text-stone-400 text-xs">to</span>
          <input
            type="date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            className="text-xs px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-700 font-medium"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#16734b] hover:bg-[#125e3d] rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {report && (
        <>
          {/* Key Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
              <span className="text-xs text-stone-500 font-medium">Total Milk Produced</span>
              <div className="text-2xl font-black text-stone-900 mt-1">
                {report.kpis.totalMilkLitres} <span className="text-xs font-semibold">L</span>
              </div>
              <div className="text-[11px] text-stone-500 mt-1">
                Sold: {report.kpis.totalMilkDeliveredLitres} L ({report.reconciliation.percentageSold}%)
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
              <span className="text-xs text-stone-500 font-medium">Milk Sales Revenue</span>
              <div className="text-2xl font-black text-stone-900 mt-1">
                Rs. {report.kpis.totalMilkSales?.toLocaleString()}
              </div>
              <div className="text-[11px] text-emerald-700 font-semibold mt-1">
                Collected: Rs. {report.kpis.totalCashReceived?.toLocaleString()}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
              <span className="text-xs text-stone-500 font-medium">Total Costs (Feed + Ops)</span>
              <div className="text-2xl font-black text-stone-900 mt-1">
                Rs. {report.kpis.totalCosts?.toLocaleString()}
              </div>
              <div className="text-[11px] text-stone-500 mt-1">
                Feed: Rs. {report.kpis.totalFeedCost?.toLocaleString()}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
              <span className="text-xs text-stone-500 font-medium">Operating Margin</span>
              <div
                className={`text-2xl font-black mt-1 ${
                  report.kpis.netProfitOrLoss >= 0 ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                Rs. {report.kpis.netProfitOrLoss?.toLocaleString()}
              </div>
              <div className="text-[11px] text-stone-500 mt-1">Revenue minus operating expenses</div>
            </div>
          </div>

          {/* Section 27: Milk to Sales Reconciliation */}
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <h3 className="font-bold text-sm text-stone-900 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-emerald-700" />
                <span>Milk Production vs Sales Reconciliation</span>
              </h3>
              <span className="text-xs font-semibold text-stone-500">
                Audit Rule: Never hide missing/retained milk
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                <span className="text-stone-500 block">Total Produced on Farm</span>
                <b className="text-base text-stone-900">{report.kpis.totalMilkLitres} Litres</b>
              </div>
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                <span className="text-stone-500 block">Delivered & Sold</span>
                <b className="text-base text-stone-900">
                  {report.kpis.totalMilkDeliveredLitres} Litres
                </b>
              </div>
              <div
                className={`p-3 rounded-lg border ${
                  report.reconciliation.discrepancy >= 0
                    ? 'bg-blue-50/70 border-blue-200 text-blue-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <span className="block font-semibold">
                  {report.reconciliation.discrepancy >= 0
                    ? 'Discrepancy (Calf Milk / Farm Retained)'
                    : 'Discrepancy (Excess Sold Over Logged Production!)'}
                </span>
                <b className="text-base">
                  {report.reconciliation.discrepancy > 0 ? '+' : ''}
                  {report.reconciliation.discrepancy} Litres
                </b>
              </div>
            </div>
          </div>

          {/* Expenses Breakdown */}
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-stone-900">Expenses Breakdown by Category</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              {Object.entries(report.expensesByCategory || {}).map(([cat, amount]: any) => (
                <div key={cat} className="p-2.5 bg-stone-50 rounded-lg border border-stone-100">
                  <span className="text-[10px] text-stone-500 font-semibold uppercase">{cat}</span>
                  <div className="font-extrabold text-stone-900 mt-0.5">
                    Rs. {Number(amount).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
