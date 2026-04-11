import { useState } from 'react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { useAdminUsers, useChangeRole } from '@/hooks/useAdmin';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { Skeleton } from '@/components/ui/Skeleton';
import { Input } from '@/components/ui/Input';
import { ROLES } from '@/lib/constants';
import { formatDate } from '@/lib/utils';

export default function UserManagement() {
  const [search, setSearch] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [nextRole, setNextRole] = useState('citizen');
  const { data, isLoading } = useAdminUsers({ limit: 100, skip: 0 });
  const changeRole = useChangeRole();

  const users = data?.users ?? [];
  const filtered = search
    ? users.filter(
        (u) =>
          u.username?.toLowerCase().includes(search.toLowerCase()) ||
          u.email?.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  const apply = () => {
    if (!confirm) return;
    changeRole.mutate({ id: confirm._id, role: nextRole }, { onSuccess: () => setConfirm(null) });
  };

  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Users</h1>

      <div className="mb-4 max-w-sm">
        <Input
          placeholder="Search username or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-lg border bg-white overflow-x-auto">
        {isLoading ? (
          <div className="p-8">
            <Skeleton className="h-12 w-full mb-2" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Points</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u._id}>
                  <TableCell className="font-medium">{u.username}</TableCell>
                  <TableCell className="text-slate-600 text-sm">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">{u.totalPoints ?? 0}</TableCell>
                  <TableCell className="text-sm text-slate-500">{u.createdAt ? formatDate(u.createdAt) : '—'}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setConfirm(u);
                        setNextRole(u.role);
                      }}
                    >
                      Change role
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change role</DialogTitle>
            <DialogDescription>
              Update role for <strong>{confirm?.username}</strong>. This takes effect immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm capitalize"
              value={nextRole}
              onChange={(e) => setNextRole(e.target.value)}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button onClick={apply} disabled={changeRole.isPending}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
