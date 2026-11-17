import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  JOIN_REQUEST_MODAL_IDLE,
  joinRequestModalFormError,
  joinRequestModalFormWithError,
  joinRequestModalIsSubmitting,
  joinRequestModalShowSuccess,
  type JoinRequestModalStatus,
} from './joinRequestModalStatus';

describe('joinRequestModalStatus', () => {
  it('keeps form, submitting, and success mutually exclusive', () => {
    expect(joinRequestModalShowSuccess(JOIN_REQUEST_MODAL_IDLE)).toBe(false);
    expect(joinRequestModalIsSubmitting(JOIN_REQUEST_MODAL_IDLE)).toBe(false);
    expect(joinRequestModalFormError(JOIN_REQUEST_MODAL_IDLE)).toBeNull();

    const submitting: JoinRequestModalStatus = { kind: 'submitting' };
    expect(joinRequestModalShowSuccess(submitting)).toBe(false);
    expect(joinRequestModalIsSubmitting(submitting)).toBe(true);
    expect(joinRequestModalFormError(submitting)).toBeNull();

    const success: JoinRequestModalStatus = { kind: 'success' };
    expect(joinRequestModalShowSuccess(success)).toBe(true);
    expect(joinRequestModalIsSubmitting(success)).toBe(false);
    expect(joinRequestModalFormError(success)).toBeNull();
  });

  it('keeps validation errors on the form instead of a success screen', () => {
    const invalid = joinRequestModalFormWithError('Tick every must-have item before joining.');
    expect(invalid.kind).toBe('form');
    expect(joinRequestModalShowSuccess(invalid)).toBe(false);
    expect(joinRequestModalFormError(invalid)).toMatch(/must-have/);
  });

  it('enters success only after submitActivityJoin resolves', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/ui/JoinRequestModal.tsx'), 'utf8');
    const awaitIdx = source.indexOf('await submitActivityJoin');
    const successIdx = source.indexOf("setStatus({ kind: 'success' })");
    expect(awaitIdx).toBeGreaterThan(0);
    expect(successIdx).toBeGreaterThan(awaitIdx);
    expect(source).not.toMatch(/setSubmitted\(true\)/);
  });
});
