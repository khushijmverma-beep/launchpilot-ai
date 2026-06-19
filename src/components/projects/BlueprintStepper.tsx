type BlueprintStepperProps = {
  blueprint: string[];
};

function parseStep(step: string) {
  const colonIndex = step.indexOf(":");
  if (colonIndex === -1) {
    return { horizon: null as string | null, title: step };
  }

  const horizon = step.slice(0, colonIndex).trim();
  const title = step.slice(colonIndex + 1).trim();
  return { horizon: horizon || null, title: title || step };
}

function Connector({ fromLeft }: { fromLeft: boolean }) {
  const path = fromLeft
    ? "M 22 0 L 22 22 L 78 22 L 78 44"
    : "M 78 0 L 78 22 L 22 22 L 22 44";

  return (
    <svg
      className="blueprint-connector"
      viewBox="0 0 100 44"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path d={path} fill="none" stroke="rgba(255, 255, 255, 0.22)" strokeWidth="1.5" />
    </svg>
  );
}

export function BlueprintStepper({ blueprint }: BlueprintStepperProps) {
  if (blueprint.length === 0) {
    return (
      <div className="terminal-card p-6">
        <p className="font-mono text-sm text-lp-muted">
          Blueprint steps will appear once there is enough interview data to generate a build roadmap.
        </p>
      </div>
    );
  }

  return (
    <div className="blueprint-flow">
      <div className="blueprint-glow" aria-hidden />

      <ol className="blueprint-steps">
        {blueprint.map((step, index) => {
          const { horizon, title } = parseStep(step);
          const alignLeft = index % 2 === 0;

          return (
            <li key={`${index}-${step.slice(0, 24)}`} className="blueprint-step">
              <article
                className={`blueprint-step-card ${alignLeft ? "blueprint-step-card--left" : "blueprint-step-card--right"}`}
              >
                <div className="blueprint-step-index">{index + 1}</div>
                <div className="blueprint-step-body">
                  {horizon ? (
                    <>
                      <p className="mono-label">{horizon}</p>
                      <p className="mt-1 text-sm leading-6 text-lp-muted">{title}</p>
                    </>
                  ) : (
                    <p className="text-sm leading-6 text-lp-muted">{title}</p>
                  )}
                </div>
              </article>

              {index < blueprint.length - 1 && <Connector fromLeft={alignLeft} />}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
