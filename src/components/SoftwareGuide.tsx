import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Search,
  Banknote,
  FileCheck2,
  Calendar,
  ShieldCheck,
  Building,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

export interface SoftwareGuideModalProps {
  onClose: () => void;
}

export const SoftwareGuideModal: React.FC<SoftwareGuideModalProps> = ({ onClose }) => {
  const [activeTopic, setActiveTopic] = useState('quickstart');
  const [searchQuery, setSearchQuery] = useState('');

  const topics = [
    {
      id: 'quickstart',
      title: '1. Quick Start & Project Setup',
      icon: <Building className="w-4 h-4 text-[#18A999]" />,
      content: (
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-[#123B5D]">Setting Up Your Construction Site</h4>
          <p className="text-[#263238]/80 leading-relaxed">
            Welcome to 4Ace Desk ERP. This software is tailored specifically for general contractors, civil engineers, project managers, and site foremen.
          </p>
          <div className="bg-[#EAF7FA] p-3.5 rounded-xl border border-slate-200 text-[#123B5D] space-y-1">
            <strong className="text-sm">Key Setup Steps:</strong>
            <ul className="list-disc list-inside text-xs space-y-1 mt-1 text-[#263238]">
              <li>Select your active project from the top navigation dropdown (e.g. Residential Renovation).</li>
              <li>Input project budget, contract start date, and target turnover timeline.</li>
              <li>Assign your resident Project Engineer, Safety Officer, and Site Foreman.</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'priorities',
      title: '2. Site Priorities & QA Inspection',
      icon: <FileCheck2 className="w-4 h-4 text-[#18A999]" />,
      content: (
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-[#123B5D]">Critical Path &amp; Concrete Pouring Clearances</h4>
          <p className="text-[#263238]/80 leading-relaxed">
            The Site Priorities board coordinates critical milestone tasks across trades (Civil, Structural, MEPFS, Architectural, and Safety).
          </p>
          <div className="p-3.5 bg-[#EAF7FA]/50 rounded-xl border border-slate-200 space-y-2">
            <h5 className="font-bold text-[#123B5D]">Pre-Pouring Inspection Checklist:</h5>
            <p className="text-[#263238]/80">
              Before casting ready-mix concrete on suspended slabs or beams:
            </p>
            <ol className="list-decimal list-inside text-xs space-y-1 text-[#263238]">
              <li>Verify rebar diameter, spacing, and 40mm concrete cover blocks.</li>
              <li>Confirm MEPFS rough-in conduits and sleeves are securely tied.</li>
              <li>Conduct slump test on transit mixers upon site arrival (standard: 4&quot; to 6&quot;).</li>
              <li>Prepare concrete cylinder samples for 7-day and 28-day laboratory compressive break tests.</li>
            </ol>
          </div>
        </div>
      ),
    },
    {
      id: 'attendance',
      title: '3. Daily Attendance & Manpower Log',
      icon: <Calendar className="w-4 h-4 text-[#18A999]" />,
      content: (
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-[#123B5D]">Daily Site Logging &amp; Weather Delays</h4>
          <p className="text-[#263238]/80 leading-relaxed">
            Foremen can log daily worker attendance (Full Day, Half Day, Overtime hours, or Absent) every morning during toolbox assembly.
          </p>
          <div className="p-3.5 bg-[#EAF7FA] rounded-xl border border-slate-200 space-y-1.5 text-xs text-[#263238]">
            <h5 className="font-bold text-[#123B5D]">Inclement Weather &amp; Work Suspensions:</h5>
            <p>
              When weather advisories or typhoons compromise high-elevation scaffolding, the site engineer can log a DOLE Work Suspension to legally record excusable contract extension days.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'payroll',
      title: '4. Weekly Payroll & Cash Envelopes',
      icon: <Banknote className="w-4 h-4 text-[#18A999]" />,
      content: (
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-[#123B5D]">Construction Wages &amp; Cash Advance Deductions</h4>
          <p className="text-[#263238]/80 leading-relaxed">
            Construction field crews are traditionally compensated weekly every Saturday afternoon. 4Ace Desk automates these calculations:
          </p>
          <ul className="list-disc list-inside text-xs text-[#263238] space-y-1.5">
            <li><strong>Regular Overtime:</strong> Computed at 125% of the hourly rate (Daily Rate / 8 * 1.25 * OT Hours).</li>
            <li><strong>Cash Advance (Vale):</strong> Mid-week emergency loans deducted automatically from gross wages.</li>
            <li><strong>Government Deductions:</strong> SSS, PhilHealth, and Pag-IBIG contributions partitioned across cutoffs.</li>
            <li><strong>Single &amp; Batch Payslips:</strong> Formats ready-to-print official wage vouchers and signatures for worker documentation.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'ocr',
      title: '5. AI Receipt & Invoice Scanner',
      icon: <Sparkles className="w-4 h-4 text-[#18A999]" />,
      content: (
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-[#123B5D]">Automated Receipt Digitization</h4>
          <p className="text-[#263238]/80 leading-relaxed">
            Snap photos of hardware store invoices (Wilcon Depot, Ace Hardware, CitiHardware, Petron fuel slips) and let the optical AI extract critical accounting data:
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 bg-[#EAF7FA] border border-slate-200 rounded-xl">
              <span className="font-bold text-[#123B5D]">12% BIR EVAT Detection</span>
              <p className="text-[#263238]/70 mt-0.5">Separates net purchase from deductible input VAT automatically.</p>
            </div>
            <div className="p-3 bg-[#EAF7FA] border border-slate-200 rounded-xl">
              <span className="font-bold text-[#123B5D]">Line Item Quantity Extraction</span>
              <p className="text-[#263238]/70 mt-0.5">Captures cement bag counts, steel bar lengths, and diesel liters.</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'dole',
      title: '6. DOLE DO 13 & Building Code Compliance',
      icon: <ShieldCheck className="w-4 h-4 text-[#18A999]" />,
      content: (
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-[#123B5D]">Department Order No. 13 (Construction Safety)</h4>
          <p className="text-[#263238]/80 leading-relaxed">
            Philippine labor law mandates rigorous safety standards on all active construction sites:
          </p>
          <div className="p-3.5 bg-[#EAF7FA] rounded-xl border border-slate-200 text-xs text-[#263238] space-y-1.5">
            <p className="font-semibold text-[#123B5D]">✓ Mandatory certified Safety Officer (SO2/SO3) on site.</p>
            <p>✓ 100% PPE enforcement: ANSI Class E hardhats, steel-toe boots, and safety glasses.</p>
            <p>✓ Full-body safety harnesses with double shock-absorbing lanyards for working above 2 meters.</p>
            <p>✓ Weekly green-tag structural scaffolding inspections before worker access.</p>
          </div>
        </div>
      ),
    },
  ];

  const filteredTopics = topics.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const selected = topics.find((t) => t.id === activeTopic) || topics[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-[#123B5D] text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#18A999] text-white flex items-center justify-center font-bold">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">4Ace Desk Construction ERP User Manual</h3>
              <p className="text-[11px] text-white/80">
                Construction engineering standards, payroll rules, and site workflows
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1.5 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="p-3 bg-[#EAF7FA] border-r border-slate-200 overflow-y-auto text-xs space-y-1">
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 text-[#18A999] absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[#263238] text-[11px] focus:outline-none focus:border-[#18A999]"
              />
            </div>
            {filteredTopics.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTopic(item.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                  activeTopic === item.id
                    ? 'bg-[#18A999] text-white font-bold shadow-xs'
                    : 'text-[#263238] hover:bg-white/80 font-medium'
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <span className={activeTopic === item.id ? 'text-white' : ''}>{item.icon}</span>
                  <span className="truncate">{item.title}</span>
                </span>
                <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${activeTopic === item.id ? 'text-white' : 'opacity-40'}`} />
              </button>
            ))}
          </div>

          {/* Content Body */}
          <div className="md:col-span-2 p-6 overflow-y-auto text-xs space-y-3 bg-white text-[#263238]">
            {selected.content}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-white flex items-center justify-between text-xs shrink-0">
          <span className="text-[#263238]/60 font-medium">Engineering Support: operations@4acedesk.com</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#18A999] hover:bg-[#148f81] text-white font-bold rounded-xl transition-colors cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};

export const SoftwareGuide = SoftwareGuideModal;
export default SoftwareGuideModal;
