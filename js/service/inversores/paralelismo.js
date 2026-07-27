// =====================================================
// FOXESS STUDIO
// Dimensionamento de inversores em paralelo
// =====================================================

import {
    verificarCapacidadeDePicoParalelo
} from "./pico.js";


// =====================================================
// CONFIGURAÇÃO
// =====================================================

// Limite provisório de segurança.
//
// Depois podemos substituir por um limite específico
// para cada linha de produto dentro do produtos.json.
export const LIMITE_PADRAO_PARALELISMO = 10;


// =====================================================
// QUANTIDADE MÍNIMA POR POTÊNCIA NOMINAL
// =====================================================

/**
 * Calcula quantos inversores são necessários para
 * atender somente à potência nominal das cargas.
 */
export function calcularQuantidadePorPotenciaNominal(
    inversor,
    potenciaTotalW
) {

    validarInversor(inversor);

    const potenciaExigida =
        validarPotenciaNaoNegativa(
            potenciaTotalW,
            "Potência total"
        );


    if (potenciaExigida === 0) {

        return 0;

    }


    return Math.ceil(
        potenciaExigida /
        Number(inversor.max_power_eps)
    );

}


// =====================================================
// VERIFICAÇÃO DE UMA QUANTIDADE
// =====================================================

/**
 * Verifica se determinada quantidade de inversores
 * atende simultaneamente:
 *
 * - potência nominal;
 * - potência de pico.
 */
export function verificarParalelismo(
    inversor,
    quantidade,
    potenciaTotalW,
    potenciaPicoW
) {

    validarInversor(inversor);

    const quantidadeValidada =
        validarQuantidadeInteiraPositiva(
            quantidade
        );


    const potenciaTotal =
        validarPotenciaNaoNegativa(
            potenciaTotalW,
            "Potência total"
        );


    const potenciaPico =
        validarPotenciaNaoNegativa(
            potenciaPicoW,
            "Potência de pico"
        );


    const potenciaNominalTotalW =
        Number(inversor.max_power_eps) *
        quantidadeValidada;


    const atendePotenciaNominal =
        potenciaNominalTotalW >=
        potenciaTotal;


    const pico =
        verificarCapacidadeDePicoParalelo(
            inversor,
            quantidadeValidada,
            potenciaPico
        );


    return {

        atende: (
            atendePotenciaNominal &&
            pico.suportado
        ),

        atendePotenciaNominal,

        atendePotenciaPico:
            pico.suportado,

        quantidade:
            quantidadeValidada,

        potenciaNominalTotalW,

        potenciaPicoExigidaW:
            potenciaPico,

        pico

    };

}


// =====================================================
// BUSCA DA QUANTIDADE MÍNIMA
// =====================================================

/**
 * Encontra a menor quantidade de unidades em paralelo
 * capaz de atender potência nominal e potência de pico.
 *
 * Retorna null quando não encontra uma solução dentro
 * do limite permitido.
 */
export function encontrarQuantidadeMinimaParalelo(
    inversor,
    potenciaTotalW,
    potenciaPicoW,
    limiteParalelismo = LIMITE_PADRAO_PARALELISMO
) {

    validarInversor(inversor);


    const potenciaTotal =
        validarPotenciaNaoNegativa(
            potenciaTotalW,
            "Potência total"
        );


    const potenciaPico =
        validarPotenciaNaoNegativa(
            potenciaPicoW,
            "Potência de pico"
        );


    const limite =
        validarQuantidadeInteiraPositiva(
            limiteParalelismo,
            "Limite de paralelismo"
        );


    /*
     * Começamos pela quantidade mínima necessária
     * para potência nominal.
     *
     * Assim evitamos testar quantidades que já sabemos
     * que não atendem à potência contínua.
     */
    let quantidadeInicial =
        calcularQuantidadePorPotenciaNominal(
            inversor,
            potenciaTotal
        );


    if (quantidadeInicial < 1) {

        quantidadeInicial = 1;

    }


    for (
        let quantidade = quantidadeInicial;
        quantidade <= limite;
        quantidade++
    ) {

        const verificacao =
            verificarParalelismo(
                inversor,
                quantidade,
                potenciaTotal,
                potenciaPico
            );


        if (verificacao.atende) {

            return verificacao;

        }

    }


    return null;

}


// =====================================================
// COMPARAÇÃO ENTRE SOLUÇÕES
// =====================================================

/**
 * Compara duas soluções de paralelismo.
 *
 * Critérios:
 *
 * 1. menor quantidade de inversores;
 * 2. menor potência nominal excedente;
 * 3. maior duração de suporte ao pico.
 */
