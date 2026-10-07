const API_URL = 'http://localhost:8000';


/* ============================================================
   CONFIGURAÇÃO DAS TABELAS
============================================================ */

const TABELAS_CONFIG = {

    Shrimp: {
        nome: 'Shrimp',
        api: 'shrimp',
        icone: '🦐',
        descricao: 'Dados biométricos de camarão'
    },

    Bycatch: {
        nome: 'Bycatch',
        api: 'bycatch',
        icone: '🐟',
        descricao: 'Fauna acompanhante capturada'
    },

    ParametrosCaptura: {
        nome: 'Parâmetros de Captura',
        api: 'parametros-captura',
        icone: '🎣',
        descricao: 'Esforço e biomassa por arrasto'
    },

    ParametrosAbioticos: {
        nome: 'Parâmetros Abióticos',
        api: 'parametros-abioticos',
        icone: '🌡️',
        descricao: 'Temperatura, salinidade, pH e outros'
    },

    Captura_MPA: {
        nome: 'Captura MPA',
        api: 'captura-mpa',
        icone: '📊',
        descricao: 'Capturas por espécie e região'
    },

    Historia_vida_shrimp: {
        nome: 'História de Vida — Shrimp',
        api: 'historia-vida-shrimp',
        icone: '📈',
        descricao: 'Parâmetros de história de vida'
    },

    Historia_vida_bycatch: {
        nome: 'História de Vida — Bycatch',
        api: 'historia-vida-bycatch',
        icone: '📉',
        descricao: 'História de vida da fauna acompanhante'
    }

};


/* ============================================================
   ESTADO DA APLICAÇÃO
============================================================ */

let tabelaSelecionada = null;

let configuracaoColunas = {
    colunas_valor: [],
    colunas_numericas: [],
    colunas_grupo: []
};

let colunaGrupoSelecionada = null;

let valoresGruposDisponiveis = [];

let ultimoResultado = null;


/* ============================================================
   RENDERIZAR TABELAS
============================================================ */

function renderizarTabelas() {

    const container =
        document.getElementById('tabelas-grid');

    container.innerHTML = '';

    Object.entries(TABELAS_CONFIG).forEach(
        ([chave, config]) => {

            const card =
                document.createElement('div');

            card.className = 'tabela-card';

            if (tabelaSelecionada === chave) {
                card.classList.add('selected');
            }

            card.innerHTML = `
                <div class="tabela-icon">
                    ${config.icone}
                </div>

                <div class="tabela-nome">
                    ${config.nome}
                </div>

                <div class="tabela-desc">
                    ${config.descricao}
                </div>
            `;

            card.onclick = () =>
                selecionarTabela(chave);

            container.appendChild(card);
        }
    );
}


/* ============================================================
   SELECIONAR TABELA
============================================================ */

async function selecionarTabela(tabela) {

    tabelaSelecionada = tabela;

    colunaGrupoSelecionada = null;
    valoresGruposDisponiveis = [];
    ultimoResultado = null;

    document
        .getElementById('resultado')
        .classList.add('hidden');

    limparErro();

    renderizarTabelas();

    const config =
        TABELAS_CONFIG[tabela];

    try {

        const resposta = await fetch(
            `${API_URL}/comparacao/colunas/${encodeURIComponent(config.api)}`
        );

        if (!resposta.ok) {
            throw new Error(
                `HTTP ${resposta.status}`
            );
        }

        const dados =
            await resposta.json();

        if (dados.erro) {
            mostrarErro(dados.erro);
            return;
        }

        configuracaoColunas = dados;

        renderizarColunas();

        mostrarEtapa(2);

    } catch (erro) {

        mostrarErro(
            'Não foi possível carregar as colunas da tabela.'
        );

        console.error(erro);
    }
}


/* ============================================================
   RENDERIZAR VARIÁVEIS
============================================================ */

