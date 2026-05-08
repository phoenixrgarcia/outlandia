const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const connectDB = require("../config/db");
const env = require("../config/env");
const Character = require("../models/Character");
const Clue = require("../models/Clue");
const GameState = require("../models/GameState");
const ShopEntry = require("../models/ShopEntry");
const { currency } = require("../utils/currency");

const PHASE_CLUE_FILES = [
  { round: 1, fileName: "phase1-clues.txt" },
  { round: 2, fileName: "phase2-clues.txt" },
  { round: 3, fileName: "phase3-clues.txt" },
];

function slugify(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

function normalizeClueTitle(value) {
  return String(value || "")
    .trim()
    .replace(/:$/, "")
    .trim();
}

function normalizeClueMetadata(parts) {
  return parts
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => !/^(pink|orange)$/i.test(part));
}

function isClueHeader(line) {
  const parts = line.split(/\s+-\s+/).map((part) => part.trim()).filter(Boolean);

  return parts.length >= 2 && !/^(info\s+for|for)\s+/i.test(line.trim());
}

function audienceRulesFor(label) {
  const normalized = String(label || "").trim().toUpperCase();

  if (normalized.includes("ROYAL STAFF")) {
    return {
      factions: ["Royalty", "Royal Court", "The Workers", "The Guards"],
      classes: [],
    };
  }

  if (normalized.includes("MEDIC")) {
    return {
      factions: ["Alchemical Expressionist"],
      classes: ["Alchemist", "Botanist", "Town Kook, Alchemist"],
    };
  }

  if (normalized.includes("MAGIC")) {
    return {
      factions: ["Magicians", "The Clergy"],
      classes: [],
    };
  }

  if (normalized.includes("UNDERCITY") || normalized.includes("THE STREETS")) {
    return {
      factions: ["The Streets"],
      classes: [],
    };
  }

  return {
    factions: [],
    classes: [],
  };
}

function splitAudienceSections(lines) {
  const publicLines = [];
  const audienceSections = [];
  let activeSection = null;

  lines.forEach((line) => {
    const marker = line.match(/^(.*?)(?:Info\s+for|For)\s+([A-Za-z][A-Za-z\s/]+):\s*(.*)$/i);

    if (marker) {
      const publicPrefix = marker[1].trim();

      if (publicPrefix) {
        publicLines.push(publicPrefix);
      }

      const label = marker[2].trim();
      activeSection = {
        label,
        bodyLines: marker[3] ? [marker[3].trim()] : [],
        ...audienceRulesFor(label),
      };
      audienceSections.push(activeSection);
      return;
    }

    if (activeSection) {
      activeSection.bodyLines.push(line);
      return;
    }

    publicLines.push(line);
  });

  return {
    body: publicLines.join("\n").trim(),
    audienceSections: audienceSections
      .map((section) => ({
        label: section.label,
        body: section.bodyLines.join("\n").trim(),
        factions: section.factions,
        classes: section.classes,
      }))
      .filter((section) => section.body),
  };
}

function parseClueFile({ round, fileName }) {
  const filePath = path.resolve(__dirname, "../../agent", fileName);

  if (!fs.existsSync(filePath)) {
    return [];
  }

  const lines = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n").split("\n");
  const clues = [];
  let current = null;

  lines.forEach((line) => {
    if (isClueHeader(line)) {
      if (current) {
        clues.push(current);
      }

      const parts = line.split(/\s+-\s+/);
      current = {
        title: normalizeClueTitle(parts.shift()),
        metadata: normalizeClueMetadata(parts),
        bodyLines: [],
      };
      return;
    }

    if (current) {
      current.bodyLines.push(line);
    }
  });

  if (current) {
    clues.push(current);
  }

  return clues
    .filter((clue) => clue.title)
    .map((clue) => {
      const { body, audienceSections } = splitAudienceSections(clue.bodyLines);

      return {
        clueId: `round-${round}-${slugify(clue.title)}`,
        title: clue.title,
        summary: clue.metadata.join(" - "),
        body,
        clueType: "global",
        availableRound: round,
        audienceSections,
        isRevealedGlobally: false,
        revealedAt: null,
        revealedByCharacterId: "",
        ownerCharacterId: "",
        purchaserCharacterIds: [],
        price: currency(0, 0),
        tags: ["global", `round-${round}`],
        source: fileName,
      };
    });
}

