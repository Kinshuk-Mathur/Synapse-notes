import { AuthGate } from "@/features/auth/auth-gate";
import { NotesWorkspace } from "@/features/notes/components/notes-workspace";

export default function Home() {
  return (
    <AuthGate>
      <NotesWorkspace />
    </AuthGate>
  );
}
