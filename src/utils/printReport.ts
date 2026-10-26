/**
 * Utility to trigger browser print dialog cleanly
 */
export const triggerBrowserPrint = () => {
  if (typeof window !== 'undefined') {
    window.print();
  }
};