function renderizarColunas() {

    const valorContainer =
        document.getElementById('colunas-valor');

    const grupoContainer =
        document.getElementById('colunas-grupo');

    valorContainer.innerHTML = '';
    grupoContainer.innerHTML = '';


    /* ========================================================
       VARIÁVEIS DE VALOR
    ======================================================== */

    configuracaoColunas.colunas_valor.forEach(
        coluna => {

            const item =
                document.createElement('label');

            item.className = 'coluna-item';

            const ehNumerica =
                configuracaoColunas
                    .colunas_numericas
                    .includes(coluna);

            item.innerHTML = `
                <input
                    type="checkbox"
                    value="${escaparHTML(coluna)}"
                    data-tipo="valor">

                <span>
                    ${escaparHTML(coluna)}
                    ${ehNumerica
                        ? ''
                        : ' <small style="color:#90a4ae;">(texto)</small>'
                    }
                </span>
            `;

            valorContainer.appendChild(item);
        }
    );


    /* ========================================================
       AGRUPADORES
    ======================================================== */

    configuracaoColunas.colunas_grupo.forEach(
        coluna => {

            const item =
                document.createElement('label');

            item.className = 'coluna-item';

            item.innerHTML = `
                <input
                    type="radio"
                    name="coluna-grupo"
                    value="${escaparHTML(coluna)}">

                <span>
                    ${escaparHTML(coluna)}
                </span>
            `;

            grupoContainer.appendChild(item);
        }
    );
}


/* ============================================================
   OBTER VARIÁVEIS SELECIONADAS
============================================================ */

function obterVariaveisSelecionadas() {

    return [
        ...document.querySelectorAll(
            '#colunas-valor input:checked'
        )
    ].map(input => input.value);
}


/* ============================================================
   OBTER AGRUPADOR
============================================================ */

function obterColunaGrupo() {

    const selecionado =
        document.querySelector(
            '#colunas-grupo input:checked'
        );

    return selecionado
        ? selecionado.value
        : null;
}


/* ============================================================
   IR PARA ETAPA 3
============================================================ */

async function irParaGrupos() {

    limparErro();

    const valores =
        obterVariaveisSelecionadas();

    const grupo =
        obterColunaGrupo();


    /* --------------------------------------------------------
       Validação das variáveis
    -------------------------------------------------------- */

    if (valores.length === 0) {

        mostrarErro(
            'Selecione pelo menos uma variável para comparar.'
        );

        return;
    }


    /* --------------------------------------------------------
       Validação do agrupador
    -------------------------------------------------------- */

    if (!grupo) {

        mostrarErro(
            'Selecione uma variável para agrupar os dados.'
        );

        return;
    }


    colunaGrupoSelecionada = grupo;


    /* --------------------------------------------------------
       Carregar valores disponíveis
    -------------------------------------------------------- */

    const config =
        TABELAS_CONFIG[tabelaSelecionada];

    const container =
        document.getElementById(
            'grupos-container'
        );

    container.innerHTML = `
        <div class="loading">
            ⏳ Carregando grupos disponíveis...
        </div>
    `;

    mostrarEtapa(3);


    try {

        const resposta = await fetch(
            `${API_URL}/comparacao/valores/` +
            `${encodeURIComponent(config.api)}/` +
            `${encodeURIComponent(grupo)}`
        );

        if (!resposta.ok) {
            throw new Error(
                `HTTP ${resposta.status}`
            );
        }

        const dados =
            await resposta.json();

        if (dados.erro) {

            mostrarErro(dados.erro);

            container.innerHTML = '';

            return;
        }

        valoresGruposDisponiveis =
            dados.valores || [];

        renderizarGrupos();

    } catch (erro) {

        container.innerHTML = '';

        mostrarErro(
            'Não foi possível carregar os valores do agrupador.'
        );

        console.error(erro);
    }
}


/* ============================================================
   RENDERIZAR GRUPOS
============================================================ */

function renderizarGrupos() {

    const container =
        document.getElementById(
            'grupos-container'
        );

    container.innerHTML = '';


    if (
        !valoresGruposDisponiveis ||
        valoresGruposDisponiveis.length === 0
    ) {

        container.innerHTML = `
            <div class="vazio">
                Nenhum valor disponível para este agrupador.
            </div>
        `;

        return;
    }


    valoresGruposDisponiveis.forEach(
        valor => {

            const valorTexto =
                String(valor);

            const item =
                document.createElement('label');

            item.className = 'coluna-item';

            item.innerHTML = `
                <input
                    type="checkbox"
                    value="${escaparHTML(valorTexto)}"
                    data-tipo="grupo">

                <span>
                    ${escaparHTML(valorTexto)}
                </span>
            `;

            container.appendChild(item);
        }
    );
}


/* ============================================================
   OBTER GRUPOS SELECIONADOS
============================================================ */

function obterGruposSelecionados() {

    return [
        ...document.querySelectorAll(
            '#grupos-container input:checked'
        )
    ].map(input => input.value);
}


/* ============================================================
   EXECUTAR COMPARAÇÃO
============================================================ */

