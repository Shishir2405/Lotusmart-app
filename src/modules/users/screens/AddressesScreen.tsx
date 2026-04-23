import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeContext';
import { Button, Card, Badge, Input, Modal } from '../../../components/ui';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useToast } from '../../../components/ui/Toast';
import { LocationPicker, LocationPickerValue } from '../../../components/shared/LocationPicker';
import {
  useAddresses,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
} from '../../auth/hooks';
import { IAddress, AddressLabel } from '../../../types';
import { FONTS } from '../../../config/fonts';
import { COLORS } from '../../../config/constants';

interface FormState {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  label: AddressLabel;
  coordinates?: { lat: number; lng: number };
  formattedAddress?: string;
}

const EMPTY: FormState = {
  fullName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  pincode: '',
  isDefault: false,
  label: 'home',
};

const LABELS: { value: AddressLabel; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'home', label: 'Home', icon: 'home-outline' },
  { value: 'work', label: 'Work', icon: 'briefcase-outline' },
  { value: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' },
];

export default function AddressesScreen() {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const { data: addressesResponse, isLoading } = useAddresses();
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  const deleteAddress = useDeleteAddress();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState<IAddress | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const addresses: IAddress[] = addressesResponse?.data ?? [];

  useEffect(() => {
    if (!modalVisible) return;
    if (editingAddress) {
      setForm({
        fullName: editingAddress.fullName,
        phone: editingAddress.phone,
        addressLine1: editingAddress.addressLine1,
        addressLine2: editingAddress.addressLine2 ?? '',
        city: editingAddress.city,
        state: editingAddress.state,
        pincode: editingAddress.pincode,
        isDefault: editingAddress.isDefault ?? false,
        label: editingAddress.label ?? 'home',
        coordinates: editingAddress.coordinates,
        formattedAddress: editingAddress.formattedAddress,
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
  }, [modalVisible, editingAddress]);

  const setField = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: undefined }));
  };

  const onLocation = (value: LocationPickerValue) => {
    setForm((f) => ({
      ...f,
      addressLine1: value.addressLine1 || f.addressLine1,
      addressLine2: value.addressLine2 ?? f.addressLine2,
      city: value.city || f.city,
      state: value.state || f.state,
      pincode: value.pincode || f.pincode,
      coordinates: value.coordinates ?? f.coordinates,
      formattedAddress: value.formattedAddress ?? f.formattedAddress,
    }));
  };

  const validate = () => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (form.fullName.trim().length < 2) e.fullName = 'Full name is required';
    if (!/^[6-9]\d{9}$/.test(form.phone)) e.phone = 'Enter a valid 10-digit mobile';
    if (form.addressLine1.trim().length < 5)
      e.addressLine1 = 'Address must be at least 5 characters';
    if (!form.city.trim()) e.city = 'City is required';
    if (!form.state.trim()) e.state = 'State is required';
    if (!/^\d{6}$/.test(form.pincode)) e.pincode = 'Pincode must be 6 digits';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const openAdd = useCallback(() => {
    setEditingAddress(null);
    setModalVisible(true);
  }, []);

  const openEdit = useCallback((address: IAddress) => {
    setEditingAddress(address);
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setEditingAddress(null);
  }, []);

  const onSubmit = useCallback(() => {
    if (!validate()) {
      showToast('error', 'Please fix the highlighted fields');
      return;
    }
    const payload: Omit<IAddress, '_id'> = {
      fullName: form.fullName,
      phone: form.phone,
      addressLine1: form.addressLine1,
      addressLine2: form.addressLine2 || undefined,
      city: form.city,
      state: form.state,
      pincode: form.pincode,
      isDefault: form.isDefault,
      label: form.label,
      coordinates: form.coordinates,
      formattedAddress: form.formattedAddress,
    };

    if (editingAddress?._id) {
      updateAddress.mutate(
        { id: editingAddress._id, data: payload },
        {
          onSuccess: () => {
            showToast('success', 'Address updated');
            closeModal();
          },
          onError: () => showToast('error', 'Failed to update address'),
        },
      );
    } else {
      createAddress.mutate(payload, {
        onSuccess: () => {
          showToast('success', 'Address added');
          closeModal();
        },
        onError: () => showToast('error', 'Failed to add address'),
      });
    }
  }, [form, editingAddress, updateAddress, createAddress, showToast, closeModal]);

  const handleDelete = useCallback(
    (address: IAddress) => {
      Alert.alert(
        'Delete Address',
        `Are you sure you want to delete "${address.fullName}"'s address?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              if (!address._id) return;
              deleteAddress.mutate(address._id, {
                onSuccess: () => showToast('success', 'Address deleted'),
                onError: () => showToast('error', 'Failed to delete address'),
              });
            },
          },
        ],
      );
    },
    [deleteAddress, showToast],
  );

  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          style={[
            styles.skeletonCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.borderRadius.md,
            },
          ]}
        >
          <Skeleton width="60%" height={16} style={styles.skeletonRow} />
          <Skeleton width="40%" height={14} style={styles.skeletonRow} />
          <Skeleton width="90%" height={14} style={styles.skeletonRow} />
          <Skeleton width="70%" height={14} />
        </View>
      ))}
    </View>
  );

  const renderItem = ({ item }: { item: IAddress }) => (
    <Card style={styles.addressCard} elevation={1}>
      <View style={styles.cardHeader}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: theme.colors.text, fontSize: theme.fontSizes.base }]}>
            {item.fullName}
          </Text>
          {item.label ? (
            <View style={[styles.labelPill, { backgroundColor: COLORS.roseLight }]}>
              <Ionicons
                name={
                  item.label === 'work'
                    ? 'briefcase-outline'
                    : item.label === 'other'
                      ? 'ellipsis-horizontal-outline'
                      : 'home-outline'
                }
                size={11}
                color={COLORS.rose}
              />
              <Text style={[styles.labelPillText, { color: COLORS.rose }]}>
                {item.label[0].toUpperCase() + item.label.slice(1)}
              </Text>
            </View>
          ) : null}
          {item.isDefault && <Badge text="Default" variant="success" size="sm" />}
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => openEdit(item)}
            style={[styles.actionBtn, { backgroundColor: theme.colors.primary + '12' }]}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            <Ionicons name="pencil-outline" size={16} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDelete(item)}
            style={[styles.actionBtn, { backgroundColor: theme.colors.error + '12' }]}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            <Ionicons name="trash-outline" size={16} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      <Text
        style={[styles.phone, { color: theme.colors.textSecondary, fontSize: theme.fontSizes.sm }]}
      >
        {item.phone}
      </Text>
      <Text
        style={[styles.addressLine, { color: theme.colors.text, fontSize: theme.fontSizes.sm }]}
      >
        {item.addressLine1}
      </Text>
      {item.addressLine2 ? (
        <Text
          style={[styles.addressLine, { color: theme.colors.text, fontSize: theme.fontSizes.sm }]}
        >
          {item.addressLine2}
        </Text>
      ) : null}
      <Text
        style={[styles.addressLine, { color: theme.colors.text, fontSize: theme.fontSizes.sm }]}
      >
        {item.city}, {item.state} - {item.pincode}
      </Text>
    </Card>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconContainer, { backgroundColor: theme.colors.secondary + '14' }]}>
        <Ionicons name="location-outline" size={48} color={theme.colors.secondary} />
      </View>
      <Text
        style={[styles.emptyTitle, { color: theme.colors.text, fontSize: theme.fontSizes['2xl'] }]}
      >
        No addresses saved
      </Text>
      <Text
        style={[
          styles.emptySubtitle,
          { color: theme.colors.textSecondary, fontSize: theme.fontSizes.sm },
        ]}
      >
        Add a delivery address to get started
      </Text>
      <Button size="lg" onPress={openAdd}>
        Add Address
      </Button>
    </View>
  );

  const isMutating = createAddress.isPending || updateAddress.isPending;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <View style={styles.header}>
        <Text
          style={[
            styles.headerTitle,
            { color: theme.colors.text, fontSize: theme.fontSizes['2xl'] },
          ]}
        >
          My Addresses
        </Text>
        {addresses.length > 0 && (
          <Button size="sm" variant="outline" onPress={openAdd}>
            Add New
          </Button>
        )}
      </View>

      {isLoading ? (
        renderSkeleton()
      ) : addresses.length === 0 ? (
        renderEmpty()
      ) : (
        <FlatList
          data={addresses}
          renderItem={renderItem}
          keyExtractor={(item) => item._id ?? item.phone}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal
        visible={modalVisible}
        onClose={closeModal}
        title={editingAddress ? 'Edit Address' : 'Add New Address'}
      >
        <ScrollView
          style={styles.modalScroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={[
              styles.mapSection,
              { backgroundColor: COLORS.cream, borderColor: theme.colors.border },
            ]}
          >
            <View style={styles.mapHeader}>
              <Ionicons name="location-outline" size={16} color={COLORS.rose} />
              <Text
                style={[
                  styles.mapHeaderText,
                  { color: theme.colors.text, fontFamily: FONTS.body.semiBold },
                ]}
              >
                Pick address on map
              </Text>
            </View>
            <LocationPicker
              initialValue={{
                addressLine1: form.addressLine1,
                city: form.city,
                state: form.state,
                pincode: form.pincode,
                coordinates: form.coordinates,
                formattedAddress: form.formattedAddress,
              }}
              onChange={onLocation}
            />
          </View>

          <Input
            label="Full Name"
            placeholder="Enter full name"
            value={form.fullName}
            onChangeText={(v) => setField('fullName', v)}
            error={errors.fullName}
            autoCapitalize="words"
          />
          <Input
            label="Phone Number"
            placeholder="10-digit mobile number"
            value={form.phone}
            onChangeText={(v) => setField('phone', v)}
            error={errors.phone}
            keyboardType="phone-pad"
            maxLength={10}
          />
          <Input
            label="Address Line 1"
            placeholder="House no., Building, Street"
            value={form.addressLine1}
            onChangeText={(v) => setField('addressLine1', v)}
            error={errors.addressLine1}
          />
          <Input
            label="Address Line 2 (Optional)"
            placeholder="Area, Landmark"
            value={form.addressLine2}
            onChangeText={(v) => setField('addressLine2', v)}
          />
          <View style={styles.row}>
            <View style={styles.rowItem}>
              <Input
                label="City"
                placeholder="City"
                value={form.city}
                onChangeText={(v) => setField('city', v)}
                error={errors.city}
              />
            </View>
            <View style={styles.rowItem}>
              <Input
                label="State"
                placeholder="State"
                value={form.state}
                onChangeText={(v) => setField('state', v)}
                error={errors.state}
              />
            </View>
          </View>
          <Input
            label="Pincode"
            placeholder="6-digit pincode"
            value={form.pincode}
            onChangeText={(v) => setField('pincode', v)}
            error={errors.pincode}
            keyboardType="number-pad"
            maxLength={6}
          />

          <Text
            style={[styles.chipLabel, { color: theme.colors.text, fontFamily: FONTS.body.medium }]}
          >
            Address Type
          </Text>
          <View style={styles.chipRow}>
            {LABELS.map((l) => {
              const active = form.label === l.value;
              return (
                <TouchableOpacity
                  key={l.value}
                  onPress={() => setField('label', l.value)}
                  activeOpacity={0.85}
                  style={[
                    styles.chip,
                    {
                      borderColor: active ? COLORS.rose : theme.colors.border,
                      backgroundColor: active ? COLORS.roseLight : 'transparent',
                    },
                  ]}
                >
                  <Ionicons
                    name={l.icon}
                    size={14}
                    color={active ? COLORS.rose : theme.colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color: active ? COLORS.rose : theme.colors.textSecondary,
                        fontFamily: FONTS.body.semiBold,
                      },
                    ]}
                  >
                    {l.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            onPress={() => setField('isDefault', !form.isDefault)}
            style={styles.checkboxRow}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.checkbox,
                {
                  borderColor: form.isDefault ? theme.colors.primary : theme.colors.border,
                  backgroundColor: form.isDefault ? theme.colors.primary : 'transparent',
                },
              ]}
            >
              {form.isDefault && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
            </View>
            <Text
              style={[
                styles.checkboxLabel,
                { color: theme.colors.text, fontSize: theme.fontSizes.sm },
              ]}
            >
              Set as default address
            </Text>
          </TouchableOpacity>

          <View style={styles.formButtons}>
            <View style={styles.formButtonWrapper}>
              <Button variant="outline" fullWidth onPress={closeModal}>
                Cancel
              </Button>
            </View>
            <View style={styles.formButtonWrapper}>
              <Button fullWidth onPress={onSubmit} isLoading={isMutating}>
                {editingAddress ? 'Update' : 'Save'}
              </Button>
            </View>
          </View>
        </ScrollView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: { fontWeight: '700' },
  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32, gap: 12 },
  addressCard: { padding: 16 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, flexWrap: 'wrap' },
  name: { fontWeight: '600' },
  labelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  labelPillText: { fontSize: 10, fontFamily: FONTS.body.semiBold },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phone: { fontWeight: '400', marginBottom: 4 },
  addressLine: { fontWeight: '400', lineHeight: 22 },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: { fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  skeletonContainer: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },
  skeletonCard: { padding: 16, borderWidth: 1 },
  skeletonRow: { marginBottom: 12 },
  modalScroll: { maxHeight: 620 },
  mapSection: {
    marginBottom: 14,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  mapHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  mapHeaderText: { fontSize: 13, letterSpacing: 0.2 },
  row: { flexDirection: 'row', gap: 12 },
  rowItem: { flex: 1 },
  chipLabel: { fontSize: 13, marginBottom: 8, marginTop: 2 },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  chipText: { fontSize: 12 },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: { fontWeight: '500' },
  formButtons: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  formButtonWrapper: { flex: 1 },
});
