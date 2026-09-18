import { useJjkStore } from '../store/useJjkStore';
import { translations } from './translations';
import type { Language } from '../types';

export { translations };

export function useTranslation() {
  const language = useJjkStore((state) => state.language);
  const setLanguage = useJjkStore((state) => state.setLanguage);

  const t = translations[language] || translations.pt;

  return {
    t,
    language,
    setLanguage,
  };
}

export function translateElement(element: string, lang: Language): string {
  const norm = element.toLowerCase();
  if (norm.includes('blue') || norm.includes('蒼') || norm.includes('azul')) {
    return lang === 'en' ? 'Blue (蒼)' : 'Azul (蒼)';
  }
  if (norm.includes('red') || norm.includes('幻') || norm.includes('vermelho')) {
    return lang === 'en' ? 'Red (幻)' : 'Vermelho (幻)';
  }
  if (norm.includes('green') || norm.includes('夜') || norm.includes('verde') || norm.includes('shadow')) {
    return lang === 'en' ? 'Green (夜)' : 'Verde (夜)';
  }
  if (norm.includes('yellow') || norm.includes('行') || norm.includes('amarelo')) {
    return lang === 'en' ? 'Yellow (行)' : 'Amarelo (行)';
  }
  return element;
}

export function translateRole(role: string, lang: Language): string {
  const norm = role.toLowerCase();
  if (norm.includes('attack') || norm.includes('atacante')) {
    return lang === 'en' ? 'Attacker' : 'Atacante';
  }
  if (norm.includes('defend') || norm.includes('defensor') || norm.includes('tank')) {
    return lang === 'en' ? 'Defender (Tank)' : 'Defensor (Tanque)';
  }
  if (norm.includes('buff') || norm.includes('suporte')) {
    return lang === 'en' ? 'Support (Buffer)' : 'Suporte (Buffer)';
  }
  if (norm.includes('debuff') || norm.includes('desestabilizador')) {
    return lang === 'en' ? 'Debuffer' : 'Desestabilizador (Debuffer)';
  }
  if (norm.includes('heal') || norm.includes('cura')) {
    return lang === 'en' ? 'Healer' : 'Curandeiro (Healer)';
  }
  return role;
}

export function translateFocus(focus: string, lang: Language): string {
  const norm = focus.toLowerCase();
  if (norm.includes('tai') || norm.includes('físico') || norm.includes('fisico')) {
    return lang === 'en' ? 'Taijutsu (Physical)' : 'Taijutsu (Físico)';
  }
  if (norm.includes('juju') || norm.includes('mágico') || norm.includes('magico')) {
    return lang === 'en' ? 'Jujutsu (Magic)' : 'Jujutsu (Mágico)';
  }
  if (norm.includes('mix') || norm.includes('misto') || norm.includes('both')) {
    return lang === 'en' ? 'Mixed (Taijutsu/Jujutsu)' : 'Misto (Taijutsu/Jujutsu)';
  }
  return focus;
}

export function translatePoolStatus(status: string, lang: Language): string {
  const norm = status.toLowerCase();
  if (norm.includes('standard') || norm.includes('padrão') || norm.includes('in_pool')) {
    return lang === 'en' ? 'Standard Pool' : 'No Pool Padrão';
  }
  if (norm.includes('limit') || norm.includes('exclusivo')) {
    return lang === 'en' ? 'Limited (Exclusive)' : 'Banner Limitado (Exclusivo)';
  }
  if (norm.includes('wait') || norm.includes('aguardando')) {
    return lang === 'en' ? 'Pending Pool Inclusion' : 'Aguardando Inclusão no Pool';
  }
  return status;
}
