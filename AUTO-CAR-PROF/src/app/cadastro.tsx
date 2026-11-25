
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
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

type Usuario = {
  nome: string;
  email: string;
  senha: string;
  tipo: 'proprietario' | 'locatario';
};

const chaveUsuario = (email: string, tipo: string) =>
  `@autocare_${encodeURIComponent(email.trim().toLowerCase())}_${tipo}`;

export default function Cadastro() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [tipoConta, setTipoConta] = useState<'proprietario' | 'locatario' | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [tipoMensagem, setTipoMensagem] = useState<'erro' | 'sucesso' | ''>('');

  function mostrarMensagem(texto: string, tipo: 'erro' | 'sucesso') {
    setMensagem(texto);
    setTipoMensagem(tipo);

    if (Platform.OS !== 'web') {
      Alert.alert(tipo === 'erro' ? 'Atenção' : 'Sucesso', texto);
    }
  }

  async function criarConta() {
    if (carregando) return;

    setMensagem('');
    setTipoMensagem('');

    const emailNormalizado = email.trim().toLowerCase();

    if (!nome.trim() || !emailNormalizado || !senha || !confirmarSenha || !tipoConta) {
      mostrarMensagem('Preencha todos os campos.', 'erro');
      return;
    }

    if (!emailNormalizado.includes('@') || !emailNormalizado.includes('.')) {
      mostrarMensagem('Digite um e-mail válido.', 'erro');
      return;
    }

    if (senha.length < 4) {
      mostrarMensagem('A senha precisa ter pelo menos 4 caracteres.', 'erro');
      return;
    }

    if (senha !== confirmarSenha) {
      mostrarMensagem('As senhas não são iguais.', 'erro');
      return;
    }

    setCarregando(true);

    try {
      let usuarios: Usuario[] = JSON.parse(
        (await AsyncStorage.getItem('@autocare_usuarios')) || '[]'
      );

      // Preserva a conta antiga, caso exista.
      const usuarioAntigo = await AsyncStorage.getItem('@autocare_usuario');

      if (usuarioAntigo) {
        try {
          const antigo = JSON.parse(usuarioAntigo) as Usuario;

          if (
            antigo.email &&
            antigo.senha &&
            !usuarios.some(
              (u) => u.email.toLowerCase() === antigo.email.toLowerCase()
            )
          ) {
            usuarios.push(antigo);
            await AsyncStorage.setItem(
              '@autocare_dono_dados_antigos',
              antigo.email.toLowerCase()
            );
          }
        } catch {
          console.log('Não foi possível ler a conta antiga.');
        }
      }

      const contaExiste = usuarios.some(
        (u) => u.email.toLowerCase() === emailNormalizado
      );

      if (contaExiste) {
        mostrarMensagem('Já existe uma conta com esse e-mail.', 'erro');
        return;
      }

      const novoUsuario: Usuario = {
        nome: nome.trim(),
        email: emailNormalizado,
        senha,
        tipo: tipoConta,
      };

      usuarios.push(novoUsuario);

      await AsyncStorage.setItem(
        '@autocare_usuarios',
        JSON.stringify(usuarios)
      );

      // Cada conta começa com seus próprios dados vazios.
      const tipos = [
        'veiculos',
        'veiculo',
        'manutencoes',
        'revisoes',
        'documentos',
        'combustivel',
      ];

      for (const tipo of tipos) {
        const chave = chaveUsuario(emailNormalizado, tipo);
        const existente = await AsyncStorage.getItem(chave);

        if (existente === null) {
          await AsyncStorage.setItem(chave, JSON.stringify([]));
        }
      }

      await AsyncStorage.removeItem('@autocare_logado');

      if (Platform.OS === 'web') {
        setMensagem('Conta criada com sucesso! Redirecionando para o login...');
        setTipoMensagem('sucesso');

        setTimeout(() => router.replace('/login'), 800);
      } else {
        Alert.alert(
          'Conta criada!',
          'Sua conta foi criada com sucesso.',
          [{ text: 'ENTRAR', onPress: () => router.replace('/login') }]
        );
      }
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      mostrarMensagem(
        'Não foi possível criar sua conta. Tente novamente.',
        'erro'
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoArea}>
          <Image
            source={require('../../assets/autocare/autocare_logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.logoSubtitulo}>SEU CARRO SEMPRE EM DIA</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.titulo}>Criar sua conta</Text>
          <Text style={styles.subtitulo}>
            Cadastre-se para começar a cuidar do seu carro
          </Text>

          {mensagem !== '' && (
            <View
              style={[
                styles.mensagem,
                tipoMensagem === 'erro'
                  ? styles.mensagemErro
                  : styles.mensagemSucesso,
              ]}
            >
              <Text
                style={[
                  styles.mensagemTexto,
                  tipoMensagem === 'erro'
                    ? styles.textoErro
                    : styles.textoSucesso,
                ]}
              >
                {mensagem}
              </Text>
            </View>
          )}

          <Text style={styles.label}>Nome completo</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite seu nome"
            placeholderTextColor="#8496AA"
            value={nome}
            onChangeText={setNome}
            editable={!carregando}
            autoCapitalize="words"
          />

          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite seu e-mail"
            placeholderTextColor="#8496AA"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
            editable={!carregando}
          />

          <Text style={styles.label}>Quero me cadastrar como</Text>
          <View style={styles.opcoesTipo}>
            <TouchableOpacity
              style={[styles.opcaoTipo, tipoConta === 'locatario' && styles.opcaoTipoSelecionada]}
              onPress={() => setTipoConta('locatario')}
              disabled={carregando}
              accessibilityRole="radio"
              accessibilityState={{ checked: tipoConta === 'locatario' }}
            >
              <Text style={[styles.textoOpcaoTipo, tipoConta === 'locatario' && styles.textoOpcaoTipoSelecionada]}>Locatário</Text>
              <Text style={styles.descricaoTipo}>Quero alugar um carro</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.opcaoTipo, tipoConta === 'proprietario' && styles.opcaoTipoSelecionada]}
              onPress={() => setTipoConta('proprietario')}
              disabled={carregando}
              accessibilityRole="radio"
              accessibilityState={{ checked: tipoConta === 'proprietario' }}
            >
              <Text style={[styles.textoOpcaoTipo, tipoConta === 'proprietario' && styles.textoOpcaoTipoSelecionada]}>Locador</Text>
              <Text style={styles.descricaoTipo}>Quero anunciar meus carros</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Senha</Text>
          <TextInput
            style={styles.input}
            placeholder="Crie uma senha"
            placeholderTextColor="#8496AA"
            secureTextEntry
            value={senha}
            onChangeText={setSenha}
            editable={!carregando}
          />

          <Text style={styles.label}>Confirmar senha</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite a senha novamente"
            placeholderTextColor="#8496AA"
            secureTextEntry
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
            editable={!carregando}
          />

          <TouchableOpacity
            style={[styles.botao, carregando && styles.botaoDesativado]}
            onPress={criarConta}
            activeOpacity={0.8}
            disabled={carregando}
          >
            {carregando ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.textoBotao}>CRIAR CONTA →</Text>
            )}
          </TouchableOpacity>

          <View style={styles.linha} />

          <Text style={styles.jaTem}>Já possui uma conta?</Text>

          <TouchableOpacity
            style={styles.botaoLogin}
            onPress={() => router.replace('/login')}
            activeOpacity={0.8}
            disabled={carregando}
          >
            <Text style={styles.textoLogin}>VOLTAR PARA LOGIN</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.rodape}>
          Auto Care • Controle seu carro de forma simples
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07111F',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 30,
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 22,
  },
  logo: {
    width: 210,
    height: 135,
  },
  logoSubtitulo: {
    color: '#9CB0C5',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: -5,
  },
  card: {
    backgroundColor: '#10243B',
    borderRadius: 24,
    padding: 23,
    borderWidth: 1,
    borderColor: '#1D3C5B',
  },
  titulo: {
    fontSize: 25,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 13,
    color: '#9CB0C5',
    textAlign: 'center',
    marginTop: 7,
    marginBottom: 23,
    lineHeight: 19,
  },
  mensagem: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 17,
  },
  mensagemErro: {
    backgroundColor: '#51252B',
  },
  mensagemSucesso: {
    backgroundColor: '#16442F',
  },
  mensagemTexto: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    fontWeight: '600',
  },
  textoErro: {
    color: '#FFB4B4',
  },
  textoSucesso: {
    color: '#A6F0C2',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D5E2EF',
    marginBottom: 7,
  },
  input: {
    height: 52,
    backgroundColor: '#0B1B30',
    borderRadius: 13,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#294967',
    fontSize: 15,
    color: '#FFFFFF',
  },
  opcoesTipo: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  opcaoTipo: {
    flex: 1,
    minHeight: 68,
    justifyContent: 'center',
    paddingHorizontal: 11,
    paddingVertical: 10,
    backgroundColor: '#0B1B30',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#294967',
  },
  opcaoTipoSelecionada: {
    backgroundColor: '#123451',
    borderColor: '#168BFF',
  },
  textoOpcaoTipo: {
    color: '#D5E2EF',
    fontSize: 14,
    fontWeight: '800',
  },
  textoOpcaoTipoSelecionada: {
    color: '#55ADFF',
  },
  descricaoTipo: {
    color: '#8496AA',
    fontSize: 10,
    marginTop: 4,
  },
  botao: {
    height: 54,
    backgroundColor: '#087BE5',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    elevation: 3,
  },
  botaoDesativado: {
    opacity: 0.7,
  },
  textoBotao: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  linha: {
    height: 1,
    backgroundColor: '#294967',
    marginVertical: 20,
  },
  jaTem: {
    textAlign: 'center',
    color: '#9CB0C5',
    fontSize: 13,
    marginBottom: 11,
  },
  botaoLogin: {
    height: 48,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: '#168BFF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B1B30',
  },
  textoLogin: {
    color: '#55ADFF',
    fontSize: 13,
    fontWeight: '800',
  },
  rodape: {
    textAlign: 'center',
    color: '#8496AA',
    fontSize: 11,
    marginTop: 20,
  },
});
