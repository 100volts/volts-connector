import * as fs from "fs";
import { TimeSheetEntry, TimeSheet } from "../domain/TimeSheet";


export function buildTimeSheet(entries: TimeSheetEntry[]): TimeSheet {
    const result: { hower: string; minits: string }[] = [];
  
    for (const entry of entries) {
      if (!entry.isActive) continue;
  
      // Parse start time
      let [startHour, startMin] = entry.startTime.split(":").map(Number);
      let currentMinutes = startHour * 60 + startMin;
  
      // Loop until 24h
      while (currentMinutes < 24 * 60) {
        const hour = Math.floor(currentMinutes / 60);
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

/*
export function buildTimeSheet(entries: TimeSheetEntry[]): TimeSheet {
    const result: { hower: string; minits: string }[] = [];
  
    // Collect all active minutes from all entries
    entries
      .filter((entry) => entry.isActive)
      .forEach((entry) => {
        const [startH, startM] = entry.startTime.split(":").map(Number);
        const start = startH * 60 + startM; // minutes since midnight
        const end = start + entry.timeoutMinutes;
  
        for (let minute = start; minute < end && minute < 24 * 60; minute++) {
          const h = Math.floor(minute / 60);
          const m = minute % 60;
          result.push({
            hower: String(h).padStart(2, "0"),
            minits: String(m).padStart(2, "0"),
          });
        }
      });
  
    return { readElMeterTimeTable: result };
  }
    */