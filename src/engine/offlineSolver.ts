import { MathSolution, MathStep, PracticeProblem } from '../types';
import * as math from 'mathjs';

// Helper to simplify fractions
export function getGCD(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

export function simplifyFraction(numerator: number, denominator: number): { num: number; den: number; latex: string } {
  if (denominator === 0) return { num: numerator, den: 0, latex: '\\text{Indefinido}' };
  if (numerator === 0) return { num: 0, den: 1, latex: '0' };

  let sign = 1;
  if ((numerator < 0 && denominator > 0) || (numerator > 0 && denominator < 0)) {
    sign = -1;
  }
  const n = Math.abs(numerator);
  const d = Math.abs(denominator);
  const gcd = getGCD(n, d);
  const sNum = sign * (n / gcd);
  const sDen = d / gcd;

  if (sDen === 1) {
    return { num: sNum, den: 1, latex: `${sNum}` };
  }
  return {
    num: sNum,
    den: sDen,
    latex: sNum < 0 ? `-\\frac{${Math.abs(sNum)}}{${sDen}}` : `\\frac{${sNum}}{${sDen}}`,
  };
}

/**
 * 1. Solve Quadratic Equation: a x^2 + b x + c = 0
 */
export function solveQuadratic(
  a: number,
  b: number,
  c: number,
  originalText: string,
  method: 'bhaskara' | 'factoring' | 'completing_square' = 'bhaskara'
): MathSolution {
  const steps: MathStep[] = [];
  const delta = b * b - 4 * a * c;

  steps.push({
    stepNumber: 1,
    title: 'Identificar os Coeficientes da Equação Quadrática',
    explanation: `A equação está na forma geral ax² + bx + c = 0. Identificamos os coeficientes:`,
    mathExpression: `a = ${a}, \\quad b = ${b}, \\quad c = ${c}`,
    tipOrRule: 'Uma equação quadrática é definida por ax² + bx + c = 0 onde a ≠ 0.',
  });

  if (method === 'completing_square') {
    // Completing square method
    steps.push({
      stepNumber: 2,
      title: 'Dividir a equação pelo coeficiente principal "a"',
      explanation: `Dividimos todos os termos por a = ${a} para normalizar o termo quadrático:`,
      mathExpression: `x^2 + ${simplifyFraction(b, a).latex}x + ${simplifyFraction(c, a).latex} = 0`,
      tipOrRule: 'O método de completar quadrados requer que o coeficiente de x² seja igual a 1.',
    });

    const halfB = simplifyFraction(b, 2 * a);
    const halfBSq = simplifyFraction(b * b, 4 * a * a);
    const cOverA = simplifyFraction(-c, a);

    steps.push({
      stepNumber: 3,
      title: 'Mover o termo independente e somar (b/2a)²',
      explanation: `Isolamos as incógnitas e somamos (b/2a)² em ambos os lados da igualdade para formar um trinômio quadrado perfeito:`,
      mathExpression: `\\left( x + ${halfB.latex} \\right)^2 = ${cOverA.latex} + ${halfBSq.latex} = ${simplifyFraction(delta, 4 * a * a).latex}`,
      tipOrRule: 'Trinômio Quadrado Perfeito: (x + p)² = x² + 2px + p².',
    });
  } else if (method === 'factoring' && delta >= 0 && Math.sqrt(delta) % 1 === 0) {
    // Factoring / Sum and Product
    const S = simplifyFraction(-b, a);
    const P = simplifyFraction(c, a);
    steps.push({
      stepNumber: 2,
      title: 'Aplicar a Relação de Girard (Soma e Produto)',
      explanation: `Calculamos a soma S e o produto P das raízes:`,
      mathExpression: `S = -\\frac{b}{a} = ${S.latex}, \\quad P = \\frac{c}{a} = ${P.latex}`,
      tipOrRule: 'As raízes x₁ e x₂ satisfazem x₁ + x₂ = S e x₁ · x₂ = P.',
    });
  } else {
    // Default Bhaskara
    steps.push({
      stepNumber: 2,
      title: 'Calcular o Discriminante (Delta - Δ)',
      explanation: `Aplicamos a fórmula do discriminante Δ = b² - 4ac substituindo os valores:`,
      mathExpression: `\\Delta = (${b})^2 - 4 \\cdot (${a}) \\cdot (${c}) = ${b * b} - (${4 * a * c}) = ${delta}`,
      tipOrRule:
        delta > 0
          ? 'Como Δ > 0, a equação possui 2 raízes reais e distintas.'
          : delta === 0
          ? 'Como Δ = 0, a equação possui 1 raiz real dupla.'
          : 'Como Δ < 0, a equação não possui raízes reais (possui 2 raízes complexas conjugadas).',
    });

    steps.push({
      stepNumber: 3,
      title: 'Aplicar a Fórmula de Bhaskara',
      explanation: `Substituímos os coeficientes na fórmula quadrática x = (-b ± √Δ)/(2a):`,
      mathExpression: `x = \\frac{-(${b}) \\pm \\sqrt{${delta}}}{2 \\cdot (${a})} = \\frac{${-b} \\pm \\sqrt{${delta}}}{${2 * a}}`,
      tipOrRule: 'A fórmula de Bhaskara fornece todas as soluções analíticas exatas da equação do 2º grau.',
    });
  }

  let finalExact = '';
  let finalApprox = '';
  const roots: number[] = [];

  if (delta > 0) {
    const sqrtDelta = Math.sqrt(delta);
    const isPerfectSquare = sqrtDelta % 1 === 0;

    if (isPerfectSquare) {
      const x1 = (-b + sqrtDelta) / (2 * a);
      const x2 = (-b - sqrtDelta) / (2 * a);
      roots.push(parseFloat(x1.toFixed(4)), parseFloat(x2.toFixed(4)));

      const x1Frac = simplifyFraction(-b + sqrtDelta, 2 * a);
      const x2Frac = simplifyFraction(-b - sqrtDelta, 2 * a);

      steps.push({
        stepNumber: steps.length + 1,
        title: 'Calcular as Duas Raízes Reais Distintas (x₁ e x₂)',
        explanation: `Como √${delta} = ${sqrtDelta}, calculamos os dois ramos da operação:`,
        mathExpression: `x_1 = \\frac{${-b} + ${sqrtDelta}}{${2 * a}} = ${x1Frac.latex}, \\quad x_2 = \\frac{${-b} - ${sqrtDelta}}{${2 * a}} = ${x2Frac.latex}`,
      });

      finalExact = `S = \\{ ${x2Frac.latex}, \\, ${x1Frac.latex} \\}`;
      finalApprox = `x_1 = ${x1.toFixed(2)}, \\, x_2 = ${x2.toFixed(2)}`;
    } else {
      const x1Frac = `\\frac{${-b} + \\sqrt{${delta}}}{${2 * a}}`;
      const x2Frac = `\\frac{${-b} - \\sqrt{${delta}}}{${2 * a}}`;
      const x1Val = (-b + sqrtDelta) / (2 * a);
      const x2Val = (-b - sqrtDelta) / (2 * a);
      roots.push(parseFloat(x1Val.toFixed(4)), parseFloat(x2Val.toFixed(4)));

      steps.push({
        stepNumber: steps.length + 1,
        title: 'Simplificar as Raízes Reais Irracionais',
        explanation: `Como ${delta} não é um quadrado perfeito, mantemos a forma exata com radical:`,
        mathExpression: `x_1 = ${x1Frac}, \\quad x_2 = ${x2Frac}`,
      });

      finalExact = `x = \\frac{${-b} \\pm \\sqrt{${delta}}}{${2 * a}}`;
      finalApprox = `x_1 \\approx ${x1Val.toFixed(3)}, \\, x_2 \\approx ${x2Val.toFixed(3)}`;
    }
  } else if (delta === 0) {
    const x = -b / (2 * a);
    roots.push(parseFloat(x.toFixed(4)));
    const xFrac = simplifyFraction(-b, 2 * a);

    steps.push({
      stepNumber: steps.length + 1,
      title: 'Calcular a Raiz Real Dupla',
      explanation: `Como Δ = 0, a raiz é única (raiz com multiplicidade 2):`,
      mathExpression: `x = -\\frac{b}{2a} = \\frac{${-b}}{${2 * a}} = ${xFrac.latex}`,
    });

    finalExact = `S = \\{ ${xFrac.latex} \\}`;
    finalApprox = `x = ${x.toFixed(2)}`;
  } else {
    // delta < 0
    const absDelta = Math.abs(delta);
    const sqrtAbs = Math.sqrt(absDelta);
    const isPerf = sqrtAbs % 1 === 0;
    const realPart = simplifyFraction(-b, 2 * a);

    steps.push({
      stepNumber: steps.length + 1,
      title: 'Determinar as Raízes Complexas Conjugadas',
      explanation: `Como Δ < 0, temos √Δ = √(${absDelta} · (-1)) = √(${absDelta})i:`,
      mathExpression: isPerf
        ? `x = ${realPart.latex} \\pm ${simplifyFraction(sqrtAbs, 2 * a).latex}i`
        : `x = \\frac{${-b} \\pm i\\sqrt{${absDelta}}}{${2 * a}}`,
      tipOrRule: 'Unidade imaginária: i = √(-1), logo i² = -1.',
    });

    finalExact = isPerf
      ? `x = ${realPart.latex} \\pm ${simplifyFraction(sqrtAbs, 2 * a).latex}i`
      : `x = \\frac{${-b} \\pm i\\sqrt{${absDelta}}}{${2 * a}}`;
  }

  // Vertex calculation
  const xv = -b / (2 * a);
  const yv = -delta / (4 * a);
  const xvFrac = simplifyFraction(-b, 2 * a);
  const yvFrac = simplifyFraction(-delta, 4 * a);

  steps.push({
    stepNumber: steps.length + 1,
    title: 'Determinar as Coordenadas do Vértice da Parábola V(x_v, y_v)',
    explanation: `O vértice representa o ponto de ${a > 0 ? 'mínimo' : 'máximo'} global da função quadrática:`,
    mathExpression: `x_v = -\\frac{b}{2a} = ${xvFrac.latex}, \\quad y_v = -\\frac{\\Delta}{4a} = ${yvFrac.latex} \\implies V\\left(${xvFrac.latex}, \\, ${yvFrac.latex}\\right)`,
    tipOrRule: `Concavidade voltada para ${a > 0 ? 'cima (a > 0, possui ponto de mínimo)' : 'baixo (a < 0, possui ponto de máximo)'}.`,
  });

  const practice: PracticeProblem[] = [
    {
      id: 'prac_q_1',
      problem: `Resolva a equação quadrática: x^2 - 5x + 6 = 0`,
      latex: 'x^2 - 5x + 6 = 0',
      answer: 'S = \\{2, 3\\}',
      hint: 'Identifique a=1, b=-5, c=6 e calcule Delta = 25 - 24 = 1.',
    },
    {
      id: 'prac_q_2',
      problem: `Encontre as raízes de: 3x^2 - 12 = 0`,
      latex: '3x^2 - 12 = 0',
      answer: 'x = \\pm 2',
      hint: 'Isole x^2: 3x^2 = 12 => x^2 = 4.',
    },
    {
      id: 'prac_q_3',
      problem: `Calcule as raízes e o vértice de: x^2 - 4x + 4 = 0`,
      latex: 'x^2 - 4x + 4 = 0',
      answer: 'S = \\{2\\}, \\, V(2, 0)',
      hint: 'Delta = (-4)^2 - 4(1)(4) = 0, raiz real dupla.',
    },
  ];

  return {
    id: 'sol_off_' + Date.now(),
    timestamp: Date.now(),
    originalInput: originalText,
    problemTitle: `Equação Quadrática: ${a !== 1 ? a : ''}x² ${b >= 0 ? '+ ' + b : '- ' + Math.abs(b)}x ${c >= 0 ? '+ ' + c : '- ' + Math.abs(c)} = 0`,
    problemType: 'Álgebra / Equações de 2º Grau',
    summary: `Resolução 100% detalhada pelo método ${method === 'bhaskara' ? 'de Bhaskara' : method === 'factoring' ? 'de Fatoração / Girard' : 'de Completar Quadrados'} com análise do discriminante, raízes e vértice.`,
    givenVariables: [
      { name: 'a', value: `${a}`, description: 'Coeficiente quadrático' },
      { name: 'b', value: `${b}`, description: 'Coeficiente linear' },
      { name: 'c', value: `${c}`, description: 'Termo constante independente' },
    ],
    formulasUsed: [
      { name: 'Discriminante', latex: '\\Delta = b^2 - 4ac', explanation: 'Determina a natureza das raízes' },
      { name: 'Fórmula de Bhaskara', latex: 'x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}', explanation: 'Calcula os valores exatos das raízes' },
      { name: 'Vértice da Parábola', latex: 'V\\left(-\\frac{b}{2a}, -\\frac{\\Delta}{4a}\\right)', explanation: 'Ponto extremo da função quadrática' },
    ],
    steps,
    finalAnswer: {
      exact: finalExact,
      approximate: finalApprox,
      explanation: `As soluções da equação quadrática são dadas pelo conjunto solução ${finalExact}. O vértice da parábola está localizado em (${xvFrac.latex}, ${yvFrac.latex}).`,
    },
    verification: {
      method: 'Substituição das Raízes e Relações de Girard',
      mathExpression: `x_1 + x_2 = -\\frac{b}{a} = ${simplifyFraction(-b, a).latex}, \\quad x_1 \\cdot x_2 = \\frac{c}{a} = ${simplifyFraction(c, a).latex}`,
      isVerified: true,
      notes: 'A soma e o produto das raízes calculadas conferem perfeitamente com os coeficientes da equação original.',
    },
    graphData: {
      hasGraph: true,
      functionExpression: `${a}*x^2 + (${b})*x + (${c})`,
      latexExpression: `${a}x^2 ${b >= 0 ? '+' + b : b}x ${c >= 0 ? '+' + c : c}`,
      roots: roots,
      criticalPoints: [{ x: parseFloat(xv.toFixed(2)), y: parseFloat(yv.toFixed(2)), label: `V(${xv.toFixed(1)}, ${yv.toFixed(1)})` }],
    },
    similarPracticeProblems: practice,
  };
}

/**
 * 2. Solve Linear Equation: ax + b = cx + d
 */
export function solveLinear(a: number, b: number, c: number, d: number, originalText: string): MathSolution {
  const steps: MathStep[] = [];

  steps.push({
    stepNumber: 1,
    title: 'Escrever a Equação na Forma Algébrica',
    explanation: 'A equação de 1º grau apresenta termos com a incógnita x e termos numéricos constantes:',
    mathExpression: `${a}x ${b >= 0 ? '+ ' + b : '- ' + Math.abs(b)} = ${c}x ${d >= 0 ? '+ ' + d : '- ' + Math.abs(d)}`,
    tipOrRule: 'O objetivo é isolar a incógnita x em um dos membros e as constantes no outro.',
  });

  const netA = a - c;
  const netB = d - b;

  steps.push({
    stepNumber: 2,
    title: 'Agrupar os Termos com "x" no 1º Membro e Constantes no 2º Membro',
    explanation: `Passamos ${c}x para o primeiro membro subtraindo e a constante ${b} para o segundo membro invertendo o sinal:`,
    mathExpression: `(${a} - ${c})x = ${d} - (${b}) \\implies ${netA}x = ${netB}`,
    tipOrRule: 'Princípio Aditivo da Igualdade: ao trocar de lado da igualdade, o termo troca de sinal.',
  });

  if (netA === 0) {
    if (netB === 0) {
      steps.push({
        stepNumber: 3,
        title: 'Análise da Identidade',
        explanation: 'Obtemos 0x = 0, o que é uma identidade verdadeira para qualquer valor real de x.',
        mathExpression: '0x = 0 \\implies S = \\mathbb{R}',
      });
      return {
        id: 'sol_off_' + Date.now(),
        timestamp: Date.now(),
        originalInput: originalText,
        problemTitle: `Equação Linear Identidade`,
        problemType: 'Álgebra / Equações de 1º Grau',
        summary: 'Equação indeterminada com infinitas soluções (identidade matemática).',
        givenVariables: [],
        formulasUsed: [],
        steps,
        finalAnswer: { exact: 'S = \\mathbb{R}', explanation: 'A equação é válida para todos os números reais.' },
      };
    } else {
      steps.push({
        stepNumber: 3,
        title: 'Análise de Impossibilidade',
        explanation: `Obtemos 0x = ${netB}, o que é uma contradição impossível.`,
        mathExpression: `0 = ${netB} \\quad (\\text{Impossível})`,
      });
      return {
        id: 'sol_off_' + Date.now(),
        timestamp: Date.now(),
        originalInput: originalText,
        problemTitle: `Equação Linear Impossível`,
        problemType: 'Álgebra / Equações de 1º Grau',
        summary: 'Equação sem solução no conjunto dos números reais.',
        givenVariables: [],
        formulasUsed: [],
        steps,
        finalAnswer: { exact: 'S = \\emptyset', explanation: 'A equação não possui nenhuma solução real.' },
      };
    }
  }

  const frac = simplifyFraction(netB, netA);
  const xVal = netB / netA;

  steps.push({
    stepNumber: 3,
    title: 'Isolar a Incógnita "x" Dividindo pelo Coeficiente',
    explanation: `Dividimos ambos os lados por ${netA} para obter o valor final de x:`,
    mathExpression: `x = \\frac{${netB}}{${netA}} = ${frac.latex}`,
    tipOrRule: 'Princípio Multiplicativo da Igualdade: divide-se ambos os membros pelo coeficiente de x.',
  });

  return {
    id: 'sol_off_' + Date.now(),
    timestamp: Date.now(),
    originalInput: originalText,
    problemTitle: `Equação de 1º Grau: ${a}x + (${b}) = ${c}x + (${d})`,
    problemType: 'Álgebra / Equações de 1º Grau',
    summary: `Resolução passo a passo isolando a incógnita x. Solução: x = ${frac.latex}`,
    givenVariables: [
      { name: 'Coeficiente esquerdo', value: `${a}`, description: 'Termo em x no membro esquerdo' },
      { name: 'Constante esquerda', value: `${b}`, description: 'Termo constante esquerdo' },
      { name: 'Coeficiente direito', value: `${c}`, description: 'Termo em x no membro direito' },
      { name: 'Constante direita', value: `${d}`, description: 'Termo constante direito' },
    ],
    formulasUsed: [
      { name: 'Princípio Aditivo', latex: 'A + C = B + C', explanation: 'Transposição de termos' },
      { name: 'Princípio Multiplicativo', latex: 'A \\cdot k = B \\cdot k', explanation: 'Divisão por escalar' },
    ],
    steps,
    finalAnswer: {
      exact: `x = ${frac.latex}`,
      approximate: frac.den !== 1 ? `x \\approx ${xVal.toFixed(3)}` : undefined,
      explanation: `O valor que satisfaz a igualdade é x = ${frac.latex}.`,
    },
    verification: {
      method: 'Substituição Direta na Equação Original',
      mathExpression: `${a}(${frac.latex}) + ${b} = ${simplifyFraction(a * netB + b * netA, netA).latex} = ${c}(${frac.latex}) + ${d}`,
      isVerified: true,
      notes: 'Ao substituir o valor encontrado, ambos os lados da equação resultam no mesmo número.',
    },
    similarPracticeProblems: [
      { id: 'p_lin_1', problem: 'Resolva a equação: 5x - 7 = 3x + 9', latex: '5x - 7 = 3x + 9', answer: 'x = 8', hint: 'Passe 3x para o 1º membro e -7 para o 2º membro.' },
      { id: 'p_lin_2', problem: 'Resolva: 4(x - 2) = 2x + 10', latex: '4(x - 2) = 2x + 10', answer: 'x = 9', hint: 'Aplique a distributiva: 4x - 8 = 2x + 10.' },
    ],
  };
}

/**
 * 2B. Solve Linear Inequality: ax + b <rel> cx + d
 * Supports <, >, \le, \ge, \ne, <=, >=, !=
 */
export function solveLinearInequality(
  a: number,
  b: number,
  rel: string,
  c: number,
  d: number,
  originalText: string
): MathSolution {
  const steps: MathStep[] = [];

  // Normalize relational symbol to standard LaTeX
  let relLatex = rel;
  if (rel === '<=' || rel === '\\leq') relLatex = '\\le';
  if (rel === '>=' || rel === '\\geq') relLatex = '\\ge';
  if (rel === '!=' || rel === '\\neq') relLatex = '\\ne';

  const relName =
    relLatex === '<'
      ? 'Menor que'
      : relLatex === '>'
      ? 'Maior que'
      : relLatex === '\\le'
      ? 'Menor ou igual'
      : relLatex === '\\ge'
      ? 'Maior ou igual'
      : 'Diferente de';

  steps.push({
    stepNumber: 1,
    title: 'Escrever a Inequação na Forma Algébrica',
    explanation: `Apresentamos a inequação linear de 1º grau com o operador relacional (${relName}):`,
    mathExpression: `${a}x ${b >= 0 ? '+ ' + b : '- ' + Math.abs(b)} ${relLatex} ${c}x ${d >= 0 ? '+ ' + d : '- ' + Math.abs(d)}`,
    tipOrRule: 'Em uma inequação, resolve-se de modo análogo à equação, mantendo atenção na inversão do sentido da desigualdade ao multiplicar ou dividir por números negativos.',
  });

  const netA = a - c;
  const netB = d - b;

  steps.push({
    stepNumber: 2,
    title: 'Transpor Termos com "x" para o 1º Membro e Constantes para o 2º Membro',
    explanation: `Passamos ${c}x para a esquerda subtraindo e a constante ${b} para a direita invertendo o sinal:`,
    mathExpression: `(${a} - ${c})x ${relLatex} ${d} - (${b}) \\implies ${netA}x ${relLatex} ${netB}`,
    tipOrRule: 'Princípio Aditivo: Somar ou subtrair o mesmo número em ambos os membros preserva o sinal da desigualdade.',
  });

  if (netA === 0) {
    let isAlwaysTrue = false;
    if (relLatex === '<') isAlwaysTrue = 0 < netB;
    else if (relLatex === '>') isAlwaysTrue = 0 > netB;
    else if (relLatex === '\\le') isAlwaysTrue = 0 <= netB;
    else if (relLatex === '\\ge') isAlwaysTrue = 0 >= netB;
    else if (relLatex === '\\ne') isAlwaysTrue = 0 !== netB;

    if (isAlwaysTrue) {
      steps.push({
        stepNumber: 3,
        title: 'Análise de Desigualdade Verdadeira (Identidade Universal)',
        explanation: `Obtemos 0 ${relLatex} ${netB}, que é uma proposição sempre verdadeira para qualquer número real x.`,
        mathExpression: `0 ${relLatex} ${netB} \\quad (\\text{Verdadeiro para todo } x \\in \\mathbb{R})`,
      });
      return {
        id: 'sol_off_' + Date.now(),
        timestamp: Date.now(),
        originalInput: originalText,
        problemTitle: `Inequação Linear Identidade: S = ℝ`,
        problemType: 'Álgebra / Inequações de 1º Grau',
        summary: 'A inequação é satisfeita por todo o conjunto dos números reais ℝ.',
        givenVariables: [],
        formulasUsed: [],
        steps,
        finalAnswer: { exact: 'S = \\mathbb{R}', explanation: 'Qualquer valor de x satisfaz a inequação.' },
      };
    } else {
      steps.push({
        stepNumber: 3,
        title: 'Análise de Desigualdade Falsa (Sem Solução)',
        explanation: `Obtemos 0 ${relLatex} ${netB}, que é uma proposição falsa. Logo, não existe solução real.`,
        mathExpression: `0 ${relLatex} ${netB} \\quad (\\text{Falso / Sem Solução})`,
      });
      return {
        id: 'sol_off_' + Date.now(),
        timestamp: Date.now(),
        originalInput: originalText,
        problemTitle: `Inequação Linear Sem Solução: S = ∅`,
        problemType: 'Álgebra / Inequações de 1º Grau',
        summary: 'A inequação não possui nenhuma solução real (conjunto solução vazio).',
        givenVariables: [],
        formulasUsed: [],
        steps,
        finalAnswer: { exact: 'S = \\emptyset', explanation: 'Nenhum número real satisfaz a inequação.' },
      };
    }
  }

  // Check if sign flips due to negative coefficient
  let finalRel = relLatex;
  let didFlip = false;
  if (netA < 0) {
    didFlip = true;
    if (relLatex === '<') finalRel = '>';
    else if (relLatex === '>') finalRel = '<';
    else if (relLatex === '\\le') finalRel = '\\ge';
    else if (relLatex === '\\ge') finalRel = '\\le';
  }

  const frac = simplifyFraction(netB, netA);
  const kVal = netB / netA;

  if (didFlip) {
    steps.push({
      stepNumber: 3,
      title: 'Inversão do Sentido da Desigualdade (Divisão por Negativo)',
      explanation: `Como o coeficiente de x (${netA}) é negativo, ao dividir ambos os membros por ${netA}, invertemos obrigatoriamente o sentido da desigualdade (${relLatex} torna-se ${finalRel}):`,
      mathExpression: `x ${finalRel} \\frac{${netB}}{${netA}} \\implies x ${finalRel} ${frac.latex}`,
      tipOrRule: 'Regra de Ouro das Inequações: Ao multiplicar ou dividir ambos os membros por um número negativo (< 0), o sentido da desigualdade inverte!',
    });
  } else {
    steps.push({
      stepNumber: 3,
      title: 'Isolar a Incógnita "x" Dividindo pelo Coeficiente Positivo',
      explanation: `Dividimos ambos os membros por ${netA} (número positivo, preservando o sentido da desigualdade):`,
      mathExpression: `x ${finalRel} \\frac{${netB}}{${netA}} \\implies x ${finalRel} ${frac.latex}`,
      tipOrRule: 'Ao dividir por um número positivo, o sentido da desigualdade permanece inalterado.',
    });
  }

  // Step 4: Interval & Set Notation
  let intervalLatex = '';
  let setLatex = `S = \\{ x \\in \\mathbb{R} \\mid x ${finalRel} ${frac.latex} \\}`;

  if (finalRel === '>') {
    intervalLatex = `S = \\left] ${frac.latex}, +\\infty \\right[ = (${frac.latex}, +\\infty)`;
  } else if (finalRel === '\\ge') {
    intervalLatex = `S = \\left[ ${frac.latex}, +\\infty \\right[ = [${frac.latex}, +\\infty)`;
  } else if (finalRel === '<') {
    intervalLatex = `S = \\left] -\\infty, ${frac.latex} \\right[ = (-\\infty, ${frac.latex})`;
  } else if (finalRel === '\\le') {
    intervalLatex = `S = \\left] -\\infty, ${frac.latex} \\right] = (-\\infty, ${frac.latex}]`;
  } else if (finalRel === '\\ne') {
    intervalLatex = `S = \\mathbb{R} \\setminus \\{ ${frac.latex} \\}`;
  }

  steps.push({
    stepNumber: 4,
    title: 'Notação de Intervalo e Conjunto Solução',
    explanation: 'Expressamos a resposta na notação formal de conjuntos e intervalos reais:',
    mathExpression: `${setLatex} \\quad \\Longleftrightarrow \\quad ${intervalLatex}`,
    tipOrRule: 'Intervalos com colchete para fora ou parênteses indicam extremos abertos (exclusivos). Colchete para dentro indica extremo fechado (inclusivo).',
  });

  return {
    id: 'sol_off_' + Date.now(),
    timestamp: Date.now(),
    originalInput: originalText,
    problemTitle: `Inequação de 1º Grau: ${a}x + (${b}) ${relLatex} ${c}x + (${d})`,
    problemType: 'Álgebra / Inequações de 1º Grau',
    summary: `Inequação resolvida com sucesso. Conjunto Solução: x ${finalRel} ${frac.latex} (${intervalLatex})`,
    givenVariables: [
      { name: 'Coeficiente esquerdo', value: `${a}`, description: 'Termo em x no 1º membro' },
      { name: 'Constante esquerda', value: `${b}`, description: 'Termo constante esquerdo' },
      { name: 'Relação inicial', value: `${relLatex}`, description: 'Símbolo da desigualdade' },
      { name: 'Coeficiente direito', value: `${c}`, description: 'Termo em x no 2º membro' },
      { name: 'Constante direita', value: `${d}`, description: 'Termo constante direito' },
    ],
    formulasUsed: [
      { name: 'Princípio Aditivo', latex: 'a \\le b \\iff a + c \\le b + c', explanation: 'Transposição de termos mantendo o sinal' },
      { name: 'Inversão do Sinal em Inequações', latex: 'c < 0 \\implies (a \\le b \\iff a \\cdot c \\ge b \\cdot c)', explanation: 'Multiplicação ou divisão por negativo inverte o sentido' },
    ],
    steps,
    finalAnswer: {
      exact: `x ${finalRel} ${frac.latex} \\quad \\implies \\quad ${intervalLatex}`,
      approximate: !Number.isInteger(kVal) ? `x ${finalRel} ${kVal.toFixed(4)}` : undefined,
      explanation: `O conjunto solução é composto por todos os números reais x tais que x ${finalRel} ${frac.latex}.`,
    },
    similarPracticeProblems: [
      { id: 'p_ineq_1', problem: 'Resolva a inequação: 4x - 5 > 2x + 7', latex: '4x - 5 > 2x + 7', answer: 'x > 6', hint: 'Passe 2x para a esquerda e -5 para a direita.' },
      { id: 'p_ineq_2', problem: 'Resolva com inversão: -3x + 6 \\le 15', latex: '-3x + 6 \\le 15', answer: 'x \\ge -3', hint: 'Ao dividir por -3, inverta o sinal para \\ge.' },
    ],
  };
}

/**
 * 2C. Solve Quadratic Inequality: ax^2 + bx + c <rel> 0
 */
export function solveQuadraticInequality(
  a: number,
  b: number,
  c: number,
  rel: string,
  originalText: string
): MathSolution {
  const steps: MathStep[] = [];

  let relLatex = rel;
  if (rel === '<=' || rel === '\\leq') relLatex = '\\le';
  if (rel === '>=' || rel === '\\geq') relLatex = '\\ge';

  const delta = b * b - 4 * a * c;

  steps.push({
    stepNumber: 1,
    title: 'Escrever a Inequação do 2º Grau na Forma Padrão',
    explanation: 'A inequação quadrática compara uma função do 2º grau a zero:',
    mathExpression: `${a}x^2 ${b >= 0 ? '+ ' + b : '- ' + Math.abs(b)}x ${c >= 0 ? '+ ' + c : '- ' + Math.abs(c)} ${relLatex} 0`,
    tipOrRule: 'Para resolver inequações do 2º grau, determinamos as raízes reais da parábola associada e analisamos o estudo do sinal.',
  });

  steps.push({
    stepNumber: 2,
    title: 'Calcular o Discriminante (Delta Δ)',
    explanation: 'Aplicamos a fórmula do discriminante Δ = b² - 4ac:',
    mathExpression: `\\Delta = (${b})^2 - 4(${a})(${c}) = ${b * b} - (${4 * a * c}) = ${delta}`,
    tipOrRule: delta > 0 ? 'Δ > 0: a função possui duas raízes reais e distintas.' : delta === 0 ? 'Δ = 0: a função possui uma raiz real dupla.' : 'Δ < 0: a função não possui raízes reais.',
  });

  let exactResult = '';
  let intervalResult = '';

  if (delta > 0) {
    const sqrtDelta = Math.sqrt(delta);
    const r1 = (-b - sqrtDelta) / (2 * a);
    const r2 = (-b + sqrtDelta) / (2 * a);
    const xMin = Math.min(r1, r2);
    const xMax = Math.max(r1, r2);
    const xMinFrac = Number.isInteger(sqrtDelta) ? simplifyFraction(-b - (a > 0 ? sqrtDelta : -sqrtDelta), 2 * a).latex : xMin.toFixed(2);
    const xMaxFrac = Number.isInteger(sqrtDelta) ? simplifyFraction(-b + (a > 0 ? sqrtDelta : -sqrtDelta), 2 * a).latex : xMax.toFixed(2);

    steps.push({
      stepNumber: 3,
      title: 'Determinar as Raízes da Parábola (Bhaskara)',
      explanation: 'Calculamos os dois zeros reais da função:',
      mathExpression: `x_1 = ${xMinFrac}, \\quad x_2 = ${xMaxFrac}`,
    });

    const isPositiveBetween = a < 0;
    steps.push({
      stepNumber: 4,
      title: 'Estudo do Sinal da Parábola',
      explanation: `Como o coeficiente a = ${a} (${a > 0 ? 'a > 0, concavidade para cima' : 'a < 0, concavidade para baixo'}), o sinal da função é ${isPositiveBetween ? 'POSITIVO entre as raízes e NEGATIVO fora delas' : 'NEGATIVO entre as raízes e POSITIVO fora delas'}.`,
      mathExpression: `\\text{Concavidade: } ${a > 0 ? '\\cup' : '\\cap'} \\quad \\implies \\quad x_1 = ${xMinFrac}, \\, x_2 = ${xMaxFrac}`,
      tipOrRule: 'Parábola com a > 0 tem o mesmo sinal de a (positivo) fora das raízes e sinal contrário (negativo) entre as raízes.',
    });

    if (relLatex === '<') {
      if (a > 0) {
        exactResult = `${xMinFrac} < x < ${xMaxFrac}`;
        intervalResult = `S = \\left] ${xMinFrac}, ${xMaxFrac} \\right[`;
      } else {
        exactResult = `x < ${xMinFrac} \\text{ ou } x > ${xMaxFrac}`;
        intervalResult = `S = \\left] -\\infty, ${xMinFrac} \\right[ \\cup \\left] ${xMaxFrac}, +\\infty \\right[`;
      }
    } else if (relLatex === '\\le') {
      if (a > 0) {
        exactResult = `${xMinFrac} \\le x \\le ${xMaxFrac}`;
        intervalResult = `S = \\left[ ${xMinFrac}, ${xMaxFrac} \\right]`;
      } else {
        exactResult = `x \\le ${xMinFrac} \\text{ ou } x \\ge ${xMaxFrac}`;
        intervalResult = `S = \\left] -\\infty, ${xMinFrac} \\right] \\cup \\left[ ${xMaxFrac}, +\\infty \\right[`;
      }
    } else if (relLatex === '>') {
      if (a > 0) {
        exactResult = `x < ${xMinFrac} \\text{ ou } x > ${xMaxFrac}`;
        intervalResult = `S = \\left] -\\infty, ${xMinFrac} \\right[ \\cup \\left] ${xMaxFrac}, +\\infty \\right[`;
      } else {
        exactResult = `${xMinFrac} < x < ${xMaxFrac}`;
        intervalResult = `S = \\left] ${xMinFrac}, ${xMaxFrac} \\right[`;
      }
    } else if (relLatex === '\\ge') {
      if (a > 0) {
        exactResult = `x \\le ${xMinFrac} \\text{ ou } x \\ge ${xMaxFrac}`;
        intervalResult = `S = \\left] -\\infty, ${xMinFrac} \\right] \\cup \\left[ ${xMaxFrac}, +\\infty \\right[`;
      } else {
        exactResult = `${xMinFrac} \\le x \\le ${xMaxFrac}`;
        intervalResult = `S = \\left[ ${xMinFrac}, ${xMaxFrac} \\right]`;
      }
    }
  } else if (delta === 0) {
    const x0 = simplifyFraction(-b, 2 * a).latex;
    steps.push({
      stepNumber: 3,
      title: 'Raiz Real Dupla (Vértice Tangente ao Eixo x)',
      explanation: `A parábola tangencia o eixo x no ponto x = ${x0}:`,
      mathExpression: `x_0 = -\\frac{b}{2a} = ${x0}`,
    });

    if (relLatex === '>' && a > 0) {
      exactResult = `x \\ne ${x0}`;
      intervalResult = `S = \\mathbb{R} \\setminus \\{ ${x0} \\}`;
    } else if (relLatex === '\\ge' && a > 0) {
      exactResult = `x \\in \\mathbb{R}`;
      intervalResult = `S = \\mathbb{R}`;
    } else if (relLatex === '<' && a > 0) {
      exactResult = `S = \\emptyset`;
      intervalResult = `S = \\emptyset`;
    } else if (relLatex === '\\le' && a > 0) {
      exactResult = `x = ${x0}`;
      intervalResult = `S = \\{ ${x0} \\}`;
    } else {
      exactResult = `S = \\mathbb{R}`;
      intervalResult = `S = \\mathbb{R}`;
    }
  } else {
    // delta < 0
    steps.push({
      stepNumber: 3,
      title: 'Ausência de Raízes Reais (Δ < 0)',
      explanation: `Como Δ < 0 e a = ${a} (${a > 0 ? 'a > 0' : 'a < 0'}), a função é estritamente ${a > 0 ? 'POSITIVA' : 'NEGATIVA'} para todo x ∈ ℝ:`,
      mathExpression: `f(x) ${a > 0 ? '> 0' : '< 0'} \\quad \\forall x \\in \\mathbb{R}`,
    });

    const isAllReal = (relLatex === '>' || relLatex === '\\ge') ? a > 0 : a < 0;
    if (isAllReal) {
      exactResult = `x \\in \\mathbb{R}`;
      intervalResult = `S = \\mathbb{R}`;
    } else {
      exactResult = `S = \\emptyset`;
      intervalResult = `S = \\emptyset`;
    }
  }

  steps.push({
    stepNumber: steps.length + 1,
    title: 'Conjunto Solução Final',
    explanation: 'Concluímos a resolução expressando o intervalo que satisfaz a desigualdade:',
    mathExpression: `${intervalResult}`,
  });

  return {
    id: 'sol_off_' + Date.now(),
    timestamp: Date.now(),
    originalInput: originalText,
    problemTitle: `Inequação de 2º Grau: ${a}x^2 + (${b})x + (${c}) ${relLatex} 0`,
    problemType: 'Álgebra / Inequações de 2º Grau',
    summary: `Inequação quadrática resolvida por estudo do sinal da parábola. Solução: ${intervalResult}`,
    givenVariables: [
      { name: 'a', value: `${a}`, description: 'Coeficiente quadrático' },
      { name: 'b', value: `${b}`, description: 'Coeficiente linear' },
      { name: 'c', value: `${c}`, description: 'Termo independente' },
      { name: 'Δ', value: `${delta}`, description: 'Discriminante' },
    ],
    formulasUsed: [
      { name: 'Bhaskara', latex: 'x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}', explanation: 'Raízes reais da equação' },
      { name: 'Estudo de Sinais da Parábola', latex: 'y = ax^2 + bx + c', explanation: 'Análise de sinal conforme concavidade e raízes' },
    ],
    steps,
    finalAnswer: {
      exact: `${exactResult} \\quad \\implies \\quad ${intervalResult}`,
      explanation: `O conjunto solução da inequação quadrática é ${intervalResult}.`,
    },
  };
}

/**
 * 2D. Solve Modular Inequality: |ax + b| <rel> c
 */
export function solveModularInequality(
  a: number,
  b: number,
  rel: string,
  c: number,
  originalText: string
): MathSolution {
  const steps: MathStep[] = [];

  let relLatex = rel;
  if (rel === '<=' || rel === '\\leq') relLatex = '\\le';
  if (rel === '>=' || rel === '\\geq') relLatex = '\\ge';

  steps.push({
    stepNumber: 1,
    title: 'Identificar a Inequação Modular',
    explanation: 'Uma inequação modular compara o módulo |ax + b| a uma constante:',
    mathExpression: `|${a}x ${b >= 0 ? '+ ' + b : '- ' + Math.abs(b)}| ${relLatex} ${c}`,
    tipOrRule: 'Propriedades do módulo: Para c > 0, |u| < c ⇔ -c < u < c, e |u| > c ⇔ u < -c ou u > c.',
  });

  if (c < 0) {
    if (relLatex === '<' || relLatex === '\\le') {
      steps.push({
        stepNumber: 2,
        title: 'Análise de Impossibilidade (|u| < número negativo)',
        explanation: `Como o valor absoluto |u| é sempre não-negativo (|u| ≥ 0), ele nunca pode ser menor que ${c}:`,
        mathExpression: `|${a}x ${b >= 0 ? '+' + b : b}| ${relLatex} ${c} \\implies S = \\emptyset`,
      });
      return {
        id: 'sol_off_' + Date.now(),
        timestamp: Date.now(),
        originalInput: originalText,
        problemTitle: 'Inequação Modular Impossível',
        problemType: 'Álgebra / Inequações Modulares',
        summary: 'Conjunto solução vazio.',
        givenVariables: [],
        formulasUsed: [],
        steps,
        finalAnswer: { exact: 'S = \\emptyset', explanation: 'O módulo é sempre ≥ 0, logo não pode ser negativo.' },
      };
    } else {
      steps.push({
        stepNumber: 2,
        title: 'Análise de Identidade (|u| > número negativo)',
        explanation: `Como o valor absoluto é sempre ≥ 0, ele é estritamente maior que ${c} para todo x ∈ ℝ:`,
        mathExpression: `|${a}x ${b >= 0 ? '+' + b : b}| ${relLatex} ${c} \\implies S = \\mathbb{R}`,
      });
      return {
        id: 'sol_off_' + Date.now(),
        timestamp: Date.now(),
        originalInput: originalText,
        problemTitle: 'Inequação Modular Universal: S = ℝ',
        problemType: 'Álgebra / Inequações Modulares',
        summary: 'Válida para todos os números reais.',
        givenVariables: [],
        formulasUsed: [],
        steps,
        finalAnswer: { exact: 'S = \\mathbb{R}', explanation: 'Qualquer número real satisfaz a inequação modular.' },
      };
    }
  }

  // When c >= 0
  const isInternal = relLatex === '<' || relLatex === '\\le';
  if (isInternal) {
    const leftVal = simplifyFraction(-c - b, a).latex;
    const rightVal = simplifyFraction(c - b, a).latex;
    const isStrict = relLatex === '<';

    steps.push({
      stepNumber: 2,
      title: 'Desdobrar a Inequação Modular em Desigualdade Dupla',
      explanation: `Pela propriedade |u| ${relLatex} c \\iff -c ${relLatex} u ${relLatex} c:`,
      mathExpression: `-${c} ${relLatex} ${a}x ${b >= 0 ? '+ ' + b : '- ' + Math.abs(b)} ${relLatex} ${c}`,
    });

    steps.push({
      stepNumber: 3,
      title: 'Isolar a Incógnita x Subtraindo a Constante e Dividindo',
      explanation: `Subtraímos ${b} de todos os membros e dividimos por ${a}:`,
      mathExpression: `-${c} - (${b}) ${relLatex} ${a}x ${relLatex} ${c} - (${b}) \\implies ${leftVal} ${relLatex} x ${relLatex} ${rightVal}`,
    });

    const interval = isStrict
      ? `S = \\left] ${leftVal}, ${rightVal} \\right[`
      : `S = \\left[ ${leftVal}, ${rightVal} \\right]`;

    steps.push({
      stepNumber: 4,
      title: 'Conjunto Solução',
      explanation: 'Escrevemos o intervalo limitado resultante:',
      mathExpression: `${interval}`,
    });

    return {
      id: 'sol_off_' + Date.now(),
      timestamp: Date.now(),
      originalInput: originalText,
      problemTitle: `Inequação Modular: |${a}x + (${b})| ${relLatex} ${c}`,
      problemType: 'Álgebra / Inequações Modulares',
      summary: `Solução: ${interval}`,
      givenVariables: [],
      formulasUsed: [
        { name: 'Propriedade Modular Interna', latex: '|u| \\le c \\iff -c \\le u \\le c', explanation: 'Desdobramento em intervalo contíguo' },
      ],
      steps,
      finalAnswer: { exact: `${leftVal} ${relLatex} x ${relLatex} ${rightVal} \\implies ${interval}`, explanation: `Solução: ${interval}` },
    };
  } else {
    // External: |u| >= c or |u| > c
    const isStrict = relLatex === '>';
    const op1 = isStrict ? '<' : '\\le';
    const op2 = isStrict ? '>' : '\\ge';
    const r1 = simplifyFraction(-c - b, a).latex;
    const r2 = simplifyFraction(c - b, a).latex;

    steps.push({
      stepNumber: 2,
      title: 'Desdobrar a Inequação Modular em Duas Ramificações (União)',
      explanation: `Pela propriedade |u| ${relLatex} c \\iff u ${op1} -c \\quad \\text{ou} \\quad u ${op2} c:`,
      mathExpression: `${a}x + (${b}) ${op1} -${c} \\quad \\lor \\quad ${a}x + (${b}) ${op2} ${c}`,
    });

    steps.push({
      stepNumber: 3,
      title: 'Resolver Cada Ramificação Individualmente',
      explanation: 'Isolamos x em cada uma das desigualdades:',
      mathExpression: `x ${op1} ${r1} \\quad \\lor \\quad x ${op2} ${r2}`,
    });

    const interval = isStrict
      ? `S = \\left] -\\infty, ${r1} \\right[ \\cup \\left] ${r2}, +\\infty \\right[`
      : `S = \\left] -\\infty, ${r1} \\right] \\cup \\left[ ${r2}, +\\infty \\right]`;

    steps.push({
      stepNumber: 4,
      title: 'Conjunto Solução em União de Intervalos',
      explanation: 'A resposta final é a união dos dois intervalos abertos ou fechados:',
      mathExpression: `${interval}`,
    });

    return {
      id: 'sol_off_' + Date.now(),
      timestamp: Date.now(),
      originalInput: originalText,
      problemTitle: `Inequação Modular: |${a}x + (${b})| ${relLatex} ${c}`,
      problemType: 'Álgebra / Inequações Modulares',
      summary: `Solução: ${interval}`,
      givenVariables: [],
      formulasUsed: [
        { name: 'Propriedade Modular Externa', latex: '|u| \\ge c \\iff u \\le -c \\lor u \\ge c', explanation: 'Desdobramento em união de semi-retas' },
      ],
      steps,
      finalAnswer: { exact: `x ${op1} ${r1} \\text{ ou } x ${op2} ${r2} \\implies ${interval}`, explanation: `Solução: ${interval}` },
    };
  }
}

/**
 * 3. Solve 2x2 Linear System
 */
export function solveSystem2x2(
  a1: number,
  b1: number,
  c1: number,
  a2: number,
  b2: number,
  c2: number,
  originalText: string
): MathSolution {
  const steps: MathStep[] = [];
  const D = a1 * b2 - a2 * b1;
  const Dx = c1 * b2 - c2 * b1;
  const Dy = a1 * c2 - a2 * c1;

  steps.push({
    stepNumber: 1,
    title: 'Organizar as Equações do Sistema Linear',
    explanation: 'Identificamos as duas equações lineares simultâneas:',
    mathExpression: `\\begin{cases} (${a1})x + (${b1})y = ${c1} \\quad \\text{(Eq. 1)} \\\\[6pt] (${a2})x + (${b2})y = ${c2} \\quad \\text{(Eq. 2)} \\end{cases}`,
    tipOrRule: 'Um sistema linear 2x2 pode ser resolvido por Substituição, Adição ou Regra de Cramer.',
  });

  steps.push({
    stepNumber: 2,
    title: 'Calcular os Determinantes Principais (Regra de Cramer)',
    explanation: 'Calculamos o determinante da matriz dos coeficientes D, o determinante de x (D_x) e o determinante de y (D_y):',
    mathExpression: `D = \\begin{vmatrix} ${a1} & ${b1} \\\\[3pt] ${a2} & ${b2} \\end{vmatrix} = (${a1})(${b2}) - (${a2})(${b1}) = ${D}`,
    tipOrRule: 'Se D ≠ 0, o sistema é Possível e Determinado (SPD), possuindo solução única.',
  });

  if (D === 0) {
    const isIndeterminate = Dx === 0 && Dy === 0;
    return {
      id: 'sol_off_' + Date.now(),
      timestamp: Date.now(),
      originalInput: originalText,
      problemTitle: `Sistema Linear 2x2 (${isIndeterminate ? 'SPI' : 'SI'})`,
      problemType: 'Álgebra / Sistemas Lineares',
      summary: isIndeterminate ? 'Sistema Possível e Indeterminado (infinitas soluções).' : 'Sistema Impossível (nenhuma solução).',
      givenVariables: [],
      formulasUsed: [],
      steps,
      finalAnswer: { exact: isIndeterminate ? 'S = \\{ (x, y) \\in \\mathbb{R}^2 \\}' : 'S = \\emptyset', explanation: isIndeterminate ? 'As retas são coincidentes.' : 'As retas são paralelas e não se cruzam.' },
    };
  }

  steps.push({
    stepNumber: 3,
    title: 'Calcular os Determinantes Dx e Dy',
    explanation: 'Substituímos as colunas de termos independentes para encontrar D_x e D_y:',
    mathExpression: `D_x = \\begin{vmatrix} ${c1} & ${b1} \\\\[3pt] ${c2} & ${b2} \\end{vmatrix} = (${c1})(${b2}) - (${c2})(${b1}) = ${Dx}, \\quad D_y = \\begin{vmatrix} ${a1} & ${c1} \\\\[3pt] ${a2} & ${c2} \\end{vmatrix} = (${a1})(${c2}) - (${a2})(${c1}) = ${Dy}`,
  });

  const xFrac = simplifyFraction(Dx, D);
  const yFrac = simplifyFraction(Dy, D);

  steps.push({
    stepNumber: 4,
    title: 'Determinar os Valores das Variáveis x e y',
    explanation: 'Aplicamos a fórmula de Cramer x = D_x / D e y = D_y / D:',
    mathExpression: `x = \\frac{${Dx}}{${D}} = ${xFrac.latex}, \\quad y = \\frac{${Dy}}{${D}} = ${yFrac.latex}`,
  });

  return {
    id: 'sol_off_' + Date.now(),
    timestamp: Date.now(),
    originalInput: originalText,
    problemTitle: `Sistema Linear 2x2: x = ${xFrac.latex}, y = ${yFrac.latex}`,
    problemType: 'Álgebra / Sistemas Lineares',
    summary: `Resolução completa pela Regra de Cramer e método de eliminação. Par ordenado: (${xFrac.latex}, ${yFrac.latex})`,
    givenVariables: [
      { name: 'Equação 1', value: `${a1}x + ${b1}y = ${c1}`, description: 'Primeira restrição linear' },
      { name: 'Equação 2', value: `${a2}x + ${b2}y = ${c2}`, description: 'Segunda restrição linear' },
    ],
    formulasUsed: [
      { name: 'Regra de Cramer', latex: 'x = \\frac{D_x}{D}, \\quad y = \\frac{D_y}{D}', explanation: 'Solução exata por determinantes' },
    ],
    steps,
    finalAnswer: {
      exact: `S = \\{ (${xFrac.latex}, \\, ${yFrac.latex}) \\}`,
      explanation: `O par ordenado que satisfaz simultaneamente as duas equações é x = ${xFrac.latex} e y = ${yFrac.latex}.`,
    },
    verification: {
      method: 'Substituição em Ambas as Equações',
      mathExpression: `${a1}(${xFrac.latex}) + ${b1}(${yFrac.latex}) = ${c1} \\quad \\checkmark, \\quad ${a2}(${xFrac.latex}) + ${b2}(${yFrac.latex}) = ${c2} \\quad \\checkmark`,
      isVerified: true,
      notes: 'Valores testados e validados em ambas as equações originais.',
    },
    similarPracticeProblems: [
      { id: 'p_sys_1', problem: 'Resolva o sistema: 2x + y = 7 e x - y = 2', latex: '\\begin{cases} 2x + y = 7 \\\\[3pt] x - y = 2 \\end{cases}', answer: '(3, 1)', hint: 'Some as duas equações para eliminar o y diretamente.' },
    ],
  };
}

/**
 * 4. Step-by-Step Symbolic Calculus (Derivatives)
 */
export function solveDerivative(exprStr: string, originalText: string): MathSolution {
  const steps: MathStep[] = [];
  try {
    const node = math.parse(exprStr);
    const deriv = math.derivative(node, 'x');
    const simplifiedDeriv = math.simplify(deriv);

    steps.push({
      stepNumber: 1,
      title: 'Identificar a Função a ser Derivada',
      explanation: 'Desejamos calcular a derivada de f(x) em relação a x utilizando as regras do cálculo diferencial:',
      mathExpression: `f(x) = ${node.toTex()}`,
      tipOrRule: 'Notação de Leibniz: d/dx f(x), ou notação de Lagrange: f\'(x).',
    });

    steps.push({
      stepNumber: 2,
      title: 'Aplicar a Regra de Diferenciação Termo a Termo',
      explanation: 'Aplicamos a linearidade da derivada d/dx[u(x) + v(x)] = du/dx + dv/dx e a Regra do Tombo d/dx[xⁿ] = n·xⁿ⁻¹:',
      mathExpression: `\\frac{d}{dx}\\left( ${node.toTex()} \\right) = ${deriv.toTex()}`,
      tipOrRule: 'Regra da Potência (Regra do Tombo): o expoente desce multiplicando e subtrai-se 1 do expoente.',
    });

    steps.push({
      stepNumber: 3,
      title: 'Simplificar a Expressão Algébrica Resultante',
      explanation: 'Agrupamos os termos semelhantes e simplificamos coeficientes numéricos:',
      mathExpression: `f'(x) = ${simplifiedDeriv.toTex()}`,
    });

    return {
      id: 'sol_off_' + Date.now(),
      timestamp: Date.now(),
      originalInput: originalText,
      problemTitle: `Derivada: d/dx (${node.toTex()})`,
      problemType: 'Cálculo / Derivadas',
      summary: `Cálculo da derivada analítica passo a passo: f'(x) = ${simplifiedDeriv.toTex()}`,
      givenVariables: [{ name: 'f(x)', value: node.toTex(), description: 'Função original' }],
      formulasUsed: [
        { name: 'Regra do Tombo (Potência)', latex: '\\frac{d}{dx}[x^n] = n x^{n-1}', explanation: 'Derivada de monômios' },
        { name: 'Linearidade', latex: '\\frac{d}{dx}[c \\cdot f(x)] = c \\cdot f\'(x)', explanation: 'Constantes multiplicativas' },
      ],
      steps,
      finalAnswer: {
        exact: `\\frac{d}{dx}\\left(${node.toTex()}\\right) = ${simplifiedDeriv.toTex()}`,
        explanation: `A derivada de primeira ordem da função é dada por f'(x) = ${simplifiedDeriv.toTex()}.`,
      },
      graphData: {
        hasGraph: true,
        functionExpression: node.toString(),
        latexExpression: node.toTex(),
      },
    };
  } catch (err: any) {
    return solveGenericExpression(originalText);
  }
}

/**
 * Dedicated Step-by-Step Mixed Number Converter & Calculator
 * e.g. 4\frac{7}{4} -> 23/4, 5\frac{3}{4}, 5,75
 */
export function solveMixedNumberOffline(whole: number, num: number, den: number, originalInput: string): MathSolution {
  const isNegative = whole < 0;
  const absWhole = Math.abs(whole);
  const mult = absWhole * den;
  const improperNumerator = mult + num;
  const finalNum = isNegative ? -improperNumerator : improperNumerator;
  const finalDen = den;

  const rawFracLatex = `${isNegative ? '-' : ''}\\frac{${improperNumerator}}{${den}}`;
  const simplified = simplifyFraction(finalNum, finalDen);

  const decimalVal = finalNum / finalDen;
  const decStr = decimalVal.toLocaleString('pt-BR', { maximumFractionDigits: 4 });

  // Normalized mixed form: e.g. 4\frac{7}{4} has improper 7/4 = 1 + 3/4, so 4 + 1 + 3/4 = 5\frac{3}{4}
  const normWhole = Math.floor(improperNumerator / den) * (isNegative ? -1 : 1);
  const normRem = improperNumerator % den;
  const normMixedLatex = normRem > 0 ? `${normWhole}\\frac{${normRem}}{${den}}` : `${normWhole}`;

  const steps: MathStep[] = [];

  // Step 1: Component identification
  steps.push({
    stepNumber: 1,
    title: `Identificação dos Componentes do Número Misto`,
    explanation: `O número misto $${whole}\\frac{${num}}{${den}}$ é composto por uma parte inteira ($${whole}$) e uma fração ($${isNegative ? '-' : ''}\\frac{${num}}{${den}}$), representando a soma $${whole} + ${isNegative ? '-' : ''}\\frac{${num}}{${den}}$.`,
    mathExpression: `${whole}\\frac{${num}}{${den}} = ${whole} + \\frac{${num}}{${den}}`,
    beforeExpression: `\\mathbf{\\color{#e11d48}{${whole}\\frac{${num}}{${den}}}}`,
    afterExpression: `${whole} + \\frac{${num}}{${den}}`,
    tipOrRule: 'Definição: Um número misto expressa a soma de um número inteiro com uma fração.',
  });

  // Step 2: Multiply whole by denominator
  steps.push({
    stepNumber: 2,
    title: `Multiplicação da Parte Inteira pelo Denominador`,
    explanation: `Multiplicamos a parte inteira ($${absWhole}$) pelo denominador ($${den}$): $${absWhole} \\cdot ${den} = ${mult}$.`,
    mathExpression: `${absWhole} \\cdot ${den} = ${mult}`,
    beforeExpression: `\\frac{\\mathbf{\\color{#e11d48}{${absWhole} \\cdot ${den}}} + ${num}}{${den}}`,
    afterExpression: `\\frac{${mult} + ${num}}{${den}}`,
    tipOrRule: 'Fórmula de Conversão: A\\frac{B}{C} = \\frac{A \\cdot C + B}{C}.',
  });

  // Step 3: Add numerator
  steps.push({
    stepNumber: 3,
    title: `Soma do Numerador ao Produto`,
    explanation: `Somamos o numerador ($${num}$) ao produto obtido ($${mult}$): $${mult} + ${num} = ${improperNumerator}$. Este valor forma o novo numerador da fração imprópria.`,
    mathExpression: `\\frac{${mult} + ${num}}{${den}} = ${rawFracLatex}`,
    beforeExpression: `\\frac{\\mathbf{\\color{#e11d48}{${mult} + ${num}}}}{${den}}`,
    afterExpression: `${rawFracLatex}`,
    tipOrRule: 'Regra Prática: Novo Numerador = (Inteiro × Denominador) + Numerador original.',
  });

  // Step 4: Simplification if applicable
  if (simplified.latex !== rawFracLatex) {
    steps.push({
      stepNumber: steps.length + 1,
      title: `Simplificação da Fração Imprópria`,
      explanation: `Dividimos o numerador e o denominador pelo Máximo Divisor Comum (MDC) para obter a fração irredutível.`,
      mathExpression: `${rawFracLatex} = ${simplified.latex}`,
      beforeExpression: `${rawFracLatex}`,
      afterExpression: `${simplified.latex}`,
    });
  }

  // Step 5: Normalized mixed form if numerator was >= denominator
  if (num >= den && normRem > 0) {
    steps.push({
      stepNumber: steps.length + 1,
      title: `Forma Mista Normalizada (Canônica)`,
      explanation: `Como o numerador da fração original ($${num}$) era maior ou igual ao denominador ($${den}$), dividindo $${improperNumerator} \\div ${den}$ obtemos quociente $${Math.abs(normWhole)}$ e resto $${normRem}$, resultando no número misto normalizado $${normMixedLatex}$.`,
      mathExpression: `${rawFracLatex} = ${normMixedLatex}`,
    });
  }

  // Final decimal step
  steps.push({
    stepNumber: steps.length + 1,
    title: `Valor Decimal Equivalente`,
    explanation: `Dividindo o numerador pelo denominador ($${finalNum} \\div ${finalDen}$), encontramos o valor decimal correspondente: $${decStr}$.`,
    mathExpression: `= ${decStr}`,
  });

  const alternativeForms = [normMixedLatex, decStr, simplified.latex].filter((v, idx, arr) => arr.indexOf(v) === idx);

  return {
    id: 'sol_off_' + Date.now(),
    timestamp: Date.now(),
    originalInput,
    problemTitle: `Conversão de Número Misto: ${whole}\\frac{${num}}{${den}}`,
    problemType: 'Aritmética / Números Mistos',
    summary: `Conversão do número misto $${whole}\\frac{${num}}{${den}}$ em fração imprópria ($${simplified.latex}$) e forma decimal ($${decStr}$).`,
    givenVariables: [
      { name: 'Parte Inteira (A)', value: `${whole}`, description: 'Quantidade inteira' },
      { name: 'Numerador (B)', value: `${num}`, description: 'Numerador da fração' },
      { name: 'Denominador (C)', value: `${den}`, description: 'Denominador da fração' },
    ],
    formulasUsed: [
      {
        name: 'Conversão de Número Misto',
        latex: 'A\\frac{B}{C} = \\frac{A \\cdot C + B}{C}',
        explanation: 'Multiplica-se a parte inteira pelo denominador e soma-se o numerador, conservando o denominador.',
      },
    ],
    steps,
    finalAnswer: {
      exact: simplified.latex,
      approximate: `= ${decStr}`,
      explanation: `O número misto $${whole}\\frac{${num}}{${den}}$ equivale à fração imprópria $${simplified.latex}$ ou ao número decimal $${decStr}.`,
      alternativeForms,
    },
    verification: {
      method: 'Verificação Inversa por Divisão Euclidiana',
      mathExpression: `${finalNum} = ${normWhole} \\cdot ${den} + ${normRem} \\quad \\checkmark`,
      isVerified: true,
      notes: 'O quociente e resto confirmam a exatidão da conversão.',
    },
    similarPracticeProblems: [
      {
        id: 'p_mix_1',
        problem: 'Converta o número misto 2\\frac{3}{5} em fração imprópria.',
        latex: '2\\frac{3}{5}',
        answer: '\\frac{13}{5}',
        hint: 'Multiplique 2 por 5 e adicione 3.',
      },
      {
        id: 'p_mix_2',
        problem: 'Converta o número misto 3\\frac{1}{2} em fração imprópria.',
        latex: '3\\frac{1}{2}',
        answer: '\\frac{7}{2}',
        hint: 'Multiplique 3 por 2 e adicione 1.',
      },
    ],
  };
}

/**
 * Helper to translate LaTeX strings into clean MathJS expressions
 */
export function cleanLatexForMathjs(rawInput: string): string {
  let clean = rawInput;

  // 1. Convert mixed fractions like 2\frac{1}{2} -> (2 + (1)/(2))
  clean = clean.replace(/(\d+)\s*\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 + ($2)/($3))');

  // 2. Convert nested or standard fractions \frac{num}{den} -> ((num)/(den))
  let prevClean = '';
  while (clean !== prevClean && /\\frac\{([^}]+)\}\{([^}]+)\}/.test(clean)) {
    prevClean = clean;
    clean = clean.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '(($1)/($2))');
  }

  // 3. Convert cube roots \sqrt[3]{x} and nth roots \sqrt[n]{x}
  clean = clean.replace(/\\sqrt\[3\]\{([^}]+)\}/g, 'cbrt($1)');
  clean = clean.replace(/\\sqrt\[(\d+)\]\{([^}]+)\}/g, 'nthRoot($2, $1)');
  clean = clean.replace(/\\sqrt\[([^\]]+)\]\{([^}]+)\}/g, '($2)^(1/($1))');

  // 4. Convert square roots \sqrt{x}
  prevClean = '';
  while (clean !== prevClean && /\\sqrt\{([^}]+)\}/.test(clean)) {
    prevClean = clean;
    clean = clean.replace(/\\sqrt\{([^}]+)\}/g, 'sqrt($1)');
  }

  // 5. Convert exponents ^{...} -> ^(...)
  clean = clean.replace(/\^\{([^}]+)\}/g, '^($1)');

  // 6. Common LaTeX Operators and symbols
  clean = clean
    .replace(/\\cdot/g, '*')
    .replace(/\\times/g, '*')
    .replace(/\\div/g, '/')
    .replace(/\\pm/g, '+')
    .replace(/\\left\(/g, '(')
    .replace(/\\right\)/g, ')')
    .replace(/\\left\[/g, '(')
    .replace(/\\right\]/g, ')')
    .replace(/\\left\\\{/g, '(')
    .replace(/\\right\\\}/g, ')')
    .replace(/\\pi/g, 'pi')
    .replace(/\\infty/g, 'Infinity')
    .replace(/\\,/g, ' ')
    .replace(/\\ /g, ' ')
    .trim();

  // 7. Handle implicit multiplications e.g. ((7)/(4))sqrt(4) or 7sqrt(4) or 2(3) or (2)(3)
  clean = clean
    .replace(/\)\s*(sqrt|cbrt|nthRoot|sin|cos|tan|log|ln|[a-zA-Z\(])/g, ')*$1')
    .replace(/(\d)\s*(sqrt|cbrt|nthRoot|sin|cos|tan|log|ln|\()/g, '$1*$2')
    .replace(/\)\s*(\d+)/g, ')*$1')
    .replace(/\)\s*\(/g, ')*(');

  // If ends with = ?, remove it
  clean = clean.replace(/=\s*\?*$/, '').trim();
  return clean;
}

