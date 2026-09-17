import os
import re
import json
import urllib.request
import urllib.parse
from pathlib import Path

# Paths
APP_DIR = Path(r"C:\Users\lucas\OneDrive\Área de Trabalho\jujutsu")
CHARACTERS_JSON_PATH = APP_DIR / "src" / "data" / "characters.json"
VAULT_CHARS_DIR = Path(r"C:\Users\lucas\OneDrive\Área de Trabalho\JJK_Scraper\JJK_Database\Personagens")

import sys
# Ensure UTF-8 output on Windows console
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

API_URL = "https://jjk-phantom-parade.fandom.com/api.php"
HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}


def http_get_json(params: dict) -> dict:
    qs = urllib.parse.urlencode(params)
    url = f"{API_URL}?{qs}"
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8", errors="replace"))


def clean_wikitext(text: str) -> str:
    if not text:
        return ""
    # Replace line breaks and entities
    text = re.sub(r'<br\s*/?>', '\n', text, flags=re.IGNORECASE)
    text = re.sub(r'\{\{!}}', '|', text)
    # Remove wiki file embeddings and templates like {{#if...}}
    text = re.sub(r'\{\{[^}]*\}\}', '', text)
    text = re.sub(r'\[\[(?:File|Image):[^\]]+\]\]', '', text, flags=re.IGNORECASE)
    # Convert [[Target|Label]] to Label
    text = re.sub(r'\[\[(?:[^|\]]*\|)?([^\]]+)\]\]', r'\1', text)
    # Clean whitespace
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    return '\n'.join(lines)


def extract_attributes(wikitext: str) -> dict:
    regex_tmpl = r'\{\{\s*Character[ _]Page(?:[ _]*\([^\)]+\))?\s*\|'
    start_match = re.search(regex_tmpl, wikitext, re.IGNORECASE)
    if not start_match:
        attrs = {}
        for k, v in re.findall(r'\|\s*([a-zA-Z0-9_\-\s]+?)\s*=\s*(.*?)(?=\n\s*\||\n\s*\}\}|$)', wikitext, re.DOTALL):
            attrs[k.strip()] = v.strip()
        return attrs

    start_pos = start_match.end()
    depth = 2
    i = start_pos
    end_pos = len(wikitext)

    while i < len(wikitext) and depth > 0:
        c2 = wikitext[i:i+2]
        if c2 == '{{':
            depth += 2
            i += 2
        elif c2 == '}}':
            depth -= 2
            i += 2
            if depth == 0:
                end_pos = i - 2
                break
        else:
            i += 1

    bloco = wikitext[start_pos:end_pos]
    tokens = []
    curr = []
    t_depth = 0
    b_depth = 0
    j = 0
    while j < len(bloco):
        c2 = bloco[j:j+2]
        if c2 == '{{':
            t_depth += 1
            curr.append(c2)
            j += 2
        elif c2 == '}}':
            if t_depth > 0:
                t_depth -= 1
            curr.append(c2)
            j += 2
        elif c2 == '[[':
            b_depth += 1
            curr.append(c2)
            j += 2
        elif c2 == ']]':
            if b_depth > 0:
                b_depth -= 1
            curr.append(c2)
            j += 2
        elif bloco[j] == '|' and t_depth == 0 and b_depth == 0:
            tokens.append(''.join(curr).strip())
            curr = []
            j += 1
        else:
            curr.append(bloco[j])
            j += 1

    if curr:
        tokens.append(''.join(curr).strip())

    attrs = {}
    for tok in tokens:
        if '=' in tok:
            k, v = tok.split('=', 1)
            attrs[k.strip()] = v.strip()
    return attrs


