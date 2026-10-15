/**
 * Engenharia Divergente Academy — Missão Canônica de Referência Técnica
 * MISSÃO: Resistência dos Materiais — Flexão de Vigas
 *
 * Contém os 5 exercícios progressivos canônicos estruturados segundo o schema
 * da Fase 2 e prontos para alimentar tanto o banco de questões quanto o motor de atividades.
 */

import {
  ActivityMissionDefinition,
  ActivityExerciseStudentPayload,
  ActivityExercisePrivateKey,
} from '@/types/activity'

export const BEAM_BENDING_MISSION: ActivityMissionDefinition = {
  id: 'mis-resmat-flexao-01',
  slug: 'resistencia-dos-materiais-flexao-de-vigas',
  trackSlug: 'formacao-continua-introdutoria',
  moduleId: 'mod-2',
  title: 'Resistência dos Materiais: Flexão Pura e Simples de Vigas',
  headline: 'Teoria de Euler-Bernoulli, Tensões Normais e Flechas em Perfis Estruturais',
  description:
    'Missão investigativa completa composta por 5 exercícios progressivos: conceitos fundamentais, dimensionamento elástico, deformação sob flexão, interpretação de diagramas de momento e decisão técnica de projeto.',
  level: 'Intermediário',
  subjectArea: 'Resistência dos Materiais',
  totalExercises: 5,
  estimatedMinutes: 25,
  totalXpReward: 160,
  editorialStatus: 'published',
  isDemo: true,
}

export interface CanonicalMissionExercise {
  studentPayload: ActivityExerciseStudentPayload
  privateKey: ActivityExercisePrivateKey
}

