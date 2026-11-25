import { useFocusEffect, router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Aluguel, buscarAlugueis, buscarCarros, buscarSessao, Carro, salvarAlugueis, Usuario } from '@/lib/aluguel';

export default function Solicitacoes() {
  const [user, setUser] = useState<Usuario | null>(null);
  const [cars, setCars] = useState<Carro[]>([]);
  const [requests, setRequests] = useState<Aluguel[]>([]);

  const load = useCallback(async () => {
    const current = await buscarSessao();
    setUser(current);
    const [allCars, allRentals] = await Promise.all([buscarCarros(), buscarAlugueis()]);
    setCars(allCars);
    setRequests(allRentals.filter(item => item.proprietarioId === current?.id));
  }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  async function responder(id: string, status: 'aprovado' | 'recusado') {
    if (!user) return;
    const allRentals = await buscarAlugueis();
    const updated = allRentals.map(item => item.id === id && item.proprietarioId === user.id ? { ...item, status } : item);
    await salvarAlugueis(updated);
    setRequests(updated.filter(item => item.proprietarioId === user.id));
  }

  return <ScrollView style={s.page} contentContainerStyle={s.pad}>
    <Text style={s.title}>Solicitações de aluguel</Text>
    <Text style={s.sub}>Analise os pedidos e acompanhe o status de cada aluguel.</Text>
    {requests.length === 0 && <View style={s.card}><Text style={s.name}>Nenhuma solicitação recebida</Text><Text style={s.sub}>Quando alguém pedir um carro, o pedido aparecerá aqui.</Text></View>}
    {requests.map(request => {
      const car = cars.find(item => item.id === request.carroId);
      return <View style={s.card} key={request.id}>
        <Text style={s.name}>{car ? `${car.marca} ${car.modelo}` : 'Veículo'}</Text>
        <Text style={s.text}>{request.locatarioNome}</Text>
        <Text style={s.text}>{request.inicio} até {request.fim}</Text>
        <Text style={s.price}>{request.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text>
        <Text style={s.status}>Status: {request.status}</Text>
        {request.status === 'pendente' && <View style={s.actions}>
          <TouchableOpacity style={s.accept} onPress={() => void responder(request.id, 'aprovado')}><Text style={s.actionText}>Aprovar</Text></TouchableOpacity>
          <TouchableOpacity style={s.decline} onPress={() => Alert.alert('Recusar pedido?', 'O locatário será informado da recusa.', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Recusar', style: 'destructive', onPress: () => void responder(request.id, 'recusado') }])}><Text style={s.declineText}>Recusar</Text></TouchableOpacity>
        </View>}
      </View>;
    })}
    <TouchableOpacity style={s.link} onPress={() => router.push('/meus-carros')}><Text style={s.linkText}>Gerenciar meus carros</Text></TouchableOpacity>
  </ScrollView>;
}

const s = StyleSheet.create({ page: { flex: 1, backgroundColor: '#07111F' }, pad: { padding: 20, paddingTop: 54, paddingBottom: 40 }, title: { color: '#FFF', fontSize: 28, fontWeight: '900' }, sub: { color: '#A9BCD0', fontSize: 14, lineHeight: 21, marginTop: 8 }, card: { backgroundColor: '#10243B', borderColor: '#244563', borderWidth: 1, borderRadius: 16, padding: 18, marginTop: 15 }, name: { color: '#FFF', fontSize: 18, fontWeight: '800' }, text: { color: '#A9BCD0', fontSize: 14, marginTop: 8 }, price: { color: '#55ADFF', fontSize: 20, fontWeight: '800', marginTop: 10 }, status: { color: '#91A8C0', marginTop: 8, textTransform: 'capitalize' }, actions: { flexDirection: 'row', gap: 10, marginTop: 15 }, accept: { backgroundColor: '#18824D', flex: 1, alignItems: 'center', padding: 12, borderRadius: 10 }, decline: { borderWidth: 1, borderColor: '#A85454', flex: 1, alignItems: 'center', padding: 12, borderRadius: 10 }, actionText: { color: '#FFF', fontWeight: '800' }, declineText: { color: '#FF9B9B', fontWeight: '800' }, link: { padding: 14, alignItems: 'center', marginTop: 10 }, linkText: { color: '#55ADFF', fontWeight: '800' } });
