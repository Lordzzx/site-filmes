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
const categoriasNav = document.getElementById("categorias-nav");
const buscaInput = document.getElementById("busca-input");

let todosFilmes = [];
let categoriaAtiva = "todos";

function renderizarFilmes() {
  const termoBusca = buscaInput.value.trim().toLowerCase();

  const filtrados = todosFilmes.filter((filme) => {
    const bateCategoria = categoriaAtiva === "todos" || filme.Genero === categoriaAtiva;
    const bateBusca = (filme.Titulo || "").toLowerCase().includes(termoBusca);
    return bateCategoria && bateBusca;
  });

  container.innerHTML = "";

  if (filtrados.length === 0) {
    container.innerHTML = "<p style='color:#aaa;'>Nenhum filme encontrado.</p>";
    return;
  }

  filtrados.forEach((filme) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${filme.Capa}" alt="${filme.Titulo}">
      <a href="detalhes.html?id=${filme.id}" class="btn-assistir">Ver Detalhes</a>
    `;
    container.appendChild(card);
  });
}

function montarCategorias() {
  const generos = [...new Set(todosFilmes.map((f) => f.Genero).filter(Boolean))];

  categoriasNav.innerHTML = "";

  const btnTodos = document.createElement("button");
  btnTodos.className = "cat-btn ativo";
  btnTodos.textContent = "Todos";
  btnTodos.dataset.genero = "todos";
  categoriasNav.appendChild(btnTodos);

  generos.forEach((genero) => {
    const btn = document.createElement("button");
    btn.className = "cat-btn";
    btn.textContent = genero;
    btn.dataset.genero = genero;
    categoriasNav.appendChild(btn);
  });

  categoriasNav.querySelectorAll(".cat-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      categoriasNav.querySelectorAll(".cat-btn").forEach((b) => b.classList.remove("ativo"));
      btn.classList.add("ativo");
      categoriaAtiva = btn.dataset.genero;
      renderizarFilmes();
      categoriasNav.classList.remove("mostrar");
    });
  });
}

auth.onAuthStateChanged((user) => {
  if (!user) {
    window.location.href = "perfis.html";
    return;
  }

  document.getElementById("user-nome").innerText = user.displayName;
  document.getElementById("user-foto").src = user.photoURL;
  document.getElementById("user-foto-dropdown").src = user.photoURL;
  document.getElementById("user-info").style.display = "flex";

  db.ref("Filmes").on("value", (snapshot) => {
    todosFilmes = [];

    snapshot.forEach((filmeSnap) => {
      const filme = filmeSnap.val();
      filme.id = filmeSnap.key;
      todosFilmes.push(filme);
    });

    montarCategorias();
    renderizarFilmes();
  }, (error) => {
    console.error("Erro ao carregar filmes do Firebase:", error);
  });
});

buscaInput.addEventListener("input", renderizarFilmes);

document.getElementById("user-foto").addEventListener("click", () => {
  document.getElementById("user-dropdown").classList.toggle("mostrar");
});

document.getElementById("btn-categorias").addEventListener("click", () => {
  categoriasNav.classList.toggle("mostrar");
});

document.getElementById("nav-catalogo-inferior").addEventListener("click", (e) => {
  e.preventDefault();
  window.scrollTo({ top: 0, behavior: "smooth" });
  categoriasNav.classList.add("mostrar");
});

document.addEventListener("click", (e) => {
  const userInfo = document.getElementById("user-info");
  if (!userInfo.contains(e.target)) {
    document.getElementById("user-dropdown").classList.remove("mostrar");
  }

  const catWrapper = document.querySelector(".categorias-wrapper");
  if (catWrapper && !catWrapper.contains(e.target)) {
    categoriasNav.classList.remove("mostrar");
  }
});

document.getElementById("btn-logout").addEventListener("click", () => {
  auth.signOut().then(() => {
    window.location.href = "perfis.html";
  });
});