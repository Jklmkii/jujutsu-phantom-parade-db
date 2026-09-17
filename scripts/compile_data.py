import os
import re
import json
import shutil
import urllib.request

SCRAPER_DB = r"C:\Users\lucas\OneDrive\Área de Trabalho\JJK_Scraper\JJK_Database"
APP_DIR = r"C:\Users\lucas\OneDrive\Área de Trabalho\jujutsu"
PUBLIC_ASSETS = os.path.join(APP_DIR, "public", "assets")
DATA_DIR = os.path.join(APP_DIR, "src", "data")

os.makedirs(PUBLIC_ASSETS, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)

def copy_assets():
    src_assets = os.path.join(SCRAPER_DB, "_assets")
    if not os.path.exists(src_assets):
        print("Warning: _assets not found!")
        return 0
    copied = 0
    for f in os.listdir(src_assets):
        sf = os.path.join(src_assets, f)
        df = os.path.join(PUBLIC_ASSETS, f)
        if not os.path.exists(df) or os.path.getsize(sf) != os.path.getsize(df):
            shutil.copy2(sf, df)
            copied += 1
    print(f"Copied {copied} new/updated assets to public/assets.")
    return len(os.listdir(PUBLIC_ASSETS))

def parse_markdown_character(filepath):
    content = open(filepath, "r", encoding="utf-8", errors="ignore").read()
    
    # Extract frontmatter
    fm = {}
    fm_match = re.search(r"^---\n(.*?)\n---", content, re.DOTALL)
    if fm_match:
        for line in fm_match.group(1).splitlines():
            if ":" in line:
                k, v = line.split(":", 1)
                k = k.strip()
                v = v.strip().strip('"').strip("'")
                fm[k] = v

    title = fm.get("title", os.path.splitext(os.path.basename(filepath))[0])
    card_name = fm.get("card_name", "")
    
    # Extract image filename from cover_art
    cover_art = fm.get("cover_art", "")
    img_match = re.search(r'\[\[(?:_assets/)?([^\]]+)\]\]', cover_art)
    image_file = img_match.group(1) if img_match else ""
    if not image_file:
        img_match2 = re.search(r'!\[\[(?:_assets/)?([^\]|]+)', content)
        image_file = img_match2.group(1) if img_match2 else ""

    # Parse sections
    # Ataque basico
    normal_attack = {}
    na_match = re.search(r'## ⚔️ Ataque Básico\n### (.*?)\n(.*?)(?=\n## |\n---|$)', content, re.DOTALL)
    if na_match:
        normal_attack["name"] = na_match.group(1).strip()
        lines = [l.strip("- ").strip() for l in na_match.group(2).strip().splitlines() if l.strip()]
        normal_attack["description"] = "\n".join(lines)

    # Command skills
    skills = []
    # Match skills
    skill_blocks = re.findall(r'### Habilidade (\d+): (.*?)(?:\s*\*\(Custo: (\d+) CE\)\*)?\n(.*?)(?=\n### Habilidade|\n## |\n---|$)', content, re.DOTALL)
    for s_num, s_name, s_cost, s_body in skill_blocks:
        s_lines = [l.strip("- ").strip() for l in s_body.strip().splitlines() if l.strip()]
        skills.append({
            "slot": int(s_num),
            "name": s_name.strip(),
            "cost": s_cost or "0",
            "description": "\n".join(s_lines)
        })

    # Ultimate
    ultimate = {}
    ult_match = re.search(r'## 💥 Técnica Especial \(Ultimate\)\n### (.*?)\n(.*?)(?=\n## |\n---|$)', content, re.DOTALL)
    if ult_match:
        ultimate["name"] = ult_match.group(1).strip()
        body = ult_match.group(2).strip()
        combo_split = body.split("**Efeito em Combo de Especial:**")
        main_lines = [l.strip("- ").strip() for l in combo_split[0].strip().splitlines() if l.strip()]
        ultimate["description"] = "\n".join(main_lines)
        if len(combo_split) > 1:
            combo_lines = [l.strip("- ").strip() for l in combo_split[1].strip().splitlines() if l.strip()]
            ultimate["combo"] = "\n".join(combo_lines)

    # Passives
    passives = []
    pass_match = re.search(r'## 🛡️ Habilidades Automáticas \(Passivas\)\n(.*?)(?=\n## |\n---|$)', content, re.DOTALL)
    if pass_match:
        p_blocks = re.findall(r'### (.*?)\n(.*?)(?=\n### |\n---|$)', pass_match.group(1), re.DOTALL)
        for p_name, p_body in p_blocks:
            p_lines = [l.strip("- ").strip() for l in p_body.strip().splitlines() if l.strip()]
            passives.append({
                "name": p_name.strip(),
                "description": "\n".join(p_lines)
            })

    # Extract epithet/subtitle from title: "(Title) Name"
    epithet = ""
    clean_name = title
    m = re.match(r'\((.+?)\)\s+(.+)', title)
    if m:
        epithet = m.group(1)
        clean_name = m.group(2)

    return {
        "id": re.sub(r'[^a-zA-Z0-9_-]', '_', title),
        "title": title,
        "name": clean_name,
        "epithet": epithet,
        "card_name": card_name or clean_name,
        "rarity": fm.get("rarity", "SSR"),
        "element": fm.get("element", "Yellow"),
        "role": fm.get("role", "Attacker"),
        "focus": fm.get("focus", "Taijutsu"),
        "affiliation": fm.get("affiliation", "Tokyo Jujutsu High"),
        "release_date": fm.get("release_date", "N/A"),
        "limited": fm.get("limited", "Nao") == "Sim",
        "stats": {
            "hp": fm.get("hp", "0"),
            "attack": fm.get("attack", "0"),
            "jujutsu": fm.get("jujutsu", "0"),
            "initial_energy": fm.get("initial_energy", "0"),
            "max_energy": fm.get("max_energy", "100"),
            "special_gauge": fm.get("special_gauge", "1000")
        },
        "image": image_file,
        "normal_attack": normal_attack,
        "skills": skills,
        "ultimate": ultimate,
        "passives": passives
    }

