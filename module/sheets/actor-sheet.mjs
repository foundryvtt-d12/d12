/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {foundry.applications.sheets.ActorSheetV2}
 */
import PrimarySheetMixin from "./primary-sheet-mixin.mjs";

const { api, sheets } = foundry.applications;

export class D12ActorSheet extends PrimarySheetMixin(
  api.HandlebarsApplicationMixin(sheets.ActorSheetV2)
) {
  /**
   * Track the currently active tab
   * @type {string}
   */
  activeTab = "stats";

  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["d12", "sheet", "actor", "tabs", "themed", "theme-light"],
    position: {
      width: 490,
      height: 510
    },
    window: {
      resizable: true,
      title: "D12.SheetLabels.Actor"
    },
    form: { submitOnChange: true },
    actions: {
      itemEdit: D12ActorSheet.#itemEdit,
      itemCreate: D12ActorSheet.#itemCreate,
      itemDelete: D12ActorSheet.#itemDelete,
      quantityIncrease: D12ActorSheet.#quantityIncrease,
      quantityDecrease: D12ActorSheet.#quantityDecrease,
      chargesIncrease: D12ActorSheet.#chargesIncrease,
      chargesDecrease: D12ActorSheet.#chargesDecrease,
      changeTab: D12ActorSheet.#changeTab,
      rollable: D12ActorSheet.#rollable,
      effectRemove: D12ActorSheet.#effectRemove,
    }
  };

  /** @override */
  static PARTS = {
    sheet: { template: "systems/d12/templates/actor-sheet.hbs" },
    characterStats: { template: "systems/d12/templates/actor/actor-character-stats.hbs" },
    npcStats: { template: "systems/d12/templates/actor/actor-npc-stats.hbs" },
    items: { template: "systems/d12/templates/actor/actor-items.hbs" },
    spells: { template: "systems/d12/templates/actor/actor-spells.hbs" },
    itemTableRow: { template: "systems/d12/templates/actor/item-table-row.hbs" },
  };

  /* -------------------------------------------- */

  /** @override */
  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    options.parts = ["sheet"];
  }

  /** @override */
  async _prepareContext(options) {
    const textEditor = foundry.applications.ux.TextEditor.implementation;
    // Use a safe clone of the actor data for further operations.
    const actorData = this.document.toPlainObject();

    return {
      ...await super._prepareContext(options),

      // Add the actor document and its data to context
      actor: this.actor,
      document: this.document,

      // Add the actor's data to context for easier access, as well as flags.
      system: actorData.system,
      flags: actorData.flags,

      // Adding a pointer to CONFIG.D12
      config: CONFIG.D12,

      // Track the active tab
      activeTab: this.activeTab,

      // Add items to context from the actor's items collection
      items: this.actor.items,
      ...this._prepareItems(this.actor.items),

      // Add active effects to context
      effects: this.actor.effects.contents,

      // Enrich biography info for display
      // Enrichment turns text like `[[/r 1d20]]` into buttons
      enrichedBiography: await textEditor.enrichHTML(
        this.actor.system.biography,
        {
          // Whether to show secret blocks in the finished html
          secrets: this.document.isOwner,
          // Necessary in v11, can be removed in v12
          async: true,
          // Data to fill in for inline rolls
          rollData: this.actor.getRollData(),
          // Relative UUID resolution
          relativeTo: this.actor,
        }
      ),

      editable: this.isEditMode,
    };
  }

  /**
   * Organize and classify Items for Actor sheets.
   *
   * @param {object} context The context object to mutate
   */
  _prepareItems(items) {
    // Initialize containers.
    const inventory = [];
    const spells = [];

    // Iterate through items, allocating to containers
    for (let i of items) {
      i.img = i.img || Item.DEFAULT_ICON;

      if (i.type === "item") {
        inventory.push(i);
      }
      else if (i.type === "spell") {
        spells.push(i);
      }
    }

    return {
      inventory: inventory.sort((a, b) => (a.sort || 0) - (b.sort || 0)),
      spells: spells.sort((a, b) => (a.sort || 0) - (b.sort || 0)),
    };
  }

  /** @override */
  async _onDropItem(event, data) {
    // Call the parent implementation to handle the item drop
    const result = await super._onDropItem(event, data);

    // If the item was transferred from another actor, remove it from the source
    if (data.uuid) {
      const sourceItem = await fromUuid(data.uuid);
      if (sourceItem && sourceItem.actor && sourceItem.actor !== this.actor) {
        // The item came from a different actor, so delete it from the source
        await sourceItem.delete();
      }
    }

    return result;
  }

  /** @override */
  async _onSortItem(event, itemData) {
    // Get the dragged item and the target item
    const items = this.actor.items;
    const draggedItem = items.get(itemData._id);

    // Find the item we're sorting relative to
    const li = event.target.closest(".item");
    const targetId = li?.dataset.itemId;
    const targetItem = targetId ? items.get(targetId) : null;

    if (!draggedItem || !targetItem || draggedItem === targetItem) return;

    // Get the sort order of items
    const sortedItems = items.contents.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    const draggedIndex = sortedItems.findIndex(i => i._id === draggedItem._id);
    const targetIndex = sortedItems.findIndex(i => i._id === targetItem._id);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Calculate the new sort order
    const isMovingDown = draggedIndex < targetIndex;
    const baseSort = isMovingDown ? targetItem.sort : targetItem.sort - 1;

    // Update the dragged item's sort order
    await draggedItem.update({ sort: baseSort });
  }

  /* -------------------------------------------- */
  /*  Event handlers                              */
  /* -------------------------------------------- */

  /**
   * Handle changing tabs
   * @this {D12ActorSheet}
   * @param {PointerEvent} event
   * @param {HTMLElement} target
   */
  static async #changeTab(event, target) {
    event.preventDefault();
    this.activeTab = target.dataset.tab;
    this.render();
  }

  /**
   * Handle editing an item from the sheet
   * @this {D12ActorSheet}
   * @param {PointerEvent} event
   * @param {HTMLElement} target
   */
  static async #itemEdit(event, target) {
    event.preventDefault();
    const li = target.closest(".item");
    const itemId = li?.dataset.itemId;
    if (!itemId) return;
    const item = this.actor.items.get(itemId);
    item?.sheet.render(true);
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @this {D12ActorSheet}
   * @param {PointerEvent} event
   * @param {HTMLElement} target
   */
  static async #itemCreate(event, target) {
    event.preventDefault();
    // Get the type of item to create.
    const type = target.dataset.type;
    // Grab any data associated with this control.
    const data = foundry.utils.deepClone(target.dataset);
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      system: data,
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.system["type"];

    // Finally, create the item!
    return await Item.create(itemData, { parent: this.actor });
  }

  /**
   * Handle deleting an item from the sheet
   * @this {D12ActorSheet}
   * @param {PointerEvent} event
   * @param {HTMLElement} target
   */
  static async #itemDelete(event, target) {
    event.preventDefault();
    const li = target.closest(".item");
    const itemId = li?.dataset.itemId;
    if (!itemId) return;
    const item = this.actor.items.get(itemId);
    await item?.delete();
    li?.remove();
  }

  /**
   * Handle increasing item quantity
   * @this {D12ActorSheet}
   * @param {PointerEvent} event
   * @param {HTMLElement} target
   */
  static async #quantityIncrease(event, target) {
    event.preventDefault();
    const li = target.closest(".item");
    const itemId = li?.dataset.itemId;
    if (!itemId) return;
    const item = this.actor.items.get(itemId);
    if (item) {
      await item.update({ "system.quantity": item.system.quantity + 1 });
    }
  }

  /**
   * Handle decreasing item quantity
   * @this {D12ActorSheet}
   * @param {PointerEvent} event
   * @param {HTMLElement} target
   */
  static async #quantityDecrease(event, target) {
    event.preventDefault();
    const li = target.closest(".item");
    const itemId = li?.dataset.itemId;
    if (!itemId) return;
    const item = this.actor.items.get(itemId);
    if (item) {
      const newQuantity = Math.max(0, item.system.quantity - 1);
      await item.update({ "system.quantity": newQuantity });
    }
  }

  /**
   * Handle increasing spell charges
   * @this {D12ActorSheet}
   * @param {PointerEvent} event
   * @param {HTMLElement} target
   */
  static async #chargesIncrease(event, target) {
    event.preventDefault();
    const li = target.closest(".item");
    const itemId = li?.dataset.itemId;
    if (!itemId) return;
    const item = this.actor.items.get(itemId);
    if (item) {
      let newCharges = item.system.charges.value + 1;
      if (item.system.charges.max) {
        newCharges = Math.min(item.system.charges.max, newCharges);
      }
      await item.update({ "system.charges.value": newCharges });
    }
  }

  /**
   * Handle decreasing spell charges
   * @this {D12ActorSheet}
   * @param {PointerEvent} event
   * @param {HTMLElement} target
   */
  static async #chargesDecrease(event, target) {
    event.preventDefault();
    const li = target.closest(".item");
    const itemId = li?.dataset.itemId;
    if (!itemId) return;
    const item = this.actor.items.get(itemId);
    if (item) {
      const newCharges = Math.max(0, item.system.charges.value - 1);
      await item.update({ "system.charges.value": newCharges });
    }
  }

  /**
   * Handle removing an active effect
   * @this {D12ActorSheet}
   * @param {PointerEvent} event
   * @param {HTMLElement} target
   */
  static async #effectRemove(event, target) {
    event.preventDefault();
    const effectId = target.closest(".effect-remove")?.dataset.effectId;
    if (!effectId) return;
    const effect = this.actor.effects.get(effectId);
    await effect?.delete();
  }

  /**
   * Handle clickable rolls
   * @this {D12ActorSheet}
   * @param {PointerEvent} event
   * @param {HTMLElement} target
   */
  static async #rollable(event, target) {
    event.preventDefault();

    if (this.isEditMode) {
      return;
    }

    const dataset = target.dataset;

    // Handle rolls that supply the formula directly.
    if (dataset.roll) {
      let label = dataset.label ? `${dataset.label}` : "";
      let roll = new Roll(dataset.roll, this.actor.getRollData());
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get("core", "rollMode"),
      });
      return roll;
    }
  }
}
