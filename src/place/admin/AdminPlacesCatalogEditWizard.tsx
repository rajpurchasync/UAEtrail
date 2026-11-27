import { type Dispatch, type SetStateAction } from 'react';
import { Link } from 'react-router-dom';
import {
  PlaceDTO,
  memberProfilePath,
  resolveCatalogSubmitterUserId,
  type DestinationDTO,
} from '@uaetrail/shared-types';
import { MapPinPicker } from '../../components/ui/MapPinPicker';
import { ImageUpload } from '../../components/ui';
import { AssetKeyUpload } from '../../components/ui/AssetKeyUpload';
import { AppSelect, ADMIN_SELECT_CLASS } from '../../components/ui/AppSelect';
import type { AdminCatalogSegment } from '../adminCatalogSegment';
import {
  CAMPING_ACCESSIBLE,
  CAMPING_SURFACES,
  COUNTRY_OPTIONS,
  HIKING_ACCESSIBLE,
  HIKING_SURFACES,
  LOCATION_STATUS_OPTIONS,
  SEASONS,
  TAG_OPTIONS,
  isCatalogMapPlace,
  isTrailLike,
  parseOptionalNumberInput,
} from './adminPlacesCatalogConstants';
import { AdminPlacesCatalogChipSelect } from './adminPlacesCatalogUi';

export type AdminPlacesCatalogEditWizardProps = {
  catalogSegment: AdminCatalogSegment;
  form: Partial<PlaceDTO>;
  setForm: Dispatch<SetStateAction<Partial<PlaceDTO>>>;
  editingId: string | null;
  detailStep: number;
  distanceInput: string;
  setDistanceInput: (value: string) => void;
  elevationInput: string;
  setElevationInput: (value: string) => void;
  highlightInput: string;
  setHighlightInput: (value: string) => void;
  handleMapChange: (lat: number | null, lng: number | null) => void;
  toggleArrayItem: (field: 'surfaceType' | 'tags' | 'accessibleBy' | 'season', item: string) => void;
  parentPlaceHubOptions: { value: string; label: string }[];
  regionOptions: { value: string; label: string }[];
  adminAreas: DestinationDTO[];
  error: string | null;
};

