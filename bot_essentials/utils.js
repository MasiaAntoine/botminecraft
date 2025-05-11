const { Vec3 } = require("vec3");
const { goals } = require("mineflayer-pathfinder");

/**
 * Fonction générique pour marcher dans une zone 3x3 autour d'une position donnée.
 * @param {object} bot - Instance du bot Mineflayer.
 * @param {Vec3} position - Position centrale autour de laquelle marcher.
 */
async function walkAround(bot, position) {
  setTimeout(async () => {
    console.log(
      `Début de la marche dans une zone 3x3 autour de la position (${position.x}, ${position.y}, ${position.z}).`
    );

    // Définir les positions dans une zone 3x3 autour de la position centrale
    const positions = [
      new Vec3(position.x - 1, position.y, position.z - 1),
      new Vec3(position.x, position.y, position.z - 1),
      new Vec3(position.x + 1, position.y, position.z - 1),
      new Vec3(position.x - 1, position.y, position.z),
      new Vec3(position.x + 1, position.y, position.z),
      new Vec3(position.x - 1, position.y, position.z + 1),
      new Vec3(position.x, position.y, position.z + 1),
      new Vec3(position.x + 1, position.y, position.z + 1),
    ];

    for (const pos of positions) {
      console.log(
        `Déplacement vers la position (${pos.x}, ${pos.y}, ${pos.z}).`
      );
      const goal = new goals.GoalBlock(pos.x, pos.y, pos.z);
      bot.pathfinder.setGoal(goal, true); // true pour permettre des mouvements fluides

      // Attendre 0,5 seconde avant de passer à la position suivante
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log("Marche dans la zone 3x3 terminée.");
  }, 1000);
}

module.exports = { walkAround };
