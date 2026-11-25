import { useFocusEffect, router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { buscarAlugueis, buscarCarros, buscarHistoricoCarro, buscarSessao, Carro, RegistroCarro, salvarAlugueis, salvarCarros } from '@/lib/aluguel';

export default function MeusCarros() {
  const [cars, setCars] = useState<Carro[]>([]);
  const [rentals, setRentals] = useState<Awaited<ReturnType<typeof buscarAlugueis>>>([]);
  const [historicos, setHistoricos] = useState<Record<string, RegistroCarro[]>>({});

  const load = useCallback(async () => {
    const current = await buscarSessao();
    const meusCarros = (await buscarCarros()).filter((carro) => carro.proprietarioId === current?.id);
    setCars(meusCarros);
    setRentals((await buscarAlugueis()).filter((aluguel) => aluguel.proprietarioId === current?.id));
    const pares = await Promise.all(meusCarros.map(async (carro) => [carro.id, await buscarHistoricoCarro(carro.id)] as const));
    setHistoricos(Object.fromEntries(pares));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function toggle(carro: Carro) {
    const todos = await buscarCarros();
    await salvarCarros(todos.map((item) => item.id === carro.id ? { ...item, disponivel: !item.disponivel } : item));
    load();
  }

  async function responder(id: string, status: 'aprovado' | 'recusado') {
    const todos = await buscarAlugueis();
    await salvarAlugueis(todos.map((item) => item.id === id ? { ...item, status } : item));
    load();
  }

  function remover(carro: Carro) {
    const confirmar = async () => {
      const todos = await buscarCarros();
      await salvarCarros(todos.filter((item) => item.id !== carro.id));
      load();
    };
    if (typeof window !== 'undefined') {
      if (window.confirm(`Remover ${carro.marca} ${carro.modelo} do catálogo?`)) void confirmar();
      return;
    }
    Alert.alert('Remover anúncio?', `${carro.marca} ${carro.modelo} deixará de aparecer no catálogo.`, [
      { text: 'Cancelar', style: 'cancel' }, { text: 'Remover', style: 'destructive', onPress: () => void confirmar() },
    ]);
  }

  const totalGastos = Object.values(historicos).flat().reduce((total, registro) => total + (registro.valor ?? 0), 0);

  return (
    <ScrollView style={s.page} contentContainerStyle={s.pad}>
      <TouchableOpacity onPress={() => router.back()}><Text style={s.back}>‹ Voltar</Text></TouchableOpacity>
      <Text style={s.title}>Meus carros</Text>
      <Text style={s.sub}>Anúncios, gastos e solicitações de aluguel.</Text>
      <TouchableOpacity style={s.button} onPress={() => router.push('/anunciar-carro')}><Text style={s.buttonText}>+ Anunciar carro</Text></TouchableOpacity>

      <View style={s.expenseCard}><Text style={s.section}>Gastos totais dos meus veículos</Text><Text style={s.total}>{totalGastos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text><Text style={s.sub}>Soma das manutenções e revisões de todos os seus carros.</Text></View>

      {cars.length === 0 && <View style={s.card}><Text style={s.name}>Você ainda não anunciou carros</Text><Text style={s.sub}>Cadastre um veículo para começar a receber solicitações.</Text></View>}
      {cars.map((carro) => {
        const gastoCarro = (historicos[carro.id] ?? []).reduce((total, registro) => total + (registro.valor ?? 0), 0);
        return <View style={s.card} key={carro.id}>
          {!!carro.fotos?.[0] && <Image source={{ uri: carro.fotos[0] }} style={s.cover} />}
          <Text style={s.name}>{carro.marca} {carro.modelo} · {carro.ano}</Text>
          <Text style={s.sub}>{carro.cidade} · {carro.placa} · {carro.diaria.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/dia</Text>
          <Text style={s.carExpense}>Gastos deste veículo: {gastoCarro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text>
          <View style={s.switchRow}><Text style={s.text}>{carro.disponivel ? 'Disponível para aluguel' : 'Indisponível'}</Text><Switch value={carro.disponivel} onValueChange={() => toggle(carro)} /></View>
          <TouchableOpacity style={s.button} onPress={() => router.push({ pathname: '/historico-carro', params: { carroId: carro.id } })}><Text style={s.buttonText}>Ver gastos, revisões e manutenções</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => remover(carro)}><Text style={s.remove}>Remover anúncio</Text></TouchableOpacity>
        </View>;
      })}

      <Text style={s.section}>Pedidos recebidos</Text>
      {rentals.length === 0 && <Text style={s.sub}>Nenhuma solicitação até agora.</Text>}
      {rentals.map((aluguel) => <View style={s.card} key={aluguel.id}>
        <Text style={s.name}>{cars.find((carro) => carro.id === aluguel.carroId)?.modelo ?? 'Veículo'} · {aluguel.locatarioNome}</Text>
        <Text style={s.sub}>{aluguel.inicio} até {aluguel.fim} · {aluguel.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text>
        <Text style={s.text}>Status: {aluguel.status}</Text>
        {aluguel.status === 'pendente' && <View style={s.actions}><TouchableOpacity style={s.accept} onPress={() => responder(aluguel.id, 'aprovado')}><Text style={s.buttonText}>Aprovar</Text></TouchableOpacity><TouchableOpacity style={s.decline} onPress={() => responder(aluguel.id, 'recusado')}><Text style={s.declineText}>Recusar</Text></TouchableOpacity></View>}
      </View>)}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#07111F' }, pad: { padding: 20, paddingTop: 54, paddingBottom: 40 }, back: { color: '#55ADFF', fontSize: 16, fontWeight: '700' }, title: { fontSize: 30, fontWeight: '800', color: '#FFFFFF', marginTop: 22 }, sub: { fontSize: 14, color: '#A9BCD0', marginTop: 7, lineHeight: 21 },
  button: { backgroundColor: '#087BE5', padding: 14, alignItems: 'center', borderRadius: 12, marginTop: 14 }, buttonText: { color: '#FFFFFF', fontWeight: '800' }, card: { backgroundColor: '#10243B', borderWidth: 1, borderColor: '#1D3C5B', padding: 18, borderRadius: 16, marginTop: 14 }, name: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' }, text: { fontSize: 14, color: '#A9BCD0', marginTop: 8 }, cover: { width: '100%', height: 175, borderRadius: 12, marginBottom: 12 }, carExpense: { color: '#55ADFF', fontSize: 14, fontWeight: '800', marginTop: 12 },
  expenseCard: { backgroundColor: '#10243B', borderWidth: 1, borderColor: '#285078', padding: 18, borderRadius: 16, marginTop: 16 }, section: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', marginTop: 24 }, total: { color: '#55ADFF', fontSize: 27, fontWeight: '900', marginTop: 9 }, switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }, remove: { color: '#FF9B9B', fontWeight: '700', marginTop: 12 }, actions: { flexDirection: 'row', gap: 10, marginTop: 12 }, accept: { backgroundColor: '#18824D', flex: 1, alignItems: 'center', padding: 12, borderRadius: 10 }, decline: { borderWidth: 1, borderColor: '#A85454', flex: 1, alignItems: 'center', padding: 12, borderRadius: 10 }, declineText: { color: '#FF9B9B', fontWeight: '700' },
});
