#!/usr/bin/env node

import { login } from "./login";
import { loadConfig } from "./config/LoadConfigData";
import { ConfigData } from "./domain/ConfigData";
import ReadMeters from "./modbus/ReadMeters";
import postMeterData from "./SendMeterData";
import { TimeSheet } from "./domain/TimeSheet";
import { buildTimeSheet } from "./helpers/CreateTimeSheet"
import { getTimeSheetRequestPost, getTimeSheetUpdatedInControllerRequestPost } from "./services/TimeSheetService"
//import chalk from "chalk";

async function app() {
  console.log("Hello, app is running");
  try {
    const configData: ConfigData = await loadConfig<ConfigData>('config.json');
    const timeSheet: TimeSheet = await loadConfig<TimeSheet>('timeSheet.json');
    //console.log("Config data: ", configData);
    const token = await login(configData.hostname);
    const timesheetData = await getTimeSheetRequestPost(configData.companyName,configData.hostname,token)
    console.log("timesheetData",timesheetData)
    if(timesheetData.status=="CONTROLLER_UP_TO_DATE"){
      console.log("CONTROLLER_UP_TO_DATE")
    }else{
      const timeSheetBuidl= buildTimeSheet(timesheetData.timeSheet)
      console.log("timeSheetBuidl",timeSheetBuidl)
      console.log("timeSheetBuidl lenght",timeSheetBuidl.readElMeterTimeTable.length)
      console.log("timeSheetBuidl last",timeSheetBuidl.readElMeterTimeTable[timeSheetBuidl.readElMeterTimeTable.length-1])
      await getTimeSheetUpdatedInControllerRequestPost(configData.companyName,configData.hostname,token)
    }
    //intitTimeTable(configData,timeSheet)
    //console.log("data sent");
  } catch (err) {
    console.error("Login failed:", err);
  }
}

async function displayData(meterData: any) {
  console.log("Displaying data");
  console.table(meterData);
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
      //displayData(config)
    });
  });
}

function scheduleDailyTask( hour: number, minute: number, task: () => void): void {
  function scheduleNextRun(): void {
    const now = new Date();
    const nextRun = new Date();

    nextRun.setHours(hour, minute, 0, 0);

    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    const delay = nextRun.getTime() - now.getTime();
    console.log(
      `Task scheduled to run in ${(delay / 1000).toFixed(0)}s at ${nextRun}`
    );

    setTimeout(() => {
      task();
      scheduleNextRun(); // reschedule for the next day
    }, delay);
  }

  scheduleNextRun();
}

app();
