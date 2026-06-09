// ================== INITIALISATION & VUES ==================
const screens = {
  loading: document.getElementById("loadingScreen"),
  login: document.getElementById("loginScreen"),
  home: document.getElementById("homeScreen"),
  newGame: document.getElementById("newGameScreen"),
  account: document.getElementById("accountScreen"),
  cricket: document.getElementById("cricketScreen"),
  gameOver: document.getElementById("gameOverScreen"),
  matchStats: document.getElementById("statsMatchScreen")
};

function showScreen(activeScreen) {
  Object.values(screens).forEach(s => {
    if(s) s.classList.add("hidden");
  });
  if(activeScreen) activeScreen.classList.remove("hidden");
}

function showPopup(text) {
  const popup = document.getElementById("popup");
  popup.innerText = text;
  popup.style.display = "block";
  clearTimeout(window.popupTimeout);
  window.popupTimeout = setTimeout(() => { popup.style.display = "none"; }, 2500);
}

// Navigation de base
document.getElementById("menuNewGame").addEventListener("click", () => {
  showScreen(screens.newGame);
  initPageNouvellePartie();
});
document.getElementById("backHomeBtn").addEventListener("click", () => showScreen(screens.home));

// Navigation vers la page Mon Compte
document.getElementById("menuAccount").addEventListener("click", () => {
  showScreen(screens.account);
  chargerInfosProfil();
});
document.getElementById("backHomeFromAccountBtn").addEventListener("click", () => showScreen(screens.home));

// Autres menus indisponibles
["menuPlayers", "menuHistory", "menuRanking", "menuTraining", "menuTournament"].forEach(id => {
  document.getElementById(id).addEventListener("click", () => { showPopup("Arrive dans la prochaine mise à jour !"); });
});

document.getElementById("btnKeyZero").onclick = () => taperChiffre(0);

// ================== CONFIGURATION FIREBASE ==================
const auth = firebase.auth();
const db = firebase.firestore();

auth.onAuthStateChanged(async (user) => {
  if (user) {
    try {
      const doc = await db.collection("players").doc(user.uid).get();
      if (doc.exists && doc.data().name) {
        document.getElementById("playerNameDisplay").innerText = doc.data().name;
        showScreen(screens.home);
      } else {
        showScreen(screens.home);
        document.getElementById("playerNameDisplay").innerText = user.email.split('@')[0];
      }
    } catch(e) {
      document.getElementById("playerNameDisplay").innerText = user.email.split('@')[0];
      showScreen(screens.home);
    }
  } else {
    showScreen(screens.login);
  }
  if (screens.loading) screens.loading.classList.add("hidden");
});

// Inscription
document.getElementById("btnSignup").addEventListener("click", async () => {
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value.trim();
  if (!email || !password) return showPopup("Champs obligatoires.");
  try {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    const defaultName = email.split('@')[0];
    await db.collection("players").doc(cred.user.uid).set({
      email: email, name: defaultName, createdAt: Date.now()
    });
    showPopup("Compte joueur enregistré !");
  } catch (e) { showPopup(e.message); }
});

// Connexion
document.getElementById("btnLogin").addEventListener("click", async () => {
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value.trim();
  if (!email || !password) return showPopup("Champs obligatoires.");
  try { 
    await auth.signInWithEmailAndPassword(email, password); 
  } catch (e) { showPopup(e.message); }
});

// Déconnexion
document.getElementById("btnLogout").addEventListener("click", () => { 
  auth.signOut(); 
});

// ================== LOGIQUE DE L'ÉCRAN MON COMPTE ==================
async function chargerInfosProfil() {
  const user = auth.currentUser;
  if (!user) return;
  
  document.getElementById("accountProfileEmail").innerText = user.email;
  document.getElementById("accountProfileName").value = "";

  try {
    const doc = await db.collection("players").doc(user.uid).get();
    if(doc.exists && doc.data().name) {
      document.getElementById("accountProfileName").value = doc.data().name;
    } else {
      document.getElementById("accountProfileName").value = user.email.split('@')[0];
    }
  } catch(e) {
    console.error(e);
  }
}

