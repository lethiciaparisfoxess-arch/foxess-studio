// =====================================================
// FOXESS STUDIO
// Orquestrador geral de dimensionamento
// =====================================================

import {
    obterInversores,
    obterBaterias,
    obterAllInOne,
    obterAcessorios
} from "../database.js";


import {
    calcularResumoCargas,
    calcularEnergiaPorAutonomia,
    corrigirEnergiaPorEficiencia
} from "./energia.js";


import {
    selecionarInversor
} from "./inversores/seletor.js";


import {
    selecionarBateria
} from "./baterias.js";


import {
    selecionarAllInOne
} from "./allInOne.js";


// =====================================================
// FUNÇÃO PRINCIPAL
// =====================================================

/**
 * Direciona o projeto para o dimensionamento correto.
 *
 * Estrutura esperada:
 *
 * {
 *     tipoCliente: "residencial",
 *     aplicacao: "backup",
 *     tipoSolucao: "inversor",
 *     padraoEntrada: "Bifásico 127V/220V",
 *     autonomiaH: 2,
 *     cargas: []
 * }
 */
export function dimensionarProjeto(parametros) {

    validarParametrosGerais(parametros);


    const aplicacao =
        normalizarAplicacao(
            parametros.aplicacao
        );


    switch (aplicacao) {

        case "backup":

            return dimensionarBackup(
                parametros
            );


        case "zero-grid":

            return criarResultadoNaoImplementado({

                aplicacao: "zero-grid",

                mensagem:
                    "O dimensionamento de Zero Grid ainda não foi implementado."

            });


        default:

            return criarResultadoNaoImplementado({

                aplicacao,

                mensagem:
                    `A aplicação "${parametros.aplicacao}" ainda não foi implementada.`

            });

    }

}


// =====================================================
// DIMENSIONAMENTO DE BACKUP
// =====================================================

/**
 * Executa o fluxo completo de Backup:
 *
 * 1. calcula potência das cargas;
 * 2. calcula potência de pico;
 * 3. verifica o tipo de solução;
 * 4. dimensiona inversor e bateria ou All in One;
 * 5. retorna o resultado completo.
 */
export function dimensionarBackup(parametros) {

    const {

    tipoCliente = "residencial",

    tipoSolucao,

    padraoEntrada,

    possuiCargaTrifasica = false,

    autonomiaH,

    cargas

    } = parametros;


    validarParametrosBackup({

        tipoSolucao,

        padraoEntrada,

        autonomiaH,

        cargas

    });


    // =================================================
    // CÁLCULO DAS CARGAS
    // =================================================

    const resumoCargas =
        calcularResumoCargas(
            cargas
        );


    const potenciaTotalW =
        resumoCargas.potenciaTotalW;


    const potenciaPicoW =
        resumoCargas.potenciaPicoTotalW;


    if (potenciaTotalW <= 0) {

        return criarResultadoComErro({

            motivo: "potencia_total_invalida",

            mensagem:
                "A potência total das cargas precisa ser maior que zero."

        });

    }


    // =================================================
    // ROTEAMENTO PELO TIPO DE SOLUÇÃO
    // =================================================

    if (tipoSolucao === "aio") {

        return dimensionarBackupAllInOne({

            tipoCliente,

            padraoEntrada,

            autonomiaH,

            possuiCargaTrifasica,

            resumoCargas,

            potenciaTotalW,

            potenciaPicoW,
            possuiCargaTrifasica

        });

    }


    return dimensionarBackupInversorBateria({

    tipoCliente,

    padraoEntrada,

    possuiCargaTrifasica,

    autonomiaH,

    resumoCargas,

    potenciaTotalW,

    potenciaPicoW

    });

}


// =====================================================
// INVERSOR + BATERIA
// =====================================================

