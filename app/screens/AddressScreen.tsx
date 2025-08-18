import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { DELETE_ID, GET_ALL, POST, PUT } from '../Api/ApiService';
import type { RootStackParamList } from '../index';

// ---- Types (UI dùng camelCase) ----
type Address = {
  addressId?: number;
  buildingName: string;
  city: string;
  country: string;
  pincode: string;
  state: string;
  street: string;
};

// Map từ API (snake_case) -> UI
const fromApi = (a: any): Address => ({
  addressId: a.address_id ?? a.addressId,
  buildingName: a.building_name ?? a.buildingName ?? '',
  city: a.city ?? '',
  country: a.country ?? '',
  pincode: String(a.pincode ?? ''),
  state: a.state ?? '',
  street: a.street ?? '',
});

// Map từ UI -> API (snake_case)
const toApi = (a: Address) => ({
  ...(a.addressId ? { address_id: a.addressId } : {}),
  building_name: a.buildingName,
  city: a.city,
  country: a.country,
  pincode: a.pincode,
  state: a.state,
  street: a.street,
});

export default function AddressScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const mode: 'manage' | 'select' = ((route.params as any)?.mode ?? 'manage') as any;

  const [items, setItems] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<Address>({
    buildingName: '',
    city: '',
    country: '',
    pincode: '',
    state: '',
    street: '',
  });

  const validate = (): string | null => {
    if (!form.street.trim()) return 'Vui lòng nhập Street';
    if (!form.city.trim()) return 'Vui lòng nhập City';
    if (!form.state.trim()) return 'Vui lòng nhập State';
    if (!form.country.trim()) return 'Vui lòng nhập Country';
    if (!form.pincode.trim()) return 'Vui lòng nhập Pincode';
    return null;
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await GET_ALL('admin/addresses');
      const data = Array.isArray(res.data?.content) ? res.data.content : res.data;
      setItems((data ?? []).map(fromApi));
    } catch (e: any) {
      Alert.alert('Lỗi', e?.response?.data?.message || 'Không tải được danh sách địa chỉ');
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchData();
    } finally {
      setRefreshing(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      buildingName: '',
      city: '',
      country: '',
      pincode: '',
      state: '',
      street: '',
    });
    setModalVisible(true);
  };

  const openEdit = (addr: Address) => {
    setEditing(addr);
    setForm(addr);
    setModalVisible(true);
  };

  const submit = async () => {
    const v = validate();
    if (v) return Alert.alert('Thiếu dữ liệu', v);

    try {
      setSubmitting(true);
      if (editing?.addressId) {
        await PUT(`admin/addresses/${editing.addressId}`, toApi(form));
        setItems(prev =>
          prev.map(x => (x.addressId === editing.addressId ? { ...form, addressId: editing.addressId } : x)),
        );
      } else {
        const res = await POST('admin/address', toApi(form));
        const created = fromApi(res.data ?? form);
        setItems(prev => [created, ...prev]);
      }
      setModalVisible(false);
    } catch (e: any) {
      Alert.alert('Không thể lưu', e?.response?.data?.message || 'Đã xảy ra lỗi');
    } finally {
      setSubmitting(false);
    }
  };

  const remove = (addr: Address) => {
    Alert.alert('Xóa địa chỉ', `Bạn chắc chắn muốn xóa ID ${addr.addressId}?`, [
      { text: 'Hủy' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await DELETE_ID('admin/addresses', addr.addressId!);
            setItems(prev => prev.filter(x => x.addressId !== addr.addressId));
          } catch (e: any) {
            Alert.alert('Không thể xóa', e?.response?.data?.message || 'Đã xảy ra lỗi');
          }
        },
      },
    ]);
  };

  const selectAddress = (addr: Address) => {
    // Gửi địa chỉ về Payment và merge params
    navigation.navigate({
      name: 'Payment',
      params: { address: addr },
      merge: true,
    } as any);
    navigation.goBack();
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{mode === 'select' ? 'Chọn địa chỉ' : 'Quản lý địa chỉ'}</Text>
        {mode !== 'select' && (
          <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
            <Text style={styles.addBtnText}>+ Thêm</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.muted}>Đang tải...</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.muted}>Chưa có địa chỉ nào</Text>
          {mode !== 'select' && (
            <TouchableOpacity style={[styles.addBtn, { marginTop: 12 }]} onPress={openCreate}>
              <Text style={styles.addBtnText}>Thêm địa chỉ</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => String(it.addressId ?? Math.random())}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>#{item.addressId} • {item.street}</Text>
              <Text style={styles.cardLine}>
                {(item.buildingName ? item.buildingName + ', ' : '') + item.street}
              </Text>
              <Text style={styles.cardLine}>
                {item.city}, {item.state}, {item.country}
              </Text>
              <Text style={styles.cardLine}>Pincode: {item.pincode}</Text>

              <View style={styles.row}>
                <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
                  <Text style={styles.btnText}>Sửa</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.delBtn} onPress={() => remove(item)}>
                  <Text style={styles.btnText}>Xóa</Text>
                </TouchableOpacity>
              </View>

              {mode === 'select' && (
                <TouchableOpacity
                  style={[styles.addBtn, { marginTop: 10, alignSelf: 'flex-end', backgroundColor: '#111827' }]}
                  onPress={() => selectAddress(item)}
                >
                  <Text style={styles.addBtnText}>Chọn</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}

      {/* Modal form */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{editing ? 'Sửa địa chỉ' : 'Thêm địa chỉ'}</Text>

            <FormInput label="Building name" value={form.buildingName}
              onChangeText={(v) => setForm(s => ({ ...s, buildingName: v }))} placeholder="VD: Block A, Tầng 3" />

            <FormInput label="Street *" value={form.street} required
              onChangeText={(v) => setForm(s => ({ ...s, street: v }))} placeholder="Số nhà, tên đường" />

            <FormInput label="City *" value={form.city} required
              onChangeText={(v) => setForm(s => ({ ...s, city: v }))} placeholder="Thành phố" />

            <FormInput label="State *" value={form.state} required
              onChangeText={(v) => setForm(s => ({ ...s, state: v }))} placeholder="Tỉnh/Bang" />

            <FormInput label="Country *" value={form.country} required
              onChangeText={(v) => setForm(s => ({ ...s, country: v }))} placeholder="Quốc gia" />

            <FormInput label="Pincode *" value={form.pincode} required keyboardType="number-pad"
              onChangeText={(v) => setForm(s => ({ ...s, pincode: v }))} placeholder="Mã bưu chính" />

            <View style={styles.row}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancel]} onPress={() => setModalVisible(false)} disabled={submitting}>
                <Text style={styles.modalBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.save]} onPress={submit} disabled={submitting}>
                {submitting ? <ActivityIndicator /> : <Text style={styles.modalBtnText}>Lưu</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const FormInput = ({
  label, value, onChangeText, placeholder, keyboardType, required,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'number-pad' | 'email-address';
  required?: boolean;
}) => (
  <View style={{ marginBottom: 10 }}>
    <Text style={styles.inputLabel}>
      {label} {required ? <Text style={{ color: '#f43f5e' }}>*</Text> : null}
    </Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      keyboardType={keyboardType ?? 'default'}
      style={styles.input}
    />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#e5e7eb',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  title: { fontSize: 20, fontWeight: '700' },
  addBtn: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#2563eb', borderRadius: 8 },
  addBtnText: { color: '#fff', fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  muted: { color: '#6b7280' },

  card: {
    marginHorizontal: 16, marginTop: 12, padding: 12,
    backgroundColor: '#f9fafb', borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth, borderColor: '#e5e7eb',
  },
  cardTitle: { fontWeight: '700', marginBottom: 4 },
  cardLine: { color: '#374151', marginTop: 2 },
  row: { flexDirection: 'row', gap: 10, marginTop: 12 },
  editBtn: { flex: 1, backgroundColor: '#10b981', padding: 10, borderRadius: 8, alignItems: 'center' },
  delBtn: { flex: 1, backgroundColor: '#ef4444', padding: 10, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '600' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  inputLabel: { fontWeight: '600', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  modalBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
  cancel: { backgroundColor: '#e5e7eb' },
  save: { backgroundColor: '#2563eb' },
  modalBtnText: { color: '#111827', fontWeight: '700' },
});
