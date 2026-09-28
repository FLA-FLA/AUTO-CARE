import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const CHAVE_VEICULO = '@autocare_veiculo';

export default function AdicionarVeiculo() {
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [ano, setAno] = useState('');
  const [placa, setPlaca] = useState('');
  const [editando, setEditando] = useState(false);

  useEffect(() => {
    carregarVeiculo();
  }, []);

  async function carregarVeiculo() {
    try {
      const dados = await AsyncStorage.getItem(CHAVE_VEICULO);

      if (dados) {
        const veiculo = JSON.parse(dados);

        setMarca(veiculo.marca || '');
        setModelo(veiculo.modelo || '');
        setAno(veiculo.ano || '');
        setPlaca(veiculo.placa || '');

        setEditando(true);
      }
    } catch (error) {
      console.log('ERRO AO CARREGAR VEÍCULO:', error);
    }
  }

  async function salvarVeiculo() {
    if (
      !marca.trim() ||
      !modelo.trim() ||
      !ano.trim() ||
      !placa.trim()
    ) {
      Alert.alert(
        'Atenção',
        'Preencha todas as informações do veículo.'
      );
      return;
    }

    const veiculo = {
      marca: marca.trim(),
      modelo: modelo.trim(),
      ano: ano.trim(),
      placa: placa.trim().toUpperCase(),
    };

    try {
      await AsyncStorage.setItem(
        CHAVE_VEICULO,
        JSON.stringify(veiculo)
      );

      console.log('VEÍCULO SALVO:', veiculo);

      Alert.alert(
        editando
          ? 'Veículo atualizado! 🚗'
          : 'Veículo cadastrado! 🚗',
        `${veiculo.marca} ${veiculo.modelo}\nAno: ${veiculo.ano}\nPlaca: ${veiculo.placa}`,
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
      console.log('ERRO AO SALVAR:', error);

      Alert.alert(
        'Erro',
        'Não foi possível salvar o veículo.'
      );
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.voltar}>‹ Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.title}>
          {editando ? 'Alterar veículo' : 'Adicionar veículo'}
        </Text>

        <Text style={styles.subtitle}>
          {editando
            ? 'Edite os dados do seu veículo'
            : 'Cadastre seu veículo no Auto Care'}
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Marca</Text>

        <TextInput
          style={styles.input}
          placeholder="Ex.: Volkswagen"
          value={marca}
          onChangeText={setMarca}
        />

        <Text style={styles.label}>Modelo</Text>

        <TextInput
          style={styles.input}
          placeholder="Ex.: Gol"
          value={modelo}
          onChangeText={setModelo}
        />

        <Text style={styles.label}>Ano</Text>

        <TextInput
          style={styles.input}
          placeholder="Ex.: 2020"
          keyboardType="numeric"
          value={ano}
          onChangeText={setAno}
        />

        <Text style={styles.label}>Placa</Text>

        <TextInput
          style={styles.input}
          placeholder="Ex.: ABC1D23"
          autoCapitalize="characters"
          value={placa}
          onChangeText={setPlaca}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={salvarVeiculo}
        >
          <Text style={styles.buttonText}>
            {editando ? 'Salvar alterações' : 'Salvar veículo'}
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