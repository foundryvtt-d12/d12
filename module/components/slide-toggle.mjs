/**
 * A custom HTML element that represents a slide toggle switch.
 * Displays as a switch with a sliding thumb that can be toggled on/off.
 * @fires change
 */
export default class SlideToggleElement extends HTMLElement {
  constructor() {
    super();
    this._controller = null;
  }

  /* -------------------------------------------- */

  /** @override */
  static tagName = "slide-toggle";

  /* -------------------------------------------- */

  /**
   * The checked state of the toggle.
   * @type {boolean}
   */
  get checked() {
    return this.hasAttribute("checked");
  }

  set checked(checked) {
    this.toggleAttribute("checked", checked);
    this._refresh();
  }

  /* -------------------------------------------- */
  /*  Element Lifecycle                           */
  /* -------------------------------------------- */

  /**
   * Attach the element to the DOM.
   * @override
   */
  connectedCallback() {
    this.replaceChildren(...this._buildElements());
    this._refresh();
    this._activateListeners();
    if (!this.hasAttribute("tabindex")) this.tabIndex = 0;
  }

  /* -------------------------------------------- */

  /**
   * Clean up event listeners when the element is removed.
   * @override
   */
  disconnectedCallback() {
    this._controller?.abort();
  }

  /* -------------------------------------------- */

  /**
   * Create the constituent components of this element.
   * @returns {HTMLElement[]}
   * @protected
   */
  _buildElements() {
    const track = document.createElement("div");
    track.classList.add("slide-toggle-track");
    const thumb = document.createElement("div");
    thumb.classList.add("slide-toggle-thumb");
    track.append(thumb);
    return [track];
  }

  /* -------------------------------------------- */

  /**
   * Activate event listeners for the element.
   * @protected
   */
  _activateListeners() {
    const { signal } = (this._controller = new AbortController());
    this.addEventListener("click", this._onClick.bind(this), { signal });
    this.addEventListener(
      "keydown",
      (event) => (event.key === " " ? this._onClick(event) : null),
      { signal }
    );
  }

  /* -------------------------------------------- */

  /**
   * Refresh the element's state.
   * @protected
   */
  _refresh() {
    // Set ARIA attributes
    this.setAttribute("role", "switch");
    this.setAttribute("aria-checked", this.checked);
  }

  /* -------------------------------------------- */

  /**
   * Handle click and space key events to toggle the switch.
   * @param {Event} event
   * @protected
   */
  _onClick(event) {
    event.preventDefault();
    this.checked = !this.checked;
    this.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }));
    this.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
  }
}
