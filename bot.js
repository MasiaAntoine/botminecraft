const mineflayer = require("mineflayer");
const { pathfinder, Movements, goals } = require("mineflayer-pathfinder");

const handleSpawn = require("./bot_essentials/spawn");
const gatherWood = require("./bot_essentials/gatherWood");
const craftWoodenPickaxe = require("./bot_essentials/craftWoodenPickaxe");

const setupDebug = require("./bot_essentials/debug");

function createBot() {
  const bot = mineflayer.createBot({
    host: "localhost",
    port: 25565,
    username: "test",
    version: "1.20.1",
  });

  // Ajoutez le plugin pathfinder au bot
  bot.loadPlugin(pathfinder);

  handleSpawn(bot);

  bot.once("spawn", async () => {
    try {
      await gatherWood(bot);
      await craftWoodenPickaxe(bot);
    } catch (err) {
      console.error("Erreur lors de l'exécution des tâches :", err);
    }
  });

  bot.on("error", (err) => {
    console.error("Erreur du bot :", err);
  });

  bot.on("end", () => {
    console.log("Le bot s'est déconnecté. Tentative de reconnexion...");
    setTimeout(() => {
      createBot();
    }, 5000);
  });
}

createBot();
