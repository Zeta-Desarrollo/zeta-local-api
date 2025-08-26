export const PRICE_LISTS = function(){
    const sql = `
    select 
        ListNum,
        ListName
    from
        OPLN
    
    order by ListNum asc
    `
    return sql
}
export const PRODUCT_BY_CODE = function(ItemCode, location, includeNoActive=false, includeNoPrice=false, includeNoStock=false, priceList = 5){
    ItemCode = ItemCode.replace(/[\[\]\(\)\;\+\:]/g, "")
    ItemCode = ItemCode.replace("'","''");
    return `
    select 
        OITM.ItemCode,
        ItemName,
        onHand,
        Price,
        OMRC.FirmName,
        OMRC.FirmCode,
        TaxCodeAR
    from 
        OITM 
    join 
        ITM1 
            on OITM.ItemCode = ITM1.ItemCode 
    join
        OMRC
            on OITM.FirmCode = OMRC.FirmCode
    where 
        PriceList=${priceList}
        and OITM.SellItem='Y'
        and OITM.ItemCode not in ('FLETE', 'FLETES', 'FLETE (E)', 'DUPLICADO', 'ELIMINADO')

        ${ location=='TODOS'? '': `and OITM.U_CBM='${location}'`}
        ${ includeNoActive ? '' : "and OITM.frozenFor = 'N'"}
        ${ includeNoStock ? '' : 'and OITM.OnHand > 0'}
        ${ includeNoPrice ? '' : 'and ITM1.Price > 0'}
        and OITM.ItemCode='${ItemCode}'`
}

export const PRODUCTS_BY_CODES = function(ItemCodes, location, includeNoActive=false, includeNoPrice=false,  includeNoStock = false, priceList=5){
    let parsed = ''
    for (let ItemCode of ItemCodes){
        ItemCode = ItemCode.replace(/[\[\]\;\+\:]/g, "")
        ItemCode = ItemCode.replace("'","''");
        parsed += "'"+ItemCode+"',"
    }
    parsed = parsed.slice(0,-1)
    return `
    select 
        OITM.ItemCode,
        ItemName,
        onHand,
        Price,
        OMRC.FirmName,
        OMRC.FirmCode,
        TaxCodeAR,
        frozenFor
    from 
        OITM 
    join 
        ITM1 
            on OITM.ItemCode = ITM1.ItemCode 
    join
        OMRC
            on OITM.FirmCode = OMRC.FirmCode
    where 
        PriceList=${priceList}
        and OITM.SellItem='Y'
        and OITM.ItemCode not in ('FLETE', 'FLETES', 'FLETE (E)', 'DUPLICADO', 'ELIMINADO')

        ${ location=='TODOS'? '': `and OITM.U_CBM='${location}'`}
        ${ includeNoActive ? '' : "and OITM.frozenFor = 'N'"}
        ${ includeNoStock ? '' : 'and OITM.OnHand > 0'}
        ${ includeNoPrice ? '' : 'and ITM1.Price > 0'}
        and OITM.ItemCode in (${parsed})`
}


export const FIRM_AND_COUNT = function(location,includeNoActive=false, includeNoPrice=false,  includeNoStock = false, priceList=5){
    priceList = priceList? priceList : 5
    const query = `
    select
        OMRC.FirmCode,
        FirmName,
        COUNT(OMRC.FirmCode) amountProducts
        
    from OMRC 
    join OITM 
        on OMRC.FirmCode = OITM.FirmCode
    join ITM1
        on OITM.ItemCode = ITM1.ItemCode
    where
        PriceList=${priceList}
        and OITM.SellItem='Y'
        and OITM.ItemCode not in ('FLETE', 'FLETES', 'FLETE (E)', 'DUPLICADO', 'ELIMINADO')

        ${ location=='TODOS'? '': `and OITM.U_CBM='${location}'`}
        ${ includeNoActive ? '' : "and OITM.frozenFor = 'N'"}
        ${ includeNoStock ? '' :  `and OITM.OnHand > 0`}
        ${ includeNoPrice ? '' :  `and ITM1.Price > 0`}
    group by
        OMRC.FirmCode,
        OMRC.FirmName 
    order by FirmName asc`
    return query
}

