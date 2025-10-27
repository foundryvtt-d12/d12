import D12ItemBase from "./base-item.mjs";

export default class D12Spell extends D12ItemBase {

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.charges = new fields.SchemaField({
      value: new fields.NumberField({ integer: true, required: true, nullable: false, initial: 1, min: 0 }),
      max: new fields.NumberField({ integer: true, required: true, nullable: true, initial: null, min: 1 })
    }, { required: false, nullable: true });
    schema.category = new fields.StringField({
      required: true,
      blank: false,
      initial: "spell",
      choices: {
        "spell": "Spell",
        "trait": "Trait",
      }
    });

    return schema;
  }
}
