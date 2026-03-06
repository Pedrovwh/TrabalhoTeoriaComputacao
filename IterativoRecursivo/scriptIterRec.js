let idCounter = 1;
let rCounter = 1;

function addStmt(container) {
  const stmtId = `stmt_${idCounter}`;
  idCounter++;

  const wrapper = document.createElement("div");
  wrapper.className = "p-2 mb-2 border rounded";
  wrapper.dataset.stmtId = stmtId;

  wrapper.innerHTML = `
    <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
      <strong>Instrução:</strong>
      <select class="form-select form-select-sm stmtType" style="width:180px;" onchange="renderStmtBody(this)">
        <option value="op">OPERAÇÃO (faça F)</option>
        <option value="if">SE (se T então ... senão ...)</option>
        <option value="while">ENQUANTO (enquanto T faça ...)</option>
        <option value="until">ATÉ (até T faça ...)</option>
        <option value="nop">✓ (não faz nada)</option>
      </select>

      <button class="btn btn-outline-danger btn-sm" onclick="removeStmt(this)">remover</button>
    </div>

    <div class="stmtBody mt-2"></div>
  `;

  container.appendChild(wrapper);

  // render inicial como OP
  const select = wrapper.querySelector(".stmtType");
  renderStmtBody(select);
}

function removeStmt(btn) {
  const wrapper = btn.closest("[data-stmt-id]");
  if (wrapper) wrapper.remove();
}

function renderStmtBody(selectEl) {
  const wrapper = selectEl.closest("[data-stmt-id]");
  const body = wrapper.querySelector(".stmtBody");
  const type = selectEl.value;

  if (type === "op") {
    body.innerHTML = `
      <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
        <span><strong>faça</strong></span>
        <input type="text" class="form-control form-control-sm opText" placeholder="F" style="width:260px;">
      </div>
    `;
  }

  if (type === "if") {
    body.innerHTML = `
      <div class="mb-2" style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
        <strong>se</strong>
        <input type="text" class="form-control form-control-sm testText" placeholder="T" style="width:260px;">
        <strong>então</strong>
      </div>

      <div class="ms-3">
        <div class="text-muted mb-1">Bloco ENTÃO:</div>
        <div class="thenBlock border rounded p-2 mb-2"></div>
        <button class="btn btn-outline-secondary btn-sm" onclick="addStmt(this.previousElementSibling)">+ Adicionar no ENTÃO</button>
      </div>

      <div class="mt-3 mb-1" style="display:flex; gap:10px; align-items:center;">
        <strong>senão</strong>
      </div>

      <div class="ms-3">
        <div class="text-muted mb-1">Bloco SENÃO:</div>
        <div class="elseBlock border rounded p-2 mb-2"></div>
        <button class="btn btn-outline-secondary btn-sm" onclick="addStmt(this.previousElementSibling)">+ Adicionar no SENÃO</button>
      </div>
    `;
  }

  if (type === "while") {
    body.innerHTML = `
      <div class="mb-2" style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
        <strong>enquanto</strong>
        <input type="text" class="form-control form-control-sm testText" placeholder="T" style="width:260px;">
        <strong>faça</strong>
      </div>

      <div class="ms-3">
        <div class="text-muted mb-1">Corpo do ENQUANTO:</div>
        <div class="bodyBlock border rounded p-2 mb-2"></div>
        <button class="btn btn-outline-secondary btn-sm" onclick="addStmt(this.previousElementSibling)">+ Adicionar no CORPO</button>
      </div>
    `;
  }

  if (type === "until") {
    body.innerHTML = `
      <div class="mb-2" style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
        <strong>até</strong>
        <input type="text" class="form-control form-control-sm testText" placeholder="T" style="width:260px;">
        <strong>faça</strong>
      </div>

      <div class="ms-3">
        <div class="text-muted mb-1">Corpo do ATÉ:</div>
        <div class="bodyBlock border rounded p-2 mb-2"></div>
        <button class="btn btn-outline-secondary btn-sm" onclick="addStmt(this.previousElementSibling)">+ Adicionar no CORPO</button>
      </div>
    `;
  }

  if (type === "nop") {
    body.innerHTML = `<div class="text-muted"><strong>✓</strong> (não faz nada)</div>`;
  }
}

