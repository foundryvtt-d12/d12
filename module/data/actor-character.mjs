import D12ActorBase from "./base-actor.mjs";

export default class D12Character extends D12ActorBase {

  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = super.defineSchema();

    schema.attributes = new fields.SchemaField({
      level: new fields.SchemaField({
        value: new fields.NumberField({ ...requiredInteger, initial: 1 })
      }),
    });

    // Iterate over ability names and create a new SchemaField for each.
    schema.abilities = new fields.SchemaField(Object.keys(CONFIG.D12.abilities).reduce((obj, ability) => {
      obj[ability] = new fields.SchemaField({
        value: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
      });
      return obj;
    }, {}));

    return schema;
  }

  prepareDerivedData() {
    // Loop through ability scores, and add their modifiers to our sheet output.
    for (const key in this.abilities) {
      // Handle ability label localization.
      this.abilities[key].label = game.i18n.localize(CONFIG.D12.abilities[key]) ?? key;
    }
  }

  static createRoll(actor, ability, item) {
    const itemName = item ? item.name : null;

    const terms = [
      new foundry.dice.terms.Die({faces: 12, number: 1}),
    ];

    if (actor != null) {
      const abilityName = game.i18n.localize(`D12.Ability.${ability}.long`);
      terms.push(new foundry.dice.terms.OperatorTerm({operator: "+"}));
      terms.push(new foundry.dice.terms.NumericTerm({
        number: actor.system.abilities[ability].value,
        flavor: abilityName
      }));
    }

    if (item != null && item.system.action.bonus != 0) {
      terms.push(new foundry.dice.terms.OperatorTerm({operator: "+"}));
      terms.push(new foundry.dice.terms.NumericTerm({
        number: item.system.action.bonus,
        flavor: itemName
      }));
    }

    const roll = Roll.fromTerms(terms);

    roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: actor }),
      flavor: itemName ?? abilityName,
      rollMode: game.settings.get("core", "rollMode"),
    });
    return roll;
  }
}
