export interface TimeSheet{
    readElMeterTimeTable: { hower: string; minits: string }[];
}

export interface TimeSheetEntry{
    id: string;
    meterId: string;
    isActive: boolean;
    startTime: string; // "HH:mm"
    timeoutMinutes: number;
}

export interface TimeSheetResponse { //This is the response form server
    timeSheet: TimeSheetEntry[];
    status: string;
  }

export interface MinuteEntry {
    time: string;   // "HH:mm"
    active: boolean;
}