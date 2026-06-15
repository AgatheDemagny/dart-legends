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

// Banque de noms d'équipes inspirée par la nature
const POOL_NOMS_EQUIPES = [
  // Animaux
  "Gorille", "Loutre", "Renard", "Koala", "Castor", "Hérisson", "Blaireau", "Suricate", 
  "Lémurien", "Requin", "Piranha", "Bison", "Coyote", "Morse", "Otarie", "Furet", 
  "Grizzly", "Taupe", "Python", "Cobra", "Gecko", "Jaguar", "Lynx", "Puma", "Panthère", "Zèbre",
  // Oiseaux
  "Aigle", "Albatros", "Alouette", "Épervier", "Faucon", "Colibri", "Hibou", "Toucan", "Pélican", "Vautour",
  // Fleurs & Végétaux
  "Jonquille", "Tulipe", "Rose", "Pivoine", "Orchidée", "Lilas", "Lotus", "Coquelicot", 
  "Tournesol", "Jasmin", "Anémone", "Lavande", "Iris", "Capucine", "Camélia", "Dahlia",
  "Magnolia", "Trèfle", "Mimosa", "Hibiscus", "Fuchsia", "Géranium", "Pissenlit",
  // Insectes
  "Fourmi", "Scorpion", "Bourdon", "Luciole", "Cigale", "Scarabée", "Papillon", 
  "Araignée", "Libellule", "Abeille", "Sauterelle"  
];

function showScreen(activeScreen) {
  Object.values(screens).forEach(s => {
    if(s) s.classList.add("hidden");
  });
  if(activeScreen) activeScreen.classList.remove("hidden");
}

function showPopup(text, isError = false) {
  const popup = document.getElementById("popup");
  if (!popup) return;
  popup.innerText = text;
  popup.style.backgroundColor = isError ? "#D9383A" : "#1C1E21";
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

// Affichage dynamique des paramètres selon le mode de jeu sélectionné
document.getElementById("gameModeSelect").addEventListener("change", (e) => {
  if (e.target.value === "x01") {
    document.getElementById("cricketParamsGroup").classList.add("hidden");
    document.getElementById("x01ParamsGroup").classList.remove("hidden");
  } else {
    document.getElementById("cricketParamsGroup").classList.remove("hidden");
    document.getElementById("x01ParamsGroup").classList.add("hidden");
  }
});

// ÉCOUTEURS POUR LE MODE ÉQUIPE
document.getElementById("teamModeCheckbox").addEventListener("change", (e) => {
  const configZone = document.getElementById("teamModeConfig");
  if (e.target.checked) {
    configZone.classList.remove("hidden");
    genererEquipesAleatoires();
  } else {
    configZone.classList.add("hidden");
  }
});

document.getElementById("teamCountSelect").addEventListener("change", () => {
  genererEquipesAleatoires();
});

document.getElementById("btnReshuffleTeams").addEventListener("click", () => {
  genererEquipesAleatoires();
});

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
  if (screens.loading) screens.loading.classList.add("hidden");

  if (user) {
    try {
      const doc = await db.collection("players").doc(user.uid).get();
      let displayName = user.email ? user.email.split('@')[0] : "Joueur";
      
      if (doc.exists && doc.data().name) {
        displayName = doc.data().name;
      }
      
      const nameDisplay = document.getElementById("playerNameDisplay");
      if (nameDisplay) {
        nameDisplay.innerText = displayName;
      }
      
      await chargerTousLesJoueurs();
      showScreen(screens.home);
    } catch(e) {
      console.error("Erreur Firestore au démarrage:", e);
      showScreen(screens.home);
    }
  } else {
    showScreen(screens.login);
  }
});

// Inscription
document.getElementById("btnSignup").addEventListener("click", async () => {
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value.trim();
  if (!email || !password) return showPopup("Champs obligatoires.", true);
  try {
    const defaultName = email.split('@')[0];
    const nomExiste = tousLesJoueursBase.some(p => p.name.toLowerCase() === defaultName.toLowerCase());
    const finalName = nomExiste ? defaultName + Math.floor(Math.random() * 100) : defaultName;

    const cred = await auth.createUserWithEmailAndPassword(email, password);
    await db.collection("players").doc(cred.user.uid).set({
      email: email, name: finalName, createdAt: Date.now()
    });
    await chargerTousLesJoueurs();
    showPopup("Compte joueur enregistré !");
  } catch (e) { showPopup(e.message, true); }
});

// Connexion
document.getElementById("btnLogin").addEventListener("click", async () => {
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value.trim();
  if (!email || !password) return showPopup("Champs obligatoires.", true);
  try { 
    await auth.signInWithEmailAndPassword(email, password); 
  } catch (e) { showPopup(e.message, true); }
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
    await chargerTousLesJoueurs();
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
  if(!nouveauPseudo) return showPopup("Le pseudo ne peut pas être vide.", true);

  const doublon = tousLesJoueursBase.some(p => p.id !== user.uid && p.name.toLowerCase() === nouveauPseudo.toLowerCase());
  if (doublon) {
    return showPopup(`Le nom "${nouveauPseudo}" existe déjà !`, true);
  }

  try {
    await db.collection("players").doc(user.uid).update({
      name: nouveauPseudo
    });
    const nameDisplay = document.getElementById("playerNameDisplay");
    if (nameDisplay) nameDisplay.innerText = nouveauPseudo;
    await chargerTousLesJoueurs();
    showPopup("Pseudo mis à jour !");
  } catch(e) {
    showPopup("Erreur lors de la mise à jour : " + e.message, true);
  }
});

// ================== LOGIQUE NOUVELLE PARTIE & EQUIPES ==================
let tousLesJoueursBase = [];
let joueursSelectionnesMatch = [];
let listeEquipesFormees = []; // Conservera la composition courante des équipes

async function initPageNouvellePartie() {
  joueursSelectionnesMatch = [];
  document.getElementById("teamModeCheckbox").checked = false;
  document.getElementById("teamModeConfig").classList.add("hidden");
  document.getElementById("teamCountSelect").value = "2";
  
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
  await chargerTousLesJoueurs();
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
    d.innerHTML = `<span><strong>${p.name}</strong></span>`;
    
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
  if(!name) return showPopup("Le nom est obligatoire.", true);

  const existeDeja = tousLesJoueursBase.some(p => p.name.toLowerCase() === name.toLowerCase());
  if (existeDeja) {
    return showPopup(`Le nom "${name}" existe déjà !`, true);
  }

  try {
    const docId = "guest-" + Date.now();
    const nouveauJoueur = { name: name, email: email || null, createdAt: Date.now() };
    await db.collection("players").doc(docId).set(nouveauJoueur);
    joueursSelectionnesMatch.push({ id: docId, name: name });
    renderSelectedPlayers();
    await chargerTousLesJoueurs();
    document.getElementById("createPlayerName").value = "";
    document.getElementById("createPlayerEmail").value = "";
    document.getElementById("zoneCreatePlayer").classList.add("hidden");
    showPopup("Joueur créé avec succès !");
  } catch(e) { showPopup(e.message, true); }
});

