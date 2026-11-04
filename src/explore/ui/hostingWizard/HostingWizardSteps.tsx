import type { ReactNode } from 'react';
import type { CreateFlowStepId } from '../hostingFlowEngine';
import { createFlowStepTitle } from '../hostingFlowEngine';
import { FlowSheetChrome } from '../ExploreFlowSheetChrome';
import type { HostingWizardContext } from './hostingWizardContext';
import { renderHostingWizardStep } from './renderHostingWizardStep';
import { renderHostingWizardStepSlice } from './steps';
import {
  HostingWizardEmbedProvider,
  HostingWizardStepError,
  HostingWizardStepNext,
} from './HostingWizardChrome';

const renderOneHostingStep = (ctx: HostingWizardContext): ReactNode => {
  if (ctx.step === 'type' || !ctx.hostingKindFlow) {
    return renderHostingWizardStepSlice(ctx);
  }
  return renderHostingWizardStep(ctx) ?? renderHostingWizardStepSlice(ctx);
};

const renderWideHostingPage = (ctx: HostingWizardContext, page: CreateFlowStepId[]): ReactNode => {
  const last = page[page.length - 1];
  return (
    <FlowSheetChrome title={ctx.widePageTitle} onClose={ctx.handleClose} onBack={ctx.goBack}>
      {page.map((id, index) => (
        <HostingWizardEmbedProvider key={id} embedded>
          <section className={index === 0 ? undefined : 'mt-5 border-t border-neutral-100 pt-4'}>
            {page.length > 1 && ctx.kind ? (
              <h3 className="mb-3 text-base font-semibold text-neutral-900 md:text-[15px]">
                {createFlowStepTitle(id, ctx.kind, ctx.stepTitleOptions)}
              </h3>
            ) : null}
            {renderOneHostingStep({ ...ctx, step: id })}
          </section>
        </HostingWizardEmbedProvider>
      ))}
      <HostingWizardStepError error={ctx.error} />
      {last === 'publish' ? null : <HostingWizardStepNext onClick={ctx.goNext} />}
    </FlowSheetChrome>
  );
};

export function renderHostingWizardSteps(ctx: HostingWizardContext): ReactNode {
  if (ctx.step === 'type') {
    return renderHostingWizardStepSlice(ctx);
  }
  if (ctx.widePageSteps.length > 1) {
    return renderWideHostingPage(ctx, ctx.widePageSteps);
  }
  return renderOneHostingStep(ctx);
}

export { renderHostingWizardStepSlice } from './steps';