def enrich_transformation_characters(characters_map):
    # For special characters with Changed skills (like Yuji Red, Mahito Red, Megumi Incomplete Domain)
    # We add the "changed" state directly to their skills
    
    # 1. (Maximum Cursed Energy Output) Yuji Itadori
    yuji_red = characters_map.get("(Maximum Cursed Energy Output) Yuji Itadori")
    if yuji_red:
        yuji_red["has_transformation"] = True
        yuji_red["transform_name"] = "Estilo Feroz"
        yuji_red["skill_priority"] = ["Habilidade 2", "Habilidade 3", "Habilidade 1"]
        yuji_red["combat_rates"] = {
            "crit_rate": "50%",
            "crit_dmg": "50%",
            "black_flash": "20%"
        }
        # Add changed versions to skills
        if len(yuji_red["skills"]) >= 1:
            yuji_red["skills"][0]["changed"] = {
                "name": "Soco (Estilo Feroz)",
                "cost": "0",
                "description": "Enquanto estiver no Estilo Feroz, o efeito da habilidade muda (Custo: 0 CE)\nCausa dano de ataque corpo a corpo ao inimigo alvo igual a 177,2% (Lv 1) → 220% (Lv 10) de Taijutsu (2 acertos, Taxa de Flash Negro: Média)\nQuando a Energia Amaldiçoada for igual ou superior a 20 (Custo: 20 CE):\nAplica um aumento de 9,7% (Lv 1) → 15% (Lv 10) em Taijutsu (3 turnos)\ne redução de 9,7% no dano recebido (3 turnos)"
            }
        if len(yuji_red["skills"]) >= 2:
            yuji_red["skills"][1]["changed"] = {
                "name": "Punho Divergente (Estilo Feroz)",
                "cost": "20",
                "description": "Enquanto estiver em Estilo Feroz (Custo de energia amaldiçoada: 20):\nPassa tanto no ataque corpo a corpo no inimigo quanto em 181,9% (Lv 1) → 270% (Lv 10) de Taijutsu (3 golpes no total, Flash Negro: Médio)\nAplica-se a si próprio: Aumento de 10% no dano desferido (cumulativo após a alteração da habilidade)\nCausa dano de ataque corpo a corpo no inimigo quanto a 181,9% de Taijutsu (Flash Negro: Médio)"
            }
        if len(yuji_red["skills"]) >= 3:
            yuji_red["skills"][2]["changed"] = {
                "name": "O Ataque Contínuo (Estilo Feroz)",
                "cost": "25",
                "description": "Enquanto estiver em Estilo Feroz (Custo de energia amaldiçoada: 25):\nPassa tanto no ataque corpo a corpo no inimigo quanto em 548,7% (Lv 1) → 750% (Lv 10) de Taijutsu (Taxa de Flash Negro: Alta)\nAplica-se a si próprio: aumento de 9,7% (Lv 1) → 20% (Lv 10) em Taijutsu (3 turnos)"
            }

    # 2. (Inspiration From "Death") Mahito
    mahito = characters_map.get('(Inspiration From "Death") Mahito') or characters_map.get('(Inspiration From \'Death\') Mahito')
    if mahito:
        mahito["has_transformation"] = True
        mahito["transform_name"] = "Corpo Espiritual Instantâneo"
        mahito["skill_priority"] = ["Habilidade 3", "Habilidade 1", "Habilidade 2"]
        mahito["combat_rates"] = {
            "crit_rate": "30%",
            "crit_dmg": "60%",
            "black_flash": "0%"
        }
        if len(mahito["skills"]) >= 1:
            mahito["skills"][0]["changed"] = {
                "name": "Lâmina de Braço Espiritual",
                "cost": "15",
                "description": "Enquanto na Forma de Corpo Espiritual:\nCausa 420.0% (Lv 1) → 650.0% (Lv 10) de Dano Físico e Espiritual combinado ao alvo selecionado.\nAumenta a própria Penetração de Defesa em 25% (2 Turnos)."
            }
        if len(mahito["skills"]) >= 2:
            mahito["skills"][1]["changed"] = {
                "name": "Mutação Espicular",
                "cost": "25",
                "description": "Enquanto na Forma de Corpo Espiritual:\nCausa 350.0% (Lv 1) → 520.0% (Lv 10) de Dano Ranged a todos os inimigos.\nAplica Atordoamento (1 Turno, Chance: 50%)."
            }

    # 3. (Incomplete Domain) Megumi Fushiguro
    megumi_dom = characters_map.get("(Incomplete Domain) Megumi Fushiguro")
    if megumi_dom:
        megumi_dom["has_transformation"] = True
        megumi_dom["transform_name"] = "Jardim das Sombras (Domínio)"
        megumi_dom["skill_priority"] = ["Habilidade 2", "Habilidade 1", "Habilidade 3"]
        if len(megumi_dom["skills"]) >= 1:
            megumi_dom["skills"][0]["changed"] = {
                "name": "Golpe das Sombras Múltiplas",
                "cost": "10",
                "description": "Sob Expansão de Domínio:\nCausa Dano Combinado igual a 210.5% (Lv 10) Taijutsu e 180.4% Jujutsu a todos os inimigos (2 Acertos).\nCusto de CE reduzido para 10."
            }
        if len(megumi_dom["skills"]) >= 2:
            megumi_dom["skills"][1]["changed"] = {
                "name": "Shikigami Submerso",
                "cost": "20",
                "description": "Sob Expansão de Domínio:\nCausa 451.2% (Lv 10) Taijutsu e 225.6% Jujutsu ao alvo selecionado.\nAumenta o Dano de Taijutsu recebido pelo alvo em 60.0% (2 Turnos).\nAtordoa o alvo garantido (1 Turno / Chance: 100%)."
            }