function renderSelectedPlayers() {
  const container = document.getElementById("selectedPlayersMatchList");
  container.innerHTML = "";
  if(joueursSelectionnesMatch.length === 0) {
    container.innerHTML = "<p class='hint'>Aucun tireur sélectionné.</p>";
  } else {
    joueursSelectionnesMatch.forEach((p, index) => {
      const badge = document.createElement("div");
      badge.className = "stat-row";
      badge.style.padding = "6px 10px";
      badge.style.background = "rgba(255,255,255,0.03)";
      badge.style.borderRadius = "10px";
      badge.style.marginBottom = "5px";
      badge.innerHTML = `
        <span><strong>${p.name}</strong></span>
        <button class="ghost btn-action-soft" onclick="retirerJoueurMatch(${index})">Retirer</button>
      `;
      container.appendChild(badge);
    });
  }

  const blockEquipe = document.getElementById("teamModeBlock");
  if (joueursSelectionnesMatch.length >= 4) {
    blockEquipe.classList.remove("hidden");
    const teamSelect = document.getElementById("teamCountSelect");
    const valCourante = parseInt(teamSelect.value, 10);
    teamSelect.innerHTML = "";
    for (let i = 2; i <= Math.min(4, joueursSelectionnesMatch.length); i++) {
      let opt = document.createElement("option");
      opt.value = i; opt.innerText = `${i} équipes`;
      if (i === valCourante) opt.selected = true;
      teamSelect.appendChild(opt);
    }
    if (document.getElementById("teamModeCheckbox").checked) {
      genererEquipesAleatoires();
    }
  } else {
    blockEquipe.classList.add("hidden");
    document.getElementById("teamModeCheckbox").checked = false;
    document.getElementById("teamModeConfig").classList.add("hidden");
  }
}

function retirerJoueurMatch(idx) {
  joueursSelectionnesMatch.splice(idx, 1);
  renderSelectedPlayers();
}

// LOGIQUE INTERNE DE CRÉATION ET MODIFICATION DES ÉQUIPES
function genererEquipesAleatoires() {
  const nbEquipesDemandees = parseInt(document.getElementById("teamCountSelect").value, 10);
  
  // 1. Mélanger les joueurs copiés
  let joueursMelanges = [...joueursSelectionnesMatch];
  for (let i = joueursMelanges.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [joueursMelanges[i], joueursMelanges[j]] = [joueursMelanges[j], joueursMelanges[i]];
  }

  // 2. Sélectionner des noms uniques de la pool nature
  let nomsPioches = [];
  let poolCopie = [...POOL_NOMS_EQUIPES];
  for(let i=0; i<nbEquipesDemandees; i++) {
    if(poolCopie.length === 0) poolCopie = [...POOL_NOMS_EQUIPES];
    const indexAlea = Math.floor(Math.random() * poolCopie.length);
    nomsPioches.push(poolCopie.splice(indexAlea, 1)[0]);
  }

  // 3. Initialiser les structures d'équipes
  listeEquipesFormees = [];
  for (let i = 0; i < nbEquipesDemandees; i++) {
    listeEquipesFormees.push({
      id: "team-" + i,
      name: nomsPioches[i],
      members: []
    });
  }

  // 4. Distribuer équitablement les joueurs dans les équipes
  joueursMelanges.forEach((joueur, index) => {
    const cibleEquipe = index % nbEquipesDemandees;
    listeEquipesFormees[cibleEquipe].members.push(joueur);
  });

  renderEquipesUI();
}

function renderEquipesUI() {
  const container = document.getElementById("teamsContainer");
  container.innerHTML = "";

  listeEquipesFormees.forEach((equipe, indexTeam) => {
    const cardTeam = document.createElement("div");
    cardTeam.className = "card subtle";
    cardTeam.style.padding = "12px";
    cardTeam.style.background = "rgba(255,255,255,0.01)";
    cardTeam.style.border = "1px solid var(--divider)";

    let teamHtml = `
      <div style="margin-bottom:10px;">
        <input type="text" value="${equipe.name}" 
               class="team-config-title"
               style="border:none; background:transparent; padding:2px 0px; width:100%; border-radius:0; outline:none;"
               oninput="mettreAJourNomEquipe(${indexTeam}, this.value)" />
      </div>
      <div style="display:flex; flex-direction:column; gap:8px; padding-left:4px;">
    `;

    equipe.members.forEach((m, indexMembre) => {
      teamHtml += `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span class="team-config-player">${m.name}</span>
          <button class="ghost btn-action-soft" 
                  onclick="deplacerJoueurManuellement(${indexTeam}, ${indexMembre})">Changer d'équipe</button>
        </div>
      `;
    });

    teamHtml += `</div>`;
    cardTeam.innerHTML = teamHtml;
    container.appendChild(cardTeam);
  });
}

function mettreAJourNomEquipe(index, nvNom) {
  if(listeEquipesFormees[index]) {
    listeEquipesFormees[index].name = nvNom;
  }
}

// Permet de transférer manuellement un joueur vers l'équipe suivante pour réajuster à la main
function deplacerJoueurManuellement(indexTeamSource, indexMembre) {
  const joueur = listeEquipesFormees[indexTeamSource].members.splice(indexMembre, 1)[0];
  const indexTeamCible = (indexTeamSource + 1) % listeEquipesFormees.length;
  listeEquipesFormees[indexTeamCible].members.push(joueur);
  renderEquipesUI();
}


// ================== MOTEUR DE JEU GENERAL ET DYNAMIQUE ==================
let cricketState = {
  gameMode: "cricket",
  isTeamMode: false,
  x01StartPoints: 301, x01Checkout: "single",
  players: [], maxTurns: 20, isBlind: false, targets: [], blindMap: {}, revealedTargets: [],
  scores: {}, marks: {}, history: [], currentTurnDartsText: [], statsDetails: {},
  currentPlayerIdx: 0, currentDart: 1, currentTurn: 1, startTime: 0, elapsedTime: 0,
  timerInterval: null, isPaused: false, lastTurnText: "Aucun"
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
    btnBull.disabled = true; btnBull.style.opacity = "0.2"; btnBull.style.background = "rgba(255,255,255,0.01)"; btnBull.innerText = "🚫 B";
  } else {
    btnBull.disabled = false; btnBull.style.opacity = "1"; btnBull.style.background = "rgba(255,255,255,0.06)"; btnBull.innerText = "🎯 B";
  }
}

