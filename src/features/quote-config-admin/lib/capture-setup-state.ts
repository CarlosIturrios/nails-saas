"use client";

import type { OrganizationQuoteConfigInput } from "@/src/features/quote-calculator-v2/lib/types";
import type { InlineSaveStatus } from "@/src/features/quote-config-admin/components/InlineSaveIndicator";

export type CaptureSetupSectionId =
  | "business"
  | "catalog"
  | "mode"
  | "identity"
  | "activation";

export interface CaptureSetupState {
  activeSectionId: CaptureSetupSectionId;
  config: OrganizationQuoteConfigInput;
  persistedConfig: OrganizationQuoteConfigInput;
  saveStatus: InlineSaveStatus;
  lastSavedAt: number | null;
}

type CaptureSetupAction =
  | {
      type: "reset";
      config: OrganizationQuoteConfigInput;
      activeSectionId?: CaptureSetupSectionId;
      lastSavedAt?: number | null;
    }
  | {
      type: "restore_draft";
      config: OrganizationQuoteConfigInput;
      activeSectionId?: CaptureSetupSectionId;
    }
  | {
      type: "set_config";
      config: OrganizationQuoteConfigInput;
    }
  | {
      type: "set_active_section";
      activeSectionId: CaptureSetupSectionId;
    }
  | {
      type: "save_start";
    }
  | {
      type: "save_success";
      config: OrganizationQuoteConfigInput;
      savedAt: number;
    }
  | {
      type: "save_error";
    };

function serializeConfig(config: OrganizationQuoteConfigInput) {
  return JSON.stringify(config);
}

function isSameConfig(
  left: OrganizationQuoteConfigInput,
  right: OrganizationQuoteConfigInput
) {
  return serializeConfig(left) === serializeConfig(right);
}

export function createCaptureSetupState(
  config: OrganizationQuoteConfigInput,
  activeSectionId: CaptureSetupSectionId = "business"
): CaptureSetupState {
  return {
    activeSectionId,
    config,
    persistedConfig: config,
    saveStatus: "saved",
    lastSavedAt: Date.now(),
  };
}

export function captureSetupReducer(
  state: CaptureSetupState,
  action: CaptureSetupAction
): CaptureSetupState {
  switch (action.type) {
    case "reset":
      return {
        activeSectionId: action.activeSectionId ?? "business",
        config: action.config,
        persistedConfig: action.config,
        saveStatus: "saved",
        lastSavedAt: action.lastSavedAt ?? Date.now(),
      };
    case "restore_draft": {
      const saveStatus = isSameConfig(action.config, state.persistedConfig) ? "saved" : "dirty";

      return {
        ...state,
        activeSectionId: action.activeSectionId ?? state.activeSectionId,
        config: action.config,
        saveStatus,
      };
    }
    case "set_config": {
      const saveStatus = isSameConfig(action.config, state.persistedConfig) ? "saved" : "dirty";

      return {
        ...state,
        config: action.config,
        saveStatus,
      };
    }
    case "set_active_section":
      return {
        ...state,
        activeSectionId: action.activeSectionId,
      };
    case "save_start":
      return {
        ...state,
        saveStatus: "saving",
      };
    case "save_success":
      return {
        ...state,
        config: action.config,
        persistedConfig: action.config,
        saveStatus: "saved",
        lastSavedAt: action.savedAt,
      };
    case "save_error":
      return {
        ...state,
        saveStatus: "error",
      };
    default:
      return state;
  }
}
