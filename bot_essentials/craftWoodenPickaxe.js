const { Vec3 } = require("vec3");
const { walkAround } = require("./utils");

async function craftWoodenPickaxe(bot) {
  // Vérifier si le bot a déjà une pioche en bois dans son inventaire
  const woodenPickaxe = itemByName(bot, "wooden_pickaxe");
  if (woodenPickaxe) {
    console.log("Une pioche en bois est déjà dans l'inventaire. Équipement...");
    await equipWoodenPickaxe(bot);
    return; // Saute toutes les étapes suivantes
  }

  const craftingTableID = bot.registry.itemsByName.crafting_table.id;

  // Vérifier si le bot a déjà une table de craft dans l'inventaire
  const craftingTable = itemByName(bot, "crafting_table");
  if (!craftingTable) {
    console.log(
      "Je n'ai pas de table de craft dans mon inventaire. Fabrication..."
    );
    await craftCraftingTable(bot);
  }

  // Poser la table de craft
  await placeCraftingTable(bot);

  // Fabriquer une pioche en bois
  await craftWoodenPickaxeWithTable(bot);

  // Équiper la pioche en bois
  await equipWoodenPickaxe(bot);

  // Casser et récupérer la table de craft
  await breakCraftingTable(bot);
}
// Fonction utilitaire pour trouver un objet par son nom dans l'inventaire
function itemByName(bot, name) {
  const items = bot.inventory.items();
  return items.find((item) => item.name === name);
}

// Fonction pour fabriquer une table de craft
async function craftCraftingTable(bot) {
  const log = bot.inventory.items().find((item) => item.name.includes("log"));
  if (!log) {
    console.log("Je n'ai pas de bois pour fabriquer une table de craft.");
    return;
  }

  try {
    // Fabriquer des planches
    const planksRecipe = bot.recipesFor(
      bot.registry.itemsByName.oak_planks.id,
      null,
      1,
      null
    )[0];
    if (planksRecipe) {
      await bot.craft(planksRecipe, 1, null);
      console.log("Planches fabriquées.");
    } else {
      console.log("Impossible de fabriquer des planches.");
      return;
    }

    // Fabriquer une table de craft
    const craftingTableRecipe = bot.recipesFor(
      bot.registry.itemsByName.crafting_table.id,
      null,
      1,
      null
    )[0];
    if (craftingTableRecipe) {
      await bot.craft(craftingTableRecipe, 1, null);
      console.log("Table de craft fabriquée.");
    } else {
      console.log("Impossible de fabriquer une table de craft.");
    }
  } catch (err) {
    console.log(`Erreur lors de la fabrication : ${err.message}`);
  }
}

async function placeCraftingTable(bot) {
  const craftingTable = itemByName(bot, "crafting_table");
  if (!craftingTable) {
    console.log("Je n'ai pas de table de craft dans mon inventaire.");
    return;
  }

  // Calcul du bloc cible au sol devant le bot
  const directionVector = bot.entity.yaw; // Orientation du bot
  const forwardOffset = new Vec3(
    Math.round(Math.cos(directionVector)), // Calcul de l'axe X
    -1, // Décalage vertical pour cibler le sol
    Math.round(Math.sin(directionVector)) // Calcul de l'axe Z
  );
  const targetBlock = bot.blockAt(bot.entity.position.plus(forwardOffset)); // Bloc au sol devant le bot

  if (!targetBlock || targetBlock.name === "air") {
    console.log(
      "Impossible de trouver un endroit valide au sol devant moi pour poser la table de craft."
    );
    return;
  }

  try {
    // Équipe la table de craft dans la main
    await bot.equip(craftingTable, "hand");
    console.log("Table de craft équipée dans la main.");

    // Tente de poser la table de craft au sol devant le bot
    await bot.placeBlock(targetBlock, new Vec3(0, 1, 0)); // Place la table au-dessus du bloc cible
    console.log("Table de craft posée au sol devant moi.");

    // Vérifie si la table de craft a bien été placée
    const placedTable = bot.blockAt(targetBlock.position.offset(0, 1, 0));
    if (placedTable && placedTable.name === "crafting_table") {
      console.log("Table de craft détectée après la pose.");
    } else {
      console.log("Échec de la détection de la table de craft après la pose.");
    }
  } catch (err) {
    console.log(`Erreur lors de la pose de la table de craft : ${err.message}`);
  }
}

