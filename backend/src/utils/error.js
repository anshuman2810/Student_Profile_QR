function logError(scope, error) {

    console.error(`[${scope}]`, {
        message: error?.message,
        stack: error?.stack
    });
}

function getReadableErrorMessage(error) {

    if (error?.code === 11000) {

        const field =
            Object.keys(error.keyPattern || {})[0];

        if (field === "email")
            return "User already exists with this email.";

        if (field === "enrollmentNumber")
            return "Roll number already exists for this teacher, class, section, and academic year.";

        return "This record already exists.";
    }

    if (error?.name === "ValidationError") {

        const firstMessage =
            Object.values(error.errors || {})[0]?.message;

        if (firstMessage) return firstMessage;
    }

    return error?.message ||
        "Unexpected server error.";
}

function getErrorStatusCode(error) {

    if (error?.code === 11000)
        return 409;

    if (
        error?.name === "ValidationError" ||
        error?.name === "CastError" ||
        error instanceof SyntaxError
    )
        return 400;

    return 500;
}


function sendServerError(res, scope, error) {

    logError(scope, error);

    return res.status(getErrorStatusCode(error)).json({
        message: getReadableErrorMessage(error)
    });
}


module.exports = {
    logError,
    sendServerError,
    getReadableErrorMessage,
    getErrorStatusCode
};
