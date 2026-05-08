"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { today, getLocalTimeZone } from "@internationalized/date";
import type { CalendarEvent, ClassStatus } from "@/lib/types";

type ClassesCalendarProps = {
  events: CalendarEvent[];
};

const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const statusTone: Record<ClassStatus, string> = {
  SEARCHING_PROFESSOR: "cal-event-searching",
  PENDING_CONFIRMATION: "cal-event-confirmation",
  PENDING_PRESENTATION_REVIEW: "cal-event-review",
  PRESENTATION_OK: "cal-event-ok"
};

function formatMonthYear(year: number, month: number) {
  const d = new Date(year, month - 1);
  const label = d.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  const day = new Date(year, month - 1, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function ClassesCalendar({ events }: ClassesCalendarProps) {
  const todayDate = today(getLocalTimeZone());
  const [focusedYear, setFocusedYear] = useState(todayDate.year);
  const [focusedMonth, setFocusedMonth] = useState(todayDate.month);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const existing = map.get(event.classDate);
      if (existing) {
        existing.push(event);
      } else {
        map.set(event.classDate, [event]);
      }
    }
    return map;
  }, [events]);

  function navigateMonth(delta: number) {
    let newMonth = focusedMonth + delta;
    let newYear = focusedYear;
    if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    } else if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    }
    setFocusedMonth(newMonth);
    setFocusedYear(newYear);
  }

  const daysInMonth = getDaysInMonth(focusedYear, focusedMonth);
  const firstDayOffset = getFirstDayOfWeek(focusedYear, focusedMonth);

  const cells: Array<{ day: number | null; events: CalendarEvent[] }> = [];

  for (let i = 0; i < firstDayOffset; i++) {
    cells.push({ day: null, events: [] });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const key = dateKey(focusedYear, focusedMonth, d);
    cells.push({ day: d, events: eventsByDate.get(key) ?? [] });
  }

  const todayKey = dateKey(todayDate.year, todayDate.month, todayDate.day);

  return (
    <section className="cal-section" aria-label="Calendario de clases">
      <header className="cal-header">
        <button
          type="button"
          className="cal-nav-button"
          aria-label="Mes anterior"
          onClick={() => navigateMonth(-1)}
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </button>
        <h2 className="cal-month-label">
          {formatMonthYear(focusedYear, focusedMonth)}
        </h2>
        <button
          type="button"
          className="cal-nav-button"
          aria-label="Mes siguiente"
          onClick={() => navigateMonth(1)}
        >
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </header>

      <div className="cal-grid" role="grid" aria-label="Dias del mes">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="cal-weekday" role="columnheader">
            {label}
          </div>
        ))}

        {cells.map((cell, index) => {
          const key = cell.day ? dateKey(focusedYear, focusedMonth, cell.day) : `empty-${index}`;
          const isToday = key === todayKey;
          const hasEvents = cell.events.length > 0;

          return (
            <div
              key={key}
              className={[
                "cal-cell",
                cell.day === null && "cal-cell-empty",
                isToday && "cal-cell-today",
                hasEvents && "cal-cell-has-events"
              ]
                .filter(Boolean)
                .join(" ")}
              role="gridcell"
            >
              {cell.day !== null ? (
                <>
                  <span className="cal-day-number">{cell.day}</span>
                  <div className="cal-events">
                    {cell.events.map((event) => (
                      <Link
                        key={event.classId}
                        href={`/proposals/${event.proposalId}`}
                        className={`cal-event ${statusTone[event.classStatus] ?? ""}`}
                        title={`${event.classTitle} — ${event.proposalTitle}`}
                      >
                        <span className="cal-event-title">{event.classTitle}</span>
                        <span className={event.professorName ? "cal-event-professor" : "cal-event-professor cal-event-unassigned"}>
                          {event.professorName ?? "Sin Definir"}
                        </span>
                      </Link>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
