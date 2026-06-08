// ================== INITIALISATION & VUES ==================
const screens = {
  loading: document.getElementById("loadingScreen"),
  login: document.getElementById("loginScreen"),
  home: document.getElementById("homeScreen"),
  newGame: document.getElementById("newGameScreen"),
  cricket: document.getElementById("cricketScreen")
};

function showScreen(activeScreen) {
  Object.values(screens).forEach(s => s.classList.add("hidden"));
  activeScreen.classList.remove("hidden");
}

function showPopup(text) {
  const popup = document.getElementById("popup");
  popup.innerText = text;
  popup.style.display = "block";
  clearTimeout(window.popupTimeout);
  window.popupTimeout = setTimeout(() => { popup.style.display = "none"; }, 2500);
}

// Navigation vers Nouvelle Partie
document.getElementById("menuNewGame").addEventListener("click", () => {
  showScreen(screens.newGame);
  initPageNouvellePartie();
});
document.getElementById("backHomeBtn").addEventListener("click", () => showScreen(screens.home));

["menuPlayers", "menuHistory", "menuRanking", "menuTraining", "menuTournament"].forEach(id => {
  document.getElementById(id).addEventListener("click", () => { showPopup("Arrive dans la prochaine mise à jour !"); });
});

// ================== CONFIGURATION FIREBASE ==================
const auth = firebase.auth();
const db = firebase.firestore();

auth.onAuthStateChanged(async (user) => {
  if (user) {
    document.getElementById("playerNameDisplay").innerText = user.email.split('@')[0];
    showScreen(screens.home);
  } else {
    showScreen(screens.login);
  }
  if (screens.loading) screens.loading.classList.add("hidden");
});

// Inscription & Connexion
document.getElementById("btnSignup").addEventListener("click", async () => {
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value.trim();
  if (!email || !password) return showPopup("Champs obligatoires.");
  try {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    await db.collection("players").doc(cred.user.uid).set({
      email: email, name: email.split('@')[0], createdAt: Date.now()
    });
    showPopup("Compte joueur enregistré !");
  } catch (e) { showPopup(e.message); }
});

document.getElementById("btnLogin").addEventListener("click", async () => {
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value.trim();
  if (!email || !password) return showPopup("Champs obligatoires.");
  try { await auth.signInWithEmailAndPassword(email, password); } catch (e) { showPopup(e.message); }
});

document.getElementById("btnLogout").addEventListener("click", () => { auth.signOut(); });


// ================== LOGIQUE DU BLOC NOUVELLE PARTIE ==================
let tousLesJoueursBase = [];
let joueursSelectionnesMatch = [];

function initPageNouvellePartie() {
  joueursSelectionnesMatch = [];
  // Par défaut, on ajoute le joueur connecté
  if (auth.currentUser) {
    joueursSelectionnesMatch.push({
      id: auth.currentUser.uid,
      name: auth.currentUser.email.split('@')[0]
    });
  }
  renderSelectedPlayers();
  chargerTousLesJoueurs();
}

// Ouvrir les sous-sections d'ajout
// ÉCOUTEUR CORRIGÉ : Ouvrir la recherche et afficher les joueurs disponibles
document.getElementById("btnOpenSearchPlayer").addEventListener("click", () => {
  const zoneSearch = document.getElementById("zoneSearchPlayer");
  zoneSearch.classList.toggle("hidden");
  document.getElementById("zoneCreatePlayer").classList.add("hidden");
  
  // Si on vient d'ouvrir la zone, on affiche la liste complète par défaut
  if (!zoneSearch.classList.contains("hidden")) {
    filtrerEtAfficherJoueurs(""); // Chaîne vide = affiche tout
    document.getElementById("searchPlayerInput").focus();
  }
});
document.getElementById("btnOpenCreatePlayer").addEventListener("click", () => {
  document.getElementById("zoneCreatePlayer").classList.toggle("hidden");
  document.getElementById("zoneSearchPlayer").classList.add("hidden");
});

// Charger la liste globale pour la recherche locale
async function chargerTousLesJoueurs() {
  tousLesJoueursBase = [];
  try {
    const snap = await db.collection("players").get();
    snap.forEach(doc => {
      tousLesJoueursBase.push({ id: doc.id, ...doc.data() });
    });
  } catch(e) { console.error(e); }
}

