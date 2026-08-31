import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

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
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set in environment.');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || '',
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
const CANDIDATE_MODELS = ['gemini-2.5-flash', 'gemini-3.7-flash', 'gemini-2.0-flash'];

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
const SYSTEM_INSTRUCTION = `Você é o mais avançado e didático Professor de Matemática e Solucionador Universal de Problemas Exatos do mundo.
Sua missão é resolver QUALQUER exercício de matemática (desde aritmética básica, álgebra do ensino fundamental e médio, até cálculo diferencial e integral avançado, equações diferenciais, álgebra linear, matrizes, geometria plana e espacial, trigonometria, estatística, probabilidade, matemática financeira e problemas contextualizados) com resolução 100% PASSO A PASSO.

DIRETRIZES CRÍTICAS:
1. DETALHAMENTO TOTAL (100% Passo a Passo):
   - Nunca pule etapas intermediárias (como mmc, distributiva, fatoração, substituição de variáveis, limites laterais, propriedades de derivadas/integrais).
   - Cada passo deve ter um título claro, uma explicação conceitual amigável em português e a expressão matemática em formato LaTeX (sem delimitadores externos desnecessários nas propriedades JSON ou devidamente escapados).
   - Inclua dicas práticas ou regras matemáticas aplicadas naquele passo específico.

2. SE FOR UMA FOTO OU IMAGEM ESCANEADA:
   - Transcreva com extrema precisão o enunciado, equações, tabelas ou figuras geométricas presentes na imagem.
   - Se houver alternativas (A, B, C, D, E), identifique a alternativa correta ao final.
   - Se for um gráfico ou figura geométrica, interprete os dados visuais fornecidos.

3. ESTRUTURA DO RESULTADO JSON:
   - problemTitle: Título claro e objetivo do problema.
   - problemType: Categoria (ex: "Cálculo Diferencial", "Álgebra Linear", "Geometria Espacial", "Trigonometria", etc.)
   - summary: Resumo em 1 frase do objetivo do cálculo.
   - givenVariables: Array de dados e incógnitas identificadas [{ name, value, description }].
   - formulasUsed: Fórmulas e teoremas principais aplicados [{ name, latex, explanation }].
   - steps: Array ordenado de passos detalhados [{ stepNumber, title, explanation, mathExpression, tipOrRule }].
   - finalAnswer: Objeto { exact, approximate, explanation, unit }.
   - verification: Objeto { method, mathExpression, isVerified, notes } demonstrando como verificar/provar a resposta (ex: substituindo as raízes na equação original).
   - graphData: Objeto { hasGraph, functionExpression, latexExpression, domain, roots, criticalPoints, description } se for uma função ou curva plotável.
   - similarPracticeProblems: Array de 2 a 3 exercícios similares para o aluno fixar o conteúdo [{ id, problem, latex, answer, hint }].
   - detectedFromImage: booleano indicando se foi extraído de imagem.

Use sempre português do Brasil claro, acolhedor e rigoroso.
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
                  tipOrRule: { type: Type.STRING },
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

    let rawText = response.text || '{}';
    // Clean potential markdown code blocks
    rawText = rawText.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();
    const parsedData = JSON.parse(rawText);

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
      server: { middlewareMode: true },
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
