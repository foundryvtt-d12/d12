export const D12 = {};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
D12.abilities = {
  str: "D12.Ability.str.long",
  agi: "D12.Ability.agi.long",
  int: "D12.Ability.int.long",
  per: "D12.Ability.per.long",
  cha: "D12.Ability.cha.long",
};

D12.abilityAbbreviations = {
  str: "D12.Ability.str.abbr",
  agi: "D12.Ability.agi.abbr",
  int: "D12.Ability.int.abbr",
  per: "D12.Ability.per.abbr",
  cha: "D12.Ability.cha.abbr",
};

D12.defenses = {
  arm: "D12.Defense.Armor.long",
  end: "D12.Defense.Endurance.long",
  wil: "D12.Defense.Willpower.long"
};

D12.defenseAbbreviations = {
  arm: "D12.Defense.Armor.abbr",
  end: "D12.Defense.Endurance.abbr",
  wil: "D12.Defense.Willpower.abbr"
};

D12.rarities = {
  common: "D12.Rarity.Common",
  rare: "D12.Rarity.Rare",
  epic: "D12.Rarity.Epic",
  legendary: "D12.Rarity.Legendary"
};

D12.actionTypes = {
  attack: "D12.Action.Type.Attack",
  use: "D12.Action.Type.Use",
  cast: "D12.Action.Type.Cast",
  activate: "D12.Action.Type.Activate",
  apply: "D12.Action.Type.Apply",
  consume: "D12.Action.Type.Consume"
};

D12.item = {
  categories: {
    item: "D12.Item.Category.Item",
    weapon: "D12.Item.Category.Weapon",
    armor: "D12.Item.Category.Armor",
    accessory: "D12.Item.Category.Accessory",
    consumable: "D12.Item.Category.Consumable"
  }
};

D12.spell = {
  categories: {
    spell: "D12.Item.Category.Spell",
    trait: "D12.Item.Category.Trait"
  }
};
