// =====================================================
// FOXESS STUDIO
// Seleção automática de inversores FoxESS
// =====================================================

import {
    filtrarInversoresCompativeis,
    validarTensoesParaPadrao
} from "./compatibilidade.js";


import {
    verificarCapacidadeDePico
} from "./pico.js";


import {
    encontrarQuantidadeMinimaParalelo,
    obterLimiteParalelismo,
    resumirSolucaoParalelo
} from "./paralelismo.js";


// =====================================================
// FUNÇÃO PRINCIPAL
// =====================================================

/**
 * Seleciona o inversor FoxESS mais adequado.
 *
 * Ordem:
 *
 * 1. valida os dados;
 * 2. verifica tensões;
 * 3. filtra inversores compatíveis;
 * 4. tenta uma unidade;
 * 5. caso necessário, tenta paralelismo;
 * 6. respeita o limite de paralelismo do produto;
 * 7. informa se existe acessório de paralelismo.
 */
export function selecionarInversor(parametros) {

    validarParametrosSelecao(parametros);


    const {
    inversores,
    padraoEntrada,
    possuiCargaTrifasica = false,
    tensoesCargas,
    potenciaTotalW,
    potenciaPicoW
    } = parametros;


    // =================================================
    // VALIDAÇÃO DAS TENSÕES
    // =================================================

    const validacaoTensoes =
        validarTensoesParaPadrao(
            padraoEntrada,
            tensoesCargas
        );


    if (!validacaoTensoes.valido) {

        return criarResultadoSemSolucao({

            motivo:
                "tensoes_incompativeis",

            mensagem:
                validacaoTensoes.mensagem

        });

    }


    // =================================================
    // FILTRO DE COMPATIBILIDADE
    // =================================================

let inversoresCompativeis =
    filtrarInversoresCompativeis(
        inversores,
        padraoEntrada,
        tensoesCargas
    );

// ================================================
// FILTRO PARA CARGAS TRIFÁSICAS
// ================================================

if (
    padraoEntrada.includes("Trifásico") &&
    possuiCargaTrifasica
) {

    inversoresCompativeis =
        inversoresCompativeis.filter(inversor => {

return (
    String(inversor.fase || "")
        .toLowerCase()
        .trim() === "trifasico"
);

        });

}

    if (inversoresCompativeis.length === 0) {

        return criarResultadoSemSolucao({

            motivo:
                "nenhum_inversor_compativel",

            mensagem:
                "Nenhum inversor FoxESS é compatível com o padrão de entrada e as tensões informadas."

        });

    }


    // Ordena do menor para o maior
    const inversoresOrdenados =
        inversoresCompativeis

            .slice()

            .sort((a, b) => {

                return (
                    Number(a.max_power_eps) -
                    Number(b.max_power_eps)
                );

            });


    // =================================================
    // TENTATIVA COM UMA ÚNICA UNIDADE
    // =================================================

    const solucaoUnitaria =
        selecionarInversorUnitario(
            inversoresOrdenados,
            potenciaTotalW,
            potenciaPicoW
        );


    if (solucaoUnitaria) {

        const equipamento =
            solucaoUnitaria.equipamento;


        const potenciaNominal =
            Number(
                equipamento.max_power_eps
            );


        return {

            encontrado: true,

            tipo: "unitario",

            equipamento,

            modelo:
                equipamento.modelo,

            quantidade: 1,

            utilizaParalelismo: false,

            requerAcessorioParalelismo: false,

            acessorioParalelismoModelo: null,

            potenciaNominalUnitariaW:
                potenciaNominal,

            potenciaNominalTotalW:
                potenciaNominal,

            potenciaTotalExigidaW:
                potenciaTotalW,

            potenciaPicoExigidaW:
                potenciaPicoW,

            pico:
                solucaoUnitaria.pico,

            inversoresCompativeis,

            mensagem:
                "Inversor selecionado com sucesso."

        };

    }


    // =================================================
    // TENTATIVA COM INVERSORES EM PARALELO
    // =================================================

    const solucaoParalela =
        selecionarSolucaoParalela(
            inversoresOrdenados,
            potenciaTotalW,
            potenciaPicoW
        );


    if (!solucaoParalela) {

        return criarResultadoSemSolucao({

            motivo:
                "potencia_nao_atendida",

            mensagem:
                "Nenhum inversor FoxESS atende à potência nominal e à potência de pico informadas dentro dos limites permitidos de paralelismo.",

            inversoresCompativeis

        });

    }


    return {

        encontrado: true,

        tipo: "paralelo",

        equipamento:
            solucaoParalela.equipamento,

        modelo:
            solucaoParalela.modelo,

        quantidade:
            solucaoParalela.quantidade,

        utilizaParalelismo: true,

        requerAcessorioParalelismo:
            solucaoParalela
                .requerAcessorioParalelismo,

        acessorioParalelismoModelo:
            solucaoParalela
                .acessorioParalelismoModelo,

        potenciaNominalUnitariaW:
            solucaoParalela
                .potenciaNominalUnitáriaW,

        potenciaNominalTotalW:
            solucaoParalela
                .potenciaNominalTotalW,

        potenciaTotalExigidaW:
            potenciaTotalW,

        potenciaPicoExigidaW:
            potenciaPicoW,

        pico:
            solucaoParalela.pico,

        inversoresCompativeis,

        mensagem:
            `${solucaoParalela.quantidade} inversores ${solucaoParalela.modelo} foram selecionados para operação em paralelo.`

    };

}


