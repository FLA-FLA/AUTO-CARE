
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type Manutencao = {
  id: string;
  servico: string;
  data: string;
  valor: string;
  observacao: string;
};

type Usuario = {
  nome: string;
  email: string;
  senha?: string;
};

function chaveUsuario(email: string, tipo: string) {
  return `@autocare_${encodeURIComponent(email.trim().toLowerCase())}_${tipo}`;
}

export default function AdicionarManutencao() {
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [emailUsuario, setEmailUsuario] = useState('');

  const carregarManutencoes = useCallback(async () => {
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

      const email = usuario.email.trim().toLowerCase();
      setEmailUsuario(email);

      const chave = chaveUsuario(email, 'manutencoes');
      const dados = await AsyncStorage.getItem(chave);

      if (dados) {
        const lista = JSON.parse(dados);
        setManutencoes(Array.isArray(lista) ? lista : []);
      } else {
        setManutencoes([]);
      }
    } catch (error) {
      console.log('Erro ao carregar manutenções:', error);
      setManutencoes([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarManutencoes();
    }, [carregarManutencoes])
  );

  async function excluirManutencao(id: string) {
    const executarExclusao = async () => {
      try {
        const chave = chaveUsuario(emailUsuario, 'manutencoes');

        const novaLista = manutencoes.filter(
          (item) => item.id !== id
        );

        await AsyncStorage.setItem(
          chave,
          JSON.stringify(novaLista)
        );

        setManutencoes(novaLista);
      } catch (error) {
        mostrarAlerta('Erro', 'Não foi possível excluir a manutenção.');
      }
    };

    if (Platform.OS === 'web') {
      const confirmar = window.confirm(
        'Tem certeza que deseja excluir esta manutenção?'
      );

      if (confirmar) {
        await executarExclusao();
      }

      return;
    }

    Alert.alert(
      'Excluir manutenção',
      'Tem certeza que deseja excluir este registro?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: executarExclusao,
        },
      ]
    );
  }

  function mostrarAlerta(titulo: string, mensagem: string) {
    if (Platform.OS === 'web') {
      window.alert(`${titulo}\n\n${mensagem}`);
    } else {
      Alert.alert(titulo, mensagem);
    }
  }

  function formatarValor(valor: string) {
    const texto = String(valor ?? '')
      .trim()
      .replace(/[^\d,.-]/g, '');

    const numero = texto.includes(',')
      ? Number(texto.replace(/\./g, '').replace(',', '.'))
      : Number(texto);

    if (!Number.isFinite(numero)) {
      return 'R$ 0,00';
    }

    return numero.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  function renderManutencao({ item }: { item: Manutencao }) {
    return (
      <View style={styles.card}>
        <View style={styles.cardCabecalho}>
          <View style={styles.iconeServico}>
            <MaterialCommunityIcons
              name="wrench"
              size={24}
              color="#168BFF"
            />
          </View>

          <View style={styles.infoServico}>
            <Text style={styles.nomeServico}>{item.servico}</Text>
            <Text style={styles.dataServico}>{item.data}</Text>
          </View>

          <TouchableOpacity
            style={styles.botaoExcluir}
            onPress={() => excluirManutencao(item.id)}
          >
            <MaterialCommunityIcons
              name="trash-can-outline"
              size={21}
              color="#FF6464"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.divisor} />

        <View style={styles.valorContainer}>
          <Text style={styles.labelValor}>Valor pago</Text>
          <Text style={styles.valor}>
            {formatarValor(item.valor)}
          </Text>
        </View>

        {item.observacao ? (
          <View style={styles.observacaoContainer}>
            <MaterialCommunityIcons
              name="text-box-outline"
              size={17}
              color="#91A4BA"
            />
            <Text style={styles.observacao}>
              {item.observacao}
            </Text>
          </View>
        ) : null}

        <View style={styles.statusContainer}>
          <MaterialCommunityIcons
            name="check-circle"
            size={16}
            color="#36C98F"
          />
          <Text style={styles.statusTexto}>Serviço registrado</Text>
        </View>
      </View>
    );
  }

  function EmptyState() {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <MaterialCommunityIcons
            name="wrench-outline"
            size={45}
            color="#168BFF"
          />
        </View>

        <Text style={styles.emptyTitulo}>
          Nenhuma manutenção cadastrada
        </Text>

        <Text style={styles.emptyTexto}>
          Registre as manutenções do seu veículo para acompanhar
          os serviços e os gastos realizados.
        </Text>

        <TouchableOpacity
          style={styles.botaoEmpty}
          onPress={() => router.push('/nova-manutencao')}
        >
          <MaterialCommunityIcons
            name="plus"
            size={21}
            color="#FFFFFF"
          />
          <Text style={styles.botaoEmptyTexto}>
            Cadastrar manutenção
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.botaoVoltar}
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        <View style={styles.headerTextoContainer}>
          <Text style={styles.titulo}>Manutenções</Text>
          <Text style={styles.subtitulo}>
            Histórico de serviços do seu veículo
          </Text>
        </View>
      </View>

      <View style={styles.resumo}>
        <View style={styles.resumoIcone}>
          <MaterialCommunityIcons
            name="clipboard-list-outline"
            size={25}
            color="#168BFF"
          />
        </View>

        <View>
          <Text style={styles.resumoNumero}>
            {manutencoes.length}
          </Text>
          <Text style={styles.resumoTexto}>
            {manutencoes.length === 1
              ? 'Manutenção registrada'
              : 'Manutenções registradas'}
          </Text>
        </View>
      </View>

      <View style={styles.listaHeader}>
        <Text style={styles.listaTitulo}>Histórico</Text>
        <Text style={styles.listaQuantidade}>
          {manutencoes.length} registro(s)
        </Text>
      </View>

      {carregando ? (
        <View style={styles.carregandoContainer}>
          <Text style={styles.carregandoTexto}>
            Carregando manutenções...
          </Text>
        </View>
      ) : (
        <FlatList
          data={manutencoes}
          keyExtractor={(item) => item.id}
          renderItem={renderManutencao}
          ListEmptyComponent={EmptyState}
          contentContainerStyle={
            manutencoes.length === 0
              ? styles.listaVazia
              : styles.lista
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity
        style={styles.botaoFlutuante}
        onPress={() => router.push('/nova-manutencao')}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons
          name="plus"
          size={23}
          color="#FFFFFF"
        />
        <Text style={styles.botaoFlutuanteTexto}>
          Nova manutenção
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07111F',
    paddingTop: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    marginTop: 15,
    marginBottom: 25,
  },
  botaoVoltar: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: '#10243B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  headerTextoContainer: {
    flex: 1,
  },
  titulo: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: 'bold',
  },
  subtitulo: {
    color: '#91A4BA',
    fontSize: 13,
    marginTop: 4,
  },
  resumo: {
    marginHorizontal: 22,
    backgroundColor: '#10243B',
    borderRadius: 17,
    padding: 19,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    borderWidth: 1,
    borderColor: '#1D3B5B',
    marginBottom: 28,
  },
  resumoIcone: {
    width: 49,
    height: 49,
    borderRadius: 14,
    backgroundColor: '#17385A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resumoNumero: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: 'bold',
  },
  resumoTexto: {
    color: '#91A4BA',
    fontSize: 13,
    marginTop: 3,
  },
  listaHeader: {
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  listaTitulo: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  listaQuantidade: {
    color: '#91A4BA',
    fontSize: 12,
  },
  lista: {
    paddingHorizontal: 22,
    paddingBottom: 110,
  },
  listaVazia: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingBottom: 110,
  },
  card: {
    backgroundColor: '#10243B',
    borderRadius: 17,
    padding: 17,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1D3B5B',
  },
  cardCabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconeServico: {
    width: 45,
    height: 45,
    borderRadius: 13,
    backgroundColor: '#17385A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoServico: {
    flex: 1,
    marginLeft: 12,
  },
  nomeServico: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dataServico: {
    color: '#91A4BA',
    fontSize: 13,
    marginTop: 5,
  },
  botaoExcluir: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#3A202A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  divisor: {
    height: 1,
    backgroundColor: '#25405D',
    marginVertical: 15,
  },
  valorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelValor: {
    color: '#91A4BA',
    fontSize: 13,
  },
  valor: {
    color: '#36C98F',
    fontSize: 17,
    fontWeight: 'bold',
  },
  observacaoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 14,
  },
  observacao: {
    color: '#B7C5D6',
    fontSize: 13,
    flex: 1,
    lineHeight: 19,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 15,
  },
  statusTexto: {
    color: '#36C98F',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
    paddingVertical: 35,
  },
  emptyIcon: {
    width: 85,
    height: 85,
    borderRadius: 25,
    backgroundColor: '#102B49',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitulo: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptyTexto: {
    color: '#91A4BA',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 10,
    maxWidth: 280,
  },
  botaoEmpty: {
    backgroundColor: '#147FE5',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 22,
  },
  botaoEmptyTexto: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  carregandoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carregandoTexto: {
    color: '#91A4BA',
    fontSize: 14,
  },
  botaoFlutuante: {
    position: 'absolute',
    bottom: 25,
    left: 22,
    right: 22,
    height: 55,
    backgroundColor: '#147FE5',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    elevation: 5,
  },
  botaoFlutuanteTexto: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
