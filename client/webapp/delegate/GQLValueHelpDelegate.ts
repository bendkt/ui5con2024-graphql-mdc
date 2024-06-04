import ValueHelp from "sap/ui/mdc/ValueHelp"
import GQLBaseDelegate from "./GQLBaseDelegate"
import ValueHelpDelegate from "sap/ui/mdc/ValueHelpDelegate"
import Content from "sap/ui/mdc/valuehelp/base/Content"
import ListBinding from "sap/ui/model/ListBinding"
import FilterableListContent from "sap/ui/mdc/valuehelp/base/FilterableListContent"
import Filter from "sap/ui/model/Filter"
import FilterOperator from "sap/ui/model/FilterOperator"

interface ValueHelpPayload {
	searchKeys: string[]
}

const GQLValueHelpDelegate = Object.assign({}, ValueHelpDelegate, GQLBaseDelegate)

GQLValueHelpDelegate.isSearchSupported = function (oValueHelp: ValueHelp, oContent: Content, oListBinding: ListBinding) {
	return oValueHelp.getPayload().hasOwnProperty("searchKeys")
}

GQLValueHelpDelegate.getFilters = function (oValueHelp:ValueHelp, oContent: FilterableListContent) {
	const oPayload = oValueHelp.getPayload() as ValueHelpPayload;
	const sFilterValue = oValueHelp.getFilterValue();
	const aFilters = sFilterValue && oPayload.searchKeys?.map(field => new Filter({
		path: field,
		operator: FilterOperator.Contains,
		value1: sFilterValue
	}))
	if (aFilters?.length > 1) {
		return [new Filter(aFilters, false)]
	}
	return aFilters?.length > 1 ? [new Filter(aFilters, false)] : aFilters || [];
}

export default GQLValueHelpDelegate