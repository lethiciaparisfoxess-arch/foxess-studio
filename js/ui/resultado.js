// =====================================================
// FOXESS STUDIO
// Renderização do resultado do dimensionamento
// =====================================================

import {
    formatarAvisoPico,
    formatarEnergiaKWh,
    formatarModelo,
    formatarPotenciaKW,
    formatarQuantidade,
    formatarTensao,
    escaparHTML
} from "../utils/formatacao.js";

import { gerarPDF } from "./pdf.js";

// =====================================================
// CONFIGURAÇÕES
// =====================================================

function obterContainerResultado() {

    const telaCI =
        document.getElementById("telaBackupCI");

    const ciVisivel =
        telaCI &&
        !telaCI.classList.contains("escondido");

    if (ciVisivel) {

        return document.getElementById(
            "resultadoSistemaCI"
        );

    }

    return document.getElementById(
        "resultadoSistema"
    );

}


// =====================================================
// FUNÇÃO PRINCIPAL
// =====================================================

export function exibirResultadoDimensionamento(
    resultado
) {

    const container =
        obterContainerResultado();


    if (!container) {

        console.error(
            `O elemento #${ID_RESULTADO} não foi encontrado.`
        );

        return;

    }


    if (
        !resultado ||
        typeof resultado !== "object"
    ) {

        exibirErroResultado(
            "O resultado do dimensionamento é inválido."
        );

        return;

    }


    if (!resultado.sucesso) {

        exibirErroResultado(
            resultado.mensagem ||
            "Não foi possível dimensionar o sistema."
        );

        return;

    }


if (resultado.tipoSolucao === "aio") {

    container.innerHTML =
        criarHTMLResultadoAllInOne(resultado);

    document
        .getElementById("btnBaixarPDF")
        ?.addEventListener("click", () => {

            const avisoPico =
    formatarAvisoPico(
        resultado.inversor?.pico,
        resultado.potenciaPicoW,
        "O inversor selecionado",
        "Os inversores selecionados",
        resultado.inversor?.quantidade
    );

resultado.pdf = {

    avisoPico,

    acessorios:
        resultado.tipoSolucao === "aio"
            ? (resultado.acessorios || [])
            : montarListaAcessoriosInversorBateria(resultado)

};

gerarPDF(resultado);

        });

    return;

}

container.innerHTML =
    criarHTMLResultadoInversorBateria(resultado);

document
    .getElementById("btnBaixarPDF")
    ?.addEventListener("click", () => {

        const avisoPico =
    formatarAvisoPico(
        resultado.inversor?.pico,
        resultado.potenciaPicoW,
        "O inversor selecionado",
        "Os inversores selecionados",
        resultado.inversor?.quantidade
    );

resultado.pdf = {

    avisoPico,

    acessorios:
        resultado.tipoSolucao === "aio"
            ? (resultado.acessorios || [])
            : montarListaAcessoriosInversorBateria(resultado)

};

gerarPDF(resultado);

    });

}



// =====================================================
// ESTADOS DO PAINEL
// =====================================================

export function exibirResultadoAguardando() {

    const container =
        obterContainerResultado();


    if (!container) {

        return;

    }


    container.innerHTML = `

        <div class="resultado-estado">

            <p>
                Aguardando cálculo...
            </p>

        </div>

    `;

}


export function exibirResultadoCarregando() {

    const container =
        obterContainerResultado();


    if (!container) {

        return;

    }


    container.innerHTML = `

        <div class="resultado-estado">

            <p>
                Calculando sistema...
            </p>

        </div>

    `;

}


export function exibirErroResultado(
    mensagem
) {

    const container =
        obterContainerResultado();


    if (!container) {

        return;

    }


    container.innerHTML = `

        <div class="resultado-erro">

            <strong>
                Não foi possível concluir o dimensionamento
            </strong>

            <p>
                ${escaparHTML(
                    mensagem ||
                    "Verifique os dados informados."
                )}
            </p>

        </div>

    `;

}


export function limparResultado() {

    exibirResultadoAguardando();

}


// =====================================================
// INVERSOR + BATERIA
// =====================================================

