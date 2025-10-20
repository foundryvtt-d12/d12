/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {foundry.appv1.sheets.ActorSheet}
 */
export class D12ActorSheet extends foundry.appv1.sheets.ActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["d12", "sheet", "actor"],
      width: 490,
      height: 510,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "features",
        },
      ],
      dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}],
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

    // Toggle the locked state in the actor's flags
    const locked = this.actor.getFlag("d12", "locked") ?? false;
    await this.actor.setFlag("d12", "locked", !locked);

    // Re-render the sheet to reflect the change
    this.render(false);
  }

  /** @override */
  get isEditable() {
    const locked = this.actor.getFlag("d12", "locked") ?? false;
    return !locked && super.isEditable;
  }

  /** @override */
  get template() {
    return `systems/d12/templates/actor/actor-sheet.hbs`;
  }

  /* -------------------------------------------- */

  /** @override */
  async getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the actor object, the data object, whether or not it's
    // editable, and the items array.
    const context = super.getData();

    // Use a safe clone of the actor data for further operations.
    const actorData = this.document.toPlainObject();

    // Add the actor's data to context.data for easier access, as well as flags.
    context.system = actorData.system;
    context.flags = actorData.flags;

    // Adding a pointer to CONFIG.D12
    context.config = CONFIG.D12;

    // Prepare character data and items.
    if (actorData.type == "character") {
      this._prepareItems(context);
      this._prepareCharacterData(context);
    }

    // Prepare NPC data and items.
    if (actorData.type == "npc") {
      this._prepareItems(context);
    }

    const textEditor = foundry.applications.ux.TextEditor.implementation;
    // Enrich biography info for display
    // Enrichment turns text like `[[/r 1d20]]` into buttons
    context.enrichedBiography = await textEditor.enrichHTML(
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
    );

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
    const gear = [];
    const spells = [];

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      i.img = i.img || Item.DEFAULT_ICON;
      // Append to gear.
      if (i.type === "item") {
        gear.push(i);
      }
      // Append to spells.
      else if (i.type === "spell") {
        spells.push(i);
      }
    }

    // Assign and return
    context.gear = gear;
    context.spells = spells;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Render the item sheet for viewing/editing prior to the editable check.
    html.on("click", ".item-edit", (ev) => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.sheet.render(true);
    });

    if (this.isEditable) {
      // Add Inventory Item
      html.on("click", ".item-create", this._onItemCreate.bind(this));

      // Delete Inventory Item
      html.on("click", ".item-delete", (ev) => {
        const li = $(ev.currentTarget).parents(".item");
        const item = this.actor.items.get(li.data("itemId"));
        item.delete();
        li.slideUp(200, () => this.render(false));
      });

      // Increase Item Quantity
      html.on("click", ".item-quantity-increase", (ev) => {
        const li = $(ev.currentTarget).parents(".item");
        const item = this.actor.items.get(li.data("itemId"));
        item.update({ "system.quantity": item.system.quantity + 1 });
      });

      // Decrease Item Quantity
      html.on("click", ".item-quantity-decrease", (ev) => {
        const li = $(ev.currentTarget).parents(".item");
        const item = this.actor.items.get(li.data("itemId"));
        const newQuantity = Math.max(0, item.system.quantity - 1);
        item.update({ "system.quantity": newQuantity });
      });

      // Increase Spell Charges
      html.on("click", ".item-charges-increase", (ev) => {
        const li = $(ev.currentTarget).parents(".item");
        const item = this.actor.items.get(li.data("itemId"));
        let newCharges = item.system.charges.value + 1;
        if (item.system.charges.max) {
          newCharges = Math.min(item.system.charges.max, newCharges);
        }
        item.update({ "system.charges.value": newCharges });
      });

      // Decrease Spell Charges
      html.on("click", ".item-charges-decrease", (ev) => {
        const li = $(ev.currentTarget).parents(".item");
        const item = this.actor.items.get(li.data("itemId"));
        const newCharges = Math.max(0, item.system.charges.value - 1);
        item.update({ "system.charges.value": newCharges });
      });

      // Drag events for macros.
      if (this.actor.isOwner) {
        let handler = (ev) => this._onDragStart(ev);
        html.find("li.item").each((i, li) => {
          if (li.classList.contains("inventory-header")) return;
          li.setAttribute("draggable", true);
          li.addEventListener("dragstart", handler, false);
        });
      }
    } else {
      // Only when the sheet is not editable

      // Rollable abilities.
      html.on("click", ".rollable", this._onRoll.bind(this));
    }
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
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
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

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
