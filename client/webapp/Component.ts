import { InMemoryCache } from "@apollo/client/cache";
import { HttpLink, split, ApolloClient } from "@apollo/client/core";
import { WebSocketLink } from "@apollo/client/link/ws";
import { getMainDefinition } from "@apollo/client/utilities";
import UIComponent from "sap/ui/core/UIComponent"
import GQLPropertyInfo from "./model/metadata/GQLPropertyInfo";

/**
 * @namespace mdc.graphql
 */
export default class ApolloComponent extends UIComponent {
	public static metadata = {
		manifest: "json",
	};

	public apolloClient: ApolloClient<any>

	public init(): void {
		// call the base component's init function
		super.init();

		// create the views based on the url/hash
		this.getRouter().initialize();

		// initialize apollo client for this component
		this.apolloClient = this.initializeApolloClient()

		// bind client for schema retrieval
		GQLPropertyInfo.bindClient(this.apolloClient)
	}

	private initializeApolloClient() {
		// determine the GraphQL datasource
		const dataSources = this.getManifestEntry("/sap.app/dataSources");
		const graphQLServices = Object.keys(dataSources).filter((ds) => {
			return dataSources[ds].type == "GraphQL";
		});

		// the GraphQL service is the first found datasource entry
		const graphQLService = dataSources[graphQLServices.shift()];

		const httpLink = new HttpLink({
			uri: graphQLService.uri,
		});

		const wsLink = new WebSocketLink({
			uri: graphQLService.settings.ws,
			options: {
				reconnect: true,
			},
		});

		// The split function takes three parameters:
		//
		// * A function that's called for each operation to execute
		// * The Link to use for an operation if the function returns a "truthy" value
		// * The Link to use for an operation if the function returns a "falsy" value
		const splitLink = split(
			({ query }) => {
				const definition = getMainDefinition(query);
				return definition.kind === "OperationDefinition" && definition.operation === "subscription";
			},
			wsLink,
			httpLink
		);

		return new ApolloClient({
			name: "ui5-client",
			version: "1.0",
			link: splitLink,
			cache: new InMemoryCache(),
			connectToDevTools: true,
			defaultOptions: {
				watchQuery: { fetchPolicy: "no-cache" },
				query: { fetchPolicy: "no-cache" },
				mutate: { fetchPolicy: "no-cache" },
			},
		});
	}
}