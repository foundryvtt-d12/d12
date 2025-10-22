/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {foundry.applications.sheets.DocumentSheetV2}
 */
import PrimarySheetMixin from "./primary-sheet-mixin.mjs";

const { api, sheets } = foundry.applications;

export class D12ItemSheet extends PrimarySheetMixin(
  api.HandlebarsApplicationMixin(sheets.ItemSheetV2)
) {
  constructor(options = {}) {
    super(options);
  }

  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    classes: ["d12", "sheet", "item"],
    position: {
      width: 490,
      height: 420
    },
    window: {
      resizable: true,
      title: "D12.SheetLabels.Item"
    },
    actions: {
      rollable: D12ItemSheet.#rollable,
    }
  };

  /** @override */
  static PARTS = {
    header: {
      template: "systems/d12/templates/item/item-sheet.hbs"
    }
  };

  /** @override */
  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    options.parts = ["header"];
  }

  /* -------------------------------------------- */

  /** @override */
  async _prepareContext(options) {
    const textEditor = foundry.applications.ux.TextEditor.implementation;
    // Use a safe clone of the item data for further operations.
    const itemData = this.document.toPlainObject();

    const context = {
      ...await super._prepareContext(options),
      // Add the item document and its data to context
      item: this.item,
      document: this.document,

      // Add the item's data to context for easier access, as well as flags.
      system: itemData.system,
      flags: itemData.flags,

      // Adding a pointer to CONFIG.D12
      config: CONFIG.D12,

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

    return context;
  }

  /* -------------------------------------------- */

  /**
   * Prepare form data before processing.
   * @param {Event} event
   * @param {HTMLFormElement} form
   * @param {FormDataExtended} formData
   */
  static async #rollable(event, target) {
    event.preventDefault();
    console.log("D12ItemSheet.#rollable called");
    const dataset = target.dataset;

    // Handle rolls that supply the formula directly.
    if (dataset.roll) {
      let label = dataset.label ? `${dataset.label}` : "";
      let roll = new Roll(dataset.roll, this.item.getRollData());
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.item.actor }),
        flavor: label,
        rollMode: game.settings.get("core", "rollMode"),
      });
      return roll;
    }
  }

  /** @override */
  async _processFormData(event, form, formData) {
    // Handle setting action to null when type is empty
    if (formData.object["system.action.type"] === "") {
      formData.object["system.action"] = null;
      delete formData.object["system.action.type"];
      delete formData.object["system.action.ability"];
      delete formData.object["system.action.description"];
    }

    if (formData.object["system.charges.value"] === "") {
      formData.object["system.charges"] = null;
      delete formData.object["system.charges.value"];
      delete formData.object["system.charges.max"];
    }

    return super._processFormData(event, form, formData);
  }
}
