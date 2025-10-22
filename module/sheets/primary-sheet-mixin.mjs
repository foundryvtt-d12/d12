/**
 * A mixin class that adds common sheet functionality for primary documents (Actors and Items).
 * Provides edit mode toggle, mode management, and context preparation features.
 * @param {typeof foundry.applications.api.HandlebarsApplicationMixin} Base
 * @returns {typeof PrimarySheet}
 */
export default function PrimarySheetMixin(Base) {
  return class PrimarySheet extends Base {
    /**
     * Available sheet modes.
     * @enum {number}
     */
    static MODES = {
      PLAY: 1,
      EDIT: 2
    };

    /**
     * The current sheet mode (PLAY or EDIT).
     * @type {number}
     */
    _mode = null;

    get isEditMode() {
      return this.isEditable && this._mode === this.constructor.MODES.EDIT;
    }

    /** @inheritDoc */
    _configureRenderOptions(options) {
      super._configureRenderOptions(options);

      // Set initial mode
      let { mode, renderContext } = options;
      if ( (mode === undefined) && (renderContext === "createItem") ) mode = this.constructor.MODES.EDIT;
      this._mode = mode ?? this._mode ?? this.constructor.MODES.PLAY;
    }

    /**
     * Render the mode toggle on each render.
     * @override
     */
    _onRender(context, options) {
      super._onRender(context, options);
      this._renderModeToggle();

      this.element.classList.toggle("editable", this.isEditMode);
      this.element.classList.toggle("locked", !this.isEditMode);
    }

    /**
     * Handle re-rendering the mode toggle on ownership changes.
     * @protected
     */
    _renderModeToggle() {
      const header = this.element.querySelector(".window-header");
      const toggle = header.querySelector(".mode-slider");
      if (this.isEditable && !toggle) {
        const toggle = document.createElement("slide-toggle");
        toggle.checked = this._mode === this.constructor.MODES.EDIT;
        toggle.classList.add("mode-slider");
        toggle.dataset.tooltip = "D12.SheetModeEdit";
        toggle.setAttribute("aria-label", game.i18n.localize("D12.SheetModeEdit"));
        toggle.addEventListener("change", this._onChangeSheetMode.bind(this));
        toggle.addEventListener("dblclick", (event) => event.stopPropagation());
        toggle.addEventListener("pointerdown", (event) => event.stopPropagation());
        header.prepend(toggle);
      } else if (this.isEditable) {
        toggle.checked = this._mode === this.constructor.MODES.EDIT;
      } else if (!this.isEditable && toggle) {
        toggle.remove();
      }
    }

    /**
     * Handle changing the sheet mode.
     * @protected
     */
    async _onChangeSheetMode(event) {
      const toggle = event.target;
      const MODES = this.constructor.MODES;
      const label =
        this._mode === MODES.EDIT
          ? game.i18n.localize("D12.SheetModePlay")
          : game.i18n.localize("D12.SheetModeEdit");
      toggle.dataset.tooltip = label;
      toggle.setAttribute("aria-label", label);
      this._mode = toggle.checked ? MODES.EDIT : MODES.PLAY;
      await this.render();
    }
  };
}