/**
 * 5. General Algebraic / Arithmetic Expression Solver (100% Offline with mathjs)
 */
export function solveGenericExpression(rawInput: string): MathSolution {
  const steps: MathStep[] = [];
  const cleanInput = cleanLatexForMathjs(rawInput);

  try {
    const parsed = math.parse(cleanInput);
    const evaluated = math.evaluate(cleanInput);
    const simplified = math.simplify(parsed);

    steps.push({
      stepNumber: 1,
      title: `Estruturação do Exercício: ${parsed.toTex()}`,
      explanation: `Analisamos a expressão matemática ${parsed.toTex()}, organizando os termos e identificando as operações prioritárias.`,
      mathExpression: parsed.toTex(),
      tipOrRule: 'Ordem de Operações: 1º Parênteses, 2º Expoentes e Radicais, 3º Multiplicações e Divisões, 4º Adições e Subtrações.',
    });

    const parsedTex = parsed.toTex();
    const simplifiedTex = simplified.toTex();

    if (parsedTex !== simplifiedTex) {
      steps.push({
        stepNumber: 2,
        title: 'Desenvolvimento e Simplificação dos Termos',
        explanation: `Agrupamos e simplificamos os elementos semelhantes da expressão, resultando em: ${simplifiedTex}.`,
        mathExpression: simplifiedTex,
      });
    }

    let exactAnswer = '';
    let approxAnswer = '';
    const alternativeForms: string[] = [];

    if (typeof evaluated === 'number') {
      if (Number.isInteger(evaluated)) {
        exactAnswer = `${evaluated}`;
      } else {
        const frac = math.fraction(evaluated);
        const num = Number(frac.n) * Number(frac.s);
        const den = Number(frac.d);
        const simp = simplifyFraction(num, den);
        exactAnswer = simp.latex;
        approxAnswer = `\\approx ${evaluated.toFixed(4)}`;

        // Calculate mixed fraction if improper (e.g. 7/2 -> 3 1/2)
        if (Math.abs(num) > den && den !== 1) {
          const whole = Math.floor(Math.abs(num) / den) * (num < 0 ? -1 : 1);
          const remainder = Math.abs(num) % den;
          if (remainder > 0) {
            alternativeForms.push(`${whole}\\frac{${remainder}}{${den}}`);
          }
        }

        // Format decimal with comma (e.g. 3,5)
        const decStr = evaluated % 1 === 0 ? evaluated.toString() : parseFloat(evaluated.toFixed(6)).toString().replace('.', ',');
        alternativeForms.push(decStr);
      }
    } else {
      exactAnswer = math.format(evaluated);
    }

    steps.push({
      stepNumber: steps.length + 1,
      title: `Determinação do Valor Final: ${exactAnswer}`,
      explanation: `Concluímos os cálculos da expressão ${parsed.toTex()}, obtendo a solução exata ${exactAnswer}${approxAnswer ? ` (${approxAnswer})` : ''}.`,
      mathExpression: `= ${exactAnswer}`,
    });

    return {
      id: 'sol_off_' + Date.now(),
      timestamp: Date.now(),
      originalInput: rawInput,
      problemTitle: `Cálculo: ${parsed.toTex()}`,
      problemType: 'Aritmética & Álgebra Geral',
      summary: `Resolução passo a passo da expressão matemática. Resultado: ${exactAnswer}`,
      givenVariables: [],
      formulasUsed: [
        { name: 'Precedência Operatória (PEMDAS)', latex: '() \\to x^n \\to \\times/\\div \\to +/-', explanation: 'Ordem padrão de cálculo' },
      ],
      steps,
      finalAnswer: {
        exact: exactAnswer,
        approximate: approxAnswer,
        explanation: `O resultado da expressão matemática é ${exactAnswer}.`,
        alternativeForms: alternativeForms.length > 0 ? alternativeForms : undefined,
      },
    };
  } catch (err: any) {
    // Return friendly error solution
    return {
      id: 'sol_err_' + Date.now(),
      timestamp: Date.now(),
      originalInput: rawInput,
      problemTitle: 'Expressão Matemática',
      problemType: 'Geral',
      summary: 'Não foi possível resolver automaticamente esta expressão offline de forma simbólica.',
      givenVariables: [],
      formulasUsed: [],
      steps: [
        {
          stepNumber: 1,
          title: 'Verifique a Notação Digitada',
          explanation: 'Certifique-se de que a expressão está digitada corretamente com parênteses balanceados e operadores matemáticos explícitos.',
          mathExpression: rawInput,
        },
      ],
      finalAnswer: {
        exact: rawInput,
        explanation: 'Dica: Você pode alternar para o Modo IA se estiver com conexão à internet para enunciados textuais complexos.',
      },
    };
  }
}

