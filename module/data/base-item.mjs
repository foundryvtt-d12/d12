import D12DataModel from "./base-model.mjs";

export default class D12ItemBase extends D12DataModel {

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = {};

    schema.description = new fields.StringField({ required: true, blank: true });
    schema.action = new fields.SchemaField({
      roll: new fields.SchemaField({

        ability: new fields.StringField({
          required: true,
          blank: false,
          choices: {
            "str": "D12.Ability.Strength.long",
            "agi": "D12.Ability.Agility.long",
            "int": "D12.Ability.Intelligence.long",
            "per": "D12.Ability.Perception.long",
            "cha": "D12.Ability.Charisma.long"
          }
        }),

        bonus: new fields.NumberField({
          required: true,
          nullable: false,
          integer: true,
          initial: 0
        }),

        target: new fields.SchemaField({
          type: new fields.StringField({
            required: true,
            initial: "fixed",
            choices: {
              "arm": "D12.Defense.Armor.long",
              "end": "D12.Defense.Endurance.long",
              "wil": "D12.Defense.Willpower.long",
              "fixed": "D12.Action.Target.long",
            }
          }),
          difficulty: new fields.NumberField({
            required: false,
            nullable: true,
            integer: true,
            initial: 6,
            min: 1,
          })
        }, { required: true, nullable: false }),

        critical: new fields.NumberField({
          required: false,
          nullable: true,
          integer: true,
          min: 1,
          max: 12,
        })

      }, { required: false, nullable: true }),
    }, { required: false, nullable: true });

    return schema;
  }

}
