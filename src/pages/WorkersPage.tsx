import React, { useEffect, useState } from 'react';
import { api } from '../client/api.ts';
import { Modal } from '../components/Modal.tsx';
import { UserCheck, Plus, DollarSign, History, Calendar } from 'lucide-react';

export const WorkersPage: React.FC = () => {
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddWorkerModal, setShowAddWorkerModal] = useState(false);
  const [showTxModal, setShowTxModal] = useState<any | null>(null);
  const [selectedLedgerWorker, setSelectedLedgerWorker] = useState<any | null>(null);
  const [ledgerData, setLedgerData] = useState<any | null>(null);

  // Worker Form
  const [workerForm, setWorkerForm] = useState({
    name: '',
    phone: '',
    role: 'Milker / Farm Hand',
    joiningDate: new Date().toISOString().slice(0, 10),
    monthlySalary: '35000',
    notes: '',
  });

  // Transaction Form
  const [txForm, setTxForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    type: 'Advance' as 'Advance' | 'Salary Payment' | 'Deduction' | 'Bonus',
    amount: '',
    notes: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const list = await api.getWorkers();
      setWorkers(list);
    } catch (err) {
      console.error('Error loading workers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveWorker = async () => {
    if (!workerForm.name.trim()) {
      alert('Worker name is required.');
      return;
    }

    try {
      await api.createWorker({
        ...workerForm,
        monthlySalary: parseFloat(workerForm.monthlySalary || '0'),
        status: 'Active',
      });

      setShowAddWorkerModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error creating worker');
    }
  };

  const handleSaveTx = async () => {
    if (!showTxModal || !txForm.amount || parseFloat(txForm.amount) <= 0) {
      alert('Amount must be greater than zero.');
      return;
    }

    try {
      await api.recordWorkerTx(showTxModal.id, {
        date: txForm.date,
        type: txForm.type,
        amount: parseFloat(txForm.amount),
        notes: txForm.notes,
      });

      setShowTxModal(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error saving worker transaction');
    }
  };

  const handleOpenLedger = async (worker: any) => {
    setSelectedLedgerWorker(worker);
    try {
      const data = await api.getWorkerLedger(worker.id);
      setLedgerData(data);
    } catch (err) {
      console.error(err);
      setLedgerData(null);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Top action toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-stone-200 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold text-stone-700">
          <UserCheck className="w-4 h-4 text-emerald-700" />
          <span>Farm Workers, Advances & Salary Ledger</span>
        </div>

        <button
          onClick={() => {
            setWorkerForm({
              name: '',
              phone: '',
              role: 'Milker / Farm Hand',
              joiningDate: new Date().toISOString().slice(0, 10),
              monthlySalary: '35000',
              notes: '',
            });
            setShowAddWorkerModal(true);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#16734b] hover:bg-[#125e3d] rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Worker</span>
        </button>
      </div>

      <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-600">
        👨‍🌾 <b>Advance & Salary Rule:</b> If a worker receives Rs. 5,000 advance + Rs. 5,000 advance,
        total advance is displayed as Rs. 10,000 while preserving each dated transaction.
      </div>

      {/* Workers Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-50 text-[11px] font-bold uppercase tracking-wider text-stone-500 border-b border-stone-200">
              <tr>
                <th className="p-3">Worker Name</th>
                <th className="p-3">Role</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Joining Date</th>
                <th className="p-3">Monthly Salary</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {workers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-stone-400">
                    No workers registered yet.
                  </td>
                </tr>
              ) : (
                workers.map(w => (
                  <tr key={w.id} className="hover:bg-stone-50/70">
                    <td className="p-3 font-extrabold text-stone-900">{w.name}</td>
                    <td className="p-3 font-medium text-stone-800">{w.role}</td>
                    <td className="p-3 text-stone-600">{w.phone || '-'}</td>
                    <td className="p-3 text-stone-600">{w.joiningDate}</td>
                    <td className="p-3 font-bold text-stone-900">
                      Rs. {w.monthlySalary?.toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {w.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setShowTxModal(w);
                            setTxForm({
                              date: new Date().toISOString().slice(0, 10),
                              type: 'Advance',
                              amount: '',
                              notes: '',
                            });
                          }}
                          className="px-2.5 py-1 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded cursor-pointer"
                        >
                          + Advance / Pay
                        </button>
                        <button
                          onClick={() => handleOpenLedger(w)}
                          className="px-2.5 py-1 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded cursor-pointer"
                        >
                          Ledger
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

      {/* Add Worker Modal */}
      <Modal
        title="Register Farm Worker"
        isOpen={showAddWorkerModal}
        onClose={() => setShowAddWorkerModal(false)}
        footer={
          <>
            <button
              onClick={() => setShowAddWorkerModal(false)}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveWorker}
              className="px-4 py-2 text-xs font-bold text-white bg-[#16734b] hover:bg-[#125e3d] rounded-lg cursor-pointer"
            >
              Save Worker
            </button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-stone-600 font-semibold mb-1">Full Name *</label>
            <input
              type="text"
              placeholder="e.g. Muhammad Ali"
              value={workerForm.name}
              onChange={e => setWorkerForm({ ...workerForm, name: e.target.value })}
              className="w-full px-3 py-1.5 border border-stone-200 rounded-lg font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Phone Number</label>
              <input
                type="text"
                placeholder="e.g. +92 301 1234567"
                value={workerForm.phone}
                onChange={e => setWorkerForm({ ...workerForm, phone: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Role / Job</label>
              <input
                type="text"
                value={workerForm.role}
                onChange={e => setWorkerForm({ ...workerForm, role: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Joining Date</label>
              <input
                type="date"
                value={workerForm.joiningDate}
                onChange={e => setWorkerForm({ ...workerForm, joiningDate: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-stone-700 font-bold mb-1">Monthly Salary (Rs.)</label>
              <input
                type="number"
                value={workerForm.monthlySalary}
                onChange={e => setWorkerForm({ ...workerForm, monthlySalary: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-stone-600 font-semibold mb-1">Notes</label>
            <textarea
              rows={2}
              value={workerForm.notes}
              onChange={e => setWorkerForm({ ...workerForm, notes: e.target.value })}
              className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
            />
          </div>
        </div>
      </Modal>

      {/* Record Worker Transaction Modal */}
      <Modal
        title={`Worker Transaction — ${showTxModal?.name || ''}`}
        isOpen={Boolean(showTxModal)}
        onClose={() => setShowTxModal(null)}
        footer={
          <>
            <button
              onClick={() => setShowTxModal(null)}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveTx}
              className="px-4 py-2 text-xs font-bold text-white bg-[#16734b] hover:bg-[#125e3d] rounded-lg cursor-pointer"
            >
              Save Transaction
            </button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Transaction Type *</label>
              <select
                value={txForm.type}
                onChange={e => setTxForm({ ...txForm, type: e.target.value as any })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white font-bold"
              >
                <option value="Advance">Salary Advance</option>
                <option value="Salary Payment">Regular Salary Payment</option>
                <option value="Deduction">Deduction (Advance Recovery / Fine)</option>
                <option value="Bonus">Bonus / Reward</option>
              </select>
            </div>
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Date *</label>
              <input
                type="date"
                value={txForm.date}
                onChange={e => setTxForm({ ...txForm, date: e.target.value })}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-stone-700 font-bold mb-1">Amount (Rs.) *</label>
            <input
              type="number"
              placeholder="e.g. 5000"
              value={txForm.amount}
              onChange={e => setTxForm({ ...txForm, amount: e.target.value })}
              className="w-full px-3 py-2 text-base font-bold border border-stone-300 rounded-lg focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-stone-600 font-semibold mb-1">Notes</label>
            <textarea
              rows={2}
              placeholder="Reason for advance or salary period..."
              value={txForm.notes}
              onChange={e => setTxForm({ ...txForm, notes: e.target.value })}
              className="w-full px-3 py-1.5 border border-stone-200 rounded-lg"
            />
          </div>
        </div>
      </Modal>

      {/* Worker Ledger Modal */}
      <Modal
        title={`Worker Ledger & Balance — ${selectedLedgerWorker?.name || ''}`}
        isOpen={Boolean(selectedLedgerWorker)}
        onClose={() => setSelectedLedgerWorker(null)}
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          {ledgerData?.summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-[10px] text-stone-500 font-medium">Total Advance</span>
                <div className="text-base font-bold text-amber-800">
                  Rs. {ledgerData.summary.totalAdvance?.toLocaleString()}
                </div>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-[10px] text-stone-500 font-medium">Deductions</span>
                <div className="text-base font-bold text-stone-700">
                  Rs. {ledgerData.summary.totalDeductions?.toLocaleString()}
                </div>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-[10px] text-stone-500 font-medium">Outstanding Advance</span>
                <div className="text-base font-black text-rose-700">
                  Rs. {ledgerData.summary.outstandingAdvance?.toLocaleString()}
                </div>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-[10px] text-stone-500 font-medium">Salary Paid</span>
                <div className="text-base font-bold text-emerald-800">
                  Rs. {ledgerData.summary.totalSalaryPaid?.toLocaleString()}
                </div>
              </div>
            </div>
          )}

          <div className="max-h-60 overflow-y-auto border border-stone-200 rounded-lg">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-stone-50 text-stone-500 sticky top-0">
                <tr>
                  <th className="p-2">Date</th>
                  <th className="p-2">Type</th>
                  <th className="p-2">Amount</th>
                  <th className="p-2">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {ledgerData?.transactions?.map((t: any) => (
                  <tr key={t.id}>
                    <td className="p-2 font-medium">{t.date}</td>
                    <td className="p-2">
                      <span
                        className={`font-bold ${
                          t.type === 'Advance'
                            ? 'text-amber-700'
                            : t.type === 'Salary Payment'
                            ? 'text-emerald-800'
                            : 'text-stone-700'
                        }`}
                      >
                        {t.type}
                      </span>
                    </td>
                    <td className="p-2 font-bold font-mono">Rs. {t.amount.toLocaleString()}</td>
                    <td className="p-2 text-stone-500">{t.notes || '-'}</td>
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
