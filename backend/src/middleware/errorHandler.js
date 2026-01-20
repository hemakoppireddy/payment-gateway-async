export function errorHandler(err, req, res, next){
    const status = err.status || 500;

    res.status(status).json({
        error: {
            code: err.code || "INTERNAL ERROR",
            description: err.message || "Internal Server error"
        }
    });
}