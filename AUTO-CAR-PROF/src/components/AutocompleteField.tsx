import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleProp, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';

type Props = Omit<TextInputProps, 'value' | 'onChangeText'> & {
  label: string;
  value: string;
  options: string[];
  onChangeText: (value: string) => void;
  onSelect?: (value: string) => void;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<ViewStyle>;
  inputProps?: TextInputProps;
  selectionOnly?: boolean;
  helperText?: string;
  disabled?: boolean;
};

export default function AutocompleteField({ label, value, options, onChangeText, onSelect, containerStyle, inputStyle, inputProps, selectionOnly, helperText, disabled, ...rest }: Props) {
  const [open, setOpen] = useState(false);
  const filtered = useMemo(() => {
    const query = value.trim().toLocaleLowerCase('pt-BR');
    return options.filter((option) => !query || option.toLocaleLowerCase('pt-BR').includes(query)).slice(0, 80);
  }, [options, value]);
  useEffect(() => { if (disabled) setOpen(false); }, [disabled]);
  return <View style={[s.wrap, containerStyle]}>
    <Text style={s.label}>{label}</Text>
    <TextInput {...rest} {...inputProps} value={value} editable={!disabled} onFocus={() => setOpen(true)} onBlur={() => { setTimeout(() => setOpen(false), 150); }} onChangeText={(text) => { onChangeText(text); setOpen(true); }} style={[s.input, inputStyle, disabled && s.disabled]} />
    {!!helperText && <Text style={s.helper}>{helperText}</Text>}
    {open && !disabled && filtered.length > 0 && <View style={s.menu}><ScrollView keyboardShouldPersistTaps="always" nestedScrollEnabled style={s.list}>{filtered.map((option) => <Text key={option} onPress={() => { onChangeText(option); onSelect?.(option); setOpen(false); }} style={s.option}>{option}</Text>)}</ScrollView></View>}
    {selectionOnly && value.trim() && !options.includes(value) && <Text style={s.helper}>Escolha uma opção da lista.</Text>}
  </View>;
}

const s = StyleSheet.create({ wrap: { position: 'relative', zIndex: 5 }, label: { color: '#D5E2EF', fontSize: 14, fontWeight: '700', marginBottom: 8 }, input: { height: 54, borderWidth: 1, borderColor: '#294967', borderRadius: 14, backgroundColor: '#071B2A', paddingHorizontal: 14, color: '#FFFFFF', fontSize: 15 }, disabled: { opacity: 0.55 }, helper: { color: '#9CB0C5', fontSize: 11, marginTop: 5 }, menu: { position: 'absolute', top: 82, left: 0, right: 0, zIndex: 99, maxHeight: 220, backgroundColor: '#10243B', borderWidth: 1, borderColor: '#315879', borderRadius: 12, elevation: 8 }, list: { maxHeight: 220 }, option: { color: '#EAF4FF', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#294967' } });
