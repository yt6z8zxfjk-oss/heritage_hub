import { useState } from "react";
import { api } from "../../api/api";
import "./AdminLogin.css";

export function AdminLogin({ onSuccess }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    if (!login.trim() || !password) {
      setError("Введите логин и пароль");
      return;
    }
    try {
      const data = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ login: login.trim(), password }),
      });
      localStorage.setItem("heritage-token", data.token);
      onSuccess(data.login);
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  return (
    <form className="admin-login" onSubmit={submit}>
      <h1>Войти</h1>
      <label className="field">
        <span>Логин</span>
        <input value={login} onChange={(event) => setLogin(event.target.value)} autoComplete="username" />
      </label>
      <label className="field">
        <span>Пароль</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
        />
      </label>
      {error ? <p className="field-error">{error}</p> : null}
      <button type="submit" className="btn btn-primary">
        Войти
      </button>
    </form>
  );
}
