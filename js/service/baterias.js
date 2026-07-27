// =====================================================
// FOXESS STUDIO
// Dimensionamento e seleção de baterias FoxESS
// =====================================================

import {
    calcularEnergiaUtilBateria,
    calcularQuantidadePorEnergia
} from "./energia.js";


// =====================================================
// CONFIGURAÇÕES
// =====================================================

// Quantidade máxima de baterias convencionais por
// entrada quando é utilizada uma Junction Box.
const BATERIAS_POR_JUNCTION_BOX = 4;


// =====================================================
// FUNÇÃO PRINCIPAL
// =====================================================

export function selecionarBateria(parametros) {

    validarParametrosSelecao(parametros);

    const {
        baterias,
        inversor,
        quantidadeInversores,
        energiaNecessariaKWh,
        acessorios = []
    } = parametros;


    const capacidadeConexao =
        calcularCapacidadeConexaoBaterias(
            inversor,
            quantidadeInversores
        );


    const candidatos = [];


    baterias.forEach(bateria => {

        if (
            !bateriaCompativelComInversor(
                bateria,
                inversor
            )
        ) {

            return;

        }


        const solucao =
            bateria.modular
                ? avaliarBateriaModular({
                    bateria,
                    energiaNecessariaKWh,
                    quantidadeInversores
                })
                : avaliarBateria({
                    bateria,
                    energiaNecessariaKWh,
                    capacidadeConexao
                });


        if (solucao) {

            candidatos.push(solucao);

        }

    });


    if (candidatos.length === 0) {

        return criarResultadoSemSolucao({

            motivo:
                "nenhuma_bateria_compativel",

            mensagem:
                "Nenhuma bateria FoxESS atende à energia necessária dentro dos limites do inversor."

        });

    }


    candidatos.sort(
        compararSolucoesBateria
    );


    const melhorSolucao =
        candidatos[0];


    const junctionBox =
        melhorSolucao.modular
            ? criarJunctionBoxNaoAplicavel()
            : calcularJunctionBox({

                quantidadeBaterias:
                    melhorSolucao.quantidade,

                capacidadeConexao,

                acessorios

            });


    return {

        encontrado: true,

        bateria:
            melhorSolucao.bateria,

        modelo:
            melhorSolucao.modelo,

        quantidade:
            melhorSolucao.quantidade,
        
        distribuicaoDiferente:
        melhorSolucao.distribuicaoDiferente,

        modular:
            Boolean(
                melhorSolucao.modular
            ),

        composicao:
            melhorSolucao.composicao || null,

        capacidadeNominalTotalKWh:
            melhorSolucao
                .capacidadeNominalTotalKWh,

        energiaUtilUnitariaKWh:
            melhorSolucao
                .energiaUtilUnitariaKWh,

        energiaUtilTotalKWh:
            melhorSolucao
                .energiaUtilTotalKWh,

        energiaNecessariaKWh,

        sobraEnergiaKWh:
            melhorSolucao.sobraEnergiaKWh,

        capacidadeConexao,

        utilizaJunctionBox:
            junctionBox.utiliza,

        junctionBox,

        candidatos,

        mensagem:
            "Bateria selecionada com sucesso."

    };

}


// =====================================================
// BATERIAS CONVENCIONAIS
// =====================================================

export function avaliarBateria({

    bateria,

    energiaNecessariaKWh,

    capacidadeConexao

}) {

    validarBateria(bateria);


    const energiaUtilUnitariaKWh =
        calcularEnergiaUtilBateria(
            bateria
        );


    const quantidade =
        calcularQuantidadePorEnergia(
            energiaNecessariaKWh,
            energiaUtilUnitariaKWh
        );
    
    const distribuicaoDiferente =
    capacidadeConexao.quantidadeInversores > 1 &&
    quantidade % capacidadeConexao.quantidadeInversores !== 0;


    if (quantidade <= 0) {

        return null;

    }


    if (
        quantidade >
        capacidadeConexao.maximoComJunctionBox
    ) {

        return null;

    }


    const energiaUtilTotalKWh =
        energiaUtilUnitariaKWh *
        quantidade;


    const capacidadeNominalTotalKWh =
        Number(bateria.capacity_kwh) *
        quantidade;


    const sobraEnergiaKWh =
        energiaUtilTotalKWh -
        energiaNecessariaKWh;


    return {

        bateria,

        modelo:
            bateria.modelo,

        quantidade,
        distribuicaoDiferente,

        modular: false,

        composicao: null,

        capacidadeNominalTotalKWh,

        energiaUtilUnitariaKWh,

        energiaUtilTotalKWh,

        sobraEnergiaKWh,

        precisaJunctionBox:
            quantidade >
            capacidadeConexao
                .maximoSemJunctionBox

    };

}


