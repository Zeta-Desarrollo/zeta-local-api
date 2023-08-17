import jwt from "jsonwebtoken"
export function callController(controller){
    return (req,res)=>{
        controller(req.body, req.params).then((result)=>{
            res.status(200).json(result)
        }).catch((error)=>{
            console.log("error",error)
            res.status(400).json(error)
        })
    }
}

export function isAuth(req,res,next){
    let error
    let auth
    if (!req.headers.authorization) error = "auth-required"
    try {
        auth = jwt.verify(req.headers.authorization, process.env.SECRET)
    }catch(err){
        error = err.message
    }
    if (error){
        res.status(400).json(error)
    }else{
        req.body.auth = auth
        next()
    }
}

export function checkRole(roles){
    return (req, res, next)=>{
        if (roles.indexOf(req.body.auth.role)<0){
            res.status(400).json("role-unauthorized")
        }else{
            next()
        }
    }
}