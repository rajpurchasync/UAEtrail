import type { ReactNode } from 'react';
import { composeWizardErrorFooter } from '../../../create/composeWizardStepFooter';
import { ComposeWizardStepChrome } from '../../../create/ComposeWizardShell';
import { ComposeMapEntryRow, formatComposeMapCoord } from '../../../create/interactions';
import { placeRegionReady } from '../../../../config/regions';
import { ImageUpload } from '../../../../components/ui/ImageUpload';
import { inferEmirateFromPin } from '../../../hostingPublishDestination';
import { FACILITY_ADD_OPTIONS } from '../../addFacilityFlow';
import { AddCuratedDestinationStep } from '../../AddCuratedDestinationStep';
import { AddFacilityParentPlaceStep } from '../../AddFacilityParentPlaceStep';
import { AddFacilityPreview } from '../../AddFacilityPreview';
import { EmirateFromPinField } from '../../EmirateFromPinField';
import { exploreFlowKindTileClass } from '../../exploreFlowUi';
import { FlowStepTextInput } from '../../useFlowSheetPrimaryFieldFocus';
import { AddWizardNextButton } from '../AddWizardChrome';
import type { FacilityAddWizardContext } from '../facilityWizardContext';

export function renderFacilityAddWizardSteps(ctx: FacilityAddWizardContext): ReactNode {
  const {
    step,
    headerTitle,
    draft,
    patchDraft,
    error,
    submitting,
    publishedAreas,
    goNext,
    goBack,
    requestClose,
    handleSubmit,
    openLocationMap,
    selectFacilityKind,
  } = ctx;

  return (
    <>
      {step === 'title' && (
        <ComposeWizardStepChrome title={headerTitle} onClose={requestClose} onBack={goBack}>
          <FlowStepTextInput
            value={draft.title}
            onChange={(event) => patchDraft({ title: event.target.value })}
            placeholder="e.g. Hatta Dam car park"
            className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-emerald-400"
            maxLength={120}
          />
          {composeWizardErrorFooter(
            error,
            <AddWizardNextButton disabled={!draft.title.trim()} onClick={goNext} />
          )}
        </ComposeWizardStepChrome>
      )}

      {step === 'facilityType' && (
        <ComposeWizardStepChrome title={headerTitle} onClose={requestClose} onBack={goBack}>
          <div className="grid grid-cols-2 gap-2">
            {FACILITY_ADD_OPTIONS.map((option) => (
              <button
                key={option.kind}
                type="button"
                onClick={() => selectFacilityKind(option.kind)}
                className={exploreFlowKindTileClass(draft.facilityKind === option.kind)}
              >
                <span className="text-xl font-emoji" aria-hidden>
                  {option.emoji}
                </span>
                <p className="mt-1 text-sm font-semibold text-neutral-900">{option.label}</p>
              </button>
            ))}
          </div>
          {composeWizardErrorFooter(
            error,
            <AddWizardNextButton disabled={!draft.facilityKind} onClick={goNext} />
          )}
        </ComposeWizardStepChrome>
      )}

      {step === 'curatedArea' && (
        <ComposeWizardStepChrome title={headerTitle} onClose={requestClose} onBack={goBack}>
          <AddCuratedDestinationStep
            destinationId={draft.destinationId}
            allowNewArea={false}
            onAreaIdChange={(next) => {
              const center = next ? publishedAreas.find((area) => area.id === next)?.center : null;
              const areaChanged = next !== draft.destinationId;
              patchDraft({
                destinationId: next,
                locationPinPlaced: false,
                ...(areaChanged ? { parentPlaceId: null, parentPlaceName: null } : {}),
                ...(center ? { latitude: center.latitude, longitude: center.longitude } : {}),
              });
            }}
          />
          {composeWizardErrorFooter(
            error,
            <AddWizardNextButton disabled={!draft.destinationId} onClick={goNext} />
          )}
        </ComposeWizardStepChrome>
      )}

      {step === 'parentPlace' && (
        <ComposeWizardStepChrome title={headerTitle} onClose={requestClose} onBack={goBack}>
          <AddFacilityParentPlaceStep draft={draft} onChange={patchDraft} />
          {composeWizardErrorFooter(error, <AddWizardNextButton onClick={goNext} />)}
        </ComposeWizardStepChrome>
      )}

      {step === 'location' && (
        <ComposeWizardStepChrome title={headerTitle} onClose={requestClose} onBack={goBack}>
          <ComposeMapEntryRow
            title="Facility location"
            subtitle={formatComposeMapCoord(draft.latitude, draft.longitude, draft.locationPinPlaced)}
            placed={draft.locationPinPlaced}
            onOpen={openLocationMap}
          />
          <EmirateFromPinField
            pinned={draft.locationPinPlaced}
            inferred={inferEmirateFromPin(draft.latitude, draft.longitude, publishedAreas)}
            countryCode={draft.countryCode}
            onCountryChange={(countryCode) => patchDraft({ countryCode })}
            value={draft.emirate}
            onChange={(emirate) => patchDraft({ emirate })}
          />
          {composeWizardErrorFooter(
            error,
            <AddWizardNextButton
              disabled={
                !draft.locationPinPlaced ||
                draft.latitude == null ||
                !placeRegionReady(
                  draft.countryCode,
                  draft.emirate,
                  inferEmirateFromPin(draft.latitude, draft.longitude, publishedAreas)
                )
              }
              onClick={goNext}
            />
          )}
        </ComposeWizardStepChrome>
      )}

      {step === 'image' && (
        <ComposeWizardStepChrome title={headerTitle} onClose={requestClose} onBack={goBack}>
          <ImageUpload
            images={draft.images}
            onChange={(images) => patchDraft({ images })}
            max={5}
          />
          {composeWizardErrorFooter(
            error,
            <AddWizardNextButton disabled={!draft.images.length} onClick={goNext} />
          )}
        </ComposeWizardStepChrome>
      )}

      {step === 'description' && (
        <ComposeWizardStepChrome title={headerTitle} onClose={requestClose} onBack={goBack}>
          <textarea
            value={draft.description}
            onChange={(event) => patchDraft({ description: event.target.value })}
            rows={5}
            maxLength={3000}
            placeholder="Hours, access notes, what to expect nearby…"
            className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-emerald-400"
          />
          {composeWizardErrorFooter(
            error,
            <AddWizardNextButton disabled={draft.description.trim().length < 20} onClick={goNext} />
          )}
        </ComposeWizardStepChrome>
      )}

      {step === 'review' && (
        <ComposeWizardStepChrome title={headerTitle} onClose={requestClose} onBack={goBack}>
          <AddFacilityPreview draft={draft} publishedAreas={publishedAreas} />
          {composeWizardErrorFooter(
            error,
            <AddWizardNextButton loading={submitting} label="Submit for review" onClick={handleSubmit} />,
            'mt-5 flex flex-col gap-2 pb-2'
          )}
        </ComposeWizardStepChrome>
      )}
    </>
  );
}
