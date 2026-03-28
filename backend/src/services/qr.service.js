const QRCode = require("qrcode");

const generateQR = async (studentId) => {

    return await QRCode.toDataURL(
        `${process.env.BASE_URL}/student/${studentId}`
    );

};

module.exports = generateQR;