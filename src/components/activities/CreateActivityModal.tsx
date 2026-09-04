import { useEffect, useState } from 'react';
import type { ActivityDTO, LocationDTO, TenantListDTO } from '@uaetrail/shared-types';
import { parseActivityTypeParam, type ActivityType } from '../../config/activityTypes';
import type { ActivityFormSessionSnapshot } from '../../utils/activityFormSessionStorage';
import { ActivityTypePickerModal } from './ActivityTypePickerModal';
import { CampingActivityFormModal } from './CampingActivityFormModal';
import { HikingActivityFormModal } from './HikingActivityFormModal';

type ActiveModal = 'picker' | 'form' | null;

export interface CreateActivityModalProps {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  tenantId?: string;
  initialActivityType?: ActivityType | null;
  editingActivity?: ActivityDTO | null;
  editSessionKey?: number;
  hostOrganizations?: TenantListDTO[];
  venueLocations?: LocationDTO[];
  sessionSnapshot?: ActivityFormSessionSnapshot | null;
  onSessionChange?: (snapshot: ActivityFormSessionSnapshot) => void;
}

/**
 * Orchestrates the add-activity flow as separate modals:
 * 1. ActivityTypePickerModal — designed card picker (glass dialog)
 * 2. Per-type form modals — plain white form (HikingActivityFormModal, etc.)
 */
export const CreateActivityModal = ({
  open,
  onClose,
  onSaved,
  tenantId = '',
  initialActivityType = null,
  editingActivity = null,
  editSessionKey = 0,
  hostOrganizations,
  venueLocations,
  sessionSnapshot,
  onSessionChange,
}: CreateActivityModalProps) => {
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [selectedType, setSelectedType] = useState<ActivityType | null>(null);

  useEffect(() => {
    if (!open) {
      setActiveModal(null);
      setSelectedType(null);
      return;
    }

    if (editingActivity) {
      const type = (editingActivity.activityType as ActivityType) ?? 'hiking';
      setSelectedType(type);
      setActiveModal('form');
      return;
    }

    if (sessionSnapshot?.hikingDraft) {
      setSelectedType('hiking');
      setActiveModal('form');
      return;
    }

    if (sessionSnapshot?.campingDraft) {
      setSelectedType('camping');
      setActiveModal('form');
      return;
    }

    if (sessionSnapshot?.eventDraft) {
      setSelectedType('community_activity');
      setActiveModal('form');
      return;
    }

    if (initialActivityType) {
      setSelectedType(initialActivityType);
      setActiveModal('form');
      return;
    }

    setSelectedType(null);
    setActiveModal('picker');
  }, [
    open,
    editingActivity,
    editingActivity?.id,
    initialActivityType,
    sessionSnapshot?.hikingDraft,
    sessionSnapshot?.campingDraft,
    sessionSnapshot?.eventDraft,
  ]);

  const handleCloseAll = () => {
    setActiveModal(null);
    setSelectedType(null);
    onClose();
  };

  const handleSelectType = (type: ActivityType) => {
    setSelectedType(type);
    setActiveModal('form');
  };

  if (!open) return null;

  const formInstanceKey = editingActivity?.id
    ? `edit-${editingActivity.id}-${editSessionKey}`
    : `create-${selectedType ?? 'picker'}`;

  return (
    <>
      {activeModal === 'picker' && (
        <ActivityTypePickerModal open onClose={handleCloseAll} onSelect={handleSelectType} />
      )}

      {activeModal === 'form' && selectedType === 'hiking' && (
        <HikingActivityFormModal
          key={`hiking-${formInstanceKey}`}
          open
          onClose={handleCloseAll}
          onSaved={onSaved}
          tenantId={tenantId}
          editingActivity={editingActivity}
          hostOrganizations={hostOrganizations}
          venueLocations={venueLocations}
          sessionSnapshot={sessionSnapshot}
          onSessionChange={onSessionChange}
        />
      )}

      {activeModal === 'form' && selectedType === 'camping' && (
        <CampingActivityFormModal
          key={`camping-${formInstanceKey}`}
          open
          onClose={handleCloseAll}
          onSaved={onSaved}
          tenantId={tenantId}
          editingActivity={editingActivity}
          hostOrganizations={hostOrganizations}
          venueLocations={venueLocations}
          sessionSnapshot={sessionSnapshot}
          onSessionChange={onSessionChange}
        />
      )}

      {activeModal === 'form' && selectedType === 'community_activity' && (
        <CampingActivityFormModal
          key={`event-${formInstanceKey}`}
          open
          formActivityType="community_activity"
          onClose={handleCloseAll}
          onSaved={onSaved}
          tenantId={tenantId}
          editingActivity={editingActivity}
          hostOrganizations={hostOrganizations}
          venueLocations={venueLocations}
          sessionSnapshot={sessionSnapshot}
          onSessionChange={onSessionChange}
        />
      )}
    </>
  );
};

export { parseActivityTypeParam };
