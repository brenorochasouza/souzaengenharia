/* Souza Engenharia | interações do site */
(function () {
  "use strict";

  /* Cabeçalho com sombra ao rolar */
  var topo = document.getElementById("topo");
  function aoRolar() { if (topo) topo.classList.toggle("rolado", window.scrollY > 8); }
  window.addEventListener("scroll", aoRolar, { passive: true });
  aoRolar();

  /* Menu no celular */
  var botaoMenu = document.querySelector(".menu-botao");
  var menu = document.getElementById("menu-principal");
  if (botaoMenu && menu) {
    botaoMenu.addEventListener("click", function () {
      var aberto = menu.classList.toggle("aberto");
      botaoMenu.setAttribute("aria-expanded", aberto ? "true" : "false");
      document.body.style.overflow = aberto ? "hidden" : "";
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        menu.classList.remove("aberto");
        botaoMenu.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      }
    });
  }

  /* Contadores animados */
  function formatar(valor, casas) {
    return valor.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
  }
  function animarContador(el) {
    var alvo = parseFloat(el.getAttribute("data-valor"));
    var casas = (el.getAttribute("data-valor").split(".")[1] || "").length;
    var prefixo = el.getAttribute("data-prefixo") || "";
    var sufixo = el.getAttribute("data-sufixo") || "";
    var duracao = 1800, inicio = null;
    function passo(t) {
      if (!inicio) inicio = t;
      var p = Math.min((t - inicio) / duracao, 1);
      var suave = 1 - Math.pow(1 - p, 3);
      el.textContent = prefixo + formatar(alvo * suave, casas) + sufixo;
      if (p < 1) requestAnimationFrame(passo);
    }
    requestAnimationFrame(passo);
  }

  /* Revelar elementos ao rolar */
  var reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if ("IntersectionObserver" in window && !reduzir) {
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("visivel");
        if (en.target.hasAttribute("data-valor")) animarContador(en.target);
        obs.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    document.querySelectorAll(".revelar, [data-valor]").forEach(function (el, i) {
      if (el.classList.contains("revelar")) el.style.transitionDelay = ((i % 4) * 70) + "ms";
      obs.observe(el);
    });
  } else {
    document.querySelectorAll(".revelar").forEach(function (el) { el.classList.add("visivel"); });
  }

  /* Filtros da galeria */
  var filtros = document.querySelectorAll(".filtro");
  var vazio = document.querySelector(".galeria-vazia[data-filtrado]");
  function aplicarFiltro(cat) {
    var visiveis = 0;
    filtros.forEach(function (b) { b.classList.toggle("ativo", b.getAttribute("data-filtro") === cat); });
    document.querySelectorAll(".fotos-grade .foto").forEach(function (f) {
      var mostra = cat === "todas" || f.getAttribute("data-cat") === cat;
      f.classList.toggle("oculta", !mostra);
      if (mostra) { visiveis++; f.classList.add("visivel"); }
    });
    if (vazio) vazio.hidden = visiveis > 0;
  }
  if (filtros.length) {
    filtros.forEach(function (b) {
      b.addEventListener("click", function () {
        var cat = b.getAttribute("data-filtro");
        aplicarFiltro(cat);
        history.replaceState(null, "", cat === "todas" ? location.pathname : "#" + cat);
      });
    });
    var inicial = decodeURIComponent(location.hash.replace("#", ""));
    if (inicial && document.querySelector('.filtro[data-filtro="' + inicial + '"]')) aplicarFiltro(inicial);
  }

  /* Lightbox */
  var lb = document.getElementById("lightbox");
  if (!lb) return;
  var lbImg = lb.querySelector("img"), lbLeg = lb.querySelector("figcaption");
  var lista = [], atual = 0;
  function mostrar(i) {
    atual = (i + lista.length) % lista.length;
    var a = lista[atual];
    lbImg.src = a.getAttribute("href");
    lbImg.alt = a.getAttribute("data-legenda") || "";
    lbLeg.textContent = a.getAttribute("data-legenda") || "";
  }
  function abrir(a) {
    var grade = a.closest(".fotos-grade") || document;
    lista = Array.prototype.filter.call(grade.querySelectorAll(".foto-link"), function (x) {
      return !x.closest(".foto").classList.contains("oculta");
    });
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    mostrar(lista.indexOf(a));
  }
  function fechar() { lb.hidden = true; lbImg.src = ""; document.body.style.overflow = ""; }
  document.addEventListener("click", function (e) {
    var a = e.target.closest(".foto-link");
    if (a) { e.preventDefault(); abrir(a); }
  });
  lb.querySelector(".lb-fechar").addEventListener("click", fechar);
  lb.querySelector(".lb-ant").addEventListener("click", function () { mostrar(atual - 1); });
  lb.querySelector(".lb-prox").addEventListener("click", function () { mostrar(atual + 1); });
  lb.addEventListener("click", function (e) { if (e.target === lb) fechar(); });
  document.addEventListener("keydown", function (e) {
    if (lb.hidden) return;
    if (e.key === "Escape") fechar();
    if (e.key === "ArrowLeft") mostrar(atual - 1);
    if (e.key === "ArrowRight") mostrar(atual + 1);
  });
  var toqueX = null;
  lb.addEventListener("touchstart", function (e) { toqueX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", function (e) {
    if (toqueX === null) return;
    var dx = e.changedTouches[0].clientX - toqueX;
    if (Math.abs(dx) > 50) mostrar(atual + (dx < 0 ? 1 : -1));
    toqueX = null;
  });
})();
