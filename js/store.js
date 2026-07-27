// =====================================================
// FOXESS STUDIO
// Estado central da aplicação
// =====================================================


// =====================================================
// ESTADO INICIAL
// =====================================================

const estadoInicial = {

    // Cliente selecionado:
    // "residencial" ou "ci"
    tipoCliente: null,

    // Aplicação selecionada:
    // "backup", "zero-grid" ou outra futura aplicação
    aplicacao: null,

    // Aplicações marcadas na tela de seleção
    aplicacoesSelecionadas: [],

    // Tipo de solução:
    // "inversor" ou "aio"
    tipoSolucao: "inversor",

    // Padrão elétrico selecionado
    padraoEntrada: null,

    // Autonomia solicitada em horas
    autonomia: 0,

    // Lista de cargas preenchidas pelo usuário
    cargas: [],

    // Dados calculados com base nas cargas
    calculoCargas: {

        potenciaTotalW: 0,

        potenciaPicoW: 0,

        energiaNecessariaKWh: 0,

        tensoes: []

    },

    // Resultado final do dimensionamento
    resultado: null,

    // Controle da navegação
    telaAtual: "telaInicio",

    // Controle geral da aplicação
    carregando: false,

    erro: null

};


// =====================================================
// ESTADO ATUAL
// =====================================================

let estado = criarCopiaProfunda(estadoInicial);


// =====================================================
// OBSERVADORES
// =====================================================

// Funções que serão notificadas quando o estado mudar
const observadores = new Set();


// =====================================================
// CONSULTA DO ESTADO
// =====================================================

/**
 * Retorna uma cópia do estado atual.
 *
 * Isso evita que outros arquivos alterem o estado
 * diretamente sem utilizar as funções do Store.
 */
export function obterEstado() {

    return criarCopiaProfunda(estado);

}


/**
 * Retorna apenas uma propriedade do estado.
 *
 * Exemplo:
 * obterValor("autonomia")
 */
export function obterValor(chave) {

    if (!(chave in estado)) {

        console.warn(
            `A propriedade "${chave}" não existe no Store.`
        );

        return undefined;

    }

    return criarCopiaProfunda(estado[chave]);

}


// =====================================================
// ALTERAÇÃO DO ESTADO
// =====================================================

/**
 * Atualiza uma ou mais propriedades do estado.
 *
 * Exemplo:
 *
 * atualizarEstado({
 *     autonomia: 2,
 *     tipoSolucao: "inversor"
 * });
 */
export function atualizarEstado(novosDados) {

    if (
        !novosDados ||
        typeof novosDados !== "object" ||
        Array.isArray(novosDados)
    ) {

        throw new TypeError(
            "Os novos dados do Store precisam ser um objeto."
        );

    }


    estado = {

        ...estado,

        ...criarCopiaProfunda(novosDados)

    };


    notificarObservadores();

}


/**
 * Atualiza apenas uma propriedade.
 *
 * Exemplo:
 * definirValor("autonomia", 3)
 */
export function definirValor(chave, valor) {

    if (!(chave in estado)) {

        throw new Error(
            `A propriedade "${chave}" não existe no Store.`
        );

    }


    estado = {

        ...estado,

        [chave]: criarCopiaProfunda(valor)

    };


    notificarObservadores();

}


// =====================================================
// CLIENTE E APLICAÇÃO
// =====================================================

export function definirTipoCliente(tipoCliente) {

    const tiposPermitidos = [
        "residencial",
        "ci"
    ];


    if (!tiposPermitidos.includes(tipoCliente)) {

        throw new Error(
            `Tipo de cliente inválido: "${tipoCliente}".`
        );

    }


    atualizarEstado({

        tipoCliente,

        aplicacao: null,

        aplicacoesSelecionadas: [],

        resultado: null

    });

}


export function definirAplicacao(aplicacao) {

    const aplicacoesPermitidas = [
        "backup",
        "zero-grid"
    ];


    if (!aplicacoesPermitidas.includes(aplicacao)) {

        throw new Error(
            `Aplicação inválida: "${aplicacao}".`
        );

    }


    atualizarEstado({

        aplicacao,

        resultado: null

    });

}


export function definirAplicacoesSelecionadas(aplicacoes) {

    if (!Array.isArray(aplicacoes)) {

        throw new TypeError(
            "As aplicações selecionadas precisam ser uma lista."
        );

    }


    atualizarEstado({

        aplicacoesSelecionadas: [...aplicacoes]

    });

}


// =====================================================
// DADOS DO PROJETO
// =====================================================

export function definirTipoSolucao(tipoSolucao) {

    const tiposPermitidos = [
        "inversor",
        "aio"
    ];


    if (!tiposPermitidos.includes(tipoSolucao)) {

        throw new Error(
            `Tipo de solução inválido: "${tipoSolucao}".`
        );

    }


    atualizarEstado({

        tipoSolucao,

        resultado: null

    });

}


export function definirPadraoEntrada(padraoEntrada) {

    atualizarEstado({

        padraoEntrada: String(padraoEntrada || "").trim(),

        resultado: null

    });

}


export function definirAutonomia(autonomia) {

    const valor = Number(autonomia);


    if (!Number.isFinite(valor) || valor < 0) {

        throw new Error(
            "A autonomia precisa ser um número maior ou igual a zero."
        );

    }


    atualizarEstado({

        autonomia: valor,

        resultado: null

    });

}


