import { useEffect, useRef } from 'react';

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
};

const OTP_LENGTH = 6;

export const OtpInput = ({ value, onChange, disabled = false, autoFocus = false }: OtpInputProps) => {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: OTP_LENGTH }, (_, index) => value[index] ?? '');

  useEffect(() => {
    if (autoFocus) {
      inputRefs.current[0]?.focus();
    }
  }, [autoFocus]);

  const updateDigit = (index: number, nextChar: string) => {
    const sanitized = nextChar.replace(/\D/g, '').slice(-1);
    const chars = value.padEnd(OTP_LENGTH, ' ').split('');
    chars[index] = sanitized || '';
    const nextValue = chars.join('').replace(/\s/g, '').slice(0, OTP_LENGTH);
    onChange(nextValue);
    if (sanitized && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, key: string) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (text: string) => {
    const pasted = text.replace(/\D/g, '').slice(0, OTP_LENGTH);
    onChange(pasted);
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();
  };

  return (
    <div className="flex justify-center gap-2">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            inputRefs.current[index] = element;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(event) => updateDigit(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event.key)}
          onPaste={(event) => {
            event.preventDefault();
            handlePaste(event.clipboardData.getData('text'));
          }}
          className="h-12 w-10 rounded-xl border border-gray-200 text-center text-lg font-semibold text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:opacity-60"
          aria-label={`Digit ${index + 1}`}
        />
      ))}
    </div>
  );
};
