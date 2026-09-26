import React, { useEffect, useState } from 'react';
import { api } from '../client/api.ts';
import { Modal } from '../components/Modal.tsx';
import { Users, Plus, Phone, Building2, Receipt, ArrowRight } from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
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

  const handleSaveCustomer = async () => {
    if (!formData.name.trim()) {
      alert('Customer name is required.');
      return;
    }

    try {
      await api.createCustomer({
        ...formData,
        defaultRatePerL: parseFloat(formData.defaultRatePerL || '210'),
        paymentTermsDays: parseInt(formData.paymentTermsDays || '7', 10),
        status: 'Active',
      });

      setShowAddModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error creating customer');
    }
  };

  // Compute receivables & totals for each customer
  const customerRows = customers.map(c => {
    const custDeliveries = deliveries.filter(d => d.customerId === c.id || d.customerName === c.name);
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
          onClick={() => {
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
          }}
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
                      <button
                        onClick={() => setSelectedLedgerCustomer(c)}
                        className="px-2.5 py-1 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded cursor-pointer"
                      >
                        View Ledger
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      <Modal
        title="Add Dairy Customer / Buyer"
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
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

      {/* Customer Ledger Modal */}
      <Modal
        title={`Customer Ledger — ${selectedLedgerCustomer?.name || ''}`}
        isOpen={Boolean(selectedLedgerCustomer)}
        onClose={() => setSelectedLedgerCustomer(null)}
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-3 gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200 text-center">
            <div>
              <span className="text-[10px] text-stone-500 font-medium">Total Billed</span>
              <div className="text-base font-bold text-stone-900">
                Rs. {selectedLedgerCustomer?.totalBilled?.toLocaleString()}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-stone-500 font-medium">Total Paid</span>
              <div className="text-base font-bold text-emerald-800">
                Rs. {selectedLedgerCustomer?.totalPaid?.toLocaleString()}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-stone-500 font-medium">Outstanding Due</span>
              <div className="text-base font-black text-rose-700">
                Rs. {selectedLedgerCustomer?.totalOutstanding?.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto border border-stone-200 rounded-lg">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-stone-50 text-stone-500 sticky top-0">
                <tr>
                  <th className="p-2">Invoice #</th>
                  <th className="p-2">Date</th>
                  <th className="p-2">Litres</th>
                  <th className="p-2">Total</th>
                  <th className="p-2">Paid</th>
                  <th className="p-2">Remaining</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {selectedLedgerCustomer?.deliveries?.map((d: any) => (
                  <tr key={d.id}>
                    <td className="p-2 font-mono font-bold">{d.invoiceNumber}</td>
                    <td className="p-2">{d.date}</td>
                    <td className="p-2">{d.litres} L</td>
                    <td className="p-2 font-bold">Rs. {d.totalAmount.toLocaleString()}</td>
                    <td className="p-2 text-emerald-700">Rs. {d.paidAmount.toLocaleString()}</td>
                    <td className="p-2 font-bold text-rose-600">
                      Rs. {d.remainingBalance.toLocaleString()}
                    </td>
                    <td className="p-2">
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-stone-100 text-stone-700">
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </div>
  );
};
