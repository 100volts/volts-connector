import { TimeSheetEntry, TimeSheet } from "../domain/TimeSheet";


export function buildTimeSheet(entries: TimeSheetEntry[]): TimeSheet {
    const result: { hower: string; minits: string }[] = [];
  
    for (const entry of entries) {
      if (!entry.isActive) continue;
  
      // Parse start time
      const [startHour, startMin] = entry.startTime.split(":").map(Number);
      const startMinutes = startHour * 60 + startMin;
  
      let currentMinutes = startMinutes;
      let first = true;
  
      while (first || currentMinutes % (24 * 60) !== startMinutes) {
        first = false;
  
        const hour = Math.floor((currentMinutes % (24 * 60)) / 60);
        const minute = currentMinutes % 60;
  
        result.push({
          hower: hour.toString().padStart(2, "0"),
          minits: minute.toString().padStart(2, "0"),
        });
  
        currentMinutes += entry.timeoutMinutes;
      }
    }
  
    return { readElMeterTimeTable: result };
  }