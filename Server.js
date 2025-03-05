const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ftp = require('basic-ftp'); // Importa diretamente o módulo FTP
const app = express();
app.use(cors()); //Permitir requisições de outras origens
const port = process.env.PORT || 3000;

//Informações do servidor FTP
const ftpConfig = {
    host: process.env.FTP_HOST, //Servidor FTP
    user: process.env.FTP_USER, //Usuário
    password: process.env.FTP_PASSWORD, //Senha
    secure: false,
    secureOptions: {
        rejectUnauthorized: true // Ignorar a verificação do certificado
    }
};

//Definir diretório onde onde os arquivos serão salvos
const uploadDirectory = '/tmp'; // Usando diretório 'tmp'
if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory);
}

//Configurar o multer para armazenar os arquivos na pasta
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDirectory); //Caminho do diretório
    },
    filename: (req, file, cb) => {
        const filename = file.originalname.replace(/\s+/g, '_').replace(/[ç]/g, 'c'); // Substitui espaços e caracteres especiais
        cb(null, filename); //Define o nome do arquivo
    }
});
const upload = multer({ storage: storage });
//Rota para Enviar arquivo
app.post('/UPLOAD', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "Nenhum Arquivo Enviado!" });
    }
    const client = new ftp.Client(); //Cria o cliente FTP
    client.ftp.verbose = true;
    try {
        await client.access(ftpConfig); // Conecta-se ao servidor FTP
        const remotePath = 'www/Palma/'; // Caminho da pasta de destino no servidor FTP
        await client.uploadFrom(req.file.path, remotePath + req.file.filename); // Faz o upload do arquivo para o servidor FTP
        fs.unlinkSync(req.file.path); // Após o upload, remove o arquivo temporário do servidor local
        res.status(200).json({ message: 'Arquivo enviado para o FTP com sucesso!', file: req.file }); // Responde ao cliente
    }
    catch (error) {
        console.error('Erro ao enviar para o FTP:', error);
        res.status(500).json({ error: 'Falha ao enviar o arquivo para o servidor FTP' });
    }
    finally {
        client.close(); // Fecha a conexão FTP
    }
});

app.listen(port, () => {
    console.log("Servidor rodando!");
});