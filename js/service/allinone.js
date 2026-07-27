// =====================================================
// FOXESS STUDIO
// Dimensionamento de produtos All in One FoxESS
// =====================================================

import {
    calcularEnergiaUtilAllInOne,
    calcularQuantidadePorEnergia,
    corrigirEnergiaPorEficiencia
} from "./energia.js";

import {
    verificarCapacidadeDePico,
    verificarCapacidadeDePicoParalelo
} from "./inversores/pico.js";

import {
    validarTensoesParaPadrao
} from "./inversores/compatibilidade.js";

// =====================================================
// CONFIGURAÇÕES
// =====================================================

const LIMITE_PADRAO_PARALELISMO_AIO = 10;


// =====================================================
// FUNÇÃO PRINCIPAL
// =====================================================

/**
 * Política de seleção:
 *
 * 1. Filtra os modelos eletricamente compatíveis.
 * 2. Procura primeiro um modelo que atenda sozinho à
 *    potência instantânea e à potência de pico.
 * 3. Apenas se nenhum modelo atender sozinho, procura
 *    uma solução em paralelo por potência.
 * 4. Depois de escolher o modelo, calcula quantas
 *    unidades dele são necessárias para a autonomia.
 */
export function selecionarAllInOne(parametros) {

    validarParametrosSelecao(parametros);


    const {
    equipamentos,
    padraoEntrada,
    possuiCargaTrifasica = false,
    tensoesCargas,
    potenciaTotalW,
    potenciaPicoW,
    autonomiaH
} = parametros;


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


let equipamentosCompativeis =
    filtrarAllInOneCompativeis(
    equipamentos,
    padraoEntrada,
    tensoesCargas,
    possuiCargaTrifasica
    );

// ================================================
// FILTRO PARA CARGAS TRIFÁSICAS
// ================================================

if (
    padraoEntrada.includes("Trifásico") &&
    possuiCargaTrifasica
) {

    equipamentosCompativeis =
        equipamentosCompativeis.filter(equipamento => {

            return (
                String(equipamento.fase || "")
                    .toLowerCase()
                    .trim() === "trifasico"
            );

        });

}

if (equipamentosCompativeis.length === 0) {

    return criarResultadoSemSolucao({

        motivo:
            "nenhum_all_in_one_compativel",

        mensagem:
            criarMensagemSemAllInOneCompativel(
                padraoEntrada,
                tensoesCargas
            )

    });

}

    // Ordena do menor para o maior
    const equipamentosOrdenados =
        equipamentosCompativeis

            .slice()

            .sort((a, b) => {

                return (
                    Number(a.max_power_eps) -
                    Number(b.max_power_eps)
                );

            });


    // =================================================
    // 1. SELEÇÃO DO MODELO POR POTÊNCIA
    // =================================================

    let modeloSelecionado = null;

    let quantidadePorPotencia = 1;

    let picoSelecionado = null;


    /*
     * Primeiro procura um único equipamento.
     *
     * Isso garante que:
     *
     * 5,1 kW → P100-7.5-H
     *
     * e não:
     *
     * 2 × P100-5-H
     */
    for (const equipamento of equipamentosOrdenados) {

        const potenciaNominalW =
            Number(
                equipamento.max_power_eps
            );


        if (
            potenciaNominalW <
            potenciaTotalW
        ) {

            continue;

        }


        const pico =
            verificarCapacidadeDePico(
                equipamento,
                potenciaPicoW
            );


        if (!pico.suportado) {

            continue;

        }


        modeloSelecionado =
            equipamento;

        quantidadePorPotencia = 1;

        picoSelecionado =
            pico;

        break;

    }


    // =================================================
    // 2. PARALELISMO SOMENTE SE NENHUM MODELO ATENDER
    // =================================================

    if (!modeloSelecionado) {

        const solucoesPorPotencia = [];


        equipamentosOrdenados.forEach(
            equipamento => {

                const solucao =
                    encontrarQuantidadePorPotencia({

                        equipamento,

                        potenciaTotalW,

                        potenciaPicoW

                    });


                if (solucao) {

                    solucoesPorPotencia.push(
                        solucao
                    );

                }

            }
        );


        if (
            solucoesPorPotencia.length === 0
        ) {

            return criarResultadoSemSolucao({

                motivo:
                    "potencia_nao_atendida",

                mensagem:
                    "Nenhum produto All in One FoxESS atende à potência nominal e à potência de pico dentro do limite permitido de paralelismo.",

                equipamentosCompativeis

            });

        }


        solucoesPorPotencia.sort(
            compararSolucoesPorPotencia
        );


        const melhorSolucao =
            solucoesPorPotencia[0];


        modeloSelecionado =
            melhorSolucao.equipamento;

        quantidadePorPotencia =
            melhorSolucao.quantidade;

        picoSelecionado =
            melhorSolucao.pico;

    }


    // =================================================
    // 3. CÁLCULO DA ENERGIA PARA AUTONOMIA
    // =================================================

    const energiaSemPerdasKWh =

        (
            potenciaTotalW /
            1000
        )

        *

        autonomiaH;


    /*
     * Mantém a lógica que já era usada anteriormente:
     * energia corrigida pela eficiência do equipamento.
     */
    const energiaNecessariaKWh =
        corrigirEnergiaPorEficiencia(
            energiaSemPerdasKWh,
            modeloSelecionado.efficiency
        );


    const energiaUtilUnitariaKWh =
        calcularEnergiaUtilAllInOne(
            modeloSelecionado
        );


    const quantidadePorEnergia =
        calcularQuantidadePorEnergia(
            energiaNecessariaKWh,
            energiaUtilUnitariaKWh
        );


    /*
     * O modelo já foi escolhido pela potência.
     *
     * Agora apenas aumentamos a quantidade desse mesmo
     * modelo caso a autonomia exija mais energia.
     */
const quantidadeFinal =
    Math.max(
        quantidadePorPotencia,
        1
    );


    const limiteParalelismo =
        obterLimiteParalelismoAllInOne(
            modeloSelecionado
        );


    if (
        quantidadeFinal >
        limiteParalelismo
    ) {

        return criarResultadoSemSolucao({

            motivo:
                "limite_paralelismo_excedido",

            mensagem:
                `O modelo ${modeloSelecionado.modelo} exigiria ${quantidadeFinal} unidades, mas permite no máximo ${limiteParalelismo} unidades em paralelo.`,

            equipamentosCompativeis

        });

    }


    // =================================================
    // 4. VERIFICAÇÃO FINAL DO PICO
    // =================================================

    const picoFinal =
        quantidadeFinal === 1

            ? verificarCapacidadeDePico(
                modeloSelecionado,
                potenciaPicoW
            )

            : verificarCapacidadeDePicoParalelo(
                modeloSelecionado,
                quantidadeFinal,
                potenciaPicoW
            );


    if (!picoFinal.suportado) {

        return criarResultadoSemSolucao({

            motivo:
                "potencia_pico_nao_atendida",

            mensagem:
                "O produto All in One selecionado não suporta a potência de pico informada.",

            equipamentosCompativeis

        });

    }


    // =================================================
    // 5. RESULTADO FINAL
    // =================================================

    const utilizaParalelismo =
        quantidadeFinal > 1;


    const capacidadeNominalUnitariaKWh =
        Number(
            modeloSelecionado.nominal_power_kw
        );


    const potenciaNominalUnitariaW =
        Number(
            modeloSelecionado.max_power_eps
        );


    const energiaUtilTotalKWh =
        energiaUtilUnitariaKWh *
        quantidadeFinal;

    const atendeAutonomia =
         energiaUtilTotalKWh >=
        energiaNecessariaKWh;


    return {

        encontrado: true,

        tipo:
            utilizaParalelismo
                ? "paralelo"
                : "unitario",

        equipamento:
            modeloSelecionado,

        modelo:
            modeloSelecionado.modelo,

        quantidade:
            quantidadeFinal,

        utilizaParalelismo,

        /*
         * Indica por que a quantidade aumentou.
         */
        quantidadePorPotencia,

        quantidadePorEnergia,

        requerAcessorioParalelismo:

            utilizaParalelismo &&

            Boolean(
                modeloSelecionado
                    .parallel_accessory_model
            ),

        acessorioParalelismoModelo:

            utilizaParalelismo

                ? (
                    modeloSelecionado
                        .parallel_accessory_model ||
                    null
                )

                : null,

        potenciaNominalUnitariaW,

        potenciaNominalTotalW:

            potenciaNominalUnitariaW *
            quantidadeFinal,

        capacidadeNominalUnitariaKWh,

        capacidadeNominalTotalKWh:

            capacidadeNominalUnitariaKWh *
            quantidadeFinal,

        energiaUtilUnitariaKWh,

        energiaUtilTotalKWh,

        energiaNecessariaKWh,

        sobraEnergiaKWh:

            energiaUtilTotalKWh -
            energiaNecessariaKWh,

        potenciaTotalExigidaW:
            potenciaTotalW,

        potenciaPicoExigidaW:
            potenciaPicoW,

        pico:
            picoFinal,

        equipamentosCompativeis,

        atendeAutonomia,
        autonomiaInsuficiente:
        !atendeAutonomia,

        mensagem:

    !atendeAutonomia

        ? `O modelo ${modeloSelecionado.modelo} atende à potência das cargas, mas a capacidade integrada não atende completamente à autonomia solicitada.`

        : (
            utilizaParalelismo

                ? `${quantidadeFinal} unidades ${modeloSelecionado.modelo} foram selecionadas.`

                : "All in One selecionado com sucesso."
        )

    };

}


