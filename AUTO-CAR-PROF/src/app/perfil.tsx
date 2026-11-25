import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Conta = { nome?: string; email?: string; tipo?: 'proprietario' | 'locatario' };

export default function Perfil() {
  const [conta, setConta] = useState<Conta | null>(null);
  const load = useCallback(async () => {
    const raw = await AsyncStorage.getItem('@autocare_usuario');
    if (raw) setConta(JSON.parse(raw));
  }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  async function sair() {
    const confirmar = async () => {
      await AsyncStorage.removeItem('@autocare_logado');
      await AsyncStorage.removeItem('@autocare_sessao');
      router.replace('/login');
    };
    Alert.alert('Sair da conta?', 'Você precisará entrar novamente para acessar o Auto Care.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => void confirmar() },
    ]);
  }

  const role = conta?.tipo === 'proprietario' ? 'Locador' : 'Locatário';
  return <ScrollView style={s.page} contentContainerStyle={s.pad}>
    <Text style={s.title}>Perfil</Text>
    <Text style={s.sub}>Informações da sua conta Auto Care.</Text>
    <View style={s.card}>
      <Text style={s.label}>Nome</Text><Text style={s.value}>{conta?.nome || '—'}</Text>
      <Text style={s.label}>E-mail</Text><Text style={s.value}>{conta?.email || '—'}</Text>
      <Text style={s.label}>Tipo de conta</Text><Text style={s.value}>{role}</Text>
    </View>
    <TouchableOpacity style={s.logout} onPress={() => void sair()}><Text style={s.logoutText}>Sair da conta</Text></TouchableOpacity>
  </ScrollView>;
}

const s = StyleSheet.create({ page: { flex: 1, backgroundColor: '#07111F' }, pad: { padding: 20, paddingTop: 54, paddingBottom: 40 }, title: { color: '#FFF', fontSize: 28, fontWeight: '900' }, sub: { color: '#A9BCD0', fontSize: 14, lineHeight: 21, marginTop: 8 }, card: { backgroundColor: '#10243B', borderColor: '#244563', borderWidth: 1, borderRadius: 16, padding: 18, marginTop: 18 }, label: { color: '#8295AA', fontSize: 12, fontWeight: '700', marginTop: 10 }, value: { color: '#FFF', fontSize: 16, fontWeight: '700', marginTop: 4 }, logout: { backgroundColor: '#6B2438', padding: 15, borderRadius: 13, alignItems: 'center', marginTop: 18 }, logoutText: { color: '#FFF', fontWeight: '800' } });
