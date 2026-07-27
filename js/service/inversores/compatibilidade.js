// =====================================================
// FOXESS STUDIO
// Compatibilidade elétrica de inversores
// =====================================================


// =====================================================
// PADRÕES DE ENTRADA SUPORTADOS
// =====================================================

const PADROES_ENTRADA = {

    MONOFASICO_220: "monofasico-220",

    BIFASICO_127_220: "bifasico-127-220",

    TRIFASICO_127_220: "trifasico-127-220",

    TRIFASICO_220_380: "trifasico-220-380"

};


// =====================================================
// NORMALIZAÇÃO DO PADRÃO DE ENTRADA
// =====================================================

/**
 * Converte o texto exibido no HTML em uma identificação
 * interna padronizada.
 *
 * Exemplos aceitos:
 *
 * "Monofásico 220V"
 * "Monofasico 220V"
 * "Bifásico 127V/220V"
 * "Trifásico 220V/380V"
 */
export function normalizarPadraoEntrada(padraoEntrada) {

    const texto = normalizarTexto(padraoEntrada);


    const monofasico =
        texto.includes("monofasico");


    const bifasico =
        texto.includes("bifasico");


    const trifasico =
        texto.includes("trifasico");


    const possui127 =
        texto.includes("127");


    const possui220 =
        texto.includes("220");


    const possui380 =
        texto.includes("380");


    if (
        monofasico &&
        possui220 &&
        !possui127 &&
        !possui380
    ) {

        return PADROES_ENTRADA.MONOFASICO_220;

    }


    if (
        bifasico &&
        possui127 &&
        possui220
    ) {

        return PADROES_ENTRADA.BIFASICO_127_220;

    }


    if (
        trifasico &&
        possui127 &&
        possui220
    ) {

        return PADROES_ENTRADA.TRIFASICO_127_220;

    }


    if (
        trifasico &&
        possui220 &&
        possui380
    ) {

        return PADROES_ENTRADA.TRIFASICO_220_380;

    }


    return null;

}


// =====================================================
// TAGS DE INVERSOR COMPATÍVEIS
// =====================================================

/**
 * Retorna os valores de rated_voltage aceitos para
 * o padrão de entrada selecionado.
 *
 * A regra mantém o comportamento do código original.
 *
 * @param {string} padraoEntrada
 * @param {string[]} tensoesCargas
 */
export function obterTagsInversorCompativeis(
    padraoEntrada,
    tensoesCargas = []
) {

    const padrao =
        normalizarPadraoEntrada(padraoEntrada);


    const tensoes =
        normalizarListaTensoes(tensoesCargas);


    switch (padrao) {

        case PADROES_ENTRADA.MONOFASICO_220:

            return ["220"];


        case PADROES_ENTRADA.BIFASICO_127_220:

            /*
             * Se houver carga em 127 V, o inversor precisa
             * disponibilizar a saída combinada 127/220 V.
             *
             * Sem carga em 127 V, também mantemos os modelos
             * 220 V como opção, reproduzindo a lógica anterior.
             */
            if (tensoes.includes("127")) {

                return ["127/220"];

            }

            return [
                "220",
                "127/220"
            ];


        case PADROES_ENTRADA.TRIFASICO_127_220:

            return [
                "T220",
                "127/220"
            ];


        case PADROES_ENTRADA.TRIFASICO_220_380:

            return [
                "T380",
                "220"
            ];


        default:

            return [];

    }

}


// =====================================================
// VERIFICAÇÃO DE UM INVERSOR
// =====================================================

/**
 * Verifica se um inversor é compatível com o padrão
 * elétrico e as tensões das cargas.
 */
export function inversorCompativel(
    inversor,
    padraoEntrada,
    tensoesCargas = []
) {

    if (
        !inversor ||
        typeof inversor !== "object"
    ) {

        return false;

    }


    const ratedVoltage =
        String(
            inversor.rated_voltage || ""
        ).trim();


    if (!ratedVoltage) {

        return false;

    }


    const tagsCompativeis =
        obterTagsInversorCompativeis(
            padraoEntrada,
            tensoesCargas
        );


    return tagsCompativeis.includes(
        ratedVoltage
    );

}


// =====================================================
// FILTRO DE INVERSORES
// =====================================================

/**
 * Filtra uma lista de inversores e retorna somente
 * os modelos eletricamente compatíveis.
 */
