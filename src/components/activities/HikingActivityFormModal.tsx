import type { ActivityDTO, LocationDTO, TenantListDTO } from '@uaetrail/shared-types';
import { activityFormTitle } from '../../config/activityTypes';
import { saveHikingDraft } from '../../utils/activityFormSessionStorage';
import type { ActivityFormSessionSnapshot } from '../../utils/activityFormSessionStorage';
import { ActivityFormShell } from './ActivityFormShell';
import { ActivityTripPreviewOverlay } from './ActivityTripPreviewOverlay';
import { MIN_ABOUT_WORDS } from './activityFormValidation';
import {
  FormStepProgress,
  hikingLocationTabs,
  InstructionsStep,
  InstructionsStepTabs,
  LocationStep,
  LocationStepTabs,
  ParticipationStep,
  SummaryStepHiking,
  TransportationStep,
} from './activityFormSteps';
import { useHostActivityFormModal } from './useHostActivityFormModal';

export interface HikingActivityFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  tenantId?: string;
  editingActivity?: ActivityDTO | null;
  hostOrganizations?: TenantListDTO[];
  venueLocations?: LocationDTO[];
  sessionSnapshot?: ActivityFormSessionSnapshot | null;
  onSessionChange?: (snapshot: ActivityFormSessionSnapshot) => void;
}

export const HikingActivityFormModal = ({
  open,
  onClose,
  onSaved,
  tenantId = '',
  editingActivity = null,
  hostOrganizations,
  venueLocations,
  sessionSnapshot,
  onSessionChange,
}: HikingActivityFormModalProps) => {
  const modal = useHostActivityFormModal({
    open,
    activityType: 'hiking',
    tenantId,
    editingActivity,
    hostOrganizations,
    venueLocations,
    sessionSnapshot,
    draftFromSession: sessionSnapshot?.hikingDraft ?? null,
    onSessionChange,
    onSaved,
    onClose,
    persistDraft: (draft, hostTenantId) => {
      if (!onSessionChange) return;
      saveHikingDraft(draft, {
        open: true,
        tenantId: hostTenantId,
        activityType: 'hiking',
        editingActivityId: editingActivity?.id ?? draft.editingActivityId,
      });
      onSessionChange({
        open: true,
        activityType: 'hiking',
        tenantId: hostTenantId,
        editingActivityId: editingActivity?.id ?? draft.editingActivityId,
        initialActivityType: null,
        hikingDraft: draft,
        campingDraft: sessionSnapshot?.campingDraft ?? null,
        eventDraft: sessionSnapshot?.eventDraft ?? null,
      });
    },
  });

  if (!open) return null;

  const title = activityFormTitle('hiking', modal.isEdit ? 'edit' : 'create');
  const isLastStep = modal.step === 5;
  const isPublishedEdit = modal.isEdit && editingActivity?.status === 'published';

  return (
    <>
      <ActivityFormShell
        wide
        title={title}
        onClose={onClose}
        progress={<FormStepProgress step={modal.step} onGoToStep={modal.goToStep} />}
        stickyTabs={
          modal.step === 3 ? (
            <LocationStepTabs
              locationTab={modal.locationTab}
              locationTabs={hikingLocationTabs}
              onChange={modal.setLocationTab}
            />
          ) : modal.step === 4 ? (
            <InstructionsStepTabs instructionTab={modal.instructionTab} onChange={modal.setInstructionTab} />
          ) : undefined
        }
        footer={
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
            <div className="flex justify-end gap-2 flex-wrap">
              {modal.step > 1 && (
                <button
                  type="button"
                  onClick={modal.goBack}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-white"
                >
                  Back
                </button>
              )}
              {!isLastStep && (
                <button
                  type="button"
                  onClick={modal.goNext}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700"
                >
                  Next
                </button>
              )}
              {isLastStep && (
                <>
                  {isPublishedEdit ? (
                    <button
                      type="button"
                      disabled={modal.saving}
                      onClick={() => void modal.handleSave('publish')}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {modal.saving ? 'Saving…' : 'Save changes'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={modal.saving}
                      onClick={() => void modal.handleSaveAndPreview()}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {modal.saving ? 'Saving…' : 'Save & preview'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          {modal.step === 1 && (
            <SummaryStepHiking
              form={modal.form}
              set={modal.set}
              titleWords={modal.titleWords}
              aboutWords={modal.aboutWords}
              minAboutWords={MIN_ABOUT_WORDS}
              hostTenantId={modal.hostTenantId}
              venueAddHref={modal.venueAddHref}
              onAddVenue={modal.handleAddVenue}
              venueLocations={venueLocations}
              canPickHostOrganization={modal.canPickHostOrganization}
              pickerHostOrganizations={modal.pickerHostOrganizations}
              showScheduleWarning={editingActivity?.status === 'published'}
            />
          )}

          {modal.step === 2 && (
            <ParticipationStep form={modal.form} set={modal.set} isBusinessOrg={modal.isBusinessOrg} />
          )}

          {modal.step === 3 && (
            <LocationStep
              form={modal.form}
              setPin={modal.setPin}
              locationTab={modal.locationTab}
              locationTabs={hikingLocationTabs}
              venueCenter={modal.venueCenter}
              activityType="hiking"
            />
          )}

          {modal.step === 4 && (
            <InstructionsStep form={modal.form} set={modal.set} instructionTab={modal.instructionTab} />
          )}

          {modal.step === 5 && (
            <TransportationStep
              form={modal.form}
              set={modal.set}
              setPin={modal.setPin}
              venueCenter={modal.venueCenter}
            />
          )}

          {modal.error && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {modal.error}
            </p>
          )}
        </div>
      </ActivityFormShell>

      {modal.previewTrip && (
        <ActivityTripPreviewOverlay
          trip={modal.previewTrip}
          saving={modal.saving}
          onClose={() => modal.setPreviewTrip(null)}
          onSaveDraft={() => void modal.handleSave('draft')}
          onPublish={() => void modal.handleSave('publish')}
        />
      )}
    </>
  );
};
