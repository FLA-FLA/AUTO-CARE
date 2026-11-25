import { useFocusEffect, router } from 'expo-router';
import { useCallback, useState } from 'react';
import { mascararDataISO } from '@/lib/formatos-campo';
import { Alert, Image, Linking, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Aluguel, buscarAlugueis, buscarCarros, buscarSessao, Carro, salvarAlugueis, Usuario } from '@/lib/aluguel';

export default function Catalogo() {
  const [cars, setCars] = useState<Carro[]>([]);
  const [user, setUser] = useState<Usuario | null>(null);
  const [inicio, setInicio] = useState('');
  const [fim, setFim] = useState('');
  const [selecionado, setSelecionado] = useState<Carro | null>(null);

  const load = useCallback(async () => {
    const usuario = await buscarSessao();
    setUser(usuario);
    const [alugueis, todosCarros] = await Promise.all([buscarAlugueis(), buscarCarros()]);
    const ocupados = new Set(alugueis.filter((item) => item.status === 'aprovado').map((item) => item.carroId));
    setCars(todosCarros.filter((carro) => carro.disponivel && !ocupados.has(carro.id) && carro.proprietarioId !== usuario?.id));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function solicitar(carro: Carro) {
    if (!user) {
      Alert.alert('Entre na sua conta', 'Faça login para solicitar um aluguel.');
      return;
    }
    if (!inicio.trim() || !fim.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(inicio) || !/^\d{4}-\d{2}-\d{2}$/.test(fim)) {
      Alert.alert('Informe as datas', 'Preencha retirada e devolução no formato AAAA-MM-DD.');
      return;
    }
    const dias = Math.ceil((new Date(fim).getTime() - new Date(inicio).getTime()) / 86400000);
    if (!Number.isFinite(dias) || dias < 1) {
      Alert.alert('Datas inválidas', 'A devolução deve ser posterior à retirada.');
      return;
    }
    const todos = await buscarAlugueis();
    const pedido: Aluguel = {
      id: Date.now().toString(), carroId: carro.id, locatarioId: user.id, locatarioNome: user.nome,
      proprietarioId: carro.proprietarioId, inicio, fim, total: dias * carro.diaria,
      status: 'pendente', criadoEm: new Date().toISOString(),
    };
    await salvarAlugueis([...todos, pedido]);
    Alert.alert('Pedido enviado', `Solicitação enviada a ${carro.proprietarioNome}. Total estimado: ${pedido.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
    setSelecionado(null);
    load();
  }

  function contatarLocador(carro: Carro) {
    if (!carro.proprietarioEmail) {
      Alert.alert('Contato indisponível', 'O locador ainda não informou um e-mail de contato.');
      return;
    }
    Linking.openURL(`mailto:${carro.proprietarioEmail}`).catch(() => Alert.alert('Não foi possível abrir o aplicativo de e-mail.'));
  }

  return (
    <ScrollView style={s.page} contentContainerStyle={s.pad} keyboardShouldPersistTaps="always">
      <TouchableOpacity onPress={() => router.back()}><Text style={s.back}>‹ Voltar</Text></TouchableOpacity>
      <Text style={s.title}>Carros disponíveis</Text>
      <Text style={s.sub}>Explore os anúncios, escolha um carro e consulte os detalhes antes de solicitar.</Text>
      {cars.length === 0 ? <View style={s.card}><Text style={s.name}>Nenhum carro disponível por enquanto</Text><Text style={s.text}>Volte mais tarde para conferir novos anúncios.</Text></View> : cars.map((carro) => (
        <TouchableOpacity style={s.card} key={carro.id} activeOpacity={0.85} onPress={() => setSelecionado(carro)}>
          {carro.fotos?.[0] ? <Image source={{ uri: carro.fotos[0] }} style={s.cover} /> : <View style={s.coverEmpty}><Text style={s.text}>Sem foto</Text></View>}
          <View style={s.badge}><Text style={s.badgeText}>DISPONÍVEL</Text></View>
          <Text style={s.name}>{carro.marca} {carro.modelo} · {carro.ano}</Text>
          <Text style={s.text}>{carro.cidade}</Text>
          <Text style={s.price}>{carro.diaria.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}<Text style={s.text}> / dia</Text></Text>
          <View style={s.button}><Text style={s.buttonText}>Ver detalhes</Text></View>
        </TouchableOpacity>
      ))}

      <Modal visible={!!selecionado} animationType="slide" onRequestClose={() => setSelecionado(null)}>
        <ScrollView style={s.page} contentContainerStyle={s.modalPad} keyboardShouldPersistTaps="always">
          <TouchableOpacity onPress={() => setSelecionado(null)}><Text style={s.back}>‹ Voltar aos carros</Text></TouchableOpacity>
          {selecionado && <>
            <Text style={s.title}>{selecionado.marca} {selecionado.modelo}</Text>
            <Text style={s.sub}>{selecionado.ano} · {selecionado.cidade}</Text>
            {selecionado.fotos?.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.photos}>{selecionado.fotos.map((foto, indice) => <Image key={`${foto}-${indice}`} source={{ uri: foto }} style={s.photo} />)}</ScrollView> : <View style={s.coverEmpty}><Text style={s.text}>Este anúncio não tem fotos.</Text></View>}
            <View style={s.card}>
              <Text style={s.section}>Detalhes do veículo</Text>
              <Text style={s.text}>Ano: {selecionado.ano}</Text>
              <Text style={s.text}>Cidade: {selecionado.cidade}</Text>
              <Text style={s.text}>Placa: {selecionado.placa}</Text>
              {!!selecionado.descricao && <Text style={s.text}>{selecionado.descricao}</Text>}
              <Text style={s.price}>{selecionado.diaria.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}<Text style={s.text}> / dia</Text></Text>
            </View>
            <View style={s.card}>
              <Text style={s.section}>Locador</Text>
              <Text style={s.text}>{selecionado.proprietarioNome}</Text>
              <TouchableOpacity style={s.secondaryButton} onPress={() => contatarLocador(selecionado)}><Text style={s.buttonText}>Entrar em contato por e-mail</Text></TouchableOpacity>
            </View>
            <TouchableOpacity style={s.button} onPress={() => router.push({ pathname: '/historico-carro', params: { carroId: selecionado.id } })}><Text style={s.buttonText}>Ver revisões e manutenções</Text></TouchableOpacity>
            <View style={s.card}>
              <Text style={s.section}>Solicitar aluguel</Text>
              <TextInput style={s.date} placeholder="Retirada AAAA-MM-DD" value={inicio} onChangeText={(text) => setInicio(mascararDataISO(text))} keyboardType="numeric" maxLength={10} placeholderTextColor="#9CB0C5" />
              <TextInput style={s.date} placeholder="Devolução AAAA-MM-DD" value={fim} onChangeText={(text) => setFim(mascararDataISO(text))} keyboardType="numeric" maxLength={10} placeholderTextColor="#9CB0C5" />
              <TouchableOpacity style={s.button} onPress={() => solicitar(selecionado)}><Text style={s.buttonText}>Enviar pedido ao locador</Text></TouchableOpacity>
            </View>
          </>}
        </ScrollView>
      </Modal>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#07111F' }, pad: { padding: 20, paddingTop: 54, paddingBottom: 40 }, modalPad: { padding: 20, paddingTop: 54, paddingBottom: 45 },
  back: { color: '#55ADFF', fontSize: 16, fontWeight: '700' }, title: { fontSize: 30, fontWeight: '800', color: '#FFFFFF', marginTop: 22 }, sub: { fontSize: 15, color: '#A9BCD0', marginTop: 6, marginBottom: 18, lineHeight: 22 },
  card: { backgroundColor: '#10243B', borderWidth: 1, borderColor: '#1D3C5B', padding: 17, borderRadius: 18, marginTop: 14 }, cover: { width: '100%', height: 190, borderRadius: 12, marginBottom: 13, backgroundColor: '#0B1B30' }, coverEmpty: { width: '100%', height: 150, borderRadius: 12, marginBottom: 13, backgroundColor: '#0B1B30', alignItems: 'center', justifyContent: 'center' }, photos: { marginTop: 14, marginBottom: 8 }, photo: { width: 290, height: 210, borderRadius: 13, marginRight: 10, backgroundColor: '#0B1B30' },
  badge: { alignSelf: 'flex-start', backgroundColor: '#153A2A', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 }, badgeText: { color: '#8AE0AE', fontWeight: '800', fontSize: 11 }, name: { fontSize: 21, fontWeight: '800', color: '#FFFFFF', marginTop: 12 }, section: { fontSize: 17, fontWeight: '800', color: '#FFFFFF', marginBottom: 5 }, text: { fontSize: 14, color: '#A9BCD0', marginTop: 6, lineHeight: 21 }, price: { fontSize: 23, fontWeight: '800', color: '#55ADFF', marginTop: 14 },
  date: { borderWidth: 1, borderColor: '#294967', padding: 12, borderRadius: 10, marginVertical: 5, color: '#FFFFFF', backgroundColor: '#0B1B30' }, button: { backgroundColor: '#087BE5', alignItems: 'center', padding: 14, borderRadius: 11, marginTop: 13 }, secondaryButton: { backgroundColor: '#183653', alignItems: 'center', padding: 14, borderRadius: 11, marginTop: 12 }, buttonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
});
