import dotenv from "dotenv"
dotenv.config()
import apollo from "@apollo/client/core/core.cjs";
const {
    ApolloClient,
    ApolloLink,
    HttpLink,
    InMemoryCache,
    gql
  } = apollo

import createUploadLink from "apollo-upload-client/createUploadLink.mjs"

console.log("XXDDD", process.env.GATEWAY)
const uploadLink = createUploadLink({
    // uri: "http://localhost:3000/graphql",
  uri: process.env.GATEWAY,
        headers: {
        "Apollo-Require-Preflight": "true",
      },
})


export const data = {}

const middleWareLink = new ApolloLink((operation, forward) => {
  // antes de toda consulta al server se valida si la sesion no ha expirado
  const token = data.token;
  // if (!token) router.push({ path: "/" });
  operation.setContext((context) => ({
    ...context,
    headers: {
      ...context.headers,
      authorization: token || "", // la palabra Bearer sobra, no se hace nada con ella al desencriptar el token
    },
  }));
  return forward(operation);
});

export const apolloClient = new ApolloClient({
  // link: authLink.concat(httpLink),
  // link: authLink.concat(httpLinkWithUpload),
  // link: ApolloLink.from([middleWareLink, errorLink, httpLinkWithUpload]),
  link: ApolloLink.from([middleWareLink, uploadLink]),
  cache: new InMemoryCache({
    possibleTypes:{
      CodeResult:["product", "brand", "group"]
    },
    addTypename: true, // agregar campo __typename a los documentos
  }),
  connectToDevTools: true,
});



export const JOB_UPDATE_PRODUCTS_STARTS =gql`
mutation jobUpdateProductsStart($id:String, $chunks:Int) {
  jobUpdateProductsStart(id:$id, chunks:$chunks)
}`

export const JOB_UPDATE_PRODUCTS =gql`
mutation jobUpdateProducts($products:[updateProduct]) {
  jobUpdateProducts(products:$products)
}`

export const JOB_UPDATE_BRANDS =gql`
mutation jobUpdateBrands($brands:[brandInput]) {
  jobUpdateBrands(brands:$brands)
}`

export const JOB_UPDATE_GROUPS =gql`
mutation jobUpdateGroups($groups:[groupInput]) {
  jobUpdateGroups(groups:$groups)
}`
export const LOGIN = gql`
mutation Mutation($email: String, $password: String) {
    login(email: $email, password: $password){
      firebaseToken
      token
      expire
      photo
      rules
      role
    }
  }`



  export const SET_PRODUCT_IMAGE = gql`
  mutation setProductImage($ItemCode: String!, $hasImage:Boolean) {
      setProductImage(ItemCode: $ItemCode, hasImage:$hasImage)
    }`
  
    export const SET_BRAND_IMAGE = gql`
  mutation setBrandImage($FirmCode: String!, $hasImage:Boolean) {
      setBrandImage(FirmCode: $FirmCode, hasImage:$hasImage)
    }`
  
    export const SET_GROUP_IMAGE = gql`
  mutation setGroupImage($code: String!, $outline:Boolean, $has:Boolean) {
      setGroupImage(code: $code, outline:$outline, has:$has)
    }`
  export const SINGLE_IMAGE_UPLOAD =gql`
mutation singleImageUpload($File:Upload, $name:String, $type:String!){
singleImageUpload(File:$File, type:$type, name:$name ){
  filename
  mimetype
}}`