document.getElementById("startGameBtn").addEventListener("click", () => {
  if (joueursSelectionnesMatch.length < 2) {
    return showPopup("⚠️ Il faut au moins 2 joueurs sur la ligne de tir pour démarrer !", true);
  }
  
  const estEnModeEquipe = document.getElementById("teamModeCheckbox").checked;
  let ordonnancementTireurs = [];

  if (estEnModeEquipe) {
    // Vérifier qu'aucune équipe ne se retrouve vide suite à des transferts manuels
    const aEquipeVide = listeEquipesFormees.some(eq => eq.members.length === 0);
    if(aEquipeVide) {
      return showPopup("⚠️ Chaque équipe doit posséder au moins un joueur !", true);
    }
    
    cricketState.isTeamMode = true;
    
    // Aligner l'ordre des lanceurs de manière séquentielle par équipe : Équipe 1 (Tireur A), Équipe 2 (Tireur B), Équipe 1 (Tireur C)...
    let curseursEquipes = {};
    listeEquipesFormees.forEach(eq => { curseursEquipes[eq.id] = 0; });
    
    let totalJoueursADistribuer = joueursSelectionnesMatch.length;
    let securiteBoucle = 0;
    
    while(ordonnancementTireurs.length < totalJoueursADistribuer && securiteBoucle < 100) {
      securiteBoucle++;
      listeEquipesFormees.forEach(eq => {
        let indexMembre = curseursEquipes[eq.id];
        if(indexMembre < eq.members.length) {
          let joueurOrigine = eq.members[indexMembre];
          // On crée une entité virtuelle qui hérite du score global de son équipe
          ordonnancementTireurs.push({
            id: joueurOrigine.id,
            name: joueurOrigine.name,
            teamId: eq.id,
            teamName: eq.name
          });
          curseursEquipes[eq.id]++;
        }
      });
    }
  } else {
    cricketState.isTeamMode = false;
    // Mode standard : On mélange simplement
    ordonnancementTireurs = melangerJoueurs(joueursSelectionnesMatch);
  }

  const mode = document.getElementById("gameModeSelect").value;
  if (mode === "x01") {
    demarrerMatchX01(ordonnancementTireurs);
  } else {
    demarrerMatchCricket(ordonnancementTireurs);
  }
});

function melangerJoueurs(liste) {
  let joueursMelanges = [...liste];
  for (let i = joueursMelanges.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [joueursMelanges[i], joueursMelanges[j]] = [joueursMelanges[j], joueursMelanges[i]];
  }
  return joueursMelanges;
}

function initVariablesMatchGenerales(joueursAlignes) {
  cricketState.players = joueursAlignes;
  cricketState.history = []; 
  cricketState.currentTurnDartsText = [];
  cricketState.currentPlayerIdx = 0; 
  cricketState.currentDart = 1; 
  cricketState.currentTurn = 1;
  cricketState.scores = {}; 
  cricketState.statsDetails = {};
  cricketState.lastTurnText = "Aucun";
}

function demarrerMatchCricket(listeJoueurs) {
  cricketState.gameMode = "cricket";
  initVariablesMatchGenerales(listeJoueurs);

  cricketState.maxTurns = parseInt(document.getElementById("gameTurnsSelect").value, 10);
  cricketState.isBlind = document.getElementById("blindModeCheckbox").checked;
  cricketState.marks = {}; 

  if (cricketState.isBlind) {
    let toutesLesCiblesPossibles = [];
    for (let i = 1; i <= 20; i++) toutesLesCiblesPossibles.push(i);
    toutesLesCiblesPossibles.push(25);

    let ciblesMysteres = [];
    while (ciblesMysteres.length < 7) {
      let indexAlea = Math.floor(Math.random() * toutesLesCiblesPossibles.length);
      let cibleChoisie = toutesLesCiblesPossibles.splice(indexAlea, 1)[0];
      ciblesMysteres.push(cibleChoisie);
    }
    cricketState.targets = ciblesMysteres;
    cricketState.revealedTargets = [];
  } else {
    cricketState.targets = [15, 16, 17, 18, 19, 20, 25];
    cricketState.revealedTargets = [...cricketState.targets];
  }

  // Si mode équipe : l'index de référence de stockage devient l'ID d'équipe, sinon l'ID joueur
  cricketState.players.forEach(p => {
    const keyStockage = cricketState.isTeamMode ? p.teamId : p.id;
    cricketState.scores[keyStockage] = 0;
    
    if(!cricketState.marks[keyStockage]) {
      cricketState.marks[keyStockage] = {};
      cricketState.targets.forEach(t => { cricketState.marks[keyStockage][t] = 0; });
    }
    
    // Les statistiques de lancers restent individuelles pour le tableau final
    cricketState.statsDetails[p.id] = { dartsThrown: 0, touchesUtiles: 0, touchesNum: {}, pointsGiv: {} };
    cricketState.targets.forEach(t => {
      cricketState.statsDetails[p.id].touchesNum[t] = 0;
      cricketState.statsDetails[p.id].pointsGiv[t] = 0;
    });
  });

  lancerInterfaceJeu("cricket");
}

function demarrerMatchX01(listeJoueurs) {
  cricketState.gameMode = "x01";
  initVariablesMatchGenerales(listeJoueurs);
  
  cricketState.x01StartPoints = parseInt(document.getElementById("x01StartPointsSelect").value, 10);
  cricketState.x01Checkout = document.getElementById("x01CheckoutSelect").value;
  cricketState.maxTurns = 999; 

  cricketState.players.forEach(p => {
    const keyStockage = cricketState.isTeamMode ? p.teamId : p.id;
    cricketState.scores[keyStockage] = cricketState.x01StartPoints;
    cricketState.statsDetails[p.id] = { dartsThrown: 0, totalScoreScored: 0, bustsCount: 0 };
  });

  lancerInterfaceJeu("x01");
}

