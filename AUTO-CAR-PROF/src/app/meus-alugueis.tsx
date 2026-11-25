import { useFocusEffect, router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Aluguel, buscarAlugueis, buscarCarros, buscarSessao, Carro, Usuario } from '@/lib/aluguel';

export default function MeusAlugueis() {
  const [user, setUser] = useState<Usuario | null>(null);
  const [items, setItems] = useState<Aluguel[]>([]);
  const [cars, setCars] = useState<Carro[]>([]);
  const load = useCallback(async () => {
    const current = await buscarSessao();
    setUser(current);
    setCars(await buscarCarros());
    setItems((await buscarAlugueis()).filter((item) => item.locatarioId === current?.id));
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <ScrollView style={s.page} contentContainerStyle={s.pad}>
      <TouchableOpacity onPress={() => router.back()}><Text style={s.back}>‹ Voltar</Text></TouchableOpacity>
      <Text style={s.title}>Meus aluguéis</Text>
      <Text style={s.sub}>Acompanhe as solicitações que você enviou.</Text>
      {items.length === 0 && <View style={s.card}><Text style={s.name}>Você ainda não solicitou nenhum carro</Text><TouchableOpacity style={s.button} onPress={() => router.push('/aluguel')}><Text style={s.buttonText}>Explorar carros</Text></TouchableOpacity></View>}
      {items.map((rental) => {
        const car = cars.find((item) => item.id === rental.carroId);
        return <View style={s.card} key={rental.id}>
          {car?.fotos?.[0] ? <Image source={{ uri: car.fotos[0] }} style={s.cover} /> : null}
          <Text style={s.name}>{car ? `${car.marca} ${car.modelo}` : 'Veículo removido'}</Text>
          {car && <Text style={s.sub}>{car.ano} · {car.cidade} · {car.placa}</Text>}
          <Text style={s.sub}>{rental.inicio} até {rental.fim}</Text>
          <Text style={s.price}>{rental.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text>
          <Text style={s.status}>Status: {rental.status}</Text>
          {car && <TouchableOpacity style={s.secondaryButton} onPress={() => router.push({ pathname: '/historico-carro', params: { carroId: car.id } })}>
            <Text style={s.buttonText}>Ver fotos e dados do veículo</Text>
          </TouchableOpacity>}
          {rental.status === 'aprovado' && <TouchableOpacity style={s.button} onPress={() => router.push({ pathname: '/adicionar-combustivel', params: { veiculoId: rental.carroId, aluguelId: rental.id } })}>
            <Text style={s.buttonText}>Registrar abastecimento</Text>
          </TouchableOpacity>}
        </View>;
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#07111F' }, pad: { padding: 20, paddingTop: 54, paddingBottom: 40 }, back: { color: '#55ADFF', fontSize: 16, fontWeight: '700' },
  title: { fontSize: 30, fontWeight: '800', color: '#FFFFFF', marginTop: 22 }, sub: { fontSize: 14, color: '#A9BCD0', marginTop: 7, lineHeight: 21 },
  card: { backgroundColor: '#10243B', borderWidth: 1, borderColor: '#1D3C5B', padding: 18, borderRadius: 16, marginTop: 14 }, cover: { width: '100%', height: 180, borderRadius: 12, marginBottom: 13, backgroundColor: '#0B1B30' }, name: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' }, price: { fontSize: 20, fontWeight: '800', color: '#55ADFF', marginTop: 10 }, status: { color: '#91A8C0', marginTop: 8 }, button: { backgroundColor: '#087BE5', alignItems: 'center', padding: 14, borderRadius: 11, marginTop: 16 }, secondaryButton: { backgroundColor: '#183653', alignItems: 'center', padding: 14, borderRadius: 11, marginTop: 12 }, buttonText: { color: '#FFFFFF', fontWeight: '800' },
});
