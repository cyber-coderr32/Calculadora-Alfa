import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

// Load the project environment first because this custom Express server does not
// automatically inherit Vite's `.env.development.local` loading behavior.
dotenv.config({ path: '/vercel/share/.env.project' });
dotenv.config({ path: '.env.development.local', override: false });
dotenv.config({ path: '.env', override: false });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Support large image payloads for camera scanning
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Lazy initialization of Gemini client
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    // The preview injects GEMINI_API_KEY at process start. Keep compatible
    // aliases for local runners without ever exposing the secret to the client.
    const apiKey = (
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.API_KEY ||
      ''
    ).trim();
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      throw new Error('A chave GEMINI_API_KEY não está configurada no servidor.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Fallback model list to ensure 100% uptime even if a specific model experiences temporary demand spikes (503/429)
const CANDIDATE_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash'];

async function generateWithFallback(options: {
  contents: any;
  config?: any;
}): Promise<any> {
  const ai = getGenAI();
  let lastError: any = null;

  for (const model of CANDIDATE_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: options.contents,
          config: options.config,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errStatus = err?.status || err?.code || '';
        const errMsg = err?.message || '';
        console.warn(`Attempt ${attempt + 1} with model ${model} failed (${errStatus}): ${errMsg}`);

        // If 503 (High Demand / UNAVAILABLE) or 429 (Resource Exhausted / Rate limit)
        const isTemporary =
          errMsg.includes('503') ||
          errMsg.includes('high demand') ||
          errMsg.includes('UNAVAILABLE') ||
          errMsg.includes('429') ||
          errMsg.includes('ResourceExhausted');

        if (isTemporary) {
          // Wait briefly before retry or fallback
          await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
        } else {
          // If it's a permanent config error on this model, break inner loop and try next model
          break;
        }
      }
    }
  }

  throw lastError || new Error('Todos os modelos de IA estão temporariamente indisponíveis.');
}
const SYSTEM_INSTRUCTION = `Você é o mais avançado, rigoroso e didático Professor de Matemática e Solucionador Universal de Problemas Exatos do mundo.
Sua missão é resolver QUALQUER exercício de matemática sem exceção — do mais elementar e básico até o mais ultra-avançado de nível universitário, mestrado e olimpíada científica.

COBERTURA COMPLETA DE ÁREAS E NÍVEIS:
1. BÁSICO & FUNDAMENTAL:
   - Aritmética, operações com frações simples e mistas, decimais, MMC, MDC, porcentagem, razão e proporção, regra de três simples e composta, potências e radicais, propriedades operatórias, produtos notáveis, fatoração algébrica, equações e inequações de 1º e 2º grau, equações biquadradas e irracionais.

2. FIGURAS GEOMÉTRICAS PLANAS (2D):
   - Triângulos (Equilátero, Isósceles, Retângulo, Escaleno), Teorema de Pitágoras, Teorema de Tales, Relações métricas no triângulo retângulo, Lei dos Senos e Cossenos, Fórmula de Heron para área, Cevianas (Mediana, Bissetriz, Altura), Pontos Notáveis (Baricentro, Incentro, Circuncentro, Ortocentro), Raio circunscrito e inscrito.
   - Quadriláteros: Quadrado, Retângulo, Losango, Trapézio (Retângulo, Isósceles, Escaleno, Base Média), Paralelogramo (Área por base×altura e produto vetorial/trigonométrico).
   - Círculo e Circunferência: Raio, Diâmetro, Perímetro (2pi r), Área (pi r^2), Setor circular, Segmento circular, Coroa circular, Potência de ponto, Ângulos na circunferência.
   - Polígonos Regulares: Hexágono, Pentágono, Octógono, Dodecágono — apótema, raio, área regular, soma dos ângulos internos e externos, número de diagonais.

3. SÓLIDOS GEOMÉTRICOS & GEOMETRIA ESPACIAL (3D):
   - Esfera: Volume (V = 4/3 pi r^3), Área da superfície (A = 4 pi r^2), Fuso esférico, Cunha esférica, Calota esférica.
   - Cilindro: Cilindro Reto e Oblíquo, Cilindro Equilátero, Volume (V = pi r^2 h), Área da base, Área lateral (2 pi r h), Área total (2 pi r(r+h)).
   - Cone: Cone Reto e Equilátero, Geratriz (g = sqrt(r^2 + h^2)), Volume (V = 1/3 pi r^2 h), Área lateral, Área total, Tronco de cone com bases paralelas.
   - Cubo & Paralelepípedo / Bloco Retangular: Volume (V = a b c), Área total, Diagonal da face, Diagonal espacial.
   - Pirâmides: Pirâmide regular de base quadrada, triangular e hexagonal, Apótema da base e da pirâmide, Volume (V = 1/3 Ab h), Área lateral e total, Tronco de pirâmide.
   - Prismas: Prisma reto e oblíquo, bases triangulares, quadrangulares, hexagonais, Volume (V = Ab h), Área lateral e total.
   - Poliedros Regulares (Platão): Tetraedro regular, Octaedro, Dodecaedro, Icosaedro, Relação de Euler (V - A + F = 2).
   - Toroide / Toro 3D: Volume (V = 2 pi^2 R r^2), Área (A = 4 pi^2 R r).

4. TRIGONOMETRIA & NÚMEROS COMPLEXOS:
   - Ciclo trigonométrico, identidades fundamentais, arcos duplos e triplos, fórmulas de prostaférese, equações e inequações trigonométricas, funções hiperbólicas.
   - Números Complexos: Formas algébrica (a+bi), geométrica (Argand-Gauss), polar/trigonométrica, exponencial (Euler), 1ª e 2ª Fórmulas de De Moivre (potenciação e raízes n-ésimas).

5. CÁLCULO DIFERENCIAL, INTEGRAL & EQUAÇÕES DIFERENCIAIS (AVANÇADO DO AVANÇADO):
   - Limites: Formas indeterminadas (0/0, inf/inf, etc.), Regra de L'Hôpital, limites fundamentais, limites laterais, continuidade e Teorema do Confronto.
   - Derivadas: Regras do produto, quociente, cadeia, derivação implícita, derivação logarítmica, derivadas direcionais, gradiente, matriz Hessiana e Jacobiana, otimização e pontos críticos.
   - Integrais: Integrais imediatas, substituição simples, substituição trigonométrica, integração por partes, frações parciais, integrais impróprias, integrais duplas e triplas, Teorema Fundamental do Cálculo.
   - Cálculo Vetorial: Campos conservativos, Divergente, Rotacional, Integrais de Linha e Superfície, Teorema de Green, Teorema de Stokes, Teorema de Gauss.
   - Séries: Sequências e séries infinitas, Testes de convergência, Séries de Taylor, Maclaurin e Fourier.
   - Equações Diferenciais Ordinárias (EDOs): EDOs de 1ª ordem (separáveis, lineares com fator integrante, exatas, Bernoulli, Riccati), EDOs lineares homogêneas e não-homogêneas de 2ª ordem, Transformada de Laplace.

6. ÁLGEBRA LINEAR & GEOMETRIA ANALÍTICA:
   - Matrizes, Determinantes, Sistemas Lineares N x N (Cramer, Escalonamento).
   - Espaços e Subespaços Vetoriais, Combinação Linear, Base e Dimensão, Transformações Lineares, Autovalores e Autovetores, Diagonalização de Matrizes, Gram-Schmidt.
   - Geometria Analítica: Distância entre pontos e reta, equações da reta, planos no R3, cônicas e quádricas.

DIRETRIZES DE RESOLUÇÃO (100% Passo a Passo no Estilo Photomath):
- NUNCA pule etapas intermediárias. Mostre as manipulações algébricas completas.
- Para cada passo ("steps"), forneça:
  * "title": Ação principal (ex: "Remova os parênteses", "Cancele os termos iguais", "Junte os termos semelhantes", "Mova a constante para a direita").
  * "explanation": Explicação didática clara da regra ou propriedade aplicada (ex: "Use a propriedade distributiva da multiplicação e multiplique cada termo dentro dos parênteses por 2").
  * "beforeExpression": A expressão matemática ANTES da operação, com o termo a ser modificado destacado em vermelho LaTeX usando \\mathbf{\\color{#e11d48}{termo}} (ex: "\\mathbf{\\color{#e11d48}{2(x-3)}} - 4(x-1) = -6").
  * "afterExpression": A expressão matemática DEPOIS da operação, com o resultado transformado destacado em vermelho LaTeX usando \\mathbf{\\color{#e11d48}{termo}} (ex: "\\mathbf{\\color{#e11d48}{2x - 6}} - 4(x-1) = -6").
  * "subSteps": Se a operação puder ser dividida em mini-etapas (ex: distribuir o 1º termo e depois o 2º termo), forneça a lista de subSteps com beforeLatex, afterLatex e explanation.
  * "mathExpression": A expressão matemática geral simplificada deste passo.
- REGRAS ESTRITAS DE FORMATAÇÃO E CIFRÃO ($):
  * NUNCA inclua o símbolo de cifrão '$' ou '$$' em nenhum texto, explicação, título, dica ou resumo.
  * Todas as fórmulas matemáticas em 'mathExpression', 'beforeExpression', 'afterExpression', 'exact', 'approximate', 'latex' devem ser escritas em LaTeX PURO e DIRETO, SEM cifrões ao redor (ex: '\\frac{-b \\pm \\sqrt{\\Delta}}{2a}', '2x - 6 = 0', 'x_1 = 3, \\, x_2 = 1').
  * Escreva as explicações e títulos em linguagem natural e fluida, sem inserir caracteres $ soltos.
- Sempre declare as fórmulas utilizadas com nomes e termos matemáticos precisos em LaTeX.
- Para problemas de geometria ou sólidos, extraia todos os dados (raio, altura, aresta, ângulos), mencione a figura ou sólido exato e mostre a substituição numérica em cada passo.
- Forneça sempre o valor exato (com pi, radicais, frações simplificadas) e a aproximação decimal quando conveniente.
- Responda no formato JSON rigoroso especificado no schema. Idioma: Português do Brasil com didática impecável.
`;

