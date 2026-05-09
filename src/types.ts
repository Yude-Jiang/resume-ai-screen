export interface WeightItem {
  id: string;
  label: string;
  value: number;
}

export type ScoringWeights = WeightItem[];

export type EduLevel = 'none' | 'associate' | 'bachelor' | 'master' | 'doctor';

export interface HardThresholds {
  minEdu: EduLevel;
  minExp: number;
  requiredSkills: string[];
}

export type JobStatus = 'active' | 'draft' | 'closed';

export interface WeightConfig {
  education: number;
  experience: number;
  skills: number;
  language: number;
  certificates: number;
}

export type CandidateStatus = 'new' | 'recommended' | 'pending' | 'rejected';
export type RecommendationLevel = 'high' | 'medium' | 'low' | 'none';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface ScoreBreakdown {
  education: number;
  experience: number;
  skills: number;
  language: number;
  certificates: number;
}

export interface Candidate {
  id: string;
  jobId: string;
  name: string;
  recentJob: string;
  recentCompany: string;
  experienceYears: number;
  coreSkills: string[];
  aiScore: number;
  recommendationLevel: RecommendationLevel;
  riskLevel: RiskLevel;
  recommendationReason: string;
  riskPrompts: string[];
  hrStatus: CandidateStatus;
  hrNotes?: string;
  hrOverrideReason?: string;
  parseStatus: 'parsing' | 'completed' | 'error';
  scoreStatus: 'scoring' | 'completed' | 'error';
  resumeUrl?: string;
  scoreBreakdown: ScoreBreakdown;
  email: string;
  phone: string;
  education: string;
}

export interface Job {
  id: string;
  title: string;
  dept: string;
  jd: string;
  weights: ScoringWeights;
  thresholds: HardThresholds;
  status: 'running' | 'paused' | JobStatus;
  updatedAt: any; // Firestore Timestamp
  ownerId?: string;
  isPublic?: boolean;
  name?: string;
  level?: string;
  resumeCount?: number;
  pendingReviewCount?: number;
  recommendedCount?: number;
  languageReq?: string;
}

export interface JdAnalysis {
  jobTitle?: string;
  suggestedWeights: ScoringWeights;
  thresholds: HardThresholds;
}

export interface AnalysisResult {
  id: string;
  candidate_name: string;
  overall_score: number;
  ai_score_initial?: number;
  hr_override_score?: number;
  hr_feedback_tags?: string[];
  detailed_scores: Record<string, number>; 
  summary: {
    highlights: string[];
    gaps: string[];
    key_skills: string[];
    personal_info: {
      name: string;
      email?: string;
      phone?: string;
      education_level: string;
      experience_years: number;
    }
  };
  overall_recommendation: {
    fit_status: string;
    logic: string;
  };
  file_name: string;
  file_data?: string; 
  jobId: string;
  createdAt: any;
  ownerId?: string;
}
