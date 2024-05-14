/**
 *
 * @param {*} requestHandlerFunc
 * @returns wrapper async function
 */
const asyncHandler = (requestHandlerFunc) => {
  return (req, res, next) => {
    Promise.resolve(requestHandlerFunc(req, res, next)).catch(
      (err) => new ApiError(err)
    );
  };
};

module.exports = asyncHandler;
