import { format, parseISO } from 'date-fns';
import { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';

import { Text } from '@/components/Themed';
import type { WeightEntry } from '@/types/profile';
import { kgToLbs } from '@/utils/bodyMetrics';

interface WeightTrendChartProps {
  entries: WeightEntry[];
}

interface ChartPoint {
  id: number;
  x: number;
  y: number;
  label: string;
  weightLbs: number;
}

const CHART_HEIGHT = 200;
const PADDING = { top: 16, right: 12, bottom: 28, left: 44 };

function buildChartPoints(entries: WeightEntry[]): ChartPoint[] {
  const chronological = [...entries].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));

  if (chronological.length === 0) return [];

  const timestamps = chronological.map((entry) => parseISO(entry.recordedAt).getTime());
  const minTime = Math.min(...timestamps);
  const maxTime = Math.max(...timestamps);
  const timeSpan = Math.max(maxTime - minTime, 1);

  return chronological.map((entry, index) => {
    const time = parseISO(entry.recordedAt).getTime();
    const x = chronological.length === 1 ? 0.5 : (time - minTime) / timeSpan;
    const weightLbs = kgToLbs(entry.weightKg);

    return {
      id: entry.id,
      x,
      y: weightLbs,
      label:
        chronological.length === 1
          ? format(parseISO(entry.recordedAt), 'MMM d')
          : index === 0 || index === chronological.length - 1 || chronological.length <= 4
            ? format(parseISO(entry.recordedAt), 'MMM d')
            : '',
      weightLbs,
    };
  });
}

export function WeightTrendChart({ entries }: WeightTrendChartProps) {
  const [width, setWidth] = useState(0);
  const points = useMemo(() => buildChartPoints(entries), [entries]);

  const onLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  if (entries.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Log at least one weigh-in to see your trend.</Text>
      </View>
    );
  }

  if (width <= 0) {
    return <View style={styles.container} onLayout={onLayout} />;
  }

  const weights = points.map((point) => point.y);
  const rawMin = Math.min(...weights);
  const rawMax = Math.max(...weights);
  const padding = weights.length === 1 ? 5 : Math.max(2, (rawMax - rawMin) * 0.15);
  const yMin = rawMin - padding;
  const yMax = rawMax + padding;
  const ySpan = Math.max(yMax - yMin, 1);

  const plotWidth = width - PADDING.left - PADDING.right;
  const plotHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  const mapped = points.map((point) => ({
    ...point,
    px: PADDING.left + point.x * plotWidth,
    py: PADDING.top + plotHeight - ((point.y - yMin) / ySpan) * plotHeight,
  }));

  const polylinePoints = mapped.map((point) => `${point.px},${point.py}`).join(' ');

  const yTicks = [yMax, (yMax + yMin) / 2, yMin];

  return (
    <View style={styles.container} onLayout={onLayout}>
      <Svg width={width} height={CHART_HEIGHT}>
        {yTicks.map((tick, index) => {
          const py = PADDING.top + plotHeight - ((tick - yMin) / ySpan) * plotHeight;
          return (
            <Line
              key={`grid-${index}`}
              x1={PADDING.left}
              y1={py}
              x2={width - PADDING.right}
              y2={py}
              stroke="#E5E7EB"
              strokeWidth={1}
            />
          );
        })}

        {mapped.length > 1 ? (
          <Polyline
            points={polylinePoints}
            fill="none"
            stroke="#059669"
            strokeWidth={3}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ) : null}

        {mapped.map((point) => (
          <Circle key={point.id} cx={point.px} cy={point.py} r={5} fill="#059669" />
        ))}

        {yTicks.map((tick, index) => {
          const py = PADDING.top + plotHeight - ((tick - yMin) / ySpan) * plotHeight;
          return (
            <SvgText
              key={`ylabel-${index}`}
              x={PADDING.left - 8}
              y={py + 4}
              fontSize={11}
              fill="#6B7280"
              textAnchor="end">
              {Math.round(tick)}
            </SvgText>
          );
        })}

        {mapped.map((point) =>
          point.label ? (
            <SvgText
              key={`xlabel-${point.id}`}
              x={point.px}
              y={CHART_HEIGHT - 8}
              fontSize={10}
              fill="#6B7280"
              textAnchor="middle">
              {point.label}
            </SvgText>
          ) : null,
        )}
      </Svg>

      <Text style={styles.caption}>Weight (lb) over time</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  caption: {
    color: '#6B7280',
    fontSize: 12,
    textAlign: 'center',
  },
  empty: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyText: {
    color: '#6B7280',
    textAlign: 'center',
  },
});
