export type Role = "ADMIN" | "GESTOR" | "OPERADOR";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  companyId: string;
}

export interface Company {
  id: string;
  name: string;
  cnpj?: string;
}

export type ContractStatus =
  | "RASCUNHO"
  | "AGUARDANDO_ASSINATURA"
  | "ASSINADO"
  | "ATIVO"
  | "VENCENDO"
  | "ENCERRADO"
  | "EXPIRADO";

export type ContractCategory = "SERVICO" | "TRABALHO" | "OBRA" | "LOCACAO" | "OUTRO";

export interface Vigencia {
  daysRemaining: number | null;
  monthsRemaining: number | null;
  label: string;
}

export interface Contract {
  id: string;
  title: string;
  category: ContractCategory;
  status: ContractStatus;
  counterparty: string;
  counterpartyDoc?: string | null;
  value: number;
  isMonthly: boolean;
  startDate?: string | null;
  endDate?: string | null;
  templateId?: string | null;
  body?: string | null;
  fieldValues?: Record<string, unknown> | null;
  signedAt?: string | null;
  createdAt: string;
  vigencia: Vigencia;
  template?: { name: string } | null;
  signatureRequests?: SignatureRequest[];
  obras?: { id: string; name: string; status: string }[];
}

export interface SignatureRequest {
  id: string;
  channel: "EMAIL" | "WHATSAPP" | "AMBOS";
  status: "AGUARDANDO" | "ASSINADO" | "EXPIRADO";
  signerName: string;
  signerEmail?: string | null;
  signerPhone?: string | null;
  token: string;
  sentAt: string;
  signedAt?: string | null;
  expiresAt?: string | null;
  attempts: number;
  contract?: { id: string; title: string; counterparty: string };
}

export interface TemplateField {
  id?: string;
  key: string;
  label: string;
  type: string;
  required: boolean;
  order: number;
}

export interface Template {
  id: string;
  name: string;
  category: ContractCategory;
  description?: string | null;
  body: string;
  fields: TemplateField[];
  _count?: { contracts: number };
}

export type ObraStatus = "PLANEJAMENTO" | "EM_EXECUCAO" | "CONCLUIDA" | "PARALISADA";

export interface ObraStep {
  id: string;
  title: string;
  phase: "PLANEJAMENTO" | "EXECUCAO" | "ENTREGA";
  status: "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDO";
  order: number;
  dueDate?: string | null;
  completedAt?: string | null;
}

export interface ObraCusto {
  id: string;
  description: string;
  categoria: string;
  amount: number;
  date: string;
  isMaintenance: boolean;
}

export interface ObraVistoria {
  id: string;
  tipo: "INICIAL" | "FINAL";
  description: string;
  createdAt: string;
  uploads: UploadFile[];
}

export interface UploadFile {
  id: string;
  url: string;
  originalName: string;
  mimeType: string;
}

export interface Obra {
  id: string;
  name: string;
  description?: string | null;
  address?: string | null;
  status: ObraStatus;
  budgetPlanned: number;
  budgetRealized: number;
  budgetBalance: number;
  budgetUsedPct: number;
  startDate?: string | null;
  endDate?: string | null;
  contractId?: string | null;
  contract?: { id: string; title: string; category?: string } | null;
  steps?: ObraStep[];
  custos?: ObraCusto[];
  vistorias?: ObraVistoria[];
  purchaseOrders?: PurchaseOrder[];
  _count?: { steps: number; vistorias: number; purchaseOrders: number };
}

export interface PayerCompany {
  id: string;
  name: string;
  cnpj: string;
}

export interface PurchaseOrder {
  id: string;
  number: string;
  supplier: string;
  description?: string | null;
  amount: number;
  status: "ABERTA" | "APROVADA" | "RECEBIDA" | "CANCELADA";
  createdAt: string;
  payer: PayerCompany;
  obra?: { id: string; name: string };
}

export interface DashboardMetrics {
  contracts: {
    total: number;
    totalValue: number;
    byStatus: Record<string, number>;
    byCategory: Record<string, number>;
    vencendo: number;
    pendingSignatures: number;
  };
  obras: {
    total: number;
    byStatus: Record<string, number>;
    budgetPlanned: number;
    budgetRealized: number;
    budgetBalance: number;
  };
  purchaseOrders: { total: number; totalValue: number };
}
