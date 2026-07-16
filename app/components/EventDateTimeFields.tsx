"use client";

import { useMemo, useState } from "react";

const pad = (value: number) => String(value).padStart(2, "0");

export default function EventDateTimeFields({ dateLabel, timeLabel, dateDefault = "", timeDefault = "" }: { dateLabel: string; timeLabel: string; dateDefault?: string; timeDefault?: string }) {
  const today = new Date();
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [date, setDate] = useState(dateDefault);
  const [time, setTime] = useState(timeDefault || "21:00");
  const [open, setOpen] = useState<"date" | "time" | null>(null);
  const days = useMemo(() => {
    const offset = (month.getDay() + 6) % 7;
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return Array.from({ length: offset + count }, (_, index) => index < offset ? null : index - offset + 1);
  }, [month]);
  const stamp = (day: number) => `${pad(day)}.${pad(month.getMonth() + 1)}.${month.getFullYear()}`;

  return <div className="form-split event-datetime-fields">
    <label>{dateLabel}
      <button aria-expanded={open === "date"} className={`event-picker-trigger ${open === "date" ? "is-open" : ""}`} onClick={() => setOpen(open === "date" ? null : "date")} type="button">
        <span>{date || "ДД.ММ.ГГГГ"}</span><span className="material-symbols-rounded" aria-hidden="true">calendar_month</span>
      </button>
      <input name="date" type="hidden" value={date} readOnly />
      {open === "date" && <div className="event-picker-popover" role="dialog" aria-label={dateLabel}>
        <header><button aria-label="Предыдущий месяц" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} type="button">‹</button><b>{new Intl.DateTimeFormat("ru", { month: "long", year: "numeric" }).format(month)}</b><button aria-label="Следующий месяц" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} type="button">›</button></header>
        <div className="event-weekdays">{["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day) => <span key={day}>{day}</span>)}</div>
        <div className="event-calendar-days">{days.map((day, index) => day ? <button aria-label={stamp(day)} className={date === stamp(day) ? "is-selected" : ""} key={day} onClick={() => { setDate(stamp(day)); setOpen(null); }} type="button">{day}</button> : <span key={index} />)}</div>
      </div>}
    </label>
    <label>{timeLabel}
      <button aria-expanded={open === "time"} className={`event-picker-trigger ${open === "time" ? "is-open" : ""}`} onClick={() => setOpen(open === "time" ? null : "time")} type="button">
        <span>{time}</span><span className="material-symbols-rounded" aria-hidden="true">schedule</span>
      </button>
      <input name="time" type="hidden" value={time} readOnly />
      {open === "time" && <div className="event-picker-popover event-time-popover" role="dialog" aria-label={timeLabel}>
        <p>Выбери время</p><div>{[16, 17, 18, 19, 20, 21, 22, 23].map((hour) => <button className={time.startsWith(`${pad(hour)}:`) ? "is-selected" : ""} key={hour} onClick={() => { setTime(`${pad(hour)}:00`); setOpen(null); }} type="button">{pad(hour)}:00</button>)}</div>
      </div>}
    </label>
  </div>;
}
