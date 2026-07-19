import { useState } from "react";
import { parseConfigMode, parseConfigType } from "@/lib/build-url";
import type { ConfigType } from "../../../core/src/types";

export type KernelType = ConfigType;
export type RoutingMode = "" | "-dual" | "-white" | "-black";

function getKernel(configType: string): KernelType {
	return parseConfigType(configType);
}

function getMode(configType: string): RoutingMode {
	switch (parseConfigMode(configType)) {
		case "dual":
			return "-dual";
		case "white":
			return "-white";
		case "black":
			return "-black";
		default:
			return "";
	}
}

export function useConfigType() {
	const [configType, setConfigType] = useState("mihomo");
	const selectedKernel = getKernel(configType);
	const selectedMode = getMode(configType);

	const changeKernel = (kernel: KernelType) => setConfigType(`${kernel}${selectedMode}`);
	const changeMode = (mode: RoutingMode) => setConfigType(`${selectedKernel}${mode}`);

	return { configType, selectedKernel, selectedMode, changeKernel, changeMode };
}
