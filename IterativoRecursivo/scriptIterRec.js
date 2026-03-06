let contadorId = 1;
let contadorR = 1;

function adicionarInstrucao(container) {
  const idInstrucao = `stmt_${contadorId}`;
  contadorId++;

  const wrapper = document.createElement("div");
  wrapper.className = "p-2 mb-2 border rounded";
  wrapper.dataset.stmtId = idInstrucao;

  wrapper.innerHTML = `
    <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
      <strong>Instrução:</strong>
      <select class="form-select form-select-sm tipoInstrucao" style="width:180px;" onchange="renderizarCorpoInstrucao(this)">
        <option value="op">OPERAÇÃO (faça F)</option>
        <option value="if">SE (se T então ... senão ...)</option>
        <option value="while">ENQUANTO (enquanto T faça ...)</option>
        <option value="until">ATÉ (até T faça ...)</option>
        <option value="nop">✓ (não faz nada)</option>
      </select>

      <button class="btn btn-outline-danger btn-sm" onclick="removerInstrucao(this)">remover</button>
    </div>

    <div class="corpoInstrucao mt-2"></div>
  `;

  container.appendChild(wrapper);

  // render inicial como OP
  const select = wrapper.querySelector(".tipoInstrucao");
  renderizarCorpoInstrucao(select);
}

function removerInstrucao(btn) {
  const wrapper = btn.closest("[data-stmt-id]");
  if (wrapper) wrapper.remove();
}

function renderizarCorpoInstrucao(selectEl) {
  const wrapper = selectEl.closest("[data-stmt-id]");
  const corpo = wrapper.querySelector(".corpoInstrucao");
  const tipo = selectEl.value;

  if (tipo === "op") {
    corpo.innerHTML = `
      <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
        <span><strong>faça</strong></span>
        <input type="text" class="form-control form-control-sm textoOperacao" placeholder="F" style="width:260px;">
      </div>
    `;
  }

  if (tipo === "if") {
    corpo.innerHTML = `
      <div class="mb-2" style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
        <strong>se</strong>
        <input type="text" class="form-control form-control-sm textoTeste" placeholder="T" style="width:260px;">
        <strong>então</strong>
      </div>

      <div class="ms-3">
        <div class="text-muted mb-1">Bloco ENTÃO:</div>
        <div class="blocoEntao border rounded p-2 mb-2"></div>
        <button class="btn btn-outline-secondary btn-sm" onclick="adicionarInstrucao(this.previousElementSibling)">+ Adicionar no ENTÃO</button>
      </div>

      <div class="mt-3 mb-1" style="display:flex; gap:10px; align-items:center;">
        <strong>senão</strong>
      </div>

      <div class="ms-3">
        <div class="text-muted mb-1">Bloco SENÃO:</div>
        <div class="blocoSenao border rounded p-2 mb-2"></div>
        <button class="btn btn-outline-secondary btn-sm" onclick="adicionarInstrucao(this.previousElementSibling)">+ Adicionar no SENÃO</button>
      </div>
    `;
  }

  if (tipo === "while") {
    corpo.innerHTML = `
      <div class="mb-2" style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
        <strong>enquanto</strong>
        <input type="text" class="form-control form-control-sm textoTeste" placeholder="T" style="width:260px;">
        <strong>faça</strong>
      </div>

      <div class="ms-3">
        <div class="text-muted mb-1">Corpo do ENQUANTO:</div>
        <div class="blocoCorpo border rounded p-2 mb-2"></div>
        <button class="btn btn-outline-secondary btn-sm" onclick="adicionarInstrucao(this.previousElementSibling)">+ Adicionar no CORPO</button>
      </div>
    `;
  }

  if (tipo === "until") {
    corpo.innerHTML = `
      <div class="mb-2" style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
        <strong>até</strong>
        <input type="text" class="form-control form-control-sm textoTeste" placeholder="T" style="width:260px;">
        <strong>faça</strong>
      </div>

      <div class="ms-3">
        <div class="text-muted mb-1">Corpo do ATÉ:</div>
        <div class="blocoCorpo border rounded p-2 mb-2"></div>
        <button class="btn btn-outline-secondary btn-sm" onclick="adicionarInstrucao(this.previousElementSibling)">+ Adicionar no CORPO</button>
      </div>
    `;
  }

  if (tipo === "nop") {
    corpo.innerHTML = `<div class="text-muted"><strong>✓</strong> (não faz nada)</div>`;
  }
}

