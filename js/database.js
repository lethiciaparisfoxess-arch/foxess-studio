// =====================================================
// FOXESS STUDIO
// Repositório do banco de produtos
// =====================================================

let database = null;


// =====================================================
// CARREGAMENTO DO JSON
// =====================================================

export async function carregarDatabase() {

    if (database) {
        return database;
    }

    try {

        const resposta = await fetch("./data/produtos.json");

        if (!resposta.ok) {
            throw new Error(
                `Não foi possível carregar produtos.json. Status HTTP: ${resposta.status}`
            );
        }

        const dados = await resposta.json();

        validarDatabase(dados);

        database = dados;

        console.log("Banco de produtos carregado com sucesso.");

        return database;

    } catch (erro) {

        database = null;

        console.error(
            "Erro ao carregar o banco de produtos:",
            erro
        );

        throw erro;

    }

}


// =====================================================
// ACESSO AO BANCO COMPLETO
// =====================================================

export function obterDatabase() {

    garantirDatabaseCarregado();

    return database;

}


// =====================================================
// STATUS DO CARREGAMENTO
// =====================================================

export function databaseEstaCarregado() {

    return database !== null;

}


// =====================================================
// CONSULTAS POR CATEGORIA
// =====================================================

export function obterInversores() {

    garantirDatabaseCarregado();

    return [...database.inversores];

}


export function obterBaterias() {

    garantirDatabaseCarregado();

    return [...database.baterias];

}


export function obterAllInOne() {

    garantirDatabaseCarregado();

    return [...database.all_in_one];

}


export function obterAcessorios() {

    garantirDatabaseCarregado();

    return [...database.acessorios];

}


// =====================================================
// CONSULTAS POR MODELO
// =====================================================

export function buscarInversorPorModelo(modelo) {

    garantirDatabaseCarregado();

    return encontrarPorModelo(
        database.inversores,
        modelo
    );

}


export function buscarBateriaPorModelo(modelo) {

    garantirDatabaseCarregado();

    return encontrarPorModelo(
        database.baterias,
        modelo
    );

}


export function buscarAllInOnePorModelo(modelo) {

    garantirDatabaseCarregado();

    return encontrarPorModelo(
        database.all_in_one,
        modelo
    );

}


export function buscarAcessorioPorModelo(modelo) {

    garantirDatabaseCarregado();

    return encontrarPorModelo(
        database.acessorios,
        modelo
    );

}


// =====================================================
// BUSCA GERAL
// =====================================================

export function buscarProdutoPorModelo(modelo) {

    garantirDatabaseCarregado();

    const categorias = [
        database.inversores,
        database.baterias,
        database.all_in_one,
        database.acessorios
    ];

    for (const categoria of categorias) {

        const produto = encontrarPorModelo(
            categoria,
            modelo
        );

        if (produto) {
            return produto;
        }

    }

    return null;

}


// =====================================================
// FILTROS
// =====================================================

export function filtrarInversores(filtro) {

    garantirDatabaseCarregado();

    if (typeof filtro !== "function") {
        throw new TypeError(
            "O filtro de inversores precisa ser uma função."
        );
    }

    return database.inversores.filter(filtro);

}


export function filtrarBaterias(filtro) {

    garantirDatabaseCarregado();

    if (typeof filtro !== "function") {
        throw new TypeError(
            "O filtro de baterias precisa ser uma função."
        );
    }

    return database.baterias.filter(filtro);

}


export function filtrarAllInOne(filtro) {

    garantirDatabaseCarregado();

    if (typeof filtro !== "function") {
        throw new TypeError(
            "O filtro de All in One precisa ser uma função."
        );
    }

    return database.all_in_one.filter(filtro);

}


// =====================================================
// FUNÇÕES INTERNAS
// =====================================================

function encontrarPorModelo(lista, modelo) {

    const modeloNormalizado = String(modelo)
        .trim()
        .toLowerCase();

    return lista.find(produto => {

        return String(produto.modelo)
            .trim()
            .toLowerCase() === modeloNormalizado;

    }) ?? null;

}


function garantirDatabaseCarregado() {

    if (!database) {
        throw new Error(
            "O banco de produtos ainda não foi carregado."
        );
    }

}


// =====================================================
// VALIDAÇÃO DA ESTRUTURA DO JSON
// =====================================================

function validarDatabase(dados) {

    if (
        !dados ||
        typeof dados !== "object" ||
        Array.isArray(dados)
    ) {
        throw new Error(
            "O conteúdo de produtos.json é inválido."
        );
    }

    const categoriasObrigatorias = [
        "inversores",
        "baterias",
        "all_in_one",
        "acessorios"
    ];

    categoriasObrigatorias.forEach(categoria => {

        if (!Array.isArray(dados[categoria])) {
            throw new Error(
                `A categoria "${categoria}" não existe ou não é uma lista.`
            );
        }

    });

    validarModelosUnicos(dados);

}


// =====================================================
// VALIDAÇÃO DE MODELOS DUPLICADOS
// =====================================================

function validarModelosUnicos(dados) {

    const todosOsProdutos = [
        ...dados.inversores,
        ...dados.baterias,
        ...dados.all_in_one,
        ...dados.acessorios
    ];

    const modelosEncontrados = new Set();

    todosOsProdutos.forEach(produto => {

        if (
            !produto.modelo ||
            typeof produto.modelo !== "string"
        ) {
            throw new Error(
                "Foi encontrado um produto sem modelo válido."
            );
        }

        const modeloNormalizado = produto.modelo
            .trim()
            .toLowerCase();

        if (modelosEncontrados.has(modeloNormalizado)) {
            throw new Error(
                `O modelo "${produto.modelo}" está duplicado no banco.`
            );
        }

        modelosEncontrados.add(modeloNormalizado);

    });

}