function criarHTMLResultadoInversorBateria(
    resultado
) {

    const inversor =
        resultado.inversor;


    const bateria =
        resultado.bateria;


    if (
        !inversor ||
        !bateria ||
        !inversor.equipamento ||
        !bateria.bateria
    ) {

        return criarHTMLResultadoInvalido();

    }


    const avisoPico =
        formatarAvisoPico(
            inversor.pico,
            resultado.potenciaPicoW,
            "O inversor selecionado",
            "Os inversores selecionados",
            inversor.quantidade
        );


    const htmlPico =
        avisoPico
            ? criarHTMLAvisoPico(
                avisoPico
            )
            : "";


    const htmlParalelismo =
        inversor.utilizaParalelismo
            ? criarHTMLParalelismoInversor(
                inversor
            )
            : "";


    const acessoriosNecessarios =
        montarListaAcessoriosInversorBateria(
            resultado
        );


    const htmlAcessorios =
        criarHTMLAcessoriosNecessarios(
            acessoriosNecessarios
        );


    const htmlComposicaoBateria =
        criarHTMLComposicaoBateriaModular(
            bateria
        );


    return `

        ${criarHTMLResumoProjeto(resultado)}

        <hr>


        <section class="resultado-bloco">

            <h3>
                Inversor
            </h3>


            <div class="produto-box">

                ${criarHTMLImagemProduto(
                    inversor.equipamento
                )}


                <div class="produto-info">

                    <strong>
                        ${escaparHTML(
                            formatarModelo(
                                inversor.modelo
                            )
                        )}
                    </strong>


                    <p>
                        Potência EPS
                        ${
                            inversor.utilizaParalelismo
                                ? "(unitária)"
                                : ""
                        }:
                        ${formatarPotenciaKW(
                            inversor
                                .potenciaNominalUnitariaW
                        )}
                    </p>


                    <p>
                        Quantidade:
                        ${formatarQuantidade(
                            inversor.quantidade
                        )}
                    </p>


                    ${htmlParalelismo}

                </div>

            </div>

        </section>


        ${htmlPico}


        <hr>


        <section class="resultado-bloco">

            <h3>
                Bateria
            </h3>


            <div class="produto-box">

                ${criarHTMLImagemProduto(
                    bateria.bateria
                )}


                <div class="produto-info">

                    <strong>
                        ${escaparHTML(
                            formatarModelo(
                                bateria.modelo
                            )
                        )}
                    </strong>


                    <p>
                        ${
                            bateria.modular
                                ? "Quantidade de módulos"
                                : "Quantidade"
                        }:
                        ${formatarQuantidade(
                            bateria.quantidade
                        )}
                    </p>


                   ${htmlComposicaoBateria}

${
    bateria.distribuicaoDiferente
        ? `
            <div class="resultado-aviso-pico">
                <p>
                    ⚠️ 
                    Os inversores deste sistema poderão operar com quantidades diferentes de baterias. Essa configuração é suportada, desde que cada inversor respeite os limites de compatibilidade e as orientações do fabricante.
                </p>
            </div>
        `
        : ""
}

<p>
    Energia útil unitária:
                        Energia útil unitária:
                        ${formatarEnergiaKWh(
                            bateria
                                .energiaUtilUnitariaKWh
                        )}
                    </p>


                    <p>
                        Energia útil total:
                        ${formatarEnergiaKWh(
                            bateria
                                .energiaUtilTotalKWh
                        )}
                    </p>


                    <p>
                        Energia necessária:
                        ${formatarEnergiaKWh(
                            resultado
                                .energiaNecessariaKWh
                        )}
                    </p>

                </div>

            </div>

        </section>

        ${htmlAcessorios}

        <hr>

        <div class="resultado-acoes">

            <button
                id="btnBaixarPDF"
                class="btn-pdf"
            >
                📄 Baixar Relatório PDF
            </button>

        </div>

    `;

}


// =====================================================
// COMPOSIÇÃO DAS BATERIAS MODULARES
// =====================================================

