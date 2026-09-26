import React, { useEffect, useState } from 'react';
import { api } from '../client/api.ts';
import { Modal } from '../components/Modal.tsx';
import { Truck, Plus, DollarSign, Printer, Calendar, ArrowRight } from 'lucide-react';

export const SalesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
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
    litres: '320',
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
      const [invList, custList] = await Promise.all([api.getDeliveries(), api.getCustomers()]);
      setInvoices(invList);
      setCustomers(custList);
      if (custList.length > 0 && !invoiceForm.customerId) {
        setInvoiceForm(prev => ({
          ...prev,
          customerId: custList[0].id,
          customerName: custList[0].name,
          ratePerL: String(custList[0].defaultRatePerL || 210),
          paymentTermsDays: String(custList[0].paymentTermsDays || 7),
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

  const totalCalc =
    (parseFloat(invoiceForm.litres) || 0) * (parseFloat(invoiceForm.ratePerL) || 0);

  const handleSaveInvoice = async () => {
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
                litres: '',
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

      {/* Printable Invoice Modal (In-App Print Simulation) */}
      <Modal
        title={`Print Invoice Receipt: ${selectedInvoiceToPrint?.invoiceNumber || ''}`}
        isOpen={Boolean(selectedInvoiceToPrint)}
        onClose={() => setSelectedInvoiceToPrint(null)}
        footer={
          <>
            <button
              onClick={() => setSelectedInvoiceToPrint(null)}
              className="px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
            >
              Close
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-1.5 text-xs font-bold text-white bg-[#16734b] hover:bg-[#125e3d] rounded-lg"
            >
              Print Receipt
            </button>
          </>
        }
      >
        {selectedInvoiceToPrint && (
          <div className="p-4 bg-white border border-stone-300 rounded-xl space-y-4 text-xs font-mono text-stone-900">
            <div className="text-center border-b border-stone-200 pb-2">
              <h3 className="font-bold text-base tracking-wider uppercase">Sunrise Dairy Farm</h3>
              <p className="text-[11px] text-stone-500">Official Milk Delivery Slip</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <b>Invoice:</b> {selectedInvoiceToPrint.invoiceNumber}
                <br />
                <b>Date:</b> {selectedInvoiceToPrint.date} {selectedInvoiceToPrint.time}
              </div>
              <div className="text-right">
                <b>Buyer:</b> {selectedInvoiceToPrint.customerName}
                <br />
                <b>Receiver:</b> {selectedInvoiceToPrint.receiverName || '—'}
              </div>
            </div>

            <table className="w-full border-t border-b border-stone-300 text-left my-2 py-1 text-[11px]">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="py-1">Quantity</th>
                  <th className="py-1">Fat %</th>
                  <th className="py-1">SNF %</th>
                  <th className="py-1">Rate</th>
                  <th className="py-1 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-1.5 font-bold">{selectedInvoiceToPrint.litres} Litres</td>
                  <td className="py-1.5">{selectedInvoiceToPrint.fatPercent || '—'}%</td>
                  <td className="py-1.5">{selectedInvoiceToPrint.snfPercent || '—'}%</td>
                  <td className="py-1.5">Rs. {selectedInvoiceToPrint.ratePerL}</td>
                  <td className="py-1.5 text-right font-bold">
                    Rs. {selectedInvoiceToPrint.totalAmount?.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="space-y-1 text-right text-[11px]">
              <div>
                Paid Amount: <b>Rs. {selectedInvoiceToPrint.paidAmount?.toLocaleString()}</b>
              </div>
              <div className="text-sm font-black">
                Balance Due:{' '}
                <span className="text-rose-700">
                  Rs. {selectedInvoiceToPrint.remainingBalance?.toLocaleString()}
                </span>
              </div>
              <div className="text-[10px] text-stone-500">
                Payment Terms: {selectedInvoiceToPrint.paymentTerms} (Due: {selectedInvoiceToPrint.dueDate})
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
