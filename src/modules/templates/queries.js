export const GET_TEMPLATES = function (){
    const sql =` select * from template`
    return sql
}

export const SET_DEFAULT = function(name){
    const sql=`update template set Def = 1 where Template ='${name}' order by Def desc`
    return sql
}