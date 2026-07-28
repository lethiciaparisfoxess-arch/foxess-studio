// =====================================================
// FOXESS STUDIO
// Geração de Relatório PDF
// =====================================================

const COR_PRIMARIA = [91, 44, 145];
const COR_SECUNDARIA = [245, 245, 245];
const COR_TEXTO = [40, 40, 40];

const MARGEM = 15;
const LARGURA = 180;

// =====================================================
// CARREGAMENTO DE IMAGENS
// =====================================================

async function carregarImagem(url) {

    return new Promise((resolve, reject) => {

        const img = new Image();

        img.crossOrigin = "Anonymous";

        img.onload = () => {

            const canvas = document.createElement("canvas");

            canvas.width = img.width;

            canvas.height = img.height;

            const ctx = canvas.getContext("2d");

            ctx.drawImage(img, 0, 0);

            resolve(
                canvas.toDataURL("image/png")
            );

        };

        img.onerror = reject;

        img.src = url;

    });

}

// =====================================================
// TÍTULOS
// =====================================================

function desenharTitulo(doc, texto, y) {

    doc.setTextColor(...COR_PRIMARIA);

    doc.setFont("helvetica", "bold");

    doc.setFontSize(15);

    doc.text(texto, MARGEM, y);

}

// =====================================================
// LINHA DIVISÓRIA
// =====================================================

function desenharLinha(doc, y) {

    doc.setDrawColor(...COR_PRIMARIA);

    doc.line(
        MARGEM,
        y,
        195,
        y
    );

}

// =====================================================
// CABEÇALHO
// =====================================================

async function desenharCabecalho(doc) {

    doc.setFillColor(...COR_PRIMARIA);

    doc.rect(
        0,
        0,
        210,
        30,
        "F"
    );

    try {

        const logo = await carregarImagem(
            "/assets/icons/logo_roxo.png"
        );

        doc.addImage(
            logo,
            "PNG",
            150,
            5,
            42,
            18
        );

    } catch {

        console.warn(
            "Logo não encontrada."
        );

    }

    doc.setTextColor(255,255,255);

    doc.setFont("helvetica","bold");

    doc.setFontSize(20);

    doc.text(
        "FOXESS Studio",
        MARGEM,
        14
    );

    doc.setFontSize(11);

    doc.setFont(
        "helvetica",
        "normal"
    );

    doc.text(
        "Relatório de Dimensionamento",
        MARGEM,
        22
    );

    doc.setTextColor(...COR_TEXTO);

}

// =====================================================
// DADOS DO PROJETO
// =====================================================

function desenharProjeto(doc, resultado) {

    let y = 42;

    desenharTitulo(
        doc,
        "Informações do Projeto",
        y
    );

    y += 8;

    doc.setFillColor(...COR_SECUNDARIA);

    doc.roundedRect(
        MARGEM,
        y,
        LARGURA,
        48,
        2,
        2,
        "F"
    );

    doc.setFontSize(11);

    doc.setFont(
        "helvetica",
        "normal"
    );

    doc.text(
        `Padrão de Entrada: ${resultado.padraoEntrada}`,
        20,
        y + 8
    );

    doc.text(
        `Autonomia: ${resultado.autonomiaH} h`,
        20,
        y + 16
    );

    doc.text(
        `Potência Total: ${(resultado.potenciaTotalW/1000).toFixed(2)} kW`,
        20,
        y + 24
    );

    doc.text(
        `Potência de Pico: ${(resultado.potenciaPicoW/1000).toFixed(2)} kW`,
        20,
        y + 32
    );

doc.text(
    `Energia Necessária: ${(resultado.energiaNecessariaKWh ?? 0).toFixed(2)} kWh`,
    20,
    y + 40
);

}

export async function gerarPDF(resultado) {

    const { jsPDF } = window.jspdf;

    const doc = new jsPDF({

        orientation:"portrait",

        unit:"mm",

        format:"a4"

    });

    await desenharCabecalho(doc);

desenharProjeto(
    doc,
    resultado
);

let y = 110;

// =====================================================
// INVERSOR + BATERIA
// =====================================================

if (resultado.tipoSolucao !== "aio") {

    if (resultado.inversor) {

        resultado.inversor.equipamento.quantidade =
            resultado.inversor.quantidade;

await desenharCardEquipamento(

    doc,

    "INVERSOR",

    resultado.inversor.equipamento,

    resultado.inversor,

    15,

    y

);

        y += 65;

    }
if (resultado.bateria) {

    resultado.bateria.bateria.quantidade =
        resultado.bateria.quantidade;

    await desenharCardEquipamento(

        doc,

        "BATERIA",

        resultado.bateria.bateria,

        resultado.bateria,

        15,

        y

    );

}

}

// =====================================================
// ALL IN ONE
// =====================================================

else {

    if (
        resultado.allInOne &&
        resultado.allInOne.equipamento
    ) {

        await desenharCardEquipamento(

            doc,

            "ALL IN ONE",

            resultado.allInOne.equipamento,

            resultado.allInOne,

            15,

            y

        );

    }

}

// Próxima posição abaixo da bateria
y += 75;

// Desenha os acessórios e retorna a nova posição
y = desenharAcessorios(

    doc,

    resultado.pdf?.acessorios,

    y

);

// Espaço
y += 12;

// Se estiver próximo do fim da página,
// cria uma nova página.

if (y > 250) {

    doc.addPage();

    y = 20;

}

// Aviso
desenharAviso(

    doc,

    resultado.pdf?.avisoPico,

    y

);

// Salva o PDF
doc.save(
    "Relatorio_FOXESS.pdf"
);

}


