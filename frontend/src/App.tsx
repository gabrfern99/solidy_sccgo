import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./store/auth";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ContractsPage from "./pages/ContractsPage";
import ContractDetailPage from "./pages/ContractDetailPage";
import NewContractPage from "./pages/NewContractPage";
import TemplatesPage from "./pages/TemplatesPage";
import SignaturesPage from "./pages/SignaturesPage";
import ManagerPage from "./pages/ManagerPage";
import ObrasPage from "./pages/ObrasPage";
import ObraDetailPage from "./pages/ObraDetailPage";
import PurchaseOrdersPage from "./pages/PurchaseOrdersPage";
import ReportsPage from "./pages/ReportsPage";
import ConfigPage from "./pages/ConfigPage";
import UsersPage from "./pages/UsersPage";
import SignPage from "./pages/SignPage";

function Protected({ children }: { children: JSX.Element }) {
  const token = useAuth((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const loadMe = useAuth((s) => s.loadMe);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/assinar/:token" element={<SignPage />} />

      <Route
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/contratos" element={<ContractsPage />} />
        <Route path="/contratos/novo" element={<NewContractPage />} />
        <Route path="/contratos/:id" element={<ContractDetailPage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/assinaturas" element={<SignaturesPage />} />
        <Route path="/gerenciador" element={<ManagerPage />} />
        <Route path="/obras" element={<ObrasPage />} />
        <Route path="/obras/:id" element={<ObraDetailPage />} />
        <Route path="/ordens-compra" element={<PurchaseOrdersPage />} />
        <Route path="/relatorios" element={<ReportsPage />} />
        <Route path="/parametrizacao" element={<ConfigPage />} />
        <Route path="/usuarios" element={<UsersPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
