import { PropertyInfo as TablePropertyInfo } from "sap/ui/mdc/Table"
import { PropertyInfo as FilterBarPropertyInfo } from "sap/ui/mdc/FilterBar"
import { ApolloClient, gql } from "@apollo/client/core"

/**
 * @namespace mdc.graphql.model.metadata
 */

const GQLPropertyInfo = {

	client: undefined,

	bindClient: function (client: ApolloClient<any>) {
		this.client = client
	},

	get: async function (type: string) {
		let propertyInfo
		if (type === "table") {
			propertyInfo = await getTablePropertyInfo()
		} else if (type === "filterbar") {
			propertyInfo = await getFilterBarPropertyInfo()
		}
		return propertyInfo
	}

}

async function getTablePropertyInfo(): Promise<TablePropertyInfo[]> {
	return await getCommonPropertyInfo() as unknown as TablePropertyInfo[]
}

async function getFilterBarPropertyInfo(): Promise<FilterBarPropertyInfo[]> {
	const propertyInfo = await getCommonPropertyInfo() as unknown as FilterBarPropertyInfo[]
	// Add the "virtual" propertyInfo for the Search Field
	propertyInfo.push({
		key: "$search",
		label: "Search",
		visible: true,
		maxConditions: 1,
		dataType: "sap.ui.model.type.String"
	})
	return propertyInfo.filter(p => !['countries', 'country_codes'].includes(p.key))
}

async function querySchema(): Promise<any> {
	return (await GQLPropertyInfo.client.query({
		query: gql`
			query GetSchema($typeName: String!) {
			__type(name: $typeName) {
				name
				fields {
					name
						type {
							name
							kind
							ofType {
								name
							}
						}
					}
				}
			}
	`, variables: { typeName: 'Mountain' }
	})).data.__type
}

async function getCommonPropertyInfo() {
	return (await querySchema()).fields.filter(field => !['OBJECT'].includes(field.type?.kind)).map((field) => {
		return {
			key: field.name,
			path: field.name,
			label: formatLabel(field.name),
			dataType: assignDataType(field.name, field.type.name || field.type.ofType.name),
			formatOptions: assignFormatOptions(field.name),
			maxConditions: assignMaxConditions(field.name),
			visible: true
		}
	})
}

function formatLabel(input: string): string {
	const words = input.split('_');
	return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function assignDataType(fieldName: string, typeName: string): string {
	let dataType: string
	// there is a special type for distance measurement
	if (["height", "prominence"].includes(fieldName)) {
		dataType = "mdc.graphql.model.type.LengthMeter"
	} else if (fieldName === "first_ascent") {
		dataType = "sap.ui.model.type.Date"
	} else {
		dataType = TypeMap[typeName] || TypeMap["String"]
	}
	return dataType
}

function assignFormatOptions(fieldName: string) {
	if (fieldName === "first_ascent") {
		return {
			source: {
				pattern: "yyyy"
			}
		}
	}
}

function assignMaxConditions(fieldName: string) {
	if (fieldName === "first_ascent") {
		return 1
	}
}

enum TypeMap {
	"Int" = "sap.ui.model.type.Integer",
	"String" = "sap.ui.model.type.String"
}

export default GQLPropertyInfo

