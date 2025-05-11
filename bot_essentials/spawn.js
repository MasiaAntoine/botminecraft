module.exports = function handleSpawn(bot) {
  bot.on("spawn", () => {
    console.log("Le bot est apparu dans le monde !");
  });

  bot.on("login", () => {
    console.log("Le bot est connecté !");
  });
};