function criarHTMLComposicaoBateriaModular(
    bateria
) {

    if (
        !bateria?.modular ||
        !bateria.composicao
    ) {

        return "";

    }


    const composicao =
        bateria.composicao;


    let htmlComponentes = "";


    if (composicao.familia === "CQ6") {

        htmlComponentes = `

            <p>
                Módulos mestre CQ6-M:
                ${formatarQuantidade(
                    composicao.quantidadeMestres
                )}
            </p>


            <p>
                Módulos escravos CQ6-S:
                ${formatarQuantidade(
                    composicao.quantidadeEscravos
                )}
            </p>

        `;

    }


    if (composicao.familia === "CQ16") {

        htmlComponentes = `

            <p>
                CQBOX:
                ${formatarQuantidade(
                    composicao.quantidadeCQBOX
                )}
            </p>

        `;

    }


    const htmlDistribuicao =
        criarHTMLDistribuicaoBaterias(
            composicao
        );


    return `

        <p>
            Capacidade nominal total:
            ${formatarEnergiaKWh(
                bateria
                    .capacidadeNominalTotalKWh
            )}
        </p>


        <p>
            Quantidade de bancos:
            ${formatarQuantidade(
                composicao.quantidadeBancos
            )}
        </p>


        ${htmlComponentes}


        ${htmlDistribuicao}

    `;

}


// =====================================================
// DISTRIBUIÇÃO DAS BATERIAS ENTRE INVERSORES
// =====================================================

function criarHTMLDistribuicaoBaterias(
    composicao
) {

    const modulosPorInversor =
        composicao.modulosPorInversor;


    const bancosPorInversor =
        composicao.bancosPorInversor;


    if (
        !Array.isArray(modulosPorInversor) ||
        modulosPorInversor.length <= 1
    ) {

        return "";

    }


    const itens =
        modulosPorInversor

            .map((quantidadeModulos, indice) => {

                const quantidadeBancos =
                    Array.isArray(bancosPorInversor)
                        ? bancosPorInversor[indice]
                        : 0;


                return `

                    <li>
                        Inversor ${indice + 1}:
                        ${formatarQuantidade(
                            quantidadeModulos
                        )}
                        módulo(s) em
                        ${formatarQuantidade(
                            quantidadeBancos
                        )}
                        banco(s)
                    </li>

                `;

            })

            .join("");


    return `

        <div class="distribuicao-baterias">

            <p>
                Distribuição entre os inversores:
            </p>


            <ul>
                ${itens}
            </ul>

        </div>

    `;

}


// =====================================================
// ALL IN ONE
// =====================================================

function criarHTMLResultadoAllInOne(
    resultado
) {

    const allInOne =
        resultado.allInOne;


    if (
        !allInOne ||
        !allInOne.equipamento
    ) {

        return criarHTMLResultadoInvalido();

    }


    const avisoPico =
        formatarAvisoPico(
            allInOne.pico,
            resultado.potenciaPicoW,
            "A unidade selecionada",
            "As unidades selecionadas",
            allInOne.quantidade
        );


    const htmlPico =
        avisoPico
            ? criarHTMLAvisoPico(
                avisoPico
            )
            : "";


    const htmlParalelismo =
        allInOne.utilizaParalelismo
            ? `

                <p>
                    Potência EPS total:
                    ${formatarPotenciaKW(
                        allInOne
                            .potenciaNominalTotalW
                    )}
                </p>


                <p>
                    Capacidade nominal total:
                    ${formatarEnergiaKWh(
                        allInOne
                            .capacidadeNominalTotalKWh
                    )}
                </p>

            `
            : "";


    const htmlAcessorios =
        criarHTMLAcessoriosNecessarios(
            resultado.acessorios || []
        );


    return `

        ${criarHTMLResumoProjeto(resultado)}

        <hr>


        <section class="resultado-bloco">

            <h3>
                All in One
            </h3>


            <div class="produto-box">

                ${criarHTMLImagemProduto(
                    allInOne.equipamento
                )}


                <div class="produto-info">

                    <strong>
                        ${escaparHTML(
                            formatarModelo(
                                allInOne.modelo
                            )
                        )}
                    </strong>


                    <p>
                        Tensão:
                        ${formatarTensao(
                            allInOne
                                .equipamento
                                .rated_voltage
                        )}
                    </p>


                    <p>
                        Quantidade:
                        ${formatarQuantidade(
                            allInOne.quantidade
                        )}
                    </p>


                    <p>
                        Potência EPS
                        ${
                            allInOne.utilizaParalelismo
                                ? "(unitária)"
                                : ""
                        }:
                        ${formatarPotenciaKW(
                            allInOne
                                .potenciaNominalUnitariaW
                        )}
                    </p>


                    <p>
                        Capacidade nominal
                        ${
                            allInOne.utilizaParalelismo
                                ? "(unitária)"
                                : ""
                        }:
                        ${formatarEnergiaKWh(
                            allInOne
                                .capacidadeNominalUnitariaKWh
                        )}
                    </p>


                    ${htmlParalelismo}

                </div>

            </div>

        </section>


        ${htmlPico}


        <hr>


        <section class="resultado-resumo-energia">

            <p>
                Energia útil total disponível:

                <strong>
                    ${formatarEnergiaKWh(
                        allInOne
                            .energiaUtilTotalKWh
                    )}
                </strong>
            </p>


            <p>
                Energia necessária:

                <strong>
                    ${formatarEnergiaKWh(
                        allInOne
                            .energiaNecessariaKWh
                    )}
                </strong>
            </p>

        </section>


                ${htmlAcessorios}

        <hr>

        <div class="resultado-acoes">

            <button
                id="btnBaixarPDF"
                class="btn-pdf"
            >
                📄 Baixar Relatório PDF
            </button>

        </div>

    `;

}


