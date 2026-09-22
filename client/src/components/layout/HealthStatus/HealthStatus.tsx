import { useEffect, useState } from "react";

import {
  getHealth,
  type HealthResponse,
} from "../../../../api/health.tsx";

function HealthStatus() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHealth() {
      try {
        const data = await getHealth();

        setHealth(data);
      } catch {
        setError("Unable to connect to the CollabFlow API.");
      } finally {
        setLoading(false);
      }
    }

    loadHealth();
  }, []);

  if (loading) {
    return <p>Checking system status...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div>
      <h2>System Status</h2>

      <p>API: {health?.status}</p>
      <p>Service: {health?.service}</p>
      <p>Database: {health?.database}</p>
    </div>
  );
}

export default HealthStatus;