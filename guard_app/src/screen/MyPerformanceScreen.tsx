/* eslint-disable react-native/no-inline-styles */

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { getGuardScore, type GuardScoreBreakdown } from '../api/guardScore';
import { getUserProfile } from '../api/profile';
import EmptyState from '../components/EmptyState';
import LoadingState from '../components/LoadingState';
import { useAppTheme } from '../theme';
import { MOCK_STREAKS, MOCK_TREND } from '../utils/performanceMock';

import type { AppColors } from '../theme/colors';

const TOTAL_POINTS = 100;

function formatPoints(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

type ScoreRowProps = {
  title: string;
  detail: string;
  score: number;
  maxPoints: number;
  colors: AppColors;
};

function ScoreRow({ title, detail, score, maxPoints, colors }: ScoreRowProps) {
  const s = getStyles(colors);
  const filled = maxPoints > 0 ? Math.round((score / maxPoints) * 100) : 0;

  return (
    <View style={s.scoreRow}>
      <View style={s.scoreRowHead}>
        <Text style={s.rowTitle}>{title}</Text>
        <Text style={s.rowPoints}>
          {formatPoints(score)} / {maxPoints}
        </Text>
      </View>

      <View style={s.barTrack}>
        <View style={[s.barFill, { width: `${filled}%` }]} />
      </View>

      <Text style={s.rowDetail}>{detail}</Text>
    </View>
  );
}

export default function MyPerformanceScreen() {
  const { colors } = useAppTheme();
  const s = getStyles(colors);
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [breakdown, setBreakdown] = useState<GuardScoreBreakdown | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);

      const profile = await getUserProfile();
      const result = await getGuardScore(profile?._id ?? '');

      setScore(result.score);
      setBreakdown(result.breakdown ?? null);
    } catch (e: unknown) {
      setScore(null);
      setBreakdown(null);
      setError(e instanceof Error ? e.message : t('performance.error'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
  };

  const onRetry = async () => {
    setLoading(true);
    await load();
  };

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <View style={s.center}>
        <Text style={s.errorTitle}>{t('performance.error')}</Text>
        <Text style={s.errorText}>{error}</Text>
        <TouchableOpacity style={s.retryBtn} onPress={onRetry}>
          <Text style={s.retryText}>{t('performance.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {score == null || !breakdown ? (
        <EmptyState
          icon="stats-chart-outline"
          title={t('performance.empty')}
          message={t('performance.emptyMessage')}
        />
      ) : (
        <>
          <View style={s.scoreCard}>
            <Text style={s.scoreLabel}>{t('performance.scoreLabel')}</Text>
            <Text style={s.scoreValue}>{score}</Text>
            <Text style={s.scoreOutOf}>{t('performance.outOf', { total: TOTAL_POINTS })}</Text>
          </View>

          <Text style={s.sectionTitle}>{t('performance.breakdown')}</Text>

          <View style={s.card}>
            <ScoreRow
              title={t('performance.punctuality')}
              detail={t('performance.punctualityDetail', {
                onTime: breakdown.punctuality.onTimeCheckins,
                total: breakdown.punctuality.totalCheckins,
              })}
              score={breakdown.punctuality.score}
              maxPoints={breakdown.punctuality.maxPoints}
              colors={colors}
            />

            <ScoreRow
              title={t('performance.shiftCompletion')}
              detail={t('performance.shiftCompletionDetail', {
                completed: breakdown.shiftCompletion.completedShifts,
                total: breakdown.shiftCompletion.totalAssignedShifts,
              })}
              score={breakdown.shiftCompletion.score}
              maxPoints={breakdown.shiftCompletion.maxPoints}
              colors={colors}
            />

            <ScoreRow
              title={t('performance.incidents')}
              detail={t('performance.incidentsDetail', {
                high: breakdown.incidents.high,
                medium: breakdown.incidents.medium,
                low: breakdown.incidents.low,
              })}
              score={breakdown.incidents.score}
              maxPoints={breakdown.incidents.maxPoints}
              colors={colors}
            />
          </View>

          <View style={s.sectionHead}>
            <Text style={s.sectionTitle}>{t('performance.streaks')}</Text>
            <View style={s.sampleBadge}>
              <Text style={s.sampleBadgeText}>{t('performance.sampleData')}</Text>
            </View>
          </View>

          <View style={s.card}>
            <View style={s.streakRow}>
              <View style={s.streakBox}>
                <Text style={s.streakValue}>{MOCK_STREAKS.currentStreak}</Text>
                <Text style={s.streakLabel}>{t('performance.currentStreak')}</Text>
              </View>
              <View style={s.streakBox}>
                <Text style={s.streakValue}>{MOCK_STREAKS.bestStreak}</Text>
                <Text style={s.streakLabel}>{t('performance.bestStreak')}</Text>
              </View>
              <View style={s.streakBox}>
                <Text style={s.streakValue}>{MOCK_STREAKS.onTimeThisMonth}</Text>
                <Text style={s.streakLabel}>{t('performance.onTimeThisMonth')}</Text>
              </View>
            </View>
          </View>

          <View style={s.sectionHead}>
            <Text style={s.sectionTitle}>{t('performance.trend')}</Text>
            <View style={s.sampleBadge}>
              <Text style={s.sampleBadgeText}>{t('performance.sampleData')}</Text>
            </View>
          </View>

          <View style={s.card}>
            <View style={s.trendRow}>
              {MOCK_TREND.map((point) => (
                <View key={point.label} style={s.trendItem}>
                  <Text style={s.trendValue}>{point.score}</Text>
                  <View style={s.trendTrack}>
                    <View style={[s.trendBar, { height: `${point.score}%` }]} />
                  </View>
                  <Text style={s.trendLabel}>{point.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={s.noteRow}>
            <Ionicons name="information-circle-outline" size={16} color={colors.muted} />
            <Text style={s.noteText}>{t('performance.sampleNote')}</Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },

    content: {
      padding: 16,
      paddingBottom: 32,
      flexGrow: 1,
    },

    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
      backgroundColor: colors.bg,
    },

    errorTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },

    errorText: {
      color: colors.muted,
      textAlign: 'center',
      marginBottom: 16,
    },

    retryBtn: {
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 10,
    },

    retryText: {
      color: colors.white,
      fontWeight: '700',
    },

    scoreCard: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 12,
      borderWidth: 1,
      paddingVertical: 24,
      alignItems: 'center',
    },

    scoreLabel: {
      color: colors.muted,
      fontSize: 14,
      fontWeight: '600',
    },

    scoreValue: {
      color: colors.primary,
      fontSize: 52,
      fontWeight: '800',
      marginTop: 4,
    },

    scoreOutOf: {
      color: colors.muted,
      fontSize: 13,
    },

    sectionHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    sectionTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
      marginTop: 20,
      marginBottom: 10,
    },

    sampleBadge: {
      backgroundColor: colors.yellowSoft,
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 3,
      marginTop: 10,
    },

    sampleBadgeText: {
      color: colors.status.pending,
      fontSize: 11,
      fontWeight: '700',
    },

    card: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 12,
      borderWidth: 1,
      padding: 16,
    },

    scoreRow: {
      marginBottom: 16,
    },

    scoreRowHead: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },

    rowTitle: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '700',
    },

    rowPoints: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
    },

    barTrack: {
      backgroundColor: colors.border,
      borderRadius: 5,
      height: 10,
      overflow: 'hidden',
    },

    barFill: {
      backgroundColor: colors.primary,
      borderRadius: 5,
      height: 10,
    },

    rowDetail: {
      color: colors.muted,
      fontSize: 13,
      marginTop: 6,
    },

    streakRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },

    streakBox: {
      flex: 1,
      alignItems: 'center',
    },

    streakValue: {
      color: colors.primary,
      fontSize: 24,
      fontWeight: '800',
    },

    streakLabel: {
      color: colors.muted,
      fontSize: 12,
      marginTop: 4,
      textAlign: 'center',
    },

    trendRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
    },

    trendItem: {
      flex: 1,
      alignItems: 'center',
    },

    trendValue: {
      color: colors.muted,
      fontSize: 11,
      marginBottom: 4,
    },

    trendTrack: {
      backgroundColor: colors.border,
      borderRadius: 6,
      height: 110,
      width: 18,
      justifyContent: 'flex-end',
      overflow: 'hidden',
    },

    trendBar: {
      backgroundColor: colors.primary,
      borderRadius: 6,
      width: 18,
    },

    trendLabel: {
      color: colors.muted,
      fontSize: 12,
      marginTop: 6,
    },

    noteRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 6,
      marginTop: 14,
    },

    noteText: {
      color: colors.muted,
      flex: 1,
      fontSize: 12,
      lineHeight: 18,
    },
  });
