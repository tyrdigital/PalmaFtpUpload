const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ftp = require('basic-ftp'); // Importa diretamente o módulo FTP
const { error } = require('console');
const app = express();
app.use(cors()); //Permitir requisições de outras origens
const port = 3000;

//Informações do servidor FTP
const ftpConfig = {
    host: 'www.palmasistemas.com.br',
    user: 'palmasistemas',
    password: 'gremio1983',
    secure: true,
    secureOptions: {
        rejectUnauthorized: false
    }
};

//Definir diretório onde onde os arquivos serão salvos
const uploadDirectory = path.join(__dirname, 'Palma');

//Configurar o multer para armazenar os arquivos na pasta
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDirectory); //Caminho do diretório
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname); //Obtém a extensão do arquivo
        const filename = file.originalname; //Define o nome do arquivo com timestamp
        cb(null, filename); //Define o nome do arquivo
    }
});

const upload = multer({ storage: storage });

app.post('/UPLOAD', upload.single('file'), async (req, res) => { //Rota para receber arquivo
    if (!req.file) {
        return res.status(400).json({ error: "Nenhum Arquivo Enviado!" });
    }
    try {
        const client = new ftp.Client(); //Cria o cliente FTP
        client.ftp.verbose = true;
        await client.access(ftpConfig); // Conecta-se ao servidor FTP
        const remotePath = '/www/Palma/'; // Caminho da pasta de destino no servidor FTP
        await client.uploadFrom(req.file.path, remotePath + req.file.filename); // Faz o upload do arquivo para o servidor FTP
        fs.unlinkSync(req.file.path); // Após o upload, remove o arquivo temporário do servidor local
        res.status(200).json({ message: 'Arquivo enviado para o FTP com sucesso!', file: req.file }); // Responde ao cliente
        client.close(); // Fecha a conexão FTP
    }
    catch (error) {
        console.error('Erro ao enviar para o FTP:', error);
        res.status(500).json({ error: 'Falha ao enviar o arquivo para o servidor FTP' });
    }
});

//Cria a pasta(Se não existir)
if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory);
}

app.listen(port, () => {
    console.log("Servidor rodando!");
});