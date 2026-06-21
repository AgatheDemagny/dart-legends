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
  "Gorille", "Loutre", "Renard", "Koala", "Castor", "Hérisson", "Blaireau", "Suricate", 
  "Lémurien", "Requin", "Piranha", "Bison", "Coyote", "Morse", "Otarie", "Furet", 
  "Grizzly", "Taupe", "Python", "Cobra", "Gecko", "Jaguar", "Lynx", "Puma", "Panthère", "Zèbre",
  "Aigle", "Albatros", "Alouette", "Épervier", "Faucon", "Colibri", "Hibou", "Toucan", "Pélican", "Vautour",
  "Jonquille", "Tulipe", "Rose", "Pivoine", "Orchidée", "Lilas", "Lotus", "Coquelicot", 
  "Tournesol", "Jasmin", "Anémone", "Lavande", "Iris", "Capucine", "Camélia", "Dahlia",
  "Magnolia", "Trèfle", "Mimosa", "Hibiscus", "Fuchsia", "Géranium", "Pissenlit",
  "Fourmi", "Scorpion", "Bourdon", "Luciole", "Cigale", "Scarabée", "Papillon", 
  "Araignée", "Libellule", "Abeille", "Sauterelle"  
];

const SEQUENCE_TOUR_DU_MONDE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25];

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

function generateNewBountyTarget(currentBonusTargets, currentMalusTarget) {
    const availableTargets = SEQUENCE_TOUR_DU_MONDE.filter(t => 
        !currentBonusTargets.includes(t) && t !== currentMalusTarget
    );
    if (availableTargets.length === 0) return 20;
    const randomIndex = Math.floor(Math.random() * availableTargets.length);
    return availableTargets[randomIndex];
}

window.definirCommuParDefaut = async function(commuId) {
  const user = auth.currentUser;
  if (!user) return;
  try {
    await db.collection("players").doc(user.uid).set({
      defaultCommunity: commuId
    }, { merge: true });
    
    communautéActiveId = commuId;
    await chargerInfosProfil();
    showPopup("Communauté par défaut mise à jour !");
  } catch(e) { 
    showPopup(e.message, true); 
  }
};

function renderSelectedPlayers() {
  const container = document.getElementById("selectedPlayersMatchList");
  if (!container) return;
  container.innerHTML = "";
  
  joueursSelectionnesMatch.forEach((p, index) => {
    const div = document.createElement("div");
    div.style.padding = "8px";
    div.style.borderBottom = "1px solid var(--divider)";
    div.innerHTML = `<strong>Joueur ${index + 1} :</strong> ${p.name}`;
    container.appendChild(div);
  });

  // Affichage dynamique du bloc équipe si 4 joueurs ou plus
  const teamBlock = document.getElementById("teamModeBlock");
  if (joueursSelectionnesMatch.length >= 4) {
    teamBlock.classList.remove("hidden");
  } else {
    teamBlock.classList.add("hidden");
    document.getElementById("teamModeCheckbox").checked = false;
    document.getElementById("teamModeConfig").classList.add("hidden");
  }
}

// Navigation de base
document.getElementById("menuNewGame").addEventListener("click", () => {
  showScreen(screens.newGame);
  initPageNouvellePartie();
});
document.getElementById("backHomeBtn").addEventListener("click", () => showScreen(screens.home));

// Affichage dynamique des paramètres selon le mode de jeu sélectionné
document.getElementById("gameModeSelect").addEventListener("change", (e) => {
  document.getElementById("cricketParamsGroup").classList.add("hidden");
  document.getElementById("x01ParamsGroup").classList.add("hidden");
  document.getElementById("worldParamsGroup").classList.add("hidden");
  document.getElementById("bountyParamsGroup").classList.add("hidden");

  if (e.target.value === "x01") {
    document.getElementById("x01ParamsGroup").classList.remove("hidden");
  } else if (e.target.value === "world") {
    document.getElementById("worldParamsGroup").classList.remove("hidden");
  } else if (e.target.value === "bounty") {
    document.getElementById("bountyParamsGroup").classList.remove("hidden");
    checkBountyLimits();
  } else {
    document.getElementById("cricketParamsGroup").classList.remove("hidden");
  }
});

// ÉCOUTEUR BOUTON QUITTER EN PLEIN MATCH
document.getElementById("btnLeaveGame").addEventListener("click", async () => {
  const quitter = await openCustomModal("⚠️ Abandon", "Voulez-vous vraiment quitter la partie en cours ? Votre progression sera perdue.");
  if (quitter) {
    clearInterval(cricketState.timerInterval);
    showScreen(screens.home);
  }
});

function genererEquipesAleatoires() {
  const numTeams = parseInt(document.getElementById("teamCountSelect").value, 10);
  listeEquipesFormees = [];
  
  // Création des équipes vides
  for (let i = 0; i < numTeams; i++) {
    const nomAlea = POOL_NOMS_EQUIPES[Math.floor(Math.random() * POOL_NOMS_EQUIPES.length)];
    listeEquipesFormees.push({ id: `team_${i}`, name: nomAlea, members: [] });
  }

  // Mélange et distribution
  let joueursMelanges = melangerJoueurs(joueursSelectionnesMatch);
  joueursMelanges.forEach((j, index) => {
    const teamIdx = index % numTeams;
    listeEquipesFormees[teamIdx].members.push(j);
    j.teamId = listeEquipesFormees[teamIdx].id;
    j.teamName = listeEquipesFormees[teamIdx].name;
  });

  renderTeamsConfig();
}

function renderTeamsConfig() {
  const container = document.getElementById("teamsContainer");
  container.innerHTML = "";
  listeEquipesFormees.forEach(eq => {
    const div = document.createElement("div");
    div.style.padding = "8px";
    div.style.background = "rgba(15, 76, 129, 0.05)";
    div.style.borderRadius = "8px";
    div.innerHTML = `<div class="team-config-title">${eq.name}</div>
                     <div class="team-config-player">${eq.members.map(m => m.name).join(" - ")}</div>`;
    container.appendChild(div);
  });
}

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

// Autres menus indisponibles
["menuPlayers", "menuRanking", "menuTraining", "menuTournament"].forEach(id => {
  document.getElementById(id).addEventListener("click", () => { showPopup("Arrive dans la prochaine mise à jour !"); });
});

document.getElementById("btnKeyZero").onclick = () => taperChiffre(0);

const bountyTurnsSelect = document.getElementById('bountyTurnsSelect');
const bountyTargetScoreSelect = document.getElementById('bountyTargetScoreSelect');
const bountyWarning = document.getElementById('bountyLimitWarning');
const startGameBtnForBountyCheck = document.getElementById('startGameBtn');

function checkBountyLimits() {
    if (!bountyTurnsSelect || !bountyTargetScoreSelect || !bountyWarning || !startGameBtnForBountyCheck) return;
    const isUnlimitedTurns = bountyTurnsSelect.value === "999";
    const isUnlimitedScore = bountyTargetScoreSelect.value === "9999";
    if (isUnlimitedTurns && isUnlimitedScore) {
        bountyWarning.classList.remove('hidden');
        startGameBtnForBountyCheck.disabled = true;
    } else {
        bountyWarning.classList.add('hidden');
        startGameBtnForBountyCheck.disabled = false;
    }
}

// ================== CONFIGURATION FIREBASE ==================
const auth = firebase.auth();
const db = firebase.firestore();
let communautéActiveId = null; 
let tousLesJoueursBase = [];
let joueursSelectionnesMatch = [];
let listeEquipesFormees = [];
let communauteCibleMatchId = null;
let listeMesCommunautes = [];