// =====================================================
// CARD DO EQUIPAMENTO
// =====================================================

async function desenharCardEquipamento(
    doc,
    titulo,
    equipamento,
    dadosSistema,
    x,
    y
) {

    if (
    !Number.isFinite(Number(x)) ||
    !Number.isFinite(Number(y))
) {

    console.error(
        "Posição inválida para o card do PDF:",
        {
            titulo,
            x,
            y
        }
    );

    return;

}

    doc.setDrawColor(...COR_PRIMARIA);

    doc.roundedRect(
    x,
    y,
    180,
    60,
    2,
    2
    );

    doc.setFillColor(...COR_PRIMARIA);

    doc.rect(
        x,
        y,
        180,
        8,
        "F"
    );

    doc.setTextColor(255,255,255);

    doc.setFont("helvetica","bold");

    doc.setFontSize(12);

    doc.text(
        titulo,
        x + 5,
        y + 5.5
    );

    doc.setTextColor(...COR_TEXTO);

    // FOTO

    try {

        const imagem =
            await carregarImagem(
                "/" + equipamento.picture
            );

const img = new Image();

img.src = "/" + equipamento.picture;

await img.decode();

const proporcao = img.width / img.height;

let largura = 35;
let altura = largura / proporcao;

if (altura > 42) {

    altura = 42;

    largura = altura * proporcao;

}

doc.addImage(

    imagem,

    "PNG",

    x + 5,

    y + 12,

    largura,

    altura

);

    }

    catch {

        doc.rect(
            x + 5,
            y + 12,
            35,
            35
        );

        doc.text(
            "Sem imagem",
            x + 8,
            y + 31
        );

    }

    doc.setFont("helvetica","bold");

    doc.setFontSize(12);

    doc.text(
        equipamento.modelo,
        x + 48,
        y + 18
    );

   doc.setFont("helvetica", "normal");
doc.setFontSize(10);

let yy = y + 27;

switch (titulo) {

    case "INVERSOR":

        doc.text(
            `Potência EPS: ${(dadosSistema.potenciaNominalUnitariaW / 1000).toFixed(1)} kW`,
            x + 48,
            yy
        );

        yy += 7;

        doc.text(
            `Quantidade: ${dadosSistema.quantidade}`,
            x + 48,
            yy
        );

        break;

    case "BATERIA":

        doc.text(
            `Energia útil: ${dadosSistema.energiaUtilUnitariaKWh.toFixed(2)} kWh`,
            x + 48,
            yy
        );

        yy += 7;

        doc.text(
            `Quantidade: ${dadosSistema.quantidade}`,
            x + 48,
            yy
        );

        break;

    case "ALL IN ONE": {

    const potenciaW =
        Number(
            dadosSistema
                ?.potenciaNominalUnitariaW
        ) || 0;

    const capacidadeKWh =
        Number(
            dadosSistema
                ?.capacidadeNominalUnitariaKWh
        ) || 0;

    const quantidade =
        Number(
            dadosSistema?.quantidade
        ) || 1;

    doc.text(
        `Potência: ${(potenciaW / 1000).toFixed(1)} kW`,
        x + 48,
        yy
    );

    yy += 7;

    doc.text(
        `Capacidade: ${capacidadeKWh.toFixed(2)} kWh`,
        x + 48,
        yy
    );

    yy += 7;

    doc.text(
        `Quantidade: ${quantidade}`,
        x + 48,
        yy
    );

    break;

    }

}


}

// =====================================================
// OBSERVAÇÕES
// =====================================================

function desenharAviso(doc, texto, y) {

    if (!texto) {

        return;

    }

    desenharTitulo(
        doc,
        "Observações",
        y
    );

    y += 8;

    doc.setFillColor(255,245,230);

    doc.setDrawColor(255,170,0);

    doc.roundedRect(
        15,
        y,
        180,
        25,
        2,
        2,
        "FD"
    );

    doc.setFont("helvetica","normal");

    doc.setFontSize(10);

    doc.setTextColor(80);

    doc.text(
        texto,
        20,
        y + 7,
        {
            maxWidth:170
        }
    );

    doc.setTextColor(...COR_TEXTO);

}
// =====================================================
// ACESSÓRIOS
// =====================================================

function desenharAcessorios(doc, acessorios, y) {

    if (!acessorios || acessorios.length === 0) {

        return y;

    }

    desenharTitulo(
        doc,
        "Acessórios Necessários",
        y
    );

    y += 8;

    doc.setDrawColor(...COR_PRIMARIA);

    doc.roundedRect(
        15,
        y,
        180,
        acessorios.length * 10 + 10,
        2,
        2
    );

    y += 8;

    doc.setFont("helvetica", "normal");

    doc.setFontSize(10);

    acessorios.forEach(item => {

        doc.text(
            "• " + item.produto.modelo,
            20,
            y
        );

        doc.text(
            `Qtd.: ${item.quantidade}`,
            160,
            y
        );

        y += 8;

    });

    return y;

}
