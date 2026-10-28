import { D12ActorSheet } from "./actor-sheet.mjs";

/**
 * Sheet for loot containers (chests, corpses, stashes).
 * Reuses the item actions of the actor sheet, without the combat-related parts.
 * @extends {D12ActorSheet}
 */
export class D12LootSheet extends D12ActorSheet {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["loot"],
    position: {
      width: 450,
      height: 400
    },
    window: {
      title: "D12.SheetLabels.Loot"
    }
  };

  /** @override */
  static PARTS = {
    sheet: { template: "systems/d12/templates/loot-sheet.hbs" },
    // Declared so Foundry registers them as partials; only "sheet" is rendered.
    items: { template: "systems/d12/templates/actor/inventory.hbs" },
    itemTableRow: { template: "systems/d12/templates/actor/item-table-row.hbs" },
  };
}
