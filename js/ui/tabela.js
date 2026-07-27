// =====================================================
// FOXESS STUDIO
// Controle da tabela de cargas
// =====================================================

import {
    validarCarga
} from "../utils/validacoes.js";


// =====================================================
// CONFIGURAÇÕES
// =====================================================

const SELETOR_TABELA = "#tabelaCargas";

const SELETOR_CORPO_TABELA =
    `${SELETOR_TABELA} tbody`;


// =====================================================
// INICIALIZAÇÃO
// =====================================================

/**
 * Verifica se a tabela existe e garante que exista
 * pelo menos uma linha para preenchimento.
 */
export function iniciarTabelaCargas() {

    const corpoTabela =
        obterCorpoTabela();


    if (!corpoTabela) {

        console.warn(
            "A tabela de cargas não foi encontrada."
        );

        return;

    }


    if (corpoTabela.rows.length === 0) {

        adicionarCarga();

    }

}


// =====================================================
// ADICIONAR CARGA
// =====================================================

/**
 * Adiciona uma nova linha vazia à tabela.
 *
 * Também pode receber uma carga existente para preencher
 * a linha futuramente, por exemplo ao carregar um projeto.
 */
export function adicionarCarga(
    cargaInicial = null
) {

    const corpoTabela =
        obterCorpoTabela();


    if (!corpoTabela) {

        console.error(
            "Não foi possível adicionar a carga porque a tabela não existe."
        );

        return null;

    }


    const linha =
        document.createElement("tr");


    linha.innerHTML = criarHTMLLinha(
        cargaInicial
    );


    corpoTabela.appendChild(linha);


    const campoNome =
        linha.querySelector(
            '[data-campo="nome"]'
        );


    campoNome?.focus();


    return linha;

}


// =====================================================
// EXCLUIR CARGA
// =====================================================

/**
 * Exclui a linha correspondente ao botão pressionado.
 *
 * Compatível com o HTML atual:
 *
 * onclick="excluirCarga(this)"
 */
export function excluirCarga(botao) {

    if (!botao) {

        return;

    }


    const linha =
        botao.closest("tr");


    if (!linha) {

        return;

    }


    linha.remove();


    /*
     * Mantém pelo menos uma linha disponível para
     * preenchimento.
     */
    garantirLinhaVazia();

}


// =====================================================
// LER CARGAS DA TABELA
// =====================================================

/**
 * Lê as linhas preenchidas e retorna uma lista de cargas.
 *
 * Formato retornado:
 *
 * {
 *     nome: "Geladeira",
 *     potenciaW: 300,
 *     tensaoV: "127",
 *     quantidade: 1,
 *     tempoLigadoH: 2,
 *     fatorPotencia: 0.9,
 *     ipIn: 3
 * }
 */
export function lerCargasDaTabela() {

    const corpoTabela =
        obterCorpoTabela();


    if (!corpoTabela) {

        throw new Error(
            "A tabela de cargas não foi encontrada."
        );

    }


    const linhas =
        Array.from(
            corpoTabela.querySelectorAll("tr")
        );


    const cargas = [];


    linhas.forEach(
        (linha, indice) => {

            const carga =
                lerCargaDaLinha(
                    linha,
                    indice
                );


            /*
             * Linhas completamente vazias são ignoradas.
             */
            if (!carga) {

                return;

            }


            cargas.push(carga);

        }
    );


    if (cargas.length === 0) {

        throw new Error(
            "Adicione e preencha pelo menos uma carga."
        );

    }


    return cargas;

}


// =====================================================
// LER UMA LINHA
// =====================================================

