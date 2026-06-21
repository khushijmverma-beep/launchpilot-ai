import Link from "next/link";

type ContinueProjectLinksProps = {
  projectId: string;
};

export function ContinueProjectLinks({ projectId }: ContinueProjectLinksProps) {
  const query = `?projectId=${projectId}`;

  return (
    <div className="terminal-card w-full p-2">
      <p className="break-words text-[10px] leading-snug text-lp-subtle">
        Add context, then publish to update.
      </p>
      <div className="mt-1.5 flex flex-col gap-1">
        <Link
          href={`/interview-chat${query}`}
          className="btn-secondary w-full break-words px-2 py-1 text-center text-[10px] leading-snug"
        >
          Continue in chat
        </Link>
        <Link
          href={`/interview-voice${query}`}
          className="btn-secondary w-full break-words px-2 py-1 text-center text-[10px] leading-snug"
        >
          Continue in voice
        </Link>
      </div>
    </div>
  );
}
