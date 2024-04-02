// This is a higherOrder Function The Function Accapct the Function as a Parameter and return the function also..!!

// The { next } parameter use for a Middlewares Use

// const asyncHandler = (fun) => async(req, res, next) => {
//     try {
//         await fun(req, res, next)
//     } catch (error) {
//         res.status(error.code || 500).json({ // this is a json error send for frontend
//             success: false,
//             message: error.message
//         })
//     }
// }



// the same function create by promises methods

const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
    }
}


export {asyncHandler}
// export {asyncHandler2}

