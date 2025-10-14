import D12ItemBase from "./base-item.mjs";

export default class D12Spell extends D12ItemBase {

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    // No additional fields needed - spells will be displayed in a flat list

    return schema;
  }
}
