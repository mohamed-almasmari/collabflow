import {
  useEffect,
  useState,
} from "react";

import {
  getCurrentUser,
  type User,
} from "../../../api/auth";
import HealthStatus from "../../components/layout/HealthStatus/HealthStatus.tsx";

function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const currentUser = await getCurrentUser();

        setUser(currentUser);
      } catch {
        setUser(null);
      }
    }

    loadUser();
  }, []);

  return (
    <section>
      <h1>Dashboard</h1>

      {user && (
        <p>
          Welcome, {user.name}.
        </p>
      )}

      <HealthStatus />
    </section>
  );
}

export default DashboardPage;