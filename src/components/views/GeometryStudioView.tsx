import React, { useState, useMemo } from 'react';
import { MathRenderer } from '../MathRenderer';
import {
  Shapes,
  Box,
  ArrowRight,
  Sparkles,
  Calculator,
  RotateCcw,
  Check,
  BookOpen,
  Info,
  Maximize2,
} from 'lucide-react';

interface GeometryStudioViewProps {
  onSolveInCalculator: (problemText: string) => void;
}

type ShapeType =
  // 2D Shapes
  | 'triangle_right'
  | 'triangle_heron'
  | 'triangle_equilateral'
  | 'circle'
  | 'circle_sector'
  | 'circle_crown'
  | 'rectangle'
  | 'trapezoid'
  | 'rhombus'
  | 'parallelogram'
  | 'regular_polygon'
  // 3D Solids
  | 'sphere'
  | 'spherical_cap'
  | 'cylinder'
  | 'cone'
  | 'cone_trunk'
  | 'cube'
  | 'cuboid'
  | 'pyramid'
  | 'prism'
  | 'tetrahedron'
  | 'torus';

export const GeometryStudioView: React.FC<GeometryStudioViewProps> = ({ onSolveInCalculator }) => {
  const [tab, setTab] = useState<'2d' | '3d'>('2d');
  const [selectedShape, setSelectedShape] = useState<ShapeType>('triangle_right');

  // Input states for various shapes
  const [params, setParams] = useState<Record<string, number>>({
    a: 3,
    b: 4,
    c: 5,
    r: 5,
    R: 8,
    h: 10,
    H: 12,
    l: 6,
    theta: 60,
    n: 6,
    D: 10,
    d: 6,
    base_major: 10,
    base_minor: 6,
  });

  const updateParam = (key: string, val: number) => {
    setParams((prev) => ({ ...prev, [key]: Math.max(0.1, val) }));
  };

  // Calculations for current shape
  const calculation = useMemo(() => {
    const p = params;
    switch (selectedShape) {
      // 2D Triângulo Retângulo
      case 'triangle_right': {
        const a = p.a || 3;
        const b = p.b || 4;
        const c = Math.sqrt(a * a + b * b);
        const area = (a * b) / 2;
        const perimeter = a + b + c;
        const h = (a * b) / c;
        return {
          title: 'Triângulo Retângulo',
          desc: 'Triângulo com um ângulo reto (90°). Aplicação de Pitágoras e relações métricas.',
          variables: [
            { label: 'Cateto a', key: 'a', val: a, unit: 'cm' },
            { label: 'Cateto b', key: 'b', val: b, unit: 'cm' },
          ],
          results: [
            { label: 'Hipotenusa (c)', latex: `c = \\sqrt{a^2 + b^2} = \\sqrt{${a}^2 + ${b}^2} = ${c.toFixed(2)} \\text{ cm}`, val: c.toFixed(2) },
            { label: 'Área (A)', latex: `A = \\frac{a \\cdot b}{2} = \\frac{${a} \\cdot ${b}}{2} = ${area.toFixed(2)} \\text{ cm}^2`, val: area.toFixed(2) },
            { label: 'Perímetro (2p)', latex: `P = a + b + c = ${a} + ${b} + ${c.toFixed(2)} = ${perimeter.toFixed(2)} \\text{ cm}`, val: perimeter.toFixed(2) },
            { label: 'Altura h', latex: `h = \\frac{a \\cdot b}{c} = ${h.toFixed(2)} \\text{ cm}`, val: h.toFixed(2) },
          ],
          problemPrompt: `Em um triângulo retângulo, os catetos medem a = ${a} cm e b = ${b} cm. Calcule a hipotenusa, a área, o perímetro e a altura relativa à hipotenusa passo a passo com todas as fórmulas.`,
        };
      }

      // 2D Triângulo Geral (Fórmula de Heron)
      case 'triangle_heron': {
        const a = p.a || 7;
        const b = p.b || 8;
        const c = p.c || 9;
        const semi = (a + b + c) / 2;
        const rad = semi * (semi - a) * (semi - b) * (semi - c);
        const area = rad > 0 ? Math.sqrt(rad) : 0;
        return {
          title: 'Triângulo Geral (Fórmula de Heron)',
          desc: 'Cálculo de área de triângulo a partir do comprimento de seus 3 lados.',
          variables: [
            { label: 'Lado a', key: 'a', val: a, unit: 'cm' },
            { label: 'Lado b', key: 'b', val: b, unit: 'cm' },
            { label: 'Lado c', key: 'c', val: c, unit: 'cm' },
          ],
          results: [
            { label: 'Semiperímetro (p)', latex: `p = \\frac{a+b+c}{2} = \\frac{${a}+${b}+${c}}{2} = ${semi.toFixed(2)} \\text{ cm}`, val: semi.toFixed(2) },
            { label: 'Área (Heron)', latex: `A = \\sqrt{p(p-a)(p-b)(p-c)} = ${area.toFixed(2)} \\text{ cm}^2`, val: area.toFixed(2) },
            { label: 'Perímetro', latex: `P = ${a + b + c} \\text{ cm}`, val: (a + b + c).toString() },
          ],
          problemPrompt: `Calcule a área de um triângulo cujos lados medem a = ${a} cm, b = ${b} cm e c = ${c} cm utilizando a Fórmula de Heron passo a passo.`,
        };
      }

      // 2D Triângulo Equilátero
      case 'triangle_equilateral': {
        const l = p.l || 6;
        const area = (l * l * Math.sqrt(3)) / 4;
        const h = (l * Math.sqrt(3)) / 2;
        const perim = 3 * l;
        return {
          title: 'Triângulo Equilátero',
          desc: 'Triângulo com os 3 lados congruentes e ângulos de 60°.',
          variables: [{ label: 'Lado l', key: 'l', val: l, unit: 'cm' }],
          results: [
            { label: 'Área (A)', latex: `A = \\frac{l^2 \\sqrt{3}}{4} = \\frac{${l}^2 \\sqrt{3}}{4} = ${area.toFixed(2)} \\text{ cm}^2`, val: area.toFixed(2) },
            { label: 'Altura (h)', latex: `h = \\frac{l \\sqrt{3}}{2} = ${h.toFixed(2)} \\text{ cm}`, val: h.toFixed(2) },
            { label: 'Perímetro (P)', latex: `P = 3l = ${perim} \\text{ cm}`, val: perim.toString() },
          ],
          problemPrompt: `Um triângulo equilátero possui lado medindo l = ${l} cm. Calcule a sua área, altura, apótema e perímetro passo a passo.`,
        };
      }

      // 2D Círculo & Circunferência
      case 'circle': {
        const r = p.r || 5;
        const area = Math.PI * r * r;
        const circ = 2 * Math.PI * r;
        const d = 2 * r;
        return {
          title: 'Círculo & Circunferência',
          desc: 'Figura delimitada pelo raio e circunferência.',
          variables: [{ label: 'Raio r', key: 'r', val: r, unit: 'cm' }],
          results: [
            { label: 'Área (A)', latex: `A = \\pi r^2 = \\pi (${r})^2 = ${r * r}\\pi \\approx ${area.toFixed(2)} \\text{ cm}^2`, val: area.toFixed(2) },
            { label: 'Comprimento (C)', latex: `C = 2\\pi r = 2\\pi (${r}) = ${2 * r}\\pi \\approx ${circ.toFixed(2)} \\text{ cm}`, val: circ.toFixed(2) },
            { label: 'Diâmetro (d)', latex: `d = 2r = ${d} \\text{ cm}`, val: d.toString() },
          ],
          problemPrompt: `Calcule a área e o comprimento da circunferência de um círculo de raio r = ${r} cm (usando π ≈ 3,14159) passo a passo.`,
        };
      }

      // 2D Setor Circular
      case 'circle_sector': {
        const r = p.r || 6;
        const theta = p.theta || 60;
        const area = (Math.PI * r * r * theta) / 360;
        const arc = (2 * Math.PI * r * theta) / 360;
        return {
          title: 'Setor Circular',
          desc: 'Fração da área do círculo definida por um ângulo central θ.',
          variables: [
            { label: 'Raio r', key: 'r', val: r, unit: 'cm' },
            { label: 'Ângulo central θ', key: 'theta', val: theta, unit: '°' },
          ],
          results: [
            { label: 'Área do Setor', latex: `A = \\frac{\\pi r^2 \\theta}{360^\\circ} = \\frac{\\pi (${r})^2 (${theta})}{360} \\approx ${area.toFixed(2)} \\text{ cm}^2`, val: area.toFixed(2) },
            { label: 'Comprimento do Arco', latex: `L = \\frac{2\\pi r \\theta}{360^\\circ} = ${arc.toFixed(2)} \\text{ cm}`, val: arc.toFixed(2) },
          ],
          problemPrompt: `Determine a área de um setor circular com raio r = ${r} cm e ângulo central θ = ${theta}° passo a passo.`,
        };
      }

      // 2D Coroa Circular
      case 'circle_crown': {
        const R = p.R || 8;
        const r = p.r || 4;
        const safeR = Math.max(R, r + 0.1);
        const area = Math.PI * (safeR * safeR - r * r);
        return {
          title: 'Coroa Circular',
          desc: 'Região contida entre dois círculos concêntricos de raios R e r.',
          variables: [
            { label: 'Raio Maior R', key: 'R', val: safeR, unit: 'cm' },
            { label: 'Raio Menor r', key: 'r', val: r, unit: 'cm' },
          ],
          results: [
            { label: 'Área da Coroa', latex: `A = \\pi(R^2 - r^2) = \\pi(${safeR}^2 - ${r}^2) \\approx ${area.toFixed(2)} \\text{ cm}^2`, val: area.toFixed(2) },
          ],
          problemPrompt: `Calcule a área da coroa circular formada por duas circunferências concêntricas de raios R = ${safeR} cm e r = ${r} cm.`,
        };
      }

      // 2D Trapézio
      case 'trapezoid': {
        const B = p.base_major || 10;
        const b = p.base_minor || 6;
        const h = p.h || 4;
        const area = ((B + b) * h) / 2;
        const baseMedia = (B + b) / 2;
        return {
          title: 'Trapézio',
          desc: 'Quadrilátero com dois lados paralelos (bases maior e menor).',
          variables: [
            { label: 'Base Maior B', key: 'base_major', val: B, unit: 'cm' },
            { label: 'Base Menor b', key: 'base_minor', val: b, unit: 'cm' },
            { label: 'Altura h', key: 'h', val: h, unit: 'cm' },
          ],
          results: [
            { label: 'Área (A)', latex: `A = \\frac{(B+b)h}{2} = \\frac{(${B}+${b}) \\cdot ${h}}{2} = ${area.toFixed(2)} \\text{ cm}^2`, val: area.toFixed(2) },
            { label: 'Base Média', latex: `B_m = \\frac{B+b}{2} = ${baseMedia.toFixed(2)} \\text{ cm}`, val: baseMedia.toFixed(2) },
          ],
          problemPrompt: `Calcule a área e a base média de um trapézio que tem base maior B = ${B} cm, base menor b = ${b} cm e altura h = ${h} cm.`,
        };
      }

      // 2D Losango
      case 'rhombus': {
        const D = p.D || 10;
        const d = p.d || 6;
        const area = (D * d) / 2;
        const side = Math.sqrt(Math.pow(D / 2, 2) + Math.pow(d / 2, 2));
        const perim = 4 * side;
        return {
          title: 'Losango',
          desc: 'Quadrilátero equilátero com diagonais perpendiculares.',
          variables: [
            { label: 'Diagonal Maior D', key: 'D', val: D, unit: 'cm' },
            { label: 'Diagonal Menor d', key: 'd', val: d, unit: 'cm' },
          ],
          results: [
            { label: 'Área (A)', latex: `A = \\frac{D \\cdot d}{2} = \\frac{${D} \\cdot ${d}}{2} = ${area.toFixed(2)} \\text{ cm}^2`, val: area.toFixed(2) },
            { label: 'Lado (l)', latex: `l = \\sqrt{\\left(\\frac{D}{2}\\right)^2 + \\left(\\frac{d}{2}\\right)^2} = ${side.toFixed(2)} \\text{ cm}`, val: side.toFixed(2) },
            { label: 'Perímetro (P)', latex: `P = 4l = ${perim.toFixed(2)} \\text{ cm}`, val: perim.toFixed(2) },
          ],
          problemPrompt: `Um losango tem diagonais medindo D = ${D} cm e d = ${d} cm. Calcule a sua área, a medida dos lados e o seu perímetro passo a passo.`,
        };
      }

      // 2D Polígono Regular
      case 'regular_polygon': {
        const n = Math.round(p.n || 6);
        const l = p.l || 5;
        const apothem = l / (2 * Math.tan(Math.PI / n));
        const area = (n * l * apothem) / 2;
        const perim = n * l;
        const sumAngles = (n - 2) * 180;
        const internalAngle = sumAngles / n;
        const diagonals = (n * (n - 3)) / 2;
        return {
          title: `Polígono Regular (${n} lados)`,
          desc: 'Polígono equiângulo e equilátero.',
          variables: [
            { label: 'Número de lados (n)', key: 'n', val: n, unit: '' },
            { label: 'Comprimento do lado (l)', key: 'l', val: l, unit: 'cm' },
          ],
          results: [
            { label: 'Apótema (ap)', latex: `a_p = \\frac{l}{2\\tan(\\pi/n)} = ${apothem.toFixed(2)} \\text{ cm}`, val: apothem.toFixed(2) },
            { label: 'Área Total (A)', latex: `A = \\frac{n \\cdot l \\cdot a_p}{2} = ${area.toFixed(2)} \\text{ cm}^2`, val: area.toFixed(2) },
            { label: 'Soma dos Ângulos Internos', latex: `S_i = (n-2) \\cdot 180^\\circ = ${sumAngles}^\\circ`, val: `${sumAngles}°` },
            { label: 'Ângulo Interno (Ai)', latex: `A_i = \\frac{S_i}{n} = ${internalAngle.toFixed(1)}^\\circ`, val: `${internalAngle.toFixed(1)}°` },
            { label: 'Total de Diagonais', latex: `d = \\frac{n(n-3)}{2} = ${diagonals}`, val: diagonals.toString() },
          ],
          problemPrompt: `Para um polígono regular de n = ${n} lados com aresta l = ${l} cm, determine a apótema, área total, soma dos ângulos internos e número de diagonais.`,
        };
      }

      // 3D Esfera
      case 'sphere': {
        const r = p.r || 6;
        const vol = (4 / 3) * Math.PI * Math.pow(r, 3);
        const area = 4 * Math.PI * r * r;
        return {
          title: 'Esfera Espacial',
          desc: 'Sólido de revolução perfeitamente simétrico.',
          variables: [{ label: 'Raio r', key: 'r', val: r, unit: 'cm' }],
          results: [
            { label: 'Volume (V)', latex: `V = \\frac{4}{3}\\pi r^3 = \\frac{4}{3}\\pi (${r})^3 = ${( (4 * Math.pow(r, 3)) / 3 ).toFixed(2)}\\pi \\approx ${vol.toFixed(2)} \\text{ cm}^3`, val: vol.toFixed(2) },
            { label: 'Área Superficial (A)', latex: `A = 4\\pi r^2 = 4\\pi (${r})^2 = ${4 * r * r}\\pi \\approx ${area.toFixed(2)} \\text{ cm}^2`, val: area.toFixed(2) },
          ],
          problemPrompt: `Calcule o volume e a área da superfície esférica de uma esfera com raio r = ${r} cm passo a passo com todas as fórmulas.`,
        };
      }

      // 3D Cilindro Reto
      case 'cylinder': {
        const r = p.r || 4;
        const h = p.h || 10;
        const baseArea = Math.PI * r * r;
        const latArea = 2 * Math.PI * r * h;
        const totArea = 2 * baseArea + latArea;
        const vol = baseArea * h;
        return {
          title: 'Cilindro Reto',
          desc: 'Sólido delimitado por duas bases circulares paralelas e congruentes.',
          variables: [
            { label: 'Raio da Base r', key: 'r', val: r, unit: 'cm' },
            { label: 'Altura h', key: 'h', val: h, unit: 'cm' },
          ],
          results: [
            { label: 'Volume (V)', latex: `V = \\pi r^2 h = \\pi (${r})^2 (${h}) = ${r * r * h}\\pi \\approx ${vol.toFixed(2)} \\text{ cm}^3`, val: vol.toFixed(2) },
            { label: 'Área Lateral (Al)', latex: `A_l = 2\\pi r h = 2\\pi (${r})(${h}) = ${2 * r * h}\\pi \\approx ${latArea.toFixed(2)} \\text{ cm}^2`, val: latArea.toFixed(2) },
            { label: 'Área Total (At)', latex: `A_t = 2\\pi r(r+h) = ${totArea.toFixed(2)} \\text{ cm}^2`, val: totArea.toFixed(2) },
          ],
          problemPrompt: `Um cilindro reto tem raio da base r = ${r} cm e altura h = ${h} cm. Calcule o volume, a área da base, a área lateral e a área total passo a passo.`,
        };
      }

      // 3D Cone Reto
      case 'cone': {
        const r = p.r || 3;
        const h = p.h || 4;
        const g = Math.sqrt(r * r + h * h);
        const vol = (1 / 3) * Math.PI * r * r * h;
        const latArea = Math.PI * r * g;
        const totArea = Math.PI * r * (r + g);
        return {
          title: 'Cone Reto',
          desc: 'Sólido com base circular e vértice superior.',
          variables: [
            { label: 'Raio da Base r', key: 'r', val: r, unit: 'cm' },
            { label: 'Altura h', key: 'h', val: h, unit: 'cm' },
          ],
          results: [
            { label: 'Geratriz (g)', latex: `g = \\sqrt{r^2 + h^2} = \\sqrt{${r}^2 + ${h}^2} = ${g.toFixed(2)} \\text{ cm}`, val: g.toFixed(2) },
            { label: 'Volume (V)', latex: `V = \\frac{1}{3}\\pi r^2 h = \\frac{1}{3}\\pi (${r})^2 (${h}) \\approx ${vol.toFixed(2)} \\text{ cm}^3`, val: vol.toFixed(2) },
            { label: 'Área Total (At)', latex: `A_t = \\pi r(r + g) \\approx ${totArea.toFixed(2)} \\text{ cm}^2`, val: totArea.toFixed(2) },
          ],
          problemPrompt: `Calcule a geratriz, o volume e a área total de um cone reto de raio r = ${r} cm e altura h = ${h} cm passo a passo.`,
        };
      }

      // 3D Tronco de Cone
      case 'cone_trunk': {
        const R = p.R || 6;
        const r = p.r || 3;
        const h = p.h || 4;
        const g = Math.sqrt(h * h + Math.pow(R - r, 2));
        const vol = (Math.PI * h * (R * R + R * r + r * r)) / 3;
        const latArea = Math.PI * (R + r) * g;
        const totArea = Math.PI * R * R + Math.PI * r * r + latArea;
        return {
          title: 'Tronco de Cone',
          desc: 'Sólido obtido pela seção plana paralela à base de um cone.',
          variables: [
            { label: 'Raio Maior R', key: 'R', val: R, unit: 'cm' },
            { label: 'Raio Menor r', key: 'r', val: r, unit: 'cm' },
            { label: 'Altura h', key: 'h', val: h, unit: 'cm' },
          ],
          results: [
            { label: 'Geratriz (g)', latex: `g = \\sqrt{h^2 + (R-r)^2} = ${g.toFixed(2)} \\text{ cm}`, val: g.toFixed(2) },
            { label: 'Volume (V)', latex: `V = \\frac{\\pi h}{3}(R^2 + Rr + r^2) \\approx ${vol.toFixed(2)} \\text{ cm}^3`, val: vol.toFixed(2) },
            { label: 'Área Total', latex: `A_t = ${totArea.toFixed(2)} \\text{ cm}^2`, val: totArea.toFixed(2) },
          ],
          problemPrompt: `Um tronco de cone possui bases de raios R = ${R} cm e r = ${r} cm e altura h = ${h} cm. Calcule o volume e a área superficial total passo a passo.`,
        };
      }

      // 3D Cubo
      case 'cube': {
        const a = p.a || 5;
        const vol = Math.pow(a, 3);
        const area = 6 * a * a;
        const diagFace = a * Math.sqrt(2);
        const diagEsp = a * Math.sqrt(3);
        return {
          title: 'Cubo (Hexaedro Regular)',
          desc: 'Poliedro regular formado por 6 faces quadradas idênticas.',
          variables: [{ label: 'Aresta a', key: 'a', val: a, unit: 'cm' }],
          results: [
            { label: 'Volume (V)', latex: `V = a^3 = (${a})^3 = ${vol.toFixed(2)} \\text{ cm}^3`, val: vol.toFixed(2) },
            { label: 'Área Total (At)', latex: `A_t = 6a^2 = 6(${a})^2 = ${area.toFixed(2)} \\text{ cm}^2`, val: area.toFixed(2) },
            { label: 'Diagonal Espacial (D)', latex: `D = a\\sqrt{3} = ${diagEsp.toFixed(2)} \\text{ cm}`, val: diagEsp.toFixed(2) },
            { label: 'Diagonal da Face (d)', latex: `d = a\\sqrt{2} = ${diagFace.toFixed(2)} \\text{ cm}`, val: diagFace.toFixed(2) },
          ],
          problemPrompt: `Calcule o volume, a área total e a diagonal espacial de um cubo com aresta medindo a = ${a} cm passo a passo.`,
        };
      }

      // 3D Paralelepípedo / Bloco Retangular
      case 'cuboid': {
        const a = p.a || 6;
        const b = p.b || 4;
        const c = p.c || 3;
        const vol = a * b * c;
        const area = 2 * (a * b + b * c + a * c);
        const diag = Math.sqrt(a * a + b * b + c * c);
        return {
          title: 'Paralelepípedo Retângulo',
          desc: 'Sólido formado por 6 faces retangulares.',
          variables: [
            { label: 'Comprimento a', key: 'a', val: a, unit: 'cm' },
            { label: 'Largura b', key: 'b', val: b, unit: 'cm' },
            { label: 'Altura c', key: 'c', val: c, unit: 'cm' },
          ],
          results: [
            { label: 'Volume (V)', latex: `V = a \\cdot b \\cdot c = ${a} \\cdot ${b} \\cdot ${c} = ${vol.toFixed(2)} \\text{ cm}^3`, val: vol.toFixed(2) },
            { label: 'Área Total (At)', latex: `A_t = 2(ab+bc+ac) = ${area.toFixed(2)} \\text{ cm}^2`, val: area.toFixed(2) },
            { label: 'Diagonal Espacial (D)', latex: `D = \\sqrt{a^2+b^2+c^2} = ${diag.toFixed(2)} \\text{ cm}`, val: diag.toFixed(2) },
          ],
          problemPrompt: `Determine o volume, a área superficial total e a diagonal de um paralelepípedo de dimensões ${a} cm × ${b} cm × ${c} cm passo a passo.`,
        };
      }

      // 3D Pirâmide Regular (Base Quadrada)
      case 'pyramid': {
        const l = p.l || 6;
        const h = p.h || 4;
        const baseArea = l * l;
        const apothemBase = l / 2;
        const apothemPyramid = Math.sqrt(h * h + apothemBase * apothemBase);
        const latArea = 4 * ((l * apothemPyramid) / 2);
        const totArea = baseArea + latArea;
        const vol = (baseArea * h) / 3;
        return {
          title: 'Pirâmide Quadrangular Regular',
          desc: 'Pirâmide com base quadrada e faces triangulares isósceles.',
          variables: [
            { label: 'Aresta da base l', key: 'l', val: l, unit: 'cm' },
            { label: 'Altura h', key: 'h', val: h, unit: 'cm' },
          ],
          results: [
            { label: 'Apótema da Pirâmide (g)', latex: `g = \\sqrt{h^2 + (l/2)^2} = ${apothemPyramid.toFixed(2)} \\text{ cm}`, val: apothemPyramid.toFixed(2) },
            { label: 'Volume (V)', latex: `V = \\frac{1}{3} A_b \\cdot h = \\frac{1}{3}(${baseArea})(${h}) = ${vol.toFixed(2)} \\text{ cm}^3`, val: vol.toFixed(2) },
            { label: 'Área Total (At)', latex: `A_t = A_b + A_l = ${totArea.toFixed(2)} \\text{ cm}^2`, val: totArea.toFixed(2) },
          ],
          problemPrompt: `Uma pirâmide regular de base quadrada tem aresta da base l = ${l} cm e altura h = ${h} cm. Calcule o apótema da pirâmide, a área lateral, a área total e o volume passo a passo.`,
        };
      }

      // 3D Tetraedro Regular
      case 'tetrahedron': {
        const a = p.a || 6;
        const vol = (Math.pow(a, 3) * Math.sqrt(2)) / 12;
        const area = a * a * Math.sqrt(3);
        const h = (a * Math.sqrt(6)) / 3;
        return {
          title: 'Tetraedro Regular (Platão)',
          desc: 'Poliedro com 4 faces que são triângulos equiláteros congruentes.',
          variables: [{ label: 'Aresta a', key: 'a', val: a, unit: 'cm' }],
          results: [
            { label: 'Volume (V)', latex: `V = \\frac{a^3 \\sqrt{2}}{12} = ${vol.toFixed(2)} \\text{ cm}^3`, val: vol.toFixed(2) },
            { label: 'Área Total (At)', latex: `A_t = a^2 \\sqrt{3} = ${area.toFixed(2)} \\text{ cm}^2`, val: area.toFixed(2) },
            { label: 'Altura (h)', latex: `h = \\frac{a \\sqrt{6}}{3} = ${h.toFixed(2)} \\text{ cm}`, val: h.toFixed(2) },
          ],
          problemPrompt: `Para um tetraedro regular de aresta a = ${a} cm, calcule a altura, a área total e o volume exato com radicais passo a passo.`,
        };
      }

      // 3D Toroide / Toro
      case 'torus': {
        const R = p.R || 8;
        const r = p.r || 2;
        const vol = 2 * Math.PI * Math.PI * R * r * r;
        const area = 4 * Math.PI * Math.PI * R * r;
        return {
          title: 'Toroide (Toro 3D)',
          desc: 'Sólido de revolução obtido girando uma circunferência ao redor de um eixo.',
          variables: [
            { label: 'Raio Maior R (eixo)', key: 'R', val: R, unit: 'cm' },
            { label: 'Raio Menor r (tubo)', key: 'r', val: r, unit: 'cm' },
          ],
          results: [
            { label: 'Volume (V)', latex: `V = 2\\pi^2 R r^2 \\approx ${vol.toFixed(2)} \\text{ cm}^3`, val: vol.toFixed(2) },
            { label: 'Área da Superfície', latex: `A = 4\\pi^2 R r \\approx ${area.toFixed(2)} \\text{ cm}^2`, val: area.toFixed(2) },
          ],
          problemPrompt: `Calcule o volume e a área da superfície de um toroide tridimensional com raio maior R = ${R} cm e raio do tubo r = ${r} cm passo a passo.`,
        };
      }

      default:
        return {
          title: 'Figura Geométrica',
          desc: 'Selecione uma figura ou sólido no menu superior.',
          variables: [],
          results: [],
          problemPrompt: '',
        };
    }
  }, [selectedShape, params]);

  // List of shapes
  const shapes2D: { id: ShapeType; name: string }[] = [
    { id: 'triangle_right', name: 'Triângulo Retângulo' },
    { id: 'triangle_heron', name: 'Triângulo Geral (Heron)' },
    { id: 'triangle_equilateral', name: 'Triângulo Equilátero' },
    { id: 'circle', name: 'Círculo / Circunf.' },
    { id: 'circle_sector', name: 'Setor Circular' },
    { id: 'circle_crown', name: 'Coroa Circular' },
    { id: 'trapezoid', name: 'Trapézio' },
    { id: 'rhombus', name: 'Losango' },
    { id: 'regular_polygon', name: 'Polígono Regular' },
  ];

  const shapes3D: { id: ShapeType; name: string }[] = [
    { id: 'sphere', name: 'Esfera 3D' },
    { id: 'cylinder', name: 'Cilindro Reto' },
    { id: 'cone', name: 'Cone Reto' },
    { id: 'cone_trunk', name: 'Tronco de Cone' },
    { id: 'cube', name: 'Cubo' },
    { id: 'cuboid', name: 'Paralelepípedo' },
    { id: 'pyramid', name: 'Pirâmide Regular' },
    { id: 'tetrahedron', name: 'Tetraedro Regular' },
    { id: 'torus', name: 'Toroide (Toro 3D)' },
  ];

  return (
    <div className="space-y-5 animate-fade-in w-full max-w-full">
      {/* Header Banner */}
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <Shapes className="w-5 h-5" />
              </div>
              <h2 className="text-base sm:text-xl font-black text-white tracking-tight">
                Estúdio de Geometria Plana & Sólidos 3D
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              Cálculo instantâneo de áreas, volumes, apótemas, diagonais, geratrizes e fórmulas completas.
            </p>
          </div>

          {/* Tab 2D vs 3D */}
          <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-2xl self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                setTab('2d');
                setSelectedShape('triangle_right');
              }}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                tab === '2d'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shapes className="w-3.5 h-3.5" />
              <span>Figuras 2D</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('3d');
                setSelectedShape('sphere');
              }}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                tab === '3d'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>Sólidos 3D</span>
            </button>
          </div>
        </div>

        {/* Shapes Selector Pill Grid */}
        <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1 scrollbar-thin">
          {(tab === '2d' ? shapes2D : shapes3D).map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedShape(s.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedShape === s.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Studio Area: Controls + Diagram + Step-by-Step Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Parameter Inputs & Diagram */}
        <div className="lg:col-span-5 space-y-4">
          {/* Dimension Inputs Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Calculator className="w-4 h-4 text-indigo-400" />
                <span>Dimensões de Entrada</span>
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">Valores Reativos</span>
            </div>

            <div className="space-y-3">
              {calculation.variables.map((v) => (
                <div key={v.key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">{v.label}</span>
                    <span className="font-mono text-indigo-400 font-bold">
                      {v.val} {v.unit}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="1"
                      max="50"
                      step="0.5"
                      value={v.val}
                      onChange={(e) => updateParam(v.key, parseFloat(e.target.value))}
                      className="flex-1 accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <input
                      type="number"
                      min="0.1"
                      step="0.5"
                      value={v.val}
                      onChange={(e) => updateParam(v.key, parseFloat(e.target.value) || 1)}
                      className="w-16 bg-slate-950 border border-slate-700 rounded-xl px-2 py-1 text-xs text-white text-right font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Visual Schematic Diagram Card */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden min-h-[160px]">
            <div className="absolute top-2.5 left-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Representação Geométrica
            </div>

            <div className="py-4 flex items-center justify-center">
              {/* Dynamic SVG diagrams based on shape */}
              {selectedShape === 'triangle_right' && (
                <svg width="140" height="110" viewBox="0 0 140 110" className="text-indigo-400">
                  <polygon points="20,90 120,90 20,20" fill="rgba(99,102,241,0.15)" stroke="currentColor" strokeWidth="2.5" />
                  <rect x="20" y="76" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  <text x="70" y="105" fill="#94a3b8" fontSize="11" textAnchor="middle">b = {params.b || 4}</text>
                  <text x="8" y="55" fill="#94a3b8" fontSize="11" textAnchor="middle">a = {params.a || 3}</text>
                  <text x="80" y="45" fill="#818cf8" fontSize="11" textAnchor="middle" fontWeight="bold">c = {Math.sqrt((params.a||3)**2 + (params.b||4)**2).toFixed(1)}</text>
                </svg>
              )}

              {selectedShape === 'circle' && (
                <svg width="130" height="130" viewBox="0 0 130 130" className="text-indigo-400">
                  <circle cx="65" cy="65" r="50" fill="rgba(99,102,241,0.15)" stroke="currentColor" strokeWidth="2.5" />
                  <line x1="65" y1="65" x2="115" y2="65" stroke="#818cf8" strokeWidth="2" strokeDasharray="3,3" />
                  <circle cx="65" cy="65" r="3" fill="currentColor" />
                  <text x="88" y="58" fill="#818cf8" fontSize="11" textAnchor="middle" fontWeight="bold">r = {params.r || 5}</text>
                </svg>
              )}

              {selectedShape === 'sphere' && (
                <svg width="130" height="130" viewBox="0 0 130 130" className="text-indigo-400">
                  <circle cx="65" cy="65" r="50" fill="rgba(99,102,241,0.15)" stroke="currentColor" strokeWidth="2.5" />
                  <ellipse cx="65" cy="65" rx="50" ry="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4,4" />
                  <line x1="65" y1="65" x2="115" y2="65" stroke="#818cf8" strokeWidth="2" />
                  <circle cx="65" cy="65" r="3" fill="currentColor" />
                  <text x="88" y="58" fill="#818cf8" fontSize="11" textAnchor="middle" fontWeight="bold">r = {params.r || 6}</text>
                </svg>
              )}

              {selectedShape === 'cylinder' && (
                <svg width="130" height="130" viewBox="0 0 130 130" className="text-indigo-400">
                  <ellipse cx="65" cy="30" rx="40" ry="14" fill="rgba(99,102,241,0.2)" stroke="currentColor" strokeWidth="2" />
                  <ellipse cx="65" cy="100" rx="40" ry="14" fill="rgba(99,102,241,0.15)" stroke="currentColor" strokeWidth="2" />
                  <line x1="25" y1="30" x2="25" y2="100" stroke="currentColor" strokeWidth="2" />
                  <line x1="105" y1="30" x2="105" y2="100" stroke="currentColor" strokeWidth="2" />
                  <line x1="65" y1="30" x2="105" y2="30" stroke="#818cf8" strokeWidth="1.5" strokeDasharray="2,2" />
                  <text x="85" y="24" fill="#818cf8" fontSize="10" textAnchor="middle">r = {params.r || 4}</text>
                  <text x="118" y="68" fill="#94a3b8" fontSize="10" textAnchor="middle">h = {params.h || 10}</text>
                </svg>
              )}

              {selectedShape === 'cone' && (
                <svg width="130" height="130" viewBox="0 0 130 130" className="text-indigo-400">
                  <ellipse cx="65" cy="105" rx="45" ry="15" fill="rgba(99,102,241,0.15)" stroke="currentColor" strokeWidth="2" />
                  <line x1="20" y1="105" x2="65" y2="20" stroke="currentColor" strokeWidth="2" />
                  <line x1="110" y1="105" x2="65" y2="20" stroke="currentColor" strokeWidth="2" />
                  <line x1="65" y1="20" x2="65" y2="105" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3,3" />
                  <line x1="65" y1="105" x2="110" y2="105" stroke="#818cf8" strokeWidth="1.5" />
                  <text x="88" y="120" fill="#818cf8" fontSize="10" textAnchor="middle">r = {params.r || 3}</text>
                  <text x="55" y="65" fill="#94a3b8" fontSize="10" textAnchor="middle">h = {params.h || 4}</text>
                </svg>
              )}

              {selectedShape === 'cube' && (
                <svg width="130" height="130" viewBox="0 0 130 130" className="text-indigo-400">
                  <rect x="25" y="45" width="60" height="60" fill="rgba(99,102,241,0.15)" stroke="currentColor" strokeWidth="2" />
                  <rect x="45" y="25" width="60" height="60" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3,3" />
                  <line x1="25" y1="45" x2="45" y2="25" stroke="currentColor" strokeWidth="2" />
                  <line x1="85" y1="45" x2="105" y2="25" stroke="currentColor" strokeWidth="2" />
                  <line x1="25" y1="105" x2="45" y2="85" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3,3" />
                  <line x1="85" y1="105" x2="105" y2="85" stroke="currentColor" strokeWidth="2" />
                  <text x="55" y="118" fill="#818cf8" fontSize="11" textAnchor="middle" fontWeight="bold">a = {params.a || 5}</text>
                </svg>
              )}

              {/* Fallback general icon for other shapes */}
              {!['triangle_right', 'circle', 'sphere', 'cylinder', 'cone', 'cube'].includes(selectedShape) && (
                <div className="p-6 rounded-2xl bg-indigo-950/40 text-indigo-400 border border-indigo-500/20">
                  <Shapes className="w-12 h-12" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Mathematical Formulas, Live Results & Solver Action */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-4 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5 shadow-lg">
            {/* Title & Concept */}
            <div className="border-b border-slate-800 pb-3">
              <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider">
                {tab === '2d' ? 'Geometria Plana' : 'Geometria Espacial'}
              </span>
              <h3 className="text-base sm:text-lg font-black text-white">{calculation.title}</h3>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{calculation.desc}</p>
            </div>

            {/* Results Grid with LaTeX */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Fórmulas & Resultados Passo a Passo
              </h4>
              <div className="grid grid-cols-1 gap-2.5">
                {calculation.results.map((res, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                        {res.label}:
                      </span>
                      <div className="text-sm font-mono text-indigo-200 overflow-x-auto">
                        <MathRenderer math={res.latex} block={false} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Transfer to Master Solver with 1-click */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <button
                type="button"
                onClick={() => onSolveInCalculator(calculation.problemPrompt)}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer active:scale-98"
              >
                <BookOpen className="w-4 h-4" />
                <span>Transferir para Resolução Completa no Caderno</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-[11px] text-center text-slate-500">
                Gera o exercício completo com demonstração teórica e passos detalhados no caderno didático.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
