// ================== INITIALISATION & VUES ==================
const screens = {
  loading: document.getElementById("loadingScreen"),
  login: document.getElementById("loginScreen"),
  home: document.getElementById("homeScreen"),
  newGame: document.getElementById("newGameScreen"),
  account: document.getElementById("accountScreen"),
  cricket: document.getElementById("cricketScreen"),
  gameOver: document.getElementById("gameOverScreen"),
  matchStats: document.getElementById("statsMatchScreen"),
  history: document.getElementById("historyScreen")
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

// Fonction pour ouvrir la boîte de dialogue stylisée (Renvoie Promise true/false)
function openCustomModal(title, message) {
  return new Promise((resolve) => {
    const overlay = document.getElementById("customModalOverlay");
    const titleEl = document.getElementById("customModalTitle");
    const msgEl = document.getElementById("customModalMessage");
    const btnConfirm = document.getElementById("customModalBtnConfirm");
    const btnCancel = document.getElementById("customModalBtnCancel");

    titleEl.innerText = title;
    msgEl.innerText = message;
    overlay.classList.remove("hidden");

    btnConfirm.onclick = () => {
      overlay.classList.add("hidden");
      resolve(true);
    };

    btnCancel.onclick = () => {
      overlay.classList.add("hidden");
      resolve(false);
    };
  });
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
["menuPlayers", "menuRanking", "menuTraining", "menuTournament"].forEach(id => {
  document.getElementById(id).addEventListener("click", () => { showPopup("Arrive dans la prochaine mise à jour !"); });
});

// Navigation vers l'historique
document.getElementById("menuHistory").addEventListener("click", () => {
  showScreen(screens.history);
  chargerHistoriqueParties();
});
document.getElementById("backHomeFromHistoryBtn").addEventListener("click", () => showScreen(screens.home));

document.getElementById("btnKeyZero").onclick = () => taperChiffre(0);

// ================== CONFIGURATION FIREBASE ==================
const auth = firebase.auth();
const db = firebase.firestore();
let communautéActiveId = null; 
let listeMesCommunautes = [];

auth.onAuthStateChanged(async (user) => {
  if (screens.loading) screens.loading.classList.add("hidden");

  if (user) {
    try {
      // 1. Récupérer ou initialiser le profil du joueur réel connecté
      const doc = await db.collection("players").doc(user.uid).get();
      let displayName = user.email ? user.email.split('@')[0] : "Joueur";
      let defaultCommunity = null;

      if (doc.exists) {
        if (doc.data().name) displayName = doc.data().name;
        if (doc.data().defaultCommunity) defaultCommunity = doc.data().defaultCommunity;
      } else {
        // Initialisation si premier compte
        await db.collection("players").doc(user.uid).set({
          email: user.email,
          name: displayName,
          createdAt: Date.now(),
          defaultCommunity: null,
          isRealAccount: true
        });
      }
      
      const nameDisplay = document.getElementById("playerNameDisplay");
      if (nameDisplay) {
        nameDisplay.innerText = displayName;
      }
      
      // 2. Charger les communautés de l'utilisateur et définir la communauté active
      await chargerCommunautesUtilisateur(user.uid, defaultCommunity);

      // Si l'utilisateur n'a aucune communauté, on le force à aller sur l'onglet compte pour en créer/rejoindre une
      if (listeMesCommunautes.length === 0) {
        showScreen(screens.account);
        showPopup("👋 Bienvenue ! Crée ou rejoins une communauté pour commencer à jouer.", false);
      } else {
        showScreen(screens.home);
      }
    } catch(e) {
      console.error("Erreur d'initialisation au démarrage:", e);
      showScreen(screens.home);
    }
  } else {
    showScreen(screens.login);
  }
});

async function chargerCommunautesUtilisateur(userId, defaultId) {
  listeMesCommunautes = [];
  try {
    const snap = await db.collection("communities")
                          .where("memberIds", "array-contains", userId)
                          .get();
    
    snap.forEach(doc => {
      listeMesCommunautes.push({ id: doc.id, ...doc.data() });
    });

    // Détermination de la communauté active par défaut
    if (listeMesCommunautes.length > 0) {
      const existeToujours = listeMesCommunautes.some(c => c.id === defaultId);
      communautéActiveId = existeToujours ? defaultId : listeMesCommunautes[0].id;
    } else {
      communautéActiveId = null;
    }
  } catch (error) {
    console.error("Erreur lors du chargement des communautés:", error);
  }
}

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

// Variable pour savoir quelle communauté est actuellement ciblée sur l'écran Nouvelle Partie
let communauteCibleMatchId = null;

async function initPageNouvellePartie() {
  joueursSelectionnesMatch = [];
  document.getElementById("teamModeCheckbox").checked = false;
  document.getElementById("teamModeConfig").classList.add("hidden");
  document.getElementById("teamCountSelect").value = "2";
  
  // Par défaut, on cible la communauté sélectionnée par défaut
  communauteCibleMatchId = communautéActiveId;

  // Remplir le menu déroulant unique
  const selectCommu = document.getElementById("selectCommuMatch");
  selectCommu.innerHTML = "";
  
  listeMesCommunautes.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.innerText = c.name;
    if (c.id === communautéActiveId) opt.selected = true;
    selectCommu.appendChild(opt);
  });

  // Si l'utilisateur change de communauté, on met à jour la variable cible
  selectCommu.onchange = (e) => {
    communauteCibleMatchId = e.target.value;
  };

  // Ajouter automatiquement l'utilisateur connecté sur la ligne de tir
  const user = auth.currentUser;
  if (user) {
    try {
      const doc = await db.collection("players").doc(user.uid).get();
      const currentName = (doc.exists && doc.data().name) ? doc.data().name : user.email.split('@')[0];
      // Sécurité : On s'assure de pousser le VRAI uid de l'user connecté
      joueursSelectionnesMatch.push({ id: user.uid, name: currentName });
    } catch(e) {
      joueursSelectionnesMatch.push({ id: user.uid, name: user.email.split('@')[0] });
    }
  }
  
  renderSelectedPlayers();
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
  
  if (!communauteCibleMatchId) {
    return showPopup("⚠️ Sélectionne ou rejoins une communauté avant de lancer un match.", true);
  }
  cricketState.communityId = communauteCibleMatchId;

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

  const selectTours = document.getElementById("gameTurnsSelect");
  cricketState.maxTurns = selectTours ? parseInt(selectTours.value, 10) : 20;
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
    cricketState.statsDetails[p.id] = { 
      dartsThrown: 0, 
      touchesUtiles: 0, 
      touchesNum: {}, 
      pointsGiv: {}, 
      totalPointsGiven: 0,
      maxPointsGivenInOneVolley: 0, 
      currentVolleyPointsGiven: 0, 
      doublesCount: {}, 
      triplesCount: {} 
    };
    cricketState.targets.forEach(t => {
      cricketState.statsDetails[p.id].touchesNum[t] = 0;
      cricketState.statsDetails[p.id].pointsGiv[t] = 0;
      cricketState.statsDetails[p.id].doublesCount[t] = 0;
      cricketState.statsDetails[p.id].triplesCount[t] = 0;
    });
  });

  lancerInterfaceJeu("cricket");
}

