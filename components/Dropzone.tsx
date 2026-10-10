'use client'

import { useState } from 'react'
import * as xlsx from 'xlsx'
import { UploadCloud, FileSpreadsheet, Settings, Hash, Tag, Layers, RefreshCw, FileText, ShieldCheck, Database, Zap, CheckCircle2, Lock } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import ScopeSelector, { type ModoOrcamento } from './ScopeSelector'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type DropzoneProps = {
  onProcess: (data: any[], config: { uf: string; desonerado: boolean; modoOrcamento: ModoOrcamento }) => void
  isLoading: boolean
  initialModo?: ModoOrcamento
  onModoChange?: (modo: ModoOrcamento) => void
}

interface ParsedSheetInfo {
  headerRowIndex: number
  columns: string[]
  rows: any[]
}

function analyzeGridData(rawGrid: any[][]): ParsedSheetInfo {
  if (!rawGrid || rawGrid.length === 0) return { headerRowIndex: 0, columns: [], rows: [] }

  let bestRowIdx = 0
  let maxScore = -1

  for (let i = 0; i < Math.min(40, rawGrid.length); i++) {
    const row = rawGrid[i]
    if (!row || !Array.isArray(row)) continue

    let score = 0
    const rowText = row.map(c => String(c || '').toLowerCase().trim()).join(' ')

    if (rowText.includes('descri') || rowText.includes('serviço') || rowText.includes('servico') || rowText.includes('discriminacao')) score += 5
    if (rowText.includes('qtd') || rowText.includes('quant')) score += 4
    if (rowText.includes('unid') || rowText.includes('medida')) score += 3
    if (rowText.includes('codigo') || rowText.includes('código') || rowText.includes('cod')) score += 3
    if (rowText.includes('item') || rowText.includes('preco') || rowText.includes('preço') || rowText.includes('custo')) score += 2

    const textCells = row.filter(c => typeof c === 'string' && c.trim().length > 0).length
    score += textCells

    if (score > maxScore) {
      maxScore = score
      bestRowIdx = i
    }
  }

  const rawHeaders = rawGrid[bestRowIdx] || []
  const columns: string[] = []
  const colCounts: Record<string, number> = {}

  rawHeaders.forEach((h, colIdx) => {
    let name = String(h || '').trim()
    if (!name) name = `Coluna_${colIdx + 1}`
    if (colCounts[name]) {
      colCounts[name]++
      name = `${name}_${colCounts[name]}`
    } else {
      colCounts[name] = 1
    }
    columns.push(name)
  })

  const rows: any[] = []
  for (let r = bestRowIdx + 1; r < rawGrid.length; r++) {
    const row = rawGrid[r]
    if (!row || row.length === 0) continue
    const obj: Record<string, any> = {}
    let hasAnyValue = false
    columns.forEach((colName, cIdx) => {
      const val = row[cIdx]
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        hasAnyValue = true
        obj[colName] = val
      }
    })
    if (hasAnyValue) {
      rows.push(obj)
    }
  }

  return { headerRowIndex: bestRowIdx, columns, rows }
}