export const BEAM_BENDING_EXERCISES: CanonicalMissionExercise[] = [
  // -------------------------------------------------------------
  // EXERCÍCIO 1: Questão conceitual de múltipla escolha
  // Fórmulas em KaTeX e justificativas para cada alternativa
  // -------------------------------------------------------------
  {
    studentPayload: {
      id: 'ex-bb-01',
      missionId: 'mis-resmat-flexao-01',
      order: 1,
      externalId: 'RESMAT-FLEX-01-CONC',
      title: '1. Hipótese de Navier e Distribuição de Tensões na Seção',
      type: 'single_choice',
      blockType: 'single_choice',
      subjectArea: 'Resistência dos Materiais',
      competencyCode: 'COMP-RESMAT-NAVIER',
      promptMarkdown: `Considere uma viga prismática de material elástico linear, homogêneo e isotrópico submetida a um momento fletor positivo $M_z$ em torno do eixo neutro principal de inércia (hipótese de Euler-Bernoulli).

Pela clássica **Fórmula da Flexão de Navier**:
$$\\sigma_x = -\\frac{M_z \\cdot y}{I_z}$$

Qual das afirmações abaixo expressa **com rigor físico** o comportamento das tensões normais $\\sigma_x$ e a posição da Linha Neutra (LN) na flexão pura simples?`,
      options: [
        {
          id: 'opt-1-a',
          label: 'A',
          textMarkdown:
            'A tensão normal $\\sigma_x$ varia linearmente com a distância vertical $y$ ao centro de gravidade da seção transversal. Na Linha Neutra ($y = 0$), a deformação $\\varepsilon_x$ e a tensão normal $\\sigma_x$ são estritamente nulas.',
        },
        {
          id: 'opt-1-b',
          label: 'B',
          textMarkdown:
            'A tensão normal máxima ocorre no centroide da seção, onde a taxa de variação do momento fletor com relação ao comprimento é máxima ($V = dM/dx$).',
        },
        {
          id: 'opt-1-c',
          label: 'C',
          textMarkdown:
            'A Linha Neutra sempre coincide com a base inferior da viga quando a seção transversal não é simétrica, como em vigas T ou U invertidas.',
        },
        {
          id: 'opt-1-d',
          label: 'D',
          textMarkdown:
            'As fibras acima da Linha Neutra ficam sempre tracionadas sob momento fletor positivo convencional, independentemente da orientação dos eixos de referência adotados.',
        },
      ],
      hints: [
        {
          id: 'hint-1-1',
          textMarkdown:
            'Lembre-se da hipótese cinemática de seções planas: seções que eram planas antes da deformação continuam planas e perpendiculares à linha elástica.',
          xpCost: 5,
        },
      ],
      estimatedSeconds: 180,
      xpRewardBase: 25,
    },
    privateKey: {
      correctOptionIds: ['opt-1-a'],
      explanationMarkdown: `**Resolução Comentada:**
Pela hipótese cinemática de Bernoulli-Navier para vigas delgadas ($L/h \\ge 10$):
1. As seções planas permanecem planas e ortogonais ao eixo fletido, o que implica que a deformação específica longitudinal varia linearmente: $\\varepsilon_x(y) = -\\kappa \\cdot y$, onde $\\kappa = 1/\\rho$ é a curvatura da linha elástica.
2. Pela Lei de Hooke unidimensional ($\\sigma_x = E \\cdot \\varepsilon_x$), a tensão normal também possui distribuição estritamente linear ao longo da altura da seção:
$$\\sigma_x(y) = -\\frac{M_z}{I_z} \\cdot y$$
3. Como a força normal resultante é nula na flexão pura ($\\int_A \\sigma_x \\, dA = 0$), o eixo neutro intercepta exatamente o **centro geométrico de gravidade (CG)** da seção transversal. No plano neutro ($y = 0$), temos $\\sigma_x = 0$ e $\\varepsilon_x = 0$.`,
      distractorRationales: {
        'opt-1-a':
          'CORRETA: A distribuição de deformações e tensões elásticas é estritamente linear em função de y, anulando-se na Linha Neutra centroidal.',
        'opt-1-b':
          'INCORRETA: No centroide ($y = 0$), a tensão normal é zero. O que é máximo no centroide sob flexão simples é a tensão de cisalhamento $\\tau = \\frac{V \\cdot Q}{I \\cdot t}$, não a normal.',
        'opt-1-c':
          'INCORRETA: A Linha Neutra na flexão pura elástica passa sempre pelo Centro de Gravidade (CG) da seção, jamais pela borda inferior externa.',
        'opt-1-d':
          'INCORRETA: Sob momento positivo usual (tração nas fibras inferiores e compressão nas fibras superiores), as fibras superiores sofrem compressão ($\\sigma_x < 0$).',
      },
    },
  },

  // -------------------------------------------------------------
  // EXERCÍCIO 2: Numérico com equações e calculadora integrada
  // Módulo resistente elástico W = I / c e tensão admissível
  // -------------------------------------------------------------
  {
    studentPayload: {
      id: 'ex-bb-02',
      missionId: 'mis-resmat-flexao-01',
      order: 2,
      externalId: 'RESMAT-FLEX-02-NUM',
      title: '2. Dimensionamento Elástico e Módulo Resistente (W)',
      type: 'numeric_response',
      blockType: 'numeric_response',
      subjectArea: 'Resistência dos Materiais',
      competencyCode: 'COMP-RESMAT-SECTION-MOD',
      promptMarkdown: `Uma viga de ponte rolante de seção retangular de madeira laminada com largura $b = 120\\text{ mm}$ e altura $h = 300\\text{ mm}$ está submetida a um momento fletor solicitante máximo de projeto $M_{sd} = 45\\text{ kN}\\cdot\\text{m}$.

**Fórmulas disponíveis:**
- Momento de inércia da seção retangular em torno do eixo baricêntrico:
$$I_z = \\frac{b \\cdot h^3}{12}$$
- Módulo resistente elástico:
$$W_z = \\frac{I_z}{c} = \\frac{b \\cdot h^2}{6}$$
- Tensão máxima de flexão na borda externa ($c = h/2$):
$$\\sigma_{\\max} = \\frac{M_{sd}}{W_z}$$

Calcule a tensão normal máxima atuante $\\sigma_{\\max}$ em **Megapascais (MPa)**. *(Use a calculadora técnica integrada para efetuar as conversões de $45\\text{ kN}\\cdot\\text{m}$ e milímetros).*`,
      numericUnit: 'MPa',
      numericPlaceholder: 'Ex: 25,0',
      hints: [
        {
          id: 'hint-2-1',
          textMarkdown:
            'Atenção às unidades: $1\\text{ kN}\\cdot\\text{m} = 10^3\\text{ N} \\times 10^3\\text{ mm} = 10^6\\text{ N}\\cdot\\text{mm}$. Calcule $W_z$ em $\\text{mm}^3$ para obter a tensão diretamente em $\\text{N/mm}^2 = \\text{MPa}$.',
          xpCost: 5,
        },
      ],
      estimatedSeconds: 240,
      xpRewardBase: 30,
    },
    privateKey: {
      numericExpectedValue: 25.0,
      numericToleranceAbs: 0.5,
      numericToleranceRel: 2.0,
      numericUnit: 'MPa',
      explanationMarkdown: `**Passo a passo do cálculo:**

1. **Cálculo do Módulo Resistente Elástico ($W_z$):**
$$W_z = \\frac{b \\cdot h^2}{6} = \\frac{120\\text{ mm} \\cdot (300\\text{ mm})^2}{6} = \\frac{120 \\cdot 90.000}{6} = 1.800.000\\text{ mm}^3 = 1{,}80 \\times 10^6\\text{ mm}^3$$

2. **Conversão consistente do Momento Fletor:**
$$M_{sd} = 45\\text{ kN}\\cdot\\text{m} = 45 \\times 10^6\\text{ N}\\cdot\\text{mm}$$

3. **Cálculo da Tensão Normal Máxima:**
$$\\sigma_{\\max} = \\frac{M_{sd}}{W_z} = \\frac{45 \\times 10^6\\text{ N}\\cdot\\text{mm}}{1{,}80 \\times 10^6\\text{ mm}^3} = 25{,}00\\text{ N/mm}^2 = 25{,}00\\text{ MPa}$$

Como a madeira possui tensão admissível usual na faixa de 15 a 30 MPa dependendo da classe de resistência (ex: C25/C30), a seção trabalha próxima do limite de projeto.`,
      rubricNotes: 'Resultado esperado: 25,0 MPa. Tolerância absoluta aceita: ±0,5 MPa.',
    },
  },

  // -------------------------------------------------------------
  // EXERCÍCIO 3: Deformação e Flecha Máxima SEM equação visível
  // com dica opcional que reduz XP
  // -------------------------------------------------------------
  {
    studentPayload: {
      id: 'ex-bb-03',
      missionId: 'mis-resmat-flexao-01',
      order: 3,
      externalId: 'RESMAT-FLEX-03-DEF',
      title: '3. Flecha Máxima em Viga Biapoiada sob Carga Uniforme',
      type: 'numeric_response',
      blockType: 'numeric_response',
      subjectArea: 'Resistência dos Materiais',
      competencyCode: 'COMP-RESMAT-DEFLECTION',
      promptMarkdown: `Uma viga de piso simplesmente apoiada de aço estrutural ASTM A36 possui vão teórico $L = 6\\text{ m}$. Ela suporta um carregamento distribuído total de serviço $q = 12\\text{ kN/m}$.

Os dados da viga são:
- Módulo de elasticidade longitudinal do aço: $E = 200\\text{ GPa} = 200.000\\text{ MPa}$
- Momento de inércia da seção transversal fornecido pelo catálogo: $I_z = 5.400\\text{ cm}^4$

Calcule a **flecha máxima** (deslocamento vertical máximo no meio do vão) $\\delta_{\\max}$ em **milímetros (mm)**.

*(A equação diferencial da elástica não está visível nesta etapa. Caso precise, abra a dica técnica opcional — note o custo pedagógico de XP).*`,
      numericUnit: 'mm',
      numericPlaceholder: 'Ex: 11,25',
      hints: [
        {
          id: 'hint-3-1',
          textMarkdown: `**Dica de Equação Analítica:**
Para viga biapoiada com carga uniformemente distribuída $q$ em todo o vão $L$, a flecha máxima no meio ($x = L/2$) é deduzida pela integração da equação da linha elástica ($E I \\frac{d^4 v}{dx^4} = q$):
$$\\delta_{\\max} = \\frac{5 \\cdot q \\cdot L^4}{384 \\cdot E \\cdot I_z}$$

*Atenção à consistência das unidades:*
- $q = 12\\text{ kN/m} = 12\\text{ N/mm}$
- $L = 6.000\\text{ mm}$
- $E = 200.000\\text{ N/mm}^2$
- $I_z = 5.400\\text{ cm}^4 = 5.400 \\times 10^4\\text{ mm}^4 = 54 \\times 10^6\\text{ mm}^4$`,
          xpCost: 8,
        },
      ],
      estimatedSeconds: 300,
      xpRewardBase: 35,
    },
    privateKey: {
      numericExpectedValue: 18.75,
      numericToleranceAbs: 0.4,
      numericToleranceRel: 2.0,
      numericUnit: 'mm',
      explanationMarkdown: `**Resolução Detalhada:**

1. **Conversão para o sistema consistente [N, mm]:**
- Carga: $q = 12\\text{ kN/m} = \\frac{12.000\\text{ N}}{1.000\\text{ mm}} = 12\\text{ N/mm}$
- Vão: $L = 6\\text{ m} = 6.000\\text{ mm}$
- Módulo elástico: $E = 200\\text{ GPa} = 200.000\\text{ MPa} = 200.000\\text{ N/mm}^2$
- Inércia: $I_z = 5.400\\text{ cm}^4 = 5.400 \\times (10\\text{ mm})^4 = 54.000.000\\text{ mm}^4 = 54 \\times 10^6\\text{ mm}^4$

2. **Cálculo dos termos da equação:**
$$L^4 = (6.000)^4 = 1{,}296 \\times 10^{15}\\text{ mm}^4$$
Numerador $= 5 \\cdot q \\cdot L^4 = 5 \\cdot 12 \\cdot (1{,}296 \\times 10^{15}) = 7{,}776 \\times 10^{16}\\text{ N}\\cdot\\text{mm}^4$

Denominador $= 384 \\cdot E \\cdot I_z = 384 \\cdot (2 \\times 10^5) \\cdot (54 \\times 10^6) = 4{,}1472 \\times 10^{15}\\text{ N}\\cdot\\text{mm}^2$

3. **Flecha máxima no centro do vão:**
$$\\delta_{\\max} = \\frac{7{,}776 \\times 10^{16}}{4{,}1472 \\times 10^{15}} = 18{,}75\\text{ mm}$$

4. **Verificação de Estado Limite de Serviço (ELS):**
Conforme NBR 8800 para pisos normais com sobrecargas usuais ($L / 350 = 6000 / 350 \\approx 17{,}14\\text{ mm}$), a flecha de $18{,}75\\text{ mm}$ ultrapassa discretamente o limite de conforto visual, exigindo contra-flecha de fabricação ou perfil de maior rigidez.`,
      rubricNotes: 'Resultado esperado: 18,75 mm. Tolerância aceita: ±0,4 mm.',
    },
  },

  // -------------------------------------------------------------
  // EXERCÍCIO 4: Interpretação estrutural com representação visual
  // Diagrama de Momento Fletor e Ponto de Máxima Solicitação
  // -------------------------------------------------------------
  {
    studentPayload: {
      id: 'ex-bb-04',
      missionId: 'mis-resmat-flexao-01',
      order: 4,
      externalId: 'RESMAT-FLEX-04-VIS',
      title: '4. Interpretação Estrutural de Viga com Carga Concentrada e Balanço',
      type: 'single_choice',
      blockType: 'single_choice',
      subjectArea: 'Resistência dos Materiais',
      competencyCode: 'COMP-RESMAT-DIAGRAMS',
      promptMarkdown: `Observe o esquema estrutural de uma viga contínua apoiada em $A$ (rótula fixa em $x = 0$) e $B$ (apoio móvel em $x = 8\\text{ m}$), com um balanço estendendo-se até $C$ ($x = 10\\text{ m}$).

**Carregamentos aplicados:**
- Carga uniformemente distribuída $q = 10\\text{ kN/m}$ ao longo de todo o vão entre os apoios ($A$ até $B$).
- Força concentrada pontual $P = 20\\text{ kN}$ vertical voltada para baixo aplicada na extremidade livre do balanço ($C$).

\`\`\`
          q = 10 kN/m (uniforme)
    ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓
   ▲======================▲===========• P = 20 kN
   A (x=0)                B (x=8m)    C (x=10m)
   |←------ 8 m ---------→|←-- 2 m --→|
\`\`\`

Qual é o valor e a natureza do **Momento Fletor atuante imediatamente sobre o apoio B ($x = 8\\text{ m}$)** e qual fibra da seção transversal encontra-se tracionada nessa região?`,
      options: [
        {
          id: 'opt-4-a',
          label: 'A',
          textMarkdown:
            'Momento fletor negativo $M_B = -40\\text{ kN}\\cdot\\text{m}$, com tração na fibra SUPERIOR e compressão na fibra INFERIOR da viga.',
        },
        {
          id: 'opt-4-b',
          label: 'B',
          textMarkdown:
            'Momento fletor positivo $M_B = +40\\text{ kN}\\cdot\\text{m}$, com tração na fibra INFERIOR da viga.',
        },
        {
          id: 'opt-4-c',
          label: 'C',
          textMarkdown:
            'Momento fletor nulo ($M_B = 0$), pois apoios móveis nunca transmitem nem desenvolvem momento fletor interno em estruturas contínuas.',
        },
        {
          id: 'opt-4-d',
          label: 'D',
          textMarkdown:
            'Momento fletor negativo $M_B = -20\\text{ kN}\\cdot\\text{m}$, governado unicamente pelo peso próprio do vão adjacente.',
        },
      ],
      hints: [
        {
          id: 'hint-4-1',
          textMarkdown:
            'Considere uma seção transversal cortada imediatamente à esquerda do apoio B e analise o equilíbrio isolado da ponta em balanço (trecho B-C de comprimento 2 m).',
          xpCost: 5,
        },
      ],
      estimatedSeconds: 240,
      xpRewardBase: 35,
    },
    privateKey: {
      correctOptionIds: ['opt-4-a'],
      explanationMarkdown: `**Análise e Resolução Estática:**

1. **Equilíbrio da extremidade em balanço ($x > 8\\text{ m}$):**
Se fizermos um corte em uma seção $x = 8\\text{ m}$ e olharmos apenas para o lado direito da viga (o balanço $BC$ de 2 metros):
- Há apenas a força concentrada descendente $P = 20\\text{ kN}$ no ponto $C$ ($x = 10\\text{ m}$).
- O braço de alavanca até o apoio $B$ é $d = 10 - 8 = 2\\text{ m}$.

2. **Momento Fletor Interno na Seção $B$:**
$$M(B) = -P \\cdot d = -20\\text{ kN} \\times 2\\text{ m} = -40\\text{ kN}\\cdot\\text{m}$$

3. **Interpretação Física das Fibras Tracionadas:**
- Pela convenção de flexão da engenharia estrutural, momentos negativos curvam a viga com concavidade voltada para baixo.
- Isso traciona as fibras **superiores** da viga sobre o apoio intermediário e comprime as fibras inferiores.
- Em concreto armado, esse é o motivo direto para concentrar a armadura longitudinal de tração na parte superior da viga junto aos pilares (apoios).`,
      distractorRationales: {
        'opt-4-a':
          'CORRETA: O balanço de 2 m sob carga de 20 kN gera momento de -40 kN.m no apoio B, estirando a fibra superior.',
        'opt-4-b':
          'INCORRETA: O momento no apoio intermediário causado por balanço carregado é negativo, tracionando a face superior.',
        'opt-4-c':
          'INCORRETA: O apoio B impede translação vertical mas a viga passa contínua por ele. O momento fletor só seria nulo se houvesse uma rótula interna naquele ponto.',
        'opt-4-d':
          'INCORRETA: Erro de multiplicação do braço de alavanca ($20 \\times 2 = 40\\text{ kN}\\cdot\\text{m}$).',
      },
    },
  },

  // -------------------------------------------------------------
  // EXERCÍCIO 5: Decisão de engenharia (Tensão E Deslocamento)
  // Verificação simultânea de ELU e ELS para escolha de perfil
  // -------------------------------------------------------------
  {
    studentPayload: {
      id: 'ex-bb-05',
      missionId: 'mis-resmat-flexao-01',
      order: 5,
      externalId: 'RESMAT-FLEX-05-DEC',
      title: '5. Julgamento Técnico: Verificação Simultânea de Tensão (ELU) e Flecha (ELS)',
      type: 'single_choice',
      blockType: 'single_choice',
      subjectArea: 'Resistência dos Materiais',
      competencyCode: 'COMP-RESMAT-ENG-DECISION',
      promptMarkdown: `Você é o engenheiro responsável por validar a especificação de uma viga biapoiada de mezanino industrial com vão livre $L = 5\\text{ m}$.

**Critérios normativos de segurança:**
1. **Estado Limite Último (ELU — Tensão admissível):**
   A tensão máxima normal atuante $\\sigma_{\\max}$ não pode exceder $\\sigma_{\\text{adm}} = 160\\text{ MPa}$ ($f_y / 1{,}56$).
2. **Estado Limite de Serviço (ELS — Deslocamento máximo):**
   A flecha elástica máxima $\\delta_{\\max}$ em serviço não pode exceder o limite de conforto e acabamento:
   $$\\delta_{\\text{lim}} = \\frac{L}{300} = \\frac{5.000\\text{ mm}}{300} = 16{,}67\\text{ mm}$$

**Solicitações e opções de perfis metálicos I laminados sob análise:**
- Momento fletor de cálculo: $M_{sd} = 68\\text{ kN}\\cdot\\text{m} = 68 \\times 10^6\\text{ N}\\cdot\\text{mm}$
- Carga uniformemente distribuída de serviço: $q = 14\\text{ kN/m} = 14\\text{ N/mm}$
- Aço estrutural ($E = 200.000\\text{ MPa}$)

| Perfil Analisado | Módulo Resistente $W_z$ | Momento Inércia $I_z$ | Peso Linear |
| :--- | :--- | :--- | :--- |
| **Perfil A: W 200 x 22,5** | $W_z = 224\\text{ cm}^3$ | $I_z = 2.229\\text{ cm}^4$ | $22{,}5\\text{ kg/m}$ |
| **Perfil B: W 250 x 28,4** | $W_z = 356\\text{ cm}^3$ | $I_z = 4.450\\text{ cm}^4$ | $28{,}4\\text{ kg/m}$ |
| **Perfil C: W 310 x 32,7** | $W_z = 525\\text{ cm}^3$ | $I_z = 8.150\\text{ cm}^4$ | $32{,}7\\text{ kg/m}$ |

Qual é o **perfil mais leve e econômico** que atende **simultaneamente a AMBOS os critérios (ELU e ELS)**?`,
      options: [
        {
          id: 'opt-5-a',
          label: 'A',
          textMarkdown:
            '**Perfil B (W 250 x 28,4)**: Atende a tensão ($\\sigma = 191\\text{ MPa}$ reprova A; em B dá $\\sigma \\approx 191\\text{ MPa}$ também reprova, logo apenas C atende).',
        },
        {
          id: 'opt-5-b',
          label: 'B',
          textMarkdown:
            '**Perfil B (W 250 x 28,4)**: Atende perfeitamente à tensão com $\\sigma_{\\max} = 140\\text{ MPa} \\le 160\\text{ MPa}$ e à flecha com $\\delta = 12{,}5\\text{ mm} \\le 16{,}67\\text{ mm}$.',
        },
        {
          id: 'opt-5-c',
          label: 'C',
          textMarkdown:
            '**Perfil C (W 310 x 32,7)**: É o único que satisfaz os critérios, pois o Perfil B falha por flecha excessiva de $22{,}3\\text{ mm}$.',
        },
        {
          id: 'opt-5-d',
          label: 'D',
          textMarkdown:
            '**Perfil A (W 200 x 22,5)**: Atende aos dois critérios e deve ser escolhido por ter o menor peso linear de $22{,}5\\text{ kg/m}$.',
        },
      ],
      hints: [
        {
          id: 'hint-5-1',
          textMarkdown:
            '1) Para a tensão: $W_{\\min} = M / \\sigma_{\\text{adm}} = (68 \\times 10^6) / 160 = 425.000\\text{ mm}^3 = 425\\text{ cm}^3$. Verifique se o Perfil B tem $W_z \\ge 425\\text{ cm}^3$ ou se precisa do C.',
          xpCost: 6,
        },
      ],
      estimatedSeconds: 300,
      xpRewardBase: 45,
    },
    privateKey: {
      correctOptionIds: ['opt-5-c'],
      explanationMarkdown: `**Memorial de Cálculo e Julgamento Técnico:**

1. **Verificação do Estado Limite Último (ELU — Tensão):**
Para não ultrapassar $\\sigma_{\\text{adm}} = 160\\text{ MPa}$:
$$W_{z,\\text{mín}} = \\frac{M_{sd}}{\\sigma_{\\text{adm}}} = \\frac{68 \\times 10^6\\text{ N}\\cdot\\text{mm}}{160\\text{ N/mm}^2} = 425.000\\text{ mm}^3 = 425\\text{ cm}^3$$

- **Perfil A:** $W_z = 224\\text{ cm}^3 < 425\\text{ cm}^3 \\implies \\sigma = 68 \\times 10^6 / 224.000 = 303{,}6\\text{ MPa}$ ❌ **REPROVADO POR TENSÃO**
- **Perfil B:** $W_z = 356\\text{ cm}^3 < 425\\text{ cm}^3 \\implies \\sigma = 68 \\times 10^6 / 356.000 = 191{,}0\\text{ MPa} > 160\\text{ MPa}$ ❌ **REPROVADO POR TENSÃO**
- **Perfil C:** $W_z = 525\\text{ cm}^3 > 425\\text{ cm}^3 \\implies \\sigma = 68 \\times 10^6 / 525.000 = 129{,}5\\text{ MPa} \\le 160\\text{ MPa}$ ✅ **APROVADO POR TENSÃO**

2. **Verificação do Estado Limite de Serviço (ELS — Flecha):**
Limite admissível: $\\delta_{\\text{lim}} = L / 300 = 16{,}67\\text{ mm}$.
Para o **Perfil C** ($I_z = 8.150\\text{ cm}^4 = 81{,}5 \\times 10^6\\text{ mm}^4$):
$$\\delta_{\\max} = \\frac{5 \\cdot q \\cdot L^4}{384 \\cdot E \\cdot I_z} = \\frac{5 \\cdot 14 \\cdot (5.000)^4}{384 \\cdot 200.000 \\cdot (81{,}5 \\times 10^6)} = \\frac{43{,}75 \\times 10^{15}}{6{,}2592 \\times 10^{15}} \\approx 6{,}99\\text{ mm} \\le 16{,}67\\text{ mm}$$ ✅ **APROVADO POR RIGIDEZ**

**Conclusão de Engenharia:**
O **Perfil C (W 310 x 32,7)** é o menor perfil laminado da série capaz de suportar o momento fletor sem entrar em escoamento ou violar a margem de segurança normativa. O Perfil B, embora mais leve, sofre sobredimensionamento de tensão (191 MPa > 160 MPa).`,
      distractorRationales: {
        'opt-5-a':
          'INCORRETA: O texto confunde a conclusão; a alternativa C é a afirmação técnica correta.',
        'opt-5-b':
          'INCORRETA: O Perfil B tem W = 356 cm³, o que gera tensão de 191 MPa (reprovado frente a 160 MPa).',
        'opt-5-c':
          'CORRETA: Apenas o Perfil C tem módulo resistente W >= 425 cm³ para manter a tensão abaixo de 160 MPa, cumprindo também com folga o critério de flecha.',
        'opt-5-d':
          'INCORRETA: O Perfil A tem tensão de 303 MPa, ultrapassando amplamente o limite admissível.',
      },
    },
  },
]