export function compararSolucoesParalelo(
    solucaoA,
    solucaoB,
    potenciaTotalW
) {

    if (!solucaoA && !solucaoB) {
        return 0;
    }

    if (!solucaoA) {
        return 1;
    }

    if (!solucaoB) {
        return -1;
    }


    if (
        solucaoA.quantidade !==
        solucaoB.quantidade
    ) {

        return (
            solucaoA.quantidade -
            solucaoB.quantidade
        );

    }


    const excedenteA =
        solucaoA.potenciaNominalTotalW -
        potenciaTotalW;


    const excedenteB =
        solucaoB.potenciaNominalTotalW -
        potenciaTotalW;


    if (excedenteA !== excedenteB) {

        return excedenteA - excedenteB;

    }


    const tempoA =
        solucaoA.pico.tempo ?? Infinity;


    const tempoB =
        solucaoB.pico.tempo ?? Infinity;


    return tempoB - tempoA;

}


// =====================================================
// RESUMO DA SOLUÇÃO
// =====================================================

/**
 * Gera um objeto resumido para facilitar o uso
 * na interface e no seletor de inversores.
 */
export function resumirSolucaoParalelo(
    inversor,
    verificacao
) {

    validarInversor(inversor);


    if (
        !verificacao ||
        typeof verificacao !== "object"
    ) {

        throw new Error(
            "A verificação de paralelismo é inválida."
        );

    }


    return {

        modelo:
            inversor.modelo,

        equipamento:
            inversor,

        quantidade:
            verificacao.quantidade,

        utilizaParalelismo:
            verificacao.quantidade > 1,

        potenciaNominalUnitáriaW:
            Number(inversor.max_power_eps),

        potenciaNominalTotalW:
            verificacao.potenciaNominalTotalW,

        atendePotenciaNominal:
            verificacao.atendePotenciaNominal,

        atendePotenciaPico:
            verificacao.atendePotenciaPico,

        pico:
            verificacao.pico,

        requerAcessorioParalelismo:

            verificacao.quantidade > 1 &&

            Boolean(
                inversor.parallel_accessory_model
            ),

        acessorioParalelismoModelo:

            verificacao.quantidade > 1

                ? (
                    inversor.parallel_accessory_model
                    || null
                )

                : null

    };

}


// =====================================================
// LIMITE ESPECÍFICO DO EQUIPAMENTO
// =====================================================

/**
 * Obtém o limite de paralelismo do produto.
 *
 * Futuramente, cada inversor poderá ter no JSON:
 *
 * "max_parallel_units": 6
 *
 * Enquanto o campo não existir, utiliza o limite padrão.
 */
export function obterLimiteParalelismo(
    inversor,
    limitePadrao = LIMITE_PADRAO_PARALELISMO
) {

    validarInversor(inversor);


    const limiteDoProduto =
        Number(inversor.max_parallel_units);


    if (
        Number.isInteger(limiteDoProduto) &&
        limiteDoProduto > 0
    ) {

        return limiteDoProduto;

    }


    return validarQuantidadeInteiraPositiva(
        limitePadrao,
        "Limite padrão de paralelismo"
    );

}


// =====================================================
// FUNÇÕES INTERNAS
// =====================================================

function validarInversor(inversor) {

    if (
        !inversor ||
        typeof inversor !== "object" ||
        Array.isArray(inversor)
    ) {

        throw new Error(
            "Os dados do inversor são inválidos."
        );

    }


    const potenciaNominal =
        Number(inversor.max_power_eps);


    if (
        !Number.isFinite(potenciaNominal) ||
        potenciaNominal <= 0
    ) {

        throw new Error(
            `O inversor "${inversor.modelo || ""}" não possui potência EPS válida.`
        );

    }

}


function validarPotenciaNaoNegativa(
    valor,
    nomeCampo
) {

    const numero = Number(valor);


    if (
        !Number.isFinite(numero) ||
        numero < 0
    ) {

        throw new Error(
            `${nomeCampo} deve ser um número maior ou igual a zero.`
        );

    }


    return numero;

}


function validarQuantidadeInteiraPositiva(
    valor,
    nomeCampo = "Quantidade"
) {

    const numero = Number(valor);


    if (
        !Number.isInteger(numero) ||
        numero <= 0
    ) {

        throw new Error(
            `${nomeCampo} deve ser um número inteiro maior que zero.`
        );

    }


    return numero;

}