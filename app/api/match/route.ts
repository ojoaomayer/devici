import { NextResponse } from 'next/server'
import { openai } from '@/lib/openai'
import { searchSinapiItem } from '@/lib/sinapi-search'
import { searchSecidItem } from '@/lib/secid-search'
import { auth, db } from '@/lib/firebase-admin'

// Rate Limiting em memória (por usuário)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_MAX = 50; // max requisições por minuto
const RATE_LIMIT_WINDOW = 60 * 1000;

// Next.js route segment config — allow up to 5 minutes for large spreadsheets
export const maxDuration = 300

async function processItem(
  item: any,
  filter_uf: string,
  modoOrcamento: 'execucao' | 'projetos' = 'execucao'
) {
  const isProjetos = modoOrcamento === 'projetos'

  // 1. Search items based on scope
  const searchResult = isProjetos
    ? searchSecidItem(item, 5)
    : searchSinapiItem(item, filter_uf, 5)

  const baseName = isProjetos ? 'SECID/PR' : 'SINAPI'

  if (!searchResult.candidates || searchResult.candidates.length === 0) {
    return {
      original: item,
      match: null,
      candidates: [],
      judgment: {
        status: 'baixo',
        match_score: 0,
        justificativa: `Nenhuma correspondência encontrada na base ${baseName}.`,
      },
    }
  }

  // If direct code match, return immediately
  if (searchResult.match && searchResult.match.match_score === 100 && item.codigo_usuario) {
    return {
      original: item,
      match: searchResult.match,
      candidates: searchResult.candidates,
      judgment: searchResult.judgment,
      via: 'codigo_direto',
    }
  }

  const candidates = searchResult.candidates
  const defaultMatch = searchResult.match

  // 2. Build domain-specific prompt for AI judgment
  const prompt = isProjetos
    ? `
Você é um Engenheiro Civil e Orçamentista especialista na base SECID/PR (Secretaria das Cidades do Paraná - Tabela de Serviços Técnicos e Elaboração de Projetos - Resolução 094/2026).
Seu objetivo é analisar um item da planilha do usuário e escolher a melhor correspondência (match) entre as 5 opções candidatas da base SECID/PR fornecidas.

CRITÉRIOS TÉCNICOS RÍGIDOS PARA PROJETOS & SERVIÇOS TÉCNICOS:
- Os itens a serem correlacionados são escopos de elaboração de projetos (arquitetura, estrutura de concreto armado, metálica, madeira, fundações, instalações prediais elétricas, hidrossanitárias, gases, prevenção contra incêndio PPCI, climatização HVAC, fotovoltaico), compatibilização BIM, memoriais descritivos, ARTs/RRTs, laudos periciais, levantamentos topográficos, ensaios e sondagens geológicas SPT, bem como honorários/consultorias técnicas.
- Respeite as métricas e unidades da SECID/PR: área construída de projeto em m², furos de sondagem, ensaios, diárias/horas técnicas de profissionais ou valor fixo/mínimo por projeto (un).
- Verifique a compatibilidade de escopo e unidade de medida.
- Se não houver correspondência minimamente adequada, o status deve ser "baixo" e o match_codigo deve ser null.

Item do Usuário:
Descrição: ${item.descricao}
Unidade: ${item.unidade || 'N/A'}
Quantidade: ${item.quantidade}

Candidatos SECID/PR:
${candidates.map((c: any, i: number) => `[Candidato ${i + 1}] Código: ${c.codigo} | Descrição: ${c.descricao} | Unidade: ${c.unidade} | R$ ${c.custo_nao_desonerado}`).join('\n')}

Retorne APENAS um JSON válido seguindo a exata estrutura abaixo, sem marcações markdown:
{
  "matched_codigo": "codigo_do_candidato_escolhido_ou_null",
  "match_score": 85,
  "justificativa": "Sua justificativa técnica de engenharia de projetos",
  "status": "alto"
}
`
    : `
Você é um Engenheiro Civil orçamentista sênior especialista na base SINAPI.
Seu objetivo é analisar um item da planilha do usuário e escolher a melhor correspondência (match) entre as 5 opções candidatas da base SINAPI fornecidas.

CRITÉRIOS TÉCNICOS RÍGIDOS:
- Avalie a similaridade de materiais, dimensões, produtividade e processo executivo.
- Verifique a compatibilidade de unidade de medida (ex: se o usuário quer m², a opção em m³ é incompatível).
- Se não houver correspondência minimamente adequada, o status deve ser "baixo" e o match_codigo deve ser nulo.

Item do Usuário:
Descrição: ${item.descricao}
Unidade: ${item.unidade || 'N/A'}
Quantidade: ${item.quantidade}

Candidatos SINAPI:
${candidates.map((c: any, i: number) => `[Candidato ${i + 1}] Código: ${c.codigo} | Descrição: ${c.descricao} | Unidade: ${c.unidade} | R$ ${c.custo_nao_desonerado}`).join('\n')}

Retorne APENAS um JSON válido seguindo a exata estrutura abaixo, sem marcações markdown:
{
  "matched_codigo": "codigo_do_candidato_escolhido_ou_null",
  "match_score": 85,
  "justificativa": "Sua justificativa técnica de engenharia",
  "status": "alto"
}
`

  let judgment: any = null

  try {
    const aiResponse = await openai.chat.completions.create({
      model: 'gemini-3.6-flash',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    })
    judgment = JSON.parse(aiResponse.choices[0].message.content || '{}')
  } catch (error: any) {
    console.warn(`AI Judgment unavailable (${error.status || error.message}), using best candidate ranking:`, error.message?.slice(0, 100))
  }

  // If AI selected a valid candidate, use it
  if (judgment && judgment.matched_codigo) {
    const aiSelected = candidates.find((c: any) => String(c.codigo) === String(judgment.matched_codigo))
    if (aiSelected) {
      return {
        original: item,
        match: {
          ...aiSelected,
          ...judgment,
        },
        candidates,
        judgment,
      }
    }
  }

  // Fallback: If AI is in 429 quota limit or couldn't pick, use the top candidate with local justification
  const fallbackMatch = defaultMatch || candidates[0]
  const fallbackStatus = (defaultMatch as any)?.status || (fallbackMatch?.match_score >= 70 ? 'alto' : fallbackMatch?.match_score >= 45 ? 'medio' : 'baixo')
  const fallbackJustificativa = (defaultMatch as any)?.justificativa || `Melhor correspondência técnica encontrada no banco ${baseName} (${fallbackMatch?.match_score || 0}% similaridade).`

  const fallbackJudgment = {
    matched_codigo: fallbackMatch?.codigo,
    match_score: fallbackMatch?.match_score || 70,
    status: fallbackStatus,
    justificativa: fallbackJustificativa,
  }

  return {
    original: item,
    match: fallbackMatch ? { ...fallbackMatch, ...fallbackJudgment } : null,
    candidates,
    judgment: fallbackJudgment,
  }
}

