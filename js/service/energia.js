// =====================================================
// FOXESS STUDIO
// Serviço de cálculos elétricos e energéticos
// =====================================================

import {
    validarAutonomia,
    validarListaCargas,
    validarNumeroNaoNegativo
} from "../utils/validacoes.js";


// =====================================================
// CÁLCULO INDIVIDUAL DE UMA CARGA
// =====================================================

/**
 * Calcula os dados elétricos de uma carga.
 *
 * Estrutura esperada:
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
export function calcularDadosCarga(carga) {

    const potenciaW = Number(carga.potenciaW);

    const quantidade = Number(carga.quantidade);

    const tempoLigadoH = Number(
        carga.tempoLigadoH || 0
    );

    const fatorPotencia = Number(
        carga.fatorPotencia || 1
    );

    const ipIn = Number(
        carga.ipIn || 1
    );


    // Potência informada multiplicada pela quantidade
    const potenciaInstaladaW =
        potenciaW * quantidade;


    /*
     * Mantém, neste primeiro momento, a mesma lógica
     * existente no script.js original:
     *
     * potência considerada =
     * potência × quantidade × fator de potência
     */
    const potenciaConsideradaW =
        potenciaInstaladaW * fatorPotencia;


    // Potência de partida da carga
    const potenciaPicoW =
        potenciaConsideradaW * ipIn;


    // Energia consumida durante o tempo informado
    const energiaTempoLigadoKWh =

        (
            potenciaConsideradaW *
            tempoLigadoH
        )

        / 1000;


    return {

        nome: String(carga.nome || "").trim(),

        tensaoV: String(carga.tensaoV),

        potenciaInformadaW: potenciaW,

        quantidade,

        tempoLigadoH,

        fatorPotencia,

        ipIn,

        potenciaInstaladaW,

        potenciaConsideradaW,

        potenciaPicoW,

        energiaTempoLigadoKWh

    };

}


// =====================================================
// RESUMO DA LISTA DE CARGAS
// =====================================================

/**
 * Calcula os valores totais de uma lista de cargas.
 */
export function calcularResumoCargas(cargas) {

    validarListaCargas(cargas);


    let potenciaInstaladaTotalW = 0;

    let potenciaTotalW = 0;

    let potenciaPicoTotalW = 0;

    let energiaTempoLigadoTotalKWh = 0;


    const tensoes = new Set();

    const cargasCalculadas = cargas.map(carga => {

        const calculo =
            calcularDadosCarga(carga);


        potenciaInstaladaTotalW +=
            calculo.potenciaInstaladaW;


        potenciaTotalW +=
            calculo.potenciaConsideradaW;


        potenciaPicoTotalW +=
            calculo.potenciaPicoW;


        energiaTempoLigadoTotalKWh +=
            calculo.energiaTempoLigadoKWh;


        tensoes.add(calculo.tensaoV);


        return calculo;

    });


    return {

        quantidadeCargas: cargas.length,

        potenciaInstaladaTotalW,

        potenciaTotalW,

        potenciaPicoTotalW,

        energiaTempoLigadoTotalKWh,

        tensoes: [...tensoes],

        cargasCalculadas

    };

}


// =====================================================
// ENERGIA PARA AUTONOMIA
// =====================================================

/**
 * Calcula a energia necessária para sustentar uma
 * potência durante determinada autonomia.
 *
 * Exemplo:
 *
 * 2.000 W durante 3 horas:
 *
 * 2 kW × 3 h = 6 kWh
 */
export function calcularEnergiaPorAutonomia(
    potenciaTotalW,
    autonomiaH
) {

    const potencia =
        validarNumeroNaoNegativo(
            potenciaTotalW,
            "Potência total"
        );


    const autonomia =
        validarAutonomia(autonomiaH);


    return (

        (potencia / 1000)

        *

        autonomia

    );

}


// =====================================================
// CORREÇÃO POR EFICIÊNCIA
// =====================================================

/**
 * Corrige a energia necessária considerando perdas.
 *
 * Exemplo:
 *
 * Energia da carga: 10 kWh
 * Eficiência: 97%
 *
 * Energia necessária no lado da bateria:
 * 10 / 0,97 = 10,31 kWh
 */