export function filtrarInversoresCompativeis(
    inversores,
    padraoEntrada,
    tensoesCargas = []
) {

    if (!Array.isArray(inversores)) {

        throw new TypeError(
            "A lista de inversores precisa ser um array."
        );

    }


    return inversores.filter(inversor => {

        return inversorCompativel(
            inversor,
            padraoEntrada,
            tensoesCargas
        );

    });

}


// =====================================================
// VALIDAÇÃO DAS TENSÕES DAS CARGAS
// =====================================================

/**
 * Verifica se as tensões cadastradas nas cargas fazem
 * sentido para o padrão de entrada escolhido.
 *
 * Essa verificação é separada da compatibilidade do
 * inversor para podermos exibir mensagens mais claras.
 */
export function validarTensoesParaPadrao(
    padraoEntrada,
    tensoesCargas = []
) {

    const padrao =
        normalizarPadraoEntrada(padraoEntrada);


    const tensoes =
        normalizarListaTensoes(tensoesCargas);


    if (!padrao) {

        return {

            valido: false,

            mensagem:
                "O padrão de entrada selecionado é inválido."

        };

    }


    if (tensoes.length === 0) {

        return {

            valido: false,

            mensagem:
                "Nenhuma tensão de carga foi informada."

        };

    }


    const tensoesNaoReconhecidas =
        tensoes.filter(tensao => {

            return ![
                "127",
                "220",
                "380"
            ].includes(tensao);

        });


    if (tensoesNaoReconhecidas.length > 0) {

        return {

            valido: false,

            mensagem:
                `Foram encontradas tensões inválidas: ${
                    tensoesNaoReconhecidas.join(", ")
                } V.`

        };

    }


    switch (padrao) {

        case PADROES_ENTRADA.MONOFASICO_220:

            if (
                tensoes.some(
                    tensao => tensao !== "220"
                )
            ) {

                return {

                    valido: false,

                    mensagem:
                        "No padrão monofásico 220 V, todas as cargas precisam estar em 220 V."

                };

            }

            break;


        case PADROES_ENTRADA.BIFASICO_127_220:

            if (
                tensoes.some(
                    tensao =>
                        tensao !== "127" &&
                        tensao !== "220"
                )
            ) {

                return {

                    valido: false,

                    mensagem:
                        "No padrão bifásico 127/220 V, as cargas devem estar em 127 V ou 220 V."

                };

            }

            break;


        case PADROES_ENTRADA.TRIFASICO_127_220:

            if (
                tensoes.some(
                    tensao =>
                        tensao !== "127" &&
                        tensao !== "220"
                )
            ) {

                return {

                    valido: false,

                    mensagem:
                        "No padrão trifásico 127/220 V, as cargas devem estar em 127 V ou 220 V."

                };

            }

            break;


        case PADROES_ENTRADA.TRIFASICO_220_380:

            if (
                tensoes.some(
                    tensao =>
                        tensao !== "220" &&
                        tensao !== "380"
                )
            ) {

                return {

                    valido: false,

                    mensagem:
                        "No padrão trifásico 220/380 V, as cargas devem estar em 220 V ou 380 V."

                };

            }

            break;

    }


    return {

        valido: true,

        mensagem: null

    };

}


// =====================================================
// DESCRIÇÃO DA COMPATIBILIDADE
// =====================================================

/**
 * Retorna uma descrição amigável das tags aceitas.
 *
 * Pode ser usada posteriormente na interface
 * ou em relatórios.
 */
export function descreverCompatibilidade(
    padraoEntrada,
    tensoesCargas = []
) {

    const tags =
        obterTagsInversorCompativeis(
            padraoEntrada,
            tensoesCargas
        );


    if (tags.length === 0) {

        return "Nenhuma configuração de inversor compatível.";

    }


    return `Configurações aceitas: ${tags.join(", ")}.`;

}


// =====================================================
// ACESSO AOS PADRÕES INTERNOS
// =====================================================

export function obterPadroesEntrada() {

    return {
        ...PADROES_ENTRADA
    };

}


// =====================================================
// FUNÇÕES INTERNAS
// =====================================================

function normalizarTexto(valor) {

    return String(valor || "")

        .normalize("NFD")

        .replace(
            /[\u0300-\u036f]/g,
            ""
        )

        .trim()

        .toLowerCase();

}


function normalizarListaTensoes(tensoes) {

    if (!Array.isArray(tensoes)) {

        return [];

    }


    const tensoesNormalizadas =
        tensoes

            .map(tensao => {

                return String(tensao)
                    .replace(/[^\d]/g, "")
                    .trim();

            })

            .filter(Boolean);


    return [
        ...new Set(tensoesNormalizadas)
    ];

}