function lancerInterfaceJeu(mode) {
  showScreen(screens.cricket);
  cricketState.startTime = Date.now(); 
  cricketState.elapsedTime = 0; 
  cricketState.isPaused = false;
  document.getElementById("btnPauseGame").innerText = "⏸️";
  clearInterval(cricketState.timerInterval);
  cricketState.timerInterval = setInterval(updateTimer, 1000);

  resetModifierUI(); 
  if (mode === "x01") {
    renderKeyboardX01(); 
    renderGridX01();
  } else {
    renderKeyboard(); 
    renderGrid();
  }
  gererEtatBoutonBull();
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
  if (!p) return;
  
  const indicationLabel = cricketState.isTeamMode ? `${p.name} (${p.teamName})` : p.name;
  document.getElementById("cricketCurrentPlayerName").innerText = indicationLabel;
  
  const chaineLancers = cricketState.currentTurnDartsText.join(" / ");
  document.getElementById("dartsHistoryText").innerText = chaineLancers || "En attente...";
  const tText = cricketState.maxTurns === 999 ? "∞" : cricketState.maxTurns;
  document.getElementById("gameTurnIndicator").innerText = `Tour ${cricketState.currentTurn}/${tText}`;
  document.getElementById("lastTurnHistoryText").innerText = `Coup précédent : ${cricketState.lastTurnText}`;

  // Gestion ultra-dynamique de la zone d'aide X01
  const helpZone = document.getElementById("x01CheckoutHelpZone");
  if (cricketState.gameMode === "x01") {
    const keyStockage = cricketState.isTeamMode ? p.teamId : p.id;
    const scoreRestant = cricketState.scores[keyStockage];
    
    // Déduction stricte des fléchettes restantes dans la main (3 au début, puis 2, puis 1)
    const dartsRestantes = 4 - cricketState.currentDart; 

    const aideTexte = obtenirSuggestionCheckout(scoreRestant, dartsRestantes, cricketState.x01Checkout);
    
    // L'affichage apparaît uniquement si une combinaison valide est retournée
    if (aideTexte) {
      helpZone.innerText = `🎯 ${aideTexte}`;
      helpZone.classList.remove("hidden");
    } else {
      helpZone.classList.add("hidden"); // Disparaît instantanément sinon
    }
  } else {
    helpZone.classList.add("hidden");
  }
}

// Algorithme de calcul de checkout dynamique et strict selon le nombre de fléchettes restantes
function obtenirSuggestionCheckout(score, dartsCount, modeCheckout) {
  if (score <= 1) return null;

  // En Double-Out, le maximum absolu en 3 fléchettes est 170. Le maximum en 2 fléchettes est 110 (T20 + DBull)
  if (modeCheckout === "double") {
    if (score > 170) return null;
    
    // Les "Bogey numbers" : scores inférieurs à 170 mais impossibles à finir en 3 fléchettes
    const bogeys3Darts = [159, 162, 163, 165, 166, 168, 169];
    if (dartsCount === 3 && bogeys3Darts.includes(score)) return null;

    // --- FINITION EN 1 FLÉCHETTE ---
    if (dartsCount >= 1) {
      if (score <= 40 && score % 2 === 0) return `D${score / 2}`;
      if (score === 50) return "DBull";
    }

    // Si on n'a qu'une fléchette et qu'on n'a pas validé les conditions du dessus, impossible de finir
    if (dartsCount === 1) return null;

    // --- FINITION EN 2 FLÉCHETTES ---
    if (dartsCount >= 2) {
      // Cas particuliers avec le Bullseye
      if (score === 110) return "T20 - DBull";
      if (score === 107) return "T19 - DBull";
      if (score === 104) return "T18 - DBull";
      if (score === 101) return "T17 - DBull";

      // Recherche d'une combinaison classique : 1 Simple ou 1 Triple + 1 Double
      for (let t = 20; t >= 1; t--) {
        // Option via un Triple (Ex: 70 restant -> T20 + D5)
        let resteApresTriple = score - (t * 3);
        if (resteApresTriple > 0 && resteApresTriple <= 40 && resteApresTriple % 2 === 0) {
          return `T${t} - D${resteApresTriple / 2}`;
        }
        // Option via un Simple (Ex: 41 restant -> S1 + D20)
        let resteApresSimple = score - t;
        if (resteApresSimple > 0 && resteApresSimple <= 40 && resteApresSimple % 2 === 0) {
          return `${t} - D${resteApresSimple / 2}`;
        }
      }
    }

    // Si on a 2 fléchettes et qu'on n'a rien trouvé, impossible de finir en 2 coups (ex: score de 111 à 170)
    if (dartsCount === 2) return null;

    // --- FINITION EN 3 FLÉCHETTES ---
    if (dartsCount === 3) {
      // Finitions mythiques et iconiques de l'historique des fléchettes
      if (score === 170) return "T20 - T20 - DBull";
      if (score === 167) return "T20 - T19 - DBull";
      if (score === 164) return "T20 - T18 - DBull";
      if (score === 161) return "T20 - T17 - DBull";
      if (score === 160) return "T20 - T20 - D20";
      if (score === 158) return "T20 - T20 - D19";
      if (score === 157) return "T20 - T19 - D20";
      if (score === 156) return "T20 - T20 - D18";
      if (score === 155) return "T20 - T19 - D19";
      if (score === 154) return "T20 - T18 - D20";
      if (score === 153) return "T20 - T19 - D18";
      if (score === 152) return "T20 - T20 - D16";
      if (score === 151) return "T20 - T17 - D20";
      if (score === 150) return "T20 - T18 - D18";

      // Algorithme générique pour les scores inférieurs à 150 (2 Triples + 1 Double)
      for (let t1 = 20; t1 >= 1; t1--) {
        for (let t2 = 20; t2 >= 1; t2--) {
          let reste = score - (t1 * 3) - (t2 * 3);
          if (reste > 0 && reste <= 40 && reste % 2 === 0) {
            return `T${t1} - T${t2} - D${reste / 2}`;
          }
        }
      }
      
      // Alternative au cas où (1 Triple + 1 Simple + 1 Double)
      for (let t1 = 20; t1 >= 1; t1--) {
        for (let s1 = 20; s1 >= 1; s1--) {
          let reste = score - (t1 * 3) - s1;
          if (reste > 0 && reste <= 40 && reste % 2 === 0) {
            return `T${t1} - ${s1} - D${reste / 2}`;
          }
        }
      }
    }
  } 
  
  // --- MODE SANS CONTRAINTE (SINGLE OUT) ---
  else {
    // En mode Single Out, le maximum en 3 fléchettes est 180 (T20 x3)
    if (score > 180) return null;

    if (dartsCount >= 1) {
      if (score <= 20) return `${score}`;
      if (score === 25) return "Bull";
      if (score <= 40 && score % 2 === 0) return `D${score / 2}`;
      if (score <= 60 && score % 3 === 0) return `T${score / 3}`;
      if (score === 50) return "DBull";
    }

    if (dartsCount === 1) return null;

    if (dartsCount >= 2) {
      for (let t = 20; t >= 1; t--) {
        let reste = score - (t * 3);
        if (reste > 0 && reste <= 20) return `T${t} - ${reste}`;
        if (reste === 25) return `T${t} - Bull`;
        if (reste > 0 && reste <= 60 && reste % 3 === 0) return `T${t} - T${reste / 3}`;
      }
    }

    if (dartsCount === 2) return null;

    if (dartsCount === 3) {
      if (score === 180) return "T20 - T20 - T20";
      for (let t1 = 20; t1 >= 1; t1--) {
        for (let t2 = 20; t2 >= 1; t2--) {
          let reste = score - (t1 * 3) - (t2 * 3);
          if (reste > 0 && reste <= 20) return `T${t1} - T${t2} - ${reste}`;
          if (reste === 25) return `T${t1} -> T${t2} - Bull`;
          if (reste > 0 && reste <= 60 && reste % 3 === 0) return `T${t1} - T${t2} - T${reste / 3}`;
        }
      }
    }
  }

  return null;
}