auth.onAuthStateChanged(async (user) => {
  if (screens.loading) screens.loading.classList.add("hidden");

  if (user) {
    try {
      const doc = await db.collection("players").doc(user.uid).get();
      let displayName = user.email ? user.email.split('@')[0] : "Joueur";
      let defaultCommunity = null;

      if (doc.exists) {
        if (doc.data().name) displayName = doc.data().name;
        if (doc.data().defaultCommunity) defaultCommunity = doc.data().defaultCommunity;
      } else {
        await db.collection("players").doc(user.uid).set({
          email: user.email,
          name: displayName,
          createdAt: Date.now(),
          defaultCommunity: null,
          communityIds: [],
          isRealAccount: true
        });
      }
      
      await chargerCommunautesUtilisateur(user.uid, defaultCommunity);

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

document.getElementById("btnSignup").addEventListener("click", async () => {
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value.trim();
  if (!email || !password) return showPopup("Champs obligatoires.", true);
  try {
    const defaultName = email.split('@')[0];
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    await db.collection("players").doc(cred.user.uid).set({
      email: email, 
      name: defaultName, 
      createdAt: Date.now(),
      communityIds: [],
      isRealAccount: true
    });
    showPopup("Compte créé avec succès ! 🎯");
  } catch (e) { 
    showPopup(e.message, true); 
  }
});

document.getElementById("btnLogin").addEventListener("click", async () => {
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value.trim();
  if (!email || !password) return showPopup("Champs obligatoires.", true);
  try { 
    await auth.signInWithEmailAndPassword(email, password); 
  } catch (e) { 
    showPopup(e.message, true); 
  }
});

document.getElementById("btnLogout").addEventListener("click", () => { 
  auth.signOut(); 
});

document.getElementById("btnOpenSearchPlayer").addEventListener("click", () => {
  document.getElementById("zoneSearchPlayer").classList.toggle("hidden");
  document.getElementById("zoneCreatePlayer").classList.add("hidden");
  
  // Remplir la liste avec les membres de la communauté qui ne jouent pas encore
  const container = document.getElementById("searchResultsList");
  container.innerHTML = "";
  const joueursDisponibles = tousLesJoueursBase.filter(j => !joueursSelectionnesMatch.some(sel => sel.id === j.id));
  
  if (joueursDisponibles.length === 0) {
    container.innerHTML = "<p class='hint'>Tous les membres participent déjà.</p>";
    return;
  }
  
  joueursDisponibles.forEach(j => {
    const btn = document.createElement("button");
    btn.className = "ghost btn-block";
    btn.style.marginTop = "4px";
    btn.innerText = `➕ ${j.name}`;
    btn.onclick = () => {
      joueursSelectionnesMatch.push(j);
      renderSelectedPlayers();
      document.getElementById("zoneSearchPlayer").classList.add("hidden");
    };
    container.appendChild(btn);
  });
});

document.getElementById("btnOpenCreatePlayer").addEventListener("click", () => {
  document.getElementById("zoneCreatePlayer").classList.toggle("hidden");
  document.getElementById("zoneSearchPlayer").classList.add("hidden");
});

document.getElementById("btnValidateCreatePlayer").addEventListener("click", async () => {
  const nom = document.getElementById("createPlayerName").value.trim();
  if (!nom) return showPopup("Le nom est obligatoire", true);
  
  try {
    const docId = "guest-" + Date.now();
    await db.collection("players").doc(docId).set({
      name: nom,
      email: null,
      createdAt: Date.now(),
      communityIds: [communauteCibleMatchId],
      isRealAccount: false
    });
    
    // Ajout direct à la partie en cours
    const nouveauJoueur = { id: docId, name: nom };
    tousLesJoueursBase.push(nouveauJoueur);
    joueursSelectionnesMatch.push(nouveauJoueur);
    
    renderSelectedPlayers();
    document.getElementById("createPlayerName").value = "";
    document.getElementById("zoneCreatePlayer").classList.add("hidden");
    showPopup(`Joueur ${nom} créé et ajouté à la partie !`);
  } catch (e) {
    showPopup(e.message, true);
  }
});

// ================== GESTIONNAIRES DE NAVIGATION & ÉVÉNEMENTS COMMUNAUTÉS ==================

let commuSelectionneePourModal = null;
let actionCommuEnCours = "creer"; // "creer" ou "rejoindre"

// Navigation Mon Compte et Historique
document.getElementById("menuAccount").addEventListener("click", () => {
  showScreen(screens.account);
  chargerInfosProfil();
});
document.getElementById("backHomeFromAccountBtn").addEventListener("click", () => showScreen(screens.home));

document.getElementById("menuHistory").addEventListener("click", () => {
  showScreen(screens.history);
  chargerHistoriqueParties();
});
document.getElementById("backHomeFromHistoryBtn").addEventListener("click", () => showScreen(screens.home));

// Ouvrir le formulaire de création
document.getElementById("btnDeclencherCreerCommu").addEventListener("click", () => {
  actionCommuEnCours = "creer";
  document.getElementById("titreActionCommu").innerText = "Créer une communauté";
  document.getElementById("inputNomCodeCommu").placeholder = "Nom de la communauté";
  document.getElementById("zoneFormulaireCommu").classList.remove("hidden");
});

// Ouvrir le formulaire pour rejoindre
document.getElementById("btnDeclencherRejoindreCommu").addEventListener("click", () => {
  actionCommuEnCours = "rejoindre";
  document.getElementById("titreActionCommu").innerText = "Rejoindre une communauté";
  document.getElementById("inputNomCodeCommu").placeholder = "Code de la communauté (ex: ABC123)";
  document.getElementById("zoneFormulaireCommu").classList.remove("hidden");
});

// Valider l'action (Créer ou Rejoindre)
document.getElementById("btnValiderActionCommu").addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return;

  const valeur = document.getElementById("inputNomCodeCommu").value.trim();
  if (!valeur) return showPopup("Ce champ ne peut pas être vide.", true);

  try {
    if (actionCommuEnCours === "creer") {
      const codeCommu = Math.random().toString(36).substring(2, 8).toUpperCase();
      const nouvelleCommu = {
        name: valeur,
        code: codeCommu,
        adminId: user.uid,
        memberIds: [user.uid],
        createdAt: Date.now()
      };
      
      const docRef = await db.collection("communities").add(nouvelleCommu);
      const playerDoc = await db.collection("players").doc(user.uid).get();
      const currentDefault = playerDoc.exists ? playerDoc.data().defaultCommunity : null;
      
      await db.collection("players").doc(user.uid).set({
        defaultCommunity: currentDefault || docRef.id
      }, { merge: true });

      showPopup(`Communauté "${valeur}" créée ! Code : ${codeCommu}`);
    } else {
      const snap = await db.collection("communities").where("code", "==", valeur.toUpperCase()).get();
      if (snap.empty) return showPopup("Communauté introuvable avec ce code.", true);
      
      const commuDoc = snap.docs[0];
      const commuData = commuDoc.data();
      
      if (commuData.memberIds.includes(user.uid)) {
        return showPopup("Vous faites déjà partie de cette communauté.", true);
      }
      
      await db.collection("communities").doc(commuDoc.id).update({
        memberIds: firebase.firestore.FieldValue.arrayUnion(user.uid)
      });
      
      await db.collection("players").doc(user.uid).set({
        defaultCommunity: commuDoc.id
      }, { merge: true });

      showPopup(`Bienvenue dans ${commuData.name} !`);
    }

    document.getElementById("inputNomCodeCommu").value = "";
    document.getElementById("zoneFormulaireCommu").classList.add("hidden");
    
    await chargerCommunautesUtilisateur(user.uid, communautéActiveId);
    await chargerInfosProfil();
  } catch (e) {
    showPopup("Erreur : " + e.message, true);
  }
});

// Fermer le Modal
document.getElementById("btnCloseCommuAdminModal").addEventListener("click", () => {
  document.getElementById("communityAdminModalOverlay").classList.add("hidden");
  commuSelectionneePourModal = null;
});

// Ajouter un membre via le Modal
document.getElementById("btnCommuValidateAddMember").addEventListener("click", async () => {
  if (!commuSelectionneePourModal) return;
  
  const name = document.getElementById("commuAddMemberName").value.trim();
  const email = document.getElementById("commuAddMemberEmail").value.trim().toLowerCase();
  
  if (!name) return showPopup("Le nom est obligatoire.", true);

  try {
    let targetUid = null;
    if (email) {
      const snapUser = await db.collection("players").where("email", "==", email).get();
      if (!snapUser.empty) targetUid = snapUser.docs[0].id;
    }

    if (targetUid) {
      if (commuSelectionneePourModal.memberIds.includes(targetUid)) {
        return showPopup("Ce joueur est déjà membre.", true);
      }
      await db.collection("communities").doc(commuSelectionneePourModal.id).update({
        memberIds: firebase.firestore.FieldValue.arrayUnion(targetUid)
      });
    } else {
      const docId = "guest-" + Date.now();
      await db.collection("players").doc(docId).set({
        name: name,
        email: email || null,
        createdAt: Date.now(),
        communityIds: [commuSelectionneePourModal.id],
        isRealAccount: false
      });
    }

    showPopup(`${name} ajouté !`);
    document.getElementById("commuAddMemberName").value = "";
    document.getElementById("commuAddMemberEmail").value = "";
    ouvrirModalGestionCommunaute(commuSelectionneePourModal.id);
  } catch (e) {
    showPopup("Erreur d'ajout : " + e.message, true);
  }
});

// Quitter une communauté
// Remplacer l'écouteur existant de "btnCommuLeave"
document.getElementById("btnCommuLeave").addEventListener("click", async () => {
  if (!commuSelectionneePourModal) return;
  const user = auth.currentUser;
  if (!user) return;

  try {
    if (commuSelectionneePourModal.adminId === user.uid) {
      // Filtrer les repreneurs potentiels (les autres membres ayant un compte valide)
      let candidats = [];
      for (const uid of commuSelectionneePourModal.memberIds) {
        if (uid !== user.uid) {
          const uDoc = await db.collection("players").doc(uid).get();
          if (uDoc.exists && uDoc.data().email && uDoc.data().isRealAccount) {
            candidats.push({ id: uid, name: uDoc.data().name });
          }
        }
      }

      if (candidats.length === 0) {
        return showPopup("Vous êtes le seul membre avec un compte valide. Dissolvez la communauté ou invitez un membre avec un compte pour pouvoir la quitter.", true);
      }

      // Construction d'une invite de sélection simplifiée via prompt ou boîte personnalisée
      let messageSelection = "Veuillez choisir le nouvel administrateur en tapant son numéro :\n";
      candidats.forEach((c, idx) => { messageSelection += `${idx + 1}. ${c.name}\n`; });
      
      let choix = prompt(messageSelection);
      let indexChoisi = parseInt(choix, 10) - 1;

      if (isNaN(indexChoisi) || indexChoisi < 0 || indexChoisi >= candidats.length) {
        return showPopup("Sélection invalide. Abandon de la procédure.", true);
      }

      const repreneur = candidats[indexChoisi];
      // Transférer les droits d'administration
      await db.collection("communities").doc(commuSelectionneePourModal.id).update({
        adminId: repreneur.id
      });
      showPopup(`Droits transférés à ${repreneur.name}.`);
    }

    const certitude = await openCustomModal("🏃 Quitter", `Voulez-vous quitter ${commuSelectionneePourModal.name} ?`);
    if (!certitude) return;

    await db.collection("communities").doc(commuSelectionneePourModal.id).update({
      memberIds: firebase.firestore.FieldValue.arrayRemove(user.uid)
    });
    
    document.getElementById("communityAdminModalOverlay").classList.add("hidden");
    await chargerCommunautesUtilisateur(user.uid, null);
    await chargerInfosProfil();
    showPopup("Vous avez quitté la communauté.");
  } catch (e) { showPopup(e.message, true); }
});

// Dissoudre
document.getElementById("btnCommuDelete").addEventListener("click", async () => {
  if (!commuSelectionneePourModal) return;
  const user = auth.currentUser;
  if (!user || commuSelectionneePourModal.adminId !== user.uid) return;

  const certitude = await openCustomModal("🗑️ Dissoudre", `Supprimer définitivement "${commuSelectionneePourModal.name}" et son historique ?`);
  if (!certitude) return;

  try {
    await db.collection("communities").doc(commuSelectionneePourModal.id).delete();
    const histSnap = await db.collection("games_history").where("communityId", "==", commuSelectionneePourModal.id).get();
    const batch = db.batch();
    histSnap.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    document.getElementById("communityAdminModalOverlay").classList.add("hidden");
    await chargerCommunautesUtilisateur(user.uid, null);
    await chargerInfosProfil();
    showPopup("Communauté dissoute.");
  } catch (e) { showPopup(e.message, true); }
});

// ================== LOGIQUE PROFIL & NOUVELLE PARTIE ==================

async function chargerInfosProfil() {
  const user = auth.currentUser;
  if (!user) return;
  document.getElementById("accountProfileEmail").innerText = user.email;

  try {
    await chargerJoueursCommunauteCible();
    const doc = await db.collection("players").doc(user.uid).get();
    document.getElementById("accountProfileName").value = (doc.exists && doc.data().name) ? doc.data().name : user.email.split('@')[0];
    renderListeCommunautesGestion();
  } catch(e) { console.error(e); }
}

// Remplacer l'écouteur existant pour la mise à jour du pseudo
document.getElementById("btnUpdateProfileName").addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return;
  const nouveauPseudo = document.getElementById("accountProfileName").value.trim();
  if(!nouveauPseudo) return showPopup("Le pseudo ne peut pas être vide.", true);

  try {
    // Vérification de l'unicité du pseudo dans toutes les communautés dont le joueur fait partie
    for (const commu of listeMesCommunautes) {
      const docCommu = await db.collection("communities").doc(commu.id).get();
      if (docCommu.exists) {
        const memberIds = docCommu.data().memberIds || [];
        for (const uid of memberIds) {
          if (uid !== user.uid) {
            const uDoc = await db.collection("players").doc(uid).get();
            if (uDoc.exists && uDoc.data().name?.toLowerCase() === nouveauPseudo.toLowerCase()) {
              return showPopup(`Conflit de nom : Le pseudo "${nouveauPseudo}" est déjà utilisé dans la communauté ${commu.name}.`, true);
            }
          }
        }
      }
    }

    await db.collection("players").doc(user.uid).update({ name: nouveauPseudo });
    showPopup("Pseudo mis à jour !");
    await chargerJoueursCommunauteCible();
  } catch(e) { showPopup(e.message, true); }
});

