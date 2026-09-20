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
import {
  deriveBadges,
  deriveStreak,
  deriveLeaderboard,
  currentUserRank,
  EARNED_COUNT,
  type Badge,
} from '../lib/gamification';
import { getLeaderboardOptIn, setLeaderboardOptIn } from '../lib/leaderboardPrefs';
import { useAppTheme } from '../theme';
import { MOCK_TREND } from '../utils/performanceMock';

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

function BadgeCard({ badge, colors }: { badge: Badge; colors: AppColors }) {
  const s = getStyles(colors);
  const { t } = useTranslation();
  const pct = Math.round(badge.progress * 100);

  return (
    <View style={[s.badgeCard, !badge.earned && s.badgeCardLocked]}>
      <View style={[s.badgeIcon, badge.earned ? s.badgeIconEarned : s.badgeIconLocked]}>
        <Ionicons name={badge.icon} size={22} color={badge.earned ? colors.white : colors.muted} />
      </View>
      <Text style={s.badgeTitle} numberOfLines={2}>
        {t(badge.titleKey)}
      </Text>
      <Text style={s.badgeDesc} numberOfLines={2}>
        {t(badge.descKey)}
      </Text>
      {badge.earned ? (
        <Text style={s.badgeEarned}>{t('gamification.earned')}</Text>
      ) : (
        <View style={s.badgeProgressWrap}>
          <View style={s.badgeProgressTrack}>
            <View style={[s.badgeProgressFill, { width: `${pct}%` }]} />
          </View>
          <Text style={s.badgeProgressText}>{t('gamification.progressPct', { pct })}</Text>
        </View>
      )}
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
  const [leaderboardOptIn, setLeaderboardOptInState] = useState(false);

  const toggleLeaderboard = async () => {
    const next = !leaderboardOptIn;
    setLeaderboardOptInState(next);
    await setLeaderboardOptIn(next);
  };

  const load = async () => {
    try {
      setError(null);

      const profile = await getUserProfile();
      const result = await getGuardScore(profile?._id ?? '');

      setScore(result.score);
      setBreakdown(result.breakdown ?? null);
      setLeaderboardOptInState(await getLeaderboardOptIn());
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

  const hasData = score != null && breakdown != null;
  const badges = hasData ? deriveBadges(score, breakdown) : [];
  const streak = hasData ? deriveStreak(breakdown) : null;
  const leaderboard = hasData ? deriveLeaderboard(score, leaderboardOptIn) : null;
  const rank = currentUserRank(leaderboard);

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
            <Text style={s.sectionTitle}>{t('gamification.badges')}</Text>
            <Text style={s.badgeCount}>
              {t('gamification.earnedCount', {
                earned: EARNED_COUNT(badges),
                total: badges.length,
              })}
            </Text>
          </View>

          <View style={s.badgeGrid}>
            {badges.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} colors={colors} />
            ))}
          </View>

          <Text style={s.sectionTitle}>{t('performance.streaks')}</Text>

          <View style={s.card}>
            <View style={s.streakRow}>
              <View style={s.streakBox}>
                <Text style={s.streakValue}>{streak?.current ?? 0}</Text>
                <Text style={s.streakLabel}>{t('performance.currentStreak')}</Text>
              </View>
              <View style={s.streakBox}>
                <Text style={s.streakValue}>{streak?.best ?? 0}</Text>
                <Text style={s.streakLabel}>{t('performance.bestStreak')}</Text>
              </View>
              <View style={s.streakBox}>
                <Text style={s.streakValue}>{streak?.onTimeThisMonth ?? 0}</Text>
                <Text style={s.streakLabel}>{t('performance.onTimeThisMonth')}</Text>
              </View>
            </View>
          </View>

          <View style={s.sectionHead}>
            <Text style={s.sectionTitle}>{t('gamification.leaderboard')}</Text>
            {leaderboardOptIn && rank != null ? (
              <View style={s.rankPill}>
                <Text style={s.rankPillText}>{t('gamification.yourRank', { rank })}</Text>
              </View>
            ) : null}
          </View>

          {!leaderboardOptIn ? (
            <View style={s.card}>
              <Text style={s.optInTitle}>{t('gamification.leaderboardOptInTitle')}</Text>
              <Text style={s.optInText}>{t('gamification.leaderboardOptInText')}</Text>
              <TouchableOpacity
                style={s.optInBtn}
                onPress={toggleLeaderboard}
                accessibilityRole="button"
                testID="leaderboard-optin"
              >
                <Text style={s.optInBtnText}>{t('gamification.leaderboardJoin')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={s.card}>
              {(leaderboard ?? []).map((entry) => (
                <View
                  key={`${entry.rank}-${entry.label}`}
                  style={[s.lbRow, entry.isCurrentUser && s.lbRowMe]}
                >
                  <Text style={[s.lbRank, entry.isCurrentUser && s.lbTextMe]}>#{entry.rank}</Text>
                  <Text style={[s.lbName, entry.isCurrentUser && s.lbTextMe]}>
                    {entry.isCurrentUser ? t('gamification.you') : entry.label}
                  </Text>
                  <Text style={[s.lbScore, entry.isCurrentUser && s.lbTextMe]}>{entry.score}</Text>
                </View>
              ))}
              <TouchableOpacity
                style={s.optOutBtn}
                onPress={toggleLeaderboard}
                accessibilityRole="button"
                testID="leaderboard-optout"
              >
                <Text style={s.optOutText}>{t('gamification.leaderboardLeave')}</Text>
              </TouchableOpacity>
            </View>
          )}

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

    badgeCount: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: '700',
      marginTop: 20,
    },

    badgeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },

    badgeCard: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 12,
      borderWidth: 1,
      padding: 12,
      marginBottom: 12,
      width: '48%',
    },

    badgeCardLocked: {
      opacity: 0.75,
    },

    badgeIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },

    badgeIconEarned: {
      backgroundColor: colors.primary,
    },

    badgeIconLocked: {
      backgroundColor: colors.border,
    },

    badgeTitle: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
    },

    badgeDesc: {
      color: colors.muted,
      fontSize: 12,
      marginTop: 2,
      lineHeight: 16,
    },

    badgeEarned: {
      color: colors.success,
      fontSize: 12,
      fontWeight: '700',
      marginTop: 8,
    },

    badgeProgressWrap: {
      marginTop: 8,
    },

    badgeProgressTrack: {
      backgroundColor: colors.border,
      borderRadius: 4,
      height: 6,
      overflow: 'hidden',
    },

    badgeProgressFill: {
      backgroundColor: colors.primary,
      borderRadius: 4,
      height: 6,
    },

    badgeProgressText: {
      color: colors.muted,
      fontSize: 11,
      marginTop: 4,
    },

    rankPill: {
      backgroundColor: colors.primarySoft,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 3,
      marginTop: 10,
    },

    rankPillText: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: '700',
    },

    optInTitle: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '700',
      marginBottom: 6,
    },

    optInText: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 19,
      marginBottom: 14,
    },

    optInBtn: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: 'center',
    },

    optInBtnText: {
      color: colors.white,
      fontWeight: '700',
      fontSize: 14,
    },

    lbRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomColor: colors.border,
      borderBottomWidth: 1,
    },

    lbRowMe: {
      backgroundColor: colors.primarySoft,
      borderRadius: 8,
      paddingHorizontal: 8,
      borderBottomWidth: 0,
    },

    lbRank: {
      color: colors.muted,
      fontSize: 14,
      fontWeight: '700',
      width: 44,
    },

    lbName: {
      color: colors.text,
      fontSize: 14,
      flex: 1,
    },

    lbScore: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
    },

    lbTextMe: {
      color: colors.primary,
    },

    optOutBtn: {
      alignItems: 'center',
      paddingVertical: 12,
      marginTop: 4,
    },

    optOutText: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: '600',
    },
  });
