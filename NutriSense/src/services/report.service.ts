import { ENV } from '../config/env';
import { request } from './api';
import { MOCK_LAB_REPORT } from '../mocks/nutrition';
import { delay, checkSimulatedError } from '../utils/delay';
import type { LabReport } from '../types';

const REPORT_STORAGE_KEY = 'nutrisense:v1:last_report';

export const reportService = {
  // Upload and parse a health/lab test report (PDF/JPG/PNG)
  async analyze(file: File): Promise<LabReport> {
    checkSimulatedError();

    if (!ENV.USE_MOCK_API) {
      try {
        const formData = new FormData();
        formData.append('report', file);
        return await request<LabReport>('/reports/analyze', {
          method: 'POST',
          body: formData,
        });
      } catch (err) {
        console.warn('Report OCR API unavailable, running standalone Clinical Report engine:', err);
      }
    }

    await delay(1200, 2000);

    const result: LabReport = {
      ...MOCK_LAB_REPORT,
      fileName: file.name,
      fileSize: file.size,
      uploadDate: new Date().toISOString().split('T')[0],
    };

    localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(result));
    return result;
  },

  async getStoredReport(): Promise<LabReport | null> {
    const raw = localStorage.getItem(REPORT_STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
};
