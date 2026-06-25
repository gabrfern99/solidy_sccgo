import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardCheck } from "lucide-react";
import { api } from "../lib/api";
import type { SignatureRequest } from "../lib/types";
import { Badge, EmptyState, PageHeader } from "../components/ui";
import { formatDate } from "../lib/format";

export default function SignaturesPage() {
  const [items, setItems] = useState<SignatureRequest[]>([]);

  useEffect(() => {
    api.get("/contracts/signatures/pending").then((r) => setItems(r.data));
  }, []);

  return (
    <div>
      <PageHeader title="Assinaturas" subtitle="Fila e status de assinaturas pendentes" />

      {items.length === 0 ? (
        <EmptyState message="Nenhuma assinatura pendente." />
      ) : (
        <div className="space-y-3">
          {items.map((s) => (
            <div key={s.id} className="card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-100 p-2 text-amber-700">
                  <ClipboardCheck size={20} />
                </div>
                <div>
                  <Link to={`/contratos/${s.contract?.id}`} className="font-medium text-slate-800 hover:text-brand-600">
                    {s.contract?.title}
                  </Link>
                  <p className="text-sm text-slate-500">
                    {s.signerName} • {s.channel} • enviado {formatDate(s.sentAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {s.expiresAt && <span className="text-xs text-slate-400">Expira {formatDate(s.expiresAt)}</span>}
                <Badge className="bg-amber-100 text-amber-800">Aguardando</Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
