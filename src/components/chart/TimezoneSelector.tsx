"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TIMEZONES,
  useChartStore,
  type TimezoneValue,
} from "@/lib/store/chart-store";

export function TimezoneSelector() {
  const timezone = useChartStore((s) => s.timezone);
  const setTimezone = useChartStore((s) => s.setTimezone);

  return (
    <Select value={timezone} onValueChange={(v) => setTimezone(v as TimezoneValue)}>
      <SelectTrigger className="h-7 w-[160px] border-tv-border bg-tv-panel text-xs text-tv-text-muted focus:ring-0">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="border-tv-border bg-tv-panel text-xs text-tv-text">
        {TIMEZONES.map((tz) => (
          <SelectItem key={tz.value} value={tz.value} className="text-xs">
            {tz.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
