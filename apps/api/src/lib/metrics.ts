type LabelValues = Record<string, string>;

const escapeLabel = (value: string) => value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/"/g, '\\"');

const labelKey = (values: string[]) => values.join('\u0001');

const labelObject = (labelNames: string[], values: string[]): LabelValues => {
  const out: LabelValues = {};
  for (let i = 0; i < labelNames.length; i += 1) {
    out[labelNames[i]] = values[i] ?? '';
  }
  return out;
};

const labelString = (values: LabelValues) => {
  const keys = Object.keys(values);
  if (keys.length === 0) return '';
  return `{${keys.map((key) => `${key}="${escapeLabel(values[key])}"`).join(',')}}`;
};

class CounterMetric {
  private readonly name: string;
  private readonly help: string;
  private readonly labelNames: string[];
  private readonly values = new Map<string, { labels: LabelValues; value: number }>();

  constructor(name: string, help: string, labelNames: string[]) {
    this.name = name;
    this.help = help;
    this.labelNames = labelNames;
  }

  labels(...labelValues: string[]) {
    const key = labelKey(labelValues);
    const labels = labelObject(this.labelNames, labelValues);
    if (!this.values.has(key)) {
      this.values.set(key, { labels, value: 0 });
    }
    return {
      inc: (value = 1) => {
        const current = this.values.get(key);
        if (current) current.value += value;
      }
    };
  }

  reset() {
    this.values.clear();
  }

  toPromText() {
    const lines = [`# HELP ${this.name} ${this.help}`, `# TYPE ${this.name} counter`];
    for (const entry of this.values.values()) {
      lines.push(`${this.name}${labelString(entry.labels)} ${entry.value}`);
    }
    return lines.join('\n');
  }
}

class HistogramMetric {
  private readonly name: string;
  private readonly help: string;
  private readonly labelNames: string[];
  private readonly buckets: number[];
  private readonly values = new Map<string, { labels: LabelValues; counts: number[]; sum: number; count: number }>();

  constructor(name: string, help: string, labelNames: string[], buckets: number[]) {
    this.name = name;
    this.help = help;
    this.labelNames = labelNames;
    this.buckets = buckets;
  }

  labels(...labelValues: string[]) {
    const key = labelKey(labelValues);
    const labels = labelObject(this.labelNames, labelValues);
    if (!this.values.has(key)) {
      this.values.set(key, { labels, counts: this.buckets.map(() => 0), sum: 0, count: 0 });
    }

    return {
      observe: (value: number) => {
        const current = this.values.get(key);
        if (!current) return;
        current.sum += value;
        current.count += 1;
        for (let i = 0; i < this.buckets.length; i += 1) {
          if (value <= this.buckets[i]) {
            current.counts[i] += 1;
          }
        }
      }
    };
  }

  reset() {
    this.values.clear();
  }

  toPromText() {
    const lines = [`# HELP ${this.name} ${this.help}`, `# TYPE ${this.name} histogram`];
    for (const entry of this.values.values()) {
      const base = entry.labels;
      for (let i = 0; i < this.buckets.length; i += 1) {
        const withLe = { ...base, le: String(this.buckets[i]) };
        lines.push(`${this.name}_bucket${labelString(withLe)} ${entry.counts[i]}`);
      }
      lines.push(`${this.name}_bucket${labelString({ ...base, le: '+Inf' })} ${entry.count}`);
      lines.push(`${this.name}_sum${labelString(base)} ${entry.sum}`);
      lines.push(`${this.name}_count${labelString(base)} ${entry.count}`);
    }
    return lines.join('\n');
  }
}

const counterMetrics: CounterMetric[] = [];
const histogramMetrics: HistogramMetric[] = [];

export const httpRequestsTotal = new CounterMetric(
  'http_requests_total',
  'Total HTTP requests handled by the API',
  ['method', 'route', 'status_code']
);
counterMetrics.push(httpRequestsTotal);

export const httpRequestDurationSeconds = new HistogramMetric(
  'http_request_duration_seconds',
  'Duration of HTTP requests in seconds',
  ['method', 'route', 'status_code'],
  [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5]
);
histogramMetrics.push(httpRequestDurationSeconds);

export const apiErrorsTotal = new CounterMetric('api_errors_total', 'Total API errors surfaced by the application', ['type']);
counterMetrics.push(apiErrorsTotal);

export const metricsContentType = 'text/plain; version=0.0.4; charset=utf-8';

export const metricsText = async () => {
  const blocks: string[] = [];
  for (const metric of counterMetrics) {
    blocks.push(metric.toPromText());
  }
  for (const metric of histogramMetrics) {
    blocks.push(metric.toPromText());
  }
  return `${blocks.join('\n\n')}\n`;
};

export const resetMetrics = () => {
  for (const metric of counterMetrics) {
    metric.reset();
  }
  for (const metric of histogramMetrics) {
    metric.reset();
  }
};
