import { useEffect, useState } from 'react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { useAdminConfig, useSetConfig } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';

const KEYS = {
  confidence: 'CONFIDENCE_THRESHOLD',
  fraud: 'FRAUD_WINDOW_MINUTES',
  classifier: 'PRIMARY_CLASSIFIER',
};

export default function SystemConfig() {
  const { data: config, isLoading } = useAdminConfig();
  const setConfig = useSetConfig();

  const [threshold, setThreshold] = useState(0.72);
  const [fraudMins, setFraudMins] = useState(60);
  const [classifier, setClassifier] = useState('gemini');

  useEffect(() => {
    if (!config) return;
    if (config[KEYS.confidence] != null) setThreshold(Number(config[KEYS.confidence]));
    if (config[KEYS.fraud] != null) setFraudMins(Number(config[KEYS.fraud]));
    if (config[KEYS.classifier] != null) setClassifier(String(config[KEYS.classifier]));
  }, [config]);

  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">System config</h1>

      {isLoading ? (
        <Skeleton className="h-48 w-full max-w-lg" />
      ) : (
        <div className="space-y-8 max-w-lg">
          <Card>
            <CardHeader>
              <CardTitle>Confidence threshold</CardTitle>
              <CardDescription>Minimum model confidence before auto-accept (0–1).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="font-mono text-sm w-14">{threshold.toFixed(2)}</span>
              </div>
              <Button
                onClick={() =>
                  setConfig.mutate({ key: KEYS.confidence, value: threshold })
                }
                disabled={setConfig.isPending}
              >
                Save threshold
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fraud window</CardTitle>
              <CardDescription>Minutes to consider duplicate images (pHash).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fraud">Minutes</Label>
                <input
                  id="fraud"
                  type="number"
                  min={1}
                  className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 text-sm"
                  value={fraudMins}
                  onChange={(e) => setFraudMins(Number(e.target.value))}
                />
              </div>
              <Button
                onClick={() => setConfig.mutate({ key: KEYS.fraud, value: fraudMins })}
                disabled={setConfig.isPending}
              >
                Save fraud window
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Default classifier</CardTitle>
              <CardDescription>Primary vision classifier for new submissions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <select
                className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 text-sm"
                value={classifier}
                onChange={(e) => setClassifier(e.target.value)}
              >
                <option value="gemini">gemini</option>
                <option value="yolo">yolo</option>
                <option value="mock">mock</option>
              </select>
              <Button
                onClick={() => setConfig.mutate({ key: KEYS.classifier, value: classifier })}
                disabled={setConfig.isPending}
              >
                Save classifier
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </PageWrapper>
  );
}