export function lerCargaDaLinha(
    linha,
    indice = 0
) {

    if (
        !linha ||
        !(linha instanceof HTMLElement)
    ) {

        throw new Error(
            "A linha da tabela é inválida."
        );

    }


    const campos =
        obterCamposDaLinha(linha);


    const nome =
        String(
            campos.nome?.value || ""
        ).trim();


    const potenciaOriginal =
        campos.potencia?.value;


    const quantidadeOriginal =
        campos.quantidade?.value;


    const tempoOriginal =
        campos.tempoLigado?.value;


    const fatorPotenciaOriginal =
        campos.fatorPotencia?.value;


    const ipInOriginal =
        campos.ipIn?.value;


    /*
     * A linha é considerada vazia quando o usuário não
     * informou nome nem potência.
     */
    const linhaVazia =

        !nome &&

        campoVazio(
            potenciaOriginal
        );


    if (linhaVazia) {

        return null;

    }


    const potenciaW =
        converterNumero(
            potenciaOriginal,
            0
        );


    const quantidade =
        converterNumero(
            quantidadeOriginal,
            1
        );


    const tempoLigadoH =
        converterNumero(
            tempoOriginal,
            0
        );


    const fatorPotencia =
        converterNumero(
            fatorPotenciaOriginal,
            1
        );


    const ipIn =
        converterNumero(
            ipInOriginal,
            1
        );


    const tensaoV =
        String(
            campos.tensao?.value || ""
        ).trim();


    const carga = {

        nome,

        potenciaW,

        tensaoV,

        quantidade,

        tempoLigadoH,

        fatorPotencia,

        ipIn

    };


    try {

        validarCarga(carga);

    } catch (erro) {

        const numeroLinha =
            indice + 1;


        throw new Error(
            `Erro na carga da linha ${numeroLinha}: ${erro.message}`
        );

    }


    return carga;

}


// =====================================================
// PREENCHER TABELA
// =====================================================

/**
 * Substitui o conteúdo atual da tabela por uma lista
 * de cargas.
 *
 * Poderá ser usado quando implementarmos salvar e
 * carregar projetos.
 */
export function preencherTabelaCargas(
    cargas
) {

    if (!Array.isArray(cargas)) {

        throw new TypeError(
            "As cargas precisam ser fornecidas em uma lista."
        );

    }


    const corpoTabela =
        obterCorpoTabela();


    if (!corpoTabela) {

        throw new Error(
            "A tabela de cargas não foi encontrada."
        );

    }


    corpoTabela.innerHTML = "";


    if (cargas.length === 0) {

        adicionarCarga();

        return;

    }


    cargas.forEach(carga => {

        adicionarCarga(carga);

    });

}


// =====================================================
// LIMPAR TABELA
// =====================================================

export function limparTabelaCargas() {

    const corpoTabela =
        obterCorpoTabela();


    if (!corpoTabela) {

        return;

    }


    corpoTabela.innerHTML = "";


    adicionarCarga();

}


// =====================================================
// QUANTIDADE DE LINHAS
// =====================================================

export function obterQuantidadeLinhas() {

    const corpoTabela =
        obterCorpoTabela();


    if (!corpoTabela) {

        return 0;

    }


    return corpoTabela.rows.length;

}


// =====================================================
// CRIAÇÃO DO HTML
// =====================================================

function criarHTMLLinha(
    carga = null
) {

    const dados = {

        nome:
            carga?.nome ?? "",

        potenciaW:
            carga?.potenciaW ?? "",

        tensaoV:
            String(
                carga?.tensaoV ?? "127"
            ),

        quantidade:
            carga?.quantidade ?? 1,

        tempoLigadoH:
            carga?.tempoLigadoH ?? "",

        fatorPotencia:
            carga?.fatorPotencia ?? "",

        ipIn:
            carga?.ipIn ?? ""

    };


    return `

        <td>

            <input
                type="text"
                data-campo="nome"
                value="${escaparAtributo(dados.nome)}"
                placeholder="Ex: Geladeira"
            >

        </td>


        <td>

            <input
                type="number"
                data-campo="potencia"
                value="${escaparAtributo(dados.potenciaW)}"
                min="0"
                step="0.01"
                placeholder="W"
            >

        </td>


        <td>

            <select data-campo="tensao">

                <option
                    value="127"
                    ${dados.tensaoV === "127" ? "selected" : ""}
                >
                    127
                </option>

                <option
                    value="220"
                    ${dados.tensaoV === "220" ? "selected" : ""}
                >
                    220
                </option>

                <option
                    value="380"
                    ${dados.tensaoV === "380" ? "selected" : ""}
                >
                    380
                </option>

            </select>

        </td>


        <td>

            <input
                type="number"
                data-campo="quantidade"
                value="${escaparAtributo(dados.quantidade)}"
                min="1"
                step="1"
            >

        </td>


        <td>

            <input
                type="number"
                data-campo="tempoLigado"
                value="${escaparAtributo(dados.tempoLigadoH)}"
                min="0"
                step="0.01"
                placeholder="h"
            >

        </td>


        <td>

            <input
                type="number"
                data-campo="fatorPotencia"
                value="${escaparAtributo(dados.fatorPotencia)}"
                min="0.01"
                max="1"
                step="0.01"
                placeholder="1"
            >

        </td>


        <td>

            <input
                type="number"
                data-campo="ipIn"
                value="${escaparAtributo(dados.ipIn)}"
                min="1"
                step="0.01"
                placeholder="1"
            >

        </td>


        <td>

            <button
                type="button"
                class="btn-excluir"
                onclick="excluirCarga(this)"
                title="Excluir carga"
                aria-label="Excluir carga"
            >
                🗑️
            </button>

        </td>

    `;

}