export const AdminPlacesCatalogEditWizard = ({
  catalogSegment,
  form,
  setForm,
  editingId,
  detailStep,
  distanceInput,
  setDistanceInput,
  elevationInput,
  setElevationInput,
  highlightInput,
  setHighlightInput,
  handleMapChange,
  toggleArrayItem,
  parentPlaceHubOptions,
  regionOptions,
  adminAreas,
  error,
}: AdminPlacesCatalogEditWizardProps) => (
  <>
                {form.status === 'draft' && resolveCatalogSubmitterUserId(form) ? (
                  <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    Host submission from{' '}
                    <Link
                      to={memberProfilePath(resolveCatalogSubmitterUserId(form)!)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold underline"
                    >
                      this member
                    </Link>
                    — add tags, parking, and difficulty before approving.
                  </div>
                ) : null}

                {/* Section 1: Basic Info */}
                <fieldset className={`space-y-4 ${detailStep === 0 ? '' : 'hidden'}`}>
                  <legend className="w-full border-b pb-1 text-sm font-semibold uppercase tracking-wide text-gray-800">
                    {isTrailLike(form.activityType) ? 'Trail information' : 'Place information'}
                  </legend>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        {isTrailLike(form.activityType) ? 'Trail Title' : 'Place title'} *
                      </label>
                      <input type="text" required value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder={
                          form.activityType === 'event'
                            ? 'e.g. RAK Trail Run Course'
                            : isTrailLike(form.activityType)
                              ? 'e.g. Jebel Jais Summit Trail'
                              : 'e.g. Al Qudra Desert Camp'
                        } />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Country</label>
                      <AppSelect
                        value={form.countryCode ?? DEFAULT_COUNTRY}
                        onChange={(countryCode) =>
                          setForm({ ...form, countryCode: countryCode as CountryCode, region: '' })
                        }
                        options={COUNTRY_OPTIONS}
                        inputClassName={ADMIN_SELECT_CLASS}
                        aria-label="Country"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">State / Region *</label>
                      <AppSelect
                        value={form.region ?? ''}
                        onChange={(region) => setForm({ ...form, region })}
                        options={regionOptions.map((region) => ({ value: region, label: region }))}
                        placeholder="Select a region"
                        inputClassName={ADMIN_SELECT_CLASS}
                        aria-label="State or region"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Curated area</label>
                      <AppSelect
                        value={form.destinationId ?? ''}
                        onChange={(destinationId) => {
                          const nextAreaId = destinationId || null;
                          const keepParent =
                            !form.parentPlaceId?.trim() ||
                            segmentPlaces.some(
                              (row) =>
                                row.id === form.parentPlaceId &&
                                !row.parentPlaceId?.trim() &&
                                (!nextAreaId || row.destinationId === nextAreaId)
                            );
                          setForm({
                            ...form,
                            destinationId: nextAreaId,
                            parentPlaceId: keepParent ? form.parentPlaceId ?? null : null,
                          });
                        }}
                        options={adminAreas.map((area) => ({
                          value: area.id,
                          label: `${area.name} · ${area.region}${
                            area.status === 'draft' ? ' (new — not published yet)' : ''
                          }`,
                        }))}
                        placeholder="Link to Hatta, Jebel Jais, …"
                        inputClassName={ADMIN_SELECT_CLASS}
                        aria-label="Curated area"
                      />
                      {adminAreas.find((area) => area.id === form.destinationId)?.status === 'draft' ? (
                        <p className="mt-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                          This place is linked to a new destination. Approving the place will also publish
                          that area on Explore.
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-gray-500">
                          Hosting picks inherit this area when hosts choose this place from the registry.
                        </p>
                      )}
                    </div>
                    {catalogSegment === 'outdoor' && (
                      <div className="col-span-2">
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                          Place hub (optional)
                        </label>
                        <AppSelect
                          value={form.parentPlaceId ?? ''}
                          onChange={(parentPlaceId) =>
                            setForm({ ...form, parentPlaceId: parentPlaceId || null })
                          }
                          options={parentPlaceHubOptions}
                          placeholder={
                            form.destinationId
                              ? 'Group this route under a hub in the same area'
                              : 'Pick a curated area first'
                          }
                          inputClassName={ADMIN_SELECT_CLASS}
                          aria-label="Place hub"
                          disabled={!form.destinationId}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Host destination ladder groups leaf routes (trail, camp, venue) under this hub.
                          Leave empty to group by area label only.
                        </p>
                      </div>
                    )}
                  </div>

                  {isTrailLike(form.activityType) && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Length in KM *</label>
                        <input
                          type="number"
                          step="0.1"
                          min={0}
                          required
                          value={distanceInput}
                          onChange={(e) => {
                            const raw = e.target.value;
                            setDistanceInput(raw);
                            setForm((prev) => ({ ...prev, distance: parseOptionalNumberInput(raw) }));
                          }}
                          className="w-full border rounded-lg px-3 py-2 text-sm"
                          placeholder="12.5"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Elevation (m)</label>
                        <input
                          type="number"
                          min={0}
                          value={elevationInput}
                          onChange={(e) => {
                            const raw = e.target.value;
                            setElevationInput(raw);
                            setForm((prev) => ({ ...prev, elevation: parseOptionalNumberInput(raw) }));
                          }}
                          className="w-full border rounded-lg px-3 py-2 text-sm"
                          placeholder="1934"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      {isTrailLike(form.activityType) ? 'About the Trail' : 'About the place'} *
                    </label>
                    <textarea required value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      rows={5} maxLength={3000}
                      placeholder={
                        form.activityType === 'event'
                          ? 'Describe the event course, terrain, race format...'
                          : isTrailLike(form.activityType)
                            ? 'Describe the trail, terrain, highlights...'
                            : 'Describe the camping place, amenities, surroundings...'
                      } />
                    <p className="text-xs text-gray-400 mt-1">{(form.description?.length ?? 0)}/3000 characters (approx. 500 words)</p>
                  </div>
                </fieldset>

                {/* Section 2: Conditions */}
                <fieldset className={`space-y-4 ${detailStep === 1 ? '' : 'hidden'}`}>
                  <legend className="w-full border-b pb-1 text-sm font-semibold uppercase tracking-wide text-gray-800">Conditions</legend>

                  <AdminPlacesCatalogChipSelect
                    label="Surface Type"
                    options={isTrailLike(form.activityType) ? HIKING_SURFACES : CAMPING_SURFACES}
                    selected={form.surfaceType ?? []}
                    onChange={(item) => toggleArrayItem('surfaceType', item)}
                  />

                  {isTrailLike(form.activityType) && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Suitable for *</label>
                      <div className="flex gap-3">
                        {[{ value: 'easy', label: 'Beginner friendly' }, { value: 'moderate', label: 'Intermediate' }, { value: 'hard', label: 'Expert only' }].map((opt) => (
                          <button key={opt.value} type="button"
                            onClick={() => setForm({ ...form, difficulty: opt.value as PlaceDTO['difficulty'] })}
                            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                              form.difficulty === opt.value ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                            }`}>{opt.label}</button>
                        ))}
                      </div>
                    </div>
                  )}

                  <AdminPlacesCatalogChipSelect
                    label="Select Tags"
                    options={TAG_OPTIONS}
                    selected={form.tags ?? []}
                    onChange={(item) => toggleArrayItem('tags', item)}
                  />

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Season</label>
                    <div className="flex flex-wrap gap-2">
                      {SEASONS.map((s) => (
                        <button key={s} type="button"
                          onClick={() => toggleArrayItem('season', s)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize ${
                            (form.season ?? []).includes(s) ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                          }`}>{s}</button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Highlights (comma-separated)</label>
                    <input type="text" value={highlightInput} onChange={(e) => setHighlightInput(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Summit views, Rock formations" />
                    {highlightInput && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {highlightInput.split(',').map((h) => h.trim()).filter(Boolean).map((h, i) => (
                          <span key={i} className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-xs">{h}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </fieldset>

                {/* Section 3: Media */}
                <fieldset className={`space-y-4 ${detailStep === 2 ? '' : 'hidden'}`}>
                  <legend className="w-full border-b pb-1 text-sm font-semibold uppercase tracking-wide text-gray-800">Media</legend>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Add Photos (minimum 1 required) *</label>
                    <ImageUpload
                      images={form.images ?? []}
                      onChange={(urls) => setForm((prev) => ({ ...prev, images: urls }))}
                      max={8}
                      keyPrefix="locations"
                      kind="location-image"
                      preset="location"
                    />
                  </div>
                </fieldset>

                {/* Section 4: Transportation */}
                <fieldset className={`space-y-4 ${detailStep === 1 ? '' : 'hidden'}`}>
                  <legend className="w-full border-b pb-1 text-sm font-semibold uppercase tracking-wide text-gray-800">Transportation</legend>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Parking Spot (Google Maps link)</label>
                    <input type="url" value={form.parkingLink ?? ''} onChange={(e) => setForm({ ...form, parkingLink: e.target.value || undefined })}
                      className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="https://maps.google.com/..." />
                  </div>
                  <AdminPlacesCatalogChipSelect
                    label="Accessible by"
                    options={isTrailLike(form.activityType) ? HIKING_ACCESSIBLE : CAMPING_ACCESSIBLE}
                    selected={form.accessibleBy ?? []}
                    onChange={(item) => toggleArrayItem('accessibleBy', item)}
                  />
                </fieldset>

                {/* Section 5: Premium map & guide */}
                <fieldset className={`space-y-4 ${detailStep === 3 ? '' : 'hidden'}`}>
                  <legend className="w-full border-b pb-1 text-sm font-semibold uppercase tracking-wide text-gray-800">
                    Route map &amp; paid guide
                  </legend>
                  <p className="text-xs text-gray-500">
                    Upload GPX for offline navigation and a detailed guide for Active (pay-as-you-go), Pro, and GOAT members.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <AssetKeyUpload
                      label="Route map (GPX)"
                      value={form.gpxKey}
                      onChange={(key) => setForm({ ...form, gpxKey: key })}
                      accept=".gpx,application/gpx+xml"
                      kind="location-gpx"
                    />
                    <AssetKeyUpload
                      label="Guide PDF (optional)"
                      value={form.guidePdfKey}
                      onChange={(key) => setForm({ ...form, guidePdfKey: key })}
                      accept=".pdf,application/pdf"
                      kind="location-guide-pdf"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Unlock price (AED)</label>
                    <input
                      type="number"
                      min={0}
                      value={form.unlockPriceAed ?? 29}
                      onChange={(e) => setForm({ ...form, unlockPriceAed: Number(e.target.value) })}
                      className="w-full max-w-xs border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Guide preview (shown when locked)</label>
                    <textarea
                      rows={2}
                      value={form.guidePreview ?? ''}
                      onChange={(e) => setForm({ ...form, guidePreview: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      placeholder="Teaser text — parking tips, best season, what the full guide covers…"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Full guide content (markdown)</label>
                    <textarea
                      rows={8}
                      value={form.guideMarkdown ?? ''}
                      onChange={(e) => setForm({ ...form, guideMarkdown: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm font-mono text-xs"
                      placeholder="## Getting there&#10;…&#10;## Route notes&#10;…"
                    />
                  </div>
                </fieldset>

                <fieldset className={`space-y-4 ${detailStep === 2 ? '' : 'hidden'}`}>
                  <legend className="w-full border-b pb-1 text-sm font-semibold uppercase tracking-wide text-gray-800">Map pin</legend>
                  {editingId && isCatalogMapPlace(form) && (
                    <p className="rounded-xl border border-sky-100 bg-sky-50 px-3 py-2 text-sm text-sky-900">
                      Drag the marker to the real trailhead or camp spot, then save — catalog import will not overwrite it.
                    </p>
                  )}
                  <MapPinPicker latitude={form.latitude} longitude={form.longitude} onChange={handleMapChange} />
                </fieldset>

                {/* Section 6: Additional Settings */}
                <fieldset className={`space-y-4 ${detailStep === 3 ? '' : 'hidden'}`}>
                  <legend className="w-full border-b pb-1 text-sm font-semibold uppercase tracking-wide text-gray-800">Publish settings</legend>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
                      <AppSelect
                        value={form.status ?? 'draft'}
                        onChange={(status) => setForm({ ...form, status: status as PlaceDTO['status'] })}
                        options={LOCATION_STATUS_OPTIONS}
                        inputClassName={ADMIN_SELECT_CLASS}
                        aria-label="Place status"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Max Group Size</label>
                      <input type="number" min={1} value={form.maxGroupSize ?? ''} onChange={(e) => setForm({ ...form, maxGroupSize: e.target.value ? Number(e.target.value) : undefined })}
                        className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="20" />
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={Boolean(form.childFriendly)}
                        onChange={(e) => setForm({ ...form, childFriendly: e.target.checked })}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                      Child Friendly
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={Boolean(form.featured)}
                        onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                      Featured on discover (Near you)
                    </label>
                  </div>
                </fieldset>

                {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
  </>
);
