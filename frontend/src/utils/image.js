const MAX_PROFILE_IMAGE_SIZE = 512 * 1024;

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function prepareProfileImage(file) {
  if (!file) {
    throw new Error("No image selected.");
  }

  if (file.size > MAX_PROFILE_IMAGE_SIZE) {
    throw new Error("Profile photo must be 512KB or smaller.");
  }

  return readFileAsDataUrl(file);
}
