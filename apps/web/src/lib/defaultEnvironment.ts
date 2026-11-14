import { scopeProjectRef } from "@t3tools/client-runtime/environment";
import {
  deriveLogicalProjectKeyFromSettings,
  type ProjectGroupingSettings,
} from "@t3tools/client-runtime/state/project-grouping";
import type { EnvironmentProject } from "@t3tools/client-runtime/state/shell";
import type { EnvironmentId, ScopedProjectRef } from "@t3tools/contracts";

/**
 * The default machine's copy of the requested project, when that machine is connected and
 * has one. Otherwise the requested project, so a thread never lands on an unreachable machine.
 */
export function resolveDefaultEnvironmentProjectRef(input: {
  readonly projectRef: ScopedProjectRef;
  readonly projects: ReadonlyArray<EnvironmentProject>;
  readonly groupingSettings: ProjectGroupingSettings;
  readonly defaultEnvironmentId: EnvironmentId | null;
  readonly connectedEnvironmentIds: ReadonlyArray<EnvironmentId>;
}): ScopedProjectRef {
  const { projectRef, defaultEnvironmentId } = input;
  if (
    defaultEnvironmentId === null ||
    projectRef.environmentId === defaultEnvironmentId ||
    !input.connectedEnvironmentIds.includes(defaultEnvironmentId)
  ) {
    return projectRef;
  }
  const requested = input.projects.find(
    (project) =>
      project.environmentId === projectRef.environmentId && project.id === projectRef.projectId,
  );
  if (!requested) return projectRef;
  // Scratch projects group together so a scratch thread follows the default machine too.
  const logicalKeyOf = (project: EnvironmentProject) =>
    deriveLogicalProjectKeyFromSettings(project, input.groupingSettings, {
      groupScratchProjects: true,
    });
  const requestedKey = logicalKeyOf(requested);
  const target = input.projects.find(
    (project) =>
      project.environmentId === defaultEnvironmentId &&
      project.archivedAt == null &&
      logicalKeyOf(project) === requestedKey,
  );
  return target ? scopeProjectRef(target.environmentId, target.id) : projectRef;
}
