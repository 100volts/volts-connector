import * as http from "http";
import { TimeSheetEntry, TimeSheetResponse } from "../domain/TimeSheet";
import {  stopLoadingSpinner } from "../LoadingDisplay";

export async function getTimeSheetRequestPost(
  companyName: string,
  hostname: string,
  accessToken: string
): Promise<TimeSheetResponse> {
try {
    const postData = JSON.stringify({ companyName });
    const response = await fetch(
      `http://${hostname}:8081/api/v1/controller/time-sheet`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: postData,
      }
    );
    console.log("response",response)
    if (!response.ok) {
      console.log("Response text:", await response.text());
      //  throw new Error("Network response was not ok");
    }

    const data: TimeSheetResponse = await response.json();
    return data; // return it so index.ts can use it
  } catch (e) {
    console.log("Notwork Connection is down");
    stopLoadingSpinner("Notwork Connection is down")
    //console.log(e);
  }finally{
    const mockTimeSheetResponse: TimeSheetResponse = {
      status: "success",
      timeSheet: [
        {
          id: "1",
          meterId: "MTR-001",
          isActive: true,
          startTime: "08:30",
          timeoutMinutes: 120,
        }
      ]
    }
    return Promise.resolve(mockTimeSheetResponse);
  }
}

export async function getTimeSheetUpdatedInControllerRequestPost(
  companyName: string,
  hostname: string,
  accessToken: string
): Promise<TimeSheetResponse> {
try {
    const postData = JSON.stringify({ companyName });
    const response = await fetch(
      `http://${hostname}:8081/api/v1/controller/time-sheet/set-to-controller`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: postData,
      }
    );
    console.log("response",response)
    if (!response.ok) {
      console.log("Response text:", await response.text());
      //  throw new Error("Network response was not ok");
    }

    const data: TimeSheetResponse = await response.json();
    return data; // return it so index.ts can use it
  } catch (e) {
    console.log("Notwork Connection is down");
    //console.log(e);
  }finally{
    const mockTimeSheetResponse: TimeSheetResponse = {
      status: "success",
      timeSheet: [
        {
          id: "1",
          meterId: "MTR-001",
          isActive: true,
          startTime: "08:30",
          timeoutMinutes: 120,
        }
      ]
    }
    return Promise.resolve(mockTimeSheetResponse);
  }
}