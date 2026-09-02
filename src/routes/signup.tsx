import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/signup")({ component: Signup });

function Signup() {
  return <Navigate to="/app" />;
}
