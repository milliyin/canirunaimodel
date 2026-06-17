import type { HardwareInfo, HardwareOverrides } from "@/lib/hardware";
import { BW_OPTIONS, RAM_OPTIONS } from "@/lib/hardware";
import { fitSelectWidth, populateSelect } from "@/lib/hardware-ui";

type EditableSpecsOptions = {
  prefix: string;
  container: HTMLElement;
  hw: HardwareInfo;
  detectedHW?: HardwareInfo | null;
  overrides?: HardwareOverrides;
  note?: string;
  onChange: (overrides: HardwareOverrides) => void;
};

const SYSTEM_RAM_OPTIONS = [8, 16, 32, 64, 128];

const select = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T | null;

export function renderEditableHardwareSpecs({
  prefix,
  container,
  hw,
  detectedHW,
  overrides = {},
  note,
  onChange,
}: EditableSpecsOptions) {
  const vram = hw.ramGB ?? hw.estimatedVRAM ?? hw.totalUsableRAM;
  const systemRam = overrides.systemRAM ?? hw.systemRAM ?? (hw.isAppleSilicon ? hw.totalUsableRAM : 16);
  const bandwidth = hw.memoryBandwidth;

  container.innerHTML = `
    <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
      <label class="inline-flex items-center gap-1.5">
        <span class="text-muted">VRAM</span>
        <select id="${prefix}-vram" class="hw-editable-select text-primary" ${vram ? "" : "disabled"}>
          <option value="">${vram ? `${vram} GB` : "unknown"}</option>
        </select>
      </label>
      ${
        hw.isMobile
          ? ""
          : `<label class="inline-flex items-center gap-1.5">
              <span class="text-muted">RAM</span>
              <select id="${prefix}-system-ram" class="hw-editable-select text-primary"></select>
            </label>`
      }
      ${
        bandwidth
          ? `<label class="inline-flex items-center gap-1.5">
              <span class="text-muted">BW</span>
              <select id="${prefix}-bandwidth" class="hw-editable-select text-primary"></select>
            </label>`
          : ""
      }
      ${
        hw.gpuCores
          ? `<span><span class="text-muted">Cores</span> <span class="text-primary">${hw.gpuCores.toLocaleString()}</span></span>`
          : ""
      }
    </div>
    ${
      note
        ? `<p class="mt-3 text-xs leading-5 text-muted">${note}</p>`
        : ""
    }
  `;

  const vramSelect = select<HTMLSelectElement>(`${prefix}-vram`);
  const systemRamSelect = select<HTMLSelectElement>(`${prefix}-system-ram`);
  const bandwidthSelect = select<HTMLSelectElement>(`${prefix}-bandwidth`);

  if (vramSelect && vram) {
    populateSelect(
      vramSelect,
      RAM_OPTIONS,
      detectedHW?.ramGB ?? detectedHW?.estimatedVRAM ?? null,
      overrides.ramGB ?? vram,
      (value) => `${value} GB`,
    );
    vramSelect.disabled = false;
    fitSelectWidth(vramSelect);
  }

  if (systemRamSelect) {
    if (hw.isAppleSilicon) {
      systemRamSelect.innerHTML = "";
      const option = document.createElement("option");
      option.value = "";
      option.textContent = `${hw.totalUsableRAM ?? hw.ramGB ?? "unknown"} GB unified`;
      systemRamSelect.appendChild(option);
      systemRamSelect.disabled = true;
      systemRamSelect.classList.add("opacity-50", "cursor-not-allowed");
      fitSelectWidth(systemRamSelect);
    } else {
      systemRamSelect.innerHTML = "";
      for (const value of SYSTEM_RAM_OPTIONS) {
        const option = document.createElement("option");
        option.value = String(value);
        option.textContent = `${value} GB`;
        systemRamSelect.appendChild(option);
      }
      systemRamSelect.value = String(systemRam ?? 16);
      fitSelectWidth(systemRamSelect);
    }
  }

  if (bandwidthSelect && bandwidth) {
    populateSelect(
      bandwidthSelect,
      BW_OPTIONS,
      detectedHW?.memoryBandwidth ?? null,
      overrides.memoryBandwidth ?? bandwidth,
      (value) => `~${value} GB/s`,
    );
    fitSelectWidth(bandwidthSelect);
  }

  function emitChange() {
    const next: HardwareOverrides = { ...overrides };
    if (vramSelect?.value) next.ramGB = Number(vramSelect.value);
    if (systemRamSelect?.value) next.systemRAM = Number(systemRamSelect.value);
    if (bandwidthSelect?.value) next.memoryBandwidth = Number(bandwidthSelect.value);
    onChange(next);
  }

  vramSelect?.addEventListener("change", emitChange);
  systemRamSelect?.addEventListener("change", emitChange);
  bandwidthSelect?.addEventListener("change", emitChange);
}
