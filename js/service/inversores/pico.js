// =====================================================
// FOXESS STUDIO
// Verificação de potência de pico
// =====================================================


/**
 * Verifica se um equipamento suporta determinada
 * potência de pico.
 *
 * Retorna:
 *
 * {
 *    suportado: true,
 *    tempo: 60
 * }
 *
 * ou
 *
 * {
 *    suportado: true,
 *    tempo: null
 * }
 *
 * tempo = null significa que a potência está
 * dentro da potência nominal contínua.
 */
export function verificarCapacidadeDePico(
    equipamento,
    potenciaPicoW
) {

    validarEquipamento(equipamento);

    const potenciaNominal =
        Number(equipamento.max_power_eps);


    if (potenciaPicoW <= potenciaNominal) {

        return {

            suportado: true,

            tempo: null,

            potenciaNominal,

            potenciaPicoSuportada: potenciaNominal

        };

    }


    const faixas = obterFaixasDePico(equipamento);


    let melhorFaixa = null;


    for (const faixa of faixas) {

        if (faixa.potencia >= potenciaPicoW) {

            if (
                !melhorFaixa ||
                faixa.tempo > melhorFaixa.tempo
            ) {

                melhorFaixa = faixa;

            }

        }

    }


    if (melhorFaixa) {

        return {

            suportado: true,

            tempo: melhorFaixa.tempo,

            potenciaNominal,

            potenciaPicoSuportada:
                melhorFaixa.potencia

        };

    }


    return {

        suportado: false,

        tempo: null,

        potenciaNominal,

        potenciaPicoSuportada: 0

    };

}



/**
 * Verifica a capacidade de pico considerando
 * várias unidades em paralelo.
 */
export function verificarCapacidadeDePicoParalelo(
    equipamento,
    quantidade,
    potenciaPicoW
) {

    validarEquipamento(equipamento);


    if (quantidade < 1) {

        throw new Error(
            "Quantidade inválida."
        );

    }


    const equipamentoVirtual = {

        max_power_eps:
            equipamento.max_power_eps * quantidade

    };


    const faixas = obterFaixasDePico(equipamento);


    faixas.forEach(faixa => {

        equipamentoVirtual[
            `peak_power_${faixa.tempo}s`
        ] =

            faixa.potencia * quantidade;

    });


    return verificarCapacidadeDePico(
        equipamentoVirtual,
        potenciaPicoW
    );

}



/**
 * Retorna todas as faixas de potência de pico
 * cadastradas no equipamento.
 *
 * Exemplo:
 *
 * [
 *   {tempo:10,potencia:15000},
 *   {tempo:30,potencia:12000},
 *   {tempo:60,potencia:10000}
 * ]
 */
export function obterFaixasDePico(
    equipamento
) {

    validarEquipamento(equipamento);


    const faixas = [];


    Object.entries(equipamento)

        .forEach(([campo, valor]) => {

            const resultado =

                campo.match(
                    /^peak_power_(\d+)s$/i
                );


            if (!resultado) {

                return;

            }


            const tempo =
                Number(resultado[1]);


            const potencia =
                Number(valor);


            if (

                Number.isFinite(tempo) &&

                Number.isFinite(potencia)

            ) {

                faixas.push({

                    tempo,

                    potencia

                });

            }

        });


    faixas.sort(

        (a, b) => a.tempo - b.tempo

    );


    return faixas;

}



/**
 * Retorna a maior potência de pico cadastrada.
 */
export function obterMaiorPotenciaDePico(
    equipamento
) {

    const faixas =
        obterFaixasDePico(equipamento);


    if (faixas.length === 0) {

        return equipamento.max_power_eps;

    }


    return Math.max(

        ...faixas.map(

            faixa => faixa.potencia

        )

    );

}



/**
 * Informa se o equipamento possui
 * alguma capacidade de pico cadastrada.
 */
export function possuiPotenciaDePico(
    equipamento
) {

    return obterFaixasDePico(
        equipamento
    ).length > 0;

}



/**
 * Retorna a duração máxima
 * cadastrada para potência de pico.
 */
export function obterMaiorTempoDePico(
    equipamento
) {

    const faixas =
        obterFaixasDePico(equipamento);


    if (faixas.length === 0) {

        return 0;

    }


    return Math.max(

        ...faixas.map(

            faixa => faixa.tempo

        )

    );

}



/**
 * Retorna um resumo amigável.
 */
export function resumirPotenciaDePico(
    equipamento
) {

    const faixas =
        obterFaixasDePico(
            equipamento
        );


    if (faixas.length === 0) {

        return "Equipamento sem capacidade de pico cadastrada.";

    }


    return faixas

        .map(

            faixa =>

                `${(faixa.potencia/1000).toFixed(2)} kW por ${faixa.tempo}s`

        )

        .join(" | ");

}



// =====================================================
// FUNÇÕES INTERNAS
// =====================================================

function validarEquipamento(
    equipamento
) {

    if (

        !equipamento ||

        typeof equipamento !== "object"

    ) {

        throw new Error(
            "Equipamento inválido."
        );

    }


    if (

        !Number.isFinite(

            Number(equipamento.max_power_eps)

        )

    ) {

        throw new Error(
            "O equipamento não possui potência nominal."
        );

    }

}