const CHARACTER_SEEDS = [
  { characterId: "gm_abbo_arnulf", name: "Abbo Arnulf", player: "Noah", class: "GM", faction: "GMs", password: "1991", money: currency(67, 67), goals: ["Be a great GM!"], secret: ["TODO secret."], twist: ["TODO twist."], clues: ["TODO character clue."], relationships: ["TODO relationship: TODO replace with this character's relationship note."], isAdmin: true, canAdvanceRound: true },
  { characterId: "gm_alaric_arntrude", name: "Joeqen U’gah", player: "Nate R", class: "GM", faction: "GMs", password: "2007", money: currency(67, 67), goals: ["Be a great GM!"], secret: ["TODO secret."], twist: ["TODO twist."], clues: ["TODO character clue."], relationships: ["TODO relationship: TODO replace with this character's relationship note."], isAdmin: true, canAdvanceRound: true },
  { characterId: "gm_percival_rondtabel", name: "Percival RondTabel", player: "EXTRA", class: "GM", faction: "GMs", password: "1994", money: currency(67, 67), goals: ["Be a great GM!"], secret: ["TODO secret."], twist: ["TODO twist."], clues: ["TODO character clue."], relationships: ["TODO relationship: TODO replace with this character's relationship note."], isAdmin: true, canAdvanceRound: true },
  { characterId: "gm_wolfram_lodge", name: "Wolfram Lodge", player: "CJ", class: "GM", faction: "GMs", password: "1939", money: currency(67, 67), goals: ["Be a great GM!"], secret: ["TODO secret."], twist: ["TODO twist."], clues: ["TODO character clue."], relationships: ["TODO relationship: TODO replace with this character's relationship note."], isAdmin: true, canAdvanceRound: true },
  { characterId: "gm_noelle_nicaise", name: "Noëlle Nicaise", player: "Sam", class: "GM", faction: "GMs", password: "0202", money: currency(67, 67), goals: ["Be a great GM!"], secret: ["TODO secret."], twist: ["TODO twist."], clues: ["TODO character clue."], relationships: ["TODO relationship: TODO replace with this character's relationship note."], isAdmin: true, canAdvanceRound: true },
  { characterId: "royalty_sabine_valois", name: "Sabine Valois", player: "Jen", class: "Queen Ruler of Outlandia", faction: "Royalty", password: "1987", money: currency(35, 10), publicBlurb: "Panicked, guarded. Controlled but unraveling. Speaks with authority, but paranoia slips through. Treats commoners as beneath her.", goals: ["Maintain authority by having at least 3 players publicly support you.", "Learn who handled your food or drink before the incident.", "Publicly support a theory about who or what caused the chaos."], secret: ["You fear someone is trying to remove you.", "You suspect the Jester had sinister intentions.", "The King may be undermining your rule."], twist: ["Panicked: You are secretly panicked and feel someone is out to get you.", "It feels like your title just doesn’t hold the same weight it used to.", "If exposed, it could look like you orchestrated the murder of the Jester, be careful who knows of your suspicion of him."], clues: ["Watched the Jester firsthand slowly turn into a puff of smoke and then a skeleton."], relationships: ["Married to the King, but trust is strained", "Funded the Alchemist (expects loyalty and silence)", "Distrusts the Jester (even before his death)", "Supports the Court Witch despite controversy", "Has authority over all royal staff"] },
  { characterId: "royalty_yohan_valois", name: "Yohan Valois", player: "Braydon", class: "King Ruler of Outlandia", faction: "Royalty", password: "1564", money: currency(30, 15), publicBlurb: "Overconfident, commanding. Commanding and dismissive. Overconfident, rarely admits fault. Uses money and power to steer conversations", goals: ["Redirect suspicion twice.", "Learn how instability has been spreading in the court.", "Win Condition: Truth is uncovered, but not tied to you."], secret: ["You ordered someone to watch the Jester closely (indirectly).","You suspect the Queen is losing control", "Raphael unknowingly serves your plan", "You fear magic after being turned into a frog."], twist: ["Overzealous: You are overconfident in your role as the crown and feel untouchable. You are the king, and are to be respected.", "If revealed, it could seem as though you caused the Jester’s death."], clues: ["Watched the Jester firsthand slowly turn into a puff of smoke and then a skeleton."], relationships: ["Married to the Queen (growing divide)", "Secretly used intermediaries (possibly involving Raphael)", "Distrusts magic users (Witch, Sorcerer, etc.)", "Holds influence over Royal Guard and Knights"] },
  { characterId: "court_fitz_herald", name: "Fitz Herald", player: "EXTRA", class: "Archer", faction: "Royal Court", password: "3859", money: currency(28, 20), publicBlurb: "Watchful, disciplined, and uneasy. Guilty Observant.", goals: ["Mark 4 players", "Determine if your orders were legitimate"], secret: ["You were reassigned away from the kitchen. You were originally supposed to watch that exact area."], twist: ["You were originally set upon a perch watching over the Royal Hall, with a focus on watching the kitchen. However, you received a note shortly into your duties to be moved outside of the castle.", "You feel partially responsible for failing your duty to protect the attendees of the Festival."], clues: [""], relationships: ["You have questioning trust in the royal command.", "The Watchman and Knights are your fellow failures.", "You’re neutral on the undercity."] },
  { characterId: "court_livio_nivio", name: "Livio Nivio", player: "EXTRA", class: "Armorer", faction: "Royal Court", password: "2581", money: currency(28, 15), publicBlurb: "Practical, bold, and loyal to trusted allies.", goals: ["Negate 3 effects.", "Help Raphael prove loyalty."], secret: ["You crafted reinforced gloves and a sealed container recently.", "You’ve received anonymous threats warning you to stay quiet about your work."], twist: ["Friendly and brazen: You serve as the royal armorer. Your favorite customer, Raphael, the ex-guardsman has found his way back to town, hopefully he’s able to get back on favorable footing so you two can get back to business as usual."], clues: ["Heat Pattern Analysis - Physical"], relationships: ["The Knight and Royal Guard trust your work.", "You suspect the Alchemist uses dangerous materials.", "You’ve received threatening notes as of late telling you to keep quiet about your latest works."] },
  { characterId: "court_hugh_basterd", name: "Hugh Basterd", player: "Nate J", class: "Bard/Jester's Assistant", faction: "Royal Court", password: "4002", money: currency(20, 25), publicBlurb: "Emotional Storyteller. Emotional and expressive. Shares stories freely (for profit). Seeks attention and connection.", goals: ["Earn 10 gold by trading or selling information.", "Express the Jester’s personal struggles with 3 pieces of evidence."], secret: ["Jester’s wife was dying" ,"He was desperate, not just nervous"], twist: ["Mourning Storyteller: You were the Jester’s Apprentice. You knew all of his routines, but you could tell he hasn’t been himself as of late…", "Might suspect sabotage or madness."], clues: [""], relationships: ["Apprentice to the Jester", "Known among townsfolk", "Avoids Alchemist"] },
  { characterId: "court_hildegund_hundolf", name: "Hyde Hundolf the Hagiographer", player: "Dominic", class: "Scribe", faction: "Royal Court", password: "0080", money: currency(28, 15), publicBlurb: "Observant recorder. Analytical and observant. Speaks in facts. Distrusts incomplete information", goals: ["Identify at least 1 suspicious or altered record.", "Catch 2 contradictions in others’ testimonies."], secret: ["Your notes were tampered with."], twist: ["Tapped-in: You serve the royals as long as they remain useful to your ambitions. You chronicle their successes just as well as the failures of the kingdom and you’ve come to find someone has been keeping a rather close eye on you as well. You were too infatuated with your writing you failed to notice what had just occurred on the royal floor.", "Your notes implicate someone powerful, and someone wants them destroyed."], clues: ["Notes binder (some torn out and missing) - Physical"], relationships: ["Works for the King and Queen, their orders go through you.", "You’ve recently been targeted by a Thief", "Observed by Monk"] },
  { characterId: "guard_sigrid_tomb", name: "Sigrid Tomb", player: "Makhai", class: "Royal Guard", faction: "The Guards", password: "1903", money: currency(30, 10), publicBlurb: "Loyal, authoritative, and protective of the crown. Serious and disciplined. Suspicious of outsiders. Focused on control.", goals: ["Question or challenge 3 players", "Determine where the failures in security occurred"], secret: ["You were indirectly told to keep an eye on the Jester, but failed.", "After the incident, you noticed something off with the Queen’s chalice."], twist: ["Indebted and loyal: You owe your life to royals. After your family’s acrobatic show went haywire, they took you in as their own. You can’t believe you let something this bad happen so close to them!", "You’re willing to frame someone if it stabilizes the court."], clues: [""], relationships: ["Loyal to King and Queen", "Works with Knights and Armorer", "Watches the ex-Guardsman, he acts without authority, but not without loyalty."] },
  { characterId: "guard_raphael_regalis", name: "Raphael Regalis", player: "Alex", class: "Barbarian, Ex-Guardsman", faction: "The Guards", password: "4040", money: currency(28, 10), publicBlurb: "Fanatically loyal. Intense and defensive. Constantly trying to prove loyalty. Quick to accuse others", goals: ["Justify your actions to 2 players", "Understand how the situation escalated out of control", "Win Condition: Not blamed for Jester’s death with someone else taking the blame"], secret: ["You forced the Jester to drink the vial.", "You knocked the Baker unconscious."], twist: ["Fanatical: Overly loyal to the crown, you would lay your life on the sword before bending the knee to any who would cause harm to the royals.", "You may have caused his death."], clues: ["A guard report - Physical"], relationships: ["Formerly served the King and Queen", "Trusted by the Armorer", "Known by the Royal Guard", "Distrusted by Clerics"] },
  { characterId: "guard_van_ailsing", name: "Van Belsing", player: "Kayla", class: "Knight A", faction: "The Guards", password: "1720", money: currency(25, 10), publicBlurb: "Energetic, competitive, and reckless.", goals: ["Win 3 duels AND learn a secret from an opponent.", "Duel a guilty party at least once."], secret: ["You abandoned your post to go play games and gamble. However, you DID see Raphael forcefully enter the kitchen."], twist: ["Energetic and rivalrous: Rival to Knight B, Rabot, you wish to outperform them in any way possible. You wished to best them at a card game and were successful in doing so. While you were wiping the floor with him and the Watchman, dangerous events unfolded in front of the king and queen!", "You saw Raphael leave the kitchen in a defeated huff."], clues: ["Witnessed Raphael enter the kitchen forcefully."], relationships: ["You’re loyal to the crown.", "Raphael is a dangerous individual, but he’s loyal to the family.", "In your rebellious phase you met with a sorcerer and they told you the date the Jester would die. You didn’t believe them until now."] },
  { characterId: "guard_rabot_the_brave", name: "Rabot the Brave", player: "Carter", class: "Knight B", faction: "The Guards", password: "2002", money: currency(25, 10), publicBlurb: "Defensive, loyal, and easily frustrated.", goals: ["Protect 3 players from harm", "Take a hit meant for royalty."], secret: ["You abandoned your post to go gambling.", "You’re more worried about the Queen discovering your failure than the crime itself."], twist: ["Contentious and emulous: Rival to Knight A, but you often try to act like you’d rather they would stop bothering you so much. You both were locked in a heated card game with the Watchman, who knows how the royals will feel to know you were goofing again while something dangerous happened in their festival no less.", "Van Belsing is always blaming stuff on you."], clues: ["Witnessed Raphael enter the kitchen forcefully."], relationships: ["You’re incredibly loyal to the Queen.", "Tensions rise often with the Royal Guard over authority.", "You have a strong distrust with magic users. Especially the dreaded Sorcerer and Druid."] },
  { characterId: "guard_durr_vinelight", name: "Durr Vinelight", player: "EXTRA", class: "Paladin", faction: "The Guards", password: "9999", money: currency(30, 10), publicBlurb: "Devout, rigid, and morally uncompromising.", goals: ["Force 3 players to tell the truth.", "Never lie"], secret: ["You were warned by your divine order that a dark power would rise tied to a death tonight.", "You suspect the Jester’s death may have empowered something…or someone."], twist: ["Devoted: As your goddess demands, you have sworn fealty to this kingdom. You were performing a small prayer when you suddenly heard screaming coming from the Grand Hall…", "You’re willing to kill for your faith.."], clues: [""], relationships: ["You distrust the clerics and the blasted cultist, they believe in false gods and evil.", "You believe the dream druid, your order deems her trustworthy."] },
  { characterId: "guard_vudo_surebrick", name: "Vudo Surebrick", player: "EXTRA", class: "Watchman", faction: "The Guards", password: "0040", money: currency(18, 15), publicBlurb: "Nervous, guilty, and reactive. Easily pressured. Avoids confrontation.", goals: ["Identify 2 actions.", "Expose 1 lie."], secret: ["You abandoned your post to gamble with the knights and missed everything important. You’re terrified this will come out."], twist: ["Contritely diverted: You were NOT watching the hall as you were supposed to. You were playing cards with the Twin Knights.", "You fear being punished for negligence."], clues: [""], relationships: ["You fear the royals and now work with their highest Knights.", "Answerable to Royal Guard"] },
  { characterId: "alchemist_attila_bastian", name: "Attila Bastian", player: "Jaq", class: "Botanist", faction: "Alchemical Expressionist", password: "1001", money: currency(28, 25), publicBlurb: "Detached, logical, and precise.", goals: ["Use potions on 5 players", "Cause 2 failed rolls."], secret: ["You were an apprentice of the Alchemist, in your work with them you’ve come to recognize a lot of their handiwork. This event seems very familiar to their medical treatments."], twist: ["Detached and cool: You were once the apprentice of the Town Alchemist, but you shortly realized his experiments had made him go mad. Now, you perform your own alchemical miracles, hoping your past can stay just that.", "Two people were near the kitchen, but only one admitted it."], clues: ["Knows this poison was used before. You know it was used"], relationships: ["The Alchemist is your former master, now you only see them as dangerous and unreliable.", "You have an old and quiet trust with the Cobbler.", "The Street urchin fetches you useful field samples and information.", "The Royal Court is indifferent, except when it comes to funding or access matters."] },
  { characterId: "alchemist_pax_patience", name: "Pax Patience", player: "Phoenix", class: "Town Kook, Alchemist", faction: "Alchemical Expressionist", password: "5841", money: currency(28, 15), publicBlurb: "Unstable Genius. Erratic and arrogant. More interested in results than morality. Treats people like experiments.", goals: ["Be publicly dismissed 3 times.", "Convince at least 2 players your work was misunderstood."], secret: ["You have created a plethora of original poisons, even experimenting on people with them."], twist: ["Kooky with hubris: You’ve had plenty of assistants, but they all leave you in the end. Your one constant: your experiments and lack of protective gear. Though they have rendered your mind a shattered mirror of itself, you still find yourself in love with your craft. In fact tonight, you find yourself more interested in the success of the spectacle of the Jester’s demise than the morality of the situation.", "You can identify the poison instantly, but you continue to go on and on about how something’s off with the toxin whenever asked about it, almost as if offended. You admire the craftsmanship and ask who made it like a fan rather than an investigator."], clues: ["Knows the type of poison, but it is unlike your original version."], relationships: ["Former mentor to Botanist, Horologist, others", "Funded by the Queen", "Known (and feared) by many."] },
  { characterId: "magician_olga_woodland_hearth", name: "Olga of the Woodland Hearth", player: "EXTRA", class: "Court Witch", faction: "Magicians", password: "1986", money: currency(20, 15), publicBlurb: "Deceptive, theatrical. Dramatic and performative. Overconfident in “abilities”. Deflects with flair and nonsense.", goals: ["“Hex” 3 players.", "Convince 2 players you are magical."], secret: ["You are a fraud."], twist: ["Cleverly loquacious and deceptive: The royal court financially supports your magical endeavors. It’s just too bad you’re a fraud.", "You interpret the death as magic related."], clues: [""], relationships: ["Supported by the Queen", "Distrusted by King and Clerics", "Suspicious of Alchemist/Botanist"] },
  { characterId: "magician_volkran_channeler", name: "Volkran the Channeler", player: "EXTRA", class: "Sorcerer", faction: "Magicians", password: "2001", money: currency(25, 15), publicBlurb: "Ashamed, curious. Defensive but curious. Slightly unhinged. Leans into mystery.", goals: ["Double 3 rewards.", "Demonstrate your magical expertise twice."], secret: ["You felt surge of power during the death."], twist: ["Ashamed: Once a master to many apprentices and a member of the royal board, you have since been shamed by the royal family after a misinput during a spell that ended up turning the king into a frog for a week. Now ye haunt your old tower, occasionally visiting the kingdom below in hopes of a moment to help reinstate your noble status.", "Once a round you can tap into the energy. Roll a d6! 1-2: Nothing happens, but something feels wrong. 3-4: Detect magic at work, you can disrupt another player’s ability. 5-6: Dangerous Surge, something unintended will happen."], clues: ["Observed the Jester was distressed earlier."], relationships: ["Formerly part of royal court", "Mentor to Warlock", "Feared by many."] },
  { characterId: "magician_marion_bluthers", name: "Marion Bluthers", player: "EXTRA", class: "Warlock", faction: "Magicians", password: "0303", money: currency(25, 15), publicBlurb: "Frazzled, conflicted, and drawn to power. Impressionable. Volatile.", goals: ["Make 3 players reveal truths", "End with 2+ suspicion"], secret: ["You felt a surge of power at the moment of the Jester’s death.", "Something about it fed into darker forces."], twist: ["Frazzled and torn: An apprentice of the sorcerer, you promised fealty to a god of death or two."], clues: [""], relationships: ["The Sorcerer is a mentor figure in an admirably unstable and scary kind of way.", "You share a dark belief system with the Cultist, but do not fully align", "The Clerics only care to suppress the truth.", "The ex-Guardsman is emotionally loud, and especially readable."] },
  { characterId: "magician_penelope_pura", name: "Penelope Pura", player: "EXTRA", class: "Dream Druid (Fey)", faction: "Magicians", password: "5876", money: currency(28, 15), publicBlurb: "Hazy, cryptic, and otherworldly. Dreamlike, interpretive, distant.", goals: ["Interpret the Jester’s death", "Use or react to a clue."], secret: ["You received a vision late last night from a guardian humming to you: “The Jester a hard drinker. Surrounded by fire and laughter. A second figure appears unclear. They now are encompassed by fear.”"], twist: ["Hazy daydreamer: You hail from a dreamlike realm, venturing out to witness the kingdoms of the surrounding realms. You’ve made it just in time for the Royal Festival that rings its bells throughout the nation.", "Your visions include the death of someone close to the Jester."], clues: ["“You sense the Jester was both a victim…and responsible.”"], relationships: ["The Sorcerer shares a rather strange connection to you.", "The Witch respects your visions.", "Others like the court officials doubt your sanity."] },
  { characterId: "magician_calypso_caspian", name: "Calypso Caspian", player: "Jax", class: "Sea Druid", faction: "Magicians", password: "6865", money: currency(28, 12), publicBlurb: "Cold, calculating, and detached. Mildly superior. Evaluative.", goals: ["Force payments or suspicion 3 times.", "End with 20+ gold."], secret: ["You’ve seen this type of melting death before near the coast. This isn’t entirely new."], twist: ["Shrewdly tyrannical: You rule the kingdom beneath the waves, but made your way to the surface today to fulfill the invitation sent by the terrestrials above.", "The residue feels refined, processed, yet unstable."], clues: [""], relationships: ["You view all surface nobles as chaotic and short-sighted", "You can plausibly see the Sorcerer tapping into deeper forces.", "You share a subtle kinship through perception with the Dream Druid."] },
  { characterId: "clergy_raven_ratelm", name: "Raven Ratelm", player: "Makhai's GF", class: "High Priestess (Light Cleric)", faction: "The Clergy", password: "2006", money: currency(30, 15), publicBlurb: "Doubtful but loyal. Thoughtful but troubled. Speaks with quiet authority. Questions everything internally.", goals: ["Speak to 2 players about the state of the kingdom.", "Remove suspicion from 3 players."], secret: ["Corruption exists and is deeply rooted in the court."], twist: ["Troubled and ambivalent: You head the royal clergy. You pray and pray, but the kingdom continues to decline. Has your god abandoned you? It seems so with the continued death today… ", "Truth could destabilize the crown."], clues: ["Letter from Concerned Wife (Jester’s Wife) - Physical"], relationships: ["Leads the Clerics", "Clashes with War Cleric", "Observes the royal family closely"] },
  { characterId: "clergy_sidonia_solomona", name: "Sidonia Lunite", player: "EXTRA", class: "Twilight Cleric", faction: "The Clergy", password: "3002", money: currency(20, 10), publicBlurb: "Calm and protective. Morally firm. Steps in to reduce chaos.", goals: ["Prevent 3 suspicion gains.", "End with 0 suspicion."], secret: ["You enjoy speaking to dead more so than alive people."], twist: ["Responsible and Protective: You serve as one of the royals’ clerics. You may not always get along with your clergymen, but you serve as a mighty protector of the wellbeing of the kingdom."], clues: [""], relationships: ["Serves the royal family", "Distrusts Raphael", "Watches Horologist carefully"] },
  { characterId: "clergy_maura_mary_anna", name: "Maura Mary-Anna", player: "EXTRA", class: "Cleric of War", faction: "The Clergy", password: "3214", money: currency(18, 10), publicBlurb: "Aggressive, competitive, and forceful. Zealous. Enforcer. Righteous.", goals: ["Win 3 contests", "Extract 15+ gold."], secret: ["You were ready to act on a perceived threat even without proof.", "You suspect this was part of a larger conspiracy."], twist: ["Competitively devoted: A part of the royal war room, you mainly spend time in the clergy. **Yet, with all this excitement your need for contest bubbles to the surface.", "You are prepared to sanction violence if a culprit is confirmed."], clues: ["Signs of aggression” note - Physical"], relationships: ["You have a respectful rivalry with the Paladin, with some ideological overlap", "The Light Cleric serves as your philosophical opposite.", "You work with the Knights and Guards as operational allies.", "You view the Cultist as a heretical threat."] },
  { characterId: "worker_solina_suspecta", name: "Solina Suspecta", player: "Jenna", class: "Alewife", faction: "The Workers", password: "7193", money: currency(15, 20), publicBlurb: "Observant. Practical and grounded. Notices details others miss. Will talk—for a price.", goals: ["Influence 2 players’ opinions.", "Clarify what happened around the time of the incident.", "Support or challenge a timeline publicly."], secret: ["You found baker was unconscious in kitchen.", "Jester seemed distressed going into his performance."], twist: ["Attentive and diligent: In charge of the local tavern you’ve heard your fair share of disparaging comments about the royal family. Now, you’ve been employed by them to supply drinks for the royal festival. Little did you know when you woke up this morning with your morning beer that you would watch a man full on melt like this…", "You have to prove you didn’t poison the Jester’s drink, he pulled it off your tray so quickly, now eyes are turning on you for something out of your control."], clues: ["Rumor of Jester acting erratic earlier, swiping the chalice to dip on himself - Physical"], relationships: ["Works with Baker", "Observes many townsfolk", "Serves everyone"] },
  { characterId: "worker_wendela_lunites", name: "Wendela Baker", player: "CC", class: "Baker", faction: "The Workers", password: "8462", money: currency(20, 10), publicBlurb: "Dismayed, guilty. Nervous and guilt-ridden. Defensive about the kitchen. Sympathetic toward lower class.", goals: ["Remove 3 suspicion.", "Determine who accessed your kitchen workspace.", "Convince 2 players of your reliability."], secret: ["You allowed the Jester access to the kitchen.", "You were knocked out during the incident."], twist: ["Dismayed: Your craft is your life. Once a beggar, you were able to fix your life when you served the queen sourdough bread. You were designated the royal baker and were in charge of heading the kitchen. Now,you feel extreme dread over allowing such violence be carried out in your kitchen.", "Last thing you saw before you were knocked unconscious, was Raphael forcing his way into the royal kitchen, shoving you aside into the island counter corner."], clues: ["Kitchen access note, Jester seemed rushed and a bit nervous, must be because of his show. - Physical"], relationships: ["Loyal to the Queen and King", "Works closely with the Alewife", "Interacted directly with the Jester before death"] },
  { characterId: "worker_tyrus_tithe", name: "Tyrus Tithe", player: "EXTRA", class: "Blacksmith", faction: "The Workers", password: "1591", money: currency(28, 10), publicBlurb: "Dutiful, energetic, dedicated.", goals: ["Boost 2 other players.", "Exchange information 3 times."], secret: ["The ex-guardsman without no evidence violently arrested you before he was stripped of his title and exiled."], twist: [""], clues: [""], relationships: ["You are not quite fond of the ex-guardsman", "The royals treat you and so do their staff as you provide ample service to them", "You get your materials for your craft from the Undercity"] },
  { characterId: "worker_elisanna_einarr", name: "Elisanna Einarr", player: "EXTRA", class: "Cobbler", faction: "The Workers", password: "7537", money: currency(28, 35), publicBlurb: "Quietly observant and business-minded.", goals: ["Protect 3 players.", "Stay under 2 suspicion."], secret: ["You’ve identified distinct footprints: Someone ran into the hall from outside. The same dirt appears in the kitchen."], twist: ["Discreet business-focused: An unseen wealthy figure of the kingdom, you supply most of if not all of the leatherwear in the kingdom. You’ve come to the Royal Festival to promote your newest footwear and leather coat products, however, it seems it won’t  be a regular promotional venture.", "You can place Raphael or the Horologist at a suspicious location."], clues: [""], relationships: ["You quietly observe everyone and every shoe", "The Guard undervalues you, even though you’ve given them strong footwear", "The Urchin likes to feed you information"] },
  { characterId: "worker_una_urgellesa", name: "Úna Urgellesa", player: "Melina", class: "Crier, Horologist", faction: "The Workers", password: "8741", money: currency(20, 10), publicBlurb: "Bitter, controlled. Calm but bitter. Speaks carefully, always calculated. Pushes subtle anti-royal sentiment.", goals: ["Avoid being exposed as poison creator.","Spread at least 1 believable false theory.", "Win Condition: Not accused of creating poison."], secret: ["You enhanced the Alchemist’s poison", "You planned to target the Queen.", "The Jester’s wife died unexpectedly from it."], twist: ["Chagrin: You’re angered by the royal’s treatment of you and the rest of those they’ve tossed to the streets. They continue to treat you as some invisible entity, yet they allow you in their homes, confident you’ll never betray them. To top it off your plan has gone completely awry and all of your allies have ended up dead.", "The poison can be traced back to you."], clues: ["Missing timelogs for festival"], relationships: ["Knew the Jester personally", "Former apprentice of the Alchemist", "Connected to the Scribe (interested in records)"] },
  { characterId: "worker_viktor_bastian", name: "Viktor Bastian", player: "EXTRA", class: "Minstrel (Performer)", faction: "The Workers", password: "8521", money: currency(20, 35), publicBlurb: "Petty rumor-spreader. Petty and loud. Loves spreading rumors. Thrives on drama.", goals: ["Spread 2 false rumors, with 1 true."], secret: ["You despised the Jester, he usurped you as your apprentice."], twist: ["Elated scandalmonger: The Jester usurped you as the Royal Court Jester. He was your apprentice once, and publicly humiliated you.", "You notice the Jester’s wife isn’t anywhere near the party tonight. How uncharacteristic of her."], clues: [""], relationships: ["Rival of the Jester", "Known by royals (negatively)", "Engages with gossipers"] },
  { characterId: "street_darwin_durand", name: "Darwin Durand", player: "EXTRA", class: "Beggar", faction: "The Streets", password: "9632", money: currency(6, 25), publicBlurb: "Bitter survivor. Bitter but desperate. Talks freely for coin. Holds grudges against royals.", goals: ["Find evidence of how the royals affect ordinary people.", "Gain monetary help from 2 players."], secret: ["A vial hit you from the kitchen window."], twist: ["Disheveled but driven: Once a royal vizier, you have been dishonorably discharged for questioning the king. Now, you scour the streets fighting for your survival. A far cry from the life of luxury you thrived in.", "No one really notices you, this makes it quite easy to pose as a fly on the wall so to speak."], clues: ["Saw Thief near kitchen"], relationships: ["Interacts with anyone willing to pay", "Formerly tied to royal court"] },
  { characterId: "street_valerius_shadow", name: "Valerius the Shadow", player: "Katie", class: "Street Urchin", faction: "The Streets", password: "2369", money: currency(10, 25), publicBlurb: "Opportunistic. Opportunistic and quick. Trades info for profit. Never gives full story upfront.", goals: ["Steal from 4 players.", "Trade or sell info 3 times."], secret: ["You saw the Horologist leaving the Jester’s house. Heard arguing after"], twist: ["Youthful: Once a noble, you now live on the streets after your family fell on hard times. You hoped to find work or discarded valuables near the castle but there seems to be a commotion today.", "You’ve been hearing the Jester and his wife have had a strained relationship as of late."], clues: ["Horologist late night meeting sighting."], relationships: ["Friendly with Cobbler", "Observes Horologist", "Moves through all social groups"] },
  { characterId: "street_justa_justice", name: "Justa Justice", player: "EXTRA", class: "Rogue", faction: "The Streets", password: "1258", money: currency(22, 20), publicBlurb: "Charming, vengeful. Smooth and manipulative. Always probing for leverage. Rarely fully honest.", goals: ["Learn 1 secret via blackmail", "End with <2 suspicion"], secret: ["You were approached to kill the King."], twist: ["Charming and attentive: Your family once ran a church sponsored by the royal family, until they pulled your funding and cast your family into the dark, labeling you as a dangerous individual. Now you use your remaining charm and knowledge of the rich to destroy those who betrayed your family."], clues: [""], relationships: ["Deals with Sorcerer occasionally", "Operates in undercity", "Disconnected from royals"] },
  { characterId: "street_quintina_quintius", name: "Quintina Quintius", player: "Fae", class: "Thief", faction: "The Streets", password: "1475", money: currency(15, 30), publicBlurb: "Slippery kleptomaniac. Sneaky and self-serving. Avoids direct conflict. Always looking for profit", goals: ["Attempt 6 thefts.", "End with more gold than you started by trading information or goods."], secret: ["You enjoy stealing and reselling the notes of the scribe.", "Recently, you stole a modified timepiece that smells faintly of chemicals. It looks like it could hold a vial. You suspect it belonged to someone important."], twist: ["Slippery kleptomaniac: Running the street markets (and less than legal ones in the city’s underbelly) requires a quiet hand to receive valuable goods for your clients. The Royal Festival should prove to hold many business opportunities for yourself.", "You stole a strange thing from someone earlier."], clues: ["Strange timepiece container with hollow compartment."], relationships: ["You’re being hunted by the Royal Guard.", "You sold the Beggar a cow you stole, and they still refuse to pay you for it.", "You’ve been stealing the scribes' notes and selling them to any who take them. Sadly, you don’t have any on you at the moment."] },
  { characterId: "street_liudmila_lefhild", name: "Liudmila Lefhild", player: "EXTRA", class: "Dark Cultist", faction: "The Streets", password: "6794", money: currency(20, 15), publicBlurb: "Fanatical, manipulative. Quiet but intense. Speaks in unsettling certainty. Twists facts to fit beliefs.", goals: ["Convince 2 players the Sorcerer caused this.", "Spread 5 suspicion."], secret: ["This was a ritual tied to dark powers.", "You manipulate Raphael’s guilt."], twist: ["Withdrawn and Impressionable: You once spent years as a shut-in until a book arrived on your doorstep. You followed its teachings and one day found its voice guiding you to the Royal Festival. Now here, you feel a strong pull towards the power of the Sorcerer, the same from your book of Bhaal’s teachings.", "Claim the death was a ritualistic sacrifice. The sorcerer must have felt the ritualistic surge. You want to help them channel this power."], clues: ["Ritual rumor, “This could be ritual energy…”"], relationships: ["Fixated on the Sorcerer", "Previously worked with the Alchemist", "Unsettles Clerics and Monk"] },
  { characterId: "street_isabel_einarr", name: "Isabel Einarr", player: "EXTRA", class: "Monk/Spymaster", faction: "The Streets", password: "8423", money: currency(20, 20), publicBlurb: "Reserved, analytical, and always watching. Detached, methodical.", goals: ["Learn 3 true secrets. Reveal 1 crucial truth publicly."], secret: ["You were assigned to investigate the Horologist. You’ve already noticed inconsistencies in timekeeping records."], twist: ["Reserved and secretive but never reclusive: You’ve been hired by the king to go undercover here and there. You were too busy watching the scribe scribble away at his notes about a meeting that you failed to notice the disastrous events taking place on the royal floor!", "You believe the Jester chose death in some form."], clues: ["Burnt costume fragment - Physical"], relationships: ["Work for the King, but not fully trusted", "The Horologist has been your primary investigation report", "You trust in the Clerics divine power", "The Cultist unsettles you"] },
  { characterId: "street_dread_pirate_jewels", name: "Dread Pirate Jewels", player: "EXTRA", class: "Raider", faction: "The Streets", password: "3257", money: currency(15, 30), publicBlurb: "Aggressive, opportunistic, and anti-royal. Dangerous.", goals: ["Steal 20 gold.", "Reach highest wealth."], secret: ["You were hired by a wealthy figure to carry out an assassination likely a royal, but were arrested before acting."], twist: ["Angrily scheming: You were invited here to carry out an assasination job by someone you suspect to be a royal. But, as soon as you arrived you were arrested for conspiracy. During all the commotion you were able to escape, but the circumstances of your hiring still boggle you.", "You could benefit from the chaos to complete your original mission and escape with your life."], clues: [""], relationships: ["You have a strung hatred and distrust of the Royals", "Neutral to all others"] },
];

