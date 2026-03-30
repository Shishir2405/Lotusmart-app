import React, { useState, useCallback } from 'react';
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
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTheme } from '../../../theme/ThemeContext';
import { Button, Card, Badge, Input, Modal } from '../../../components/ui';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useToast } from '../../../components/ui/Toast';
import {
  useAddresses,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
} from '../../auth/hooks';
import { addressSchema, AddressFormData } from '../../../utils/validators';
import { IAddress } from '../../../types';

export default function AddressesScreen() {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const { data: addressesResponse, isLoading } = useAddresses();
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  const deleteAddress = useDeleteAddress();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState<IAddress | null>(null);

  const addresses: IAddress[] = addressesResponse?.data ?? [];

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      pincode: '',
      isDefault: false,
    },
  });

  const openAddModal = useCallback(() => {
    setEditingAddress(null);
    reset({
      fullName: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      pincode: '',
      isDefault: false,
    });
    setModalVisible(true);
  }, [reset]);

  const openEditModal = useCallback(
    (address: IAddress) => {
      setEditingAddress(address);
      reset({
        fullName: address.fullName,
        phone: address.phone,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2 ?? '',
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        isDefault: address.isDefault ?? false,
      });
      setModalVisible(true);
    },
    [reset],
  );

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setEditingAddress(null);
  }, []);

  const onSubmit = useCallback(
    (data: AddressFormData) => {
      if (editingAddress?._id) {
        updateAddress.mutate(
          { id: editingAddress._id, data },
          {
            onSuccess: () => {
              showToast('success', 'Address updated successfully');
              closeModal();
            },
            onError: () => {
              showToast('error', 'Failed to update address');
            },
          },
        );
      } else {
        createAddress.mutate(data, {
          onSuccess: () => {
            showToast('success', 'Address added successfully');
            closeModal();
          },
          onError: () => {
            showToast('error', 'Failed to add address');
          },
        });
      }
    },
    [editingAddress, updateAddress, createAddress, showToast, closeModal],
  );

  const handleDelete = useCallback(
    (address: IAddress) => {
      Alert.alert(
        'Delete Address',
        `Are you sure you want to delete the address for "${address.fullName}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              if (address._id) {
                deleteAddress.mutate(address._id, {
                  onSuccess: () => {
                    showToast('success', 'Address deleted');
                  },
                  onError: () => {
                    showToast('error', 'Failed to delete address');
                  },
                });
              }
            },
          },
        ],
      );
    },
    [deleteAddress, showToast],
  );

  const renderLoadingSkeleton = () => (
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

  const renderAddressItem = ({ item }: { item: IAddress }) => (
    <Card style={styles.addressCard} elevation={1}>
      <View style={styles.addressCardHeader}>
        <View style={styles.addressNameRow}>
          <Text
            style={[
              styles.addressName,
              { color: theme.colors.text, fontSize: theme.fontSizes.base },
            ]}
          >
            {item.fullName}
          </Text>
          {item.isDefault && <Badge text="Default" variant="success" size="sm" />}
        </View>
        <View style={styles.addressActions}>
          <TouchableOpacity
            onPress={() => openEditModal(item)}
            style={[
              styles.actionButton,
              { backgroundColor: theme.colors.primary + '12' },
            ]}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            <Ionicons name="pencil-outline" size={16} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDelete(item)}
            style={[
              styles.actionButton,
              { backgroundColor: theme.colors.error + '12' },
            ]}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            <Ionicons name="trash-outline" size={16} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      <Text
        style={[
          styles.addressPhone,
          { color: theme.colors.textSecondary, fontSize: theme.fontSizes.sm },
        ]}
      >
        {item.phone}
      </Text>
      <Text
        style={[
          styles.addressLine,
          { color: theme.colors.text, fontSize: theme.fontSizes.sm },
        ]}
      >
        {item.addressLine1}
      </Text>
      {item.addressLine2 ? (
        <Text
          style={[
            styles.addressLine,
            { color: theme.colors.text, fontSize: theme.fontSizes.sm },
          ]}
        >
          {item.addressLine2}
        </Text>
      ) : null}
      <Text
        style={[
          styles.addressLine,
          { color: theme.colors.text, fontSize: theme.fontSizes.sm },
        ]}
      >
        {item.city}, {item.state} - {item.pincode}
      </Text>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View
        style={[
          styles.emptyIconContainer,
          { backgroundColor: theme.colors.secondary + '14' },
        ]}
      >
        <Ionicons
          name="location-outline"
          size={48}
          color={theme.colors.secondary}
        />
      </View>
      <Text
        style={[
          styles.emptyTitle,
          { color: theme.colors.text, fontSize: theme.fontSizes['2xl'] },
        ]}
      >
        No addresses saved
      </Text>
      <Text
        style={[
          styles.emptySubtitle,
          {
            color: theme.colors.textSecondary,
            fontSize: theme.fontSizes.sm,
          },
        ]}
      >
        Add a delivery address to get started
      </Text>
      <Button size="lg" onPress={openAddModal}>
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
      {/* Header */}
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
          <Button size="sm" variant="outline" onPress={openAddModal}>
            Add New
          </Button>
        )}
      </View>

      {isLoading ? (
        renderLoadingSkeleton()
      ) : addresses.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={addresses}
          renderItem={renderAddressItem}
          keyExtractor={(item) => item._id ?? item.phone}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add / Edit Modal */}
      <Modal
        visible={modalVisible}
        onClose={closeModal}
        title={editingAddress ? 'Edit Address' : 'Add New Address'}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Controller
            control={control}
            name="fullName"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Full Name"
                placeholder="Enter full name"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.fullName?.message}
                autoCapitalize="words"
              />
            )}
          />

          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Phone Number"
                placeholder="10-digit mobile number"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.phone?.message}
                keyboardType="phone-pad"
                maxLength={10}
              />
            )}
          />

          <Controller
            control={control}
            name="addressLine1"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Address Line 1"
                placeholder="House no., Building, Street"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.addressLine1?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="addressLine2"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Address Line 2 (Optional)"
                placeholder="Area, Landmark"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.addressLine2?.message}
              />
            )}
          />

          <View style={styles.formRow}>
            <View style={styles.formRowHalf}>
              <Controller
                control={control}
                name="city"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="City"
                    placeholder="City"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.city?.message}
                  />
                )}
              />
            </View>
            <View style={styles.formRowHalf}>
              <Controller
                control={control}
                name="state"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="State"
                    placeholder="State"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.state?.message}
                  />
                )}
              />
            </View>
          </View>

          <Controller
            control={control}
            name="pincode"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Pincode"
                placeholder="6-digit pincode"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.pincode?.message}
                keyboardType="number-pad"
                maxLength={6}
              />
            )}
          />

          <Controller
            control={control}
            name="isDefault"
            render={({ field: { onChange, value } }) => (
              <TouchableOpacity
                onPress={() => onChange(!value)}
                style={styles.checkboxRow}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: value
                        ? theme.colors.primary
                        : theme.colors.border,
                      backgroundColor: value
                        ? theme.colors.primary
                        : 'transparent',
                    },
                  ]}
                >
                  {value && (
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  )}
                </View>
                <Text
                  style={[
                    styles.checkboxLabel,
                    {
                      color: theme.colors.text,
                      fontSize: theme.fontSizes.sm,
                    },
                  ]}
                >
                  Set as default address
                </Text>
              </TouchableOpacity>
            )}
          />

          <View style={styles.formButtons}>
            <View style={styles.formButtonWrapper}>
              <Button variant="outline" fullWidth onPress={closeModal}>
                Cancel
              </Button>
            </View>
            <View style={styles.formButtonWrapper}>
              <Button
                fullWidth
                onPress={handleSubmit(onSubmit)}
                isLoading={isMutating}
              >
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
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 12,
  },
  addressCard: {
    padding: 16,
  },
  addressCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  addressNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  addressName: {
    fontWeight: '600',
  },
  addressActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressPhone: {
    fontWeight: '400',
    marginBottom: 4,
  },
  addressLine: {
    fontWeight: '400',
    lineHeight: 22,
  },
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
  emptyTitle: {
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  skeletonContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  skeletonCard: {
    padding: 16,
    borderWidth: 1,
  },
  skeletonRow: {
    marginBottom: 12,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formRowHalf: {
    flex: 1,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
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
  checkboxLabel: {
    fontWeight: '500',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  formButtonWrapper: {
    flex: 1,
  },
});
