
export default class RollManager {
  static ROLL_RESULT = {
    SUCCESS: "success",
    FAIL: "fail",
    UNKNOWN: "unknown"
  };

  static get _template() {
    return "systems/d12/templates/chat/roll-message.hbs";
  }

  static async createAbilityRoll(actor, ability) {
    if (actor?.isOwner != true) return;

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

  static async createSimpleItemAction(actor, item) {
    if (actor?.isOwner != true) return;

    const templateData = {
      roll: null,
      config: CONFIG.D12,
      data: {
        item: item.toPlainObject(),
      }
    };

    const html = await foundry.applications.handlebars.renderTemplate(RollManager._template, templateData);
    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: actor }),
      rollMode: game.settings.get("core", "rollMode"),
      content: html,
      flavor: game.i18n.localize(`D12.Item.Use.${item.type === "spell" ? "Spell" : "Item"}`),
      flags: {
        d12: templateData.data
      }
    });
  }

  static async createItemRoll(actor, ability, item) {
    if (actor?.isOwner != true) return;

    const rollParams = item.system.action.roll;

    const terms = this._baseTerms(actor, ability);

    if (item != null && rollParams.bonus != 0) {
      terms.push(new foundry.dice.terms.OperatorTerm({operator: "+"}));
      terms.push(new foundry.dice.terms.NumericTerm({
        number: rollParams.bonus,
        flavor: item.name,
      }));
    }

    const roll = Roll.fromTerms(terms);
    await roll.roll();

    const dieRoll = roll.terms[0].results[0].result;
    const isCritical = (rollParams.critical != null) && (dieRoll >= rollParams.critical);

    let targetedTokens = [];
    if (canvas?.tokens) {
      targetedTokens = canvas.tokens.placeables.filter(t => t.isTargeted).map(t => t.id);
    }

    const targets = [];
    for (const token of canvas.tokens.placeables) {
      if (token.isTargeted) {
        const tokenId = token.id;
        const targetedActor = token.actor;

        const targetValue = RollManager._getTargetValue(targetedActor, rollParams.target);
        let rollResult;
        if (targetValue != null) {
          rollResult = roll.total >= targetValue ? RollManager.ROLL_RESULT.SUCCESS : RollManager.ROLL_RESULT.FAIL;
        } else {
          rollResult = RollManager.ROLL_RESULT.FAIL;
        }

        targets.push({
          tokenId: tokenId,
          actor: targetedActor.toPlainObject(),
          result: rollResult,
          targetValue: targetValue,
          targetType: rollParams.target.type,
          result: rollResult,
        });
      }
    }

    // Prepare data for the template
    const templateData = {
      roll: roll,
      config: CONFIG.D12,
      data: {
        total: roll.total,
        die: roll.terms[0].results[0].result,
        ability: ability,
        abilityBonus: actor.system.abilities[ability].value,
        isCritical: isCritical,
        itemBonus: rollParams.bonus ?? 0,
        item: item.toPlainObject(),
        targets: targets,
      }
    };

    // Render the template and send the message
    const html = await foundry.applications.handlebars.renderTemplate(RollManager._template, templateData);
    roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: actor }),
      rollMode: game.settings.get("core", "rollMode"),
      content: html,
      flavor: game.i18n.localize(`D12.Item.Use.${item.type === "spell" ? "Spell" : "Item"}`),
      flags: {
        d12: templateData.data
      }
    });

    return roll;
  }

  static _getTargetValue(targetActor, targetParams) {
    switch (targetParams.type) {
      case "arm":
      case "end":
      case "wil":
        return targetActor.system.defenses[targetParams.type].value;
      case "fixed":
      default:
        if (targetParams.difficulty == null) {
          return null;
        } else {
          return targetParams.difficulty;
        }
    }
  }
}