function renderGrid() {
  const table = document.getElementById("cricketGridTable");
  table.innerHTML = "";
  const headerRow = document.createElement("tr");
  headerRow.style.background = "rgba(255,255,255,0.02)";
  let headerHtml = `<th style="text-align:left; padding: 10px 4px; border-bottom: 2px solid var(--divider); width: 23%;">Ligne</th>`;
  cricketState.targets.forEach(t => {
    let libelle = t === 25 ? "B" : t;
    if (cricketState.isBlind && !cricketState.revealedTargets.includes(t)) libelle = "❓";
    headerHtml += `<th style="font-weight:bold; padding: 10px 2px; border-bottom: 2px solid var(--divider); border-left: 1px solid var(--divider); width: 11%;">${libelle}</th>`;
  });
  headerHtml += `<th style="padding: 10px 4px; border-bottom: 2px solid var(--divider); border-left: 1px solid var(--divider); color: var(--accent); width: 12%;">Score</th>`;
  headerRow.innerHTML = headerHtml;
  table.appendChild(headerRow);

  // Déterminer la liste des entités à afficher sur la grille (Ligne d'équipes ou ligne de joueurs solos)
  let entitesAAfficher = [];
  if (cricketState.isTeamMode) {
    listeEquipesFormees.forEach(eq => {
      if(!entitesAAfficher.some(e => e.id === eq.id)) {
        entitesAAfficher.push({ id: eq.id, name: eq.name, isTeam: true });
      }
    });
  } else {
    cricketState.players.forEach(p => {
      entitesAAfficher.push({ id: p.id, name: p.name, isTeam: false });
    });
  }

  const joueurActuel = cricketState.players[cricketState.currentPlayerIdx];

  entitesAAfficher.forEach(entite => {
    const row = document.createElement("tr");
    row.style.borderBottom = "1px solid var(--divider)";
    
    const estLigneActive = cricketState.isTeamMode ? (joueurActuel.teamId === entite.id) : (joueurActuel.id === entite.id);
    if(estLigneActive) {
      row.style.backgroundColor = "rgba(192,101,42,0.15)";
    }
    
    let nomTronque = entite.name.length > 9 ? entite.name.substring(0, 9) + "." : entite.name;
    let cellsHtml = `<td style="text-align:left; padding: 12px 4px; font-weight:700; width: 23%;">${nomTronque}</td>`;
    
    cricketState.targets.forEach(t => {
      const touches = cricketState.marks[entite.id][t];
      let symbole = ""; 
      if (touches === 1) symbole = `<span style="font-size: 18px; font-weight:900; color:var(--text-main); font-family: monospace;">\\</span>`;
      else if (touches === 2) symbole = `<span style="font-size: 18px; font-weight:900; color:var(--text-main); font-family: monospace;">X</span>`;
      else if (touches >= 3) {
        symbole = `<span style="display:inline-block; border: 2px solid #ff3838; border-radius: 50%; width: 22px; height: 22px; line-height: 18px; font-weight: 900; color: #ff3838; text-align:center; font-family: monospace; font-size: 13px; background: rgba(255,56,56,0.05);">X</span>`;
      }
      cellsHtml += `<td style="padding: 6px 2px; border-left: 1px solid var(--divider); width: 11%;">${symbole}</td>`;
    });
    cellsHtml += `<td style="font-weight:800; padding: 12px 2px; border-left: 1px solid var(--divider); color: var(--primary-strong); font-size: 14px; width: 12%;">${cricketState.scores[entite.id]}</td>`;
    row.innerHTML = cellsHtml;
    table.appendChild(row);
  });
}

function renderGridX01() {
  const table = document.getElementById("cricketGridTable");
  table.innerHTML = "";
  
  const headerRow = document.createElement("tr");
  headerRow.style.background = "rgba(255,255,255,0.02)";
  headerRow.innerHTML = `
    <th style="text-align:left; padding: 12px 6px; border-bottom: 2px solid var(--divider); width: 40%;">Joueurs</th>
    <th style="padding: 12px 4px; border-bottom: 2px solid var(--divider); border-left: 1px solid var(--divider); color: var(--text-soft); width: 30%;">Moyenne</th>
    <th style="padding: 12px 6px; border-bottom: 2px solid var(--divider); border-left: 1px solid var(--divider); color: var(--accent); width: 30%;">Score restant</th>
  `;
  table.appendChild(headerRow);

  let entitesAAfficher = [];
  if (cricketState.isTeamMode) {
    listeEquipesFormees.forEach(eq => {
      entitesAAfficher.push({ id: eq.id, name: eq.name, members: eq.members });
    });
  } else {
    cricketState.players.forEach(p => {
      entitesAAfficher.push({ id: p.id, name: p.name, members: [p] });
    });
  }

  const joueurActuel = cricketState.players[cricketState.currentPlayerIdx];

  entitesAAfficher.forEach(entite => {
    const row = document.createElement("tr");
    row.style.borderBottom = "1px solid var(--divider)";
    
    const estLigneActive = cricketState.isTeamMode ? (joueurActuel.teamId === entite.id) : (joueurActuel.id === entite.id);
    if(estLigneActive) {
      row.style.backgroundColor = "rgba(192,101,42,0.15)";
    }
    
    let nomTronque = entite.name.length > 12 ? entite.name.substring(0, 12) + "." : entite.name;
    
    let totalScoreMarque = 0;
    let totalFlechettes = 0;
    entite.members.forEach(m => {
      if(cricketState.statsDetails[m.id]) {
        totalScoreMarque += cricketState.statsDetails[m.id].totalScoreScored || 0;
        totalFlechettes += cricketState.statsDetails[m.id].dartsThrown || 0;
      }
    });
    
    // Application de la VRAIE moyenne par fléchette individuelle
    let moyenneAffichage = "0.0";
    if (totalFlechettes > 0) {
      moyenneAffichage = (totalScoreMarque / totalFlechettes).toFixed(1);
    }
    
    row.innerHTML = `
      <td style="text-align:left; padding: 14px 6px; font-weight:700;">${nomTronque}</td>
      <td style="padding: 14px 4px; border-left: 1px solid var(--divider); font-weight:600; color: var(--text-soft); font-size: 14px;">${moyenneAffichage}</td>
      <td style="font-weight:800; padding: 14px 6px; border-left: 1px solid var(--divider); color: var(--primary-strong); font-size: 18px;">${cricketState.scores[entite.id]}</td>
    `;
    table.appendChild(row);
  });
}

