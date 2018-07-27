/*
* == BSD2 LICENSE ==
* Copyright (c) 2018, Tidepool Project
*
* This program is free software; you can redistribute it and/or modify it under
* the terms of the associated License, which is identical to the BSD 2-Clause
* License as published by the Open Source Initiative at opensource.org.
*
* This program is distributed in the hope that it will be useful, but WITHOUT
* ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
* FOR A PARTICULAR PURPOSE. See the License for more details.
*
* You should have received a copy of the License along with this program; if
* not, you can obtain one from Tidepool Project at tidepool.org.
* == BSD2 LICENSE ==
*/

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
