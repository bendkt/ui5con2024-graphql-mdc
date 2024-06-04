import TableDelegate from "sap/ui/mdc/TableDelegate"
import Text from "sap/m/Text"
import Element from "sap/ui/core/Element"
import GQLPropertyInfo from "../model/metadata/GQLPropertyInfo"
import { default as Table, PropertyInfo as TablePropertyInfo } from "sap/ui/mdc/Table"
import Column from "sap/ui/mdc/table/Column"
import Filter from "sap/ui/model/Filter"
import FilterOperator from "sap/ui/model/FilterOperator"
import FilterBar from "sap/ui/mdc/FilterBar"
import GQLBaseDelegate from "./GQLBaseDelegate"
import MultiValueFieldItem from "sap/ui/mdc/field/MultiValueFieldItem"
import MultiValueField from "sap/ui/mdc/MultiValueField"

interface TablePayload {
	bindingPath: string
	searchKeys: string[]
}

interface CountryObject {
	code: string
	descr: string
}

const GQLTableDelegate = Object.assign({}, TableDelegate, GQLBaseDelegate)

GQLTableDelegate.fetchProperties = async () => GQLPropertyInfo.get("table")

const _createText = (propertyInfo: TablePropertyInfo) => new Text({
	text: {
		path: "apollo>" + propertyInfo.key,
		type: propertyInfo.dataType
	}
})

const _createMultiValueField = (propertyInfo: TablePropertyInfo) => (new MultiValueField({ display: "Value", 
		editMode: "Display", 
		showEmptyIndicator: false, 
		items: { path: 'apollo>countries', templateShareable: false, template: new MultiValueFieldItem({ key: "{path: 'apollo>descr', type:'sap.ui.model.type.String'}" })} 
	}));

const _createColumn = (propertyInfo: TablePropertyInfo, table: Table) => {
	const id = table.getId() + "---col-" + propertyInfo.key
	const column = Element.getElementById(id) as Column
	return column ?? new Column(id, {
		propertyKey: propertyInfo.key,
		header: propertyInfo.label,
		template: propertyInfo.key === "countries" ? _createMultiValueField(propertyInfo) : _createText(propertyInfo)
	})
}

GQLTableDelegate.addItem = async (table: Table, propertyKey: string) => {
	const propertyInfo = (await GQLPropertyInfo.get("table")).find((p) => p.key === propertyKey)
	return _createColumn(propertyInfo, table)
}

GQLTableDelegate.updateBindingInfo = (table, bindingInfo) => {
	TableDelegate.updateBindingInfo.call(GQLTableDelegate, table, bindingInfo)
	bindingInfo.path = (table.getPayload() as TablePayload).bindingPath
	bindingInfo.templateShareable = true
}

const _createSearchFilters = (value: string, keys: string[]) => {
	const filters = keys.map((key) => new Filter({
		path: key,
		operator: FilterOperator.Contains,
		value1: value,
		test: key === "countries" ? (countries) => {
			return countries.some((country:CountryObject) => country.descr.toLowerCase().includes(value.toLowerCase()))
		} : undefined
		
	}));
	return [new Filter(filters, false)]
}

GQLTableDelegate.getFilters = (table) => {
	const search = (Element.getElementById(table.getFilter()) as FilterBar).getSearch()
	const keys = (table.getPayload() as TablePayload).searchKeys
	let filters = TableDelegate.getFilters(table)
	if (search && keys) {
		filters = filters.concat(_createSearchFilters(search, keys))
	}
	return filters
}

export default GQLTableDelegate