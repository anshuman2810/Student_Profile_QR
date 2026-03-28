const PASSWORD_REGEX =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
const MAX_PROFILE_IMAGE_SIZE = 512 * 1024;


function validatePassword(password) {

    if (!PASSWORD_REGEX.test(password || "")) {
        return "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.";
    }

    return null;
}


function getBase64FileSizeInBytes(dataUrl) {

    if (!dataUrl || typeof dataUrl !== "string")
        return 0;

    const parts = dataUrl.split(",");

    if (parts.length !== 2)
        return 0;

    const base64 = parts[1];

    return Buffer.from(base64, "base64").length;
}


function validateProfileImage(profileImage) {

    if (!profileImage)
        return null;

    if (!/^data:image\/(png|jpeg|jpg|webp);base64,/i.test(profileImage)) {
        return "Profile photo must be a PNG, JPG, JPEG, or WEBP data URL.";
    }

    const fileSize = getBase64FileSizeInBytes(profileImage);

    if (fileSize > MAX_PROFILE_IMAGE_SIZE) {
        return "Profile photo must be 512KB or smaller.";
    }

    return null;
}


module.exports = {
    validatePassword,
    validateProfileImage,
    getBase64FileSizeInBytes,
    MAX_PROFILE_IMAGE_SIZE
};
