"use client";

import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import {
  Calendar,
  DateField,
  DatePicker,
  ListBox,
  NumberField,
  Select,
  TimeField
} from "@heroui/react";
import { parseDate, parseTime, type DateValue, type Time } from "@internationalized/date";

export type SelectOption = {
  key: string;
  label: string;
  tone?: string;
};

function parseDateValue(value?: string | null) {
  if (!value) {
    return null;
  }

  try {
    return parseDate(value);
  } catch {
    return null;
  }
}

function parseTimeValue(value?: string | null) {
  if (!value) {
    return null;
  }

  try {
    return parseTime(value.slice(0, 5));
  } catch {
    return null;
  }
}

export function AppSelect({
  ariaLabel,
  isDisabled,
  name,
  onChange,
  options,
  placeholder = "Seleccionar",
  value
}: {
  ariaLabel: string;
  isDisabled?: boolean;
  name?: string;
  onChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  value: string;
}) {
  const selectedOption = options.find((option) => option.key === value);
  const selectedLabel = selectedOption?.label ?? placeholder;
  const selectedTone = selectedOption?.tone ?? "";

  return (
    <>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <Select
        aria-label={ariaLabel}
        className="app-select"
        isDisabled={isDisabled}
        placeholder={placeholder}
        selectedKey={value || null}
        onSelectionChange={(key) => onChange?.(key == null ? "" : String(key))}
      >
        <Select.Trigger className={["app-select-trigger", selectedTone].filter(Boolean).join(" ")}>
          <span className={["app-select-value", selectedTone].filter(Boolean).join(" ")}>{selectedLabel}</span>
          <Select.Indicator>
            <ChevronDown size={16} aria-hidden="true" />
          </Select.Indicator>
        </Select.Trigger>
        <Select.Popover className="app-select-popover">
          <ListBox className="app-select-listbox">
            {options.map((item) => (
              <ListBox.Item className={["app-select-item", item.tone].filter(Boolean).join(" ")} id={item.key} key={item.key} textValue={item.label}>
                {item.label}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>
    </>
  );
}

export function AppDatePicker({
  ariaLabel,
  name,
  onChange,
  required,
  value
}: {
  ariaLabel: string;
  name?: string;
  onChange: (value: string) => void;
  required?: boolean;
  value: string;
}) {
  const dateValue = parseDateValue(value);

  return (
    <>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <DatePicker
        aria-label={ariaLabel}
        className="app-date-picker"
        isRequired={required}
        value={dateValue}
        onChange={(nextValue: DateValue | null) => onChange(nextValue?.toString() ?? "")}
      >
        <DateField.Group className="app-date-group" fullWidth>
          <DateField.Input className="app-date-input">{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
          <DateField.Suffix>
            <DatePicker.Trigger className="app-field-icon-button" aria-label={`Abrir calendario ${ariaLabel}`}>
              <CalendarDays size={16} aria-hidden="true" />
            </DatePicker.Trigger>
          </DateField.Suffix>
        </DateField.Group>
        <DatePicker.Popover className="app-date-popover" placement="bottom start">
          <Calendar className="app-calendar">
            <Calendar.Header className="app-calendar-header">
              <Calendar.NavButton className="app-calendar-nav" slot="previous">
                <ChevronLeft size={16} aria-hidden="true" />
              </Calendar.NavButton>
              <Calendar.Heading />
              <Calendar.NavButton className="app-calendar-nav" slot="next">
                <ChevronRight size={16} aria-hidden="true" />
              </Calendar.NavButton>
            </Calendar.Header>
            <Calendar.Grid className="app-calendar-grid">
              <Calendar.GridHeader>{(day) => <Calendar.HeaderCell className="app-calendar-header-cell">{day}</Calendar.HeaderCell>}</Calendar.GridHeader>
              <Calendar.GridBody>{(date) => <Calendar.Cell className="app-calendar-cell" date={date} />}</Calendar.GridBody>
            </Calendar.Grid>
          </Calendar>
        </DatePicker.Popover>
      </DatePicker>
    </>
  );
}

export function AppTimeField({
  ariaLabel,
  onChange,
  required,
  value
}: {
  ariaLabel: string;
  onChange: (value: string) => void;
  required?: boolean;
  value: string;
}) {
  const timeValue = parseTimeValue(value);

  return (
    <TimeField
      aria-label={ariaLabel}
      className="app-time-field"
      granularity="minute"
      hourCycle={24}
      isRequired={required}
      value={timeValue}
      onChange={(nextValue: Time | null) => onChange(nextValue?.toString().slice(0, 5) ?? "")}
    >
      <TimeField.Group className="app-date-group" fullWidth>
        <TimeField.Input className="app-date-input">{(segment) => <TimeField.Segment segment={segment} />}</TimeField.Input>
      </TimeField.Group>
    </TimeField>
  );
}

export function AppNumberField({
  ariaLabel,
  minValue,
  onChange,
  step,
  value
}: {
  ariaLabel: string;
  minValue?: number;
  onChange: (value: number) => void;
  step?: number;
  value: number;
}) {
  return (
    <NumberField
      aria-label={ariaLabel}
      className="app-number-field"
      formatOptions={{ maximumFractionDigits: 2 }}
      minValue={minValue}
      step={step}
      value={Number.isFinite(value) ? value : 0}
      onChange={(nextValue) => onChange(Number.isFinite(nextValue) ? nextValue : 0)}
    >
      <NumberField.Group className="app-number-group">
        <NumberField.DecrementButton className="app-number-stepper" aria-label={`Reducir ${ariaLabel}`}>
          <Minus size={13} aria-hidden="true" />
        </NumberField.DecrementButton>
        <NumberField.Input className="app-number-input" />
        <NumberField.IncrementButton className="app-number-stepper" aria-label={`Aumentar ${ariaLabel}`}>
          <Plus size={13} aria-hidden="true" />
        </NumberField.IncrementButton>
      </NumberField.Group>
    </NumberField>
  );
}