// Math solver endpoint
app.post('/api/solve', async (req, res) => {
  try {
    const { problem, image, detailLevel, action, stepIndex, customQuestion, previousSolution } = req.body;

    if (!problem && !image && !customQuestion) {
      return res.status(400).json({ error: 'Nenhum problema de matemática ou imagem foi fornecido.' });
    }

    const ai = getGenAI();

    let userPromptText = '';

    if (action === 'clarify_step' && previousSolution && stepIndex !== undefined) {
      userPromptText = `No problema anterior "${previousSolution.problemTitle}":
O usuário tem uma dúvida específica no PASSO ${stepIndex + 1}: "${previousSolution.steps?.[stepIndex]?.title || ''}".
Passo original: ${previousSolution.steps?.[stepIndex]?.explanation || ''} | Expressão: ${previousSolution.steps?.[stepIndex]?.mathExpression || ''}
Pergunta do usuário: "${customQuestion || 'Explique este passo de forma mais detalhada e simples, passo a passo.'}"

Por favor, forneça uma explicação aprofundada, intuitiva e detalhada deste passo específico, respondendo à pergunta e re-explicando as manipulações matemáticas.`;
    } else if (action === 'alternative_method' && previousSolution) {
      userPromptText = `Problema original: "${previousSolution.originalInput || previousSolution.problemTitle}".
Solução anterior usou o método: ${previousSolution.formulasUsed?.map((f: any) => f.name).join(', ') || 'Método padrão'}.

Por favor, resolva o mesmo problema usando um MÉTODO OU CAMINHO ALTERNATIVO (por exemplo: por fatoração em vez de Bhaskara, ou por substituição trigonométrica, ou geometricamente, etc.), mantendo a resolução 100% passo a passo.`;
    } else {
      userPromptText = `Resolva o seguinte problema de matemática 100% passo a passo:\n\n${problem || 'Analise o exercício de matemática na imagem em anexo e resolva-o com todos os passos.'}\n\nNível de detalhamento: ${detailLevel === 'concise' ? 'Direto e didático' : '100% Detalhado com cada manipulação e propriedade matemática explicada'}.`;
    }

    const contentsPayload: any = [];

    // Multimodal parts if image is present
    if (image && typeof image === 'string') {
      const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      let mimeType = 'image/jpeg';
      let data = image;

      if (matches && matches.length === 3) {
        mimeType = matches[1];
        data = matches[2];
      }

      contentsPayload.push({
        inlineData: {
          mimeType,
          data,
        },
      });
    }

    contentsPayload.push({
      text: userPromptText,
    });

    const response = await generateWithFallback({
      contents: {
        parts: contentsPayload,
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            problemTitle: { type: Type.STRING, description: 'Título claro do exercício' },
            problemType: { type: Type.STRING, description: 'Área da matemática (ex: Álgebra, Cálculo)' },
            summary: { type: Type.STRING, description: 'Resumo em 1 frase da solução' },
            detectedFromImage: { type: Type.BOOLEAN, description: 'Se foi extraído de imagem' },
            givenVariables: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  value: { type: Type.STRING },
                  description: { type: Type.STRING },
                },
                required: ['name', 'value', 'description'],
              },
            },
            formulasUsed: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  latex: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                },
                required: ['name', 'latex', 'explanation'],
              },
            },
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  stepNumber: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  mathExpression: { type: Type.STRING },
                  beforeExpression: { type: Type.STRING, description: 'Expressão LaTeX antes da operação com o termo destacado em vermelho' },
                  afterExpression: { type: Type.STRING, description: 'Expressão LaTeX depois da operação com o termo destacado em vermelho' },
                  tipOrRule: { type: Type.STRING },
                  subSteps: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        beforeLatex: { type: Type.STRING },
                        afterLatex: { type: Type.STRING },
                        explanation: { type: Type.STRING },
                        tip: { type: Type.STRING },
                      },
                      required: ['explanation'],
                    },
                  },
                },
                required: ['stepNumber', 'title', 'explanation', 'mathExpression'],
              },
            },
            finalAnswer: {
              type: Type.OBJECT,
              properties: {
                exact: { type: Type.STRING, description: 'Resultado exato em LaTeX' },
                approximate: { type: Type.STRING, description: 'Resultado decimal se aplicável' },
                explanation: { type: Type.STRING, description: 'Explicação final' },
                unit: { type: Type.STRING, description: 'Unidade de medida se houver' },
              },
              required: ['exact', 'explanation'],
            },
            verification: {
              type: Type.OBJECT,
              properties: {
                method: { type: Type.STRING },
                mathExpression: { type: Type.STRING },
                isVerified: { type: Type.BOOLEAN },
                notes: { type: Type.STRING },
              },
              required: ['method', 'mathExpression', 'isVerified', 'notes'],
            },
            graphData: {
              type: Type.OBJECT,
              properties: {
                hasGraph: { type: Type.BOOLEAN },
                functionExpression: { type: Type.STRING, description: 'Expressão JS/Math simples como x^2 - 4' },
                latexExpression: { type: Type.STRING },
                description: { type: Type.STRING },
              },
              required: ['hasGraph'],
            },
            alternativeMethodSummary: { type: Type.STRING, description: 'Dica de outro método de resolução' },
            similarPracticeProblems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  problem: { type: Type.STRING },
                  latex: { type: Type.STRING },
                  answer: { type: Type.STRING },
                  hint: { type: Type.STRING },
                },
                required: ['id', 'problem', 'latex', 'answer', 'hint'],
              },
            },
          },
          required: ['problemTitle', 'problemType', 'summary', 'steps', 'finalAnswer'],
        },
      },
    });

    let rawText = response.text || '';
    // Clean potential markdown code blocks and isolate the JSON object.
    rawText = rawText.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();
    const jsonStart = rawText.indexOf('{');
    const jsonEnd = rawText.lastIndexOf('}');
    if (jsonStart < 0 || jsonEnd <= jsonStart) {
      throw new Error('A IA não retornou uma resposta estruturada válida.');
    }
    const parsedData = JSON.parse(rawText.slice(jsonStart, jsonEnd + 1));
    if (!parsedData.problemTitle || !Array.isArray(parsedData.steps) || !parsedData.finalAnswer) {
      throw new Error('A resposta da IA está incompleta. Tente novamente.');
    }

    const solutionResult = {
      id: 'sol_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      timestamp: Date.now(),
      originalInput: problem || (image ? '[Exercício de Foto / Câmera]' : ''),
      imageUrl: image ? image.substring(0, 100) + '...' : undefined,
      ...parsedData,
    };

    return res.json(solutionResult);
  } catch (error: any) {
    console.error('Error solving math problem:', error);
    return res.status(500).json({
      error: 'Falha ao processar e resolver o exercício de matemática. Por favor, tente novamente.',
      details: error.message || 'Erro de comunicação com a IA',
    });
  }
});

