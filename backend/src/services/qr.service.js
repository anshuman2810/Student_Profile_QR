const QRCode = require("qrcode");

const generateQR = async (studentId) => {

    const baseUrl =
        (process.env.BASE_URL ||
            "http://localhost:5000")
            .replace(/\/+$/, "");

    return await QRCode.toDataURL(
        `${baseUrl}/student/${studentId}`
    );

};

module.exports = generateQR;