// Dans l'écouteur de "btnValiderActionCommu", modifier la section "rejoindre" pour ajouter :
// (Insérer ce bloc juste après avoir récupéré commuData et avant d'effectuer l'update dans Firebase)
const playerDocCourant = await db.collection("players").doc(user.uid).get();
const monPseudoActuel = playerDocCourant.exists ? playerDocCourant.data().name : "";

for (const uid of commuData.memberIds) {
  const uDoc = await db.collection("players").doc(uid).get();
  if (uDoc.exists && uDoc.data().name?.toLowerCase() === monPseudoActuel.toLowerCase()) {
    return showPopup("Conflit de nom : modifiez votre nom avant de pouvoir rejoindre cette communauté.", true);
  }
}

function renderListeCommunautesGestion() {
  const container = document.getElementById("listeCommunautesContainer");
  if (!container) return; 
  
  container.innerHTML = "";

  if (listeMesCommunautes.length === 0) {
    container.innerHTML = "<p class='hint'>Aucune communauté pour l'instant.</p>";
    return;
  }

  listeMesCommunautes.forEach(commu => {
    const row = document.createElement("div");
    row.className = "stat-row";
    row.style.padding = "10px"; 
    row.style.background = "#FDFDFB"; 
    row.style.border = "1px solid var(--divider)"; 
    row.style.borderRadius = "var(--r-1)"; 
    row.style.marginBottom = "4px";
    row.style.display = "flex";
    row.style.justifyContent = "space-between";
    row.style.alignItems = "center";

    // 1. Détermination du rôle (Admin ou Membre)
    const estAdmin = commu.adminId === auth.currentUser.uid;
    const badgeRole = estAdmin 
      ? "<span class='badge' style='background:#0F4C81; color:#fff;'>Admin</span>" 
      : "<span class='badge'>Membre</span>";

    // 2. Gestion de la communauté par défaut
    // communautéActiveId contient l'ID choisi par défaut (ou le premier par défaillance)
    const estParDefaut = commu.id === communautéActiveId;
    const zoneParDefaut = estParDefaut 
      ? `<span style="font-size:12px; color:var(--accent); font-weight:700; display:inline-flex; align-items:center; gap:3px;">⭐ Par défaut</span>`
      : `<button class="ghost btn-action-soft" style="padding: 4px 8px; font-size: 11px; margin-top:4px;" onclick="definirCommuParDefaut('${commu.id}')">Définir par défaut</button>`;

    // 3. Injection du template HTML complet pour la ligne
    row.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:4px; text-align:left;">
        <span style="font-weight:700; color:var(--primary); font-size:15px;">${commu.name}</span>
        <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
          ${badgeRole} 
          <span style="font-size:11px; font-family:monospace; color:var(--text-soft);">Code : ${commu.code}</span>
        </div>
        <div style="margin-top:2px;">
          ${zoneParDefaut}
        </div>
      </div>
      <button class="primary" style="padding: 8px 14px; font-size: 12px; height: fit-content;" onclick="ouvrirModalGestionCommunaute('${commu.id}')">Gérer</button>
    `;
    
    container.appendChild(row);
  });
}

window.renderListeCommunautesGestion = renderListeCommunautesGestion;

async function ouvrirModalGestionCommunaute(commuId) {
  try {
    const doc = await db.collection("communities").doc(commuId).get();
    if (!doc.exists) return;
    const commuData = doc.data();
    commuSelectionneePourModal = { id: doc.id, ...commuData };

    document.getElementById("commuModalTitle").innerText = commuData.name;
    document.getElementById("commuModalCodeBadge").innerText = `CODE : ${commuData.code}`;
    document.getElementById("btnCommuDelete").style.display = commuData.adminId === auth.currentUser.uid ? "block" : "none";

    const listContainer = document.getElementById("commuModalMembersList");
    listContainer.innerHTML = "<p class='hint'>Chargement...</p>";

    let membresHtml = "";
    for (const uid of commuData.memberIds) {
      const uDoc = await db.collection("players").doc(uid).get();
      if (uDoc.exists) {
        membresHtml += `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:4px; font-size:13px; border-bottom:1px solid #f5f5f5;">
            <span><strong>${uDoc.data().name}</strong>${commuData.adminId === uid ? " 👑" : ""}</span>
            <span style="font-size:11px; color:var(--text-soft);">Compte lié</span>
          </div>`;
      }
    }

    const snapGuests = await db.collection("players").where("communityIds", "array-contains", commuId).get();
    snapGuests.forEach(gDoc => {
      if (!gDoc.data().isRealAccount) {
        membresHtml += `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:4px; font-size:13px; border-bottom:1px solid #f5f5f5;">
            <span style="color:#6c757d;">👤 ${gDoc.data().name}</span>
            <span style="font-size:11px; color:var(--accent); font-weight:600;">Invité</span>
          </div>`;
      }
    });

    listContainer.innerHTML = membresHtml || "<p class='hint'>Aucun membre</p>";
    document.getElementById("communityAdminModalOverlay").classList.remove("hidden");
  } catch (e) { showPopup(e.message, true); }
}

async function initPageNouvellePartie() {
  communauteCibleMatchId = communautéActiveId;
  await chargerJoueursCommunauteCible();
  joueursSelectionnesMatch = [];
  document.getElementById("teamModeCheckbox").checked = false;
  document.getElementById("teamModeConfig").classList.add("hidden");
  
  const selectCommu = document.getElementById("selectCommuMatch");
  selectCommu.innerHTML = "";
  listeMesCommunautes.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.id; opt.innerText = c.name;
    if (c.id === communautéActiveId) opt.selected = true;
    selectCommu.appendChild(opt);
  });

  selectCommu.onchange = async (e) => {
    communauteCibleMatchId = e.target.value;
    await chargerJoueursCommunauteCible(); 
    joueursSelectionnesMatch = []; 
    renderSelectedPlayers();
  };

  const user = auth.currentUser;
  if (user) {
    const doc = await db.collection("players").doc(user.uid).get();
    joueursSelectionnesMatch.push({ id: user.uid, name: (doc.exists && doc.data().name) ? doc.data().name : user.email.split('@')[0] });
  }
  renderSelectedPlayers();
  checkBountyLimits();
}

async function chargerJoueursCommunauteCible() {
  if (!communauteCibleMatchId) communauteCibleMatchId = communautéActiveId;
  if (!communauteCibleMatchId) { tousLesJoueursBase = []; return; }
  tousLesJoueursBase = [];
  try {
    const docCommu = await db.collection("communities").doc(communauteCibleMatchId).get();
    if (docCommu.exists) {
      for (const uid of docCommu.data().memberIds || []) {
        const docUser = await db.collection("players").doc(uid).get();
        if (docUser.exists) tousLesJoueursBase.push({ id: docUser.id, ...docUser.data() });
      }
    }
    const snapGuests = await db.collection("players").where("communityIds", "array-contains", communauteCibleMatchId).get();
    snapGuests.forEach(doc => {
      if (!tousLesJoueursBase.some(p => p.id === doc.id)) tousLesJoueursBase.push({ id: doc.id, ...doc.data() });
    });
  } catch(e) { console.error(e); }
}

// ================== LOGIQUE HISTORIQUE AVEC FILTRE CROISÉ ==================

async function chargerHistoriqueParties() {
  const container = document.getElementById("historyContainer");
  const selectFiltre = document.getElementById("selectFiltreHistorique");
  if (!container || !selectFiltre) return;
  
  container.innerHTML = "<p class='hint' style='text-align:center; padding:20px;'>Chargement de l'historique...</p>";
  if (listeMesCommunautes.length === 0) {
    container.innerHTML = "<p class='hint' style='text-align:center; padding:20px;'>Rejoignez une communauté pour voir l'historique.</p>";
    selectFiltre.innerHTML = "<option value='none'>Aucune communauté</option>";
    return;
  }

  const valeurFiltreSelectionnee = selectFiltre.value;
  selectFiltre.innerHTML = "";

  const optTous = document.createElement("option");
  optTous.value = "TOUT"; optTous.innerText = "✨ Toutes mes communautés";
  if (valeurFiltreSelectionnee === "TOUT" || !valeurFiltreSelectionnee) optTous.selected = true;
  selectFiltre.appendChild(optTous);

  listeMesCommunautes.forEach(commu => {
    const opt = document.createElement("option");
    opt.value = commu.id; opt.innerText = `👥 ${commu.name}`;
    if (valeurFiltreSelectionnee === commu.id) opt.selected = true;
    selectFiltre.appendChild(opt);
  });

  selectFiltre.onchange = () => { chargerHistoriqueParties(); };

  try {
    let filtreActuel = selectFiltre.value || "TOUT";
    let snap;

    if (filtreActuel === "TOUT") {
      snap = await db.collection("games_history")
                    .where("communityId", "in", listeMesCommunautes.map(c => c.id))
                    .orderBy("createdAt", "desc").limit(30).get();
    } else {
      snap = await db.collection("games_history")
                    .where("communityId", "==", filtreActuel)
                    .orderBy("createdAt", "desc").limit(30).get();
    }

    container.innerHTML = "";
    if (snap.empty) {
      container.innerHTML = "<p class='hint' style='text-align:center; padding:20px;'>Aucune partie enregistrée.</p>";
      return;
    }

    snap.forEach(doc => {
      const data = doc.data();
      const date = new Date(data.createdAt).toLocaleDateString("fr-FR");
      const duration = `${Math.floor(data.duration / 60)}m ${data.duration % 60}s`;
      const nomCommuAssociee = listeMesCommunautes.find(c => c.id === data.communityId)?.name || "Inconnue";

      const card = document.createElement("div");
      card.className = "card"; card.style.marginBottom = "10px";
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:6px; align-items:center;">
          <span class="badge" style="background:var(--primary); color:#fff;">${data.type.toUpperCase()}</span>
          <span style="font-size:11px; color:var(--accent); font-weight:700;">👥 ${nomCommuAssociee}</span>
        </div>
        <p style="padding:4px 0;">🥇 Vainqueur : <strong>${data.winner}</strong></p>
        <p style="padding:4px 0; border:none; font-size:12px; color:var(--text-soft);">⏱️ ${duration} — 📅 ${date}</p>
      `;
      container.appendChild(card);
    });
  } catch (e) {
    container.innerHTML = "<p class='hint' style='text-align:center; color:var(--danger); padding:20px;'>Erreur lors du chargement.</p>";
  }
}

