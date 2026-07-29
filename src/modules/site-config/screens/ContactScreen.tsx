import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeContext';
import { FONTS } from '../../../config/fonts';
import { COLORS } from '../../../config/constants';
import { useContactInfo } from '../hooks';

interface ActionRow {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onPress: () => void;
  bgColor: string;
  color: string;
}

export default function ContactScreen() {
  const { theme } = useTheme();
  const { data, isLoading, isRefetching, refetch } = useContactInfo();
  const contact = data?.data?.value ?? null;

  const actions = useMemo<ActionRow[]>(() => {
    if (!contact) return [];
    const rows: ActionRow[] = [];
    if (contact.phone) {
      rows.push({
        icon: 'call-outline',
        label: 'Call us',
        value: contact.phone,
        bgColor: COLORS.roseLight,
        color: COLORS.rose,
        onPress: () => Linking.openURL(`tel:${contact.phone?.replace(/[^\d+]/g, '')}`),
      });
    }
    if (contact.whatsapp) {
      const digits = contact.whatsapp.replace(/[^\d]/g, '');
      rows.push({
        icon: 'logo-whatsapp',
        label: 'WhatsApp',
        value: contact.whatsapp,
        bgColor: '#DCFCE7',
        color: '#16A34A',
        onPress: () => Linking.openURL(`https://wa.me/${digits}`),
      });
    }
    if (contact.email) {
      rows.push({
        icon: 'mail-outline',
        label: 'Email us',
        value: contact.email,
        bgColor: COLORS.goldLight,
        color: COLORS.gold,
        onPress: () => Linking.openURL(`mailto:${contact.email}`),
      });
    }
    if (contact.address) {
      rows.push({
        icon: 'location-outline',
        label: 'Our address',
        value: contact.address,
        bgColor: COLORS.oliveLight,
        color: COLORS.olive,
        onPress: () =>
          Linking.openURL(
            `https://www.google.com/maps/search/${encodeURIComponent(contact.address ?? '')}`,
          ),
      });
    }
    return rows;
  }, [contact]);

  const socials = useMemo(() => {
    const links = contact?.socialLinks ?? {};
    const out: { key: string; icon: keyof typeof Ionicons.glyphMap; url: string }[] = [];

    const isValid = (url: string | undefined) => url && url.trim() !== '' && url !== '#';

    if (isValid(links.instagram))
      out.push({ key: 'instagram', icon: 'logo-instagram', url: links.instagram! });
    if (isValid(links.facebook))
      out.push({ key: 'facebook', icon: 'logo-facebook', url: links.facebook! });
    if (isValid(links.twitter))
      out.push({ key: 'twitter', icon: 'logo-twitter', url: links.twitter! });
    if (isValid(links.youtube))
      out.push({ key: 'youtube', icon: 'logo-youtube', url: links.youtube! });
    if (isValid(links.whatsapp))
      out.push({ key: 'whatsapp', icon: 'logo-whatsapp', url: links.whatsapp! });
    return out;
  }, [contact?.socialLinks]);

  if (isLoading && !contact) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.colors.background, flex: 1, justifyContent: 'center' },
        ]}
      >
        <ActivityIndicator color={COLORS.rose} />
      </View>
    );
  }

  const hasAnything = actions.length > 0 || socials.length > 0 || contact?.businessHours;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.rose} />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { backgroundColor: '#FFF8F0' }]}>
        <Text
          style={[styles.headerTitle, { color: theme.colors.text, fontFamily: FONTS.heading.bold }]}
        >
          Get in touch
        </Text>
        <Text
          style={[
            styles.headerSubtitle,
            { color: theme.colors.textSecondary, fontFamily: FONTS.body.regular },
          ]}
        >
          We&apos;d love to hear from you. Pick the channel that works best.
        </Text>
      </View>

      <View style={styles.content}>
        {!hasAnything ? (
          <View
            style={[
              styles.stateCard,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <Ionicons name="cloud-offline-outline" size={36} color={theme.colors.textSecondary} />
            <Text
              style={[styles.stateTitle, { color: theme.colors.text, fontFamily: FONTS.body.bold }]}
            >
              Contact info isn&apos;t available
            </Text>
            <Text
              style={[
                styles.stateBody,
                { color: theme.colors.textSecondary, fontFamily: FONTS.body.regular },
              ]}
            >
              Please check your connection and try again.
            </Text>
            <TouchableOpacity
              onPress={() => refetch()}
              style={[styles.retryBtn, { backgroundColor: COLORS.rose }]}
              activeOpacity={0.85}
            >
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {actions.map((row) => (
              <TouchableOpacity
                key={row.label}
                onPress={row.onPress}
                activeOpacity={0.85}
                style={[
                  styles.row,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                ]}
              >
                <View style={[styles.rowIcon, { backgroundColor: row.bgColor }]}>
                  <Ionicons name={row.icon} size={20} color={row.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.rowLabel,
                      { color: theme.colors.textSecondary, fontFamily: FONTS.body.medium },
                    ]}
                  >
                    {row.label}
                  </Text>
                  <Text
                    style={[
                      styles.rowValue,
                      { color: theme.colors.text, fontFamily: FONTS.body.semiBold },
                    ]}
                  >
                    {row.value}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            ))}

            {contact?.businessHours ? (
              <View
                style={[
                  styles.hoursCard,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                ]}
              >
                <View style={styles.hoursHead}>
                  <Ionicons name="time-outline" size={16} color={COLORS.gold} />
                  <Text
                    style={[
                      styles.hoursTitle,
                      { color: theme.colors.text, fontFamily: FONTS.body.bold },
                    ]}
                  >
                    Business hours
                  </Text>
                </View>
                <Text
                  style={[
                    styles.hoursText,
                    { color: theme.colors.textSecondary, fontFamily: FONTS.body.regular },
                  ]}
                >
                  {contact.businessHours}
                </Text>
              </View>
            ) : null}

            {socials.length > 0 ? (
              <View style={styles.socialBlock}>
                <Text
                  style={[
                    styles.socialHeading,
                    { color: theme.colors.textSecondary, fontFamily: FONTS.body.semiBold },
                  ]}
                >
                  Follow us
                </Text>
                <View style={styles.socialRow}>
                  {socials.map((s) => (
                    <TouchableOpacity
                      key={s.key}
                      onPress={() => Linking.openURL(s.url)}
                      style={[
                        styles.socialPill,
                        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                      ]}
                      activeOpacity={0.85}
                    >
                      <Ionicons name={s.icon} size={18} color={COLORS.rose} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : null}
          </>
        )}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingVertical: 24 },
  headerTitle: { fontSize: 24, marginBottom: 4 },
  headerSubtitle: { fontSize: 13, lineHeight: 19 },
  content: { padding: 16, gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase' },
  rowValue: { fontSize: 14, marginTop: 2 },
  hoursCard: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 6, marginTop: 4 },
  hoursHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hoursTitle: { fontSize: 13 },
  hoursText: { fontSize: 13, lineHeight: 19 },
  socialBlock: { marginTop: 16, alignItems: 'center' },
  socialHeading: { fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
  socialRow: { flexDirection: 'row', gap: 10 },
  socialPill: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateCard: {
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 16,
    padding: 26,
  },
  stateTitle: { fontSize: 15, textAlign: 'center' },
  stateBody: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
  retryBtn: {
    marginTop: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontFamily: FONTS.body.semiBold,
    fontSize: 13,
    letterSpacing: 0.2,
  },
});
