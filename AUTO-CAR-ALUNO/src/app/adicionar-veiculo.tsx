
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';

type Veiculo = {
  id: string;
  marca: string;
  modelo: string;
  ano: string;
  placa: string;
};

type Usuario = {
  nome: string;
  email: string;
  senha?: string;
};

function chaveUsuario(email: string, tipo: string) {
  return `@autocare_${encodeURIComponent(email.trim().toLowerCase())}_${tipo}`;
}

export default function AdicionarVeiculo() {
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [ano, setAno] = useState('');
  const [placa, setPlaca] = useState('');
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState(false);

  useEffect(() => {
    carregarVeiculos();
  }, []);

  const carregarVeiculos = async () => {
    try {
      const logado = await AsyncStorage.getItem('@autocare_logado');
      const usuarioSalvo = await AsyncStorage.getItem('@autocare_usuario');

      if (logado !== 'true' || !usuarioSalvo) {
        router.replace('/login');
        return;
      }

      const usuario: Usuario = JSON.parse(usuarioSalvo);

      if (!usuario.email) {
        router.replace('/login');
        return;
      }

      const chaveVeiculos = chaveUsuario(usuario.email, 'veiculos');
      const chaveVeiculoAntigo = chaveUsuario(usuario.email, 'veiculo');

      const dadosLista = await AsyncStorage.getItem(chaveVeiculos);
      const dadosAntigos = await AsyncStorage.getItem(chaveVeiculoAntigo);

      let lista: Veiculo[] = [];

      if (dadosLista) {
        const dados = JSON.parse(dadosLista);

        if (Array.isArray(dados)) {
          lista = dados;
        }
      }

      if (dadosAntigos) {
        const antigo = JSON.parse(dadosAntigos);

        if (
          antigo &&
          antigo.marca &&
          antigo.modelo &&
          !lista.some((v) => v.placa === antigo.placa)
        ) {
          lista.unshift({
            id: antigo.id || String(Date.now()),
            marca: antigo.marca,
            modelo: antigo.modelo,
            ano: antigo.ano || '',
            placa: antigo.placa || '',
          });
        }
      }

      await AsyncStorage.setItem(
        chaveVeiculos,
        JSON.stringify(lista)
      );

      setVeiculos(lista);
    } catch (error) {
      console.log('Erro ao carregar veículos:', error);
    }
  };

  const mostrarAlerta = (titulo: string, mensagem: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${titulo}\n\n${mensagem}`);
    } else {
      Alert.alert(titulo, mensagem);
    }
  };

  const salvarVeiculo = async () => {
    if (salvando) return;

    setMensagemSucesso(false);

    if (
      !marca.trim() ||
      !modelo.trim() ||
      !ano.trim() ||
      !placa.trim()
    ) {
      mostrarAlerta('Atenção', 'Preencha todos os campos.');
      return;
    }

    if (!/^\d{4}$/.test(ano.trim())) {
      mostrarAlerta('Atenção', 'Digite um ano válido com 4 números.');
      return;
    }

    setSalvando(true);

    try {
      const usuarioSalvo = await AsyncStorage.getItem('@autocare_usuario');

      if (!usuarioSalvo) {
        mostrarAlerta(
          'Sessão encerrada',
          'Faça login novamente para cadastrar um veículo.'
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

      const chaveVeiculos = chaveUsuario(usuario.email, 'veiculos');
      const chaveVeiculoAntigo = chaveUsuario(usuario.email, 'veiculo');

      // Busca novamente os veículos salvos na conta atual.
      const dadosSalvos = await AsyncStorage.getItem(chaveVeiculos);

      let listaAtual: Veiculo[] = [];

      if (dadosSalvos) {
        const dados = JSON.parse(dadosSalvos);

        if (Array.isArray(dados)) {
          listaAtual = dados;
        }
      }

      const placaFormatada = placa.trim().toUpperCase();

      const placaExiste = listaAtual.some(
        (v) => v.placa.toUpperCase() === placaFormatada
      );

      if (placaExiste) {
        mostrarAlerta(
          'Veículo já cadastrado',
          'Já existe um veículo cadastrado com essa placa.'
        );
        return;
      }

      const novoVeiculo: Veiculo = {
        id: `${Date.now()}`,
        marca: marca.trim(),
        modelo: modelo.trim(),
        ano: ano.trim(),
        placa: placaFormatada,
      };

      const novaLista = [...listaAtual, novoVeiculo];

      // Salva os veículos somente na conta do usuário conectado.
      await AsyncStorage.setItem(
        chaveVeiculos,
        JSON.stringify(novaLista)
      );

      // Mantém também o primeiro veículo no formato antigo,
      // mas dentro da conta do próprio usuário.
      await AsyncStorage.setItem(
        chaveVeiculoAntigo,
        JSON.stringify(novaLista[0])
      );

      setVeiculos(novaLista);

      setMarca('');
      setModelo('');
      setAno('');
      setPlaca('');

      if (Platform.OS === 'web') {
        setMensagemSucesso(true);
      } else {
        Alert.alert(
          'Cadastro realizado!',
          `${novoVeiculo.marca} ${novoVeiculo.modelo} foi salvo com sucesso!`
        );
      }
    } catch (error) {
      console.log('Erro ao salvar veículo:', error);

      mostrarAlerta(
        'Erro',
        'Não foi possível salvar o veículo. Tente novamente.'
      );
    } finally {
      setSalvando(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.botaoVoltar}
            onPress={() => router.back()}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={25}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <View style={styles.headerTextos}>
            <Text style={styles.headerTitulo}>Adicionar veículo</Text>
            <Text style={styles.headerSubtitulo}>
              Gerencie todos os seus carros
            </Text>
          </View>

          <View style={styles.headerIcone}>
            <MaterialCommunityIcons
              name="car-multiple"
              size={38}
              color="#FFFFFF"
            />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.iconePrincipal}>
            <MaterialCommunityIcons
              name="car-plus"
              size={48}
              color="#55ADFF"
            />
          </View>

          <Text style={styles.titulo}>Novo veículo</Text>

          <Text style={styles.subtitulo}>
            Cadastre quantos veículos quiser para organizar tudo em um só lugar.
          </Text>

          <Text style={styles.label}>Marca</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex.: Volkswagen"
            placeholderTextColor="#8295AA"
            value={marca}
            onChangeText={setMarca}
          />

          <Text style={styles.label}>Modelo</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex.: Polo"
            placeholderTextColor="#8295AA"
            value={modelo}
            onChangeText={setModelo}
          />

          <Text style={styles.label}>Ano</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex.: 2025"
            placeholderTextColor="#8295AA"
            keyboardType="numeric"
            maxLength={4}
            value={ano}
            onChangeText={setAno}
          />

          <Text style={styles.label}>Placa</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex.: ABC1D23"
            placeholderTextColor="#8295AA"
            autoCapitalize="characters"
            maxLength={7}
            value={placa}
            onChangeText={setPlaca}
          />

          {mensagemSucesso && (
            <View style={styles.sucessoBox}>
              <MaterialCommunityIcons
                name="check-circle"
                size={25}
                color="#36C98F"
              />

              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.sucessoTitulo}>
                  Salvo com sucesso!
                </Text>

                <Text style={styles.sucessoTexto}>
                  Seu veículo foi cadastrado no Auto Care.
                </Text>
              </View>
            </View>
          )}

          <View style={styles.infoBox}>
            <MaterialCommunityIcons
              name="information-outline"
              size={21}
              color="#55ADFF"
            />

            <Text style={styles.infoTexto}>
              Você já possui {veiculos.length} veículo(s) cadastrado(s).
              Cada carro terá seu próprio cadastro.
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.botaoSalvar,
              salvando && styles.botaoDesabilitado,
            ]}
            onPress={salvarVeiculo}
            activeOpacity={0.8}
            disabled={salvando}
          >
            <MaterialCommunityIcons
              name="content-save-outline"
              size={21}
              color="#FFFFFF"
            />

            <Text style={styles.textoBotao}>
              {salvando ? 'SALVANDO...' : 'CADASTRAR VEÍCULO'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.botaoCancelar}
            onPress={() => router.back()}
          >
            <Text style={styles.textoCancelar}>VOLTAR</Text>
          </TouchableOpacity>
        </View>

        {veiculos.length > 0 && (
          <View style={styles.listaContainer}>
            <Text style={styles.listaTitulo}>
              Seus veículos cadastrados
            </Text>

            {veiculos.map((veiculo) => (
              <View style={styles.veiculoCard} key={veiculo.id}>
                <View style={styles.veiculoIcone}>
                  <MaterialCommunityIcons
                    name="car"
                    size={29}
                    color="#55ADFF"
                  />
                </View>

                <View style={styles.veiculoInfo}>
                  <Text style={styles.veiculoNome}>
                    {veiculo.marca} {veiculo.modelo}
                  </Text>

                  <Text style={styles.veiculoDetalhe}>
                    Ano: {veiculo.ano} • Placa: {veiculo.placa}
                  </Text>
                </View>

                <MaterialCommunityIcons
                  name="check-circle"
                  size={23}
                  color="#36C98F"
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07111F',
  },
  scrollContent: {
    paddingBottom: 35,
  },
  header: {
    backgroundColor: '#0B1B30',
    paddingTop: 55,
    paddingHorizontal: 20,
    paddingBottom: 28,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#183653',
  },
  botaoVoltar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#183653',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextos: {
    flex: 1,
    marginLeft: 14,
  },
  headerTitulo: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  headerSubtitulo: {
    color: '#9CB2C9',
    fontSize: 12,
    marginTop: 4,
  },
  headerIcone: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#183653',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  card: {
    backgroundColor: '#0B1B30',
    marginHorizontal: 18,
    marginTop: 18,
    borderRadius: 24,
    padding: 23,
    borderWidth: 1,
    borderColor: '#183653',
  },
  iconePrincipal: {
    width: 82,
    height: 82,
    borderRadius: 24,
    backgroundColor: '#102B47',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 17,
  },
  titulo: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 13,
    color: '#9CB2C9',
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 7,
    marginBottom: 25,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DCE9F7',
    marginBottom: 7,
  },
  input: {
    height: 53,
    backgroundColor: '#071A2D',
    borderRadius: 13,
    paddingHorizontal: 15,
    marginBottom: 17,
    borderWidth: 1,
    borderColor: '#244563',
    fontSize: 15,
    color: '#FFFFFF',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#102B47',
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginTop: 2,
    marginBottom: 20,
  },
  infoTexto: {
    flex: 1,
    color: '#B5C9DD',
    fontSize: 12,
    lineHeight: 18,
    marginLeft: 10,
  },
  sucessoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#103B35',
    borderColor: '#247B61',
    borderWidth: 1,
    borderRadius: 13,
    padding: 14,
    marginBottom: 17,
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
  },
  botaoSalvar: {
    height: 55,
    backgroundColor: '#087BE5',
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  botaoDesabilitado: {
    opacity: 0.6,
  },
  textoBotao: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
    marginLeft: 9,
  },
  botaoCancelar: {
    height: 47,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#244563',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  textoCancelar: {
    color: '#AFC4D9',
    fontSize: 12,
    fontWeight: '800',
  },
  listaContainer: {
    marginHorizontal: 18,
    marginTop: 25,
  },
  listaTitulo: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 13,
  },
  veiculoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B1B30',
    borderWidth: 1,
    borderColor: '#183653',
    borderRadius: 16,
    padding: 15,
    marginBottom: 10,
  },
  veiculoIcone: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#102B47',
    justifyContent: 'center',
    alignItems: 'center',
  },
  veiculoInfo: {
    flex: 1,
    marginLeft: 12,
  },
  veiculoNome: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  veiculoDetalhe: {
    color: '#9CB2C9',
    fontSize: 11,
    marginTop: 5,
  },
});
