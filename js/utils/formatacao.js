// =====================================================
// FOXESS STUDIO
// Funções de formatação para exibição na interface
// =====================================================


// =====================================================
// CONFIGURAÇÕES
// =====================================================

const LOCALE_PADRAO = "pt-BR";


// =====================================================
// NÚMEROS
// =====================================================

/**
 * Formata um número utilizando o padrão brasileiro.
 *
 * Exemplo:
 * 1234.567 → 1.234,57
 */
export function formatarNumero(
    valor,
    casasDecimais = 2
) {

    const numero = Number(valor);


    if (!Number.isFinite(numero)) {

        return "—";

    }


    return numero.toLocaleString(
        LOCALE_PADRAO,
        {
            minimumFractionDigits:
                casasDecimais,

            maximumFractionDigits:
                casasDecimais
        }
    );

}


/**
 * Formata um número sem obrigar casas decimais.
 *
 * Exemplo:
 * 2 → 2
 * 2.5 → 2,5
 */
export function formatarNumeroFlexivel(
    valor,
    maximoCasasDecimais = 2
) {

    const numero = Number(valor);


    if (!Number.isFinite(numero)) {

        return "—";

    }


    return numero.toLocaleString(
        LOCALE_PADRAO,
        {
            minimumFractionDigits: 0,

            maximumFractionDigits:
                maximoCasasDecimais
        }
    );

}


// =====================================================
// POTÊNCIA
// =====================================================

/**
 * Formata potência informada em watts.
 *
 * Exemplo:
 * 5000 → 5,00 kW
 */
export function formatarPotenciaKW(
    potenciaW,
    casasDecimais = 2
) {

    const potencia = Number(
        potenciaW
    );


    if (!Number.isFinite(potencia)) {

        return "—";

    }


    return `${formatarNumero(
        potencia / 1000,
        casasDecimais
    )} kW`;

}


/**
 * Formata potência mantendo watts para valores
 * menores que 1.000 W.
 *
 * Exemplo:
 * 800 → 800 W
 * 5000 → 5,00 kW
 */
export function formatarPotenciaAutomatica(
    potenciaW,
    casasDecimais = 2
) {

    const potencia = Number(
        potenciaW
    );


    if (!Number.isFinite(potencia)) {

        return "—";

    }


    if (Math.abs(potencia) < 1000) {

        return `${formatarNumeroFlexivel(
            potencia,
            0
        )} W`;

    }


    return formatarPotenciaKW(
        potencia,
        casasDecimais
    );

}


// =====================================================
// ENERGIA
// =====================================================

/**
 * Formata energia em kWh.
 *
 * Exemplo:
 * 10.36 → 10,36 kWh
 */
export function formatarEnergiaKWh(
    energiaKWh,
    casasDecimais = 2
) {

    const energia = Number(
        energiaKWh
    );


    if (!Number.isFinite(energia)) {

        return "—";

    }


    return `${formatarNumero(
        energia,
        casasDecimais
    )} kWh`;

}


// =====================================================
// TENSÃO
// =====================================================

/**
 * Formata tensão.
 *
 * Exemplo:
 * 220 → 220 V
 */
export function formatarTensao(
    tensao
) {

    if (
        tensao === null ||
        tensao === undefined ||
        tensao === ""
    ) {

        return "—";

    }


    return `${String(tensao).trim()} V`;

}


// =====================================================
// CORRENTE
// =====================================================

/**
 * Formata corrente em ampères.
 */
export function formatarCorrenteA(
    correnteA,
    casasDecimais = 1
) {

    const corrente = Number(
        correnteA
    );


    if (!Number.isFinite(corrente)) {

        return "—";

    }


    return `${formatarNumero(
        corrente,
        casasDecimais
    )} A`;

}


// =====================================================
// PERCENTUAL
// =====================================================

/**
 * Formata percentual.
 *
 * Exemplo:
 * 97 → 97%
 */
