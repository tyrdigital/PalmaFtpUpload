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
    host: 'www.palmasistemas.com.br',
    port: 21,
    user: 'palmasistemas',
    password: 'gremio1983',
    secure: false
};

//Definir diretório onde onde os arquivos serão salvos
const uploadDirectory = path.join(__dirname, 'Palma');
//Cria a pasta(Se não existir)
if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory);
}
//Configurar o multer para armazenar os arquivos na pasta
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        console.log('Definindo o diretório de destino do upload:', uploadDirectory);
        cb(null, uploadDirectory); //Caminho do diretório
    },
    filename: (req, file, cb) => {
        const filename = file.originalname; //Define o nome do arquivo com timestamp
        console.log('Nome do arquivo:', filename);
        cb(null, filename); //Define o nome do arquivo
    }
});

const upload = multer({ storage: storage });
app.get('/Hello', async (req, res) => { //Verificar LOGIN
    console.log('Requisição GET /Hello recebida');
    res.status(200).json({ message: "Hello!" });
});
app.post('/UPLOAD', upload.single('file'), async (req, res) => { //Rota para receber arquivo
    console.log('Requisição POST /UPLOAD recebida');
    if (!req.file) {
        console.log('Erro: Nenhum arquivo enviado.');
        return res.status(400).json({ error: "Nenhum Arquivo Enviado!" });
    }
    console.log('Arquivo recebido:', req.file);
    const client = new ftp.Client(); //Cria o cliente FTP
    client.ftp.verbose = true;
    client.ftp.usePassive(true); // Forçar o modo passivo
    try {
        console.log('Tentando conectar ao FTP...');
        await client.access(ftpConfig); // Conecta-se ao servidor FTP
        console.log("Conexão com FTP bem-sucedida!");
        const remotePath = '/Palma/'; // Caminho da pasta de destino no servidor FTP
        console.log('Fazendo upload do arquivo...');
        await client.uploadFrom(req.file.path, remotePath + req.file.filename); // Faz o upload do arquivo para o servidor FTP
        console.log(`Arquivo ${req.file.filename} enviado para o FTP`);
        fs.unlinkSync(req.file.path); // Após o upload, remove o arquivo temporário do servidor local
        console.log(`Arquivo temporário removido: ${req.file.path}`);
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

//Inicia o Servidor
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});