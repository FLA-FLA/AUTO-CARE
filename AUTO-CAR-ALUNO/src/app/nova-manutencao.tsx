
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
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

type Usuario = {
  nome: string;
  email: string;
  senha?: string;
};

function chaveUsuario(email: string, tipo: string) {
  return `@autocare_${encodeURIComponent(email.trim().toLowerCase())}_${tipo}`;
}

export default function NovaManutencao() {
  const [servico, setServico] = useState('');
  const [data, setData] = useState('');
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

  async function salvarManutencao() {
    if (salvando) return;

    setMensagemSucesso(false);

    if (!servico.trim() || !data.trim() || !valor.trim()) {
      mostrarAlerta(
        'Campos obrigatórios',
        'Preencha o serviço, a data e o valor.'
      );
      return;
    }

    const valorNumerico = Number(
      valor.trim().replace(/\./g, '').replace(',', '.')
    );

    if (!Number.isFinite(valorNumerico) || valorNumerico <= 0) {
      mostrarAlerta(
        'Valor inválido',
        'Digite um valor válido para a manutenção.'
      );
      return;
    }

    try {
      setSalvando(true);

      // Identifica a conta que está conectada.
      const logado = await AsyncStorage.getItem('@autocare_logado');
      const usuarioSalvo = await AsyncStorage.getItem('@autocare_usuario');

      if (logado !== 'true' || !usuarioSalvo) {
        mostrarAlerta(
          'Sessão encerrada',
          'Faça login novamente para cadastrar uma manutenção.'
        );
        router.replace('/login');
        return;
      }

      const usuario: Usuario = JSON.parse(usuarioSalvo);

      if (!usuario.email) {
        mostrarAlerta('Erro', 'Não foi possível identificar sua conta.');
        router.replace('/login');
        return;
      }

      // Cada usuário possui sua própria lista de manutenções.
      const chave = chaveUsuario(usuario.email, 'manutencoes');

      const dadosSalvos = await AsyncStorage.getItem(chave);

      const manutencoes = dadosSalvos
        ? JSON.parse(dadosSalvos)
        : [];

      if (!Array.isArray(manutencoes)) {
        throw new Error('Lista de manutenções inválida.');
      }

      const novaManutencao = {
        id: Date.now().toString(),
        servico: servico.trim(),
        data: data.trim(),
        valor: valor.trim(),
        observacao: observacao.trim(),
      };

      manutencoes.push(novaManutencao);

      // Salva somente na conta do usuário conectado.
      await AsyncStorage.setItem(
        chave,
        JSON.stringify(manutencoes)
      );

      setServico('');
      setData('');
      setValor('');
      setObservacao('');

      if (Platform.OS === 'web') {
        setMensagemSucesso(true);
      } else {
        Alert.alert(
          'Cadastro realizado!',
          'Manutenção salva com sucesso no Auto Care!'
        );
      }
    } catch (error) {
      console.error('Erro ao salvar manutenção:', error);

      mostrarAlerta(
        'Erro',
        'Não foi possível salvar a manutenção. Tente novamente.'
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
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.voltar}
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color="#FFFFFF"
          />
          <Text style={styles.voltarTexto}>Voltar</Text>
        </TouchableOpacity>

        <View style={styles.cabecalho}>
          <View style={styles.iconePrincipal}>
            <MaterialCommunityIcons
              name="wrench"
              size={34}
              color="#168BFF"
            />
          </View>

          <Text style={styles.titulo}>Nova manutenção</Text>

          <Text style={styles.subtitulo}>
            Registre os serviços realizados no seu veículo.
          </Text>
        </View>

        <View style={styles.formulario}>
          <Text style={styles.label}>Serviço realizado *</Text>

          <View style={styles.inputContainer}>
            <MaterialCommunityIcons
              name="tools"
              size={21}
              color="#168BFF"
            />
            <TextInput
              style={styles.input}
              placeholder="Ex.: Troca de óleo"
              placeholderTextColor="#718096"
              value={servico}
              onChangeText={setServico}
            />
          </View>

          <Text style={styles.label}>Data da manutenção *</Text>

          <View style={styles.inputContainer}>
            <MaterialCommunityIcons
              name="calendar"
              size={21}
              color="#168BFF"
            />
            <TextInput
              style={styles.input}
              placeholder="DD/MM/AAAA"
              placeholderTextColor="#718096"
              value={data}
              onChangeText={setData}
              keyboardType="numeric"
              maxLength={10}
            />
          </View>

          <Text style={styles.label}>Valor pago (R$) *</Text>

          <View style={styles.inputContainer}>
            <MaterialCommunityIcons
              name="currency-brl"
              size={21}
              color="#168BFF"
            />
            <TextInput
              style={styles.input}
              placeholder="Ex.: 250,00"
              placeholderTextColor="#718096"
              value={valor}
              onChangeText={setValor}
              keyboardType="decimal-pad"
            />
          </View>

          <Text style={styles.label}>Observações</Text>

          <View style={[styles.inputContainer, styles.observacaoContainer]}>
            <MaterialCommunityIcons
              name="text-box-outline"
              size={21}
              color="#168BFF"
              style={styles.iconeObservacao}
            />
            <TextInput
              style={[styles.input, styles.observacaoInput]}
              placeholder="Informações adicionais sobre o serviço..."
              placeholderTextColor="#718096"
              value={observacao}
              onChangeText={setObservacao}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <Text style={styles.ajuda}>* Campos obrigatórios</Text>

          {mensagemSucesso && (
            <View style={styles.sucessoBox}>
              <MaterialCommunityIcons
                name="check-circle"
                size={27}
                color="#36C98F"
              />

              <View style={styles.sucessoInfo}>
                <Text style={styles.sucessoTitulo}>
                  Manutenção salva com sucesso!
                </Text>

                <Text style={styles.sucessoTexto}>
                  O registro foi adicionado ao histórico do Auto Care.
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.botaoSalvar,
              salvando && styles.botaoDesativado,
            ]}
            onPress={salvarManutencao}
            disabled={salvando}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="content-save"
              size={21}
              color="#FFFFFF"
            />

            <Text style={styles.textoBotao}>
              {salvando ? 'Salvando...' : 'Salvar manutenção'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.botaoCancelar}
            onPress={() => router.back()}
          >
            <Text style={styles.textoCancelar}>Cancelar</Text>
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
  scroll: {
    flexGrow: 1,
    padding: 22,
    paddingBottom: 40,
  },
  voltar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    gap: 9,
  },
  voltarTexto: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  cabecalho: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconePrincipal: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: '#102B49',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 17,
  },
  titulo: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: 'bold',
    marginBottom: 9,
  },
  subtitulo: {
    color: '#91A4BA',
    fontSize: 14,
    textAlign: 'center',
  },
  formulario: {
    backgroundColor: '#0D1C2E',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1B3450',
  },
  label: {
    color: '#E7EEF7',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 9,
    marginTop: 17,
  },
  inputContainer: {
    minHeight: 54,
    backgroundColor: '#071525',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#203B59',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 11,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    paddingVertical: 14,
  },
  observacaoContainer: {
    minHeight: 120,
    alignItems: 'flex-start',
    paddingTop: 14,
  },
  iconeObservacao: {
    marginTop: 2,
  },
  observacaoInput: {
    minHeight: 95,
  },
  ajuda: {
    color: '#718096',
    fontSize: 12,
    marginTop: 13,
  },
  sucessoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#103B35',
    borderColor: '#247B61',
    borderWidth: 1,
    borderRadius: 13,
    padding: 14,
    marginTop: 18,
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
  botaoSalvar: {
    height: 55,
    backgroundColor: '#147FE5',
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 25,
  },
  botaoDesativado: {
    opacity: 0.6,
  },
  textoBotao: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  botaoCancelar: {
    alignItems: 'center',
    padding: 16,
    marginTop: 5,
  },
  textoCancelar: {
    color: '#91A4BA',
    fontSize: 14,
    fontWeight: '600',
  },
});
