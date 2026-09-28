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

const CHAVE_MANUTENCOES = '@autocare_manutencoes';

export default function AdicionarManutencao() {
  const [servico, setServico] = useState('');
  const [data, setData] = useState('');
  const [valor, setValor] = useState('');
  const [observacao, setObservacao] = useState('');

  async function salvarManutencao() {
    if (!servico.trim() || !data.trim() || !valor.trim()) {
      Alert.alert(
        'Atenção',
        'Preencha o serviço, a data e o valor.'
      );
      return;
    }

    const novaManutencao = {
      id: Date.now().toString(),
      servico: servico.trim(),
      data: data.trim(),
      valor: valor.trim(),
      observacao: observacao.trim(),
    };

    try {
      const dadosExistentes = await AsyncStorage.getItem(
        CHAVE_MANUTENCOES
      );

      const manutencoes = dadosExistentes
        ? JSON.parse(dadosExistentes)
        : [];

      manutencoes.push(novaManutencao);

      await AsyncStorage.setItem(
        CHAVE_MANUTENCOES,
        JSON.stringify(manutencoes)
      );

      Alert.alert(
        'Manutenção cadastrada! 🔧',
        'A manutenção foi salva com sucesso.',
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
        'ERRO AO SALVAR MANUTENÇÃO:',
        error
      );

      Alert.alert(
        'Erro',
        'Não foi possível salvar a manutenção.'
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
          Adicionar manutenção
        </Text>

        <Text style={styles.subtitle}>
          Registre um serviço realizado no seu veículo
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>
          Serviço realizado
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Ex.: Troca de óleo"
          value={servico}
          onChangeText={setServico}
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
          Valor
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Ex.: 250,00"
          keyboardType="numeric"
          value={valor}
          onChangeText={setValor}
        />

        <Text style={styles.label}>
          Observação
        </Text>

        <TextInput
          style={[
            styles.input,
            styles.observacao,
          ]}
          placeholder="Ex.: Óleo e filtro trocados"
          multiline
          numberOfLines={4}
          value={observacao}
          onChangeText={setObservacao}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={salvarManutencao}
        >
          <Text style={styles.buttonText}>
            Salvar manutenção
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