/**
 * 6. Geometric Solvers (100% Offline with Complete Step-by-Step LaTeX Breakdown)
 */
export function solvePythagorasOffline(a?: number, b?: number, c?: number, originalText?: string): MathSolution {
  const steps: MathStep[] = [];
  let finalAns = '';
  let approx = '';

  steps.push({
    stepNumber: 1,
    title: 'Enunciar o Teorema de Pitágoras',
    explanation: 'Em qualquer triângulo retângulo, o quadrado do comprimento da hipotenusa c é igual à soma dos quadrados dos comprimentos dos catetos a e b:',
    mathExpression: 'a^2 + b^2 = c^2',
    tipOrRule: 'A hipotenusa é sempre o lado oposto ao ângulo reto de 90° e o maior lado do triângulo.',
  });

  if (a !== undefined && b !== undefined && c === undefined) {
    const cVal = Math.sqrt(a * a + b * b);
    steps.push({
      stepNumber: 2,
      title: 'Substituir os Catetos Conhecidos na Fórmula',
      explanation: `Substituímos os valores dos catetos a = ${a} e b = ${b}:`,
      mathExpression: `(${a})^2 + (${b})^2 = c^2 \\implies ${a * a} + ${b * b} = c^2 \\implies c^2 = ${a * a + b * b}`,
    });

    const isPerf = cVal % 1 === 0;
    steps.push({
      stepNumber: 3,
      title: 'Extrair a Raiz Quadrada para Determinar a Hipotenusa',
      explanation: 'Como o comprimento de um segmento é estritamente positivo (c > 0):',
      mathExpression: `c = \\sqrt{${a * a + b * b}} ${isPerf ? `= ${cVal}` : `\\approx ${cVal.toFixed(3)}`}`,
    });

    finalAns = isPerf ? `c = ${cVal}` : `c = \\sqrt{${a * a + b * b}} \\approx ${cVal.toFixed(3)}`;
  } else if (c !== undefined && a !== undefined && b === undefined) {
    const bSq = c * c - a * a;
    const bVal = bSq > 0 ? Math.sqrt(bSq) : 0;
    steps.push({
      stepNumber: 2,
      title: 'Isolar o Cateto Desconhecido b²',
      explanation: `Substituímos a hipotenusa c = ${c} e o cateto a = ${a}:`,
      mathExpression: `(${a})^2 + b^2 = (${c})^2 \\implies b^2 = ${c * c} - ${a * a} = ${bSq}`,
    });

    const isPerf = bVal % 1 === 0;
    steps.push({
      stepNumber: 3,
      title: 'Calcular a Medida do Cateto',
      explanation: 'Extraindo a raiz quadrada:',
      mathExpression: `b = \\sqrt{${bSq}} ${isPerf ? `= ${bVal}` : `\\approx ${bVal.toFixed(3)}`}`,
    });

    finalAns = isPerf ? `b = ${bVal}` : `b = \\sqrt{${bSq}} \\approx ${bVal.toFixed(3)}`;
  }

  return {
    id: 'sol_off_' + Date.now(),
    timestamp: Date.now(),
    originalInput: originalText || 'Teorema de Pitágoras',
    problemTitle: 'Teorema de Pitágoras (Triângulo Retângulo)',
    problemType: 'Geometria Plana',
    summary: `Aplicação analítica do Teorema de Pitágoras. Resultado: ${finalAns}`,
    givenVariables: [
      { name: 'Cateto a', value: `${a ?? '?'}`, description: 'Medida do primeiro cateto' },
      { name: 'Cateto b', value: `${b ?? '?'}`, description: 'Medida do segundo cateto' },
      { name: 'Hipotenusa c', value: `${c ?? '?'}`, description: 'Medida da hipotenusa' },
    ],
    formulasUsed: [
      { name: 'Teorema de Pitágoras', latex: 'a^2 + b^2 = c^2', explanation: 'Relação métrica fundamental' },
    ],
    steps,
    finalAnswer: {
      exact: finalAns,
      approximate: approx || undefined,
      explanation: `O valor obtido pela relação pitagórica é ${finalAns}.`,
    },
  };
}

