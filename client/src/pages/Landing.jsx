import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { CATEGORY_META } from '@/lib/constants';
import { Leaf, Upload, Sparkles, Coins } from 'lucide-react';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function Landing() {
  const { data: board } = useLeaderboard(5);
  const top = Array.isArray(board) ? board.slice(0, 5) : [];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="overflow-hidden">
        <section className="relative border-b border-eco-100">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-eco-100/80 via-slate-50 to-slate-50" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(34,197,94,0.12),transparent_50%)]" />
          <div className="relative mx-auto max-w-7xl px-4 py-20 md:py-28 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              <Leaf className="h-14 w-14 text-eco-600 mx-auto mb-6" />
              <h1 className="font-display text-4xl md:text-6xl font-bold text-slate-900 tracking-tight">
                Scan. Classify. Earn.
              </h1>
              <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
                Snap a photo of your waste, let AI classify it, and earn points for recycling right. Join the
                community making sustainability measurable.
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <Button size="lg" asChild>
                  <Link to="/register">Get started</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/leaderboard">View leaderboard</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 md:py-24">
          <h2 className="font-display text-3xl font-bold text-center text-slate-900 mb-12">How it works</h2>
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-40px' }}
            className="grid md:grid-cols-3 gap-6"
          >
            {[
              { icon: Upload, title: 'Upload', desc: 'Drop a clear photo of your item — bottles, food scraps, electronics, or hazardous waste.' },
              { icon: Sparkles, title: 'AI classifies', desc: 'Our vision models label the category and confidence. Low confidence? Moderators help resolve.' },
              { icon: Coins, title: 'Earn points', desc: 'Redeem rewards when your submission qualifies. Climb the leaderboard and unlock badges.' },
            ].map((step, i) => (
              <motion.div key={step.title} variants={item} transition={{ delay: i * 0.1 }}>
                <Card className="h-full border-eco-100 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6 pt-8">
                    <step.icon className="h-10 w-10 text-eco-600 mb-4" />
                    <h3 className="font-display text-xl font-semibold text-slate-900">{step.title}</h3>
                    <p className="mt-2 text-slate-600 text-sm leading-relaxed">{step.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </section>

        <section className="bg-white border-y border-slate-100 py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-4">
            <h2 className="font-display text-3xl font-bold text-center text-slate-900 mb-12">Categories</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {['recyclable', 'organic', 'e-waste', 'hazardous'].map((key) => {
                const m = CATEGORY_META[key];
                const border =
                  key === 'recyclable'
                    ? 'border-l-recyclable'
                    : key === 'organic'
                      ? 'border-l-organic'
                      : key === 'e-waste'
                        ? 'border-l-ewaste'
                        : 'border-l-hazardous';
                const examples =
                  key === 'recyclable'
                    ? 'Plastic bottles, paper, cans'
                    : key === 'organic'
                      ? 'Food scraps, yard waste'
                      : key === 'e-waste'
                        ? 'Batteries, cables, devices'
                        : 'Paint, chemicals, sharps';
                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.05 }}
                    className={`rounded-xl border border-slate-200 bg-slate-50/80 p-5 border-l-4 ${border}`}
                  >
                    <span className="text-2xl">{m.icon}</span>
                    <h3 className="font-display mt-2 text-lg font-semibold text-slate-900">{m.label}</h3>
                    <p className="mt-1 text-sm text-slate-500">{examples}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 md:py-24">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <h2 className="font-display text-3xl font-bold text-slate-900">Leaderboard preview</h2>
            <Link to="/leaderboard" className="text-eco-600 font-medium hover:underline text-sm">
              See full leaderboard →
            </Link>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {top.length === 0 ? (
                  <p className="p-8 text-center text-slate-500">No players yet — be the first.</p>
                ) : (
                  top.map((u, i) => (
                    <div key={u._id ?? i} className="flex items-center justify-between px-4 py-3">
                      <span className="font-mono text-slate-400 w-8">{i + 1}</span>
                      <span className="flex-1 font-medium text-slate-800">@{u.username}</span>
                      <span className="font-mono text-eco-700">{u.totalPoints ?? 0} pts</span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="bg-gradient-to-r from-eco-600 to-eco-700 text-white py-14">
          <div className="mx-auto max-w-7xl px-4 text-center">
            <h2 className="font-display text-2xl md:text-3xl font-bold">Join the movement</h2>
            <p className="mt-2 text-eco-100 max-w-lg mx-auto">Create a free account and start earning today.</p>
            <Button size="lg" variant="secondary" className="mt-8" asChild>
              <Link to="/register">Register</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
