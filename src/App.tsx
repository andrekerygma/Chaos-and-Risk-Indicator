/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Activity, 
  BarChart3, 
  Clock,
  RefreshCw,
  Info
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { getMarketData, fetchMarketAnalysis, MarketData } from './services/marketService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [data, setData] = useState<MarketData | null>(null);
  const [summary, setSummary] = useState<string>('');
  const [historicalSummary, setHistoricalSummary] = useState<string>('');
  const [analysis, setAnalysis] = useState<string>('');
  const [historicalAnalysis, setHistoricalAnalysis] = useState<string>('');
  const [humanStatus, setHumanStatus] = useState<{ 
    climate: string, 
    impact: string, 
    action: string,
    chaosLevel: number,
    trend: 'up' | 'down' | 'stable'
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const marketData = await getMarketData();
      setData(marketData);
      
      const summaryPrompt = `
        Com base nestes dados:
        Ouro: $${marketData.gold.current}
        Petróleo: $${marketData.oil.current}
        Gás Natural: $${marketData.naturalGas.current}
        Cobre: $${marketData.copper.current}
        Soja: $${marketData.soybeans.current}
        Yields: ${marketData.yields.current}%
        VIX (Medo): ${marketData.vix.current}
        DXY (Dólar): ${marketData.dxy.current}
        
        Gere um RESUMO EXECUTIVO de 2 frases curtas e simples para quem não entende de mercado.
        Frase 1: O que está acontecendo agora no mundo das commodities e risco.
        Frase 2: O que isso significa para o custo de vida e investimentos das pessoas.
      `;

      const statusPrompt = `
        Com base nos dados de mercado (Ouro: $${marketData.gold.current}, Petróleo: $${marketData.oil.current}, Gás: $${marketData.naturalGas.current}, Metais: ${marketData.copper.current}, Grãos: ${marketData.soybeans.current}, VIX: ${marketData.vix.current}, DXY: ${marketData.dxy.current}),
        gere um diagnóstico de "Realidade" para um leigo:
        1. Clima Global (ex: "Tenso", "Calmo", "Incerteza")
        2. Impacto no Bolso (ex: "Alimentos podem subir", "Energia mais cara", "Preços estáveis")
        3. Ação Recomendada (ex: "Poupe dinheiro", "Diversifique", "Mantenha a calma")
        4. Nível de Caos (um número de 0 a 100, onde 0 é paz total e 100 é colapso sistêmico)
        5. Tendência (escolha entre: "up", "down", "stable")
        
        Retorne APENAS um JSON:
        { 
          "climate": "texto", 
          "impact": "texto", 
          "action": "texto", 
          "chaosLevel": número, 
          "trend": "up" | "down" | "stable" 
        }
      `;

      const analysisPrompt = `
        Analise os seguintes dados de mercado e forneça um relatório CLARO e CONTEXTUALIZADO com eventos globais atuais:
        - Energia: Petróleo $${marketData.oil.current}, Gás Natural $${marketData.naturalGas.current}, Carvão $${marketData.coal.current}
        - Metais: Ouro $${marketData.gold.current}, Cobre $${marketData.copper.current}, Minério de Ferro $${marketData.ironOre.current}, Lítio $${marketData.lithium.current}
        - Agrícolas: Soja $${marketData.soybeans.current}, Trigo $${marketData.wheat.current}, Milho $${marketData.corn.current}, Café $${marketData.coffee.current}
        - Risco: VIX ${marketData.vix.current}, DXY ${marketData.dxy.current}, Yields ${marketData.yields.current}%
        
        REQUISITOS:
        - Explique O PORQUÊ com base em notícias reais de HOJE.
        - Use linguagem de conversa, sem economês.
        - Divida em: "O que está acontecendo", "Por que isso importa" e "Veredito Final".
      `;

      const historicalPrompt = `
        Analise a evolução dos indicadores atuais em comparação com o passado para dar uma perspectiva de longo prazo:
        Ouro: $${marketData.gold.current} (5 anos: ${marketData.gold.change5Years}%)
        Petróleo: $${marketData.oil.current} (5 anos: ${marketData.oil.change5Years}%)
        Cobre: $${marketData.copper.current} (5 anos: ${marketData.copper.change5Years}%)
        Soja: $${marketData.soybeans.current} (5 anos: ${marketData.soybeans.change5Years}%)
        Yields: ${marketData.yields.current}% (5 anos: ${marketData.yields.change5Years}%)
        VIX: ${marketData.vix.current} (5 anos: ${marketData.vix.change5Years}%)
        DXY: ${marketData.dxy.current} (5 anos: ${marketData.dxy.change5Years}%)

        Gere um relatório curto chamado "Perspectiva Histórica" que responda:
        1. O que era esperado na semana passada vs hoje?
        2. Qual era o clima no mês passado vs hoje?
        3. Como estávamos há 1 ano e há 5 anos?
        4. Conclusão: O medo de hoje é justificado ou estamos apenas em um ciclo normal?
        
        Use um tom calmante e analítico, focado em evitar pânico desnecessário.
      `;

      const historicalSummaryPrompt = `
        Com base na análise histórica dos indicadores (Ouro, Petróleo, Yields, VIX, DXY), 
        gere UMA frase curta que resuma se o momento atual é uma anomalia histórica ou apenas parte de um ciclo normal.
        Exemplo: "Embora o dia seja tenso, os indicadores mostram que estamos em um patamar de risco similar ao de 2 anos atrás, sem sinais de colapso iminente."
      `;
      
      const [summaryText, statusText, reportText, historyText, historySummaryText] = await Promise.all([
        fetchMarketAnalysis(summaryPrompt),
        fetchMarketAnalysis(statusPrompt),
        fetchMarketAnalysis(analysisPrompt),
        fetchMarketAnalysis(historicalPrompt),
        fetchMarketAnalysis(historicalSummaryPrompt)
      ]);

      setSummary(summaryText || '');
      setHistoricalSummary(historySummaryText || '');
      setAnalysis(reportText || 'Não foi possível gerar a análise.');
      setHistoricalAnalysis(historyText || '');
      
      try {
        const cleanStatus = (statusText || '{}').replace(/```json/g, "").replace(/```/g, "").trim();
        setHumanStatus(JSON.parse(cleanStatus));
      } catch (e) {
        setHumanStatus({ 
          climate: "Indeterminado", 
          impact: "Analisando...", 
          action: "Aguarde",
          chaosLevel: 50,
          trend: 'stable'
        });
      }

    } catch (err) {
      setError('Erro ao carregar dados do mercado. Verifique sua conexão ou tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
          <Activity className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-500 w-6 h-6 animate-pulse" />
        </div>
        <p className="mt-4 font-mono text-sm tracking-widest uppercase opacity-50">Lendo o pulso do mundo...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e4e4e4] font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Activity className="text-black w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">Chaos & Risk <span className="text-emerald-500">Indicator</span></h1>
          </div>
          <div className="flex items-center gap-4">
            {data && (
              <span className="text-[10px] font-mono uppercase opacity-40 hidden sm:block">
                Atualizado: {new Date(data.lastUpdated).toLocaleTimeString()}
              </span>
            )}
            <button 
              onClick={fetchData}
              disabled={loading}
              className="p-2 hover:bg-white/5 rounded-full transition-colors disabled:opacity-30"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-400">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Executive Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {summary && (
            <section className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Activity className="w-24 h-24" />
              </div>
              <h2 className="text-xs font-bold text-emerald-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Resumo Direto
              </h2>
              <p className="text-base sm:text-lg font-medium text-white leading-snug">
                {summary}
              </p>
            </section>
          )}

          {historicalSummary && (
            <section className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Clock className="w-24 h-24" />
              </div>
              <h2 className="text-xs font-bold text-blue-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                Contexto Histórico
              </h2>
              <p className="text-base sm:text-lg font-medium text-white leading-snug">
                {historicalSummary}
              </p>
            </section>
          )}
        </div>

        {/* Metrics Grid */}
        <div className="space-y-16">
          {/* Core Risk Indicators */}
          <section>
            <h2 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.4em] mb-8 px-2 flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              Indicadores de Risco e Moeda
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <MetricCard title="Ouro (USD)" value={data?.gold.current} unit="$" changes={data?.gold} icon="gold" description="Termômetro do Medo Global" />
              <MetricCard title="VIX (Medo)" value={data?.vix.current} unit="" changes={data?.vix} icon="vix" description="Expectativa de Volatilidade" />
              <MetricCard title="DXY (Dólar)" value={data?.dxy.current} unit="" changes={data?.dxy} icon="dxy" description="Força da Moeda Global" />
              <MetricCard title="Bond Yields (10Y)" value={data?.yields.current} unit="%" changes={data?.yields} icon="yields" description="Confiança no Futuro Econômico" />
              <MetricCard title="Petróleo (USD)" value={data?.oil.current} unit="$" changes={data?.oil} icon="oil" description="Custo de Energia e Logística" />
            </div>
          </section>

          {/* Energy & Industrial */}
          <section>
            <h2 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.4em] mb-8 px-2 flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
              Energia e Indústria
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <MetricCard title="Gás Natural" value={data?.naturalGas.current} unit="$" changes={data?.naturalGas} icon="oil" description="Aquecimento e Indústria" />
              <MetricCard title="Carvão" value={data?.coal.current} unit="$" changes={data?.coal} icon="oil" description="Geração de Energia" />
              <MetricCard title="Cobre" value={data?.copper.current} unit="$" changes={data?.copper} icon="yields" description="Doutor Economia" />
              <MetricCard title="Minério de Ferro" value={data?.ironOre.current} unit="$" changes={data?.ironOre} icon="yields" description="Construção Civil" />
            </div>
          </section>

          {/* Battery Metals */}
          <section>
            <h2 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.4em] mb-8 px-2 flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
              Metais de Bateria
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <MetricCard title="Lítio" value={data?.lithium.current} unit="$" changes={data?.lithium} icon="yields" description="Veículos Elétricos" />
              <MetricCard title="Níquel" value={data?.nickel.current} unit="$" changes={data?.nickel} icon="yields" description="Aço e Baterias" />
              <MetricCard title="Cobalto" value={data?.cobalt.current} unit="$" changes={data?.cobalt} icon="yields" description="Tecnologia" />
            </div>
          </section>

          {/* Agriculture */}
          <section>
            <h2 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.4em] mb-8 px-2 flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
              Commodities Agrícolas
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <MetricCard title="Soja" value={data?.soybeans.current} unit="$" changes={data?.soybeans} icon="gold" description="Proteína Global" />
              <MetricCard title="Trigo" value={data?.wheat.current} unit="$" changes={data?.wheat} icon="gold" description="Base Alimentar" />
              <MetricCard title="Milho" value={data?.corn.current} unit="$" changes={data?.corn} icon="gold" description="Ração e Energia" />
              <MetricCard title="Açúcar" value={data?.sugar.current} unit="$" changes={data?.sugar} icon="gold" description="Energia e Alimentos" />
              <MetricCard title="Café" value={data?.coffee.current} unit="$" changes={data?.coffee} icon="gold" description="Consumo Global" />
            </div>
          </section>
        </div>

        {/* Analysis Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 overflow-hidden relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-500" />
                  <h2 className="text-xl font-semibold">Relatório de Sentimento</h2>
                </div>
                <div className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  Análise IA Detalhada
                </div>
              </div>
              
              <div className="prose prose-invert max-w-none prose-p:text-white/70 prose-strong:text-white prose-headings:text-white">
                {analysis ? (
                  <div className="whitespace-pre-wrap leading-relaxed text-sm sm:text-base">
                    {analysis}
                  </div>
                ) : (
                  <div className="space-y-4 animate-pulse">
                    <div className="h-4 bg-white/5 rounded w-3/4"></div>
                    <div className="h-4 bg-white/5 rounded w-full"></div>
                    <div className="h-4 bg-white/5 rounded w-5/6"></div>
                    <div className="h-4 bg-white/5 rounded w-2/3"></div>
                  </div>
                )}
              </div>
            </section>

            {/* Historical Perspective Section */}
            <section className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 overflow-hidden relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <h2 className="text-xl font-semibold">Perspectiva Histórica</h2>
                </div>
                <div className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  Visão de Longo Prazo
                </div>
              </div>
              
              <div className="prose prose-invert max-w-none prose-p:text-white/70 prose-strong:text-white prose-headings:text-white">
                {historicalAnalysis ? (
                  <div className="whitespace-pre-wrap leading-relaxed text-sm sm:text-base italic opacity-90">
                    {historicalAnalysis}
                  </div>
                ) : (
                  <div className="space-y-4 animate-pulse">
                    <div className="h-4 bg-white/5 rounded w-3/4"></div>
                    <div className="h-4 bg-white/5 rounded w-full"></div>
                    <div className="h-4 bg-white/5 rounded w-5/6"></div>
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            {/* Reality Panel */}
            <section className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Activity className="w-32 h-32" />
              </div>

              <h3 className="text-sm font-bold uppercase tracking-widest opacity-40 mb-8 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Painel de Realidade
              </h3>

              <div className="space-y-8 relative z-10">
                {/* Chaos Meter */}
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono uppercase opacity-40">Nível de Caos</span>
                      <div className="text-3xl font-bold tracking-tighter flex items-center gap-2">
                        {humanStatus?.chaosLevel || 0}%
                        {humanStatus?.trend === 'up' && <TrendingUp className="w-5 h-5 text-red-500" />}
                        {humanStatus?.trend === 'down' && <TrendingDown className="w-5 h-5 text-emerald-500" />}
                      </div>
                    </div>
                    <div className={cn(
                      "text-[10px] font-bold uppercase px-2 py-1 rounded border",
                      (humanStatus?.chaosLevel || 0) > 70 ? "bg-red-500/10 border-red-500/20 text-red-500" :
                      (humanStatus?.chaosLevel || 0) > 40 ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-500" :
                      "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                    )}>
                      {(humanStatus?.chaosLevel || 0) > 70 ? "Crítico" :
                       (humanStatus?.chaosLevel || 0) > 40 ? "Alerta" : "Estável"}
                    </div>
                  </div>
                  
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full transition-all duration-1000 ease-out",
                        (humanStatus?.chaosLevel || 0) > 70 ? "bg-red-500" :
                        (humanStatus?.chaosLevel || 0) > 40 ? "bg-yellow-500" : "bg-emerald-500"
                      )}
                      style={{ width: `${humanStatus?.chaosLevel || 0}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <StatusItem 
                    label="Clima Global" 
                    value={humanStatus?.climate} 
                    color={(humanStatus?.chaosLevel || 0) > 70 ? "text-red-500" : (humanStatus?.chaosLevel || 0) > 40 ? "text-yellow-500" : "text-emerald-500"}
                    icon={<Activity className="w-4 h-4" />}
                  />
                  <StatusItem 
                    label="Impacto no Bolso" 
                    value={humanStatus?.impact} 
                    color="text-orange-500"
                    icon={<TrendingUp className="w-4 h-4" />}
                  />
                  <StatusItem 
                    label="O que fazer?" 
                    value={humanStatus?.action} 
                    color="text-blue-500"
                    icon={<Info className="w-4 h-4" />}
                  />
                </div>
              </div>
            </section>

            {/* Simple Guide */}
            <section className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
              <h3 className="text-sm font-bold uppercase tracking-widest opacity-40 mb-4 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Como ler os sinais?
              </h3>
              <div className="space-y-4 text-xs leading-relaxed opacity-70">
                <p><span className="text-yellow-500 font-bold">Ouro subindo:</span> As pessoas estão com medo e guardando valor em algo físico.</p>
                <p><span className="text-orange-500 font-bold">Petróleo subindo:</span> Guerras ou problemas de transporte estão encarecendo a energia.</p>
                <p><span className="text-blue-500 font-bold">Yields caindo:</span> O sinal de alerta máximo. O mercado parou de acreditar em lucro e quer apenas segurança.</p>
                <p><span className="text-red-500 font-bold">VIX subindo:</span> O "termômetro do pânico" está subindo. Espere movimentos bruscos.</p>
                <p><span className="text-emerald-500 font-bold">DXY subindo:</span> O mundo está correndo para o dólar. Falta dinheiro (liquidez) no mercado.</p>
                <p className="pt-2 border-t border-white/5 italic">Se todos os indicadores de risco subirem juntos, o cenário é de crise sistêmica.</p>
              </div>
            </section>
          </aside>
        </div>
      </main>

      <footer className="border-t border-white/5 py-12 mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-6 opacity-30 text-[10px] font-mono uppercase tracking-widest">
          <p>© 2026 Chaos & Risk Indicator • Inteligência Global em Tempo Real</p>
          <div className="flex gap-8">
            <span>Market Intelligence</span>
            <span>Global Risk Assessment</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StatusItem({ label, value, color, icon }: { label: string, value?: string, color: string, icon?: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-[10px] font-mono uppercase opacity-40">
        {icon}
        {label}
      </div>
      <div className={cn("text-lg font-bold tracking-tight leading-tight", color)}>
        {value || "---"}
      </div>
    </div>
  );
}

function MetricCard({ title, value, unit, changes, icon, description }: any) {
  const isUp = changes?.changeDay > 0;
  
  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 hover:bg-white/[0.04] transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-sm font-medium opacity-50 mb-1">{title}</h3>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold tracking-tighter">
              {unit === '$' ? `$${value?.toLocaleString()}` : unit === '%' ? `${value}%` : value}
            </span>
          </div>
        </div>
        <div className={cn(
          "p-2 rounded-xl",
          icon === 'gold' && "bg-yellow-500/10 text-yellow-500",
          icon === 'oil' && "bg-orange-500/10 text-orange-500",
          icon === 'yields' && "bg-blue-500/10 text-blue-500",
          icon === 'vix' && "bg-red-500/10 text-red-500",
          icon === 'dxy' && "bg-emerald-500/10 text-emerald-500",
        )}>
          {icon === 'gold' && <TrendingUp className="w-5 h-5" />}
          {icon === 'oil' && <Activity className="w-5 h-5" />}
          {icon === 'yields' && <BarChart3 className="w-5 h-5" />}
          {icon === 'vix' && <AlertTriangle className="w-5 h-5" />}
          {icon === 'dxy' && <TrendingUp className="w-5 h-5" />}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-2 gap-y-4 mt-6">
        <MiniStat label="Dia" value={changes?.changeDay} />
        <MiniStat label="Semana" value={changes?.changeWeek} />
        <MiniStat label="Mês" value={changes?.changeMonth} />
        <MiniStat label="Ano" value={changes?.changeYear} />
        <MiniStat label="5 Anos" value={changes?.change5Years} />
      </div>

      <p className="mt-6 text-[10px] font-mono uppercase opacity-30 group-hover:opacity-50 transition-opacity">
        {description}
      </p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string, value: number }) {
  const isPositive = value > 0;
  return (
    <div className="space-y-1 min-w-0">
      <span className="text-[9px] font-mono uppercase opacity-40 block">{label}</span>
      <div className={cn(
        "text-[11px] font-bold flex items-center gap-1 whitespace-nowrap",
        isPositive ? "text-emerald-500" : "text-red-500"
      )}>
        {isPositive ? <TrendingUp className="w-2.5 h-2.5 shrink-0" /> : <TrendingDown className="w-2.5 h-2.5 shrink-0" />}
        <span>{Math.abs(value)}%</span>
      </div>
    </div>
  );
}

