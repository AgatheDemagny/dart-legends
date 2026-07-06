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

// ================== MODALE DES RÈGLES DU JEU ==================

const RULES_DATA = {
  cricket: `
    <h4 style="color: var(--primary); margin-bottom: 8px;">🎯 Principe du jeu</h4>
    <p style="margin-bottom: 8px; padding: 0;">Le Cricket classique se joue uniquement sur une partie de la cible : les numéros <strong>15, 16, 17, 18, 19, 20 et le Bull (B)</strong>. Le but est de "fermer" toutes ces zones avant ses adversaires tout en obtenant le score le plus élevé.</p>
    <p style="margin-bottom: 8px; padding: 0;"><strong>Comment fermer un chiffre :</strong> Un joueur doit toucher le numéro 3 fois. Un secteur Simple compte pour 1 touche, un secteur Double compte pour 2 touches, et un secteur Triple compte pour 3 touches (fermeture directe).</p>
    <p style="margin-bottom: 12px; padding: 0;"><strong>Marquer des points :</strong> Une fois qu'un joueur a fermé un numéro, chaque fléchette supplémentaire qu'il place dans ce même numéro met des points à ses adversaires <em>qui n'ont pas encore fermé ce numéro</em>. Si tout le monde a fermé le numéro, il est définitivement éteint pour la partie.</p>
    
    <h4 style="color: var(--primary); margin-bottom: 8px;">🏆 Condition de victoire</h4>
    <p style="margin-bottom: 12px; padding: 0;">Pour gagner, un joueur doit avoir <strong>fermé les 7 zones</strong> ET posséder un <strong>score supérieur ou égal</strong> à celui de tous ses adversaires. Si la limite de tours est atteinte, c'est le joueur avec le score le plus élevé qui l'emporte.</p>
    
    <h4 style="color: var(--primary); margin-bottom: 8px;">⚙️ Explication des paramètres</h4>
    <ul style="padding-left: 18px; margin-bottom: 0;">
      <li style="margin-bottom: 6px;"><strong>Nombre de tours :</strong> Définit une limite de tours. Si personne n'a tout fermé à la fin, le score départage les joueurs.</li>
      <li><strong>Mode n'a qu'un œil :</strong> Variante masquée. Les numéros à cibler ne sont plus les chiffres classiques (15 à 20 + Bull) , mais 7 chiffres secrets tirés au hasard qu'il faut découvrir en explorant la cible avec ses fléchettes.</li>
    </ul>
  `,
  x01: `
    <h4 style="color: var(--primary); margin-bottom: 8px;">🎯 Principe du jeu</h4>
    <p style="margin-bottom: 8px; padding: 0;">Chaque joueur démarre la partie avec un capital de points fixe (301, 501, ...). À chaque tour, les points cumulés par les 3 fléchettes sont soustraits du total. Le but étant de descendre pour atteindre <strong>exactement zéro point</strong>.</p>
    <p style="margin-bottom: 12px; padding: 0;"><strong>Valeur des lancers :</strong> Les zones Simples rapportent la valeur du chiffre. L'anneau extérieur (Double) multiplie les points de la fléchette par 2. L'anneau intermédiaire (Triple) multiplie les points par 3. Le Bull extérieur vaut 25 points et le centre du Bull vaut 50 points.</p>
    
    <h4 style="color: var(--primary); margin-bottom: 8px;">💥 La règle du "Bust" (Casse)</h4>
    <p style="margin-bottom: 12px; padding: 0;">Si vous marquez plus de points qu'il ne vous en reste, ou s'il vous reste exactement 1 point alors que vous jouez avec l'obligation de finir sur un double, votre tour s'arrête immédiatement. Le lancer est considéré comme nul ("Bust") et votre score est réinitialisé à ce qu'il était au début de votre tour.</p>
    
    <h4 style="color: var(--primary); margin-bottom: 8px;">⚙️ Explication des paramètres</h4>
    <ul style="padding-left: 18px; margin-bottom: 0;">
      <li style="margin-bottom: 6px;"><strong>Points de départ :</strong> Le score initial attribué au début du match (ex: 301 pour une partie rapide, 501 pour le format officiel, ...).</li>
      <li><strong>Checkout :</strong> En mode "Double-out", vous devez impérativement loger votre toute dernière fléchette de victoire dans un secteur <strong>Double</strong> pour tomber à zéro. Sans contrainte, n'importe quelle zone de la cible suffit.</li>
    </ul>
  `,
  world: `
    <h4 style="color: var(--primary); margin-bottom: 8px;">🎯 Principe du jeu</h4>
    <p style="margin-bottom: 12px; padding: 0;">Le Tour du Monde est une course de précision chronologique. Tous les joueurs doivent toucher l'intégralité des numéros de la cible les uns après les autres dans l'ordre croissant (de votre chiffre de départ jusqu'au chiffre d'arrivée). Tant que vous n'avez pas réussi à toucher votre numéro cible actuel, vous êtes bloqué dessus et ne pouvez pas viser le suivant.</p>
    
    <h4 style="color: var(--primary); margin-bottom: 8px;">🏆 Condition de victoire</h4>
    <p style="margin-bottom: 12px; padding: 0;">Le premier joueur à valider avec succès le dernier chiffre de l'itinéraire gagne immédiatement la partie.</p>
    
    <h4 style="color: var(--primary); margin-bottom: 8px;">⚙️ Explication des paramètres</h4>
    <ul style="padding-left: 18px; margin-bottom: 0;">
      <li style="margin-bottom: 6px;"><strong>Départ & Arrivée :</strong> Déterminent les bornes du parcours pour moduler la longueur du jeu (ex: débuter au 1 et terminer au Bull).</li>
      <li><strong>Sauter les numéros (Doubles/Triples) :</strong> Si l'option est cochée, réussir un tir de précision accélère votre voyage ! Toucher le Triple de votre numéro cible actuel vous fait bondir de 3 étapes (+3), et un Double vous fait avancer de 2 étapes (+2). Si l'option est décochée, les doubles et triples n'ont aucun effet bonus et agissent comme des touches simples (+1).</li>
    </ul>
  `,
  bounty: `
    <h4 style="color: var(--primary); margin-bottom: 8px;">🎯 Principe du jeu</h4>
    <p style="margin-bottom: 8px; padding: 0;">Le Chasseur de primes est un mode dynamique où les zones cibles changent à chaque impact. L'écran affiche plusieurs chiffres aléatoires qui représentent des <strong>Primes</strong>. Lorsqu'un joueur touche une prime active, la valeur du chiffre (multipliée par 2 ou 3 si c'est un Double/Triple) est ajoutée à son score.</p>
    <p style="margin-bottom: 12px; padding: 0;"><strong>Renouvellement instantané :</strong> Dès qu'un chiffre prime est touché, il disparaît et est remplacé sur-le-champ par un nouveau numéro choisi au hasard, garantissant qu'il soit unique et distinct des autres primes ou malus à l'écran.</p>
    
    <h4 style="color: var(--primary); margin-bottom: 8px;">⚙️ Explication des paramètres</h4>
    <ul style="padding-left: 18px; margin-bottom: 0;">
      <li style="margin-bottom: 6px;"><strong>Nombre de primes :</strong> Définit la quantité de primes disponibles simultanément sur le panneau (2, 3 ou 4).</li>
      <li style="margin-bottom: 6px;"><strong>Nombre de tours / Score cible :</strong> Fixent la fin du match. Le but est d'atteindre le score cible en premier ou d'avoir le meilleur score à la fin des manches. Par sécurité, le jeu bloque le départ si ces deux paramètres sont configurés en illimité.</li>
      <li style="margin-bottom: 6px;"><strong>Chiffres renouvelés après :</strong> Nombre de tours maximum avant qu'une prime non touchée n'expire et ne change automatiquement de valeur pour éviter les situations de blocage.</li>
      <li><strong>Activer un chiffre Malus 💀 :</strong> Si coché, un chiffre maudit apparaît en rouge à l'écran. Le premier joueur maladroit qui le touche subit une pénalité financière et perd les points correspondants (multipliés si Double/Triple). Le malus se déplace aussitôt après l'impact.</li>
    </ul>
  `
};

// Gestion de l'ouverture et fermeture
const btnOpenRules = document.getElementById("btnOpenRules");
const btnCloseRules = document.getElementById("btnCloseRules");
const rulesModalOverlay = document.getElementById("rulesModalOverlay");
const rulesContent = document.getElementById("rulesContent");
const ruleTabs = document.querySelectorAll("#rulesModalOverlay .tab-btn");

if (btnOpenRules && rulesModalOverlay) {
  btnOpenRules.addEventListener("click", () => {
    // On sélectionne l'onglet correspondant au jeu actuellement choisi
    const currentGameMode = document.getElementById("gameModeSelect").value || "cricket";
    updateRulesModalContent(currentGameMode);
    rulesModalOverlay.classList.remove("hidden");
  });

  btnCloseRules.addEventListener("click", () => {
    rulesModalOverlay.classList.add("hidden");
  });

  // Gestion des clics sur les onglets de la modale
  ruleTabs.forEach(tab => {
    tab.addEventListener("click", (e) => {
      const mode = e.target.getAttribute("data-rule-tab");
      updateRulesModalContent(mode);
    });
  });
}

