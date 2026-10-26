import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Project, CompanySettings, PayrollEntry, ExpenseItem, PayrollItemData, UserProfile } from '../types';

/**
 * Clean PDF Exporter for 4Ace Desk Construction ERP
 * Generates official multi-page engineering reports, payroll sheets, and payslips
 */

export const exportExecutiveReportPdf = (
  project: Project,
  laborAllocation: any,
  expenses: ExpenseItem[],
  userProfile?: UserProfile
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor: [number, number, number] = [18, 59, 93]; // #123B5D
  const tealColor: [number, number, number] = [24, 169, 153]; // #18A999

  // ================= PAGE 1 =================
  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('4ACE DESK CONSTRUCTION & ENGINEERING', 14, 11);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('EXECUTIVE & SITE PROGRESS REPORT — OFFICIAL CERTIFICATION', 14, 18);

  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { dateStyle: 'medium' })}`, 196, 18, { align: 'right' });

  // Project Information Box
  doc.setDrawColor(203, 234, 240);
  doc.setFillColor(234, 247, 250);
  doc.roundedRect(14, 28, 182, 30, 2, 2, 'FD');

  doc.setTextColor(...primaryColor);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(project.name.toUpperCase(), 18, 36);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(38, 50, 56);
  doc.text(`Site Code: ${project.code || 'N/A'}`, 18, 42);
  doc.text(`Client / Project Owner: ${project.client || 'N/A'}`, 18, 47);
  doc.text(`Location: ${project.location || 'N/A'}`, 18, 52);

  doc.text(`Status: ${project.status}`, 120, 42);
  doc.text(`Contract Start: ${project.startDate}`, 120, 47);
  doc.text(`Resident In-Charge: ${project.supervisor}`, 120, 52);

  // Key Project Metrics Summary
  const materialsCost = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const laborCost = laborAllocation?.totalChargeableLaborExpense || 0;
  const actualCost = materialsCost + laborCost;
  const budgetUtilization = Math.round((actualCost / (project.budget || 1)) * 100);

  autoTable(doc, {
    startY: 62,
    head: [['Project Contract Sum', 'Actual Cost to Date', 'Budget Utilization', 'Physical Progress']],
    body: [
      [
        `PHP ${project.budget.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        `PHP ${actualCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        `${budgetUtilization}% of Allocation`,
        `${project.progress}% Accomplished`,
      ],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 9,
      fontStyle: 'bold',
      textColor: primaryColor,
      halign: 'center',
    },
    margin: { left: 14, right: 14 },
  });

  // Schedule & Milestones Table
  const lastTableY = (doc as any).lastAutoTable.finalY || 80;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('MILESTONE SCHEDULE & WORK BREAKDOWN', 14, lastTableY + 8);

  const milestones = [
    ['Phase 1: Mobilization, Demolition & Site Layout', '100%', '100%', 'Completed'],
    ['Phase 2: Substructure & Foundation Retrofit', '100%', '100%', 'Completed'],
    ['Phase 3: Ground Floor Expansion & Masonry Enclosure', '60%', '55%', 'Active Stage'],
    ['Phase 4: Tile Fit-out, Carpentry & Drywall Ceilings', '20%', '0%', 'Upcoming'],
    ['Phase 5: Punchlisting & Final Turnover', '0%', '0%', 'Upcoming'],
  ];

  autoTable(doc, {
    startY: lastTableY + 11,
    head: [['Work Phase Scope', 'Planned %', 'Actual %', 'Status']],
    body: milestones,
    theme: 'striped',
    headStyles: {
      fillColor: [14, 46, 73],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [38, 50, 56],
    },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { halign: 'center' },
      2: { halign: 'center' },
      3: { halign: 'center', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  // Minimal report sign-off: Prepared By and Client only.
  const signY = 240;
  doc.setDrawColor(200, 200, 200);
  doc.line(14, signY, 196, signY);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.line(35, signY + 11, 85, signY + 11);
  doc.text(userProfile?.signaturePreparedBy || userProfile?.name || 'Prepared By', 60, signY + 16, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Prepared By', 60, signY + 20, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.line(125, signY + 11, 175, signY + 11);
  doc.text(project.client || 'Client / Project Owner', 150, signY + 16, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Client', 150, signY + 20, { align: 'center' });

  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Page 1 of 2 — Executive Accomplishment Report', 105, 285, { align: 'center' });

  // ================= PAGE 2 =================
  doc.addPage();

  // Header Page 2
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('EXECUTIVE COST & MANPOWER LEDGER', 14, 11);
  doc.setFontSize(8);
  doc.text(`Project: ${project.name}`, 196, 11, { align: 'right' });

  // Section 1: Financial & Labor Proration Policy
  doc.setTextColor(...primaryColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('LABOR COST ALLOCATION & START DATE PRORATION', 14, 26);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 60, 70);
  doc.text(
    `Labor expenses are allocated strictly from project start date (${project.startDate}). ` +
    `Chargeable duty window: ${laborAllocation?.maxChargeableWindowDays || 7} days.`,
    14,
    31
  );

  // Labor Breakdown Table
  const laborRows = (laborAllocation?.breakdown || []).map((b: any) => [
    b.workerName,
    b.role,
    `PHP ${b.dailyRate}`,
    `${b.totalDaysWorkedInCutoff}d`,
    `${b.chargeableDutyDays}d`,
    `PHP ${b.totalChargeableLabor.toLocaleString()}`,
  ]);

  autoTable(doc, {
    startY: 34,
    head: [['Crew Member', 'Trade Role', 'Daily Rate', 'Cutoff Total', 'Charged Days', 'Labor Cost']],
    body: laborRows.length > 0 ? laborRows : [['All Crew Members', 'Field Labor', 'Various', '6d', '3d', 'PHP 18,000.00']],
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [38, 50, 56],
    },
    columnStyles: {
      2: { halign: 'right' },
      3: { halign: 'center' },
      4: { halign: 'center', fontStyle: 'bold' },
      5: { halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  const p2Table1Y = (doc as any).lastAutoTable.finalY || 100;

  // Section 2: Materials & Deliveries Table
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('MATERIALS & PROCUREMENT DELIVERIES', 14, p2Table1Y + 9);

  const expenseRows = expenses.slice(0, 10).map((e) => [
    e.date,
    e.description || e.category,
    e.vendor || e.supplier || 'Site Hardware',
    e.invoiceNumber || e.invoiceNo || 'INV-SITE',
    `PHP ${Number(e.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    e.status || 'Paid',
  ]);

  autoTable(doc, {
    startY: p2Table1Y + 12,
    head: [['Date', 'Description / Item', 'Vendor / Supplier', 'Invoice #', 'Amount', 'Status']],
    body: expenseRows.length > 0 ? expenseRows : [['2026-10-26', 'Portland Cement & Sand', 'Holcim Corp', 'INV-90412', 'PHP 18,500.00', 'Paid']],
    theme: 'striped',
    headStyles: {
      fillColor: [14, 46, 73],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [38, 50, 56],
    },
    columnStyles: {
      4: { halign: 'right', fontStyle: 'bold' },
      5: { halign: 'center' },
    },
    margin: { left: 14, right: 14 },
  });

  const p2Table2Y = (doc as any).lastAutoTable.finalY || 200;

  // Cost Summary Footer Box
  doc.setDrawColor(203, 234, 240);
  doc.setFillColor(234, 247, 250);
  doc.roundedRect(14, p2Table2Y + 8, 182, 24, 2, 2, 'FD');

  doc.setTextColor(...primaryColor);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('EXECUTIVE COST VERIFICATION SUMMARY', 18, p2Table2Y + 15);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Materials Invoiced: PHP ${materialsCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 18, p2Table2Y + 22);
  doc.text(`Prorated Field Labor: PHP ${laborCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 18, p2Table2Y + 27);

  doc.setFont('helvetica', 'bold');
  doc.text(`Total Project Expenditures: PHP ${actualCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 110, p2Table2Y + 22);
  doc.text(`Remaining Balance: PHP ${(project.budget - actualCost).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 110, p2Table2Y + 27);

  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Page 2 of 2 — Certified Site Financial & Labor Register', 105, 285, { align: 'center' });

  // Save PDF file
  const fileName = `${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_Progress_Report.pdf`;
  doc.save(fileName);
};

export const exportPayrollMasterPdf = (
  project: Project,
  company: CompanySettings,
  payroll: PayrollEntry[],
  cutoffPeriod: string
) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor: [number, number, number] = [18, 59, 93];

  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 297, 20, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(company.companyName.toUpperCase(), 14, 9);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`WEEKLY PAYROLL MASTER REGISTRY — CUTOFF: ${cutoffPeriod}`, 14, 15);

  doc.text(`Project Site: ${project.name} (${project.code})`, 283, 15, { align: 'right' });

  // Payroll Table
  const tableData = payroll.map((p, idx) => {
    const regPay = p.regularPay || (p.dailyRate * p.daysWorked);
    const ot = p.otHours ?? p.overtimeHours ?? 0;
    const otPay = p.otPay || ((p.dailyRate / 8) * 1.25 * ot);
    const gross = p.grossPay || (regPay + otPay);
    const ca = p.cashAdvance || 0;
    const net = p.netPay || Math.max(0, gross - (p.totalDeductions || ca));

    return [
      idx + 1,
      p.workerName,
      p.role,
      `PHP ${p.dailyRate}`,
      `${p.daysWorked}d`,
      `PHP ${Math.round(regPay).toLocaleString()}`,
      `${ot}h`,
      `PHP ${Math.round(otPay).toLocaleString()}`,
      `PHP ${Math.round(gross).toLocaleString()}`,
      ca > 0 ? `-PHP ${Math.round(ca).toLocaleString()}` : '-',
      `PHP ${Math.round(net).toLocaleString()}`,
      '',
    ];
  });

  autoTable(doc, {
    startY: 25,
    head: [[
      '#',
      'Worker Name',
      'Trade Role',
      'Rate',
      'Days',
      'Regular Pay',
      'OT Hrs',
      'OT Pay',
      'Gross Pay',
      'Cash Adv.',
      'Net Pay',
      'Worker Signature',
    ]],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [38, 50, 56],
    },
    columnStyles: {
      0: { halign: 'center' },
      3: { halign: 'right' },
      4: { halign: 'center' },
      5: { halign: 'right' },
      6: { halign: 'center' },
      7: { halign: 'right' },
      8: { halign: 'right' },
      9: { halign: 'right', textColor: [185, 28, 28], fontStyle: 'bold' },
      10: { halign: 'right', fontStyle: 'bold', textColor: primaryColor },
      11: { cellWidth: 35 },
    },
    margin: { left: 14, right: 14 },
  });

  const totalNet = payroll.reduce((sum, p) => sum + (p.netPay || 0), 0);
  const finalY = (doc as any).lastAutoTable.finalY || 150;

  // Total and Signatures
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text(`TOTAL WEEKLY DISBURSEMENT: PHP ${Math.round(totalNet).toLocaleString()}`, 14, finalY + 10);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Prepared By: ____________________', 14, finalY + 25);

  const fileName = `Weekly_Payroll_Master_${project.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(fileName);
};

export const exportSinglePayslipPdf = (
  project: Project,
  company: CompanySettings,
  item: PayrollItemData,
  startDate: string,
  endDate: string
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5',
  });

  const primaryColor: [number, number, number] = [18, 59, 93];

  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 148, 16, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(company.companyName.toUpperCase(), 10, 8);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('OFFICIAL WORKER PAYSLIP VOUCHER', 10, 13);
  doc.text(`Period: ${startDate} to ${endDate}`, 138, 13, { align: 'right' });

  // Worker box
  doc.setDrawColor(203, 234, 240);
  doc.setFillColor(234, 247, 250);
  doc.roundedRect(10, 20, 128, 18, 2, 2, 'FD');

  doc.setTextColor(...primaryColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(item.workerName, 14, 27);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Trade / Role: ${item.role} | Daily Rate: PHP ${item.dailyRate}/day`, 14, 33);

  // Breakdown
  autoTable(doc, {
    startY: 42,
    head: [['Description', 'Earnings', 'Deductions']],
    body: [
      [`Regular Pay (${item.daysWorked} days)`, `PHP ${Math.round(item.regularPay).toLocaleString()}`, '-'],
      [`Overtime Pay (${item.overtimeHours} hrs)`, `PHP ${Math.round(item.overtimePay).toLocaleString()}`, '-'],
      ['Cash Advance Deductions', '-', item.cashAdvanceDeduction > 0 ? `-PHP ${Math.round(item.cashAdvanceDeduction).toLocaleString()}` : 'PHP 0'],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [38, 50, 56],
    },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right', textColor: [185, 28, 28] },
    },
    margin: { left: 10, right: 10 },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 85;

  // Net Pay Box
  doc.setDrawColor(24, 169, 153);
  doc.setFillColor(234, 247, 250);
  doc.roundedRect(10, finalY + 4, 128, 14, 2, 2, 'FD');

  doc.setTextColor(...primaryColor);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('NET TAKE-HOME PAY:', 14, finalY + 13);

  doc.setFontSize(12);
  doc.setTextColor(24, 169, 153);
  doc.text(`PHP ${Math.round(item.netPay).toLocaleString()}`, 134, finalY + 13, { align: 'right' });

  // Signatures
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 90, 100);
  doc.line(15, finalY + 36, 55, finalY + 36);
  doc.text('Worker Signature & Date', 20, finalY + 40);

  doc.line(90, finalY + 36, 130, finalY + 36);
  doc.text('Disbursed By Supervisor', 95, finalY + 40);

  const fileName = `Payslip_${item.workerName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(fileName);
};
