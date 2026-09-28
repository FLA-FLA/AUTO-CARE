import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type Veiculo = {
  marca: string;
  modelo: string;
  ano: string;
  placa: string;
};

type Manutencao = {
  id: string;
  servico: string;
  data: string;
  valor: string;
  observacao: string;
};

type Revisao = {
  id: string;
  tipo: string;
  data: string;
  km: string;
  observacao: string;
};

type Documento = {
  id: string;
  tipo: string;
  numero: string;
  validade: string;
  observacao: string;
};

type Abastecimento = {
  id: string;
  data: string;
  litros: string;
  valor: string;
  km: string;
};

export default function HomeScreen() {
  const [veiculo, setVeiculo] = useState<Veiculo | null>(null);

  const [totalManutencoes, setTotalManutencoes] = useState(0);
  const [totalRevisoes, setTotalRevisoes] = useState(0);
  const [totalDocumentos, setTotalDocumentos] = useState(0);
  const [totalAbastecimentos, setTotalAbastecimentos] = useState(0);

  const [gastoManutencoes, setGastoManutencoes] = useState(0);
  const [gastoCombustivel, setGastoCombustivel] = useState(0);

  const carregarDados = useCallback(async () => {
    try {
      const dadosVeiculo = await AsyncStorage.getItem(
        '@autocare_veiculo'
      );

      const dadosManutencoes = await AsyncStorage.getItem(
        '@autocare_manutencoes'
      );

      const dadosRevisoes = await AsyncStorage.getItem(
        '@autocare_revisoes'
      );

      const dadosDocumentos = await AsyncStorage.getItem(
        '@autocare_documentos'
      );

      const dadosCombustivel = await AsyncStorage.getItem(
        '@autocare_combustivel'
      );

      // VEÍCULO
      if (dadosVeiculo) {
        setVeiculo(JSON.parse(dadosVeiculo));
      } else {
        setVeiculo(null);
      }

      // MANUTENÇÕES
      const manutencoes: Manutencao[] = dadosManutencoes
        ? JSON.parse(dadosManutencoes)
        : [];

      setTotalManutencoes(manutencoes.length);

      const totalManutencoesValor = manutencoes.reduce(
        (total, item) => {
          const valor = parseFloat(
            item.valor
              .replace('R$', '')
              .replace(/\./g, '')
              .replace(',', '.')
              .trim()
          );

          return total + (isNaN(valor) ? 0 : valor);
        },
        0
      );

      setGastoManutencoes(totalManutencoesValor);

      // REVISÕES
      const revisoes: Revisao[] = dadosRevisoes
        ? JSON.parse(dadosRevisoes)
        : [];

      setTotalRevisoes(revisoes.length);

      // DOCUMENTOS
      const documentos: Documento[] = dadosDocumentos
        ? JSON.parse(dadosDocumentos)
        : [];

      setTotalDocumentos(documentos.length);

      // COMBUSTÍVEL
      const abastecimentos: Abastecimento[] =
        dadosCombustivel
          ? JSON.parse(dadosCombustivel)
          : [];

      setTotalAbastecimentos(abastecimentos.length);

      const totalCombustivelValor =
        abastecimentos.reduce(
          (total, item) => {
            const valor = parseFloat(
              item.valor
                .replace('R$', '')
                .replace(/\./g, '')
                .replace(',', '.')
                .trim()
            );

            return total + (isNaN(valor) ? 0 : valor);
          },
          0
        );

      setGastoCombustivel(totalCombustivelValor);
    } catch (error) {
      console.log(
        'ERRO AO CARREGAR DADOS:',
        error
      );
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [carregarDados])
  );

  function formatarValor(valor: number) {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* CABEÇALHO */}
      <View style={styles.header}>
        <Text style={styles.logo}>
          AUTO CARE
        </Text>

        <Text style={styles.subtitle}>
          Cuide do seu veículo de forma inteligente
        </Text>
      </View>

      {/* BOAS-VINDAS */}
      <View style={styles.welcome}>
        <Text style={styles.welcomeTitle}>
          Olá! 👋
        </Text>

        <Text style={styles.welcomeText}>
          Mantenha seu carro sempre em dia.
        </Text>
      </View>

      {/* MEU VEÍCULO */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          🚗 Meu veículo
        </Text>

        {veiculo ? (
          <>
            <Text style={styles.vehicleName}>
              {veiculo.marca} {veiculo.modelo}
            </Text>

            <Text style={styles.vehicleInfo}>
              Ano: {veiculo.ano}
            </Text>

            <Text style={styles.vehicleInfo}>
              Placa: {veiculo.placa}
            </Text>

            <TouchableOpacity
              style={styles.button}
              onPress={() =>
                router.push('/adicionar-veiculo')
              }
            >
              <Text style={styles.buttonText}>
                Alterar veículo
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.vehicleName}>
              Nenhum veículo cadastrado
            </Text>

            <Text style={styles.vehicleInfo}>
              Adicione seu carro para começar a
              acompanhar suas informações.
            </Text>

            <TouchableOpacity
              style={styles.button}
              onPress={() =>
                router.push('/adicionar-veiculo')
              }
            >
              <Text style={styles.buttonText}>
                Adicionar veículo
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* RESUMO */}
      <Text style={styles.sectionTitle}>
        Resumo
      </Text>

      <View style={styles.statsGrid}>
        <TouchableOpacity
          style={styles.statCard}
          onPress={() =>
            router.push('/manutencoes')
          }
        >
          <Text style={styles.statIcon}>
            🔧
          </Text>

          <Text style={styles.statNumber}>
            {totalManutencoes}
          </Text>

          <Text style={styles.statTitle}>
            Manutenções
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statCard}
          onPress={() =>
            router.push('/revisoes')
          }
        >
          <Text style={styles.statIcon}>
            📅
          </Text>

          <Text style={styles.statNumber}>
            {totalRevisoes}
          </Text>

          <Text style={styles.statTitle}>
            Revisões
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statCard}
          onPress={() =>
            router.push('/documentos')
          }
        >
          <Text style={styles.statIcon}>
            📄
          </Text>

          <Text style={styles.statNumber}>
            {totalDocumentos}
          </Text>

          <Text style={styles.statTitle}>
            Documentos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statCard}
          onPress={() =>
            router.push('/combustivel')
          }
        >
          <Text style={styles.statIcon}>
            ⛽
          </Text>

          <Text style={styles.statNumber}>
            {totalAbastecimentos}
          </Text>

          <Text style={styles.statTitle}>
            Abastecimentos
          </Text>
        </TouchableOpacity>
      </View>

      {/* GASTOS */}
      <Text style={styles.sectionTitle}>
        Gastos
      </Text>

      <View style={styles.expensesCard}>
        <View style={styles.expenseRow}>
          <View>
            <Text style={styles.expenseTitle}>
              🔧 Manutenções
            </Text>

            <Text style={styles.expenseSubtitle}>
              Total registrado
            </Text>
          </View>

          <Text style={styles.expenseValue}>
            {formatarValor(gastoManutencoes)}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.expenseRow}>
          <View>
            <Text style={styles.expenseTitle}>
              ⛽ Combustível
            </Text>

            <Text style={styles.expenseSubtitle}>
              Total registrado
            </Text>
          </View>

          <Text style={styles.expenseValue}>
            {formatarValor(gastoCombustivel)}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.totalRow}>
          <Text style={styles.totalTitle}>
            Total de gastos
          </Text>

          <Text style={styles.totalValue}>
            {formatarValor(
              gastoManutencoes + gastoCombustivel
            )}
          </Text>
        </View>
      </View>

      {/* ACESSO RÁPIDO */}
      <Text style={styles.sectionTitle}>
        Acesso rápido
      </Text>

      <View style={styles.grid}>
        <TouchableOpacity
          style={styles.option}
          onPress={() =>
            router.push('/manutencoes')
          }
        >
          <Text style={styles.icon}>
            🔧
          </Text>

          <Text style={styles.optionTitle}>
            Manutenções
          </Text>

          <Text style={styles.optionText}>
            Controle os serviços do veículo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.option}
          onPress={() =>
            router.push('/revisoes')
          }
        >
          <Text style={styles.icon}>
            📅
          </Text>

          <Text style={styles.optionTitle}>
            Revisões
          </Text>

          <Text style={styles.optionText}>
            Acompanhe suas próximas revisões
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.option}
          onPress={() =>
            router.push('/documentos')
          }
        >
          <Text style={styles.icon}>
            📄
          </Text>

          <Text style={styles.optionTitle}>
            Documentos
          </Text>

          <Text style={styles.optionText}>
            Organize os documentos do carro
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.option}
          onPress={() =>
            router.push('/combustivel')
          }
        >
          <Text style={styles.icon}>
            ⛽
          </Text>

          <Text style={styles.optionTitle}>
            Combustível
          </Text>

          <Text style={styles.optionText}>
            Controle seus abastecimentos
          </Text>
        </TouchableOpacity>
      </View>

      {/* DICA */}
      <View style={styles.tip}>
        <Text style={styles.tipTitle}>
          💡 Dica Auto Care
        </Text>

        <Text style={styles.tipText}>
          Fazer as manutenções preventivas ajuda a
          aumentar a vida útil do veículo e evita
          gastos inesperados.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },

  content: {
    paddingBottom: 40,
  },

  header: {
    backgroundColor: '#208AEF',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },

  logo: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
  },

  subtitle: {
    color: '#EAF4FF',
    fontSize: 15,
    marginTop: 6,
  },

  welcome: {
    paddingHorizontal: 24,
    paddingTop: 25,
  },

  welcomeTitle: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#1B1B1B',
  },

  welcomeText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 5,
  },

  card: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 18,
    elevation: 3,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#208AEF',
  },

  vehicleName: {
    fontSize: 19,
    fontWeight: 'bold',
    marginTop: 18,
    color: '#222222',
  },

  vehicleInfo: {
    color: '#666666',
    fontSize: 15,
    marginTop: 7,
  },

  button: {
    backgroundColor: '#208AEF',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 18,
    alignItems: 'center',
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  sectionTitle: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#222222',
    marginHorizontal: 20,
    marginBottom: 12,
    marginTop: 5,
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },

  statCard: {
    backgroundColor: '#FFFFFF',
    width: '48%',
    padding: 17,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
  },

  statIcon: {
    fontSize: 27,
  },

  statNumber: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#208AEF',
    marginTop: 7,
  },

  statTitle: {
    fontSize: 14,
    color: '#555555',
    marginTop: 2,
  },

  expensesCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 18,
    elevation: 3,
    marginBottom: 20,
  },

  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  expenseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222222',
  },

  expenseSubtitle: {
    fontSize: 12,
    color: '#777777',
    marginTop: 4,
  },

  expenseValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#208AEF',
  },

  divider: {
    height: 1,
    backgroundColor: '#E5E9EF',
    marginVertical: 16,
  },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  totalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#222222',
  },

  totalValue: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#208AEF',
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },

  option: {
    backgroundColor: '#FFFFFF',
    width: '48%',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
  },

  icon: {
    fontSize: 28,
    marginBottom: 8,
  },

  optionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222222',
  },

  optionText: {
    fontSize: 12,
    color: '#777777',
    marginTop: 5,
    lineHeight: 17,
  },

  tip: {
    backgroundColor: '#E8F3FF',
    margin: 20,
    marginTop: 8,
    padding: 18,
    borderRadius: 16,
    marginBottom: 35,
  },

  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#208AEF',
  },

  tipText: {
    fontSize: 13,
    color: '#555555',
    lineHeight: 19,
    marginTop: 6,
  },
});