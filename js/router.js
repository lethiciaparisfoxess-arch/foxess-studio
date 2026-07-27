// =====================================================
// FOXESS STUDIO
// Controle de navegação entre telas
// =====================================================

import {
    definirTelaAtual,
    obterValor
} from "./store.js";


// =====================================================
// CONFIGURAÇÃO DAS TELAS
// =====================================================

const TELAS = {

    INICIO: "telaInicio",

    CLIENTE: "telaCliente",

    APLICACAO_RESIDENCIAL: "telaAplicacao",

    BACKUP_RESIDENCIAL: "telaBackup",

    ZERO_GRID_RESIDENCIAL: "telaZeroGridResidencial",

    APLICACAO_CI: "telaAplicacaoCI",

    BACKUP_CI: "telaBackupCI",

    ZERO_GRID_CI: "telaZeroGridCI"

};


// =====================================================
// TELA INICIAL DO SISTEMA
// =====================================================

const TELA_INICIAL = TELAS.INICIO;


// =====================================================
// FUNÇÃO PRINCIPAL DE NAVEGAÇÃO
// =====================================================

/**
 * Esconde todas as telas e exibe somente a tela informada.
 *
 * @param {string} idTela ID da tela a ser exibida.
 */
export function navegarPara(idTela) {

    if (!idTela || typeof idTela !== "string") {

        console.error(
            "O ID da tela informado é inválido."
        );

        return false;

    }


    const telaDestino =
        document.getElementById(idTela);


    if (!telaDestino) {

        console.error(
            `A tela "${idTela}" não foi encontrada no HTML.`
        );

        return false;

    }


    esconderTodasAsTelas();


    telaDestino.classList.remove("escondido");

    telaDestino.style.display = obterDisplayDaTela(
        telaDestino
    );


    definirTelaAtual(idTela);


    voltarAoTopo();


    return true;

}


// =====================================================
// INICIALIZAÇÃO DO ROUTER
// =====================================================

/**
 * Garante que apenas a tela inicial fique visível
 * quando o sistema for carregado.
 */
export function iniciarRouter() {

    const telaSalva = obterValor("telaAtual");


    const telaInicialValida =
        telaSalva &&
        document.getElementById(telaSalva);


    if (telaInicialValida) {

        navegarPara(telaSalva);

        return;

    }


    navegarPara(TELA_INICIAL);

}


// =====================================================
// CONSULTA DA TELA ATUAL
// =====================================================

export function obterTelaAtual() {

    return obterValor("telaAtual");

}


// =====================================================
// VERIFICAÇÃO DE TELA
// =====================================================

export function estaNaTela(idTela) {

    return obterTelaAtual() === idTela;

}


// =====================================================
// NAVEGAÇÃO PRINCIPAL
// =====================================================

export function abrirInicio() {

    navegarPara(TELAS.INICIO);

}


export function abrirSelecaoCliente() {

    navegarPara(TELAS.CLIENTE);

}


// =====================================================
// RESIDENCIAL
// =====================================================

export function abrirAplicacoesResidenciais() {

    navegarPara(
        TELAS.APLICACAO_RESIDENCIAL
    );

}


export function abrirBackupResidencial() {

    navegarPara(
        TELAS.BACKUP_RESIDENCIAL
    );

}


export function abrirZeroGridResidencial() {

    navegarPara(
        TELAS.ZERO_GRID_RESIDENCIAL
    );

}


// =====================================================
// COMERCIAL E INDUSTRIAL — C&I
// =====================================================

export function abrirAplicacoesCI() {

    navegarPara(
        TELAS.APLICACAO_CI
    );

}


export function abrirBackupCI() {

    navegarPara(
        TELAS.BACKUP_CI
    );

}


export function abrirZeroGridCI() {

    navegarPara(
        TELAS.ZERO_GRID_CI
    );

}


// =====================================================
// FUNÇÕES DE VOLTAR
// =====================================================

export function voltarParaInicio() {

    abrirInicio();

}


export function voltarParaSelecaoCliente() {

    abrirSelecaoCliente();

}


export function voltarParaAplicacoesResidenciais() {

    abrirAplicacoesResidenciais();

}


export function voltarParaAplicacoesCI() {

    abrirAplicacoesCI();

}


// =====================================================
// TELAS DISPONÍVEIS
// =====================================================

/**
 * Permite acessar os IDs das telas sem repetir
 * textos em outros arquivos.
 *
 * Exemplo:
 *
 * importar:
 * import { obterTelas } from "./router.js";
 *
 * utilizar:
 * const telas = obterTelas();
 */
export function obterTelas() {

    return {
        ...TELAS
    };

}


// =====================================================
// FUNÇÕES INTERNAS
// =====================================================

function esconderTodasAsTelas() {

    const telas =
        document.querySelectorAll(".container");


    telas.forEach(tela => {

        tela.classList.add("escondido");

        tela.style.display = "none";

    });

}


/**
 * As telas atuais utilizam display flex.
 *
 * A função também permite definir futuramente outro
 * tipo de display pelo atributo:
 *
 * data-display="block"
 */
function obterDisplayDaTela(tela) {

    return tela.dataset.display || "flex";

}


function voltarAoTopo() {

    window.scrollTo({

        top: 0,

        left: 0,

        behavior: "auto"

    });

}