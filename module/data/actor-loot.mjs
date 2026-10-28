import D12DataModel from "./base-model.mjs";

export default class D12Loot extends D12DataModel {

  /** Whether this actor can use items (roll/cast them). */
  get canUseItems() {
    return false;
  }

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = {};

    schema.biography = new fields.StringField({ required: true, blank: true });

    return schema;
  }
}
