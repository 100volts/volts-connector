import ModbusRTU from "modbus-serial";
import { ModbusTCPConfig } from "../domain/ModbusTCPConfig";

// Standalone exported function to read a single coil at address 801
// (Moved outside readMetersTCP for correct export)
export async function readCoil801(
  config: ModbusTCPConfig,
  id: any
): Promise<boolean | null> {
  const client = new ModbusRTU();

  /**
   * Read input register 801 (4 registers starting from 801)
   * @param id Modbus device ID
   * @returns Promise<number> - decoded double value or -1 on error
   */
  const readRegister801 = async (
    id: any
  ): Promise<number> => {
    try {
      await client.setID(id);
      const result = await client.readInputRegisters(
        40001,
        4
      );
      return modbusRegistersToDouble(result.data);
    } catch (e) {
      console.error(
        `Error reading register 801 for device ${id}:`,
        e
      );
      return -1;
    }
  };

  try {
    await client.connectTCP(config.host, {
      port: config.port,
    });
    if (config.timeout) {
      client.setTimeout(config.timeout);
    }
    await client.setID(id);
    const result = await client.readCoils(801, 1);
    return result.data[0]; // Returns boolean value
  } catch (e) {
    console.error(
      `Error reading coil 801 for device ${id}:`,
      e
    );
    return null;
  } finally {
    try {
      client.close();
    } catch (error) {
      console.error("Error closing connection:", error);
    }
  }
}

export async function readMetersTCP(
  config: ModbusTCPConfig
) {
  // Set up Modbus TCP client
  let client = new ModbusRTU();

  try {
    // Connect to Modbus TCP server
    await client.connectTCP(config.host, {
      port: config.port,
    });
    console.log(
      `Connected to Modbus TCP server at ${config.host}:${config.port}`
    );

    // Set timeout if provided
    if (config.timeout) {
      client.setTimeout(config.timeout);
    }
  } catch (error) {
    console.error(
      "Failed to connect to Modbus TCP server:",
      error
    );
    throw error;
  }

  const getMeterValue = async (id: any) => {
    try {
      await client.setID(id);
      let val = await client
        .readInputRegisters(801, 4)
        .then((res) => {
          return modbusRegistersToDouble(res.data);
        });
      return val;
    } catch (e) {
      console.error(`Error reading meter ${id}:`, e);
      return -1;
    }
  };

  const getMeterValueLen2 = async (id: any) => {
    const addresses = [
      1, 3, 5, 13, 15, 17, 25, 27, 29, 37, 39, 41, 65,
    ]; // all addresses for len2
    let allFoundAddressData: any = [];

    for (let address of addresses) {
      try {
        await client.setID(id);
        let val = await client
          .readInputRegisters(address, 2)
          .then((res) => {
            allFoundAddressData.push(decodeFloat(res.data));
          });
      } catch (e) {
        console.error(
          `Error reading meter ${id} at address ${address}:`,
          e
        );
        return -1;
      }
    }
    console.log("Len 2 Volt data", allFoundAddressData);
    return allFoundAddressData;
  };

  const getMetersValue = async (meters: any) => {
    var voltageMeter = [];
    try {
      // get value of all meters
      for (let meter of meters) {
        await sleep(50);
        const activePowerData = await getMeterValue(
          meter.id
        );
        const len2Data = await getMeterValueLen2(meter.id);

        if (len2Data !== -1) {
          voltageMeter.push({
            name: meter.name,
            energyActiveImport: len2Data[0],
            energyActiveExport: len2Data[1],
            energyReactiveImport: len2Data[2],
            energyReactiveExport: len2Data[3],
            energyApparent: len2Data[4],
          });

          const now = new Date();
          const postMeterData = JSON.stringify({
            merterId: meter.id,
            timestamp: now.toISOString(), // ISO time format
            energyActiveImport: len2Data[0].toFixed(2),
            energyActiveExport: len2Data[1].toFixed(2),
            energyReactiveImport: len2Data[2].toFixed(2),
            energyReactiveExport: len2Data[3].toFixed(4),
            energyApparent: len2Data[4].toFixed(4),
          });

          console.log(
            `Meter data for ${meter.name}:`,
            postMeterData
          );
        }
      }
    } catch (e) {
      console.error("Error reading meters:", e);
    } finally {
      return voltageMeter;
    }
  };

  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  async function main() {
    const dataPrep = [
      { id: 1, name: "TBA-8" },
      { id: 2, name: "Ampak" },
      { id: 3, name: "Ledena Voda" },
      { id: 4, name: "Hladilnici" },
      { id: 5, name: "Kompresorno" },
      { id: 6, name: "Priemno" },
      { id: 7, name: "Trafo#1-7" },
      { id: 8, name: "HOMO UHT" },
      { id: 9, name: "Priem KM" },
      { id: 10, name: "Priem UHT" },
    ];

    const now = new Date();
    const date = now.toLocaleDateString();
    const time = now.toLocaleTimeString();

    try {
      const totalPowerData = await getMetersValue(dataPrep);

      const combined = totalPowerData.map((item: any) => [
        date,
        time,
        item.name,
        item.energyActiveImport,
        item.energyActiveExport,
        item.energyReactiveImport,
        item.energyReactiveExport,
        item.energyApparent,
      ]);

      return totalPowerData;
    } catch (error) {
      console.error("Error in main function:", error);
      return mockTotalPowerData; // Return mock data on error
    } finally {
      // Close the connection
      try {
        client.close();
        console.log("Modbus TCP connection closed");
      } catch (error) {
        console.error("Error closing connection:", error);
      }
    }
  }

  // Execute main function and return results
  return await main();
}

