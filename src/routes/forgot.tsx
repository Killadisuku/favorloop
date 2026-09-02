import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/forgot")({ component: Forgot });

function Forgot() {
  return <Navigate to="/app" />;
}