async function executarComparacao() {

    limparErro();

    const valores =
        obterVariaveisSelecionadas();

    const grupo =
        obterColunaGrupo();

    const grupos =
        obterGruposSelecionados();

    const modo =
        document.querySelector(
            'input[name="modo"]:checked'
        ).value;


    /* --------------------------------------------------------
       Validações
    -------------------------------------------------------- */

    if (valores.length === 0) {

        mostrarErro(
            'Selecione pelo menos uma variável para comparar.'
        );

        mostrarEtapa(2);

        return;
    }


    if (!grupo) {

        mostrarErro(
            'Selecione uma variável para agrupar os dados.'
        );

        mostrarEtapa(2);

        return;
    }


    if (grupos.length === 0) {

        mostrarErro(
            'Selecione pelo menos um grupo para comparar.'
        );

        return;
    }


    /* --------------------------------------------------------
       Corpo enviado para o FastAPI
    -------------------------------------------------------- */

    const config =
        TABELAS_CONFIG[tabelaSelecionada];

    const body = {

        tabela: config.api,

        colunas_valor: valores,

        coluna_grupo: grupo,

        grupos: grupos,

        modo: modo,

        limit: 10000

    };


    /* --------------------------------------------------------
       Interface
    -------------------------------------------------------- */

    document
        .getElementById('resultado')
        .classList.remove('hidden');

    document
        .getElementById('resultado-loading')
        .classList.remove('hidden');

    document
        .getElementById('resultado-tabela')
        .innerHTML = '';

    document
        .getElementById('resultado-info')
        .textContent =
            'Consultando banco de dados...';


    try {

        const resposta = await fetch(
            `${API_URL}/comparacao/`,
            {
                method: 'POST',

                headers: {
                    'Content-Type':
                        'application/json'
                },

                body: JSON.stringify(body)
            }
        );


        if (!resposta.ok) {

            throw new Error(
                `HTTP ${resposta.status}`
            );
        }


        const resultado =
            await resposta.json();


        document
            .getElementById('resultado-loading')
            .classList.add('hidden');


        if (resultado.erro) {

            mostrarErro(
                resultado.erro
            );

            return;
        }


        ultimoResultado =
            resultado;


        renderizarResultado(
            resultado
        );

        mostrarEtapa(4);


    } catch (erro) {

        document
            .getElementById('resultado-loading')
            .classList.add('hidden');

        mostrarErro(
            'Erro ao realizar a comparação.'
        );

        console.error(erro);
    }
}


/* ============================================================
   RENDERIZAR RESULTADO
============================================================ */

function renderizarResultado(resultado) {

    const container =
        document.getElementById(
            'resultado-tabela'
        );

    const info =
        document.getElementById(
            'resultado-info'
        );


    const tabela =
        TABELAS_CONFIG[
            tabelaSelecionada
        ];


    if (resultado.modo === 'linhas') {

        info.textContent =
            `${resultado.total_linhas || 0} linha(s) comparativa(s) — ` +
            `agrupador: ${resultado.agrupador}`;

        renderizarLinhas(
            resultado.dados,
            container
        );

        return;
    }


    if (resultado.modo === 'agrupado') {

        info.textContent =
            `${resultado.total_grupos || 0} grupo(s) encontrado(s) — ` +
            `agrupador: ${resultado.agrupador}`;

        renderizarAgrupado(
            resultado,
            container
        );

        return;
    }


    info.textContent =
        `Resultado — ${tabela.nome}`;

    renderizarLinhas(
        resultado.dados,
        container
    );
}


/* ============================================================
   RENDERIZAR MODO LINHAS
============================================================ */

function renderizarLinhas(
    dados,
    container
) {

    if (
        !dados ||
        dados.length === 0
    ) {

        container.innerHTML = `
            <div class="vazio">
                Nenhum resultado encontrado.
            </div>
        `;

        return;
    }


    const colunas =
        Object.keys(dados[0]);


    let html = '<table>';

    html += '<thead><tr>';


    colunas.forEach(
        coluna => {

            html += `
                <th>
                    ${escaparHTML(
                        coluna
                    )}
                </th>
            `;
        }
    );


    html += '</tr></thead>';

    html += '<tbody>';


    dados.forEach(
        linha => {

            html += '<tr>';


            colunas.forEach(
                coluna => {

                    const valor =
                        linha[coluna];


                    html += `
                        <td>
                            ${formatarNumero(
                                valor
                            )}
                        </td>
                    `;
                }
            );


            html += '</tr>';
        }
    );


    html += '</tbody></table>';

    container.innerHTML = html;
}


/* ============================================================
   RENDERIZAR MODO AGRUPADO
============================================================ */

