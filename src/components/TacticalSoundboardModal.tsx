import React, { useState } from 'react';
import { useJjkStore } from '../store/useJjkStore';
import { useTranslation } from '../i18n';
import { 
  playClick, 
  playSelect, 
  playTabSwitch, 
  playStarToggle, 
  playTransformSurge, 
  playLevelUp, 
  playCollectionToggle, 
  playCursedEnergyCharge, 
  playDomainExpansion, 
  playBlackFlash, 
  playTierDrop, 
  playClearFilters, 
  playUltimateSkill, 
  playBreakShatter, 
  playMemoryEquip, 
  playCubeSummonChime, 
  playTeamSynergyPulse, 
  playSuccessFanfare, 
  playElementalTone,
  playAnimeKokusen,
  playKokusenVoice,
  playKokusenSparks,
  playKokusenBlast,
  playKokusenChain,
  playKokusenGameYuji,
  playKokusenGameNobara,
  playKokusenGameTodo,
  playKokusenGameNanami,
  playKokusenGameYuta,
  playKokusenGameGojo,
  playDomainInfiniteVoid,
  playDomainMalevolentShrine,
  playDomainSelfEmbodiment,
  playWorldCuttingSlash,
  playCharacterQuote
} from '../utils/sound';
import { 
  Volume2, 
  VolumeX, 
  X, 
  Flame, 
  Sparkles, 
  Swords, 
  Zap, 
  ShieldAlert, 
  Dices, 
  Radio, 
  Music, 
  Activity,
  Layers,
  Mic,
  AudioLines
} from 'lucide-react';

interface TacticalSoundboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SoundPadDef {
  id: string;
  name: string;
  nameEn: string;
  category: 'combat' | 'elemental' | 'summon' | 'tactical' | 'anime';
  color: string;
  borderColor: string;
  icon: React.ReactNode;
  trigger: () => void;
}