export const PRODUCTS_BY_MARCA = function(FirmCode, location, includeNoActive=false, includeNoPrice=false,  includeNoStock = false, priceList=5){
    FirmCode = FirmCode.replace(/[\[\]\(\)\;\+\:]/g, "")
    FirmCode = FirmCode.replace("'","''");
    includeNoStock = includeNoStock ? true : false
    const query = `
    select 
        OITM.ItemCode,
        ItemName,
        onHand,
        U_NIV_I,
        Price,
        OMRC.FirmName,
        OMRC.FirmCode,
        OITM.ItmsGrpCod,
        OITM.TaxCodeAR
    from 
        OITM 
    join 
        ITM1 
            on OITM.ItemCode = ITM1.ItemCode 
    join
        OMRC
            on OITM.FirmCode = OMRC.FirmCode
    where 
        PriceList=${priceList}
        and OITM.SellItem='Y'
        and OITM.FirmCode='${FirmCode}'
        and OITM.ItemCode not in ('FLETE', 'FLETES', 'FLETE (E)', 'DUPLICADO', 'ELIMINADO')
        ${ location=='TODOS'? '': `and OITM.U_CBM='${location}'`}
        ${ includeNoActive ? '' : "and OITM.frozenFor = 'N'"}
        ${ includeNoStock ? '' : 'and OITM.OnHand > 0'}
        ${ includeNoPrice ? '' : 'and ITM1.Price > 0'}
    order by OITM.ItemCode asc
        `
    return query
}

export const MARCAS = function(){
    const query = `
    select
        CAST(FirmCode as varchar) as FirmCode,
        FirmName
    from OMRC 
    order by FirmName asc`
    return query;
}

export const ALL_PRODUCTS = function(){
    const query = `
        select 
            OITM.ItemCode,
            CAST(OITM.ItmsGrpCod as varchar) as ItmsGrpCod,
            ItemName,
            onHand,
            Price,
            CAST(FirmCode as varchar) as FirmCode,
            frozenFor,
            OITM.TaxCodeAR
        from 
            OITM 
        join 
            ITM1 
                on OITM.ItemCode = ITM1.ItemCode 
        where 
            PriceList=3
            and OITM.SellItem='Y'
    `
    return query

}

export const ITEM_GROUPS = function(){
    const query = `
    select 
        CAST(ItmsGrpCod as varchar) as ItmsGrpCod, 
        ItmsGrpNam 
    from OITB
    `
    return query
}

export const PRODUCTS_BY_SEARCH = function(brandCode,search){
    search = search.replace(/[\[\]\(\)\;\+\:]/g, "")
    search = search.replace("'","''");

    if (brandCode){
        brandCode = brandCode.replace(/[\[\]\(\)\;\+\:]/g, "")
        brandCode = brandCode.replace("'","''");
    }

    const trimmed = search.trim()
    const split = trimmed.split(' ')
    let filter = ""
    if (brandCode){
        filter = `OITM.FirmCode = '${brandCode}' and `
    }
    if (split.length=== 1){
        filter +=`(OITM.ItemCode like '%${trimmed}%' or ItemName like '%${trimmed}%' or OITM.U_NIV_I like '%${trimmed}%')`
    }else{
        filter += "("
        for (const part of split){
            filter += `(ItemName like '%${part}%' or OITM.ItemCode like '%${part}%' or OITM.U_NIV_I like '%${part}%') and `
        }
        filter = filter.slice(0, filter.length - 4)   
        filter += ")"
    }
    const query =`
    select
        OITM.ItemCode,
        ItemName,
        Price,
        OMRC.FirmCode,
        U_NIV_I,
        FirmName,
        onHand
    from OITM 
    join ITM1
        on OITM.ItemCode = ITM1.ItemCode
	join OMRC 
        on OMRC.FirmCode = OITM.FirmCode
    where 
        OITM.frozenFor = 'N'
        and OITM.SellItem='Y'
        and onHand >0 
        and Price > 0
        and PriceList='3' 
        and OITM.ItemCode not in ('FLETE', 'FLETES', 'FLETE (E)', 'DUPLICADO', 'ELIMINADO')
        and ${filter}
    group by
        OITM.ItemCode,
        ItemName,
        Price,
        OMRC.FirmCode,
        U_NIV_I,
        FirmName,
        onHand
    order by ItemName asc
    `
    return query
}