function demarrerMatchX01(listeJoueurs) {
  cricketState.gameMode = "x01";
  initVariablesMatchGenerales(listeJoueurs);
  
  const selectPoints = document.getElementById("x01StartPointsSelect");
  const selectCheckout = document.getElementById("x01CheckoutSelect");

  cricketState.x01StartPoints = selectPoints ? parseInt(selectPoints.value, 10) : 301;
  cricketState.x01Checkout = selectCheckout ? selectCheckout.value : "double";
  cricketState.maxTurns = 999; 

  cricketState.players.forEach(p => {
    const keyStockage = cricketState.isTeamMode ? p.teamId : p.id;
    cricketState.scores[keyStockage] = cricketState.x01StartPoints;
    cricketState.statsDetails[p.id] = { 
      dartsThrown: 0, 
      totalScoreScored: 0, 
      bustsCount: 0,
      maxVolleyScore: 0,
      currentVolleyScore: 0,
      first9DartsScore: 0,
      scoreFamily50: 0,
      scoreFamily100: 0,
      scoreFamily140: 0,
      scoreFamily180: 0,
      checkoutHits: 0,
      touchesNum: {}
    };
    for (let i = 1; i <= 20; i++) cricketState.statsDetails[p.id].touchesNum[i] = 0;
    cricketState.statsDetails[p.id].touchesNum[25] = 0;
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
  if (cricketState.gameMode === "cricket" && cricketState.statsDetails[joueur.id]) {
    const stats = cricketState.statsDetails[joueur.id];
    if (stats.currentVolleyPointsGiven > stats.maxPointsGivenInOneVolley) {
      stats.maxPointsGivenInOneVolley = stats.currentVolleyPointsGiven;
    }
    stats.currentVolleyPointsGiven = 0; // Reset pour son prochain tour
  }
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
    
    const stats = cricketState.statsDetails[joueurActuel.id];

    // Enregistrement des doubles et triples (hors Bull pour les triples selon les règles standard)
    if (modificateurEnCours === 2) stats.doublesCount[valeurBouton] += 1;
    if (modificateurEnCours === 3 && valeurBouton !== 25) stats.triplesCount[valeurBouton] += 1;

    // Vérification de fermeture globale
    let clesEntites = Object.keys(cricketState.scores);
    const estFermePourTous = clesEntites.every(k => cricketState.marks[k][valeurBouton] >= 3);
    if (!estFermePourTous) {
      stats.touchesNum[valeurBouton] += modificateurEnCours;
    }
    
    let touchesPrecedentes = cricketState.marks[keyStockage][valeurBouton];
    let touchesRestantes = 3 - touchesPrecedentes;
    let touchesAppliquees = Math.min(modificateurEnCours, touchesRestantes);
    cricketState.marks[keyStockage][valeurBouton] += touchesAppliquees;
    stats.touchesUtiles += touchesAppliquees;
    
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
        stats.pointsGiv[valeurBouton] += pointsReellementDonnesCeCoup;
        stats.touchesUtiles += surplus;
        
        // Cumul des points donnés au global et pour la volée en cours
        stats.totalPointsGiven += pointsReellementDonnesCeCoup;
        stats.currentVolleyPointsGiven += pointsReellementDonnesCeCoup;
      }
    }
  }
}