// =====================================================
// PARALELISMO POR POTÊNCIA
// =====================================================

function encontrarQuantidadePorPotencia({

    equipamento,

    potenciaTotalW,

    potenciaPicoW

}) {

    validarAllInOne(
        equipamento
    );


    const potenciaUnitariaW =
        Number(
            equipamento.max_power_eps
        );


    const limite =
        obterLimiteParalelismoAllInOne(
            equipamento
        );


    let quantidade =
        Math.max(
            Math.ceil(
                potenciaTotalW /
                potenciaUnitariaW
            ),
            2
        );


    while (
        quantidade <= limite
    ) {

        const potenciaNominalTotalW =
            potenciaUnitariaW *
            quantidade;


        const pico =
            verificarCapacidadeDePicoParalelo(
                equipamento,
                quantidade,
                potenciaPicoW
            );


        if (
            potenciaNominalTotalW >=
                potenciaTotalW &&
            pico.suportado
        ) {

            return {

                equipamento,

                quantidade,

                potenciaNominalTotalW,

                sobraPotenciaW:

                    potenciaNominalTotalW -
                    potenciaTotalW,

                pico

            };

        }


        quantidade++;

    }


    return null;

}


// =====================================================
// COMPARAÇÃO POR POTÊNCIA
// =====================================================