function autoSelectColumns(cols: string[]) {
  const normCols = cols.map(c => ({ original: c, norm: c.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') }))

  let desc = ''
  let qtd = ''
  let code = ''
  let unid = ''
  let name = ''

  for (const c of normCols) {
    if (c.norm.includes('descricao do servico') || c.norm.includes('descricao do insumo') || c.norm.includes('discriminacao') || c.norm.includes('descricao do projeto')) {
      desc = c.original; break
    }
  }
  if (!desc) {
    for (const c of normCols) {
      if (c.norm.includes('descricao') || c.norm.includes('servico') || c.norm.includes('projeto') || c.norm.includes('disciplina') || c.norm.includes('especificacao')) {
        desc = c.original; break
      }
    }
  }
  if (!desc) {
    for (const c of normCols) {
      if (c.norm.includes('item') && !c.norm.includes('codigo')) {
        desc = c.original; break
      }
    }
  }

  for (const c of normCols) {
    if (c.norm === 'qtd' || c.norm === 'quantidade' || c.norm === 'quant') {
      qtd = c.original; break
    }
  }
  if (!qtd) {
    for (const c of normCols) {
      if (c.norm.includes('qtd') || c.norm.includes('quant') || c.norm.includes('qte')) {
        qtd = c.original; break
      }
    }
  }

  for (const c of normCols) {
    if (
      c.norm.includes('codigo do servico') ||
      c.norm.includes('codigo do insumo') ||
      c.norm.includes('codigo sinapi') ||
      c.norm.includes('cod. sinapi') ||
      c.norm.includes('codigo secid') ||
      c.norm.includes('item resolucao')
    ) {
      code = c.original; break
    }
  }
  if (!code) {
    for (const c of normCols) {
      if (c.norm === 'codigo' || c.norm === 'cod' || c.norm.includes('codigo') || c.norm.includes('sinapi') || c.norm.includes('secid')) {
        code = c.original; break
      }
    }
  }

  for (const c of normCols) {
    if (c.norm.includes('unidade de medida') || c.norm.includes('unid. medida') || c.norm === 'unidade' || c.norm === 'unid' || c.norm === 'un') {
      unid = c.original; break
    }
  }
  if (!unid) {
    for (const c of normCols) {
      if (c.norm.includes('unid') || c.norm.includes('medida')) {
        unid = c.original; break
      }
    }
  }

  for (const c of normCols) {
    if (c.norm.includes('nome') || c.norm.includes('subitem') || c.norm.includes('titulo') || c.norm.includes('etapa')) {
      name = c.original; break
    }
  }

  return { desc, qtd, code, unid, name }
}

export default function Dropzone({ onProcess, isLoading, initialModo = 'execucao', onModoChange }: DropzoneProps) {
  const [modoOrcamento, setModoOrcamento] = useState<ModoOrcamento>(initialModo)
  const [dragActive, setDragActive] = useState(false)
  
  const [workbook, setWorkbook] = useState<xlsx.WorkBook | null>(null)
  const [sheetNames, setSheetNames] = useState<string[]>([])
  const [selectedSheet, setSelectedSheet] = useState<string>('')
  
  const [fileData, setFileData] = useState<any[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [headerRow, setHeaderRow] = useState<number>(1)
  
  const [descCol, setDescCol] = useState<string>('')
  const [codeCol, setCodeCol] = useState<string>('')
  const [nameCol, setNameCol] = useState<string>('')
  const [qtdCol, setQtdCol] = useState<string>('')
  const [unidCol, setUnidCol] = useState<string>('')
  
  const [uf, setUf] = useState<string>(initialModo === 'projetos' ? 'PR' : 'PR')
  const [desonerado, setDesonerado] = useState<boolean>(false)

  const handleModoChange = (newModo: ModoOrcamento) => {
    setModoOrcamento(newModo)
    if (newModo === 'projetos') {
      setUf('PR')
    }
    if (onModoChange) onModoChange(newModo)
  }

  const loadSheet = (wb: xlsx.WorkBook, sheetName: string) => {
    const ws = wb.Sheets[sheetName]
    if (!ws) return

    const rawGrid = xlsx.utils.sheet_to_json(ws, { header: 1 }) as any[][]
    const { headerRowIndex, columns: cols, rows } = analyzeGridData(rawGrid)
    setColumns(cols)
    setFileData(rows)
    setHeaderRow(headerRowIndex + 1)
    setSelectedSheet(sheetName)

    const auto = autoSelectColumns(cols)
    setDescCol(auto.desc)
    setCodeCol(auto.code)
    setNameCol(auto.name)
    setQtdCol(auto.qtd)
    setUnidCol(auto.unid)
  }

  const handleFile = async (file: File) => {
    const isPdf = file.name.toLowerCase().endsWith('.pdf')

    if (isPdf) {
      try {
        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch('/api/parse-pdf', {
          method: 'POST',
          body: formData,
        })
        let data: any = null
        try {
          const text = await res.text()
          data = text ? JSON.parse(text) : {}
        } catch {
          data = {}
        }

        if (!res.ok) {
          throw new Error(data.error || 'Erro ao processar o arquivo PDF. Verifique se o arquivo não está corrompido.')
        }

        const { grid } = data
        if (!grid || grid.length === 0) {
          throw new Error('Nenhum dado encontrado no PDF')
        }

        const { headerRowIndex, columns: cols, rows } = analyzeGridData(grid)
        setColumns(cols)
        setFileData(rows)
        setHeaderRow(headerRowIndex + 1)
        setSelectedSheet('PDF_Importado')
        setSheetNames(['PDF_Importado'])
        
        const auto = autoSelectColumns(cols)
        setDescCol(auto.desc)
        setCodeCol(auto.code)
        setNameCol(auto.name)
        setQtdCol(auto.qtd)
        setUnidCol(auto.unid)
      } catch (err: any) {
        console.error(err)
        alert(err.message || 'Erro ao importar PDF.')
      }
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result
        const wb = xlsx.read(buffer, { type: 'array' })
        setWorkbook(wb)
        setSheetNames(wb.SheetNames)

        let targetSheet = wb.SheetNames[0]
        for (const s of wb.SheetNames) {
          const sLower = s.toLowerCase()
          if (sLower.includes('orcamento') || sLower.includes('planilha') || sLower.includes('servico') || sLower.includes('itens')) {
            targetSheet = s
            break
          }
        }

        loadSheet(wb, targetSheet)
      } catch (err: any) {
        console.error('Error parsing spreadsheet file:', err)
        alert('Erro ao abrir o arquivo. Verifique se o formato é válido.')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const handleSheetChange = (newSheet: string) => {
    if (!workbook) return
    loadSheet(workbook, newSheet)
  }

  const onDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleProcess = () => {
    if (!descCol) {
      alert('Selecione ao menos a coluna de Descrição do Serviço.')
      return
    }
    
    const mappedData = fileData
      .map((row, index) => {
        const desc = nameCol ? (row[nameCol] || row[descCol]) : row[descCol]
        const rawQtd = qtdCol ? row[qtdCol] : 1
        const cleanQtd = typeof rawQtd === 'number' ? rawQtd : parseFloat(String(rawQtd || '1').replace(',', '.')) || 1
        const code = codeCol ? String(row[codeCol] || '').replace(/[^0-9]/g, '') : ''

        return {
          id: index,
          descricao: String(desc || '').trim(),
          descricao_original: String(row[descCol] || '').trim(),
          codigo_usuario: code,
          quantidade: cleanQtd,
          unidade: unidCol ? String(row[unidCol] || '').trim() : '',
        }
      })
      .filter(item => item.descricao && item.descricao.length >= 3 && item.descricao !== '-' && item.descricao !== 'undefined')

    if (mappedData.length === 0) {
      alert('Nenhum item válido encontrado na aba selecionada.')
      return
    }

    onProcess(mappedData, {
      uf: modoOrcamento === 'projetos' ? 'PR' : uf,
      desonerado,
      modoOrcamento,
    })
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* 1. Seletor de Escopo Interativo */}
      <ScopeSelector
        value={modoOrcamento}
        onChange={handleModoChange}
        disabled={isLoading}
      />

      {!fileData.length && !workbook ? (
        <div className="space-y-4">
          <div
            className={cn(
              "relative flex flex-col items-center justify-center p-12 sm:p-16 rounded-2xl transition-all duration-300 glass-panel blueprint-box overflow-hidden",
              dragActive
                ? modoOrcamento === 'projetos'
                  ? "border-cyan-500 bg-cyan-950/20 shadow-[0_0_30px_rgba(6,182,212,0.25)]"
                  : "border-blue-500 bg-blue-950/20 shadow-[0_0_30px_rgba(59,130,246,0.25)]"
                : "hover:border-white/20 hover:bg-slate-900/50"
            )}
            onDragEnter={onDrag}
            onDragLeave={onDrag}
            onDragOver={onDrag}
            onDrop={onDrop}
          >
            {/* Background Glow */}
            <div className="absolute inset-0 bg-radial-subtle pointer-events-none opacity-40" />

            <div
              className={cn(
                "relative w-14 h-14 rounded-2xl border flex items-center justify-center mb-4 transition-all",
                modoOrcamento === 'projetos'
                  ? "bg-gradient-to-b from-cyan-500/20 to-cyan-950/40 border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                  : "bg-gradient-to-b from-blue-500/20 to-blue-950/40 border-blue-500/30 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
              )}
            >
              <UploadCloud className="w-7 h-7" />
            </div>

            <h3 className="text-base font-semibold text-white tracking-tight">
              {modoOrcamento === 'projetos'
                ? 'Importar Planilha de Projetos & Serviços Técnicos'
                : 'Importar Planilha de Execução de Obras'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 mb-6 text-center max-w-md">
              Arraste seu arquivo ou selecione do computador. Compatível com <span className="text-slate-300 font-mono">.pdf, .xlsx, .xls</span> e <span className="text-slate-300 font-mono">.csv</span>.
            </p>

            <label className="cursor-pointer btn-primary px-6 py-2.5 text-xs font-semibold shadow-[0_0_20px_rgba(255,255,255,0.15)] flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-slate-950" />
              <span>Selecionar Arquivo</span>
              <input 
                type="file" 
                className="hidden" 
                accept=".pdf,.xlsx,.xls,.xlsm,.csv,.ods" 
                onChange={(e) => e.target.files && handleFile(e.target.files[0])}
              />
            </label>
          </div>

          {/* Micro-indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-[11px] text-slate-400">
            <div className="glass-card p-3 rounded-lg flex items-center gap-2.5">
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  modoOrcamento === 'projetos' ? "bg-cyan-400 neon-dot-blue" : "bg-blue-400 neon-dot-blue"
                )}
              />
              <span>{modoOrcamento === 'projetos' ? 'Base SECID/PR Sincronizada' : 'Base SINAPI Sincronizada'}</span>
            </div>
            <div className="glass-card p-3 rounded-lg flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 neon-dot-emerald" />
              <span>{modoOrcamento === 'projetos' ? 'Resolução SECID nº 094/2026' : 'Processamento Vetorial Local'}</span>
            </div>
            <div className="glass-card p-3 rounded-lg flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 neon-dot-blue" />
              <span>Proteção e Sigilo de Dados</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl p-6 sm:p-7 space-y-6 blueprint-box">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <FileText className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white tracking-tight">Mapeamento de Planilha</h2>
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  {fileData.length} linhas detectadas • Linha {headerRow} como cabeçalho
                </div>
              </div>
            </div>

            {/* Sheet Selector */}
            {sheetNames.length > 1 && (
              <div className="flex items-center gap-2 glass-pill px-3 py-1.5 rounded-full">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[11px] font-medium text-slate-400">Aba:</span>
                <select
                  value={selectedSheet}
                  onChange={e => handleSheetChange(e.target.value)}
                  className="bg-transparent text-white font-mono text-xs focus:outline-none cursor-pointer"
                >
                  {sheetNames.map(s => (
                    <option key={s} value={s} className="bg-[#0b132b] text-white">{s}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Mapping Grid */}
          <div className="space-y-4">
            <div className="text-[11px] font-mono uppercase tracking-wider text-blue-400 font-semibold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 neon-dot-blue" />
              <span>Correspondência de Colunas</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 bg-[#0b132b]/40 p-4 rounded-xl border border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-200">Descrição do Serviço / Insumo *</label>
                  <span className="text-[10px] text-blue-400 font-mono bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/20">Obrigatório</span>
                </div>
                <select 
                  value={descCol} onChange={e => setDescCol(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-white/10 bg-[#030712]/80 text-white text-xs font-mono focus:border-blue-500/50 outline-none transition-colors"
                >
                  <option value="">Selecione a coluna...</option>
                  {columns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="space-y-2 bg-[#0b132b]/40 p-4 rounded-xl border border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-200">Quantidade</label>
                  <span className="text-[10px] text-slate-400 font-mono">Padrão: 1</span>
                </div>
                <select 
                  value={qtdCol} onChange={e => setQtdCol(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-white/10 bg-[#030712]/80 text-white text-xs font-mono focus:border-blue-500/50 outline-none transition-colors"
                >
                  <option value="">Não especificada (assume 1)</option>
                  {columns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 bg-[#0b132b]/40 p-4 rounded-xl border border-white/[0.06]">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-blue-400" /> Código SINAPI (Opcional)
                </label>
                <select 
                  value={codeCol} onChange={e => setCodeCol(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-white/10 bg-[#030712]/80 text-white text-xs font-mono focus:border-blue-500/50 outline-none transition-colors"
                >
                  <option value="">Não usar</option>
                  {columns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="space-y-2 bg-[#0b132b]/40 p-4 rounded-xl border border-white/[0.06]">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-cyan-400" /> Nome do Item (Opcional)
                </label>
                <select 
                  value={nameCol} onChange={e => setNameCol(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-white/10 bg-[#030712]/80 text-white text-xs font-mono focus:border-blue-500/50 outline-none transition-colors"
                >
                  <option value="">Não usar</option>
                  {columns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="space-y-2 bg-[#0b132b]/40 p-4 rounded-xl border border-white/[0.06]">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" /> Unidade (Opcional)
                </label>
                <select 
                  value={unidCol} onChange={e => setUnidCol(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-white/10 bg-[#030712]/80 text-white text-xs font-mono focus:border-blue-500/50 outline-none transition-colors"
                >
                  <option value="">Não usar</option>
                  {columns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Regional Settings Bar */}
          <div className="bg-[#0b132b]/50 border border-white/[0.08] p-4 rounded-xl flex flex-wrap gap-4 items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300 font-medium">
              <Settings className={cn("w-4 h-4", modoOrcamento === 'projetos' ? "text-cyan-400" : "text-blue-400")} />
              <span>
                {modoOrcamento === 'projetos'
                  ? 'Parâmetros Oficiais SECID/PR (Res. 094/2026):'
                  : 'Parâmetros Regionais SINAPI:'}
              </span>
            </div>

            <div className="flex items-center gap-4">
              {modoOrcamento === 'projetos' ? (
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-mono">Estado:</span>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 font-mono font-bold text-xs shadow-[0_0_10px_rgba(6,182,212,0.15)]">
                    <Lock className="w-3 h-3 text-cyan-400" />
                    <span>PR (Paraná)</span>
                  </div>
                  <span className="text-[10px] text-cyan-400/80 font-mono hidden sm:inline">• Base Estadual Fixada</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-mono">Estado:</span>
                  <select 
                    value={uf} onChange={e => setUf(e.target.value)}
                    className="p-1.5 rounded-lg bg-[#030712] border border-white/15 text-white font-mono font-bold text-xs focus:outline-none"
                  >
                    <option value="PR">PR</option>
                    <option value="SP">SP</option>
                    <option value="RJ">RJ</option>
                    <option value="SC">SC</option>
                    <option value="MG">MG</option>
                    <option value="RS">RS</option>
                    <option value="BA">BA</option>
                    <option value="DF">DF</option>
                    <option value="GO">GO</option>
                    <option value="PE">PE</option>
                    <option value="CE">CE</option>
                  </select>
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-mono">Regime:</span>
                <select 
                  value={desonerado ? 'deson' : 'nao_deson'} 
                  onChange={e => setDesonerado(e.target.value === 'deson')}
                  className="p-1.5 rounded-lg bg-[#030712] border border-white/15 text-white text-xs focus:outline-none"
                >
                  <option value="nao_deson">Não Desonerado</option>
                  <option value="deson">Desonerado</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex justify-between items-center pt-2">
            <button 
              onClick={() => {
                setFileData([])
                setWorkbook(null)
                setSheetNames([])
                setSelectedSheet('')
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-slate-400 hover:text-white text-xs transition-colors rounded-full hover:bg-white/[0.04]"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Cancelar
            </button>

            <button 
              onClick={handleProcess}
              disabled={!descCol || isLoading}
              className="btn-primary px-6 py-2.5 text-xs font-semibold disabled:opacity-40 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>
                    {modoOrcamento === 'projetos' ? 'Cruzando com SECID/PR...' : 'Cruzando com SINAPI...'}
                  </span>
                </>
              ) : (
                <>
                  <span>
                    {modoOrcamento === 'projetos' ? 'Executar Orçamento de Projetos' : 'Executar Orçamento'}
                  </span>
                  <Zap className="w-3.5 h-3.5 text-slate-950 fill-current" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