// =====================================================
// BATERIAS MODULARES CQ6 E CQ16
// =====================================================

function avaliarBateriaModular({

    bateria,

    energiaNecessariaKWh,

    quantidadeInversores

}) {

    validarBateria(bateria);


    const quantidadeInversoresValidada =
        validarQuantidadeInteiraPositiva(
            quantidadeInversores,
            "Quantidade de inversores"
        );



    const limitesPorInversor =
        Array.isArray(
            bateria.stack_thresholds
        )
            ? bateria.stack_thresholds
                .map(Number)
                .filter(Number.isFinite)
            : [];


    if (limitesPorInversor.length === 0) {

        return null;

    }


    const minimoPorInversor =
        Number(
            bateria.min_modules
        );


    if (
        !Number.isInteger(minimoPorInversor) ||
        minimoPorInversor <= 0
    ) {

        return null;

    }


    const energiaUtilModuloKWh =
        calcularEnergiaUtilBateria(
            bateria
        );


    const quantidadeCalculada =
        calcularQuantidadePorEnergia(
            energiaNecessariaKWh,
            energiaUtilModuloKWh
        );


    /*
     * Cada H3 Plus precisa receber pelo menos a
     * quantidade mínima de módulos definida no JSON.
     */
    const quantidadeMinima =
        minimoPorInversor *
        quantidadeInversoresValidada;


    const quantidade = Math.max(
        quantidadeCalculada,
        quantidadeMinima
    );


    const maximoPorInversor =
        limitesPorInversor[
            limitesPorInversor.length - 1
        ];


    const quantidadeMaxima =
        maximoPorInversor *
        quantidadeInversoresValidada;


    if (quantidade > quantidadeMaxima) {

        return null;

    }


    const distribuicaoInversores =
        distribuirQuantidade(
            quantidade,
            quantidadeInversoresValidada
        );

    const distribuicaoDiferente =
    new Set(distribuicaoInversores).size > 1;


    /*
     * Verifica quantos bancos cada inversor precisa.
     */
    const bancosPorInversor =
        distribuicaoInversores.map(
            quantidadeModulos => {

                return calcularQuantidadeBancos(
                    quantidadeModulos,
                    limitesPorInversor
                );

            }
        );


    if (
        bancosPorInversor.some(
            quantidadeBancos =>
                quantidadeBancos <= 0
        )
    ) {

        return null;

    }


    const quantidadeBancos =
        bancosPorInversor.reduce(
            (total, quantidadeBanco) =>
                total + quantidadeBanco,
            0
        );


    const energiaUtilTotalKWh =
        energiaUtilModuloKWh *
        quantidade;


    const capacidadeNominalTotalKWh =
        Number(bateria.capacity_kwh) *
        quantidade;


    const composicao =
        criarComposicaoBateriaModular({

            bateria,

            quantidadeModulos:
                quantidade,

            quantidadeBancos,

            bancosPorInversor,

            distribuicaoInversores

        });


    return {

        bateria,

        modelo:
            bateria.modelo,

        quantidade,

        distribuicaoDiferente,

        modular: true,

        composicao,

        capacidadeNominalTotalKWh,

        energiaUtilUnitariaKWh:
            energiaUtilModuloKWh,

        energiaUtilTotalKWh,

        sobraEnergiaKWh:
            energiaUtilTotalKWh -
            energiaNecessariaKWh,

        precisaJunctionBox: false

    };

}


// =====================================================
// COMPATIBILIDADE ENTRE BATERIA E INVERSOR
// =====================================================

