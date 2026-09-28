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

const CHAVE_REVISOES = '@autocare_revisoes';

export default function AdicionarRevisao() {
  const [tipo, setTipo] = useState('');
  const [data, setData] = useState('');
  const [km, setKm] = useState('');
  const [observacao, setObservacao] = useState('');

  async function salvarRevisao() {
    if (!tipo.trim() || !data.trim() || !km.trim()) {
      Alert.alert(
        'Atenção',
        'Preencha o tipo de revisão, a data e a quilometragem.'
      );
      return;
    }

    const novaRevisao = {
      id: Date.now().toString(),
      tipo: tipo.trim(),
      data: data.trim(),
      km: km.trim(),
      observacao: observacao.trim(),
    };

    try {
      const dadosExistentes = await AsyncStorage.getItem(
        CHAVE_REVISOES
      );

      const revisoes = dadosExistentes
        ? JSON.parse(dadosExistentes)
        : [];

      revisoes.push(novaRevisao);

      await AsyncStorage.setItem(
        CHAVE_REVISOES,
        JSON.stringify(revisoes)
      );

      Alert.alert(
        'Revisão cadastrada! 📅',
        'A revisão foi salva com sucesso.',
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
        'ERRO AO SALVAR REVISÃO:',
        error
      );

      Alert.alert(
        'Erro',
        'Não foi possível salvar a revisão.'
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
          Adicionar revisão
        </Text>

        <Text style={styles.subtitle}>
          Registre uma revisão do seu veículo
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>
          Tipo de revisão
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Ex.: Revisão de 10.000 km"
          value={tipo}
          onChangeText={setTipo}
        />

        <Text style={styles.label}>
          Data
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Ex.: 28/09/2026"
          keyboardType="numeric"
          value={data}
          onChangeText={setData}
        />

        <Text style={styles.label}>
          Quilometragem
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Ex.: 10000"
          keyboardType="numeric"
          value={km}
          onChangeText={setKm}
        />

        <Text style={styles.label}>
          Observação
        </Text>

        <TextInput
          style={[
            styles.input,
            styles.observacao,
          ]}
          placeholder="Ex.: Revisão completa realizada"
          multiline
          numberOfLines={4}
          value={observacao}
          onChangeText={setObservacao}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={salvarRevisao}
        >
          <Text style={styles.buttonText}>
            Salvar revisão
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