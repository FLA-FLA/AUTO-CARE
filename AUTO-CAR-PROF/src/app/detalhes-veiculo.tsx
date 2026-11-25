import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Veiculo = { id: string; marca: string; modelo: string; ano: string; placa: string; fotos?: string[] };
type Registro = { id: string; tipoRegistro: string; titulo: string; data?: string; detalhes: string[] };
const key = (email: string, suffix: string) => `@autocare_${encodeURIComponent(email.trim().toLowerCase())}_${suffix}`;

function lerLista<T>(dados: string | null): T[] {
  if (!dados) return [];
  try {
    const lista = JSON.parse(dados);
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

export default function DetalhesVeiculo() {
  const { veiculoId } = useLocalSearchParams<{ veiculoId: string }>();
  const [email, setEmail] = useState('');
  const [car, setCar] = useState<Veiculo | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [registros, setRegistros] = useState<Registro[]>([]);

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem('@autocare_usuario');
      if (!raw) return;
      const user = JSON.parse(raw);
      const mail = user.email?.trim().toLowerCase();
      if (!mail) return;
      setEmail(mail);
      setIsOwner(user.tipo === 'proprietario');

      const [carsRaw, maintenanceRaw, reviewsRaw, documentsRaw, fuelRaw] = await Promise.all([
        AsyncStorage.getItem(key(mail, 'veiculos')),
        AsyncStorage.getItem(key(mail, 'manutencoes')),
        AsyncStorage.getItem(key(mail, 'revisoes')),
        AsyncStorage.getItem(key(mail, 'documentos')),
        AsyncStorage.getItem(key(mail, 'combustivel')),
      ]);
      const vehicles = lerLista<Veiculo>(carsRaw);
      const vehicle = vehicles.find(item => item.id === veiculoId) || null;
      setCar(vehicle);
      if (!vehicle) {
        setRegistros([]);
        return;
      }

      const pertenceAoVeiculo = (item: { veiculoId?: string }) =>
        item.veiculoId === vehicle.id || (!item.veiculoId && vehicles.length === 1);
      const maintenance = lerLista<any>(maintenanceRaw)
        .filter(pertenceAoVeiculo)
        .map(item => ({ id: `manutencao-${item.id}`, tipoRegistro: 'Manutenção', titulo: item.servico || 'Manutenção', data: item.data, detalhes: [item.valor ? `Valor: R$ ${item.valor}` : '', item.observacao ? `Observações: ${item.observacao}` : ''] }));
      const reviews = lerLista<any>(reviewsRaw)
        .filter(pertenceAoVeiculo)
        .map(item => ({ id: `revisao-${item.id}`, tipoRegistro: 'Revisão', titulo: item.tipo || 'Revisão', data: item.data, detalhes: [item.km ? `Quilometragem: ${item.km} km` : '', item.valor ? `Valor: R$ ${item.valor}` : '', item.observacao ? `Observações: ${item.observacao}` : ''] }));
      const documents = lerLista<any>(documentsRaw)
        .filter(pertenceAoVeiculo)
        .map(item => ({ id: `documento-${item.id}`, tipoRegistro: 'Documento', titulo: item.tipo || 'Documento', data: item.validade, detalhes: [item.numero ? `Número: ${item.numero}` : '', item.validade ? `Validade: ${item.validade}` : '', item.observacao ? `Observações: ${item.observacao}` : ''] }));
      const fuel = lerLista<any>(fuelRaw)
        .filter(pertenceAoVeiculo)
        .map(item => ({ id: `abastecimento-${item.id}`, tipoRegistro: 'Abastecimento', titulo: 'Abastecimento', data: item.data, detalhes: [item.litros ? `Litros: ${item.litros} L` : '', item.valor ? `Valor: R$ ${item.valor}` : '', item.km ? `Quilometragem: ${item.km} km` : ''] }));
      setRegistros([...maintenance, ...reviews, ...documents, ...fuel].sort((a, b) => (b.data || '').localeCompare(a.data || '')));
    } catch (error) {
      console.log('Erro ao carregar detalhes do veículo:', error);
    }
  }, [veiculoId]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  async function remove() {
    if (!car) return;
    const cars = lerLista<Veiculo>(await AsyncStorage.getItem(key(email, 'veiculos')));
    await AsyncStorage.setItem(key(email, 'veiculos'), JSON.stringify(cars.filter(item => item.id !== car.id)));
    router.back();
  }

  if (!car) return <View style={s.page}><Text style={s.title}>Veículo não encontrado</Text></View>;
  const records = [['Manutenção', '/nova-manutencao'], ['Revisão', '/adicionar-revisao'], ['Documento', '/adicionar-documento']] as const;

  return (
    <ScrollView style={s.page} contentContainerStyle={s.pad}>
      <TouchableOpacity onPress={() => router.back()}><Text style={s.back}>‹ Voltar</Text></TouchableOpacity>
      <Text style={s.title}>{car.marca} {car.modelo}</Text>
      <Text style={s.sub}>{car.ano} · Placa {car.placa}</Text>
      <Text style={s.heading}>Fotos do veículo</Text>
      <View style={s.grid}>{(car.fotos || []).map((uri, i) => <Image key={`${uri}-${i}`} source={{ uri }} style={s.photo} />)}</View>
      <Text style={s.heading}>Registros deste veículo</Text>
      {isOwner && <TouchableOpacity style={s.button} onPress={() => router.push({ pathname: '/anunciar-carro', params: { veiculoId: car.id } })}><Text style={s.buttonText}>Anunciar este veículo para aluguel</Text></TouchableOpacity>}
      {records.map(([name, path]) => <TouchableOpacity key={name} style={s.button} onPress={() => router.push({ pathname: path, params: { veiculoId: car.id } })}><Text style={s.buttonText}>Adicionar {name.toLowerCase()}</Text></TouchableOpacity>)}

      <Text style={s.heading}>Histórico completo</Text>
      {registros.length === 0 ? <Text style={s.empty}>Ainda não há registros para este veículo.</Text> : registros.map(item => (
        <View key={item.id} style={s.historyCard}>
          <Text style={s.recordType}>{item.tipoRegistro}</Text>
          <Text style={s.recordTitle}>{item.titulo}</Text>
          {item.data ? <Text style={s.recordInfo}>{item.tipoRegistro === 'Documento' ? 'Validade' : 'Data'}: {item.data}</Text> : null}
          {item.detalhes.filter(Boolean).map((detail, index) => <Text key={`${item.id}-${index}`} style={s.recordInfo}>{detail}</Text>)}
        </View>
      ))}

      <TouchableOpacity style={s.delete} onPress={() => Alert.alert('Excluir veículo?', `${car.marca} ${car.modelo} será removido.`, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Excluir', style: 'destructive', onPress: () => void remove() }])}><MaterialCommunityIcons name="trash-can-outline" size={19} color="#FFF"/><Text style={s.buttonText}>Excluir veículo</Text></TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#07111F' }, pad: { padding: 20, paddingTop: 54, paddingBottom: 40 }, back: { color: '#55ADFF', fontSize: 16, fontWeight: '700' }, title: { color: '#FFF', fontSize: 27, fontWeight: '900', marginTop: 24 }, sub: { color: '#A9BCD0', fontSize: 14, marginTop: 7 }, heading: { color: '#FFF', fontSize: 18, fontWeight: '800', marginTop: 24, marginBottom: 12 }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, photo: { width: '31%', height: 92, borderRadius: 10, backgroundColor: '#10243B' }, button: { backgroundColor: '#10243B', borderColor: '#244563', borderWidth: 1, padding: 15, borderRadius: 13, marginTop: 10 }, buttonText: { color: '#FFF', fontWeight: '800', marginLeft: 7 }, historyCard: { backgroundColor: '#10243B', borderColor: '#244563', borderWidth: 1, padding: 15, borderRadius: 13, marginTop: 9 }, recordType: { color: '#55ADFF', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' }, recordTitle: { color: '#FFF', fontSize: 16, fontWeight: '800', marginTop: 5 }, recordInfo: { color: '#A9BCD0', fontSize: 13, marginTop: 7 }, empty: { color: '#A9BCD0', backgroundColor: '#10243B', padding: 16, borderRadius: 13 }, delete: { backgroundColor: '#6B2438', padding: 14, borderRadius: 13, marginTop: 24, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
});