function bateriaCompativelComInversor(
    bateria,
    inversor
) {

    const familiasInversor =
        Array.isArray(
            inversor.battery_families
        )
            ? inversor.battery_families
            : [];


    const familiasBateria =
        Array.isArray(
            bateria.compatible_inverter_families
        )
            ? bateria
                .compatible_inverter_families
            : [];


    /*
     * Quando o inversor possui battery_families,
     * somente as baterias dessas famílias poderão
     * ser selecionadas.
     *
     * Exemplo no H3 Plus:
     *
     * "battery_families": ["CQ6", "CQ16"]
     */
    if (familiasInversor.length > 0) {

        return familiasInversor.includes(
            bateria.familia_bateria
        );

    }


    /*
     * Inversores residenciais que não possuem
     * battery_families continuam utilizando somente
     * baterias convencionais.
     *
     * Isso impede CQ6 ou CQ16 de serem selecionadas
     * para um inversor incompatível.
     */
    return familiasBateria.length === 0;

}


// =====================================================
// QUANTIDADE DE BANCOS
// =====================================================

function calcularQuantidadeBancos(
    quantidadeModulos,
    limites
) {

    const indice =
        limites.findIndex(
            limite =>
                quantidadeModulos <= limite
        );


    return indice >= 0
        ? indice + 1
        : 0;

}


// =====================================================
// DISTRIBUIÇÃO ENTRE INVERSORES
// =====================================================

function distribuirQuantidade(
    quantidade,
    grupos
) {

    const quantidadeBase =
        Math.floor(
            quantidade / grupos
        );


    const restante =
        quantidade % grupos;


    return Array.from(
        { length: grupos },
        (_, indice) => {

            return (
                quantidadeBase +
                (
                    indice < restante
                        ? 1
                        : 0
                )
            );

        }
    );

}


// =====================================================
// COMPOSIÇÃO CQ6 E CQ16
// =====================================================

function criarComposicaoBateriaModular({

    bateria,

    quantidadeModulos,

    quantidadeBancos,

    bancosPorInversor,

    distribuicaoInversores

}) {

    const familia =
        String(
            bateria.familia_bateria || ""
        ).trim();


    /*
     * CQ6:
     *
     * Cada banco precisa de um módulo mestre CQ6-M.
     * Os outros módulos do banco são CQ6-S.
     */
    if (familia === "CQ6") {

        return {

            familia,

            quantidadeModulos,

            quantidadeBancos,

            quantidadeMestres:
                quantidadeBancos,

            quantidadeEscravos:
                quantidadeModulos -
                quantidadeBancos,

            quantidadeCQBOX: 0,

            bancosPorInversor,

            modulosPorInversor:
                distribuicaoInversores

        };

    }


    /*
     * CQ16:
     *
     * Cada banco precisa de uma CQBOX.
     */
    return {

        familia,

        quantidadeModulos,

        quantidadeBancos,

        quantidadeMestres: 0,

        quantidadeEscravos: 0,

        quantidadeCQBOX:
            quantidadeBancos,

        bancosPorInversor,

        modulosPorInversor:
            distribuicaoInversores

    };

}


// =====================================================
// JUNCTION BOX NÃO APLICÁVEL
// =====================================================

function criarJunctionBoxNaoAplicavel() {

    return {

        utiliza: false,

        quantidade: 0,

        acessorio: null,

        bateriasPorCaixa: 0,

        mensagem:
            "A bateria modular utiliza sua própria composição de bancos."

    };

}


// =====================================================
// CAPACIDADE DE CONEXÃO
// =====================================================

export function calcularCapacidadeConexaoBaterias(
    inversor,
    quantidadeInversores = 1
) {

    validarInversor(inversor);


    const quantidade =
        validarQuantidadeInteiraPositiva(
            quantidadeInversores,
            "Quantidade de inversores"
        );


    const entradasPorInversor =
        Number(
            inversor.battery_input
        );


    if (
        !Number.isInteger(entradasPorInversor) ||
        entradasPorInversor <= 0
    ) {

        throw new Error(
            `O inversor "${inversor.modelo || ""}" não possui quantidade válida de entradas de bateria.`
        );

    }


    const totalEntradas =
        entradasPorInversor *
        quantidade;


    return {

        entradasPorInversor,

        quantidadeInversores:
            quantidade,

        totalEntradas,

        maximoSemJunctionBox:
            totalEntradas,

        maximoComJunctionBox:
            totalEntradas *
            BATERIAS_POR_JUNCTION_BOX

    };

}


// =====================================================
// JUNCTION BOX
// =====================================================

