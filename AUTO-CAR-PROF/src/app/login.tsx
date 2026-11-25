
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { salvarSessao, TipoUsuario } from '@/lib/aluguel';

type Usuario = {
  id?: string;
  nome: string;
  email: string;
  senha: string;
  tipo?: TipoUsuario;
};

const chaveUsuario = (email: string, tipo: string) =>
  `@autocare_${encodeURIComponent(email.trim().toLowerCase())}_${tipo}`;

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const entrar = async () => {
    if (carregando) return;

    if (!email.trim() || !senha) {
      Alert.alert('Atenção', 'Preencha o e-mail e a senha.');
      return;
    }

    setCarregando(true);

    try {
      const emailNormalizado = email.trim().toLowerCase();

      let usuarios: Usuario[] = JSON.parse(
        (await AsyncStorage.getItem('@autocare_usuarios')) || '[]'
      );

      // Recupera a conta do formato antigo, se ainda existir.
      const usuarioAntigoTexto = await AsyncStorage.getItem(
        '@autocare_usuario'
      );

      if (usuarioAntigoTexto) {
        try {
          const antigo = JSON.parse(usuarioAntigoTexto) as Usuario;

          if (
            antigo.email &&
            antigo.senha &&
            !usuarios.some(
              (u) => u.email.toLowerCase() === antigo.email.toLowerCase()
            )
          ) {
            usuarios.push(antigo);

            await AsyncStorage.setItem(
              '@autocare_usuarios',
              JSON.stringify(usuarios)
            );

            await AsyncStorage.setItem(
              '@autocare_dono_dados_antigos',
              antigo.email.toLowerCase()
            );
          }
        } catch {
          console.log('Não foi possível recuperar a conta antiga.');
        }
      }

      const usuario = usuarios.find(
        (u) => u.email.toLowerCase() === emailNormalizado
      );

      if (!usuario || usuario.senha !== senha) {
        Alert.alert('Erro', 'E-mail ou senha incorretos.');
        return;
      }

      // Transfere os dados antigos somente para o dono da conta antiga.
      const donoAntigo = await AsyncStorage.getItem(
        '@autocare_dono_dados_antigos'
      );

      if (donoAntigo === emailNormalizado) {
        const tipos = [
          'veiculos',
          'veiculo',
          'manutencoes',
          'revisoes',
          'documentos',
          'combustivel',
        ];

        for (const tipo of tipos) {
          const chaveNova = chaveUsuario(emailNormalizado, tipo);
          const dadoNovo = await AsyncStorage.getItem(chaveNova);
          const dadoAntigo = await AsyncStorage.getItem(`@autocare_${tipo}`);

          if (dadoNovo === null && dadoAntigo !== null) {
            await AsyncStorage.setItem(chaveNova, dadoAntigo);
          }
        }
      }

      // Salva qual usuário está conectado.
      await AsyncStorage.setItem(
        '@autocare_usuario',
        JSON.stringify(usuario)
      );

      await salvarSessao({
        id: usuario.id || emailNormalizado,
        nome: usuario.nome,
        email: emailNormalizado,
        tipo: usuario.tipo === 'proprietario' ? 'proprietario' : 'locatario',
      });

      await AsyncStorage.setItem('@autocare_logado', 'true');

      router.replace('/');
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      Alert.alert('Erro', 'Não foi possível entrar. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  const abrirCadastro = () => {
    router.push('/cadastro');
  };

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
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/autocare/autocare_logo.png')}
              style={styles.logoImagem}
              resizeMode="contain"
            />
          </View>

          <View style={styles.logoSlogan}>
            <View style={styles.linhaAzul} />
            <Text style={styles.logoSubtitulo}>
              SEU CARRO SEMPRE EM DIA
            </Text>
            <View style={styles.linhaAzul} />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardIcone}>
            <MaterialCommunityIcons
              name="account-circle-outline"
              size={32}
              color="#55ADFF"
            />
          </View>

          <Text style={styles.titulo}>Bem-vindo de volta!</Text>

          <Text style={styles.subtitulo}>
            Entre na sua conta para continuar
          </Text>

          <Text style={styles.label}>E-mail</Text>

          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons
              name="email-outline"
              size={21}
              color="#55ADFF"
            />

            <TextInput
              style={styles.input}
              placeholder="Digite seu e-mail"
              placeholderTextColor="#8496AA"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              selectionColor="#55ADFF"
              value={email}
              onChangeText={setEmail}
              editable={!carregando}
            />
          </View>

          <Text style={styles.label}>Senha</Text>

          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons
              name="lock-outline"
              size={21}
              color="#55ADFF"
            />

            <TextInput
              style={styles.input}
              placeholder="Digite sua senha"
              placeholderTextColor="#8496AA"
              secureTextEntry={!mostrarSenha}
              selectionColor="#55ADFF"
              value={senha}
              onChangeText={setSenha}
              editable={!carregando}
              onSubmitEditing={entrar}
              returnKeyType="go"
            />

            <TouchableOpacity
              onPress={() => setMostrarSenha(!mostrarSenha)}
              disabled={carregando}
            >
              <MaterialCommunityIcons
                name={mostrarSenha ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color="#8496AA"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.esqueciSenha}
            onPress={() => router.push('/esqueci-senha')}
            activeOpacity={0.8}
            disabled={carregando}
          >
            <Text style={styles.textoEsqueciSenha}>Esqueci minha senha</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.botao, carregando && styles.botaoDesativado]}
            onPress={entrar}
            activeOpacity={0.85}
            disabled={carregando}
          >
            {carregando ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.textoBotao}>ENTRAR</Text>
                <MaterialCommunityIcons
                  name="arrow-right"
                  size={22}
                  color="#FFFFFF"
                  style={styles.seta}
                />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.linhaDivisoria}>
            <View style={styles.divisor} />
            <Text style={styles.ouTexto}>OU</Text>
            <View style={styles.divisor} />
          </View>

          <Text style={styles.semConta}>
            Ainda não possui uma conta?
          </Text>

          <TouchableOpacity
            style={styles.botaoCadastro}
            onPress={abrirCadastro}
            activeOpacity={0.8}
            disabled={carregando}
          >
            <MaterialCommunityIcons
              name="account-plus-outline"
              size={20}
              color="#55ADFF"
            />

            <Text style={styles.textoCadastro}>
              CRIAR UMA CONTA
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.rodapeArea}>
          <MaterialCommunityIcons
            name="shield-check-outline"
            size={16}
            color="#55ADFF"
          />

          <Text style={styles.rodape}>
            Auto Care • Controle seu carro de forma simples
          </Text>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 35,
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 25,
  },
  logoContainer: {
    width: 230,
    height: 155,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImagem: {
    width: 230,
    height: 155,
  },
  logoSlogan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: -5,
  },
  linhaAzul: {
    width: 25,
    height: 2,
    backgroundColor: '#168BFF',
    borderRadius: 5,
  },
  logoSubtitulo: {
    color: '#9CB0C5',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  card: {
    backgroundColor: '#10243B',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1D3C5B',
  },
  cardIcone: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#183653',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 15,
  },
  titulo: {
    fontSize: 25,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 14,
    color: '#9CB0C5',
    textAlign: 'center',
    marginTop: 7,
    marginBottom: 27,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D5E2EF',
    marginBottom: 8,
  },
  inputWrapper: {
    height: 56,
    backgroundColor: '#0B1B30',
    borderRadius: 14,
    paddingHorizontal: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#294967',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    marginLeft: 11,
    fontSize: 15,
    color: '#FFFFFF',
    backgroundColor: 'transparent',
    paddingVertical: 0,
  },
  botao: {
    height: 57,
    backgroundColor: '#087BE5',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 5,
    elevation: 4,
    shadowColor: '#168BFF',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  esqueciSenha: {
    alignSelf: 'flex-end',
    marginTop: -10,
    marginBottom: 12,
    paddingVertical: 6,
  },
  textoEsqueciSenha: {
    color: '#55ADFF',
    fontSize: 13,
    fontWeight: '700',
  },
  botaoDesativado: {
    opacity: 0.7,
  },
  textoBotao: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
  seta: {
    marginLeft: 10,
  },
  linhaDivisoria: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divisor: {
    flex: 1,
    height: 1,
    backgroundColor: '#294967',
  },
  ouTexto: {
    color: '#849AB0',
    fontSize: 11,
    fontWeight: '700',
    marginHorizontal: 12,
  },
  semConta: {
    textAlign: 'center',
    color: '#9CB0C5',
    fontSize: 13,
    marginBottom: 13,
  },
  botaoCadastro: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#168BFF',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 9,
    backgroundColor: '#0B1B30',
  },
  textoCadastro: {
    color: '#55ADFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  rodapeArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 25,
    gap: 7,
  },
  rodape: {
    color: '#8496AA',
    fontSize: 11,
  },
});
