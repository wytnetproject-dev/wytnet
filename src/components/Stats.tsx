import { Card, CardContent } from '@mui/material';

interface StatItem {
  label: string;
  value: string;
}

const statsData: StatItem[] = [
  { label: 'Active Agents', value: '15+' },
  { label: 'Network TFLOPS', value: '85.4k' },
  { label: 'Total Transactions', value: '45Cr' },
  { label: 'System Uptime', value: '99.99%' },
];

export default function Stats() {
  return (
    <section className="relative z-10 -mt-8 px-6 pb-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statsData.map((stat, idx) => (
            <Card
              key={idx}
              elevation={0}
              className="glassmorphism-card rounded-2xl border border-wytnet-border transition-all duration-300"
            >
              <CardContent className="flex flex-col p-6 sm:p-8">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {stat.label}
                </span>
                <span className="mt-2 text-3xl font-extrabold tracking-tight text-wytnet-blue sm:text-4xl md:text-5xl">
                  {stat.value}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
