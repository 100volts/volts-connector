import * as http from "http";
import { TimeSheetEntry, TimeSheetResponse } from "../domain/TimeSheet";

export function getTimeSheetRequestPost(
  companyName: string,
  hostname: string,
  accessToken: string
): Promise<TimeSheetResponse> {
  const postData = JSON.stringify({ companyName });

  const options: http.RequestOptions = {
    hostname: hostname,
    port: 8081,
    path: "/api/v1/controller/time-sheet",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(postData),
      Authorization: `Bearer ${accessToken}`,
    },
    protocol: "http:",
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        try {
          const parsed: TimeSheetResponse = JSON.parse(responseData);
          resolve(parsed); // ✅ return only the timesheet list
        } catch (err) {
          reject(`Failed to parse response: ${err}`);
        }
      });
    });

    req.on("error", (e) => {
      reject(`Problem with request send time sheet: ${e.message}`);
    });

    req.write(postData);
    req.end();
  });
}

export function getTimeSheetUpdatedInControllerRequestPost(
    companyName: string,
    hostname: string,
    accessToken: string
  ): Promise<TimeSheetResponse> {
    const postData = JSON.stringify({ companyName });
  
    const options: http.RequestOptions = {
      hostname: hostname,
      port: 8081,
      path: "/api/v1/controller/time-sheet/set-to-controller",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
        Authorization: `Bearer ${accessToken}`,
      },
      protocol: "http:",
    };
  
    return new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let responseData = "";
  
        res.on("data", (chunk) => {
          responseData += chunk;
        });
  
        res.on("end", () => {
          try {
            const parsed: TimeSheetResponse = JSON.parse(responseData);
            resolve(parsed); // ✅ return only the timesheet list
          } catch (err) {
            reject(`Failed to parse response: ${err}`);
          }
        });
      });
  
      req.on("error", (e) => {
        reject(`Problem with request send time sheet: ${e.message}`);
      });
  
      req.write(postData);
      req.end();
    });
  }