// Recherche de joueur en temps réel
// Fonction isolée pour filtrer et afficher les résultats
function filtrerEtAfficherJoueurs(query) {
  const resultContainer = document.getElementById("searchResultsList");
  resultContainer.innerHTML = "";

  // Si la requête est vide, on affiche TOUS les joueurs de la base (sauf ceux déjà sélectionnés)
  // Sinon, on filtre par le nom tapé
  const filtres = tousLesJoueursBase.filter(p => {
    const correspondNom = p.name.toLowerCase().includes(query.toLowerCase().trim());
    const pas_deja_selectionne = !joueursSelectionnesMatch.some(sel => sel.id === p.id);
    return correspondNom && pas_deja_selectionne;
  });

  if (filtres.length === 0) {
    resultContainer.innerHTML = "<p class='hint' style='padding:6px;'>Aucun joueur disponible</p>";
    return;
  }

  filtres.forEach(p => {
    const d = document.createElement("div");
    d.className = "stat-row";
    d.style.cursor = "pointer";
    d.style.padding = "8px 6px";
    d.style.borderBottom = "1px solid var(--divider)";
    d.innerHTML = `<span>👤 <strong>${p.name}</strong></span>`;
    
    d.onclick = () => {
      joueursSelectionnesMatch.push({ id: p.id, name: p.name });
      renderSelectedPlayers();
      document.getElementById("searchPlayerInput").value = "";
      resultContainer.innerHTML = "";
      document.getElementById("zoneSearchPlayer").classList.add("hidden");
      showPopup(`${p.name} ajouté au match !`);
    };
    resultContainer.appendChild(d);
  });
}

// Écouteur sur l'input pour filtrer pendant la saisie
document.getElementById("searchPlayerInput").addEventListener("input", (e) => {
  filtrerEtAfficherJoueurs(e.target.value);
});

// Créer un joueur dans la base
document.getElementById("btnValidateCreatePlayer").addEventListener("click", async () => {
  const name = document.getElementById("createPlayerName").value.trim();
  const email = document.getElementById("createPlayerEmail").value.trim().toLowerCase();

  if(!name) return showPopup("Le nom est obligatoire.");

  try {
    const docId = "guest-" + Date.now();
    const nouveauJoueur = { name: name, email: email || null, createdAt: Date.now() };
    
    await db.collection("players").doc(docId).set(nouveauJoueur);
    joueursSelectionnesMatch.push({ id: docId, name: name });
    
    renderSelectedPlayers();
    chargerTousLesJoueurs();
    
    document.getElementById("createPlayerName").value = "";
    document.getElementById("createPlayerEmail").value = "";
    document.getElementById("zoneCreatePlayer").classList.add("hidden");
    showPopup("Joueur créé avec succès !");
  } catch(e) { showPopup(e.message); }
});

// Affichage des participants choisis
function renderSelectedPlayers() {
  const container = document.getElementById("selectedPlayersMatchList");
  container.innerHTML = "";
  
  if(joueursSelectionnesMatch.length === 0) {
    container.innerHTML = "<p class='hint'>Aucun tireur sélectionné.</p>";
    return;
  }

  joueursSelectionnesMatch.forEach((p, index) => {
    const badge = document.createElement("div");
    badge.className = "stat-row";
    badge.style.padding = "6px 10px";
    badge.style.background = "rgba(255,255,255,0.03)";
    badge.style.borderRadius = "10px";
    badge.style.marginBottom = "5px";
    badge.innerHTML = `
      <span>🎯 <strong>${p.name}</strong></span>
      <button class="ghost" style="padding: 2px 8px; font-size:12px; color:var(--text-soft);" onclick="retirerJoueurMatch(${index})">Retirer</button>
    `;
    container.appendChild(badge);
  });
}

function retirerJoueurMatch(idx) {
  joueursSelectionnesMatch.splice(idx, 1);
  renderSelectedPlayers();
}


// ================== MOTEUR DE CRICKET COMPLET ==================
let cricketState = {
  players: [],        // [{id, name}]
  maxTurns: 20,       // Limite de tours
  isBlind: false,     // Mode à l'aveugle
  targets: [],        // Les numéros réels du match (ex: 20, 19, etc.)
  blindMap: {},       // Si aveugle, associe la valeur affichée à la valeur réelle cachée
  revealedTargets: [],// Cibles découvertes en cours de jeu
  scores: {},         // { playerId: score }
  marks: {},          // { playerId: { target: 0,1,2,3 } }
  history: [],        // Pour l'action "Effacer / Annuler" le coup d'avant
  
  currentPlayerIdx: 0,
  currentDart: 1,
  currentTurn: 1,
  
  startTime: 0,
  elapsedTime: 0,
  timerInterval: null,
  isPaused: false
};

let modificateurEnCours = 1;