def format_progression(eff_1: str, eff_10: str) -> str:
    clean_1 = clean_wikitext(eff_1)
    clean_10 = clean_wikitext(eff_10)

    if not clean_1 and not clean_10:
        return ""
    if not clean_1:
        return clean_10
    if not clean_10 or clean_1 == clean_10:
        return clean_1

    lines_1 = [l.strip() for l in clean_1.split('\n') if l.strip()]
    lines_10 = [l.strip() for l in clean_10.split('\n') if l.strip()]

    result = []
    if len(lines_1) == len(lines_10):
        for l1, l10 in zip(lines_1, lines_10):
            if l1 == l10:
                result.append(l1)
            else:
                p1 = re.findall(r'(\d+(?:\.\d+)?%)', l1)
                matches_10 = list(re.finditer(r'(\d+(?:\.\d+)?%)', l10))
                if p1 and matches_10 and len(p1) == len(matches_10):
                    parts = []
                    last_idx = 0
                    for m10, v1 in zip(matches_10, p1):
                        v10 = m10.group(1)
                        parts.append(l10[last_idx:m10.start()])
                        if v1 != v10:
                            parts.append(f"{v1} (Lv 1) → {v10} (Lv 10)")
                        else:
                            parts.append(v10)
                        last_idx = m10.end()
                    parts.append(l10[last_idx:])
                    result.append(''.join(parts))
                else:
                    result.append(f"{l1} (Lv 1) → {l10} (Lv 10)")
    else:
        result.append(f"Lv 1: {' / '.join(lines_1)}\nLv 10: {' / '.join(lines_10)}")

    return '\n'.join(result)


