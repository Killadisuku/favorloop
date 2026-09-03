import { useEffect, useState } from "react";
import type { PersonaRow, ProfileMe } from "@/lib/types";
import { listPersonas, switchUser } from "@/lib/loop";

export function PersonaSwitch({ me, compact }: { me: ProfileMe; compact?: boolean }) {
  const [rows, setRows] = useState<PersonaRow[]>([]);
  useEffect(() => {
    void listPersonas().then((res) => {
      if (res.ok) setRows(res.data);
    });
  }, [me.userId]);
  if (rows.length === 0) return null;
  return (
    <label className={`persona-switch ${compact ? "compact" : ""}`}>
      <span className="tiny">Try as</span>
      <select
        className="input"
        value={me.userId}
        aria-label="Switch test person"
        onChange={async (e) => {
          const res = await switchUser({ data: { userId: e.target.value } });
          if (res.ok) window.location.assign("/app");
        }}
      >
        {rows.map((p) => (
          <option key={p.userId} value={p.userId}>
            {p.name} · {p.role}
          </option>
        ))}
      </select>
    </label>
  );
}
