# CP2102

Silicon Labs CP2102 user-space USB to serial adapter driver for Node.js

## Usage

```
const CP2102 = require('cp2102');

const opts = {
    baudRate : 115200
};

const connection = new CP2102(vendorId, productId, opts);

connection.on('data', (res) => {
  console.log('Data:', res);
  connection.close(() => {});
});

connection.on('ready', () => {
  connection.write([0x01, 0x02, 0x02], (err) => {
    if (err) {
      console.log('Error sending command:', err);
    }
  });
});
```

## Thanks

Thanks to [Seiya Nuta](https://github.com/seiyanuta) who posted a WebUSB version as a [GitHub gist](https://gist.github.com/seiyanuta/2c70ba8855f50c536a51f0c5993c1e4c).
