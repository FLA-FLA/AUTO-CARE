import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { buscarCarros, buscarHistoricoCarro, Carro, RegistroCarro } from '@/lib/aluguel';

function kmNumero(value?: string) {
  if (!value) return -1;
  const parsed = Number(value.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : -1;
}

export default function HistoricoCarro() {
  const { carroId } = useLocalSearchParams<{ carroId: string }>();
  const [car, setCar] = useState<Carro | null>(null);
  const [items, setItems] = useState<RegistroCarro[]>([]);
  const load = useCallback(async () => {
    if (!carroId) return;
    const [cars, records] = await Promise.all([buscarCarros(), buscarHistoricoCarro(carroId)]);
    setCar(cars.find(item => item.id === carroId) || null);
    setItems(records);
  }, [carroId]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const maiorKm = [...items].sort((a, b) => kmNumero(b.quilometragem) - kmNumero(a.quilometragem))[0]?.quilometragem;

  return <ScrollView style={s.page} contentContainerStyle={s.pad}>
    <TouchableOpacity onPress={() => router.back()}><Text style={s.back}>‹ Voltar</Text></TouchableOpacity>
    <Text style={s.title}>{car ? `${car.marca} ${car.modelo}` : 'Detalhes do veículo'}</Text>
    <Text style={s.sub}>Dados, fotos e histórico do veículo selecionado.</Text>

    {car?.fotos?.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.photos}>
      {car.fotos.map((foto, index) => <Image key={`${foto}-${index}`} source={{ uri: foto }} style={s.photo} />)}
    </ScrollView> : <View style={s.card}><Text style={s.text}>Este anúncio ainda não tem fotos.</Text></View>}

    {car && <View style={s.card}>
      <Text style={s.section}>Dados do veículo</Text>
      <Text style={s.name}>{car.marca} {car.modelo} · {car.ano}</Text>
      <Text style={s.text}>Placa: {car.placa}</Text>
      <Text style={s.text}>Cidade: {car.cidade}</Text>
      <Text style={s.text}>Diária: {car.diaria.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text>
      {!!car.descricao && <Text style={s.text}>{car.descricao}</Text>}
      <Text style={s.odometer}>Quilometragem registrada: {maiorKm ? `${maiorKm} km` : 'Ainda não informada'}</Text>
    </View>}

    <Text style={s.sectionHeading}>Revisões e manutenções</Text>
    {items.length === 0 && <View style={s.card}><Text style={s.text}>Ainda não há revisões ou manutenções registradas neste veículo.</Text></View>}
    {[...items].sort((a, b) => b.data.localeCompare(a.data)).map(item => <View style={s.card} key={item.id}>
      <Text style={s.recordType}>{item.categoria === 'revisao' ? 'Revisão' : 'Manutenção'}</Text>
      <Text style={s.name}>{item.descricao}</Text>
      <Text style={s.text}>Data: {item.data}</Text>
      {item.quilometragem ? <Text style={s.text}>Quilometragem: {item.quilometragem} km</Text> : null}
      {item.valor !== undefined && <Text style={s.value}>Valor: {item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text>}
      {!!item.observacao && <Text style={s.text}>Observações: {item.observacao}</Text>}
    </View>)}
  </ScrollView>;
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#07111F' }, pad: { padding: 20, paddingTop: 54, paddingBottom: 40 }, back: { color: '#55ADFF', fontSize: 16, fontWeight: '700' }, title: { color: '#FFF', fontSize: 28, fontWeight: '900', marginTop: 24 }, sub: { color: '#A9BCD0', fontSize: 14, marginTop: 7, lineHeight: 21 }, photos: { marginTop: 16 }, photo: { width: 270, height: 190, borderRadius: 13, marginRight: 10, backgroundColor: '#10243B' }, card: { backgroundColor: '#10243B', borderColor: '#244563', borderWidth: 1, padding: 16, borderRadius: 14, marginTop: 14 }, section: { color: '#FFF', fontSize: 17, fontWeight: '800', marginBottom: 9 }, sectionHeading: { color: '#FFF', fontSize: 19, fontWeight: '800', marginTop: 24 }, name: { color: '#FFF', fontSize: 16, fontWeight: '800', marginTop: 5 }, text: { color: '#A9BCD0', fontSize: 14, marginTop: 7, lineHeight: 20 }, value: { color: '#55ADFF', fontSize: 15, fontWeight: '800', marginTop: 8 }, odometer: { color: '#55ADFF', fontSize: 14, fontWeight: '800', marginTop: 13 }, recordType: { color: '#55ADFF', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
});
