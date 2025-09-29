const ModbusRTU = require("modbus-serial");

// Modbus slave configuration
const SLAVE_ADDRESS = 801;
const TCP_PORT = 502; // Standard Modbus TCP port

// Initialize data arrays
const holdingRegisters = new Array(10000).fill(0); // Holding registers (40001-50000)
const inputRegisters = new Array(10000).fill(0); // Input registers (30001-40000)
const coils = new Array(10000).fill(false); // Coils (00001-10000)
const discreteInputs = new Array(10000).fill(false); // Discrete inputs (10001-20000)

// Populate some sample data
console.log("Initializing Modbus slave data...");

// Example: Set some holding registers with sample values
holdingRegisters[0] = 1234; // Address 40001
holdingRegisters[1] = 5678; // Address 40002
holdingRegisters[2] = 9999; // Address 40003
holdingRegisters[10] = 2500; // Address 40011 (could represent voltage * 100)
holdingRegisters[11] = 150; // Address 40012 (could represent current * 100)
holdingRegisters[12] = 5000; // Address 40013 (could represent power)

// Example: Set some input registers with sample values
inputRegisters[0] = 273; // Temperature in Kelvin * 10
inputRegisters[1] = 1013; // Pressure in mbar
inputRegisters[2] = 456; // Some sensor reading

// Example: Set some coils
coils[0] = true; // Coil 1 - ON
coils[1] = false; // Coil 2 - OFF
coils[5] = true; // Coil 6 - ON

// Example: Set some discrete inputs
discreteInputs[0] = true; // Digital input 1
discreteInputs[1] = false; // Digital input 2
discreteInputs[2] = true; // Digital input 3

// Data model for the server
const vector = {
  getInputRegister: function (addr, unitID) {
    console.log(
      `Read input register at address: ${addr} for unit ${unitID}`
    );
    return inputRegisters[addr] || 0;
  },
  getHoldingRegister: function (addr, unitID) {
    console.log(
      `Read holding register at address: ${addr} for unit ${unitID}`
    );
    return holdingRegisters[addr] || 0;
  },
  getCoil: function (addr, unitID) {
    console.log(
      `Read coil at address: ${addr} for unit ${unitID}`
    );
    return coils[addr] || false;
  },
  getDiscreteInput: function (addr, unitID) {
    console.log(
      `Read discrete input at address: ${addr} for unit ${unitID}`
    );
    return discreteInputs[addr] || false;
  },
  setRegister: function (addr, value, unitID) {
    console.log(
      `Write holding register at address: ${addr}, value: ${value} for unit ${unitID}`
    );
    holdingRegisters[addr] = value;
    return;
  },
  setCoil: function (addr, value, unitID) {
    console.log(
      `Write coil at address: ${addr}, value: ${value} for unit ${unitID}`
    );
    coils[addr] = value;
    return;
  },
};

// Simulate changing data (optional - uncomment to enable)
function simulateDataChanges() {
  // Simulate voltage fluctuations
  holdingRegisters[10] =
    2400 + Math.floor(Math.random() * 200); // 2400-2600 (24-26V * 100)

  // Simulate current changes
  holdingRegisters[11] =
    100 + Math.floor(Math.random() * 100); // 100-200 (1-2A * 100)

  // Calculate power (V * I / 100)
  holdingRegisters[12] = Math.floor(
    (holdingRegisters[10] * holdingRegisters[11]) / 100
  );

  // Simulate temperature changes
  inputRegisters[0] = 250 + Math.floor(Math.random() * 50); // 25-30°C * 10

  // Randomly toggle some coils
  if (Math.random() > 0.8) {
    coils[2] = !coils[2];
  }
}