function renderKeyboard() {
  const container = document.getElementById("cricketDynamicRows");
  if (!container) return;
  container.innerHTML = "";

  const toutEstDecouvert = cricketState.isBlind && (cricketState.revealedTargets.length >= cricketState.targets.length);

  if (cricketState.isBlind && !toutEstDecouvert) {
    const row1 = document.createElement("div");
    row1.style.display = "grid"; row1.style.gridTemplateColumns = "repeat(7, 1fr)"; row1.style.gap = "5px";
    for (let i = 1; i <= 7; i++) row1.appendChild(creerBoutonClavier(i, i));
    container.appendChild(row1);

    const row2 = document.createElement("div");
    row2.style.display = "grid"; row2.style.gridTemplateColumns = "repeat(7, 1fr)"; row2.style.gap = "5px";
    for (let i = 8; i <= 14; i++) row2.appendChild(creerBoutonClavier(i, i));
    container.appendChild(row2);

    const row3 = document.createElement("div");
    row3.style.display = "grid"; row3.style.gridTemplateColumns = "repeat(6, 1fr) 1.2fr"; row3.style.gap = "5px";
    for (let i = 15; i <= 20; i++) row3.appendChild(creerBoutonClavier(i, i));
    row3.appendChild(creerBoutonClavier("🎯 B", 25));
    container.appendChild(row3);
  } else {
    const rowClassique = document.createElement("div");
    rowClassique.style.display = "grid"; 
    const ciblesAAfficher = cricketState.targets;
    rowClassique.style.gridTemplateColumns = `repeat(${ciblesAAfficher.length}, 1fr)`;
    rowClassique.style.gap = "5px";
    
    ciblesAAfficher.forEach(num => {
      let libelle = num === 25 ? "🎯 B" : num;
      rowClassique.appendChild(creerBoutonClavier(libelle, num));
    });
    container.appendChild(rowClassique);
  }
}

function renderKeyboardX01() {
  const container = document.getElementById("cricketDynamicRows");
  if (!container) return;
  container.innerHTML = "";

  const row1 = document.createElement("div");
  row1.style.display = "grid"; row1.style.gridTemplateColumns = "repeat(7, 1fr)"; row1.style.gap = "5px";
  for (let i = 1; i <= 7; i++) row1.appendChild(creerBoutonClavier(i, i));
  container.appendChild(row1);

  const row2 = document.createElement("div");
  row2.style.display = "grid"; row2.style.gridTemplateColumns = "repeat(7, 1fr)"; row2.style.gap = "5px";
  for (let i = 8; i <= 14; i++) row2.appendChild(creerBoutonClavier(i, i));
  container.appendChild(row2);

  const row3 = document.createElement("div");
  row3.style.display = "grid"; row3.style.gridTemplateColumns = "repeat(7, 1fr)"; row3.style.gap = "5px";
  for (let i = 15; i <= 20; i++) row3.appendChild(creerBoutonClavier(i, i));
  row3.appendChild(creerBoutonClavier("🎯 B", 25));
  container.appendChild(row3);
}

function creerBoutonClavier(libelle, valeur) {
  const btn = document.createElement("button");
  btn.className = "ghost"; 
  btn.style.padding = "14px 2px"; 
  btn.style.fontSize = "14px"; 
  btn.style.fontWeight = "bold";
  btn.innerText = libelle; 
  btn.onclick = () => taperChiffre(valeur);
  if (valeur === 25) {
    btn.id = "btnKeyBull";
  }
  
  return btn;
}

// ROUTEUR DE ACTIONS SUR LES COUPS
function taperChiffre(valeurBouton) {
  if (cricketState.isPaused) return;
  const joueurActuel = cricketState.players[cricketState.currentPlayerIdx];
  const keyStockage = cricketState.isTeamMode ? joueurActuel.teamId : joueurActuel.id;
  
  // Sauvegarde pour annulation historique
  cricketState.history.push({
    scores: JSON.parse(JSON.stringify(cricketState.scores)),
    marks: cricketState.marks ? JSON.parse(JSON.stringify(cricketState.marks)) : null,
    revealedTargets: [...cricketState.revealedTargets],
    currentTurnDartsText: [...cricketState.currentTurnDartsText],
    statsDetails: JSON.parse(JSON.stringify(cricketState.statsDetails)),
    currentPlayerIdx: cricketState.currentPlayerIdx,
    currentDart: cricketState.currentDart,
    currentTurn: cricketState.currentTurn,
    lastTurnText: cricketState.lastTurnText
  });

  let prefixeText = modificateurEnCours === 2 ? "D" : modificateurEnCours === 3 ? "T" : "";
  if (valeurBouton === 0) { 
    cricketState.currentTurnDartsText.push("0"); 
  } else if (valeurBouton === 25) { 
    cricketState.currentTurnDartsText.push(prefixeText + "Bull"); 
  } else { 
    cricketState.currentTurnDartsText.push(prefixeText + valeurBouton); 
  }

  // Incrémentation des lancers individuels
  cricketState.statsDetails[joueurActuel.id].dartsThrown += 1;

  if (cricketState.gameMode === "x01") {
    traiterCalculX01(keyStockage, joueurActuel, valeurBouton);
  } else {
    traiterCalculCricket(keyStockage, joueurActuel, valeurBouton);
  }

  cricketState.currentDart += 1;
  if (cricketState.currentDart > 3) {
    cloreVoleeActuelle(joueurActuel);
  }

  resetModifierUI(); 
  if (cricketState.gameMode === "x01") {
    renderKeyboardX01(); renderGridX01();
  } else {
    renderKeyboard(); renderGrid();
  }
  gererEtatBoutonBull();
  updateTurnHeader(); 
  verifierConditionsFinMatch();
}

