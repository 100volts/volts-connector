#!/usr/bin/env node

import App from "./App";
import { login } from "./login";
import { loadConfig } from "./config/LoadConfigData";
import { ConfigData } from "./domain/ConfigData";
import ReadMeters from "./modbus/ReadMeters";
import postMeterData from "./SendMeterData";
import { TimeSheet } from "./domain/TimeSheet";
import { buildTimeSheet } from "./helpers/CreateTimeSheet";
import { writeTimeSheetToJson } from "./helpers/WriteTimeSheetToJson";
import {
  getTimeSheetRequestPost,
  getTimeSheetUpdatedInControllerRequestPost,
} from "./services/TimeSheetService";
import {
  startLoadingSpinner,
  stopLoadingSpinner,
} from "./LoadingDisplay";
import { isJwtExpired } from "./helpers/JWTHelper";
import WellcomeView from "./view/WellcomeView";
import {
  readMetersTCP,
  readCoil801,
} from "./modbus/ReadMetersTCP";
import { ModbusTCPConfig } from "./domain/ModbusTCPConfig";

let scheduledTasks: NodeJS.Timeout[] = [];
const appInstance = App.getInstance();

async function app() {
  WellcomeView();
  startLoadingSpinner("Loading config data...");
  const timeSheet: TimeSheet = await loadConfig<TimeSheet>(
    "timeSheet.json"
  );
  await appInstance.loadConfigData();
  let configData: ConfigData = appInstance.getConfigData();
  await timeSheetInti(configData, timeSheet);
}

async function timeSheetInti(
  configData: ConfigData,
  timeSheet: TimeSheet
) {
  readSingleCoil801(
    {
      host: "localhost", // Replace with your Modbus TCP device IP
      port: 502, // Standard Modbus TCP port
      timeout: 5000, // 5 second timeout (optional)
    },
    801
  );

  //Начина реда за извикване на четене на електромери
  /*
  const token = await login(configData.hostname);
  console.log("Back from login with token:", token);
  const timeSheetUpToDate = await prepereTimeSheet(
    configData,
    timeSheet,
    token
  );
  //Display
  stopLoadingSpinner("Config data loaded");

  //Initialize timetable
  await intitTimeTableGlobalSchedile(
    configData,
    timeSheetUpToDate,
    token
  );
  */
}

async function checkForTimeSheetUpdates(
  config: ConfigData,
  token: string
): Promise<void> {
  if (isJwtExpired(token)) {
    console.log("Token expired, re-logging in...");
    token = await login(config.hostname);
  }

  const timesheetData = await getTimeSheetRequestPost(
    config.companyName,
    config.hostname,
    token
  );

  if (timesheetData.status == "CONTROLLER_UP_TO_DATE") {
    console.log("No updates for timesheet");
  } else {
    //reinit timesheets
    await intitTimeTableGlobalSchedile(
      config,
      buildTimeSheet(timesheetData.timeSheet),
      token
    );
    console.log("Time sheet update available");
    getTimeSheetUpdatedInControllerRequestPost(
      config.companyName,
      config.hostname,
      token
    );
  }
}

async function displayData(meterData: any) {
  console.log("Displaying data");
  console.table(meterData);
}

async function prepereTimeSheet(
  configData: ConfigData,
  timeSheet: TimeSheet,
  token: string
): Promise<TimeSheet> {
  const timesheetData = await getTimeSheetRequestPost(
    configData.companyName,
    configData.hostname,
    token
  );
  //console.log("timesheetData", timesheetData);

  if (timesheetData.status == "CONTROLLER_UP_TO_DATE") {
    console.log("CONTROLLER_UP_TO_DATE");
    return timeSheet;
  } else {
    const timeSheetBuidl: TimeSheet = buildTimeSheet(
      timesheetData.timeSheet
    );
    writeTimeSheetToJson("timeSheet.json", timeSheetBuidl);
    await getTimeSheetUpdatedInControllerRequestPost(
      configData.companyName,
      configData.hostname,
      token
    );
    return timeSheetBuidl;
  }
}

async function readMeterInstructions(config: ConfigData) {
  const token = await login(config.hostname);
  let meterData = await ReadMeters();
  await postMeterData(meterData, "localhost", token);
  await displayData(meterData);
}

async function readSingleCoil801(
  config: ModbusTCPConfig,
  deviceId: number
) {
  readCoil801(config, deviceId).then((state) => {
    if (state === null) {
      console.error("Failed to read coil 801");
    } else {
      console.log(`Coil 801 state: ${state}`);
    }
  });
}

async function readMeterInstructionsTCP(
  config: ConfigData
) {
  const token = await login(config.hostname);
  const tcpConfig: ModbusTCPConfig = {
    host: "localhost", // Replace with your Modbus TCP device IP
    port: 502, // Standard Modbus TCP port
    timeout: 5000, // 5 second timeout (optional)
  };
  let meterData = await readMetersTCP(tcpConfig);
  //await postMeterData(meterData, "localhost", token);
  await displayData(meterData);
}

function intitTimeTable(
  config: ConfigData,
  timeSheet: TimeSheet
) {
  timeSheet.readElMeterTimeTable.forEach((entry, index) => {
    const hour = parseInt(entry.hower, 10);
    const minute = parseInt(entry.minits, 10);

    if (isNaN(hour) || isNaN(minute)) {
      console.error(
        `Invalid time in timetable entry ${index}:`,
        entry
      );
      return;
    }

    scheduleDailyTask(hour, minute, () => {
      console.log(
        `Running scheduled task from timetable entry ${index} at ${hour}:${minute
          .toString()
          .padStart(2, "0")}`
      );
      // logic for when time sheet entry comes
      readMeterInstructionsTCP(config);
      //displayData(config)
    });
  });
}

async function intitTimeTableGlobalSchedile(
  config: ConfigData,
  timeSheet: TimeSheet,
  token: string
) {
  //await clearScheduledTasks();

  await Promise.all(
    timeSheet.readElMeterTimeTable.map((entry, index) => {
      const hour = parseInt(entry.hower, 10);
      const minute = parseInt(entry.minits, 10);

      if (isNaN(hour) || isNaN(minute)) {
        console.error(
          `Invalid time in timetable entry ${index}:`,
          entry
        );
        return;
      }

      scheduleDailyTask(hour, minute, () => {
        console.log(
          `Running scheduled task from timetable entry ${index} at ${hour}:${minute
            .toString()
            .padStart(2, "0")}`
        );
        // logic for when time sheet entry comes
        checkForTimeSheetUpdates(config, token);
        //displayData(config)
      });
    })
  );
}

function scheduleDailyTask(
  hour: number,
  minute: number,
  task: () => void
): void {
  function scheduleNextRun(
    isFirstRun: boolean = false
  ): void {
    const now = new Date();
    const nextRun = new Date();

    nextRun.setHours(hour, minute, 0, 0);

    // If this is not the first run, always push to tomorrow
    if (!isFirstRun || nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    const delay = nextRun.getTime() - now.getTime();
    /*
    console.log(
      `Task scheduled to run in ${(delay / 1000).toFixed(
        0
      )}s at ${nextRun}`
    );
    */

    const timer = setTimeout(() => {
      task();
      scheduleNextRun(false); // next runs always move forward by a day
    }, delay);

    scheduledTasks.push(timer);
  }

  scheduleNextRun(true); // first run uses today's slot if still upcoming
}

async function clearScheduledTasks() {
  scheduledTasks.forEach((timer) => clearTimeout(timer));
  scheduledTasks = [];
  console.log("All scheduled tasks cleared");
}

(async () => {
  await app();
})();
