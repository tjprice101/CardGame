// Auto-generated from Card Effects/Neutrality/Neutrality Card Effects.md
export type NeutralityDocAttackOverride = {
  label: string;
  name: string;
  damage: number;
  cooldown: number;
  cost: string;
};

export type NeutralityDocOverride = {
  bullets: string[];
  abilityName?: string;
  abilityText?: string;
  attacks: NeutralityDocAttackOverride[];
};

export const NEUTRALITY_DOC_OVERRIDES: Record<string, NeutralityDocOverride> = {
  "btei-architects-manifold": {
    "bullets": [
      "On play: All Seraphim on board gain +4 Patience",
      "On play: Grant 1 Patient Light stacks",
      "On play: Look at the top 6 cards, take 2 cards, put 1 card on the bottom, and discard the rest",
      "While on board: Adjacent Seraphim and Angels gain +2 additional Patience per card played"
    ],
    "attacks": []
  },
  "btei-axiom-of-oblivion": {
    "bullets": [
      "On play: All Seraphim on board gain +5 Patience",
      "Grant 1 Patient Light stack",
      "+1200 Oblivion"
    ],
    "attacks": []
  },
  "btei-colossus-advent": {
    "bullets": [
      "On play: Designate the Seraphim with the most Patience as your Vessel",
      "On play: All Seraphim on board gain +8 Patience",
      "On play: Grant 1 Patient Light stack",
      
      "On play: +300 Oblivion",
      "While on board: +200 Oblivion per card played while active"
    ],
    "attacks": [
      {
        "label": "Unsynergized",
        "name": "Colossus Advent Vector Break",
        "damage": 2500,
        "cooldown": 5,
        "cost": "None"
      },
      {
        "label": "Synergized",
        "name": "Colossus Advent Angelic Verdict",
        "damage": 3100,
        "cooldown": 8,
        "cost": "Discard 1 card"
      }
    ]
  },
  "btei-convergence-of-eternity": {
    "bullets": [
      "On summon: All Seraphim on board gain +100 Patience",
      "On summon: Grant 1 Patient Light stacks",
      "While on board: +10 Oblivion per card played while on board"
    ],
    "attacks": [
      {
        "label": "Primary",
        "name": "Convergence of Ordinance",
        "damage": 2200,
        "cooldown": 5,
        "cost": "None"
      },
      {
        "label": "Exalted",
        "name": "Convergence of Throne Decree",
        "damage": 5000,
        "cooldown": 9,
        "cost": "Discard 2 cards"
      }
    ],
    "abilityName": "Infinite Merge",
    "abilityText": "Grant 1 Patient Light stack; Salvage any 1 card; Choose up to 1 active Cherubim and give it +4 additional durability."
  },
  "btei-eternal-vigil": {
    "bullets": [
      "On play: All Seraphim on board gain +3 Patience",
      "On play: Grant 1 Patient Light stack",
      "On play: Shuffle discard into deck",
      "While on board: +2500 Oblivion each time an Angel is summoned."
    ],
    "attacks": [
      {
        "label": "Unsynergized",
        "name": "Eternal Vigil Vector Break",
        "damage": 2550,
        "cooldown": 6,
        "cost": "None"
      },
      {
        "label": "Synergized",
        "name": "Eternal Vigil Angelic Verdict",
        "damage": 3400,
        "cooldown": 7,
        "cost": "Discard 1 card"
      }
    ]
  },
  "btei-neutrality-axiom-maw": {
    "bullets": [
      "On summon: All Seraphim on board gain +10 Patience",
      "On summon: Grant 1 Patient Light stack",
      "On summon: +1400 Oblivion",
      "While on board: +125 Oblivion per card played while on board"
    ],
    "attacks": [
      {
        "label": "Primary",
        "name": "Axiom Maw Ordinance",
        "damage": 2000,
        "cooldown": 4,
        "cost": "None"
      },
      {
        "label": "Exalted",
        "name": "Axiom Maw Throne Decree",
        "damage": 2500,
        "cooldown": 6,
        "cost": "Discard 1 card"
      }
    ],
    "abilityName": "Axiom Devour",
    "abilityText": "Grant 2 Patient Light stacks; Double all Patience on the board; All Seraphim on board gain +3 Patience; +1500 Oblivion"
  },
  "btei-neutrality-paradox-crown": {
    "bullets": [
      "Grant 1 Patient Light stacks",
      "Look at the top 4 cards, take 2 cards, put 2 cards on the bottom, and discard the rest"
    ],
    "attacks": []
  },
  "btei-neutrality-prime-equilibrium": {
    "bullets": [
      "All Seraphim on board gain +2 Patience",
      "Grant 1 Patient Light stack",
      "Salvage any 1 card",
      "+650 Oblivion"
    ],
    "attacks": []
  },
  "btei-neutrality-void-throne": {
    "bullets": [
      "On play: Double all Patience on the board",
      "On play: Grant 2 Patient Light stacks",
      "On play: Salvage any 1 card",
      "On play: +300 Oblivion",
      "While on board: +180 Oblivion whenever you play an Ophanim while active"
    ],
    "attacks": [
      {
        "label": "Unsynergized",
        "name": "Equilibrium Rex Vector Break",
        "damage": 2460,
        "cooldown": 6,
        "cost": "None"
      },
      {
        "label": "Synergized",
        "name": "Equilibrium Rex Angelic Verdict",
        "damage": 4500,
        "cooldown": 8,
        "cost": "Sacrifice 1 Serpahim on-board"
      }
    ]
  },
  "btei-neutrality-zero-edict": {
    "bullets": [
      "Grant 1 Patient Light stacks",
      "Shuffle discard into deck",
      "+200 Oblivion",
      "While on board: Increase all other Cherubim durability by +5.",
      "While on board: All Oblivion gain from Seraphim or Angel attacks increased by +3%"
    ],
    "attacks": []
  },
  "btei-null-edict": {
    "bullets": [
      "All Seraphim on board gain +10 Patience",
      "Grant 1 Patient Light stacks",
      "+250 Oblivion",
      "Discard 1 card"
    ],
    "attacks": []
  },
  "btei-omniscient-fracture": {
    "bullets": [
      "On summon: All Seraphim on board gain +8 Patience",
      "On summon: Grant 3 Patient Light stacks",
      "On summon: +600 Oblivion",
      "On attack: All Seraphim on board gain +4 Patience",
      "While on board: +200 Oblivion per card played while on board"
    ],
    "attacks": [
      {
        "label": "Primary",
        "name": "Omniscient Fracture Ordinance",
        "damage": 2600,
        "cooldown": 4,
        "cost": "None"
      },
      {
        "label": "Exalted",
        "name": "Omniscient Fracture Throne Decree",
        "damage": 5450,
        "cooldown": 9,
        "cost": "Discard 2 cards"
      }
    ],
    "abilityName": "Parallax Collapse",
    "abilityText": "Grant 1 Patient Light stack; All Seraphim on board gain +12 Patience; Seraphim attacks preserve 30% of consumed Patience this turn; +1000 Oblivion"
  },
  "btei-sovereign-domain": {
    "bullets": [
      "On play: Grant 1 Patient Light stack",
      "On play: Salvage any 1 card",
      "On play: +350 Oblivion",
      "While on board: Adjacent Seraphim and Angels gain +1 additional Patience per card played"
    ],
    "attacks": []
  },
  "btei-temporal-ruin": {
    "bullets": [
      "All Seraphim on board gain -2 Patience",
      "Grant 2 Patient Light stacks",
      "Shuffle discard into deck"
    ],
    "attacks": []
  },
  "btei-voids-reaping": {
    "bullets": [
      "All Seraphim on board gain +5",
      "Salvage any 1 card"
    ],
    "attacks": []
  },
  "cherubim-neutral-balance-mantle": {
    "bullets": [
      "On play: Search your deck for 1 Seraphim or Cherubim",
      "All Seraphim on board gain +2 Patience",
      "While on board: Buffs Seraphim attacks: base +36 Oblivion"
    ],
    "attacks": []
  },
  "cherubim-neutral-equilibrium-ward": {
    "bullets": [
      "On play: Look at the top 4 cards of your deck, take 1 card, and put the rest on the bottom",
      "While on board: Buffs Seraphim attacks: base +36."
    ],
    "attacks": []
  },
  "cherubim-neutral-null-fortify": {
    "bullets": [
      "On play: All Seraphim on board gain +3 Patience",
      "+80 Oblivion",
      "While on board: Buffs Seraphim attacks: base +36."
    ],
    "attacks": []
  },
  "cherubim-neutral-null-veil": {
    "bullets": [
      "On play: Search your deck for 1 Seraphim card",
      "While on board: Buffs Seraphim attacks: base +31."
    ],
    "attacks": []
  },
  "cherubim-neutral-still-shell": {
    "bullets": [
      "Pause current active timers by 5 seconds. (Eternal Wake, Ascension Raid, etc.)",
      "While on board: Buffs Seraphim attacks: base +40.",
      "Buffs Angel attacks: base +60."
    ],
    "attacks": []
  },
  "cherubim-neutral-void-amp": {
    "bullets": [
      "Salvage any 1 card",
      "Give 1 Seraphim of your choice currently on-board +5 Patience.",
      "While on board: Buffs Seraphim attacks: base +46.",
      "Buffs Angel attacks: base +36."
    ],
    "attacks": []
  },
  "cherubim-neutral-void-shroud": {
    "bullets": [
      "On play: Shuffle discard into deck",
      "All Seraphim on board gain +2 additional Patience",
      "While on board: Buffs Seraphim and Angel attacks: base +30."
    ],
    "attacks": []
  },
  "inf-annihilation-field": {
    "bullets": [
      "On play: All Seraphim on board gain +10 Patience",
      "Grant 2 Patient Light stacks",
      "While on board: Adjacent Seraphim and Angels gain +3 Patience per card played"
    ],
    "attacks": []
  },
  "inf-entropic-crown": {
    "bullets": [
      "On play: +3000 Oblivion",
      "All Cherubims have their durability increased by +5 cards.",
      "Grant 2 Patient Light stack.",
      "While on board: Adjacent Seraphim and Angels gain +2 Patience per card played"
    ],
    "attacks": []
  },
  "inf-eternity-rupture": {
    "bullets": [
      "On summon: All Seraphim on board gain +16 Patience",
      "On summon: Grant 2 Patient Light stacks",
      "On summon: Shuffle discard into deck",
      "+1800 Oblivion",
      "While on board: +750 Oblivion per card played while on board"
    ],
    "attacks": [
      {
        "label": "Primary",
        "name": "Eternity Rupture Ordinance",
        "damage": 5670,
        "cooldown": 6,
        "cost": "None"
      },
      {
        "label": "Exalted",
        "name": "Eternity Rupture Throne Decree",
        "damage": 7120,
        "cooldown": 9,
        "cost": "Discard 2 cards"
      }
    ],
    "abilityName": "Rupture Convergence",
    "abilityText": "Grant 1 Patient Light stack; All Seraphim on board gain +8 Patience; +3500 Oblivion;"
  },
  "inf-genesis-throne": {
    "bullets": [
      "On play: +2500 Oblivion",
      "All Seraphim on board gain +4 Patience",
      "Grant 1 Patient Light stacks",
      "While on board: +730 Oblivion per card played while active"
    ],
    "attacks": [
      {
        "label": "Unsynergized",
        "name": "Genesis Throne Vector Break",
        "damage": 7600,
        "cooldown": 7,
        "cost": "None"
      },
      {
        "label": "Synergized",
        "name": "Genesis Throne Angelic Verdict",
        "damage": 12540,
        "cooldown": 15,
        "cost": "None"
      }
    ]
  },
  "inf-null-apex": {
    "bullets": [
      "On play: Choose up to 2 Null Edict in your discard pile, add them to hand.",
      "Grant 1 Patient Light stacks",
      "+1500 Oblivion",
      "While on board: +2000 Oblivion whenever you play an Ophanim while active"
    ],
    "attacks": [
      {
        "label": "Unsynergized",
        "name": "Null Apex Vector Break",
        "damage": 6840,
        "cooldown": 6,
        "cost": "None"
      },
      {
        "label": "Synergized",
        "name": "Null Apex Angelic Verdict",
        "damage": 13800,
        "cooldown": 12,
        "cost": "Discard 1 card from hand"
      }
    ]
  },
  "inf-oblivion-absolute": {
    "bullets": [
      "+8500 Oblivion",
      "All Seraphim on board gain +15 Patience",
      "Grant 2 Patient Light stacks"
    ],
    "attacks": []
  },
  "inf-sovereign-void": {
    "bullets": [
      "On summon: All Seraphim on board gain +20 Patience",
      "On summon: +2800 Oblivion",
      "While on board: +420 Oblivion per card played while on board"
    ],
    "attacks": [
      {
        "label": "Primary",
        "name": "Sovereign Void Ordinance",
        "damage": 3970,
        "cooldown": 4,
        "cost": "None"
      },
      {
        "label": "Exalted",
        "name": "Sovereign Void Throne Decree",
        "damage": 10920,
        "cooldown": 8,
        "cost": "Discard 2 cards"
      }
    ],
    "abilityName": "Null Dominion",
    "abilityText": "Grant 3 Patient Light stacks; Double all Patience on the board; All Seraphim on board gain +10 Patience; +3000 Oblivion"
  },
  "inf-void-cascade": {
    "bullets": [
      "All Seraphim on board gain +25 Patience",
      "Grant 1 Patient Light stacks"
    ],
    "attacks": []
  },
  "ophanim-neutral-chain-pulse": {
    "bullets": [
      "All Seraphim on board gain +2 Patience",
      "+45 Oblivion",
      "Draw 1 card"
    ],
    "attacks": []
  },
  "ophanim-neutral-cherubim-recall": {
    "bullets": [
      "Salvage 2 Cherubim cards from your discard pile",
      "All Seraphim on board gain +2 Patience",
      "Discard 1 card"
    ],
    "attacks": []
  },
  "ophanim-neutral-deep-seek": {
    "bullets": [
      "Search your deck for 1 Seraphim card or Cherubim card",
      "All Seraphim on board gain +3 Patience",
      "Discard 1 card"
    ],
    "attacks": []
  },
  "ophanim-neutral-echo-pulse": {
    "bullets": [
      "All Seraphim on board gain +5 Patience",
      "Draw 1 card. If you have atleast 1 Seraphim or Angel with over 20 Patience, draw 1 additional card."
    ],
    "attacks": []
  },
  "ophanim-neutral-grand-seek": {
    "bullets": [
      "Draw 2 cards",
      "All Seraphim on board gain +2 Patience"
    ],
    "attacks": []
  },
  "ophanim-neutral-measured-seek": {
    "bullets": [
      "Look at the top 4 cards, take 1 card, put 1 card on the bottom, and discard the rest"
    ],
    "attacks": []
  },
  "ophanim-neutral-neutral-cycle": {
    "bullets": [
      "Shuffle discard into deck",
      "All Seraphim on board gain +2 Patience"
    ],
    "attacks": []
  },
  "ophanim-neutral-null-seek": {
    "bullets": [
      "Draw 2 cards"
    ],
    "attacks": []
  },
  "ophanim-neutral-nullfall": {
    "bullets": [
      "Search you deck for up to 2 Seraphim or Cherubim cards"
    ],
    "attacks": []
  },
  "ophanim-neutral-seraph-hunt": {
    "bullets": [
      "Search your deck for 1 Seraphim card",
      "All Seraphim on board gain +4 Patience"
    ],
    "attacks": []
  },
  "ophanim-neutral-seraph-recall": {
    "bullets": [
      "Salvage 1 Seraphim card",
      "All Seraphim on board gain +2 Patience",
      "Discard 1 card of your choice"
    ],
    "attacks": []
  },
  "ophanim-neutral-still-pulse": {
    "bullets": [
      "All Seraphim on board gain +2 Patience",
      "If you control 3+ active Seraphim, All Seraphim on board gain +1 additional Patience"
    ],
    "attacks": []
  },
  "ophanim-neutral-void-surge": {
    "bullets": [
      "+50 Oblivion",
      "If you control 1+ active Cherubim, +25 additional Oblivion and all Seraphim on board gain +2 Patience",
      "Draw 1 card"
    ],
    "attacks": []
  },
  "ser-neutral-balance": {
    "bullets": [
      "On play: +45 Oblivion",
      "While on board: Each time a new Cherubim is summoned, increase the durability of your other active cherubims by +2 cards.",
      "On attack: If Patience for this card is ≥ 4, draw 1 card."
    ],
    "attacks": [
      {
        "label": "Unsynergized",
        "name": "Balance Seraphim Vector Break",
        "damage": 400,
        "cooldown": 3,
        "cost": "None"
      },
      {
        "label": "Synergized",
        "name": "Balance Seraphim Angelic Verdict",
        "damage": 700,
        "cooldown": 4,
        "cost": "None"
      }
    ]
  },
  "ser-neutral-equilibrium": {
    "bullets": [
      "On play: +65 Oblivion",
      "While on board: +15 Oblivion per card played while active",
      "On attack: If Patience for this card is ≥ 4, draw 1 card."
    ],
    "attacks": [
      {
        "label": "Unsynergized",
        "name": "Equilibrium Seraphim Vector Break",
        "damage": 300,
        "cooldown": 2,
        "cost": "None"
      },
      {
        "label": "Synergized",
        "name": "Equilibrium Seraphim Angelic Verdict",
        "damage": 650,
        "cooldown": 4,
        "cost": "None"
      }
    ]
  },
  "ser-neutral-null": {
    "bullets": [
      "On play: +30 Oblivion",
      "On play: All other Seraphim currently on board gain +3 Patience",
      
      "While on board: +10 Oblivion per card played while active",
      "On attack: If Patience for this card is ≥ 4, draw 1 card."
    ],
    "attacks": [
      {
        "label": "Unsynergized",
        "name": "Null Seraphim Vector Break",
        "damage": 240,
        "cooldown": 5,
        "cost": "None"
      },
      {
        "label": "Synergized",
        "name": "Null Seraphim Angelic Verdict",
        "damage": 420,
        "cooldown": 8,
        "cost": "None"
      }
    ]
  },
  "ser-neutral-still": {
    "bullets": [
      "On play: +55 Oblivion",
      "While on board: Gain +100 Oblivion when a Cherubim expires while active",
      "If Patience ≥ 5 on attack, draw 2 cards."
    ],
    "attacks": [
      {
        "label": "Unsynergized",
        "name": "Still Seraphim Vector Break",
        "damage": 300,
        "cooldown": 3,
        "cost": "None"
      },
      {
        "label": "Synergized",
        "name": "Still Seraphim Angelic Verdict",
        "damage": 600,
        "cooldown": 5,
        "cost": "None"
      }
    ]
  },
  "ser-neutral-void": {
    "bullets": [
      "On play: +24 Oblivion",
      "While on board: +12 Oblivion whenever you play an Ophanim while active",
      "On attack: If Patience for this card is ≥ 4, draw 1 card."
    ],
    "attacks": [
      {
        "label": "Unsynergized",
        "name": "Void Seraphim Vector Break",
        "damage": 225,
        "cooldown": 5,
        "cost": "Discard 1 card"
      },
      {
        "label": "Synergized",
        "name": "Void Seraphim Angelic Verdict",
        "damage": 394,
        "cooldown": 8,
        "cost": "None"
      }
    ]
  },
  "tx-angel-starbound-null-archangel": {
    "bullets": [
      "On summon: gain 6 Equilibrium Sigils and all Seraphim gain +12 Patience",
      "While on board: Equilibrium Sigil cap increases to 16",
      "While in your deck: all Patience and Patient Light gains are uncapped",
      "After 4 cards played: spend all Sigils, double all Patience, and gain heavy Oblivion per Sigil spent"
    ],
    "attacks": [
      {
        "label": "Primary",
        "name": "Starbound Decree",
        "damage": 8600,
        "cooldown": 8,
        "cost": "None"
      },
      {
        "label": "Exalted",
        "name": "Verdict of the Last Constellation",
        "damage": 20400,
        "cooldown": 18,
        "cost": "Discard 2 cards"
      }
    ],
    "abilityName": "Starlit Equilibrium",
    "abilityText": "Spend all Sigils: double all Patience and gain +900 Oblivion per Sigil spent"
  },
  "tx-cher-null-sentinel": {
    "bullets": [
      "On play: gain 2 Equilibrium Sigils and salvage any 1 card",
      "While in your deck: all Patience and Patient Light gains are uncapped",
      "Passive: Sigil-based Patience amplification remains online while this is on board",
      "Automatically spends 4 Sigils whenever it triggers to reduce Seraphim cooldown pressure and grants +1 Patient Light each time"
    ],
    "attacks": []
  },
  "tx-oph-null-convergence": {
    "bullets": [
      "Draw 2 cards, all Seraphim gain +10 Patience, and gain 4 Equilibrium Sigils",
      "While in your deck: all Patience and Patient Light gains are uncapped",
      "If you control 3+ active Seraphim: gain +15000 Oblivion and +1 Sigil",
      "Tactical mode: may spend 6 Sigils for either massive burst Oblivion or full-team Patience restore",
      "Gain +1 Patient Light"
    ],
    "attacks": []
  },
  "tx-sera-null-entropy": {
    "bullets": [
      "On play: all Seraphim gain +8 Patience and gain 3 Equilibrium Sigils",
      "While in your deck: all Patience and Patient Light gains are uncapped",
      "While active: attacks scale heavily with your Sigils",
      "On attack: consumes Patience, then restores a Sigil-scaled portion",
      "if 10+ Patience was consumed, gain +1 Patient Light"
    ],
    "attacks": [
      {
        "label": "Unsynergized",
        "name": "Entropy Cleave",
        "damage": 7900,
        "cooldown": 7,
        "cost": "Discard 1 card"
      },
      {
        "label": "Synergized",
        "name": "Absolute Entropy",
        "damage": 20600,
        "cooldown": 14,
        "cost": "None"
      }
    ]
  }
} as const;
