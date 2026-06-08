// ================== INITIALISATION & NAVIGATION ==================
const screens = {
  loading: document.getElementById("loadingScreen"),
  login: document.getElementById("loginScreen"),
  home: document.getElementById("homeScreen"),
  newGame: document.getElementById("newGameScreen")
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

// Gestion des Onglets de la page "Nouvelle Partie"
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.add("hidden"));
    
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.remove("hidden");
  });
});

// Navigation vers la nouvelle partie
document.getElementById("menuNewGame").addEventListener("click", () => {
  showScreen(screens.newGame);
  chargerListeJoueurs();
});
document.getElementById("backHomeBtn").addEventListener("click", () => showScreen(screens.home));

// Redirection temporaire pour les boutons non développés
["menuPlayers", "menuHistory", "menuRanking", "menuTraining", "menuTournament"].forEach(id => {
  document.getElementById(id).addEventListener("click", () => {
    showPopup("Cette fonctionnalité arrive très bientôt dans la V1 !");
  });
});

// ================== CONFIGURATION FIREBASE AUTH ==================
const auth = firebase.auth();
const db = firebase.firestore();

// Écouteur de l'état de connexion
auth.onAuthStateChanged(async (user) => {
  if (user) {
    // L'utilisateur est connecté
    const emailPrefix = user.email.split('@')[0];
    document.getElementById("playerNameDisplay").innerText = emailPrefix;
    showScreen(screens.home);
    showPopup(`Ravi de vous revoir !`);
  } else {
    // Déconnecté
    showScreen(screens.login);
  }
});

// Bouton Inscription
document.getElementById("btnSignup").addEventListener("click", async () => {
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value.trim();
  if (!email || !password) return showPopup("Veuillez remplir tous les champs.");

  try {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    // On crée une fiche joueur dans Firestore liée à son UID
    await db.collection("players").doc(cred.user.uid).set({
      email: email,
      name: email.split('@')[0],
      createdAt: Date.now()
    });
    showPopup("Compte créé avec succès !");
  } catch (e) {
    showPopup(`Erreur : ${e.message}`);
  }
});

// Bouton Connexion
document.getElementById("btnLogin").addEventListener("click", async () => {
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value.trim();
  if (!email || !password) return showPopup("Champs requis.");

  try {
    await auth.signInWithEmailAndPassword(email, password);
  } catch (e) {
    showPopup(`Erreur : ${e.message}`);
  }
});

// Bouton Déconnexion
document.getElementById("btnLogout").addEventListener("click", () => {
  auth.signOut().then(() => showPopup("Déconnecté."));
});

// ================== CHARGEMENT FIRESTORE (JOUEURS) ==================
async function chargerListeJoueurs() {
  const container = document.getElementById("playersCheckboxList");
  container.innerHTML = "<p class='hint'>Chargement des tireurs...</p>";

  try {
    const snapshot = await db.collection("players").get();
    if(snapshot.empty) {
      container.innerHTML = "<p class='hint'>Aucun joueur trouvé.</p>";
      return;
    }

    container.innerHTML = "";
    snapshot.forEach(doc => {
      const pData = doc.data();
      const currentUserId = auth.currentUser ? auth.currentUser.uid : null;
      // Par défaut, on coche automatiquement l'utilisateur connecté
      const isChecked = doc.id === currentUserId ? "checked" : "";

      const div = document.createElement("div");
      div.className = "stat-row";
      div.innerHTML = `
        <span class="stat-label"><strong>${pData.name}</strong></span>
        <input type="checkbox" name="selectedPlayers" value="${doc.id}" ${isChecked} style="width: auto; margin-top:0;">
      `;
      container.appendChild(div);
    });
  } catch (e) {
    container.innerHTML = "<p class='hint'>Erreur lors du chargement.</p>";
    console.error(e);
  }
}

// Bouton Lancer la Partie
document.getElementById("startGameBtn").addEventListener("click", () => {
  const checkboxes = document.querySelectorAll('input[name="selectedPlayers"]:checked');
  const joueursSelectionnes = Array.from(checkboxes).map(cb => cb.value);

  if (joueursSelectionnes.length === 0) {
    showPopup("Sélectionne au moins 1 joueur pour lancer le Cricket !");
    return;
  }

  showPopup(`🏏 Lancement du Cricket avec ${joueursSelectionnes.length} joueur(s) !`);
  // C'est ici que l'on connectera l'écran du jeu du Cricket à la prochaine étape !
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js');
}