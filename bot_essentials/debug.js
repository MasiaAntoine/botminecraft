module.exports = function setupDebug(bot) {
  // Débogage : Afficher les coordonnées du bot
  bot.on("spawn", () => {
    console.log(`Bot spawné à : ${bot.entity.position}`);
  });

  // Débogage : Afficher les messages de chat
  bot.on("chat", (username, message) => {
    console.log(`[Chat] ${username}: ${message}`);
  });

  // Débogage : Afficher les blocs chargés
  bot.on("chunkColumnLoad", (chunk) => {
    console.log("Chunk chargé :", chunk);
  });

  // Débogage : Afficher les entités proches
  bot.on("entitySpawn", (entity) => {
    console.log(`Entité détectée : ${entity.name} à ${entity.position}`);
  });

  // Débogage : Afficher les erreurs
  bot.on("error", (err) => {
    console.error("Erreur détectée :", err);
  });

  // Débogage : Afficher les blocs autour du bot
  bot.on("chat", (username, message) => {
    if (message === "scan_area") {
      console.log("Scan des blocs autour du bot...");
      for (let dx = -2; dx <= 2; dx++) {
        for (let dz = -2; dz <= 2; dz++) {
          const block = bot.blockAt(bot.entity.position.offset(dx, -1, dz));
          if (block) {
            console.log(`Bloc à (${dx}, -1, ${dz}) : ${block.name}`);
          }
        }
      }
    }
  });

  // Débogage : Afficher les coordonnées actuelles
  bot.on("chat", (username, message) => {
    if (message === "coords") {
      const pos = bot.entity.position;
      console.log(`Coordonnées actuelles : X=${pos.x}, Y=${pos.y}, Z=${pos.z}`);
    }
  });

  // Débogage : Afficher le monde actuel
  bot.on("chat", (username, message) => {
    if (message === "world") {
      console.log(`Monde actuel : ${bot.game.dimension}`);
    }
  });

  bot.on("chat", (username, message) => {
    if (message === "world_info") {
      console.log(`Monde actuel : ${bot.game.dimension}`);
      console.log(`Position actuelle : ${bot.entity.position}`);
      console.log("Blocs autour du bot :");
      for (let dx = -2; dx <= 2; dx++) {
        for (let dz = -2; dz <= 2; dz++) {
          const block = bot.blockAt(bot.entity.position.offset(dx, -1, dz));
          if (block) {
            console.log(`Bloc à (${dx}, -1, ${dz}) : ${block.name}`);
          }
        }
      }
    }
  });

  setInterval(() => {
    console.log(`Ping actuel du bot : ${bot.player.ping} ms`);
  }, 5000);

  bot.on("packet", (data, meta) => {
    if (meta.name === "keep_alive") {
      console.log("Paquet keep_alive reçu du serveur.");
    }
  });
};