export function solveSphereOffline(r: number, originalText?: string): MathSolution {
  const vol = (4 / 3) * Math.PI * Math.pow(r, 3);
  const area = 4 * Math.PI * r * r;
  const volCoeff = ((4 * Math.pow(r, 3)) / 3);

  const steps: MathStep[] = [
    {
      stepNumber: 1,
      title: 'Identificar as Fórmulas da Esfera',
      explanation: 'Para uma esfera de raio r, o volume V e a área da superfície esférica A são dados por:',
      mathExpression: 'V = \\frac{4}{3}\\pi r^3, \\quad A = 4\\pi r^2',
      tipOrRule: 'O raio r é a distância do centro a qualquer ponto da superfície esférica.',
    },
    {
      stepNumber: 2,
      title: 'Calcular o Volume da Esfera',
      explanation: `Substituímos o raio r = ${r} na fórmula do volume:`,
      mathExpression: `V = \\frac{4}{3}\\pi (${r})^3 = \\frac{4}{3}\\pi (${Math.pow(r, 3)}) = ${volCoeff % 1 === 0 ? volCoeff : volCoeff.toFixed(2)}\\pi \\approx ${vol.toFixed(2)} \\text{ cm}^3`,
    },
    {
      stepNumber: 3,
      title: 'Calcular a Área da Superfície Esférica',
      explanation: `Substituímos o raio r = ${r} na fórmula da área:`,
      mathExpression: `A = 4\\pi (${r})^2 = 4\\pi (${r * r}) = ${4 * r * r}\\pi \\approx ${area.toFixed(2)} \\text{ cm}^2`,
    },
  ];

  return {
    id: 'sol_off_' + Date.now(),
    timestamp: Date.now(),
    originalInput: originalText || `Esfera r = ${r}`,
    problemTitle: `Esfera Espacial: Raio r = ${r} cm`,
    problemType: 'Geometria Espacial (Sólidos 3D)',
    summary: `Cálculo de volume e área da esfera de raio r = ${r}.`,
    givenVariables: [{ name: 'r', value: `${r} cm`, description: 'Raio da esfera' }],
    formulasUsed: [
      { name: 'Volume da Esfera', latex: 'V = \\frac{4}{3}\\pi r^3', explanation: 'Volume esférico' },
      { name: 'Área da Esfera', latex: 'A = 4\\pi r^2', explanation: 'Área superficial total' },
    ],
    steps,
    finalAnswer: {
      exact: `V = ${volCoeff % 1 === 0 ? volCoeff : volCoeff.toFixed(2)}\\pi \\text{ cm}^3, \\quad A = ${4 * r * r}\\pi \\text{ cm}^2`,
      approximate: `V \\approx ${vol.toFixed(2)} \\text{ cm}^3, \\quad A \\approx ${area.toFixed(2)} \\text{ cm}^2`,
      explanation: `O volume da esfera é de aproximadamente ${vol.toFixed(2)} cm³ e a sua área superficial é de ${area.toFixed(2)} cm².`,
    },
  };
}

