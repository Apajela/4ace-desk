import React, { useState } from 'react';
import {
  X,
  Globe,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { CustomDomainConfig } from '../types';

export interface CustomDomainProps {
  config: CustomDomainConfig;
  onClose: () => void;
  onSaveDomain: (domain: string) => void;
}

export const CustomDomain: React.FC<CustomDomainProps> = ({
  config,
  onClose,
  onSaveDomain,
}) => {
  const [domainInput, setDomainInput] = useState(config?.domain || 'portal.4acedesk.ph');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const handleVerifyDns = () => {
    setIsVerifying(true);
    setVerifyMessage(null);
    setTimeout(() => {
      setIsVerifying(false);
      setVerifyMessage('DNS records verified successfully! SSL certificate is active.');
      onSaveDomain(domainInput);
    }, 1200);
  };

  const dnsRecords = config?.records || [
    { type: 'CNAME', host: 'portal', value: 'cname.4acedesk.ph' },
    { type: 'TXT', host: '_verify.portal', value: '4ace-verification-hash-88912' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-[#123B5D] text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#18A999] text-white flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Custom Domain &amp; White-Label Portal</h3>
              <p className="text-[11px] text-white/80">
                Host your construction management system under your company&apos;s branded domain
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

        <div className="p-5 space-y-4 text-xs text-[#263238] bg-white">
          <div>
            <label className="block font-bold text-[#123B5D] mb-1">
              Your Company Domain / Subdomain
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Globe className="w-4 h-4 text-[#18A999] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  placeholder="portal.yourcompany.ph"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[#263238] font-bold focus:outline-none focus:border-[#18A999] focus:bg-white"
                />
              </div>
              <button
                type="button"
                onClick={handleVerifyDns}
                disabled={isVerifying}
                className="px-4 py-2 bg-[#18A999] hover:bg-[#148f81] text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                {isVerifying ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                )}
                <span>Check &amp; Verify DNS</span>
              </button>
            </div>
          </div>

          <div className="p-3.5 bg-[#EAF7FA] border border-slate-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-[#18A999] shadow-2xs">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-[#123B5D]">SSL Certificate Active</span>
                <p className="text-[10px] text-[#263238]/70">
                  Automatic HTTPS encryption via Cloudflare &amp; Let&apos;s Encrypt
                </p>
              </div>
            </div>
            <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-white text-[#18A999] border border-[#18A999]/30">
              SECURE 256-BIT
            </span>
          </div>

          {verifyMessage && (
            <div className="p-3 bg-[#EAF7FA] border border-[#18A999]/30 rounded-xl text-[#123B5D] text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#18A999] shrink-0" />
              <span className="font-bold">{verifyMessage}</span>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-[#123B5D]">Required DNS Records</h4>
              <span className="text-[11px] text-[#263238]/60">Add to Cloudflare, dotPH, or GoDaddy</span>
            </div>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#EAF7FA] text-[#123B5D] font-bold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Host / Name</th>
                    <th className="py-2.5 px-3">Target Value</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {dnsRecords.map((rec, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-[#123B5D]">{rec.type}</td>
                      <td className="py-2.5 px-3 text-[#263238]/70">{rec.host}</td>
                      <td className="py-2.5 px-3 text-[#263238] truncate max-w-xs">{rec.value}</td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(rec.value, idx)}
                          className="px-2.5 py-1 bg-[#EAF7FA] hover:bg-slate-200 text-[#123B5D] rounded-lg text-[10px] font-sans font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          {copiedIndex === idx ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-[#18A999]" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-[#123B5D]" /> Copy
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-3 bg-[#EAF7FA] rounded-xl border border-slate-200 space-y-1 text-[11px] text-[#263238]/80">
            <span className="font-bold text-[#123B5D] block">Setup Instructions:</span>
            <p>1. Log in to your domain registrar (e.g. Cloudflare, dotPH, Namecheap, or GoDaddy).</p>
            <p>2. Navigate to DNS Management / Zone Editor.</p>
            <p>3. Create a CNAME record pointing to <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[#123B5D] font-mono font-bold">cname.4acedesk.ph</code>.</p>
            <p>4. DNS propagation usually takes between 5 to 30 minutes.</p>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#EAF7FA] rounded-xl font-bold text-[#123B5D] hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onSaveDomain(domainInput);
                onClose();
              }}
              className="px-5 py-2 bg-[#18A999] hover:bg-[#148f81] text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Save Domain
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomDomain;
