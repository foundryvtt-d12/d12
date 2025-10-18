export const D12 = {};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
D12.abilities = {
  str: 'D12.Ability.Strength.long',
  agi: 'D12.Ability.Agility.long',
  int: 'D12.Ability.Intelligence.long',
  per: 'D12.Ability.Perception.long',
  cha: 'D12.Ability.Charisma.long',
};

D12.abilityAbbreviations = {
  str: 'D12.Ability.Strength.abbr',
  agi: 'D12.Ability.Agility.abbr',
  int: 'D12.Ability.Intelligence.abbr',
  per: 'D12.Ability.Perception.abbr',
  cha: 'D12.Ability.Charisma.abbr',
};

D12.defenses = {
  arm: 'D12.Defense.Armor.long',
  end: 'D12.Defense.Endurance.long',
  wil: 'D12.Defense.Willpower.long'
};

D12.rarities = {
  common: 'D12.Rarity.Common',
  rare: 'D12.Rarity.Rare',
  epic: 'D12.Rarity.Epic',
  legendary: 'D12.Rarity.Legendary'
}