window.ouvrirModalGestionCommunaute = ouvrirModalGestionCommunaute;

// ================== MOTEUR DE JEU GENERAL ==================
let cricketState = {
  gameMode: "cricket", isTeamMode: false,
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
    const aEquipeVide = listeEquipesFormees.some(eq => eq.members.length === 0);
    if(aEquipeVide) {
      return showPopup("⚠️ Chaque équipe doit posséder au moins un joueur !", true);
    }
    cricketState.isTeamMode = true;
    
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
    ordonnancementTireurs = melangerJoueurs(joueursSelectionnesMatch);
  }

  const mode = document.getElementById("gameModeSelect").value;
  if (mode === "x01") {
    demarrerMatchX01(ordonnancementTireurs);
  } else if (mode === "world") {
    demarrerMatchWorld(ordonnancementTireurs);
  } else if (mode === "bounty") { 
    demarrerMatchBounty(ordonnancementTireurs);
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
      ciblesMysteres.push(toutesLesCiblesPossibles.splice(indexAlea, 1)[0]);
    }
    cricketState.targets = ciblesMysteres;
    cricketState.revealedTargets = [];
  } else {
    cricketState.targets = [15, 16, 17, 18, 19, 20, 25];
    cricketState.revealedTargets = [...cricketState.targets];
  }

  cricketState.players.forEach(p => {
    const keyStockage = cricketState.isTeamMode ? p.teamId : p.id;
    cricketState.scores[keyStockage] = 0;
    if(!cricketState.marks[keyStockage]) {
      cricketState.marks[keyStockage] = {};
      cricketState.targets.forEach(t => { cricketState.marks[keyStockage][t] = 0; });
    }
    
    cricketState.statsDetails[p.id] = { 
      dartsThrown: 0, touchesUtiles: 0, touchesNum: {}, pointsGiv: {}, totalPointsGiven: 0,
      maxPointsGivenInOneVolley: 0, currentVolleyPointsGiven: 0, doublesCount: {}, triplesCount: {} 
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
    
    // NOUVELLE INITIALISATION DES STATS
    cricketState.statsDetails[p.id] = { 
      dartsThrown: 0, 
      totalScoreScored: 0, 
      bustsCount: 0, 
      maxVolleyScore: 0, 
      currentVolleyScore: 0,
      first9DartsScore: 0, 
      scoreFamily60: 0,     // Corrigé (c'était 50 avant)
      scoreFamily100: 0, 
      scoreFamily140: 0, 
      scoreFamily180: 0,
      checkoutHits: 0, 
      touchesNum: {},
      touchesSimpleNum: {}  // Ajout pour compter le % de simples
    };

    for (let i = 1; i <= 20; i++) {
      cricketState.statsDetails[p.id].touchesNum[i] = 0;
      cricketState.statsDetails[p.id].touchesSimpleNum[i] = 0; // Ajout
    }
    cricketState.statsDetails[p.id].touchesNum[25] = 0;
    cricketState.statsDetails[p.id].touchesSimpleNum[25] = 0;  // Ajout
  });

  lancerInterfaceJeu("x01");
}

function demarrerMatchWorld(listeJoueurs) {
  cricketState.gameMode = "world";
  initVariablesMatchGenerales(listeJoueurs);
  cricketState.maxTurns = 999; 
  
  cricketState.worldStartNum = parseInt(document.getElementById("worldStartSelect").value, 10);
  cricketState.worldEndNum = parseInt(document.getElementById("worldEndSelect").value, 10);
  cricketState.worldJump = document.getElementById("worldJumpCheckbox").checked;

  cricketState.players.forEach(p => {
    const keyStockage = cricketState.isTeamMode ? p.teamId : p.id;
    cricketState.scores[keyStockage] = cricketState.worldStartNum;
    cricketState.statsDetails[p.id] = { dartsThrown: 0, totalTargetsHit: 0, dartsPerTarget: {}, simplesHitCount: 0, doublesHitCount: 0, triplesHitCount: 0 };
    for(let i = 1; i <= 25; i++) cricketState.statsDetails[p.id].dartsPerTarget[i] = 0;
  });

  lancerInterfaceJeu("world");
}

function demarrerMatchBounty(listeJoueurs) {
  cricketState.gameMode = "bounty";
  initVariablesMatchGenerales(listeJoueurs);
  cricketState.maxTurns = document.getElementById("bountyTurnsSelect") ? parseInt(document.getElementById("bountyTurnsSelect").value, 10) : 20;
  cricketState.bountyHasMalus = document.getElementById("bountyMalusCheckbox").checked;
  
  const primeCountSelect = document.getElementById("bountyPrimeCountSelect");
  const nbPrimes = primeCountSelect ? parseInt(primeCountSelect.value, 10) : 3;
  
  cricketState.bountyBonusTargets = [];
  while(cricketState.bountyBonusTargets.length < nbPrimes) {
    let t = generateNewBountyTarget(cricketState.bountyBonusTargets, null);
    cricketState.bountyBonusTargets.push(t);
  }
  
  cricketState.bountyMalusTarget = cricketState.bountyHasMalus ? generateNewBountyTarget(cricketState.bountyBonusTargets, null) : null;

  cricketState.players.forEach(p => {
    const keyStockage = cricketState.isTeamMode ? p.teamId : p.id;
    cricketState.scores[keyStockage] = 0;
    cricketState.statsDetails[p.id] = { dartsThrown: 0, touchesPositives: 0, touchesMalus: 0, simples: 0, doubles: 0, triples: 0, chiffresVisites: {} };
  });

  lancerInterfaceJeu("bounty"); 
  mettreAJourCiblesBountyUI();
}

function renderGridWorld() {
  const table = document.getElementById("cricketGridTable");
  table.innerHTML = "";
  
  const headerRow = document.createElement("tr");
  headerRow.style.background = "rgba(255,255,255,0.02)";
  headerRow.innerHTML = `
    <th style="text-align:left; padding: 12px 6px; border-bottom: 2px solid var(--divider); width: 40%;">Joueurs</th>
    <th style="padding: 12px 4px; border-bottom: 2px solid var(--divider); border-left: 1px solid var(--divider); color: var(--text-soft); width: 30%;">Cible Actuelle</th>
    <th style="padding: 12px 6px; border-bottom: 2px solid var(--divider); border-left: 1px solid var(--divider); color: var(--accent); width: 30%;">Progression</th>
  `;
  table.appendChild(headerRow);

  let entitesAAfficher = [];
  if (cricketState.isTeamMode) {
    listeEquipesFormees.forEach(eq => { entitesAAfficher.push({ id: eq.id, name: eq.name }); });
  } else {
    cricketState.players.forEach(p => { entitesAAfficher.push({ id: p.id, name: p.name }); });
  }

  const joueurActuel = cricketState.players[cricketState.currentPlayerIdx];
  const start = cricketState.worldStartNum;
  const end = cricketState.worldEndNum;
  const totalEtapes = (end === 25) ? (20 - start + 2) : (end - start + 1);

  entitesAAfficher.forEach(entite => {
    const row = document.createElement("tr");
    row.style.borderBottom = "1px solid var(--divider)";
    
    if(cricketState.isTeamMode ? (joueurActuel.teamId === entite.id) : (joueurActuel.id === entite.id)) {
      row.style.backgroundColor = "rgba(192,101,42,0.15)";
    }
    
    const scoreCourant = cricketState.scores[entite.id];
    let affichageCible = scoreCourant === 25 ? "🎯 BULL" : scoreCourant >= 26 ? "🎉 FINI" : scoreCourant;
    let etapeActuelle = scoreCourant >= 26 ? totalEtapes : scoreCourant === 25 ? totalEtapes - 1 : scoreCourant - start + 1;

    row.innerHTML = `
      <td style="text-align:left; padding: 14px 6px; font-weight:700;">${entite.name}</td>
      <td style="padding: 14px 4px; border-left: 1px solid var(--divider); font-weight:800; color: var(--primary-strong); font-size: 16px;">${affichageCible}</td>
      <td style="font-weight:600; padding: 14px 6px; border-left: 1px solid var(--divider); color: var(--accent); font-size: 13px;">${etapeActuelle}/${totalEtapes}</td>
    `;
    table.appendChild(row);
  });
}

