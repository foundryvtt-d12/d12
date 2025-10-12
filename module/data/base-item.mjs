import D12DataModel from "./base-model.mjs";

export default class D12ItemBase extends D12DataModel {

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = {};

    schema.description = new fields.StringField({ required: true, blank: true });

    return schema;
  }

}