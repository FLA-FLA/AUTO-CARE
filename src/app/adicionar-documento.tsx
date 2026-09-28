import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const CHAVE_DOCUMENTOS = '@autocare_documentos';

export default function AdicionarDocumento() {
  const [tipo, setTipo] = useState('');
  const [numero, setNumero] = useState('');
  const [validade, setValidade] = useState('');
  const [observacao, setObservacao] = useState('');

  async function salvarDocumento() {
    if (!tipo.trim() || !numero.trim() || !validade.trim()) {
      Alert.alert(
        'Atenção',
        'Preencha o tipo, o número e a validade do documento.'
      );
      return;
    }

    const novoDocumento = {
      id: Date.now().toString(),
      tipo: tipo.trim(),
      numero: numero.trim(),
      validade: validade.trim(),
      observacao: observacao.trim(),
    };

    try {
      const dadosExistentes = await AsyncStorage.getItem(
        CHAVE_DOCUMENTOS
      );

      const documentos = dadosExistentes
        ? JSON.parse(dadosExistentes)
        : [];

      documentos.push(novoDocumento);

      await AsyncStorage.setItem(
        CHAVE_DOCUMENTOS,
        JSON.stringify(documentos)
      );

      Alert.alert(
        'Documento cadastrado! 📄',
        'O documento foi salvo com sucesso.',
        [
          {
            text: 'OK',
            onPress: () => {
              router.back();
            },
          },
        ]
      );
    } catch (error) {
      console.log(
        'ERRO AO SALVAR DOCUMENTO:',
        error
      );

      Alert.alert(
        'Erro',
        'Não foi possível salvar o documento.'
      );
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
        >
          <Text style={styles.voltar}>
            ‹ Voltar
          </Text>
        </TouchableOpacity>

        <Text style={styles.title}>
          Adicionar documento
        </Text>

        <Text style={styles.subtitle}>
          Cadastre um documento do seu veículo
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>
          Tipo de documento
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Ex.: CRLV"
          value={tipo}
          onChangeText={setTipo}
        />

        <Text style={styles.label}>
          Número do documento
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Ex.: 123456789"
          value={numero}
          onChangeText={setNumero}
        />

        <Text style={styles.label}>
          Data de validade
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Ex.: 31/12/2026"
          keyboardType="numeric"
          value={validade}
          onChangeText={setValidade}
        />

        <Text style={styles.label}>
          Observação
        </Text>

        <TextInput
          style={[
            styles.input,
            styles.observacao,
          ]}
          placeholder="Ex.: Documento atualizado"
          multiline
          numberOfLines={4}
          value={observacao}
          onChangeText={setObservacao}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={salvarDocumento}
        >
          <Text style={styles.buttonText}>
            Salvar documento
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },

  header: {
    backgroundColor: '#208AEF',
    paddingTop: 55,
    paddingBottom: 30,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },

  voltar: {
    color: '#FFFFFF',
    fontSize: 17,
    marginBottom: 20,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: 'bold',
  },

  subtitle: {
    color: '#EAF4FF',
    fontSize: 15,
    marginTop: 6,
  },

  form: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 18,
    elevation: 3,
  },

  label: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 7,
    marginTop: 12,
  },

  input: {
    borderWidth: 1,
    borderColor: '#D5DCE5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    backgroundColor: '#FAFBFC',
  },

  observacao: {
    height: 100,
    textAlignVertical: 'top',
  },

  button: {
    backgroundColor: '#208AEF',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 25,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
});