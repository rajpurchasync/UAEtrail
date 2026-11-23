import { Link } from 'react-router-dom';
import { Baby } from 'lucide-react';
import { APP_SETTINGS_ACCOUNT_PATH } from '../config/surfacePaths';
import { AppSelect } from '../components/ui/AppSelect';
import { ProfilePhotoEditorField } from '../components/account/ProfilePhotoEditorField';
import { SettingsContentGroup } from '../components/settings/SettingsMenuRow';
import { USER_GENDER_OPTIONS, type UserGender } from '../constants/userProfileOptions';
import {
  KID_EMERGENCY_ME_RELATION,
  KID_EMERGENCY_RELATION_OPTIONS,
  type KidFormState,
} from './groupKidForm';

type KidTripDetailsFormProps = {
  title: string;
  kidForm: KidFormState;
  saving: boolean;
  formReady: boolean;
  editingKidId: string | null;
  meEmergency: { name: string; phone: string };
  onKidFormChange: (updater: (prev: KidFormState) => KidFormState) => void;
  onCancelEdit: () => void;
  onSave: () => void;
};

export const KidTripDetailsForm = ({
  title,
  kidForm,
  saving,
  formReady,
  editingKidId,
  meEmergency,
  onKidFormChange,
  onCancelEdit,
  onSave,
}: KidTripDetailsFormProps) => (
  <SettingsContentGroup title={title}>
    <div className="space-y-3">
      <ProfilePhotoEditorField
        value={kidForm.photoUrl || undefined}
        name={kidForm.displayName.trim() || 'Kid'}
        label="Photo"
        editorTitle="Kid photo"
        keyPrefix="family-kids"
        kind="avatar"
        disabled={saving}
        onChange={(photoUrl) => onKidFormChange((prev) => ({ ...prev, photoUrl }))}
      />
      <input
        value={kidForm.displayName}
        onChange={(e) => onKidFormChange((prev) => ({ ...prev, displayName: e.target.value }))}
        placeholder="Display name"
        className="ios-input w-full text-[14px]"
      />
      <div>
        <p className="mb-2 text-sm font-semibold text-neutral-800">Gender</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {USER_GENDER_OPTIONS.map((option) => {
            const active = kidForm.gender === option.value;
            return (
              <button
                key={option.value}
                type="button"
                disabled={saving}
                onClick={() =>
                  onKidFormChange((prev) => ({
                    ...prev,
                    gender: option.value as UserGender,
                  }))
                }
                className={`rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                  active
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-800 hover:border-emerald-200'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
      <input
        type="date"
        value={kidForm.dateOfBirth}
        onChange={(e) => onKidFormChange((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
        className="ios-input w-full text-[14px]"
        aria-label="Date of birth"
      />
      <div className="space-y-2 rounded-xl border border-neutral-200 bg-neutral-50/80 p-3">
        <p className="text-sm font-semibold text-neutral-800">Emergency contact</p>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={kidForm.emergencyContactIsMe}
            disabled={saving}
            onChange={(e) => {
              const checked = e.target.checked;
              onKidFormChange((prev) =>
                checked
                  ? {
                      ...prev,
                      emergencyContactIsMe: true,
                      emergencyContactRelation: KID_EMERGENCY_ME_RELATION,
                      emergencyContactName: meEmergency.name,
                      emergencyContactPhone: meEmergency.phone,
                    }
                  : {
                      ...prev,
                      emergencyContactIsMe: false,
                      emergencyContactRelation: 'Parent',
                      emergencyContactName: '',
                      emergencyContactPhone: '',
                    }
              );
            }}
            className="mt-1 h-4 w-4 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-600"
          />
          <span className="min-w-0">
            <span className="block text-sm font-medium text-neutral-900">Me</span>
            <span className="mt-0.5 block text-xs text-neutral-500">
              Use your name and phone as this kid&apos;s emergency contact
            </span>
          </span>
        </label>
        {kidForm.emergencyContactIsMe ? (
          <div className="rounded-lg border border-emerald-100 bg-white px-3 py-2 text-sm text-neutral-700">
            {meEmergency.name && meEmergency.phone ? (
              <p>
                <span className="font-semibold text-neutral-900">{meEmergency.name}</span>
                <span className="text-neutral-400"> · Me · </span>
                {meEmergency.phone}
              </p>
            ) : (
              <p className="text-amber-800">
                Add your phone in{' '}
                <Link
                  to={APP_SETTINGS_ACCOUNT_PATH}
                  className="font-semibold text-emerald-700 underline"
                >
                  Account settings
                </Link>{' '}
                so hosts can reach you.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <input
              value={kidForm.emergencyContactName}
              onChange={(e) =>
                onKidFormChange((prev) => ({ ...prev, emergencyContactName: e.target.value }))
              }
              placeholder="Name"
              className="ios-input w-full text-[14px]"
              aria-label="Emergency contact name"
            />
            <AppSelect
              value={
                KID_EMERGENCY_RELATION_OPTIONS.some((o) => o.value === kidForm.emergencyContactRelation)
                  ? kidForm.emergencyContactRelation
                  : 'Other'
              }
              onChange={(relation) =>
                onKidFormChange((prev) => ({ ...prev, emergencyContactRelation: relation }))
              }
              options={[...KID_EMERGENCY_RELATION_OPTIONS]}
              aria-label="Relation"
            />
            <input
              value={kidForm.emergencyContactPhone}
              onChange={(e) =>
                onKidFormChange((prev) => ({ ...prev, emergencyContactPhone: e.target.value }))
              }
              placeholder="Number (+971…)"
              className="ios-input w-full text-[14px]"
              aria-label="Emergency contact number"
              type="tel"
            />
          </div>
        )}
      </div>
      <textarea
        value={kidForm.medicalConditions}
        onChange={(e) => onKidFormChange((prev) => ({ ...prev, medicalConditions: e.target.value }))}
        placeholder="Medical conditions (or N/A)"
        rows={2}
        className="ios-input w-full resize-y text-[14px]"
      />
      <div className="flex gap-2">
        {editingKidId ? (
          <button
            type="button"
            onClick={onCancelEdit}
            className="ios-btn border border-neutral-200 bg-white text-neutral-800"
          >
            Cancel
          </button>
        ) : null}
        <button
          type="button"
          disabled={saving || !formReady}
          onClick={onSave}
          className="ios-btn flex-1 bg-emerald-600 text-white disabled:opacity-50"
        >
          <Baby className="h-4 w-4" />
          {editingKidId ? 'Save trip details' : 'Add kid with trip details'}
        </button>
      </div>
    </div>
  </SettingsContentGroup>
);