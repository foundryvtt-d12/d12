import D12ItemBase from "./base-item.mjs";

export default class D12Item extends D12ItemBase {

  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = super.defineSchema();

    schema.quantity = new fields.NumberField({ ...requiredInteger, initial: 1, min: 1 });
    schema.weight = new fields.NumberField({ required: true, nullable: false, initial: 0, min: 0 });
    schema.rarity = new fields.StringField({
      required: true,
      blank: false,
      initial: "common",
      choices: {
        "common": "Common",
        "rare": "Rare",
        "epic": "Epic",
        "legendary": "Legendary"
      }
    });
    schema.price = new fields.NumberField({ required: true, nullable: true, initial: null, min: 0 });
    schema.category = new fields.StringField({
      required: true,
      blank: false,
      initial: "item",
      choices: {
        "item": "Item",
        "weapon": "Weapon",
        "armor": "Armor",
        "accessory": "Accessory",
        "consumable": "Consumable"
      }
    });

    return schema;
  }
}