function compararSolucoesPorPotencia(
    solucaoA,
    solucaoB
) {

    // Menor quantidade de unidades
    if (
        solucaoA.quantidade !==
        solucaoB.quantidade
    ) {

        return (
            solucaoA.quantidade -
            solucaoB.quantidade
        );

    }


    // Menor sobra de potência
    if (
        solucaoA.sobraPotenciaW !==
        solucaoB.sobraPotenciaW
    ) {

        return (
            solucaoA.sobraPotenciaW -
            solucaoB.sobraPotenciaW
        );

    }


    // Menor potência unitária
    return (

        Number(
            solucaoA
                .equipamento
                .max_power_eps
        )

        -

        Number(
            solucaoB
                .equipamento
                .max_power_eps
        )

    );

}


// =====================================================
// COMPATIBILIDADE
// =====================================================

// =====================================================
// COMPATIBILIDADE
// =====================================================

function filtrarAllInOneCompativeis(
    equipamentos,
    padraoEntrada,
    tensoesCargas = [],
    possuiCargaTrifasica = false
) {

const tagsCompativeis =
    obterTagsAllInOneCompativeis(
        padraoEntrada,
        tensoesCargas,
        possuiCargaTrifasica
    );


    return equipamentos.filter(
        equipamento => {

            return tagsCompativeis.includes(
                String(
                    equipamento.rated_voltage
                ).trim()
            );

        }
    );

}


export function obterTagsAllInOneCompativeis(
    padraoEntrada,
    tensoesCargas = [],
    possuiCargaTrifasica = false
) {

    const texto =
        normalizarTexto(
            padraoEntrada
        );


    const tensoes =
        normalizarListaTensoes(
            tensoesCargas
        );


    let tensoesDisponiveis = [];


    if (
        texto.includes("monofasico")
    ) {

        tensoesDisponiveis = ["220"];

    }

    else if (
        texto.includes("bifasico")
    ) {

        tensoesDisponiveis = [
            "127",
            "220"
        ];

    }

    else if (
        texto.includes("trifasico") &&
        texto.includes("127") &&
        texto.includes("220")
    ) {

        tensoesDisponiveis = [
            "127",
            "220"
        ];

    }

    else if (
        texto.includes("trifasico") &&
        texto.includes("220") &&
        texto.includes("380")
    ) {

        tensoesDisponiveis = [
            "220",
            "380"
        ];

    }


    if (tensoes.length === 0) {

        return tensoesDisponiveis;

    }


    /*
     * Os AIO cadastrados são monofásicos e fornecem
     * uma única tensão de saída. Portanto, um único
     * modelo só atende cargas em uma única tensão.
     */
// Se houver cargas em mais de uma tensão
if (tensoes.length > 1) {

    // Havendo carga trifásica, somente AIO trifásico poderá atender
    if (possuiCargaTrifasica) {

        return [];

    }

    // Não há carga trifásica:
    // permite os AIO compatíveis com as tensões disponíveis.
    return tensoesDisponiveis;

}

const tensaoCarga =
    tensoes[0];

return tensoesDisponiveis.includes(
    tensaoCarga
)
    ? [tensaoCarga]
    : [];

}


