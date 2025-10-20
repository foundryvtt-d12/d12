import D12DataModel from "./base-model.mjs";

export default class D12ActorBase extends D12DataModel {

  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = {};

    schema.health = new fields.SchemaField({
      value: new fields.NumberField({ ...requiredInteger, initial: 5, min: 0 }),
      max: new fields.NumberField({ ...requiredInteger, initial: 5, min: 1 })
    });
    schema.mana = new fields.SchemaField({
      value: new fields.NumberField({ ...requiredInteger, initial: 3, min: 0 }),
      max: new fields.NumberField({ ...requiredInteger, initial: 3, min: 0 })
    });
    schema.biography = new fields.StringField({ required: true, blank: true }); // equivalent to passing ({initial: ""}) for StringFields

    schema.defenses = new fields.SchemaField(Object.keys(CONFIG.D12.defenses).reduce((obj, defense) => {
      obj[defense] = new fields.SchemaField({
        value: new fields.NumberField({ ...requiredInteger, initial: 6, min: 0 }),
      });
      return obj;
    }, {}));

    return schema;
  }

}