const GLOBAL_CLUES = PHASE_CLUE_FILES.flatMap(parseClueFile);

const PLACEHOLDER_SHOP_CLUES = [
  {
    clueId: "shop-private-clue-01",
    title: "TODO Private Shop Clue 01",
    summary: "TODO placeholder preview for a private clue available from the shop.",
    body: "TODO Private Shop Clue Placeholder: Replace this with final purchased clue text after writers provide approved content.",
    price: currency(4, 0),
  },
  {
    clueId: "shop-private-clue-02",
    title: "TODO Private Shop Clue 02",
    summary: "TODO placeholder preview for a second private clue available from the shop.",
    body: "TODO Private Shop Clue Placeholder: This clue should remain private to the buyer when purchase behavior is implemented.",
    price: currency(7, 0),
  },
  {
    clueId: "shop-private-clue-03",
    title: "TODO Private Shop Clue 03",
    summary: "TODO placeholder preview for a higher-cost private clue.",
    body: "TODO Private Shop Clue Placeholder: This is seeded only to prove shop list behavior.",
    price: currency(10, 0),
  },
];

const PLACEHOLDER_SHOP_ENTRIES = [
  {
    shopId: "shop-item-01",
    type: "item",
    name: "TODO Consumable Item 01",
    description: "TODO placeholder shop item description.",
    price: currency(2, 0),
    itemTemplate: {
      itemId: "todo-consumable-item-01",
      name: "TODO Consumable Item 01",
      note: "TODO replace with final item effect notes.",
      quantity: 1,
    },
    sortOrder: 10,
  },
  {
    shopId: "shop-item-02",
    type: "item",
    name: "TODO Consumable Item 02",
    description: "TODO placeholder shop item description.",
    price: currency(5, 0),
    itemTemplate: {
      itemId: "todo-consumable-item-02",
      name: "TODO Consumable Item 02",
      note: "TODO replace with final item effect notes.",
      quantity: 1,
    },
    sortOrder: 20,
  },
  {
    shopId: "shop-poison-01",
    type: "item",
    name: "Sample Poison",
    description: "Test item for Phase 4 notifications. Choose a target to receive the Poisoned status.",
    price: currency(1, 0),
    itemTemplate: {
      itemId: "sample-poison",
      name: "Sample Poison",
      note: "Testing only: applies Poisoned to a selected target.",
      quantity: 1,
    },
    sortOrder: 30,
  },
  ...PLACEHOLDER_SHOP_CLUES.map((clue, index) => ({
    shopId: `shop-clue-0${index + 1}`,
    type: "clue",
    name: clue.title,
    description: clue.summary,
    price: clue.price,
    clueId: clue.clueId,
    sortOrder: 100 + index,
  })),
];