function dimensionarBackupInversorBateria({

    tipoCliente,

    padraoEntrada,
    
    possuiCargaTrifasica,

    autonomiaH,

    resumoCargas,

    potenciaTotalW,

    potenciaPicoW

}) {

    // =================================================
    // SELEÇÃO DO INVERSOR
    // =================================================

const resultadoInversor =
    selecionarInversor({

        inversores:
            obterInversores(),

        padraoEntrada,

        possuiCargaTrifasica,

        tensoesCargas:
            resumoCargas.tensoes,

        potenciaTotalW,

        potenciaPicoW

    });

    if (!resultadoInversor.encontrado) {

        return criarResultadoComErro({

            tipoCliente,

            aplicacao: "backup",

            tipoSolucao: "inversor",

            motivo:
                resultadoInversor.motivo,

            mensagem:
                resultadoInversor.mensagem,

            resumoCargas,

            inversor:
                resultadoInversor

        });

    }

    resultadoInversor.acessorioParalelismo =
    localizarAcessorioParalelismo(
        resultadoInversor
    );


    // =================================================
    // ENERGIA NECESSÁRIA
    // =================================================

    const energiaSemPerdasKWh =
        calcularEnergiaPorAutonomia(
            potenciaTotalW,
            autonomiaH
        );


    const energiaNecessariaKWh =
        corrigirEnergiaPorEficiencia(

            energiaSemPerdasKWh,

            resultadoInversor
                .equipamento
                .efficiency

        );


    // =================================================
    // SELEÇÃO DA BATERIA
    // =================================================

    const resultadoBateria =
        selecionarBateria({

            baterias:
                obterBaterias(),

            inversor:
                resultadoInversor.equipamento,

            quantidadeInversores:
                resultadoInversor.quantidade,

            energiaNecessariaKWh,

            acessorios:
                obterAcessorios()

        });


    if (!resultadoBateria.encontrado) {

        return criarResultadoComErro({

            tipoCliente,

            aplicacao: "backup",

            tipoSolucao: "inversor",

            motivo:
                resultadoBateria.motivo,

            mensagem:
                resultadoBateria.mensagem,

            resumoCargas,

            energiaSemPerdasKWh,

            energiaNecessariaKWh,

            inversor:
                resultadoInversor,

            bateria:
                resultadoBateria

        });

    }


    // =================================================
    // RESULTADO FINAL
    // =================================================

    return {

        sucesso: true,

        tipoCliente,

        aplicacao: "backup",

        tipoSolucao:
            "inversor",

        padraoEntrada,

        autonomiaH,

        resumoCargas,

        potenciaTotalW,

        potenciaPicoW,

        energiaSemPerdasKWh,

        energiaNecessariaKWh,

        inversor:
            resultadoInversor,

        bateria:
            resultadoBateria,

        allInOne: null,

        mensagem:
            "Sistema Inversor + Bateria dimensionado com sucesso."

    };

}


// =====================================================
// ALL IN ONE
// =====================================================

function dimensionarBackupAllInOne({

    tipoCliente,

    possuiCargaTrifasica,

    padraoEntrada,

    autonomiaH,

    resumoCargas,

    potenciaTotalW,

    potenciaPicoW

}) {

const resultadoAllInOne =
    selecionarAllInOne({

    equipamentos:
        obterAllInOne(),

    padraoEntrada,

    possuiCargaTrifasica,

    tensoesCargas:
        resumoCargas.tensoes,

    potenciaTotalW,

    potenciaPicoW,

    autonomiaH

    });


    if (!resultadoAllInOne.encontrado) {

        return criarResultadoComErro({

            tipoCliente,

            aplicacao: "backup",

            tipoSolucao: "aio",

            motivo:
                resultadoAllInOne.motivo,

            mensagem:
                resultadoAllInOne.mensagem,

            resumoCargas,

            allInOne:
                resultadoAllInOne

        });

    }

    const acessorios =
    montarAcessoriosAllInOne(
        resultadoAllInOne
    );


    return {

        sucesso: true,

        tipoCliente,

        aplicacao: "backup",

        tipoSolucao: "aio",

        padraoEntrada,

        autonomiaH,

        resumoCargas,

        potenciaTotalW,

        potenciaPicoW,

        energiaSemPerdasKWh:

            calcularEnergiaPorAutonomia(
                potenciaTotalW,
                autonomiaH
            ),

        energiaNecessariaKWh:
            resultadoAllInOne
                .energiaNecessariaKWh,

        inversor: null,

        bateria: null,

        allInOne:
            resultadoAllInOne,

        acessorios,

        mensagem:
            "Sistema All in One dimensionado com sucesso."

    };

}


// =====================================================
// RESULTADOS DE ERRO
// =====================================================

function criarResultadoComErro({

    tipoCliente = null,

    aplicacao = null,

    tipoSolucao = null,

    motivo,

    mensagem,

    resumoCargas = null,

    energiaSemPerdasKWh = 0,

    energiaNecessariaKWh = 0,

    inversor = null,

    bateria = null,

    allInOne = null

}) {

    return {

        sucesso: false,

        tipoCliente,

        aplicacao,

        tipoSolucao,

        motivo,

        mensagem,

        resumoCargas,

        energiaSemPerdasKWh,

        energiaNecessariaKWh,

        inversor,

        bateria,

        allInOne

    };

}


