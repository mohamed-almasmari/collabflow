import {
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Navigate } from "react-router";

import { getCurrentUser } from "../../../api/auth";
import { removeAccessToken } from "../../utils/authToken";

interface ProtectedRouteProps {
  children: ReactNode;
}

function ProtectedRoute({
  children,
}: ProtectedRouteProps) {
  const [authenticated, setAuthenticated] =
    useState<boolean | null>(null);

  useEffect(() => {
    async function verifyAuthentication() {
      try {
        await getCurrentUser();

        setAuthenticated(true);
      } catch {
        removeAccessToken();

        setAuthenticated(false);
      }
    }

    verifyAuthentication();
  }, []);

  if (authenticated === null) {
    return <p>Checking authentication...</p>;
  }

  if (!authenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return children;
}

export default ProtectedRoute;
