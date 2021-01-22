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

const usb = require('usb');
const EventEmitter = require('events');

class cp2102 extends EventEmitter {
  constructor(vendorId, productId, opts) {
    super();
    this.device = usb.findByIds(vendorId, productId);
    this.opts = opts;
    this.device.open(false); // don't auto-configure
    const self = this;

    this.device.setConfiguration(1, () => {
      [self.iface] = this.device.interfaces;
      if (self.iface.isKernelDriverActive()) {
        self.iface.detachKernelDriver();
      }
      self.iface.claim();

      self.inEndpoint = self.iface.endpoint(0x81);
      self.inEndpoint.startPoll();
      self.inEndpoint.on('data', (data) => {
        self.emit('data', data);
      });

      (async () => {
        try {
          await this.controlTransferOut({
            requestType: 'vendor',
            recipient: 'device',
            request: 0x00,
            index: 0x00,
            value: 0x01,
          });

          await this.controlTransferOut({
            requestType: 'vendor',
            recipient: 'device',
            request: 0x07,
            index: 0x00,
            value: 0x03 | 0x0100 | 0x0200,
          });

          await this.controlTransferOut({
            requestType: 'vendor',
            recipient: 'device',
            request: 0x01,
            index: 0x00,
            value: 0x384000 / this.opts.baudRate,
          });
        } catch (err) {
          console.log('Error during CP2102 setup:', err);
        }

        self.emit('ready');
      })();
    });
  }

  static getRequestType(direction, requestType, recipient) {
    const TYPES = {
      standard: 0x00,
      class: 0x01,
      vendor: 0x02,
      reserved: 0x03,
    };

    const RECIPIENTS = {
      device: 0x00,
      interface: 0x01,
      endpoint: 0x02,
      other: 0x03,
    };

    const DIRECTION = {
      'host-to-device': 0x00,
      'device-to-host': 0x01,
    };

    return (DIRECTION[direction] << 7) || (TYPES[requestType] << 5) || RECIPIENTS[recipient];
  }

  controlTransfer(direction, transfer, dataOrLength) {
    return new Promise((resolve, reject) => {
      this.device.controlTransfer(cp2102.getRequestType(direction, transfer.requestType, transfer.recipient), transfer.request, transfer.value, transfer.index, dataOrLength,
        (err, data) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(data);
        });
    });
  }

  controlTransferOut(transfer, data) {
    this.controlTransfer('host-to-device', transfer, data != null ? data : Buffer.alloc(0));
  }

  controlTransferIn(transfer, length) {
    this.controlTansfer('device-to-host', transfer, length);
  }

  write(data, cb) {
    this.transferOut(1, data).then(() => {
      cb();
    }, err => cb(err, null));
  }

  transferIn(endpoint, length) {
    return new Promise((resolve, reject) => {
      this.iface.endpoint(endpoint | 0x80).transfer(length, (err, result) => {
        if (err) {
          console.log('transferIn Error:', err);
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  transferOut(endpoint, data) {
    return new Promise((resolve, reject) => {
      this.iface.endpoint(endpoint).transfer(data, (err, result) => {
        if (err) {
          console.log('transferOut Error:', err);
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  close(cb) {
    this.removeAllListeners();
    this.iface.release(true, () => {
      this.device.close();
      return cb();
    });
  }
}

module.exports = cp2102;
