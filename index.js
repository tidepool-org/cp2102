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

class cp2102 extends EventTarget {
  constructor(usbDevice, opts) {
    super();
    this.device = usbDevice;
    this.opts = opts;
    this.device.open();
    console.log('Opened:', this.device.opened);
    const self = this;

    (async () => {
      if (this.device.configuration === null) {
        console.log('selectConfiguration');
        await this.device.selectConfiguration(1);
      }

      [self.iface] = this.device.configuration.interfaces;
      console.log('Claiming interface', self.iface.interfaceNumber);
      await this.device.claimInterface(self.iface.interfaceNumber);

      if (this.device.configuration.interfaces == null) {
        throw new Error('Please unplug device and retry.');
      }

      console.log('Setting baud rate to', this.opts.baudRate);

      await this.device.controlTransferOut({
        requestType: 'vendor',
        recipient: 'device',
        request: 0x00,
        index: 0x00,
        value: 0x01,
      });

      await this.device.controlTransferOut({
        requestType: 'vendor',
        recipient: 'device',
        request: 0x07,
        index: 0x00,
        value: 0x03 | 0x0100 | 0x0200,
      });

      await this.device.controlTransferOut({
        requestType: 'vendor',
        recipient: 'device',
        request: 0x01,
        index: 0x00,
        value: 0x384000 / this.opts.baudRate,
      });

      self.isClosing = false;
      self.readLoop();
      self.dispatchEvent(new Event('ready'));
    })().catch((error) => {
      console.log('Error during CP2102 setup:', error);
      self.dispatchEvent(new CustomEvent('error', {
        detail: error,
      }));
    });
  }

  write(data, cb) {
    this.device.transferOut(1, data).then(() => {
      cb();
    }, (err) => cb(err, null));
  }

  async readLoop() {
    let result;

    try {
      result = await this.device.transferIn(1, 64);
    } catch (error) {
      if (error.message.indexOf('LIBUSB_TRANSFER_NO_DEVICE')) {
        console.log('Device disconnected');
      } else {
        console.log('Error reading data:', error);
      }
    }

    if (result && result.data && result.data.byteLength) {
      console.log(`Received ${result.data.byteLength} byte(s).`);
      const uint8buffer = new Uint8Array(result.data.buffer);
      this.dispatchEvent(new CustomEvent('data', {
        detail: uint8buffer.slice(0),
      }));
    }

    if (!this.isClosing && this.device.opened) {
      this.readLoop();
    }
  }

  close(cb) {
    this.isClosing = true;
    setTimeout(async () => {
      await this.device.releaseInterface(0);
      await this.device.close();
      return cb();
    }, 2000);
  }
}

module.exports = cp2102;
