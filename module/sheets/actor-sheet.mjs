/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {foundry.applications.sheets.ActorSheetV2}
 */
import PrimarySheetMixin from "./primary-sheet-mixin.mjs";

const { api, sheets } = foundry.applications;

export class D12ActorSheet extends PrimarySheetMixin(
  api.HandlebarsApplicationMixin(sheets.ActorSheetV2)
) {
  constructor(options = {}) {
    super(options);
  }

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
    }
  };

  /** @override */
  static TABS = {
    sheet: {
      tabs: [
        { id: "stats", group: "sheet", label: "D12.SheetLabels.Stats" },
        { id: "items", group: "sheet", label: "D12.SheetLabels.Items" },
        { id: "spells", group: "sheet", label: "D12.SheetLabels.Spells" }
      ],
      initial: "stats"
    }
  };

  /** @override */
  static PARTS = {
    stats: { template: "systems/d12/templates/actor/actor-sheet.hbs" },
    items: { template: "systems/d12/templates/actor/actor-sheet.hbs" },
    spells: { template: "systems/d12/templates/actor/actor-sheet.hbs" },
    partialCharacterStats: { template: "systems/d12/templates/actor/parts/actor-character-stats.hbs" },
    partialNpcStats: { template: "systems/d12/templates/actor/parts/actor-npc-stats.hbs" },
    partialItems: { template: "systems/d12/templates/actor/parts/actor-items.hbs" },
    partialSpells: { template: "systems/d12/templates/actor/parts/actor-spells.hbs" },
  };

  /** @override */
  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    options.parts = ["stats", "items", "spells"];
  }

  /** @override */
  async _prepareContext(options) {
    const textEditor = foundry.applications.ux.TextEditor.implementation;
    // Use a safe clone of the actor data for further operations.
    const actorData = this.document.toPlainObject();

    // Use a safe clone of the actor data for further operations.
    const context = {
      ...await super._prepareContext(options),

      // Add the actor document and its data to context
      actor: this.actor,
      document: this.document,

      // Add the actor's data to context for easier access, as well as flags.
      system: actorData.system,
      flags: actorData.flags,

      // Adding a pointer to CONFIG.D12
      config: CONFIG.D12,

      // Add items to context from the actor's items collection
      items: this.actor.items,

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
      tabs: this._getTabs(options.parts),
    };

    // Prepare character data and items.
    if (actorData.type == "character") {
      this._prepareItems(context);
      this._prepareCharacterData(context);
    }

    // Prepare NPC data and items.
    if (actorData.type == "npc") {
      this._prepareItems(context);
    }

    return context;
  }

  /** @override */
  async _preparePartContext(partId, context) {
    // Prepare context for specific parts
    context.tab = context.tabs[partId];
    return context;
  }

  /**
   * Character-specific context modifications
   *
   * @param {object} context The context object to mutate
   */
  _prepareCharacterData(context) {
    // This is where you can enrich character-specific editor fields
    // or setup anything else that's specific to this type
  }

  /**
   * Organize and classify Items for Actor sheets.
   *
   * @param {object} context The context object to mutate
   */
  _prepareItems(context) {
    // Initialize containers.
    const inventory = [];
    const spells = [];

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      i.img = i.img || Item.DEFAULT_ICON;

      if (i.type === "item") {
        inventory.push(i);
      }
      else if (i.type === "spell") {
        spells.push(i);
      }
    }

    // Assign and return
    context.inventory = inventory;
    context.spells = spells;
  }

  /**
   * Generates the data for tab navigation
   * @param {string[]} parts An array of named template parts to render
   * @returns {Record<string, Partial<ApplicationTab>>}
   * @protected
   */
  _getTabs(parts) {
    const tabGroups = {};
    for (const partId of parts) {
      tabGroups[partId] = {
        group: "sheet",
        id: partId,
        cssClass: this.tabGroups["sheet"] === partId ? "active" : "",
      };
    }

    return tabGroups;
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
   * Handle decreasing spell charges
   * @this {D12ActorSheet}
   * @param {PointerEvent} event
   * @param {HTMLElement} target
   */
  static async #changeTab(event, target) {
    event.preventDefault();
    const tab = target.dataset.tab;
    if (!tab) return;
    this.changeTab(tab, "sheet", { event });
  }

  /**
   * Handle clickable rolls
   * @this {D12ActorSheet}
   * @param {PointerEvent} event
   * @param {HTMLElement} target
   */
  static async #rollable(event, target) {
    event.preventDefault();
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
