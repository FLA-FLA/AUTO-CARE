
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useState } from 'react';
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

type Abastecimento = {
  id: string;
  data: string;
  litros: string;
  valor: string;
  km: string;
};

function chaveUsuario(email: string, tipo: string) {
  return `@autocare_${encodeURIComponent(email.trim().toLowerCase())}_${tipo}`;
}

export default function AdicionarCombustivel() {
  const [data, setData] = useState('');
  const [litros, setLitros] = useState('');
  const [valor, setValor] = useState('');
  const [km, setKm] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState(false);

  function mostrarAlerta(titulo: string, mensagem: string) {
    if (Platform.OS === 'web') {
      window.alert(`${titulo}\n\n${mensagem}`);
    } else {
      Alert.alert(titulo, mensagem);
    }
  }

  async function salvarAbastecimento() {
    if (salvando) return;

    setMensagemSucesso(false);

    if (!data.trim() || !litros.trim() || !valor.trim() || !km.trim()) {
      mostrarAlerta(
        'Campos obrigatórios',
        'Preencha a data, litros, valor e quilometragem.'
      );
      return;
    }

    const litrosNumero = Number(litros.trim().replace(',', '.'));
    const valorNumero = Number(
      valor.trim().replace(/\./g, '').replace(',', '.')
    );
    const kmNumero = Number(
      km.trim().replace(/\./g, '').replace(',', '.')
    );

    if (
      !Number.isFinite(litrosNumero) ||
      !Number.isFinite(valorNumero) ||
      !Number.isFinite(kmNumero) ||
      litrosNumero <= 0 ||
      valorNumero <= 0 ||
      kmNumero < 0
    ) {
      mostrarAlerta(
        'Dados inválidos',
        'Confira os valores informados e tente novamente.'
      );
      return;
    }

    const novoAbastecimento: Abastecimento = {
      id: Date.now().toString(),
      data: data.trim(),
      litros: litros.trim(),
      valor: valor.trim(),
      km: km.trim(),
    };

    try {
      setSalvando(true);

      // Identifica o usuário conectado
      const logado = await AsyncStorage.getItem('@autocare_logado');
      const usuarioSalvo = await AsyncStorage.getItem('@autocare_usuario');

      if (logado !== 'true' || !usuarioSalvo) {
        mostrarAlerta(
          'Sessão encerrada',
          'Faça login novamente para registrar um abastecimento.'
        );
        router.replace('/login');
        return;
      }

      const usuario = JSON.parse(usuarioSalvo);
      const email = usuario.email?.trim().toLowerCase();

      if (!email) {
        mostrarAlerta(
          'Erro de identificação',
          'Não foi possível identificar sua conta. Entre novamente.'
        );
        router.replace('/login');
        return;
      }

      // Chave exclusiva para o combustível deste usuário
      const CHAVE_COMBUSTIVEL = chaveUsuario(email, 'combustivel');

      const dadosExistentes = await AsyncStorage.getItem(CHAVE_COMBUSTIVEL);

      let abastecimentos: Abastecimento[] = [];

      if (dadosExistentes) {
        const dadosConvertidos = JSON.parse(dadosExistentes);

        if (Array.isArray(dadosConvertidos)) {
          abastecimentos = dadosConvertidos;
        }
      }

      abastecimentos.push(novoAbastecimento);

      await AsyncStorage.setItem(
        CHAVE_COMBUSTIVEL,
        JSON.stringify(abastecimentos)
      );

      setData('');
      setLitros('');
      setValor('');
      setKm('');

      if (Platform.OS === 'web') {
        setMensagemSucesso(true);
      } else {
        Alert.alert(
          'Abastecimento salvo!',
          'O abastecimento foi registrado com sucesso.'
        );
      }
    } catch (error) {
      console.log('ERRO AO SALVAR ABASTECIMENTO:', error);

      mostrarAlerta(
        'Erro',
        'Não foi possível salvar o abastecimento.'
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <View style={styles.headerImageBox}>
              <Image
                source={require('../../assets/autocare/icon_combustivel.png')}
                style={styles.headerImage}
                resizeMode="contain"
              />
            </View>

            <View style={styles.headerTexts}>
              <Text style={styles.title}>Novo abastecimento</Text>
              <Text style={styles.subtitle}>
                Registre seu abastecimento e acompanhe seus gastos.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.highlightCard}>
          <View style={styles.highlightImageBox}>
            <Image
              source={require('../../assets/autocare/icon_combustivel.png')}
              style={styles.highlightImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.highlightContent}>
            <Text style={styles.highlightTitle}>
              Controle de combustível
            </Text>
            <Text style={styles.highlightText}>
              Registre litros, valor e quilometragem para manter seu histórico
              organizado.
            </Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>
            Informações do abastecimento
          </Text>
          <Text style={styles.sectionSubtitle}>
            Preencha os dados abaixo
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>Data</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons
                name="calendar-month-outline"
                size={21}
                color="#55ADFF"
              />
              <TextInput
                style={styles.input}
                placeholder="Ex.: 28/09/2026"
                placeholderTextColor="#8496AA"
                keyboardType="numeric"
                value={data}
                onChangeText={setData}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Litros abastecidos</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons
                name="gas-station-outline"
                size={21}
                color="#55ADFF"
              />
              <TextInput
                style={styles.input}
                placeholder="Ex.: 35,5"
                placeholderTextColor="#8496AA"
                keyboardType="decimal-pad"
                value={litros}
                onChangeText={setLitros}
              />
              <Text style={styles.unit}>L</Text>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Valor pago</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons
                name="currency-brl"
                size={21}
                color="#55ADFF"
              />
              <TextInput
                style={styles.input}
                placeholder="Ex.: 210,00"
                placeholderTextColor="#8496AA"
                keyboardType="decimal-pad"
                value={valor}
                onChangeText={setValor}
              />
              <Text style={styles.unit}>R$</Text>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Quilometragem</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons
                name="car-speed-limiter"
                size={21}
                color="#55ADFF"
              />
              <TextInput
                style={styles.input}
                placeholder="Ex.: 85.420"
                placeholderTextColor="#8496AA"
                keyboardType="numeric"
                value={km}
                onChangeText={setKm}
              />
              <Text style={styles.unit}>km</Text>
            </View>
          </View>

          {mensagemSucesso && (
            <View style={styles.sucessoBox}>
              <MaterialCommunityIcons
                name="check-circle"
                size={27}
                color="#36C98F"
              />

              <View style={styles.sucessoContent}>
                <Text style={styles.sucessoTitulo}>
                  Abastecimento salvo com sucesso!
                </Text>

                <Text style={styles.sucessoTexto}>
                  O registro foi adicionado ao histórico do Auto Care.
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.saveButton,
              salvando && styles.saveButtonDisabled,
            ]}
            onPress={salvarAbastecimento}
            activeOpacity={0.85}
            disabled={salvando}
          >
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={22}
              color="#FFFFFF"
            />
            <Text style={styles.saveButtonText}>
              {salvando ? 'Salvando...' : 'Salvar abastecimento'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tipCard}>
          <View style={styles.tipIcon}>
            <MaterialCommunityIcons
              name="information-outline"
              size={23}
              color="#55ADFF"
            />
          </View>

          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Dica Auto Care</Text>
            <Text style={styles.tipText}>
              Informe a quilometragem sempre que abastecer. Assim você terá um
              histórico mais completo do seu veículo.
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07111F',
  },
  header: {
    backgroundColor: '#0B1B30',
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    borderBottomWidth: 1,
    borderColor: '#183653',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#183653',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  backArrow: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '300',
    lineHeight: 36,
    marginTop: -3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerImageBox: {
    width: 78,
    height: 78,
    borderRadius: 22,
    backgroundColor: '#10243B',
    borderWidth: 1,
    borderColor: '#285078',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerImage: {
    width: 62,
    height: 62,
  },
  headerTexts: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '800',
  },
  subtitle: {
    color: '#A8BDD2',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  highlightCard: {
    backgroundColor: '#10243B',
    marginHorizontal: 20,
    marginTop: 18,
    borderRadius: 20,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1D3C5B',
  },
  highlightImageBox: {
    width: 66,
    height: 66,
    borderRadius: 19,
    backgroundColor: '#183653',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  highlightImage: {
    width: 52,
    height: 52,
  },
  highlightContent: {
    flex: 1,
  },
  highlightTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  highlightText: {
    color: '#9CB0C5',
    fontSize: 12,
    lineHeight: 18,
  },
  formCard: {
    backgroundColor: '#10243B',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1D3C5B',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: '#849AB0',
    fontSize: 12,
    marginTop: 4,
  },
  field: {
    marginTop: 18,
  },
  label: {
    color: '#D5E2EF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  inputWrapper: {
    height: 56,
    borderWidth: 1,
    borderColor: '#294967',
    borderRadius: 15,
    backgroundColor: '#0B1B30',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    height: '100%',
    marginLeft: 10,
    color: '#FFFFFF',
    fontSize: 15,
  },
  unit: {
    color: '#9CB0C5',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  sucessoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#103B35',
    borderColor: '#247B61',
    borderWidth: 1,
    borderRadius: 13,
    padding: 14,
    marginTop: 20,
  },
  sucessoContent: {
    flex: 1,
    marginLeft: 10,
  },
  sucessoTitulo: {
    color: '#55E0A8',
    fontSize: 14,
    fontWeight: '800',
  },
  sucessoTexto: {
    color: '#C0E9D9',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 18,
  },
  saveButton: {
    height: 57,
    backgroundColor: '#087BE5',
    borderRadius: 16,
    marginTop: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#168BFF',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 9,
  },
  cancelButton: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },
  cancelButtonText: {
    color: '#9CB0C5',
    fontSize: 15,
    fontWeight: '700',
  },
  tipCard: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#10243B',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#1D3C5B',
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: '#183653',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  tipText: {
    color: '#9CB0C5',
    fontSize: 13,
    lineHeight: 19,
  },
  bottomSpace: {
    height: 30,
  },
});
