import {
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';

export default function VeiculoScreen() {
  const router = useRouter();

  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [ano, setAno] = useState('');
  const [placa, setPlaca] = useState('');

  async function cadastrarVeiculo() {
    if (!marca || !modelo || !ano || !placa) {
      Alert.alert(
        'Atenção',
        'Preencha todos os campos do veículo.'
      );
      return;
    }

    const veiculo = {
      marca,
      modelo,
      ano,
      placa,
    };

    try {
      await AsyncStorage.setItem(
        '@autocare_veiculo',
        JSON.stringify(veiculo)
      );

      Alert.alert(
        'Veículo cadastrado!',
        `${marca} ${modelo} - ${ano}\nPlaca: ${placa}`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Erro',
        'Não foi possível salvar o veículo.'
      );
    }
  }

  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        🚗 Meu veículo
      </Text>

      <Text style={styles.subtitle}>
        Cadastre seu veículo no Auto Care.
      </Text>

      <View style={styles.card}>

        <Text style={styles.label}>
          Marca
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Ex: Volkswagen"
          value={marca}
          onChangeText={setMarca}
        />

        <Text style={styles.label}>
          Modelo
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Ex: Gol"
          value={modelo}
          onChangeText={setModelo}
        />

        <Text style={styles.label}>
          Ano
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Ex: 2020"
          keyboardType="numeric"
          value={ano}
          onChangeText={setAno}
        />

        <Text style={styles.label}>
          Placa
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Ex: ABC1D23"
          autoCapitalize="characters"
          value={placa}
          onChangeText={setPlaca}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={cadastrarVeiculo}
        >
          <Text style={styles.buttonText}>
            Cadastrar veículo
          </Text>
        </TouchableOpacity>

      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FA',
    padding: 24,
    paddingTop: 70,
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#208AEF',
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 25,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 3,
  },

  label: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
    marginTop: 10,
  },

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#D5DCE3',
    borderRadius: 10,
    paddingHorizontal: 15,
    backgroundColor: '#FAFAFA',
    fontSize: 16,
  },

  button: {
    backgroundColor: '#208AEF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 25,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});