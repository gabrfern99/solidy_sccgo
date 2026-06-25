import { useEffect, useState } from "react";
import { Plus, UserCog } from "lucide-react";
import { api, apiError } from "../lib/api";
import { Badge, Modal, PageHeader } from "../components/ui";
import { formatDate } from "../lib/format";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  GESTOR: "Gestor",
  OPERADOR: "Operador",
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "OPERADOR" });

  function load() {
    api.get("/users").then((r) => setUsers(r.data));
  }
  useEffect(load, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/users", form);
      setOpen(false);
      setForm({ name: "", email: "", password: "", role: "OPERADOR" });
      load();
    } catch (err) {
      setError(apiError(err, "Falha ao criar usuário"));
    }
  }

  async function toggleActive(u: UserRow) {
    await api.put(`/users/${u.id}`, { active: !u.active });
    load();
  }

  return (
    <div>
      <PageHeader
        title="Gestão de Usuários"
        subtitle="Usuários da empresa (multi-tenant)"
        actions={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Novo Usuário</button>}
      />

      <div className="card p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Perfil</th>
              <th className="px-4 py-3">Criado em</th>
              <th className="px-4 py-3">Situação</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-700">
                  <span className="flex items-center gap-2"><UserCog size={16} className="text-slate-400" /> {u.name}</span>
                </td>
                <td className="px-4 py-3 text-slate-600">{u.email}</td>
                <td className="px-4 py-3"><Badge className="bg-brand-50 text-brand-700">{ROLE_LABELS[u.role]}</Badge></td>
                <td className="px-4 py-3 text-slate-500">{formatDate(u.createdAt)}</td>
                <td className="px-4 py-3">
                  <Badge className={u.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}>
                    {u.active ? "Ativo" : "Inativo"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="btn-secondary px-2 py-1 text-xs" onClick={() => toggleActive(u)}>
                    {u.active ? "Desativar" : "Ativar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Novo Usuário">
        <form onSubmit={save} className="space-y-3">
          <div>
            <label className="label">Nome</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">E-mail</label>
            <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <label className="label">Senha</label>
            <input type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          <div>
            <label className="label">Perfil</label>
            <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="btn-primary w-full">Criar usuário</button>
        </form>
      </Modal>
    </div>
  );
}