// Modificateur tactile
document.querySelectorAll("#cricketModifierPicker button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#cricketModifierPicker button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    modificateurEnCours = parseInt(btn.dataset.mod, 10);
  });
});

function resetModifierUI() {
  modificateurEnCours = 1;
  document.querySelectorAll("#cricketModifierPicker button").forEach(b => b.classList.remove("active"));
  document.querySelector('#cricketModifierPicker button[data-mod="1"]').classList.add("active");
}

// Lancement du match
document.getElementById("startGameBtn").addEventListener("click", () => {
  if (joueursSelectionnesMatch.length === 0) return showPopup("Ajoute au moins 1 joueur pour jouer !");

  // Configuration initiale
  cricketState.players = [...joueursSelectionnesMatch];
  cricketState.maxTurns = parseInt(document.getElementById("gameTurnsSelect").value, 10);
  cricketState.isBlind = document.getElementById("blindModeCheckbox").checked;
  cricketState.targets = [20, 19, 18, 17, 16, 15, 25];
  cricketState.revealedTargets = cricketState.isBlind ? [] : [...cricketState.targets];
  cricketState.history = [];
  
  cricketState.currentPlayerIdx = 0;
  cricketState.currentDart = 1;
  cricketState.currentTurn = 1;
  cricketState.scores = {};
  cricketState.marks = {};

  // Assignation aléatoire si Mode Aveugle
  if (cricketState.isBlind) {
    let valeursReelles = [20, 19, 18, 17, 16, 15, 25];
    // Mélange de Fischer-Yates
    for (let i = valeursReelles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [valeursReelles[i], valeursReelles[j]] = [valeursReelles[j], valeursReelles[i]];
    }
    cricketState.blindMap = {};
    cricketState.targets.forEach((t, index) => {
      cricketState.blindMap[t] = valeursReelles[index];
    });
  }

  cricketState.players.forEach(p => {
    cricketState.scores[p.id] = 0;
    cricketState.marks[p.id] = { 20: 0, 19: 0, 18: 0, 17: 0, 16: 0, 15: 0, 25: 0 };
  });

  resetModifierUI();
  showScreen(screens.cricket);
  
  // Timer
  cricketState.startTime = Date.now();
  cricketState.elapsedTime = 0;
  cricketState.isPaused = false;
  document.getElementById("btnPauseGame").innerText = "⏸️";
  clearInterval(cricketState.timerInterval);
  cricketState.timerInterval = setInterval(updateTimer, 1000);

  renderKeyboard();
  renderGrid();
  updateTurnHeader();
});

// Chronomètre
function updateTimer() {
  if (cricketState.isPaused) return;
  cricketState.elapsedTime = Math.floor((Date.now() - cricketState.startTime) / 1000);
  const m = String(Math.floor(cricketState.elapsedTime / 60)).padStart(2, "0");
  const s = String(cricketState.elapsedTime % 60).padStart(2, "0");
  document.getElementById("gameTimerDisplay").innerText = `${m}:${s}`;
}

// Gestion Pause
document.getElementById("btnPauseGame").addEventListener("click", () => {
  cricketState.isPaused = !cricketState.isPaused;
  if (cricketState.isPaused) {
    document.getElementById("btnPauseGame").innerText = "▶️";
    document.getElementById("cricketKeyboardZone").style.pointerEvents = "none";
    document.getElementById("cricketKeyboardZone").style.opacity = "0.4";
    showPopup("Partie en pause");
  } else {
    document.getElementById("btnPauseGame").innerText = "⏸️";
    document.getElementById("cricketKeyboardZone").style.pointerEvents = "auto";
    document.getElementById("cricketKeyboardZone").style.opacity = "1";
    // Ajustement de l'heure de départ pour ne pas compter le temps de pause
    cricketState.startTime = Date.now() - (cricketState.elapsedTime * 1000);
  }
});

// Header Tour & Joueur
function updateTurnHeader() {
  const p = cricketState.players[cricketState.currentPlayerIdx];
  document.getElementById("cricketCurrentPlayerName").innerText = p.name;
  
  let dartsIcons = "";
  for(let i=1; i<=3; i++) {
    dartsIcons += (i >= cricketState.currentDart) ? "🎯 " : "⚪ ";
  }
  document.getElementById("dartsCountIcons").innerHTML = dartsIcons;

  const tText = cricketState.maxTurns === 999 ? "∞" : cricketState.maxTurns;
  document.getElementById("gameTurnIndicator").innerText = `Tour ${cricketState.currentTurn}/${tText}`;
}

