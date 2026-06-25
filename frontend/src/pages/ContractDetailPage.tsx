import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Send, ArrowLeft, Copy, Building2, Link2, ExternalLink, Check } from "lucide-react";
import { api, apiError } from "../lib/api";
import type { Contract } from "../lib/types";
import { Badge, Modal, PageHeader } from "../components/ui";
import {
  CATEGORY_LABELS,
  CONTRACT_STATUS_COLORS,
  CONTRACT_STATUS_LABELS,
  formatCurrency,
  formatDate,
} from "../lib/format";

const SIG_STATUS: Record<string, string> = {
  AGUARDANDO: "Aguardando assinatura",
  ASSINADO: "Assinado",
  EXPIRADO: "Expirado",
};
const SIG_COLORS: Record<string, string> = {
  AGUARDANDO: "bg-amber-100 text-amber-800",
  ASSINADO: "bg-emerald-100 text-emerald-800",
  EXPIRADO: "bg-red-100 text-red-700",
};

export default function ContractDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState<Contract | null>(null);
  const [showSign, setShowSign] = useState(false);
  const [links, setLinks] = useState<{ link: string; dispatchChannel: string }[]>([]);
  const [error, setError] = useState("");

  const [sig, setSig] = useState({
    channel: "EMAIL",
    signerName: "",
    signerEmail: "",
    signerPhone: "",
    expiresInDays: 7,
  });

  function load() {
    api.get(`/contracts/${id}`).then((r) => {
      setContract(r.data);
      setSig((s) => ({ ...s, signerName: r.data.counterparty }));
    });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function sendSignature(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const { data } = await api.post(`/contracts/${id}/send-signature`, {
        ...sig,
        expiresInDays: Number(sig.expiresInDays),
        signerEmail: sig.signerEmail || null,
        signerPhone: sig.signerPhone || null,
      });
      setLinks(
        data.map((d: any) => ({ link: d.link, dispatchChannel: d.dispatchChannel }))
      );
      load();
    } catch (err) {
      setError(apiError(err, "Falha ao enviar"));
    }
  }

  if (!contract) return <p className="text-slate-500">Carregando...</p>;

  return (
    <div>
      <button onClick={() => navigate(-1)} className="mb-3 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft size={16} /> Voltar
      </button>

      <PageHeader
        title={contract.title}
        subtitle={`${CATEGORY_LABELS[contract.category]} • ${contract.counterparty}`}
        actions={
          contract.status === "RASCUNHO" || contract.status === "AGUARDANDO_ASSINATURA" ? (
            <button className="btn-primary" onClick={() => setShowSign(true)}>
              <Send size={16} /> Enviar para assinatura
            </button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h3 className="mb-3 font-semibold text-slate-700">Visualização do contrato</h3>
            <div className="min-h-[200px] whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              {contract.body || "Sem corpo de contrato preenchido."}
            </div>
            {contract.fieldValues && Object.keys(contract.fieldValues).length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-sm font-medium text-slate-600">Campos preenchidos</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(contract.fieldValues).map(([k, v]) => (
                    <div key={k} className="rounded border border-slate-200 px-3 py-2">
                      <span className="text-slate-400">{k}: </span>
                      <span className="text-slate-700">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <h3 className="mb-3 font-semibold text-slate-700">Histórico de assinaturas</h3>
            {contract.signatureRequests && contract.signatureRequests.length > 0 ? (
              <div className="space-y-2">
                {contract.signatureRequests.map((s) => (
                  <div key={s.id} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-slate-700">{s.signerName}</p>
                        <p className="text-xs text-slate-400">
                          {s.channel} • enviado {formatDate(s.sentAt)} • {s.attempts} tentativa(s)
                        </p>
                      </div>
                      <Badge className={SIG_COLORS[s.status]}>{SIG_STATUS[s.status]}</Badge>
                    </div>
                    {s.status === "AGUARDANDO" && s.token && <SignatureLink token={s.token} />}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">Nenhum envio realizado ainda.</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Status</span>
              <Badge className={CONTRACT_STATUS_COLORS[contract.status]}>
                {CONTRACT_STATUS_LABELS[contract.status]}
              </Badge>
            </div>
            <Row label="Valor" value={`${formatCurrency(contract.value)}${contract.isMonthly ? "/mês" : ""}`} />
            <Row label="Início" value={formatDate(contract.startDate)} />
            <Row label="Encerramento" value={formatDate(contract.endDate)} />
            <Row label="Vigência restante" value={contract.vigencia?.label ?? "-"} />
            <Row label="Documento da parte" value={contract.counterpartyDoc || "-"} />
            {contract.template && <Row label="Template" value={contract.template.name} />}
          </div>

          {contract.obras && contract.obras.length > 0 && (
            <div className="card">
              <h3 className="mb-2 flex items-center gap-2 font-semibold text-slate-700">
                <Building2 size={16} /> Obras vinculadas
              </h3>
              {contract.obras.map((o) => (
                <button
                  key={o.id}
                  onClick={() => navigate(`/obras/${o.id}`)}
                  className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-left text-sm hover:bg-slate-50"
                >
                  {o.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal open={showSign} onClose={() => { setShowSign(false); setLinks([]); }} title="Enviar para assinatura">
        {links.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-emerald-700">
              Envio registrado! Links de assinatura gerados (simulação de e-mail/WhatsApp):
            </p>
            {links.map((l) => (
              <div key={l.link} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                <p className="mb-1 text-xs font-medium uppercase text-slate-400">{l.dispatchChannel}</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate text-brand-700">{l.link}</code>
                  <button className="btn-secondary px-2 py-1" onClick={() => navigator.clipboard.writeText(l.link)}>
                    <Copy size={14} />
                  </button>
                </div>
                <a href={l.link.replace(window.location.origin, "")} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-brand-600 underline">
                  Abrir página de assinatura
                </a>
              </div>
            ))}
            <button className="btn-primary w-full" onClick={() => { setShowSign(false); setLinks([]); }}>
              Concluir
            </button>
          </div>
        ) : (
          <form onSubmit={sendSignature} className="space-y-3">
            <div>
              <label className="label">Canal de envio</label>
              <select className="input" value={sig.channel} onChange={(e) => setSig({ ...sig, channel: e.target.value })}>
                <option value="EMAIL">E-mail</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="AMBOS">Ambos</option>
              </select>
            </div>
            <div>
              <label className="label">Nome do signatário</label>
              <input className="input" value={sig.signerName} onChange={(e) => setSig({ ...sig, signerName: e.target.value })} required />
            </div>
            {(sig.channel === "EMAIL" || sig.channel === "AMBOS") && (
              <div>
                <label className="label">E-mail</label>
                <input type="email" className="input" value={sig.signerEmail} onChange={(e) => setSig({ ...sig, signerEmail: e.target.value })} />
              </div>
            )}
            {(sig.channel === "WHATSAPP" || sig.channel === "AMBOS") && (
              <div>
                <label className="label">WhatsApp</label>
                <input className="input" value={sig.signerPhone} onChange={(e) => setSig({ ...sig, signerPhone: e.target.value })} />
              </div>
            )}
            <div>
              <label className="label">Expira em (dias)</label>
              <input type="number" className="input" value={sig.expiresInDays} onChange={(e) => setSig({ ...sig, expiresInDays: Number(e.target.value) })} />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" className="btn-primary w-full">Enviar</button>
          </form>
        )}
      </Modal>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-700">{value}</span>
    </div>
  );
}

function SignatureLink({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}/assinar/${token}`;

  function copy() {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mt-2 flex items-center gap-2 border-t border-slate-100 pt-2">
      <Link2 size={14} className="shrink-0 text-slate-400" />
      <code className="flex-1 truncate rounded bg-slate-50 px-2 py-1 text-xs text-brand-700">{link}</code>
      <button type="button" className="btn-secondary shrink-0 px-2 py-1" title="Copiar link" onClick={copy}>
        {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
      </button>
      <a className="btn-secondary shrink-0 px-2 py-1" href={`/assinar/${token}`} target="_blank" rel="noreferrer" title="Abrir link">
        <ExternalLink size={14} />
      </a>
    </div>
  );
}
