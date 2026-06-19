import Link from "next/link";

type ContinueProjectLinksProps = {
  projectId: string;
};

export function ContinueProjectLinks({ projectId }: ContinueProjectLinksProps) {
  const query = `?projectId=${projectId}`;

  return (
    <div className="terminal-card flex flex-wrap items-center gap-3 p-5">
      <p className="text-sm text-lp-muted">Add more context, then publish again to update this project.</p>
      <Link href={`/interview-chat${query}`} className="btn-secondary">
        Continue in chat
      </Link>
      <Link href={`/interview-voice${query}`} className="btn-secondary">
        Continue in voice
      </Link>
    </div>
  );
}
