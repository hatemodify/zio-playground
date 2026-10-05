import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { cn } from '@/lib/cn';
import { hourHandAngle, hourOf, minuteHandAngle, minuteOf, normalizeTime, timeLabel } from '@/data/clock';

export type ClockHand = 'hour' | 'minute';

interface ClockFaceProps {
  /** Minutes past 12:00 (0–719); see data/clock. */
  time: number;
  /** Minute-hand snapping: 60 for o'clock only, 30 for halves, 5 for five-minute times. */
  step?: number;
  /** Lets the child turn the hands with a finger. */
  interactive?: boolean;
  /** Only the hour hand moves; the minute hand stays on the 12 (the very first lessons). */
  hourOnly?: boolean;
  /** Prints 5·10·15… around the rim so the minute hand can be read. */
  minuteRing?: boolean;
  onChange?: (time: number) => void;
  /** Fires when the finger lifts, with the final snapped time — a good moment to read it aloud. */
  onRelease?: (time: number) => void;
  className?: string;
}

const SIZE = 240;
const CENTER = SIZE / 2;
const HOUR_LENGTH = 46;
const MINUTE_LENGTH = 74;
const RADIANS = Math.PI / 180;
const point = (angle: number, radius: number) => ({ x: CENTER + Math.sin(angle * RADIANS) * radius, y: CENTER - Math.cos(angle * RADIANS) * radius });
const angleDistance = (a: number, b: number) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };

/** Keeps the rendered rotation continuous (355° → 5° turns +10°, not −350°), so the CSS transition takes the short way round. */
function useContinuousAngle(angle: number): number {
  const previous = useRef(angle);
  const delta = (((angle - previous.current) % 360) + 540) % 360 - 180;
  previous.current += delta;
  return previous.current;
}

interface Drag { hand: ClockHand; pointerId: number; lastAngle: number; turned: number; base: number; value: number }

/**
 * A learning clock. The hands are real SVG lines the child can grab and turn;
 * the hour hand creeps along with the minutes like a real clock, and turning
 * the minute hand past the 12 carries the hour. Dragging works by rotation
 * relative to where the finger started, so grabbing a little beside the hand
 * is fine for small fingers.
 */
export default function ClockFace({ time, step = 5, interactive = false, hourOnly = false, minuteRing = false, onChange, onRelease, className }: ClockFaceProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<Drag | null>(null);
  const [dragging, setDragging] = useState<ClockHand | null>(null);
  const hourAngle = hourHandAngle(time);
  const minuteAngle = minuteHandAngle(time);
  const hourDeg = useContinuousAngle(hourAngle);
  const minuteDeg = useContinuousAngle(minuteAngle);

  function pointerAngle(event: ReactPointerEvent<SVGSVGElement>) {
    const rect = svgRef.current!.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * SIZE - CENTER;
    const y = ((event.clientY - rect.top) / rect.height) * SIZE - CENTER;
    return { angle: ((Math.atan2(x, -y) / RADIANS) + 360) % 360, radius: Math.hypot(x, y) };
  }

  function onPointerDown(event: ReactPointerEvent<SVGSVGElement>) {
    if (!interactive || drag.current) return;
    const { angle, radius } = pointerAngle(event);
    if (radius > CENTER) return;
    const toHour = angleDistance(angle, hourAngle);
    const toMinute = angleDistance(angle, minuteAngle);
    let hand: ClockHand;
    if (hourOnly) hand = 'hour';
    // When the hands lie together, the inner part of the dial grabs the short hand and the outer part the long one.
    else if (Math.abs(toHour - toMinute) < 20) hand = radius > HOUR_LENGTH + 10 ? 'minute' : 'hour';
    else hand = toHour < toMinute ? 'hour' : 'minute';
    drag.current = { hand, pointerId: event.pointerId, lastAngle: angle, turned: 0, base: time, value: time };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
    setDragging(hand);
  }

  function onPointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    const state = drag.current;
    if (!state || state.pointerId !== event.pointerId) return;
    const { angle } = pointerAngle(event);
    let delta = angle - state.lastAngle;
    if (delta > 180) delta -= 360;
    else if (delta < -180) delta += 360;
    state.lastAngle = angle;
    state.turned += delta;
    // The minute hand moves 6° a minute and snaps to the lesson's step; the hour hand moves 30° an hour and keeps the minutes.
    const next = state.hand === 'minute'
      ? normalizeTime(state.base + Math.round(state.turned / 6 / step) * step)
      : normalizeTime(state.base + Math.round(state.turned / 30) * 60);
    if (next !== state.value) {
      state.value = next;
      onChange?.(next);
    }
  }

  function onPointerEnd(event: ReactPointerEvent<SVGSVGElement>) {
    const state = drag.current;
    if (!state || state.pointerId !== event.pointerId) return;
    drag.current = null;
    setDragging(null);
    try { event.currentTarget.releasePointerCapture(event.pointerId); } catch { /* already released */ }
    onRelease?.(state.value);
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className={cn('clock-face', interactive && 'clock-face-interactive', dragging && 'clock-dragging', className)}
      role="img"
      aria-label={`시계 ${timeLabel(time)}`}
      data-clock=""
      data-time={time}
      data-hour={hourOf(time)}
      data-minute={minuteOf(time)}
      data-dragging={dragging ?? undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
    >
      <circle cx={CENTER} cy={CENTER} r={118} className="clock-band" />
      {minuteRing && Array.from({ length: 12 }, (_, index) => {
        const minute = (index + 1) * 5;
        const { x, y } = point(minute * 6, 108);
        return <text key={minute} x={x} y={y} className="clock-minute-number" textAnchor="middle" dominantBaseline="central">{minute}</text>;
      })}
      <circle cx={CENTER} cy={CENTER} r={97} className="clock-rim" />
      <circle cx={CENTER} cy={CENTER} r={92} className="clock-dial" />
      {Array.from({ length: 60 }, (_, index) => {
        const major = index % 5 === 0;
        const from = point(index * 6, major ? 82 : 86);
        const to = point(index * 6, 90);
        return <line key={index} x1={from.x} y1={from.y} x2={to.x} y2={to.y} className={major ? 'clock-tick-hour' : 'clock-tick'} />;
      })}
      {Array.from({ length: 12 }, (_, index) => {
        const hour = index + 1;
        const { x, y } = point(hour * 30, 68);
        return <text key={hour} x={x} y={y} className="clock-number" textAnchor="middle" dominantBaseline="central">{hour}</text>;
      })}
      <g className="clock-hand clock-hand-hour" style={{ transform: `rotate(${hourDeg}deg)` }}>
        <line x1={CENTER} y1={CENTER + 12} x2={CENTER} y2={CENTER - HOUR_LENGTH} />
        {interactive && <circle cx={CENTER} cy={CENTER - HOUR_LENGTH} r={12} className="clock-knob" />}
      </g>
      <g className="clock-hand clock-hand-minute" style={{ transform: `rotate(${minuteDeg}deg)` }}>
        <line x1={CENTER} y1={CENTER + 14} x2={CENTER} y2={CENTER - MINUTE_LENGTH} />
        {interactive && !hourOnly && <circle cx={CENTER} cy={CENTER - MINUTE_LENGTH} r={12} className="clock-knob" />}
      </g>
      <circle cx={CENTER} cy={CENTER} r={7} className="clock-pin" />
    </svg>
  );
}
