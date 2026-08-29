import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import ChatWidget from "./components/ChatWidget";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./components/AdminLayout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import RecoverPassword from "./pages/RecoverPassword";
import Dietas from "./pages/Dietas";
import Pagamento from "./pages/Pagamento";
import Perfil from "./pages/Perfil";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsuarios from "./pages/AdminUsuarios";
import AdminPagamentos from "./pages/AdminPagamentos";

function Router() {
  return (
    <Switch>
      {/* Rotas públicas */}
      <Route path="/" component={Login} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/recuperar-senha" component={RecoverPassword} />

      {/* Rotas protegidas — apenas usuários autenticados */}
      <Route path="/home">
        {() => <ProtectedRoute component={Home} />}
      </Route>
      <Route path="/dietas">
        {() => <ProtectedRoute component={Dietas} />}
      </Route>
      <Route path="/pagamento">
        {() => <ProtectedRoute component={Pagamento} />}
      </Route>
      <Route path="/perfil">
        {() => <ProtectedRoute component={Perfil} />}
      </Route>

      {/* Rotas admin — apenas role=admin */}
      <Route path="/admin">
        {() => (
          <ProtectedRoute adminOnly component={() => (
            <AdminLayout><AdminDashboard /></AdminLayout>
          )} />
        )}
      </Route>
      <Route path="/admin/usuarios">
        {() => (
          <ProtectedRoute adminOnly component={() => (
            <AdminLayout><AdminUsuarios /></AdminLayout>
          )} />
        )}
      </Route>
      <Route path="/admin/pagamentos">
        {() => (
          <ProtectedRoute adminOnly component={() => (
            <AdminLayout><AdminPagamentos /></AdminLayout>
          )} />
        )}
      </Route>

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
          <ChatWidget />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
