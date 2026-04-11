import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/Sheet';
import { Leaf, Trophy, User, LogOut, Shield, ChevronDown, Menu, Rss, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';

function NavLinks({ className = '', onNavigate }) {
  const { user } = useAuthStore();
  const go = onNavigate || (() => {});
  const item = (extra) => cn('hover:text-slate-900 flex items-center gap-1 text-sm font-medium text-slate-600', extra, className);

  return (
    <>
      <Link to="/" className={item()} onClick={go}>
        Home
      </Link>
      <Link to="/leaderboard" className={item()} onClick={go}>
        <Trophy className="h-4 w-4" /> Leaderboard
      </Link>
      {user && (
        <>
          <Link to="/feed" className={item()} onClick={go}>
            <Rss className="h-4 w-4" /> Feed
          </Link>
          <Link to="/dashboard" className={item()} onClick={go}>
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </Link>
          <Link to="/classify" className={item()} onClick={go}>
            Classify
          </Link>
        </>
      )}
      {['moderator', 'administrator'].includes(user?.role) && (
        <Link to="/mod" className={item()} onClick={go}>
          <Shield className="h-4 w-4" /> Mod
        </Link>
      )}
      {user?.role === 'administrator' && (
        <Link to="/admin" className={item()} onClick={go}>
          Admin
        </Link>
      )}
    </>
  );
}

export function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2 shrink-0">
          <Leaf className="h-5 w-5 text-eco-600" />
          <span className="font-bold text-lg tracking-tight font-display">EcoCycle</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <NavLinks />
        </nav>

        <div className="flex items-center gap-2">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[min(100vw,20rem)] pt-10">
              <SheetHeader>
                <SheetTitle className="font-display text-left">Menu</SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-1 text-slate-700">
                <NavLinks className="py-2 px-2 rounded-md" onNavigate={() => setMobileOpen(false)} />
              </nav>
            </SheetContent>
          </Sheet>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:block max-w-[10rem] truncate">{user.username}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate(`/u/${user.username}`)}>Profile</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/submissions')}>My Submissions</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/register">Sign up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
