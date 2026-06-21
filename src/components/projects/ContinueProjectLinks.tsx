import Link from "next/link";

type ContinueProjectLinksProps = {
  projectId: string;
};

export function ContinueProjectLinks({ projectId }: ContinueProjectLinksProps) {
  const query = `?projectId=${projectId}`;

  return (
    <div className="terminal-card w-full max-w-[240px] shrink-0 p-2.5 sm:ml-auto">
      <p className="text-[10px] leading-4 text-lp-subtle">
        Add more context, then publish again to update this project.
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Link href={`/interview-chat${query}`} className="btn-secondary px-2 py-1 text-[10px]">
          Continue in chat
        </Link>
        <Link href={`/interview-voice${query}`} className="btn-secondary px-2 py-1 text-[10px]">
          Continue in voice
        </Link>
      </div>
    </div>
  );
}
