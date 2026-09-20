import { Link } from "react-router";

const RegisterPage = () => {
  return (
    <main>
      <h1>Create your CollabFlow account</h1>
      <form>
        <div>
          <label htmlFor="name">Name</label>
          <input type="text" id="name" name="name" placeholder="Your name" />
        </div>
        <div>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="email@example.com"
          />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="Create a password"
          />
        </div>
        <button type="submit">Create account</button>
      </form>
      <p>
        Already have an account? <Link to="/login">Sing in</Link>
      </p>
    </main>
  );
};

export default RegisterPage;