// Fonction pour fabriquer une pioche en bois
async function craftWoodenPickaxeWithTable(bot) {
  const craftingTableBlock = bot.findBlock({
    matching: bot.registry.blocksByName.crafting_table.id,
    maxDistance: 6, // Distance maximale pour trouver la table
  });

  if (!craftingTableBlock) {
    console.log("Aucune table de craft trouvée à proximité.");
    return;
  }

  // Vérifiez si le bot a des bâtons, sinon fabriquez-en
  const sticks = itemByName(bot, "stick");
  if (!sticks || sticks.count < 2) {
    console.log("Pas assez de bâtons. Fabrication en cours...");
    const stickRecipe = bot.recipesFor(
      bot.registry.itemsByName.stick.id,
      null,
      1,
      craftingTableBlock
    )[0];
    if (stickRecipe) {
      try {
        await bot.craft(stickRecipe, 1, craftingTableBlock);
        console.log("Bâtons fabriqués.");
      } catch (err) {
        console.log(
          `Erreur lors de la fabrication des bâtons : ${err.message}`
        );
        return;
      }
    } else {
      console.log(
        "Impossible de trouver une recette pour fabriquer des bâtons."
      );
      return;
    }
  }

  // Vérifiez si le bot a suffisamment de planches, sinon fabriquez-en
  const planks = itemByName(bot, "oak_planks");
  if (!planks || planks.count < 3) {
    console.log("Pas assez de planches. Fabrication en cours...");
    const plankRecipe = bot.recipesFor(
      bot.registry.itemsByName.oak_planks.id,
      null,
      1,
      null
    )[0];
    if (plankRecipe) {
      try {
        await bot.craft(plankRecipe, 1, null);
        console.log("Planches supplémentaires fabriquées.");
      } catch (err) {
        console.log(
          `Erreur lors de la fabrication des planches : ${err.message}`
        );
        return;
      }
    } else {
      console.log(
        "Impossible de trouver une recette pour fabriquer des planches."
      );
      return;
    }
  }

  // Recherchez la recette pour la pioche en bois
  const woodenPickaxeRecipe = bot.recipesFor(
    bot.registry.itemsByName.wooden_pickaxe.id,
    null,
    1,
    craftingTableBlock
  )[0];

  if (!woodenPickaxeRecipe) {
    console.log(
      "Impossible de trouver une recette pour fabriquer une pioche en bois."
    );
    return;
  }

  try {
    await bot.craft(woodenPickaxeRecipe, 1, craftingTableBlock);
    console.log("Pioche en bois fabriquée.");
  } catch (err) {
    console.log(
      `Erreur lors de la fabrication de la pioche en bois : ${err.message}`
    );
  }
}

// Fonction pour équiper la pioche en bois
async function equipWoodenPickaxe(bot) {
  const woodenPickaxe = itemByName(bot, "wooden_pickaxe");
  if (!woodenPickaxe) {
    console.log("Je n'ai pas de pioche en bois dans mon inventaire.");
    return;
  }

  try {
    await bot.equip(woodenPickaxe, "hand");
    console.log("Pioche en bois équipée.");
  } catch (err) {
    console.log(
      `Erreur lors de l'équipement de la pioche en bois : ${err.message}`
    );
  }
}

// Fonction pour casser la table de craft, la récupérer et marcher dans une zone 3x3
async function breakCraftingTable(bot) {
  const craftingTableBlock = bot.findBlock({
    matching: bot.registry.blocksByName.crafting_table.id,
    maxDistance: 6, // Distance maximale pour trouver la table
  });

  if (!craftingTableBlock) {
    console.log("Aucune table de craft trouvée à proximité pour la casser.");
    return;
  }

  try {
    // Oriente le bot vers la table de craft
    await bot.lookAt(craftingTableBlock.position, true);
    console.log("Orientation vers la table de craft.");

    // Casse la table de craft
    await bot.dig(craftingTableBlock);
    console.log("Table de craft cassée et récupérée.");

    // Appeler la fonction générique pour marcher dans une zone 3x3
    await walkAround(bot, craftingTableBlock.position);
  } catch (err) {
    console.log(
      `Erreur lors de la destruction de la table de craft : ${err.message}`
    );
  }
}

// Fonction pour marcher dans une zone 3x3 autour de la position de la table de craft
async function walkAroundTable(bot, tablePosition) {
  console.log(
    `Début de la marche dans une zone 3x3 autour de la table de craft aux coordonnées (${tablePosition.x}, ${tablePosition.y}, ${tablePosition.z}).`
  );

  // Définir les positions dans une zone 3x3 autour de la table
  const positions = [
    new Vec3(tablePosition.x - 1, tablePosition.y, tablePosition.z - 1),
    new Vec3(tablePosition.x, tablePosition.y, tablePosition.z - 1),
    new Vec3(tablePosition.x + 1, tablePosition.y, tablePosition.z - 1),
    new Vec3(tablePosition.x - 1, tablePosition.y, tablePosition.z),
    new Vec3(tablePosition.x + 1, tablePosition.y, tablePosition.z),
    new Vec3(tablePosition.x - 1, tablePosition.y, tablePosition.z + 1),
    new Vec3(tablePosition.x, tablePosition.y, tablePosition.z + 1),
    new Vec3(tablePosition.x + 1, tablePosition.y, tablePosition.z + 1),
  ];

  for (const position of positions) {
    console.log(
      `Déplacement vers la position (${position.x}, ${position.y}, ${position.z}).`
    );
    const goal = new goals.GoalBlock(position.x, position.y, position.z);
    bot.pathfinder.setGoal(goal, true); // true pour permettre des mouvements fluides

    // Attendre 0,5 seconde avant de passer à la position suivante
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log("Marche dans la zone 3x3 terminée.");
}

module.exports = craftWoodenPickaxe;