def compile_all_data():
    copy_assets()
    
    # 1. Characters
    char_dir = os.path.join(SCRAPER_DB, "Personagens")
    char_files = [f for f in os.listdir(char_dir) if f.endswith(".md") and not f.startswith("Índice")]
    characters = []
    characters_map = {}
    
    for f in sorted(char_files):
        fp = os.path.join(char_dir, f)
        char_data = parse_markdown_character(fp)
        characters.append(char_data)
        characters_map[char_data["title"]] = char_data

    enrich_transformation_characters(characters_map)
    print(f"Parsed {len(characters)} characters.")

    char_json_path = os.path.join(DATA_DIR, "characters.json")
    with open(char_json_path, "w", encoding="utf-8") as f:
        json.dump(characters, f, ensure_ascii=False, indent=2)

    # 2. Memories
    mem_dir = os.path.join(SCRAPER_DB, "Memorias")
    mem_files = [f for f in os.listdir(mem_dir) if f.endswith(".md") and not f.startswith("Índice")]
    memories = []

    for f in sorted(mem_files):
        fp = os.path.join(mem_dir, f)
        content = open(fp, "r", encoding="utf-8", errors="ignore").read()
        fm = {}
        fm_match = re.search(r"^---\n(.*?)\n---", content, re.DOTALL)
        if fm_match:
            for line in fm_match.group(1).splitlines():
                if ":" in line:
                    k, v = line.split(":", 1)
                    fm[k.strip()] = v.strip().strip('"').strip("'")

        # Cover art
        cover_art = fm.get("cover_art", "")
        img_match = re.search(r'\[\[(?:_assets/)?([^\]]+)\]\]', cover_art)
        image_file = img_match.group(1) if img_match else ""
        blacklist = ['icon', 'type.png', 'energy', 'ssr.png', 'sr.png', 'r.png', 'heal', 'skill', 'damage', 'up.png', 'resistance', 'debuff', 'shield', 'sword', 'gauge', 'recharge', 'buff']
        if image_file and any(b in image_file.lower() for b in blacklist):
            image_file = ""
        if not image_file:
            all_imgs = re.findall(r'!\[\[(?:_assets/)?([^\]|]+)', content)
            valid_imgs = [im for im in all_imgs if not any(b in im.lower() for b in blacklist)]
            image_file = valid_imgs[0] if valid_imgs else ""

        # Active skill
        active = {}
        act_match = re.search(r'## 🌀 Habilidade Ativa \(Comando\).*?\n(.*?)(?=\n## |\n---|$)', content, re.DOTALL)
        if act_match:
            lines = [l.strip("- ").strip() for l in act_match.group(1).strip().splitlines() if l.strip()]
            active["description"] = "\n".join(lines)
            cd_match = re.search(r'Recarga:\s*(\d+)', content)
            active["cooldown"] = cd_match.group(1) if cd_match else fm.get("active_cooldown", "0")

        # Passive skill
        passive = {}
        pass_match = re.search(r'## 🛡️ Habilidade Passiva / Automática.*?\n(.*?)(?=\n## |\n---|$)', content, re.DOTALL)
        if pass_match:
            lines = [l.strip("- ").strip() for l in pass_match.group(1).strip().splitlines() if l.strip()]
            passive["description"] = "\n".join(lines)

        memories.append({
            "id": re.sub(r'[^a-zA-Z0-9_-]', '_', fm.get("title", f[:-3])),
            "title": fm.get("title", f[:-3]),
            "rarity": fm.get("rarity", "SSR"),
            "release_date": fm.get("release_date", "N/A"),
            "stats": {
                "hp": fm.get("hp", "0%"),
                "taijutsu": fm.get("taijutsu", "0%"),
                "jujutsu": fm.get("jujutsu", "0%")
            },
            "active_cooldown": fm.get("active_cooldown", "0"),
            "passive_cooldown": fm.get("passive_cooldown", "/"),
            "image": image_file,
            "active_skill": active,
            "passive_skill": passive
        })

    print(f"Parsed {len(memories)} memories.")
    mem_json_path = os.path.join(DATA_DIR, "memories.json")
    with open(mem_json_path, "w", encoding="utf-8") as f:
        json.dump(memories, f, ensure_ascii=False, indent=2)

    # 3. Timeline
    timeline_file = os.path.join(SCRAPER_DB, "Timeline", "Previsao_Global_Timeline.md")
    events = []
    if os.path.exists(timeline_file):
        content = open(timeline_file, "r", encoding="utf-8", errors="ignore").read()
        table_rows = re.findall(r'\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|', content)
        for idx, (status, name, jp_date, glob_date, days) in enumerate(table_rows, 1):
            if "Status" in status or "---" in status: continue
            # clean event name
            clean_name = name.replace("<br>", "\n").replace("•", "-").replace("&nbsp;", " ").strip()
            events.append({
                "index": idx,
                "status": status.strip(),
                "name": clean_name,
                "jp_date": jp_date.strip(),
                "global_date": glob_date.replace("**", "").strip(),
                "days": days.strip()
            })

    print(f"Parsed {len(events)} timeline events.")
    time_json_path = os.path.join(DATA_DIR, "timeline.json")
    with open(time_json_path, "w", encoding="utf-8") as f:
        json.dump(events, f, ensure_ascii=False, indent=2)

    print("\nData compilation completed successfully!")

if __name__ == "__main__":
    compile_all_data()
