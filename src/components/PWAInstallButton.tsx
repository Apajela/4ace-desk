import React from 'react';
import { Download, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, install } = usePWAInstall();

  if (isInstalled) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-white bg-[#18A999] rounded-lg shadow-2xs">
        <Check className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Installed as Desktop App</span>
      </div>
    );
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18A999] hover:bg-[#148f81] text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
        title="Install as Standalone Software"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  return null;
};

export default PWAInstallButton;
