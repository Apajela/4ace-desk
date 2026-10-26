import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Receipt,
  Download,
  Trash2,
  TrendingUp,
  AlertCircle,
  FileSpreadsheet,
  X,
  CheckCircle,
} from 'lucide-react';
import { ExpenseItem, Project, ExpenseCategory } from '../types';
import { DEFAULT_EXPENSES } from '../data/defaultData';

export interface ExpensesViewProps {
  currentProject?: Project;
  expenses?: ExpenseItem[];
  onAddExpense?: (expense: Omit<ExpenseItem, 'id'>) => void;
  onUpdateExpenseStatus?: (id: string, status: ExpenseItem['status']) => void;
  onOpenReceiptScanner?: () => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  currentProject,
  expenses: externalExpenses,
  onAddExpense,
  onUpdateExpenseStatus,
  onOpenReceiptScanner,
}) => {
  const [internalExpenses, setInternalExpenses] = useState<ExpenseItem[]>(DEFAULT_EXPENSES);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);

  // New expense form states
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<ExpenseCategory>('Materials');
  const [description, setDescription] = useState('');
  const [vendor, setVendor] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [invoiceNo, setInvoiceNo] = useState('');

  const activeExpenses = externalExpenses || internalExpenses;

  const projectFiltered = currentProject
    ? activeExpenses.filter(
        (e) => !e.projectId || e.projectId === currentProject.id || e.projectName === currentProject.name
      )
    : activeExpenses;

  const totalAmount = projectFiltered.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const pendingAmount = projectFiltered
    .filter((e) => e.status === 'Pending' || e.paymentStatus === 'Pending')
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const filteredExpenses = projectFiltered.filter((exp) => {
    const desc = exp.description || exp.notes || '';
    const vend = exp.vendor || exp.supplier || '';
    const inv = exp.invoiceNumber || exp.invoiceNo || exp.id || '';
    const matchesSearch =
      desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vend.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'All' || exp.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || amount <= 0) return;

    const newExp: Omit<ExpenseItem, 'id'> = {
      projectId: currentProject?.id || 'proj-1',
      projectName: currentProject?.name || 'Current Site Project',
      category,
      description: description.trim(),
      amount: Number(amount),
      date,
      vendor: vendor.trim() || 'Site Cashier',
      supplier: vendor.trim() || 'Site Cashier',
      invoiceNumber: invoiceNo.trim() || undefined,
      invoiceNo: invoiceNo.trim() || undefined,
      paymentStatus: 'Paid',
      status: 'Approved',
      paymentMode,
      paymentMethod: paymentMode,
    };

    if (onAddExpense) {
      onAddExpense(newExp);
    } else {
      setInternalExpenses((prev) => [
        { ...newExp, id: `exp-${Date.now()}` },
        ...prev,
      ]);
    }

    setDescription('');
    setVendor('');
    setAmount(0);
    setInvoiceNo('');
    setShowAddModal(false);
  };

  const handleDeleteExpense = (id: string) => {
    setInternalExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div className="space-y-6 text-[#263238]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[#123B5D]">
              Expense &amp; Procurement Ledger
            </h1>
            {currentProject && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#EAF7FA] text-[#123B5D] font-semibold border border-[#cbeaf0]">
                {currentProject.name}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[#546e7a] mt-0.5">
            Monitor and record all site purchases, equipment rentals, material deliveries, and logistics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenReceiptScanner && (
            <button
              onClick={onOpenReceiptScanner}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-[#cbeaf0] rounded-xl text-xs font-semibold bg-white text-[#123B5D] hover:bg-[#EAF7FA] transition cursor-pointer shadow-xs"
            >
              <Receipt className="w-4 h-4 text-[#18A999]" />
              <span>Scan Receipt (AI)</span>
            </button>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#18A999] text-white rounded-xl text-xs font-bold hover:bg-[#148f81] transition cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#cbeaf0] shadow-xs">
          <div className="flex justify-between items-center text-xs font-semibold text-[#546e7a]">
            <span>Total Site Expenditures</span>
            <div className="w-8 h-8 rounded-lg bg-[#EAF7FA] flex items-center justify-center text-[#18A999]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black mt-2 text-[#123B5D] font-mono">
            ₱{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <div className="text-[11px] text-[#546e7a] mt-1">
            Recorded vouchers &amp; supplier billings
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#cbeaf0] shadow-xs">
          <div className="flex justify-between items-center text-xs font-semibold text-[#546e7a]">
            <span>Pending Approvals</span>
            <div className="w-8 h-8 rounded-lg bg-[#EAF7FA] flex items-center justify-center text-amber-500">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black mt-2 text-[#123B5D] font-mono">
            ₱{pendingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <div className="text-[11px] text-[#546e7a] mt-1">
            Awaiting project manager verification
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#cbeaf0] shadow-xs">
          <div className="flex justify-between items-center text-xs font-semibold text-[#546e7a]">
            <span>Recorded Transactions</span>
            <div className="w-8 h-8 rounded-lg bg-[#EAF7FA] flex items-center justify-center text-[#123B5D]">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black mt-2 text-[#123B5D]">
            {projectFiltered.length} Records
          </p>
          <div className="text-[11px] text-[#546e7a] mt-1">
            All disbursement categories
          </div>
        </div>
      </div>

      {/* Controls & Filters - Section: Ice Blue #EAF7FA */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-[#EAF7FA] p-3.5 rounded-2xl border border-[#cbeaf0] shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#546e7a]" />
          <input
            type="text"
            placeholder="Search by vendor, receipt no., or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-[#cbeaf0] rounded-xl text-[#263238] placeholder-slate-400 focus:outline-none focus:border-[#18A999]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-[#546e7a]" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs border border-[#cbeaf0] rounded-xl px-3 py-1.5 bg-white font-semibold text-[#123B5D] cursor-pointer"
          >
            <option value="All">All Categories</option>
            <option value="Materials">Materials &amp; Supplies</option>
            <option value="Labor">Labor &amp; Subcontractor</option>
            <option value="Fuel">Fuel &amp; Generator</option>
            <option value="Equipment">Equipment &amp; Rentals</option>
            <option value="Food">Meals &amp; Subsidy</option>
            <option value="Utilities">Utilities &amp; Power</option>
            <option value="Safety & Tools">Safety &amp; PPE</option>
            <option value="Others">Others</option>
          </select>
          <button
            onClick={() => window.print()}
            className="p-2 bg-white border border-[#cbeaf0] rounded-xl text-[#123B5D] hover:bg-slate-50 transition cursor-pointer"
            title="Print or Export Ledger"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#cbeaf0] overflow-x-auto shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#EAF7FA] text-[#123B5D] font-bold uppercase tracking-wider border-b border-[#cbeaf0]">
            <tr>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Supplier / Vendor</th>
              <th className="py-3 px-4 text-right">Amount (PHP)</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[#546e7a]">
                  No expense records found matching current criteria.
                </td>
              </tr>
            ) : (
              filteredExpenses.map((exp) => {
                const currentStatus = exp.status || exp.paymentStatus || 'Approved';
                return (
                  <tr key={exp.id} className="hover:bg-[#EAF7FA]/30 transition">
                    <td className="py-3 px-4 text-[#546e7a] whitespace-nowrap font-mono">{exp.date}</td>
                    <td className="py-3 px-4 font-semibold text-[#123B5D]">
                      {exp.description || exp.notes}
                      {(exp.invoiceNumber || exp.invoiceNo) && (
                        <span className="block text-[10px] text-[#546e7a] font-mono">
                          OR: {exp.invoiceNumber || exp.invoiceNo}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#EAF7FA] text-[#123B5D] border border-[#cbeaf0]">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#546e7a] font-medium">{exp.vendor || exp.supplier}</td>
                    <td className="py-3 px-4 text-right font-black font-mono text-[#123B5D] text-sm">
                      ₱{(Number(exp.amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {onUpdateExpenseStatus ? (
                        <select
                          value={currentStatus}
                          onChange={(e) =>
                            onUpdateExpenseStatus(exp.id, e.target.value as ExpenseItem['status'])
                          }
                          className={`px-2 py-0.5 text-xs font-semibold rounded-full border cursor-pointer ${
                            currentStatus === 'Approved' || currentStatus === 'Paid'
                              ? 'bg-[#EAF7FA] text-[#0d786d] border-[#bce6ed]'
                              : currentStatus === 'Pending'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-red-50 text-red-800 border-red-200'
                          }`}
                        >
                          <option value="Approved">Approved / Paid</option>
                          <option value="Pending">Pending</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      ) : (
                        <span
                          className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${
                            currentStatus === 'Approved' || currentStatus === 'Paid'
                              ? 'bg-[#EAF7FA] text-[#0d786d]'
                              : currentStatus === 'Pending'
                              ? 'bg-amber-50 text-amber-800'
                              : 'bg-red-50 text-red-800'
                          }`}
                        >
                          {currentStatus}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded transition cursor-pointer"
                        title="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-[#0d2b45] flex items-center justify-between bg-[#123B5D] text-white">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#18A999]" />
                <span>Record Site Expense Voucher</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-teal-200 hover:text-white p-1 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#123B5D] mb-1">
                  Item Description / Scope *
                </label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. 50 Bags Portland Cement & Washed Sand"
                  className="w-full px-3 py-2 border border-[#cbeaf0] rounded-xl text-[#263238] focus:outline-none focus:border-[#18A999]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#123B5D] mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                    className="w-full px-3 py-2 border border-[#cbeaf0] rounded-xl text-[#263238] bg-white focus:outline-none focus:border-[#18A999]"
                  >
                    <option value="Materials">Materials &amp; Supplies</option>
                    <option value="Labor">Labor &amp; Subcontractor</option>
                    <option value="Fuel">Fuel &amp; Power</option>
                    <option value="Equipment">Equipment &amp; Rentals</option>
                    <option value="Food">Meals &amp; Subsidy</option>
                    <option value="Safety & Tools">Safety &amp; Tools</option>
                    <option value="Utilities">Utilities &amp; Fees</option>
                    <option value="Others">Others</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#123B5D] mb-1">Amount (PHP) *</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    value={amount || ''}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-[#cbeaf0] rounded-xl text-[#123B5D] font-bold font-mono focus:outline-none focus:border-[#18A999]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#123B5D] mb-1">Supplier / Merchant</label>
                  <input
                    type="text"
                    required
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    placeholder="e.g. Wilcon Depot"
                    className="w-full px-3 py-2 border border-[#cbeaf0] rounded-xl text-[#263238] focus:outline-none focus:border-[#18A999]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#123B5D] mb-1">Invoice / Receipt No.</label>
                  <input
                    type="text"
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                    placeholder="e.g. OR-84920"
                    className="w-full px-3 py-2 border border-[#cbeaf0] rounded-xl text-[#263238] font-mono focus:outline-none focus:border-[#18A999]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#123B5D] mb-1">Payment Method</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full px-3 py-2 border border-[#cbeaf0] rounded-xl text-[#263238] bg-white focus:outline-none focus:border-[#18A999]"
                  >
                    <option value="Cash">Cash Voucher</option>
                    <option value="Bank Transfer">Bank Transfer / Online</option>
                    <option value="GCash">GCash / Digital Wallet</option>
                    <option value="Check">Company Check</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#123B5D] mb-1">Transaction Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-[#cbeaf0] rounded-xl text-[#263238] focus:outline-none focus:border-[#18A999]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-medium text-[#546e7a] hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#18A999] hover:bg-[#148f81] text-white font-bold rounded-xl shadow-xs transition cursor-pointer"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesView;
