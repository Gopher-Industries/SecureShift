import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import colors from '../theme/colors';
import Card from './Card';

const titleStyle = {
  margin: 0,
  marginBottom: 4,
  fontSize: 15,
  fontWeight: 600,
  color: colors.text,
};

const summaryStyle = {
  margin: 0,
  marginBottom: 12,
  fontSize: 13,
  color: colors.muted,
};

// Renders one trend line chart ina card with a text summary and
// a hidden data table for accessibility.
export default function TrendChart({ title, data, color = colors.primary, summary }) {
  const first = data?.[0]?.value;
  const last = data?.[data.length - 1]?.value;
  const trendLabel =
    summary ??
    (typeof first === 'number' && typeof last === 'number'
      ? `${last >= first ? 'Up' : 'Down'} from ${first} to ${last} over the last ${data.length} weeks`
      : '');

  return (
    <Card style={{ minWidth: 0 }} role="region" aria-label={title}>
      <h3 style={titleStyle}>{title}</h3>
      {trendLabel && <p style={summaryStyle}>{trendLabel}</p>}
      <div
        role="img"
        aria-label={`${title} line chart. ${trendLabel}`}
        style={{ width: '100%', height: 220 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 12, left: -12, bottom: 0 }}>
            <CartesianGrid stroke={colors.border} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: colors.muted }}
              axisLine={{ stroke: colors.border }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 12, fill: colors.muted }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 6,
                border: `1px solid ${colors.border}`,
                fontSize: 13,
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {/* Hidden table so screen readers get the data too */}
      <table
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          clipPath: 'inset(50%)',
        }}
      >
        <caption>{title} data table</caption>
        <thead>
          <tr>
            <th scope="col">Week</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {data.map((point) => (
            <tr key={point.label}>
              <th scope="row">{point.label}</th>
              <td>{point.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