document.getElementById("btnUpdateProfileName").addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return;

  const nouveauPseudo = document.getElementById("accountProfileName").value.trim();
  if(!nouveauPseudo) return showPopup("Le pseudo ne peut pas être vide.");

  try {
    await db.collection("players").doc(user.uid).update({
      name: nouveauPseudo
    });
    document.getElementById("playerNameDisplay").innerText = nouveauPseudo;
    showPopup("Pseudo mis à jour !");
  } catch(e) {
    showPopup("Erreur lors de la mise à jour : " + e.message);
  }
});

// ================== LOGIQUE NOUVELLE PARTIE ==================
let tousLesJoueursBase = [];
let joueursSelectionnesMatch = [];

async function initPageNouvellePartie() {
  joueursSelectionnesMatch = [];
  const user = auth.currentUser;
  if (user) {
    try {
      const doc = await db.collection("players").doc(user.uid).get();
      const currentName = (doc.exists && doc.data().name) ? doc.data().name : user.email.split('@')[0];
      joueursSelectionnesMatch.push({ id: user.uid, name: currentName });
    } catch(e) {
      joueursSelectionnesMatch.push({ id: user.uid, name: user.email.split('@')[0] });
    }
  }
  renderSelectedPlayers();
  chargerTousLesJoueurs();
}

document.getElementById("btnOpenSearchPlayer").addEventListener("click", () => {
  const zoneSearch = document.getElementById("zoneSearchPlayer");
  zoneSearch.classList.toggle("hidden");
  document.getElementById("zoneCreatePlayer").classList.add("hidden");
  if (!zoneSearch.classList.contains("hidden")) {
    filtrerEtAfficherJoueurs(""); 
    document.getElementById("searchPlayerInput").focus();
  }
});
document.getElementById("btnOpenCreatePlayer").addEventListener("click", () => {
  document.getElementById("zoneCreatePlayer").classList.toggle("hidden");
  document.getElementById("zoneSearchPlayer").classList.add("hidden");
});

async function chargerTousLesJoueurs() {
  tousLesJoueursBase = [];
  try {
    const snap = await db.collection("players").get();
    snap.forEach(doc => {
      tousLesJoueursBase.push({ id: doc.id, ...doc.data() });
    });
  } catch(e) { console.error(e); }
}