// Rendu Dynamique de la Grille de Score Horizontale
function renderGrid() {
  const table = document.getElementById("cricketGridTable");
  table.innerHTML = "";

  // 1. En-tête : Joueur | Les zones du Cricket | Score
  const headerRow = document.createElement("tr");
  headerRow.innerHTML = `<th style="text-align:left; padding: 6px; border-bottom: 1px solid var(--divider);">Joueur</th>`;
  
  cricketState.targets.forEach(t => {
    let libelle = t === 25 ? "Bull" : t;
    // Si aveugle et non révélé
    if (cricketState.isBlind && !cricketState.revealedTargets.includes(t)) {
      libelle = "❓";
    }
    headerRow.innerHTML += `<th style="font-weight:bold; border-bottom: 1px solid var(--divider);">${libelle}</th>`;
  });
  headerRow.innerHTML += `<th style="padding: 6px; border-bottom: 1px solid var(--divider); color: var(--accent);">Score</th>`;
  table.appendChild(headerRow);

  // 2. Lignes joueurs
  cricketState.players.forEach(p => {
    const row = document.createElement("tr");
    
    // Distinguer visuellement le joueur actif
    if(p.id === cricketState.players[cricketState.currentPlayerIdx].id) {
      row.style.backgroundColor = "rgba(192,101,42,0.12)";
    }

    let cellsHtml = `<td style="text-align:left; padding: 8px 4px; font-weight:600;">${p.name}</td>`;
    
    cricketState.targets.forEach(t => {
      const touches = cricketState.marks[p.id][t];
      let symbole = ""; // Vide par défaut

      if (touches === 1) symbole = `<span style="font-size: 16px; font-weight:800; color:var(--text-main); font-family: monospace;">\\</span>`;
      else if (touches === 2) symbole = `<span style="font-size: 16px; font-weight:800; color:var(--text-main); font-family: monospace;">X</span>`;
      else if (touches >= 3) {
        // Style exigé : X avec cercle rouge et gras
        symbole = `<span style="display:inline-block; border: 2px solid #b83227; border-radius: 50%; width: 24px; height: 24px; line-height: 20px; font-weight: 900; color: #b83227; text-align:center; font-family: monospace;">X</span>`;
      }

      cellsHtml += `<td style="padding: 4px; border-bottom: 1px solid var(--divider);">${symbole}</td>`;
    });

    // Score final (Peut être négatif en Cut-Throat)
    cellsHtml += `<td style="font-weight:800; color:var(--primary-strong);">${cricketState.scores[p.id]}</td>`;
    row.innerHTML = cellsHtml;
    table.appendChild(row);
  });
}

// Rendu du Clavier Tactile (s'adapte si aveugle pour donner tous les choix possibles)
function renderKeyboard() {
  const container = document.getElementById("cricketKeysContainer");
  container.innerHTML = "";

  // Si aveugle et non découvert, on doit pouvoir presser tous les boutons de 15 à 20 pour chercher
  const boutonsAAfficher = [20, 19, 18, 17, 16, 15];

  boutonsAAfficher.forEach(num => {
    const btn = document.createElement("button");
    btn.className = "ghost";
    btn.innerText = num;
    btn.onclick = () => taperChiffre(num);
    container.appendChild(btn);
  });
}

// Actions sur le clavier numérique
document.getElementById("btnKeyZero").onclick = () => taperChiffre(0);
document.getElementById("btnKeyBull").onclick = () => taperChiffre(25);

