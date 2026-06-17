# Workspace Architecture

LaunchPilot uses a persistent Launch Brief Workspace as the project brain.

## Workspace Item Types

- Founder Snapshot
- Refined Idea
- Research Notes
- Competitors / Alternatives
- Assumptions
- Risks
- MVP Plan
- Current Bottleneck
- Founder Reality Check
- Roadmap
- Pitch Assets
- Opportunity Cards
- Saved Decisions
- Sources

## Write Path

The founder interview creates a `FounderProfile`. The agent engine converts that profile into a `LaunchBrief` and writes structured `WorkspaceItem` records.

## Read Path

The dashboard, Copilot, and exports read from the workspace cards. This keeps important decisions visible after chat scrolls away.

## Clearing Context

The Privacy page clears local storage keys:

- `launchpilot-user`
- `launchpilot-profile`
- `launchpilot-brief`

## Production Path

For production, replace browser local storage with a database table for profiles, workspace items, sources, agent outputs, and chat history.
