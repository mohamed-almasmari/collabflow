import {
  Link,
  Outlet,
  useNavigate,
} from "react-router";

import { useAuth } from "../../hooks/useAuth";

function AppLayout() {
  const navigate = useNavigate();

  const {
    user,
    logout,
  } = useAuth();

  function handleLogout() {
    logout();

    navigate("/login", {
      replace: true,
    });
  }

  return (
    <div>
      <header>
        <nav>
          <Link to="/dashboard">
            CollabFlow
          </Link>

          <span>
            {user?.name}
          </span>

          <button
            type="button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </nav>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;