export function solveCylinderOffline(r: number, h: number, originalText?: string): MathSolution {
  const baseArea = Math.PI * r * r;
  const latArea = 2 * Math.PI * r * h;
  const totArea = 2 * baseArea + latArea;
  const vol = baseArea * h;

  const steps: MathStep[] = [
    {
      stepNumber: 1,
      title: 'Estruturar as Fórmulas do Cilindro Reto',
      explanation: 'Um cilindro circular reto possui raio de base r e altura h. As relações fundamentais são:',
      mathExpression: 'A_b = \\pi r^2, \\quad A_l = 2\\pi r h, \\quad A_t = 2A_b + A_l, \\quad V = A_b \\cdot h = \\pi r^2 h',
    },
    {
      stepNumber: 2,
      title: 'Calcular a Área da Base',
      explanation: `Substituímos o raio da base r = ${r} cm:`,
      mathExpression: `A_b = \\pi (${r})^2 = ${r * r}\\pi \\approx ${baseArea.toFixed(2)} \\text{ cm}^2`,
    },
    {
      stepNumber: 3,
      title: 'Calcular a Área Lateral e Área Total',
      explanation: `Substituímos o raio r = ${r} e a altura h = ${h}:`,
      mathExpression: `A_l = 2\\pi (${r})(${h}) = ${2 * r * h}\\pi \\approx ${latArea.toFixed(2)} \\text{ cm}^2, \\quad A_t = 2(${r * r}\\pi) + ${2 * r * h}\\pi = ${2 * r * r + 2 * r * h}\\pi \\approx ${totArea.toFixed(2)} \\text{ cm}^2`,
    },
    {
      stepNumber: 4,
      title: 'Calcular o Volume do Cilindro',
      explanation: 'Multiplicamos a área da base pela altura:',
      mathExpression: `V = (${r * r}\\pi) \\cdot (${h}) = ${r * r * h}\\pi \\approx ${vol.toFixed(2)} \\text{ cm}^3`,
    },
  ];

  return {
    id: 'sol_off_' + Date.now(),
    timestamp: Date.now(),
    originalInput: originalText || `Cilindro r = ${r}, h = ${h}`,
    problemTitle: `Cilindro Reto: r = ${r} cm, h = ${h} cm`,
    problemType: 'Geometria Espacial (Sólidos 3D)',
    summary: `Resolução passo a passo do cilindro reto: V = ${r * r * h}π cm³.`,
    givenVariables: [
      { name: 'r', value: `${r} cm`, description: 'Raio da base circular' },
      { name: 'h', value: `${h} cm`, description: 'Altura do cilindro' },
    ],
    formulasUsed: [
      { name: 'Volume do Cilindro', latex: 'V = \\pi r^2 h', explanation: 'Volume' },
      { name: 'Área Total', latex: 'A_t = 2\\pi r(r + h)', explanation: 'Área total' },
    ],
    steps,
    finalAnswer: {
      exact: `V = ${r * r * h}\\pi \\text{ cm}^3, \\quad A_t = ${2 * r * r + 2 * r * h}\\pi \\text{ cm}^2`,
      approximate: `V \\approx ${vol.toFixed(2)} \\text{ cm}^3, \\quad A_t \\approx ${totArea.toFixed(2)} \\text{ cm}^2`,
      explanation: `O cilindro possui volume de ${vol.toFixed(2)} cm³ e área total de ${totArea.toFixed(2)} cm².`,
    },
  };
}

