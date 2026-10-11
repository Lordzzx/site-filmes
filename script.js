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
const top100Container = document.getElementById("top100-container");
const continuarContainer = document.getElementById("continuar-container");
const secaoContinuar = document.getElementById("secao-continuar");
const categoriasNav = document.getElementById("categorias-nav");
const buscaInput = document.getElementById("busca-input");

let todosFilmes = [];
let categoriaAtiva = "todos";

function criarCard(filme, rank) {
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    ${rank ? `<span class="rank">#${rank}</span>` : ""}
    <img src="${filme.Capa}" alt="${filme.Titulo}">
    <a href="detalhes.html?id=${filme.id}" class="btn-assistir">Ver Detalhes</a>
  `;

  card.querySelector("img").addEventListener("click", () => {
    document.querySelectorAll(".card.selecionado").forEach((c) => c.classList.remove("selecionado"));
    card.classList.add("selecionado");
    selecionarDestaque(filme);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  return card;
}

function selecionarDestaque(filme) {
  document.getElementById("banner-titulo").innerText = filme.Titulo;
  document.getElementById("banner-sinopse").innerText = filme.Sinopse || "";
  document.getElementById("banner-rating").innerText = filme.Nota ? `⭐ ${filme.Nota}` : "";
  document.getElementById("banner-assistir").href = `detalhes.html?id=${filme.id}`;
  document.getElementById("banner-trailer").href = `detalhes.html?id=${filme.id}`;

  const banner = document.getElementById("banner-destaque");
  banner.style.backgroundImage = `linear-gradient(90deg, rgba(0,0,0,0.85) 30%, rgba(0,0,0,0.2)), url('${filme.Capa}')`;
}

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
    container.appendChild(criarCard(filme));
  });
}

function renderizarTop100() {
  const ordenados = [...todosFilmes].sort((a, b) => (b.Popularidade || 0) - (a.Popularidade || 0));
  const top10 = ordenados.slice(0, 10);

  top100Container.innerHTML = "";
  top10.forEach((filme, index) => {
    top100Container.appendChild(criarCard(filme, index + 1));
  });
}

function renderizarContinuarAssistindo() {
  const historico = JSON.parse(localStorage.getItem("continuarAssistindo") || "[]");
  const filmesHistorico = historico.map((id) => todosFilmes.find((f) => f.id === id)).filter(Boolean);

  if (filmesHistorico.length === 0) {
    secaoContinuar.style.display = "none";
    return;
  }

  secaoContinuar.style.display = "block";
  continuarContainer.innerHTML = "";
  filmesHistorico.forEach((filme) => {
    continuarContainer.appendChild(criarCard(filme));
  });
}

function renderizarBanner() {
  if (todosFilmes.length === 0) return;
  const destaque = [...todosFilmes].sort((a, b) => (b.Nota || 0) - (a.Nota || 0))[0];
  selecionarDestaque(destaque);
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
  document.getElementById("user-foto").style.display = "block";

  db.ref("Filmes").on("value", (snapshot) => {
    todosFilmes = [];

    snapshot.forEach((filmeSnap) => {
      const filme = filmeSnap.val();
      filme.id = filmeSnap.key;
      todosFilmes.push(filme);
    });

    montarCategorias();
    renderizarFilmes();
    renderizarTop100();
    renderizarContinuarAssistindo();
    renderizarBanner();
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

document.getElementById("btn-busca-sidebar").addEventListener("click", () => {
  const overlay = document.getElementById("busca-overlay");
  overlay.style.display = overlay.style.display === "block" ? "none" : "block";
  if (overlay.style.display === "block") buscaInput.focus();
});

document.addEventListener("click", (e) => {
  const userInfo = document.getElementById("user-info");
  if (!userInfo.contains(e.target)) {
    document.getElementById("user-dropdown").classList.remove("mostrar");
  }

  const catWrapper = document.querySelector(".categorias-wrapper");
  const btnCategorias = document.getElementById("btn-categorias");
  if (catWrapper && !catWrapper.contains(e.target) && !btnCategorias.contains(e.target)) {
    categoriasNav.classList.remove("mostrar");
  }
});

document.getElementById("btn-logout").addEventListener("click", () => {
  auth.signOut().then(() => {
    window.location.href = "perfis.html";
  });
});

document.getElementById("btn-perfil-sidebar").addEventListener("click", () => {
  document.getElementById("user-dropdown").classList.toggle("mostrar");
});