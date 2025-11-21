import { ModbusTCPConfig } from "../domain/ModbusTCPConfig";
import { readMetersTCP } from "./ReadMetersTCP";
/**
 * Example usage of the Modbus TCP meter reading functionality
 */
async function exampleUsage() {
  // Configuration for Modbus TCP connection
  const tcpConfig: ModbusTCPConfig = {
    host: "192.168.1.100", // Replace with your Modbus TCP device IP
    port: 502, // Standard Modbus TCP port
    timeout: 5000, // 5 second timeout (optional)
  };

  try {
    console.log("Starting Modbus TCP meter reading...");

    // Read meters using TCP connection
    const meterData = await readMetersTCP(tcpConfig);

    console.log("Meter readings completed successfully:");
    console.log(JSON.stringify(meterData, null, 2));

    // Process the data as needed
    meterData.forEach((meter) => {
      console.log(
        `${meter.name}: Active Import = ${meter.energyActiveImport}kWh`
      );
    });
  } catch (error) {
    console.error(
      "Failed to read meters via Modbus TCP:",
      error
    );
  }
}

// Uncomment to run the example
// exampleUsage();

export { exampleUsage };
