import React, { useState, useEffect } from 'react';
import type { Character } from '../types';
import { ElementBadge, RarityBadge } from './Badges';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Sparkles, 
  Users, 
  Calendar, 
  ArrowRight,
  HelpCircle,
  ChevronDown
} from 'lucide-react';
import { getAssetUrl } from '../utils/assets';
import { useTranslation, translateRole, translateFocus } from '../i18n';

interface HomePageProps {
  characters: Character[];
  onSelectCharacter: (char: Character) => void;
  onNavigate: (tab: any, search?: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ 
  characters, 
  onSelectCharacter,
  onNavigate 
}) => {
  const { language } = useTranslation();

  // Helper to parse DD-MM-YYYY or DD/MM/YYYY into timestamp
  const parseDate = (str?: string): number => {
    if (!str) return 0;
    const parts = str.replace(/\//g, '-').split('-');
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      return new Date(y, m, d).getTime();
    }
    return 0;
  };

  // Select top 8 most recently released characters in JP
  const featuredUnits = React.useMemo(() => {
    return [...characters]
      .sort((a, b) => parseDate(b.release_date) - parseDate(a.release_date))
      .slice(0, 8);
  }, [characters]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [quickSearch, setQuickSearch] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Auto slide carousel every 6s
  useEffect(() => {
    if (featuredUnits.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredUnits.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [featuredUnits]);

  const currentUnit = featuredUnits[currentIndex] || characters[0];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickSearch.trim()) {
      onNavigate('characters', quickSearch.trim());
    }
  };

  const faqs = language === 'pt' ? [
    {
      q: "Quais são as melhores unidades atuais em Phantom Parade?",
      a: "Unidades com alta autossuficiência, aumento maciço de dano para a equipe e quebra rápida de postura (Break) lideram o meta. Personagens como Satoru Gojo (0.2s / Hollow Purple), Yuta Okkotsu, Yuji Itadori (Zone) e Toji Fushiguro mantêm utilidade excepcional em combates de alto nível."
    },
    {
      q: "Como funcionam as habilidades que mudam na batalha (Base / Mudado)?",
      a: "Certos personagens entram em estados especiais (como o Estilo Feroz do Yuji Vermelho, a Expansão de Domínio do Megumi ou o Corpo Espiritual do Mahito). Durante essa transformação, seus custos de Energia Amaldiçoada e efeitos de habilidade são completamente alterados."
    },
    {
      q: "Como a Linha do Tempo calcula as previsões para o Global?",
      a: "O servidor Global foi acelerado para diminuir a distância com a versão japonesa. Atualmente, o atraso real (lag) está calibrado em exatamente 79 dias (marco oficial do evento de Kiyotaka Ijichi lançado em 17/09/2026 às 12:00), permitindo prever a chegada exata dos próximos banners."
    }
  ] : [
    {
      q: "What are the top tier units currently in Phantom Parade?",
      a: "Units with high self-sufficiency, massive team-wide damage amplification, and swift posture break lead the meta. Characters like Satoru Gojo (0.2s / Hollow Purple), Yuta Okkotsu, Yuji Itadori (Zone), and Toji Fushiguro maintain top-tier utility in endgame battles."
    },
    {
      q: "How do transformed combat abilities work (Base / Changed Mode)?",
      a: "Certain sorcerers enter special forms (such as Red Yuji's Ferocious Mode, Megumi's Domain Expansion, or Mahito's True Form). During transformation, their Cursed Energy costs and skill effects are completely altered."
    },
    {
      q: "How does the Timeline calculate Global version forecasts?",
      a: "The Global server is accelerated to catch up with the JP timeline. Currently, the actual delay (lag) is calibrated to exactly 79 days (official event benchmark: Kiyotaka Ijichi event released on 09/17/2026 at 12:00), projecting accurate upcoming banner releases."
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-12 animate-fadeIn">
      
      {/* 1. Hero Carousel */}
      {currentUnit && (
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#120e24] via-[#16112c] to-[#0d091a] border border-[#2e2252] shadow-2xl shadow-purple-950/50 p-6 md:p-10">
          <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-8">
            
            {/* Left Info */}
            <div className="space-y-4 max-w-xl z-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-red-600/30 text-red-400 border border-red-500/40">
                    {language === 'pt' ? `Recente JP #${currentIndex + 1}` : `Latest JP #${currentIndex + 1}`}
                  </span>
                  {currentUnit.epithet && (
                    <p className="text-xs md:text-sm font-bold tracking-wider uppercase text-red-400">
                      {currentUnit.epithet}
                    </p>
                  )}
                </div>
                <h1 className="text-3xl md:text-5xl font-black text-white font-serif tracking-tight drop-shadow-lg">
                  {currentUnit.name.toUpperCase()}
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <RarityBadge rarity={currentUnit.rarity} />
                <ElementBadge element={currentUnit.element} />
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#1e1638] text-purple-300 border border-purple-800/40">
                  {translateFocus(currentUnit.focus, language)}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#1e1638] text-gray-300 border border-purple-800/40">
                  {translateRole(currentUnit.role, language)}
                </span>
              </div>

              {currentUnit.release_date && currentUnit.release_date !== 'N/A' && (
                <p className="text-xs text-gray-400">
                  {language === 'pt' ? 'Lançamento no Japão:' : 'Release in Japan:'}{' '}
                  <span className="text-gray-200 font-semibold">{currentUnit.release_date}</span>
                </p>
              )}

              <div className="pt-3">
                <button
                  onClick={() => onSelectCharacter(currentUnit)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-900/40 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <span>{language === 'pt' ? 'Ver personagem' : 'View character'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Banner Art */}
            <div className="relative w-full max-w-md aspect-[16/10] rounded-2xl overflow-hidden border-2 border-purple-500/40 shadow-2xl shadow-purple-900/30 bg-[#090612] group">
              <img
                src={getAssetUrl(currentUnit.image)}
                alt={currentUnit.title}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getAssetUrl();
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c081a] via-transparent to-transparent pointer-events-none" />
            </div>
          </div>

          {/* Carousel Arrows */}
          <button
            onClick={() => setCurrentIndex((prev) => (prev - 1 + featuredUnits.length) % featuredUnits.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-purple-900/80 text-white border border-purple-500/30 transition-all z-20"
            title="Anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % featuredUnits.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-purple-900/80 text-white border border-purple-500/30 transition-all z-20"
            title="Próximo"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Carousel Dots Indicator */}
          <div className="flex justify-center items-center gap-2 pt-6">
            {featuredUnits.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentIndex === idx ? 'w-8 bg-purple-500 shadow-sm shadow-purple-400' : 'w-2 bg-gray-600 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* 2. What's New Card */}
      <div className="bg-[#120e24] border border-[#271d44] rounded-2xl p-5 shadow-lg flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-purple-950/80 border border-purple-600/40 text-purple-300">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-purple-400">
              {language === 'pt' ? 'O que há de novo na base de dados (Offline)' : "What's New in the Offline Database"}
            </h3>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">
            {language === 'pt' ? (
              <>
                • <strong>Habilidades com Estados Dinâmicos:</strong> Suporte completo para alternância entre modo <em>Base</em> e modo <em>Mudado</em> (Estilo Feroz do Yuji, Domínio do Megumi e Forma Espiritual do Mahito).<br />
                • <strong>Progressão Nível 1 ↔ Nível 10:</strong> Multiplicadores de combate escalando em tempo real com badges de Taxa Crítica e Flash Negro.
              </>
            ) : (
              <>
                • <strong>Dynamic Skill States:</strong> Complete support for switching between <em>Base</em> and <em>Changed</em> mode (Ferocious Yuji, Megumi Domain, True Form Mahito).<br />
                • <strong>Level 1 ↔ Level 10 Progression:</strong> Real-time scaling combat multipliers with Critical Rate and Black Flash badges.
              </>
            )}
          </p>
        </div>
      </div>

      {/* 3. Find a Character Search Box */}
      <div className="text-center space-y-4 max-w-2xl mx-auto pt-4">
        <h2 className="text-2xl font-bold text-white font-serif tracking-wide">
          {language === 'pt' ? 'BUSCAR UM FEITICEIRO' : 'SEARCH A SORCERER'}
        </h2>
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
          <input
            type="text"
            placeholder={language === 'pt' ? "Digite o nome ou epíteto (ex: Satoru Gojo, Yuji, Sukuna)..." : "Type sorcerer name or epithet (e.g. Satoru Gojo, Yuji, Sukuna)..."}
            value={quickSearch}
            onChange={(e) => setQuickSearch(e.target.value)}
            className="w-full bg-[#130f26] border-2 border-[#2f2354] focus:border-purple-500 rounded-2xl pl-12 pr-28 py-3.5 text-sm text-white placeholder-gray-500 focus:outline-none transition-all shadow-xl shadow-purple-950/30"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors shadow-md cursor-pointer"
          >
            {language === 'pt' ? 'Buscar' : 'Search'}
          </button>
        </form>
      </div>

      {/* 4. Global Database Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div 
          onClick={() => onNavigate('characters')}
          className="bg-[#120e24] border border-[#251b40] hover:border-purple-500/50 rounded-2xl p-6 text-center cursor-pointer transition-all hover:-translate-y-1 shadow-lg group"
        >
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-purple-950/60 border border-purple-600/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
            <Users className="w-6 h-6" />
          </div>
          <div className="text-4xl font-black text-white font-mono tracking-tight">109</div>
          <div className="text-xs uppercase font-bold tracking-wider text-purple-300 mt-1">
            {language === 'pt' ? 'Personagens Catalogados' : 'Cataloged Characters'}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {language === 'pt' ? 'Fichas completas com escalonamento Lv 1 → Lv 10 e artes.' : 'Complete profiles with Lv 1 → Lv 10 scaling and art assets.'}
          </p>
        </div>

        <div 
          onClick={() => onNavigate('memories')}
          className="bg-[#120e24] border border-[#251b40] hover:border-purple-500/50 rounded-2xl p-6 text-center cursor-pointer transition-all hover:-translate-y-1 shadow-lg group"
        >
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-amber-950/60 border border-amber-600/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="text-4xl font-black text-white font-mono tracking-tight">241</div>
          <div className="text-xs uppercase font-bold tracking-wider text-amber-300 mt-1">
            {language === 'pt' ? 'Cartas de Memória (Rec. Bits)' : 'Memory Bits (Rec. Bits)'}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {language === 'pt' ? 'Atributos máximos, recargas (CD), habilidades ativas e passivas.' : 'Max stats, cooldowns (CD), active skills and passives.'}
          </p>
        </div>

        <div 
          onClick={() => onNavigate('timeline')}
          className="bg-[#120e24] border border-[#251b40] hover:border-purple-500/50 rounded-2xl p-6 text-center cursor-pointer transition-all hover:-translate-y-1 shadow-lg group"
        >
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-blue-950/60 border border-blue-600/30 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
            <Calendar className="w-6 h-6" />
          </div>
          <div className="text-4xl font-black text-white font-mono tracking-tight">179</div>
          <div className="text-xs uppercase font-bold tracking-wider text-blue-300 mt-1">
            {language === 'pt' ? 'Eventos e Banners Oficiais' : 'Official Events & Banners'}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {language === 'pt' ? 'Cronologia japonesa e previsão calibrada para a versão Global.' : 'Japanese release chronology and calibrated Global schedule.'}
          </p>
        </div>
      </div>

      {/* 5. FAQ Section */}
      <div className="max-w-3xl mx-auto space-y-4 pt-6">
        <h2 className="text-xl font-bold text-white font-serif tracking-wide text-center flex items-center justify-center gap-2">
          <HelpCircle className="w-5 h-5 text-purple-400" />
          {language === 'pt' ? 'PERGUNTAS FREQUENTES (FAQ)' : 'FREQUENTLY ASKED QUESTIONS (FAQ)'}
        </h2>

        <div className="space-y-2.5">
          {faqs.map((faq, idx) => (
            <div 
              key={idx}
              className="bg-[#120e24] border border-[#271d44] rounded-xl overflow-hidden transition-colors"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between p-4 text-left font-bold text-sm text-gray-200 hover:text-purple-300 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-purple-400 transition-transform duration-200 ${openFaq === idx ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === idx && (
                <div className="p-4 pt-0 text-xs text-gray-300 leading-relaxed border-t border-[#1c1533]">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
