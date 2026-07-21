export interface ResumeVariant {
  id: string;
  name: string;
  targetRole: string;
  targetIndustry: string;
  targetCountry: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Experience {
  id: string;
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Education {
  id: string;
  degree: string;
  institute: string;
  country: string;
  startDate: string;
  endDate: string;
  grade: string;
  description: string;
}

export interface Certification {
  id: string;
  certificate: string;
  organization: string;
  issueDate: string;
  expiryDate: string;
  credentialId: string;
  credentialUrl: string;
}

export interface Language {
  id: string;
  language: string;
  proficiency: 'Native' | 'Fluent' | 'Intermediate' | 'Basic';
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  location: string;
  country?: string;
  city?: string;
  nationality?: string;
  website: string;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl?: string;
  masterCvText: string; // Compiled final resume text
  coverLetterText: string; // Base cover letter
  
  // Job Search Preferences
  mode: 'fully_auto' | 'semi_auto' | 'manual';
  preferredCountries: string[];
  excludedCountries: string[];
  preferredCategories: string[];
  preferredJobTitle?: string;
  preferredIndustry?: string;
  allowRelatedCategories: boolean;
  expectedSalary?: string;
  salaryExpectation?: string; // legacy fallback
  remoteHybridOnsite?: 'Remote' | 'Hybrid' | 'Onsite' | 'Any';
  workSetup?: 'Remote' | 'Hybrid' | 'Onsite' | 'Any'; // legacy fallback

  // Granular Profile Fields
  professionalSummary?: string;
  summary?: string; // legacy fallback
  skills?: string[];
  experience?: Experience[];
  education?: Education[];
  projects?: { name: string; description: string; url?: string; technologies?: string[] }[];
  certifications?: Certification[];
  certificates?: string[]; // legacy fallback
  languages?: Language[];
  
  // AI-managed data
  resumeVariants?: ResumeVariant[];
  identifiedMissingGaps?: string[];
  careerPathSuggestions?: string[];
}

export interface Analysis {
  strengths: string[];
  gaps: string[];
}

export interface ScreeningQuestion {
  question: string;
  answer: string;
}

export interface ApplicationLog {
  id: string;
  date: string;
  text: string;
}

export interface SkillGapData {
  missing: string[];
  certs: string[];
  keywords: string[];
  suggestions: string[];
}

export interface AuthenticityData {
  rating: 'safe' | 'suspicious';
  reason: string;
}

export interface InterviewPredictionData {
  chance: 'high' | 'medium' | 'low';
  probability: number;
  breakdown: string;
}

export interface PortfolioEntry {
  id?: string;
  title: string;
  description: string;
  deliverables?: string[];
  metrics?: string;
  technologies?: string;
  category?: string;
}

export interface JobApplication {
  id: string;
  companyName: string;
  jobTitle: string;
  jobUrl?: string;
  jobDescription?: string;
  status: 'draft' | 'tailored' | 'applied' | 'interviewing' | 'offered' | 'rejected';
  appliedDate: string;
  matchScore?: number;
  analysis?: Analysis;
  keyChanges?: string[];
  tailoredCvText?: string;
  coverLetterText?: string;
  screeningQuestions?: ScreeningQuestion[];
  logs: ApplicationLog[];
  notes?: string;
  // Hyper-automation additions
  successScore?: number;
  authenticity?: AuthenticityData;
  interviewPrediction?: InterviewPredictionData;
  skillGaps?: SkillGapData;
  portfolioEntries?: PortfolioEntry[];
  appliedVariant?: string;
  countryRulesApplied?: string[];
  specialRequirementsDetected?: string[];
}

export interface OpenPosition {
  title: string;
  department: string;
  location: string;
  requirements: string[];
  description: string;
  country?: string;
}

export interface CompanyInfo {
  id: string;
  name: string;
  websiteUrl: string;
  logoUrl?: string;
  lastScanned?: string;
  openPositions?: OpenPosition[];
  customFormRequirements?: string;
  status: 'idle' | 'scanning' | 'scanned' | 'error';
  autoSearch?: boolean;
  autoApply?: boolean;
  // Scanner properties
  industry?: string;
  companySize?: string;
  country?: string;
  city?: string;
  saved?: boolean;
  notes?: string;
  careerPageUrl?: string;
  linkedinUrl?: string;
  aiSummary?: string;
}

export interface EmailResponse {
  id: string;
  sender: string;
  subject: string;
  date: string;
  snippet: string;
  companyName?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  statusChange?: 'applied' | 'interviewing' | 'offered' | 'rejected' | 'none';
  summary?: string;
  actionRequired?: string;
}

export interface RejectionLearning {
  id: string;
  emailId?: string;
  companyName: string;
  originalFeedback: string;
  gapExtracted: string;
  optimizationAction: string;
  date: string;
  status?: 'unread' | 'read';
}

export interface ContinuousLoopLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  status: 'info' | 'success' | 'warning' | 'error';
}
