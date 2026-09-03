import { MathSolution, MathStep } from '../types';

export interface FormattedStepView {
  stepIndex: number;
  title: string;
  explanation: string;
  beforeLatex: string;
  afterLatex: string;
  mathExpression: string;
  tipOrRule?: string;
  subSteps: {
    beforeLatex?: string;
    afterLatex?: string;
    explanation: string;
    tip?: string;
  }[];
}

function cleanLatex(val: string): string {
  if (!val) return '';
  let s = val.trim();
  // Fix missing backslashes on color, mathbf and textcolor
  s = s.replace(/(?<!\\)color\{/g, '\\color{');
  s = s.replace(/(?<!\\)mathbf\{/g, '\\mathbf{');
  s = s.replace(/(?<!\\)textcolor\{/g, '\\textcolor{');
  return s;
}

/**
 * Ensures every step has clear Before and After mathematical expressions
 * with Photomath-style highlighted terms.
 */
export function formatSolutionSteps(solution: MathSolution): FormattedStepView[] {
  if (!solution || !solution.steps || solution.steps.length === 0) return [];

  const originalInput = solution.originalInput || '';

  return solution.steps.map((step, index) => {
    let beforeLatex = cleanLatex(step.beforeExpression || '');
    let afterLatex = cleanLatex(step.afterExpression || '');

    // If beforeExpression is not set, derive from previous step or original input
    if (!beforeLatex) {
      if (index === 0) {
        beforeLatex = cleanLatex(originalInput || step.mathExpression || '');
      } else {
        const prevStep = solution.steps[index - 1];
        beforeLatex = cleanLatex(prevStep.afterExpression || prevStep.mathExpression || '');
      }
    }

    // If afterExpression is not set, use current step mathExpression
    if (!afterLatex) {
      afterLatex = cleanLatex(step.mathExpression || beforeLatex);
    }

    // Build subSteps list if available or construct default single sub-step
    let subSteps = (step.subSteps || []).map((sub) => ({
      beforeLatex: cleanLatex(sub.beforeLatex || beforeLatex),
      afterLatex: cleanLatex(sub.afterLatex || afterLatex),
      explanation: sub.explanation,
      tip: sub.tip,
    }));

    if (subSteps.length === 0) {
      subSteps = [
        {
          beforeLatex: beforeLatex,
          afterLatex: afterLatex,
          explanation: step.explanation,
          tip: step.tipOrRule,
        },
      ];
    }

    return {
      stepIndex: index,
      title: step.title,
      explanation: step.explanation,
      beforeLatex,
      afterLatex,
      mathExpression: cleanLatex(step.mathExpression),
      tipOrRule: step.tipOrRule,
      subSteps,
    };
  });
}
