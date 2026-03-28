const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

export function validatePassword(password) {
  if (!PASSWORD_REGEX.test(password || "")) {
    return "Use 8+ characters with uppercase, lowercase, number, and special character.";
  }

  return "";
}
