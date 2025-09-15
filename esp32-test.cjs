const ModbusRTU = require("modbus-serial");

// Create a new Modbus client instance
const client = new ModbusRTU();

// Connect to the ESP32 Modbus slave using Serial port COM3
client
  .connectRTUBuffered("COM4", { baudRate: 9600, parity: "even", stopBits: 2 })
  .then(() => {
    console.log("Connected to Modbus slave");

    // Function to write values to the Modbus slave
    function writeRegisters() {
      // Convert float 123.45 to two 16-bit words
      let floatBuffer = Buffer.alloc(4);
      floatBuffer.writeFloatLE(123.45, 0); // Converts the float to 4 bytes in little-endian format

      // Write the two 16-bit words to registers
      const registers = [
        floatBuffer.readUInt16LE(0), // Low byte
        floatBuffer.readUInt16LE(2), // High byte
      ];

      client
        .writeRegisters(0, registers) // Writing to registers 0 and 1
        .then(() => {
          console.log("Float written to registers 0 and 1");

          // Write an integer value to register 2
          return client.writeUInt16(2, 66);
        })
        .then(() => {
          console.log("Integer written to register 2");
        })
        .catch((err) => {
          console.error("Error writing to registers:", err);
        });
    }

    // Function to read registers from the slave
    function readRegisters() {
      // Read the two registers where the float was written
      client
        .readHoldingRegisters(0, 2)
        .then((data) => {
          // Convert the two 16-bit values back into a float
          let floatBuffer = Buffer.alloc(4);
          floatBuffer.writeUInt16LE(data.data[0], 0); // Low byte
          floatBuffer.writeUInt16LE(data.data[1], 2); // High byte

          let floatVal = floatBuffer.readFloatLE(0);
          console.log("Read float value from registers 0 and 1:", floatVal);

          console.log("Integer value from register 2:", data.data[2]);
        })
        .catch((err) => {
          console.error("Error reading registers:", err);
        });
    }

    // Write to the registers
    writeRegisters();

    // Delay before reading from registers
    setTimeout(() => {
      readRegisters();
    }, 2000);
  })
  .catch((err) => {
    console.error("Error connecting to Modbus slave:", err);
  });
