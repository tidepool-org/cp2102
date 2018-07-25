const CP2102 = require('../index.js');

const connection = new CP2102(0x10c4, 0x85a7);

connection.on('ready', () => {
  connection.on('data', (res) => {
    console.log('Data:', res);
    console.log('Model:', String.fromCharCode.apply(null, res.subarray(5, 12)));
    connection.close(() => {});
  });
  connection.write([0x02, 0x08, 0x00, 0x04, 0x06, 0x03, 0x78, 0xC1], (err) => {
    if (err) {
      console.log('Error sending command:', err);
    }
  });
});
