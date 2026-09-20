import { Link, Outlet } from "react-router";

const AppLayout = () => {
  return (
    <div>
      <header>
        <nav>
          <Link to="/dashboard">CollabFlow</Link>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
};
export default AppLayout;
