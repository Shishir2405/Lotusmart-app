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
import MapView, { PROVIDER_GOOGLE, Region, MapPressEvent, UrlTile } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { FONTS } from '../../config/fonts';
import { COLORS, GOOGLE_PLACES_API_KEY } from '../../config/constants';
import {
  placeDetails,
  placesAutocomplete,
  reverseGeocode,
  type ParsedAddress,
  type PlacePrediction,
} from '../../services/location';
import { useLocationStore } from '../../store/location.store';

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
  const lastKnownAddress = useLocationStore((s) => s.lastKnownAddress);
  const setLastKnownAddress = useLocationStore((s) => s.setLastKnownAddress);

  // If the caller didn't already have a saved address (a fresh "add address"
  // form), fall back to whatever we cached from the app-launch GPS prefetch —
  // that's what lets the form autofill instantly instead of re-running GPS
  // and reprompting for permission every time this screen opens.
  const effectiveInitialValue = initialValue?.coordinates
    ? initialValue
    : (lastKnownAddress ?? initialValue);

  const mapRef = useRef<MapView | null>(null);
  const sessionTokenRef = useRef<string>(randomSessionToken());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const regionDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastResolvedRef = useRef<{ lat: number; lng: number } | null>(
    effectiveInitialValue?.coordinates ?? null,
  );
  const autoDetectedRef = useRef(false);
  const suppressRegionChangeRef = useRef(false);

  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [searching, setSearching] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(
    effectiveInitialValue?.coordinates ?? null,
  );
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(
    effectiveInitialValue?.formattedAddress ?? null,
  );
  const [useOSM, setUseOSM] = useState(false);

  const emit = useCallback(
    (value: LocationPickerValue) => {
      onChange(value);
      const assembled = [value.addressLine1, value.addressLine2, value.city]
        .filter(Boolean)
        .join(', ');
      const display = assembled || value.formattedAddress;
      if (display) setResolvedAddress(display);
      if (value.coordinates) {
        setCenter(value.coordinates);
        lastResolvedRef.current = value.coordinates;
      }
      setLastKnownAddress(value);
    },
    [onChange, setLastKnownAddress],
  );

  const animateTo = useCallback((lat: number, lng: number) => {
    suppressRegionChangeRef.current = true;
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
      if (regionDebounceRef.current) clearTimeout(regionDebounceRef.current);
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
    setError(null);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await placesAutocomplete(text, sessionTokenRef.current);
        setPredictions(results);
      } catch {
        // A real failure (bad API key, network, quota) — not just "no matches".
        // Surface it so search doesn't look like it's silently doing nothing.
        setPredictions([]);
        setError(
          "Address search isn't available right now. Drag the pin or use your current location instead.",
        );
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
    void runGps();
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
        accuracy: Location.Accuracy.BestForNavigation,
        mayShowUserSettingsDialog: true,
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

  const onRegionChangeComplete = useCallback(
    (region: Region) => {
      if (suppressRegionChangeRef.current) {
        suppressRegionChangeRef.current = false;
        setCenter({ lat: region.latitude, lng: region.longitude });
        return;
      }
      const lat = region.latitude;
      const lng = region.longitude;
      setCenter({ lat, lng });
      const last = lastResolvedRef.current;
      if (last && Math.abs(last.lat - lat) < 1e-5 && Math.abs(last.lng - lng) < 1e-5) {
        return;
      }
      if (regionDebounceRef.current) clearTimeout(regionDebounceRef.current);
      regionDebounceRef.current = setTimeout(() => {
        void resolveAndEmit(lat, lng);
      }, 350);
    },
    [resolveAndEmit],
  );

  // Zomato-style: auto-detect on first mount when no initial value. If the
  // app-launch prefetch already cached an address, emit that immediately
  // instead — it fills the form's text inputs without another GPS round trip
  // or permission prompt.
  useEffect(() => {
    if (autoDetectedRef.current) return;
    if (initialValue?.coordinates) return;
    autoDetectedRef.current = true;
    if (lastKnownAddress?.coordinates) {
      emit(lastKnownAddress);
      if (lastKnownAddress.formattedAddress) setQuery(lastKnownAddress.formattedAddress);
      return;
    }
    void requestGps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initialRegion: Region = useMemo(() => {
    if (effectiveInitialValue?.coordinates) {
      return {
        latitude: effectiveInitialValue.coordinates.lat,
        longitude: effectiveInitialValue.coordinates.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }
    return DEFAULT_REGION;
  }, [effectiveInitialValue?.coordinates]);

  const mapsReady = Boolean(GOOGLE_PLACES_API_KEY);

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
          onRegionChangeComplete={onRegionChangeComplete}
          showsUserLocation
          showsMyLocationButton={false}
          toolbarEnabled={false}
        />

        {/* Center pin overlay — stays locked to viewport center, Zomato-style */}
        <View pointerEvents="none" style={styles.centerPinWrap}>
          <View style={[styles.centerPinBubble, { backgroundColor: COLORS.rose }]}>
            <Ionicons name="location" size={18} color="#fff" />
          </View>
          <View style={[styles.centerPinStem, { backgroundColor: COLORS.rose }]} />
          <View style={styles.centerPinShadow} />
        </View>

        {resolving && (
          <View style={styles.mapOverlay}>
            <ActivityIndicator size="small" color={COLORS.rose} />
            <Text style={[styles.overlayText, { fontFamily: FONTS.body.medium }]}>
              Locating address...
            </Text>
          </View>
        )}
      </View>

      <View style={styles.hintRow}>
        <Ionicons name="move-outline" size={13} color={theme.colors.textSecondary} />
        <Text
          style={[
            styles.hintText,
            { color: theme.colors.textSecondary, fontFamily: FONTS.body.regular },
          ]}
        >
          Move the map to position the pin on your exact doorstep.
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
    height: 320,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    backgroundColor: '#EEE',
    position: 'relative',
  },
  centerPinWrap: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -18,
    marginTop: -42,
    alignItems: 'center',
    width: 36,
  },
  centerPinBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  centerPinStem: {
    width: 2,
    height: 8,
    marginTop: -1,
  },
  centerPinShadow: {
    width: 12,
    height: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.18)',
    marginTop: 1,
  },
  locateChip: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 4,
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
