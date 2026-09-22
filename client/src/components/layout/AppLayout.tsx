import {
  Link,
  Outlet,
  useNavigate,
} from "react-router";

import { removeAccessToken } from "../../utils/authToken";

function AppLayout() {
  const navigate = useNavigate();

  function handleLogout() {
    removeAccessToken();

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