function updateRulesModalContent(mode) {
  // MAJ du style des onglets
  ruleTabs.forEach(tab => {
    if (tab.getAttribute("data-rule-tab") === mode) {
      tab.classList.add("active");
    } else {
      tab.classList.remove("active");
    }
  });
  
  // MAJ du contenu
  if (RULES_DATA[mode]) {
    rulesContent.innerHTML = RULES_DATA[mode];
  }
}

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

function generateNewBountyTarget(currentBonusTargets, currentMalusTarget, excludedTarget = null) {
    const availableTargets = SEQUENCE_TOUR_DU_MONDE.filter(t => 
        !currentBonusTargets.includes(t) && t !== currentMalusTarget && t !== excludedTarget
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

// Remplace la fonction existante
function renderSelectedPlayers() {
  const container = document.getElementById("selectedPlayersMatchList");
  if (!container) return;
  container.innerHTML = "";
  
  joueursSelectionnesMatch.forEach((p, index) => {
    const div = document.createElement("div");
    div.style.padding = "8px";
    div.style.borderBottom = "1px solid var(--divider)";
    div.style.display = "flex";
    div.style.justifyContent = "space-between";
    div.style.alignItems = "center";
    
    div.innerHTML = `<span>${p.name}</span>`;
    
    // Ajout de la croix pour supprimer un joueur
    const btnRemove = document.createElement("button");
    btnRemove.className = "icon-btn";
    btnRemove.style.width = "28px"; btnRemove.style.height = "28px"; btnRemove.style.fontSize = "12px";
    btnRemove.innerText = "❌";
    btnRemove.onclick = () => {
      joueursSelectionnesMatch.splice(index, 1);
      renderSelectedPlayers();
    };
    
    div.appendChild(btnRemove);
    container.appendChild(div);
  });

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
 
  document.getElementById("startGameBtn").disabled = false;

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
    effacerSauvegarde();
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
  
  listeEquipesFormees.forEach((eq, teamIndex) => {
    const div = document.createElement("div");
    div.style.padding = "10px";
    div.style.background = "#FDFDFB";
    div.style.border = "1px solid var(--divider)";
    div.style.borderRadius = "8px";
    
    let html = `<div class="team-config-title" style="margin-bottom: 8px; text-align: center;">${eq.name}</div>`;
    
    eq.members.forEach((m, mIndex) => {
      html += `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0; border-bottom: 1px solid rgba(0,0,0,0.05);">
          <span class="team-config-player">${m.name}</span>
          <button class="ghost" style="padding: 4px 8px; font-size: 11px;" onclick="deplacerJoueurEquipe('${eq.id}', '${m.id}')">➡️​ Changer d'équipe</button>
        </div>`;
    });
    
    div.innerHTML = html;
    container.appendChild(div);
  });
}

// Ajoute cette nouvelle fonction juste en dessous
window.deplacerJoueurEquipe = function(currentTeamId, playerId) {
  const currentTeam = listeEquipesFormees.find(e => e.id === currentTeamId);
  const playerIndex = currentTeam.members.findIndex(m => m.id === playerId);
  const player = currentTeam.members[playerIndex];
  
  currentTeam.members.splice(playerIndex, 1); // Retire le joueur
  
  // Trouve l'équipe suivante
  let nextTeamIndex = listeEquipesFormees.findIndex(e => e.id === currentTeamId) + 1;
  if (nextTeamIndex >= listeEquipesFormees.length) nextTeamIndex = 0;
  
  // Ajoute à la nouvelle équipe
  player.teamId = listeEquipesFormees[nextTeamIndex].id;
  player.teamName = listeEquipesFormees[nextTeamIndex].name;
  listeEquipesFormees[nextTeamIndex].members.push(player);
  
  renderTeamsConfig();
};

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
bountyTurnsSelect.addEventListener('change', checkBountyLimits);
bountyTargetScoreSelect.addEventListener('change', checkBountyLimits);

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
        setTimeout(verifierSauvegardeAuDemarrage, 600);
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
  const email = document.getElementById("authEmail").value.trim().toLowerCase();
  const password = document.getElementById("authPassword").value.trim();
  if (!email || !password) return showPopup("Champs obligatoires.", true);
  try {
    // 1. Chercher un compte invité avec cette adresse mail
    const guestSnap = await db.collection("players").where("email", "==", email).where("isRealAccount", "==", false).get();
    let existingGuest = null;
    if (!guestSnap.empty) {
      existingGuest = { id: guestSnap.docs[0].id, ...guestSnap.docs[0].data() };
    }

    const cred = await auth.createUserWithEmailAndPassword(email, password);
    const newUid = cred.user.uid;
    const finalName = existingGuest ? existingGuest.name : email.split('@')[0];

    // 2. Création du joueur en BDD
    await db.collection("players").doc(newUid).set({
      email: email, 
      name: finalName, 
      createdAt: Date.now(),
      communityIds: existingGuest ? existingGuest.communityIds : [],
      isRealAccount: true
    });

    // 3. Remplacement du guest dans ses communautés
    if (existingGuest) {
      for (const commuId of existingGuest.communityIds) {
        const cDoc = await db.collection("communities").doc(commuId).get();
        if (cDoc.exists) {
          let members = cDoc.data().memberIds || [];
          members = members.filter(id => id !== existingGuest.id);
          members.push(newUid);
          await db.collection("communities").doc(commuId).update({ memberIds: members });
        }
      }
      await db.collection("players").doc(existingGuest.id).delete();
      showPopup(`Compte créé et rattaché à tes communautés ! Bienvenue ${finalName} 🎯`);
    } else {
      showPopup("Compte créé avec succès ! 🎯");
    }
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
    btn.innerText = `${j.name}`;
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

let selectedEmoji = "🎯";
const emojiList = [
  "😂", "🤩", "🥰", "😍", "🥳", "😎", "🤓", "🤯", "🤠", "🤡",
  "💩", "🗿", "👀", "💪🏼", "🫶🏼", "❤️", "🎯", "🏆", "🏅", "🎉",
  "🎲", "🎮", "🧭", "⚽", "🏀", "🏈", "🥊", "🍺", "🍷", "🍹",  
  "🔥", "🌞", "⚡", "✨", "👑", "🚀", "⚔️", "🏰", "🍄", "🌈",
  "🐱", "🐺", "🦉", "🦂", "🐨", "🐷", "🦖", "🦓", "🐧", "🐝", 
  "🦑", "🦐", "🍕", "🍉"
];

// Remplir la grille d'emojis une seule fois
const emojiGrid = document.getElementById("emojiGrid");
emojiList.forEach(em => {
  const btn = document.createElement("button");
  btn.className = "ghost";
  btn.style.padding = "6px 8px";
  btn.style.fontSize = "22px";
  btn.innerText = em;
  btn.onclick = () => {
    selectedEmoji = em;
    document.getElementById("btnSelectEmoji").innerText = em;
    emojiGrid.classList.add("hidden");
  };
  emojiGrid.appendChild(btn);
});

// Ouvrir/fermer la grille d'emojis
document.getElementById("btnSelectEmoji").addEventListener("click", () => {
  emojiGrid.classList.toggle("hidden");
});

// Ouvrir le formulaire de création
document.getElementById("btnDeclencherCreerCommu").addEventListener("click", () => {
  actionCommuEnCours = "creer";
  document.getElementById("titreActionCommu").innerText = "Créer une communauté";
  document.getElementById("inputNomCodeCommu").placeholder = "Nom de la communauté";
  document.getElementById("btnSelectEmoji").classList.remove("hidden"); // Affiche l'emoji
  document.getElementById("emojiGrid").classList.add("hidden"); // Cache la grille par défaut
  document.getElementById("zoneFormulaireCommu").classList.remove("hidden");
});

// Ouvrir le formulaire pour rejoindre
document.getElementById("btnDeclencherRejoindreCommu").addEventListener("click", () => {
  actionCommuEnCours = "rejoindre";
  document.getElementById("titreActionCommu").innerText = "Rejoindre une communauté";
  document.getElementById("inputNomCodeCommu").placeholder = "Code de la communauté (ex: ABC123)";
  document.getElementById("btnSelectEmoji").classList.add("hidden"); // Cache l'emoji
  document.getElementById("emojiGrid").classList.add("hidden");
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
        name: `${selectedEmoji} ${valeur}`, // On concatène l'emoji et le nom
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

      showPopup(`Communauté créée ! Code : ${codeCommu}`);
    } else {
      const snap = await db.collection("communities").where("code", "==", valeur.toUpperCase()).get();
      if (snap.empty) return showPopup("Communauté introuvable avec ce code.", true);
      
      const commuDoc = snap.docs[0];
      const commuData = commuDoc.data();
      
      if (commuData.memberIds.includes(user.uid)) {
        return showPopup("Vous faites déjà partie de cette communauté.", true);
      }

      // ===== VÉRIFICATION DU CONFLIT DE NOM INTÉGRÉE ICI =====
      const playerDocCourant = await db.collection("players").doc(user.uid).get();
      const monPseudoActuel = playerDocCourant.exists ? playerDocCourant.data().name : "";

      for (const uid of commuData.memberIds) {
        const uDoc = await db.collection("players").doc(uid).get();
        if (uDoc.exists && uDoc.data().name?.toLowerCase() === monPseudoActuel.toLowerCase()) {
          return showPopup("Conflit de nom : modifiez votre nom avant de pouvoir rejoindre cette communauté.", true);
        }
      }
      // =======================================================
      
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
  
  if (!name && !email) return showPopup("Veuillez renseigner un nom ou un email.", true);

  try {
    let targetAccount = null;
    let finalName = name;

    // 1. Si un email est renseigné, on vérifie si le compte existe déjà
    if (email) {
      const snap = await db.collection("players").where("email", "==", email).where("isRealAccount", "==", true).get();
      if (!snap.empty) {
        targetAccount = { id: snap.docs[0].id, ...snap.docs[0].data() };
        finalName = targetAccount.name; // Le nom du vrai compte prime
      } else if (!name) {
        // Mail fourni mais inconnu ET aucun nom fourni pour créer l'invité
        return showPopup("Aucun compte avec cet email. Renseignez un nom pour l'inviter.", true);
      }
    }

    if (!finalName) return showPopup("Le nom est obligatoire.", true);

    // 2. VÉRIFICATION DU CONFLIT DE NOM (la règle stricte du PDF)
    for (const uid of commuSelectionneePourModal.memberIds) {
      const uDoc = await db.collection("players").doc(uid).get();
      if (uDoc.exists) {
        const uData = uDoc.data();
        if (uData.name?.toLowerCase() === finalName.toLowerCase() && targetAccount?.id !== uid) {
          return showPopup(`Le pseudo '${finalName}' existe déjà dans la communauté. L'ajout est bloqué.`, true);
        }
      }
    }

    // 3. AJOUT OU CRÉATION
    if (targetAccount) {
      // Le compte existe -> On l'ajoute
      if (commuSelectionneePourModal.memberIds.includes(targetAccount.id)) {
        return showPopup("Ce joueur fait déjà partie de la communauté.", true);
      }
      
      const newCommuIds = [...(targetAccount.communityIds || []), commuSelectionneePourModal.id];
      await db.collection("players").doc(targetAccount.id).update({ communityIds: newCommuIds });
      
      const newMembers = [...commuSelectionneePourModal.memberIds, targetAccount.id];
      await db.collection("communities").doc(commuSelectionneePourModal.id).update({ memberIds: newMembers });
      
      showPopup(`${targetAccount.name} a été ajouté à la communauté !`);

    } else {
      // Le compte n'existe pas -> Création d'un "Invité"
      const newGuestRef = db.collection("players").doc("guest-" + Date.now()); 
      await newGuestRef.set({
        name: finalName,
        email: email || "", 
        isRealAccount: false,
        communityIds: [commuSelectionneePourModal.id],
        createdAt: Date.now()
      });

      const newMembers = [...commuSelectionneePourModal.memberIds, newGuestRef.id];
      await db.collection("communities").doc(commuSelectionneePourModal.id).update({ memberIds: newMembers });
      
      showPopup(`Le joueur invité ${finalName} a été créé !`);
    }

    fermerModal("modalAddMember");
    ouvrirModalGestionCommunaute(commuSelectionneePourModal.id); // Rafraîchir l'affichage
  } catch (error) {
    console.error("Erreur ajout membre:", error);
    showPopup("Une erreur est survenue.", true);
  }
});


// Quitter une communauté
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

// Transférer
document.getElementById("btnCommuTransferAdmin").addEventListener("click", async () => {
  if (!commuSelectionneePourModal) return;
  const user = auth.currentUser;
  
  let candidats = [];
  for (const uid of commuSelectionneePourModal.memberIds) {
    if (uid !== user.uid) {
      const uDoc = await db.collection("players").doc(uid).get();
      if (uDoc.exists && uDoc.data().email && uDoc.data().isRealAccount) {
        candidats.push({ id: uid, name: uDoc.data().name });
      }
    }
  }

  if (candidats.length === 0) return showPopup("Aucun autre membre avec un compte valide pour reprendre l'administration.", true);

  let messageSelection = "Sélectionnez le nouveau chef :\n";
  candidats.forEach((c, idx) => { messageSelection += `${idx + 1}. ${c.name}\n`; });
  
  let choix = prompt(messageSelection);
  let indexChoisi = parseInt(choix, 10) - 1;

  if (!isNaN(indexChoisi) && indexChoisi >= 0 && indexChoisi < candidats.length) {
    const repreneur = candidats[indexChoisi];
    await db.collection("communities").doc(commuSelectionneePourModal.id).update({ adminId: repreneur.id });
    showPopup(`Administration transférée à ${repreneur.name}.`);
    document.getElementById("communityAdminModalOverlay").classList.add("hidden");
    await chargerInfosProfil();
  }
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

function renderListeCommunautesGestion() {
  const container = document.getElementById("listeCommunautesContainer");
  if (!container) return; 
  container.innerHTML = "";

  if (listeMesCommunautes.length === 0) {
    container.innerHTML = "<p class='hint'>Aucune communauté pour l'instant.</p>";
    return;
  }

  let defaultCommuId = communautéActiveId;
  listeMesCommunautes.forEach(commu => {
    const isAdmin = commu.adminId === auth.currentUser.uid;
    const roleBadge = isAdmin ? `<span style="font-size: 10px; background: var(--primary); color: white; padding: 2px 6px; border-radius: 4px; margin-left: 8px; vertical-align: middle;">Admin</span>` : "";

    const row = document.createElement("div");
    row.style.padding = "10px"; 
    row.style.background = "#FDFDFB"; 
    row.style.border = "1px solid var(--divider)"; 
    row.style.borderRadius = "var(--r-1)"; 
    row.style.marginBottom = "6px";
    row.style.display = "flex";
    row.style.justifyContent = "space-between";
    row.style.alignItems = "center";

    const isChecked = commu.id === defaultCommuId ? "checked" : "";

    row.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
        <input type="radio" name="defaultCommuRadio" value="${commu.id}" ${isChecked} onchange="setDefaultCommunity('${commu.id}')" style="cursor: pointer; width: 16px; height: 16px; accent-color: var(--primary);">
        <div style="font-weight:700; color:var(--primary); font-size:15px; display: flex; align-items: center;">
          ${commu.name} ${roleBadge}
        </div>
      </div>
      <button class="primary" style="padding: 8px 14px; font-size: 13px;" onclick="ouvrirModalGestionCommunaute('${commu.id}')">Gérer</button>
    `;
    container.appendChild(row);
  });
}

async function setDefaultCommunity(commuId) {
  if (!auth.currentUser) return;
  try {
    await db.collection("players").doc(auth.currentUser.uid).update({
      defaultCommunity: commuId
    });
    communautéActiveId = commuId;
    showPopup("Communauté par défaut mise à jour !");
  } catch(e) {
    console.error("Erreur update default community:", e);
    showPopup("Erreur lors de la mise à jour.", true);
  }
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
    document.getElementById("btnCommuTransferAdmin").style.display = commuData.adminId === auth.currentUser.uid ? "block" : "none";
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
    
    // On ré-ajoute systématiquement le joueur actuel
    const user = auth.currentUser;
    if (user) {
      const doc = await db.collection("players").doc(user.uid).get();
      joueursSelectionnesMatch.push({ id: user.uid, name: (doc.exists && doc.data().name) ? doc.data().name : user.email.split('@')[0] });
    }
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
    opt.value = commu.id; opt.innerText = `${commu.name}`;
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
      
      const dictModes = { "cricket": "CRICKET", "x01": "X01", "world": "TOUR DU MONDE", "bounty": "CHASSEUR DE PRIMES" };
      const modeAffiche = dictModes[data.type] || data.type.toUpperCase();
      
      let rankingHtml = "";
      if (data.ranking && data.ranking.length > 0) {
          rankingHtml = `<div style="margin-top: 10px; font-size: 13px;">`;
          data.ranking.forEach((r, idx) => {
              let teamText = r.teamMembers ? `<br><span style="font-size: 10px; color: var(--text-soft); font-weight: normal;">👤 ${r.teamMembers}</span>` : "";
              
              if (idx === 0) {
                  // Style pour le 1er
                  rankingHtml += `
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(0,0,0,0.05);">
                      <div style="flex:1; font-size: 16px;"><strong>🥇</strong> <span style="font-weight: 800; color: var(--primary);">${r.name}</span> ${teamText}</div>
                      <div style="font-weight: 900; color: var(--primary-strong); font-size: 14px; text-align: right;">${r.score}</div>
                  </div>`;
              } else {
                  // Style classique pour les autres
                  rankingHtml += `
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid rgba(0,0,0,0.05);">
                      <div style="flex:1;"><strong>${idx + 1}</strong> ${r.name} ${teamText}</div>
                      <div style="font-weight: 800; color: var(--primary-strong); font-size: 12px; text-align: right;">${r.score}</div>
                  </div>`;
              }
          });
          rankingHtml += `</div>`;
      } else {
          // Fallback de sécurité pour les anciennes parties enregistrées sans le système de classement
          rankingHtml = `<p style="padding:4px 0;">🥇 Vainqueur : <strong>${data.winner}</strong></p>`;
      }
      
      const card = document.createElement("div");
      card.className = "card"; card.style.marginBottom = "10px";
      // Restructuration: Nom du jeu, puis Date/Durée, puis Classement
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; align-items:center;">
          <span class="badge" style="background:var(--primary); color:#fff;">${modeAffiche}</span>
          <span style="font-size:11px; color:var(--accent); font-weight:700;">${nomCommuAssociee}</span>
        </div>
        <div style="font-size:12px; color:var(--text-soft); border-bottom: 1px solid var(--divider); padding-bottom: 8px; margin-bottom: 4px;">
          📅 ${date} — ⏱️ ${duration}
        </div>
        ${rankingHtml}
      `;
      container.appendChild(card);
    });
  } catch (e) {
    container.innerHTML = "<p class='hint' style='text-align:center; color:var(--danger); padding:20px;'>Erreur lors du chargement.</p>";
  }
}

window.ouvrirModalGestionCommunaute = ouvrirModalGestionCommunaute;

// --- SYSTÈME DE SAUVEGARDE AUTOMATIQUE ---
function sauvegarderPartie() {
  const backup = {
    cricketState: cricketState,
    joueursSelectionnesMatch: joueursSelectionnesMatch,
    listeEquipesFormees: listeEquipesFormees,
    communauteCibleMatchId: communauteCibleMatchId
  };
  localStorage.setItem("dartLegends_backup", JSON.stringify(backup));
}

function effacerSauvegarde() {
  localStorage.removeItem("dartLegends_backup");
}

async function verifierSauvegardeAuDemarrage() {
  const backupStr = localStorage.getItem("dartLegends_backup");
  if (!backupStr) return;

  const reprise = await openCustomModal("🏃‍♀️‍➡️​ Partie en cours", "Fermeture innatendue. Une partie inachevée a été détectée. Voulez-vous la reprendre ?");
  if (reprise) {
    const backup = JSON.parse(backupStr);
    cricketState = backup.cricketState;
    joueursSelectionnesMatch = backup.joueursSelectionnesMatch;
    listeEquipesFormees = backup.listeEquipesFormees;
    communauteCibleMatchId = backup.communauteCibleMatchId;
    
    lancerInterfaceJeu(cricketState.gameMode, true); // Le "true" indique que c'est une reprise
    if (cricketState.gameMode === "bounty") mettreAJourCiblesBountyUI();
  } else {
    effacerSauvegarde();
  }
}

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
    
    // On stocke simplement tous les joueurs, l'ordre de jeu sera calculé dynamiquement
    ordonnancementTireurs = [];
    listeEquipesFormees.forEach(eq => {
      eq.members.forEach(m => {
        ordonnancementTireurs.push({ id: m.id, name: m.name, teamId: eq.id, teamName: eq.name });
      });
    });
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
  if (cricketState.isTeamMode) {
    cricketState.teamTurnState = { activeTeamIndex: 0, playerCursors: {} };
    listeEquipesFormees.forEach(eq => { cricketState.teamTurnState.playerCursors[eq.id] = 0; });
  } else {
    cricketState.teamTurnState = null;
  }
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
      maxPointsGivenInOneVolley: 0, currentVolleyPointsGiven: 0, simplesCount: {}, doublesCount: {}, triplesCount: {} 
    };
    cricketState.targets.forEach(t => {
      cricketState.statsDetails[p.id].touchesNum[t] = 0;
      cricketState.statsDetails[p.id].pointsGiv[t] = 0;
      cricketState.statsDetails[p.id].simplesCount[t] = 0;
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
      scoreFamily60: 0,
      scoreFamily100: 0, 
      scoreFamily140: 0, 
      scoreFamily180: 0,
      checkoutHits: 0, 
      touchesNum: {},
      touchesSimpleNum: {},  
      touchesDoubleNum: {}, 
      touchesTripleNum: {}  
    };

    for (let i = 1; i <= 20; i++) {
      cricketState.statsDetails[p.id].touchesNum[i] = 0;
      cricketState.statsDetails[p.id].touchesSimpleNum[i] = 0;
      cricketState.statsDetails[p.id].touchesDoubleNum[i] = 0;
      cricketState.statsDetails[p.id].touchesTripleNum[i] = 0;
    }
    cricketState.statsDetails[p.id].touchesNum[25] = 0;
    cricketState.statsDetails[p.id].touchesSimpleNum[25] = 0;
    cricketState.statsDetails[p.id].touchesDoubleNum[25] = 0;
    cricketState.statsDetails[p.id].touchesTripleNum[25] = 0;
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
  cricketState.bountyBonusAges = []; // NOUVEAU
  while(cricketState.bountyBonusTargets.length < nbPrimes) {
    let t = generateNewBountyTarget(cricketState.bountyBonusTargets, null);
    cricketState.bountyBonusTargets.push(t);
    cricketState.bountyBonusAges.push(0); // NOUVEAU
  }
  
  cricketState.bountyMalusTarget = cricketState.bountyHasMalus ? generateNewBountyTarget(cricketState.bountyBonusTargets, null) : null;
  cricketState.bountyMalusAge = 0; // NOUVEAU

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
    if (modificateurEnCours === 3 && valeurBouton !== 25) stats.triplesHitCount += 1;

    stats.totalTargetsHit += 1;
    let nouvelleCible = cibleAttendue + bond;
    if (finParcours === 25 && nouvelleCible >= 21) nouvelleCible = 25; 
    if (finParcours !== 25 && nouvelleCible > finParcours) nouvelleCible = finParcours;
    cricketState.scores[keyStockage] = nouvelleCible;
  }
}

function lancerInterfaceJeu(mode, isResume = false) {
  showScreen(screens.cricket);
  
  // 1. Gestion du chrono (Nouveau ou Reprise)
  if (!isResume) {
    cricketState.startTime = Date.now(); 
    cricketState.elapsedTime = 0; 
  } else {
    // Si c'est une reprise, on recule l'heure de départ pour rattraper le temps déjà écoulé
    cricketState.startTime = Date.now() - (cricketState.elapsedTime * 1000);
  }
  
  // 2. Initialisation du chronomètre
  cricketState.isPaused = false;
  document.getElementById("btnPauseGame").innerText = "⏸️";
  clearInterval(cricketState.timerInterval);
  cricketState.timerInterval = setInterval(updateTimer, 1000);

  // 3. Affichage du clavier et de la grille selon le mode
  resetModifierUI(); 
  if (mode === "x01") {
    document.getElementById("bountyTargetsZone").classList.add("hidden");
    renderKeyboardX01(); 
    renderGridX01();
  } else if (mode === "world") {
    document.getElementById("bountyTargetsZone").classList.add("hidden");
    renderKeyboardX01(); 
    renderGridWorld();
  } else if (mode === "bounty") {
    document.getElementById("bountyTargetsZone").classList.remove("hidden");
    renderKeyboardX01(); 
    renderGridBounty();
  } else {
    document.getElementById("bountyTargetsZone").classList.add("hidden");
    renderKeyboard(); 
    renderGrid();
  }
  
  // 4. Mise à jour de l'interface
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
    // Mode checkout simple (ISO)
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
        // Tentative en commençant par un Triple
        let rT = score - (t * 3);
        if (rT > 0 && rT <= 20) return `T${t} - ${rT}`;
        if (rT === 25) return `T${t} - Bull`;
        if (rT > 0 && rT <= 40 && rT % 2 === 0) return `T${t} - D${rT / 2}`;
        if (rT > 0 && rT <= 60 && rT % 3 === 0) return `T${t} - T${rT / 3}`;
        if (rT === 50) return `T${t} - DBull`;

        // Tentative en commençant par un Simple
        let rS = score - t;
        if (rS > 0 && rS <= 20) return `${t} - ${rS}`;
        if (rS === 25) return `${t} - Bull`;
        if (rS > 0 && rS <= 40 && rS % 2 === 0) return `${t} - D${rS / 2}`;
        if (rS > 0 && rS <= 60 && rS % 3 === 0) return `${t} - T${rS / 3}`;
        if (rS === 50) return `${t} - DBull`;
      }
    }
    if (dartsCount === 2) return null;

    if (dartsCount === 3) {
      for (let t1 = 20; t1 >= 1; t1--) {
        for (let t2 = 20; t2 >= 1; t2--) {
          let r = score - (t1 * 3) - (t2 * 3);
          if (r > 0 && r <= 20) return `T${t1} - T${t2} - ${r}`;
          if (r === 25) return `T${t1} - T${t2} - Bull`;
          if (r > 0 && r <= 40 && r % 2 === 0) return `T${t1} - T${t2} - D${r / 2}`;
          if (r > 0 && r <= 60 && r % 3 === 0) return `T${t1} - T${t2} - T${r / 3}`;
          if (r === 50) return `T${t1} - T${t2} - DBull`;
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

  // On map correctement les entités pour récupérer les membres (indispensable pour le calcul équipe)
  let entitesAAfficher = cricketState.isTeamMode ? listeEquipesFormees : cricketState.players.map(p => ({ id: p.id, name: p.name, members: [p] }));
  
  const joueurActuel = cricketState.players[cricketState.currentPlayerIdx];
  
  entitesAAfficher.forEach(entite => {
    const row = document.createElement("tr");
    row.style.borderBottom = "1px solid var(--divider)";
    
    if(cricketState.isTeamMode ? (joueurActuel.teamId === entite.id) : (joueurActuel.id === entite.id)) {
      row.style.backgroundColor = "rgba(192,101,42,0.15)";
    }

    // --- 1. CALCUL DU MPR EN DIRECT ---
    let totalTouches = 0, totalDarts = 0;
    (entite.members || [entite]).forEach(m => {
      if (cricketState.statsDetails[m.id]) {
        totalTouches += cricketState.statsDetails[m.id].touchesUtiles || 0;
        totalDarts += cricketState.statsDetails[m.id].dartsThrown || 0;
      }
    });
    // On force l'affichage à 1 chiffre après la virgule (ex: 2.3)
    let mpr = totalDarts > 0 ? ((totalTouches / totalDarts) * 3).toFixed(1) : "0.0";
    
    let nomTronque = entite.name.length > 9 ? entite.name.substring(0, 9) + "." : entite.name;
    
    // --- 2. AFFICHAGE DU NOM + MPR ---
    // J'ai légèrement réduit le padding vertical (12px -> 8px) pour que le tableau ne s'étire pas trop en hauteur
    let cellsHtml = `<td style="text-align:left; padding: 8px 4px; width: 23%;">
        <div style="font-weight:700;">${nomTronque}</div>
        <div style="font-size:10px; color:var(--text-soft); font-weight:600; margin-top: 2px;">MPR: ${mpr}</div>
    </td>`;

    cricketState.targets.forEach(t => {
      const touches = cricketState.marks[entite.id][t];
      let symbole = touches === 1 ? "\\" : touches === 2 ? "X" : touches >= 3 ? `<span style="border:2px solid #ff3838; border-radius:50%; padding:2px 4px; color:#ff3838;">X</span>` : "";
      cellsHtml += `<td style="padding: 6px 2px; border-left: 1px solid var(--divider); width: 11%;">${symbole}</td>`;
    });
    
    cellsHtml += `<td style="font-weight:800; padding: 12px 2px; border-left: 1px solid var(--divider); color: var(--primary-strong); width: 12%;">${cricketState.scores[entite.id]}</td>`;
    
    row.innerHTML = cellsHtml; 
    table.appendChild(row);
  });
}

function renderGridBounty() {
  const table = document.getElementById("cricketGridTable");
  if (!table) return;
  table.innerHTML = "";
  
  // Harmonisation de l'en-tête
  const headerRow = document.createElement("tr");
  headerRow.style.background = "rgba(255,255,255,0.02)";
  headerRow.innerHTML = `
    <th style="text-align:left; padding:12px 6px; border-bottom:2px solid var(--divider); width:60%;">Joueur</th>
    <th style="padding:12px 6px; border-bottom:2px solid var(--divider); border-left:1px solid var(--divider); color:var(--accent); width:40%;">Score</th>
  `;
  table.appendChild(headerRow);

  let entitesAAfficher = cricketState.isTeamMode ? listeEquipesFormees : cricketState.players;
  const joueurActuel = cricketState.players[cricketState.currentPlayerIdx];

  entitesAAfficher.forEach(entite => {
    const row = document.createElement("tr");
    // Harmonisation de la ligne de séparation du bas
    row.style.borderBottom = "1px solid var(--divider)";
    
    if (cricketState.isTeamMode ? (joueurActuel.teamId === entite.id) : (joueurActuel.id === entite.id)) {
      row.style.backgroundColor = "rgba(192,101,42,0.15)";
    }
    
    // Ajout de border-left pour la séparation verticale
    row.innerHTML = `
      <td style="text-align:left; padding:14px 6px; font-weight:700;">${entite.name}</td>
      <td style="font-weight:800; padding:14px 6px; border-left:1px solid var(--divider); color:var(--primary-strong); font-size:16px;">${cricketState.scores[entite.id]}</td>
    `;
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
    let moy = totalDarts > 0 ? ((totalScore / totalDarts) * 3).toFixed(1) : "0.0";
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

function declencherAnimationShot() {
  let popup = document.getElementById("shotPopupOverlay");
  if (!popup) {
    popup = document.createElement("div");
    popup.id = "shotPopupOverlay";
    // Styles pour occuper tout l'écran
    popup.style.position = "fixed";
    popup.style.top = "0"; popup.style.left = "0"; 
    popup.style.width = "100%"; popup.style.height = "100%";
    popup.style.backgroundColor = "rgba(0,0,0,0.85)";
    popup.style.zIndex = "9999";
    popup.style.display = "flex";
    popup.style.flexDirection = "column";
    popup.style.alignItems = "center";
    popup.style.justifyContent = "center";
    popup.style.backdropFilter = "blur(5px)";
    popup.style.cursor = "pointer"; 
    
    // Le contenu avec le cocktail et le texte
    popup.innerHTML = `
      <div style="font-size: 90px; transform: scale(1); transition: transform 0.3s ease;">🍸</div>
      <div style="font-family: 'Space Grotesk', sans-serif; font-size: 60px; font-weight: 800; margin-top: 20px; color: #62c91e; text-shadow: 0 4px 20px rgba(255,215,0,0.5); letter-spacing: 4px;">SHOT !</div>
      <div style="font-size: 16px; margin-top: 15px; color: #FFF; opacity: 0.8;">3 fléchettes dans le 1</div>
    `;
    
    // L'action de fermer au clic
    popup.onclick = () => {
      popup.style.display = "none";
    };
    
    document.body.appendChild(popup);
  }
  
  popup.classList.remove("hidden");
  popup.style.display = "flex";
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
      teamTurnState: cricketState.teamTurnState ? JSON.parse(JSON.stringify(cricketState.teamTurnState)) : null,
      bountyBonusTargets: cricketState.bountyBonusTargets ? [...cricketState.bountyBonusTargets] : null,
      bountyMalusTarget: cricketState.bountyMalusTarget,
      bountyBonusAges: cricketState.bountyBonusAges ? [...cricketState.bountyBonusAges] : null, // Ajout de l'âge
      bountyMalusAge: cricketState.bountyMalusAge, // Ajout de l'âge
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

  if (cricketState.gameMode === "x01" && cricketState.currentDart === 1) {
    cricketState.x01TurnStartScore = cricketState.scores[keyStockage];
    cricketState.x01TurnStartTotalScored = cricketState.statsDetails[joueurActuel.id].totalScoreScored;
    cricketState.x01TurnStartFirst9 = cricketState.statsDetails[joueurActuel.id].first9DartsScore;
  }
  if (cricketState.gameMode === "x01") traiterCalculX01(keyStockage, joueurActuel, valeurBouton);
  else if (cricketState.gameMode === "world") traiterCalculWorld(keyStockage, joueurActuel, valeurBouton);
  else if (cricketState.gameMode === "bounty") traiterCalculBounty(keyStockage, joueurActuel, valeurBouton);
  else traiterCalculCricket(keyStockage, joueurActuel, valeurBouton);

  cricketState.currentDart += 1;
  if (cricketState.currentDart > 3) {
    // Vérification de la condition SHOT (3 fléchettes, et toutes sont un 1, un D1 ou un T1)
    if (cricketState.gameMode === "x01" && cricketState.currentTurnDartsText.length === 3) {
        const aFaitTroisUn = cricketState.currentTurnDartsText.every(t => t === "1" || t === "D1" || t === "T1");
        if (aFaitTroisUn) {
            declencherAnimationShot();
        }
    }
    cloreVoleeActuelle(joueurActuel);
  }

  resetModifierUI();
  if (cricketState.gameMode === "x01") { renderKeyboardX01(); renderGridX01(); }
  else if (cricketState.gameMode === "world") { renderKeyboardX01(); renderGridWorld(); }
  else if (cricketState.gameMode === "bounty") { renderKeyboardX01(); renderGridBounty(); }
  else { renderKeyboard(); renderGrid(); }
  
  gererEtatBoutonBull(); updateTurnHeader(); verifierConditionsFinMatch(); sauvegarderPartie();
}

function cloreVoleeActuelle(joueur) {
  if (cricketState.gameMode === "cricket" && cricketState.statsDetails[joueur.id]) {
    const stats = cricketState.statsDetails[joueur.id];
    if (stats.currentVolleyPointsGiven > stats.maxPointsGivenInOneVolley) stats.maxPointsGivenInOneVolley = stats.currentVolleyPointsGiven;
    stats.currentVolleyPointsGiven = 0;
  }

  // GESTION DISPARITION DES PRIMES (Mode Bounty) - Code conservé à l'identique...
  if (cricketState.gameMode === "bounty") {
    const selectExpiration = document.getElementById("bountyExpirationSelect");
    const expirationTurns = selectExpiration ? parseInt(selectExpiration.value, 10) : 999;
    if (expirationTurns !== 999) {
      const maxVolleys = expirationTurns * cricketState.players.length;
      let hasChanges = false;
      for (let i = 0; i < cricketState.bountyBonusTargets.length; i++) {
        cricketState.bountyBonusAges[i]++;
        if (cricketState.bountyBonusAges[i] >= maxVolleys) {
          cricketState.bountyBonusTargets[i] = generateNewBountyTarget(cricketState.bountyBonusTargets.filter((_, idx) => idx !== i), cricketState.bountyMalusTarget, cricketState.bountyBonusTargets[i]);
          cricketState.bountyBonusAges[i] = 0;
          hasChanges = true;
        }
      }
      if (cricketState.bountyHasMalus && cricketState.bountyMalusTarget) {
        cricketState.bountyMalusAge++;
        if (cricketState.bountyMalusAge >= maxVolleys) {
          cricketState.bountyMalusTarget = generateNewBountyTarget(cricketState.bountyBonusTargets, null, cricketState.bountyMalusTarget);
          cricketState.bountyMalusAge = 0;
          hasChanges = true;
        }
      }
      if (hasChanges) mettreAJourCiblesBountyUI();
    }
  }

  cricketState.lastTurnText = `${cricketState.isTeamMode ? joueur.name + ' (' + joueur.teamName + ')' : joueur.name} ${cricketState.currentTurnDartsText.join('/')}`;
  cricketState.currentDart = 1; 
  cricketState.currentTurnDartsText = [];

  // NOUVELLE LOGIQUE D'ALTERNANCE DYNAMIQUE
  if (cricketState.isTeamMode) {
    // 1. On avance le curseur du joueur de l'équipe actuelle
    const activeTeam = listeEquipesFormees[cricketState.teamTurnState.activeTeamIndex];
    cricketState.teamTurnState.playerCursors[activeTeam.id] = (cricketState.teamTurnState.playerCursors[activeTeam.id] + 1) % activeTeam.members.length;
    
    // 2. On passe à l'équipe suivante
    cricketState.teamTurnState.activeTeamIndex = (cricketState.teamTurnState.activeTeamIndex + 1) % listeEquipesFormees.length;
    
    // 3. Si on revient à la première équipe, c'est un nouveau tour de jeu global
    if (cricketState.teamTurnState.activeTeamIndex === 0) {
      cricketState.currentTurn += 1;
    }
    
    // 4. On trouve le prochain joueur à envoyer au pas de tir
    const nextTeam = listeEquipesFormees[cricketState.teamTurnState.activeTeamIndex];
    const pCursor = cricketState.teamTurnState.playerCursors[nextTeam.id];
    const nextPlayer = nextTeam.members[pCursor];
    
    // On met à jour l'index global pour que le reste de l'application suive
    cricketState.currentPlayerIdx = cricketState.players.findIndex(p => p.id === nextPlayer.id);

  } else {
    // Logique individuelle classique
    cricketState.currentPlayerIdx += 1;
    if (cricketState.currentPlayerIdx >= cricketState.players.length) {
      cricketState.currentPlayerIdx = 0; 
      cricketState.currentTurn += 1;
    }
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

    if (modificateurEnCours === 1) stats.simplesCount[valeurBouton] += 1;
    if (modificateurEnCours === 2) stats.doublesCount[valeurBouton] += 1;
    if (modificateurEnCours === 3 && valeurBouton !== 25) stats.triplesCount[valeurBouton] += 1;

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
  let pointsMarques = valeurBouton * modificateurEnCours;
  const scoreResultat = cricketState.scores[keyStockage] - pointsMarques;

  let estBust = scoreResultat < 0 || 
                (scoreResultat === 1 && cricketState.x01Checkout === "double") || 
                (scoreResultat === 0 && cricketState.x01Checkout === "double" && modificateurEnCours !== 2);

  if (valeurBouton !== 0 && stats) {
    stats.touchesNum[valeurBouton] += modificateurEnCours;
    if (modificateurEnCours === 1) stats.touchesSimpleNum[valeurBouton] += 1;
    else if (modificateurEnCours === 2) stats.touchesDoubleNum[valeurBouton] += 1;
    else if (modificateurEnCours === 3) stats.touchesTripleNum[valeurBouton] += 1;
  }

  if (estBust) {
    showPopup("💥 Bust", true);
    cricketState.scores[keyStockage] = cricketState.x01TurnStartScore;
    if (stats) { 
      stats.bustsCount += 1; 
      stats.totalScoreScored = cricketState.x01TurnStartTotalScored;
      stats.first9DartsScore = cricketState.x01TurnStartFirst9;
      stats.currentVolleyScore = 0; 
      // On n'ajoute plus artificiellement de fléchettes ici : 
      // seules les fléchettes VRAIMENT lancées sont comptabilisées !
    }
    cricketState.currentDart = 3; 
  } else {
    cricketState.scores[keyStockage] = scoreResultat;
    if (stats) {
      stats.totalScoreScored += pointsMarques; 
      stats.currentVolleyScore += pointsMarques;
      if (stats.dartsThrown <= 9) stats.first9DartsScore += pointsMarques;
    }
  }

  if (cricketState.currentDart === 3 && stats) {
    if (stats.currentVolleyScore > stats.maxVolleyScore) {
      stats.maxVolleyScore = stats.currentVolleyScore;
    }
    if (stats.currentVolleyScore === 180) stats.scoreFamily180 += 1;
    else if (stats.currentVolleyScore >= 140) stats.scoreFamily140 += 1;
    else if (stats.currentVolleyScore >= 100) stats.scoreFamily100 += 1;
    else if (stats.currentVolleyScore >= 60) stats.scoreFamily60 += 1; 
    stats.currentVolleyScore = 0; 
  }
}

function traiterCalculBounty(keyStockage, joueurActuel, valeurBouton) {
  const stats = cricketState.statsDetails[joueurActuel.id];
  let pointsMarques = 0; 
  if (valeurBouton === 0) return;

  if (!stats.chiffresVisites[valeurBouton]) stats.chiffresVisites[valeurBouton] = { simples: 0, doubles: 0, triples: 0 };

  if (cricketState.bountyBonusTargets.includes(valeurBouton)) {
    pointsMarques = valeurBouton * modificateurEnCours; 
    stats.touchesPositives += pointsMarques; // Cumul des points gagnés
    
    if (modificateurEnCours === 1) stats.simples += 1;
    else if (modificateurEnCours === 2) stats.doubles += 1;
    else if (modificateurEnCours === 3) stats.triples += 1;

    const idxAChanger = cricketState.bountyBonusTargets.indexOf(valeurBouton);
    cricketState.bountyBonusTargets[idxAChanger] = generateNewBountyTarget(
      cricketState.bountyBonusTargets.filter(t => t !== valeurBouton), 
      cricketState.bountyMalusTarget, 
      valeurBouton // Exclut la cible actuelle
    );
    cricketState.bountyBonusAges[idxAChanger] = 0; // Remise à zéro de l'âge
    mettreAJourCiblesBountyUI();
    
  } else if (valeurBouton === cricketState.bountyMalusTarget) {
    pointsMarques = - (valeurBouton * modificateurEnCours); 
    stats.touchesMalus += Math.abs(pointsMarques); // Cumul des points perdus
    
    if (cricketState.bountyHasMalus) {
      // CORRECTIF : Exclusion explicite du malus actuel pour forcer un nouveau chiffre
      cricketState.bountyMalusTarget = generateNewBountyTarget(
        cricketState.bountyBonusTargets, 
        null, 
        cricketState.bountyMalusTarget 
      );
      cricketState.bountyMalusAge = 0; // Remise à zéro de l'âge
      mettreAJourCiblesBountyUI();
    }
  }
  
  cricketState.scores[keyStockage] += pointsMarques;
}

function mettreAJourCiblesBountyUI() {
  const bonusContainer = document.getElementById("bountyBonusContainer");
  const malusContainer = document.getElementById("bountyMalusContainer");
  const malusBadge = document.getElementById("bountyMalusBadge");
  const scoreBadge = document.getElementById("bountyTargetScoreBadge");

  if (bonusContainer) {
    // Retrait de l'emoji à l'intérieur du badge étoile
    bonusContainer.innerHTML = cricketState.bountyBonusTargets.map(t => 
      `<div class="bounty-star-badge">${t}</div>`
    ).join('');
  }
  
  if (malusContainer) {
    if (cricketState.bountyHasMalus) { 
      malusContainer.classList.remove("hidden"); 
      if (malusBadge) malusBadge.innerHTML = `☠️ ${cricketState.bountyMalusTarget}`; 
    } else { 
      malusContainer.classList.add("hidden"); 
    }
  }

  if (scoreBadge) {
    const targetScore = document.getElementById("bountyTargetScoreSelect") ? document.getElementById("bountyTargetScoreSelect").value : "300";
    scoreBadge.innerText = targetScore === "9999" ? "Objectif : Infini" : `Objectif : ${targetScore} pts`;
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
  if (precedentState.teamTurnState) cricketState.teamTurnState = precedentState.teamTurnState;
  if (precedentState.bountyBonusTargets) cricketState.bountyBonusTargets = precedentState.bountyBonusTargets;
  if (precedentState.bountyMalusTarget !== undefined) cricketState.bountyMalusTarget = precedentState.bountyMalusTarget;
  if (precedentState.bountyBonusAges) cricketState.bountyBonusAges = precedentState.bountyBonusAges; // NOUVEAU
  if (precedentState.bountyMalusAge !== undefined) cricketState.bountyMalusAge = precedentState.bountyMalusAge; // NOUVEAU
  
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
  updateTurnHeader(); sauvegarderPartie();
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

function formatScoreDisplay(gameMode, score) {
  if (gameMode === "world") {
    const start = cricketState.worldStartNum;
    const end = cricketState.worldEndNum;
    const totalEtapes = (end === 25) ? (20 - start + 2) : (end - start + 1);
    
    if (score >= 26) return `${totalEtapes}/${totalEtapes}`;
    
    let etapeActuelle = (score === 25) ? totalEtapes - 1 : (score - start);
    let restants = totalEtapes - etapeActuelle;
    return `${etapeActuelle}/${totalEtapes}`;
  }
  if (gameMode === "x01") return `${score} pts restants`;
  if (gameMode === "bounty" || gameMode === "cricket") return `${score} points`;
  return score;
}

function lancerPageVictoire(gagnantId, nomVainqueur) {
  effacerSauvegarde();
  document.getElementById("victoryTitle").innerText = `${nomVainqueur} gagne la partie !`;
  document.getElementById("victorySubtitle").innerText = `Match bouclé en ${document.getElementById("gameTimerDisplay").innerText}`;
  
  let classementTrie = cricketState.isTeamMode ? listeEquipesFormees.map(e => ({ id: e.id, name: e.name })) : cricketState.players.map(p => ({ id: p.id, name: p.name }));
  classementTrie.sort((a, b) => cricketState.gameMode === "x01" ? cricketState.scores[a.id] - cricketState.scores[b.id] : cricketState.scores[b.id] - cricketState.scores[a.id]);
  
  const containerRanking = document.getElementById("finalRankingList"); containerRanking.innerHTML = "";
  
  // Création du classement pour l'historique
  let historyRanking = [];

  classementTrie.forEach((entite, idx) => {
    let scoreFormate = formatScoreDisplay(cricketState.gameMode, cricketState.scores[entite.id]);
    
    const row = document.createElement("div"); row.className = "stat-row"; row.style.padding = "10px";
    row.style.background = entite.id === gagnantId ? "rgba(192,101,42,0.15)" : "rgba(255,255,255,0.02)"; row.style.borderRadius = "12px";
    
    if (idx === 0) {
        // Mise en avant du vainqueur
        row.innerHTML = `<span style="font-size: 18px;"><strong>🥇</strong> — <span style="font-weight: 800; color: var(--primary);">${entite.name}</span></span><span style="color:var(--primary-strong); font-weight:900; font-size:16px;"> ${scoreFormate}</span>`;
    } else {
        row.innerHTML = `<span><strong>${idx + 1}</strong> — 👤 ${entite.name}</span><span style="color:var(--primary-strong); font-weight:800; font-size:13px;"> ${scoreFormate}</span>`;
    }
    
    containerRanking.appendChild(row);

    let joueursEquipe = "";
    if (cricketState.isTeamMode) {
        const equipe = listeEquipesFormees.find(e => e.id === entite.id);
        if (equipe) joueursEquipe = equipe.members.map(m => m.name).join(", ");
    }

    historyRanking.push({
      name: entite.name,
      score: scoreFormate,
      teamMembers: joueursEquipe
    });
  });

  db.collection("games_history").add({
    type: cricketState.gameMode, 
    winner: nomVainqueur, 
    duration: cricketState.elapsedTime, 
    createdAt: Date.now(),
    isTeamMode: cricketState.isTeamMode, 
    maxTurns: cricketState.maxTurns, 
    communityId: communauteCibleMatchId,
    participantIds: joueursSelectionnesMatch.map(p => p.id),
    ranking: historyRanking // NOUVEAU: Sauvegarde du classement
  }).then(() => console.log("Match enregistré !")).catch(e => console.error(e));
  
  showScreen(screens.gameOver);
}

document.getElementById("btnGoHomeAfterMatch").onclick = () => showScreen(screens.home);
document.getElementById("btnGoHomeAfterStats").onclick = () => showScreen(screens.home);
document.getElementById("btnRematch").onclick = () => {
  if (cricketState.gameMode === "x01") demarrerMatchX01(cricketState.players);
  else if (cricketState.gameMode === "world") demarrerMatchWorld(cricketState.players); 
  else if (cricketState.gameMode === "bounty") demarrerMatchBounty(cricketState.players);
  else demarrerMatchCricket(cricketState.players);
};

document.getElementById("btnGoToStats").onclick = () => { genererTableauStatistiques(); showScreen(screens.matchStats); };
document.getElementById("btnBackToPodium").onclick = () => showScreen(screens.gameOver);

function genererTableauStatistiques() {
  const tableEl = document.getElementById("matchStatsTable");
  if (!tableEl) return;
  
  const parentContainer = tableEl.parentElement;
  parentContainer.innerHTML = ""; 

  const mainWrapper = document.createElement("div");
  mainWrapper.style.padding = "0 8px 40px 8px"; 
  mainWrapper.style.display = "flex";
  mainWrapper.style.flexDirection = "column";
  mainWrapper.style.gap = "20px";
  mainWrapper.style.width = "100%";
  parentContainer.appendChild(mainWrapper);

  const backupTable = document.createElement("table");
  backupTable.id = "matchStatsTable";
  backupTable.style.display = "none";
  parentContainer.appendChild(backupTable);

  const labelStyle = "text-align:left; padding:10px 8px; font-weight:600; color:var(--text-main); font-size:13px;";
  const valStyle = "text-align:center; padding:10px 12px; border-left:1px solid var(--divider); font-weight:600; font-size:13px;";

  function creerBlocStats(titreBloc) {
    const blockDiv = document.createElement("div");
    blockDiv.style.background = "var(--card-bg)";
    blockDiv.style.border = "1px solid var(--card-border)";
    blockDiv.style.borderRadius = "var(--r-2)";
    blockDiv.style.padding = "12px";
    blockDiv.style.width = "100%";
    blockDiv.style.overflowX = "auto";
    blockDiv.style.WebkitOverflowScrolling = "touch";
    
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
    table.style.whiteSpace = "nowrap";
    blockDiv.appendChild(table);
    
    return { blockDiv, table };
  }

  function genererEnteteJoueurs(tableTarget) {
    const rowHeader = document.createElement("tr");
    rowHeader.style.background = "rgba(255,255,255,0.02)";
    let html = `<th style="text-align:left; padding:8px; border-bottom:1px solid var(--divider); width:40%;">Joueurs</th>`;
    cricketState.players.forEach(p => {
      let nom = p.name.length > 9 ? p.name.substring(0, 9) + "." : p.name;
      html += `<th style="font-weight:700; padding:10px 12px; border-bottom:1px solid var(--divider); border-left:1px solid var(--divider); text-align:center; font-size:13px;">${nom}</th>`;
    });
    rowHeader.innerHTML = html;
    tableTarget.appendChild(rowHeader);
  }

  function ajouterLigne(tableTarget, label, valuesHtmlArray) {
    let row = document.createElement("tr"); 
    row.style.borderBottom = "1px solid var(--divider)";
    let html = `<td style="${labelStyle}">${label}</td>`;
    valuesHtmlArray.forEach(val => { html += `<td style="${valStyle}">${val}</td>`; });
    row.innerHTML = html;
    tableTarget.appendChild(row);
  }

  // ================= CRICKET =================
  if (cricketState.gameMode === "cricket") {
    // Bloc 1 : Générales
    const blocGen = creerBlocStats("Générales");
    genererEnteteJoueurs(blocGen.table);
    
    ajouterLigne(blocGen.table, "MPR", cricketState.players.map(p => {
      const touches = cricketState.statsDetails[p.id].touchesUtiles || 0;
      const darts = cricketState.statsDetails[p.id].dartsThrown || 1;
      return ((touches / darts) * 3).toFixed(2);
    }));
    
    ajouterLigne(blocGen.table, "Points infligés", cricketState.players.map(p => 
      cricketState.statsDetails[p.id].totalPointsGiven || 0
    ));
    mainWrapper.appendChild(blocGen.blockDiv);

    // Bloc 2 : Par Chiffre
    const blocZone = creerBlocStats("Touches par zone");
    genererEnteteJoueurs(blocZone.table);
    cricketState.targets.forEach(cible => {
      const label = cible === 25 ? "Bull" : `Zone ${cible}`;
      ajouterLigne(blocZone.table, label, cricketState.players.map(p => {
        const stats = cricketState.statsDetails[p.id];
        const s = stats.simplesCount[cible] || 0;
        const d = stats.doublesCount[cible] || 0;
        const t = stats.triplesCount[cible] || 0;
        const pts = stats.pointsGiv[cible] || 0;
        let txt = `${s}S / ${d}D / ${t}T`;
        if (pts > 0) txt += `<br><span style="font-size:11px; color:var(--text-soft);">+${pts} pts</span>`;
        return txt;
      }));
    });
    mainWrapper.appendChild(blocZone.blockDiv);

    // Bloc 3 : Tableau Final (Reproduction de la grille de jeu)
    const blocGrid = creerBlocStats("Tableau des scores");
    const cloneGrid = document.getElementById("cricketGridTable").cloneNode(true);
    cloneGrid.style.width = "100%";
    cloneGrid.style.marginTop = "10px";
    blocGrid.blockDiv.appendChild(cloneGrid);
    blocGrid.blockDiv.style.overflowX = "auto";
    mainWrapper.appendChild(blocGrid.blockDiv);
  }

  // ================= X01 =================
  else if (cricketState.gameMode === "x01") {
    const blocGenX = creerBlocStats("Générales");
    genererEnteteJoueurs(blocGenX.table);

    ajouterLigne(blocGenX.table, "Moyenne 3 fléchettes", cricketState.players.map(p => {
      const tPts = cricketState.statsDetails[p.id].totalScoreScored || 0;
      const tDarts = cricketState.statsDetails[p.id].dartsThrown || 1;
      return ((tPts / tDarts) * 3).toFixed(1);
    }));

    ajouterLigne(blocGenX.table, "Score des 9 premières", cricketState.players.map(p => cricketState.statsDetails[p.id].first9DartsScore || 0));
    ajouterLigne(blocGenX.table, "Max en une volée", cricketState.players.map(p => cricketState.statsDetails[p.id].maxVolleyScore || 0));
    ajouterLigne(blocGenX.table, "Nombre de Busts", cricketState.players.map(p => cricketState.statsDetails[p.id].bustsCount || 0));
    
    // Le temps mis pour checkout (Affiché globalement pour le gagnant)
    let m = String(Math.floor(cricketState.elapsedTime / 60)).padStart(2, "0");
    let s = String(cricketState.elapsedTime % 60).padStart(2, "0");
    ajouterLigne(blocGenX.table, "Temps match", cricketState.players.map(() => `${m}:${s}`));
    mainWrapper.appendChild(blocGenX.blockDiv);

    const blocMilestones = creerBlocStats("Paliers atteints");
    genererEnteteJoueurs(blocMilestones.table);
    ajouterLigne(blocMilestones.table, "Volées 180", cricketState.players.map(p => cricketState.statsDetails[p.id].scoreFamily180 || 0));
    ajouterLigne(blocMilestones.table, "Volées 140+", cricketState.players.map(p => cricketState.statsDetails[p.id].scoreFamily140 || 0));
    ajouterLigne(blocMilestones.table, "Volées 100+", cricketState.players.map(p => cricketState.statsDetails[p.id].scoreFamily100 || 0));
    ajouterLigne(blocMilestones.table, "Volées 60+", cricketState.players.map(p => cricketState.statsDetails[p.id].scoreFamily60 || 0));
    mainWrapper.appendChild(blocMilestones.blockDiv);

    const blocDetail = creerBlocStats("Touches par zone");
    genererEnteteJoueurs(blocDetail.table);
    for (let i = 1; i <= 21; i++) {
      let cible = i === 21 ? 25 : i;
      let labelCible = cible === 25 ? "Bull" : `Zone ${cible}`;
      ajouterLigne(blocDetail.table, labelCible, cricketState.players.map(p => {
        const stat = cricketState.statsDetails[p.id];
        const s = stat.touchesSimpleNum[cible] || 0;
        const d = stat.touchesDoubleNum[cible] || 0;
        const t = stat.touchesTripleNum[cible] || 0;
        const totalNum = stat.touchesNum[cible] || 0;
        
        if (totalNum === 0) return "-";
        
        const totalDarts = stat.dartsThrown || 1;
        const percent = (((s + d + t) / totalDarts) * 100).toFixed(1); // Pourcentage basé sur les fléchettes réelles
        return `${s}S / ${d}D / ${t}T<br><span style="font-size:11px; color:var(--text-soft);">${percent}%</span>`;
      }));
    }
    mainWrapper.appendChild(blocDetail.blockDiv);
  }

  // ================= TOUR DU MONDE =================
  else if (cricketState.gameMode === "world") {
    const blocGenW = creerBlocStats("Générales");
    genererEnteteJoueurs(blocGenW.table);
    
    ajouterLigne(blocGenW.table, "Progression finale", cricketState.players.map(p => formatScoreDisplay("world", cricketState.scores[p.id])));
    ajouterLigne(blocGenW.table, "Simples", cricketState.players.map(p => cricketState.statsDetails[p.id].simplesHitCount || 0));
    ajouterLigne(blocGenW.table, "Doubles", cricketState.players.map(p => cricketState.statsDetails[p.id].doublesHitCount || 0));
    ajouterLigne(blocGenW.table, "Triples", cricketState.players.map(p => cricketState.statsDetails[p.id].triplesHitCount || 0));
    mainWrapper.appendChild(blocGenW.blockDiv);

    const blocDetailW = creerBlocStats("Tentatives de fléchettes par zone");
    genererEnteteJoueurs(blocDetailW.table);
    const start = cricketState.worldStartNum;
    const end = cricketState.worldEndNum;
    const targetSequence = SEQUENCE_TOUR_DU_MONDE.filter(t => t >= start && t <= end);
    
    targetSequence.forEach(cible => {
      const label = cible === 25 ? "Bull" : `Zone ${cible}`;
      ajouterLigne(blocDetailW.table, label, cricketState.players.map(p => {
        const scoreJoueur = cricketState.scores[p.id];
        const aDepasse = scoreJoueur > cible || scoreJoueur === 26;
        const dartsNeeded = cricketState.statsDetails[p.id].dartsPerTarget[cible] || 0;
        
        if (dartsNeeded === 0 && aDepasse) return "-"; // Sauté
        if (dartsNeeded === 0 && !aDepasse) return "-"; // Non touché
        return `${dartsNeeded}`;
      }));
    });
    mainWrapper.appendChild(blocDetailW.blockDiv);
  }

  // ================= CHASSEUR DE PRIMES =================
  else if (cricketState.gameMode === "bounty") {
    const blocGenB = creerBlocStats("Générales");
    genererEnteteJoueurs(blocGenB.table);

    ajouterLigne(blocGenB.table, "MPR", cricketState.players.map(p => {
      const stat = cricketState.statsDetails[p.id];
      const totalHits = (stat.simples || 0) + (stat.doubles || 0) + (stat.triples || 0);
      const darts = stat.dartsThrown || 1;
      return ((totalHits / darts) * 3).toFixed(2);
    }));
    ajouterLigne(blocGenB.table, "Bonus touchés", cricketState.players.map(p => {
      const stat = cricketState.statsDetails[p.id];
      return (stat.simples || 0) + (stat.doubles || 0) + (stat.triples || 0);
    }));
    ajouterLigne(blocGenB.table, "Points gagnés", cricketState.players.map(p => `+${cricketState.statsDetails[p.id].touchesPositives || 0}`));
    ajouterLigne(blocGenB.table, "Points perdus", cricketState.players.map(p => `-${cricketState.statsDetails[p.id].touchesMalus || 0}`));
    ajouterLigne(blocGenB.table, "Doubles", cricketState.players.map(p => cricketState.statsDetails[p.id].doubles || 0));
    ajouterLigne(blocGenB.table, "Triples", cricketState.players.map(p => cricketState.statsDetails[p.id].triples || 0));
    
    mainWrapper.appendChild(blocGenB.blockDiv);
  }
}