function cloreVoleeActuelle(joueur) {
  const libelleName = cricketState.isTeamMode ? `${joueur.name} (${joueur.teamName})` : joueur.name;
  cricketState.lastTurnText = `${libelleName} ${cricketState.currentTurnDartsText.join('/')}`;
  
  // Sauvegarde de l'index et de l'équipe du joueur qui vient de finir
  const ancienPlayerIdx = cricketState.currentPlayerIdx;
  const ancienneTeamId = joueur.teamId;

  cricketState.currentDart = 1; 
  cricketState.currentPlayerIdx += 1; 
  cricketState.currentTurnDartsText = [];

  // Si on a fait le tour de tous les joueurs de la ligne de tir
  if (cricketState.currentPlayerIdx >= cricketState.players.length) {
    cricketState.currentPlayerIdx = 0; 
    
    // En mode normal, un tour de table complet = +1 tour de jeu
    if (!cricketState.isTeamMode) {
      cricketState.currentTurn += 1;
    }
  }

  // LOGIQUE COMPTEUR DE TOURS POUR LES ÉQUIPES
  if (cricketState.isTeamMode) {
    const prochainJoueur = cricketState.players[cricketState.currentPlayerIdx];
    
    // On récupère l'ordre d'apparition unique des équipes pour savoir qui est qui
    const ordreEquipes = listeEquipesFormees.map(eq => eq.id);
    const indexOrdreAncien = ordreEquipes.indexOf(ancienneTeamId);
    const indexOrdreProchain = ordreEquipes.indexOf(prochainJoueur.teamId);

    if (indexOrdreProchain <= indexOrdreAncien) {
      cricketState.currentTurn += 1;
    }
  }
}

// SUB-LOGIQUE 1 : CRICKET AVEC OU SANS ÉQUIPE
function traiterCalculCricket(keyStockage, joueurActuel, valeurBouton) {
  if (valeurBouton === 0) return;
  
  if (cricketState.targets.includes(valeurBouton)) {
    if (!cricketState.revealedTargets.includes(valeurBouton)) {
      cricketState.revealedTargets.push(valeurBouton);
    }
    
    // Vérification de fermeture globale
    let clesEntites = Object.keys(cricketState.scores);
    const estFermePourTous = clesEntites.every(k => cricketState.marks[k][valeurBouton] >= 3);
    if (!estFermePourTous) {
      cricketState.statsDetails[joueurActuel.id].touchesNum[valeurBouton] += modificateurEnCours;
    }
    
    let touchesPrecedentes = cricketState.marks[keyStockage][valeurBouton];
    let touchesRestantes = 3 - touchesPrecedentes;
    let touchesAppliquees = Math.min(modificateurEnCours, touchesRestantes);
    cricketState.marks[keyStockage][valeurBouton] += touchesAppliquees;
    cricketState.statsDetails[joueurActuel.id].touchesUtiles += touchesAppliquees;
    
    let surplus = modificateurEnCours - touchesAppliquees;
    if (surplus > 0) {
      let pointsReellementDonnesCeCoup = 0;
      clesEntites.forEach(k => {
        if (k !== keyStockage) {
          const advFerme = cricketState.marks[k][valeurBouton] >= 3;
          if (!advFerme) {
            let penalite = valeurBouton * surplus;
            cricketState.scores[k] -= penalite;
            pointsReellementDonnesCeCoup += penalite;
          }
        }
      });
      if (pointsReellementDonnesCeCoup > 0) {
        cricketState.statsDetails[joueurActuel.id].pointsGiv[valeurBouton] += pointsReellementDonnesCeCoup;
        cricketState.statsDetails[joueurActuel.id].touchesUtiles += surplus;
      }
    }
  }
}

// SUB-LOGIQUE 2 : X01 AVEC OU SANS ÉQUIPE
function traiterCalculX01(keyStockage, joueurActuel, valeurBouton) {
  if (valeurBouton === 0) return;

  let valeurReelle = valeurBouton === 25 ? 25 : valeurBouton;
  if (valeurBouton === 25 && modificateurEnCours === 2) valeurReelle = 50;
  
  const pointsMarques = valeurReelle * modificateurEnCours;
  const scoreActuel = cricketState.scores[keyStockage];
  const scoreResultat = scoreActuel - pointsMarques;

  let estBust = false;
  if (scoreResultat < 0) {
    estBust = true; 
  } else if (scoreResultat === 1 && cricketState.x01Checkout === "double") {
    estBust = true; 
  } else if (scoreResultat === 0) {
    if (cricketState.x01Checkout === "double" && modificateurEnCours !== 2) {
      estBust = true; 
    }
  }

  if (estBust) {
    showPopup("💥 Bust", true);
    cricketState.statsDetails[joueurActuel.id].bustsCount += 1;
    
    const tirsEffectuesCeTour = cricketState.currentDart; 
    const tirsManquants = 3 - tirsEffectuesCeTour;
    cricketState.statsDetails[joueurActuel.id].dartsThrown += tirsManquants;
    
    cricketState.currentDart = 3; 
  } else {
    cricketState.scores[keyStockage] = scoreResultat;
    cricketState.statsDetails[joueurActuel.id].totalScoreScored += pointsMarques;
  }
}

document.getElementById("btnKeyUndo").onclick = () => { annulerDernierCoup(); };

function annulerDernierCoup() {
  if (cricketState.history.length === 0) return showPopup("Aucun coup à effacer.", true);
  const precedentState = cricketState.history.pop();
  cricketState.scores = precedentState.scores; 
  cricketState.marks = precedentState.marks;
  cricketState.revealedTargets = precedentState.revealedTargets; 
  cricketState.currentTurnDartsText = precedentState.currentTurnDartsText;
  cricketState.statsDetails = precedentState.statsDetails; 
  cricketState.currentPlayerIdx = precedentState.currentPlayerIdx;
  cricketState.currentDart = precedentState.currentDart; 
  cricketState.currentTurn = precedentState.currentTurn;
  cricketState.lastTurnText = precedentState.lastTurnText;
  
  resetModifierUI(); 
  if (cricketState.gameMode === "x01") {
    renderKeyboardX01(); renderGridX01();
  } else {
    renderKeyboard(); renderGrid();
  }
  updateTurnHeader();
}

