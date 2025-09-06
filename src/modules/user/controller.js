import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"


import { sqliteDB as sqlite } from "../../utils/sqlite.js"

export async function getUser(userName){
  return new Promise((resolve, reject)=>{
    let sqlite_user
  
    sqlite.serialize(()=>{
      sqlite.get(`select rowid, name, password, role from users where name = '${ userName }'`, (err,user)=>{
        if (err){
          console.log("user err", err)
          reject(err)
          return
        }
        sqlite_user = {
          ...user,
          permissions:[]
        }
        sqlite.all(`select * from user_permissions join permissions on user_permissions.permision=permissions.rowid where user ='${user.rowid}'`,(err, permissions)=>{
          if (err){
            reject(err)
            return
          }
          for (const perm of permissions){
            sqlite_user.permissions.push(perm.name)
          }
          resolve(sqlite_user)
        })       
      })
    })
  }).catch((err)=>{
    console.log("catched", err)
    throw err
  })
}

const controller = {
    login:async ({userName, password},params)=>{
        let error
        let token
        let payload
        try{
            if(!userName) throw "username-required"
            if(!password) throw "password-required"

            const user = await new Promise((resolve, reject)=>{
              let sqlite_user
            
              sqlite.serialize(()=>{
                sqlite.get(`select rowid, name, password, role from users where name = '${ userName }'`, (err,user)=>{
                  if (err){
                    console.log("user err", err)
                    reject(err)
                    return
                  }
                  if(!user){
                    reject("nonexistant-user")
                  } else {
                    if (!bcrypt.compareSync(password, user.password)){
                      reject("wrong-password")
                    } else{
                      sqlite_user = {
                        ...user,
                        permissions:[]
                      }
                      sqlite.all(`select * from user_permissions join permissions on user_permissions.permision=permissions.rowid where user ='${user.rowid}'`,(err, permissions)=>{
                        if (err){
                          reject(err)
                          return
                        }
                        for (const perm of permissions){
                          sqlite_user.permissions.push(perm.name)
                        }
                        resolve(sqlite_user)
                      })
                    }
                  }
                })
              })
  
            }).catch((err)=>{
              console.log("catched", err)
              throw err
            })

            payload = {
                name:user.name,
                role:user.role,
                permissions:user.permissions,
                expires: new Date().setHours(new Date().getHours()+480)
            }
            token = jwt.sign(payload, process.env.SECRET, {expiresIn:"480h"})
        }catch(err){
            error = err
        }

        return {
            error,
            token,
            payload

        }
    },
    passwordChange: async(body, params)=>{
        let error
        let success

        try{
            if (!body.user) throw "user-required"
            if (body.auth.name !== "admin" || body.auth.name!=body.user) "cant-modify-user"
            if (!body.newPassword) throw "password-required"

            success = await new Promise((resolve,reject)=>{
              sqlite.serialize(()=>{
                sqlite.run(`update users set password = '${bcrypt.hashSync(body.newPassword,10)}' where name = '${body.user}'`, (err,row)=>{
                  if (err){ resolve(false); console.log("err")}
                  resolve(true)
                })
             })
            }).catch((err)=>{
              console.log("catched", err)
              throw err
            })

        }catch(err){
            error = err.message ? err.message : err
        }

        return {
            error,
            success
        }
    },
    createUser: async(body, params)=>{
        let error
        let success
        try{
            if (!body.userName) throw "username-required"
            if (!body.password) throw "password-required"
            if (!body.role) throw "role-required"
            if (!body.permissions) throw "permissions-required"

            const created = await new Promise((resolve,reject)=>{
              sqlite.run(`insert into users values ('${body.userName}', '${bcrypt.hashSync(body.password, 10)}', '${body.role}', ${new Date().valueOf()})`, (err, row)=>{
                if(err) {resolve(false); console.log("err", err)}
                else{ resolve(true) }
              })
            }).catch((err)=>{
              console.log("catched", err)
              throw err
            })
            console.log("created", created)
            if (created){
              await new Promise((resolve,reject)=>{
                sqlite.get(`select rowid from users where name ='${body.userName}'`, (err,user)=>{
                  let perms = ""
                  for (let index=0; index<body.permissions.length; index++){
                    perms+="'"+body.permissions[index]+"'"
                    if(index+1!=body.permissions.length){
                      perms+=","
                    }
                  }
                  sqlite.all(`select rowid from permissions where name in (${perms})`, (err, rows)=>{
                    const perms = sqlite.prepare("INSERT INTO user_permissions VALUES (?, ?)")
                    for (const row of rows){
                      perms.run(row.rowid,user.rowid)
                    }
                    perms.finalize()
                    resolve(true)
                  })
                })

              }).catch((err)=>{
                console.log("catched", err)
                throw err
              })
            }


            success = true
        }catch(err){


            error = err.message? err.message : err
        }
        return {
            error,
            success
        }
    },
    deleteUser: async (body,params)=>{
      let error
      let success
      try{
          if(!body.user) throw "user-required"
          success = await new Promise((resolve,reject)=>{
            sqlite.serialize(()=>{
              sqlite.run(`delete from users where name='${body.user}'`,(err, user)=>{
                if (err){
                  resolve(false)
                }else{
                  resolve(true)
                }
                
              })
            })
          }).catch((err)=>{
            console.log("catched", err)
            throw err
          })
          success = true
      }catch(err){
          error = err
      }

      return {
          error,
          success
      }
  },
    permissions: async (body,params)=>{
        let error
        try{
            if(!body.user) throw "user-required"
            if (!body.permissions) throw "permissions-required"

            sqlite.serialize(async ()=>{
              const user = await new Promise((resolve,reject)=>{
                sqlite.get(`select rowid from users where users.name='${body.user}'`, (err1, user)=>{
                  if (err1) console.log("err1", err1)
                  sqlite.run(`delete from user_permissions where user=${user.rowid}`)
                  resolve(user)
                })
              }).catch((err)=>{
                console.log("catched", err)
                throw err
              })
              await new Promise((resolve,reject)=>{
                let perms = ""
                for (let index=0; index<body.permissions.length; index++){
                  perms+="'"+body.permissions[index]+"'"
                  if(index+1!=body.permissions.length){
                    perms+=","
                  }
                }
                sqlite.all(`select rowid from permissions where name in (${perms})`, (err, rows)=>{
                  const perms = sqlite.prepare("INSERT INTO user_permissions VALUES (?, ?)")
                  for (const row of rows){
                    perms.run(row.rowid,user.rowid)
                  }
                  perms.finalize()
                })
              }).catch((err)=>{
                console.log("catched", err)
                throw err
              })
            })
            

        }catch(err){
            error = err
        }

        return {
            error
        }
    },
    getUsersList: async (body,params)=>{
        let error
        let users

        try{
            
            users = await new Promise((resolve,reject)=>{
              sqlite.all("select users.name, users.password, users.role, users.lastlogin, permissions.name as permision from users left outer join user_permissions on users.rowid = user_permissions.user left outer join permissions on permissions.rowid = user_permissions.permision ", (err, rows)=>{
                if (err){
                  console.log("err", err)
                }
                const u1 = {}
                for (const u of rows){
                  if (u1[u.name]){
                    if (u.permision){
                      u1[u.name].permissionNumber++

                      u1[u.name].permissions.push(u.permision)
                      u1[u.name].permissionList.push(u.permision.replace(new RegExp("[-]", "g"), " "))
                    }

                  }else{
                    u1[u.name] = {
                      ...u,
                      permissionNumber:0,
                      roleDisplay:u.role,
                      permissions:[],
                      permissionList:[]

                    }
                    if (u.permision){
                      u1[u.name].permissionNumber++
                      u1[u.name].permissions.push(u.permision)
                      u1[u.name].permissionList.push(u.permision.replace(new RegExp("[-]", "g"), " "))
                    }
                  }
                }
                const u2 = []
                for (const k in u1){
                  delete u1[k].permision
                  u2.push(u1[k])
                }
                resolve(u2)
              })
            }).catch((err)=>{
              console.log("catched", err)
              throw err
            })


            

        }catch(err){
            error = err
        }
        return {
            error,
            users
        }
    },
    getPermissions:async (body,params)=>{
        let error
        let permissions

        try{

            permissions = await new Promise((resolve,reject)=>{
              sqlite.all("select name from permissions", (err, rows)=>{
                const p = []
                for (const per of rows){
                  p.push({
                    permissions:per.name,
                    displayName:per.name.replace(new RegExp("[-]", "g"), " ")
                  })
                }
                resolve(p)
              })
            })

        }catch(err){
            error = err
        }

        return {
            error,
            permissions
            
        }
    },

}

export default controller
