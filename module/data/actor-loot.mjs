import D12DataModel from "./base-model.mjs";

export default class D12Loot extends D12DataModel {

  /** Whether this actor has a stat block, and can use items and be targeted. */
  get hasStatBlock() {
    return false;
  }

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = {};

    schema.biography = new fields.StringField({ required: true, blank: true });

    return schema;
  }
}
