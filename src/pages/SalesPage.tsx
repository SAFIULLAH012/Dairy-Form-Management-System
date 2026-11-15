import React, { useEffect, useState } from 'react';
import { api } from '../api/api.ts';
import { Modal } from '../components/Modal.tsx';
import { Truck, Plus, DollarSign, Printer, Calendar, ArrowRight } from 'lucide-react';

interface SalesPageProps {
  autoOpenNonce?: number;
}

export const SalesPage: React.FC<SalesPageProps> = ({ autoOpenNonce }) => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [farmName, setFarmName] = useState('BA Farm');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState<any | null>(null);
  const [selectedInvoiceToPrint, setSelectedInvoiceToPrint] = useState<any | null>(null);

  // Invoice Form
  const [invoiceForm, setInvoiceForm] = useState({
    customerId: '',
    customerName: '',
    receiverName: 'Ahmed',
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toTimeString().slice(0, 5),
    litres: '',
    fatPercent: '4.10',
    snfPercent: '8.55',
    ratePerL: '210',
    paymentTermsDays: '7',
    initialPaidAmount: '0',
    notes: '',
  });

  // Payment Form
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    method: 'Cash' as any,
    reference: '',
    notes: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().slice(0, 10);
      const [invList, custList, milkEntries, settings] = await Promise.all([
        api.getDeliveries(),
        api.getCustomers(),
        api.getMilkTotals(today, today),
        api.getSettings().catch(() => null),
      ]);
      setInvoices(invList);
      setCustomers(custList);
      if (settings?.farmName) {
        setFarmName(settings.farmName);
      }
      
      const todaysMilk = milkEntries.reduce((sum: number, entry: any) => sum + (entry.totalLitres || entry.actualLitres || 0), 0);
      
      if (custList.length > 0 && !invoiceForm.customerId) {
        setInvoiceForm(prev => ({
          ...prev,
          customerId: custList[0].id,
          customerName: custList[0].name,
          ratePerL: String(custList[0].defaultRatePerL || 210),
          paymentTermsDays: String(custList[0].paymentTermsDays || 7),
          litres: todaysMilk > 0 ? String(todaysMilk) : '',
        }));
      }
    } catch (err) {
      console.error('Error loading sales data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (autoOpenNonce) {
      setShowInvoiceModal(true);
    }
  }, [autoOpenNonce]);

  const totalCalc =
    (parseFloat(invoiceForm.litres) || 0) * (parseFloat(invoiceForm.ratePerL) || 0);

  const handleSaveInvoice = async () => {
    if (!invoiceForm.customerId) {
      alert('Please select or add a customer first.');
      return;
    }
    if (!invoiceForm.litres || parseFloat(invoiceForm.litres) <= 0) {
      alert('Please enter valid litres.');
      return;
    }

    try {
      await api.createDelivery({
        customerId: invoiceForm.customerId,
        customerName: invoiceForm.customerName,
        receiverName: invoiceForm.receiverName,
        date: invoiceForm.date,
        time: invoiceForm.time,
        litres: parseFloat(invoiceForm.litres),
        fatPercent: invoiceForm.fatPercent ? parseFloat(invoiceForm.fatPercent) : undefined,
        snfPercent: invoiceForm.snfPercent ? parseFloat(invoiceForm.snfPercent) : undefined,
        ratePerL: parseFloat(invoiceForm.ratePerL),
        paymentTermsDays: parseInt(invoiceForm.paymentTermsDays, 10),
        initialPaidAmount: invoiceForm.initialPaidAmount
          ? parseFloat(invoiceForm.initialPaidAmount)
          : 0,
        notes: invoiceForm.notes,
      });

      setShowInvoiceModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error creating delivery invoice');
    }
  };

  const handleRecordPayment = async () => {
    if (!showPaymentModal) return;
    const amt = parseFloat(paymentForm.amount);
    if (!amt || amt <= 0) {
      alert('Enter a valid payment amount.');
      return;
    }

    try {
      await api.recordPayment(showPaymentModal.id, {
        amount: amt,
        date: paymentForm.date,
        method: paymentForm.method,
        reference: paymentForm.reference,
        notes: paymentForm.notes,
      });

      setShowPaymentModal(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error recording payment');
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Top action toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-stone-200 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold text-stone-700">
          <Truck className="w-4 h-4 text-emerald-700" />
          <span>Milk Deliveries, Quality Testing & Invoices</span>
        </div>

        <button
          onClick={() => {
            if (customers.length > 0) {
              setInvoiceForm(prev => ({
                ...prev,
                customerId: customers[0].id,
                customerName: customers[0].name,
                ratePerL: String(customers[0].defaultRatePerL || 210),
                paymentTermsDays: String(customers[0].paymentTermsDays || 7),

                initialPaidAmount: '0',
                notes: '',
              }));
            }
            setShowInvoiceModal(true);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#16734b] hover:bg-[#125e3d] rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Milk Delivery Invoice</span>
        </button>
      </div>

      <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-600">
        🚚 Each delivery stores exact time, receiver, litres, tested Fat % and SNF %, rate/L, due
        date, and remaining balance. Partial or full payments reconcile automatically.
      </div>

      {/* Deliveries Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-50 text-[11px] font-bold uppercase tracking-wider text-stone-500 border-b border-stone-200">
              <tr>
                <th className="p-3">Invoice #</th>
                <th className="p-3">Date & Time</th>
                <th className="p-3">Customer / Company</th>
                <th className="p-3">Litres</th>
                <th className="p-3">Fat % / SNF %</th>
                <th className="p-3">Rate / L</th>
                <th className="p-3">Total (Rs.)</th>
                <th className="p-3">Paid (Rs.)</th>
                <th className="p-3">Balance (Rs.)</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-stone-400">
                    No milk delivery invoices created yet.
                  </td>
                </tr>
              ) : (
                invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-stone-50/70">
                    <td className="p-3 font-mono font-bold text-stone-900">{inv.invoiceNumber}</td>
                    <td className="p-3 font-medium text-stone-600">
                      {inv.date}{' '}
                      <span className="text-[10px] text-stone-400 block">{inv.time}</span>
                    </td>
                    <td className="p-3 font-bold text-stone-800">
                      {inv.customerName}
                      {inv.receiverName && (
                        <span className="text-[10px] text-stone-400 block">
                          Rec: {inv.receiverName}
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-extrabold text-stone-900 text-sm">
                      {inv.litres.toFixed(1)} L
                    </td>
                    <td className="p-3 font-mono text-[11px] text-stone-600">
                      {inv.fatPercent ? `${inv.fatPercent}%` : '-'} /{' '}
                      {inv.snfPercent ? `${inv.snfPercent}%` : '-'}
                    </td>
                    <td className="p-3 font-mono text-stone-600">Rs. {inv.ratePerL}</td>
                    <td className="p-3 font-bold text-stone-900">
                      Rs. {inv.totalAmount.toLocaleString()}
                    </td>
                    <td className="p-3 text-emerald-800 font-semibold">
                      Rs. {inv.paidAmount.toLocaleString()}
                    </td>
                    <td className="p-3 font-bold">
                      {inv.remainingBalance > 0 ? (
                        <span className="text-rose-600 font-mono">
                          Rs. {inv.remainingBalance.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-emerald-700">Cleared</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inv.status === 'Partially Paid'
                            ? 'bg-amber-100 text-amber-800'
                            : inv.status === 'Overdue'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {inv.remainingBalance > 0 && (
                          <button
                            onClick={() => {
                              setShowPaymentModal(inv);
                              setPaymentForm({
                                amount: String(inv.remainingBalance),
                                date: new Date().toISOString().slice(0, 10),
                                method: 'Cash',
                                reference: '',
                                notes: '',
                              });
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded cursor-pointer"
                          >
                            <DollarSign className="w-3 h-3" />
                            <span>Pay</span>
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedInvoiceToPrint(inv)}
                          className="p-1 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded cursor-pointer"
                          title="Print Receipt"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Delivery Modal */}
      <Modal
        title="Create Milk Delivery Invoice"
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        maxWidth="lg"
        footer={
          <>
            <button
              onClick={() => setShowInvoiceModal(false)}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveInvoice}
              className="px-4 py-2 text-xs font-bold text-white bg-[#16734b] hover:bg-[#125e3d] rounded-lg cursor-pointer"
            >
              Issue Invoice
            </button>
          </>
        }
      >
        <div className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-600 font-semibold mb-1">
                Company / Customer *
              </label>
              <select
                value={invoiceForm.customerId}
                onChange={e => {
                  const cust = customers.find(c => c.id === e.target.value);
                  setInvoiceForm({
                    ...invoiceForm,
                    customerId: e.target.value,
                    customerName: cust?.name || '',
                    ratePerL: String(cust?.defaultRatePerL || 210),
                    paymentTermsDays: String(cust?.paymentTermsDays || 7),
                  });
                }}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg bg-white font-medium"
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} (Rate: Rs. {c.defaultRatePerL})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Received by (Person)</label>
              <input
                type="text"
                placeholder="e.g. Ahmed, Driver"
                value={invoiceForm.receiverName}
                onChange={e => setInvoiceForm({ ...invoiceForm, receiverName: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Delivery Date *</label>
              <input
                type="date"
                value={invoiceForm.date}
                onChange={e => setInvoiceForm({ ...invoiceForm, date: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Exact Time *</label>
              <input
                type="time"
                value={invoiceForm.time}
                onChange={e => setInvoiceForm({ ...invoiceForm, time: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-700 font-bold mb-1">Milk Quantity (Litres) *</label>
              <input
                type="number"
                step="0.1"
                min="0"
                placeholder="e.g. 320"
                value={invoiceForm.litres}
                onChange={e => setInvoiceForm({ ...invoiceForm, litres: e.target.value })}
                className="w-full px-3 py-2 text-base font-bold border border-stone-300 rounded-lg focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="block text-stone-700 font-bold mb-1">Rate per Litre (Rs.) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={invoiceForm.ratePerL}
                onChange={e => setInvoiceForm({ ...invoiceForm, ratePerL: e.target.value })}
                className="w-full px-3 py-2 text-base font-bold border border-stone-300 rounded-lg focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Tested Fat %</label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 4.10"
                value={invoiceForm.fatPercent}
                onChange={e => setInvoiceForm({ ...invoiceForm, fatPercent: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Tested SNF %</label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 8.55"
                value={invoiceForm.snfPercent}
                onChange={e => setInvoiceForm({ ...invoiceForm, snfPercent: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
              />
            </div>
          </div>

          {/* Automatic Calculation Banner */}
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
            <div>
              <span className="text-emerald-800 font-semibold block">Total Invoice Value</span>
              <span className="text-lg font-black text-emerald-950">
                Rs. {totalCalc.toLocaleString()}
              </span>
            </div>
            <div className="text-right">
              <span className="text-stone-500 block">Terms: {invoiceForm.paymentTermsDays} Days</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-600 font-semibold mb-1">
                Payment Terms (Days)
              </label>
              <input
                type="number"
                value={invoiceForm.paymentTermsDays}
                onChange={e =>
                  setInvoiceForm({ ...invoiceForm, paymentTermsDays: e.target.value })
                }
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-stone-600 font-semibold mb-1">
                Initial Cash Paid (if any)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0"
                value={invoiceForm.initialPaidAmount}
                onChange={e =>
                  setInvoiceForm({ ...invoiceForm, initialPaidAmount: e.target.value })
                }
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-stone-600 font-semibold mb-1">Notes</label>
            <textarea
              rows={2}
              value={invoiceForm.notes}
              onChange={e => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
              className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
            />
          </div>
        </div>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        title={`Record Payment for ${showPaymentModal?.invoiceNumber || ''}`}
        isOpen={Boolean(showPaymentModal)}
        onClose={() => setShowPaymentModal(null)}
        footer={
          <>
            <button
              onClick={() => setShowPaymentModal(null)}
              className="px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleRecordPayment}
              className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer"
            >
              Save Payment
            </button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
            <div className="flex justify-between py-0.5">
              <span className="text-stone-500">Customer:</span>
              <b className="text-stone-900">{showPaymentModal?.customerName}</b>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-stone-500">Total Invoice:</span>
              <span>Rs. {showPaymentModal?.totalAmount?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-stone-500">Already Paid:</span>
              <span>Rs. {showPaymentModal?.paidAmount?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-0.5 border-t border-stone-200 mt-1 pt-1 font-bold">
              <span className="text-stone-700">Remaining Balance:</span>
              <span className="text-rose-600 text-sm">
                Rs. {showPaymentModal?.remainingBalance?.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-700 font-bold mb-1">Payment Amount (Rs.) *</label>
              <input
                type="number"
                step="0.01"
                max={showPaymentModal?.remainingBalance}
                value={paymentForm.amount}
                onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                className="w-full px-3 py-2 text-sm font-bold border border-stone-300 rounded-lg focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Payment Date *</label>
              <input
                type="date"
                value={paymentForm.date}
                onChange={e => setPaymentForm({ ...paymentForm, date: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Payment Method</label>
              <select
                value={paymentForm.method}
                onChange={e => setPaymentForm({ ...paymentForm, method: e.target.value as any })}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg bg-white"
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Reference / Cheque #</label>
              <input
                type="text"
                placeholder="e.g. TXN-99412"
                value={paymentForm.reference}
                onChange={e => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Splendid Printable Delivery Invoice Slip */}
      <Modal
        title={`Milk Delivery Slip — ${selectedInvoiceToPrint?.invoiceNumber || ''}`}
        isOpen={Boolean(selectedInvoiceToPrint)}
        onClose={() => setSelectedInvoiceToPrint(null)}
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] text-stone-500">
              Tax status: Agricultural / Raw Milk Exempt · Generated by BA Dairy ERP
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedInvoiceToPrint(null)}
                className="px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-[#16734b] hover:bg-[#125e3d] rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Delivery Slip</span>
              </button>
            </div>
          </div>
        }
      >
        {selectedInvoiceToPrint && (
          <div className="printable-sheet p-6 bg-white border border-stone-200 rounded-2xl space-y-5 text-stone-800 text-xs" id="delivery-receipt">
            {/* Header Brand */}
            <div className="border-b-2 border-emerald-800 pb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-800 to-emerald-950 text-white font-black text-xl flex items-center justify-center shadow-md">
                  BA
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight text-emerald-950 uppercase">{farmName}</h2>
                  <p className="text-[11px] text-stone-500">Pure Organic Dairy Farm · Fresh Milk Supply Division</p>
                  <p className="text-[10px] text-stone-400">NTN / Registration: 849204-BA · Dispatch Yard 1</p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-900 border border-emerald-300 font-extrabold rounded-md text-[11px] tracking-wider uppercase">
                  Delivery Slip & Invoice
                </span>
                <div className="text-sm font-mono font-black text-stone-900 mt-1">
                  #{selectedInvoiceToPrint.invoiceNumber}
                </div>
                <div className="text-[11px] text-stone-500">
                  Date: {selectedInvoiceToPrint.date} · {selectedInvoiceToPrint.time || 'Morning'}
                </div>
              </div>
            </div>

            {/* Consignee & Dispatch Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Consignee / Customer</span>
                <div className="text-sm font-black text-stone-900 mt-0.5">{selectedInvoiceToPrint.customerName}</div>
                <div className="text-xs text-stone-600 mt-1">Authorized Receiver: <b className="text-stone-800">{selectedInvoiceToPrint.receiverName || 'Direct'}</b></div>
                <div className="text-[11px] text-stone-500">Account terms: {selectedInvoiceToPrint.paymentTerms}</div>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Maturity & Settlement</span>
                <div className="text-xs font-bold text-stone-800 mt-0.5">Due Date: <span className="text-rose-700">{selectedInvoiceToPrint.dueDate}</span></div>
                <div className="text-xs text-stone-600 mt-1">Status: <span className="font-bold text-emerald-800 uppercase">{selectedInvoiceToPrint.status}</span></div>
                <div className="text-[11px] text-stone-500">Milk Batch: Morning Fresh Chilled Milk</div>
              </div>
            </div>

            {/* Itemized Quality & Pricing Table */}
            <div className="border border-stone-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-100 text-stone-700 font-bold border-b border-stone-200">
                  <tr>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-right">Volume</th>
                    <th className="py-2.5 px-3 text-center">Quality (Fat / SNF)</th>
                    <th className="py-2.5 px-3 text-right">Unit Rate</th>
                    <th className="py-2.5 px-3 text-right">Amount (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  <tr>
                    <td className="py-3 px-3">
                      <div className="font-bold text-stone-900">Fresh Raw Whole Cow Milk</div>
                      <div className="text-[10px] text-stone-400">Pure herd collection, filtered & chilled at 4°C</div>
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-stone-900">
                      {selectedInvoiceToPrint.litres} Litres
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold text-[11px] border border-emerald-200">
                        {selectedInvoiceToPrint.fatPercent || '4.1'}% Fat · {selectedInvoiceToPrint.snfPercent || '8.5'}% SNF
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-stone-800">
                      Rs. {selectedInvoiceToPrint.ratePerL}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-stone-900 text-sm">
                      Rs. {selectedInvoiceToPrint.totalAmount?.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Ledger Balance Card */}
            <div className="grid grid-cols-2 gap-4 items-end pt-2">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-[11px] text-stone-600 space-y-1">
                <div className="font-bold text-stone-800">Declaration & Warranty:</div>
                <p>We certify this milk is unadulterated, free from antibiotics, chilled upon milking, and conforms to state dairy standards.</p>
              </div>

              <div className="space-y-1.5 text-xs text-right bg-stone-50 p-3 rounded-xl border border-stone-200">
                <div className="flex justify-between text-stone-600">
                  <span>Gross Delivery Value:</span>
                  <span className="font-bold text-stone-900">Rs. {selectedInvoiceToPrint.totalAmount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-800">
                  <span>Paid at Dispatch:</span>
                  <span className="font-bold">Rs. {selectedInvoiceToPrint.paidAmount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-stone-300 pt-1.5 text-sm font-black">
                  <span className="text-stone-900">Net Due Balance:</span>
                  <span className="text-rose-700">Rs. {selectedInvoiceToPrint.remainingBalance?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Signatures */}
            <div className="pt-6 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="signature-box pt-3 border-t border-stone-300">
                <div className="font-bold text-stone-900">Dairy Dispatcher / Milker</div>
                <div className="text-[10px] text-stone-400">Signature & Farm Quality Seal</div>
              </div>
              <div className="signature-box pt-3 border-t border-stone-300">
                <div className="font-bold text-stone-900">Buyer / Receiver</div>
                <div className="text-[10px] text-stone-400">Goods Received in Satisfactory Condition</div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
