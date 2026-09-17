import os
import re
import json
import urllib.request
import urllib.parse
from pathlib import Path
import concurrent.futures
import sys

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

APP_DIR = Path(r"C:\Users\lucas\OneDrive\Área de Trabalho\jujutsu")
CHARACTERS_JSON_PATH = APP_DIR / "src" / "data" / "characters.json"
ICONS_DIR = APP_DIR / "public" / "assets" / "skill_icons"
ICONS_DIR.mkdir(parents=True, exist_ok=True)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

def norm(s: str) -> str:
    return re.sub(r'[^a-zA-Z0-9]', '', s or '').lower()

def fetch_url(url: str, timeout: int = 15) -> str:
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read().decode('utf-8', errors='replace')

def download_icon(image_key: str) -> bool:
    if not image_key:
        return False
    # Clean image_key in case it has extension or invalid chars
    clean_key = image_key.replace('.png', '').strip()
    target_path = ICONS_DIR / f"{clean_key}.png"
    if target_path.exists() and target_path.stat().st_size > 0:
        return True
    
    url = f"https://cdn.jjkppdb.com/skill_icons/{clean_key}.png"
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = resp.read()
            if len(data) > 0:
                with open(target_path, 'wb') as f:
                    f.write(data)
                return True
    except Exception as e:
        # Some icons might be auto-skill or special path, try fallback
        pass
    return False

def parse_character_page(slug: str) -> dict:
    url = f"https://www.jjkppdb.com/characters/{slug}"
    try:
        html = fetch_url(url, timeout=15)
        # Look for React Server Component stream chunk containing character
        for chunk in re.findall(r'self\.__next_f\.push\(\[1,\s*"(.*?)"\]\)', html):
            cleaned = bytes(chunk, "utf-8").decode("unicode_escape", errors="ignore")
            if '"character":' in cleaned:
                start_idx = cleaned.find('"character":') + len('"character":')
                decoder = json.JSONDecoder()
                data, _ = decoder.raw_decode(cleaned[start_idx:])
                data['_slug'] = slug
                return data
    except Exception as ex:
        print(f"Error fetching/parsing slug {slug}: {ex}")
    return None

