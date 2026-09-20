import { Link } from "react-router";

const LoginPage = () => {
  return (
    <main>
      <h1>Sign in to CollabFlow</h1>
      <form>
        <div>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            name="email"
            id="email"
            placeholder="email@example.com"
          />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input
            type="password"
            name="password"
            id="password"
            placeholder="Enter you password"
          />
        </div>
        <button type="submit">Sign in</button>
      </form>
      <p>
        Don't have an account? <Link to="/register">Create an account</Link>
      </p>
    </main>
  );
};
export default LoginPage;
