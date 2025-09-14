#!/usr/bin/env node

import { login } from "./login";
import { loadConfig } from "./config/LoadConfigData";
import { ConfigData } from "./domain/ConfigData";
import ReadMeters from "./modbus/ReadMeters";
import postMeterData from "./SendMeterData";
import { TimeSheet } from "./domain/TimeSheet";
import { buildTimeSheet } from "./helpers/CreateTimeSheet"
import { writeTimeSheetToJson } from "./helpers/WriteTimeSheetToJson"
import { getTimeSheetRequestPost, getTimeSheetUpdatedInControllerRequestPost } from "./services/TimeSheetService"
//import chalk from "chalk";

let scheduledTasks: NodeJS.Timeout[] = [];

async function app() {
  console.log("Hello, app is running");
  try {
    const configData: ConfigData = await loadConfig<ConfigData>('config.json');
    const timeSheet: TimeSheet = await loadConfig<TimeSheet>('timeSheet.json');
    const token = await login(configData.hostname);
    const timeSheetUpToDate = await prepereTimeSheet(configData,timeSheet,token)
    //intitTimeTable(configData,timeSheet)
    intitTimeTableGlobalSchedile(configData,timeSheet)
    //console.log("data sent");
  } catch (err) {
    console.error("Login failed:", err);
  }
}

async function displayData(meterData: any) {
  console.log("Displaying data");
  console.table(meterData);
}

async function prepereTimeSheet(configData : ConfigData, timeSheet : TimeSheet, token : string) : Promise<TimeSheet> {
  const timesheetData = await getTimeSheetRequestPost(configData.companyName,configData.hostname,token);
  if(timesheetData.status=="CONTROLLER_UP_TO_DATE"){
    console.log("CONTROLLER_UP_TO_DATE");
    return timeSheet;
  }else{
    const timeSheetBuidl : TimeSheet = buildTimeSheet(timesheetData.timeSheet)
    console.log("timeSheetBuidl lenght",timeSheetBuidl.readElMeterTimeTable.length)
    writeTimeSheetToJson("timeSheet.json",timeSheetBuidl)
    await getTimeSheetUpdatedInControllerRequestPost(configData.companyName,configData.hostname,token)
    return timeSheetBuidl;
  }
}

async function readMeterInstructions(config: ConfigData){
  const token = await login(config.hostname);
  let meterData = await ReadMeters();
  await postMeterData(meterData, "localhost", token);
  await displayData(meterData)
}

function intitTimeTable(config: ConfigData, timeSheet: TimeSheet){
  timeSheet.readElMeterTimeTable.forEach((entry, index) => {
    const hour = parseInt(entry.hower, 10);
    const minute = parseInt(entry.minits, 10);
  
    if (isNaN(hour) || isNaN(minute)) {
      console.error(`Invalid time in timetable entry ${index}:`, entry);
      return;
    }
  
    scheduleDailyTask(hour, minute, () => {
      console.log(
        `Running scheduled task from timetable entry ${index} at ${hour}:${minute
          .toString()
          .padStart(2, "0")}`
      );
      // logic for when time sheet entry comes
      //displayData(config)
    });
  });
}

function intitTimeTableGlobalSchedile(config: ConfigData, timeSheet: TimeSheet) {
  clearScheduledTasks();

  timeSheet.readElMeterTimeTable.forEach((entry, index) => {
    const hour = parseInt(entry.hower, 10);
    const minute = parseInt(entry.minits, 10);

    if (isNaN(hour) || isNaN(minute)) {
      console.error(`Invalid time in timetable entry ${index}:`, entry);
      return;
    }

    scheduleDailyTask(hour, minute, () => {
      console.log(
        `Running scheduled task from timetable entry ${index} at ${hour}:${minute
          .toString()
          .padStart(2, "0")}`
      );
      // logic for when time sheet entry comes
      //displayData(config)
    });
  });
}

function scheduleDailyTask(hour: number, minute: number, task: () => void): void {
  function scheduleNextRun(isFirstRun: boolean = false): void {
    const now = new Date();
    const nextRun = new Date();

    nextRun.setHours(hour, minute, 0, 0);

    // If this is not the first run, always push to tomorrow
    if (!isFirstRun || nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    const delay = nextRun.getTime() - now.getTime();
    console.log(
      `Task scheduled to run in ${(delay / 1000).toFixed(0)}s at ${nextRun}`
    );

    const timer = setTimeout(() => {
      task();
      scheduleNextRun(false); // next runs always move forward by a day
    }, delay);

    scheduledTasks.push(timer);
  }

  scheduleNextRun(true); // first run uses today's slot if still upcoming
}



function clearScheduledTasks() {
  scheduledTasks.forEach(timer => clearTimeout(timer));
  scheduledTasks = [];
  console.log("All scheduled tasks cleared");
}


app();
