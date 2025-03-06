import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, TextInput, BackHandler, Alert, ActivityIndicator } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';

const SERVER_CONFIG = 'http://10.195.96.38:3000'; // Dados do servidor(IP: 10.195.96.38)
//const SERVER_CONFIG = 'https://palmaftpupload.onrender.com';

export default function App() {
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState({ title: '', content: '' });
  const [files, setFiles] = useState([]);

  const FetchClipboardText = async () => {
    const text = await Clipboard.getStringAsync();
    const [text1, text2] = text.split('@@');

    setText({ title: text1, content: text2 });
  };

  const HandleCancel = () => {
    setText({ title: '', content: '' });
    BackHandler.exitApp();
  };

  const HandleOk = () => {
    if (files.length === 0) {
      Alert.alert("Erro!", "Nenhum Arquivo Selecionado");
      return;
    }
    else {
      setLoading(true);
      const uploads = files.map((file) => UploadFile(file));
      Promise.all(uploads)
        .then(() => {
          Alert.alert("Sucesso!", "Todos os Arquivos Foram Enviados com Sucesso!");
        })
        .catch((error) => {
          Alert.alert("Erro!", "Erro ao Enviar Arquivos: " + error.message);
        })
        .finally(() => {
          setFiles([]);
          setLoading(false);
        });
    }
  };

  const PickFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: true
      });

      if (result.canceled) {
        return;
      }
      setFiles(result.assets);
    }
    catch (error) {
      console.error("Erro ao Selecionar Arquivos: ", error);
      Alert.alert("Erro ao Selecionar Arquivos!", error);
    }
  };

  const UploadFile = async (file) => {
    try {
      const ftpServer = 'example.com';  // URL do servidor FTP
      const username = 'your-ftp-username';  // Nome de usuário FTP
      const password = 'your-ftp-password';  // Senha FTP
      const remoteDir = '/remote/upload/dir';  // Diretório no servidor FTP

      const client = new FTPClient();
      await client.access({
        host: ftpServer,
        user: username,
        password: password,
        secure: false,  // Use 'true' se o FTP suportar TLS
      });

      const remotePath = `${remoteDir}/${text.content}${file.name.split('/').pop()}`;

      // Envia o arquivo para o servidor FTP
      await client.uploadFrom(file.uri, remotePath);

      console.log('Arquivo enviado com sucesso:', remotePath);
      client.close();
    }
    catch (error) {
      console.error("Erro no Upload via FTP:", error);
      Alert.alert("Erro!", error.message);
    }
  };

  useEffect(() => {
    FetchClipboardText();
  }, []);

  return (
    <View style={styles.container}>
      {loading ? (
        <>
          <Text style={{ fontSize: 18 }}>ENVIANDO ARQUIVOS</Text>
          <ActivityIndicator size='large' color='#0000ff' style={{ marginTop: 20 }} />
        </>
      ) : (
        <>
          <View style={styles.containerA}>
            <TouchableOpacity style={styles.buttonContainer} onPress={HandleCancel}>
              <Image style={styles.imageContainer} source={require('./assets/BotaoCancelar.jpeg')} />
            </TouchableOpacity>
            <TextInput style={styles.inputContainer} editable={false} value={text.title} />
            <TouchableOpacity style={styles.buttonContainer} onPress={HandleOk}>
              <Image style={styles.imageContainer} source={require('./assets/BotaoOk.jpeg')} />
            </TouchableOpacity>
          </View>
          <View style={styles.containerB}>
            <Text>ARQUIVOS:</Text>
            <TouchableOpacity style={[styles.inputContainer, { width: '100%', height: '10%' }]} onPress={PickFiles}>
              <TextInput editable={false} value={files.map((file) => text.content + file.name).join(',')} />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  containerA: { width: '100%', height: '10%', padding: 5, gap: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  containerB: { width: '100%', height: '90%', padding: 5, gap: 5, flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' },
  buttonContainer: { width: '18%', height: '100%', borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  imageContainer: { width: '100%', height: '100%', resizeMode: 'contain' },
  inputContainer: { width: '60%', height: '100%', borderWidth: 2, borderRadius: 3, fontSize: 18, alignItems: 'center', justifyContent: 'center', textAlign: 'center' }
});

