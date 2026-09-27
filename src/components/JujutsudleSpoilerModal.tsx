import React from 'react';
import { ShieldAlert, BookOpen, Film, Check, X, Sparkles } from 'lucide-react';
import type { CanonCutoff } from '../utils/jujutsudleCanon';

interface JujutsudleSpoilerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCutoff: CanonCutoff;
  onSelectCutoff: (cutoff: CanonCutoff) => void;
  lang?: 'pt' | 'en';
}

export const JujutsudleSpoilerModal: React.FC<JujutsudleSpoilerModalProps> = ({
  isOpen,
  onClose,
  currentCutoff,
  onSelectCutoff,
  lang = 'pt',
}) => {
  if (!isOpen) return null;

  const isPt = lang === 'pt';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-gradient-to-b from-[#161224] to-[#0d0914] border border-purple-500/40 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Efeito de brilho de energia amaldiçoada no topo */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-32 bg-purple-600/20 blur-3xl rounded-full pointer-events-none" />

        {/* Botão de Fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          aria-label={isPt ? 'Fechar' : 'Close'}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabeçalho */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {isPt ? 'VOCÊ ESTÁ ATUALIZADO?' : 'ARE YOU CAUGHT UP?'}
              <Sparkles className="w-4 h-4 text-amber-400" />
            </h2>
            <p className="text-xs text-zinc-400">
              {isPt
                ? 'Selecione seu ponto de progresso para ocultar personagens e revelações futuras.'
                : 'Select your progression point to filter out future character spoilers.'}
            </p>
          </div>
        </div>

        {/* Opções de Corte Anti-Spoiler */}
        <div className="space-y-4 my-6">
          {/* Opção 1: Até o Jogo do Abate / Sendai (Yuta vs Ryu) */}
          <div
            onClick={() => onSelectCutoff('sendai')}
            className={`cursor-pointer p-4 rounded-xl border transition-all duration-200 relative ${
              currentCutoff === 'sendai'
                ? 'bg-purple-950/40 border-purple-500 shadow-lg shadow-purple-900/30 ring-1 ring-purple-500'
                : 'bg-zinc-900/50 border-zinc-800 hover:border-purple-500/40 hover:bg-zinc-900/80'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-lg mt-0.5 ${currentCutoff === 'sendai' ? 'bg-purple-500/20 text-purple-300' : 'bg-zinc-800 text-zinc-400'}`}>
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-base">
                      {isPt ? 'Até o Jogo do Abate (Colônia de Sendai)' : 'Up to Culling Game (Sendai Colony)'}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {isPt ? 'Protegido' : 'Protected'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    {isPt
                      ? 'Termina na conclusão da batalha épica de Yuta vs Ryu Ishigori e Uro. Nenhum personagem ou revelação posterior aparecerá como segredo diário ou nas pesquisas.'
                      : 'Ends at the conclusion of Yuta vs Ryu & Uro. No subsequent characters or revelations will appear in daily targets or autocomplete.'}
                  </p>
                  <p className="text-[11px] text-purple-400/80 mt-2 font-mono">
                    {isPt ? '✦ 84 Feiticeiros & Maldições elegíveis' : '✦ 84 Sorcerers & Curses eligible'}
                  </p>
                </div>
              </div>
              {currentCutoff === 'sendai' && (
                <div className="p-1 rounded-full bg-purple-500 text-white shrink-0 mt-1">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              )}
            </div>
          </div>

          {/* Opção 2: Mangá Completo / Shinjuku */}
          <div
            onClick={() => onSelectCutoff('shinjuku')}
            className={`cursor-pointer p-4 rounded-xl border transition-all duration-200 relative ${
              currentCutoff === 'shinjuku'
                ? 'bg-purple-950/40 border-purple-500 shadow-lg shadow-purple-900/30 ring-1 ring-purple-500'
                : 'bg-zinc-900/50 border-zinc-800 hover:border-purple-500/40 hover:bg-zinc-900/80'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-lg mt-0.5 ${currentCutoff === 'shinjuku' ? 'bg-purple-500/20 text-purple-300' : 'bg-zinc-800 text-zinc-400'}`}>
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-base">
                      {isPt ? 'Mangá Completo (Batalha Decisiva de Shinjuku)' : 'Full Manga (Shinjuku Showdown)'}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {isPt ? 'Contém Spoilers' : 'Contains Spoilers'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    {isPt
                      ? 'Inclui todo o elenco até o capítulo final 271 do mangá (Naoya Espírito Vingativo, Yorozu, Rokujushi Miyo, Daido Hagane e técnicas reveladas).'
                      : 'Includes the entire cast up to chapter 271 (Cursed Naoya, Yorozu, Rokujushi Miyo, Daido Hagane, and all revealed techniques).'}
                  </p>
                  <p className="text-[11px] text-purple-400/80 mt-2 font-mono">
                    {isPt ? '✦ 88 Personagens canônicos completos' : '✦ 88 Full canonical characters'}
                  </p>
                </div>
              </div>
              {currentCutoff === 'shinjuku' && (
                <div className="p-1 rounded-full bg-purple-500 text-white shrink-0 mt-1">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rodapé / Botão de confirmação */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
          <span className="text-[11px] text-zinc-500">
            {isPt ? 'Você pode alterar este filtro a qualquer momento.' : 'You can change this filter anytime.'}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-purple-900/40 transition-all duration-150"
          >
            {isPt ? 'Confirmar & Jogar' : 'Confirm & Play'}
          </button>
        </div>
      </div>
    </div>
  );
};
