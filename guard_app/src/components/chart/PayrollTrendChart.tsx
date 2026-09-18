import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';

import { useAppTheme } from '../../theme';

import type { AppColors } from '../../theme/colors';

type Props = {
  title: string;
  labels: string[];
  values: number[];
  kind: 'bar' | 'line';
  emptyMessage: string;
  yAxisLabel?: string;
  yAxisSuffix?: string;
  decimalPlaces?: number;
};

// chart-kit only takes rgba strings, our theme keeps hex
function withOpacity(hex: string, opacity: number) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);

  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return `rgba(39, 66, 137, ${opacity})`;
  }

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export default function PayrollTrendChart({
  title,
  labels,
  values,
  kind,
  emptyMessage,
  yAxisLabel = '',
  yAxisSuffix = '',
  decimalPlaces = 0,
}: Props) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const { width } = useWindowDimensions();

  // a flat all-zero series has no scale to draw, so show the note instead
  const hasValues = values.length > 0 && values.some((value) => value > 0);
  const chartWidth = Math.max(240, width - 64);

  const chartConfig = {
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces,
    color: (opacity = 1) => withOpacity(colors.primary, opacity),
    labelColor: (opacity = 1) => withOpacity(colors.muted, opacity),
    barPercentage: 0.6,
    propsForBackgroundLines: { stroke: colors.border },
    propsForLabels: { fontSize: 10 },
  };

  // chart-kit draws bars and lines with a faded colour by default
  const barChartConfig = {
    ...chartConfig,
    fillShadowGradientFrom: colors.primary,
    fillShadowGradientFromOpacity: 0.9,
    fillShadowGradientTo: colors.primary,
    fillShadowGradientToOpacity: 0.5,
  };

  const dataset = { data: values, color: () => colors.primary, strokeWidth: 2 };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>

      {hasValues ? (
        <View style={styles.chartBox}>
          {kind === 'bar' ? (
            <BarChart
              data={{ labels, datasets: [dataset] }}
              width={chartWidth}
              height={200}
              chartConfig={barChartConfig}
              yAxisLabel={yAxisLabel}
              yAxisSuffix={yAxisSuffix}
              fromZero
              showValuesOnTopOfBars
              style={styles.chart}
            />
          ) : (
            <LineChart
              data={{ labels, datasets: [dataset] }}
              width={chartWidth}
              height={200}
              chartConfig={chartConfig}
              yAxisLabel={yAxisLabel}
              yAxisSuffix={yAxisSuffix}
              fromZero
              bezier
              style={styles.chart}
            />
          )}
        </View>
      ) : (
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      )}
    </View>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    wrap: {
      marginBottom: 18,
    },
    title: {
      color: colors.text,
      fontWeight: '800',
      marginBottom: 8,
    },
    chartBox: {
      alignItems: 'center',
    },
    chart: {
      borderRadius: 12,
      marginLeft: -8,
    },
    emptyText: {
      color: colors.muted,
      fontWeight: '600',
      paddingVertical: 12,
    },
  });
