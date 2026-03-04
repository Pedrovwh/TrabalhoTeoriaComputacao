let contadorID = 1;

function addLinha(tipo) {
    const container = document.getElementById('containerLinhas');
    const div = document.createElement('div');
    div.className = 'linha-comando';
    div.dataset.tipo = tipo;

    let html = '';
    if (tipo === 'op') {
        html = `
                    <label class="label-instrucao">OPERAÇÃO</label>
                    R <input type="number" class="r-atual" value="${contadorID}">: 
                    faça <input type="text" class="funcao" placeholder="F"> 
                    vá_para R <input type="number" class="r-prox" value="${contadorID + 1}">
                `;
    } else {
        html = `
                    <span class="label-instrucao">TESTE</span>
                    R <input type="number" class="r-atual" value="${contadorID}">: 
                    se <input type="text" class="teste" placeholder="T"> 
                    então R <input type="number" class="r-sim" value="${contadorID + 1}"> 
                    senão R <input type="number" class="r-nao" value="${contadorID + 2}">
                `;
    }

    html += `<button class="btn-remover" onclick="this.parentElement.remove(); contadorID--;">remover</button>`;
    div.innerHTML = html;
    container.appendChild(div);
    contadorID++;
}

function gerarTraduçao() {
    const linhas = document.querySelectorAll('.linha-comando');
    const rInicio = document.getElementById('inputInicio').value;

    if (linhas.length === 0) {
        document.getElementById('output').innerText = "Adicione comandos primeiro.";
        return;
    }

    let resultado = `P é R${rInicio} onde\n`;
    let subrotinas = [];

    linhas.forEach(linha => {
        const rAtual = linha.querySelector('.r-atual').value;
        const tipo = linha.dataset.tipo;
        let definicao = `R${rAtual} def `;

        if (tipo === 'op') {
            const f = (linha.querySelector('.funcao').value || 'F').toUpperCase();
            const prox = linha.querySelector('.r-prox').value;
            definicao += `${f}; R${prox}`;
        } else {
            const t = (linha.querySelector('.teste').value || 'T').toUpperCase();
            const sim = linha.querySelector('.r-sim').value;
            const nao = linha.querySelector('.r-nao').value;
            definicao += `(se ${t} então R${sim} senão R${nao})`;
        }
        subrotinas.push(definicao);
    });

    document.getElementById('output').innerText = resultado + subrotinas.join(",\n");
}

addLinha('op');