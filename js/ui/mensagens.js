// =====================================================
// FOXESS STUDIO
// Centralização das mensagens da interface
// =====================================================


// =====================================================
// CATÁLOGO DE MENSAGENS
// =====================================================

export const MSG = {

    // Navegação

    SELECIONE_APLICACAO:
        "Selecione pelo menos uma aplicação.",

    APLICACAO_NAO_IMPLEMENTADA:
        "Esta aplicação ainda não foi implementada.",


    // Backup

    AUTONOMIA_INVALIDA:
        "Informe uma autonomia maior que zero.",

    PADRAO_ENTRADA:
        "Selecione o padrão de entrada.",

    TIPO_SOLUCAO:
        "Selecione o tipo de solução.",

    CARGA_OBRIGATORIA:
        "Adicione pelo menos uma carga.",


    // Dimensionamento

    DIMENSIONAMENTO_FALHOU:
        "Não foi possível dimensionar o sistema.",

    NENHUM_INVERSOR:
        "Nenhum inversor compatível foi encontrado.",

    NENHUMA_BATERIA:
        "Nenhuma bateria compatível foi encontrada.",

    NENHUM_ALLINONE:
        "Nenhum All in One compatível foi encontrado.",


    // Sistema

    ERRO_INESPERADO:
        "Ocorreu um erro inesperado."

};


// =====================================================
// ALERTA
// =====================================================

export function alerta(mensagem) {

    window.alert(mensagem);

}


// =====================================================
// SUCESSO
// =====================================================

export function sucesso(mensagem) {

    window.alert(mensagem);

}


// =====================================================
// ERRO
// =====================================================

export function erro(mensagem) {

    console.error(mensagem);

    window.alert(mensagem);

}


// =====================================================
// AVISO
// =====================================================

export function aviso(mensagem) {

    console.warn(mensagem);

    window.alert(mensagem);

}


// =====================================================
// CONFIRMAÇÃO
// =====================================================

export function confirmar(mensagem) {

    return window.confirm(mensagem);

}


// =====================================================
// PROMPT
// =====================================================

export function perguntar(

    mensagem,

    valorInicial = ""

) {

    return window.prompt(

        mensagem,

        valorInicial

    );

}


// =====================================================
// LOG
// =====================================================

export function log(mensagem) {

    console.log(mensagem);

}


// =====================================================
// EXCEPTION
// =====================================================

export function tratarErro(erroRecebido) {

    if (!erroRecebido) {

        erro(MSG.ERRO_INESPERADO);

        return;

    }


    if (erroRecebido instanceof Error) {

        erro(erroRecebido.message);

        return;

    }


    erro(String(erroRecebido));

}