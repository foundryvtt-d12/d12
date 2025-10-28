
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

    if (item != null && item.system.action.bonus != 0) {
      terms.push(new foundry.dice.terms.OperatorTerm({operator: "+"}));
      terms.push(new foundry.dice.terms.NumericTerm({
        number: item.system.action.bonus,
        flavor: item.name,
      }));
    }

    const roll = Roll.fromTerms(terms);

    // Prepare data for the template
    const templateData = {
      item: item.name,
      roll: roll,
      flags: {
        // d12: {
        //   ability,
        //   abilityName,
        //   item.name,
        //   actorId: actor?.id,
        //   itemId: item?.id
        // }
      }
    };

    // Render the template and send the message
    const html = await foundry.applications.handlebars.renderTemplate(RollManager._template, templateData);
    roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: actor }),
      flavor: item.name,
      rollMode: game.settings.get("core", "rollMode"),
      content: html,
      // flags: {
      //   d12: templateData.flags.d12
      // }
    });

    return roll;
  }
}
