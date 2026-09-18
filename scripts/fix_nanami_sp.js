import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const charactersPath = path.resolve(__dirname, '../src/data/characters.json');

const characters = JSON.parse(fs.readFileSync(charactersPath, 'utf8'));

const nanami = characters.find(c => c.id && c.id.includes('First-Grade'));

if (!nanami) {
  console.error('Nanami (First-Grade) not found!');
  process.exit(1);
}

console.log('Found Nanami:', nanami.id, nanami.name, nanami.epithet);

const skill0 = nanami.skills[0];
if (!skill0) {
  console.error('Skill 0 not found on Nanami!');
  process.exit(1);
}

const spVariant = skill0.variants?.find(v => v.id === 'sp');
if (!spVariant) {
  console.error('SP variant not found on skill 0!');
  process.exit(1);
}

const spDesc1 = `Applies 25.00% Damage Dealt Increase to self (3 turns)
Applies 10.00% CRIT Rate Increase to self (3 turns)
Increases the effect amount of the following effects applied to self by +10.00%:
· Taijutsu Increase
· Jujutsu Increase
※ Effects that do not specify an upper limit on the number of times or turns are excluded from enhancement
Increases the effect amount of the following effects applied to self and allies by +10.00%, and extends their effective turns by 1:
· Taijutsu Increase (Working Overtime)
· Jujutsu Increase (Working Overtime)
· Damage Dealt Increase with "蒼" (Blue) Attribute (Working Overtime)
▼ When Taijutsu Increase (Working Overtime) / Jujutsu Increase (Working Overtime) is not applied to self
Applies 15.00% Taijutsu Increase (Working Overtime) to self (6 turns)
Applies 15.00% Jujutsu Increase (Working Overtime) to self (6 turns)
※ The effect amount of Taijutsu Increase (Working Overtime) / Jujutsu Increase (Working Overtime) applies up to a total of 100.00%, including overlapping amounts
SP strengthened: "Going Into Overtime" Auto skill`;

const spDesc10 = `Applies 42.00% Damage Dealt Increase to self (3 turns)
Applies 10.00% CRIT Rate Increase to self (3 turns)
Increases the effect amount of the following effects applied to self by +10.00%:
· Taijutsu Increase
· Jujutsu Increase
※ Effects that do not specify an upper limit on the number of times or turns are excluded from enhancement
Increases the effect amount of the following effects applied to self and allies by +10.00%, and extends their effective turns by 1:
· Taijutsu Increase (Working Overtime)
· Jujutsu Increase (Working Overtime)
· Damage Dealt Increase with "蒼" (Blue) Attribute (Working Overtime)
▼ When Taijutsu Increase (Working Overtime) / Jujutsu Increase (Working Overtime) is not applied to self
Applies 15.00% Taijutsu Increase (Working Overtime) to self (6 turns)
Applies 15.00% Jujutsu Increase (Working Overtime) to self (6 turns)
※ The effect amount of Taijutsu Increase (Working Overtime) / Jujutsu Increase (Working Overtime) applies up to a total of 100.00%, including overlapping amounts
SP strengthened: "Going Into Overtime" Auto skill`;

spVariant.description = spDesc1;
spVariant.description_10 = spDesc10;
console.log('Fixed skill[0] SP variant description and description_10.');

const autoSkill0Sp = `When battle starts:
Recovers 30 Cursed Energy to self
Applies 5 Cursed Energy Recovery to self per turn
Recovers 220 Ultimate Gauge
Applies 30.00% Taijutsu Increase to self
Applies 30.00% Jujutsu Increase to self
▼ When self lands a CRIT or Black Flash (limited to one activation per turn):
Applies 15.00% Taijutsu Increase (Working Overtime) to self (6 turns)
Applies 15.00% Jujutsu Increase (Working Overtime) to self (6 turns)
※ The effect amount of Taijutsu Increase (Working Overtime) / Jujutsu Increase (Working Overtime) applies up to a total of 100.00%, including overlapping amounts
Applies 10.00% Damage Dealt Increase with "蒼" (Blue) Attribute (Working Overtime) to all allies with "蒼" (Blue) Attribute (4 turns)
※ The effect amount of Damage Dealt Increase with "蒼" (Blue) Attribute (Working Overtime) applies up to a total of 135.00%, including overlapping amounts
(Unlocked automatically via SP Skill 2)`;

const autoSkill1Sp = `▼ When self launches a Black Flash (once every turn)
Applies 200.00% Black Flash Rate Increase to self (4 turns)
Applies 5.00% Taijutsu Increase to self (4 turns)
Applies 5.00% Jujutsu Increase to self (4 turns)
Recovers 10 Cursed Energy for self (No Limit)
(Unlocked automatically via SP Skill 3)`;

if (nanami.auto_skills && nanami.auto_skills.length >= 2) {
  nanami.auto_skills[0].sp_description = autoSkill0Sp;
  nanami.auto_skills[1].sp_description = autoSkill1Sp;
  console.log('Added sp_description to auto_skills[0] and auto_skills[1].');
} else {
  console.error('Nanami auto_skills unexpected length:', nanami.auto_skills?.length);
  process.exit(1);
}

if (nanami.passives && nanami.passives.length >= 2) {
  nanami.passives[0].sp_description = autoSkill0Sp;
  nanami.passives[1].sp_description = autoSkill1Sp;
  console.log('Added sp_description to passives[0] and passives[1].');
}

fs.writeFileSync(charactersPath, JSON.stringify(characters, null, 2) + '\n', 'utf8');
console.log('Successfully updated characters.json with indent 2.');
