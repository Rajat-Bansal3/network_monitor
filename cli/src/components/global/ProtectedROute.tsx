import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { checkAuth } from "@/api/auth";
import Loader from "@/components/global/Loader";

interface Props {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  const [isAuthed, setIsAuthed] = useState<null | boolean>(null);

  useEffect(() => {
    const verify = async () => {
      const ok = await checkAuth();
      setIsAuthed(ok);
    };
    verify();
  }, []);

  if (isAuthed === null)
    return (
      <div>
        <Loader />
      </div>
    );

  return isAuthed ? children : <Navigate to='/login' replace />;
}
