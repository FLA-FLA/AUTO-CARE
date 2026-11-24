import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';

export default function VeiculoScreen() {
  const router = useRouter();

  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [ano, setAno] = useState('');
  const [placa, setPlaca] = useState('');

  async function cadastrarVeiculo() {
    if (!marca.trim() || !modelo.trim() || !ano.trim() || !placa.trim()) {
      Alert.alert(
        'Atenção',
        'Preencha todos os campos do veículo.'
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
        '@autocare_veiculo',
        JSON.stringify(veiculo)
      );

      Alert.alert(
        'Veículo cadastrado!',
        `${veiculo.marca} ${veiculo.modelo} - ${veiculo.ano}\nPlaca: ${veiculo.placa}`,
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <View style={styles.iconBox}>
              <Image
                source={require('../../assets/autocare/icon_veiculo.png')}
                style={styles.headerImage}
                resizeMode="contain"
              />
            </View>

            <View>
              <Text style={styles.headerTitle}>
                Meu veículo
              </Text>

              <Text style={styles.headerSubtitle}>
                Informações do seu carro
              </Text>
            </View>
          </View>
        </View>

        {/* DESTAQUE */}
        <View style={styles.highlightCard}>
          <View style={styles.highlightImageBox}>
            <Image
              source={require('../../assets/autocare/icon_veiculo.png')}
              style={styles.highlightImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.highlightText}>
            <Text style={styles.highlightTitle}>
              Cadastre seu veículo
            </Text>

            <Text style={styles.highlightDescription}>
              Mantenha os dados do seu veículo salvos
              para acompanhar seus cuidados no Auto Care.
            </Text>
          </View>
        </View>

        {/* FORMULÁRIO */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Dados do veículo
          </Text>

          {/* MARCA */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Marca
            </Text>

            <View style={styles.inputContainer}>
              <MaterialCommunityIcons
                name="car"
                size={21}
                color="#208AEF"
              />

              <TextInput
                style={styles.input}
                placeholder="Ex: Volkswagen"
                placeholderTextColor="#9AA4AF"
                value={marca}
                onChangeText={setMarca}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* MODELO */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Modelo
            </Text>

            <View style={styles.inputContainer}>
              <MaterialCommunityIcons
                name="car-side"
                size={21}
                color="#208AEF"
              />

              <TextInput
                style={styles.input}
                placeholder="Ex: Gol"
                placeholderTextColor="#9AA4AF"
                value={modelo}
                onChangeText={setModelo}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* ANO */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Ano
            </Text>

            <View style={styles.inputContainer}>
              <MaterialCommunityIcons
                name="calendar"
                size={21}
                color="#208AEF"
              />

              <TextInput
                style={styles.input}
                placeholder="Ex: 2020"
                placeholderTextColor="#9AA4AF"
                keyboardType="numeric"
                maxLength={4}
                value={ano}
                onChangeText={setAno}
              />
            </View>
          </View>

          {/* PLACA */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Placa
            </Text>

            <View style={styles.inputContainer}>
              <MaterialCommunityIcons
                name="card-text-outline"
                size={21}
                color="#208AEF"
              />

              <TextInput
                style={styles.input}
                placeholder="Ex: ABC1D23"
                placeholderTextColor="#9AA4AF"
                autoCapitalize="characters"
                maxLength={7}
                value={placa}
                onChangeText={setPlaca}
              />
            </View>
          </View>

          {/* BOTÃO */}
          <TouchableOpacity
            style={styles.button}
            onPress={cadastrarVeiculo}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons
              name="content-save-check-outline"
              size={22}
              color="#FFFFFF"
            />

            <Text style={styles.buttonText}>
              Salvar veículo
            </Text>
          </TouchableOpacity>

          {/* CANCELAR */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelText}>
              Cancelar
            </Text>
          </TouchableOpacity>
        </View>

        {/* DICA */}
        <View style={styles.tipCard}>
          <MaterialCommunityIcons
            name="information-outline"
            size={22}
            color="#208AEF"
          />

          <Text style={styles.tipText}>
            Essas informações serão utilizadas para
            identificar seu veículo dentro do Auto Care.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },

  scrollContent: {
    paddingBottom: 35,
  },

  header: {
    backgroundColor: '#208AEF',
    paddingTop: 55,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconBox: {
    width: 62,
    height: 62,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },

  headerImage: {
    width: 45,
    height: 45,
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '800',
  },

  headerSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    marginTop: 4,
  },

  highlightCard: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  highlightImageBox: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: '#EAF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },

  highlightImage: {
    width: 52,
    height: 52,
  },

  highlightText: {
    flex: 1,
  },

  highlightTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#18202A',
    marginBottom: 5,
  },

  highlightDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: '#7C8794',
  },

  card: {
    marginHorizontal: 20,
    marginTop: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#18202A',
    marginBottom: 5,
  },

  fieldContainer: {
    marginTop: 16,
  },

  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#303944',
    marginBottom: 7,
  },

  inputContainer: {
    height: 52,
    borderWidth: 1,
    borderColor: '#DDE4EA',
    borderRadius: 13,
    backgroundColor: '#FAFBFC',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },

  input: {
    flex: 1,
    height: '100%',
    marginLeft: 10,
    fontSize: 15,
    color: '#18202A',
  },

  button: {
    height: 54,
    backgroundColor: '#208AEF',
    borderRadius: 14,
    marginTop: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  cancelButton: {
    alignItems: 'center',
    paddingVertical: 15,
  },

  cancelText: {
    color: '#7C8794',
    fontSize: 14,
    fontWeight: '700',
  },

  tipCard: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#EAF4FF',
    borderRadius: 16,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },

  tipText: {
    flex: 1,
    marginLeft: 10,
    color: '#52606D',
    fontSize: 13,
    lineHeight: 19,
  },
});