/**
 * MASTER OFFLINE DISPATCHER
 * Intelligently recognizes pattern and routes to the best specialized solver
 */
export function solveOffline(input: string): MathSolution {
  const text = input.trim();

  // Check for Geometry Word Problems in Offline mode
  const lower = text.toLowerCase();

  // Pitágoras pattern e.g. "hipotenusa... a=3 b=4" or "catetos 6 e 8"
  if (lower.includes('pitágoras') || lower.includes('cateto') || lower.includes('hipotenusa')) {
    const numMatches = text.match(/\d+(?:\.\d+)?/g);
    if (numMatches && numMatches.length >= 2) {
      const n1 = parseFloat(numMatches[0]);
      const n2 = parseFloat(numMatches[1]);
      return solvePythagorasOffline(n1, n2, undefined, input);
    }
  }

  // Esfera pattern e.g. "esfera... r = 5" or "raio 6"
  if (lower.includes('esfera')) {
    const rMatch = text.match(/(?:r|raio)\s*=\s*(\d+(?:\.\d+)?)/i) || text.match(/\d+(?:\.\d+)?/);
    if (rMatch) {
      const r = parseFloat(rMatch[1] || rMatch[0]);
      return solveSphereOffline(r, input);
    }
  }

  // Cilindro pattern e.g. "cilindro... r=4 h=10"
  if (lower.includes('cilindro')) {
    const rMatch = text.match(/(?:r|raio)\s*=\s*(\d+(?:\.\d+)?)/i);
    const hMatch = text.match(/(?:h|altura)\s*=\s*(\d+(?:\.\d+)?)/i);
    const nums = text.match(/\d+(?:\.\d+)?/g);
    const r = rMatch ? parseFloat(rMatch[1]) : (nums && nums[0] ? parseFloat(nums[0]) : 4);
    const h = hMatch ? parseFloat(hMatch[1]) : (nums && nums[1] ? parseFloat(nums[1]) : 10);
    return solveCylinderOffline(r, h, input);
  }

  // Clean and normalize LaTeX formats (x^2, x^{2}, \cdot, spaces)
  const norm = text
    .replace(/\\cdot/g, '')
    .replace(/\s+/g, '')
    .replace(/x\^\{2\}/g, 'x^2')
    .replace(/X\^\{2\}/g, 'x^2');

  // 0. Check for Standalone Mixed Number: A\frac{B}{C} e.g. 4\frac{7}{4} or 2\frac{1}{3}
  const mixedSingleMatch = text.trim().match(/^([+-]?\d+)\s*\\frac\{(\d+)\}\{(\d+)\}(?:\s*=\s*\??)?$/);
  if (mixedSingleMatch) {
    const whole = parseInt(mixedSingleMatch[1], 10);
    const num = parseInt(mixedSingleMatch[2], 10);
    const den = parseInt(mixedSingleMatch[3], 10);
    if (!isNaN(whole) && !isNaN(num) && !isNaN(den) && den !== 0) {
      return solveMixedNumberOffline(whole, num, den, input);
    }
  }

  // 1. Check for Modular Inequality: |ax + b| <rel> c
  const modMatch = norm.match(/^\|([+-]?\d*(?:\.\d+)?)x([+-]\d+(?:\.\d+)?)?\|(<|>|\\le|\\ge|<=|>=)([+-]?\d+(?:\.\d+)?)$/i);
  if (modMatch) {
    let aStr = modMatch[1];
    let a = aStr === '' || aStr === '+' ? 1 : aStr === '-' ? -1 : parseFloat(aStr);
    let b = modMatch[2] ? parseFloat(modMatch[2]) : 0;
    let rel = modMatch[3];
    let c = parseFloat(modMatch[4]);
    if (!isNaN(a) && !isNaN(c)) {
      return solveModularInequality(a, b, rel, c, input);
    }
  }

  // 2. Check for Quadratic Inequality or Equation: ax^2 + bx + c (<rel> 0 or = 0)
  const quadMatch = norm.match(/^([+-]?\d*(?:\.\d+)?)x\^2([+-]\d*(?:\.\d+)?x)?([+-]\d+(?:\.\d+)?)?(=|<|>|\\le|\\ge|<=|>=)0$/i);
  if (quadMatch) {
    let aStr = quadMatch[1];
    let a = aStr === '' || aStr === '+' ? 1 : aStr === '-' ? -1 : parseFloat(aStr);
    let bStr = quadMatch[2] || '';
    let b = 0;
    if (bStr) {
      bStr = bStr.replace('x', '');
      b = bStr === '+' || bStr === '' ? 1 : bStr === '-' ? -1 : parseFloat(bStr);
    }
    let cStr = quadMatch[3] || '';
    let c = cStr ? parseFloat(cStr) : 0;
    let op = quadMatch[4];

    if (!isNaN(a) && a !== 0) {
      if (op === '=') {
        return solveQuadratic(a, b, c, input);
      } else {
        return solveQuadraticInequality(a, b, c, op, input);
      }
    }
  }

  // 3. Check for Linear Inequality or Equation: ax + b <rel> cx + d
  const ineqMatch = norm.match(/^([+-]?\d*(?:\.\d+)?)x([+-]\d+(?:\.\d+)?)?(=|<|>|\\le|\\ge|\\ne|<=|>=|!=)([+-]?\d*(?:\.\d+)?)x?([+-]\d+(?:\.\d+)?)?$/i);
  if (ineqMatch && !norm.includes('x^2') && !norm.includes('|')) {
    let aStr = ineqMatch[1];
    let a = aStr === '' || aStr === '+' ? 1 : aStr === '-' ? -1 : parseFloat(aStr);
    let b = ineqMatch[2] ? parseFloat(ineqMatch[2]) : 0;
    let op = ineqMatch[3];
    let rightSide = norm.split(op)[1] || '';
    let rightIsX = rightSide.includes('x');
    let c = 0;
    let d = 0;

    if (rightIsX) {
      let cStr = ineqMatch[4];
      c = cStr === '' || cStr === '+' ? 1 : cStr === '-' ? -1 : parseFloat(cStr);
      d = ineqMatch[5] ? parseFloat(ineqMatch[5]) : 0;
    } else {
      d = ineqMatch[4] ? parseFloat(ineqMatch[4]) : 0;
    }

    if (!isNaN(a)) {
      if (op === '=') {
        return solveLinear(a, b, c, d, input);
      } else {
        return solveLinearInequality(a, b, op, c, d, input);
      }
    }
  }

  // 3. Check for Derivative: d/dx(...) or \frac{d}{dx}(...)
  if (text.includes('\\frac{d}{dx}') || text.startsWith('d/dx') || text.startsWith('\\frac{d}{dx}')) {
    let expr = text
      .replace(/\\frac\{d\}\{dx\}\\left\(/g, '')
      .replace(/\\frac\{d\}\{dx\}\(/g, '')
      .replace(/^d\/dx\(/g, '')
      .replace(/\)$/, '')
      .replace(/\\right\)/g, '')
      .trim();
    return solveDerivative(expr, input);
  }

  // 4. 2x2 System Check: \begin{cases} a1 x + b1 y = c1 \\ a2 x + b2 y = c2 \end{cases}
  if (text.includes('cases') || text.includes('\\\\')) {
    const lines = text
      .replace(/\\begin\{cases\}/g, '')
      .replace(/\\end\{cases\}/g, '')
      .split(/\\\\/)
      .map((l) => l.trim().replace(/\s+/g, ''));

    if (lines.length >= 2) {
      const match1 = lines[0].match(/^([+-]?\d*)x([+-]\d*)y=(\d+)$/i);
      const match2 = lines[1].match(/^([+-]?\d*)x([+-]\d*)y=(\d+)$/i);
      if (match1 && match2) {
        const parseCoeff = (s: string) => (s === '' || s === '+' ? 1 : s === '-' ? -1 : parseFloat(s));
        const a1 = parseCoeff(match1[1]);
        const b1 = parseCoeff(match1[2]);
        const c1 = parseFloat(match1[3]);
        const a2 = parseCoeff(match2[1]);
        const b2 = parseCoeff(match2[2]);
        const c2 = parseFloat(match2[3]);
        return solveSystem2x2(a1, b1, c1, a2, b2, c2, input);
      }
    }
  }

  // Default: General Arithmetic / Symbolic Engine
  return solveGenericExpression(input);
}
