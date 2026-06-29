export type TableStatus = 'vulnerable' | 'secure' | 'unknown' | 'not_found';
export type AppState   = 'idle' | 'scanning' | 'complete' | 'error';

export interface TableAuditResult {
  name: string;
  status: TableStatus;
  readExposed: boolean;
  writeExposed: boolean;
  deleteExposed: boolean;
  httpStatus: number;
  rowCount: number;
  errorCode?: string;
  duration: number;
}

export interface AuditResult {
  projectUrl: string;
  projectRef: string;
  timestamp: string;
  duration: number;
  tables: TableAuditResult[];
  score: number;
  grade: string;
  vulnerableCount: number;
  secureCount: number;
  unknownCount: number;
  totalProbed: number;
}

export type LogStatus = 'queued' | 'probing' | 'done';

export interface ScanLog {
  table: string;
  status: LogStatus;
  result?: TableAuditResult;
  ts: number;
}

export interface ScanProgress {
  logs: ScanLog[];
  completed: number;
  total: number;
}