function verifierConditionsFinMatch() {
  let gagnantId = null;
  let clesEntites = Object.keys(cricketState.scores);
  
  if (cricketState.gameMode === "x01") {
    for (let k of clesEntites) {
      if (cricketState.scores[k] === 0) { gagnantId = k; break; }
    }
  } else {
    for (let k of clesEntites) {
      let aToutFerme = cricketState.targets.every(t => cricketState.marks[k][t] >= 3);
      if (aToutFerme) {
        let scoreCourant = cricketState.scores[k];
        let estLeader = clesEntites.every(autreKey => scoreCourant >= cricketState.scores[autreKey]);
        if (estLeader) { gagnantId = k; break; }
      }
    }
    if (!gagnantId && cricketState.currentTurn > cricketState.maxTurns && cricketState.maxTurns !== 999) {
      let meilleurScore = -Infinity;
      clesEntites.forEach(k => {
        if (cricketState.scores[k] > meilleurScore) { 
          meilleurScore = cricketState.scores[k]; 
          gagnantId = k; 
        }
      });
    }
  }

  if (gagnantId) {
    clearInterval(cricketState.timerInterval);
    
    let nomVainqueur = "Inconnu";
    if(cricketState.isTeamMode) {
      let eqTrouvee = listeEquipesFormees.find(e => e.id === gagnantId);
      if(eqTrouvee) nomVainqueur = eqTrouvee.name;
    } else {
      let pTrouve = cricketState.players.find(p => p.id === gagnantId);
      if(pTrouve) nomVainqueur = pTrouve.name;
    }

    setTimeout(() => {
      const confirmation = confirm(`${nomVainqueur} remporte la partie ! Valider le résultat ?`);
      if (confirmation) { 
        lancerPageVictoire(gagnantId, nomVainqueur); 
      } else { 
        annulerDernierCoup(); 
        cricketState.timerInterval = setInterval(updateTimer, 1000); 
      }
    }, 100);
  }
}

function lancerPageVictoire(gagnantId, nomVainqueur) {
  document.getElementById("victoryTitle").innerText = `${nomVainqueur} gagne la partie !`;
  document.getElementById("victorySubtitle").innerText = `Match bouclé en ${document.getElementById("gameTimerDisplay").innerText}`;
  
  // Tri pour podium
  let classementTrie = [];
  if (cricketState.isTeamMode) {
    listeEquipesFormees.forEach(eq => { classementTrie.push({ id: eq.id, name: eq.name }); });
  } else {
    cricketState.players.forEach(p => { classementTrie.push({ id: p.id, name: p.name }); });
  }

  classementTrie.sort((a, b) => {
    if (cricketState.gameMode === "x01") return cricketState.scores[a.id] - cricketState.scores[b.id];
    return cricketState.scores[b.id] - cricketState.scores[a.id];
  });
  
  const containerRanking = document.getElementById("finalRankingList");
  containerRanking.innerHTML = "";

  classementTrie.forEach((entite, idx) => {
    const row = document.createElement("div"); row.className = "stat-row"; row.style.padding = "10px";
    row.style.background = entite.id === gagnantId ? "rgba(192,101,42,0.15)" : "rgba(255,255,255,0.02)";
    row.style.borderRadius = "12px";
    row.innerHTML = `<span><strong>#${idx + 1}</strong> — 👤 ${entite.name}</span><span style="color:var(--primary-strong); font-weight:800;">${cricketState.scores[entite.id]} pts</span>`;
    containerRanking.appendChild(row);
  });

  db.collection("games_history").add({
    type: cricketState.gameMode, winner: nomVainqueur, duration: cricketState.elapsedTime, createdAt: Date.now()
  }).catch(e => console.error(e));
  
  showScreen(screens.gameOver);
}

document.getElementById("btnGoHomeAfterMatch").onclick = () => showScreen(screens.home);
document.getElementById("btnGoHomeAfterStats").onclick = () => showScreen(screens.home);

document.getElementById("btnRematch").onclick = () => {
  // Réordonner la ligne de tir selon la configuration précédente
  if (cricketState.gameMode === "x01") {
    demarrerMatchX01(cricketState.players);
  } else {
    demarrerMatchCricket(cricketState.players);
  }
};

document.getElementById("btnGoToStats").onclick = () => { 
  if (cricketState.isTeamMode) {
    showPopup("Statistiques MPR individuelles indisponibles en équipe.");
  } else if (cricketState.gameMode === "x01") {
    showPopup("Statistiques détaillées indisponibles pour le X01.");
  } else {
    genererTableauStatistiques(); 
    showScreen(screens.matchStats); 
  }
};
document.getElementById("btnBackToPodium").onclick = () => showScreen(screens.gameOver);

function genererTableauStatistiques() {
  const table = document.getElementById("matchStatsTable"); table.innerHTML = "";
  const rowHeader = document.createElement("tr"); rowHeader.style.background = "rgba(255,255,255,0.03)";
  let html = `<th style="text-align:left; padding:10px 8px; border-bottom:2px solid var(--divider);">Critères</th>`;
  cricketState.players.forEach(p => { html += `<th style="font-weight:bold; padding:10px 6px; border-bottom:2px solid var(--divider); border-left:1px solid var(--divider);">${p.name}</th>`; });
  rowHeader.innerHTML = html; table.appendChild(rowHeader);

  const rowMpr = document.createElement("tr"); rowMpr.style.borderBottom = "1px solid var(--divider)";
  let mprHtml = `<td style="text-align:left; padding:10px 8px; font-weight:bold; color:var(--accent);">MPR (Efficace)</td>`;
  cricketState.players.forEach(p => {
    const totalTouchesUtiles = cricketState.statsDetails[p.id].touchesUtiles || 0;
    const totalDarts = cricketState.statsDetails[p.id].dartsThrown || 1;
    const mpr = ((totalTouchesUtiles / totalDarts) * 3).toFixed(2); 
    mprHtml += `<td style="font-weight:700; border-left:1px solid var(--divider); color:var(--primary-strong);">${mpr}</td>`;
  });
  rowMpr.innerHTML = mprHtml; table.appendChild(rowMpr);

  cricketState.targets.forEach(cible => {
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
  if (confirm("Abandonner le match en cours ?")) { 
    clearInterval(cricketState.timerInterval); 
    showScreen(screens.home); 
  }
});