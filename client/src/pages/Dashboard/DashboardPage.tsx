import HealthStatus from "../../components/layout/HealthStatus/HealthStatus";
import { useAuth } from "../../hooks/useAuth";

function DashboardPage() {
  const { user } = useAuth();

  return (
    <section>
      <h1>Dashboard</h1>

      <p>
        Welcome, {user?.name}.
      </p>

      <HealthStatus />
    </section>
  );
}

export default DashboardPage;