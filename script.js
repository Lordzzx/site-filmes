const firebaseConfig = {
  apiKey: "AIzaSyCxkJCD8HENp0jk2ZwU0mLDhTi9zWd5WeM",
  authDomain: "netdev-9a4e6.firebaseapp.com",
  databaseURL: "https://netdev-9a4e6-default-rtdb.firebaseio.com",
  projectId: "netdev-9a4e6",
  storageBucket: "netdev-9a4e6.firebasestorage.app",
  messagingSenderId: "612992618514",
  appId: "1:612992618514:web:36011d43647ea6d42fc8cb",
  measurementId: "G-M9H44B2LV1"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();

const container = document.getElementById("filmes-container");

auth.onAuthStateChanged((user) => {
  if (!user) {
    window.location.href = "perfis.html";
    return;
  }

  document.getElementById("user-nome").innerText = user.displayName;
  document.getElementById("user-foto").src = user.photoURL;
  document.getElementById("user-info").style.display = "flex";

  db.ref("Filmes").on("value", (snapshot) => {
    container.innerHTML = "";

    snapshot.forEach((filmeSnap) => {
      const filme = filmeSnap.val();
      const id = filmeSnap.key;

      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <img src="${filme.Capa}" alt="${filme.Titulo}">
        <a href="detalhes.html?id=${id}" class="btn-assistir">Ver Detalhes</a>
      `;

      container.appendChild(card);
    });
  }, (error) => {
    console.error("Erro ao carregar filmes do Firebase:", error);
  });
});

document.getElementById("btn-logout").addEventListener("click", () => {
  auth.signOut().then(() => {
    window.location.href = "perfis.html";
  });
});