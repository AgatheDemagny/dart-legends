window.genererBadges = function(history) {
  const container = document.getElementById("playerBadgesGrid");
  const detailZone = document.getElementById("badgeDetailZone");
  if (!container || !detailZone) return;
  
  container.innerHTML = "";
  detailZone.classList.add("hidden");

  // --- 1. COMPILATION DU CONTEXTE DU JOUEUR ---
  let context = {
    gamesPlayed: 0,
    wins: { total: 0, cricket: 0, x01: 0, world: 0, bounty: 0, shanghai: 0, golf: 0 },
    playedAtNight: false, playedMorning: false, maxStreak: 0, winsPerDay: {},
    doubleCheckouts: 0, count180s: 0, maxX01Avg: 0, maxCricketMPR: 0,
    highestCheckout: 0, shanghaiInstantWins: 0, shotRounds: 0,
    whiteHorses: 0, defenseAcier: false, bountyThreeInTurn: 0, bountyWinByPoints: 0, chatNoir: false,
    golfSub30: false, golfSub20: false, golfSub15: false, holeInOneBull: false,
    worldAPied: false, minWorldDarts: 999
  };

  let currentStreak = 0;
  const sortedHistory = [...history].sort((a,b) => a.createdAt - b.createdAt);

  sortedHistory.forEach(match => {
    context.gamesPlayed++;
    const d = new Date(match.createdAt);
    const h = d.getHours();
    if (h >= 0 && h < 6) context.playedAtNight = true;
    if (h >= 6 && h < 10) context.playedMorning = true;

    // Détection de la victoire
    const isWinner = match.ranking && match.ranking.length > 0 &&
      (match.ranking[0].name === currentDetailPlayerName || 
      (match.ranking[0].teamMembers && match.ranking[0].teamMembers.includes(currentDetailPlayerName)));

    if (isWinner) {
      context.wins.total++;
      context.wins[match.type] = (context.wins[match.type] || 0) + 1;
      currentStreak++;
      context.maxStreak = Math.max(context.maxStreak, currentStreak);
      const dayKey = d.toLocaleDateString("fr-FR");
      context.winsPerDay[dayKey] = (context.winsPerDay[dayKey] || 0) + 1;
    } else {
      currentStreak = 0;
    }

    const pStats = match.statsDetails ? match.statsDetails[currentDetailPlayerId] : null;
    
    if (pStats) {
      if (pStats.scoreFamily180 > 0) context.count180s += pStats.scoreFamily180;
      if (pStats.shotRounds > 0) context.shotRounds += pStats.shotRounds;
      if (pStats.highestCheckout) context.highestCheckout = Math.max(context.highestCheckout, pStats.highestCheckout);
      if (pStats.whiteHorses > 0) context.whiteHorses += pStats.whiteHorses;
      if (pStats.threeBountiesInTurn > 0) context.bountyThreeInTurn += pStats.threeBountiesInTurn;
      if (pStats.shanghaiInstantWin) context.shanghaiInstantWins++;
      if (pStats.bountyWinByPoints) context.bountyWinByPoints++;
      if (pStats.malusHits >= 3) context.chatNoir = true;

      if (match.type === "x01") {
        if (isWinner && match.x01Checkout === "double") context.doubleCheckouts++;
        if (pStats.dartsThrown >= 3) {
          const avg = (pStats.totalScoreScored / pStats.dartsThrown) * 3;
          context.maxX01Avg = Math.max(context.maxX01Avg, avg);
        }
      }
      
      if (match.type === "cricket" && pStats.dartsThrown >= 3) {
        const mpr = (pStats.touchesUtiles / pStats.dartsThrown) * 3;
        context.maxCricketMPR = Math.max(context.maxCricketMPR, mpr);
        if (isWinner && pStats.totalPointsGiven === 0) context.defenseAcier = true;
      }

      if (match.type === "world" && isWinner) {
        if (pStats.doublesHitCount === 0 && pStats.triplesHitCount === 0) context.worldAPied = true;
        // Check "Express" only if it's a full World (1 to Bull)
        if (match.worldStartNum === 1 && match.worldEndNum === 25) {
            context.minWorldDarts = Math.min(context.minWorldDarts, pStats.dartsThrown);
        }
      }

      if (match.type === "golf") {
        if (pStats.historyPerHole) {
          Object.values(pStats.historyPerHole).forEach(hole => { 
            if (hole.cible === 25 && hole.score === 1) context.holeInOneBull = true; 
          });
        }
        const teamId = match.players?.find(p => p.id === currentDetailPlayerId)?.teamId;
        const finalScore = match.scores ? match.scores[match.isTeamMode ? teamId : currentDetailPlayerId] : 999;
        
        if (match.maxTurns === 9 && isWinner) {
           if (finalScore <= 30) context.golfSub30 = true;
           if (finalScore <= 20) context.golfSub20 = true;
           if (finalScore <= 15) context.golfSub15 = true;
        }
      }
    }
  });

  context.maxDayWins = Math.max(0, ...Object.values(context.winsPerDay));

  // --- 2. DICTIONNAIRE DES BADGES ---
  // L'ordre du tableau ci-dessous dicte l'ordre exact d'affichage sur la page
  const BADGES_DICTIONARY = [
    // --- ASSIDUITÉ ---
    { icon: "🎯", title: "Novice", desc: "Jouer 1 partie", eval: c => c.gamesPlayed >= 1, progress: c => c.gamesPlayed + " / 1" },
    { icon: "🥉", title: "Régulier", desc: "Jouer 50 parties", eval: c => c.gamesPlayed >= 50, progress: c => c.gamesPlayed + " / 50" },
    { icon: "🥈", title: "Passionné", desc: "Jouer 100 parties", eval: c => c.gamesPlayed >= 100, progress: c => c.gamesPlayed + " / 100" },
    { icon: "🥇", title: "Légende", desc: "Jouer 500 parties", eval: c => c.gamesPlayed >= 500, progress: c => c.gamesPlayed + " / 500" },
    
    // --- VICTOIRES GLOBALES ---
    { icon: "🏆", title: "Premier Sang", desc: "Remporter 1 partie", eval: c => c.wins.total >= 1, progress: c => c.wins.total + " / 1" },
    { icon: "🏵️", title: "Compétiteur", desc: "Remporter 50 parties", eval: c => c.wins.total >= 50, progress: c => c.wins.total + " / 50" },
    { icon: "👑", title: "Vainqueur Incontesté", desc: "Remporter 100 parties", eval: c => c.wins.total >= 100, progress: c => c.wins.total + " / 100" },

    // --- HABITUDES & SÉRIES ---
    { icon: "🦉", title: "Oiseau de Nuit", desc: "Jouer une partie entre minuit et 6h", eval: c => c.playedAtNight, progress: c => c.playedAtNight ? "Débloqué !" : "Non accompli" },
    { icon: "🌅", title: "Lève-tôt", desc: "Jouer une partie entre 6h et 10h", eval: c => c.playedMorning, progress: c => c.playedMorning ? "Débloqué !" : "Non accompli" },
    { icon: "🔥", title: "On Fire", desc: "Remporter 5 parties consécutives", eval: c => c.maxStreak >= 5, progress: c => Math.min(c.maxStreak, 5) + " / 5" },
    { icon: "🌞", title: "Acharné", desc: "Remporter 10 parties dans la même journée", eval: c => c.maxDayWins >= 10, progress: c => Math.min(c.maxDayWins, 10) + " / 10" },

    // --- CRICKET ---
    { icon: "🏏", title: "Fermeture [Bronze]", desc: "Gagner 1 Cricket", eval: c => c.wins.cricket >= 1, progress: c => c.wins.cricket + " / 1" },
    { icon: "🏏", title: "Fermeture [Argent]", desc: "Gagner 10 Crickets", eval: c => c.wins.cricket >= 10, progress: c => c.wins.cricket + " / 10" },
    { icon: "🏏", title: "Fermeture [Or]", desc: "Gagner 50 Crickets", eval: c => c.wins.cricket >= 50, progress: c => c.wins.cricket + " / 50" },
    { icon: "🛡️", title: "Défense d'Acier", desc: "Gagner un Cricket sans donner aucun point", eval: c => c.defenseAcier, progress: c => c.defenseAcier ? "Débloqué !" : "Non accompli" },
    { icon: "⚔️", title: "Bon Bras (MPR)", desc: "Terminer avec MPR > 2.0", eval: c => c.maxCricketMPR >= 2.0, progress: c => `Meilleur MPR : ${c.maxCricketMPR.toFixed(1)}` },
    { icon: "🦾", title: "Tireur d'Élite (MPR)", desc: "Terminer avec MPR > 3.0", eval: c => c.maxCricketMPR >= 3.0, progress: c => `Meilleur MPR : ${c.maxCricketMPR.toFixed(1)}` },
    { icon: "🤖", title: "Machine à Fermer (MPR)", desc: "Terminer avec MPR > 4.0", eval: c => c.maxCricketMPR >= 4.0, progress: c => `Meilleur MPR : ${c.maxCricketMPR.toFixed(1)}` },
    { icon: "🐎", title: "White Horse [I]", desc: "Faire 1 White Horse", eval: c => c.whiteHorses >= 1, progress: c => c.whiteHorses + " / 1" },
    { icon: "🐎", title: "White Horse [V]", desc: "Faire 5 White Horses", eval: c => c.whiteHorses >= 5, progress: c => c.whiteHorses + " / 5" },
    { icon: "🐎", title: "White Horse [X]", desc: "Faire 10 White Horses", eval: c => c.whiteHorses >= 10, progress: c => c.whiteHorses + " / 10" },
    { icon: "🐎", title: "White Horse [L]", desc: "Faire 50 White Horses", eval: c => c.whiteHorses >= 50, progress: c => c.whiteHorses + " / 50" },

    // --- X01 ---
    { icon: "💯", title: "Finisseur [Bronze]", desc: "Gagner 1 X01", eval: c => c.wins.x01 >= 1, progress: c => c.wins.x01 + " / 1" },
    { icon: "💯", title: "Finisseur [Argent]", desc: "Gagner 10 X01", eval: c => c.wins.x01 >= 10, progress: c => c.wins.x01 + " / 10" },
    { icon: "💯", title: "Finisseur [Or]", desc: "Gagner 50 X01", eval: c => c.wins.x01 >= 50, progress: c => c.wins.x01 + " / 50" },
    { icon: "📈", title: "Régulier (Moy)", desc: "Moyenne X01 > 50", eval: c => c.maxX01Avg >= 50, progress: c => `Meilleure Moyenne : ${c.maxX01Avg.toFixed(1)}` },
    { icon: "🤯", title: "Pro Player (Moy)", desc: "Moyenne X01 > 80", eval: c => c.maxX01Avg >= 80, progress: c => `Meilleure Moyenne : ${c.maxX01Avg.toFixed(1)}` },
    { icon: "👽", title: "Alien (Moy)", desc: "Moyenne X01 > 100", eval: c => c.maxX01Avg >= 100, progress: c => `Meilleure Moyenne : ${c.maxX01Avg.toFixed(1)}` },
    { icon: "🎯", title: "Checkout [I]", desc: "1 victoire en Double-Out", eval: c => c.doubleCheckouts >= 1, progress: c => c.doubleCheckouts + " / 1" },
    { icon: "🎯", title: "Checkout [X]", desc: "10 victoires en Double-Out", eval: c => c.doubleCheckouts >= 10, progress: c => c.doubleCheckouts + " / 10" },
    { icon: "🎯", title: "Checkout [L]", desc: "50 victoires en Double-Out", eval: c => c.doubleCheckouts >= 50, progress: c => c.doubleCheckouts + " / 50" },
    { icon: "🚀", title: "Ton 80 [I]", desc: "Faire un 180 parfait", eval: c => c.count180s >= 1, progress: c => c.count180s + " / 1" },
    { icon: "🚀", title: "Ton 80 [V]", desc: "Faire 5 fois 180", eval: c => c.count180s >= 5, progress: c => c.count180s + " / 5" },
    { icon: "🚀", title: "Ton 80 [X]", desc: "Faire 10 fois 180", eval: c => c.count180s >= 10, progress: c => c.count180s + " / 10" },
    { icon: "🚀", title: "Ton 80 [L]", desc: "Faire 50 fois 180", eval: c => c.count180s >= 50, progress: c => c.count180s + " / 50" },
    { icon: "🍸", title: "Tournée de Shots", desc: "Faire un SHOT (3x1) en X01", eval: c => c.shotRounds > 0, progress: c => `${c.shotRounds} réalisés` },
    { icon: "🎣", title: "High Finish", desc: "Fermeture avec un score >= 100", eval: c => c.highestCheckout >= 100, progress: c => `Record : ${c.highestCheckout} pts` },
    { icon: "🦈", title: "The Big Fish", desc: "Fermeture ultime à 170 points", eval: c => c.highestCheckout === 170, progress: c => c.highestCheckout === 170 ? "Débloqué !" : "Non accompli" },

    // --- BOUNTY ---
    { icon: "💰", title: "Mercenaire [Bronze]", desc: "Gagner 1 Bounty", eval: c => c.wins.bounty >= 1, progress: c => c.wins.bounty + " / 1" },
    { icon: "💰", title: "Mercenaire [Argent]", desc: "Gagner 10 Bounties", eval: c => c.wins.bounty >= 10, progress: c => c.wins.bounty + " / 10" },
    { icon: "💰", title: "Mercenaire [Or]", desc: "Gagner 50 Bounties", eval: c => c.wins.bounty >= 50, progress: c => c.wins.bounty + " / 50" },
    { icon: "🔫", title: "Gâchette Folle", desc: "Toucher 3 primes dans un seul tour", eval: c => c.bountyThreeInTurn > 0, progress: c => `${c.bountyThreeInTurn} réalisés` },
    { icon: "💎", title: "Braquage Parfait", desc: "Gagner aux points (Objectif atteint)", eval: c => c.bountyWinByPoints > 0, progress: c => `${c.bountyWinByPoints} réalisés` },
    { icon: "🐈‍⬛", title: "Chat Noir", desc: "Toucher le malus 3 fois en une partie", eval: c => c.chatNoir, progress: c => c.chatNoir ? "Débloqué !" : "Non accompli" },

    // --- WORLD ---
    { icon: "🌍", title: "Explorateur [Bronze]", desc: "Gagner 1 Tour du Monde", eval: c => c.wins.world >= 1, progress: c => c.wins.world + " / 1" },
    { icon: "🌍", title: "Explorateur [Argent]", desc: "Gagner 10 Tours du Monde", eval: c => c.wins.world >= 10, progress: c => c.wins.world + " / 10" },
    { icon: "🌍", title: "Explorateur [Or]", desc: "Gagner 50 Tours du Monde", eval: c => c.wins.world >= 50, progress: c => c.wins.world + " / 50" },
    { icon: "🥾", title: "À pied", desc: "Gagner sans utiliser de saut (Aucun double/triple)", eval: c => c.worldAPied, progress: c => c.worldAPied ? "Débloqué !" : "Non accompli" },
    { icon: "🚅", title: "Express 40", desc: "Parcours 1 -> Bull en moins de 40 fléchettes", eval: c => c.minWorldDarts <= 40, progress: c => c.minWorldDarts <= 40 ? "Débloqué !" : "Meilleur : " + (c.minWorldDarts===999 ? "Aucun" : c.minWorldDarts) },
    { icon: "✈️", title: "Express 30", desc: "Parcours 1 -> Bull en moins de 30 fléchettes", eval: c => c.minWorldDarts <= 30, progress: c => c.minWorldDarts <= 30 ? "Débloqué !" : "Meilleur : " + (c.minWorldDarts===999 ? "Aucun" : c.minWorldDarts) },
    { icon: "🚀", title: "Speedrun 25", desc: "Parcours 1 -> Bull en moins de 25 fléchettes", eval: c => c.minWorldDarts <= 25, progress: c => c.minWorldDarts <= 25 ? "Débloqué !" : "Meilleur : " + (c.minWorldDarts===999 ? "Aucun" : c.minWorldDarts) },

    // --- SHANGHAI ---
    { icon: "🐉", title: "Dragon [Bronze]", desc: "Gagner 1 Shanghai", eval: c => c.wins.shanghai >= 1, progress: c => c.wins.shanghai + " / 1" },
    { icon: "🐉", title: "Dragon [Argent]", desc: "Gagner 10 Shanghais", eval: c => c.wins.shanghai >= 10, progress: c => c.wins.shanghai + " / 10" },
    { icon: "🐉", title: "Dragon [Or]", desc: "Gagner 50 Shanghais", eval: c => c.wins.shanghai >= 50, progress: c => c.wins.shanghai + " / 50" },
    { icon: "⚡", title: "Mort Subite [I]", desc: "Gagner par Shanghai direct", eval: c => c.shanghaiInstantWins >= 1, progress: c => c.shanghaiInstantWins + " / 1" },
    { icon: "⚡", title: "Mort Subite [V]", desc: "5 victoires directes", eval: c => c.shanghaiInstantWins >= 5, progress: c => c.shanghaiInstantWins + " / 5" },
    { icon: "⚡", title: "Mort Subite [X]", desc: "10 victoires directes", eval: c => c.shanghaiInstantWins >= 10, progress: c => c.shanghaiInstantWins + " / 10" },
    { icon: "⚡", title: "Mort Subite [L]", desc: "50 victoires directes", eval: c => c.shanghaiInstantWins >= 50, progress: c => c.shanghaiInstantWins + " / 50" },

    // --- GOLF ---
    { icon: "⛳", title: "Golfeur [Bronze]", desc: "Gagner 1 Golf", eval: c => c.wins.golf >= 1, progress: c => c.wins.golf + " / 1" },
    { icon: "⛳", title: "Golfeur [Argent]", desc: "Gagner 10 Golfs", eval: c => c.wins.golf >= 10, progress: c => c.wins.golf + " / 10" },
    { icon: "⛳", title: "Golfeur [Or]", desc: "Gagner 50 Golfs", eval: c => c.wins.golf >= 50, progress: c => c.wins.golf + " / 50" },
    { icon: "🕳️", title: "Trou en un", desc: "Faire un Eagle (Double) sur le Bull", eval: c => c.holeInOneBull, progress: c => c.holeInOneBull ? "Débloqué !" : "Non accompli" },
    { icon: "🏌️", title: "Sous les 30", desc: "Gagner un 9 trous en moins de 30 coups", eval: c => c.golfSub30, progress: c => c.golfSub30 ? "Débloqué !" : "Non accompli" },
    { icon: "🏌️", title: "Sous les 20", desc: "Gagner un 9 trous en moins de 20 coups", eval: c => c.golfSub20, progress: c => c.golfSub20 ? "Débloqué !" : "Non accompli" },
    { icon: "🏌️", title: "Sous les 15", desc: "Gagner un 9 trous en moins de 15 coups", eval: c => c.golfSub15, progress: c => c.golfSub15 ? "Débloqué !" : "Non accompli" }
  ];

  // --- 3. AFFICHAGE DE LA GRILLE DANS L'ORDRE STRICT ---
  BADGES_DICTIONARY.forEach(badge => {
    const isUnlocked = badge.eval(context);
    
    const bBtn = document.createElement("div");
    bBtn.style.width = "48px"; bBtn.style.height = "48px";
    bBtn.style.borderRadius = "50%";
    bBtn.style.display = "flex"; bBtn.style.alignItems = "center"; bBtn.style.justifyContent = "center";
    bBtn.style.fontSize = "26px"; bBtn.style.cursor = "pointer";
    bBtn.style.transition = "transform 0.1s ease";
    
    // Style visuel (Grisé si bloqué)
    if (isUnlocked) {
       bBtn.style.background = "radial-gradient(circle, rgba(227, 212, 174, 0.4) 0%, rgba(227, 212, 174, 0.1) 100%)";
       bBtn.style.border = "2px solid var(--accent)";
       bBtn.style.boxShadow = "0 2px 8px rgba(154, 123, 28, 0.2)";
    } else {
       bBtn.style.background = "#F5F5F5";
       bBtn.style.border = "2px solid #E0E0E0";
       bBtn.style.filter = "grayscale(100%)";
       bBtn.style.opacity = "0.4";
    }

    bBtn.innerText = badge.icon;
    
    // Action au clic
    bBtn.onclick = () => {
      document.getElementById("badgeDetailIcon").innerText = badge.icon;
      document.getElementById("badgeDetailTitle").innerText = badge.title;
      document.getElementById("badgeDetailDesc").innerText = badge.desc;
      document.getElementById("badgeDetailProgress").innerText = badge.progress(context);
      
      document.getElementById("badgeDetailIcon").style.filter = isUnlocked ? "none" : "grayscale(100%)";
      document.getElementById("badgeDetailIcon").style.opacity = isUnlocked ? "1" : "0.5";
      
      detailZone.classList.remove("hidden");
    };
    
    container.appendChild(bBtn);
  });
};