// =====================================================
// CARGAS
// =====================================================

export function definirCargas(cargas) {

    if (!Array.isArray(cargas)) {

        throw new TypeError(
            "As cargas precisam ser fornecidas em uma lista."
        );

    }


    atualizarEstado({

        cargas,

        resultado: null

    });

}


export function adicionarCargaAoEstado(carga) {

    validarCarga(carga);


    estado = {

        ...estado,

        cargas: [

            ...estado.cargas,

            criarCopiaProfunda(carga)

        ],

        resultado: null

    };


    notificarObservadores();

}


export function atualizarCargaDoEstado(indice, novosDados) {

    if (
        !Number.isInteger(indice) ||
        indice < 0 ||
        indice >= estado.cargas.length
    ) {

        throw new Error(
            "Índice de carga inválido."
        );

    }


    const cargasAtualizadas = [...estado.cargas];


    cargasAtualizadas[indice] = {

        ...cargasAtualizadas[indice],

        ...criarCopiaProfunda(novosDados)

    };


    estado = {

        ...estado,

        cargas: cargasAtualizadas,

        resultado: null

    };


    notificarObservadores();

}


export function removerCargaDoEstado(indice) {

    if (
        !Number.isInteger(indice) ||
        indice < 0 ||
        indice >= estado.cargas.length
    ) {

        return;

    }


    const cargasAtualizadas =
        estado.cargas.filter(
            (_, posicao) => posicao !== indice
        );


    estado = {

        ...estado,

        cargas: cargasAtualizadas,

        resultado: null

    };


    notificarObservadores();

}


export function limparCargas() {

    atualizarEstado({

        cargas: [],

        calculoCargas: {

            potenciaTotalW: 0,

            potenciaPicoW: 0,

            energiaNecessariaKWh: 0,

            tensoes: []

        },

        resultado: null

    });

}


// =====================================================
// RESULTADOS DOS CÁLCULOS
// =====================================================

export function definirCalculoCargas(calculo) {

    if (
        !calculo ||
        typeof calculo !== "object" ||
        Array.isArray(calculo)
    ) {

        throw new TypeError(
            "O cálculo das cargas precisa ser um objeto."
        );

    }


    atualizarEstado({

        calculoCargas: {

            ...estado.calculoCargas,

            ...criarCopiaProfunda(calculo)

        }

    });

}


export function definirResultado(resultado) {

    atualizarEstado({

        resultado: criarCopiaProfunda(resultado),

        erro: null

    });

}


export function limparResultado() {

    atualizarEstado({

        resultado: null

    });

}


// =====================================================
// NAVEGAÇÃO
// =====================================================

export function definirTelaAtual(idTela) {

    atualizarEstado({

        telaAtual: idTela

    });

}


// =====================================================
// CARREGAMENTO E ERROS
// =====================================================

export function definirCarregando(carregando) {

    atualizarEstado({

        carregando: Boolean(carregando)

    });

}


export function definirErro(erro) {

    atualizarEstado({

        erro: erro
            ? String(erro.message || erro)
            : null,

        carregando: false

    });

}


export function limparErro() {

    atualizarEstado({

        erro: null

    });

}


// =====================================================
// REINICIALIZAÇÃO
// =====================================================

/**
 * Limpa o projeto atual e volta ao estado inicial.
 */
export function reiniciarProjeto() {

    estado = criarCopiaProfunda(estadoInicial);

    notificarObservadores();

}


/**
 * Limpa apenas os dados de dimensionamento,
 * mantendo o tipo de cliente selecionado.
 */
export function limparDimensionamento() {

    estado = {

        ...estado,

        aplicacao: null,

        aplicacoesSelecionadas: [],

        tipoSolucao: "inversor",

        padraoEntrada: null,

        autonomia: 0,

        cargas: [],

        calculoCargas: {

            potenciaTotalW: 0,

            potenciaPicoW: 0,

            energiaNecessariaKWh: 0,

            tensoes: []

        },

        resultado: null,

        erro: null

    };


    notificarObservadores();

}


// =====================================================
// INSCRIÇÃO EM ALTERAÇÕES
// =====================================================

/**
 * Permite que outros módulos acompanhem mudanças.
 *
 * Exemplo:
 *
 * const cancelar = observarEstado(novoEstado => {
 *     console.log(novoEstado);
 * });
 *
 * cancelar();
 */
export function observarEstado(funcao) {

    if (typeof funcao !== "function") {

        throw new TypeError(
            "O observador do Store precisa ser uma função."
        );

    }


    observadores.add(funcao);


    return function cancelarObservacao() {

        observadores.delete(funcao);

    };

}


// =====================================================
// FUNÇÕES INTERNAS
// =====================================================

function notificarObservadores() {

    const copiaEstado = obterEstado();


    observadores.forEach(funcao => {

        try {

            funcao(copiaEstado);

        } catch (erro) {

            console.error(
                "Erro ao executar observador do Store:",
                erro
            );

        }

    });

}


function validarCarga(carga) {

    if (
        !carga ||
        typeof carga !== "object" ||
        Array.isArray(carga)
    ) {

        throw new TypeError(
            "A carga precisa ser um objeto."
        );

    }

}


function criarCopiaProfunda(valor) {

    if (valor === undefined) {

        return undefined;

    }


    return structuredClone(valor);

}