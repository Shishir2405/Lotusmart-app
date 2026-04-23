import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Linking,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region, MapPressEvent } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { FONTS } from '../../config/fonts';
import { COLORS, GOOGLE_MAPS_API_KEY } from '../../config/constants';
import {
  placeDetails,
  placesAutocomplete,
  reverseGeocode,
  type ParsedAddress,
  type PlacePrediction,
} from '../../services/location';
import { PermissionModal } from '../ui/PermissionModal';

export type LocationPickerValue = ParsedAddress;

interface Props {
  initialValue?: LocationPickerValue;
  onChange: (value: LocationPickerValue) => void;
}

const DEFAULT_REGION: Region = {
  latitude: 22.7196,
  longitude: 75.8577,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

function randomSessionToken() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function LocationPicker({ initialValue, onChange }: Props) {
  const { theme } = useTheme();
  const mapRef = useRef<MapView | null>(null);
  const sessionTokenRef = useRef<string>(randomSessionToken());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [searching, setSearching] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);
  const [permissionModal, setPermissionModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(
    initialValue?.coordinates ?? null,
  );
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(
    initialValue?.formattedAddress ?? null,
  );

  const emit = useCallback(
    (value: LocationPickerValue) => {
      onChange(value);
      if (value.formattedAddress) setResolvedAddress(value.formattedAddress);
      if (value.coordinates) setMarker(value.coordinates);
    },
    [onChange],
  );

  const animateTo = useCallback((lat: number, lng: number) => {
    mapRef.current?.animateToRegion(
      { latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 },
      400,
    );
  }, []);

  const resolveAndEmit = useCallback(
    async (lat: number, lng: number) => {
      setResolving(true);
      setError(null);
      try {
        const parsed = await reverseGeocode(lat, lng);
        emit(parsed);
      } catch {
        setError("Couldn't read the address for that pin. Please type it manually.");
        emit({ coordinates: { lat, lng } });
      } finally {
        setResolving(false);
      }
    },
    [emit],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const onQueryChange = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!text.trim()) {
      setPredictions([]);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await placesAutocomplete(text, sessionTokenRef.current);
        setPredictions(results);
      } finally {
        setSearching(false);
      }
    }, 280);
  };

  const onPickPrediction = async (p: PlacePrediction) => {
    setQuery(p.description);
    setPredictions([]);
    setResolving(true);
    setError(null);
    try {
      const details = await placeDetails(p.placeId, sessionTokenRef.current);
      sessionTokenRef.current = randomSessionToken();
      if (!details?.coordinates) {
        setError('Could not load that place. Try another.');
        return;
      }
      emit(details);
      animateTo(details.coordinates.lat, details.coordinates.lng);
    } finally {
      setResolving(false);
    }
  };

  const requestGps = async () => {
    setError(null);
    const { status: current } = await Location.getForegroundPermissionsAsync();

    if (current === 'granted') {
      void runGps();
      return;
    }
    // Pre-prompt with our own modal before the OS dialog.
    setPermissionModal(true);
  };

  const runGps = useCallback(async () => {
    setDetectingGps(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError(
          'Location permission was denied. You can enable it in Settings or enter the address manually.',
        );
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = position.coords;
      animateTo(latitude, longitude);
      await resolveAndEmit(latitude, longitude);
    } catch {
      setError("Couldn't get your location. Try dropping a pin on the map instead.");
    } finally {
      setDetectingGps(false);
    }
  }, [animateTo, resolveAndEmit]);

  const onMapPress = (e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    animateTo(latitude, longitude);
    void resolveAndEmit(latitude, longitude);
  };

  const initialRegion: Region = useMemo(() => {
    if (initialValue?.coordinates) {
      return {
        latitude: initialValue.coordinates.lat,
        longitude: initialValue.coordinates.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }
    return DEFAULT_REGION;
  }, [initialValue?.coordinates]);

  const mapsReady = Boolean(GOOGLE_MAPS_API_KEY);

  return (
    <View style={styles.wrap}>
      {mapsReady ? (
        <View style={styles.searchWrap}>
          <View
            style={[
              styles.searchBox,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Ionicons name="search" size={16} color={theme.colors.textSecondary} />
            <TextInput
              value={query}
              onChangeText={onQueryChange}
              placeholder="Search address, landmark, pincode"
              placeholderTextColor={theme.colors.textSecondary}
              style={[
                styles.searchInput,
                { color: theme.colors.text, fontFamily: FONTS.body.regular },
              ]}
              returnKeyType="search"
              autoCorrect={false}
            />
            {searching && <ActivityIndicator size="small" color={COLORS.rose} />}
          </View>

          {predictions.length > 0 && (
            <View
              style={[
                styles.predictions,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
            >
              <FlatList
                data={predictions}
                keyboardShouldPersistTaps="handled"
                keyExtractor={(item) => item.placeId}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.predictionRow, { borderBottomColor: theme.colors.border }]}
                    onPress={() => onPickPrediction(item)}
                  >
                    <Ionicons
                      name="location-outline"
                      size={16}
                      color={theme.colors.textSecondary}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.predictionMain,
                          { color: theme.colors.text, fontFamily: FONTS.body.semiBold },
                        ]}
                        numberOfLines={1}
                      >
                        {item.mainText}
                      </Text>
                      {item.secondaryText ? (
                        <Text
                          style={[
                            styles.predictionSecondary,
                            {
                              color: theme.colors.textSecondary,
                              fontFamily: FONTS.body.regular,
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {item.secondaryText}
                        </Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </View>
      ) : (
        <View style={[styles.warnBox, { backgroundColor: '#FFF7E6' }]}>
          <Text style={[styles.warnText, { fontFamily: FONTS.body.regular }]}>
            Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY to enable map search and autocomplete.
          </Text>
        </View>
      )}

      <TouchableOpacity
        onPress={requestGps}
        disabled={detectingGps}
        activeOpacity={0.85}
        style={[
          styles.gpsBtn,
          {
            backgroundColor: COLORS.roseLight,
            borderColor: COLORS.rose + '50',
          },
        ]}
      >
        {detectingGps ? (
          <ActivityIndicator size="small" color={COLORS.rose} />
        ) : (
          <Ionicons name="locate" size={16} color={COLORS.rose} />
        )}
        <Text style={[styles.gpsBtnText, { fontFamily: FONTS.body.semiBold }]}>
          {detectingGps ? 'Detecting...' : 'Use my current location'}
        </Text>
      </TouchableOpacity>

      <View style={[styles.mapWrap, { borderColor: theme.colors.border }]}>
        <MapView
          ref={mapRef}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          style={StyleSheet.absoluteFillObject}
          initialRegion={initialRegion}
          onPress={onMapPress}
          showsUserLocation={false}
          showsMyLocationButton={false}
          toolbarEnabled={false}
        >
          {marker && (
            <Marker
              coordinate={{ latitude: marker.lat, longitude: marker.lng }}
              draggable
              onDragEnd={(e) => {
                const { latitude, longitude } = e.nativeEvent.coordinate;
                void resolveAndEmit(latitude, longitude);
              }}
              pinColor={COLORS.rose}
            />
          )}
        </MapView>
        {resolving && (
          <View style={styles.mapOverlay}>
            <ActivityIndicator size="small" color={COLORS.rose} />
            <Text style={[styles.overlayText, { fontFamily: FONTS.body.medium }]}>
              Resolving address...
            </Text>
          </View>
        )}
      </View>

      <View style={styles.hintRow}>
        <Ionicons name="information-circle-outline" size={13} color={theme.colors.textSecondary} />
        <Text
          style={[
            styles.hintText,
            { color: theme.colors.textSecondary, fontFamily: FONTS.body.regular },
          ]}
        >
          Tap the map or drag the pin to fine-tune.
        </Text>
      </View>

      {resolvedAddress && !error ? (
        <View style={[styles.resolvedBox, { backgroundColor: COLORS.oliveLight }]}>
          <Ionicons name="checkmark-circle" size={14} color={COLORS.olive} />
          <Text
            style={[
              styles.resolvedText,
              { color: COLORS.oliveDark, fontFamily: FONTS.body.medium },
            ]}
            numberOfLines={2}
          >
            {resolvedAddress}
          </Text>
        </View>
      ) : null}

      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="warning-outline" size={13} color={COLORS.warning} />
          <Text style={[styles.errorText, { fontFamily: FONTS.body.regular }]}>{error}</Text>
        </View>
      ) : null}

      <PermissionModal
        visible={permissionModal}
        icon="locate-outline"
        iconColor={COLORS.rose}
        iconBackground={COLORS.roseLight}
        title="Share your location?"
        description="We use your location only to auto-fill your delivery address so checkout is faster. You can skip this and type it manually."
        allowLabel="Use location"
        denyLabel="Not now"
        onAllow={() => {
          setPermissionModal(false);
          void runGps();
        }}
        onDeny={() => setPermissionModal(false)}
      />

      {error?.includes('Settings') ? (
        <TouchableOpacity onPress={() => Linking.openSettings()} style={styles.settingsLink}>
          <Text style={[styles.settingsLinkText, { fontFamily: FONTS.body.semiBold }]}>
            Open Settings
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export default LocationPicker;

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  searchWrap: { position: 'relative', zIndex: 30 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 8 },
  predictions: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: 12,
    maxHeight: 220,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  predictionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  predictionMain: { fontSize: 13 },
  predictionSecondary: { fontSize: 11, marginTop: 1 },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 44,
  },
  gpsBtnText: { fontSize: 13, color: COLORS.rose, letterSpacing: 0.2 },
  mapWrap: {
    height: 220,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    backgroundColor: '#EEE',
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10,
    paddingVertical: 8,
  },
  overlayText: { fontSize: 12, color: COLORS.textPrimary },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  hintText: { fontSize: 11 },
  resolvedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 10,
  },
  resolvedText: { flex: 1, fontSize: 12 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  errorText: { color: COLORS.warning, fontSize: 12, flex: 1 },
  warnBox: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  warnText: { color: '#8A5E00', fontSize: 12 },
  settingsLink: { alignSelf: 'flex-start' },
  settingsLinkText: { fontSize: 12, color: COLORS.rose, textDecorationLine: 'underline' },
});