export const TacticalSoundboardModal: React.FC<TacticalSoundboardModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { language } = useTranslation();
  const { soundEnabled, toggleSound, soundVolume, setSoundVolume } = useJjkStore();
  const [activeCategory, setActiveCategory] = useState<'all' | 'combat' | 'elemental' | 'summon' | 'tactical' | 'anime'>('all');
  const [lastPlayedId, setLastPlayedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTrigger = (id: string, fn: () => void) => {
    setLastPlayedId(id);
    fn();
    setTimeout(() => {
      setLastPlayedId(null);
    }, 400);
  };

  const soundPads: SoundPadDef[] = [
    // 1. Combate & Jujutsu
    {
      id: 'black-flash',
      name: 'Kokusen (Black Flash)',
      nameEn: 'Black Flash (Kokusen)',
      category: 'combat',
      color: 'from-red-950/90 to-black',
      borderColor: 'border-red-500 hover:border-red-400',
      icon: <Flame className="w-5 h-5 text-red-500 fill-red-500/40" />,
      trigger: () => playBlackFlash(),
    },
    {
      id: 'domain',
      name: 'Expansão de Domínio',
      nameEn: 'Domain Expansion',
      category: 'combat',
      color: 'from-purple-950/90 to-black',
      borderColor: 'border-purple-500 hover:border-purple-400',
      icon: <Sparkles className="w-5 h-5 text-purple-400" />,
      trigger: () => playDomainExpansion(),
    },
    {
      id: 'ultimate',
      name: 'Técnica Suprema (Ultimate)',
      nameEn: 'Ultimate Technique',
      category: 'combat',
      color: 'from-amber-950/90 to-black',
      borderColor: 'border-amber-500 hover:border-amber-400',
      icon: <Swords className="w-5 h-5 text-amber-400" />,
      trigger: () => playUltimateSkill(),
    },
    {
      id: 'transform',
      name: 'Sobrecarga de Transformação',
      nameEn: 'Transformation Surge',
      category: 'combat',
      color: 'from-rose-950/90 to-black',
      borderColor: 'border-rose-500 hover:border-rose-400',
      icon: <Zap className="w-5 h-5 text-rose-400" />,
      trigger: () => playTransformSurge(),
    },
    {
      id: 'cursed-energy',
      name: 'Carga de Energia Amaldiçoada',
      nameEn: 'Cursed Energy Charge',
      category: 'combat',
      color: 'from-cyan-950/90 to-black',
      borderColor: 'border-cyan-500 hover:border-cyan-400',
      icon: <Radio className="w-5 h-5 text-cyan-400" />,
      trigger: () => playCursedEnergyCharge(),
    },
    {
      id: 'break',
      name: 'Quebra de Barra (Break)',
      nameEn: 'Break Gauge Shatter',
      category: 'combat',
      color: 'from-orange-950/90 to-black',
      borderColor: 'border-orange-500 hover:border-orange-400',
      icon: <ShieldAlert className="w-5 h-5 text-orange-400" />,
      trigger: () => playBreakShatter(),
    },

    // 2. Ressonância Elemental
    {
      id: 'elem-blue',
      name: 'Ressonância Azul (幻 • Blue)',
      nameEn: 'Blue Resonance (幻)',
      category: 'elemental',
      color: 'from-blue-950/90 to-black',
      borderColor: 'border-blue-500 hover:border-blue-400',
      icon: <span className="font-serif font-black text-lg text-blue-400">幻</span>,
      trigger: () => playElementalTone('Blue'),
    },
    {
      id: 'elem-red',
      name: 'Ressonância Vermelha (夜 • Red)',
      nameEn: 'Red Resonance (夜)',
      category: 'elemental',
      color: 'from-red-950/90 to-black',
      borderColor: 'border-red-500 hover:border-red-400',
      icon: <span className="font-serif font-black text-lg text-red-400">夜</span>,
      trigger: () => playElementalTone('Red'),
    },
    {
      id: 'elem-green',
      name: 'Ressonância Verde (影 • Green)',
      nameEn: 'Green Resonance (影)',
      category: 'elemental',
      color: 'from-emerald-950/90 to-black',
      borderColor: 'border-emerald-500 hover:border-emerald-400',
      icon: <span className="font-serif font-black text-lg text-emerald-400">影</span>,
      trigger: () => playElementalTone('Green'),
    },
    {
      id: 'elem-yellow',
      name: 'Ressonância Amarela (行 • Yellow)',
      nameEn: 'Yellow Resonance (行)',
      category: 'elemental',
      color: 'from-amber-950/90 to-black',
      borderColor: 'border-amber-500 hover:border-amber-400',
      icon: <span className="font-serif font-black text-lg text-amber-400">行</span>,
      trigger: () => playElementalTone('Yellow'),
    },

    // 3. Invocação & Economia
    {
      id: 'cube-chime',
      name: 'Sino de Invocação de Cubos',
      nameEn: 'Cube Summon Chime',
      category: 'summon',
      color: 'from-violet-950/90 to-black',
      borderColor: 'border-violet-500 hover:border-violet-400',
      icon: <Dices className="w-5 h-5 text-violet-400" />,
      trigger: () => playCubeSummonChime(),
    },
    {
      id: 'team-synergy',
      name: 'Pulso de Sinergia de Equipe',
      nameEn: 'Team Synergy Pulse',
      category: 'summon',
      color: 'from-indigo-950/90 to-black',
      borderColor: 'border-indigo-500 hover:border-indigo-400',
      icon: <Activity className="w-5 h-5 text-indigo-400" />,
      trigger: () => playTeamSynergyPulse(),
    },
    {
      id: 'level-up',
      name: 'Fanfarra de Level Up',
      nameEn: 'Level Up Fanfare',
      category: 'summon',
      color: 'from-amber-950/90 to-black',
      borderColor: 'border-amber-400 hover:border-amber-300',
      icon: <Sparkles className="w-5 h-5 text-amber-300" />,
      trigger: () => playLevelUp(),
    },
    {
      id: 'victory-fanfare',
      name: 'Fanfarra de Conquista',
      nameEn: 'Victory Fanfare',
      category: 'summon',
      color: 'from-emerald-950/90 to-black',
      borderColor: 'border-emerald-400 hover:border-emerald-300',
      icon: <Music className="w-5 h-5 text-emerald-300" />,
      trigger: () => playSuccessFanfare(),
    },
    {
      id: 'memory-equip',
      name: 'Equipar Lembrança',
      nameEn: 'Equip Memory Card',
      category: 'summon',
      color: 'from-purple-950/90 to-black',
      borderColor: 'border-purple-400 hover:border-purple-300',
      icon: <Layers className="w-5 h-5 text-purple-300" />,
      trigger: () => playMemoryEquip(),
    },

    // 4. Interface Tática
    {
      id: 'click',
      name: 'Clique Tático Metálico',
      nameEn: 'Tactical Metallic Click',
      category: 'tactical',
      color: 'from-slate-900 to-black',
      borderColor: 'border-slate-600 hover:border-slate-400',
      icon: <Activity className="w-5 h-5 text-slate-400" />,
      trigger: () => playClick(),
    },
    {
      id: 'select',
      name: 'Confirmação / Seleção',
      nameEn: 'Selection Chime',
      category: 'tactical',
      color: 'from-slate-900 to-black',
      borderColor: 'border-slate-600 hover:border-slate-400',
      icon: <Activity className="w-5 h-5 text-purple-400" />,
      trigger: () => playSelect(),
    },
    {
      id: 'tab',
      name: 'Alternância de Painel',
      nameEn: 'Panel Tab Switch',
      category: 'tactical',
      color: 'from-slate-900 to-black',
      borderColor: 'border-slate-600 hover:border-slate-400',
      icon: <Activity className="w-5 h-5 text-indigo-400" />,
      trigger: () => playTabSwitch(),
    },
    {
      id: 'collection',
      name: 'Alternar Minha Coleção',
      nameEn: 'Collection Toggle',
      category: 'tactical',
      color: 'from-slate-900 to-black',
      borderColor: 'border-emerald-600 hover:border-emerald-400',
      icon: <Activity className="w-5 h-5 text-emerald-400" />,
      trigger: () => playCollectionToggle(true),
    },
    {
      id: 'star',
      name: 'Favoritar Feiticeiro',
      nameEn: 'Star Favorite',
      category: 'tactical',
      color: 'from-slate-900 to-black',
      borderColor: 'border-amber-600 hover:border-amber-400',
      icon: <Activity className="w-5 h-5 text-amber-400" />,
      trigger: () => playStarToggle(true),
    },
    {
      id: 'tier-drop',
      name: 'Encaixe na Tierlist',
      nameEn: 'Tierlist Drop',
      category: 'tactical',
      color: 'from-slate-900 to-black',
      borderColor: 'border-purple-600 hover:border-purple-400',
      icon: <Activity className="w-5 h-5 text-purple-400" />,
      trigger: () => playTierDrop(),
    },
    {
      id: 'clear-filter',
      name: 'Redefinição de Filtros',
      nameEn: 'Clear Filters Whoosh',
      category: 'tactical',
      color: 'from-slate-900 to-black',
      borderColor: 'border-rose-600 hover:border-rose-400',
      icon: <Activity className="w-5 h-5 text-rose-400" />,
      trigger: () => playClearFilters(),
    },

    // 5. Anime — Vozes & SFX Oficiais do Anime
    {
      id: 'anime-kokusen-impact',
      name: 'Kokusen — Impacto (Black Flash)',
      nameEn: 'Kokusen — Impact (Black Flash)',
      category: 'anime',
      color: 'from-red-950/90 to-black',
      borderColor: 'border-red-500 hover:border-red-400',
      icon: <AudioLines className="w-5 h-5 text-red-500" />,
      trigger: () => playAnimeKokusen(),
    },
    {
      id: 'anime-kokusen-voice',
      name: '虎杖 Yuji — "KOKUSEN!!" (Voz)',
      nameEn: '虎杖 Yuji — "KOKUSEN!!" (Voice)',
      category: 'anime',
      color: 'from-orange-950/90 to-black',
      borderColor: 'border-orange-500 hover:border-orange-400',
      icon: <Mic className="w-5 h-5 text-orange-400" />,
      trigger: () => playKokusenVoice(),
    },
    {
      id: 'anime-kokusen-sparks',
      name: 'Kokusen — Faíscas Elétricas',
      nameEn: 'Kokusen — Electric Sparks',
      category: 'anime',
      color: 'from-yellow-950/90 to-black',
      borderColor: 'border-yellow-500 hover:border-yellow-400',
      icon: <Zap className="w-5 h-5 text-yellow-400" />,
      trigger: () => playKokusenSparks(),
    },
    {
      id: 'anime-kokusen-blast',
      name: 'Kokusen — Explosão',
      nameEn: 'Kokusen — Blast',
      category: 'anime',
      color: 'from-amber-950/90 to-black',
      borderColor: 'border-amber-500 hover:border-amber-400',
      icon: <Flame className="w-5 h-5 text-amber-500 fill-amber-500/30" />,
      trigger: () => playKokusenBlast(),
    },
    {
      id: 'anime-kokusen-chain',
      name: 'Kokusen — Cadeia de Golpes',
      nameEn: 'Kokusen — Multi-Hit Chain',
      category: 'anime',
      color: 'from-rose-950/90 to-black',
      borderColor: 'border-rose-500 hover:border-rose-400',
      icon: <Swords className="w-5 h-5 text-rose-400" />,
      trigger: () => playKokusenChain(),
    },
    {
      id: 'game-kokusen-yuji',
      name: 'Kokusen (Jogo) — 虎杖 Yuji',
      nameEn: 'Game Kokusen — 虎杖 Yuji',
      category: 'anime',
      color: 'from-orange-950/90 via-red-950/60 to-black',
      borderColor: 'border-orange-500 hover:border-orange-400 shadow-orange-950/50',
      icon: <Flame className="w-5 h-5 text-orange-400 fill-orange-500/30" />,
      trigger: () => playKokusenGameYuji(),
    },
    {
      id: 'game-kokusen-nobara',
      name: 'Kokusen (Jogo) — 釘崎 Nobara',
      nameEn: 'Game Kokusen — 釘崎 Nobara',
      category: 'anime',
      color: 'from-amber-950/90 via-red-950/60 to-black',
      borderColor: 'border-amber-500 hover:border-amber-400 shadow-amber-950/50',
      icon: <Zap className="w-5 h-5 text-amber-400" />,
      trigger: () => playKokusenGameNobara(),
    },
    {
      id: 'game-kokusen-todo',
      name: 'Kokusen (Jogo) — 東堂 Todo',
      nameEn: 'Game Kokusen — 東堂 Todo',
      category: 'anime',
      color: 'from-red-950/90 via-purple-950/60 to-black',
      borderColor: 'border-red-500 hover:border-red-400 shadow-red-950/50',
      icon: <Swords className="w-5 h-5 text-red-400" />,
      trigger: () => playKokusenGameTodo(),
    },
    {
      id: 'game-kokusen-nanami',
      name: 'Kokusen (Jogo) — 七海 Nanami',
      nameEn: 'Game Kokusen — 七海 Nanami',
      category: 'anime',
      color: 'from-yellow-950/90 via-blue-950/60 to-black',
      borderColor: 'border-yellow-500 hover:border-yellow-400 shadow-yellow-950/50',
      icon: <Swords className="w-5 h-5 text-yellow-400" />,
      trigger: () => playKokusenGameNanami(),
    },
    {
      id: 'game-kokusen-yuta',
      name: 'Kokusen (Jogo) — 乙骨 Yuta',
      nameEn: 'Game Kokusen — 乙骨 Yuta',
      category: 'anime',
      color: 'from-emerald-950/90 via-cyan-950/60 to-black',
      borderColor: 'border-emerald-500 hover:border-emerald-400 shadow-emerald-950/50',
      icon: <Sparkles className="w-5 h-5 text-emerald-400" />,
      trigger: () => playKokusenGameYuta(),
    },
    {
      id: 'game-kokusen-gojo',
      name: 'Kokusen (Jogo) — 五条 Gojo',
      nameEn: 'Game Kokusen — 五条 Gojo',
      category: 'anime',
      color: 'from-blue-950/90 via-indigo-950/60 to-black',
      borderColor: 'border-blue-500 hover:border-blue-400 shadow-blue-950/50',
      icon: <Zap className="w-5 h-5 text-blue-400" />,
      trigger: () => playKokusenGameGojo(),
    },
    {
      id: 'anime-domain-gojo',
      name: '五条 Gojo — Expansão de Domínio: 無量空処',
      nameEn: 'Gojo — Domain Expansion: Infinite Void',
      category: 'anime',
      color: 'from-blue-950/90 to-black',
      borderColor: 'border-blue-500 hover:border-blue-400',
      icon: <Mic className="w-5 h-5 text-blue-400" />,
      trigger: () => playDomainInfiniteVoid(),
    },
    {
      id: 'anime-domain-sukuna',
      name: '宿儺 Sukuna — Expansão de Domínio: 伏魔御厨子',
      nameEn: 'Sukuna — Domain Expansion: Malevolent Shrine',
      category: 'anime',
      color: 'from-purple-950/90 to-black',
      borderColor: 'border-purple-500 hover:border-purple-400',
      icon: <Mic className="w-5 h-5 text-purple-400" />,
      trigger: () => playDomainMalevolentShrine(),
    },
    {
      id: 'anime-domain-mahito',
      name: '真人 Mahito — Expansão de Domínio: 自閉円頓裹',
      nameEn: 'Mahito — Domain Expansion: Self-Embodiment of Perfection',
      category: 'anime',
      color: 'from-teal-950/90 to-black',
      borderColor: 'border-teal-500 hover:border-teal-400',
      icon: <Mic className="w-5 h-5 text-teal-400" />,
      trigger: () => playDomainSelfEmbodiment(),
    },
    {
      id: 'anime-world-cutting-slash',
      name: '宿儺 Sukuna — 解 (Fuga: Corte Mundial)',
      nameEn: '宿儺 Sukuna — World Cutting Slash',
      category: 'anime',
      color: 'from-violet-950/90 to-black',
      borderColor: 'border-violet-500 hover:border-violet-400',
      icon: <Swords className="w-5 h-5 text-violet-400" />,
      trigger: () => playWorldCuttingSlash(),
    },
    {
      id: 'anime-quote-yuji',
      name: '虎杖悠仁 — Frase Icônica',
      nameEn: '虎杖悠仁 Yuji — Iconic Quote',
      category: 'anime',
      color: 'from-orange-950/90 to-black',
      borderColor: 'border-orange-400 hover:border-orange-300',
      icon: <Mic className="w-5 h-5 text-orange-300" />,
      trigger: () => playCharacterQuote('yuji'),
    },
    {
      id: 'anime-quote-gojo',
      name: '五条悟 — Frase Icônica',
      nameEn: '五条悟 Gojo — Iconic Quote',
      category: 'anime',
      color: 'from-blue-950/90 to-black',
      borderColor: 'border-blue-400 hover:border-blue-300',
      icon: <Mic className="w-5 h-5 text-blue-300" />,
      trigger: () => playCharacterQuote('gojo'),
    },
    {
      id: 'anime-quote-sukuna',
      name: '両面宿儺 — Frase Icônica',
      nameEn: '両面宿儺 Sukuna — Iconic Quote',
      category: 'anime',
      color: 'from-purple-950/90 to-black',
      borderColor: 'border-purple-400 hover:border-purple-300',
      icon: <Mic className="w-5 h-5 text-purple-300" />,
      trigger: () => playCharacterQuote('sukuna'),
    },
    {
      id: 'anime-quote-toji',
      name: '禪院甚爾 Toji — Frase Icônica',
      nameEn: '禪院甚爾 Toji — Iconic Quote',
      category: 'anime',
      color: 'from-slate-900 to-black',
      borderColor: 'border-slate-400 hover:border-slate-300',
      icon: <Mic className="w-5 h-5 text-slate-300" />,
      trigger: () => playCharacterQuote('toji'),
    },
  ];

  const filteredPads = activeCategory === 'all'
    ? soundPads
    : soundPads.filter(p => p.category === activeCategory);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div data-testid="soundboard-modal" className="bg-[#100b24] border-2 border-purple-500/50 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#251b40] flex items-center justify-between bg-[#140e2d]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-950/80 border border-purple-600/40 text-purple-400 shadow-md">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white font-serif tracking-wide">
                {language === 'pt' ? 'SOUNDBOARD TÁTICO' : 'TACTICAL SOUNDBOARD'}
              </h2>
              <p className="text-xs text-gray-400">
                {language === 'pt'
                  ? 'Sintetizador Web Audio API + 14 clipes de áudio reais do anime — 100% offline, latência zero.'
                  : 'Web Audio API synthesizer + 14 real anime audio clips — 100% offline, zero latency.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playClick();
              onClose();
            }}
            className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Master Controls & Visualizer */}
        <div className="p-4 sm:p-5 border-b border-[#201838] bg-[#0c081c] flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Volume Slider & Toggle */}
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <button
              onClick={() => {
                toggleSound();
                playClick();
              }}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                soundEnabled
                  ? 'bg-purple-600/30 border-purple-400 text-purple-200'
                  : 'bg-red-950/60 border-red-500/60 text-red-400'
              }`}
              title={soundEnabled ? 'Silenciar Áudio' : 'Ativar Áudio'}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            <div className="space-y-1 flex-1 sm:w-56">
              <div className="flex items-center justify-between text-xs font-bold text-gray-300">
                <span>{language === 'pt' ? 'Volume Mestre' : 'Master Volume'}</span>
                <span className="font-mono text-purple-400">{Math.round((soundVolume ?? 0.8) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={soundVolume ?? 0.8}
                onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
                data-testid="master-volume-slider"
                aria-label="Controle de Volume Mestre"
                className="w-full h-1.5 bg-[#251b40] rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>
          </div>

          {/* Real-time Visualizer Status */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#140f2b] border border-purple-900/50 text-xs font-mono">
            <span className={`w-2.5 h-2.5 rounded-full ${lastPlayedId ? 'bg-emerald-400 animate-ping' : 'bg-purple-500'}`} />
            <span className="text-gray-300">
              {lastPlayedId
                ? (language === 'pt' ? 'Sintetizando onda de áudio...' : 'Synthesizing waveform...')
                : (language === 'pt' ? 'Pronto para disparo' : 'Engine Ready')}
            </span>
          </div>
        </div>

        {/* Category Filters */}
        <div className="px-5 py-3 border-b border-[#201838] bg-[#0e0a1f] flex items-center gap-2 overflow-x-auto pb-2">
          {[
            { id: 'all', labelPt: 'Todos os Sons', labelEn: 'All Sounds' },
            { id: 'combat', labelPt: 'Combate & Jujutsu', labelEn: 'Combat & Jujutsu' },
            { id: 'elemental', labelPt: 'Ressonância Elemental', labelEn: 'Elemental Resonance' },
            { id: 'summon', labelPt: 'Invocação & Gacha', labelEn: 'Summon & Gacha' },
            { id: 'tactical', labelPt: 'Interface & Tático', labelEn: 'Tactical UI' },
            { id: 'anime', labelPt: '🎙️ Anime Voices & SFX', labelEn: '🎙️ Anime Voices & SFX' },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                playClick();
                setActiveCategory(cat.id as typeof activeCategory);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer whitespace-nowrap ${
                activeCategory === cat.id
                  ? 'bg-purple-600 border-purple-400 text-white shadow-md'
                  : 'bg-[#150f2c] border-[#22183d] text-gray-400 hover:text-white'
              }`}
            >
              {language === 'pt' ? cat.labelPt : cat.labelEn}
            </button>
          ))}
        </div>

        {/* Sound Pads Grid */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredPads.map((pad) => {
            const isPlaying = lastPlayedId === pad.id;
            const padName = language === 'pt' ? pad.name : pad.nameEn;

            return (
              <button
                key={pad.id}
                onClick={() => handleTrigger(pad.id, pad.trigger)}
                data-testid={`soundpad-${pad.id}`}
                aria-label={padName}
                className={`p-4 rounded-xl border bg-gradient-to-b ${pad.color} ${pad.borderColor} text-left transition-all duration-200 cursor-pointer flex flex-col justify-between h-28 relative overflow-hidden group active:scale-95 ${
                  isPlaying ? 'ring-2 ring-white scale-102 shadow-2xl shadow-purple-500/50' : 'shadow-lg hover:shadow-purple-950/40'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="p-2 rounded-lg bg-black/60 border border-white/10 group-hover:scale-110 transition-transform">
                    {pad.icon}
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-500 group-hover:text-purple-300">
                    TRIG
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-black text-white leading-tight group-hover:text-purple-200 transition-colors">
                    {padName}
                  </h4>
                </div>

                {/* Pulsing indicator when triggered */}
                {isPlaying && (
                  <div className="absolute inset-0 bg-white/10 pointer-events-none animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