// =====================================================
// SELEÇÃO DE INVERSOR ÚNICO
// =====================================================

/**
 * Retorna o menor inversor que atende:
 *
 * - potência nominal;
 * - potência de pico.
 */
export function selecionarInversorUnitario(
    inversores,
    potenciaTotalW,
    potenciaPicoW
) {

    if (!Array.isArray(inversores)) {

        throw new TypeError(
            "A lista de inversores precisa ser um array."
        );

    }


    for (const inversor of inversores) {

        const potenciaNominal =
            Number(
                inversor.max_power_eps
            );


        if (
            !Number.isFinite(potenciaNominal) ||
            potenciaNominal <= 0
        ) {

            continue;

        }


        if (
            potenciaNominal <
            potenciaTotalW
        ) {

            continue;

        }


        const pico =
            verificarCapacidadeDePico(
                inversor,
                potenciaPicoW
            );


        if (!pico.suportado) {

            continue;

        }


        return {

            equipamento:
                inversor,

            pico

        };

    }


    return null;

}


// =====================================================
// SELEÇÃO EM PARALELO
// =====================================================

/**
 * Testa os modelos compatíveis e retorna a melhor
 * solução em paralelo.
 *
 * Critérios:
 *
 * 1. menor quantidade;
 * 2. menor sobra de potência;
 * 3. menor potência unitária;
 * 4. ordem alfabética.
 */
export function selecionarSolucaoParalela(
    inversores,
    potenciaTotalW,
    potenciaPicoW
) {

    if (!Array.isArray(inversores)) {

        throw new TypeError(
            "A lista de inversores precisa ser um array."
        );

    }


    const solucoes = [];


    inversores.forEach(inversor => {

        const limite =
            obterLimiteParalelismo(
                inversor
            );


        const verificacao =
            encontrarQuantidadeMinimaParalelo(
                inversor,
                potenciaTotalW,
                potenciaPicoW,
                limite
            );


        if (!verificacao) {

            return;

        }


        if (
            verificacao.quantidade <= 1
        ) {

            return;

        }


        const resumo =
            resumirSolucaoParalelo(
                inversor,
                verificacao
            );


        solucoes.push(
            resumo
        );

    });


    if (solucoes.length === 0) {

        return null;

    }


    solucoes.sort((solucaoA, solucaoB) => {

        // 1. Menor quantidade
        if (
            solucaoA.quantidade !==
            solucaoB.quantidade
        ) {

            return (
                solucaoA.quantidade -
                solucaoB.quantidade
            );

        }


        // 2. Menor sobra de potência
        const sobraA =

            solucaoA.potenciaNominalTotalW -
            potenciaTotalW;


        const sobraB =

            solucaoB.potenciaNominalTotalW -
            potenciaTotalW;


        if (sobraA !== sobraB) {

            return sobraA - sobraB;

        }


        // 3. Menor potência unitária
        if (
            solucaoA.potenciaNominalUnitáriaW !==
            solucaoB.potenciaNominalUnitáriaW
        ) {

            return (

                solucaoA.potenciaNominalUnitáriaW -

                solucaoB.potenciaNominalUnitáriaW

            );

        }


        // 4. Ordem alfabética
        return String(
            solucaoA.modelo
        ).localeCompare(

            String(
                solucaoB.modelo
            ),

            "pt-BR"

        );

    });


    return solucoes[0];

}


// =====================================================
// LISTA DE TODAS AS SOLUÇÕES
// =====================================================

/**
 * Retorna todas as soluções possíveis.
 *
 * Poderá ser usada futuramente para mostrar
 * alternativas ao usuário.
 */