def parse_skill_name_from_text(text: str, fallback_name: str) -> str:
    match = re.search(r'(?:change(?:s)?(?:\s+the\s+skill)?\s+into|skill\s+changes\s+to)\s+["“]([^"”]+)["”]', text, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    return fallback_name


def detect_contextual_label(text: str, char_title: str, default_label: str = "Mudado") -> str:
    t_lower = text.lower()
    c_lower = char_title.lower()
    
    # Specific text condition checks first
    if "ultimate gauge is above" in t_lower:
        return "Mudado: Barra Especial"
    if "instant spirit body" in t_lower or "spiritual body" in t_lower or "soul cutting" in t_lower or "soul piercing" in t_lower or "soul shattering" in t_lower:
        return "Mudado: Forma Espiritual"
    if "ferocious style" in t_lower or "estilo feroz" in t_lower:
        return "Mudado: Estilo Feroz"
    if "nimble style" in t_lower:
        return "Mudado: Estilo Ágil"
    if "rika orimoto" in t_lower or "rika-chan" in t_lower:
        return "Mudado: Rika Orimoto"
    if "realm of the strongest" in t_lower:
        return "Mudado: Mais Forte"
    if "honored one" in t_lower:
        return "Mudado: Iluminado"
    if "flowing red scale" in t_lower or "red scale: stack" in t_lower:
        return "Mudado: Escala Vermelha"
    if "incomplete domain" in t_lower or "chimera shadow garden" in t_lower:
        return "Mudado: Domínio Incompleto"
    if "full throttle" in t_lower:
        return "Mudado: Força Total"
    if "zone" in t_lower:
        return "Mudado: Zona"

    # Fallbacks based on character title
    if "ferocious" in c_lower:
        return "Mudado: Estilo Feroz"
    if "incomplete domain" in c_lower:
        return "Mudado: Domínio Incompleto"
    if "queen of curses" in c_lower:
        return "Mudado: Rika Orimoto"
    if "awakening" in c_lower or "strongest" in c_lower:
        return "Mudado: Iluminado"
    if "seance" in c_lower:
        return "Mudado: Sessão Espiritual"
    if "zone" in c_lower:
        return "Mudado: Zona"
    if "full throttle" in c_lower:
        return "Mudado: Força Total"

    return default_label


def clean_key(s: str) -> str:
    return re.sub(r'[^a-zA-Z0-9]', '', s).lower()


def run():
    print("Carregando personagens locais de:", CHARACTERS_JSON_PATH)
    with open(CHARACTERS_JSON_PATH, "r", encoding="utf-8") as f:
        characters = json.load(f)

    print(f"Total de personagens locais: {len(characters)}")

    # Obter lista de páginas do Template:Character Page
    data = http_get_json({
        "action": "query",
        "list": "embeddedin",
        "eititle": "Template:Character_Page",
        "einamespace": "0",
        "eilimit": "500",
        "format": "json"
    })
    wiki_titles = [p["title"] for p in data.get("query", {}).get("embeddedin", [])]
    print(f"Encontradas {len(wiki_titles)} páginas de personagens na Wiki Fandom.")

    # Mapear títulos normalizados
    char_map = {}
    for c in characters:
        char_map[clean_key(c["title"])] = c
        if "card_name" in c and c["card_name"]:
            char_map[clean_key(f"{c['title']}{c['card_name']}")] = c

    enriched_count = 0

    # Processar páginas da wiki em lotes de 20
    for i in range(0, len(wiki_titles), 20):
        batch = wiki_titles[i:i+20]
        titles_param = "|".join(batch)
        rev_data = http_get_json({
            "action": "query",
            "prop": "revisions",
            "titles": titles_param,
            "rvprop": "content",
            "format": "json"
        })

        for pid, pdata in rev_data.get("query", {}).get("pages", {}).items():
            if "revisions" not in pdata:
                continue
            title = pdata["title"]
            wikitext = pdata["revisions"][0]["*"]
            key = clean_key(title)

            char_obj = char_map.get(key)
            if not char_obj:
                for k, v in char_map.items():
                    if k in key or key in k:
                        char_obj = v
                        break

            if not char_obj:
                continue

            attrs = extract_attributes(wikitext)
            has_any_changed = False

            # 1. ATAQUE BÁSICO
            has_changed_na = "Changed Normal Attack Effect" in attrs or "Changed Normal Attack Effect 10" in attrs
            if has_changed_na:
                has_any_changed = True
                na_obj = char_obj.get("normal_attack") or {"name": "Ataque Básico", "description": ""}
                reg_name = na_obj.get("name", "Ataque Básico")
                reg_desc = na_obj.get("description", "")
                changed_desc = format_progression(
                    attrs.get("Changed Normal Attack Effect", ""),
                    attrs.get("Changed Normal Attack Effect 10", attrs.get("Changed Normal Attack Effect", ""))
                )
                changed_name = parse_skill_name_from_text(changed_desc, f"{reg_name} (Mudado)")
                label_changed = detect_contextual_label(changed_desc, title, "Mudado")

                na_combat_rates = {}
                if "ChangedS1CritRate" in attrs: na_combat_rates["crit_rate"] = attrs["ChangedS1CritRate"]
                if "ChangedS1CritDmg" in attrs: na_combat_rates["crit_dmg"] = attrs["ChangedS1CritDmg"]
                if "ChangedS1BFRate" in attrs: na_combat_rates["black_flash"] = attrs["ChangedS1BFRate"]

                na_obj["variants"] = [
                    {
                        "id": "regular",
                        "label": "Padrão",
                        "name": reg_name,
                        "cost": "0",
                        "description": reg_desc,
                        "combat_rates": char_obj.get("combat_rates", {})
                    },
                    {
                        "id": "changed",
                        "label": label_changed,
                        "name": changed_name,
                        "cost": "0",
                        "description": changed_desc,
                        "combat_rates": na_combat_rates or char_obj.get("combat_rates", {})
                    }
                ]
                char_obj["normal_attack"] = na_obj

            # 2. HABILIDADES DE COMANDO (Skill 1, 2, 3)
            skills = char_obj.get("skills", [])
            for sk in skills:
                slot = sk.get("slot")  # 1, 2, 3
                has_changed_sk = f"Changed Skill {slot} Effect" in attrs or f"Changed Skill {slot} Effect 10" in attrs
                has_second_changed_sk = f"Second Changed Skill {slot} Effect" in attrs or f"Second Changed Skill {slot} Effect 10" in attrs

                if has_changed_sk or has_second_changed_sk:
                    has_any_changed = True
                    reg_name = sk.get("name", f"Habilidade {slot}")
                    reg_cost = sk.get("cost", "0")
                    reg_desc = sk.get("description", "")

                    variants = [
                        {
                            "id": "regular",
                            "label": "Padrão",
                            "name": reg_name,
                            "cost": reg_cost,
                            "description": reg_desc,
                            "combat_rates": char_obj.get("combat_rates", {})
                        }
                    ]

                    if has_changed_sk:
                        c_desc = format_progression(
                            attrs.get(f"Changed Skill {slot} Effect", ""),
                            attrs.get(f"Changed Skill {slot} Effect 10", attrs.get(f"Changed Skill {slot} Effect", ""))
                        )
                        c_cost = attrs.get(f"Changed Energy Cost S{slot}", reg_cost)
                        c_name = parse_skill_name_from_text(c_desc, f"{reg_name} (Mudado)")
                        c_label = detect_contextual_label(c_desc, title, "Mudado")

                        c_rates = {}
                        crit_key = f"ChangedS{slot+1}CritRate"
                        dmg_key = f"ChangedS{slot+1}CritDmg"
                        bf_key = f"ChangedS{slot+1}BFRate"
                        if crit_key in attrs: c_rates["crit_rate"] = attrs[crit_key]
                        if dmg_key in attrs: c_rates["crit_dmg"] = attrs[dmg_key]
                        if bf_key in attrs: c_rates["black_flash"] = attrs[bf_key]

                        variants.append({
                            "id": "changed",
                            "label": c_label,
                            "name": c_name,
                            "cost": c_cost,
                            "description": c_desc,
                            "combat_rates": c_rates or char_obj.get("combat_rates", {})
                        })

                    if has_second_changed_sk:
                        c2_desc = format_progression(
                            attrs.get(f"Second Changed Skill {slot} Effect", ""),
                            attrs.get(f"Second Changed Skill {slot} Effect 10", attrs.get(f"Second Changed Skill {slot} Effect", ""))
                        )
                        c2_cost = attrs.get(f"Second Changed Energy Cost S{slot}", reg_cost)
                        c2_name = parse_skill_name_from_text(c2_desc, f"{reg_name} (V2)")
                        c2_label = detect_contextual_label(c2_desc, title, "Mudado: V2")

                        c2_rates = {}
                        crit_key2 = f"SecondChangedS{slot+1}CritRate"
                        dmg_key2 = f"SecondChangedS{slot+1}CritDmg"
                        bf_key2 = f"SecondChangedS{slot+1}BFRate"
                        if crit_key2 in attrs: c2_rates["crit_rate"] = attrs[crit_key2]
                        if dmg_key2 in attrs: c2_rates["crit_dmg"] = attrs[dmg_key2]
                        if bf_key2 in attrs: c2_rates["black_flash"] = attrs[bf_key2]

                        variants.append({
                            "id": "changed_v2",
                            "label": c2_label,
                            "name": c2_name,
                            "cost": c2_cost,
                            "description": c2_desc,
                            "combat_rates": c2_rates or char_obj.get("combat_rates", {})
                        })

                    sk["variants"] = variants

            # 3. ULTIMATE
            has_changed_ult = "Changed Ult Effect" in attrs or "Changed Ult Effect 10" in attrs
            if has_changed_ult:
                has_any_changed = True
                ult_obj = char_obj.get("ultimate") or {"name": "Técnica Especial", "description": ""}
                reg_ult_name = ult_obj.get("name", "Técnica Especial")
                reg_ult_desc = ult_obj.get("description", "")
                changed_ult_desc = format_progression(
                    attrs.get("Changed Ult Effect", ""),
                    attrs.get("Changed Ult Effect 10", attrs.get("Changed Ult Effect", ""))
                )
                changed_ult_name = parse_skill_name_from_text(changed_ult_desc, f"{reg_ult_name} (Mudado)")
                ult_label = detect_contextual_label(changed_ult_desc, title, "Mudado")

                ult_rates = {}
                if "ChangedUltCritRate" in attrs: ult_rates["crit_rate"] = attrs["ChangedUltCritRate"]
                if "ChangedUltCritDmg" in attrs: ult_rates["crit_dmg"] = attrs["ChangedUltCritDmg"]
                if "ChangedUltBFRate" in attrs: ult_rates["black_flash"] = attrs["ChangedUltBFRate"]

                ult_obj["variants"] = [
                    {
                        "id": "regular",
                        "label": "Padrão",
                        "name": reg_ult_name,
                        "cost": "0",
                        "description": reg_ult_desc,
                        "combat_rates": char_obj.get("combat_rates", {})
                    },
                    {
                        "id": "changed",
                        "label": ult_label,
                        "name": changed_ult_name,
                        "cost": "0",
                        "description": changed_ult_desc,
                        "combat_rates": ult_rates or char_obj.get("combat_rates", {})
                    }
                ]
                char_obj["ultimate"] = ult_obj

            if has_any_changed:
                char_obj["has_transformation"] = True
                enriched_count += 1
                print(f"✓ Enriquecido: {char_obj['name']} ({char_obj['title']})")

    # Salva no JSON
    print(f"\nSalvar {len(characters)} personagens atualizados em {CHARACTERS_JSON_PATH}...")
    with open(CHARACTERS_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(characters, f, ensure_ascii=False, indent=2)

    print(f"Sucesso! {enriched_count} personagens enriquecidos com todas as suas variantes de combate.")

    # Atualizar os arquivos Markdown no JJK_Database
    print(f"\nAtualizando arquivos Markdown no JJK_Database: {VAULT_CHARS_DIR}...")
    updated_mds = 0
    if VAULT_CHARS_DIR.exists():
        for char in characters:
            if not char.get("has_transformation"):
                continue

            # Buscar arquivo MD
            matches = list(VAULT_CHARS_DIR.glob(f"*{char['name']}*.md"))
            if not matches and "title" in char:
                # Tenta pelo titulo limpo
                c_title = re.sub(r'[\<\>\:\"\/\\\|\?\*]', '', char["title"])
                matches = list(VAULT_CHARS_DIR.glob(f"*{c_title[:15]}*.md"))

            for md_file in matches:
                try:
                    with open(md_file, "r", encoding="utf-8") as mf:
                        content = mf.read()

                    # Adiciona ou atualiza secao de variantes
                    header = "## 🔄 Variantes e Habilidades de Combate Alternadas"
                    var_section = [f"\n{header}\n"]

                    if char.get("normal_attack", {}).get("variants"):
                        var_section.append("### ⚔️ Variações do Ataque Básico:")
                        for v in char["normal_attack"]["variants"]:
                            var_section.append(f"- **[{v['label']} - {v['name']}]:** {v['description']}\n")

                    for sk in char.get("skills", []):
                        if sk.get("variants"):
                            var_section.append(f"### 🌀 Variações da Habilidade {sk['slot']}:")
                            for v in sk["variants"]:
                                var_section.append(f"- **[{v['label']} - {v['name']}] (Custo: {v['cost']} CE):** {v['description']}\n")

                    if char.get("ultimate", {}).get("variants"):
                        var_section.append("### 💥 Variações da Técnica Especial:")
                        for v in char["ultimate"]["variants"]:
                            var_section.append(f"- **[{v['label']} - {v['name']}]:** {v['description']}\n")

                    full_section = "\n".join(var_section)

                    if header in content:
                        # Substitui secao antiga
                        content = re.sub(r'## 🔄 Variantes e Habilidades de Combate Alternadas.*?(?=\n## |\Z)', full_section.strip() + "\n\n", content, flags=re.DOTALL)
                    else:
                        content = content.rstrip() + "\n\n" + full_section

                    with open(md_file, "w", encoding="utf-8") as mf:
                        mf.write(content)
                    updated_mds += 1
                except Exception as e:
                    print(f"Erro ao atualizar {md_file}: {e}")

    print(f"Concluído! {updated_mds} arquivos Markdown atualizados no cofre JJK_Database.")


if __name__ == "__main__":
    run()