function filtrerEtAfficherJoueurs(query) {
  const resultContainer = document.getElementById("searchResultsList");
  resultContainer.innerHTML = "";

  const filtres = tousLesJoueursBase.filter(p => {
    const correspondNom = p.name.toLowerCase().includes(query.toLowerCase().trim());
    const pasDejaSelectionne = !joueursSelectionnesMatch.some(sel => sel.id === p.id);
    return correspondNom && pasDejaSelectionne;
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

document.getElementById("searchPlayerInput").addEventListener("input", (e) => {
  filtrerEtAfficherJoueurs(e.target.value);
});

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
  players: [], maxTurns: 20, isBlind: false, targets: [], blindMap: {}, revealedTargets: [],
  scores: {}, marks: {}, history: [], currentTurnDartsText: [], statsDetails: {},
  currentPlayerIdx: 0, currentDart: 1, currentTurn: 1, startTime: 0, elapsedTime: 0,
  timerInterval: null, isPaused: false
};

let modificateurEnCours = 1;

document.getElementById("btnModDouble").addEventListener("click", () => {
  alternerModificateur(2, document.getElementById("btnModDouble"));
});
document.getElementById("btnModTriple").addEventListener("click", () => {
  alternerModificateur(3, document.getElementById("btnModTriple"));
});

function alternerModificateur(valeur, boutonClique) {
  const etaitDejaActif = boutonClique.classList.contains("active");
  document.getElementById("btnModDouble").classList.remove("active");
  document.getElementById("btnModTriple").classList.remove("active");
  if (etaitDejaActif) { 
    modificateurEnCours = 1; 
  } else { 
    boutonClique.classList.add("active"); 
    modificateurEnCours = valeur; 
  }
  gererEtatBoutonBull();
}

function resetModifierUI() {
  modificateurEnCours = 1;
  document.getElementById("btnModDouble").classList.remove("active");
  document.getElementById("btnModTriple").classList.remove("active");
  gererEtatBoutonBull();
}

function gererEtatBoutonBull() {
  const btnBull = document.getElementById("btnKeyBull");
  if (!btnBull) return; 
  if (modificateurEnCours === 3) {
    btnBull.disabled = true; btnBull.style.opacity = "0.2"; btnBull.style.background = "rgba(255,255,255,0.01)"; btnBull.innerText = "🚫";
  } else {
    btnBull.disabled = false; btnBull.style.opacity = "1"; btnBull.style.background = "rgba(255,255,255,0.06)"; btnBull.innerText = "🎯 B";
  }
}

document.getElementById("startGameBtn").addEventListener("click", () => {
  if (joueursSelectionnesMatch.length < 2) {
    return showPopup("⚠️ Il faut au moins 2 joueurs sur la ligne de tir pour démarrer !");
  }
  demarrerMatchCricket(joueursSelectionnesMatch);
});

function demarrerMatchCricket(listeJoueurs) {
  // Mélange des joueurs
  let joueursMelanges = [...listeJoueurs];
  for (let i = joueursMelanges.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [joueursMelanges[i], joueursMelanges[j]] = [joueursMelanges[j], joueursMelanges[i]];
  }
  cricketState.players = joueursMelanges;

  cricketState.maxTurns = parseInt(document.getElementById("gameTurnsSelect").value, 10);
  cricketState.isBlind = document.getElementById("blindModeCheckbox").checked;
  
  cricketState.history = []; 
  cricketState.currentTurnDartsText = [];
  cricketState.currentPlayerIdx = 0; 
  cricketState.currentDart = 1; 
  cricketState.currentTurn = 1;
  cricketState.scores = {}; 
  cricketState.marks = {}; 
  cricketState.statsDetails = {};

  if (cricketState.isBlind) {
    // 1. Générer TOUTES les cibles possibles d'une cible de fléchettes (1 à 20 + 25)
    let toutesLesCiblesPossibles = [];
    for (let i = 1; i <= 20; i++) toutesLesCiblesPossibles.push(i);
    toutesLesCiblesPossibles.push(25); // Bull

    // 2. Sélectionner 7 cibles aléatoires parmi les 21 existantes
    let ciblesMysteres = [];
    while (ciblesMysteres.length < 7) {
      let indexAlea = Math.floor(Math.random() * toutesLesCiblesPossibles.length);
      let cibleChoisie = toutesLesCiblesPossibles.splice(indexAlea, 1)[0];
      ciblesMysteres.push(cibleChoisie);
    }

    // On trie les cibles sélectionnées pour avoir un tableau propre (ex: 3, 7, 15, 18...)
    ciblesMysteres.sort((a, b) => a - b);
    
    cricketState.targets = ciblesMysteres;
    cricketState.revealedTargets = []; // Aucune n'est découverte au début
  } else {
    // Cricket Standard
    cricketState.targets = [15, 16, 17, 18, 19, 20, 25];
    cricketState.revealedTargets = [...cricketState.targets];
  }

  // Initialisation des structures pour chaque joueur en fonction des targets choisies
  cricketState.players.forEach(p => {
    cricketState.scores[p.id] = 0;
    cricketState.marks[p.id] = {};
    cricketState.statsDetails[p.id] = { dartsThrown: 0, touchesNum: {}, pointsGiv: {} };
    
    cricketState.targets.forEach(t => {
      cricketState.marks[p.id][t] = 0;
      cricketState.statsDetails[p.id].touchesNum[t] = 0;
      cricketState.statsDetails[p.id].pointsGiv[t] = 0;
    });
  });

  showScreen(screens.cricket);
  cricketState.startTime = Date.now(); 
  cricketState.elapsedTime = 0; 
  cricketState.isPaused = false;
  document.getElementById("btnPauseGame").innerText = "⏸️";
  clearInterval(cricketState.timerInterval);
  cricketState.timerInterval = setInterval(updateTimer, 1000);

  renderKeyboard(); 
  resetModifierUI(); 
  renderGrid(); 
  updateTurnHeader();
}

function updateTimer() {
  if (cricketState.isPaused) return;
  cricketState.elapsedTime = Math.floor((Date.now() - cricketState.startTime) / 1000);
  const m = String(Math.floor(cricketState.elapsedTime / 60)).padStart(2, "0");
  const s = String(cricketState.elapsedTime % 60).padStart(2, "0");
  document.getElementById("gameTimerDisplay").innerText = `${m}:${s}`;
}

document.getElementById("btnPauseGame").addEventListener("click", () => {
  cricketState.isPaused = !cricketState.isPaused;
  if (cricketState.isPaused) {
    document.getElementById("btnPauseGame").innerText = "▶️";
    document.getElementById("cricketKeyboardZone").style.pointerEvents = "none";
    document.getElementById("cricketKeyboardZone").style.opacity = "0.4";
  } else {
    document.getElementById("btnPauseGame").innerText = "⏸️";
    document.getElementById("cricketKeyboardZone").style.pointerEvents = "auto";
    document.getElementById("cricketKeyboardZone").style.opacity = "1";
    cricketState.startTime = Date.now() - (cricketState.elapsedTime * 1000);
  }
});

function updateTurnHeader() {
  const p = cricketState.players[cricketState.currentPlayerIdx];
  document.getElementById("cricketCurrentPlayerName").innerText = p.name;
  const chaineLancers = cricketState.currentTurnDartsText.join(" / ");
  document.getElementById("dartsHistoryText").innerText = chaineLancers || "En attente...";
  const tText = cricketState.maxTurns === 999 ? "∞" : cricketState.maxTurns;
  document.getElementById("gameTurnIndicator").innerText = `Tour ${cricketState.currentTurn}/${tText}`;
}

function renderGrid() {
  const table = document.getElementById("cricketGridTable");
  table.innerHTML = "";
  const headerRow = document.createElement("tr");
  headerRow.style.background = "rgba(255,255,255,0.02)";
  let headerHtml = `<th style="text-align:left; padding: 10px 4px; border-bottom: 2px solid var(--divider); width: 23%;">Joueurs</th>`;
  cricketState.targets.forEach(t => {
    let libelle = t === 25 ? "B" : t;
    if (cricketState.isBlind && !cricketState.revealedTargets.includes(t)) libelle = "❓";
    headerHtml += `<th style="font-weight:bold; padding: 10px 2px; border-bottom: 2px solid var(--divider); border-left: 1px solid var(--divider); width: 11%;">${libelle}</th>`;
  });
  headerHtml += `<th style="padding: 10px 4px; border-bottom: 2px solid var(--divider); border-left: 1px solid var(--divider); color: var(--accent); width: 12%;">Score</th>`;
  headerRow.innerHTML = headerHtml;
  table.appendChild(headerRow);

  cricketState.players.forEach(p => {
    const row = document.createElement("tr");
    row.style.borderBottom = "1px solid var(--divider)";
    if(p.id === cricketState.players[cricketState.currentPlayerIdx].id) {
      row.style.backgroundColor = "rgba(192,101,42,0.15)";
    }
    let nomTronque = p.name.length > 8 ? p.name.substring(0, 8) + "." : p.name;
    let cellsHtml = `<td style="text-align:left; padding: 12px 4px; font-weight:700; width: 23%;">${nomTronque}</td>`;
    
    cricketState.targets.forEach(t => {
      const touches = cricketState.marks[p.id][t];
      let symbole = ""; 
      if (touches === 1) symbole = `<span style="font-size: 18px; font-weight:900; color:var(--text-main); font-family: monospace;">\\</span>`;
      else if (touches === 2) symbole = `<span style="font-size: 18px; font-weight:900; color:var(--text-main); font-family: monospace;">X</span>`;
      else if (touches >= 3) {
        symbole = `<span style="display:inline-block; border: 2px solid #ff3838; border-radius: 50%; width: 22px; height: 22px; line-height: 18px; font-weight: 900; color: #ff3838; text-align:center; font-family: monospace; font-size: 13px; background: rgba(255,56,56,0.05);">X</span>`;
      }
      cellsHtml += `<td style="padding: 6px 2px; border-left: 1px solid var(--divider); width: 11%;">${symbole}</td>`;
    });
    cellsHtml += `<td style="font-weight:800; padding: 12px 2px; border-left: 1px solid var(--divider); color: var(--primary-strong); font-size: 14px; width: 12%;">${cricketState.scores[p.id]}</td>`;
    row.innerHTML = cellsHtml;
    table.appendChild(row);
  });
}

// ================== GESTION DYNAMIQUE DES CLAVIERS CRICKET ==================
function renderKeyboard() {
  const container = document.getElementById("cricketDynamicRows");
  if (!container) return;
  container.innerHTML = "";

  // Si on est en mode aveugle, on doit pouvoir saisir de 1 à 20 et Bull
  if (cricketState.isBlind) {
    // Ligne 1 : 1 à 7
    const row1 = document.createElement("div");
    row1.style.display = "grid"; row1.style.gridTemplateColumns = "repeat(7, 1fr)"; row1.style.gap = "5px";
    for (let i = 1; i <= 7; i++) row1.appendChild(creerBoutonClavier(i, i));
    container.appendChild(row1);

    // Ligne 2 : 8 à 14
    const row2 = document.createElement("div");
    row2.style.display = "grid"; row2.style.gridTemplateColumns = "repeat(7, 1fr)"; row2.style.gap = "5px";
    for (let i = 8; i <= 14; i++) row2.appendChild(creerBoutonClavier(i, i));
    container.appendChild(row2);

    // Ligne 3 : 15 à 20 + Bull
    const row3 = document.createElement("div");
    row3.style.display = "grid"; row3.style.gridTemplateColumns = "repeat(6, 1fr) 1.2fr"; row3.style.gap = "5px";
    for (let i = 15; i <= 20; i++) row3.appendChild(creerBoutonClavier(i, i));
    row3.appendChild(creerBoutonClavier("🎯 B", 25));
    container.appendChild(row3);
  } else {
    // Clavier Standard Cricket : 15 à 20 + Bull
    const rowClassique = document.createElement("div");
    rowClassique.style.display = "grid"; rowClassique.style.gridTemplateColumns = "repeat(6, 1fr) 1.2fr"; rowClassique.style.gap = "5px";
    [15, 16, 17, 18, 19, 20].forEach(num => { rowClassique.appendChild(creerBoutonClavier(num, num)); });
    rowClassique.appendChild(creerBoutonClavier("🎯 B", 25));
    container.appendChild(rowClassique);
  }
}

function creerBoutonClavier(libelle, valeur) {
  const btn = document.createElement("button");
  btn.className = "ghost"; btn.style.padding = "14px 2px"; btn.style.fontSize = "14px"; btn.style.fontWeight = "bold";
  btn.innerText = libelle; btn.onclick = () => taperChiffre(valeur);
  return btn;
}

function taperChiffre(valeurBouton) {
  if (cricketState.isPaused) return;
  const joueurActuel = cricketState.players[cricketState.currentPlayerIdx];
  
  cricketState.history.push({
    scores: JSON.parse(JSON.stringify(cricketState.scores)),
    marks: JSON.parse(JSON.stringify(cricketState.marks)),
    revealedTargets: [...cricketState.revealedTargets],
    currentTurnDartsText: [...cricketState.currentTurnDartsText],
    statsDetails: JSON.parse(JSON.stringify(cricketState.statsDetails)),
    currentPlayerIdx: cricketState.currentPlayerIdx,
    currentDart: cricketState.currentDart,
    currentTurn: cricketState.currentTurn
  });

  let prefixeText = modificateurEnCours === 2 ? "D" : modificateurEnCours === 3 ? "T" : "";
  if (valeurBouton === 0) { 
    cricketState.currentTurnDartsText.push("0"); 
  } else if (valeurBouton === 25) { 
    cricketState.currentTurnDartsText.push(prefixeText + "Bull"); 
  } else { 
    cricketState.currentTurnDartsText.push(prefixeText + valeurBouton); 
  }

  cricketState.statsDetails[joueurActuel.id].dartsThrown += 1;

  if (valeurBouton !== 0) {
    // Si la valeur saisie fait partie des 7 cibles sélectionnées par l'application
    if (cricketState.targets.includes(valeurBouton)) {
      
      // Si elle n'était pas encore révélée, on la découvre !
      if (!cricketState.revealedTargets.includes(valeurBouton)) {
        cricketState.revealedTargets.push(valeurBouton);
        showPopup(`🎉 Zone Mystère découverte : ${valeurBouton === 25 ? 'Bull' : valeurBouton} !`);
      }

      // Application des points et marques sur cette cible
      cricketState.statsDetails[joueurActuel.id].touchesNum[valeurBouton] += modificateurEnCours;

      let touchesPrecedentes = cricketState.marks[joueurActuel.id][valeurBouton];
      let touchesRestantes = 3 - touchesPrecedentes;
      let touchesAppliquees = Math.min(modificateurEnCours, touchesRestantes);
      cricketState.marks[joueurActuel.id][valeurBouton] += touchesAppliquees;

      let surplus = modificateurEnCours - touchesAppliquees;
      if (surplus > 0) {
        cricketState.players.forEach(adversaire => {
          if (adversaire.id !== joueurActuel.id) {
            const advFerme = cricketState.marks[adversaire.id][valeurBouton] >= 3;
            if (!advFerme) {
              let penalite = valeurBouton * surplus;
              cricketState.scores[adversaire.id] -= penalite;
              cricketState.statsDetails[joueurActuel.id].pointsGiv[valeurBouton] += penalite;
            }
          }
        });
      }
    } else {
      // Le chiffre tapé n'est PAS dans les 7 chiffres secrets : Équivalent à un coup dans le vide (0)
      if(cricketState.isBlind) {
        showPopup("💨 Manqué... Ce chiffre ne fait pas partie du mystère !");
      }
    }
  }

  // Passage à la fléchette suivante
  cricketState.currentDart += 1;
  if (cricketState.currentDart > 3) {
    cricketState.currentDart = 1; 
    cricketState.currentPlayerIdx += 1; 
    cricketState.currentTurnDartsText = [];
    if (cricketState.currentPlayerIdx >= cricketState.players.length) {
      cricketState.currentPlayerIdx = 0; 
      cricketState.currentTurn += 1;
    }
  }

  resetModifierUI(); 
  renderKeyboard(); 
  renderGrid(); 
  updateTurnHeader(); 
  verifierConditionsFinMatch();
}

document.getElementById("btnKeyUndo").onclick = () => { annulerDernierCoup(); };

function annulerDernierCoup() {
  if (cricketState.history.length === 0) return showPopup("Aucun coup à effacer.");
  const precedentState = cricketState.history.pop();
  cricketState.scores = precedentState.scores; cricketState.marks = precedentState.marks;
  cricketState.revealedTargets = precedentState.revealedTargets; cricketState.currentTurnDartsText = precedentState.currentTurnDartsText;
  cricketState.statsDetails = precedentState.statsDetails; cricketState.currentPlayerIdx = precedentState.currentPlayerIdx;
  cricketState.currentDart = precedentState.currentDart; cricketState.currentTurn = precedentState.currentTurn;
  resetModifierUI(); renderKeyboard(); renderGrid(); updateTurnHeader();
}

function verifierConditionsFinMatch() {
  let gagnantVirtuel = null;
  for (let p of cricketState.players) {
    let aToutFerme = cricketState.targets.every(t => cricketState.marks[p.id][t] >= 3);
    if (aToutFerme) {
      let scoreCourant = cricketState.scores[p.id];
      let estLeader = cricketState.players.every(autre => scoreCourant >= cricketState.scores[autre.id]);
      if (estLeader) { gagnantVirtuel = p; break; }
    }
  }
  if (!gagnantVirtuel && cricketState.currentTurn > cricketState.maxTurns && cricketState.maxTurns !== 999) {
    let meilleurScore = -Infinity;
    cricketState.players.forEach(p => {
      if (cricketState.scores[p.id] > meilleurScore) { meilleurScore = cricketState.scores[p.id]; gagnantVirtuel = p; }
    });
  }
  if (gagnantVirtuel) {
    clearInterval(cricketState.timerInterval);
    setTimeout(() => {
      const confirmation = confirm(`🎯 ${gagnantVirtuel.name} a-t-il vraiment gagné la partie ?`);
      if (confirmation) { lancerPageVictoire(gagnantVirtuel); } 
      else { annulerDernierCoup(); cricketState.timerInterval = setInterval(updateTimer, 1000); }
    }, 100);
  }
}

function lancerPageVictoire(vainqueur) {
  document.getElementById("victoryTitle").innerText = `${vainqueur.name} gagne la partie !`;
  document.getElementById("victorySubtitle").innerText = `Match bouclé en ${document.getElementById("gameTimerDisplay").innerText}`;
  const classementTrie = [...cricketState.players].sort((a, b) => cricketState.scores[b.id] - cricketState.scores[a.id]);
  const containerRanking = document.getElementById("finalRankingList");
  containerRanking.innerHTML = "";

  classementTrie.forEach((p, idx) => {
    const row = document.createElement("div"); row.className = "stat-row"; row.style.padding = "10px";
    row.style.background = idx === 0 ? "rgba(192,101,42,0.15)" : "rgba(255,255,255,0.02)";
    row.style.borderRadius = "12px";
    row.innerHTML = `<span><strong>#${idx + 1}</strong> — 👤 ${p.name}</span><span style="color:var(--primary-strong); font-weight:800;">${cricketState.scores[p.id]} pts</span>`;
    containerRanking.appendChild(row);
  });

  db.collection("games_history").add({
    type: "cricket", winner: vainqueur.name, duration: cricketState.elapsedTime, createdAt: Date.now()
  }).catch(e => console.error(e));
  showScreen(screens.gameOver);
}

document.getElementById("btnGoHomeAfterMatch").onclick = () => showScreen(screens.home);
document.getElementById("btnGoHomeAfterStats").onclick = () => showScreen(screens.home);
document.getElementById("btnRematch").onclick = () => {
  let joueursRematch = [...cricketState.players];
  for (let i = joueursRematch.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [joueursRematch[i], joueursRematch[j]] = [joueursRematch[j], joueursRematch[i]];
  }
  demarrerMatchCricket(joueursRematch);
};
document.getElementById("btnGoToStats").onclick = () => { genererTableauStatistiques(); showScreen(screens.matchStats); };
document.getElementById("btnBackToPodium").onclick = () => showScreen(screens.gameOver);

function genererTableauStatistiques() {
  const table = document.getElementById("matchStatsTable"); table.innerHTML = "";
  const rowHeader = document.createElement("tr"); rowHeader.style.background = "rgba(255,255,255,0.03)";
  let html = `<th style="text-align:left; padding:10px 8px; border-bottom:2px solid var(--divider);">Critères</th>`;
  cricketState.players.forEach(p => { html += `<th style="font-weight:bold; padding:10px 6px; border-bottom:2px solid var(--divider); border-left:1px solid var(--divider);">${p.name}</th>`; });
  rowHeader.innerHTML = html; table.appendChild(rowHeader);

  const rowMpr = document.createElement("tr"); rowMpr.style.borderBottom = "1px solid var(--divider)";
  let mprHtml = `<td style="text-align:left; padding:10px 8px; font-weight:bold; color:var(--accent);">MPR (Moyenne)</td>`;
  cricketState.players.forEach(p => {
    const totalTouches = Object.values(cricketState.statsDetails[p.id].touchesNum).reduce((a,b)=>a+b, 0);
    const totalDarts = cricketState.statsDetails[p.id].dartsThrown || 1;
    const mpr = ((totalTouches / totalDarts) * 3).toFixed(2); 
    mprHtml += `<td style="font-weight:700; border-left:1px solid var(--divider); color:var(--primary-strong);">${mpr}</td>`;
  });
  rowMpr.innerHTML = mprHtml; table.appendChild(rowMpr);

  const ciblesNum = [15, 16, 17, 18, 19, 20, 25];
  ciblesNum.forEach(cible => {
    const libelleCible = cible === 25 ? "🎯 Bull" : `🎯 Zone ${cible}`;
    const rowTouches = document.createElement("tr");
    let touchesHtml = `<td style="text-align:left; padding:6px 8px; font-size:12px; opacity:0.8;">${libelleCible} (Touches)</td>`;
    cricketState.players.forEach(p => { touchesHtml += `<td style="border-left:1px solid var(--divider); font-size:12px;">${cricketState.statsDetails[p.id].touchesNum[cible]}</td>`; });
    rowTouches.innerHTML = touchesHtml; table.appendChild(rowTouches);

    const rowPoints = document.createElement("tr"); rowPoints.style.borderBottom = "1px solid var(--divider)";
    let pointsHtml = `<td style="text-align:left; padding:6px 8px; font-size:12px; color:var(--text-soft);">└ Points donnés</td>`;
    cricketState.players.forEach(p => {
      const pts = cricketState.statsDetails[p.id].pointsGiv[cible];
      pointsHtml += `<td style="border-left:1px solid var(--divider); font-size:12px; color:var(--danger); font-weight:bold;">${pts > 0 ? '-' + pts : '0'}</td>`;
    });
    rowPoints.innerHTML = pointsHtml; table.appendChild(rowPoints);
  });
}

document.getElementById("btnLeaveGame").addEventListener("click", () => {
  if (confirm("Abandonner le match en cours ?")) { clearInterval(cricketState.timerInterval); showScreen(screens.home); }
});