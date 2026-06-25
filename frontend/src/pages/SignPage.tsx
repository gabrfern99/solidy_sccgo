import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, FileSignature, Loader2 } from "lucide-react";
import { api, apiError } from "../lib/api";

export default function SignPage() {
  const { token } = useParams();
  const [info, setInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/signatures/${token}`)
      .then((r) => setInfo(r.data))
      .catch((e) => setError(apiError(e, "Link inválido")))
      .finally(() => setLoading(false));
  }, [token]);

  async function sign() {
    setSigning(true);
    setError("");
    try {
      await api.post(`/signatures/${token}/sign`);
      setSigned(true);
    } catch (e) {
      setError(apiError(e, "Não foi possível assinar"));
    } finally {
      setSigning(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white p-8 shadow-xl">
        {loading ? (
          <div className="flex items-center gap-2 text-slate-500">
            <Loader2 className="animate-spin" /> Carregando...
          </div>
        ) : error && !info ? (
          <p className="text-center text-red-600">{error}</p>
        ) : signed || info?.status === "ASSINADO" ? (
          <div className="text-center">
            <CheckCircle2 className="mx-auto mb-3 text-emerald-500" size={56} />
            <h1 className="text-xl font-bold text-slate-800">Contrato assinado!</h1>
            <p className="mt-2 text-sm text-slate-500">
              Obrigado, {info?.signerName}. Sua assinatura foi registrada e o sistema foi notificado.
            </p>
          </div>
        ) : (
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-xl bg-brand-600 p-2 text-white">
                <FileSignature />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">{info?.contract?.title}</h1>
                <p className="text-sm text-slate-500">Assinatura solicitada a {info?.signerName}</p>
              </div>
            </div>
            <div className="mb-5 max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 whitespace-pre-wrap">
              {info?.contract?.body || "Documento contratual entre as partes."}
            </div>
            {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
            <button onClick={sign} disabled={signing} className="btn-primary w-full">
              {signing ? "Assinando..." : "Assinar contrato"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