function createCharacter(seed, index, passwordHash) {
  const isAdmin = Boolean(seed.isAdmin || seed.faction === "GMs");
  const isDead = Boolean(seed.isDead);

  return {
    characterId: seed.characterId,
    name: seed.name,
    player: seed.player,
    class: seed.class,
    faction: seed.faction,
    publicBlurb: seed.publicBlurb || "",
    passwordHash,
    inventory: seed.inventory || [],
    secret: seed.secret || [],
    twist: seed.twist || [],
    goals: seed.goals || [],
    clues: seed.clues || [],
    purchasedClueIds: [],
    privateInformation: seed.privateInformation || [],
    relationships: seed.relationships || [],
    money: seed.money || (index === 0
      ? currency(0, 0)
      : currency(5 + index, 3 + index)),
    isAdmin,
    canAdvanceRound: Boolean(seed.canAdvanceRound),
    isDead,
    statuses: isDead
      ? [
          {
            statusId: "dead-placeholder",
            name: "Dead placeholder for UI testing",
            note: "TODO replace if this character remains dead in final content.",
          },
        ]
      : [],
    modifiers: [],
  };
}

async function seed() {
  if (!env.MONGODB_URI) {
    console.log("MONGODB_URI is not set. Seed skipped.");
    console.log("Add a MongoDB connection string to .env before seeding placeholder data.");
    return;
  }

  await connectDB();

  const characterDocs = await Promise.all(
    CHARACTER_SEEDS.map(async (seed, index) => {
      const passwordHash = await bcrypt.hash(seed.password, 10);
      return createCharacter(seed, index, passwordHash);
    })
  );

  await Character.deleteMany({});
  await Character.bulkWrite(
    characterDocs.map((character) => ({
      updateOne: {
        filter: { characterId: character.characterId },
        update: { $set: character },
        upsert: true,
      },
    }))
  );

  const existingGlobalClues = await Clue.find({ clueType: "global" })
    .select("clueId isRevealedGlobally revealedAt revealedByCharacterId")
    .lean();
  const existingGlobalClueMap = new Map(existingGlobalClues.map((clue) => [clue.clueId, clue]));
  const clueDocs = GLOBAL_CLUES.map((clue) => {
    const existingClue = existingGlobalClueMap.get(clue.clueId);

    return {
      ...clue,
      isRevealedGlobally: existingClue?.isRevealedGlobally || false,
      revealedAt: existingClue?.revealedAt || null,
      revealedByCharacterId: existingClue?.revealedByCharacterId || "",
    };
  });

  await Clue.deleteMany({ clueType: "global" });
  await Clue.bulkWrite(
    clueDocs.map((clue) => ({
      updateOne: {
        filter: { clueId: clue.clueId },
        update: { $set: clue },
        upsert: true,
      },
    }))
  );

  const shopClueDocs = PLACEHOLDER_SHOP_CLUES.map((clue) => ({
    ...clue,
    clueType: "shop",
    isRevealedGlobally: false,
    revealedAt: null,
    revealedByCharacterId: "",
    ownerCharacterId: "",
    purchaserCharacterIds: [],
    tags: ["TODO", "shop-placeholder"],
    source: "phase-4-placeholder-seed",
  }));

  await Clue.bulkWrite(
    shopClueDocs.map((clue) => ({
      updateOne: {
        filter: { clueId: clue.clueId },
        update: { $set: clue },
        upsert: true,
      },
    }))
  );

  await ShopEntry.bulkWrite(
    PLACEHOLDER_SHOP_ENTRIES.map((entry) => ({
      updateOne: {
        filter: { shopId: entry.shopId },
        update: { $set: { ...entry, active: true } },
        upsert: true,
      },
    }))
  );

  await GameState.updateOne(
    { key: "main" },
    {
      $set: {
        globalClueIds: clueDocs
          .filter((clue) => clue.isRevealedGlobally)
          .map((clue) => clue.clueId),
        deadCharacterIds: characterDocs
          .filter((character) => character.isDead)
          .map((character) => character.characterId),
      },
      $setOnInsert: {
        key: "main",
        currentRound: 1,
        roundStartedAt: new Date(),
        statuses: [],
      },
    },
    { upsert: true }
  );

  console.log(`Seed complete: ${characterDocs.length} characters, ${clueDocs.length} global clues, ${PLACEHOLDER_SHOP_ENTRIES.length} shop entries, and game state.`);
}

seed().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  await mongoose.disconnect();
});
