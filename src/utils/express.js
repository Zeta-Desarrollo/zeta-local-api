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

export function showData(isDev){
    return (req, res, next)=>{
        if (isDev){
            console.log("body", req.body)
            console.log("params", JSON.stringify(req.params))
        }
        next()
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
        res.status(200).json({error})
    }else{
        if (req.body){
            req.body.auth = auth
        }else{
            req.body= {auth}
        }
        next()
    }
}

export function checkRole(roles){
    return (req, res, next)=>{
        if (roles.indexOf(req.body.auth.role)<0){
            res.status(200).json({
                error:"role-unauthorized"
            })
        }else{
            next()
        }
    }
}

export function checkPermissions($and, $or=[]){
    return (req, res, next)=>{
        let hasSomeOr = $or.length==0? true : false
        for (const permReq of $or){
            if(req.body.auth.permissions.indexOf(permReq)>=0){
                hasSomeOr = true
                break
            }
        }

        let hasAllAnd = true
        for (const permReq of $and){
            if(req.body.auth.permissions.indexOf(permReq)<0){
                hasAllAnd = false
            }
        }
        if (hasAllAnd && hasSomeOr){
            next()
        }else{
            res.status(200).json({
                error:"not-enough-permissions"
            })
        }
    }
}