def main():
    print("=== ENRICH SP, ICONS & JJKPPDB FORMATTING ===")
    
    if not CHARACTERS_JSON_PATH.exists():
        print(f"Characters json not found at {CHARACTERS_JSON_PATH}")
        return

    with open(CHARACTERS_JSON_PATH, 'r', encoding='utf-8') as f:
        local_chars = json.load(f)
    print(f"Loaded {len(local_chars)} local characters.")

    # 1. Fetch Sitemap
    print("Fetching sitemap from https://www.jjkppdb.com/sitemap.xml ...")
    sitemap_xml = fetch_url("https://www.jjkppdb.com/sitemap.xml")
    slugs = re.findall(r'<loc>https://www\.jjkppdb\.com/characters/([^<]+)</loc>', sitemap_xml)
    print(f"Found {len(slugs)} character slugs in sitemap.")

    # 2. Fetch all character data concurrently
    print("Fetching character data concurrently (8 threads)...")
    scraped_data = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
        future_to_slug = {executor.submit(parse_character_page, slug): slug for slug in slugs}
        for future in concurrent.futures.as_completed(future_to_slug):
            slug = future_to_slug[future]
            res = future.result()
            if res:
                scraped_data[slug] = res
                print(f"  [OK] {slug} -> {res.get('title')}")
            else:
                print(f"  [FAILED] {slug}")

    print(f"Successfully scraped {len(scraped_data)}/{len(slugs)} characters.")

    # 3. Collect all icon image_keys
    all_image_keys = set()
    for slug, data in scraped_data.items():
        na = data.get('normal_attack') or {}
        if na.get('image_key'): all_image_keys.add(na['image_key'])
        if na.get('changed_image_key'): all_image_keys.add(na['changed_image_key'])
        
        for s in data.get('skills', []):
            if s.get('image_key'): all_image_keys.add(s['image_key'])
            if s.get('changed_image_key'): all_image_keys.add(s['changed_image_key'])
            if s.get('changed2_image_key'): all_image_keys.add(s['changed2_image_key'])
            if s.get('sp') and isinstance(s['sp'], dict) and s['sp'].get('image_key'):
                all_image_keys.add(s['sp']['image_key'])
                
        ult = data.get('ultimate') or {}
        if ult.get('image_key'): all_image_keys.add(ult['image_key'])
        if ult.get('changed_image_key'): all_image_keys.add(ult['changed_image_key'])
        
        for a in data.get('auto_skills', []):
            if a.get('image_key'): all_image_keys.add(a['image_key'])

    print(f"Total unique skill icon keys found: {len(all_image_keys)}")

    # 4. Download icons concurrently
    print("Downloading icons to public/assets/skill_icons/ ...")
    downloaded = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = {executor.submit(download_icon, key): key for key in all_image_keys}
        for future in concurrent.futures.as_completed(futures):
            key = futures[future]
            try:
                if future.result():
                    downloaded += 1
            except Exception as e:
                pass
    print(f"Downloaded / verified {downloaded}/{len(all_image_keys)} icons.")

    # 5. Build lookup maps for local matching
    # exact map by title or id
    exact_map = {}
    key_map = {}
    for c in local_chars:
        t = c.get('title') or c.get('name') or ''
        exact_map[norm(t)] = c
        exact_map[norm(c.get('id', ''))] = c
        
        name_clean = norm(c.get('name', '')).replace('teen', '').replace('0', '')
        elem = (c.get('element') or '').strip().lower()
        rarity = (c.get('rarity') or '').strip().upper()
        key_map[(name_clean, elem, rarity)] = c

    # Match and enrich
    matched_count = 0
    for slug, s_data in scraped_data.items():
        # Candidate 1: by title or slug
        s_title_norm = norm(s_data.get('title', ''))
        s_slug_norm = norm(slug)
        target_char = exact_map.get(s_title_norm) or exact_map.get(s_slug_norm)
        
        # Candidate 2: by (name, elem, rarity)
        if not target_char:
            s_name_clean = norm(s_data.get('name', '')).replace('teen', '').replace('0', '')
            s_elem = (s_data.get('element') or '').strip().lower()
            s_rarity = (s_data.get('rarity') or '').strip().upper()
            target_char = key_map.get((s_name_clean, s_elem, s_rarity))
            
        # Candidate 3: fuzzy token matching
        if not target_char:
            for c in local_chars:
                if (c.get('element') or '').strip().lower() == (s_data.get('element') or '').strip().lower() and \
                   (c.get('rarity') or '').strip().upper() == (s_data.get('rarity') or '').strip().upper():
                    # check if epithet or name overlaps
                    if norm(s_data.get('name', '')) in norm(c.get('name', '')) or norm(c.get('name', '')) in norm(s_data.get('name', '')):
                        target_char = c
                        break

        if not target_char:
            print(f"  [UNMATCHED] {slug}")
            continue

        matched_count += 1
        
        # Enrich target_char!
        # A. Skill priority
        if s_data.get('skill_priority') is not None:
            target_char['skill_priority'] = s_data['skill_priority']

        # B. Normal attack
        na_scraped = s_data.get('normal_attack') or {}
        if na_scraped:
            if not target_char.get('normal_attack'):
                target_char['normal_attack'] = {}
            na = target_char['normal_attack']
            na_key = na_scraped.get('image_key')
            na['image_key'] = na_key
            if na_key:
                na['icon'] = f"skill_icons/{na_key}.png"
            if na_scraped.get('name'):
                na['name'] = na_scraped['name']
            if na_scraped.get('effect'):
                na['description'] = na_scraped['effect']
            if na_scraped.get('effect_10'):
                na['description_10'] = na_scraped['effect_10']

            # Variants
            na_variants = []
            # Regular variant
            v_reg = {
                "id": "regular",
                "label": "Base",
                "name": na_scraped.get('name', na.get('name', 'Normal Attack')),
                "cost": "0",
                "description": na_scraped.get('effect', na.get('description', '')),
                "description_10": na_scraped.get('effect_10'),
                "image_key": na_key,
                "icon": f"skill_icons/{na_key}.png" if na_key else None,
                "combat_rates": {
                    "crit_rate": na_scraped.get('crit_rate'),
                    "crit_dmg": na_scraped.get('crit_dmg'),
                    "black_flash": na_scraped.get('bf_rate'),
                    "black_flash_dmg": na_scraped.get('bf_dmg')
                }
            }
            na_variants.append(v_reg)

            if na_scraped.get('changed_name') or na_scraped.get('changed_image_key') or na_scraped.get('changed_effect'):
                c_key = na_scraped.get('changed_image_key') or na_key
                v_chg = {
                    "id": "changed",
                    "label": "Changed",
                    "name": na_scraped.get('changed_name') or f"{v_reg['name']} (Changed)",
                    "cost": "0",
                    "description": na_scraped.get('changed_effect') or v_reg['description'],
                    "description_10": na_scraped.get('changed_effect_10'),
                    "image_key": c_key,
                    "icon": f"skill_icons/{c_key}.png" if c_key else None,
                    "combat_rates": {
                        "crit_rate": na_scraped.get('changed_crit_rate') or na_scraped.get('crit_rate'),
                        "crit_dmg": na_scraped.get('changed_crit_dmg') or na_scraped.get('crit_dmg'),
                        "black_flash": na_scraped.get('changed_bf_rate') or na_scraped.get('bf_rate'),
                        "black_flash_dmg": na_scraped.get('changed_bf_dmg') or na_scraped.get('bf_dmg')
                    }
                }
                na_variants.append(v_chg)
            na['variants'] = na_variants

        # C. Command Skills
        scraped_skills = s_data.get('skills', [])
        if scraped_skills:
            enriched_skills = []
            for s_idx, s in enumerate(scraped_skills):
                # Slot is 1-indexed (Command Skill 1, 2)
                slot_num = s.get('index', s_idx + 1)
                
                # Try to preserve local name if already Portuguese/custom or use scraped
                base_name = s.get('name') or f"Skill {slot_num}"
                base_cost = str(s.get('energy_cost', 0))
                base_key = s.get('image_key')
                base_icon = f"skill_icons/{base_key}.png" if base_key else ""
                
                variants = []
                # 1. Base / Regular
                variants.append({
                    "id": "regular",
                    "label": "Base",
                    "name": base_name,
                    "cost": base_cost,
                    "description": s.get('effect', ''),
                    "description_10": s.get('effect_10'),
                    "image_key": base_key,
                    "icon": base_icon,
                    "combat_rates": {
                        "crit_rate": s.get('crit_rate'),
                        "crit_dmg": s.get('crit_dmg'),
                        "black_flash": s.get('bf_rate'),
                        "black_flash_dmg": s.get('bf_dmg')
                    }
                })
                
                # 2. Changed
                if s.get('changed_name') or s.get('changed_image_key') or s.get('changed_effect'):
                    c_key = s.get('changed_image_key') or base_key
                    variants.append({
                        "id": "changed",
                        "label": "Changed",
                        "name": s.get('changed_name') or f"{base_name} (Changed)",
                        "cost": str(s.get('changed_energy_cost') or base_cost),
                        "description": s.get('changed_effect', ''),
                        "description_10": s.get('changed_effect_10'),
                        "image_key": c_key,
                        "icon": f"skill_icons/{c_key}.png" if c_key else None,
                        "combat_rates": {
                            "crit_rate": s.get('changed_crit_rate'),
                            "crit_dmg": s.get('changed_crit_dmg'),
                            "black_flash": s.get('changed_bf_rate'),
                            "black_flash_dmg": s.get('changed_bf_dmg')
                        }
                    })

                # 3. Changed 2
                if s.get('changed2_name') or s.get('changed2_image_key') or s.get('changed2_effect'):
                    c2_key = s.get('changed2_image_key') or base_key
                    variants.append({
                        "id": "changed2",
                        "label": "Changed 2",
                        "name": s.get('changed2_name') or f"{base_name} (Changed 2)",
                        "cost": str(s.get('changed2_energy_cost') or base_cost),
                        "description": s.get('changed2_effect', ''),
                        "description_10": s.get('changed2_effect_10'),
                        "image_key": c2_key,
                        "icon": f"skill_icons/{c2_key}.png" if c2_key else None,
                        "combat_rates": {
                            "crit_rate": s.get('changed2_crit_rate'),
                            "crit_dmg": s.get('changed2_crit_dmg'),
                            "black_flash": s.get('changed2_bf_rate'),
                            "black_flash_dmg": s.get('changed2_bf_dmg')
                        }
                    })

                # 4. SP (Secret Potential)
                sp_data = s.get('sp')
                if sp_data and isinstance(sp_data, dict):
                    sp_key = sp_data.get('image_key') or base_key
                    variants.append({
                        "id": "sp",
                        "label": "SP",
                        "name": sp_data.get('name') or base_name,
                        "cost": str(sp_data.get('energy_cost') or base_cost),
                        "description": sp_data.get('effect', ''),
                        "description_10": sp_data.get('effect_10') or sp_data.get('effect', ''),
                        "image_key": sp_key,
                        "icon": f"skill_icons/{sp_key}.png" if sp_key else None,
                        "combat_rates": {
                            "crit_rate": sp_data.get('crit_rate') or s.get('crit_rate'),
                            "crit_dmg": sp_data.get('crit_dmg') or s.get('crit_dmg'),
                            "black_flash": sp_data.get('bf_rate') or s.get('bf_rate'),
                            "black_flash_dmg": sp_data.get('bf_dmg') or s.get('bf_dmg')
                        }
                    })

                skill_item = {
                    "slot": slot_num,
                    "name": base_name,
                    "cost": base_cost,
                    "description": s.get('effect', ''),
                    "description_10": s.get('effect_10'),
                    "image_key": base_key,
                    "icon": base_icon,
                    "variants": variants
                }
                enriched_skills.append(skill_item)
                
            target_char['skills'] = enriched_skills

        # D. Ultimate
        ult_scraped = s_data.get('ultimate') or {}
        if ult_scraped:
            if not target_char.get('ultimate'):
                target_char['ultimate'] = {}
            ult = target_char['ultimate']
            ult_key = ult_scraped.get('image_key')
            ult['image_key'] = ult_key
            if ult_key:
                ult['icon'] = f"skill_icons/{ult_key}.png"
            if ult_scraped.get('name'):
                ult['name'] = ult_scraped['name']
            if ult_scraped.get('effect'):
                ult['description'] = ult_scraped['effect']
            if ult_scraped.get('effect_10'):
                ult['description_10'] = ult_scraped['effect_10']

            ult_variants = []
            ult_variants.append({
                "id": "regular",
                "label": "Base",
                "name": ult_scraped.get('name', ult.get('name', 'Ultimate')),
                "cost": "0",
                "description": ult_scraped.get('effect', ult.get('description', '')),
                "description_10": ult_scraped.get('effect_10'),
                "image_key": ult_key,
                "icon": f"skill_icons/{ult_key}.png" if ult_key else None,
                "combat_rates": {
                    "crit_rate": ult_scraped.get('crit_rate'),
                    "crit_dmg": ult_scraped.get('crit_dmg'),
                    "black_flash": ult_scraped.get('bf_rate'),
                    "black_flash_dmg": ult_scraped.get('bf_dmg')
                }
            })

            if ult_scraped.get('changed_name') or ult_scraped.get('changed_image_key') or ult_scraped.get('changed_effect'):
                c_ult_key = ult_scraped.get('changed_image_key') or ult_key
                ult_variants.append({
                    "id": "changed",
                    "label": "Changed",
                    "name": ult_scraped.get('changed_name') or f"{ult.get('name', 'Ultimate')} (Changed)",
                    "cost": "0",
                    "description": ult_scraped.get('changed_effect', ''),
                    "description_10": ult_scraped.get('changed_effect_10'),
                    "image_key": c_ult_key,
                    "icon": f"skill_icons/{c_ult_key}.png" if c_ult_key else None,
                    "combat_rates": {
                        "crit_rate": ult_scraped.get('changed_crit_rate'),
                        "crit_dmg": ult_scraped.get('changed_crit_dmg'),
                        "black_flash": ult_scraped.get('changed_bf_rate'),
                        "black_flash_dmg": ult_scraped.get('changed_bf_dmg')
                    }
                })
            ult['variants'] = ult_variants

        # E. Auto Skills (Passives)
        auto_skills = s_data.get('auto_skills', [])
        if auto_skills:
            target_char['auto_skills'] = []
            for a in auto_skills:
                a_key = a.get('image_key')
                target_char['auto_skills'].append({
                    "name": a.get('name', 'Auto Skill'),
                    "description": a.get('effect', ''),
                    "image_key": a_key,
                    "icon": f"skill_icons/{a_key}.png" if a_key else ""
                })

    print(f"Matched and enriched {matched_count}/{len(scraped_data)} characters.")

    # Write back to characters.json
    with open(CHARACTERS_JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(local_chars, f, ensure_ascii=False, indent=2)
    print(f"Updated {CHARACTERS_JSON_PATH} successfully!")

if __name__ == '__main__':
    main()
