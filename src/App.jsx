import { useState, useEffect } from "react";
import { supabase } from "./lib/supabaseClient";
import Login from "./components/Login";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import GestaoClientes from "./components/GestaoClientes";
import EntradasExtras from "./components/EntradasExtras";
import Despesas from "./components/Despesas";

export default function App() {
  const [session, setSession] = useState(undefined);
  const [aba, setAba] = useState("dashboard");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, novaSessao) => {
      setSession(novaSessao);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div style={{ backgroundColor: "#07070B", minHeight: "100vh", color: "#8B8B93" }} className="flex items-center justify-center text-sm">
        Carregando...
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  return (
    <Layout aba={aba} onAbaChange={setAba} onSignOut={() => supabase.auth.signOut()}>
      {aba === "dashboard" && <Dashboard />}
      {aba === "clientes" && <GestaoClientes />}
      {aba === "entradas" && <EntradasExtras />}
      {aba === "despesas" && <Despesas />}
    </Layout>
  );
}