export function listarSolucoesInversores(
    parametros
) {

    validarParametrosSelecao(
        parametros
    );


    const {
        inversores,
        padraoEntrada,
        tensoesCargas,
        potenciaTotalW,
        potenciaPicoW
    } = parametros;


    const validacaoTensoes =
        validarTensoesParaPadrao(
            padraoEntrada,
            tensoesCargas
        );


    if (!validacaoTensoes.valido) {

        return [];

    }


    const compativeis =
        filtrarInversoresCompativeis(
            inversores,
            padraoEntrada,
            tensoesCargas
        );


    const solucoes = [];


    compativeis.forEach(inversor => {

        const potenciaNominal =
            Number(
                inversor.max_power_eps
            );


        // ---------------------------------------------
        // Solução unitária
        // ---------------------------------------------

        if (
            potenciaNominal >=
            potenciaTotalW
        ) {

            const pico =
                verificarCapacidadeDePico(
                    inversor,
                    potenciaPicoW
                );


            if (pico.suportado) {

                solucoes.push({

                    tipo:
                        "unitario",

                    equipamento:
                        inversor,

                    modelo:
                        inversor.modelo,

                    quantidade: 1,

                    utilizaParalelismo:
                        false,

                    requerAcessorioParalelismo:
                        false,

                    acessorioParalelismoModelo:
                        null,

                    potenciaNominalUnitariaW:
                        potenciaNominal,

                    potenciaNominalTotalW:
                        potenciaNominal,

                    pico

                });

            }

        }


        // ---------------------------------------------
        // Solução em paralelo
        // ---------------------------------------------

        const limite =
            obterLimiteParalelismo(
                inversor
            );


        const paralelo =
            encontrarQuantidadeMinimaParalelo(
                inversor,
                potenciaTotalW,
                potenciaPicoW,
                limite
            );


        if (
            paralelo &&
            paralelo.quantidade > 1
        ) {

            const resumo =
                resumirSolucaoParalelo(
                    inversor,
                    paralelo
                );


            solucoes.push({

                tipo:
                    "paralelo",

                equipamento:
                    inversor,

                modelo:
                    inversor.modelo,

                quantidade:
                    paralelo.quantidade,

                utilizaParalelismo:
                    true,

                requerAcessorioParalelismo:
                    resumo
                        .requerAcessorioParalelismo,

                acessorioParalelismoModelo:
                    resumo
                        .acessorioParalelismoModelo,

                potenciaNominalUnitariaW:
                    potenciaNominal,

                potenciaNominalTotalW:
                    paralelo
                        .potenciaNominalTotalW,

                pico:
                    paralelo.pico

            });

        }

    });


    return solucoes;

}


// =====================================================
// RESULTADO SEM SOLUÇÃO
// =====================================================

function criarResultadoSemSolucao({

    motivo,

    mensagem,

    inversoresCompativeis = []

}) {

    return {

        encontrado: false,

        tipo: null,

        equipamento: null,

        modelo: null,

        quantidade: 0,

        utilizaParalelismo: false,

        requerAcessorioParalelismo: false,

        acessorioParalelismoModelo: null,

        potenciaNominalUnitariaW: 0,

        potenciaNominalTotalW: 0,

        potenciaTotalExigidaW: 0,

        potenciaPicoExigidaW: 0,

        pico: null,

        motivo,

        mensagem,

        inversoresCompativeis

    };

}


// =====================================================
// VALIDAÇÃO DOS PARÂMETROS
// =====================================================

function validarParametrosSelecao(
    parametros
) {

    if (
        !parametros ||
        typeof parametros !== "object" ||
        Array.isArray(parametros)
    ) {

        throw new TypeError(
            "Os parâmetros de seleção do inversor são inválidos."
        );

    }


    if (
        !Array.isArray(
            parametros.inversores
        )
    ) {

        throw new TypeError(
            "A lista de inversores precisa ser um array."
        );

    }


    if (
        parametros.inversores.length === 0
    ) {

        throw new Error(
            "A lista de inversores está vazia."
        );

    }


    if (
        !parametros.padraoEntrada ||
        typeof parametros.padraoEntrada !==
            "string"
    ) {

        throw new Error(
            "O padrão de entrada não foi informado."
        );

    }


    if (
        !Array.isArray(
            parametros.tensoesCargas
        )
    ) {

        throw new TypeError(
            "As tensões das cargas precisam ser fornecidas em uma lista."
        );

    }


    const potenciaTotal =
        Number(
            parametros.potenciaTotalW
        );


    if (
        !Number.isFinite(potenciaTotal) ||
        potenciaTotal <= 0
    ) {

        throw new Error(
            "A potência total precisa ser maior que zero."
        );

    }


    const potenciaPico =
        Number(
            parametros.potenciaPicoW
        );


    if (
        !Number.isFinite(potenciaPico) ||
        potenciaPico <= 0
    ) {

        throw new Error(
            "A potência de pico precisa ser maior que zero."
        );

    }


    if (
        potenciaPico <
        potenciaTotal
    ) {

        throw new Error(
            "A potência de pico não pode ser menor que a potência total."
        );

    }

}