function traiterCalculWorld(keyStockage, joueurActuel, valeurBouton) {
  const stats = cricketState.statsDetails[joueurActuel.id];
  let cibleAttendue = cricketState.scores[keyStockage];
  const finParcours = cricketState.worldEndNum;
  let bond = cricketState.worldJump ? modificateurEnCours : 1;
    
  if (modificateurEnCours === 1) stats.simplesHitCount += 1;
  if (modificateurEnCours === 2) stats.doublesHitCount += 1;
  if (modificateurEnCours === 3 && valeurBouton !== 25) stats.triplesHitCount += 1;

  if(stats && stats.dartsPerTarget[cibleAttendue] !== undefined) {
    stats.dartsPerTarget[cibleAttendue] += 1;
  }

  if (valeurBouton === cibleAttendue) {
    if (cibleAttendue === finParcours) {
      stats.totalTargetsHit += 1;
      cricketState.scores[keyStockage] = 26; 
      return;
    }
    let bond = cricketState.worldJump ? modificateurEnCours : 1;
    if (modificateurEnCours === 3 && valeurBouton !== 25) stats.triplesHitCount += 1;

    stats.totalTargetsHit += 1;
    let nouvelleCible = cibleAttendue + bond;
    if (finParcours === 25 && nouvelleCible >= 21) nouvelleCible = 25; 
    if (finParcours !== 25 && nouvelleCible > finParcours) nouvelleCible = finParcours;
    cricketState.scores[keyStockage] = nouvelleCible;
  }
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
    document.getElementById("bountyTargetsZone").classList.add("hidden");
    renderKeyboardX01(); renderGridX01();
  } else if (mode === "world") {
    document.getElementById("bountyTargetsZone").classList.add("hidden");
    renderKeyboardX01(); renderGridWorld();
  } else if (mode === "bounty") {
    document.getElementById("bountyTargetsZone").classList.remove("hidden");
    renderKeyboardX01(); renderGridBounty();
  } else {
    document.getElementById("bountyTargetsZone").classList.add("hidden");
    renderKeyboard(); renderGrid();
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
  
  document.getElementById("cricketCurrentPlayerName").innerText = cricketState.isTeamMode ? `${p.name} (${p.teamName})` : p.name;
  document.getElementById("dartsHistoryText").innerText = cricketState.currentTurnDartsText.join(" / ") || "En attente...";
  document.getElementById("gameTurnIndicator").innerText = `Tour ${cricketState.currentTurn}/${cricketState.maxTurns === 999 ? "∞" : cricketState.maxTurns}`;
  document.getElementById("lastTurnHistoryText").innerText = `Coup précédent : ${cricketState.lastTurnText}`;

  const helpZone = document.getElementById("x01CheckoutHelpZone");
  if (cricketState.gameMode === "x01") {
    const keyStockage = cricketState.isTeamMode ? p.teamId : p.id;
    const aideTexte = obtenirSuggestionCheckout(cricketState.scores[keyStockage], 4 - cricketState.currentDart, cricketState.x01Checkout);
    if (aideTexte) {
      helpZone.innerText = `🎯 ${aideTexte}`; helpZone.classList.remove("hidden");
    } else {
      helpZone.classList.add("hidden");
    }
  } else {
    helpZone.classList.add("hidden");
  }
}

