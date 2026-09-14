"use client";

import { openWorld } from "@/components/world/openWorld";
import { journeyStore } from "@/components/world/systems/journey";
import { teleportStore } from "@/components/world/systems/teleport";
import { arrivalYaw, DEPARTMENTS, type DepartmentId } from "@/data/departments";

/**
 * Into Archon World, at a department's door.
 *
 * The service explorer on the home page offers the world as a place to see
 * a service rather than read about it. This asks for exactly what the lobby
 * team asks for when a visitor picks a department — a teleport to that
 * office, and its card opening on arrival — through the same two stores, and
 * then opens the world the way every other entry point does. Nothing in the
 * world is changed for it; a department without an office simply opens the
 * world at the gate.
 */
export function openWorldAtDepartment(id: DepartmentId, service?: string): void {
  const department = DEPARTMENTS.find((one) => one.id === id);
  if (department?.office) {
    teleportStore.requestTo({
      id: `office:${department.id}`,
      number: 0,
      key: "",
      name: department.name,
      subtitle: department.tagline,
      description: department.tagline,
      zone: department.zone,
      at: department.office.arrival,
      yaw: arrivalYaw(department.office),
    });
    journeyStore.set({ department: department.id, service: service ?? null, awaiting: department.id });
    journeyStore.step(`explorer:${department.id}`);
  }
  openWorld();
}
