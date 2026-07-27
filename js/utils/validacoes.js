// =====================================================
// FOXESS STUDIO
// Funções de validação reutilizáveis
// =====================================================


// =====================================================
// VALIDAÇÕES DE NÚMEROS
// =====================================================

export function validarNumero(valor, nomeCampo = "Valor") {

    const numero = Number(valor);

    if (!Number.isFinite(numero)) {

        throw new Error(
            `${nomeCampo} deve ser um número válido.`
        );

    }

    return numero;

}


export function validarNumeroPositivo(valor, nomeCampo = "Valor") {

    const numero = validarNumero(valor, nomeCampo);

    if (numero <= 0) {

        throw new Error(
            `${nomeCampo} deve ser maior que zero.`
        );

    }

    return numero;

}


export function validarNumeroNaoNegativo(valor, nomeCampo = "Valor") {

    const numero = validarNumero(valor, nomeCampo);

    if (numero < 0) {

        throw new Error(
            `${nomeCampo} não pode ser negativo.`
        );

    }

    return numero;

}



// =====================================================
// AUTONOMIA
// =====================================================

export function validarAutonomia(valor) {

    return validarNumeroPositivo(
        valor,
        "Autonomia"
    );

}



// =====================================================
// POTÊNCIA
// =====================================================

export function validarPotencia(valor) {

    return validarNumeroPositivo(
        valor,
        "Potência"
    );

}



// =====================================================
// QUANTIDADE
// =====================================================

export function validarQuantidade(valor) {

    const numero = validarNumeroPositivo(
        valor,
        "Quantidade"
    );

    return Math.floor(numero);

}



// =====================================================
// FATOR DE POTÊNCIA
// =====================================================

export function validarFatorPotencia(fp) {

    const numero = validarNumero(fp, "Fator de potência");

    if (numero <= 0 || numero > 1) {

        throw new Error(
            "O fator de potência deve estar entre 0 e 1."
        );

    }

    return numero;

}



// =====================================================
// Ip/In
// =====================================================

export function validarIpIn(ipIn) {

    if (
        ipIn === "" ||
        ipIn === null ||
        ipIn === undefined
    ) {

        return 1;

    }

    const numero = validarNumero(ipIn, "Ip/In");

    if (numero < 1) {

        throw new Error(
            "Ip/In deve ser maior ou igual a 1."
        );

    }

    return numero;

}



// =====================================================
// TENSÃO
// =====================================================

const TENSOES_VALIDAS = [

    "127",

    "220",

    "380"

];


export function validarTensao(tensao) {

    const valor = String(tensao).trim();

    if (!TENSOES_VALIDAS.includes(valor)) {

        throw new Error(
            `Tensão inválida: ${valor}`
        );

    }

    return valor;

}



// =====================================================
// PADRÃO DE ENTRADA
// =====================================================

const PADROES_VALIDOS = [

    "Monofásico 220V",

    "Bifásico 127V/220V",

    "Trifásico 127V/220V",

    "Trifásico 220V/380V"

];


export function validarPadraoEntrada(padrao) {

    if (!PADROES_VALIDOS.includes(padrao)) {

        throw new Error(
            "Padrão de entrada inválido."
        );

    }

    return padrao;

}



// =====================================================
// TIPO DE SOLUÇÃO
// =====================================================

const SOLUCOES_VALIDAS = [

    "inversor",

    "aio"

];


export function validarTipoSolucao(tipo) {

    if (!SOLUCOES_VALIDAS.includes(tipo)) {

        throw new Error(
            "Tipo de solução inválido."
        );

    }

    return tipo;

}



// =====================================================
// CARGA
// =====================================================

export function validarCarga(carga) {

    if (!carga || typeof carga !== "object") {

        throw new Error(
            "Carga inválida."
        );

    }

    validarPotencia(carga.potenciaW);

    validarQuantidade(carga.quantidade);

    validarTensao(carga.tensaoV);

    validarNumeroNaoNegativo(
        carga.tempoLigadoH,
        "Tempo ligado"
    );

    validarFatorPotencia(carga.fatorPotencia);

    validarIpIn(carga.ipIn);

    return true;

}



// =====================================================
// LISTA DE CARGAS
// =====================================================

export function validarListaCargas(lista) {

    if (!Array.isArray(lista)) {

        throw new Error(
            "A lista de cargas é inválida."
        );

    }

    lista.forEach(validarCarga);

    return true;

}