function obtenirSuggestionCheckout(score, dartsCount, modeCheckout) {
  if (score <= 1) return null;
  if (modeCheckout === "double") {
    if (score > 170) return null;
    const bogeys3Darts = [159, 162, 163, 165, 166, 168, 169];
    if (dartsCount === 3 && bogeys3Darts.includes(score)) return null;

    if (dartsCount >= 1) {
      if (score <= 40 && score % 2 === 0) return `D${score / 2}`;
      if (score === 50) return "DBull";
    }
    if (dartsCount === 1) return null;

    if (dartsCount >= 2) {
      if (score === 110) return "T20 - DBull";
      if (score === 107) return "T19 - DBull";
      if (score === 104) return "T18 - DBull";
      if (score === 101) return "T17 - DBull";
      for (let t = 20; t >= 1; t--) {
        let rT = score - (t * 3);
        if (rT > 0 && rT <= 40 && rT % 2 === 0) return `T${t} - D${rT / 2}`;
        let rS = score - t;
        if (rS > 0 && rS <= 40 && rS % 2 === 0) return `${t} - D${rS / 2}`;
      }
    }
    if (dartsCount === 2) return null;

    if (dartsCount === 3) {
      if (score === 170) return "T20 - T20 - DBull";
      if (score === 167) return "T20 - T19 - DBull";
      if (score === 164) return "T20 - T18 - DBull";
      if (score === 161) return "T20 - T17 - DBull";
      if (score === 160) return "T20 - T20 - D20";
      for (let t1 = 20; t1 >= 1; t1--) {
        for (let t2 = 20; t2 >= 1; t2--) {
          let r = score - (t1 * 3) - (t2 * 3);
          if (r > 0 && r <= 40 && r % 2 === 0) return `T${t1} - T${t2} - D${r / 2}`;
        }
      }
    }
  } else {
    if (score > 180) return null;
    if (dartsCount >= 1 && score <= 20) return `${score}`;
    if (dartsCount >= 1 && score === 25) return "Bull";
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
  headerRow.innerHTML = headerHtml; table.appendChild(headerRow);

  let entitesAAfficher = [];
  if (cricketState.isTeamMode) {
    listeEquipesFormees.forEach(eq => { entitesAAfficher.push({ id: eq.id, name: eq.name }); });
  } else {
    cricketState.players.forEach(p => { entitesAAfficher.push({ id: p.id, name: p.name }); });
  }

  const joueurActuel = cricketState.players[cricketState.currentPlayerIdx];
  entitesAAfficher.forEach(entite => {
    const row = document.createElement("tr");
    row.style.borderBottom = "1px solid var(--divider)";
    if(cricketState.isTeamMode ? (joueurActuel.teamId === entite.id) : (joueurActuel.id === entite.id)) {
      row.style.backgroundColor = "rgba(192,101,42,0.15)";
    }
    
    let nomTronque = entite.name.length > 9 ? entite.name.substring(0, 9) + "." : entite.name;
    let cellsHtml = `<td style="text-align:left; padding: 12px 4px; font-weight:700; width: 23%;">${nomTronque}</td>`;
    
    cricketState.targets.forEach(t => {
      const touches = cricketState.marks[entite.id][t];
      let symbole = touches === 1 ? "\\" : touches === 2 ? "X" : touches >= 3 ? `<span style="border:2px solid #ff3838; border-radius:50%; padding:2px 4px; color:#ff3838;">X</span>` : "";
      cellsHtml += `<td style="padding: 6px 2px; border-left: 1px solid var(--divider); width: 11%;">${symbole}</td>`;
    });
    cellsHtml += `<td style="font-weight:800; padding: 12px 2px; border-left: 1px solid var(--divider); color: var(--primary-strong); width: 12%;">${cricketState.scores[entite.id]}</td>`;
    row.innerHTML = cellsHtml; table.appendChild(row);
  });
}

function renderGridBounty() {
  const table = document.getElementById("cricketGridTable");
  table.innerHTML = "";
  const headerRow = document.createElement("tr");
  headerRow.innerHTML = `<th style="text-align:left; padding:10px 4px; border-bottom:2px solid var(--divider);">Joueur</th><th style="padding:10px 4px; border-bottom:2px solid var(--divider); border-left:1px solid var(--divider); color:var(--accent); width:30%;">Score</th>`;
  table.appendChild(headerRow);

  let entitesAAfficher = cricketState.isTeamMode ? listeEquipesFormees : cricketState.players;
  const joueurActuel = cricketState.players[cricketState.currentPlayerIdx];

  entitesAAfficher.forEach(entite => {
    const row = document.createElement("tr");
    if (cricketState.isTeamMode ? (joueurActuel.teamId === entite.id) : (joueurActuel.id === entite.id)) {
      row.style.backgroundColor = "rgba(192,101,42,0.15)";
    }
    row.innerHTML = `<td style="text-align:left; padding:12px 4px; font-weight:700;">${entite.name}</td><td style="font-weight:800; padding:12px 2px; border-left:1px solid var(--divider); color:var(--primary-strong); font-size:14px;">${cricketState.scores[entite.id]}</td>`;
    table.appendChild(row);
  });
}

function renderGridX01() {
  const table = document.getElementById("cricketGridTable");
  table.innerHTML = "";
  const headerRow = document.createElement("tr");
  headerRow.innerHTML = `<th style="text-align:left; padding:12px 6px; border-bottom:2px solid var(--divider); width:40%;">Joueurs</th><th style="padding:12px 4px; border-bottom:2px solid var(--divider); border-left:1px solid var(--divider); color:var(--text-soft); width:30%;">Moyenne</th><th style="padding:12px 6px; border-bottom:2px solid var(--divider); border-left:1px solid var(--divider); color:var(--accent); width:30%;">Score restant</th>`;
  table.appendChild(headerRow);

  let entitesAAfficher = cricketState.isTeamMode ? listeEquipesFormees : cricketState.players.map(p => ({ id: p.id, name: p.name, members: [p] }));
  const joueurActuel = cricketState.players[cricketState.currentPlayerIdx];

  entitesAAfficher.forEach(entite => {
    const row = document.createElement("tr");
    if(cricketState.isTeamMode ? (joueurActuel.teamId === entite.id) : (joueurActuel.id === entite.id)) {
      row.style.backgroundColor = "rgba(192,101,42,0.15)";
    }
    let totalScore = 0, totalDarts = 0;
    (entite.members || [entite]).forEach(m => {
      if(cricketState.statsDetails[m.id]) {
        totalScore += cricketState.statsDetails[m.id].totalScoreScored || 0;
        totalDarts += cricketState.statsDetails[m.id].dartsThrown || 0;
      }
    });
    let moy = totalDarts > 0 ? (totalScore / totalDarts).toFixed(1) : "0.0";
    row.innerHTML = `<td style="text-align:left; padding:14px 6px; font-weight:700;">${entite.name}</td><td style="padding:14px 4px; border-left:1px solid var(--divider); font-weight:600; font-size:14px;">${moy}</td><td style="font-weight:800; padding:14px 6px; border-left:1px solid var(--divider); color:var(--primary-strong); font-size:18px;">${cricketState.scores[entite.id]}</td>`;
    table.appendChild(row);
  });
}

function renderKeyboard() {
  const container = document.getElementById("cricketDynamicRows");
  if (!container) return; container.innerHTML = "";
  const toutEstDecouvert = cricketState.isBlind && (cricketState.revealedTargets.length >= cricketState.targets.length);

  if (cricketState.isBlind && !toutEstDecouvert) {
    for (let r = 0; r < 3; r++) {
      const row = document.createElement("div"); row.style.display = "grid"; row.style.gap = "5px";
      row.style.gridTemplateColumns = r === 2 ? "repeat(6, 1fr) 1.2fr" : "repeat(7, 1fr)";
      let start = r * 7 + 1, end = Math.min(start + 6, 20);
      for (let i = start; i <= end; i++) row.appendChild(creerBoutonClavier(i, i));
      if (r === 2) row.appendChild(creerBoutonClavier("🎯 B", 25));
      container.appendChild(row);
    }
  } else {
    const rowClassique = document.createElement("div"); rowClassique.style.display = "grid"; 
    rowClassique.style.gridTemplateColumns = `repeat(${cricketState.targets.length}, 1fr)`; rowClassique.style.gap = "5px";
    cricketState.targets.forEach(num => rowClassique.appendChild(creerBoutonClavier(num === 25 ? "🎯 B" : num, num)));
    container.appendChild(rowClassique);
  }
}

function renderKeyboardX01() {
  const container = document.getElementById("cricketDynamicRows");
  if (!container) return; container.innerHTML = "";
  for (let r = 0; r < 3; r++) {
    const row = document.createElement("div"); row.style.display = "grid"; row.style.gridTemplateColumns = "repeat(7, 1fr)"; row.style.gap = "5px";
    let start = r * 7 + 1, end = r === 2 ? 20 : start + 6;
    for (let i = start; i <= end; i++) row.appendChild(creerBoutonClavier(i, i));
    if (r === 2) row.appendChild(creerBoutonClavier("🎯 B", 25));
    container.appendChild(row);
  }
}

function creerBoutonClavier(libelle, valeur) {
  const btn = document.createElement("button"); btn.className = "ghost"; btn.style.fontSize = "14px"; 
  btn.style.fontWeight = "bold"; btn.innerText = libelle; btn.onclick = () => taperChiffre(valeur);
  if (valeur === 25) btn.id = "btnKeyBull";
  return btn;
}

function taperChiffre(valeurBouton) {
  if (cricketState.isPaused) return;
  const joueurActuel = cricketState.players[cricketState.currentPlayerIdx];
  const keyStockage = cricketState.isTeamMode ? joueurActuel.teamId : joueurActuel.id;
  
  cricketState.history.push({
      scores: JSON.parse(JSON.stringify(cricketState.scores)),
      marks: cricketState.marks ? JSON.parse(JSON.stringify(cricketState.marks)) : null,
      revealedTargets: [...cricketState.revealedTargets], 
      currentTurnDartsText: [...cricketState.currentTurnDartsText],
      bountyBonusTargets: cricketState.bountyBonusTargets ? [...cricketState.bountyBonusTargets] : null, // Ajout
      bountyMalusTarget: cricketState.bountyMalusTarget, // Ajout
      statsDetails: JSON.parse(JSON.stringify(cricketState.statsDetails)),
      currentPlayerIdx: cricketState.currentPlayerIdx, currentDart: cricketState.currentDart, currentTurn: cricketState.currentTurn, lastTurnText: cricketState.lastTurnText
    });

  let prefixeText = modificateurEnCours === 2 ? "D" : modificateurEnCours === 3 ? "T" : "";
  cricketState.currentTurnDartsText.push(valeurBouton === 0 ? "0" : valeurBouton === 25 ? prefixeText + "Bull" : prefixeText + valeurBouton);
  let estChiffreFermePourTous = false;
  if (cricketState.gameMode === "cricket" && valeurBouton !== 0 && cricketState.targets.includes(valeurBouton)) {
      const clesEntites = Object.keys(cricketState.scores);
      estChiffreFermePourTous = clesEntites.every(k => cricketState.marks[k] && cricketState.marks[k][valeurBouton] >= 3);
  }
  cricketState.statsDetails[joueurActuel.id].dartsThrown += 1;
  if (!estChiffreFermePourTous) {
      cricketState.statsDetails[joueurActuel.id].dartsThrown += 1;
  }
  if (cricketState.gameMode === "x01") traiterCalculX01(keyStockage, joueurActuel, valeurBouton);
  else if (cricketState.gameMode === "world") traiterCalculWorld(keyStockage, joueurActuel, valeurBouton);
  else if (cricketState.gameMode === "bounty") traiterCalculBounty(keyStockage, joueurActuel, valeurBouton);
  else traiterCalculCricket(keyStockage, joueurActuel, valeurBouton);

  cricketState.currentDart += 1;
  if (cricketState.currentDart > 3) cloreVoleeActuelle(joueurActuel);

  resetModifierUI(); 
  if (cricketState.gameMode === "x01") { renderKeyboardX01(); renderGridX01(); }
  else if (cricketState.gameMode === "world") { renderKeyboardX01(); renderGridWorld(); }
  else if (cricketState.gameMode === "bounty") { renderKeyboardX01(); renderGridBounty(); }
  else { renderKeyboard(); renderGrid(); }
  
  gererEtatBoutonBull(); updateTurnHeader(); verifierConditionsFinMatch();
}

function cloreVoleeActuelle(joueur) {
  if (cricketState.gameMode === "cricket" && cricketState.statsDetails[joueur.id]) {
    const stats = cricketState.statsDetails[joueur.id];
    if (stats.currentVolleyPointsGiven > stats.maxPointsGivenInOneVolley) stats.maxPointsGivenInOneVolley = stats.currentVolleyPointsGiven;
    stats.currentVolleyPointsGiven = 0;
  }
  cricketState.lastTurnText = `${cricketState.isTeamMode ? joueur.name + ' (' + joueur.teamName + ')' : joueur.name} ${cricketState.currentTurnDartsText.join('/')}`;
  
  const ancienneTeamId = joueur.teamId;
  cricketState.currentDart = 1; cricketState.currentPlayerIdx += 1; cricketState.currentTurnDartsText = [];

  if (cricketState.currentPlayerIdx >= cricketState.players.length) {
    cricketState.currentPlayerIdx = 0; 
    if (!cricketState.isTeamMode) cricketState.currentTurn += 1;
  }

  if (cricketState.isTeamMode) {
    const prochainJoueur = cricketState.players[cricketState.currentPlayerIdx];
    const ordreEquipes = listeEquipesFormees.map(eq => eq.id);
    if (ordreEquipes.indexOf(prochainJoueur.teamId) <= ordreEquipes.indexOf(ancienneTeamId)) cricketState.currentTurn += 1;
  }
}

function traiterCalculCricket(keyStockage, joueurActuel, valeurBouton) {
  if (valeurBouton === 0) return;
  if (cricketState.targets.includes(valeurBouton)) {
    const clesEntites = Object.keys(cricketState.scores);
    const estChiffreFermePourTous = clesEntites.every(k => cricketState.marks[k][valeurBouton] >= 3);
    if (estChiffreFermePourTous) return;
    
    if (!cricketState.revealedTargets.includes(valeurBouton)) cricketState.revealedTargets.push(valeurBouton);
    const stats = cricketState.statsDetails[joueurActuel.id];

    if (modificateurEnCours === 2) stats.doublesCount[valeurBouton] += 1;
    if (modificateurEnCours === 3 && valeurBouton !== 25) stats.triplesCount[valeurBouton] += 1;

    let clesEntites = Object.keys(cricketState.scores);
    if (!clesEntites.every(k => cricketState.marks[k][valeurBouton] >= 3)) stats.touchesNum[valeurBouton] += modificateurEnCours;
    
    let touchesAppliquees = Math.min(modificateurEnCours, 3 - cricketState.marks[keyStockage][valeurBouton]);
    cricketState.marks[keyStockage][valeurBouton] += touchesAppliquees;
    stats.touchesUtiles += touchesAppliquees;
    
    let surplus = modificateurEnCours - touchesAppliquees;
    if (surplus > 0) {
      let pointsDonnes = 0;
      clesEntites.forEach(k => {
        if (k !== keyStockage && cricketState.marks[k][valeurBouton] < 3) {
          let penalite = valeurBouton * surplus;
          cricketState.scores[k] -= penalite; pointsDonnes += penalite;
        }
      });
      if (pointsDonnes > 0) {
        stats.pointsGiv[valeurBouton] += pointsDonnes; stats.touchesUtiles += surplus;
        stats.totalPointsGiven += pointsDonnes; stats.currentVolleyPointsGiven += pointsDonnes;
      }
    }
  }
}

function traiterCalculX01(keyStockage, joueurActuel, valeurBouton) {
  const stats = cricketState.statsDetails[joueurActuel.id];
  
  // Calcul des points (le double Bullseye vaut 50)
  let pointsMarques = (valeurBouton === 25 && modificateurEnCours === 2 ? 50 : valeurBouton) * modificateurEnCours;
  const scoreResultat = cricketState.scores[keyStockage] - pointsMarques;

  // Détection du Bust
  let estBust = scoreResultat < 0 || 
                (scoreResultat === 1 && cricketState.x01Checkout === "double") || 
                (scoreResultat === 0 && cricketState.x01Checkout === "double" && modificateurEnCours !== 2);

  // Comptage des touches générales et spécifiques aux simples
  if (valeurBouton !== 0 && stats) {
    stats.touchesNum[valeurBouton] += modificateurEnCours;
    if (modificateurEnCours === 1) {
      stats.touchesSimpleNum[valeurBouton] += 1;
    }
  }

  // Application du score ou du Bust
  if (estBust) {
    showPopup("💥 Bust", true);
    if (stats) { 
      stats.bustsCount += 1; 
      stats.currentVolleyScore = 0; 
      stats.dartsThrown += (3 - cricketState.currentDart); 
    }
    cricketState.currentDart = 3; 
  } else {
    cricketState.scores[keyStockage] = scoreResultat;
    if (stats) {
      stats.totalScoreScored += pointsMarques; 
      stats.currentVolleyScore += pointsMarques;
      // Compte le score sur les 9 premières fléchettes
      if (stats.dartsThrown <= 9) stats.first9DartsScore += pointsMarques;
    }
  }

  // Fin de volée : mise à jour des statistiques de famille de scores
  if (cricketState.currentDart === 3 && stats) {
    if (stats.currentVolleyScore > stats.maxVolleyScore) {
      stats.maxVolleyScore = stats.currentVolleyScore;
    }
    
    if (stats.currentVolleyScore === 180) stats.scoreFamily180 += 1;
    else if (stats.currentVolleyScore >= 140) stats.scoreFamily140 += 1;
    else if (stats.currentVolleyScore >= 100) stats.scoreFamily100 += 1;
    else if (stats.currentVolleyScore >= 60) stats.scoreFamily60 += 1; // La famille des 60 ajoutée ici
    
    stats.currentVolleyScore = 0; 
  }
}

function traiterCalculBounty(keyStockage, joueurActuel, valeurBouton) {
  const stats = cricketState.statsDetails[joueurActuel.id];
  let pointsMarques = 0; if (valeurBouton === 0) return;

  if (!stats.chiffresVisites[valeurBouton]) stats.chiffresVisites[valeurBouton] = { simples: 0, doubles: 0, triples: 0 };

  if (cricketState.bountyBonusTargets.includes(valeurBouton)) {
    pointsMarques = valeurBouton * modificateurEnCours; stats.touchesPositives += modificateurEnCours;
    const idxAChanger = cricketState.bountyBonusTargets.indexOf(valeurBouton);
    cricketState.bountyBonusTargets[idxAChanger] = generateNewBountyTarget(cricketState.bountyBonusTargets.filter(t => t !== valeurBouton), cricketState.bountyMalusTarget);
    mettreAJourCiblesBountyUI();
  } else if (valeurBouton === cricketState.bountyMalusTarget) {
    pointsMarques = - (valeurBouton * modificateurEnCours); stats.touchesMalus += modificateurEnCours;
    if (cricketState.bountyHasMalus) {
      cricketState.bountyMalusTarget = generateNewBountyTarget(cricketState.bountyBonusTargets, null);
      mettreAJourCiblesBountyUI();
    }
  }
  cricketState.scores[keyStockage] += pointsMarques;
    
  if (pointsMarques > 0) {
      stats.touchesPositives += pointsMarques; // Cumul des points gagnés
  } else if (pointsMarques < 0) {
      stats.touchesMalus += Math.abs(pointsMarques); // Cumul des points perdus
  }

  if (modificateurEnCours === 1) stats.simples += 1;
  else if (modificateurEnCours === 2) stats.doubles += 1;
  else if (modificateurEnCours === 3) stats.triples += 1;
}

function mettreAJourCiblesBountyUI() {
  const bonusContainer = document.getElementById("bountyBonusContainer");
  const malusContainer = document.getElementById("bountyMalusContainer");
  const malusBadge = document.getElementById("bountyMalusBadge");
  if (bonusContainer) bonusContainer.innerHTML = cricketState.bountyBonusTargets.map(t => `<span class="badge" style="background: #28a745; color: white; font-size: 16px; padding: 6px 12px;">${t}</span>`).join('');
  if (malusContainer) {
    if (cricketState.bountyHasMalus) { malusContainer.classList.remove("hidden"); if (malusBadge) malusBadge.innerText = cricketState.bountyMalusTarget; }
    else malusContainer.classList.add("hidden");
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
  
  if (precedentState.bountyBonusTargets) cricketState.bountyBonusTargets = precedentState.bountyBonusTargets;
  if (precedentState.bountyMalusTarget !== undefined) cricketState.bountyMalusTarget = precedentState.bountyMalusTarget;
  
  cricketState.statsDetails = precedentState.statsDetails; 
  cricketState.currentPlayerIdx = precedentState.currentPlayerIdx;
  cricketState.currentDart = precedentState.currentDart; 
  cricketState.currentTurn = precedentState.currentTurn; 
  cricketState.lastTurnText = precedentState.lastTurnText;
  
  resetModifierUI(); 
  if (cricketState.gameMode === "x01") { renderKeyboardX01(); renderGridX01(); }
  else if (cricketState.gameMode === "world") { renderKeyboardX01(); renderGridWorld(); }
  else if (cricketState.gameMode === "bounty") { renderKeyboardX01(); renderGridBounty(); mettreAJourCiblesBountyUI(); }
  else { renderKeyboard(); renderGrid(); }
  updateTurnHeader();
}

function verifierConditionsFinMatch() {
  let gagnantId = null; let clesEntites = Object.keys(cricketState.scores);
  
  if (cricketState.gameMode === "x01") {
    for (let k of clesEntites) { if (cricketState.scores[k] === 0) { gagnantId = k; break; } }
  } else if (cricketState.gameMode === "world") {
    for (let k of clesEntites) { if (cricketState.scores[k] > cricketState.worldEndNum) { gagnantId = k; break; } }
  } else if (cricketState.gameMode === "bounty") {
    const scoreCible = document.getElementById("bountyTargetScoreSelect") ? parseInt(document.getElementById("bountyTargetScoreSelect").value, 10) : 300;
    if (scoreCible !== 9999) {
      for (let k of clesEntites) { if (cricketState.scores[k] >= scoreCible) { gagnantId = k; break; } }
    }
    if (!gagnantId && cricketState.maxTurns !== 999 && cricketState.currentTurn > cricketState.maxTurns) {
      let meilleurScore = -Infinity; clesEntites.forEach(k => { if (cricketState.scores[k] > meilleurScore) { meilleurScore = cricketState.scores[k]; gagnantId = k; } });
    }
  } else {
    for (let k of clesEntites) {
      if (cricketState.targets.every(t => cricketState.marks[k][t] >= 3) && clesEntites.every(autreKey => cricketState.scores[k] >= cricketState.scores[autreKey])) { gagnantId = k; break; }
    }
    if (!gagnantId && cricketState.currentTurn > cricketState.maxTurns && cricketState.maxTurns !== 999) {
      let meilleurScore = -Infinity; clesEntites.forEach(k => { if (cricketState.scores[k] > meilleurScore) { meilleurScore = cricketState.scores[k]; gagnantId = k; } });
    }
  }

  if (gagnantId) {
    clearInterval(cricketState.timerInterval);
    let nomVainqueur = cricketState.isTeamMode ? (listeEquipesFormees.find(e => e.id === gagnantId)?.name || "Inconnu") : (cricketState.players.find(p => p.id === gagnantId)?.name || "Inconnu");

    setTimeout(async () => {
      const confirmation = await openCustomModal("🏆 Partie Terminée !", `${nomVainqueur} remporte la partie ! Souhaitez-vous valider et enregistrer ce résultat ?`);
      if (confirmation) lancerPageVictoire(gagnantId, nomVainqueur); 
      else { annulerDernierCoup(); cricketState.timerInterval = setInterval(updateTimer, 1000); }
    }, 100);
  }
}

function lancerPageVictoire(gagnantId, nomVainqueur) {
  document.getElementById("victoryTitle").innerText = `${nomVainqueur} gagne la partie !`;
  document.getElementById("victorySubtitle").innerText = `Match bouclé en ${document.getElementById("gameTimerDisplay").innerText}`;
  
  let classementTrie = cricketState.isTeamMode ? listeEquipesFormees.map(e => ({ id: e.id, name: e.name })) : cricketState.players.map(p => ({ id: p.id, name: p.name }));
  classementTrie.sort((a, b) => cricketState.gameMode === "x01" ? cricketState.scores[a.id] - cricketState.scores[b.id] : cricketState.scores[b.id] - cricketState.scores[a.id]);
  
  const containerRanking = document.getElementById("finalRankingList"); containerRanking.innerHTML = "";
  classementTrie.forEach((entite, idx) => {
    const row = document.createElement("div"); row.className = "stat-row"; row.style.padding = "10px";
    row.style.background = entite.id === gagnantId ? "rgba(192,101,42,0.15)" : "rgba(255,255,255,0.02)"; row.style.borderRadius = "12px";
    row.innerHTML = `<span><strong>#${idx + 1}</strong> — 👤 ${entite.name}</span><span style="color:var(--primary-strong); font-weight:800;"> ${cricketState.scores[entite.id]}</span>`;
    containerRanking.appendChild(row);
  });

  db.collection("games_history").add({
    type: cricketState.gameMode, winner: nomVainqueur, duration: cricketState.elapsedTime, createdAt: Date.now(),
    isTeamMode: cricketState.isTeamMode, maxTurns: cricketState.maxTurns, communityId: communauteCibleMatchId,
    participantIds: joueursSelectionnesMatch.map(p => p.id)
  }).then(() => console.log("Match enregistré !")).catch(e => console.error(e));
  
  showScreen(screens.gameOver);
}

document.getElementById("btnGoHomeAfterMatch").onclick = () => showScreen(screens.home);
document.getElementById("btnGoHomeAfterStats").onclick = () => showScreen(screens.home);
document.getElementById("btnRematch").onclick = () => {
  if (cricketState.gameMode === "x01") demarrerMatchX01(cricketState.players);
  else if (cricketState.gameMode === "world") demarrerMatchWorld(cricketState.players); 
  else demarrerMatchCricket(cricketState.players);
};

document.getElementById("btnGoToStats").onclick = () => { genererTableauStatistiques(); showScreen(screens.matchStats); };
document.getElementById("btnBackToPodium").onclick = () => showScreen(screens.gameOver);

function genererTableauStatistiques() {
  const tableEl = document.getElementById("matchStatsTable");
  if (!tableEl) return;
  
  const parentContainer = tableEl.parentElement;
  parentContainer.innerHTML = ""; // On vide proprement l'ancien contenu

  // Création d'un wrapper de bloc dédié pour accueillir vos cartes
  const mainWrapper = document.createElement("div");
  mainWrapper.style.padding = "0 8px 40px 8px"; 
  mainWrapper.style.display = "flex";
  mainWrapper.style.flexDirection = "column";
  mainWrapper.style.gap = "20px";
  mainWrapper.style.width = "100%";
  parentContainer.appendChild(mainWrapper);

  // Recréation de la table fantôme indispensable pour le cycle de l'app
  const backupTable = document.createElement("table");
  backupTable.id = "matchStatsTable";
  backupTable.style.display = "none";
  parentContainer.appendChild(backupTable);

  function creerBlocStats(titreBloc) {
    const blockDiv = document.createElement("div");
    blockDiv.style.background = "var(--card-bg)";
    blockDiv.style.border = "1px solid var(--card-border)";
    blockDiv.style.borderRadius = "var(--r-2)";
    blockDiv.style.padding = "12px";
    blockDiv.style.boxShadow = "0 4px 12px rgba(227, 212, 174, 0.05)";
    blockDiv.style.width = "100%";
    
    const h3 = document.createElement("h3");
    h3.style.textAlign = "left";
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

  // ==========================================
  // RENDU DU MODE : TOUR DU MONDE
  // ==========================================
  } else if (cricketState.gameMode === "world") {
    const blocGenW = creerBlocStats("📊 Bilan du Voyage");
    genererEnteteJoueurs(blocGenW.table);

    let rowTotDarts = document.createElement("tr"); rowTotDarts.style.borderBottom = "1px solid var(--divider)";
    let dartsHtml = `<td style="text-align:left; padding:10px 8px; font-weight:600;">Fléchettes lancées</td>`;
    cricketState.players.forEach(p => {
      dartsHtml += `<td style="font-weight:700; text-align:center; border-left:1px solid var(--divider); color:var(--primary-strong);">${cricketState.statsDetails[p.id].dartsThrown || 0} darts</td>`;
    });
    rowTotDarts.innerHTML = dartsHtml; blocGenW.table.appendChild(rowTotDarts);

    let rowAvgTarget = document.createElement("tr"); rowAvgTarget.style.borderBottom = "1px solid var(--divider)";
    let avgHtml = `<td style="text-align:left; padding:10px 8px; font-size:13px; color:var(--text-soft); font-weight:600;">Moy. fléchettes / cible</td>`;
    cricketState.players.forEach(p => {
      const totalThrown = cricketState.statsDetails[p.id].dartsThrown || 0;
      const targetsHit = cricketState.statsDetails[p.id].totalTargetsHit || 1;
      avgHtml += `<td style="text-align:center; border-left:1px solid var(--divider); font-weight:600; color:var(--text-soft);">${(totalThrown / targetsHit).toFixed(1)}</td>`;
    });
    rowAvgTarget.innerHTML = avgHtml; blocGenW.table.appendChild(rowAvgTarget);
    mainWrapper.appendChild(blocGenW.blockDiv);

  // ==========================================
  // RENDU DU MODE : CHASSEUR DE PRIMES (BOUNTY)
  // ==========================================
    } else if (cricketState.gameMode === "bounty") {
    const blocGenB = creerBlocStats("💰 Tableau de Chasse");
    genererEnteteJoueurs(blocGenB.table);

    let rowPtsGagnes = document.createElement("tr"); rowPtsGagnes.style.borderBottom = "1px solid var(--divider)";
    let ptsGHtml = `<td style="text-align:left; padding:10px 8px; font-weight:600; color:#28a745;">Points gagnés</td>`;
    cricketState.players.forEach(p => { ptsGHtml += `<td style="font-weight:700; text-align:center; border-left:1px solid var(--divider); color:#28a745;">+${cricketState.statsDetails[p.id].touchesPositives || 0}</td>`; });
    rowPtsGagnes.innerHTML = ptsGHtml; blocGenB.table.appendChild(rowPtsGagnes);

    let rowPtsPerdus = document.createElement("tr"); rowPtsPerdus.style.borderBottom = "1px solid var(--divider)";
    let ptsPHtml = `<td style="text-align:left; padding:10px 8px; font-weight:600; color:var(--danger);">Points perdus</td>`;
    cricketState.players.forEach(p => { ptsPHtml += `<td style="font-weight:700; text-align:center; border-left:1px solid var(--divider); color:var(--danger);">-${cricketState.statsDetails[p.id].touchesMalus || 0}</td>`; });
    rowPtsPerdus.innerHTML = ptsPHtml; blocGenB.table.appendChild(rowPtsPerdus);
    
    let rowChiffresT = document.createElement("tr"); rowChiffresT.style.borderBottom = "1px solid var(--divider)";
    let cTHtml = `<td style="text-align:left; padding:10px 8px; font-size:13px;">Chiffres touchés (Total)</td>`;
    cricketState.players.forEach(p => {
        const totalHits = (cricketState.statsDetails[p.id].simples || 0) + (cricketState.statsDetails[p.id].doubles || 0) + (cricketState.statsDetails[p.id].triples || 0);
        cTHtml += `<td style="text-align:center; border-left:1px solid var(--divider);">${totalHits}</td>`;
    });
    rowChiffresT.innerHTML = cTHtml; blocGenB.table.appendChild(rowChiffresT);
    mainWrapper.appendChild(blocGenB.blockDiv);

    const blocMultiplicateurs = creerBlocStats("🎯 Précision des tirs");
    genererEnteteJoueurs(blocMultiplicateurs.table);

    let rowS = document.createElement("tr"); rowS.style.borderBottom = "1px solid var(--divider)";
    let sHtml = `<td style="text-align:left; padding:10px 8px;">Simples</td>`;
    cricketState.players.forEach(p => { sHtml += `<td style="text-align:center; border-left:1px solid var(--divider);">${cricketState.statsDetails[p.id].simples || 0}</td>`; });
    rowS.innerHTML = sHtml; blocMultiplicateurs.table.appendChild(rowS);

    let rowD = document.createElement("tr"); rowD.style.borderBottom = "1px solid var(--divider)";
    let dHtml = `<td style="text-align:left; padding:10px 8px; font-weight:600;">Doubles 🥈</td>`;
    cricketState.players.forEach(p => { dHtml += `<td style="text-align:center; border-left:1px solid var(--divider); font-weight:600; color:var(--accent);">${cricketState.statsDetails[p.id].doubles || 0}</td>`; });
    rowD.innerHTML = dHtml; blocMultiplicateurs.table.appendChild(rowD);

    let rowT = document.createElement("tr"); rowT.style.borderBottom = "1px solid var(--divider)";
    let tHtml = `<td style="text-align:left; padding:10px 8px; font-weight:700;">Triples 🥇</td>`;
    cricketState.players.forEach(p => { tHtml += `<td style="text-align:center; border-left:1px solid var(--divider); font-weight:700; color:var(--primary);">${cricketState.statsDetails[p.id].triples || 0}</td>`; });
    rowT.innerHTML = tHtml; blocMultiplicateurs.table.appendChild(rowT);
    mainWrapper.appendChild(blocMultiplicateurs.blockDiv);

  // ==========================================
  // RENDU DU MODE : X01
  // ==========================================
  } else if (cricketState.gameMode === "x01") {
    const blocGenX = creerBlocStats("💯 Bilan X01");
    genererEnteteJoueurs(blocGenX.table);

    let rowMoy = document.createElement("tr"); rowMoy.style.borderBottom = "1px solid var(--divider)";
    let moyHtml = `<td style="text-align:left; padding:10px 8px; font-weight:600; color:var(--accent);">Moyenne / Volée (3 darts)</td>`;
    cricketState.players.forEach(p => {
      const totalPoints = cricketState.statsDetails[p.id].totalScoreScored || 0;
      const totalDarts = cricketState.statsDetails[p.id].dartsThrown || 1;
      moyHtml += `<td style="font-weight:700; text-align:center; border-left:1px solid var(--divider); color:var(--primary-strong); font-size:14px;">${((totalPoints / totalDarts) * 3).toFixed(1)} pts</td>`;
    });
    rowMoy.innerHTML = moyHtml; blocGenX.table.appendChild(rowMoy);

    let rowMaxX = document.createElement("tr"); rowMaxX.style.borderBottom = "1px solid var(--divider)";
    let maxXHtml = `<td style="text-align:left; padding:10px 8px; font-size:13px;">Meilleure Volée</td>`;
    cricketState.players.forEach(p => {
      maxXHtml += `<td style="text-align:center; border-left:1px solid var(--divider); font-weight:700;">⚡ ${cricketState.statsDetails[p.id].maxVolleyScore || 0}</td>`;
    });
    rowMaxX.innerHTML = maxXHtml; blocGenX.table.appendChild(rowMaxX);
    mainWrapper.appendChild(blocGenX.blockDiv);
  }
}