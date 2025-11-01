/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {foundry.applications.sheets.DocumentSheetV2}
 */
import PrimarySheetMixin from "./primary-sheet-mixin.mjs";
import RollManager from "../helpers/roll-manager.mjs";

const { api, sheets } = foundry.applications;

export class D12ItemSheet extends PrimarySheetMixin(
  api.HandlebarsApplicationMixin(sheets.ItemSheetV2)
) {
  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    classes: ["d12", "sheet", "item", "themed", "theme-light"],
    position: {
      width: 550,
      height: 420
    },
    window: {
      resizable: true,
      title: "D12.SheetLabels.Item"
    },
    form: { submitOnChange: true },
    actions: {
      rollable: D12ItemSheet.#rollable,
    }
  };

  /** @override */
  static PARTS = {
    sheet: {
      template: "systems/d12/templates/item-sheet.hbs"
    }
  };

  /* -------------------------------------------- */

  /** @override */
  async _prepareContext(options) {
    const textEditor = foundry.applications.ux.TextEditor.implementation;
    // Use a safe clone of the item data for further operations.
    const itemData = this.document.toPlainObject();

    return {
      ...await super._prepareContext(options),
      // Add the item document and its data to context
      item: this.item,
      document: this.document,

      // Add the item's data to context for easier access, as well as flags.
      system: itemData.system,
      flags: itemData.flags,

      // Adding a pointer to CONFIG.D12
      config: CONFIG.D12,
      categories: this.item.type === "spell" ? CONFIG.D12.spell.categories : CONFIG.D12.item.categories,

      mode: this._getMode(),

      // Enrich description info for display
      // Enrichment turns text like `[[/r 1d20]]` into buttons
      enrichedDescription: await textEditor.enrichHTML(
        this.item.system.description,
        {
          // Whether to show secret blocks in the finished html
          secrets: this.document.isOwner,
          // Necessary in v11, can be removed in v12
          async: true,
          // Data to fill in for inline rolls
          rollData: this.item.getRollData(),
          // Relative UUID resolution
          relativeTo: this.item,
        }
      ),

      editable: this.isEditMode,
    };
  }

  _getMode() {
    if (this.item.system.action == null) {
      return "no_action";
    } else if (this.item.system.action.roll == null) {
      return "action_no_roll";
    } else {
      return "action_roll";
    }
  }

  /** @override */
  _applySubmitDataOverrides(systemData, formData) {
    const mode = formData.object.mode;

    if (mode == null) return;

    if (mode === "no_action") {
      systemData.action = null;
    } else if (mode === "action_no_roll") {
      systemData.action ??= {};
      systemData.action.roll = null;
    } else {
      systemData.action ??= {};
      systemData.action.roll ??= {};
      systemData.action.roll.target ??= {};
      const targetType = systemData.action.roll.target.type;
      if (targetType !== "fixed") {
        systemData.action.roll.target.difficulty = null;
      }
    }
  }

  /* -------------------------------------------- */
  /*  Event handlers                              */
  /* -------------------------------------------- */

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

    const roll = this.item.system.action.roll;
    if (roll != null) {
      await RollManager.createItemRoll(this.actor, roll.ability, this.item);
    } else {
      await RollManager.createSimpleItemAction(this.actor, this.item);
    }
  }
}
