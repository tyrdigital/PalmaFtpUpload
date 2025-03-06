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
      const formData = new FormData();
      formData.append("file", {
        uri: file.uri,
        type: file.mimeType, // O tipo de MIME pode ser necessário
        name: text.content + file.name,
      });

      const response = await fetch(`${SERVER_CONFIG}/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        throw new Error("Erro ao enviar arquivo: " + response.statusText);
      }

      return await response.json(); // Pode ser necessário ajustar conforme o servidor retorna
    } catch (error) {
      console.error("Erro ao enviar arquivo:", error);
      throw error; // Rethrow the error to be caught in the `catch` block of HandleOk
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

