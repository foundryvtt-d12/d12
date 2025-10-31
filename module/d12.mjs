// Import document classes.
import { D12Actor } from "./documents/actor.mjs";
import { D12Item } from "./documents/item.mjs";
// Import sheet classes.
import { D12ActorSheet } from "./sheets/actor-sheet.mjs";
import { D12ItemSheet } from "./sheets/item-sheet.mjs";
import { D12 } from "./helpers/config.mjs";
// Import DataModel classes
import * as models from "./data/_module.mjs";
// Import custom elements
import SlideToggleElement from "./components/slide-toggle.mjs";

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

// Add key classes to the global scope so they can be more easily used
// by downstream developers
globalThis.d12 = {
  documents: {
    D12Actor,
    D12Item,
  },
  applications: {
    D12ActorSheet,
    D12ItemSheet,
  },
  utils: {
    rollItemMacro,
  },
};

Hooks.once("init", function () {
  // Add custom constants for configuration.
  CONFIG.D12 = D12;

  // Register custom elements
  customElements.define(SlideToggleElement.tagName, SlideToggleElement);

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "1",
    decimals: 2,
  };

  // Define custom Document and DataModel classes
  CONFIG.Actor.documentClass = D12Actor;

  // Note that you don't need to declare a DataModel
  // for the base actor/item classes - they are included
  // with the Character/NPC as part of super.defineSchema()
  CONFIG.Actor.dataModels = {
    character: models.D12Character,
    npc: models.D12NPC
  };
  CONFIG.Item.documentClass = D12Item;
  CONFIG.Item.dataModels = {
    item: models.D12Item,
    spell: models.D12Spell
  };

  // Register sheet application classes
  foundry.documents.collections.Actors.registerSheet("d12", D12ActorSheet, {
    types: ["character", "npc"],
    makeDefault: true,
    label: "D12.SheetLabels.Actor",
    themes: null,
  });
  foundry.documents.collections.Items.registerSheet("d12", D12ItemSheet, {
    types: ["item", "spell"],
    makeDefault: true,
    label: "D12.SheetLabels.Item",
    themes: null,
  });
});

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

// If you need to add Handlebars helpers, here is a useful example:
Handlebars.registerHelper("toLowerCase", function (str) {
  return str.toLowerCase();
});

// Helper to repeat a block n times (for rendering stars)
Handlebars.registerHelper("times", function (n, block) {
  let result = "";
  for (let i = 0; i < n; i++) {
    result += block.fn(i);
  }
  return result;
});

// Helper to repeat a block n times (for rendering stars)
Handlebars.registerHelper("for", function (from, to, block) {
  let result = "";
  for (let i = from; i <= to; i++) {
    result += block.fn(i);
  }
  return result;
});

// Helper for less than comparison
Handlebars.registerHelper("lt", function (a, b) {
  return a < b;
});

Handlebars.registerHelper("length", function (a) {
  return a.length;
});

// Helper for formatting bonus
Handlebars.registerHelper("bonus", function (a) {
  if (a > 0) {
    return `+ ${a}`;
  } else if (a < 0) {
    return `- ${-a}`;
  } else {
    return "";
  }
});

Handlebars.registerHelper("formatModifier", function (a) {
  if (a > 0) {
    return `+${a}`;
  } else if (a < 0) {
    return `${-a}`;
  } else {
    return "";
  }
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once("ready", function () {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => createItemMacro(data, slot));
});

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createItemMacro(data, slot) {
  // First, determine if this is a valid owned item.
  if (data.type !== "Item") return;
  if (!data.uuid.includes("Actor.") && !data.uuid.includes("Token.")) {
    return ui.notifications.warn(
      "You can only create macro buttons for owned Items"
    );
  }
  // If it is, retrieve it based on the uuid.
  const item = await Item.fromDropData(data);

  // Create the macro command using the uuid.
  const command = `game.d12.rollItemMacro("${data.uuid}");`;
  let macro = game.macros.find(
    (m) => m.name === item.name && m.command === command
  );
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: "script",
      img: item.img,
      command: command,
      flags: { "d12.itemMacro": true },
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemUuid
 */
function rollItemMacro(itemUuid) {
  // Reconstruct the drop data so that we can load the item.
  const dropData = {
    type: "Item",
    uuid: itemUuid,
  };
  // Load the item from the uuid.
  Item.fromDropData(dropData).then((item) => {
    // Determine if the item loaded and if it's an owned item.
    if (!item || !item.parent) {
      const itemName = item?.name ?? itemUuid;
      return ui.notifications.warn(
        `Could not find item ${itemName}. You may need to delete and recreate this macro.`
      );
    }

    // Trigger the item roll
    item.roll();
  });
}
