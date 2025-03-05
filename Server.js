const express = require('express');
const multer = require('multer');
const ftp = require("basic-ftp");
const app = express();
const port = process.env.PORT || 3000;

// Configuração do multer para fazer upload de arquivos
const storage = multer.memoryStorage(); // Armazenamento em memória (para facilitar o envio via FTP)
const upload = multer({ storage: storage });

// Função para enviar o arquivo via FTP
async function sendFileToFTP(fileBuffer, remotePath) {
    const client = new ftp.Client();
    client.ftp.verbose = true; // Logs detalhados, útil para debug

    try {
        // Conectando ao servidor FTP
        await client.access({
            host: process.env.FTP_HOST, //Servidor FTP
            user: process.env.FTP_USER, //Usuário
            password: process.env.FTP_PASSWORD, //Senha, // Altere para sua senha
            secure: process.env.FTP_PASSWORD, //Senha
        });

        // Enviar o arquivo em buffer para o servidor FTP
        await client.uploadFrom(fileBuffer, remotePath);
        console.log(`Arquivo enviado com sucesso para ${remotePath}`);
    } catch (error) {
        console.error("Erro ao enviar o arquivo:", error);
    } finally {
        client.close();
    }
}

// Rota POST para enviar o arquivo via FTP
app.post("/upload", upload.single("file"), async (req, res) => {
    if (!req.file) {
        return res.status(400).send("Nenhum arquivo enviado.");
    }

    const fileBuffer = req.file.buffer; // Buffer do arquivo enviado
    const remotePath = `caminho/no/servidor/${req.file.originalname}`; // Defina o caminho no servidor FTP

    try {
        await sendFileToFTP(fileBuffer, remotePath);
        res.status(200).send("Arquivo enviado com sucesso.");
    } catch (error) {
        res.status(500).send("Erro ao enviar o arquivo para o servidor FTP.");
    }
});

app.listen(port, () => {
    console.log("Servidor rodando!");
});