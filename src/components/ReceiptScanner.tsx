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

  const processOcr = async (file: File) => {
    setIsScanning(true);
    setScanComplete(false);
    setExtracted(null);
    try {
      // Load OCR from the official package CDN at runtime so the build does not
      // depend on a missing lockfile entry. OCR still requires an internet connection.
      const tesseractModuleUrl = 'https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/+esm';
      const { createWorker } = await import(/* @vite-ignore */ tesseractModuleUrl);
      const worker = await createWorker('eng');
      const result = await worker.recognize(file);
      await worker.terminate();
      const text = result.data.text || '';
      const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      const amountMatches = [...text.matchAll(/(?:₱|PHP\s*)?\s*([0-9][0-9,]*\.\d{2})/gi)]
        .map((m) => Number(m[1].replace(/,/g, ''))).filter((n) => Number.isFinite(n) && n > 0);
      const amount = amountMatches.length ? Math.max(...amountMatches) : 0;
      const invoiceLine = lines.find((line) => /invoice|receipt|or no|official receipt/i.test(line)) || '';
      const dateMatch = text.match(/\b(20\d{2})[-/](\d{1,2})[-/](\d{1,2})\b/);
      const date = dateMatch ? `${dateMatch[1]}-${dateMatch[2].padStart(2,'0')}-${dateMatch[3].padStart(2,'0')}` : new Date().toISOString().split('T')[0];
      const vendor = lines.find((line) => /[a-z]{3,}/i.test(line) && !/invoice|receipt|vat|total|date|cashier/i.test(line)) || '';
      const invoiceNo = (invoiceLine.match(/(?:no\.?|#|number)\s*[:#-]?\s*([A-Z0-9/-]{4,})/i) || [])[1] || '';
      const vatMatch = text.match(/(?:VAT|EVAT)[^0-9]{0,15}([0-9,]+\.\d{2})/i);
      setExtracted({ vendor, tinNumber: (text.match(/\b\d{3}-\d{3}-\d{3}-\d{3}\b/) || [])[0] || '',
        invoiceNo, date, amount, category: 'Materials', description: lines.slice(0, 8).join(' ').slice(0, 500),
        vatAmount: vatMatch ? Number(vatMatch[1].replace(/,/g,'')) : 0, lineItems: [] });
      setScanComplete(true);
    } catch (error) {
      console.error('Receipt OCR failed:', error);
      alert('OCR could not start. Check your internet connection and upload again. You can still enter the receipt details manually.');
      setExtracted({ vendor: '', tinNumber: '', invoiceNo: '', date: new Date().toISOString().split('T')[0],
        amount: 0, category: 'Materials', description: '', vatAmount: 0, lineItems: [] });
    } finally { setIsScanning(false); }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImagePreview(URL.createObjectURL(file));
      void processOcr(file);
    }
    e.currentTarget.value = '';
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
                OCR reads uploaded receipt images; review extracted fields before saving
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
                    <CheckCircle2 className="w-3 h-3" /> OCR Complete
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
                    <span>Detected VAT:</span>
                    <strong className="text-[#123B5D]">₱{extracted.vatAmount.toLocaleString()}</strong>
                  </div>
                </div>
              ) : (
                <div className="bg-[#EAF7FA]/30 border border-dashed border-slate-200 rounded-xl p-8 text-center flex flex-col items-center justify-center min-h-[220px]">
                  <FileText className="w-10 h-10 text-[#123B5D]/30 mb-2" />
                  <p className="text-xs font-bold text-[#123B5D]">No Receipt Loaded Yet</p>
                  <p className="text-[11px] text-[#263238]/60 mt-1 max-w-[200px]">
                    Upload a receipt photo. OCR suggests editable fields; verify all values before saving.
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
