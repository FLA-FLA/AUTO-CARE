import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { buscarCarros, buscarSessao, Carro, salvarCarros, Usuario } from '@/lib/aluguel';

type VeiculoCadastrado = {
  id: string;
  marca: string;
  modelo: string;
  ano: string;
  placa: string;
  fotos?: string[];
};

const chaveVeiculos = (email: string) => `@autocare_${encodeURIComponent(email.trim().toLowerCase())}_veiculos`;
const normalizarPlaca = (placa: string) => placa.trim().replace(/[^a-z0-9]/gi, '').toUpperCase();

export default function AnunciarCarro() {
  const { veiculoId } = useLocalSearchParams<{ veiculoId?: string }>();
  const idDaRota = Array.isArray(veiculoId) ? veiculoId[0] : veiculoId;
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [veiculos, setVeiculos] = useState<VeiculoCadastrado[]>([]);
  const [anuncios, setAnuncios] = useState<Carro[]>([]);
  const [selecionado, setSelecionado] = useState<VeiculoCadastrado | null>(null);
  const [cidade, setCidade] = useState('');
  const [diaria, setDiaria] = useState('');
  const [descricao, setDescricao] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const current = await buscarSessao();
      if (!current || current.tipo !== 'proprietario') {
        Alert.alert('Acesso restrito', 'Entre com uma conta de locador para anunciar um veículo.');
        router.back();
        return;
      }

      setUsuario(current);
      const [savedVehicles, allListings] = await Promise.all([
        AsyncStorage.getItem(chaveVeiculos(current.email)),
        buscarCarros(),
      ]);
      const list = savedVehicles ? JSON.parse(savedVehicles) as VeiculoCadastrado[] : [];
      setVeiculos(Array.isArray(list) ? list : []);
      const mine = allListings.filter((car) => car.proprietarioId === current.id || car.proprietarioEmail?.trim().toLowerCase() === current.email.toLowerCase());
      setAnuncios(mine);

      if (idDaRota) {
        const chosen = (Array.isArray(list) ? list : []).find((item) => item.id === idDaRota) ?? null;
        setSelecionado(chosen);
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar seus veículos cadastrados.');
    } finally {
      setCarregando(false);
    }
  }, [idDaRota]);

  useFocusEffect(useCallback(() => { void carregar(); }, [carregar]));

  function anuncioDoVeiculo(veiculo: VeiculoCadastrado) {
    return anuncios.find((anuncio) =>
      (anuncio.veiculoId && anuncio.veiculoId === veiculo.id) ||
      normalizarPlaca(anuncio.placa) === normalizarPlaca(veiculo.placa)
    );
  }

  function escolher(veiculo: VeiculoCadastrado) {
    if (anuncioDoVeiculo(veiculo)) {
      Alert.alert('Veículo já anunciado', 'Este veículo já está nos seus anúncios. Você pode alterar a disponibilidade em Meus carros.', [
        { text: 'Agora não', style: 'cancel' },
        { text: 'Ver meus carros', onPress: () => router.replace('/meus-carros') },
      ]);
      return;
    }
    setSelecionado(veiculo);
    setCidade('');
    setDiaria('');
    setDescricao('');
  }

  function voltarParaSelecao() {
    setSelecionado(null);
    if (idDaRota) router.replace('/anunciar-carro');
  }

  async function salvar() {
    if (salvando || !selecionado || !usuario) return;
    if (!cidade.trim() || !diaria.trim()) {
      Alert.alert('Campos obrigatórios', 'Informe a cidade e o valor da diária.');
      return;
    }

    const valor = Number(diaria.replace(/\./g, '').replace(',', '.'));
    if (!Number.isFinite(valor) || valor <= 0) {
      Alert.alert('Valor inválido', 'Informe uma diária válida.');
      return;
    }

    setSalvando(true);
    try {
      const todos = await buscarCarros();
      const duplicado = todos.find((item) =>
        (item.proprietarioId === usuario.id || item.proprietarioEmail?.trim().toLowerCase() === usuario.email.toLowerCase()) &&
        ((item.veiculoId && item.veiculoId === selecionado.id) || normalizarPlaca(item.placa) === normalizarPlaca(selecionado.placa))
      );
      if (duplicado) {
        Alert.alert('Veículo já anunciado', 'Este carro já aparece nos seus anúncios.');
        router.replace('/meus-carros');
        return;
      }

      const novoAnuncio: Carro = {
        id: `${Date.now()}`,
        veiculoId: selecionado.id,
        proprietarioId: usuario.id,
        proprietarioNome: usuario.nome,
        proprietarioEmail: usuario.email,
        marca: selecionado.marca,
        modelo: selecionado.modelo,
        ano: selecionado.ano,
        placa: selecionado.placa.trim().toUpperCase(),
        cidade: cidade.trim(),
        diaria: valor,
        descricao: descricao.trim(),
        fotos: selecionado.fotos || [],
        disponivel: true,
        criadoEm: new Date().toISOString(),
      };

      await salvarCarros([...todos, novoAnuncio]);
      router.replace('/meus-carros');
    } catch {
      Alert.alert('Erro', 'Não foi possível publicar o anúncio.');
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return <View style={[s.page, s.center]}><Text style={s.sub}>Carregando seus veículos...</Text></View>;
  }

  if (!selecionado) {
    return <ScrollView style={s.page} contentContainerStyle={s.pad}>
      <TouchableOpacity onPress={() => router.back()}><Text style={s.back}>‹ Voltar</Text></TouchableOpacity>
      <Text style={s.title}>Escolha um veículo</Text>
      <Text style={s.sub}>Selecione um carro que você já cadastrou. Os dados e as fotos serão usados no anúncio.</Text>

      {veiculos.length === 0 ? <View style={s.emptyCard}>
        <Text style={s.vehicleName}>Nenhum veículo cadastrado</Text>
        <Text style={s.sub}>Cadastre o carro uma vez e depois volte aqui para anunciá-lo.</Text>
        <TouchableOpacity style={s.button} onPress={() => router.push('/adicionar-veiculo')}><Text style={s.buttonText}>Cadastrar veículo</Text></TouchableOpacity>
      </View> : veiculos.map((veiculo) => {
        const anuncio = anuncioDoVeiculo(veiculo);
        return <View key={veiculo.id} style={s.vehicleCard}>
          {veiculo.fotos?.[0] ? <Image source={{ uri: veiculo.fotos[0] }} style={s.cover} /> : <View style={s.coverEmpty}><Text style={s.sub}>Sem foto</Text></View>}
          <Text style={s.vehicleName}>{veiculo.marca} {veiculo.modelo} · {veiculo.ano}</Text>
          <Text style={s.sub}>Placa {veiculo.placa}</Text>
          {anuncio ? <>
            <Text style={s.alreadyListed}>Já anunciado{anuncio.disponivel ? ' · disponível para aluguel' : ' · indisponível'}</Text>
            <TouchableOpacity style={s.secondaryButton} onPress={() => router.push('/meus-carros')}><Text style={s.buttonText}>Gerenciar anúncio</Text></TouchableOpacity>
          </> : <TouchableOpacity style={s.button} onPress={() => escolher(veiculo)}><Text style={s.buttonText}>Anunciar este veículo</Text></TouchableOpacity>}
        </View>;
      })}
    </ScrollView>;
  }

  return <ScrollView style={s.page} contentContainerStyle={s.pad} keyboardShouldPersistTaps="always">
    <TouchableOpacity onPress={voltarParaSelecao}><Text style={s.back}>‹ Escolher outro veículo</Text></TouchableOpacity>
    <Text style={s.title}>Anunciar veículo</Text>
    <Text style={s.sub}>Os dados abaixo vêm do veículo cadastrado. Preencha as informações do aluguel.</Text>
    <View style={s.card}>
      {!!selecionado.fotos?.length && <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.photos}>{selecionado.fotos.map((foto, index) => <Image key={`${foto}-${index}`} source={{ uri: foto }} style={s.photo} />)}</ScrollView>}
      <View style={s.vehicleSummary}>
        <Text style={s.vehicleName}>{selecionado.marca} {selecionado.modelo} · {selecionado.ano}</Text>
        <Text style={s.sub}>Placa {selecionado.placa}</Text>
      </View>
      <View style={s.field}>
        <Text style={s.label}>Cidade</Text>
        <TextInput value={cidade} onChangeText={setCidade} placeholder="Sua cidade" placeholderTextColor="#8295AA" style={s.input} />
      </View>
      <View style={s.field}>
        <Text style={s.label}>Diária (R$)</Text>
        <TextInput value={diaria} onChangeText={setDiaria} placeholder="Ex.: 150,00" placeholderTextColor="#8295AA" style={s.input} keyboardType="decimal-pad" />
      </View>
      <View style={s.field}>
        <Text style={s.label}>Descrição</Text>
        <TextInput value={descricao} onChangeText={setDescricao} placeholder="Detalhes adicionais para os locatários" placeholderTextColor="#8295AA" style={[s.input, s.multiline]} multiline />
      </View>
      <TouchableOpacity style={s.button} onPress={() => void salvar()} disabled={salvando}>
        <Text style={s.buttonText}>{salvando ? 'Publicando...' : 'Publicar anúncio'}</Text>
      </TouchableOpacity>
    </View>
  </ScrollView>;
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#07111F' },
  pad: { padding: 20, paddingTop: 54, paddingBottom: 40 },
  center: { alignItems: 'center', justifyContent: 'center' },
  back: { color: '#55ADFF', fontSize: 16, fontWeight: '700' },
  title: { color: '#FFF', fontSize: 28, fontWeight: '900', marginTop: 24 },
  sub: { color: '#A9BCD0', fontSize: 14, lineHeight: 21, marginTop: 8 },
  vehicleCard: { backgroundColor: '#10243B', borderColor: '#244563', borderWidth: 1, borderRadius: 16, padding: 16, marginTop: 14 },
  emptyCard: { backgroundColor: '#10243B', borderColor: '#244563', borderWidth: 1, borderRadius: 16, padding: 18, marginTop: 18 },
  card: { backgroundColor: '#10243B', borderColor: '#244563', borderWidth: 1, borderRadius: 16, padding: 18, marginTop: 18 },
  cover: { width: '100%', height: 170, borderRadius: 12, backgroundColor: '#071B2A' },
  coverEmpty: { width: '100%', height: 120, borderRadius: 12, backgroundColor: '#071B2A', alignItems: 'center', justifyContent: 'center' },
  vehicleName: { color: '#FFF', fontSize: 18, fontWeight: '800', marginTop: 13 },
  alreadyListed: { color: '#8AE0AE', fontSize: 13, fontWeight: '800', marginTop: 12 },
  vehicleSummary: { backgroundColor: '#0B1B30', borderRadius: 12, padding: 14, marginTop: 10 },
  photos: { marginBottom: 8 },
  photo: { width: 190, height: 130, borderRadius: 11, marginRight: 9, backgroundColor: '#071B2A' },
  field: { marginTop: 14 },
  label: { color: '#D5E2EF', fontSize: 14, fontWeight: '700', marginBottom: 7 },
  input: { minHeight: 52, borderWidth: 1, borderColor: '#294967', borderRadius: 13, backgroundColor: '#071B2A', paddingHorizontal: 13, color: '#FFF' },
  multiline: { minHeight: 96, paddingTop: 13, textAlignVertical: 'top' },
  button: { backgroundColor: '#087BE5', padding: 15, borderRadius: 13, alignItems: 'center', marginTop: 18 },
  secondaryButton: { backgroundColor: '#183653', padding: 14, borderRadius: 13, alignItems: 'center', marginTop: 12 },
  buttonText: { color: '#FFF', fontWeight: '800' },
});