export const PROVIDER_AND_COUNT = function(location,includeNoActive=false, includeNoPrice=false,  includeNoStock = false, priceList=5){

    const query = `
    select
        OCRD.CardCode,
        OCRD.CardName,
        COUNT(OCRD.CardCode) amountProducts
        
    from OCRD
    join OITM 
        on OCRD.CardCode = OITM.CardCode
    join ITM1
        on OITM.ItemCode = ITM1.ItemCode
    where
        PriceList=${priceList}
        and OITM.SellItem='Y'
        and OCRD.CardType = 'S'
        ${ location=='TODOS'? '': `and OITM.U_CBM='${location}'`}
        ${ includeNoActive ? '' : "and OITM.frozenFor = 'N'"}
        ${ includeNoStock ? '' :  `and OITM.OnHand > 0`}
        ${ includeNoPrice ? '' :  `and ITM1.Price > 0`}
        and OITM.ItemCode not in ('FLETE', 'FLETES', 'FLETE (E)', 'DUPLICADO', 'ELIMINADO')

    group by
        OCRD.CardCode,
        OCRD.CardName 
    order by CardName asc`
    return query
}

export const PRODUCTS_BY_PROVEEDOR = function(CardCode, location, includeNoActive=false, includeNoPrice=false,  includeNoStock = false, priceList=5){
    CardCode = CardCode.replace(/[\[\]\(\)\;\+\:]/g, "")
    CardCode = CardCode.replace("'","''");
    includeNoStock = includeNoStock ? true : false
    const query = `
    select 
        OITM.ItemCode,
        ItemName,
        onHand,
        U_NIV_I,
        Price,
        OMRC.FirmName,
        OMRC.FirmCode,
        OITM.ItmsGrpCod,
        OITM.TaxCodeAR,
        OCRD.CardCode,
        OCRD.CardName
    from 
        OITM 
    join 
        ITM1 
            on OITM.ItemCode = ITM1.ItemCode 
    join OCRD 
        on OCRD.CardCode = OITM.CardCode
    join
        OMRC
            on OITM.FirmCode = OMRC.FirmCode
    where 
        PriceList=${priceList}
        and OITM.SellItem='Y'
        and OCRD.CardCode='${CardCode}'
        and OCRD.CardType = 'S'
        and OITM.ItemCode not in ('FLETE', 'FLETES', 'FLETE (E)', 'DUPLICADO', 'ELIMINADO')


        ${ location=='TODOS'? '': `and OITM.U_CBM='${location}'`}
        ${ includeNoActive ? '' : "and OITM.frozenFor = 'N'"}
        ${ includeNoStock ? '' : 'and OITM.OnHand > 0'}
        ${ includeNoPrice ? '' : 'and ITM1.Price > 0'}
    order by OITM.ItemCode asc
        `

    return query
}

export const FACT_AND_COUNT = function(props){
    const query = `
        select top 200
            DocNum, 
            opch.DocEntry,
            opch.DocDate,
            CardName, 
            NumAtCard,
			count (pch1.ItemCode) as amountProducts
        from 
            opch 
        join 
            pch1 
        on 
            opch.DocEntry=pch1.DocEntry 
        where 
            opch.series = '14' 
            and opch.DocType='I'
            and opch.DocDate>='${props.minDay}'
			and opch.DocDate<'${props.maxDay}'
            and opch.CANCELED = 'N'
            and pch1.ItemCode not in ('FLETE', 'FLETES', 'FLETE (E)', 'DUPLICADO', 'ELIMINADO')
        group by 
            DocNum, 
            opch.DocEntry,
            opch.DocDate,
            NumAtCard,
            CardName
        order by DocNum desc`
        return query
}

export const PRODUCTS_BY_FACTURA = function(DocEntry, priceList=5){
    const query = `
    select 
        OITM.ItemCode,
        OITM.ItemName,
        onHand,
        U_NIV_I,
        ITM1.Price,
        OMRC.FirmName,
        OMRC.FirmCode,
        OITM.ItmsGrpCod,
        OITM.TaxCodeAR
    from 
        OITM 
    join 
        ITM1 
            on OITM.ItemCode = ITM1.ItemCode 
    join PCH1 
        on PCH1.ItemCode = OITM.ItemCode
    join
        OMRC
            on OITM.FirmCode = OMRC.FirmCode
    where 
        PriceList=${priceList}
        and pch1.DocEntry='${DocEntry}'
        and pch1.ItemCode not in ('FLETE', 'FLETES', 'FLETE (E)', 'DUPLICADO', 'ELIMINADO')

    order by pch1.BaseLine asc
        `
        return query
}