// API Client for Wonderland Full-Stack Backend Operations & Logs

export interface BackendLogItem {
  id: string;
  timestamp: string;
  entityName: string; // 'sessions' | 'invoices' | 'payments' | 'customers' | 'packages' | 'sheets' | 'resources' | 'system'
  action: string;
  level: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR';
  staffId?: string;
  staffName?: string;
  message: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

export interface SheetLinkItem {
  id: string;
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
  tabs: string[];
  rowsCount: number;
  userEmail?: string;
  syncMode: 'OVERWRITE' | 'APPEND';
  lastSyncedAt: string;
  createdAt: string;
}

export interface LogFilterParams {
  entity?: string;
  action?: string;
  level?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface LogsResponse {
  success: boolean;
  total: number;
  offset: number;
  limit: number;
  logs: BackendLogItem[];
  stats: Record<string, number>;
}

export const apiClient = {
  // Health check
  async checkHealth(): Promise<{ status: string; uptimeSeconds: number; totalLogs: number; totalSheetLinks: number }> {
    try {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Backend health check error:', err);
      return { status: 'offline', uptimeSeconds: 0, totalLogs: 0, totalSheetLinks: 0 };
    }
  },

  // Query backend logs
  async getLogs(params: LogFilterParams = {}): Promise<LogsResponse> {
    try {
      const query = new URLSearchParams();
      if (params.entity && params.entity !== 'ALL') query.set('entity', params.entity);
      if (params.action) query.set('action', params.action);
      if (params.level && params.level !== 'ALL') query.set('level', params.level);
      if (params.search) query.set('search', params.search);
      if (params.limit) query.set('limit', String(params.limit));
      if (params.offset) query.set('offset', String(params.offset));

      const res = await fetch(`/api/logs?${query.toString()}`);
      if (!res.ok) throw new Error(`Failed to fetch logs: ${res.status}`);
      return await res.json();
    } catch (err: any) {
      console.error('Error fetching backend logs:', err);
      return {
        success: false,
        total: 0,
        offset: 0,
        limit: 100,
        logs: [],
        stats: {}
      };
    }
  },

  // Ingest new operational log to backend
  async sendLog(log: {
    entityName: 'sessions' | 'invoices' | 'payments' | 'customers' | 'packages' | 'sheets' | 'resources' | 'system';
    action: string;
    level?: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR';
    staffId?: string;
    staffName?: string;
    message: string;
    details?: Record<string, unknown>;
  }): Promise<BackendLogItem | null> {
    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log)
      });
      if (!res.ok) {
        console.warn('Backend rejected log:', await res.text());
        return null;
      }
      const data = await res.json();
      return data.log;
    } catch (err) {
      console.warn('Failed to post backend log (non-fatal):', err);
      return null;
    }
  },

  // Reset or clear logs
  async clearLogs(): Promise<boolean> {
    try {
      const res = await fetch('/api/logs', { method: 'DELETE' });
      return res.ok;
    } catch (err) {
      console.error('Failed to clear logs:', err);
      return false;
    }
  },

  // Get saved Google Sheet links
  async getSheetLinks(): Promise<SheetLinkItem[]> {
    try {
      const res = await fetch('/api/sheet-links');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.sheetLinks || [];
    } catch (err) {
      console.warn('Error fetching sheet links:', err);
      return [];
    }
  },

  // Save or update a Google Sheet link in backend
  async saveSheetLink(data: {
    spreadsheetId: string;
    spreadsheetUrl: string;
    title: string;
    tabs: string[];
    rowsCount: number;
    userEmail?: string;
    syncMode: 'OVERWRITE' | 'APPEND';
  }): Promise<SheetLinkItem | null> {
    try {
      const res = await fetch('/api/sheet-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const resData = await res.json();
      return resData.sheetLink;
    } catch (err) {
      console.error('Failed to save sheet link to backend:', err);
      return null;
    }
  },

  // Delete a sheet link
  async deleteSheetLink(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/sheet-links/${id}`, { method: 'DELETE' });
      return res.ok;
    } catch (err) {
      console.error('Failed to delete sheet link:', err);
      return false;
    }
  }
};