// Create and start the server
function startModbusServer() {
  try {
    // Create server using the newer API
    const serverTCP = new ModbusRTU.ServerTCP(vector, {
      host: "0.0.0.0",
      port: TCP_PORT,
      debug: false,
      unitID: SLAVE_ADDRESS,
    });

    serverTCP.on("socketError", function (err) {
      console.error("Socket error:", err);
    });

    console.log("=".repeat(50));
    console.log("🔌 Modbus Slave Server Started");
    console.log("=".repeat(50));
    console.log(`📍 Slave Address: ${SLAVE_ADDRESS}`);
    console.log(`🌐 TCP Port: ${TCP_PORT}`);
    console.log(`📊 Data Ranges Available:`);
    console.log(
      `   • Holding Registers: 40001-50000 (0-9999)`
    );
    console.log(
      `   • Input Registers: 30001-40000 (0-9999)`
    );
    console.log(`   • Coils: 00001-10000 (0-9999)`);
    console.log(
      `   • Discrete Inputs: 10001-20000 (0-9999)`
    );
    console.log("=".repeat(50));
    console.log("📋 Sample Data Available:");
    console.log(
      `   • Holding Register 40001 (0): ${holdingRegisters[0]}`
    );
    console.log(
      `   • Holding Register 40011 (10): ${holdingRegisters[10]} (Voltage * 100)`
    );
    console.log(
      `   • Holding Register 40012 (11): ${holdingRegisters[11]} (Current * 100)`
    );
    console.log(
      `   • Holding Register 40013 (12): ${holdingRegisters[12]} (Power)`
    );
    console.log(
      `   • Input Register 30001 (0): ${inputRegisters[0]} (Temperature * 10)`
    );
    console.log(`   • Coil 00001 (0): ${coils[0]}`);
    console.log(
      `   • Discrete Input 10001 (0): ${discreteInputs[0]}`
    );
    console.log("=".repeat(50));
    console.log(
      "🚀 Server is running... Press Ctrl+C to stop"
    );
    console.log(
      "📡 Connect using: modbus://localhost:502 with slave ID 801"
    );

    // Start data simulation (updates every 5 seconds)
    setInterval(simulateDataChanges, 5000);

    // Handle graceful shutdown
    process.on("SIGINT", function () {
      console.log(
        "\n🛑 Shutting down Modbus slave server..."
      );
      try {
        serverTCP.close();
        console.log("✅ Server closed successfully");
        process.exit(0);
      } catch (err) {
        console.error("Error closing server:", err);
        process.exit(1);
      }
    });

    return serverTCP;
  } catch (err) {
    console.error("Error starting Modbus server:", err);
    console.log(
      "\n🔄 Trying alternative server initialization..."
    );

    // Alternative approach - try using the basic server setup
    const serverTCP = new ModbusRTU.ServerTCP();
    serverTCP.vector = vector;

    serverTCP.listen(TCP_PORT, function () {
      console.log("=".repeat(50));
      console.log(
        "🔌 Modbus Slave Server Started (Alternative Method)"
      );
      console.log("=".repeat(50));
      console.log(`📍 Slave Address: ${SLAVE_ADDRESS}`);
      console.log(`🌐 TCP Port: ${TCP_PORT}`);
      console.log(
        "🚀 Server is running... Press Ctrl+C to stop"
      );

      // Start data simulation
      setInterval(simulateDataChanges, 5000);
    });

    // Handle graceful shutdown
    process.on("SIGINT", function () {
      console.log(
        "\n🛑 Shutting down Modbus slave server..."
      );
      try {
        serverTCP.close();
        console.log("✅ Server closed successfully");
        process.exit(0);
      } catch (err) {
        console.error("Error closing server:", err);
        process.exit(1);
      }
    });

    return serverTCP;
  }
}

// Handle uncaught exceptions
process.on("uncaughtException", function (err) {
  console.error("❌ Uncaught Exception:", err);
  process.exit(1);
});

process.on(
  "unhandledRejection",
  function (reason, promise) {
    console.error(
      "❌ Unhandled Rejection at:",
      promise,
      "reason:",
      reason
    );
    process.exit(1);
  }
);

// Start the server
startModbusServer();
