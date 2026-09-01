export interface MathSubStep {
  beforeLatex?: string;
  afterLatex?: string;
  explanation: string;
  tip?: string;
  highlightedTerm?: string;
}

export interface MathStep {
  stepNumber: number;
  title: string;
  explanation: string;
  mathExpression: string; // LaTeX
  beforeExpression?: string; // Expression before applying this transformation
  afterExpression?: string; // Expression after applying this transformation
  tipOrRule?: string;
  subSteps?: MathSubStep[];
}

export interface FinalAnswer {
  exact: string; // LaTeX
  approximate?: string;
  explanation?: string;
  unit?: string;
  alternativeForms?: string[];
}

export interface Verification {
  method: string;
  mathExpression: string;
  isVerified: boolean;
  notes: string;
}

export interface GraphData {
  hasGraph: boolean;
  functionExpression?: string; // e.g. "x^2 - 4*x + 3" or "sin(x)"
  latexExpression?: string;
  domain?: [number, number];
  roots?: number[];
  criticalPoints?: { x: number; y: number; label: string }[];
  description?: string;
}

export interface PracticeProblem {
  id: string;
  problem: string;
  latex: string;
  answer: string;
  hint: string;
}

export interface MathSolution {
  id: string;
  timestamp: number;
  originalInput: string;
  detectedFromImage?: boolean;
  imageUrl?: string;
  problemTitle: string;
  problemType: string;
  summary: string;
  givenVariables: { name: string; value: string; description: string }[];
  formulasUsed: { name: string; latex: string; explanation: string }[];
  steps: MathStep[];
  finalAnswer: FinalAnswer;
  verification?: Verification;
  graphData?: GraphData;
  alternativeMethodSummary?: string;
  similarPracticeProblems?: PracticeProblem[];
}

export interface SolveRequest {
  problem?: string;
  image?: string; // base64 string
  detailLevel?: 'detailed' | 'concise';
  action?: 'solve' | 'clarify_step' | 'alternative_method' | 'similar_problem';
  stepIndex?: number;
  customQuestion?: string;
  previousSolution?: Partial<MathSolution>;
}

export interface FormulaItem {
  label: string;
  insertText: string;
  displayLatex?: string;
  description?: string;
  category: string;
  isTemplate?: boolean;
}

export interface FormulaCategory {
  id: string;
  title: string;
  iconName: string;
  items: FormulaItem[];
}
