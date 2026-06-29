import type { TableAuditResult } from '../types';

export interface ScoreResult {
  score: number;      // 0-100
  grade: string;      // A+, A, B, C, D, F
  gradeColor: string; // tailwind color token
  label: string;      // "Excellent", "Good", etc.
}

const PENALTIES = {
  READ:   18,
  WRITE:  22,
  DELETE: 28,
};

export function calculateScore(tables: TableAuditResult[]): ScoreResult {
  // Only count tables that actually responded (exclude not_found)
  const found = tables.filter((t) => t.status !== 'not_found');
  if (found.length === 0) {
    return { score: 100, grade: 'A+', gradeColor: '#10B981', label: 'No tables found' };
  }

  let deduction = 0;
  for (const t of found) {
    if (t.readExposed)   deduction += PENALTIES.READ;
    if (t.writeExposed)  deduction += PENALTIES.WRITE;
    if (t.deleteExposed) deduction += PENALTIES.DELETE;
  }

  const score = Math.max(0, Math.min(100, 100 - deduction));
  return toGrade(score);
}

function toGrade(score: number): ScoreResult {
  if (score >= 95) return { score, grade: 'A+', gradeColor: '#10B981', label: 'Excellent' };
  if (score >= 85) return { score, grade: 'A',  gradeColor: '#10B981', label: 'Strong' };
  if (score >= 75) return { score, grade: 'B',  gradeColor: '#6366F1', label: 'Moderate' };
  if (score >= 60) return { score, grade: 'C',  gradeColor: '#F59E0B', label: 'At Risk' };
  if (score >= 40) return { score, grade: 'D',  gradeColor: '#F43F5E', label: 'Exposed' };
  return             { score, grade: 'F',  gradeColor: '#F43F5E', label: 'Critical' };
}