// =====================================================
// RESUMO DO PROJETO
// =====================================================

function criarHTMLResumoProjeto(
    resultado
) {

    return `

        <section class="resultado-resumo">

            <p>
                Potência total das cargas:

                <strong>
                    ${formatarPotenciaKW(
                        resultado.potenciaTotalW
                    )}
                </strong>
            </p>


            <p>
                Potência de pico:

                <strong>
                    ${formatarPotenciaKW(
                        resultado.potenciaPicoW
                    )}
                </strong>
            </p>


            <p>
                Autonomia solicitada:

                <strong>
                    ${formatarNumeroAutonomia(
                        resultado.autonomiaH
                    )}
                </strong>
            </p>


            <p>
                Padrão de entrada:

                <strong>
                    ${escaparHTML(
                        resultado.padraoEntrada
                    )}
                </strong>
            </p>

        </section>

    `;

}


// =====================================================
// PARALELISMO DE INVERSORES
// =====================================================

function criarHTMLParalelismoInversor(
    inversor
) {

    return `

        <p>
            Configuração:
            ${formatarQuantidade(
                inversor.quantidade
            )}
            em paralelo
        </p>


        <p>
            Potência EPS total:
            ${formatarPotenciaKW(
                inversor
                    .potenciaNominalTotalW
            )}
        </p>

    `;

}


// =====================================================
// MONTAGEM DOS ACESSÓRIOS
// =====================================================

function montarListaAcessoriosInversorBateria(
    resultado
) {

    const acessorios =
        Array.isArray(
            resultado.acessorios
        )
            ? [...resultado.acessorios]
            : [];


    const inversor =
        resultado.inversor;


    const bateria =
        resultado.bateria;


    // Acessório de paralelismo do inversor
    if (
        inversor?.utilizaParalelismo &&
        inversor?.acessorioParalelismo
    ) {

        adicionarAcessorioSemDuplicar(
            acessorios,
            {

                produto:
                    inversor.acessorioParalelismo,

                quantidade:
                    inversor
                        .acessorioParalelismo
                        .quantidade || 1,

                descricao:
                    "Necessário para comunicação e gerenciamento dos inversores em paralelo."

            }
        );

    }


    // Junction Box para baterias convencionais
    if (
        bateria?.utilizaJunctionBox &&
        bateria?.junctionBox
    ) {

        const junctionBox =
            bateria.junctionBox;


        const produto =
            junctionBox.acessorio || {

                modelo:
                    "Junction Box",

                picture:
                    ""

            };


        adicionarAcessorioSemDuplicar(
            acessorios,
            {

                produto,

                quantidade:
                    junctionBox.quantidade || 1,

                descricao:
                    `Permite a conexão de até ${
                        junctionBox.bateriasPorCaixa || 4
                    } baterias por entrada utilizada.`

            }
        );

    }


    return acessorios;

}


