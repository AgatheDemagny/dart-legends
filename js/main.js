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
  maxTurns: 20,       
  isBlind: false,     
  targets: [],        // Ordre d'affichage demandé : 15, 16, 17, 18, 19, 20, 25
  blindMap: {},       
  revealedTargets: [],
  scores: {},         
  marks: {},          
  history: [],        
  currentTurnDartsText: [], // Stocke les chaînes de caractères des 3 lancers (ex: ["0", "T15"])
  
  currentPlayerIdx: 0,
  currentDart: 1,     // Fléchette 1, 2 ou 3
  currentTurn: 1,
  
  startTime: 0,
  elapsedTime: 0,
  timerInterval: null,
  isPaused: false
};

let modificateurEnCours = 1;

// Modificateurs tactiles avec vérification pour la Bulle
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

  cricketState.players = [...joueursSelectionnesMatch];
  cricketState.maxTurns = parseInt(document.getElementById("gameTurnsSelect").value, 10);
  cricketState.isBlind = document.getElementById("blindModeCheckbox").checked;
  
  // ✅ Ordre demandé pour les colonnes du tableau : 15 à 20 puis Bulle
  cricketState.targets = [15, 16, 17, 18, 19, 20, 25];
  cricketState.revealedTargets = cricketState.isBlind ? [] : [...cricketState.targets];
  cricketState.history = [];
  cricketState.currentTurnDartsText = [];
  
  cricketState.currentPlayerIdx = 0;
  cricketState.currentDart = 1;
  cricketState.currentTurn = 1;
  cricketState.scores = {};
  cricketState.marks = {};

  if (cricketState.isBlind) {
    let valeursReelles = [15, 16, 17, 18, 19, 20, 25];
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
    cricketState.marks[p.id] = { 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 25: 0 };
  });

  resetModifierUI();
  showScreen(screens.cricket);
  
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
    cricketState.startTime = Date.now() - (cricketState.elapsedTime * 1000);
  }
});

// En-tête Tour, Nom et affichage textuel des lancers (ex: 0 / T15 / D20)
function updateTurnHeader() {
  const p = cricketState.players[cricketState.currentPlayerIdx];
  document.getElementById("cricketCurrentPlayerName").innerText = p.name;
  
  // Génération de la ligne d'historique textuelle demandée
  const chaineLancers = cricketState.currentTurnDartsText.join(" / ");
  document.getElementById("dartsHistoryText").innerText = chaineLancers || "En attente...";

  const tText = cricketState.maxTurns === 999 ? "∞" : cricketState.maxTurns;
  document.getElementById("gameTurnIndicator").innerText = `Tour ${cricketState.currentTurn}/${tText}`;
}

