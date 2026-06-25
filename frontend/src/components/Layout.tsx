import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  FileStack,
  PenLine,
  ClipboardCheck,
  Building2,
  ShoppingCart,
  BarChart3,
  Settings,
  Users,
  LogOut,
  HardHat,
} from "lucide-react";
import { useAuth } from "../store/auth";

const navGroups = [
  {
    label: "Contratos & Assinaturas",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
      { to: "/contratos", label: "Contratos", icon: FileText },
      { to: "/templates", label: "Templates", icon: FileStack },
      { to: "/contratos/novo", label: "Novo Contrato", icon: PenLine },
      { to: "/assinaturas", label: "Assinaturas", icon: ClipboardCheck },
      { to: "/gerenciador", label: "Gerenciador de Contratos", icon: ClipboardCheck },
    ],
  },
  {
    label: "Obras & Configurações",
    items: [
      { to: "/obras", label: "Obras", icon: Building2 },
      { to: "/ordens-compra", label: "Ordens de Compra", icon: ShoppingCart },
      { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
      { to: "/parametrizacao", label: "Parametrização", icon: Settings },
      { to: "/usuarios", label: "Gestão de Usuários", icon: Users },
    ],
  },
];

export default function Layout() {
  const { user, company, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 flex-col bg-slate-900 text-slate-300">
        <div className="flex items-center gap-2 px-5 py-5 text-white">
          <HardHat className="text-brand-400" />
          <div>
            <p className="text-sm font-bold leading-tight">Contratos</p>
            <p className="text-xs text-slate-400">& Orçamentos</p>
          </div>
        </div>
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-2">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                        isActive
                          ? "bg-brand-600 text-white"
                          : "text-slate-300 hover:bg-slate-800"
                      }`
                    }
                  >
                    <item.icon size={18} />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-slate-800 p-4">
          <p className="text-sm font-medium text-white">{user?.name}</p>
          <p className="truncate text-xs text-slate-400">{company?.name}</p>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="mt-3 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
          >
            <LogOut size={16} /> Sair
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-slate-100 p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
