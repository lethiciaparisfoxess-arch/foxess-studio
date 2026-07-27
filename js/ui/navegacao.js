// =====================================================
// FOXESS STUDIO
// Navegação entre telas da interface
// =====================================================

import {
    definirAplicacoesSelecionadas,
    definirAplicacao,
    definirTipoCliente
} from "../store.js";

import {
    aviso,
    MSG
} from "./mensagens.js";

import {
    navegarPara
} from "../router.js";

import {
    adicionarCarga
} from "./tabela.js";


// =====================================================
// IDs DAS TELAS
// =====================================================

const TELAS = {

    INICIO:
        "telaInicio",

    CLIENTE:
        "telaCliente",

    APLICACOES_RESIDENCIAIS:
        "telaAplicacao",

    BACKUP_RESIDENCIAL:
        "telaBackup",

    ZERO_GRID_RESIDENCIAL:
        "telaZeroGridResidencial",

    APLICACOES_CI:
        "telaAplicacaoCI",

    BACKUP_CI:
        "telaBackupCI",

    ZERO_GRID_CI:
        "telaZeroGridCI"

};


// =====================================================
// CLASSES DE BACKGROUND
// =====================================================

const FUNDOS = {

    HOME:
        "bg-home",

    RESIDENCIAL:
        "bg-residencial",

    BACKUP:
        "bg-backup",
    
    BACKUP_CI:
    "bg-backup-ci"

};


// =====================================================
// INICIALIZAÇÃO
// =====================================================

export function iniciarNavegacao() {

    alterarBackground(
        FUNDOS.HOME
    );


    navegarPara(
        TELAS.INICIO
    );

}


// =====================================================
// TELA INICIAL
// =====================================================

export function abrirProjeto() {

    /*
     * A seleção de cliente continua com o fundo
     * institucional da tela inicial.
     */
    alterarBackground(
        FUNDOS.HOME
    );


    navegarPara(
        TELAS.CLIENTE
    );

}


export function voltarInicio() {

    alterarBackground(
        FUNDOS.HOME
    );


    navegarPara(
        TELAS.INICIO
    );

}


// =====================================================
// SELEÇÃO DE CLIENTE
// =====================================================

export function abrirResidencial() {

    definirTipoCliente(
        "residencial"
    );


    alterarBackground(
        FUNDOS.RESIDENCIAL
    );


    navegarPara(
        TELAS.APLICACOES_RESIDENCIAIS
    );

}


export function abrirCI() {

    definirTipoCliente(
        "ci"
    );

    alterarBackground(
        FUNDOS.BACKUP_CI
    );

    navegarPara(
        TELAS.APLICACOES_CI
    );

}


export function voltarCliente() {

    limparSelecaoAplicacoesResidenciais();


    alterarBackground(
        FUNDOS.HOME
    );


    navegarPara(
        TELAS.CLIENTE
    );

}


// =====================================================
// APLICAÇÕES RESIDENCIAIS
// =====================================================

export function continuarAplicacao() {

    definirAplicacoesSelecionadas(["backup"]);

    definirAplicacao("backup");

    abrirBackupResidencial();

}

// =====================================================
// BACKUP RESIDENCIAL
// =====================================================

export function abrirBackupResidencial() {

    definirAplicacao(
        "backup"
    );


    alterarBackground(
        FUNDOS.BACKUP
    );


    navegarPara(
        TELAS.BACKUP_RESIDENCIAL
    );

}


export function abrirBackup() {

    abrirBackupResidencial();

}


export function voltarAplicacao() {

    alterarBackground(
        FUNDOS.RESIDENCIAL
    );


    navegarPara(
        TELAS.APLICACOES_RESIDENCIAIS
    );

}


export function voltarParaAplicacoesResidenciais() {

    voltarAplicacao();

}


// =====================================================
// ZERO GRID RESIDENCIAL
// =====================================================

export function abrirZeroGridResidencial() {

    definirAplicacao(
        "zero-grid"
    );


    alterarBackground(
        FUNDOS.RESIDENCIAL
    );


    const abriuTela =
        navegarPara(
            TELAS.ZERO_GRID_RESIDENCIAL
        );


    if (!abriuTela) {

        aviso(
            MSG.APLICACAO_NAO_IMPLEMENTADA
        );

    }

}


export function voltarDoZeroGridResidencial() {

    alterarBackground(
        FUNDOS.RESIDENCIAL
    );


    navegarPara(
        TELAS.APLICACOES_RESIDENCIAIS
    );

}


// =====================================================
// C&I
// =====================================================

export function voltarAplicacaoCI() {

    definirTipoCliente(
        "ci"
    );

    alterarBackground(
        FUNDOS.RESIDENCIAL
    );

    navegarPara(
        TELAS.APLICACOES_CI
    );

}


export function abrirBackupCI() {

    definirAplicacao("backup");

    alterarBackground(
        FUNDOS.BACKUP_CI
    );

    const abriuTela =
        navegarPara(TELAS.BACKUP_CI);

    if (!abriuTela) {

        aviso(MSG.APLICACAO_NAO_IMPLEMENTADA);
        return;

    }

    adicionarCarga();

}


export function abrirZeroGridCI() {

    definirAplicacao(
        "zero-grid"
    );


    const abriuTela =
        navegarPara(
            TELAS.ZERO_GRID_CI
        );


    if (!abriuTela) {

        aviso(
            MSG.APLICACAO_NAO_IMPLEMENTADA
        );

    }

}


// =====================================================
// REINÍCIO DO FLUXO
// =====================================================

export function reiniciarNavegacao() {

    limparSelecaoAplicacoesResidenciais();


    alterarBackground(
        FUNDOS.HOME
    );


    navegarPara(
        TELAS.INICIO
    );

}


// =====================================================
// CONSULTA DAS TELAS
// =====================================================

export function obterTelasNavegacao() {

    return {
        ...TELAS
    };

}


// =====================================================
// TROCA DO BACKGROUND
// =====================================================

function alterarBackground(
    classeBackground
) {

    document.body.classList.remove(
    FUNDOS.HOME,
    FUNDOS.RESIDENCIAL,
    FUNDOS.BACKUP,
    FUNDOS.BACKUP_CI
    );


    document.body.classList.add(
        classeBackground
    );

}


// =====================================================
// FUNÇÕES INTERNAS
// =====================================================

function limparSelecaoAplicacoesResidenciais() {

    const backupCheck =
        document.getElementById(
            "backupCheck"
        );


    const zeroGridCheck =
        document.getElementById(
            "zeroGridCheck"
        );


    if (backupCheck) {

        backupCheck.checked = false;

    }


    if (zeroGridCheck) {

        zeroGridCheck.checked = false;

    }


    definirAplicacoesSelecionadas(
        []
    );

}