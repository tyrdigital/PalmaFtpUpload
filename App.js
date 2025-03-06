import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, TextInput, BackHandler, Alert, ActivityIndicator } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';

const SERVER_CONFIG = { ip: '10.195.96.38', port: 3000 }; //Dados do servidor(IP: 10.195.96.38)

export default function App() {
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState({ title: '', content: '' });
  const [files, setFiles] = useState([]);

  const FetchClipboardText = async () => { //Função 'FetchClipboardText', utilizada para pegar o conteúdo da área de transferência
    const text = await Clipboard.getStringAsync(); //Pega Texto da Área de Transferência
    const [text1, text2] = text.split('@@'); //Separa o conteúdo antes e depois de '@@'

    setText({ title: text1, content: text2 }); //Registra cada um em 'text.title' e em 'text.content'
  }

  const HandleCancel = () => { //Função 'HandleCancel'
    setText({ title: '', content: '' }); //Apaga 'text'
    BackHandler.exitApp(); //Sai do aplicativo
  }

  const HandleOk = () => { //Função 'HandleOk'
    if (files.length === 0) { //Se não tiverem arquivos
      Alert.alert("Erro!", "Nenhum Arquivo Selecionado");
      return;
    }
    else { //Senão
      setLoading(true); //Ativa carregamento
      const uploads = files.map((file) => UploadFile(file));
      Promise.all(uploads)
        .then(() => {
          Alert.alert("Sucesso!", "Todos os Arquivos Foram Enviados com Sucesso!");
        })
        .catch((error) => {
          Alert.alert("Erro!", "Erro ao Enviar Arquivos: " + error.message);
        })
        .finally(() => {
          setFiles([]); //Apaga 'files'
          setLoading(false); //Desativa carregamento
        });
    }
  }

  const PickFiles = async () => { //Função 'PickFiles', utilizada para selecionar arquivos para envio
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: true //Selecionar múltiplos arquivos
      });

      if (result.canceled) { //Se o usuário cancelar
        return; //Não faz nada
      }
      setFiles(result.assets); //Salva os arquivos selecionados em 'files'
    }
    catch (error) {
      console.error("Erro ao Selecionar Arquivos: ", error);
      Alert.alert("Erro ao Selecionar Arquivos!", error);
    }
  }

  const UploadFile = async (file) => { //Função 'UploadFiles'
    try {
      //Formata mensagem
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: text.content + file.name.split('/').pop(),
        type: file.mimeType || 'application/octet-stream'
      });
      //Envia para o servidor
      const response = await axios.post(`https://palmaftpupload.onrender.com/UPLOAD`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Accept' : 'application/json'
          },
        }
      );
      console.log('Arquivo enviado com sucesso:', response.data);
    }
    catch (error) {
      console.error("Erro no Upload:", error);
      Alert.alert("Erro!", error.message);
    }
  }

  useEffect(() => {
    FetchClipboardText(); //Pega o conteúdo da Área de Transferência ao iniciar o Aplicativo
  }, []);

  return (
    <View style={styles.container}>
      {loading ? ( //Se estiver carregando
        <>
          <Text style={{fontSize: 18}}>ENVIANDO ARQUIVOS</Text>
          <ActivityIndicator size='large' color='#0000ff' style={{ marginTop: 20 }} />
        </>
      ) : ( //Senão
        <>
          <View style={styles.containerA}> {/*TÍTULO*/}
            <TouchableOpacity style={styles.buttonContainer} onPress={HandleCancel}>
              <Image
                style={styles.imageContainer}
                source={require('./assets/BotaoCancelar.jpeg')}
              />
            </TouchableOpacity>
            <TextInput style={styles.inputContainer} editable={false} value={text.title} />
            <TouchableOpacity style={styles.buttonContainer} onPress={HandleOk}>
              <Image
                style={styles.imageContainer}
                source={require('./assets/BotaoOk.jpeg')}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.containerB}> {/*CORPO*/}
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
  //Containeres PRIMÁRIOS
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  containerA: { width: '100%', height: '10%', padding: 5, gap: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  containerB: { width: '100%', height: '90%', padding: 5, gap: 5, flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' },
  //Containeres SECUNDÁRIOS
  buttonContainer: { width: '18%', height: '100%', borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  imageContainer: { width: '100%', height: '100%', resizeMode: 'contain' },
  inputContainer: { width: '60%', height: '100%', borderWidth: 2, borderRadius: 3, fontSize: 18, alignItems: 'center', justifyContent: 'center', textAlign: 'center' }
});
