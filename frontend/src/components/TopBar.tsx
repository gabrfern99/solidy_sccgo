import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, CheckCheck, Trash2, X } from "lucide-react";
import { useAuth } from "../store/auth";
import { useNotifications, type AppNotification } from "../store/notifications";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min} min atrás`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h atrás`;
  const d = Math.floor(h / 24);
  return `${d} d atrás`;
}

export default function TopBar() {
  const { user, company, token } = useAuth();
  const { items, fetch, connect, markRead, markAllRead, remove, clear, unread } =
    useNotifications();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) return;
    fetch();
    connect(token);
  }, [token, fetch, connect]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const unreadCount = unread();

  function handleClick(n: AppNotification) {
    if (!n.read) markRead(n.id);
    if (n.entityType === "contract" && n.entityId) {
      setOpen(false);
      navigate(`/contratos/${n.entityId}`);
    }
  }

  const initials = (user?.name ?? "?")
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-end gap-3 border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
      <div className="relative" ref={panelRef}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          title="Notificações"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-semibold text-slate-700">Notificações</p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => markAllRead()}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-brand-600"
                  title="Marcar todas como lidas"
                  disabled={unreadCount === 0}
                >
                  <CheckCheck size={16} />
                </button>
                <button
                  onClick={() => clear()}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-500"
                  title="Limpar todas"
                  disabled={items.length === 0}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-slate-400">
                  Nenhuma notificação.
                </p>
              ) : (
                items.map((n) => (
                  <div
                    key={n.id}
                    className={`group flex items-start gap-2 border-b border-slate-50 px-4 py-3 text-sm last:border-0 ${
                      n.read ? "bg-white" : "bg-brand-50/50"
                    }`}
                  >
                    <button
                      onClick={() => handleClick(n)}
                      className="flex-1 text-left"
                    >
                      <p className="flex items-center gap-2 font-medium text-slate-700">
                        {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
                        {n.title}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">{n.message}</p>
                      <p className="mt-1 text-[11px] text-slate-400">{timeAgo(n.createdAt)}</p>
                    </button>
                    <div className="flex shrink-0 flex-col gap-1 opacity-0 transition group-hover:opacity-100">
                      {!n.read && (
                        <button
                          onClick={() => markRead(n.id)}
                          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-brand-600"
                          title="Marcar como lida"
                        >
                          <Check size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => remove(n.id)}
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-500"
                        title="Remover"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium leading-tight text-slate-700">{user?.name}</p>
          <p className="text-xs text-slate-400">{company?.name}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
          {initials}
        </div>
      </div>
    </header>
  );
}