function lerContainer(container) {
  const instrucoes = [];
  const filhos = container.querySelectorAll(":scope > [data-stmt-id]");

  filhos.forEach(w => {
    const tipo = w.querySelector(".tipoInstrucao").value;

    if (tipo === "op") {
      const texto = (w.querySelector(".textoOperacao").value || "").trim();
      instrucoes.push({ kind: "op", text: texto.length ? texto : "F" });
    }

    if (tipo === "nop") {
      instrucoes.push({ kind: "nop" });
    }

    if (tipo === "if") {
      const teste = (w.querySelector(".textoTeste").value || "").trim();
      const blocoEntao = w.querySelector(".blocoEntao");
      const blocoSenao = w.querySelector(".blocoSenao");

      instrucoes.push({
        kind: "if",
        test: teste.length ? teste : "T",
        then: lerContainer(blocoEntao),
        els: lerContainer(blocoSenao)
      });
    }

    if (tipo === "while") {
      const teste = (w.querySelector(".textoTeste").value || "").trim();
      const blocoCorpo = w.querySelector(".blocoCorpo");

      instrucoes.push({
        kind: "while",
        test: teste.length ? teste : "T",
        body: lerContainer(blocoCorpo)
      });
    }

    if (tipo === "until") {
      const teste = (w.querySelector(".textoTeste").value || "").trim();
      const blocoCorpo = w.querySelector(".blocoCorpo");

      instrucoes.push({
        kind: "until",
        test: teste.length ? teste : "T",
        body: lerContainer(blocoCorpo)
      });
    }
  });

  return instrucoes;
}

function novoR() {
  const nome = `R${contadorR}`;
  contadorR++;
  return nome;
}

function compilarSequencia(instrucoes, proximo, definicoes) {
  if (!instrucoes || instrucoes.length === 0) {
    return proximo;
  }

  let continua = proximo;

  for (let i = instrucoes.length - 1; i >= 0; i--) {
    continua = compilarInstrucao(instrucoes[i], continua, definicoes);
  }

  return continua;
}

function compilarInstrucao(instrucao, proximo, definicoes) {
  // OPERAÇÃO
  if (instrucao.kind === "op") {
    const atual = novoR();
    const texto = (instrucao.text && instrucao.text.trim().length) ? instrucao.text.trim() : "F";
    definicoes.push(`${atual} def ${texto}; ${proximo}`);
    return atual;
  }

  // (não faz nada)
  if (instrucao.kind === "nop") {
    return proximo;
  }

  // IF: se T então A senão B
  if (instrucao.kind === "if") {
    const atual = novoR();
    const teste = (instrucao.test && instrucao.test.trim().length) ? instrucao.test.trim() : "T";

    const entradaEntao = compilarSequencia(instrucao.then, proximo, definicoes);
    const entradaSenao = compilarSequencia(instrucao.els, proximo, definicoes);

    definicoes.push(`${atual} def (se ${teste} então ${entradaEntao} senão ${entradaSenao})`);
    return atual;
  }

  // WHILE: enquanto T faça BODY
  if (instrucao.kind === "while") {
    const loop = novoR();
    const teste = (instrucao.test && instrucao.test.trim().length) ? instrucao.test.trim() : "T";

    const entradaCorpo = compilarSequencia(instrucao.body, loop, definicoes);

    definicoes.push(`${loop} def (se ${teste} então ${entradaCorpo} senão ${proximo})`);
    return loop;
  }

  // UNTIL: até T faça BODY
  if (instrucao.kind === "until") {
    const loop = novoR();
    const checagem = novoR();
    const teste = (instrucao.test && instrucao.test.trim().length) ? instrucao.test.trim() : "T";

    const entradaCorpo = compilarSequencia(instrucao.body, checagem, definicoes);

    definicoes.push(`${checagem} def (se ${teste} então ${proximo} senão ${loop})`);
    definicoes.push(`${loop} def ${entradaCorpo}`);

    return loop;
  }

  return proximo;
}

function gerarTraducaoIterRec() {
  contadorR = 1;

  const raiz = document.getElementById("programRoot");
  const instrucoes = lerContainer(raiz);

  if (!instrucoes || instrucoes.length === 0) {
    document.getElementById("output").innerText = "Adiciona pelo menos 1 instrução.";
    return;
  }

  const definicoes = [];
  const inicio = compilarSequencia(instrucoes, "✓", definicoes);

  let saida = `P é ${inicio} onde\n`;
  saida += definicoes.join(",\n");

  document.getElementById("output").innerText = saida;
}