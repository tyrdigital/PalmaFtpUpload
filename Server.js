const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ftp = require('basic-ftp'); // Importa diretamente o módulo FTP
const { error } = require('console');
const app = express();
app.use(cors()); //Permitir requisições de outras origens
const port = process.env.PORT || 3000;

//Informações do servidor FTP
const ftpConfig = {
    host: process.env.FTP_HOST, //Servidor FTP
    user: process.env.FTP_USER, //Usuário
    password: process.env.FTP_PASSWORD, //Senha
    secure: true,
    secureOptions: {
        rejectUnauthorized: true
    }
};

//Rota para Enviar arquivo
app.post('/UPLOAD', multer({ dest: '/tmp' }).single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "Nenhum Arquivo Enviado!" });
    }
    const client = new ftp.Client();
    client.ftp.verbose = true;
    try {
        await client.access(ftpConfig);
        const remotePath = 'www/Palma/';
        await client.uploadFrom(req.file.path, remotePath + req.file.originalname);
        fs.unlink(req.file.path);
        res.status(200).json({ message: "Arquivo Enviado com Sucesso!" });
    }
    catch (error) {
        console.error("Erro ao Enviar ao Servidor FTP: ", error);
        res.status(500).json({ error: "Erro ao Enviar o Arquivo" });
    }
    finally {
        client.close();
    }
});

app.listen(port, () => {
    console.log("Servidor rodando!");
});