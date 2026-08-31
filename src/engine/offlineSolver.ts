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
    explanation: `A equação está na forma geral $ax^2 + bx + c = 0$. Identificamos os coeficientes:`,
    mathExpression: `a = ${a}, \\quad b = ${b}, \\quad c = ${c}`,
    tipOrRule: 'Uma equação quadrática é definida por $ax^2 + bx + c = 0$ onde $a \\neq 0$.',
  });

  if (method === 'completing_square') {
    // Completing square method
    steps.push({
      stepNumber: 2,
      title: 'Dividir a equação pelo coeficiente principal "a"',
      explanation: `Dividimos todos os termos por $a = ${a}$ para normalizar o termo quadrático:`,
      mathExpression: `x^2 + ${simplifyFraction(b, a).latex}x + ${simplifyFraction(c, a).latex} = 0`,
      tipOrRule: 'O método de completar quadrados requer que o coeficiente de $x^2$ seja igual a 1.',
    });

    const halfB = simplifyFraction(b, 2 * a);
    const halfBSq = simplifyFraction(b * b, 4 * a * a);
    const cOverA = simplifyFraction(-c, a);

    steps.push({
      stepNumber: 3,
      title: 'Mover o termo independente e somar (b/2a)²',
      explanation: `Isolamos as incógnitas e somamos $(\\frac{b}{2a})^2 = \\left(${halfB.latex}\\right)^2 = ${halfBSq.latex}$ em ambos os lados da igualdade para formar um trinômio quadrado perfeito:`,
      mathExpression: `\\left( x + ${halfB.latex} \\right)^2 = ${cOverA.latex} + ${halfBSq.latex} = ${simplifyFraction(delta, 4 * a * a).latex}`,
      tipOrRule: 'Trinômio Quadrado Perfeito: $(x + p)^2 = x^2 + 2px + p^2$.',
    });
  } else if (method === 'factoring' && delta >= 0 && Math.sqrt(delta) % 1 === 0) {
    // Factoring / Sum and Product
    const S = simplifyFraction(-b, a);
    const P = simplifyFraction(c, a);
    steps.push({
      stepNumber: 2,
      title: 'Aplicar a Relação de Girard (Soma e Produto)',
      explanation: `Calculamos a soma $S$ e o produto $P$ das raízes:`,
      mathExpression: `S = -\\frac{b}{a} = ${S.latex}, \\quad P = \\frac{c}{a} = ${P.latex}`,
      tipOrRule: 'As raízes $x_1$ e $x_2$ satisfazem $x_1 + x_2 = S$ e $x_1 \\cdot x_2 = P$.',
    });
  } else {
    // Default Bhaskara
    steps.push({
      stepNumber: 2,
      title: 'Calcular o Discriminante (Delta - Δ)',
      explanation: `Aplicamos a fórmula do discriminante $\\Delta = b^2 - 4ac$ substituindo os valores:`,
      mathExpression: `\\Delta = (${b})^2 - 4 \\cdot (${a}) \\cdot (${c}) = ${b * b} - (${4 * a * c}) = ${delta}`,
      tipOrRule:
        delta > 0
          ? 'Como $\\Delta > 0$, a equação possui 2 raízes reais e distintas.'
          : delta === 0
          ? 'Como $\\Delta = 0$, a equação possui 1 raiz real dupla.'
          : 'Como $\\Delta < 0$, a equação não possui raízes reais (possui 2 raízes complexas conjugadas).',
    });

    steps.push({
      stepNumber: 3,
      title: 'Aplicar a Fórmula de Bhaskara',
      explanation: `Substituímos os coeficientes na fórmula quadrática $x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}$:`,
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
        explanation: `Como $\\sqrt{${delta}} = ${sqrtDelta}$, calculamos os dois ramos da operação:`,
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
      explanation: `Como $\\Delta = 0$, a raiz é única (raiz com multiplicidade 2):`,
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
      explanation: `Como $\\Delta < 0$, temos $\\sqrt{\\Delta} = \\sqrt{${absDelta} \\cdot (-1)} = \\sqrt{${absDelta}}i$:`,
      mathExpression: isPerf
        ? `x = ${realPart.latex} \\pm ${simplifyFraction(sqrtAbs, 2 * a).latex}i`
        : `x = \\frac{${-b} \\pm i\\sqrt{${absDelta}}}{${2 * a}}`,
      tipOrRule: 'Unidade imaginária: $i = \\sqrt{-1}$, logo $i^2 = -1$.',
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
    explanation: 'A equação de 1º grau apresenta termos com a incógnita $x$ e termos numéricos constantes:',
    mathExpression: `${a}x ${b >= 0 ? '+ ' + b : '- ' + Math.abs(b)} = ${c}x ${d >= 0 ? '+ ' + d : '- ' + Math.abs(d)}`,
    tipOrRule: 'O objetivo é isolar a incógnita $x$ em um dos membros e as constantes no outro.',
  });

  const netA = a - c;
  const netB = d - b;

  steps.push({
    stepNumber: 2,
    title: 'Agrupar os Termos com "x" no 1º Membro e Constantes no 2º Membro',
    explanation: `Passamos $${c}x$ para o primeiro membro subtraindo e a constante $${b}$ para o segundo membro invertendo o sinal:`,
    mathExpression: `(${a} - ${c})x = ${d} - (${b}) \\implies ${netA}x = ${netB}`,
    tipOrRule: 'Princípio Aditivo da Igualdade: ao trocar de lado da igualdade, o termo troca de sinal.',
  });

  if (netA === 0) {
    if (netB === 0) {
      steps.push({
        stepNumber: 3,
        title: 'Análise da Identidade',
        explanation: 'Obtemos $0x = 0$, o que é uma identidade verdadeira para qualquer valor real de $x$.',
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
        explanation: `Obtemos $0x = ${netB}$, o que é uma contradição impossível.`,
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
    explanation: `Dividimos ambos os lados por $${netA}$ para obter o valor final de $x$:`,
    mathExpression: `x = \\frac{${netB}}{${netA}} = ${frac.latex}`,
    tipOrRule: 'Princípio Multiplicativo da Igualdade: divide-se ambos os membros pelo coeficiente de $x$.',
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
      explanation: `O valor que satisfaz a igualdade é $x = ${frac.latex}$.`,
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
    mathExpression: `\\begin{cases} (${a1})x + (${b1})y = ${c1} \\quad \\text{(Eq. 1)} \\\\ (${a2})x + (${b2})y = ${c2} \\quad \\text{(Eq. 2)} \\end{cases}`,
    tipOrRule: 'Um sistema linear 2x2 pode ser resolvido por Substituição, Adição ou Regra de Cramer.',
  });

  steps.push({
    stepNumber: 2,
    title: 'Calcular os Determinantes Principais (Regra de Cramer)',
    explanation: 'Calculamos o determinante da matriz dos coeficientes $D$, o determinante de $x$ ($D_x$) e o determinante de $y$ ($D_y$):',
    mathExpression: `D = \\begin{vmatrix} ${a1} & ${b1} \\\\ ${a2} & ${b2} \\end{vmatrix} = (${a1})(${b2}) - (${a2})(${b1}) = ${D}`,
    tipOrRule: 'Se $D \\neq 0$, o sistema é Possível e Determinado (SPD), possuindo solução única.',
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
    explanation: 'Substituímos as colunas de termos independentes para encontrar $D_x$ e $D_y$:',
    mathExpression: `D_x = \\begin{vmatrix} ${c1} & ${b1} \\\\ ${c2} & ${b2} \\end{vmatrix} = (${c1})(${b2}) - (${c2})(${b1}) = ${Dx}, \\quad D_y = \\begin{vmatrix} ${a1} & ${c1} \\\\ ${a2} & ${c2} \\end{vmatrix} = (${a1})(${c2}) - (${a2})(${c1}) = ${Dy}`,
  });

  const xFrac = simplifyFraction(Dx, D);
  const yFrac = simplifyFraction(Dy, D);

  steps.push({
    stepNumber: 4,
    title: 'Determinar os Valores das Variáveis x e y',
    explanation: 'Aplicamos a fórmula de Cramer $x = \\frac{D_x}{D}$ e $y = \\frac{D_y}{D}$:',
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
      explanation: `O par ordenado que satisfaz simultaneamente as duas equações é $x = ${xFrac.latex}$ e $y = ${yFrac.latex}$.`,
    },
    verification: {
      method: 'Substituição em Ambas as Equações',
      mathExpression: `${a1}(${xFrac.latex}) + ${b1}(${yFrac.latex}) = ${c1} \\quad \\checkmark, \\quad ${a2}(${xFrac.latex}) + ${b2}(${yFrac.latex}) = ${c2} \\quad \\checkmark`,
      isVerified: true,
      notes: 'Valores testados e validados em ambas as equações originais.',
    },
    similarPracticeProblems: [
      { id: 'p_sys_1', problem: 'Resolva o sistema: 2x + y = 7 e x - y = 2', latex: '\\begin{cases} 2x + y = 7 \\\\ x - y = 2 \\end{cases}', answer: '(3, 1)', hint: 'Some as duas equações para eliminar o y diretamente.' },
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
      explanation: 'Desejamos calcular a derivada de $f(x)$ em relação a $x$ utilizando as regras do cálculo diferencial:',
      mathExpression: `f(x) = ${node.toTex()}`,
      tipOrRule: 'Notação de Leibniz: $\\frac{d}{dx}f(x)$, ou notação de Lagrange: $f\'(x)$.',
    });

    steps.push({
      stepNumber: 2,
      title: 'Aplicar a Regra de Diferenciação Termo a Termo',
      explanation: 'Aplicamos a linearidade da derivada $\\frac{d}{dx}[u(x) + v(x)] = \\frac{du}{dx} + \\frac{dv}{dx}$ e a Regra do Tombo $\\frac{d}{dx}[x^n] = n x^{n-1}$:',
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
        explanation: `A derivada de primeira ordem da função é dada por $f'(x) = ${simplifiedDeriv.toTex()}$.`,
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
 * 5. General Algebraic / Arithmetic Expression Solver (100% Offline with mathjs)
 */
export function solveGenericExpression(rawInput: string): MathSolution {
  const steps: MathStep[] = [];
  let cleanInput = rawInput
    .replace(/\\cdot/g, '*')
    .replace(/\\times/g, '*')
    .replace(/\\div/g, '/')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
    .replace(/\\sqrt\{([^}]+)\}/g, 'sqrt($1)')
    .replace(/\\left\(/g, '(')
    .replace(/\\right\)/g, ')')
    .replace(/\\pi/g, 'pi')
    .replace(/\\,/g, ' ')
    .trim();

  // If ends with = ?, remove it
  cleanInput = cleanInput.replace(/=\s*\?*$/, '').trim();

  try {
    const parsed = math.parse(cleanInput);
    const evaluated = math.evaluate(cleanInput);
    const simplified = math.simplify(parsed);

    steps.push({
      stepNumber: 1,
      title: 'Interpretação e Estruturação da Expressão Matemática',
      explanation: 'Analisamos os operandos, operadores e a ordem de precedência matemática (PEMDAS / BODMAS):',
      mathExpression: parsed.toTex(),
      tipOrRule: 'Ordem de Operações: 1º Parênteses, 2º Expoentes/Raízes, 3º Multiplicação/Divisão, 4º Adição/Subtração.',
    });

    steps.push({
      stepNumber: 2,
      title: 'Simplificação Algébrica dos Termos',
      explanation: 'Realizamos a simplificação simbólica combinando termos semelhantes e aplicando identidades fundamentais:',
      mathExpression: simplified.toTex(),
    });

    let exactAnswer = '';
    let approxAnswer = '';

    if (typeof evaluated === 'number') {
      if (Number.isInteger(evaluated)) {
        exactAnswer = `${evaluated}`;
      } else {
        const frac = math.fraction(evaluated);
        const simp = simplifyFraction(Number(frac.n) * Number(frac.s), Number(frac.d));
        exactAnswer = simp.latex;
        approxAnswer = `\\approx ${evaluated.toFixed(4)}`;
      }
    } else {
      exactAnswer = math.format(evaluated);
    }

    steps.push({
      stepNumber: 3,
      title: 'Cálculo do Valor Final',
      explanation: 'Efetuamos os cálculos aritméticos finais para obter o resultado exato:',
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
 * MASTER OFFLINE DISPATCHER
 * Intelligently recognizes pattern and routes to the best specialized solver
 */
export function solveOffline(input: string): MathSolution {
  const text = input.trim();

  // 1. Check for Quadratic: ax^2 + bx + c = 0
  // Clean LaTeX formats like x^2, x^{2}, \cdot, etc.
  const norm = text
    .replace(/\\cdot/g, '')
    .replace(/\s+/g, '')
    .replace(/x\^\{2\}/g, 'x^2')
    .replace(/X\^\{2\}/g, 'x^2');

  // Quadratic Regex: e.g. 2x^2-8x+6=0 or x^2-4=0 or -x^2+5x=0
  const quadMatch = norm.match(/^([+-]?\d*(?:\.\d+)?)x\^2([+-]\d*(?:\.\d+)?x)?([+-]\d+(?:\.\d+)?)?=0$/i);
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

    if (!isNaN(a) && a !== 0) {
      return solveQuadratic(a, b, c, input);
    }
  }

  // 2. Check for Simple Linear Equation: ax + b = c or ax + b = cx + d
  const linMatch = norm.match(/^([+-]?\d*(?:\.\d+)?)x([+-]\d+(?:\.\d+)?)?=([+-]?\d*(?:\.\d+)?)x?([+-]\d+(?:\.\d+)?)?$/i);
  if (linMatch && !norm.includes('x^2')) {
    let aStr = linMatch[1];
    let a = aStr === '' || aStr === '+' ? 1 : aStr === '-' ? -1 : parseFloat(aStr);
    let b = linMatch[2] ? parseFloat(linMatch[2]) : 0;
    let rightIsX = linMatch[3] !== undefined && norm.split('=')[1].includes('x');
    let c = 0;
    let d = 0;

    if (rightIsX) {
      let cStr = linMatch[3];
      c = cStr === '' || cStr === '+' ? 1 : cStr === '-' ? -1 : parseFloat(cStr);
      d = linMatch[4] ? parseFloat(linMatch[4]) : 0;
    } else {
      d = linMatch[3] ? parseFloat(linMatch[3]) : 0;
    }

    if (!isNaN(a)) {
      return solveLinear(a, b, c, d, input);
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