function traiterCalculX01(keyStockage, joueurActuel, valeurBouton) {
  const stats = cricketState.statsDetails[joueurActuel.id];

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

  // --- SUIVI PRÉCIS DES IMPACTS X01 (Sécurisé ici) ---
  if (valeurBouton !== 0 && stats) {
    stats.touchesNum[valeurBouton] += modificateurEnCours;
    
    // Si ce coup fait tomber le score exactement à 0 (et valide le match), c'est un Checkout réussi !
    if (scoreResultat === 0 && !estBust) {
      stats.checkoutHits += 1;
    }
  }

  if (estBust) {
    showPopup("💥 Bust", true);
    if (stats) {
      stats.bustsCount += 1;
      stats.currentVolleyScore = 0;
      
      const tirsEffectuesCeTour = cricketState.currentDart; 
      const tirsManquants = 3 - tirsEffectuesCeTour;
      
      stats.dartsThrown += tirsManquants;
    }
    cricketState.currentDart = 3; 
  } else {
    cricketState.scores[keyStockage] = scoreResultat;
    if (stats) {
      stats.totalScoreScored += pointsMarques;
      stats.currentVolleyScore += pointsMarques;
      
      // Suivi du First 9 Darts (si le joueur a lancé 9 fléchettes ou moins au total)
      if (stats.dartsThrown <= 9) {
        stats.first9DartsScore += pointsMarques;
      }
    }
  }

  // Fin de la volée (3 fléchettes tirées) -> Tri dans les familles de scores
  if (cricketState.currentDart === 3 && stats) {
    const finalVolley = stats.currentVolleyScore;
    
    if (finalVolley > stats.maxVolleyScore) {
      stats.maxVolleyScore = finalVolley;
    }

    // Classification par famille de score
    if (finalVolley === 180) stats.scoreFamily180 += 1;
    else if (finalVolley >= 140) stats.scoreFamily140 += 1;
    else if (finalVolley >= 100) stats.scoreFamily100 += 1;
    else if (finalVolley >= 50) stats.scoreFamily50 += 1;

    stats.currentVolleyScore = 0; 
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

    setTimeout(async () => {
      const confirmation = await openCustomModal("🏆 Partie Terminée !", `${nomVainqueur} remporte la partie ! Souhaitez-vous valider et enregistrer ce résultat ?`);
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
    row.innerHTML = `<span><strong>#${idx + 1}</strong> — 👤 ${entite.name}</span><span style="color:var(--primary-strong); font-weight:800;"> ${cricketState.scores[entite.id]}</span>`;
    containerRanking.appendChild(row);
  });

  // On prépare un résumé propre du classement pour l'historique
  const resumeClassement = classementTrie.map((entite, idx) => {
    let donneesEntite = {
      rang: idx + 1,
      name: entite.name,
      score: cricketState.scores[entite.id]
    };

    // Si on est en mode équipe, on va chercher et stocker le nom des joueurs de cette équipe
    if (cricketState.isTeamMode) {
      const equipeComplete = listeEquipesFormees.find(e => e.id === entite.id);
      if (equipeComplete && equipeComplete.members) {
        donneesEntite.membresNoms = equipeComplete.members.map(m => m.name);
      }
    }
    return donneesEntite;
  });

  const idParticipantsMatch = joueursSelectionnesMatch.map(p => p.id);

  // Sauvegarde enrichie dans Firestore avec indexation communautaire et personnelle
  db.collection("games_history").add({
    type: cricketState.gameMode,
    winner: nomVainqueur,
    duration: cricketState.elapsedTime,
    createdAt: Date.now(),
    isTeamMode: cricketState.isTeamMode,
    maxTurns: cricketState.maxTurns,
    isBlind: cricketState.isBlind,
    x01StartPoints: cricketState.x01StartPoints,
    x01Checkout: cricketState.x01Checkout,
    classementFinal: resumeClassement,
    communityId: cricketState.communityId,
    participantIds: idParticipantsMatch
  }).then(() => {
    console.log("Match enregistré avec succès dans la communauté :", cricketState.communityId);
  })
  .catch(e => console.error("Erreur enregistrement historique :", e));
  
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
  genererTableauStatistiques(); 
  showScreen(screens.matchStats); 
};
document.getElementById("btnBackToPodium").onclick = () => showScreen(screens.gameOver);

function genererTableauStatistiques() {
  const container = document.getElementById("matchStatsTable"); 
  container.innerHTML = "";
  
  const mainWrapper = document.createElement("div");
  mainWrapper.style.padding = "0 8px 40px 8px"; // Espace en bas pour le scroll mobile
  mainWrapper.style.display = "flex";
  mainWrapper.style.flexDirection = "column";
  mainWrapper.style.gap = "20px";
  container.appendChild(mainWrapper);

  // Fonction utilitaire pour générer un bloc propre
  function creerBlocStats(titreBloc) {
    const blockDiv = document.createElement("div");
    blockDiv.style.background = "var(--card-bg)";
    blockDiv.style.border = "1px solid var(--card-border)";
    blockDiv.style.borderRadius = "var(--r-2)";
    blockDiv.style.padding = "12px";
    blockDiv.style.boxShadow = "0 4px 12px rgba(227, 212, 174, 0.05)";
    
    const h3 = document.createElement("h3");
    h3.style.textAlign = "left !important";
    h3.style.color = "var(--primary)";
    h3.style.fontSize = "16px";
    h3.style.marginBottom = "10px";
    h3.style.borderBottom = "2px solid var(--divider)";
    h3.style.paddingBottom = "6px";
    h3.innerText = titreBloc;
    
    blockDiv.appendChild(h3);
    
    const table = document.createElement("table");
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";
    table.style.fontSize = "13px";
    blockDiv.appendChild(table);
    
    return { blockDiv, table };
  }

  // Fonction pour l'entête des joueurs
  function genererEnteteJoueurs(tableTarget) {
    const rowHeader = document.createElement("tr");
    rowHeader.style.background = "rgba(255,255,255,0.02)";
    let html = `<th style="text-align:left; padding:8px; border-bottom:1px solid var(--divider); width:35%;">Joueurs</th>`;
    cricketState.players.forEach(p => {
      let nom = p.name.length > 9 ? p.name.substring(0, 9) + "." : p.name;
      if (cricketState.isTeamMode) {
        nom += ` <span style="font-size:9px; color:var(--accent); display:block;">(${p.teamName})</span>`;
      }
      html += `<th style="font-weight:700; padding:8px 4px; border-bottom:1px solid var(--divider); border-left:1px solid var(--divider); text-align:center;">${nom}</th>`;
    });
    rowHeader.innerHTML = html;
    tableTarget.appendChild(rowHeader);
  }

  // ==========================================
  // RENDU DU MODE : CRICKET
  // ==========================================
  if (cricketState.gameMode === "cricket") {
    
    // --- BLOC 1 : STATS GÉNÉRALES ---
    const blocGen = creerBlocStats("📊 Statistiques Générales");
    genererEnteteJoueurs(blocGen.table);
    
    let rowMpr = document.createElement("tr"); rowMpr.style.borderBottom = "1px solid var(--divider)";
    let mprHtml = `<td style="text-align:left; padding:10px 8px; font-weight:600; color:var(--accent);">MPR (Marques/Tour)</td>`;
    cricketState.players.forEach(p => {
      const totalTouches = cricketState.statsDetails[p.id].touchesUtiles || 0;
      const totalDarts = cricketState.statsDetails[p.id].dartsThrown || 1;
      mprHtml += `<td style="font-weight:700; text-align:center; border-left:1px solid var(--divider); color:var(--primary-strong); font-size:14px;">${((totalTouches / totalDarts) * 3).toFixed(2)}</td>`;
    });
    rowMpr.innerHTML = mprHtml; blocGen.table.appendChild(rowMpr);

    let rowTotPts = document.createElement("tr"); rowTotPts.style.borderBottom = "1px solid var(--divider)";
    let totPtsHtml = `<td style="text-align:left; padding:10px 8px; font-size:13px;">Total points infligés</td>`;
    cricketState.players.forEach(p => {
      totPtsHtml += `<td style="text-align:center; border-left:1px solid var(--divider); font-weight:700; color:var(--danger);">${cricketState.statsDetails[p.id].totalPointsGiven || 0} pts</td>`;
    });
    rowTotPts.innerHTML = totPtsHtml; blocGen.table.appendChild(rowTotPts);

    let rowMaxPts = document.createElement("tr"); rowMaxPts.style.borderBottom = "1px solid var(--divider)";
    let maxPtsHtml = `<td style="text-align:left; padding:10px 8px; font-size:13px; color:var(--text-soft);">Max infligé en 1 volée</td>`;
    cricketState.players.forEach(p => {
      maxPtsHtml += `<td style="text-align:center; border-left:1px solid var(--divider); font-weight:600;">⚡ ${cricketState.statsDetails[p.id].maxPointsGivenInOneVolley || 0}</td>`;
    });
    rowMaxPts.innerHTML = maxPtsHtml; blocGen.table.appendChild(rowMaxPts);
    mainWrapper.appendChild(blocGen.blockDiv);

    // --- BLOC 2 : ANALYSE PAR TARGET ---
    const blocZone = creerBlocStats("🎯 Performance par Zone");
    genererEnteteJoueurs(blocZone.table);

    cricketState.targets.forEach(cible => {
      const libelleCible = cible === 25 ? "🎯 Bull" : `🎯 Zone ${cible}`;
      let row = document.createElement("tr"); row.style.borderBottom = "1px solid var(--divider)";
      let rowHtml = `<td style="text-align:left; padding:8px; font-weight:600;">${libelleCible}</td>`;
      
      cricketState.players.forEach(p => {
        const tNum = cricketState.statsDetails[p.id].touchesNum[cible] || 0;
        const dCount = cricketState.statsDetails[p.id].doublesCount[cible] || 0;
        const tCount = cricketState.statsDetails[p.id].triplesCount[cible] || 0;
        const pGiv = cricketState.statsDetails[p.id].pointsGiv[cible] || 0;

        let txtBonus = [];
        if (dCount > 0) txtBonus.push(`${dCount}D`);
        if (tCount > 0) txtBonus.push(`${tCount}T`);
        let subText = txtBonus.length > 0 ? `<br><span style="font-size:10px; color:#28a745;">(${txtBonus.join(' / ')})</span>` : '';
        let penaliteText = pGiv > 0 ? `<br><span style="font-size:10px; color:var(--danger); font-weight:700;">+${pGiv} pts</span>` : '';

        rowHtml += `<td style="text-align:center; border-left:1px solid var(--divider); padding:6px 2px;"><strong>${tNum} hit${tNum > 1 ? 's' : ''}</strong>${subText}${penaliteText}</td>`;
      });
      row.innerHTML = rowHtml; blocZone.table.appendChild(row);
    });
    mainWrapper.appendChild(blocZone.blockDiv);

    // --- BLOC 3 : LA GRILLE SOUVENIR DU MATCH (NEW) ---
    const blocGrille = creerBlocStats("🏁 Grille de Fin de Match");
    genererEnteteJoueurs(blocGrille.table);

    cricketState.targets.forEach(t => {
      let row = document.createElement("tr");
      row.style.borderBottom = "1px solid var(--divider)";
      let libelle = t === 25 ? "B" : t;
      let rowHtml = `<td style="text-align:left; padding:10px 8px; font-weight:700; color:var(--primary);">${libelle}</td>`;

      cricketState.players.forEach(p => {
        // En mode équipe, on va chercher l'état des marques de l'équipe du joueur
        const keyGrille = cricketState.isTeamMode ? p.teamId : p.id;
        const touches = cricketState.marks[keyGrille][t];
        let symbole = "-";

        if (touches === 1) symbole = `<span style="font-size:16px; font-weight:900; font-family:monospace;">\\</span>`;
        else if (touches === 2) symbole = `<span style="font-size:16px; font-weight:900; font-family:monospace;">X</span>`;
        else if (touches >= 3) {
          symbole = `<span style="display:inline-block; border: 2px solid #ff3838; border-radius: 50%; width: 20px; height: 20px; line-height: 16px; font-weight: 900; color: #ff3838; text-align:center; font-family: monospace; font-size:11px; background: rgba(255,56,56,0.05);">X</span>`;
        }
        rowHtml += `<td style="text-align:center; border-left:1px solid var(--divider); padding:6px 2px;">${symbole}</td>`;
      });
      row.innerHTML = rowHtml;
      blocGrille.table.appendChild(row);
    });
    mainWrapper.appendChild(blocGrille.blockDiv);

  // ==========================================
  // RENDU DU MODE : X01
  // ==========================================
  } else {
    
    // --- BLOC 1 : STATS GÉNÉRALES ---
    const blocGenX = creerBlocStats("📊 Statistiques Générales");
    genererEnteteJoueurs(blocGenX.table);

    let rowMoy = document.createElement("tr"); rowMoy.style.borderBottom = "1px solid var(--divider)";
    let moyHtml = `<td style="text-align:left; padding:10px 8px; font-weight:600; color:var(--accent);">Moyenne / Volée (3 darts)</td>`;
    cricketState.players.forEach(p => {
      const totalPoints = cricketState.statsDetails[p.id].totalScoreScored || 0;
      const totalDarts = cricketState.statsDetails[p.id].dartsThrown || 1;
      moyHtml += `<td style="font-weight:700; text-align:center; border-left:1px solid var(--divider); color:var(--primary-strong); font-size:14px;">${((totalPoints / totalDarts) * 3).toFixed(1)} pts</td>`;
    });
    rowMoy.innerHTML = moyHtml; blocGenX.table.appendChild(rowMoy);

    let rowF9 = document.createElement("tr"); rowF9.style.borderBottom = "1px solid var(--divider)";
    let f9Html = `<td style="text-align:left; padding:10px 8px; font-size:13px; color:var(--text-soft); font-weight:600;">First 9 Darts Ø (Scoring)</td>`;
    cricketState.players.forEach(p => {
      const scoreF9 = cricketState.statsDetails[p.id].first9DartsScore || 0;
      f9Html += `<td style="text-align:center; border-left:1px solid var(--divider); font-weight:600; color:var(--text-soft);">${(scoreF9 / 3).toFixed(1)} pts</td>`;
    });
    rowF9.innerHTML = f9Html; blocGenX.table.appendChild(rowF9);

    let rowMaxX = document.createElement("tr"); rowMaxX.style.borderBottom = "1px solid var(--divider)";
    let maxXHtml = `<td style="text-align:left; padding:10px 8px; font-size:13px;">Meilleure volée</td>`;
    cricketState.players.forEach(p => {
      maxXHtml += `<td style="text-align:center; border-left:1px solid var(--divider); font-weight:700; color:#28a745;">⚡ ${cricketState.statsDetails[p.id].maxVolleyScore || 0}</td>`;
    });
    rowMaxX.innerHTML = maxXHtml; blocGenX.table.appendChild(rowMaxX);

    let rowBustX = document.createElement("tr"); rowBustX.style.borderBottom = "1px solid var(--divider)";
    let bustXHtml = `<td style="text-align:left; padding:10px 8px; font-size:13px; color:var(--danger);">Nombre de Busts 💥</td>`;
    cricketState.players.forEach(p => {
      bustXHtml += `<td style="text-align:center; border-left:1px solid var(--divider); font-weight:600; color:var(--danger);">${cricketState.statsDetails[p.id].bustsCount || 0}</td>`;
    });
    rowBustX.innerHTML = bustXHtml; blocGenX.table.appendChild(rowBustX);

    mainWrapper.appendChild(blocGenX.blockDiv);

    // --- BLOC 2 : RÉPARTITION DES VOLÉES (FAMILLES) ---
    const blocFamily = creerBlocStats("🔥 Répartition des Volées");
    genererEnteteJoueurs(blocFamily.table);

    const familles = [
      { key: 'scoreFamily50', label: 'Volées 50+' },
      { key: 'scoreFamily100', label: 'Volées 100+ 🚀' },
      { key: 'scoreFamily140', label: 'Volées 140+ ✈️' },
      { key: 'scoreFamily180', label: 'Graal TON 180 👑' }
    ];

    familles.forEach(f => {
      let row = document.createElement("tr"); row.style.borderBottom = "1px solid var(--divider)";
      let fHtml = `<td style="text-align:left; padding:10px 8px; font-weight:600;">${f.label}</td>`;
      cricketState.players.forEach(p => {
        const count = cricketState.statsDetails[p.id][f.key] || 0;
        fHtml += `<td style="text-align:center; border-left:1px solid var(--divider); font-weight:${count > 0 ? '700' : 'normal'}; color:${count > 0 ? 'var(--text-main)' : '#ccc'};">${count}</td>`;
      });
      row.innerHTML = fHtml; blocFamily.table.appendChild(row);
    });
    mainWrapper.appendChild(blocFamily.blockDiv);

    // --- BLOC 3 : COMPTEUR D'IMPACTS ET % PRÉFÉRENCE (NEW) ---
    const blocHits = creerBlocStats("🎯 Fréquence des Tirs (Chiffres préférés)");
    genererEnteteJoueurs(blocHits.table);

    // Ligne spéciale pour le OUT (Bouton fermeture réussi)
    let rowOut = document.createElement("tr");
    rowOut.style.borderBottom = "2px solid var(--divider)";
    rowOut.style.background = "rgba(40, 167, 69, 0.04)";
    let outHtml = `<td style="text-align:left; padding:10px 8px; font-weight:700; color:#28a745;">🎯 Finition (Out)</td>`;
    cricketState.players.forEach(p => {
      const outHits = cricketState.statsDetails[p.id].checkoutHits || 0;
      outHtml += `<td style="text-align:center; border-left:1px solid var(--divider); font-weight:700; color:#28a745;">${outHits} hit${outHits > 1 ? 's' : ''}</td>`;
    });
    rowOut.innerHTML = outHtml;
    blocHits.table.appendChild(rowOut);

    // On prépare la liste complète : de 20 jusqu'à 1, puis le Bull (25)
    let chiffresAles = [];
    for(let i = 20; i >= 1; i--) chiffresAles.push(i);
    chiffresAles.push(25);

    chiffresAles.forEach(num => {
      // On vérifie d'abord si au moins un des joueurs a touché ce chiffre pour ne pas afficher 20 lignes vides inutiles
      const estUtile = cricketState.players.some(p => (cricketState.statsDetails[p.id].touchesNum[num] || 0) > 0);
      if (!estUtile) return; // Si personne n'a tiré dessus, on passe au chiffre suivant (plus propre sur mobile)

      let rowNum = document.createElement("tr");
      rowNum.style.borderBottom = "1px solid var(--divider)";
      let libelleNum = num === 25 ? "Zone Bull" : `Zone ${num}`;
      let rowNumHtml = `<td style="text-align:left; padding:8px; font-weight:600;">${libelleNum}</td>`;

      cricketState.players.forEach(p => {
        const stats = cricketState.statsDetails[p.id];
        const hits = stats.touchesNum[num] || 0;
        
        // Calcul du % par rapport au nombre total de touches réussies de ce joueur
        let totalHitsJoueur = 0;
        Object.values(stats.touchesNum).forEach(v => totalHitsJoueur += v);
        
        let pourcentage = 0;
        if (totalHitsJoueur > 0 && hits > 0) {
          pourcentage = Math.round((hits / totalHitsJoueur) * 100);
        }

        if (hits > 0) {
          rowNumHtml += `<td style="text-align:center; border-left:1px solid var(--divider); padding:8px 4px;"><strong>${hits}</strong> <span style="font-size:11px; color:var(--text-soft); font-weight:600;"><br>(${pourcentage}%)</span></td>`;
        } else {
          rowNumHtml += `<td style="text-align:center; border-left:1px solid var(--divider); color:#ccc;">-</td>`;
        }
      });

      rowNum.innerHTML = rowNumHtml;
      blocHits.table.appendChild(rowNum);
    });

    mainWrapper.appendChild(blocHits.blockDiv);
  }
}

document.getElementById("btnLeaveGame").addEventListener("click", async () => {
  const quitter = await openCustomModal("🏃‍♂️ Abandonner ?", "Êtes-vous sûr de vouloir quitter le match en cours ? Il ne sera pas pris en compte");
  if (quitter) { 
    clearInterval(cricketState.timerInterval); 
    showScreen(screens.home); 
  }
});

// Fonction d'entrée appelée quand on clique sur l'historique depuis l'accueil
async function chargerHistoriqueParties() {
  const selectFiltre = document.getElementById("selectFiltreHistorique");
  if (!selectFiltre) return;

  // 1. On construit dynamiquement les options du filtre selon les communautés réelles de l'utilisateur
  selectFiltre.innerHTML = "";
  
  // Option 1 : Le Tout-en-un (Vue par défaut)
  const optTous = document.createElement("option");
  optTous.value = "tous";
  optTous.innerText = "🌐 Tout (Moi & Communautés)";
  selectFiltre.appendChild(optTous);

  // Option 2 : Uniquement mes parties à moi
  const optPerso = document.createElement("option");
  optPerso.value = "perso";
  optPerso.innerText = "👤 Mes parties uniquement";
  selectFiltre.appendChild(optPerso);

  // Options suivantes : Une option par communauté dont je fais partie
  listeMesCommunautes.forEach(commu => {
    const opt = document.createElement("option");
    opt.value = `commu-${commu.id}`;
    opt.innerText = `👥 ${commu.name}`;
    selectFiltre.appendChild(opt);
  });

  // Configurer l'écouteur de changement de filtre s'il n'est pas déjà mis
  selectFiltre.onchange = () => {
    executerRenduHistoriqueFiltre(selectFiltre.value);
  };

  // 2. Lancement initial avec la vue globale "Tous"
  await executerRenduHistoriqueFiltre("tous");
}

// Moteur de requêtes et affichage de l'historique avec filtrage
async function executerRenduHistoriqueFiltre(typeFiltre) {
  const container = document.getElementById("historyContainer");
  const user = auth.currentUser;
  if (!user) return;

  container.innerHTML = "<p class='hint' style='text-align:center; padding:20px;'>Chargement de l'historique...</p>";
  
  const unMoisEnMillisecondes = 30 * 24 * 60 * 60 * 1000;
  const dateLimite = Date.now() - unMoisEnMillisecondes;

  try {
    let matchesFiltres = [];

    // SCÉNARIO 1 : L'utilisateur veut TOUT voir (Ses matchs + les matchs de ses communautés)
    if (typeFiltre === "tous") {
      // Pour éviter les limitations Firebase, on récupère l'historique récent du mois (max 100 parties pour la performance)
      const snapGlobal = await db.collection("games_history")
                                  .orderBy("createdAt", "desc")
                                  .limit(100)
                                  .get();

      // On extrait la liste des ID des communautés de l'utilisateur pour le filtre local
      const mesIdsCommu = listeMesCommunautes.map(c => c.id);

      snapGlobal.forEach(doc => {
        const d = doc.data();
        // Une partie est gardée si elle date de moins de 30 jours ET (soit l'user a joué, soit elle appartient à une de ses commus)
        if (d.createdAt >= dateLimite) {
          const jAiParticipe = d.participantIds && d.participantIds.includes(user.uid);
          const appartientAMaCommu = d.communityId && mesIdsCommu.includes(d.communityId);
          
          if (jAiParticipe || appartientAMaCommu) {
            matchesFiltres.push({ id: doc.id, ...d });
          }
        }
      });

    // SCÉNARIO 2 : L'utilisateur veut uniquement ses parties à lui
    } else if (typeFiltre === "perso") {
      const snapPerso = await db.collection("games_history")
                                  .where("participantIds", "array-contains", user.uid)
                                  .orderBy("createdAt", "desc")
                                  .get();
      snapPerso.forEach(doc => {
        if (doc.data().createdAt >= dateLimite) {
          matchesFiltres.push({ id: doc.id, ...doc.data() });
        }
      });

    // SCÉNARIO 3 : L'utilisateur a ciblé une communauté précise (commu-XXXXXX)
    } else if (typeFiltre.startsWith("commu-")) {
      const targetCommuId = typeFiltre.replace("commu-", "");
      const snapCommu = await db.collection("games_history")
                                  .where("communityId", "==", targetCommuId)
                                  .orderBy("createdAt", "desc")
                                  .get();
      snapCommu.forEach(doc => {
        if (doc.data().createdAt >= dateLimite) {
          matchesFiltres.push({ id: doc.id, ...doc.data() });
        }
      });
    }

    // --- RENDU GRAPHIQUE DES MATCHS FILTRÉS ---
    container.innerHTML = "";

    if (matchesFiltres.length === 0) {
      container.innerHTML = `<p class='hint' style='text-align:center; padding:20px;'>Aucune partie trouvée dans cette section ces 30 derniers jours 🎯</p>`;
      return;
    }

    // Tri de sécurité par date décroissante au cas où le filtrage local aurait bousculé l'ordre
    matchesFiltres.sort((a, b) => b.createdAt - a.createdAt);

    matchesFiltres.forEach(d => {
      const card = document.createElement("div");
      card.className = "card";
      card.style.marginBottom = "4px"; 

      const datePartie = new Date(d.createdAt);
      const dateFormatee = datePartie.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
      const heureFormatee = datePartie.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
      const dureeFormatee = `${String(Math.floor((d.duration || 0) / 60)).padStart(2, "0")}:${String((d.duration || 0) % 60).padStart(2, "0")}`;

      let libelleMode = d.type === "x01" ? "💯 X01" : "🏏 Cricket";
      
      // Trouver le nom de la communauté de cette partie pour l'afficher en label contextuel
      let nomCommuLabel = "";
      if (d.communityId) {
        const commuTrouvee = listeMesCommunautes.find(c => c.id === d.communityId);
        if (commuTrouvee) nomCommuLabel = ` • 👥 ${commuTrouvee.name}`;
      }

      let detailsParametres = d.type === "x01" ? `${d.x01StartPoints || 301} pts • ${d.x01Checkout === "double" ? "Double-Out" : "Sans contrainte"}` : `${d.maxTurns === 999 ? "Sans limite" : (d.maxTurns || 20) + ' tours'} ${d.isBlind ? "• Mode n'a qu'un œil" : ""}`;
      if (d.isTeamMode) detailsParametres += " • En Équipe";
      detailsParametres += nomCommuLabel;

      let htmlContenu = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; border-bottom: 1px solid var(--divider); padding-bottom: 8px;">
          <div style="text-align: left;">
            <h3 style="text-align: left !important; margin: 0; color: var(--primary-strong); font-size: 17px;">${libelleMode}</h3>
            <span style="font-size: 11px; color: var(--text-soft); font-weight: 600;">${detailsParametres}</span>
          </div>
          <div style="text-align: right; font-size: 11px; color: var(--text-main); font-weight: 600;">
            <div>📅 ${dateFormatee}</div>
            <div style="color: var(--accent); margin-top: 2px;">⏱️ ${dureeFormatee} à ${heureFormatee}</div>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 10px;">
      `;

      if (d.classementFinal && Array.isArray(d.classementFinal)) {
        d.classementFinal.forEach(j => {
          const estGagnant = j.rang === 1;
          htmlContenu += `
            <div style="display: flex; flex-direction: column; padding: 6px; background: ${estGagnant ? 'rgba(154, 123, 28, 0.08)' : 'transparent'}; border-radius: 8px; margin-bottom: 2px;">
              <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                <span style="font-size: 14px; ${estGagnant ? 'font-weight: 700; color: var(--accent);' : 'color: var(--text-main);'}">
                  ${estGagnant ? '👑' : ` #` + j.rang} — ${j.name}
                </span>
                <strong style="font-size: 14px; color: var(--primary-strong);">${j.score} pts</strong>
              </div>
          `;
          if (d.isTeamMode && j.membresNoms && Array.isArray(j.membresNoms)) {
            htmlContenu += `
              <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; padding-left: 20px;">
                ${j.membresNoms.map(m => `<span style="font-size: 11px; background: ${estGagnant ? 'rgba(227, 212, 174, 0.4)' : 'rgba(0, 0, 0, 0.04)'}; color: ${estGagnant ? 'var(--accent)' : 'var(--text-soft)'}; padding: 2px 8px; border-radius: 4px; font-weight: 600;">👤 ${m}</span>`).join('')}
              </div>
            `;
          }
          htmlContenu += `</div>`;
        });
      }
      htmlContenu += `</div>`;
      card.innerHTML = htmlContenu;
      container.appendChild(card);
    });

  } catch (error) {
    console.error("Erreur lors de la filtration de l'historique:", error);
    container.innerHTML = "<p class='hint' style='text-align:center; padding:20px; color:var(--danger);'>Erreur d'accès à l'historique.</p>";
  }
}

// Variable pour savoir si le mini-formulaire est en mode "creation" ou "rejoindre"
let modeActionCommu = "creer"; 

// On intercepte l'ouverture de l'écran compte pour charger le listing des communautés
document.getElementById("menuAccount").addEventListener("click", () => {
  renderGestionCommunautes();
});

document.getElementById("btnDeclencherCreerCommu").onclick = () => {
  modeActionCommu = "creer";
  document.getElementById("zoneFormulaireCommu").classList.remove("hidden");
  document.getElementById("titreActionCommu").innerText = "Nom de ta nouvelle communauté :";
  document.getElementById("inputNomCodeCommu").placeholder = "Ex: Les Amis du Bar";
  document.getElementById("inputNomCodeCommu").value = "";
  document.getElementById("inputNomCodeCommu").focus();
};

document.getElementById("btnDeclencherRejoindreCommu").onclick = () => {
  modeActionCommu = "rejoindre";
  document.getElementById("zoneFormulaireCommu").classList.remove("hidden");
  document.getElementById("titreActionCommu").innerText = "Saisir le Code unique :";
  document.getElementById("inputNomCodeCommu").placeholder = "Ex: AB47X9";
  document.getElementById("inputNomCodeCommu").value = "";
  document.getElementById("inputNomCodeCommu").focus();
};

document.getElementById("btnValiderActionCommu").onclick = async () => {
  const user = auth.currentUser;
  if (!user) return;

  const valeurInput = document.getElementById("inputNomCodeCommu").value.trim();
  if (!valeurInput) return showPopup("Ce champ ne peut pas être vide.", true);

  if (modeActionCommu === "creer") {
    // 1. Génération d'un code unique à 6 caractères majuscules
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let codeUnique = "";
    for (let i = 0; i < 6; i++) {
      codeUnique += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    }

    try {
      await db.collection("communities").doc(codeUnique).set({
        name: valeurInput,
        adminId: user.uid,
        memberIds: [user.uid],
        createdAt: Date.now()
      });

      // Si c'est sa première communauté, on la met automatiquement par défaut
      if (!communautéActiveId) {
        await db.collection("players").doc(user.uid).update({ defaultCommunity: codeUnique });
      }

      showPopup(`Communauté "${valeurInput}" créée ! Code : ${codeUnique}`);
      document.getElementById("zoneFormulaireCommu").classList.add("hidden");
      
      // Rechargement général
      await chargerCommunautesUtilisateur(user.uid, communautéActiveId || codeUnique);
      renderGestionCommunautes();
    } catch (e) {
      showPopup("Erreur de création : " + e.message, true);
    }

  } else {
    // 2. Mode REJOINDRE via le code
    const codeSaisi = valeurInput.toUpperCase();
    try {
      const docCommu = await db.collection("communities").doc(codeSaisi).get();
      if (!docCommu.exists) {
        return showPopup("Code communauté introuvable. Vérifie la saisie.", true);
      }

      const donnees = docCommu.data();
      if (donnees.memberIds.includes(user.uid)) {
        return showPopup("Tu fais déjà partie de cette communauté !", true);
      }

      // Ajout de l'utilisateur dans le tableau des membres
      await db.collection("communities").doc(codeSaisi).update({
        memberIds: firebase.firestore.FieldValue.arrayUnion(user.uid)
      });

      // Proposition automatique de liaison si un profil invité correspond (Sera raffiné à l'étape 4)
      showPopup(`Bienvenue dans la communauté : ${donnees.name} !`);
      document.getElementById("zoneFormulaireCommu").classList.add("hidden");

      await chargerCommunautesUtilisateur(user.uid, communautéActiveId || codeSaisi);
      renderGestionCommunautes();
    } catch (e) {
      showPopup("Erreur : " + e.message, true);
    }
  }
};

// Fonction de rendu graphique du gros bloc des communautés dans Mon Compte
async function renderGestionCommunautes() {
  const user = auth.currentUser;
  if (!user) return;

  const container = document.getElementById("listeCommunautesContainer");
  container.innerHTML = "";

  if (listeMesCommunautes.length === 0) {
    container.innerHTML = "<p class='hint' style='text-align:center;'>Aucune communauté active.</p>";
    return;
  }

  listeMesCommunautes.forEach(commu => {
    const card = document.createElement("div");
    card.className = "card subtle";
    card.style.padding = "10px";
    card.style.margin = "0";
    card.style.background = "rgba(0,0,0,0.01)";

    const estAdmin = commu.adminId === user.uid;
    const estParDefaut = commu.id === communautéActiveId;

    let htmlButtonsAdmin = "";
    if (estAdmin) {
      htmlButtonsAdmin = `
        <div style="display:flex; gap:6px; margin-top:8px;">
          <button class="ghost btn-action-soft" style="flex:1; font-size:11px !important;" onclick="declencherAjoutMembre('${commu.id}')">👥 Gérer / Fusion</button>
          <button class="ghost btn-action-soft" style="flex:1; font-size:11px !important; color:var(--danger) !important;" onclick="declencherSuppressionMembre('${commu.id}')">❌ Exclure</button>
        </div>
      `;
    }

    let boutonDefautHtml = "";
    if (!estParDefaut) {
      boutonDefautHtml = `
        <button class="primary btn-block" style="font-size:11px; padding:6px; margin-top:8px; background-color:var(--accent); border-color:var(--accent);" onclick="definirCommunauteParDefaut('${commu.id}')">
          📌 Choisir comme communauté par défaut
        </button>
      `;
    } else {
      boutonDefautHtml = `
        <div style="text-align:center; font-size:11px; color:#28a745; font-weight:bold; margin-top:8px; padding:4px; background:rgba(40,167,69,0.05); border-radius:4px;">
          ✅ Communauté active par défaut
        </div>
      `;
    }

    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <strong style="color:var(--primary-strong); font-size:15px;">${commu.name}</strong>
        <span class="badge" style="background:var(--bg-secondary); color:var(--text-main); font-family:monospace; font-size:13px; padding:2px 6px;">${commu.id}</span>
      </div>
      ${htmlButtonsAdmin}
      ${boutonDefautHtml}
    `;

    container.appendChild(card);
  });
}

// Assigner une communauté par défaut dans le profil Firestore
async function definirCommunauteParDefaut(commuId) {
  const user = auth.currentUser;
  if (!user) return;

  try {
    await db.collection("players").doc(user.uid).update({
      defaultCommunity: commuId
    });
    communautéActiveId = commuId;
    showPopup("Communauté par défaut mise à jour !");
    renderGestionCommunautes();
  } catch (e) {
    showPopup(e.message, true);
  }
}

// Placeholders pour les actions admin avancées (On les codera en détail à l'étape 4)
function declencherAjoutMembre(commuId) {
  showPopup("Gestion des fusions et des demandes d'approbation (Étape 4)");
}
function declencherSuppressionMembre(commuId) {
  showPopup("Sélection et exclusion des membres (Étape 4)");
}