import React from 'react';
import type { Rarity } from '../types';

export const ElementBadge: React.FC<{ element: string; showLabel?: boolean; className?: string }> = ({ 
  element, 
  showLabel = true,
  className = "" 
}) => {
  const norm = element.toLowerCase();

  let config = {
    symbol: '行',
    name: 'Yellow',
    bg: 'bg-yellow-500/15 border-yellow-500/50 text-yellow-300',
    dot: 'bg-yellow-400'
  };

  if (norm.includes('blue') || norm.includes('幻')) {
    config = {
      symbol: '幻',
      name: 'Blue',
      bg: 'bg-blue-500/15 border-blue-500/50 text-blue-300',
      dot: 'bg-blue-400'
    };
  } else if (norm.includes('red') || norm.includes('夜')) {
    config = {
      symbol: '夜',
      name: 'Red',
      bg: 'bg-red-500/15 border-red-500/50 text-red-300',
      dot: 'bg-red-400'
    };
  } else if (norm.includes('green') || norm.includes('影')) {
    config = {
      symbol: '影',
      name: 'Green',
      bg: 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300',
      dot: 'bg-emerald-400'
    };
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border backdrop-blur-sm ${config.bg} ${className}`}>
      <span className="font-mono text-sm leading-none">{config.symbol}</span>
      {showLabel && <span>{config.name}</span>}
    </span>
  );
};

export const RarityBadge: React.FC<{ rarity: Rarity | string; className?: string }> = ({ rarity, className = "" }) => {
  const r = (rarity || 'SSR').toUpperCase();

  if (r === 'SSR') {
    return (
      <span className={`px-2.5 py-0.5 rounded-md text-xs font-black tracking-wider uppercase bg-gradient-to-r from-amber-500 via-yellow-400 to-purple-500 text-black shadow-sm shadow-yellow-500/30 ${className}`}>
        SSR
      </span>
    );
  }

  if (r === 'SR') {
    return (
      <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold tracking-wider uppercase bg-gradient-to-r from-sky-400 to-blue-500 text-white shadow-sm shadow-sky-500/20 ${className}`}>
        SR
      </span>
    );
  }

  return (
    <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold tracking-wider uppercase bg-slate-700 border border-slate-600 text-slate-300 ${className}`}>
      R
    </span>
  );
};

export const TagBadge: React.FC<{ label: string; variant?: 'default' | 'purple' | 'amber' | 'cyan' }> = ({ 
  label, 
  variant = 'default' 
}) => {
  const variants = {
    default: 'bg-[#1e1733] border-[#362b55] text-purple-200',
    purple: 'bg-purple-900/30 border-purple-500/40 text-purple-300',
    amber: 'bg-amber-950/40 border-amber-600/40 text-amber-300',
    cyan: 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant]}`}>
      {label}
    </span>
  );
};