export function formatarPercentual(
    valor,
    casasDecimais = 1
) {

    const numero = Number(valor);


    if (!Number.isFinite(numero)) {

        return "—";

    }


    return `${formatarNumero(
        numero,
        casasDecimais
    )}%`;

}


// =====================================================
// HORAS
// =====================================================

/**
 * Formata autonomia ou tempo em horas.
 *
 * Exemplo:
 * 2.5 → 2,5 h
 */
export function formatarHoras(
    horas,
    casasDecimais = 2
) {

    const valor = Number(horas);


    if (!Number.isFinite(valor)) {

        return "—";

    }


    return `${formatarNumeroFlexivel(
        valor,
        casasDecimais
    )} h`;

}


// =====================================================
// TEMPO EM SEGUNDOS
// =====================================================

export function formatarSegundos(
    segundos
) {

    const valor = Number(
        segundos
    );


    if (
        !Number.isFinite(valor) ||
        valor < 0
    ) {

        return "—";

    }


    if (valor === 1) {

        return "1 segundo";

    }


    return `${formatarNumeroFlexivel(
        valor,
        0
    )} segundos`;

}


// =====================================================
// QUANTIDADE
// =====================================================

/**
 * Formata quantidade com singular e plural.
 *
 * Exemplo:
 * formatarQuantidade(1, "unidade", "unidades")
 * → 1 unidade
 *
 * formatarQuantidade(3, "unidade", "unidades")
 * → 3 unidades
 */
export function formatarQuantidade(
    quantidade,
    singular = "unidade",
    plural = "unidades"
) {

    const valor = Number(
        quantidade
    );


    if (!Number.isFinite(valor)) {

        return "—";

    }


    const numeroFormatado =
        formatarNumeroFlexivel(
            valor,
            0
        );


    return `${numeroFormatado} ${
        valor === 1
            ? singular
            : plural
    }`;

}


// =====================================================
// MODELO
// =====================================================

export function formatarModelo(
    modelo
) {

    const texto = String(
        modelo || ""
    ).trim();


    return texto || "Modelo não informado";

}


// =====================================================
// TEXTO SEGURO
// =====================================================

/**
 * Escapa caracteres especiais antes de inserir
 * textos dinâmicos em innerHTML.
 */
export function escaparHTML(
    valor
) {

    return String(valor ?? "")

        .replaceAll("&", "&amp;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;")

        .replaceAll('"', "&quot;")

        .replaceAll("'", "&#039;");

}


// =====================================================
// CAMINHO DE IMAGEM
// =====================================================

export function formatarCaminhoImagem(
    caminho
) {

    const valor = String(
        caminho || ""
    ).trim();


    return valor || "";
}


// =====================================================
// POTÊNCIA DE PICO
// =====================================================

/**
 * Gera um texto para o resultado da verificação
 * de potência de pico.
 */
export function formatarAvisoPico(
    pico,
    potenciaPicoW,
    sujeitoSingular = "O equipamento",
    sujeitoPlural = "Os equipamentos",
    quantidade = 1
) {

    if (
        !pico ||
        !pico.suportado
    ) {

        return "";

    }


    /*
     * tempo igual a null significa que a potência
     * está dentro da capacidade nominal contínua.
     */
    if (pico.tempo === null) {

        return "";

    }


    const sujeito =
        quantidade > 1
            ? sujeitoPlural
            : sujeitoSingular;


return `${sujeito} atende(m) à potência de pico do sistema por até ${
    formatarSegundos(
        pico.tempo
    )
}, respeitando o compartilhamento de carga entre as unidades em paralelo.`;

}


// =====================================================
// TEXTO DE PARALELISMO
// =====================================================

export function formatarParalelismo(
    quantidade,
    modelo
) {

    const valor = Number(
        quantidade
    );


    if (
        !Number.isFinite(valor) ||
        valor <= 1
    ) {

        return "";

    }


    return `${formatarQuantidade(
        valor
    )} do modelo ${formatarModelo(
        modelo
    )} em paralelo.`;

}