export async function POST(request: Request) {
  try {
    // 1. Autenticação Obrigatória
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
    const userId = decodedToken.uid;

    // 2. Rate Limiting / Anti-Abuso
    const now = Date.now();
    const rateData = rateLimitMap.get(userId) || { count: 0, lastReset: now };
    if (now - rateData.lastReset > RATE_LIMIT_WINDOW) {
      rateData.count = 0;
      rateData.lastReset = now;
    }
    if (rateData.count >= RATE_LIMIT_MAX) {
      return NextResponse.json({ error: 'Rate limit excedido. Tente novamente em instantes.' }, { status: 429 });
    }
    rateData.count++;
    rateLimitMap.set(userId, rateData);

    // 3. Verificação de Limite de Plano
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      const isUnlimited =
        userData?.plano === 'pro' ||
        userData?.plano === 'construtora' ||
        (userData?.planilhas_limite && userData.planilhas_limite >= 999);

      if (!isUnlimited && (userData?.planilhas_usadas || 0) >= (userData?.planilhas_limite || 1)) {
        return NextResponse.json({ error: 'Limite de planilhas excedido para o plano atual.' }, { status: 403 });
      }
    }

    const { items, filter_uf = 'PR', modoOrcamento = 'execucao' } = await request.json()

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Invalid items array' }, { status: 400 })
    }

    // 4. Validação e Sanitização (Anti CSV/Formula Injection)
    const sanitizedItems = items.map((item: any) => {
      let desc = typeof item.descricao === 'string' ? item.descricao : String(item.descricao || '');
      // Escapa formulas maliciosas se a string iniciar com caractere de controle do Excel/CSV
      if (['=', '+', '-', '@'].includes(desc.charAt(0))) {
        desc = "'" + desc;
      }
      return { ...item, descricao: desc };
    });

    const safeModo: 'execucao' | 'projetos' = modoOrcamento === 'projetos' ? 'projetos' : 'execucao'
    const safeUf = safeModo === 'projetos' ? 'PR' : (filter_uf || 'PR')

    const BATCH_SIZE = 10
    const results: any[] = []

    for (let i = 0; i < sanitizedItems.length; i += BATCH_SIZE) {
      const batch = sanitizedItems.slice(i, i + BATCH_SIZE)
      console.log(`Processing [${safeModo.toUpperCase()}] items ${i + 1}–${Math.min(i + BATCH_SIZE, sanitizedItems.length)} of ${sanitizedItems.length}...`)
      const batchResults = await Promise.all(batch.map((item: any) => processItem(item, safeUf, safeModo)))
      results.push(...batchResults)
    }

    return NextResponse.json({ results, modoOrcamento: safeModo, uf: safeUf })
  } catch (error: any) {
    console.error('Match API Error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
