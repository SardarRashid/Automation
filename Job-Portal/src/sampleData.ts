import { UserProfile, JobApplication } from './types';

export const sampleProfile: UserProfile = {
  name: "",
  email: "",
  phone: "",
  location: "",
  website: "",
  linkedinUrl: "",
  githubUrl: "",
  masterCvText: "",
  coverLetterText: "",
  mode: 'manual',
  preferredCountries: [],
  excludedCountries: [],
  preferredCategories: [],
  allowRelatedCategories: true,
  salaryExpectation: "",
  workSetup: "Any",
  summary: "",
  skills: [],
  experience: [],
  education: [],
  projects: [],
  certificates: [],
  languages: [],
  resumeVariants: [],
  identifiedMissingGaps: [],
  careerPathSuggestions: []
};

export const sampleApplications: JobApplication[] = [];