export function calcularJunctionBox({

    quantidadeBaterias,

    capacidadeConexao,

    acessorios = []

}) {

    const quantidade =
        validarQuantidadeInteiraPositiva(
            quantidadeBaterias,
            "Quantidade de baterias"
        );


    if (
        !capacidadeConexao ||
        typeof capacidadeConexao !== "object"
    ) {

        throw new Error(
            "A capacidade de conexão das baterias é inválida."
        );

    }


    if (
        quantidade <=
        capacidadeConexao.maximoSemJunctionBox
    ) {

        return {

            utiliza: false,

            quantidade: 0,

            acessorio: null,

            bateriasPorCaixa: 0,

            mensagem:
                "Não é necessária Junction Box."

        };

    }


    if (
        quantidade >
        capacidadeConexao.maximoComJunctionBox
    ) {

        return {

            utiliza: false,

            quantidade: 0,

            acessorio: null,

            bateriasPorCaixa: 0,

            mensagem:
                "A quantidade de baterias ultrapassa a capacidade máxima do inversor."

        };

    }


    const quantidadeCaixas =
        Math.min(

            capacidadeConexao.totalEntradas,

            Math.ceil(
                quantidade /
                BATERIAS_POR_JUNCTION_BOX
            )

        );


    const acessorio =
        encontrarJunctionBox(
            acessorios
        );


    return {

        utiliza: true,

        quantidade:
            quantidadeCaixas,

        acessorio,

        bateriasPorCaixa:
            BATERIAS_POR_JUNCTION_BOX,

        mensagem:
            `${quantidadeCaixas} Junction Box necessária(s) para conexão do banco de baterias.`

    };

}


// =====================================================
// COMPATIBILIDADE DE CORRENTE
// =====================================================

export function verificarCompatibilidadeCorrente(
    bateria,
    inversor
) {

    validarBateria(bateria);

    validarInversor(inversor);


    const correnteBateria =
        Number(
            bateria.nominal_current
        );


    const correnteMaximaInversor =
        Number(
            inversor.battery_max_current
        );


    if (
        !Number.isFinite(correnteBateria) ||
        correnteBateria <= 0
    ) {

        return {

            compativel: false,

            motivo:
                "Corrente nominal da bateria inválida."

        };

    }


    if (
        !Number.isFinite(correnteMaximaInversor) ||
        correnteMaximaInversor <= 0
    ) {

        return {

            compativel: false,

            motivo:
                "Corrente máxima de bateria do inversor inválida."

        };

    }


    const compativel =
        correnteBateria <=
        correnteMaximaInversor;


    return {

        compativel,

        correnteBateriaA:
            correnteBateria,

        correnteMaximaInversorA:
            correnteMaximaInversor,

        motivo:
            compativel
                ? null
                : "A corrente nominal da bateria ultrapassa a corrente máxima permitida pelo inversor."

    };

}


// =====================================================
// LISTA DE TODAS AS SOLUÇÕES
// =====================================================

export function listarSolucoesBateria(
    parametros
) {

    validarParametrosSelecao(parametros);


    const {
        baterias,
        inversor,
        quantidadeInversores,
        energiaNecessariaKWh
    } = parametros;


    const capacidadeConexao =
        calcularCapacidadeConexaoBaterias(
            inversor,
            quantidadeInversores
        );


    const solucoes =
        baterias

            .filter(bateria => {

                return bateriaCompativelComInversor(
                    bateria,
                    inversor
                );

            })

            .map(bateria => {

                if (bateria.modular) {

                    return avaliarBateriaModular({

                        bateria,

                        energiaNecessariaKWh,

                        quantidadeInversores

                    });

                }


                return avaliarBateria({

                    bateria,

                    energiaNecessariaKWh,

                    capacidadeConexao

                });

            })

            .filter(Boolean);


    solucoes.sort(
        compararSolucoesBateria
    );


    return solucoes;

}


// =====================================================
// COMPARAÇÃO DAS SOLUÇÕES
// =====================================================

