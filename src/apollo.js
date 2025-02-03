import apollo from "@apollo/client/core/core.cjs";


const {
    ApolloClient,
    ApolloLink,
    HttpLink,
    InMemoryCache,
    gql
  } = apollo

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

const httpLinkWithUpload = new HttpLink({
  // You should use an absolute URL here
  // uri: config.graphql.url
  uri: process.env.GATEWAY,

});

export const apolloClient = new ApolloClient({
  // link: authLink.concat(httpLink),
  // link: authLink.concat(httpLinkWithUpload),
  // link: ApolloLink.from([middleWareLink, errorLink, httpLinkWithUpload]),
  link: ApolloLink.from([middleWareLink, httpLinkWithUpload]),
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
mutation jobUpdateProducts($updateId:String, $chunk:Int, $products:[updateProduct]) {
  jobUpdateProducts(updateId:$updateId, chunk:$chunk, products:$products)
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




