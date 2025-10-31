
export default class RollManager {

  static get _template() {
    return "systems/d12/templates/chat/roll-message.hbs";
  }

  static async createAbilityRoll(actor, ability) {
    if (actor == null) return;

    const terms = this._baseTerms(actor, ability);

    const roll = Roll.fromTerms(terms);
    roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: actor }),
      flavor: game.i18n.localize(`D12.Ability.${ability}.long`),
      rollMode: game.settings.get("core", "rollMode"),
    });
  }

  static _baseTerms(actor, ability) {
    return [
      new foundry.dice.terms.Die({faces: 12, number: 1}),
      new foundry.dice.terms.OperatorTerm({operator: "+"}),
      new foundry.dice.terms.NumericTerm({
        number: actor.system.abilities[ability].value,
        flavor: game.i18n.localize(`D12.Ability.${ability}.long`)
      }),
    ];
  }

  static async createItemRoll(actor, ability, item) {
    if (actor == null) return;

    const terms = this._baseTerms(actor, ability);
    const rollParams = item.system.action.roll;

    if (item != null && rollParams.bonus != 0) {
      terms.push(new foundry.dice.terms.OperatorTerm({operator: "+"}));
      terms.push(new foundry.dice.terms.NumericTerm({
        number: rollParams.bonus,
        flavor: item.name,
      }));
    }

    const roll = Roll.fromTerms(terms);
    await roll.roll();

    // Prepare data for the template
    const templateData = {
      roll: roll,
      config: CONFIG.D12,
      data: {
        total: roll.total,
        die: roll.terms[0].results[0].result,
        ability: ability,
        abilityBonus: actor.system.abilities[ability].value,
        itemBonus: rollParams.bonus ?? 0,
        item: item.toPlainObject(),
      }
    };

    // Render the template and send the message
    const html = await foundry.applications.handlebars.renderTemplate(RollManager._template, templateData);
    roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: actor }),
      rollMode: game.settings.get("core", "rollMode"),
      content: html,
      flags: {
        d12: templateData.data
      }
    });

    return roll;
  }
}
