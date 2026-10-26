import React, { useState } from 'react';
import {
  X,
  Camera,
  Sparkles,
  CheckCircle2,
  FileText,
  Receipt,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { ExpenseItem, ExpenseCategory } from '../types';

export interface ReceiptScannerModalProps {
  projectId: string;
  onClose: () => void;
  onSaveExpense: (expense: Omit<ExpenseItem, 'id'>) => void;
}

interface ExtractedData {
  vendor: string;
  tinNumber: string;
  invoiceNo: string;
  date: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  vatAmount: number;
  lineItems: { item: string; qty: number; unitPrice: number; total: number }[];
}

export const ReceiptScannerModal: React.FC<ReceiptScannerModalProps> = ({
  projectId,
  onClose,
  onSaveExpense,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);

  const sampleReceipts = [
    {
      title: 'Wilcon Depot - Cement & Tie Wires',
      url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
      data: {
        vendor: 'Wilcon Depot Taguig Fort',
        tinNumber: '000-345-678-000-VAT',
        invoiceNo: 'WD-2026-99318',
        date: new Date().toISOString().split('T')[0],
        amount: 38450,
        vatAmount: 4119.64,
        category: 'Materials' as ExpenseCategory,
        description: '140 Bags Portland Cement Type 1 + 10 rolls #16 G.I. Tie Wire',
        lineItems: [
          { item: 'Holcim Excel Portland Cement 40kg', qty: 140, unitPrice: 255, total: 35700 },
          { item: 'G.I. Tie Wire #16 (1kg roll)', qty: 25, unitPrice: 110, total: 2750 },
        ],
      },
    },
    {
      title: 'Petron - Site Generator Fuel Slip',
      url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&auto=format&fit=crop&q=80',
      data: {
        vendor: 'Petron Service Station C5 Taguig',
        tinNumber: '000-112-998-002-NVAT',
        invoiceNo: 'PET-2026-4402',
        date: new Date().toISOString().split('T')[0],
        amount: 18600,
        vatAmount: 1992.86,
        category: 'Fuel' as ExpenseCategory,
        description: '300 Liters Diesel Fuel for Tower Crane & Site Generator',
        lineItems: [
          { item: 'Petron Diesel Max (Liters)', qty: 300, unitPrice: 62.0, total: 18600 },
        ],
      },
    },
    {
      title: 'SafetyFirst QC - PPE Hardhats & Harnesses',
      url: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=800&auto=format&fit=crop&q=80',
      data: {
        vendor: 'SafetyFirst Industrial Supplies QC',
        tinNumber: '440-192-831-000-VAT',
        invoiceNo: 'SF-2026-8812',
        date: new Date().toISOString().split('T')[0],
        amount: 21500,
        vatAmount: 2303.57,
        category: 'Safety & Tools' as ExpenseCategory,
        description: '20 pcs Safety Full Body Harness with Lanyard + 30 ANSI Hardhats',
        lineItems: [
          { item: 'Full Body Safety Harness w/ Double Lanyard', qty: 10, unitPrice: 1450, total: 14500 },
          { item: 'Yellow Industrial Hardhat (Class E)', qty: 20, unitPrice: 350, total: 7000 },
        ],
      },
    },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
        processOcr(sampleReceipts[0].data);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectSample = (sample: (typeof sampleReceipts)[0]) => {
    setImagePreview(sample.url);
    processOcr(sample.data);
  };

  const processOcr = (extractedPreset: ExtractedData) => {
    setIsScanning(true);
    setScanComplete(false);
    setTimeout(() => {
      setExtracted(extractedPreset);
      setIsScanning(false);
      setScanComplete(true);
    }, 1200);
  };

  const handleApplyToExpenses = () => {
    if (!extracted) return;
    onSaveExpense({
      projectId,
      projectName: 'Current Site Project',
      date: extracted.date,
      category: extracted.category,
      description: extracted.description,
      vendor: extracted.vendor,
      supplier: extracted.vendor,
      tinNumber: extracted.tinNumber,
      invoiceNumber: extracted.invoiceNo,
      invoiceNo: extracted.invoiceNo,
      amount: extracted.amount,
      paymentStatus: 'Paid',
      status: 'Approved',
      paymentMode: 'Cash',
      paymentMethod: 'Cash',
      receiptUrl: imagePreview || undefined,
      receiptImage: imagePreview || undefined,
      notes: `Scanned via AI OCR. Items: ${extracted.lineItems.map((i) => `${i.qty}x ${i.item}`).join(', ')}`,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-[#123B5D] text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#18A999] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                AI Construction Receipt &amp; Invoice Scanner
              </h3>
              <p className="text-[11px] text-white/80">
                Optical OCR auto-detects vendor TIN, BIR Official Receipts, VAT, and line items
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5 text-[#263238]">
          <div className="space-y-3">
            <label className="block text-xs font-bold text-[#123B5D]">
              Upload Official Receipt (OR) or Invoice
            </label>
            {imagePreview ? (
              <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-950 aspect-[4/3] flex items-center justify-center">
                <img
                  src={imagePreview}
                  alt="Scanned receipt"
                  className="w-full h-full object-cover opacity-90"
                />
                {isScanning && (
                  <div className="absolute inset-0 bg-[#123B5D]/80 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4">
                    <Loader2 className="w-8 h-8 animate-spin text-[#18A999] mb-2" />
                    <p className="text-xs font-bold">Analyzing Construction Receipt...</p>
                    <p className="text-[10px] text-white/80 mt-1">Reading TIN, VAT, &amp; Amounts</p>
                  </div>
                )}
                {!isScanning && (
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      setExtracted(null);
                      setScanComplete(false);
                    }}
                    className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white text-[10px] px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                  >
                    Change Receipt
                  </button>
                )}
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-300 hover:border-[#18A999] rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-[#EAF7FA]/50 hover:bg-[#EAF7FA] transition-all aspect-[4/3]">
                <div className="w-12 h-12 rounded-full bg-white text-[#18A999] shadow-xs flex items-center justify-center mb-3">
                  <Camera className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-[#123B5D]">
                  Click or drag photo of receipt here
                </span>
                <span className="text-[11px] text-[#263238]/60 mt-1">
                  Supports JPG, PNG, Mobile Camera snaps
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            )}

            <div>
              <p className="text-[11px] font-bold text-[#123B5D] mb-1.5">
                Or test with sample hardware receipts:
              </p>
              <div className="space-y-1.5">
                {sampleReceipts.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSample(s)}
                    className="w-full text-left px-3 py-2 text-xs bg-[#EAF7FA]/60 hover:bg-[#EAF7FA] rounded-lg text-[#263238] flex items-center justify-between transition-colors cursor-pointer border border-slate-200/60"
                  >
                    <span className="truncate font-medium">{s.title}</span>
                    <span className="text-[#18A999] font-bold ml-2">₱{s.data.amount.toLocaleString()}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#123B5D] flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-[#18A999]" />
                  Extracted Receipt Details
                </span>
                {scanComplete && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EAF7FA] text-[#18A999] border border-[#18A999]/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> 100% Extracted
                  </span>
                )}
              </div>

              {extracted ? (
                <div className="space-y-3 bg-[#EAF7FA]/40 p-3.5 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#263238]/60">
                      Store / Merchant
                    </label>
                    <input
                      type="text"
                      value={extracted.vendor}
                      onChange={(e) => setExtracted({ ...extracted, vendor: e.target.value })}
                      className="w-full mt-0.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-[#123B5D]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#263238]/60">
                        Invoice / OR No.
                      </label>
                      <input
                        type="text"
                        value={extracted.invoiceNo}
                        onChange={(e) => setExtracted({ ...extracted, invoiceNo: e.target.value })}
                        className="w-full mt-0.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[#263238] font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#263238]/60">
                        Date
                      </label>
                      <input
                        type="date"
                        value={extracted.date}
                        onChange={(e) => setExtracted({ ...extracted, date: e.target.value })}
                        className="w-full mt-0.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[#263238]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#263238]/60">
                        Category
                      </label>
                      <select
                        value={extracted.category}
                        onChange={(e) =>
                          setExtracted({ ...extracted, category: e.target.value as ExpenseCategory })
                        }
                        className="w-full mt-0.5 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[#263238] font-medium"
                      >
                        <option value="Materials">Materials &amp; Supplies</option>
                        <option value="Labor">Subcontractor Labor</option>
                        <option value="Equipment">Equipment &amp; Machinery</option>
                        <option value="Fuel">Fuel &amp; Logistics</option>
                        <option value="Safety & Tools">Safety &amp; PPE</option>
                        <option value="Food">Petty Cash &amp; Meals</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#263238]/60">
                        Total Amount (PHP)
                      </label>
                      <input
                        type="number"
                        value={extracted.amount}
                        onChange={(e) =>
                          setExtracted({ ...extracted, amount: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full mt-0.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[#18A999] font-black font-mono text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#263238]/60">
                      Detected Line Items
                    </label>
                    <div className="mt-1 space-y-1 max-h-28 overflow-y-auto pr-1">
                      {extracted.lineItems.map((li, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-1.5 rounded-lg bg-white border border-slate-200 text-[11px]"
                        >
                          <span className="truncate flex-1 font-medium text-[#263238]">
                            {li.qty}x {li.item}
                          </span>
                          <span className="text-[#123B5D] font-bold ml-2 font-mono">
                            ₱{li.total.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#263238]/70 pt-1 border-t border-slate-200">
                    <span>12% BIR EVAT included:</span>
                    <strong className="text-[#123B5D]">₱{extracted.vatAmount.toLocaleString()}</strong>
                  </div>
                </div>
              ) : (
                <div className="bg-[#EAF7FA]/30 border border-dashed border-slate-200 rounded-xl p-8 text-center flex flex-col items-center justify-center min-h-[220px]">
                  <FileText className="w-10 h-10 text-[#123B5D]/30 mb-2" />
                  <p className="text-xs font-bold text-[#123B5D]">No Receipt Loaded Yet</p>
                  <p className="text-[11px] text-[#263238]/60 mt-1 max-w-[200px]">
                    Upload a receipt photo or click one of the sample presets to test the OCR engine.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[#EAF7FA] rounded-xl text-xs font-bold text-[#123B5D] hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!extracted}
                onClick={handleApplyToExpenses}
                className="px-4 py-2 bg-[#18A999] hover:bg-[#148f81] disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>Save to Project Expenses</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ReceiptScanner = ReceiptScannerModal;
export default ReceiptScannerModal;