function renderizarAgrupado(
    resultado,
    container
) {

    const dados =
        resultado.dados || [];

    if (dados.length === 0) {

        container.innerHTML = `
            <div class="vazio">
                Nenhum resultado encontrado.
            </div>
        `;

        return;
    }


    const colunas =
        Object.keys(dados[0]);


    let html = '<table>';

    html += '<thead><tr>';


    colunas.forEach(
        coluna => {

            html += `
                <th>
                    ${escaparHTML(
                        coluna
                    )}
                </th>
            `;
        }
    );


    html += '</tr></thead>';

    html += '<tbody>';


    dados.forEach(
        linha => {

            html += '<tr>';


            colunas.forEach(
                coluna => {

                    html += `
                        <td>
                            ${formatarNumero(
                                linha[coluna]
                            )}
                        </td>
                    `;
                }
            );


            html += '</tr>';
        }
    );


    html += '</tbody></table>';

    container.innerHTML = html;
}


/* ============================================================
   FORMATAÇÃO DE NÚMEROS
============================================================ */

function formatarNumero(valor) {

    if (
        valor === null ||
        valor === undefined ||
        valor === ''
    ) {

        return '—';
    }


    if (
        typeof valor === 'number'
    ) {

        return Number.isInteger(valor)
            ? valor
            : valor.toLocaleString(
                'pt-BR',
                {
                    maximumFractionDigits: 4
                }
            );
    }


    return escaparHTML(
        String(valor)
    );
}


/* ============================================================
   ESCAPAR HTML
============================================================ */

function escaparHTML(valor) {

    return String(valor)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}


/* ============================================================
   ETAPAS
============================================================ */

function mostrarEtapa(numero) {

    const etapas = [
        'etapa1',
        'etapa2',
        'etapa3'
    ];


    etapas.forEach(
        id => {

            document
                .getElementById(id)
                .classList.add('hidden');
        }
    );


    if (numero <= 3) {

        document
            .getElementById(
                `etapa${numero}`
            )
            .classList.remove('hidden');
    }


    if (numero === 4) {

        document
            .getElementById('etapa3')
            .classList.remove('hidden');
    }


    for (
        let i = 1;
        i <= 4;
        i++
    ) {

        const step =
            document.getElementById(
                `step${i}`
            );

        step.classList.toggle(
            'active',
            i <= numero
        );
    }
}


/* ============================================================
   ERROS
============================================================ */

function mostrarErro(mensagem) {

    const container =
        document.getElementById(
            'erro-container'
        );

    container.textContent =
        mensagem;

    container.classList.remove(
        'hidden'
    );
}


function limparErro() {

    const container =
        document.getElementById(
            'erro-container'
        );

    container.classList.add(
        'hidden'
    );

    container.textContent = '';
}


/* ============================================================
   RESET
============================================================ */

function resetar() {

    tabelaSelecionada = null;

    configuracaoColunas = {
        colunas_valor: [],
        colunas_numericas: [],
        colunas_grupo: []
    };

    colunaGrupoSelecionada = null;

    valoresGruposDisponiveis = [];

    ultimoResultado = null;


    document
        .getElementById('resultado')
        .classList.add('hidden');


    document
        .getElementById('grupos-container')
        .innerHTML = '';


    limparErro();

    renderizarTabelas();

    mostrarEtapa(1);
}


/* ============================================================
   EXPORTAR CSV
============================================================ */

function exportarCSV() {

    if (
        !ultimoResultado ||
        !ultimoResultado.dados ||
        ultimoResultado.dados.length === 0
    ) {

        mostrarErro(
            'Não há resultado para exportar.'
        );

        return;
    }


    const dados =
        ultimoResultado.dados;


    const colunas =
        Object.keys(dados[0]);


    const linhas = [
        colunas.join(';')
    ];


    dados.forEach(
        linha => {

            linhas.push(
                colunas.map(
                    coluna => {

                        const valor =
                            linha[coluna] ?? '';

                        return `"${String(valor)
                            .replace(
                                /"/g,
                                '""'
                            )}"`;
                    }
                ).join(';')
            );
        }
    );


    const blob =
        new Blob(
            [
                '\ufeff' +
                linhas.join('\n')
            ],
            {
                type:
                    'text/csv;charset=utf-8;'
            }
        );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement('a');

    link.href = url;

    link.download =
        `comparacao_${tabelaSelecionada}.csv`;

    link.click();


    URL.revokeObjectURL(url);
}


/* ============================================================
   INICIALIZAÇÃO
============================================================ */

renderizarTabelas();

mostrarEtapa(1);