/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class D12ItemSheet extends ItemSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["d12", "sheet", "item"],
      width: 490,
      height: 420,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "description",
        },
      ],
      submitOnChange: true,
    });
  }

  /** @override */
  _getHeaderButtons() {
    let buttons = super._getHeaderButtons();

    // Add lock/unlock button for owners
    if (this.document.isOwner) {
      buttons.unshift({
        class: "lock-sheet",
        icon: this.isEditable ? "fas fa-unlock" : "fas fa-lock",
        onclick: ev => this._onToggleLock(ev)
      });
    }

    // Remove label property from all header buttons
    buttons = buttons.map(btn => {
      const { label, ...rest } = btn;
      return rest;
    });

    return buttons;
  }

  /**
   * Handle toggling the locked state of the sheet
   * @param {Event} event   The originating click event
   * @private
   */
  async _onToggleLock(event) {
    event.preventDefault();

    // Toggle the locked state in the item's flags
    const locked = this.item.getFlag("d12", "locked") ?? false;
    await this.item.setFlag("d12", "locked", !locked);

    // Re-render the sheet to reflect the change
    this.render(false);
  }

  /** @override */
  get isEditable() {
    const locked = this.item.getFlag("d12", "locked") ?? false;
    return !locked && super.isEditable;
  }

  /** @override */
  get template() {
    return `systems/d12/templates/item/item-sheet.hbs`;
  }

  /* -------------------------------------------- */

  /** @override */
  async getData() {
    // Retrieve base data structure.
    const context = super.getData();

    // Use a safe clone of the item data for further operations.
    const itemData = this.document.toPlainObject();

    const textEditor = foundry.applications.ux.TextEditor.implementation;
    // Enrich description info for display
    // Enrichment turns text like `[[/r 1d20]]` into buttons
    context.enrichedDescription = await textEditor.enrichHTML(
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
    );

    // Add the item's data to context.data for easier access, as well as flags.
    context.system = itemData.system;
    context.flags = itemData.flags;

    // Adding a pointer to CONFIG.D12
    context.config = CONFIG.D12;

    return context;
  }

  /* -------------------------------------------- */

  /** @override */
  async _updateObject(event, formData) {
    // Handle setting action to null when type is empty
    if (formData["system.action.type"] === "") {
      formData["system.action"] = null;
      delete formData["system.action.type"];
      delete formData["system.action.ability"];
      delete formData["system.action.description"];
    }

    if (formData["system.charges.value"] === "") {
      formData["system.charges"] = null;
      delete formData["system.charges.value"];
      delete formData["system.charges.max"];
    }

    return super._updateObject(event, formData);
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Rollable items - enable and attach listeners even when form is disabled
    html.find(".rollable").each((i, element) => {
      element.disabled = false;
      element.removeAttribute("disabled");
      element.addEventListener("click", this._onRoll.bind(this));
    });

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Roll handlers, click handlers, etc. would go here.
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRoll(event) {
    event.preventDefault();
    console.log("D12ItemSheet._onRoll called");
    const element = event.currentTarget;
    const dataset = element.dataset;

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
}
