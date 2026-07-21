import { auth } from './firebase';

const MAX_RETRIES = 2;
const DEFAULT_TIMEOUT = 90000; // 90 seconds for Gemini AI responses

// When running locally, you can change this to your Wrangler dev URL or use an env variable.
// In production, this MUST point to your deployed Cloudflare Worker URL.
// IMPORTANT: Wait for the user to provide the deployed worker URL, or use a default one.
const API_BASE_URL = import.meta.env.VITE_WORKER_URL || 'http://localhost:8787';

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = MAX_RETRIES
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);

    if (!res.ok) {
      if (res.status >= 500 && retries > 0) {
        console.warn(`Retrying request to ${url} (attempts left: ${retries - 1})`);
        await new Promise(r => setTimeout(r, 1000));
        return fetchWithRetry(url, options, retries - 1);
      }
      let errorMsg = 'Unknown Error';
      try {
        const rawText = await res.text();
        try {
          const errorData = JSON.parse(rawText);
          errorMsg = errorData.error || rawText;
        } catch (e) {
          errorMsg = rawText;
        }
      } catch (e) {
        errorMsg = 'Could not read error response';
      }
      console.error("API Error Response:", errorMsg);
      throw new ApiError(errorMsg, res.status);
    }
    return res;
  } catch (err: any) {
    clearTimeout(id);
    if (err.name === 'AbortError') {
      throw new ApiError('Request timed out while waiting for AI response.', 408);
    }
    // If it's a network error and we have retries
    if (!err.status && retries > 0) {
      console.warn(`Network error, retrying request to ${url} (attempts left: ${retries - 1})`);
      await new Promise(r => setTimeout(r, 1000));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw err;
  }
}

async function apiClient<T>(endpoint: string, body: any): Promise<T> {
  const token = await auth.currentUser?.getIdToken(true);
  
  if (!token) {
    throw new ApiError('User not authenticated.', 401);
  }

  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  const response = await fetchWithRetry(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  return await response.json() as T;
}

export const API = {
  tailorCv: (data: any) => apiClient<any>('/api/tailor-cv', data),
  scanCompanySite: (data: any) => apiClient<any>('/api/scan-company-site', data),
  scanEmails: (data: any) => apiClient<any>('/api/scan-emails', data),
  generateCvVariant: (data: any) => apiClient<any>('/api/generate-cv-variant', data),
  triggerAutomationCycle: (data: any) => apiClient<any>('/api/trigger-automation-cycle', data),
  draftHrReply: (data: any) => apiClient<any>('/api/draft-hr-reply', data),
  parseCv: (data: any) => apiClient<any>('/api/parse-cv', data),
  generateAiCv: (data: any) => apiClient<any>('/api/generate-ai-cv', data),
  importLinkedIn: (data: any) => apiClient<any>('/api/import-linkedin', data),
  generateFullProfile: (data: any) => apiClient<any>('/api/generate-full-profile', data),
  generateProfileAi: (data: any) => apiClient<any>('/api/generate-profile-ai', data),
  generateCareerRoadmap: (data: any) => apiClient<any>('/api/generate-career-roadmap', data),
  analyzeResume: (data: any) => apiClient<any>('/api/analyze-resume', data),
  generateCoverLetter: (data: any) => apiClient<any>('/api/generate-cover-letter', data),
  calculateGranularJobMatch: (data: any) => apiClient<any>('/api/calculate-granular-job-match', data),
  generateInterviewQuestions: (data: any) => apiClient<any>('/api/generate-interview-questions', data),
  evaluateInterviewAnswer: (data: any) => apiClient<any>('/api/evaluate-interview-answer', data),
  predictSalary: (data: any) => apiClient<any>('/api/predict-salary', data),
  generateLearningPath: (data: any) => apiClient<any>('/api/generate-learning-path', data),
  getCompanyIntelligence: (data: any) => apiClient<any>('/api/get-company-intelligence', data),
  generateDailyJobMatches: (data: any) => apiClient<any>('/api/generate-daily-job-matches', data),
  generateOutreachEmail: (data: any) => apiClient<any>('/api/generate-outreach-email', data),
  generateLinkedInNote: (data: any) => apiClient<any>('/api/generate-linked-in-note', data),
};
