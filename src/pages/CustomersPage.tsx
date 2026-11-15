import React, { useEffect, useState } from 'react';
import { api } from '../api/api.ts';
import { Modal } from '../components/Modal.tsx';
import { Users, Plus, Phone, Building2, Receipt, ArrowRight, Printer } from 'lucide-react';

interface CustomersPageProps {
  autoOpenNonce?: number;
}

export const CustomersPage: React.FC<CustomersPageProps> = ({ autoOpenNonce }) => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [selectedLedgerCustomer, setSelectedLedgerCustomer] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    company: '',
    phone: '',
    address: '',
    defaultRatePerL: '210',
    paymentTermsDays: '7',
    notes: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [custList, delList] = await Promise.all([api.getCustomers(), api.getDeliveries()]);
      setCustomers(custList);
      setDeliveries(delList);
    } catch (err) {
      console.error('Error loading customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (autoOpenNonce) {
      handleOpenAdd();
    }
  }, [autoOpenNonce]);

  const handleSaveCustomer = async () => {
    if (!formData.name.trim()) {
      alert('Customer name is required.');
      return;
    }
    const rate = parseFloat(formData.defaultRatePerL || '210');
    if (isNaN(rate) || rate <= 0) {
      alert('Default milk rate must be greater than zero.');
      return;
    }
    const terms = parseInt(formData.paymentTermsDays || '7', 10);
    if (isNaN(terms) || terms < 0) {
      alert('Payment terms must be 0 or more days.');
      return;
    }

    try {
      await api.createCustomer({
        ...(editingCustomer ? { id: editingCustomer.id } : {}),
        ...formData,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        defaultRatePerL: rate,
        paymentTermsDays: terms,
        status: editingCustomer?.status || 'Active',
      });

      setShowAddModal(false);
      setEditingCustomer(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error saving customer');
    }
  };

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      company: '',
      phone: '',
      address: '',
      defaultRatePerL: '210',
      paymentTermsDays: '7',
      notes: '',
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (c: any) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name || '',
      company: c.company || '',
      phone: c.phone || '',
      address: c.address || '',
      defaultRatePerL: String(c.defaultRatePerL || 210),
      paymentTermsDays: String(c.paymentTermsDays || 7),
      notes: c.notes || '',
    });
    setShowAddModal(true);
  };

  // Compute receivables & totals for each customer
  const customerRows = customers.map(c => {
    const custDeliveries = deliveries.filter(
      d => d.customerId === c.id || (!d.customerId && d.customerName === c.name)
    );
    const totalBilled = custDeliveries.reduce((s, d) => s + d.totalAmount, 0);
    const totalPaid = custDeliveries.reduce((s, d) => s + d.paidAmount, 0);
    const totalOutstanding = custDeliveries.reduce((s, d) => s + d.remainingBalance, 0);

    return {
      ...c,
      deliveryCount: custDeliveries.length,
      totalBilled,
      totalPaid,
      totalOutstanding,
      deliveries: custDeliveries,
    };
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Top action toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-stone-200 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold text-stone-700">
          <Users className="w-4 h-4 text-emerald-700" />
          <span>Dairy Customers & Receivables Ledger</span>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#16734b] hover:bg-[#125e3d] rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-50 text-[11px] font-bold uppercase tracking-wider text-stone-500 border-b border-stone-200">
              <tr>
                <th className="p-3">Customer / Company</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Default Rate</th>
                <th className="p-3">Terms</th>
                <th className="p-3">Total Billed</th>
                <th className="p-3">Paid Amount</th>
                <th className="p-3">Outstanding Balance</th>
                <th className="p-3 text-right">Ledger</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {customerRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-stone-400">
                    No customers added yet.
                  </td>
                </tr>
              ) : (
                customerRows.map(c => (
                  <tr key={c.id} className="hover:bg-stone-50/70">
                    <td className="p-3">
                      <span className="font-extrabold text-stone-900 block">{c.name}</span>
                      {c.company && (
                        <span className="text-[10px] text-stone-500">{c.company}</span>
                      )}
                    </td>
                    <td className="p-3 text-stone-600">{c.phone || '-'}</td>
                    <td className="p-3 font-mono font-medium">Rs. {c.defaultRatePerL} / L</td>
                    <td className="p-3 text-stone-600">{c.paymentTermsDays} days</td>
                    <td className="p-3 font-semibold text-stone-900">
                      Rs. {c.totalBilled.toLocaleString()}
                    </td>
                    <td className="p-3 font-semibold text-emerald-800">
                      Rs. {c.totalPaid.toLocaleString()}
                    </td>
                    <td className="p-3">
                      {c.totalOutstanding > 0 ? (
                        <span className="font-extrabold text-rose-700 font-mono text-sm">
                          Rs. {c.totalOutstanding.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-bold">Cleared (Rs. 0)</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="px-2.5 py-1 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setSelectedLedgerCustomer(c)}
                          className="px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded cursor-pointer"
                        >
                          View Ledger
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

      {/* Add / Edit Customer Modal */}
      <Modal
        title={editingCustomer ? `Edit Customer: ${editingCustomer.name}` : "Add Dairy Customer / Buyer"}
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingCustomer(null);
        }}
        footer={
          <>
            <button
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveCustomer}
              className="px-4 py-2 text-xs font-bold text-white bg-[#16734b] hover:bg-[#125e3d] rounded-lg cursor-pointer"
            >
              Save Customer
            </button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Customer / Buyer Name *</label>
              <input
                type="text"
                placeholder="e.g. Nestlé, Engro, Local Dairy"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg font-bold"
              />
            </div>
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Company / Organization</label>
              <input
                type="text"
                placeholder="e.g. Nestlé Milk Collection Center"
                value={formData.company}
                onChange={e => setFormData({ ...formData, company: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Phone Number</label>
              <input
                type="text"
                placeholder="e.g. +92 300 1234567"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Address / Center Location</label>
              <input
                type="text"
                placeholder="e.g. Bypass Chilling Center"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-700 font-bold mb-1">Default Rate / L (Rs.) *</label>
              <input
                type="number"
                step="0.01"
                value={formData.defaultRatePerL}
                onChange={e => setFormData({ ...formData, defaultRatePerL: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg font-bold"
              />
            </div>
            <div>
              <label className="block text-stone-700 font-bold mb-1">Payment Terms (Days) *</label>
              <input
                type="number"
                value={formData.paymentTermsDays}
                onChange={e => setFormData({ ...formData, paymentTermsDays: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-stone-600 font-semibold mb-1">Notes</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
            />
          </div>
        </div>
      </Modal>

      {/* Customer Ledger Modal with Splendid Print Statement */}
      <Modal
        title={`Customer Ledger — ${selectedLedgerCustomer?.name || ''}`}
        isOpen={Boolean(selectedLedgerCustomer)}
        onClose={() => setSelectedLedgerCustomer(null)}
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="text-[11px] text-stone-500">
              Account credit window: {selectedLedgerCustomer?.paymentTermsDays || 7} days
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedLedgerCustomer(null)}
                className="px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#16734b] hover:bg-[#125e3d] rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Statement</span>
              </button>
            </div>
          </div>
        }
      >
        <div className="printable-sheet space-y-4 text-xs text-stone-800">
          {/* Header visible in print / preview */}
          <div className="border-b-2 border-emerald-800 pb-3 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-950 text-white font-black text-base flex items-center justify-center shadow-xs">
                BA
              </div>
              <div>
                <h2 className="text-base font-black tracking-wide text-emerald-950 uppercase">BA Dairy Farm</h2>
                <p className="text-[11px] text-stone-500">Commercial Milk Supply & Client Ledger Account</p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-2.5 py-0.5 bg-emerald-100 text-emerald-900 font-extrabold rounded-md text-[10px] tracking-wider uppercase border border-emerald-300">
                Official Account Statement
              </span>
              <div className="text-[11px] text-stone-500 mt-1">
                Statement Date: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
            </div>
          </div>

          {/* Customer Profile Banner */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
            <div>
              <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Account Holder</span>
              <div className="text-sm font-extrabold text-stone-900">{selectedLedgerCustomer?.name}</div>
              {selectedLedgerCustomer?.company && (
                <div className="text-xs text-stone-600 font-medium">{selectedLedgerCustomer.company}</div>
              )}
              <div className="text-xs text-stone-600 mt-0.5">📞 {selectedLedgerCustomer?.phone || 'No phone recorded'}</div>
              {selectedLedgerCustomer?.address && (
                <div className="text-xs text-stone-500">{selectedLedgerCustomer.address}</div>
              )}
            </div>
            <div className="text-right flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Agreed Terms</span>
                <div className="text-xs font-bold text-stone-800 mt-0.5">
                  Contract Rate: <span className="text-emerald-700 font-extrabold">Rs. {selectedLedgerCustomer?.defaultRatePerL || 210}</span> / Litre
                </div>
                <div className="text-xs text-stone-600">Credit Cycle: {selectedLedgerCustomer?.paymentTermsDays || 7} Days</div>
              </div>
              <div className="text-[10px] text-stone-400">Account Status: <span className="text-emerald-700 font-bold">Active Commercial Client</span></div>
            </div>
          </div>

          {/* Summary Strip */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-white rounded-xl border border-stone-200 text-center">
            <div className="p-2 bg-stone-50 rounded-lg">
              <span className="text-[10px] text-stone-500 font-semibold uppercase">Total Billed</span>
              <div className="text-base font-extrabold text-stone-900">
                Rs. {selectedLedgerCustomer?.totalBilled?.toLocaleString()}
              </div>
            </div>
            <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-100">
              <span className="text-[10px] text-emerald-800 font-semibold uppercase">Total Settled / Paid</span>
              <div className="text-base font-extrabold text-emerald-800">
                Rs. {selectedLedgerCustomer?.totalPaid?.toLocaleString()}
              </div>
            </div>
            <div className="p-2 bg-rose-50 rounded-lg border border-rose-200">
              <span className="text-[10px] text-rose-700 font-bold uppercase">Outstanding Balance Due</span>
              <div className="text-base font-black text-rose-700">
                Rs. {selectedLedgerCustomer?.totalOutstanding?.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Invoices Ledger Table */}
          <div className="overflow-x-auto border border-stone-200 rounded-lg">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-stone-100 text-stone-600 font-bold">
                <tr>
                  <th className="p-2">Invoice #</th>
                  <th className="p-2">Date</th>
                  <th className="p-2 text-right">Volume</th>
                  <th className="p-2 text-right">Billed Amount</th>
                  <th className="p-2 text-right">Paid</th>
                  <th className="p-2 text-right">Balance Due</th>
                  <th className="p-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {selectedLedgerCustomer?.deliveries?.map((d: any) => (
                  <tr key={d.id} className="hover:bg-stone-50">
                    <td className="p-2 font-mono font-bold text-stone-900">{d.invoiceNumber}</td>
                    <td className="p-2 text-stone-600">{d.date}</td>
                    <td className="p-2 text-right font-medium">{d.litres} L</td>
                    <td className="p-2 text-right font-bold text-stone-900">Rs. {d.totalAmount.toLocaleString()}</td>
                    <td className="p-2 text-right font-semibold text-emerald-700">Rs. {d.paidAmount.toLocaleString()}</td>
                    <td className="p-2 text-right font-black text-rose-600">
                      Rs. {d.remainingBalance.toLocaleString()}
                    </td>
                    <td className="p-2 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        d.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                        d.status === 'Partial' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Signatures & Formal Stamp */}
          <div className="pt-6 grid grid-cols-2 gap-8 text-center text-xs">
            <div className="signature-box pt-3 border-t border-stone-300">
              <div className="font-bold text-stone-900">Authorized Farm Officer</div>
              <div className="text-[10px] text-stone-400">BA Dairy Farm Accounts & Dispatch</div>
            </div>
            <div className="signature-box pt-3 border-t border-stone-300">
              <div className="font-bold text-stone-900">Customer Acknowledgement</div>
              <div className="text-[10px] text-stone-400">Verified & Confirmed By Buyer</div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
