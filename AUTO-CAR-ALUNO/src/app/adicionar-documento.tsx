
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

type Documento = {
  id: string;
  tipo: string;
  numero: string;
  validade: string;
  observacao: string;
};

function chaveUsuario(email: string, tipo: string) {
  return `@autocare_${encodeURIComponent(email.trim().toLowerCase())}_${tipo}`;
}

export default function AdicionarDocumento() {
  const [tipo, setTipo] = useState('');
  const [numero, setNumero] = useState('');
  const [validade, setValidade] = useState('');
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

  async function salvarDocumento() {
    if (salvando) return;

    setMensagemSucesso(false);

    if (!tipo.trim() || !numero.trim() || !validade.trim()) {
      mostrarAlerta(
        'Campos obrigatórios',
        'Preencha o tipo, número e validade do documento.'
      );
      return;
    }

    try {
      setSalvando(true);

      const logado = await AsyncStorage.getItem('@autocare_logado');
      const usuarioSalvo = await AsyncStorage.getItem('@autocare_usuario');

      if (logado !== 'true' || !usuarioSalvo) {
        mostrarAlerta('Sessão encerrada', 'Faça login novamente para cadastrar documentos.');
        router.replace('/login');
        return;
      }

      const usuario = JSON.parse(usuarioSalvo);
      const email = usuario.email?.trim().toLowerCase();

      if (!email) {
        mostrarAlerta('Erro', 'Não foi possível identificar sua conta. Faça login novamente.');
        router.replace('/login');
        return;
      }

      const novoDocumento: Documento = {
        id: Date.now().toString(),
        tipo: tipo.trim(),
        numero: numero.trim(),
        validade: validade.trim(),
        observacao: observacao.trim(),
      };

      const chave = chaveUsuario(email, 'documentos');
      const dadosExistentes = await AsyncStorage.getItem(chave);

      let documentos: Documento[] = [];

      if (dadosExistentes) {
        const dadosConvertidos = JSON.parse(dadosExistentes);

        if (Array.isArray(dadosConvertidos)) {
          documentos = dadosConvertidos;
        }
      }

      documentos.push(novoDocumento);

      await AsyncStorage.setItem(chave, JSON.stringify(documentos));

      setTipo('');
      setNumero('');
      setValidade('');
      setObservacao('');

      if (Platform.OS === 'web') {
        setMensagemSucesso(true);
      } else {
        Alert.alert(
          'Documento salvo!',
          'O documento foi cadastrado com sucesso.'
        );
      }
    } catch (error) {
      console.log('ERRO AO SALVAR DOCUMENTO:', error);

      mostrarAlerta(
        'Erro',
        'Não foi possível salvar o documento.'
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
                source={require('../../assets/autocare/icon_documentos.png')}
                style={styles.headerImage}
                resizeMode="contain"
              />
            </View>

            <View style={styles.headerTexts}>
              <Text style={styles.title}>Novo documento</Text>
              <Text style={styles.subtitle}>
                Cadastre os documentos importantes do seu veículo.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.highlightCard}>
          <View style={styles.highlightImageBox}>
            <Image
              source={require('../../assets/autocare/icon_documentos.png')}
              style={styles.highlightImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.highlightContent}>
            <Text style={styles.highlightTitle}>
              Documentação organizada
            </Text>
            <Text style={styles.highlightText}>
              Mantenha os documentos do seu veículo registrados e acompanhe
              suas validades.
            </Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>
            Informações do documento
          </Text>

          <Text style={styles.sectionSubtitle}>
            Preencha os dados abaixo
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>Tipo do documento</Text>

            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons
                name="file-document-outline"
                size={21}
                color="#55ADFF"
              />

              <TextInput
                style={styles.input}
                placeholder="Ex.: CRLV, CNH, Seguro"
                placeholderTextColor="#8496AA"
                value={tipo}
                onChangeText={setTipo}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Número do documento</Text>

            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons
                name="numeric"
                size={21}
                color="#55ADFF"
              />

              <TextInput
                style={styles.input}
                placeholder="Digite o número"
                placeholderTextColor="#8496AA"
                value={numero}
                onChangeText={setNumero}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Data de validade</Text>

            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons
                name="calendar-month-outline"
                size={21}
                color="#55ADFF"
              />

              <TextInput
                style={styles.input}
                placeholder="Ex.: 28/09/2027"
                placeholderTextColor="#8496AA"
                keyboardType="numeric"
                value={validade}
                onChangeText={setValidade}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Observação</Text>

            <View style={[styles.inputWrapper, styles.observacaoWrapper]}>
              <MaterialCommunityIcons
                name="text-box-outline"
                size={21}
                color="#55ADFF"
                style={styles.observacaoIcon}
              />

              <TextInput
                style={[styles.input, styles.observacaoInput]}
                placeholder="Adicione alguma observação"
                placeholderTextColor="#8496AA"
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

              <View style={styles.sucessoContent}>
                <Text style={styles.sucessoTitulo}>
                  Documento salvo com sucesso!
                </Text>

                <Text style={styles.sucessoTexto}>
                  O documento foi adicionado ao histórico do Auto Care.
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.saveButton,
              salvando && styles.saveButtonDisabled,
            ]}
            onPress={salvarDocumento}
            activeOpacity={0.85}
            disabled={salvando}
          >
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={22}
              color="#FFFFFF"
            />

            <Text style={styles.saveButtonText}>
              {salvando ? 'Salvando...' : 'Salvar documento'}
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
              name="shield-check-outline"
              size={23}
              color="#55ADFF"
            />
          </View>

          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Dica Auto Care</Text>

            <Text style={styles.tipText}>
              Cadastre a data de validade corretamente para acompanhar quando
              o documento estiver próximo do vencimento.
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
    minHeight: 56,
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
    minHeight: 54,
    marginLeft: 10,
    color: '#FFFFFF',
    fontSize: 15,
  },
  observacaoWrapper: {
    alignItems: 'flex-start',
    paddingTop: 15,
    minHeight: 115,
  },
  observacaoIcon: {
    marginTop: 2,
  },
  observacaoInput: {
    height: 95,
    paddingTop: 0,
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
