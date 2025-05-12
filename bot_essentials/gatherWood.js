// gatherWood.js
const { Vec3 } = require("vec3");
const { goals } = require("mineflayer-pathfinder");
const { walkAround } = require("./utils");

async function gatherWood(bot) {
  console.log("Le bot a spawn. Vérification de l'inventaire...");

  // Vérifier si le bot a du bois dans son inventaire
  const wood = bot.inventory.items().find((item) => item.name.includes("log"));
  if (wood) {
    console.log("Le bot a du bois dans son inventaire.");
    return Promise.resolve(); // Retourne une Promise résolue
  }

  const radius = 10; // Rayon de recherche des arbres
  const woodBlocks = bot.findBlocks({
    matching: (block) => block.name.includes("log"), // Identifier les blocs de bois
    maxDistance: radius,
    count: 1000,
  });

  const trees = [];
  const visited = new Set();

  woodBlocks.forEach((blockPos) => {
    const key = `${blockPos.x},${blockPos.y},${blockPos.z}`;
    if (visited.has(key)) return;

    const tree = {
      id: trees.length + 1,
      trunkBlocks: [],
    };

    const stack = [blockPos];
    while (stack.length > 0) {
      const current = stack.pop();
      const currentKey = `${current.x},${current.y},${current.z}`;
      if (visited.has(currentKey)) continue;

      visited.add(currentKey);
      tree.trunkBlocks.push(current);

      // Vérifier les blocs adjacents pour trouver les blocs connectés
      const neighbors = [
        new Vec3(current.x + 1, current.y, current.z),
        new Vec3(current.x - 1, current.y, current.z),
        new Vec3(current.x, current.y + 1, current.z),
        new Vec3(current.x, current.y - 1, current.z),
        new Vec3(current.x, current.y, current.z + 1),
        new Vec3(current.x, current.y, current.z - 1),
      ];

      neighbors.forEach((neighbor) => {
        const neighborBlock = bot.blockAt(neighbor);
        if (neighborBlock && neighborBlock.name.includes("log")) {
          stack.push(neighbor);
        }
      });
    }

    trees.push(tree);
  });

  // Afficher les arbres détectés
  const readableTrees = formatReadableTrees(trees);

  // Sélectionner un arbre au hasard
  const randomTree = selectRandomTree(readableTrees);

  if (!randomTree) {
    console.log("Aucun arbre valide trouvé. Arrêt de la collecte de bois.");
    return Promise.resolve();
  }

  // Déplacer le bot vers l'arbre sélectionné
  try {
    moveToTree(bot, randomTree);
    await chopTreeFromBottomToTop(bot, randomTree);
  } catch (err) {
    console.error("Erreur lors de la collecte de bois :", err);
  }
}

function selectRandomTree(trees) {
  if (trees.length === 0) {
    console.log("Aucun arbre détecté.");
    return null;
  }
  const randomIndex = Math.floor(Math.random() * trees.length);
  const randomTree = trees[randomIndex];
  console.log("Arbre choisi au hasard :", JSON.stringify(randomTree, null, 2));
  return randomTree;
}

function formatReadableTrees(trees) {
  return trees.map((tree) => ({
    id: tree.id,
    totalTrunkBlocks: tree.trunkBlocks.length, // Ajouter le total de blocs de tronc
    trunkBlocks: tree.trunkBlocks.map((block) => ({
      x: block.x,
      y: block.y,
      z: block.z,
    })),
  }));
}

function moveToTree(bot, tree) {
  if (!tree || tree.trunkBlocks.length === 0) {
    console.log("Aucun arbre valide pour se déplacer.");
    return;
  }

  const targetBlock = tree.trunkBlocks[0];
  console.log(
    `Déplacement vers l'arbre ID: ${tree.id} aux coordonnées (${targetBlock.x}, ${targetBlock.y}, ${targetBlock.z})`
  );

  // Calculer une position adjacente au tronc
  const adjacentPosition = new Vec3(
    targetBlock.x + 1, // Par exemple, se placer à +1 sur l'axe X
    targetBlock.y,
    targetBlock.z
  );

  console.log(
    `Le bot se déplacera devant l'arbre aux coordonnées (${adjacentPosition.x}, ${adjacentPosition.y}, ${adjacentPosition.z})`
  );

  const goal = new goals.GoalBlock(
    adjacentPosition.x,
    adjacentPosition.y,
    adjacentPosition.z
  );
  bot.pathfinder.setGoal(goal);

  bot.on("goal_reached", () => {
    console.log(
      `Le bot a atteint la position devant l'arbre ID: ${tree.id}. Aucune action de cassage ne devrait se produire.`
    );
  });
}

async function chopTreeFromBottomToTop(bot, tree) {
  if (!tree || tree.trunkBlocks.length === 0) {
    console.log("Aucun arbre valide à couper.");
    return;
  }

  // Trier les blocs du tronc par leur coordonnée Y (du plus bas au plus haut)
  const sortedTrunkBlocks = tree.trunkBlocks.sort((a, b) => a.y - b.y);

  console.log(
    `Début de la coupe de l'arbre ID: ${tree.id} avec ${sortedTrunkBlocks.length} blocs.`
  );

  for (const blockPos of sortedTrunkBlocks) {
    const position = new Vec3(blockPos.x, blockPos.y, blockPos.z);
    const block = bot.blockAt(position);

    if (block && block.name.includes("log")) {
      console.log(
        `Cassage du bloc de bois aux coordonnées (${block.position.x}, ${block.position.y}, ${block.position.z})`
      );
      try {
        await bot.dig(block); // Casser le bloc
      } catch (err) {
        console.error(`Erreur lors du cassage du bloc : ${err.message}`);
        return;
      }
    } else {
      console.log(
        `Bloc non valide ou déjà cassé aux coordonnées (${blockPos.x}, ${blockPos.y}, ${blockPos.z})`
      );
    }
  }

  console.log(`Arbre ID: ${tree.id} complètement coupé.`);

  // Appeler la fonction générique pour marcher dans une zone 3x3
  const initialTrunkPosition = sortedTrunkBlocks[0]; // Position du tronc le plus bas
  await walkAroundTree(bot, initialTrunkPosition); // Attendre que walkAroundTree se termine
}

async function walkAroundTree(bot, trunkPosition) {
  console.log(
    `Début de la marche dans une zone 3x3 autour de l'arbre aux coordonnées (${trunkPosition.x}, ${trunkPosition.y}, ${trunkPosition.z}).`
  );

  // Définir les positions dans une zone 3x3 autour du tronc
  const positions = [
    new Vec3(trunkPosition.x - 1, trunkPosition.y, trunkPosition.z - 1),
    new Vec3(trunkPosition.x, trunkPosition.y, trunkPosition.z - 1),
    new Vec3(trunkPosition.x + 1, trunkPosition.y, trunkPosition.z - 1),
    new Vec3(trunkPosition.x - 1, trunkPosition.y, trunkPosition.z),
    new Vec3(trunkPosition.x + 1, trunkPosition.y, trunkPosition.z),
    new Vec3(trunkPosition.x - 1, trunkPosition.y, trunkPosition.z + 1),
    new Vec3(trunkPosition.x, trunkPosition.y, trunkPosition.z + 1),
    new Vec3(trunkPosition.x + 1, trunkPosition.y, trunkPosition.z + 1),
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
module.exports = gatherWood;
