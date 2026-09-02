import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/reset")({ component: Reset });

function Reset() {
  return <Navigate to="/app" />;
}
