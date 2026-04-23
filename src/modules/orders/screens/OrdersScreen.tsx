import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../theme/ThemeContext';
import { Skeleton, Button } from '../../../components/ui';
import { OrderCard } from '../components/OrderCard';
import { useOrders } from '../hooks';
import { useLoadingCap } from '../../../hooks/useLoadingCap';
import type { IOrder } from '../../../types';

export default function OrdersScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch, isFetching } = useOrders(page);

  const orders = (data?.data as IOrder[] | undefined) ?? [];
  const pagination = data?.pagination;
  const showSkeleton = useLoadingCap(isLoading && orders.length === 0);
  const hasNextPage = pagination ? pagination.page < pagination.totalPages : false;

  const handleRefresh = useCallback(() => {
    setPage(1);
    refetch();
  }, [refetch]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetching) {
      setPage((prev) => prev + 1);
    }
  }, [hasNextPage, isFetching]);

  const handleOrderPress = useCallback(
    (orderId: string) => {
      navigation.navigate('OrderDetail', { orderId });
    },
    [navigation],
  );

  const handleStartShopping = useCallback(() => {
    navigation.navigate('HomeTab');
  }, [navigation]);

  const renderItem = useCallback(
    ({ item }: { item: IOrder }) => (
      <OrderCard order={item} onPress={() => handleOrderPress(item._id)} />
    ),
    [handleOrderPress],
  );

  const keyExtractor = useCallback((item: IOrder) => item._id, []);

  const styles = getStyles(theme);

  if (showSkeleton) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>My Orders</Text>
        <View style={styles.skeletonContainer}>
          {[1, 2, 3, 4].map((i) => (
            <View
              key={i}
              style={[
                styles.skeletonCard,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
            >
              <View style={styles.skeletonRow}>
                <Skeleton width={140} height={18} />
                <Skeleton width={80} height={24} borderRadius={12} />
              </View>
              <Skeleton width="60%" height={14} style={{ marginTop: 12 }} />
              <View style={[styles.skeletonDivider, { backgroundColor: theme.colors.border }]} />
              <View style={styles.skeletonRow}>
                <Skeleton width={100} height={14} />
                <Skeleton width={80} height={16} />
              </View>
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  if (!orders.length) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>My Orders</Text>
        <View style={styles.emptyContainer}>
          <View
            style={[styles.illustrationCircle, { backgroundColor: theme.colors.primary + '12' }]}
          >
            <Text style={styles.illustrationIcon}>📦</Text>
          </View>
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No orders yet</Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
            Looks like you haven&apos;t placed any orders. Start exploring our collection!
          </Text>
          <Button onPress={handleStartShopping} size="lg" style={{ marginTop: 24 }}>
            Start Shopping
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.headerTitle, { color: theme.colors.text }]}>My Orders</Text>
      <FlatList
        data={orders}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
      />
    </SafeAreaView>
  );
}

function getStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    headerTitle: {
      fontSize: theme.fontSizes['2xl'],
      fontWeight: '700',
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
    },
    listContent: {
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing['3xl'],
    },
    skeletonContainer: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.sm,
    },
    skeletonCard: {
      borderWidth: 1,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
    },
    skeletonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    skeletonDivider: {
      height: StyleSheet.hairlineWidth,
      marginVertical: theme.spacing.md,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing['3xl'],
    },
    illustrationCircle: {
      width: 96,
      height: 96,
      borderRadius: 48,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.xl,
    },
    illustrationIcon: {
      fontSize: 40,
    },
    emptyTitle: {
      fontSize: theme.fontSizes.xl,
      fontWeight: '700',
      marginBottom: theme.spacing.sm,
    },
    emptySubtitle: {
      fontSize: theme.fontSizes.sm,
      textAlign: 'center',
      lineHeight: 22,
    },
  });
}
