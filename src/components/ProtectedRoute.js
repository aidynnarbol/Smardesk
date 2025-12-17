import { Navigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase";

export default function ProtectedRoute({ children }) {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        fontSize: "1.5rem",
        color: "var(--text-color)"
      }}>
        Загрузка...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/welcome" replace />;
  }

  return children;
}