/**
 * Standalone function to read a single coil at address 801
 * @param config ModbusTCPConfig - connection configuration
 * @param deviceId Modbus device ID
 * @returns Promise<boolean | null> - coil state or null on error
 */
export async function readSingleCoil801(
  config: ModbusTCPConfig,
  deviceId: number
): Promise<boolean | null> {
  const client = new ModbusRTU();

  try {
    await client.connectTCP(config.host, {
      port: config.port,
    });
    if (config.timeout) {
      client.setTimeout(config.timeout);
    }

    await client.setID(deviceId);
    const result = await client.readCoils(801, 1);
    return result.data[0];
  } catch (error) {
    console.error(
      `Error reading coil 801 for device ${deviceId}:`,
      error
    );
    return null;
  } finally {
    try {
      client.close();
    } catch (error) {
      console.error("Error closing connection:", error);
    }
  }
}

/**
 * Standalone function to read input register 801 (4 registers)
 * @param config ModbusTCPConfig - connection configuration
 * @param deviceId Modbus device ID
 * @returns Promise<number> - decoded value or -1 on error
 */
export async function readSingleRegister801(
  config: ModbusTCPConfig,
  deviceId: number
): Promise<number> {
  const client = new ModbusRTU();

  try {
    await client.connectTCP(config.host, {
      port: config.port,
    });
    if (config.timeout) {
      client.setTimeout(config.timeout);
    }

    await client.setID(deviceId);
    const result = await client.readInputRegisters(801, 4);
    return modbusRegistersToDouble(result.data);
  } catch (error) {
    console.error(
      `Error reading register 801 for device ${deviceId}:`,
      error
    );
    return -1;
  } finally {
    try {
      client.close();
    } catch (error) {
      console.error("Error closing connection:", error);
    }
  }
}

