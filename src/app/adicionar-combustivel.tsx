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

const CHAVE_COMBUSTIVEL = '@autocare_combustivel';

export default function AdicionarCombustivel() {
  const [data, setData] = useState('');
  const [litros, setLitros] = useState('');
  const [valor, setValor] = useState('');
  const [km, setKm] = useState('');

  async function salvarAbastecimento() {
    if (
      !data.trim() ||
      !litros.trim() ||
      !valor.trim() ||
      !km.trim()
    ) {
      Alert.alert(
        'Atenção',
        'Preencha a data, os litros, o valor e a quilometragem.'
      );
      return;
    }

    const novoAbastecimento = {
      id: Date.now().toString(),
      data: data.trim(),
      litros: litros.trim(),
      valor: valor.trim(),
      km: km.trim(),
    };

    try {
      const dadosExistentes = await AsyncStorage.getItem(
        CHAVE_COMBUSTIVEL
      );

      const abastecimentos = dadosExistentes
        ? JSON.parse(dadosExistentes)
        : [];

      abastecimentos.push(novoAbastecimento);

      await AsyncStorage.setItem(
        CHAVE_COMBUSTIVEL,
        JSON.stringify(abastecimentos)
      );

      Alert.alert(
        'Abastecimento cadastrado! ⛽',
        'O abastecimento foi salvo com sucesso.',
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
        'ERRO AO SALVAR ABASTECIMENTO:',
        error
      );

      Alert.alert(
        'Erro',
        'Não foi possível salvar o abastecimento.'
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
          Adicionar abastecimento
        </Text>

        <Text style={styles.subtitle}>
          Registre um abastecimento do seu veículo
        </Text>
      </View>

      <View style={styles.form}>
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
          Litros abastecidos
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Ex.: 40,5"
          keyboardType="decimal-pad"
          value={litros}
          onChangeText={setLitros}
        />

        <Text style={styles.label}>
          Valor pago
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Ex.: 250,00"
          keyboardType="decimal-pad"
          value={valor}
          onChangeText={setValor}
        />

        <Text style={styles.label}>
          Quilometragem
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Ex.: 85000"
          keyboardType="numeric"
          value={km}
          onChangeText={setKm}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={salvarAbastecimento}
        >
          <Text style={styles.buttonText}>
            Salvar abastecimento
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