// =====================================================
// CAMPOS DA LINHA
// =====================================================

/**
 * Primeiro procura pelos novos atributos data-campo.
 *
 * Caso a linha inicial ainda seja a versão antiga do
 * HTML, utiliza a ordem dos inputs como alternativa.
 */
function obterCamposDaLinha(
    linha
) {

    const inputs =
        linha.querySelectorAll("input");


    return {

        nome:

            linha.querySelector(
                '[data-campo="nome"]'
            )

            ??

            inputs[0],


        potencia:

            linha.querySelector(
                '[data-campo="potencia"]'
            )

            ??

            inputs[1],


        tensao:

            linha.querySelector(
                '[data-campo="tensao"]'
            )

            ??

            linha.querySelector("select"),


        quantidade:

            linha.querySelector(
                '[data-campo="quantidade"]'
            )

            ??

            inputs[2],


        tempoLigado:

            linha.querySelector(
                '[data-campo="tempoLigado"]'
            )

            ??

            inputs[3],


        fatorPotencia:

            linha.querySelector(
                '[data-campo="fatorPotencia"]'
            )

            ??

            inputs[4],


        ipIn:

            linha.querySelector(
                '[data-campo="ipIn"]'
            )

            ??

            inputs[5]

    };

}


// =====================================================
// FUNÇÕES INTERNAS
// =====================================================

function obterCorpoTabela() {

    const telaCI =
        document.getElementById("telaBackupCI");

    console.log("Tela CI escondida?", telaCI.classList.contains("escondido"));

    if (
        telaCI &&
        !telaCI.classList.contains("escondido")
    ) {

        console.log("Usando tabela CI");

        return document.querySelector("#tabelaCargasCI tbody");

    }

    console.log("Usando tabela Residencial");

    return document.querySelector("#tabelaCargas tbody");

}


function garantirLinhaVazia() {

    const corpoTabela =
        obterCorpoTabela();


    if (
        corpoTabela &&
        corpoTabela.rows.length === 0
    ) {

        adicionarCarga();

    }

}


/**
 * Aceita números com ponto ou vírgula.
 *
 * Exemplos:
 *
 * "2.5" → 2.5
 * "2,5" → 2.5
 */
function converterNumero(
    valor,
    valorPadrao = 0
) {

    if (campoVazio(valor)) {

        return valorPadrao;

    }


    const texto =
        String(valor)

            .trim()

            .replace(",", ".");


    const numero =
        Number(texto);


    return Number.isFinite(numero)
        ? numero
        : NaN;

}


function campoVazio(valor) {

    return (
        valor === "" ||
        valor === null ||
        valor === undefined
    );

}


/**
 * Protege valores inseridos em atributos HTML.
 */
function escaparAtributo(valor) {

    return String(valor ?? "")

        .replaceAll("&", "&amp;")

        .replaceAll('"', "&quot;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;");

}