// ✅ RENDU DU GRAND TABLEAU HORIZONTAL PROPRE ET TEXTURÉ
function renderGrid() {
  const table = document.getElementById("cricketGridTable");
  table.innerHTML = "";

  // 1. Ligne d'en-tête
  const headerRow = document.createElement("tr");
  headerRow.style.background = "rgba(255,255,255,0.02)";
  
  let headerHtml = `<th style="text-align:left; padding: 10px 6px; border-bottom: 2px solid var(--divider); width: 25%;">Joueurs</th>`;
  cricketState.targets.forEach(t => {
    let libelle = t === 25 ? "B" : t;
    if (cricketState.isBlind && !cricketState.revealedTargets.includes(t)) {
      libelle = "❓";
    }
    headerHtml += `<th style="font-weight:bold; padding: 10px 4px; border-bottom: 2px solid var(--divider); border-left: 1px solid var(--divider);">${libelle}</th>`;
  });
  headerHtml += `<th style="padding: 10px 6px; border-bottom: 2px solid var(--divider); border-left: 1px solid var(--divider); color: var(--accent); width: 18%;">Score</th>`;
  headerRow.innerHTML = headerHtml;
  table.appendChild(headerRow);

  // 2. Lignes des joueurs
  cricketState.players.forEach(p => {
    const row = document.createElement("tr");
    row.style.borderBottom = "1px solid var(--divider)";
    
    // Highlight du joueur actif
    if(p.id === cricketState.players[cricketState.currentPlayerIdx].id) {
      row.style.backgroundColor = "rgba(192,101,42,0.15)";
    }

    let cellsHtml = `<td style="text-align:left; padding: 12px 6px; font-weight:700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${p.name}</td>`;
    
    cricketState.targets.forEach(t => {
      const touches = cricketState.marks[p.id][t];
      let symbole = ""; // Vide si pas touché

      // Style demandé : \ puis X puis X dans un cercle rouge gras
      if (touches === 1) {
        symbole = `<span style="font-size: 18px; font-weight:900; color:var(--text-main); font-family: monospace;">\\</span>`;
      } else if (touches === 2) {
        symbole = `<span style="font-size: 18px; font-weight:900; color:var(--text-main); font-family: monospace;">X</span>`;
      } else if (touches >= 3) {
        symbole = `<span style="display:inline-block; border: 2.5px solid #ff3838; border-radius: 50%; width: 26px; height: 26px; line-height: 21px; font-weight: 900; color: #ff3838; text-align:center; font-family: monospace; font-size: 15px; background: rgba(255,56,56,0.05);">X</span>`;
      }

      cellsHtml += `<td style="padding: 6px 2px; border-left: 1px solid var(--divider);">${symbole}</td>`;
    });

    cellsHtml += `<td style="font-weight:800; padding: 12px 4px; border-left: 1px solid var(--divider); color: var(--primary-strong); font-size: 15px;">${cricketState.scores[p.id]}</td>`;
    row.innerHTML = cellsHtml;
    table.appendChild(row);
  });
}

// Rendu du Clavier Tactile (Boutons horizontaux plus larges)
function renderKeyboard() {
  const container = document.getElementById("cricketKeysContainer");
  container.innerHTML = "";

  // Affichage ordonné de 15 à 20
  const boutonsAAfficher = [15, 16, 17, 18, 19, 20];

  boutonsAAfficher.forEach(num => {
    const btn = document.createElement("button");
    btn.className = "ghost";
    btn.style.padding = "14px 10px";
    btn.style.fontSize = "16px";
    btn.innerText = num;
    btn.onclick = () => taperChiffre(num);
    container.appendChild(btn);
  });
}

// Actions sur boutons fixes du bas
document.getElementById("btnKeyZero").onclick = () => taperChiffre(0);

// ✅ SÉCURITÉ ANTI-TRIPLE BULL AU CLIC
document.getElementById("btnKeyBull").onclick = () => {
  if (modificateurEnCours === 3) {
    showPopup("🚫 Le Triple Bull n'existe pas aux fléchettes !");
    return;
  }
  taperChiffre(25);
};