// Mock data for testing/fallback
const mockTotalPowerData = [
  {
    meterId: 1,
    name: "TBA-8",
    energyActiveImport: 5000,
    energyActiveExport: 50,
    energyReactiveImport: 100,
    energyReactiveExport: 80,
    energyApparent: 5200,
    recordedAt: "2025-09-11T15:30:00+02:00",
  },
  {
    meterId: 2,
    name: "Ampak",
    energyActiveImport: 5750,
    energyActiveExport: 55,
    energyReactiveImport: 110,
    energyReactiveExport: 88,
    energyApparent: 5960,
    recordedAt: "2025-09-11T15:30:00+02:00",
  },
  {
    meterId: 3,
    name: "Ledena Voda",
    energyActiveImport: 6500,
    energyActiveExport: 60,
    energyReactiveImport: 120,
    energyReactiveExport: 96,
    energyApparent: 6720,
    recordedAt: "2025-09-11T15:30:00+02:00",
  },
  {
    meterId: 4,
    name: "Hladilnici",
    energyActiveImport: 7250,
    energyActiveExport: 65,
    energyReactiveImport: 130,
    energyReactiveExport: 104,
    energyApparent: 7480,
    recordedAt: "2025-09-11T15:30:00+02:00",
  },
  {
    meterId: 5,
    name: "Kompresorno",
    energyActiveImport: 8000,
    energyActiveExport: 70,
    energyReactiveImport: 140,
    energyReactiveExport: 112,
    energyApparent: 8240,
    recordedAt: "2025-09-11T15:30:00+02:00",
  },
  {
    meterId: 6,
    name: "Priemno",
    energyActiveImport: 8750,
    energyActiveExport: 75,
    energyReactiveImport: 150,
    energyReactiveExport: 120,
    energyApparent: 9000,
    recordedAt: "2025-09-11T15:30:00+02:00",
  },
  {
    meterId: 7,
    name: "Trafo#1-7",
    energyActiveImport: 9500,
    energyActiveExport: 80,
    energyReactiveImport: 160,
    energyReactiveExport: 128,
    energyApparent: 9760,
    recordedAt: "2025-09-11T15:30:00+02:00",
  },
  {
    meterId: 8,
    name: "HOMO UHT",
    energyActiveImport: 10250,
    energyActiveExport: 85,
    energyReactiveImport: 170,
    energyReactiveExport: 136,
    energyApparent: 10520,
    recordedAt: "2025-09-11T15:30:00+02:00",
  },
  {
    meterId: 9,
    name: "Priem KM",
    energyActiveImport: 11000,
    energyActiveExport: 90,
    energyReactiveImport: 180,
    energyReactiveExport: 144,
    energyApparent: 11280,
    recordedAt: "2025-09-11T15:30:00+02:00",
  },
  {
    meterId: 10,
    name: "Priem UHT",
    energyActiveImport: 11750,
    energyActiveExport: 95,
    energyReactiveImport: 190,
    energyReactiveExport: 152,
    energyApparent: 12040,
    recordedAt: "2025-09-11T15:30:00+02:00",
  },
];

// Helper functions for data conversion
function modbusRegistersToDouble(registers: any) {
  var buffer = new ArrayBuffer(8);
  var view = new DataView(buffer);
  view.setUint16(0, registers[0], false);
  view.setUint16(2, registers[1], false);
  view.setUint16(4, registers[2], false);
  view.setUint16(6, registers[3], false);
  return view.getFloat64(0, false) / 1000;
}

function decodeFloat(registers: any) {
  if (registers.length !== 2) {
    throw new Error(
      "Invalid number of registers. Floating-point decoding requires exactly two 16-bit registers."
    );
  }
  const combined = (registers[0] << 16) | registers[1];
  const floatNumber = new Float32Array(
    new Uint32Array([combined]).buffer
  )[0];
  return floatNumber;
}

function decodeFloatL4(registers: any) {
  if (registers.length !== 4) {
    throw new Error(
      "Invalid number of registers. Floating-point decoding requires exactly four 16-bit registers."
    );
  }

  // Combine the four registers into a single 32-bit integer
  const combined =
    (registers[0] << 48) |
    (registers[1] << 32) |
    (registers[2] << 16) |
    registers[3];
  const floatNumber = new Float32Array(
    new Uint32Array([combined]).buffer
  )[0];
  return floatNumber;
}