// =====================================================
// ADICIONAR ACESSÓRIO SEM DUPLICAR
// =====================================================

function adicionarAcessorioSemDuplicar(
    lista,
    novoAcessorio
) {

    if (
        !novoAcessorio ||
        !novoAcessorio.produto
    ) {

        return;

    }


    const modeloNovo =
        String(
            novoAcessorio.produto.modelo || ""
        )
            .trim()
            .toLowerCase();


    const jaExiste =
        lista.some(item => {

            const modeloExistente =
                String(
                    item?.produto?.modelo || ""
                )
                    .trim()
                    .toLowerCase();


            return (
                modeloExistente ===
                modeloNovo
            );

        });


    if (!jaExiste) {

        lista.push(
            novoAcessorio
        );

    }

}


// =====================================================
// HTML DOS ACESSÓRIOS
// =====================================================

function criarHTMLAcessoriosNecessarios(
    acessorios
) {

    if (
        !Array.isArray(acessorios) ||
        acessorios.length === 0
    ) {

        return "";

    }


    const itensHTML =
        acessorios

            .map(item => {

                const produto =
                    item.produto;


                if (!produto) {

                    return "";

                }


                const descricao =
                    String(
                        item.descricao || ""
                    ).trim();


                return `

                    <div class="produto-box">

                        ${criarHTMLImagemProduto(
                            produto
                        )}


                        <div class="produto-info">

                            <strong>
                                ${escaparHTML(
                                    formatarModelo(
                                        produto.modelo
                                    )
                                )}
                            </strong>


                            <p>
                                Quantidade:
                                ${formatarQuantidade(
                                    item.quantidade || 1
                                )}
                            </p>


                            ${
                                descricao
                                    ? `
                                        <p>
                                            ${escaparHTML(
                                                descricao
                                            )}
                                        </p>
                                    `
                                    : ""
                            }

                        </div>

                    </div>

                `;

            })

            .filter(Boolean)

            .join("");


    if (!itensHTML) {

        return "";

    }


    return `

        <hr>


        <section class="resultado-bloco resultado-acessorios">

            <h3>
                Acessórios necessários
            </h3>


            <div class="lista-acessorios">

                ${itensHTML}

            </div>

        </section>

    `;

}


// =====================================================
// AVISO DE PICO
// =====================================================

function criarHTMLAvisoPico(
    aviso
) {

    return `

        <div class="resultado-aviso-pico">

            <p>
                ⚠️
                ${escaparHTML(aviso)}
            </p>

        </div>

    `;

}


// =====================================================
// IMAGEM DO PRODUTO
// =====================================================

function criarHTMLImagemProduto(
    produto
) {

    const caminho =
        String(
            produto?.picture || ""
        ).trim();


    if (!caminho) {

        return `

            <div class="produto-sem-imagem">
                Sem imagem
            </div>

        `;

    }


    return `

        <img
            src="${escaparHTML(caminho)}"
            alt="${escaparHTML(
                produto.modelo ||
                "Produto FoxESS"
            )}"
            loading="lazy"
        >

    `;

}


// =====================================================
// RESULTADO INVÁLIDO
// =====================================================

function criarHTMLResultadoInvalido() {

    return `

        <div class="resultado-erro">

            <strong>
                Resultado incompleto
            </strong>

            <p>
                Não foi possível localizar os dados dos
                equipamentos selecionados.
            </p>

        </div>

    `;

}


// =====================================================
// FUNÇÕES INTERNAS
// =====================================================


function formatarNumeroAutonomia(
    autonomia
) {

    const valor =
        Number(autonomia);


    if (!Number.isFinite(valor)) {

        return "—";

    }


    return `${valor.toLocaleString(
        "pt-BR",
        {
            maximumFractionDigits: 2
        }
    )} h`;

}