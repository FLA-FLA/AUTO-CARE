import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AluguelConta() {
  const [tipo, setTipo] = useState('');
  useEffect(() => { AsyncStorage.getItem('@autocare_usuario').then((raw) => { if (raw) setTipo(JSON.parse(raw).tipo ?? ''); }); }, []);
  const locador = tipo === 'proprietario';
  return <ScrollView style={s.page} contentContainerStyle={s.pad}>
    <TouchableOpacity onPress={() => router.back()}><Text style={s.back}>‹ Voltar</Text></TouchableOpacity>
    <Text style={s.title}>{locador ? 'Área do locador' : 'Aluguel de veículos'}</Text>
    <Text style={s.sub}>{locador ? 'Anuncie seus carros e acompanhe os pedidos de aluguel.' : 'Encontre carros disponíveis e acompanhe seus pedidos.'}</Text>
    <TouchableOpacity style={s.card} onPress={() => router.push(locador ? '/meus-carros' : '/aluguel')}>
      <Text style={s.name}>{locador ? 'Meus carros' : 'Buscar carro para alugar'}</Text>
      <Text style={s.sub}>{locador ? 'Gerencie anúncios, despesas e solicitações.' : 'Explore os anúncios e consulte fotos e detalhes.'}</Text>
    </TouchableOpacity>
    {!locador && <TouchableOpacity style={s.card} onPress={() => router.push('/meus-alugueis')}><Text style={s.name}>Meus aluguéis</Text><Text style={s.sub}>Acompanhe seus pedidos e abastecimentos.</Text></TouchableOpacity>}
  </ScrollView>;
}
const s = StyleSheet.create({ page:{flex:1,backgroundColor:'#07111F'},pad:{padding:20,paddingTop:54},back:{color:'#55ADFF',fontSize:16,fontWeight:'700'},title:{color:'#FFF',fontSize:28,fontWeight:'900',marginTop:24},sub:{color:'#A9BCD0',fontSize:14,lineHeight:21,marginTop:8},card:{backgroundColor:'#10243B',borderColor:'#244563',borderWidth:1,borderRadius:16,padding:18,marginTop:18},name:{color:'#FFF',fontSize:18,fontWeight:'800'} });