function parseContainer(container) {
  const stmts = [];
  const children = container.querySelectorAll(":scope > [data-stmt-id]");
  children.forEach(w => {
    const type = w.querySelector(".stmtType").value;

    if (type === "op") {
      const txt = (w.querySelector(".opText").value || "").trim();
      stmts.push({ kind: "op", text: txt.length ? txt : "F" });
    }

    if (type === "nop") {
      stmts.push({ kind: "nop" });
    }

    if (type === "if") {
      const t = (w.querySelector(".testText").value || "").trim();
      const thenBlock = w.querySelector(".thenBlock");
      const elseBlock = w.querySelector(".elseBlock");
      stmts.push({
        kind: "if",
        test: t.length ? t : "T",
        then: parseContainer(thenBlock),
        els: parseContainer(elseBlock)
      });
    }

    if (type === "while") {
      const t = (w.querySelector(".testText").value || "").trim();
      const bodyBlock = w.querySelector(".bodyBlock");
      stmts.push({
        kind: "while",
        test: t.length ? t : "T",
        body: parseContainer(bodyBlock)
      });
    }

    if (type === "until") {
      const t = (w.querySelector(".testText").value || "").trim();
      const bodyBlock = w.querySelector(".bodyBlock");
      stmts.push({
        kind: "until",
        test: t.length ? t : "T",
        body: parseContainer(bodyBlock)
      });
    }
  });

  return stmts;
}

function newR() {
  const name = `R${rCounter}`;
  rCounter++;
  return name;
}

function compileSeq(stmts, next, defs) {
  if (!stmts || stmts.length === 0) {
    return next;
  }

  let cont = next;

  for (let i = stmts.length - 1; i >= 0; i--) {
    cont = compileStmt(stmts[i], cont, defs);
  }

  return cont;
}

function compileStmt(stmt, next, defs) {
  // OPERAÇÃO
  if (stmt.kind === "op") {
    const cur = newR();
    const txt = (stmt.text && stmt.text.trim().length) ? stmt.text.trim() : "F";
    defs.push(`${cur} def ${txt}; ${next}`);
    return cur;
  }

  // (não faz nada)
  if (stmt.kind === "nop") {
    return next;
  }

  // IF: se T então A senão B
  if (stmt.kind === "if") {
    const cur = newR();
    const test = (stmt.test && stmt.test.trim().length) ? stmt.test.trim() : "T";

    const thenEntry = compileSeq(stmt.then, next, defs);
    const elseEntry = compileSeq(stmt.els, next, defs);

    defs.push(`${cur} def (se ${test} então ${thenEntry} senão ${elseEntry})`);
    return cur;
  }

  // WHILE: enquanto T faça BODY
  if (stmt.kind === "while") {
    const loop = newR();
    const test = (stmt.test && stmt.test.trim().length) ? stmt.test.trim() : "T";

    const bodyEntry = compileSeq(stmt.body, loop, defs);

    defs.push(`${loop} def (se ${test} então ${bodyEntry} senão ${next})`);
    return loop;
  }

  // UNTIL: até T faça BODY  
  if (stmt.kind === "until") {
    const loop = newR();
    const check = newR();
    const test = (stmt.test && stmt.test.trim().length) ? stmt.test.trim() : "T";

    const bodyEntry = compileSeq(stmt.body, check, defs);

    defs.push(`${check} def (se ${test} então ${next} senão ${loop})`);
    defs.push(`${loop} def ${bodyEntry}`);

    return loop;
  }

  return next;
}

function gerarTraducaoIterRec() {
  rCounter = 1;

  const root = document.getElementById("programRoot");
  const stmts = parseContainer(root);

  if (!stmts || stmts.length === 0) {
    document.getElementById("output").innerText = "Adiciona pelo menos 1 instrução.";
    return;
  }

  const defs = [];
  const start = compileSeq(stmts, "✓", defs);

  let out = `P é ${start} onde\n`;

  out += defs.join(",\n");

  document.getElementById("output").innerText = out;
}