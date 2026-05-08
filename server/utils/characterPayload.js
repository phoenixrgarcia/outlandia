const { normalizeCurrency } = require("./currency");
const { getSerializableCharacterAbilities } = require("../data/characterAbilities");

function toPublicCharacter(character) {
  return {
    id: character.characterId,
    name: character.name,
    player: character.player,
    class: character.class,
    faction: character.faction,
    publicBlurb: character.publicBlurb,
    isDead: character.isDead,
  };
}

function toSafeLoggedInCharacter(character) {
  return {
    ...toPublicCharacter(character),
    inventory: character.inventory,
    abilities: getSerializableCharacterAbilities(character.characterId),
    secret: character.secret,
    twist: character.twist,
    goals: character.goals,
    clues: character.clues,
    purchasedClueIds: character.purchasedClueIds,
    privateInformation: character.privateInformation,
    relationships: character.relationships,
    money: normalizeCurrency(character.money),
    isAdmin: character.isAdmin,
    canAdvanceRound: character.canAdvanceRound,
    statuses: character.statuses,
    modifiers: character.modifiers,
  };
}

module.exports = {
  toPublicCharacter,
  toSafeLoggedInCharacter,
};