// Enregistrement d'un tir
function taperChiffre(valeurBouton) {
  if (cricketState.isPaused) return;

  const joueurActuel = cricketState.players[cricketState.currentPlayerIdx];
  
  // Sauvegarde pour action annuler
  cricketState.history.push({
    scores: JSON.parse(JSON.stringify(cricketState.scores)),
    marks: JSON.parse(JSON.stringify(cricketState.marks)),
    revealedTargets: [...cricketState.revealedTargets],
    currentTurnDartsText: [...cricketState.currentTurnDartsText],
    currentPlayerIdx: cricketState.currentPlayerIdx,
    currentDart: cricketState.currentDart,
    currentTurn: cricketState.currentTurn
  });

  // Construction du libellé textuel demandé (ex: T15, D20, 0)
  let prefixeText = "";
  if (modificateurEnCours === 2) prefixeText = "D";
  if (modificateurEnCours === 3) prefixeText = "T";
  
  if (valeurBouton === 0) {
    cricketState.currentTurnDartsText.push("0");
  } else if (valeurBouton === 25) {
    cricketState.currentTurnDartsText.push(prefixeText + "Bull");
  } else {
    cricketState.currentTurnDartsText.push(prefixeText + valeurBouton);
  }

  // Traitement mathématique du score
  if (valeurBouton !== 0) {
    let cibleReelle = valeurBouton;
    
    if (cricketState.isBlind) {
      cibleReelle = cricketState.blindMap[valeurBouton];
      if (!cricketState.revealedTargets.includes(valeurBouton)) {
        cricketState.revealedTargets.push(valeurBouton);
        showPopup(`🎯 Zone découverte ! Bouton ${valeurBouton} = ${cibleReelle === 25 ? 'Bull' : cibleReelle}`);
      }
    }

    let touchesPrecedentes = cricketState.marks[joueurActuel.id][cibleReelle];
    let touchesRestantes = 3 - touchesPrecedentes;

    let touchesAppliquees = Math.min(modificateurEnCours, touchesRestantes);
    cricketState.marks[joueurActuel.id][cibleReelle] += touchesAppliquees;

    let surplus = modificateurEnCours - touchesAppliquees;

    // Règle Cut-Throat
    if (surplus > 0) {
      cricketState.players.forEach(adversaire => {
        if (adversaire.id !== joueurActuel.id) {
          const advFerme = cricketState.marks[adversaire.id][cibleReelle] >= 3;
          if (!advFerme) {
            cricketState.scores[adversaire.id] -= (cibleReelle * surplus);
          }
        }
      });
    }
  }

  // Rotation des lancers (3 fléchettes par joueur)
  cricketState.currentDart += 1;
  if (cricketState.currentDart > 3) {
    cricketState.currentDart = 1;
    cricketState.currentPlayerIdx += 1;
    
    // Fin de manche : on vide l'historique textuel du joueur qui vient de finir
    cricketState.currentTurnDartsText = [];
    
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

// Action Annuler / Effacer le coup précédent
document.getElementById("btnKeyUndo").onclick = () => {
  if (cricketState.history.length === 0) return showPopup("Aucun coup à effacer.");
  
  const precedentState = cricketState.history.pop();
  cricketState.scores = precedentState.scores;
  cricketState.marks = precedentState.marks;
  cricketState.revealedTargets = precedentState.revealedTargets;
  cricketState.currentTurnDartsText = precedentState.currentTurnDartsText;
  cricketState.currentPlayerIdx = precedentState.currentPlayerIdx;
  cricketState.currentDart = precedentState.currentDart;
  cricketState.currentTurn = precedentState.currentTurn;

  resetModifierUI();
  renderGrid();
  updateTurnHeader();
  showPopup("Dernier lancer annulé !");
};

function verifierConditionsFinMatch() {
  let gagnant = null;

  // Victoire par fermeture complète + Score leader (le plus proche de zéro ou positif)
  for (let p of cricketState.players) {
    let aToutFerme = cricketState.targets.every(t => cricketState.marks[p.id][t] >= 3);
    if (aToutFerme) {
      let scoreCourant = cricketState.scores[p.id];
      let estLeader = cricketState.players.every(autre => scoreCourant >= cricketState.scores[autre.id]);
      
      if (estLeader) {
        gagnant = p;
        break;
      }
    }
  }

  // Fin par limite de tours
  if (!gagnant && cricketState.currentTurn > cricketState.maxTurns && cricketState.maxTurns !== 999) {
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
    alert(`🏆 MATCH TERMINÉ !\nVictoire de ${gagnant.name.toUpperCase()} avec ${cricketState.scores[gagnant.id]} points !`);
    
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

document.getElementById("btnLeaveGame").addEventListener("click", () => {
  if (confirm("Abandonner le match en cours ?")) {
    clearInterval(cricketState.timerInterval);
    showScreen(screens.home);
  }
});