export default async (address) => {
    try {
      await client.setID(address);
      let val = await client.readInputRegisters(801, 4).then((res) => {
        return modbusRegistersToDouble(res.data);
      });
      return val;
    } catch (e) {
      return -1;
    }
};