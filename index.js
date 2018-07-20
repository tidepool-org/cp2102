const usb = require('usb');
const EventEmitter = require('events');

class cp2102 extends EventEmitter {
  constructor(vendorId, productId, opts) {
    super();
    this.device = usb.findByIds(vendorId, productId);
    this.opts = opts;
    this.device.open(false); // don't auto-configure

    this.device.setConfiguration(1, async (err) => {
      if (err) {
        return err;
      }
      [this.iface] = this.device.interfaces;
      this.iface.claim();

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
        value: 0x384000 / 38400, // TODO: change baud rate here
      });

      this.iface.endpoint(1).on('data', (data) => {
        this.emit('data', data);
      });

      return true;
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

  async read() {
    const r = await this.transferIn(1, 64);
    return new Uint8Array(r.data.buffer);
  }

  write(data, cb) {
    this.transferIn(1, data).then(result => cb(null, result), err => cb(err, null));
  }

  transferIn(endpoint, data) {
    return new Promise((resolve, reject) => {
      this.iface.endpoint(endpoint).transfer(data, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  close() {
    this.device.close();
  }
}

module.exports = cp2102;
