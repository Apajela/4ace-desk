import { PayrollEntry, Project } from '../types';

export interface ProjectLaborProration {
  workerId: string;
  workerName: string;
  role: string;
  dailyRate: number;
  totalDaysWorkedInCutoff: number;
  chargeableDutyDays: number;
  regularLaborCharge: number;
  otLaborCharge: number;
  totalChargeableLabor: number;
  isProrated: boolean;
  notes: string;
}

export interface CutoffProjectLaborSummary {
  cutoffStartDate: string;
  cutoffEndDate: string;
  projectStartDate: string;
  maxChargeableWindowDays: number;
  isProrated: boolean;
  totalChargeableLaborExpense: number;
  totalFullCutoffLabor: number;
  excludedLaborPriorToStart: number;
  breakdown: ProjectLaborProration[];
}

/**
 * Calculates project labor expense based on the project's start date
 * within the payroll cutoff window.
 *
 * Example:
 * Cutoff: Oct 19 - Oct 25, 2026
 * Project Start: Oct 22, 2026
 * Chargeable window: Oct 25 - Oct 22 = 3 days.
 * Labor duty prior to Oct 22 is excluded from project expenses.
 */
export function calculateProjectLaborAllocation(
  payroll: PayrollEntry[],
  cutoffStartDate: string, // YYYY-MM-DD
  cutoffEndDate: string,   // YYYY-MM-DD
  project: Project
): CutoffProjectLaborSummary {
  const toLocalDate = (value: string) => new Date(`${value}T12:00:00`);
  const pStart = toLocalDate(project.startDate);
  const cStart = toLocalDate(cutoffStartDate);
  const cEnd = toLocalDate(cutoffEndDate);
  const pEnd = project.endDate ? toLocalDate(project.endDate) : (project.status === 'Completed' ? toLocalDate(project.targetDate) : cEnd);
  const valid = (date: Date) => !Number.isNaN(date.getTime());
  const effectiveStart = valid(pStart) && pStart > cStart ? pStart : cStart;
  const effectiveEnd = valid(pEnd) && pEnd < cEnd ? pEnd : cEnd;
  let maxChargeableWindowDays = 0;
  if (valid(effectiveStart) && valid(effectiveEnd) && effectiveStart <= effectiveEnd) {
    for (const cursor = new Date(effectiveStart); cursor <= effectiveEnd; cursor.setDate(cursor.getDate() + 1)) {
      if (cursor.getDay() !== 0) maxChargeableWindowDays += 1; // Sunday is the weekly rest day.
    }
  }
  const isProrated = effectiveStart.getTime() !== cStart.getTime() || effectiveEnd.getTime() !== cEnd.getTime();

  let totalChargeableLaborExpense = 0;
  let totalFullCutoffLabor = 0;

  const breakdown: ProjectLaborProration[] = payroll.map((entry) => {
    const daysWorked = entry.daysWorked || 0;
    const dailyRate = entry.dailyRate || 0;
    const otPay = entry.otPay || 0;
    const fullGross = entry.grossPay || (daysWorked * dailyRate + otPay);
    totalFullCutoffLabor += fullGross;

    let chargeableDays = daysWorked;
    let note = 'Full weekly cutoff charged to project.';

    if (isProrated) {
      chargeableDays = Math.max(0, Math.min(daysWorked, maxChargeableWindowDays));
      if (maxChargeableWindowDays === 0) {
        note = `Project starts on ${project.startDate}; 0 days charged for this cutoff.`;
      } else {
        note = `Project started ${project.startDate}: Only ${chargeableDays} days charged (duty prior to start excluded).`;
      }
    }

    const regularLaborCharge = chargeableDays * dailyRate;
    const otRatio = daysWorked > 0 ? chargeableDays / daysWorked : 0;
    const otLaborCharge = Math.round(otPay * otRatio);
    const totalChargeable = regularLaborCharge + otLaborCharge;

    totalChargeableLaborExpense += totalChargeable;

    return {
      workerId: entry.workerId,
      workerName: entry.workerName,
      role: entry.role,
      dailyRate,
      totalDaysWorkedInCutoff: daysWorked,
      chargeableDutyDays: chargeableDays,
      regularLaborCharge,
      otLaborCharge,
      totalChargeableLabor: totalChargeable,
      isProrated,
      notes: note,
    };
  });

  const excludedLaborPriorToStart = Math.max(0, totalFullCutoffLabor - totalChargeableLaborExpense);

  return {
    cutoffStartDate,
    cutoffEndDate,
    projectStartDate: project.startDate,
    maxChargeableWindowDays,
    isProrated,
    totalChargeableLaborExpense,
    totalFullCutoffLabor,
    excludedLaborPriorToStart,
    breakdown,
  };
}
