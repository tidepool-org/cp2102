const usb = require('usb');

class cp2102 {
  constructor(vendorId, productId, opts) {
    this.device = usb.findByIds(vendorId, productId);

    this.device.open(false); // don't auto-configure
    device.setConfiguration(1, (err) => {
      if (err) {
        return err;
      }
      const interface = device.interfaces[0];
      interface.claim();

      this.
    });

    /* .then(() => {
        return this.usb.controlTransferOut({
          requestType: 'vendor',
          recipient: 'device',
          request: 0x00,
          index: 0x00,
          value: 0x01
        })
      })
      .then(() => {
        return this.usb.controlTransferOut({
          requestType: 'vendor',
          recipient: 'device',
          request: 0x07,
          index: 0x00,
          value: 0x03 | 0x0100 | 0x0200
        })
      })
      .then(() => {
        return this.usb.controlTransferOut({
          requestType: 'vendor',
          recipient: 'device',
          request: 0x01,
          index: 0x00,
          value: 0x384000 / 115200
        })
      })
      */
  }

  controlTransfer(direction, transfer, dataOrLength) {
    return new Promise((resolve, reject) => {
      this.device.controlTransfer(transfer.requestType, transfer.request, transfer.value, transfer.index, dataOrlength,
       (err, data) => {
         if (err) {
           reject(err);
           return;
         }
         resolve(data);
       });
    });
  }
}