export function compararSolucoesBateria(
    solucaoA,
    solucaoB
) {

    /*
     * Primeiro escolhe a solução com a menor sobra
     * de energia útil.
     */
    if (
        solucaoA.sobraEnergiaKWh !==
        solucaoB.sobraEnergiaKWh
    ) {

        return (
            solucaoA.sobraEnergiaKWh -
            solucaoB.sobraEnergiaKWh
        );

    }


    /*
     * Em caso de empate, escolhe a solução com
     * menos módulos ou baterias.
     */
    if (
        solucaoA.quantidade !==
        solucaoB.quantidade
    ) {

        return (
            solucaoA.quantidade -
            solucaoB.quantidade
        );

    }


    /*
     * Depois, dá preferência à solução que não
     * precisa de Junction Box.
     */
    if (
        solucaoA.precisaJunctionBox !==
        solucaoB.precisaJunctionBox
    ) {

        return solucaoA.precisaJunctionBox
            ? 1
            : -1;

    }


    return String(
        solucaoA.modelo
    ).localeCompare(
        String(solucaoB.modelo),
        "pt-BR"
    );

}


// =====================================================
// RESULTADO SEM SOLUÇÃO
// =====================================================

function criarResultadoSemSolucao({

    motivo,

    mensagem

}) {

    return {

        encontrado: false,

        bateria: null,

        modelo: null,

        quantidade: 0,

        modular: false,

        composicao: null,

        capacidadeNominalTotalKWh: 0,

        energiaUtilUnitariaKWh: 0,

        energiaUtilTotalKWh: 0,

        energiaNecessariaKWh: 0,

        sobraEnergiaKWh: 0,

        capacidadeConexao: null,

        utilizaJunctionBox: false,

        junctionBox: null,

        candidatos: [],

        motivo,

        mensagem

    };

}


// =====================================================
// BUSCA DA JUNCTION BOX
// =====================================================

function encontrarJunctionBox(
    acessorios
) {

    if (!Array.isArray(acessorios)) {

        return null;

    }


    return acessorios.find(acessorio => {

        const modelo =
            String(
                acessorio.modelo || ""
            )
                .trim()
                .toLowerCase();


        return (
            modelo === "junction box" ||
            modelo.includes("junction")
        );

    }) ?? null;

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
            "Os parâmetros de seleção da bateria são inválidos."
        );

    }


    if (!Array.isArray(parametros.baterias)) {

        throw new TypeError(
            "A lista de baterias precisa ser um array."
        );

    }


    if (parametros.baterias.length === 0) {

        throw new Error(
            "A lista de baterias está vazia."
        );

    }


    validarInversor(
        parametros.inversor
    );


    validarQuantidadeInteiraPositiva(
        parametros.quantidadeInversores,
        "Quantidade de inversores"
    );


    const energia =
        Number(
            parametros.energiaNecessariaKWh
        );


    if (
        !Number.isFinite(energia) ||
        energia <= 0
    ) {

        throw new Error(
            "A energia necessária precisa ser maior que zero."
        );

    }


    if (
        parametros.acessorios !== undefined &&
        !Array.isArray(parametros.acessorios)
    ) {

        throw new TypeError(
            "A lista de acessórios precisa ser um array."
        );

    }

}


// =====================================================
// VALIDAÇÃO DA BATERIA
// =====================================================

function validarBateria(
    bateria
) {

    if (
        !bateria ||
        typeof bateria !== "object" ||
        Array.isArray(bateria)
    ) {

        throw new Error(
            "Os dados da bateria são inválidos."
        );

    }


    if (!bateria.modelo) {

        throw new Error(
            "Foi encontrada uma bateria sem modelo."
        );

    }


    const capacidade =
        Number(
            bateria.capacity_kwh
        );


    if (
        !Number.isFinite(capacidade) ||
        capacidade <= 0
    ) {

        throw new Error(
            `A bateria "${bateria.modelo}" possui capacidade inválida.`
        );

    }

}


// =====================================================
// VALIDAÇÃO DO INVERSOR
// =====================================================

function validarInversor(
    inversor
) {

    if (
        !inversor ||
        typeof inversor !== "object" ||
        Array.isArray(inversor)
    ) {

        throw new Error(
            "Os dados do inversor são inválidos."
        );

    }


    if (!inversor.modelo) {

        throw new Error(
            "Foi encontrado um inversor sem modelo."
        );

    }


    const entradas =
        Number(
            inversor.battery_input
        );


    if (
        !Number.isInteger(entradas) ||
        entradas <= 0
    ) {

        throw new Error(
            `O inversor "${inversor.modelo}" possui quantidade inválida de entradas de bateria.`
        );

    }

}


// =====================================================
// VALIDAÇÃO DE QUANTIDADE
// =====================================================

function validarQuantidadeInteiraPositiva(
    valor,
    nomeCampo
) {

    const numero =
        Number(valor);


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