import FilterBarDelegate from "sap/ui/mdc/FilterBarDelegate"
import GQLPropertyInfo from "../model/metadata/GQLPropertyInfo"
import FilterField from "sap/ui/mdc/FilterField"
import Element from "sap/ui/core/Element"
import {default as FilterBar, PropertyInfo as FilterBarPropertyInfo} from "sap/ui/mdc/FilterBar"
import Fragment from "sap/ui/core/Fragment"
import ValueHelp from "sap/ui/mdc/ValueHelp"
import GQLBaseDelegate from "./GQLBaseDelegate"
import View from "sap/ui/core/mvc/View"

interface FilterBarPayload {
	valueHelp: {
		[key:string]: string
	}
}

const GQLFilterBarDelegate = Object.assign({}, FilterBarDelegate, GQLBaseDelegate)

GQLFilterBarDelegate.fetchProperties = async () => GQLPropertyInfo.get("filterbar")

const _createFilterField = (id, property) => {
	return new FilterField(id, {
		dataType: property.dataType,
		conditions: `{$filters>/conditions/${property.key}}`,
		propertyKey: property.key,
		required: property.required,
		label: property.label,
		maxConditions: property.maxConditions,
		dataTypeFormatOptions: property.formatOptions,
		operators: property.key === "first_ascent" ? ["BT"] : [],
		delegate: {name: "sap/ui/mdc/field/FieldBaseDelegate", payload: {}}
	})
}

const _getCtrlView = (oControl) => {
	if (oControl instanceof View) {
		return oControl;
	}
	if (oControl && typeof oControl.getParent === "function") {
		oControl = oControl.getParent();
		return _getCtrlView(oControl);
	}
	return undefined;
};

const _createFilterFieldAndValueHelp = async (id:string, property:FilterBarPropertyInfo, filterBar:FilterBar) => {
	const propertyKey = property.key
	const filterField = _createFilterField(id, property)
	const valueHelpPayloadId = (filterBar.getPayload() as FilterBarPayload).valueHelp[propertyKey];
	if (valueHelpPayloadId ) {
		filterField.setValueHelp(_getCtrlView(filterBar)?.createId(valueHelpPayloadId))
	}
	return filterField
}

GQLFilterBarDelegate.addItem = async (filterBar:FilterBar, propertyKey:string) => {
	const property = (await GQLPropertyInfo.get("filterbar")).find((p) => p.key === propertyKey) as FilterBarPropertyInfo
	const id = `${filterBar.getId()}--filter--${propertyKey}`
	const filterField = Element.getElementById(id) as FilterField
	return filterField ?? _createFilterFieldAndValueHelp(id, property, filterBar)
}

export default GQLFilterBarDelegate