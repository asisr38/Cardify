import { NavLink, useLocation } from 'react-router-dom';
import { Users, CalendarDays, FileText, Settings as SettingsIcon } from 'lucide-react';
import { cn } from '../lib/utils';

const items = [
  { to: '/', label: 'Contacts', icon: Users, end: true },
  { to: '/events', label: 'Events', icon: CalendarDays, end: false },
  { to: '/templates', label: 'Templates', icon: FileText, end: false },
  { to: '/settings', label: 'Settings', icon: SettingsIcon, end: false },
];

export function BottomNav() {
  const { pathname } = useLocation();
  if (pathname.startsWith('/auth')) return null;
  // Hide tab bar during full-screen scan / composer flows for focus.
  if (pathname.includes('/scan') || pathname.endsWith('/compose')) return null;

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="pointer-events-auto mx-auto max-w-[430px] border-t border-[hsl(40_54%_89%/0.08)] bg-card">
        <div className="flex items-stretch px-2 pb-6 pt-2">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex flex-1 flex-col items-center justify-center gap-1 py-1.5 text-[10px] font-medium tracking-wide transition-colors',
                  isActive ? 'text-gold' : 'text-muted-dim hover:text-muted-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
                  <span className={cn(isActive && 'font-semibold')}>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