function criarResultadoNaoImplementado({

    aplicacao,

    mensagem

}) {

    return {

        sucesso: false,

        aplicacao,

        motivo:
            "aplicacao_nao_implementada",

        mensagem,

        resumoCargas: null,

        inversor: null,

        bateria: null,

        allInOne: null

    };

}

// =====================================================
// ACESSÓRIOS DO ALL IN ONE
// =====================================================

function montarAcessoriosAllInOne(
    resultadoAllInOne
) {

    const acessorios = [];


    if (
        !resultadoAllInOne.utilizaParalelismo ||
        !resultadoAllInOne
            .acessorioParalelismoModelo
    ) {

        return acessorios;

    }


    const modeloProcurado =
        normalizarNomeAcessorio(
            resultadoAllInOne
                .acessorioParalelismoModelo
        );


    const produto =
        obterAcessorios().find(acessorio => {

            return normalizarNomeAcessorio(
                acessorio.modelo
            ) === modeloProcurado;

        });


    if (!produto) {

        throw new Error(
            `O acessório "${
                resultadoAllInOne
                    .acessorioParalelismoModelo
            }" não foi encontrado no produtos.json.`
        );

    }


    acessorios.push({

        produto,

        quantidade: 1,

        origem:
            "paralelismo-all-in-one",

        descricao:
            "Necessário para comunicação e gerenciamento das unidades All in One em paralelo."

    });


    return acessorios;

}


function normalizarNomeAcessorio(
    valor
) {

    return String(valor || "")

        .normalize("NFD")

        .replace(
            /[\u0300-\u036f]/g,
            ""
        )

        .trim()

        .toLowerCase();

}

// =====================================================
// VALIDAÇÕES
// =====================================================

function validarParametrosGerais(
    parametros
) {

    if (
        !parametros ||
        typeof parametros !== "object" ||
        Array.isArray(parametros)
    ) {

        throw new TypeError(
            "Os parâmetros do projeto são inválidos."
        );

    }


    if (
        !parametros.aplicacao ||
        typeof parametros.aplicacao !== "string"
    ) {

        throw new Error(
            "A aplicação do projeto não foi informada."
        );

    }

}


function validarParametrosBackup({

    tipoSolucao,

    padraoEntrada,

    autonomiaH,

    cargas

}) {

    if (
        tipoSolucao !== "inversor" &&
        tipoSolucao !== "aio"
    ) {

        throw new Error(
            "O tipo de solução deve ser 'inversor' ou 'aio'."
        );

    }


    if (
        !padraoEntrada ||
        typeof padraoEntrada !== "string"
    ) {

        throw new Error(
            "O padrão de entrada não foi informado."
        );

    }


    const autonomia =
        Number(autonomiaH);


    if (
        !Number.isFinite(autonomia) ||
        autonomia <= 0
    ) {

        throw new Error(
            "A autonomia precisa ser maior que zero."
        );

    }


    if (!Array.isArray(cargas)) {

        throw new TypeError(
            "As cargas precisam ser fornecidas em uma lista."
        );

    }


    if (cargas.length === 0) {

        throw new Error(
            "Adicione pelo menos uma carga."
        );

    }

}

// =====================================================
// ACESSÓRIO DE PARALELISMO
// =====================================================

function localizarAcessorioParalelismo(
    resultadoInversor
) {

    if (
        !resultadoInversor ||
        !resultadoInversor.utilizaParalelismo ||
        !resultadoInversor.acessorioParalelismoModelo
    ) {

        return null;

    }


    const modeloProcurado =
        normalizarTextoInterno(
            resultadoInversor
                .acessorioParalelismoModelo
        );


    const acessorio =
        obterAcessorios().find(item => {

            return normalizarTextoInterno(
                item.modelo
            ) === modeloProcurado;

        });


    if (!acessorio) {

        throw new Error(
            `O acessório de paralelismo "${
                resultadoInversor
                    .acessorioParalelismoModelo
            }" não foi encontrado no produtos.json.`
        );

    }


    return {

        ...acessorio,

        quantidade: 1

    };

}


function normalizarTextoInterno(valor) {

    return String(valor || "")

        .normalize("NFD")

        .replace(
            /[\u0300-\u036f]/g,
            ""
        )

        .trim()

        .toLowerCase();

}

// =====================================================
// NORMALIZAÇÃO
// =====================================================

function normalizarAplicacao(
    aplicacao
) {

    const texto =
        String(aplicacao || "")

            .normalize("NFD")

            .replace(
                /[\u0300-\u036f]/g,
                ""
            )

            .trim()

            .toLowerCase()

            .replace(/_/g, "-")

            .replace(/\s+/g, "-");


    if (texto === "zerogrid") {

        return "zero-grid";

    }


    return texto;

}