function criarMensagemSemAllInOneCompativel(
    padraoEntrada,
    tensoesCargas
) {

    const tensoes =
        normalizarListaTensoes(
            tensoesCargas
        );


    if (tensoes.length > 1) {

        return (
            "Os produtos All in One cadastrados são monofásicos e " +
            "fornecem uma única tensão de saída. Não é possível " +
            `atender simultaneamente cargas em ${
                tensoes.join(" V e ")
            } V com um único modelo.`
        );

    }


    const descricaoTensao =
        tensoes.length === 1
            ? ` e cargas em ${tensoes[0]} V`
            : "";


    return (
        "Nenhum produto All in One FoxESS é compatível com o " +
        `padrão de entrada ${padraoEntrada}${descricaoTensao}.`
    );

}


function normalizarListaTensoes(
    tensoes
) {

    if (!Array.isArray(tensoes)) {

        return [];

    }


    return [
        ...new Set(
            tensoes
                .map(tensao =>
                    String(tensao).trim()
                )
                .filter(Boolean)
        )
    ];

}


// =====================================================
// LIMITE DE PARALELISMO
// =====================================================

export function obterLimiteParalelismoAllInOne(
    equipamento
) {

    validarAllInOne(
        equipamento
    );


    const limiteProduto =
        Number(
            equipamento.max_parallel_units
        );


    if (
        Number.isInteger(limiteProduto) &&
        limiteProduto > 0
    ) {

        return limiteProduto;

    }


    return LIMITE_PADRAO_PARALELISMO_AIO;

}


// =====================================================
// RESULTADO SEM SOLUÇÃO
// =====================================================

function criarResultadoSemSolucao({

    motivo,

    mensagem,

    equipamentosCompativeis = []

}) {

    return {

        encontrado: false,

        tipo: null,

        equipamento: null,

        modelo: null,

        quantidade: 0,

        utilizaParalelismo: false,

        quantidadePorPotencia: 0,

        quantidadePorEnergia: 0,

        requerAcessorioParalelismo: false,

        acessorioParalelismoModelo: null,

        potenciaNominalUnitariaW: 0,

        potenciaNominalTotalW: 0,

        capacidadeNominalUnitariaKWh: 0,

        capacidadeNominalTotalKWh: 0,

        energiaUtilUnitariaKWh: 0,

        energiaUtilTotalKWh: 0,

        energiaNecessariaKWh: 0,

        sobraEnergiaKWh: 0,

        pico: null,

        motivo,

        mensagem,

        equipamentosCompativeis

    };

}


// =====================================================
// VALIDAÇÕES
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
            "Os parâmetros de seleção do All in One são inválidos."
        );

    }


    if (
        !Array.isArray(
            parametros.equipamentos
        ) ||
        parametros.equipamentos.length === 0
    ) {

        throw new Error(
            "A lista de produtos All in One está vazia ou é inválida."
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


    const autonomia =
        Number(
            parametros.autonomiaH
        );


    if (
        !Number.isFinite(autonomia) ||
        autonomia <= 0
    ) {

        throw new Error(
            "A autonomia precisa ser maior que zero."
        );

    }

}


function validarAllInOne(
    equipamento
) {

    if (
        !equipamento ||
        typeof equipamento !== "object" ||
        Array.isArray(equipamento)
    ) {

        throw new Error(
            "Os dados do All in One são inválidos."
        );

    }


    const potencia =
        Number(
            equipamento.max_power_eps
        );


    if (
        !Number.isFinite(potencia) ||
        potencia <= 0
    ) {

        throw new Error(
            `O All in One "${equipamento.modelo || ""}" possui potência EPS inválida.`
        );

    }


    const capacidade =
        Number(
            equipamento.nominal_power_kw
        );


    if (
        !Number.isFinite(capacidade) ||
        capacidade <= 0
    ) {

        throw new Error(
            `O All in One "${equipamento.modelo || ""}" possui capacidade energética inválida.`
        );

    }

}


// =====================================================
// NORMALIZAÇÃO
// =====================================================

function normalizarTexto(
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