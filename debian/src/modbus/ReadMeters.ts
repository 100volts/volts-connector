import ModbusRTU from "modbus-serial";

export default async function readMeters() {
    //set up mobus classes
    let client = new ModbusRTU();
  //set up modbus for reading

  const getMeterValue = async (id: any) => {
    try {
      await client.setID(id);
      let val = await client.readInputRegisters(801, 4).then((res) => {
        return modbusRegistersToDouble(res.data);
      });
      return val;
    } catch (e) {
      return -1;
    }
  };

  const getMeterValueLen2 = async (id : any) => {
    const addresses = [1, 3, 5, 13, 15, 17, 25, 27, 29, 37, 39, 41, 65]; //all addresses for len2
    let allFoundAddressData : any = [];
    for (let address of addresses) {
      try {
        await client.setID(id);
        let val = await client.readInputRegisters(address, 2).then((res) => {
          allFoundAddressData.push(decodeFloat(res.data));
        });
      } catch (e) {
        return -1;
      }
    }
    console.log("Len 2 Volt data", allFoundAddressData);
    return allFoundAddressData;
  };

  const getMetersValue = async (meters :any) => {
    var volatageMeter = [];
    try {
      // get value of all meters
      for (let meter of meters) {
        await sleep(50);
        const activePowerData = await getMeterValue(meter.id);
        const len2Data = await getMeterValueLen2(meter.id);
        volatageMeter.push({
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
          timestamp: now.toISOString(), // Local time: "15:30:00"
          energyActiveImport: len2Data[0].toFixed(2),
          energyActiveExport: len2Data[1].toFixed(2),
          energyReactiveImport: len2Data[2].toFixed(2),
          energyReactiveExport: len2Data[3].toFixed(4),
          energyApparent: len2Data[4].toFixed(4),
        });
      }
    } catch (e) {
      console.log(e);//TODO add error handling and logign yes now
    } finally {
      return volatageMeter;
    }
  };

  const sleep = (ms : number) => new Promise((resolve) => setTimeout(resolve, ms));

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

    const totalPowerData = await getMetersValue(dataPrep);
    
    const combined = totalPowerData.map((item:any) => [
        date,
        time,
        item.name,
        item.energyActiveImport,
        item.energyActiveExport,
        item.energyReactiveImport,
        item.energyReactiveExport,
        item.energyApparent,
      ]);
  }

  //main();
  return  mockTotalPowerData;
}
const mockTotalPowerData = [
    {
        meterId: 1,
      name: "TBA-8",
      energyActiveImport: 5000,
      energyActiveExport: 50,
      energyReactiveImport: 100,
      energyReactiveExport: 80,
      energyApparent: 5200,
      recordedAt: "2025-09-11T15:30:00+02:00"
    },
    {
        meterId: 2,
      name: "Ampak",
      energyActiveImport: 5750,
      energyActiveExport: 55,
      energyReactiveImport: 110,
      energyReactiveExport: 88,
      energyApparent: 5960,
      recordedAt: "2025-09-11T15:30:00+02:00"
    },
    {
        meterId: 3,
      name: "Ledena Voda",
      energyActiveImport: 6500,
      energyActiveExport: 60,
      energyReactiveImport: 120,
      energyReactiveExport: 96,
      energyApparent: 6720,
      recordedAt: "2025-09-11T15:30:00+02:00"
    },
    {
        meterId: 4,
      name: "Hladilnici",
      energyActiveImport: 7250,
      energyActiveExport: 65,
      energyReactiveImport: 130,
      energyReactiveExport: 104,
      energyApparent: 7480,
      recordedAt: "2025-09-11T15:30:00+02:00"
    },
    {
        meterId: 5,
      name: "Kompresorno",
      energyActiveImport: 8000,
      energyActiveExport: 70,
      energyReactiveImport: 140,
      energyReactiveExport: 112,
      energyApparent: 8240,
      recordedAt: "2025-09-11T15:30:00+02:00"
    },
    {
        meterId: 6,
      name: "Priemno",
      energyActiveImport: 8750,
      energyActiveExport: 75,
      energyReactiveImport: 150,
      energyReactiveExport: 120,
      energyApparent: 9000,
      recordedAt: "2025-09-11T15:30:00+02:00"
    },
    {
        meterId: 7,
      name: "Trafo#1-7",
      energyActiveImport: 9500,
      energyActiveExport: 80,
      energyReactiveImport: 160,
      energyReactiveExport: 128,
      energyApparent: 9760,
      recordedAt: "2025-09-11T15:30:00+02:00"
    },
    {
        meterId: 8,
      name: "HOMO UHT",
      energyActiveImport: 10250,
      energyActiveExport: 85,
      energyReactiveImport: 170,
      energyReactiveExport: 136,
      energyApparent: 10520,
      recordedAt: "2025-09-11T15:30:00+02:00"
    },
    {
        meterId: 9,
      name: "Priem KM",
      energyActiveImport: 11000,
      energyActiveExport: 90,
      energyReactiveImport: 180,
      energyReactiveExport: 144,
      energyApparent: 11280,
      recordedAt: "2025-09-11T15:30:00+02:00"
    },
    {
        meterId: 10,
      name: "Priem UHT",
      energyActiveImport: 11750,
      energyActiveExport: 95,
      energyReactiveImport: 190,
      energyReactiveExport: 152,
      energyApparent: 12040,
      recordedAt: "2025-09-11T15:30:00+02:00"
    },
  ];
  


    function modbusRegistersToDouble(registers : any) {
        var buffer = new ArrayBuffer(8);
        var view = new DataView(buffer);
        view.setUint16(0, registers[0], false);
        view.setUint16(2, registers[1], false);
        view.setUint16(4, registers[2], false);
        view.setUint16(6, registers[3], false);
        return view.getFloat64(0, false) / 1000;
    }


  function decodeFloat(registers : any) {
    if (registers.length !== 2) {
      throw new Error(
        "Invalid number of registers. Floating-point decoding requires exactly two 16-bit registers."
      );
    }
    const combined = (registers[0] << 16) | registers[1];
    const floatNumber = new Float32Array(new Uint32Array([combined]).buffer)[0];
    return floatNumber;
  }

  function decodeFloatL4(registers : any) {
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
    const floatNumber = new Float32Array(new Uint32Array([combined]).buffer)[0];
    return floatNumber;
  }