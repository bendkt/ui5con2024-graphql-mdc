# ui5con-graphql-mdc
This repository contains a sample for UI5Con 2024 demonstrating the synergies between GraphQL via Apollo Server/Client and MDC.

## install dependencies
You'll need to have Yarn installed in order to install the whole setup. 
```console
yarn
```

## run the project (starts the GraphQL and UI5 server)
```console
yarn start
```
Afterwards you can access the app on localhost:8080.

## architecture
To give a little orientation of what happens where:
### significant artifacts
* Component: Creates the Apollo Client
* ApolloController: Sets up the UI5/GQL integration with JSONModel
* GQLPropertyInfo: Retrieves and maps the GQL schema to MDC PropertyInfo
### overview (brief and simplified)
![app](app.png)

## related work
https://github.com/petermuessig/ui5-sample-apollo-reloaded
