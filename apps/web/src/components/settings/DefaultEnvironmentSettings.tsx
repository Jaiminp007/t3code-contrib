import type { EnvironmentId } from "@t3tools/contracts";

import {
  useClientSettings,
  useClientSettingsHydrated,
  updateClientSettings,
} from "~/hooks/useSettings";
import type { EnvironmentPresentation } from "~/state/environments";
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from "../ui/select";
import { EnvironmentTransportLabel } from "./EnvironmentRow";
import { FoldedSettingsSection } from "./FoldedSettingsSection";
import { searchableSetting } from "./settingsSearch";

const PROJECT_MACHINE = "project-machine";

export function DefaultEnvironmentSettings({
  environments,
}: {
  environments: ReadonlyArray<EnvironmentPresentation>;
}) {
  const defaultEnvironmentId = useClientSettings((settings) => settings.defaultEnvironmentId);
  const settingsHydrated = useClientSettingsHydrated();

  if (environments.length < 2) return null;

  const items = [
    { value: PROJECT_MACHINE, label: "Project's machine" },
    ...environments.map((environment) => ({
      value: environment.environmentId as string,
      label: environment.label,
    })),
  ];
  const selected =
    defaultEnvironmentId !== null &&
    environments.some((environment) => environment.environmentId === defaultEnvironmentId)
      ? defaultEnvironmentId
      : PROJECT_MACHINE;
  const { id, title } = searchableSetting("default-environment");
  return (
    <FoldedSettingsSection
      id={id}
      title={title}
      control={
        <Select
          items={items}
          value={selected}
          disabled={!settingsHydrated}
          onValueChange={(value) => {
            if (value === null) return;
            updateClientSettings({
              defaultEnvironmentId: value === PROJECT_MACHINE ? null : (value as EnvironmentId),
            });
          }}
        >
          <SelectTrigger size="xs" className="w-40" aria-label="Default environment">
            <SelectValue />
          </SelectTrigger>
          <SelectPopup align="end" alignItemWithTrigger={false}>
            <SelectItem value={PROJECT_MACHINE}>Project's machine</SelectItem>
            {environments.map((environment) => (
              <SelectItem key={environment.environmentId} value={environment.environmentId}>
                <span className="flex w-full items-center justify-between gap-5">
                  <span>{environment.label}</span>
                  <span className="text-xs text-muted-foreground">
                    <EnvironmentTransportLabel environment={environment} />
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectPopup>
        </Select>
      }
    >
      <p className="px-3 py-2.5 text-xs text-muted-foreground sm:px-4">
        New threads start on this machine when it is connected and has the project. You can still
        switch machines on a draft. Applies only to this device.
      </p>
    </FoldedSettingsSection>
  );
}
