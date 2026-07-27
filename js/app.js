// =====================================================
// FOXESS STUDIO
// Inicialização principal da aplicação
// =====================================================


// =====================================================
// BANCO DE PRODUTOS
// =====================================================

import {
    carregarDatabase
} from "./database.js";


// =====================================================
// NAVEGAÇÃO
// =====================================================

import {
    iniciarNavegacao,
    abrirProjeto,
    voltarInicio,
    abrirResidencial,
    abrirCI,
    voltarCliente,
    continuarAplicacao,
    abrirBackup,
    abrirBackupResidencial,
    voltarAplicacao,
    abrirZeroGridResidencial,
    voltarDoZeroGridResidencial,
    voltarAplicacaoCI,
    abrirBackupCI,
    abrirZeroGridCI,
    reiniciarNavegacao
} from "./ui/navegacao.js";


// =====================================================
// TABELA DE CARGAS
// =====================================================

import {
    iniciarTabelaCargas,
    adicionarCarga,
    excluirCarga,
    limparTabelaCargas
} from "./ui/tabela.js";


// =====================================================
// BACKUP RESIDENCIAL
// =====================================================

import {
    calcularBackupResidencial,
    limparFormularioBackupResidencial
} from "./aplicacoes/residencial/backup.js";

// =====================================================
// BACKUP C&I
// =====================================================

import {
    calcularBackupCI,
    limparFormularioBackupCI
} from "./aplicacoes/ci/backup.js";

// =====================================================
// RESULTADO
// =====================================================

import {
    exibirResultadoAguardando,
    limparResultado
} from "./ui/resultado.js";


// =====================================================
// MENSAGENS
// =====================================================

import {
    erro,
    log
} from "./ui/mensagens.js";


// =====================================================
// ESTADO DE INICIALIZAÇÃO
// =====================================================

let sistemaCarregado = false;


// =====================================================
// INICIALIZAÇÃO PRINCIPAL
// =====================================================
async function iniciarProjeto() {

    const lead = {

        nome:
            document.getElementById("leadNome").value.trim(),

        empresa:
            document.getElementById("leadEmpresa").value.trim(),

        email:
            document.getElementById("leadEmail").value.trim(),

        telefone:
            document.getElementById("leadTelefone").value.trim(),

        origem:
            document.getElementById("leadOrigem").value

    };

    if (
        !lead.nome ||
        !lead.empresa ||
        !lead.email ||
        !lead.telefone ||
        !lead.origem
    ) {

        alert(
            "Preencha todos os campos."
        );

        return;

    }

    try {

        await fetch(
            "/.netlify/functions/salvarLead",
            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body: JSON.stringify(lead)

            }
        );

        abrirProjeto();

    }

    catch {

        alert(
            "Erro ao registrar o acesso."
        );

    }

}

window.iniciarProjeto =
    iniciarProjeto;
    
async function iniciarFoxESSStudio() {

    try {

        log("Iniciando FoxESS Studio...");


        // Carrega produtos.json
        await carregarDatabase();


        // Configura a tela inicial
        iniciarNavegacao();


        // Garante que a tabela tenha pelo menos uma linha
        iniciarTabelaCargas();


        // Garante que a tabela tenha pelo menos uma linha
iniciarTabelaCargas();


// ===============================
// CONTROLE DA PERGUNTA TRIFÁSICA
// ===============================

const campoPadrao =
    document.getElementById("padraoEntrada");

const grupoCargaTrifasica =
    document.getElementById("grupoCargaTrifasica");

function atualizarPerguntaTrifasica() {

    const trifasico =
        campoPadrao.value
            .toLowerCase()
            .includes("trifásico");

    grupoCargaTrifasica.style.display =
        trifasico ? "block" : "none";

}

campoPadrao.addEventListener(
    "change",
    atualizarPerguntaTrifasica
);

// Executa uma vez ao abrir a tela
atualizarPerguntaTrifasica();


// Configura o estado inicial do painel direito
exibirResultadoAguardando();


        sistemaCarregado = true;


        log(
            "FoxESS Studio iniciado com sucesso."
        );

    } catch (erroInicializacao) {

        sistemaCarregado = false;


        console.error(
            "Erro ao iniciar o FoxESS Studio:",
            erroInicializacao
        );


        erro(
            "Não foi possível iniciar o FoxESS Studio. " +
            "Verifique o arquivo produtos.json e tente novamente."
        );

    }

}


// =====================================================
// CÁLCULO PROTEGIDO
// =====================================================

/**
 * Evita que o dimensionamento seja executado antes
 * do carregamento do banco de produtos.
 */
function calcularBackup() {

    if (!sistemaCarregado) {

        erro(
            "O banco de produtos ainda está carregando."
        );

        return;

    }


    calcularBackupResidencial();

}

function calcularBackupCIProtegido() {

    if (!sistemaCarregado) {

        erro(
            "O banco de produtos ainda está carregando."
        );

        return;

    }

    calcularBackupCI();

}

// =====================================================
// LIMPEZA DO BACKUP
// =====================================================

function limparBackupResidencial() {

    limparFormularioBackupResidencial();

    limparTabelaCargas();

    limparResultado();

}


// =====================================================
// FUNÇÕES DISPONÍVEIS PARA O HTML
// =====================================================

/**
 * O HTML atual utiliza onclick diretamente nos botões.
 *
 * Como o app.js é um módulo, precisamos disponibilizar
 * essas funções dentro de window.
 */
function registrarFuncoesGlobais() {

    // Navegação principal

    window.abrirProjeto =
        abrirProjeto;

    window.voltarInicio =
        voltarInicio;

    window.abrirResidencial =
        abrirResidencial;

    window.abrirCI =
        abrirCI;

    window.voltarCliente =
        voltarCliente;

    window.continuarAplicacao =
        continuarAplicacao;


    // Backup residencial

    window.abrirBackup =
        abrirBackup;

    window.abrirBackupResidencial =
        abrirBackupResidencial;

    window.voltarAplicacao =
        voltarAplicacao;

    window.calcularBackup =
        calcularBackup;

    window.limparBackupResidencial =
        limparBackupResidencial;


    // Tabela de cargas

    window.adicionarCarga =
        adicionarCarga;

    window.excluirCarga =
        excluirCarga;


    // Zero Grid residencial

    window.abrirZeroGridResidencial =
        abrirZeroGridResidencial;

    window.voltarDoZeroGridResidencial =
        voltarDoZeroGridResidencial;


    // C&I

    window.voltarAplicacaoCI =
        voltarAplicacaoCI;

    window.abrirBackupCI =
        abrirBackupCI;

    window.abrirZeroGridCI =
        abrirZeroGridCI;

        window.calcularBackupCI =
    calcularBackupCIProtegido;

window.limparBackupCI =
    limparFormularioBackupCI;

    // Reinício geral

    window.reiniciarNavegacao =
        reiniciarNavegacao;

}


// =====================================================
// INÍCIO DA APLICAÇÃO
// =====================================================

// Registra as funções imediatamente para os onclick
// existentes no HTML.
registrarFuncoesGlobais();


// Aguarda o HTML ser completamente carregado.
document.addEventListener(
    "DOMContentLoaded",
    iniciarFoxESSStudio
);