(function () {
  "use strict";
  var reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Cabeçalho: linha inferior ao rolar
  var topo = document.getElementById("topo");
  function marcarTopo() { if (topo) topo.classList.toggle("rolou", window.scrollY > 8); }
  window.addEventListener("scroll", marcarTopo, { passive: true });
  marcarTopo();

  // Menu no celular
  var botaoMenu = document.querySelector(".menu-botao");
  var menu = document.getElementById("menu");
  if (botaoMenu && menu) {
    function fecharMenu() {
      menu.classList.remove("aberto");
      botaoMenu.setAttribute("aria-expanded", "false");
      botaoMenu.setAttribute("aria-label", "Abrir menu");
    }
    botaoMenu.addEventListener("click", function () {
      var aberto = menu.classList.toggle("aberto");
      botaoMenu.setAttribute("aria-expanded", aberto ? "true" : "false");
      botaoMenu.setAttribute("aria-label", aberto ? "Fechar menu" : "Abrir menu");
    });
    menu.addEventListener("click", function (e) { if (e.target.tagName === "A") fecharMenu(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") fecharMenu(); });
  }

  // Faixa de clientes passando continuamente
  var faixa = document.querySelector("[data-faixa]");
  if (faixa) {
    var trilho = faixa.querySelector(".faixa-trilho");
    var grupo = trilho.querySelector(".faixa-grupo");
    var itensOriginais = Array.prototype.slice.call(grupo.children);

    function montarFaixa() {
      // Repete os itens até o grupo ser mais largo que a tela
      var voltas = 0;
      while (grupo.scrollWidth < faixa.clientWidth * 1.1 && voltas < 20) {
        itensOriginais.forEach(function (item) {
          var copia = item.cloneNode(true);
          copia.setAttribute("aria-hidden", "true");
          grupo.appendChild(copia);
        });
        voltas++;
      }
      if (reduzir) return;
      // Segundo grupo idêntico para o laço não ter emenda
      var clone = grupo.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      trilho.appendChild(clone);
      var tempo = Math.max(20, grupo.scrollWidth / 45);
      trilho.style.setProperty("--faixa-tempo", tempo + "s");
      trilho.classList.add("animando");
    }

    var imagens = grupo.querySelectorAll("img");
    var pendentes = 0;
    Array.prototype.forEach.call(imagens, function (img) {
      img.loading = "eager";
      if (!img.complete) {
        pendentes++;
        var pronto = function () { pendentes--; if (pendentes === 0) montarFaixa(); };
        img.addEventListener("load", pronto, { once: true });
        img.addEventListener("error", pronto, { once: true });
      }
    });
    if (pendentes === 0) montarFaixa();
  }

  // Carrossel de obras
  var carrossel = document.querySelector("[data-carrossel]");
  if (carrossel) {
    var pista = carrossel.querySelector(".obras-trilho");
    var slides = pista.querySelectorAll(".obra");
    var atual = carrossel.querySelector("[data-atual]");
    var anterior = carrossel.querySelector("[data-anterior]");
    var proximo = carrossel.querySelector("[data-proximo]");
    var indice = 0;

    function passo() { return slides.length > 1 ? slides[1].offsetLeft - slides[0].offsetLeft : pista.clientWidth; }
    function indiceAtual() { return Math.round(pista.scrollLeft / passo()); }
    function noFim() { return pista.scrollLeft + pista.clientWidth >= pista.scrollWidth - 4; }

    function irPara(i) {
      if (i < 0) i = slides.length - 1;
      if (i >= slides.length || (i > indice && noFim())) i = 0;
      pista.scrollTo({ left: slides[i].offsetLeft - slides[0].offsetLeft, behavior: reduzir ? "auto" : "smooth" });
    }

    pista.addEventListener("scroll", function () {
      indice = Math.min(slides.length - 1, indiceAtual());
      if (noFim()) indice = slides.length - 1;
      if (atual) atual.textContent = String(indice + 1);
    }, { passive: true });

    anterior.addEventListener("click", function () { parar(); irPara(indice - 1); });
    proximo.addEventListener("click", function () { parar(); irPara(indice + 1); });

    // Avança sozinho enquanto estiver visível, até a pessoa interagir
    var relogio = null, interagiu = false;
    function iniciar() { if (!reduzir && !interagiu && !relogio && slides.length > 1) relogio = setInterval(function () { irPara(indice + 1); }, 4500); }
    function pausar() { clearInterval(relogio); relogio = null; }
    function parar() { interagiu = true; pausar(); }
    pista.addEventListener("pointerdown", parar);
    pista.addEventListener("wheel", parar, { passive: true });
    pista.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); parar(); irPara(indice + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); parar(); irPara(indice - 1); }
    });
    carrossel.addEventListener("mouseenter", pausar);
    carrossel.addEventListener("mouseleave", iniciar);

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) { if (e.isIntersecting) iniciar(); else pausar(); });
      }, { threshold: 0.4 }).observe(carrossel);
    } else {
      iniciar();
    }
  }
})();
