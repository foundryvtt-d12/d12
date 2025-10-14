/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class D12ItemSheet extends ItemSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['d12', 'sheet', 'item'],
      width: 520,
      height: 480,
      tabs: [
        {
          navSelector: '.sheet-tabs',
          contentSelector: '.sheet-body',
          initial: 'description',
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
        label: this.isEditable ? "Unlock" : "Lock",
        class: "configure-sheet",
        icon: this.isEditable ? "fas fa-unlock" : "fas fa-lock",
        onclick: ev => this._onToggleLock(ev)
      });
    }

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
    const locked = this.item.getFlag('d12', 'locked') ?? false;
    await this.item.setFlag('d12', 'locked', !locked);

    // Re-render the sheet to reflect the change
    this.render(false);
  }

  /** @override */
  get isEditable() {
    const locked = this.item.getFlag('d12', 'locked') ?? false;
    return !locked && super.isEditable;
  }

  /** @override */
  get template() {
    const path = 'systems/d12/templates/item';
    // Return a single sheet for all item types.
    // return `${path}/item-sheet.hbs`;

    // Alternatively, you could use the following return statement to do a
    // unique item sheet by type, like `weapon-sheet.hbs`.
    return `${path}/item-${this.item.type}-sheet.hbs`;
  }

  /* -------------------------------------------- */

  /** @override */
  async getData() {
    // Retrieve base data structure.
    const context = super.getData();

    // Use a safe clone of the item data for further operations.
    const itemData = this.document.toPlainObject();

    // Enrich description info for display
    // Enrichment turns text like `[[/r 1d20]]` into buttons
    context.enrichedDescription = await TextEditor.enrichHTML(
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
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Roll handlers, click handlers, etc. would go here.
  }
}
