
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Revisao = {
  id: string;
  tipo: string;
  data: string;
  km: string;
  valor: string;
  observacao: string;
  veiculoId?: string;
};

function chaveUsuario(email: string, tipo: string) {
  return `@autocare_${encodeURIComponent(email.trim().toLowerCase())}_${tipo}`;
}

export default function AdicionarRevisao() {
  const { veiculoId } = useLocalSearchParams<{ veiculoId?: string }>();
  const [tipo, setTipo] = useState('');
  const [data, setData] = useState('');
  const [km, setKm] = useState('');
  const [valor, setValor] = useState('');
  const [observacao, setObservacao] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState(false);

  function mostrarAlerta(titulo: string, mensagem: string) {
    if (Platform.OS === 'web') {
      window.alert(`${titulo}\n\n${mensagem}`);
    } else {
      Alert.alert(titulo, mensagem);
    }
  }

  function converterValor(numero: string) {
    const valorLimpo = numero.trim().replace(/[R$\s]/g, '');

    if (valorLimpo.includes(',')) {
      return Number(
        valorLimpo.replace(/\./g, '').replace(',', '.')
      );
    }

    return Number(valorLimpo);
  }

  async function salvarRevisao() {
    if (salvando) return;

    setMensagemSucesso(false);

    if (!tipo.trim() || !data.trim() || !km.trim()) {
      mostrarAlerta(
        'Campos obrigatórios',
        'Preencha o tipo de revisão, a data e a quilometragem.'
      );
      return;
    }

    const kmNumero = Number(
      km.trim().replace(/\./g, '').replace(',', '.')
    );

    if (!Number.isFinite(kmNumero) || kmNumero < 0) {
      mostrarAlerta(
        'Quilometragem inválida',
        'Informe uma quilometragem válida.'
      );
      return;
    }

    const valorNumero = valor.trim() ? converterValor(valor) : 0;

    if (!Number.isFinite(valorNumero) || valorNumero < 0) {
      mostrarAlerta(
        'Valor inválido',
        'Informe um valor válido para a revisão.'
      );
      return;
    }

    const novaRevisao: Revisao = {
      id: Date.now().toString(),
      tipo: tipo.trim(),
      data: data.trim(),
      km: km.trim(),
      valor: valorNumero.toFixed(2),
      observacao: observacao.trim(),
      veiculoId,
    };

    try {
      setSalvando(true);

      // Verifica se existe um usuário conectado
      const logado = await AsyncStorage.getItem('@autocare_logado');
      const usuarioSalvo = await AsyncStorage.getItem('@autocare_usuario');

      if (logado !== 'true' || !usuarioSalvo) {
        mostrarAlerta(
          'Sessão encerrada',
          'Faça login novamente para registrar uma revisão.'
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

      // Cada usuário possui sua própria lista de revisões
      const CHAVE_REVISOES = chaveUsuario(email, 'revisoes');

      const dadosExistentes = await AsyncStorage.getItem(CHAVE_REVISOES);

      let revisoes: Revisao[] = [];

      if (dadosExistentes) {
        const dadosConvertidos = JSON.parse(dadosExistentes);

        if (Array.isArray(dadosConvertidos)) {
          revisoes = dadosConvertidos;
        }
      }

      revisoes.push(novaRevisao);

      await AsyncStorage.setItem(
        CHAVE_REVISOES,
        JSON.stringify(revisoes)
      );

      setTipo('');
      setData('');
      setKm('');
      setValor('');
      setObservacao('');

      if (Platform.OS === 'web') {
        setMensagemSucesso(true);
      } else {
        Alert.alert(
          'Revisão registrada!',
          'A revisão foi salva com sucesso no histórico do veículo.'
        );
      }
    } catch (error) {
      console.log('ERRO AO SALVAR REVISÃO:', error);

      mostrarAlerta(
        'Erro',
        'Não foi possível salvar a revisão. Tente novamente.'
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
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <View style={styles.headerIcon}>
            <MaterialCommunityIcons
              name="clipboard-check-outline"
              size={32}
              color="#55ADFF"
            />
          </View>

          <Text style={styles.title}>Nova revisão</Text>

          <Text style={styles.subtitle}>
            Registre uma revisão realizada no seu veículo
          </Text>
        </View>

        <View style={styles.content}>
          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <MaterialCommunityIcons
                name="information-outline"
                size={23}
                color="#55ADFF"
              />
            </View>

            <View style={styles.infoTextArea}>
              <Text style={styles.infoTitle}>
                Mantenha seu histórico atualizado
              </Text>

              <Text style={styles.infoText}>
                Registre a revisão, a quilometragem e o valor gasto
                para acompanhar os cuidados do seu veículo.
              </Text>
            </View>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>
              Informações da revisão
            </Text>

            <Text style={styles.sectionSubtitle}>
              Preencha os dados abaixo
            </Text>

            <View style={styles.field}>
              <Text style={styles.label}>Tipo de revisão</Text>

              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons
                  name="clipboard-text-outline"
                  size={21}
                  color="#55ADFF"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Ex.: Revisão de 10.000 km"
                  placeholderTextColor="#71869D"
                  value={tipo}
                  onChangeText={setTipo}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Data da revisão</Text>

              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons
                  name="calendar-month-outline"
                  size={21}
                  color="#55ADFF"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Ex.: 28/09/2026"
                  placeholderTextColor="#71869D"
                  keyboardType="numeric"
                  value={data}
                  onChangeText={setData}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Quilometragem</Text>

              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons
                  name="speedometer"
                  size={21}
                  color="#55ADFF"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Ex.: 10.500"
                  placeholderTextColor="#71869D"
                  keyboardType="numeric"
                  value={km}
                  onChangeText={setKm}
                />

                <Text style={styles.unit}>km</Text>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Valor gasto (R$)</Text>

              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons
                  name="currency-brl"
                  size={21}
                  color="#55ADFF"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Ex.: 250,00"
                  placeholderTextColor="#71869D"
                  keyboardType="decimal-pad"
                  value={valor}
                  onChangeText={setValor}
                />
              </View>

              <Text style={styles.helperText}>
                Se a revisão não teve custo, deixe em branco.
              </Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Observações</Text>

              <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                <MaterialCommunityIcons
                  name="text-box-outline"
                  size={21}
                  color="#55ADFF"
                  style={styles.textAreaIcon}
                />

                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Ex.: Filtros e óleo verificados"
                  placeholderTextColor="#71869D"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  value={observacao}
                  onChangeText={setObservacao}
                />
              </View>
            </View>

            {mensagemSucesso && (
              <View style={styles.sucessoBox}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={27}
                  color="#36C98F"
                />

                <View style={styles.sucessoInfo}>
                  <Text style={styles.sucessoTitulo}>
                    Revisão salva com sucesso!
                  </Text>

                  <Text style={styles.sucessoTexto}>
                    O registro foi adicionado ao histórico do Auto Care.
                  </Text>
                </View>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.saveButton,
              salvando && styles.saveButtonDisabled,
            ]}
            onPress={salvarRevisao}
            activeOpacity={0.85}
            disabled={salvando}
          >
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={23}
              color="#FFFFFF"
            />

            <Text style={styles.saveButtonText}>
              {salvando ? 'Salvando...' : 'Salvar revisão'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
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
    paddingTop: 55,
    paddingHorizontal: 20,
    paddingBottom: 32,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    borderBottomWidth: 1,
    borderColor: '#183653',
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#193B5D',
    borderWidth: 1,
    borderColor: '#285078',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 21,
    backgroundColor: '#193B5D',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 17,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: '#91A8C0',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 35,
  },
  infoCard: {
    backgroundColor: '#102B45',
    borderRadius: 17,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#285078',
  },
  infoIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: '#193B5D',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 11,
  },
  infoTextArea: {
    flex: 1,
  },
  infoTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  infoText: {
    color: '#A9BCD0',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  formCard: {
    backgroundColor: '#10243B',
    borderRadius: 21,
    padding: 19,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#1D3C5B',
  },
  sectionTitle: {
    color: '#F3F7FC',
    fontSize: 19,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: '#8195AB',
    fontSize: 13,
    marginTop: 4,
    marginBottom: 8,
  },
  field: {
    marginTop: 15,
  },
  label: {
    color: '#DCE8F5',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 7,
  },
  inputWrapper: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: '#294762',
    borderRadius: 14,
    backgroundColor: '#0B1B30',
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    marginLeft: 10,
    paddingVertical: 12,
  },
  unit: {
    color: '#55ADFF',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 5,
  },
  helperText: {
    color: '#8195AB',
    fontSize: 11,
    marginTop: 6,
  },
  textAreaWrapper: {
    minHeight: 115,
    alignItems: 'flex-start',
    paddingTop: 13,
  },
  textAreaIcon: {
    marginTop: 2,
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
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
  sucessoInfo: {
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
    height: 56,
    backgroundColor: '#087BE5',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#168BFF',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 8,
  },
  cancelButton: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
  },
  cancelButtonText: {
    color: '#91A8C0',
    fontSize: 14,
    fontWeight: '700',
  },
});