// Quick OCR/Transcribe endpoint for camera photos if user just wants to load problem into editor first
app.post('/api/transcribe-math', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Nenhuma imagem foi enviada.' });
    }

    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let mimeType = 'image/jpeg';
    let data = image;

    if (matches && matches.length === 3) {
      mimeType = matches[1];
      data = matches[2];
    }

    const response = await generateWithFallback({
      contents: {
        parts: [
          { inlineData: { mimeType, data } },
          {
            text: 'Transcreva exatamente o exercício de matemática desta imagem em formato de texto e LaTeX editável. Retorne apenas o texto transcrito da equação ou problema, sem comentários adicionais.',
          },
        ],
      },
    });

    let transcribed = response.text?.trim() || '';
    transcribed = transcribed.replace(/```latex\s*/gi, '').replace(/```\s*$/gi, '').trim();

    res.json({ transcribedText: transcribed });
  } catch (error: any) {
    console.error('Error transcribing math image:', error);
    res.status(500).json({ error: 'Erro ao transcrever imagem. Tente novamente.' });
  }
});

// Vite middleware & Static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      // The preview proxy does not forward Vite's WebSocket upgrade reliably.
      // Disable HMR explicitly here because inline config takes precedence over vite.config.ts.
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Calculadora Matemática server running on http://localhost:${PORT}`);
  });
}

startServer();