// Enregistrement d'un tir
function taperChiffre(valeurBouton) {
  if (cricketState.isPaused) return;

  const joueurActuel = cricketState.players[cricketState.currentPlayerIdx];
  
  // Sauvegarde de l'état pour action annuler (Deep copy simplifiée)
  cricketState.history.push({
    scores: JSON.parse(JSON.stringify(cricketState.scores)),
    marks: JSON.parse(JSON.stringify(cricketState.marks)),
    revealedTargets: [...cricketState.revealedTargets],
    currentPlayerIdx: cricketState.currentPlayerIdx,
    currentDart: cricketState.currentDart,
    currentTurn: cricketState.currentTurn
  });

  if (valeurBouton !== 0) {
    let cibleReelle = valeurBouton;
    
    // Traitement Mode Aveugle
    if (cricketState.isBlind) {
      cibleReelle = cricketState.blindMap[valeurBouton];
      if (!cricketState.revealedTargets.includes(valeurBouton)) {
        cricketState.revealedTargets.push(valeurBouton);
        showPopup(`🎯 Zone découverte ! Le bouton ${valeurBouton} cache en réalité le : ${cibleReelle === 25 ? 'Bull' : cibleReelle}`);
      }
    }

    let touchesPrecedentes = cricketState.marks[joueurActuel.id][cibleReelle];
    let touchesRestantes = 3 - touchesPrecedentes;

    // Fermeture progressive
    let touchesAppliquees = Math.min(modificateurEnCours, touchesRestantes);
    cricketState.marks[joueurActuel.id][cibleReelle] += touchesAppliquees;

    let surplus = modificateurEnCours - touchesAppliquees;

    // Règle du Cut-Throat (Points appliqués en NÉGATIF aux adversaires non fermés)
    if (surplus > 0) {
      cricketState.players.forEach(adversaire => {
        if (adversaire.id !== joueurActuel.id) {
          const advFerme = cricketState.marks[adversaire.id][cibleReelle] >= 3;
          if (!advFerme) {
            // On retire les points à l'adversaire
            cricketState.scores[adversaire.id] -= (cibleReelle * surplus);
          }
        }
      });
    }
  }

  // Passage à la fléchette ou au joueur suivant
  cricketState.currentDart += 1;
  if (cricketState.currentDart > 3) {
    cricketState.currentDart = 1;
    cricketState.currentPlayerIdx += 1;
    
    // Fin de la manche globale
    if (cricketState.currentPlayerIdx >= cricketState.players.length) {
      cricketState.currentPlayerIdx = 0;
      cricketState.currentTurn += 1;
    }
  }

  resetModifierUI();
  renderGrid();
  updateTurnHeader();
  verifierConditionsFinMatch();
}

// Action Annuler / Retour
document.getElementById("btnKeyUndo").onclick = () => {
  if (cricketState.history.length === 0) return showPopup("Aucun coup à effacer.");
  
  const precedentState = cricketState.history.pop();
  cricketState.scores = precedentState.scores;
  cricketState.marks = precedentState.marks;
  cricketState.revealedTargets = precedentState.revealedTargets;
  cricketState.currentPlayerIdx = precedentState.currentPlayerIdx;
  cricketState.currentDart = precedentState.currentDart;
  cricketState.currentTurn = precedentState.currentTurn;

  resetModifierUI();
  renderGrid();
  updateTurnHeader();
  showPopup("Coup effacé !");
};

// Vérification des deux critères d'arrêt obligatoires
function verifierConditionsFinMatch() {
  let gagnant = null;

  // Critère 1 : Fermeture complète + Leader du score (le plus proche de 0 ou supérieur en négatif)
  for (let p of cricketState.players) {
    let aToutFerme = cricketState.targets.every(t => cricketState.marks[p.id][t] >= 3);
    if (aToutFerme) {
      let scoreCourant = cricketState.scores[p.id];
      // En Cut-Throat, le meilleur score est le score le plus ÉLEVÉ (donc le moins négatif, ex: 0 ou -20 est meilleur que -100)
      let estLeader = cricketState.players.every(autre => scoreCourant >= cricketState.scores[autre.id]);
      
      if (estLeader) {
        gagnant = p;
        break;
      }
    }
  }

  // Critère 2 : Nombre maximal de tours atteint
  if (!gagnant && cricketState.currentTurn > cricketState.maxTurns && cricketState.maxTurns !== 999) {
    // Le match s'arrête, le joueur avec le score le plus élevé (le moins négatif) l'emporte
    let meilleurScore = -Infinity;
    cricketState.players.forEach(p => {
      if (cricketState.scores[p.id] > meilleurScore) {
        meilleurScore = cricketState.scores[p.id];
        gagnant = p;
      }
    });
  }

  if (gagnant) {
    clearInterval(cricketState.timerInterval);
    alert(`🏆 FIN DE PARTIE ! Victoire de ${gagnant.name.toUpperCase()} avec un score de ${cricketState.scores[gagnant.id]} points !`);
    
    // Sauvegarde en base historique cloud
    db.collection("games_history").add({
      type: "cricket",
      winner: gagnant.name,
      durationSeconds: cricketState.elapsedTime,
      blindMode: cricketState.isBlind,
      turnsPlayed: Math.min(cricketState.currentTurn, cricketState.maxTurns),
      createdAt: Date.now()
    }).catch(e => console.error(e));

    showScreen(screens.home);
  }
}

// Quitter la partie
document.getElementById("btnLeaveGame").addEventListener("click", () => {
  if (confirm("Abandonner la partie et retourner à l'accueil ?")) {
    clearInterval(cricketState.timerInterval);
    showScreen(screens.home);
  }
});