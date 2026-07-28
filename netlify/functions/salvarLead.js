const { google } = require("googleapis");

exports.handler = async (event) => {
    try {

        if (event.httpMethod !== "POST") {
            return {
                statusCode: 405,
                body: "Método não permitido"
            };
        }

        const dados = JSON.parse(event.body);

    const dataAtual = new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo"});

        const {
            nome,
            empresa,
            email,
            telefone,
            origem
        } = dados;

        const auth = new google.auth.GoogleAuth({
            credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
            scopes: [
                "https://www.googleapis.com/auth/spreadsheets"
            ]
        });

        const sheets = google.sheets({
            version: "v4",
            auth
        });

        await sheets.spreadsheets.values.append({

            spreadsheetId:
                process.env.GOOGLE_SHEET_ID,

            range:
                "Página1!A:F",

            valueInputOption:
                "USER_ENTERED",

            requestBody: {

                values: [[

                    dataAtual,
                    nome,
                    empresa,
                    email,
                    telefone,
                    origem

                ]]

            }

        });

        return {

            statusCode: 200,

            body: JSON.stringify({

                sucesso: true

            })

        };

    } catch (erro) {

        console.error(erro);

        return {

            statusCode: 500,

            body: JSON.stringify({

                sucesso: false,
                erro: erro.message

            })

        };

    }
};