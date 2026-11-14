import type { EnvironmentProject } from "@t3tools/client-runtime/state/shell";
import type { EnvironmentId, ProjectId } from "@t3tools/contracts";
import { describe, expect, it } from "vite-plus/test";

import { resolveDefaultEnvironmentProjectRef } from "./defaultEnvironment";

const local = "env-local" as EnvironmentId;
const vps = "env-vps" as EnvironmentId;

function project(
  environmentId: EnvironmentId,
  id: string,
  overrides: Partial<EnvironmentProject> = {},
): EnvironmentProject {
  return {
    environmentId,
    id: id as ProjectId,
    title: id,
    workspaceRoot: `/work/${id}`,
    repositoryIdentity: {
      canonicalKey: "github.com/acme/app",
      locator: { source: "git-remote", remoteName: "origin", remoteUrl: "git@github.com:acme/app" },
    },
    defaultModelSelection: null,
    scripts: [],
    createdAt: "2026-11-14T00:00:00.000Z",
    updatedAt: "2026-11-14T00:00:00.000Z",
    ...overrides,
  } as EnvironmentProject;
}

const groupingSettings = {
  sidebarProjectGroupingMode: "repository",
  sidebarProjectGroupingOverrides: {},
} as const;

const resolve = (
  projects: ReadonlyArray<EnvironmentProject>,
  options: {
    defaultEnvironmentId?: EnvironmentId | null;
    connected?: ReadonlyArray<EnvironmentId>;
  } = {},
) =>
  resolveDefaultEnvironmentProjectRef({
    projectRef: { environmentId: local, projectId: "app-local" as ProjectId },
    projects,
    groupingSettings,
    defaultEnvironmentId:
      options.defaultEnvironmentId === undefined ? vps : options.defaultEnvironmentId,
    connectedEnvironmentIds: options.connected ?? [local, vps],
  });

describe("resolveDefaultEnvironmentProjectRef", () => {
  const shared = [project(local, "app-local"), project(vps, "app-vps")];
  const requested = { environmentId: local, projectId: "app-local" };

  it("moves the thread to the default machine's copy of the same repository", () => {
    expect(resolve(shared)).toEqual({ environmentId: vps, projectId: "app-vps" });
  });

  it("keeps the requested project when no default, the default is offline, or it lacks the project", () => {
    expect(resolve(shared, { defaultEnvironmentId: null })).toEqual(requested);
    expect(resolve(shared, { connected: [local] })).toEqual(requested);
    expect(
      resolve([
        project(local, "app-local"),
        project(vps, "other", {
          repositoryIdentity: {
            canonicalKey: "github.com/acme/other",
            locator: {
              source: "git-remote",
              remoteName: "origin",
              remoteUrl: "git@github.com:acme/other",
            },
          },
        }),
      ]),
    ).toEqual(requested);
    expect(
      resolve([
        project(local, "app-local"),
        project(vps, "app-vps", { archivedAt: "2026-11-14T00:00:00.000Z" }),
      ]),
    ).toEqual(requested);
  });

  it("moves a scratch thread to the default machine's scratch project", () => {
    expect(
      resolve([
        project(local, "app-local", { isScratch: true, repositoryIdentity: null }),
        project(vps, "scratch-vps", { isScratch: true, repositoryIdentity: null }),
      ]),
    ).toEqual({ environmentId: vps, projectId: "scratch-vps" });
  });
});
