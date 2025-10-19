import D12DataModel from "./base-model.mjs";

export default class D12ItemBase extends D12DataModel {

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = {};

    schema.description = new fields.StringField({ required: true, blank: true });
    schema.action = new fields.SchemaField({
      ability: new fields.StringField({
        required: true,
        blank: true,
        initial: "",
        choices: {
          "": "None",
          "str": "D12.Ability.Strength.long",
          "agi": "D12.Ability.Agility.long",
          "int": "D12.Ability.Intelligence.long",
          "per": "D12.Ability.Perception.long",
          "cha": "D12.Ability.Charisma.long"
        }
      }),
      description: new fields.StringField({
        required: true,
        blank: true,
        initial: ""
      }),
      type: new fields.StringField({
        required: true,
        blank: true,
        initial: "",
        choices: {
          "": "None",
          "attack": "D12.Action.Type.Attack",
          "use": "D12.Action.Type.Use",
          "cast": "D12.Action.Type.Cast",
          "activate": "D12.Action.Type.Activate",
          "apply": "D12.Action.Type.Apply",
          "consume": "D12.Action.Type.Consume"
        }
      })
    }, { required: false, nullable: true });

    return schema;
  }

}
