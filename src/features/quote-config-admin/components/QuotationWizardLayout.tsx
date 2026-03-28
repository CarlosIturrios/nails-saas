"use client";

import type { ReactNode } from "react";

import { ProgressStepper } from "@/src/features/quote-config-admin/components/ProgressStepper";
import { StickyFooterActions } from "@/src/features/quote-config-admin/components/StickyFooterActions";
import { WizardHeader } from "@/src/features/quote-config-admin/components/WizardHeader";

interface WizardLayoutStep {
  id: string;
  label: string;
}

interface QuotationWizardLayoutProps {
  title: string;
  description: string;
  organizationSelector?: ReactNode;
  currentStep: number;
  steps: WizardLayoutStep[];
  onStepSelect: (index: number) => void;
  children: ReactNode;
  primaryAction: ReactNode;
  secondaryAction?: ReactNode;
  utilityAction?: ReactNode;
  footerHelperText?: string;
}

export function QuotationWizardLayout({
  title,
  description,
  organizationSelector,
  currentStep,
  steps,
  onStepSelect,
  children,
  primaryAction,
  secondaryAction,
  utilityAction,
  footerHelperText,
}: QuotationWizardLayoutProps) {
  return (
    <section className="space-y-4 sm:space-y-5 lg:space-y-6">
      <WizardHeader
        eyebrow="Configuración de captura"
        title={title}
        description={description}
        aside={organizationSelector}
      />

      <ProgressStepper
        currentStep={currentStep}
        steps={steps}
        onStepSelect={onStepSelect}
      />

      <div className="space-y-4 pb-40 sm:space-y-5 sm:pb-44 lg:space-y-6 lg:pb-0">
        {children}
      </div>

      <StickyFooterActions
        primaryAction={primaryAction}
        secondaryAction={secondaryAction}
        utilityAction={utilityAction}
        helperText={footerHelperText}
      />
    </section>
  );
}
