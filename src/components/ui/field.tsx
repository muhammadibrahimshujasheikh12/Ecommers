import { useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/utils/cn";

type FieldShellProps = {
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
  children: ReactNode;
  className?: string;
  hideLabel?: boolean;
};

export function FieldShell({ id, label, error, hint, required, children, className, hideLabel }: FieldShellProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className={cn("font-ui text-[13px] font-medium tracking-[0.04em] text-charcoal", hideLabel && "sr-only")}>
        {label}
        {required && (
          <span aria-hidden className="text-ink-3">
            {" "}
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-[13px] leading-snug text-sale">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[13px] leading-snug text-ink-3">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const inputClasses = (invalid?: boolean) =>
  cn(
    "h-12 w-full rounded-[2px] border bg-white/60 px-4 font-ui text-[15px] text-charcoal placeholder:text-ink-3/80",
    "transition-colors duration-200 focus:border-charcoal focus:bg-white focus:outline-none focus-visible:outline-none",
    "disabled:cursor-not-allowed disabled:bg-cream disabled:text-ink-3",
    invalid ? "border-sale" : "border-line-strong hover:border-ink-3",
  );

type InputProps = ComponentProps<"input"> & { label: string; error?: string; hint?: ReactNode; hideLabel?: boolean; containerClassName?: string };

export function Input({ label, error, hint, hideLabel, required, id, className, containerClassName, ...rest }: InputProps) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <FieldShell id={fieldId} label={label} error={error} hint={hint} required={required} hideLabel={hideLabel} className={containerClassName}>
      <input
        id={fieldId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        className={cn(inputClasses(Boolean(error)), className)}
        {...rest}
      />
    </FieldShell>
  );
}

type TextareaProps = ComponentProps<"textarea"> & { label: string; error?: string; hint?: ReactNode; containerClassName?: string };

export function Textarea({ label, error, hint, required, id, className, containerClassName, ...rest }: TextareaProps) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <FieldShell id={fieldId} label={label} error={error} hint={hint} required={required} className={containerClassName}>
      <textarea
        id={fieldId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        className={cn(inputClasses(Boolean(error)), "h-auto min-h-32 py-3 leading-relaxed", className)}
        {...rest}
      />
    </FieldShell>
  );
}

type SelectProps = ComponentProps<"select"> & { label: string; error?: string; hint?: ReactNode; hideLabel?: boolean; containerClassName?: string };

export function Select({ label, error, hint, hideLabel, required, id, className, containerClassName, children, ...rest }: SelectProps) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <FieldShell id={fieldId} label={label} error={error} hint={hint} required={required} hideLabel={hideLabel} className={containerClassName}>
      <div className="relative">
        <select
          id={fieldId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          className={cn(inputClasses(Boolean(error)), "appearance-none pr-10", className)}
          {...rest}
        >
          {children}
        </select>
        <svg aria-hidden viewBox="0 0 24 24" className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-ink-2" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </FieldShell>
  );
}

type CheckboxProps = Omit<ComponentProps<"input">, "type"> & { label: ReactNode; error?: string };

export function Checkbox({ label, error, id, className, ...rest }: CheckboxProps) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label htmlFor={fieldId} className="flex cursor-pointer items-start gap-3 text-[14px] leading-snug text-ink-2">
        <input
          id={fieldId}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          className="mt-0.5 size-[18px] shrink-0 cursor-pointer appearance-none rounded-[2px] border border-line-strong bg-white/60 bg-center bg-no-repeat transition-colors checked:border-charcoal checked:bg-charcoal checked:bg-[url('data:image/svg+xml;utf8,<svg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2016%2016%22><path%20d=%22M3.5%208.5l3%203%206-7%22%20fill=%22none%22%20stroke=%22%23fbf8f3%22%20stroke-width=%221.8%22/></svg>')]"
          {...rest}
        />
        <span>{label}</span>
      </label>
      {error && (
        <p id={`${fieldId}-error`} role="alert" className="pl-[30px] text-[13px] text-sale">
          {error}
        </p>
      )}
    </div>
  );
}