export function corrigirEnergiaPorEficiencia(
    energiaKWh,
    eficienciaPercentual
) {

    const energia =
        validarNumeroNaoNegativo(
            energiaKWh,
            "Energia"
        );


    const eficiencia =
        Number(eficienciaPercentual);


    if (
        !Number.isFinite(eficiencia) ||
        eficiencia <= 0 ||
        eficiencia > 100
    ) {

        throw new Error(
            "A eficiência deve ser maior que 0% e menor ou igual a 100%."
        );

    }


    return energia / (eficiencia / 100);

}


// =====================================================
// ENERGIA ÚTIL DE BATERIA
// =====================================================

/**
 * Calcula a energia efetivamente disponível em uma
 * bateria considerando DoD e eficiência.
 */
export function calcularEnergiaUtilBateria(bateria) {

    if (!bateria || typeof bateria !== "object") {

        throw new Error(
            "Os dados da bateria são inválidos."
        );

    }


    const capacidadeKWh =
        Number(bateria.capacity_kwh);


    const dod =
        Number(bateria.dod);


    const eficiencia =
        Number(bateria.round_trip_efficiency);


    if (
        !Number.isFinite(capacidadeKWh) ||
        capacidadeKWh <= 0
    ) {

        throw new Error(
            `Capacidade inválida para a bateria "${bateria.modelo || ""}".`
        );

    }


    if (
        !Number.isFinite(dod) ||
        dod <= 0 ||
        dod > 100
    ) {

        throw new Error(
            `DoD inválido para a bateria "${bateria.modelo || ""}".`
        );

    }


    if (
        !Number.isFinite(eficiencia) ||
        eficiencia <= 0 ||
        eficiencia > 100
    ) {

        throw new Error(
            `Eficiência inválida para a bateria "${bateria.modelo || ""}".`
        );

    }


    return (

        capacidadeKWh

        *

        (dod / 100)

        *

        (eficiencia / 100)

    );

}


// =====================================================
// ENERGIA ÚTIL DE ALL IN ONE
// =====================================================

/**
 * Calcula a energia disponível em uma unidade All in One.
 *
 * No JSON atual, o campo nominal_power_kw representa
 * a capacidade energética integrada do equipamento.
 */
export function calcularEnergiaUtilAllInOne(
    equipamento
) {

    if (
        !equipamento ||
        typeof equipamento !== "object"
    ) {

        throw new Error(
            "Os dados do All in One são inválidos."
        );

    }


    const capacidadeKWh =
        Number(equipamento.nominal_power_kw);


    const dod =
        Number(equipamento.dod);


    const eficiencia =
        Number(equipamento.round_trip_efficiency);


    if (
        !Number.isFinite(capacidadeKWh) ||
        capacidadeKWh <= 0
    ) {

        throw new Error(
            `Capacidade inválida para o All in One "${equipamento.modelo || ""}".`
        );

    }


    if (
        !Number.isFinite(dod) ||
        dod <= 0 ||
        dod > 100
    ) {

        throw new Error(
            `DoD inválido para o All in One "${equipamento.modelo || ""}".`
        );

    }


    if (
        !Number.isFinite(eficiencia) ||
        eficiencia <= 0 ||
        eficiencia > 100
    ) {

        throw new Error(
            `Eficiência inválida para o All in One "${equipamento.modelo || ""}".`
        );

    }


    return (

        capacidadeKWh

        *

        (dod / 100)

        *

        (eficiencia / 100)

    );

}


// =====================================================
// DIMENSIONAMENTO POR QUANTIDADE
// =====================================================

/**
 * Calcula quantas unidades são necessárias para atender
 * determinada energia.
 */
export function calcularQuantidadePorEnergia(
    energiaNecessariaKWh,
    energiaUtilUnidadeKWh
) {

    const energiaNecessaria =
        validarNumeroNaoNegativo(
            energiaNecessariaKWh,
            "Energia necessária"
        );


    const energiaUtil =
        Number(energiaUtilUnidadeKWh);


    if (
        !Number.isFinite(energiaUtil) ||
        energiaUtil <= 0
    ) {

        throw new Error(
            "A energia útil da unidade deve ser maior que zero."
        );

    }


    if (energiaNecessaria === 0) {

        return 0;

    }


    return Math.ceil(
        energiaNecessaria / energiaUtil
    );

}