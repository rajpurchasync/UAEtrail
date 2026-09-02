import { useEffect, useRef, useState } from 'react';
import type { ActivityDTO, LocationDTO, TenantListDTO } from '@uaetrail/shared-types';
import { parseActivityTypeParam, type ActivityType } from '../../config/activityTypes';
import type { ActivityFormSessionSnapshot } from '../../utils/activityFormSessionStorage';
import { ActivityComingSoonModal } from './ActivityComingSoonModal';
import { ActivityTypePickerModal } from './ActivityTypePickerModal';
import { HikingActivityFormModal } from './HikingActivityFormModal';

type ActiveModal = 'picker' | 'form' | null;

export interface CreateActivityModalProps {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  tenantId?: string;
  initialActivityType?: ActivityType | null;
  editingActivity?: ActivityDTO | null;
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
  hostOrganizations,
  venueLocations,
  sessionSnapshot,
  onSessionChange,
}: CreateActivityModalProps) => {
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [selectedType, setSelectedType] = useState<ActivityType | null>(null);
  const initializedForOpen = useRef(false);

  useEffect(() => {
    if (!open) {
      initializedForOpen.current = false;
      setActiveModal(null);
      setSelectedType(null);
      return;
    }

    if (initializedForOpen.current) return;
    initializedForOpen.current = true;

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

    if (initialActivityType) {
      setSelectedType(initialActivityType);
      setActiveModal('form');
      return;
    }

    setSelectedType(null);
    setActiveModal('picker');
  }, [open, editingActivity, initialActivityType, sessionSnapshot?.hikingDraft]);

  const handleCloseAll = () => {
    setActiveModal(null);
    setSelectedType(null);
    initializedForOpen.current = false;
    onClose();
  };

  const handleSelectType = (type: ActivityType) => {
    setSelectedType(type);
    setActiveModal('form');
  };

  const handleBackToPicker = () => {
    setSelectedType(null);
    setActiveModal('picker');
  };

  if (!open) return null;

  return (
    <>
      {activeModal === 'picker' && (
        <ActivityTypePickerModal open onClose={handleCloseAll} onSelect={handleSelectType} />
      )}

      {activeModal === 'form' && selectedType === 'hiking' && (
        <HikingActivityFormModal
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

      {activeModal === 'form' && selectedType && selectedType !== 'hiking' && (
        <ActivityComingSoonModal
          open
          activityType={selectedType}
          onClose={handleCloseAll}
          onBack={editingActivity ? undefined : handleBackToPicker}
        />
      )}
    </>
  );
};

export { parseActivityTypeParam };
