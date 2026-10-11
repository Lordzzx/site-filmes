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
    <p class="card-titulo">${filme.Titulo}</p>
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

function gerarEstrelas(nota) {
  const cheias = Math.round(nota / 2);
  const vazias = 5 - cheias;
  return "★".repeat(cheias) + "☆".repeat(vazias);
}

function selecionarDestaque(filme) {
  const tituloEl = document.getElementById("banner-titulo");
  if (filme.Logo) {
    tituloEl.innerHTML = `<img src="${filme.Logo}" alt="${filme.Titulo}" class="banner-logo-img">`;
  } else {
    tituloEl.innerText = filme.Titulo;
  }
  document.getElementById("banner-sinopse").innerText = filme.Sinopse || "";
  const duracaoTexto = filme.Duracao ? ` · ${filme.Duracao}` : "";
  document.getElementById("banner-rating").innerText = filme.Nota ? `${gerarEstrelas(filme.Nota)}  ${filme.Nota}${duracaoTexto}` : (filme.Duracao || "");
  document.getElementById("banner-assistir").href = `detalhes.html?id=${filme.id}`;
  document.getElementById("banner-trailer").href = `detalhes.html?id=${filme.id}`;

  const banner = document.getElementById("banner-destaque");
   banner.style.backgroundImage = `linear-gradient(90deg, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.97) 45%, rgba(0,0,0,0) 85%), url('${filme.Fundo || filme.Capa}')`;

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
  filtrados.forEach((filme) => { container.appendChild(criarCard(filme)); });
}

function renderizarTop100() {
  const ordenados = [...todosFilmes].sort((a, b) => (b.Popularidade || 0) - (a.Popularidade || 0));
  const top10 = ordenados.slice(0, 10);
  top100Container.innerHTML = "";
  top10.forEach((filme, index) => { top100Container.appendChild(criarCard(filme, index + 1)); });
}

function renderizarContinuarAssistindo() {
  const historico = JSON.parse(localStorage.getItem("continuarAssistindo") || "[]");
  const filmesHistorico = historico.map((id) => todosFilmes.find((f) => f.id === id)).filter(Boolean);
  if (filmesHistorico.length === 0) { secaoContinuar.style.display = "none"; return; }
  secaoContinuar.style.display = "block";
  continuarContainer.innerHTML = "";
  filmesHistorico.forEach((filme) => { continuarContainer.appendChild(criarCard(filme)); });
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

function carregarDadosPerfil(user) {
  db.ref("Perfis/" + user.uid).once("value").then((snap) => {
    const perfil = snap.val() || {};
    const fotoFinal = perfil.FotoCustom || user.photoURL;

    document.getElementById("user-foto").src = fotoFinal;
    document.getElementById("user-foto").style.display = "block";

    document.getElementById("perfil-modal-foto").src = fotoFinal;
    document.getElementById("perfil-modal-nome").innerText = user.displayName || "";
    document.getElementById("perfil-modal-email").innerText = user.email || "";
  });
}

auth.onAuthStateChanged((user) => {
  if (!user) { window.location.href = "perfis.html"; return; }

  carregarDadosPerfil(user);

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
  }, (error) => { console.error("Erro ao carregar filmes do Firebase:", error); });
});

buscaInput.addEventListener("input", renderizarFilmes);

document.getElementById("btn-categorias").addEventListener("click", () => {
  categoriasNav.classList.toggle("mostrar");
});

document.getElementById("btn-busca-sidebar").addEventListener("click", () => {
  const overlay = document.getElementById("busca-overlay");
  overlay.style.display = overlay.style.display === "block" ? "none" : "block";
  if (overlay.style.display === "block") buscaInput.focus();
});

document.addEventListener("click", (e) => {
  const catWrapper = document.querySelector(".categorias-wrapper");
  const btnCategorias = document.getElementById("btn-categorias");
  if (catWrapper && !catWrapper.contains(e.target) && !btnCategorias.contains(e.target)) {
    categoriasNav.classList.remove("mostrar");
  }
});

document.getElementById("btn-logout").addEventListener("click", () => {
  auth.signOut().then(() => { window.location.href = "perfis.html"; });
});

function abrirPerfilModal() {
  document.getElementById("perfil-modal").classList.add("mostrar");
}

function fecharPerfilModal() {
  document.getElementById("perfil-modal").classList.remove("mostrar");
}

document.getElementById("btn-perfil-sidebar").addEventListener("click", abrirPerfilModal);
document.getElementById("user-foto").addEventListener("click", abrirPerfilModal);
document.getElementById("btn-fechar-perfil").addEventListener("click", fecharPerfilModal);

document.getElementById("perfil-modal").addEventListener("click", (e) => {
  if (e.target.id === "perfil-modal") fecharPerfilModal();
});

document.getElementById("btn-salvar-foto").addEventListener("click", () => {
  const url = document.getElementById("input-foto-url").value.trim();
  const msg = document.getElementById("msg-foto-status");
  const user = auth.currentUser;

  if (!url) {
    msg.innerText = "Cole um link de imagem válido.";
    msg.style.color = "#E50914";
    return;
  }
  if (!user) return;

  db.ref("Perfis/" + user.uid).update({ FotoCustom: url }).then(() => {
    document.getElementById("user-foto").src = url;
    document.getElementById("perfil-modal-foto").src = url;
    document.getElementById("input-foto-url").value = "";
    msg.innerText = "Foto atualizada com sucesso!";
    msg.style.color = "#2ecc71";
  }).catch(() => {
    msg.innerText = "Erro ao salvar a foto. Tente novamente.";
    msg.style.color = "#E50914";
  });
}); function adicionarSetasCarrossel() {
  document.querySelectorAll(".carrossel").forEach((carrossel) => {
    const wrapper = document.createElement("div");
    wrapper.className = "carrossel-wrapper";
    carrossel.parentNode.insertBefore(wrapper, carrossel);
    wrapper.appendChild(carrossel);

    const btnEsq = document.createElement("button");
    btnEsq.className = "seta-carrossel seta-esquerda";
    btnEsq.innerHTML = "‹";
    btnEsq.addEventListener("click", () => carrossel.scrollBy({ left: -400, behavior: "smooth" }));

    const btnDir = document.createElement("button");
    btnDir.className = "seta-carrossel seta-direita";
    btnDir.innerHTML = "›";
    btnDir.addEventListener("click", () => carrossel.scrollBy({ left: 400, behavior: "smooth" }));

    wrapper.appendChild(btnEsq);
    wrapper.appendChild(btnDir);
  });
}

adicionarSetasCarrossel();