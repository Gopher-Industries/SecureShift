// Guard Tour / Patrol Checkpoint screen (GA-034).
// Shows the checkpoints for a shift, tracks progress, and lets the guard scan
// each checkpoint's QR code — verified against GPS proximity — with offline
// support (scans queue and sync automatically).
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { usePatrolTour, type ScanOutcome } from '../hooks/usePatrolTour';
import { formatDistance } from '../lib/geo';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAppTheme } from '../theme';

import type { AppColors } from '../theme/colors';

type Nav = NativeStackNavigationProp<RootStackParamList, 'PatrolTour'>;
type PatrolRoute = RouteProp<RootStackParamList, 'PatrolTour'>;

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default function PatrolTourScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<PatrolRoute>();
  const { colors } = useAppTheme();
  const s = getStyles(colors);
  const { t } = useTranslation();

  // Cache the full shift from first entry; later navigations (from the scanner)
  // only carry the id, so we don't want to clobber the display data.
  const [shift] = useState(route.params.shift);
  const shiftId: string = shift?._id ?? route.params.shift?._id;

  const {
    loading,
    error,
    checkpoints,
    progress,
    completedCount,
    total,
    isComplete,
    pendingCount,
    isConnected,
    recordScan,
    reload,
  } = usePatrolTour(shiftId);

  const [busy, setBusy] = useState(false);
  const lastNonce = useRef<number | undefined>(undefined);

  const showOutcome = useCallback(
    (outcome: ScanOutcome) => {
      switch (outcome.status) {
        case 'success':
          if (outcome.offline) {
            Alert.alert(
              t('patrol.offlineSaved'),
              t('patrol.offlineSavedBody', { name: outcome.checkpoint.name }),
            );
          } else {
            Alert.alert(
              t('patrol.successTitle'),
              t('patrol.successBody', { name: outcome.checkpoint.name }),
            );
          }
          break;
        case 'unknown-code':
          Alert.alert(t('patrol.unknownTitle'), t('patrol.unknownBody'));
          break;
        case 'already-done':
          Alert.alert(
            t('patrol.alreadyTitle'),
            t('patrol.alreadyBody', { name: outcome.checkpoint.name }),
          );
          break;
        case 'too-far':
          Alert.alert(
            t('patrol.tooFarTitle'),
            t('patrol.tooFarBody', {
              distance: formatDistance(outcome.distanceMeters),
              name: outcome.checkpoint.name,
            }),
          );
          break;
        case 'location-error':
          Alert.alert(t('patrol.locationErrorTitle'), outcome.message);
          break;
        case 'server-error':
          Alert.alert(t('patrol.serverErrorTitle'), outcome.message);
          break;
      }
    },
    [t],
  );

  // Process a code handed back by the QR scanner (guarded by a nonce so it runs
  // exactly once per scan).
  useEffect(() => {
    const { scannedCode, scanNonce } = route.params;
    if (!scannedCode || !scanNonce || scanNonce === lastNonce.current) return;
    lastNonce.current = scanNonce;

    (async () => {
      setBusy(true);
      try {
        const outcome = await recordScan(scannedCode);
        showOutcome(outcome);
      } finally {
        setBusy(false);
        navigation.setParams({ scannedCode: undefined, scanNonce: undefined });
      }
    })();
  }, [route.params, recordScan, showOutcome, navigation]);

  const openScanner = () => {
    navigation.navigate('QRScanner', { returnTo: 'PatrolTour', shiftId });
  };

  const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} />}
    >
      <Text style={s.shiftTitle}>{shift?.title ?? t('patrol.title')}</Text>

      {/* Progress summary */}
      <View style={s.card}>
        <View style={s.progressRow}>
          <Text style={s.progressText}>
            {t('patrol.progress', { done: completedCount, total })}
          </Text>
          <Text style={s.progressPct}>{pct}%</Text>
        </View>
        <View style={s.track}>
          <View style={[s.fill, { width: `${pct}%` }]} />
        </View>
        {!isConnected ? <Text style={s.offlineHint}>{t('net.offline')}</Text> : null}
        {pendingCount > 0 ? (
          <Text style={s.pendingHint}>{t('patrol.pending', { count: pendingCount })}</Text>
        ) : null}
      </View>

      {isComplete ? (
        <View style={s.completeBanner}>
          <Text style={s.completeTitle}>✅ {t('patrol.complete')}</Text>
          <Text style={s.completeBody}>{t('patrol.completeBody')}</Text>
        </View>
      ) : null}

      {error ? <Text style={s.error}>{error}</Text> : null}

      {!loading && checkpoints.length === 0 && !error ? (
        <Text style={s.empty}>{t('patrol.empty')}</Text>
      ) : null}

      {/* Checkpoint list */}
      {checkpoints.map((cp) => {
        const done = progress[cp.id];
        return (
          <View key={cp.id} style={[s.cpRow, done ? s.cpRowDone : null]}>
            <View style={[s.badge, done ? s.badgeDone : s.badgePending]}>
              <Text style={s.badgeText}>{done ? '✓' : cp.order}</Text>
            </View>
            <View style={s.cpInfo}>
              <Text style={s.cpName}>{cp.name}</Text>
              <Text style={s.cpStatus}>
                {done
                  ? t('patrol.scannedAt', { time: formatTime(done.scannedAt) })
                  : t('patrol.notStarted')}
              </Text>
            </View>
          </View>
        );
      })}

      <TouchableOpacity
        style={[s.scanBtn, busy ? s.scanBtnDisabled : null]}
        onPress={openScanner}
        disabled={busy}
      >
        <Text style={s.scanBtnText}>{busy ? '…' : t('patrol.scanButton')}</Text>
      </TouchableOpacity>
      <Text style={s.cta}>{t('patrol.scanCta')}</Text>
    </ScrollView>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    root: { backgroundColor: colors.bg, flex: 1 },
    content: { padding: 16, paddingBottom: 40 },
    shiftTitle: { color: colors.text, fontSize: 20, fontWeight: '700', marginBottom: 12 },
    card: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: 16,
      padding: 16,
    },
    progressRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    progressText: { color: colors.text, fontSize: 16, fontWeight: '600' },
    progressPct: { color: colors.primary, fontSize: 16, fontWeight: '700' },
    track: {
      backgroundColor: colors.border,
      borderRadius: 6,
      height: 10,
      overflow: 'hidden',
      width: '100%',
    },
    fill: { backgroundColor: colors.status.confirmed, borderRadius: 6, height: 10 },
    offlineHint: { color: colors.status.rejected, fontSize: 13, marginTop: 8 },
    pendingHint: { color: colors.status.pending, fontSize: 13, marginTop: 6 },
    completeBanner: {
      backgroundColor: colors.greenSoft,
      borderColor: colors.rowHighlightBorder,
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: 16,
      padding: 16,
    },
    completeTitle: { color: colors.status.confirmed, fontSize: 16, fontWeight: '700' },
    completeBody: { color: colors.text, fontSize: 14, marginTop: 4 },
    error: { color: colors.status.rejected, fontSize: 14, marginBottom: 12 },
    empty: { color: colors.muted, fontSize: 14, marginBottom: 12 },
    cpRow: {
      alignItems: 'center',
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 12,
      borderWidth: 1,
      flexDirection: 'row',
      marginBottom: 10,
      padding: 14,
    },
    cpRowDone: { backgroundColor: colors.rowHighlight, borderColor: colors.rowHighlightBorder },
    badge: {
      alignItems: 'center',
      borderRadius: 16,
      height: 32,
      justifyContent: 'center',
      marginRight: 12,
      width: 32,
    },
    badgeDone: { backgroundColor: colors.status.confirmed },
    badgePending: { backgroundColor: colors.muted },
    badgeText: { color: colors.white, fontSize: 15, fontWeight: '700' },
    cpInfo: { flex: 1 },
    cpName: { color: colors.text, fontSize: 16, fontWeight: '600' },
    cpStatus: { color: colors.muted, fontSize: 13, marginTop: 2 },
    scanBtn: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 12,
      marginTop: 8,
      paddingVertical: 16,
    },
    scanBtnDisabled: { opacity: 0.6 },
    scanBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
    cta: { color: colors.muted, fontSize: 13, marginTop: 8, textAlign: 'center' },
  });
