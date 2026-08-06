/** Predefined reasons when a user withdraws from a trip */
export const WITHDRAW_REASONS = [
    { value: 'schedule_conflict', label: 'Schedule conflict' },
    { value: 'cant_attend', label: "Can't make it anymore" },
    { value: 'found_other', label: 'Found another trip' },
    { value: 'health', label: 'Health or personal reasons' },
    { value: 'changed_mind', label: 'Changed my mind' },
    { value: 'other', label: 'Other' }
];
export const withdrawReasonLabel = (value) => WITHDRAW_REASONS.find((r) => r.value === value)?.label ?? value;
