import { Link } from 'react-router-dom';

export function UserCard({ user }) {
  if (!user?.username) return null;
  return (
    <Link
      to={`/u/${user.username}`}
      className="flex items-center gap-3 hover:bg-slate-50 p-2 rounded-lg transition-colors"
    >
      <div className="h-9 w-9 rounded-full bg-eco-100 flex items-center justify-center text-eco-700 font-bold text-sm shrink-0">
        {user.username[0].toUpperCase()}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">@{user.username}</p>
        <p className="text-xs text-slate-400 font-mono">{user.totalPoints ?? 0} pts</p>
      </div>
    </Link>
  );
}
