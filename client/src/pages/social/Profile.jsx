import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { useAuthStore } from '@/store/auth.store';
import { useProfile, useFollow, useUnfollow, useFollowing, usePrivacy, useUpdateProfile } from '@/hooks/useSocial';
import { LevelBar } from '@/components/LevelBar';
import { BadgeDisplay } from '@/components/BadgeDisplay';
import { StreakCounter } from '@/components/StreakCounter';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as ChartTooltip, Legend } from 'recharts';

const CAT_COLORS = {
  recyclable: '#22c55e',
  organic: '#f59e0b',
  'e-waste': '#6366f1',
  hazardous: '#ef4444',
};

function formatAccuracy(v) {
  if (v == null || Number.isNaN(Number(v))) return '—';
  const n = Number(v);
  if (n >= 0 && n <= 1) return `${(n * 100).toFixed(1)}%`;
  return `${n.toFixed(1)}%`;
}

export default function Profile() {
  const { username } = useParams();
  const { user: authUser, token } = useAuthStore();
  const { data: profile, isLoading, isError } = useProfile(username);
  const { data: followingRows } = useFollowing();
  const follow = useFollow();
  const unfollow = useUnfollow();
  const privacy = usePrivacy();
  const updateProfile = useUpdateProfile();

  const [bioDraft, setBioDraft] = useState('');

  const isOwn = authUser?.username === username;

  useEffect(() => {
    if (profile && typeof profile.bio === 'string') setBioDraft(profile.bio);
  }, [profile]);

  const isFollowing = useMemo(() => {
    if (!profile?._id || !followingRows || isOwn) return false;
    return followingRows.some((f) => String(f.followee?._id) === String(profile._id));
  }, [followingRows, profile, isOwn]);

  const pieData = useMemo(() => {
    const c = profile?.categoryCounts;
    if (!c) return [];
    return ['recyclable', 'organic', 'e-waste', 'hazardous']
      .map((key) => ({
        name: key === 'e-waste' ? 'E-waste' : key.charAt(0).toUpperCase() + key.slice(1),
        value: c[key] ?? 0,
        key,
      }))
      .filter((d) => d.value > 0);
  }, [profile]);

  if (isLoading) {
    return (
      <PageWrapper>
        <Skeleton className="h-12 w-64 mb-6" />
        <Skeleton className="h-64 w-full max-w-2xl" />
      </PageWrapper>
    );
  }

  if (isError || !profile) {
    return (
      <PageWrapper>
        <p className="text-red-600">User not found or could not load profile.</p>
      </PageWrapper>
    );
  }

  // Server sends full profile with numeric totalPoints; restricted snapshot omits it
  const hasFullStats = typeof profile.totalPoints === 'number';
  const locked = profile.isPrivate === true && !isOwn && !hasFullStats;

  return (
    <PageWrapper>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900">@{profile.username}</h1>
          {profile.communityRank > 0 && (
            <p className="text-sm text-slate-500 mt-1">Community rank #{profile.communityRank}</p>
          )}
        </div>
        {token && !isOwn && profile._id && (
          <Button
            variant={isFollowing ? 'outline' : 'default'}
            disabled={follow.isPending || unfollow.isPending}
            onClick={() =>
              isFollowing ? unfollow.mutate(profile._id) : follow.mutate(profile._id)
            }
          >
            {isFollowing ? 'Unfollow' : 'Follow'}
          </Button>
        )}
      </div>

      {locked && (
        <Card className="max-w-lg border-amber-200 bg-amber-50/80">
          <CardContent className="p-6 text-center text-amber-900">
            <p className="text-lg">
              <span className="mr-2" aria-hidden>
                🔒
              </span>
              This profile is private
            </p>
            <p className="text-sm mt-2 text-amber-800/90">Only the owner and administrators can see full stats.</p>
          </CardContent>
        </Card>
      )}

      {!locked && (
        <div className="space-y-8 max-w-3xl">
          {isOwn && (
            <Card>
              <CardHeader>
                <CardTitle>Bio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={bioDraft}
                  onChange={(e) => setBioDraft(e.target.value)}
                  placeholder="Tell others about your recycling habits…"
                  maxLength={200}
                />
                <Button
                  onClick={() => updateProfile.mutate({ bio: bioDraft })}
                  disabled={updateProfile.isPending}
                >
                  Save bio
                </Button>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label htmlFor="priv">Private profile</Label>
                    <p className="text-xs text-slate-500">Hide detailed stats from users who don&apos;t follow you</p>
                  </div>
                  <Switch
                    id="priv"
                    checked={!!profile.isPrivate}
                    onCheckedChange={(v) => privacy.mutate(v)}
                    disabled={privacy.isPending}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {!isOwn && profile.bio && (
            <p className="text-slate-600 border-l-4 border-eco-200 pl-4 py-1">{profile.bio}</p>
          )}

          <div className="grid sm:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Points</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-mono font-bold text-eco-600">{profile.totalPoints ?? 0}</p>
                <div className="mt-4">
                  <LevelBar totalPoints={profile.totalPoints ?? 0} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Streak & accuracy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <StreakCounter streak={profile.streak} />
                <p className="text-sm text-slate-600">
                  Accuracy:{' '}
                  <span className="font-mono font-semibold">{formatAccuracy(profile.accuracyRate)}</span>
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Badges</CardTitle>
            </CardHeader>
            <CardContent>
              <BadgeDisplay badges={profile.badges} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Category breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {pieData.length === 0 ? (
                <p className="text-sm text-slate-500">No category data yet.</p>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {pieData.map((entry) => (
                          <Cell key={entry.key} fill={CAT_COLORS[entry.key] ?? '#94a3b8'} />
                        ))}
                      </Pie>
                      <ChartTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-6 text-sm">
            <Link to="/followers" className="text-eco-600 hover:underline font-medium">
              {profile.followersCount ?? 0} followers
            </Link>
            <Link to="/following" className="text-eco-600 hover:underline font-medium">
              {profile.followingCount ?? 0} following
            </Link>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
