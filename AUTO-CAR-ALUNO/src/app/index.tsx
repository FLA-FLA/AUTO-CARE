
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type Veiculo = {
  id?: string;
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
  valor?: string;
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

type HistoricoSelecionado =
  | 'manutencoes'
  | 'revisoes'
  | 'documentos'
  | 'abastecimentos'
  | null;

function chaveUsuario(email: string, tipo: string) {
  return `@autocare_${encodeURIComponent(email.trim().toLowerCase())}_${tipo}`;
}

function lerLista<T>(dados: string | null): T[] {
  if (!dados) return [];

  try {
    const convertido = JSON.parse(dados);
    return Array.isArray(convertido) ? convertido : [];
  } catch {
    return [];
  }
}

function converterValor(valor: string | number | undefined): number {
  if (valor === undefined || valor === null || valor === '') return 0;

  const texto = String(valor)
    .trim()
    .replace(/[R$\s]/g, '');

  const numero = texto.includes(',')
    ? Number(texto.replace(/\./g, '').replace(',', '.'))
    : Number(texto);

  return Number.isFinite(numero) && numero > 0 ? numero : 0;
}

function dinheiro(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function ordenarPorData<T extends { data?: string }>(lista: T[]): T[] {
  return [...lista].sort((a, b) => {
    const converterData = (data?: string) => {
      if (!data) return 0;

      const partes = data.split('/');

      if (partes.length === 3) {
        return new Date(
          Number(partes[2]),
          Number(partes[1]) - 1,
          Number(partes[0])
        ).getTime();
      }

      return new Date(data).getTime() || 0;
    };

    return converterData(b.data) - converterData(a.data);
  });
}

export default function Home() {
  const [usuarioNome, setUsuarioNome] = useState('');
  const [usuarioEmail, setUsuarioEmail] = useState('');
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
  const [revisoes, setRevisoes] = useState<Revisao[]>([]);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [abastecimentos, setAbastecimentos] = useState<Abastecimento[]>([]);
  const [historicoSelecionado, setHistoricoSelecionado] =
    useState<HistoricoSelecionado>(null);

  const carregarDados = useCallback(async () => {
    try {
      const logado = await AsyncStorage.getItem('@autocare_logado');

      if (logado !== 'true') {
        router.replace('/login');
        return;
      }

      const usuarioSalvo = await AsyncStorage.getItem('@autocare_usuario');

      if (!usuarioSalvo) {
        router.replace('/login');
        return;
      }

      let usuarioAtual: { nome?: string; email?: string };

      try {
        usuarioAtual = JSON.parse(usuarioSalvo);
      } catch {
        router.replace('/login');
        return;
      }

      const emailAtual = String(usuarioAtual.email || '')
        .trim()
        .toLowerCase();

      if (!emailAtual) {
        router.replace('/login');
        return;
      }

      setUsuarioNome(usuarioAtual.nome || '');
      setUsuarioEmail(emailAtual);

      // Cada usuário lê somente os dados vinculados ao próprio e-mail.
      const tipos = [
        'veiculos',
        'veiculo',
        'manutencoes',
        'revisoes',
        'documentos',
        'combustivel',
      ];

      const chavesNovas = tipos.map(tipo =>
        chaveUsuario(emailAtual, tipo)
      );

      const dadosNovos = await AsyncStorage.multiGet(chavesNovas);
      const dadosPorTipo: Record<string, string | null> = {};

      tipos.forEach((tipo, index) => {
        dadosPorTipo[tipo] = dadosNovos[index]?.[1] ?? null;
      });

      // Migra os dados antigos apenas para a conta que já era dona deles.
      const donoDadosAntigos = await AsyncStorage.getItem(
        '@autocare_dono_dados_antigos'
      );

      if (donoDadosAntigos === emailAtual) {
        for (const tipo of tipos) {
          const chaveNova = chaveUsuario(emailAtual, tipo);

          if (dadosPorTipo[tipo] === null) {
            const dadoAntigo = await AsyncStorage.getItem(
              `@autocare_${tipo}`
            );

            if (dadoAntigo !== null) {
              await AsyncStorage.setItem(chaveNova, dadoAntigo);
              dadosPorTipo[tipo] = dadoAntigo;
            }
          }
        }
      }

      const veiculosSalvos = dadosPorTipo.veiculos;
      const veiculoAntigo = dadosPorTipo.veiculo;
      const manutencoesSalvas = dadosPorTipo.manutencoes;
      const revisoesSalvas = dadosPorTipo.revisoes;
      const documentosSalvos = dadosPorTipo.documentos;
      const combustivelSalvo = dadosPorTipo.combustivel;

      let listaVeiculos = lerLista<Veiculo>(veiculosSalvos);

      if (veiculoAntigo) {
        try {
          const antigo = JSON.parse(veiculoAntigo) as Veiculo;

          const jaExiste = listaVeiculos.some(
            item =>
              item.placa?.toUpperCase() === antigo.placa?.toUpperCase()
          );

          if (antigo.placa && !jaExiste) {
            listaVeiculos = [
              ...listaVeiculos,
              { ...antigo, id: antigo.id || String(Date.now()) },
            ];

            await AsyncStorage.setItem(
              chaveUsuario(emailAtual, 'veiculos'),
              JSON.stringify(listaVeiculos)
            );
          }
        } catch {
          console.log('Cadastro antigo de veículo inválido.');
        }
      }

      setVeiculos(listaVeiculos);
      setManutencoes(lerLista<Manutencao>(manutencoesSalvas));
      setRevisoes(lerLista<Revisao>(revisoesSalvas));
      setDocumentos(lerLista<Documento>(documentosSalvos));
      setAbastecimentos(lerLista<Abastecimento>(combustivelSalvo));
    } catch (error) {
      console.log('Erro ao carregar dados:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados do Auto Care.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [carregarDados])
  );

  // EXCLUIR UMA REVISÃO
  const excluirRevisao = (id: string) => {
    const confirmarExclusao = async () => {
      try {
        const novaLista = revisoes.filter(item => item.id !== id);

        if (!usuarioEmail) return;

        await AsyncStorage.setItem(
          chaveUsuario(usuarioEmail, 'revisoes'),
          JSON.stringify(novaLista)
        );

        setRevisoes(novaLista);
      } catch (error) {
        console.log('Erro ao excluir revisão:', error);

        if (Platform.OS === 'web') {
          window.alert('Não foi possível excluir a revisão.');
        } else {
          Alert.alert('Erro', 'Não foi possível excluir a revisão.');
        }
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Tem certeza que deseja excluir esta revisão?')) {
        confirmarExclusao();
      }
      return;
    }

    Alert.alert(
      'Excluir revisão',
      'Tem certeza que deseja excluir esta revisão? Essa ação não poderá ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: confirmarExclusao,
        },
      ]
    );
  };

  const sair = async () => {
    const confirmarSaida = async () => {
      try {
        await AsyncStorage.removeItem('@autocare_logado');
        router.replace('/login');
      } catch (error) {
        console.log('Erro ao sair da conta:', error);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Tem certeza que deseja sair da conta?')) {
        await confirmarSaida();
      }
      return;
    }

    Alert.alert('Sair da conta', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: confirmarSaida },
    ]);
  };

  const totalManutencoes = manutencoes.reduce(
    (total, item) => total + converterValor(item.valor),
    0
  );

  const totalAbastecimentos = abastecimentos.reduce(
    (total, item) => total + converterValor(item.valor),
    0
  );

  const totalRevisoes = revisoes.reduce(
    (total, item) => total + converterValor(item.valor),
    0
  );

  const totalGasto =
    totalManutencoes + totalAbastecimentos + totalRevisoes;

  const tituloHistorico = () => {
    switch (historicoSelecionado) {
      case 'manutencoes':
        return 'Histórico de manutenções';
      case 'revisoes':
        return 'Histórico de revisões';
      case 'documentos':
        return 'Meus documentos';
      case 'abastecimentos':
        return 'Histórico de abastecimentos';
      default:
        return '';
    }
  };

  const linhaInfo = (titulo: string, valor?: string) => (
    <View style={styles.linhaInfo} key={titulo}>
      <Text style={styles.infoTitulo}>{titulo}</Text>
      <Text style={styles.infoValor}>
        {valor && valor.trim() ? valor : 'Não informado'}
      </Text>
    </View>
  );

  const renderHistorico = () => {
    if (!historicoSelecionado) return null;

    const listas = {
      manutencoes: ordenarPorData(manutencoes),
      revisoes: ordenarPorData(revisoes),
      documentos: [...documentos],
      abastecimentos: ordenarPorData(abastecimentos),
    };

    const quantidade = listas[historicoSelecionado].length;

    return (
      <View style={styles.historicoCard}>
        <View style={styles.historicoTopo}>
          <View style={{ flex: 1 }}>
            <Text style={styles.historicoTitulo}>
              {tituloHistorico()}
            </Text>
            <Text style={styles.historicoSubtitulo}>
              {quantidade} registro(s) encontrado(s)
            </Text>
          </View>

          <TouchableOpacity
            style={styles.fecharHistorico}
            onPress={() => setHistoricoSelecionado(null)}
          >
            <Text style={styles.fecharHistoricoTexto}>✕</Text>
          </TouchableOpacity>
        </View>

        {quantidade === 0 && (
          <View style={styles.historicoVazio}>
            <Text style={styles.vazioTitulo}>
              Nenhum registro encontrado
            </Text>
            <Text style={styles.vazioTexto}>
              Quando você cadastrar novas informações, elas aparecerão aqui.
            </Text>
          </View>
        )}

        {historicoSelecionado === 'manutencoes' &&
          listas.manutencoes.map((item, index) => (
            <View style={styles.registroCard} key={item.id || index}>
              <Text style={styles.registroNome}>
                {item.servico || 'Manutenção'}
              </Text>
              {linhaInfo('Data', item.data)}
              {linhaInfo('Valor', dinheiro(converterValor(item.valor)))}
              {linhaInfo('Observações', item.observacao)}
            </View>
          ))}

        {historicoSelecionado === 'revisoes' &&
          listas.revisoes.map((item, index) => (
            <View style={styles.registroCard} key={item.id || index}>
              <View style={styles.revisaoTopo}>
                <Text style={styles.registroNome}>
                  {item.tipo || 'Revisão'}
                </Text>

                <TouchableOpacity
                  style={styles.botaoExcluir}
                  onPress={() => excluirRevisao(item.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.botaoExcluirTexto}>🗑 Excluir</Text>
                </TouchableOpacity>
              </View>

              {linhaInfo('Data', item.data)}
              {linhaInfo('Quilometragem', item.km ? `${item.km} km` : '')}
              {linhaInfo(
                'Valor registrado',
                item.valor
                  ? dinheiro(converterValor(item.valor))
                  : 'Não informado'
              )}
              {linhaInfo('Observações', item.observacao)}
            </View>
          ))}

        {historicoSelecionado === 'documentos' &&
          listas.documentos.map((item, index) => (
            <View style={styles.registroCard} key={item.id || index}>
              <Text style={styles.registroNome}>
                {item.tipo || 'Documento'}
              </Text>
              {linhaInfo('Número', item.numero)}
              {linhaInfo('Validade', item.validade)}
              {linhaInfo('Observações', item.observacao)}
            </View>
          ))}

        {historicoSelecionado === 'abastecimentos' &&
          listas.abastecimentos.map((item, index) => (
            <View style={styles.registroCard} key={item.id || index}>
              <Text style={styles.registroNome}>Abastecimento</Text>
              {linhaInfo('Data', item.data)}
              {linhaInfo('Litros', item.litros ? `${item.litros} L` : '')}
              {linhaInfo('Valor', dinheiro(converterValor(item.valor)))}
              {linhaInfo('Quilometragem', item.km ? `${item.km} km` : '')}
            </View>
          ))}
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollConteudo}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.logoBox}>
            <Image
              source={require('../../assets/autocare/autocare_logo.png')}
              style={styles.logoImagem}
              resizeMode="contain"
            />
          </View>

          <TouchableOpacity
            style={styles.botaoSair}
            onPress={sair}
            activeOpacity={0.8}
          >
            <Text style={styles.textoSair}>Sair</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.saudeBox}>
          <View>
            <Text style={styles.ola}>BEM-VINDO AO AUTO CARE</Text>
            <Text style={styles.nomeUsuario}>
              Olá, {usuarioNome || 'Motorista'}!
            </Text>
            <Text style={styles.headerDescricao}>
              Seus veículos sob controle.
            </Text>
          </View>

          <View style={styles.status}>
            <View style={styles.statusBolinha} />
            <Text style={styles.statusTexto}>Tudo certo</Text>
          </View>
        </View>
      </View>

      <View style={styles.conteudo}>
        <View style={styles.tituloLinha}>
          <View>
            <Text style={styles.tituloSecao}>Meus veículos</Text>
            <Text style={styles.subtituloSecao}>
              {veiculos.length} veículo(s) cadastrado(s)
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/adicionar-veiculo')}
            activeOpacity={0.7}
          >
            <Text style={styles.editar}>+ Adicionar</Text>
          </TouchableOpacity>
        </View>

        {veiculos.length > 0 ? (
          veiculos.map((item, index) => (
            <TouchableOpacity
              key={item.id || item.placa || String(index)}
              style={styles.veiculoCard}
              onPress={() => router.push('/adicionar-veiculo')}
              activeOpacity={0.85}
            >
              <View style={styles.carroImagemBox}>
                <Image
                  source={require('../../assets/autocare/icon_veiculo.png')}
                  style={styles.carroImagem}
                  resizeMode="contain"
                />
              </View>

              <View style={styles.veiculoInfo}>
                <Text style={styles.veiculoNome}>
                  {item.marca} {item.modelo}
                </Text>
                <Text style={styles.veiculoAno}>Ano {item.ano}</Text>

                <View style={styles.placaBox}>
                  <Text style={styles.placaTexto}>{item.placa}</Text>
                </View>
              </View>

              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))
        ) : (
          <TouchableOpacity
            style={styles.adicionarVeiculo}
            onPress={() => router.push('/adicionar-veiculo')}
            activeOpacity={0.85}
          >
            <View style={styles.adicionarIcone}>
              <Image
                source={require('../../assets/autocare/icon_veiculo.png')}
                style={styles.adicionarImagem}
                resizeMode="contain"
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.adicionarTitulo}>
                Cadastre seu veículo
              </Text>
              <Text style={styles.adicionarTexto}>
                Comece adicionando seu carro ao Auto Care.
              </Text>
            </View>

            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        )}

        <View style={styles.resumoTitulo}>
          <Text style={styles.tituloSecao}>Resumo</Text>
          <Text style={styles.subtituloSecao}>
            Toque em um cartão para consultar seus registros
          </Text>
        </View>

        <View style={styles.statsLinha}>
          <TouchableOpacity
            style={[
              styles.statCard,
              historicoSelecionado === 'manutencoes' &&
                styles.statCardSelecionado,
            ]}
            onPress={() =>
              setHistoricoSelecionado(
                historicoSelecionado === 'manutencoes'
                  ? null
                  : 'manutencoes'
              )
            }
            activeOpacity={0.8}
          >
            <View style={styles.statImagemBox}>
              <Image
                source={require('../../assets/autocare/icon_manutencao.png')}
                style={styles.statImagem}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.statNumero}>{manutencoes.length}</Text>
            <Text style={styles.statTexto}>Manutenções</Text>
            <Text style={styles.statDescricao}>Toque para ver detalhes ›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.statCard,
              historicoSelecionado === 'revisoes' &&
                styles.statCardSelecionado,
            ]}
            onPress={() =>
              setHistoricoSelecionado(
                historicoSelecionado === 'revisoes' ? null : 'revisoes'
              )
            }
            activeOpacity={0.8}
          >
            <View style={styles.statImagemBox}>
              <Image
                source={require('../../assets/autocare/icon_revisao.png')}
                style={styles.statImagem}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.statNumero}>{revisoes.length}</Text>
            <Text style={styles.statTexto}>Revisões</Text>
            <Text style={styles.statDescricao}>Toque para ver detalhes ›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsLinha}>
          <TouchableOpacity
            style={[
              styles.statCard,
              historicoSelecionado === 'documentos' &&
                styles.statCardSelecionado,
            ]}
            onPress={() =>
              setHistoricoSelecionado(
                historicoSelecionado === 'documentos' ? null : 'documentos'
              )
            }
            activeOpacity={0.8}
          >
            <View style={styles.statImagemBox}>
              <Image
                source={require('../../assets/autocare/icon_documentos.png')}
                style={styles.statImagem}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.statNumero}>{documentos.length}</Text>
            <Text style={styles.statTexto}>Documentos</Text>
            <Text style={styles.statDescricao}>Toque para ver detalhes ›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.statCard,
              historicoSelecionado === 'abastecimentos' &&
                styles.statCardSelecionado,
            ]}
            onPress={() =>
              setHistoricoSelecionado(
                historicoSelecionado === 'abastecimentos'
                  ? null
                  : 'abastecimentos'
              )
            }
            activeOpacity={0.8}
          >
            <View style={styles.statImagemBox}>
              <Image
                source={require('../../assets/autocare/icon_combustivel.png')}
                style={styles.statImagem}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.statNumero}>{abastecimentos.length}</Text>
            <Text style={styles.statTexto}>Abastecimentos</Text>
            <Text style={styles.statDescricao}>Toque para ver detalhes ›</Text>
          </TouchableOpacity>
        </View>

        {renderHistorico()}

        <View style={styles.gastosCard}>
          <View style={styles.gastosTopo}>
            <View>
              <Text style={styles.gastosTitulo}>Gastos registrados</Text>
              <Text style={styles.gastosSubtitulo}>
                Manutenção + combustível + revisões
              </Text>
            </View>

            <View style={styles.dinheiroBox}>
              <Text style={styles.dinheiro}>R$</Text>
            </View>
          </View>

          <Text style={styles.valorGasto}>{dinheiro(totalGasto)}</Text>

          <View style={styles.divisor} />

          <View style={styles.gastosDetalhes}>
            <View style={styles.gastoItem}>
              <Text style={styles.detalheLabel}>Manutenção</Text>
              <Text style={styles.detalheValor}>
                {dinheiro(totalManutencoes)}
              </Text>
            </View>

            <View style={styles.gastoItem}>
              <Text style={styles.detalheLabel}>Combustível</Text>
              <Text style={styles.detalheValor}>
                {dinheiro(totalAbastecimentos)}
              </Text>
            </View>

            <View style={styles.gastoItem}>
              <Text style={styles.detalheLabel}>Revisões</Text>
              <Text style={styles.detalheValor}>
                {dinheiro(totalRevisoes)}
              </Text>
            </View>
          </View>

          <Text style={styles.gastosObservacao}>
            Os valores são calculados com base nos registros que possuem
            preço informado.
          </Text>
        </View>

        <View style={styles.tituloLinha}>
          <View>
            <Text style={styles.tituloSecao}>Acesso rápido</Text>
            <Text style={styles.subtituloSecao}>
              Adicione novas informações
            </Text>
          </View>
        </View>

        <View style={styles.acoes}>
          <TouchableOpacity
            style={styles.acao}
            onPress={() => router.push('/adicionar-manutencao')}
            activeOpacity={0.8}
          >
            <View style={styles.acaoImagemBox}>
              <Image
                source={require('../../assets/autocare/icon_manutencao.png')}
                style={styles.acaoImagem}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.acaoTexto}>Nova manutenção</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.acao}
            onPress={() => router.push('/adicionar-revisao')}
            activeOpacity={0.8}
          >
            <View style={styles.acaoImagemBox}>
              <Image
                source={require('../../assets/autocare/icon_revisao.png')}
                style={styles.acaoImagem}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.acaoTexto}>Nova revisão</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.acao}
            onPress={() => router.push('/adicionar-combustivel')}
            activeOpacity={0.8}
          >
            <View style={styles.acaoImagemBox}>
              <Image
                source={require('../../assets/autocare/icon_combustivel.png')}
                style={styles.acaoImagem}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.acaoTexto}>Abastecimento</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.acao}
            onPress={() => router.push('/adicionar-documento')}
            activeOpacity={0.8}
          >
            <View style={styles.acaoImagemBox}>
              <Image
                source={require('../../assets/autocare/icon_documentos.png')}
                style={styles.acaoImagem}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.acaoTexto}>Novo documento</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dica}>
          <View style={styles.dicaImagemBox}>
            <Text style={styles.dicaLampada}>!</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.dicaTitulo}>Dica Auto Care</Text>
            <Text style={styles.dicaTexto}>
              Mantenha os dados dos seus carros atualizados para acompanhar
              melhor a manutenção.
            </Text>
          </View>
        </View>

        <Text style={styles.rodape}>
          Auto Care • Controle seus carros de forma simples
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07111F',
  },
  scrollConteudo: {
    paddingBottom: 25,
  },
  header: {
    backgroundColor: '#0B1B30',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    borderBottomWidth: 1,
    borderColor: '#183653',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoBox: {
    width: 145,
    height: 62,
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  logoImagem: {
    width: 135,
    height: 58,
  },
  botaoSair: {
    backgroundColor: '#142D49',
    borderWidth: 1,
    borderColor: '#285078',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 17,
  },
  textoSair: {
    color: '#55ADFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  saudeBox: {
    marginTop: 27,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  ola: {
    color: '#55ADFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  nomeUsuario: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 5,
  },
  headerDescricao: {
    color: '#91A8C0',
    fontSize: 12,
    marginTop: 5,
  },
  status: {
    backgroundColor: '#123A32',
    borderWidth: 1,
    borderColor: '#17634C',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBolinha: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    marginRight: 6,
  },
  statusTexto: {
    color: '#9BE7C1',
    fontSize: 10,
    fontWeight: 'bold',
  },
  conteudo: {
    padding: 20,
    paddingBottom: 40,
  },
  tituloLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resumoTitulo: {
    marginTop: 28,
    marginBottom: 12,
  },
  tituloSecao: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F3F7FC',
  },
  subtituloSecao: {
    fontSize: 12,
    color: '#8195AB',
    marginTop: 4,
  },
  editar: {
    color: '#38A0FF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  veiculoCard: {
    backgroundColor: '#10243B',
    borderRadius: 20,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1D3C5B',
    marginBottom: 12,
  },
  carroImagemBox: {
    width: 72,
    height: 72,
    borderRadius: 19,
    backgroundColor: '#193B5D',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  carroImagem: {
    width: 55,
    height: 55,
  },
  veiculoInfo: {
    flex: 1,
  },
  veiculoNome: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  veiculoAno: {
    color: '#91A8C0',
    fontSize: 13,
    marginTop: 4,
  },
  placaBox: {
    backgroundColor: '#071727',
    borderWidth: 1,
    borderColor: '#285078',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    marginTop: 8,
  },
  placaTexto: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#55ADFF',
    letterSpacing: 1.2,
  },
  chevron: {
    color: '#55ADFF',
    fontSize: 30,
    fontWeight: '300',
    marginLeft: 5,
  },
  adicionarVeiculo: {
    backgroundColor: '#10243B',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#285078',
  },
  adicionarIcone: {
    width: 65,
    height: 65,
    borderRadius: 18,
    backgroundColor: '#193B5D',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  adicionarImagem: {
    width: 48,
    height: 48,
  },
  adicionarTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  adicionarTexto: {
    fontSize: 12,
    color: '#91A8C0',
    marginTop: 4,
    lineHeight: 17,
  },
  statsLinha: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#10243B',
    borderRadius: 19,
    padding: 15,
    borderWidth: 1,
    borderColor: '#1D3C5B',
  },
  statCardSelecionado: {
    borderColor: '#55ADFF',
    backgroundColor: '#153451',
  },
  statImagemBox: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#193B5D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statImagem: {
    width: 38,
    height: 38,
  },
  statNumero: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 11,
  },
  statTexto: {
    fontSize: 12,
    color: '#DCE8F5',
    marginTop: 3,
    fontWeight: '600',
  },
  statDescricao: {
    fontSize: 10,
    color: '#55ADFF',
    marginTop: 5,
  },
  historicoCard: {
    backgroundColor: '#0D2035',
    borderRadius: 20,
    padding: 16,
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#285078',
  },
  historicoTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  historicoTitulo: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  historicoSubtitulo: {
    color: '#91A8C0',
    fontSize: 11,
    marginTop: 4,
  },
  fecharHistorico: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#193B5D',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  fecharHistoricoTexto: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  historicoVazio: {
    backgroundColor: '#10243B',
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  vazioTitulo: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  vazioTexto: {
    color: '#91A8C0',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 7,
    lineHeight: 18,
  },
  registroCard: {
    backgroundColor: '#10243B',
    borderRadius: 15,
    padding: 15,
    marginBottom: 11,
    borderWidth: 1,
    borderColor: '#1D3C5B',
  },
  registroNome: {
    color: '#55ADFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  revisaoTopo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  botaoExcluir: {
    backgroundColor: '#4A1D29',
    borderWidth: 1,
    borderColor: '#8F3044',
    borderRadius: 9,
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  botaoExcluirTexto: {
    color: '#FF8999',
    fontSize: 11,
    fontWeight: 'bold',
  },
  linhaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderTopWidth: 1,
    borderTopColor: '#1D3C5B',
    gap: 12,
  },
  infoTitulo: {
    color: '#91A8C0',
    fontSize: 11,
    flex: 1,
  },
  infoValor: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    flex: 1.3,
    textAlign: 'right',
  },
  gastosCard: {
    backgroundColor: '#10243B',
    borderRadius: 22,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#1D3C5B',
  },
  gastosTopo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gastosTitulo: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  gastosSubtitulo: {
    color: '#91A8C0',
    fontSize: 11,
    marginTop: 4,
  },
  dinheiroBox: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: '#193B5D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dinheiro: {
    color: '#55ADFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  valorGasto: {
    color: '#55ADFF',
    fontSize: 30,
    fontWeight: '900',
    marginTop: 18,
  },
  divisor: {
    height: 1,
    backgroundColor: '#29435D',
    marginVertical: 17,
  },
  gastosDetalhes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  gastoItem: {
    minWidth: '28%',
    flex: 1,
  },
  detalheLabel: {
    color: '#91A8C0',
    fontSize: 11,
  },
  detalheValor: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 4,
  },
  gastosObservacao: {
    color: '#8195AB',
    fontSize: 10,
    marginTop: 15,
    lineHeight: 15,
  },
  acoes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  acao: {
    width: '47.5%',
    backgroundColor: '#10243B',
    borderRadius: 18,
    padding: 17,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1D3C5B',
  },
  acaoImagemBox: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#193B5D',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  acaoImagem: {
    width: 47,
    height: 47,
  },
  acaoTexto: {
    color: '#DCE8F5',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  dica: {
    backgroundColor: '#102B45',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
    borderWidth: 1,
    borderColor: '#285078',
  },
  dicaImagemBox: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: '#193B5D',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dicaLampada: {
    color: '#55ADFF',
    fontSize: 23,
    fontWeight: '900',
  },
  dicaTitulo: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  dicaTexto: {
    fontSize: 11,
    color: '#A9BCD0',
    lineHeight: 17,
    marginTop: 4,
  },
  rodape: {
    textAlign: 'center',
    color: '#647D97',
    fontSize: 11,
    marginTop: 25,
  },
});
