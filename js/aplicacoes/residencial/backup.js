// =====================================================
// FOXESS STUDIO
// Aplicação: Backup Residencial
// =====================================================

import {
    lerCargasDaTabela
} from "../../ui/tabela.js";

import {
    exibirResultadoCarregando,
    exibirResultadoDimensionamento,
    exibirErroResultado
} from "../../ui/resultado.js";

import {
    dimensionarProjeto
} from "../../service/dimensionamento.js";

import {
    definirAplicacao,
    definirAutonomia,
    definirCargas,
    definirPadraoEntrada,
    definirResultado,
    definirTipoCliente,
    definirTipoSolucao,
    definirCalculoCargas,
    definirErro,
    definirCarregando,
    limparErro
} from "../../store.js";


// =====================================================
// FUNÇÃO PRINCIPAL
// =====================================================

/**
 * Lê os dados da tela de Backup Residencial,
 * executa o dimensionamento e exibe o resultado.
 */
export function calcularBackupResidencial() {

    try {

        definirCarregando(true);

        limparErro();

        exibirResultadoCarregando();


        const dadosProjeto =
            lerDadosBackupResidencial();


        salvarDadosDoProjetoNoStore(
            dadosProjeto
        );

const resultado =
    dimensionarProjeto(
        dadosProjeto
    );

if (
    resultado.resumoCargas.potenciaTotalW > 40000
) {

    throw new Error(
        "Para sistemas acima de 40 kW utilize o Backup C&I."
    );

}


        if (resultado.resumoCargas) {

            definirCalculoCargas({

                potenciaTotalW:
                    resultado.resumoCargas
                        .potenciaTotalW,

                potenciaPicoW:
                    resultado.resumoCargas
                        .potenciaPicoTotalW,

                energiaNecessariaKWh:
                    resultado
                        .energiaNecessariaKWh || 0,

                tensoes:
                    resultado.resumoCargas
                        .tensoes || []

            });

        }


        exibirResultadoDimensionamento(
            resultado
        );


        definirCarregando(false);


        return resultado;

    } catch (erro) {

        console.error(
            "Erro no dimensionamento do Backup Residencial:",
            erro
        );


        definirErro(
            erro
        );


        exibirErroResultado(
            erro.message ||
            "Não foi possível dimensionar o sistema."
        );


        return null;

    }

}


// =====================================================
// LEITURA DOS DADOS DA TELA
// =====================================================

export function lerDadosBackupResidencial() {

    const autonomia =
        lerAutonomia();


    const padraoEntrada =
        lerPadraoEntrada();


    const tipoSolucao =
        lerTipoSolucao();


    const cargas =
        lerCargasDaTabela();
    
    const possuiCargaTrifasica =
    lerPossuiCargaTrifasica();


    return {

    tipoCliente:
        "residencial",

    aplicacao:
        "backup",

    tipoSolucao,

    padraoEntrada,

    possuiCargaTrifasica,

    autonomiaH:
        autonomia,

    cargas

    };

}


// =====================================================
// LEITURA DA AUTONOMIA
// =====================================================

function lerAutonomia() {

    const campo =
        document.getElementById(
            "autonomia"
        );


    if (!campo) {

        throw new Error(
            "O campo de autonomia não foi encontrado."
        );

    }


    const texto =
        String(
            campo.value || ""
        )

            .trim()

            .replace(",", ".");


    const autonomia =
        Number(texto);


    if (
        !Number.isFinite(autonomia) ||
        autonomia <= 0
    ) {

        campo.focus();


        throw new Error(
            "Informe uma autonomia maior que zero."
        );

    }


    return autonomia;

}


// =====================================================
// LEITURA DO PADRÃO DE ENTRADA
// =====================================================

function lerPadraoEntrada() {

    const campo =
        document.getElementById(
            "padraoEntrada"
        );


    if (!campo) {

        throw new Error(
            "O campo de padrão de entrada não foi encontrado."
        );

    }


    const valor =
        String(
            campo.value || ""
        ).trim();


    if (!valor) {

        campo.focus();


        throw new Error(
            "Selecione o padrão de entrada."
        );

    }


    return valor;

}

// =====================================================
// LEITURA DA EXISTÊNCIA DE CARGAS TRIFÁSICAS
// =====================================================

function lerPossuiCargaTrifasica() {

    const campo =
        document.getElementById(
            "possuiCargaTrifasica"
        );

    if (!campo) {

        return false;

    }

    return campo.value === "sim";

}

// =====================================================
// LEITURA DO TIPO DE SOLUÇÃO
// =====================================================

function lerTipoSolucao() {

    const campoSelecionado =
        document.querySelector(
            'input[name="tipoSolucao"]:checked'
        );


    if (!campoSelecionado) {

        throw new Error(
            "Selecione o tipo de solução."
        );

    }


    const valor =
        String(
            campoSelecionado.value || ""
        ).trim();


    if (
        valor !== "inversor" &&
        valor !== "aio"
    ) {

        throw new Error(
            "O tipo de solução selecionado é inválido."
        );

    }


    return valor;

}


// =====================================================
// STORE
// =====================================================

function salvarDadosDoProjetoNoStore(
    dadosProjeto
) {

    definirTipoCliente(
        dadosProjeto.tipoCliente
    );


    definirAplicacao(
        dadosProjeto.aplicacao
    );


    definirTipoSolucao(
        dadosProjeto.tipoSolucao
    );


    definirPadraoEntrada(
        dadosProjeto.padraoEntrada
    );


    definirAutonomia(
        dadosProjeto.autonomiaH
    );


    definirCargas(
        dadosProjeto.cargas
    );

}


// =====================================================
// LIMPEZA DO FORMULÁRIO
// =====================================================

/**
 * Limpa os campos principais do Backup Residencial.
 *
 * A limpeza da tabela será feita pelo módulo tabela.js.
 */
export function limparFormularioBackupResidencial() {

    const autonomia =
        document.getElementById(
            "autonomia"
        );


    if (autonomia) {

        autonomia.value = "";

    }


    const padraoEntrada =
        document.getElementById(
            "padraoEntrada"
        );


    if (padraoEntrada) {

        padraoEntrada.selectedIndex = 0;

    }


    const tipoInversor =
        document.getElementById(
            "tipoInversor"
        );


    if (tipoInversor) {

        tipoInversor.checked = true;

    }

}


// =====================================================
// VALIDAÇÃO RÁPIDA DO FORMULÁRIO
// =====================================================

/**
 * Pode ser usada futuramente para habilitar ou
 * desabilitar o botão de cálculo em tempo real.
 */
export function formularioBackupResidencialValido() {

    try {

        lerDadosBackupResidencial();

        return true;

    } catch {

        return false;

    }

}