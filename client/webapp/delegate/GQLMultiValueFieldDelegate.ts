import merge from "sap/base/util/merge";
import MultiValueFieldDelegate from "sap/ui/mdc/field/MultiValueFieldDelegate";
import JSONModel from "sap/ui/model/json/JSONModel";
import GQLBaseDelegate from "./GQLBaseDelegate";

const GQLMultiValueFieldDelegate = Object.assign({}, MultiValueFieldDelegate, GQLBaseDelegate)

GQLMultiValueFieldDelegate.updateItems = function (payload, conditions, multiValueField) {

    const listBinding = multiValueField.getBinding("items");

    if (listBinding.isA("sap.ui.model.json.JSONListBinding")) {

        const pathPrefix = '/mountain/'; //We consider the model mapping

        // check if conditions are added, removed or changed
        const bindingInfo = multiValueField.getBindingInfo("items");
        const itemPath = bindingInfo.path;
        const model = listBinding.getModel() as JSONModel;
        const items = merge([], model.getProperty(pathPrefix + itemPath)) as Array<String>;

        // first remove items not longer exist
        if (items.length > conditions.length) {
            items.splice(conditions.length);
        }

        for (let i = 0; i < conditions.length; i++) {
            const condition = conditions[i];
            let item = items[i];
            if (!item) {
                // new condition -> add item
                item = condition.values[0];
                items.push(item);
            } else if (condition.values[0] !== item) {
                // condition changed -> remove item and insert new
                item = condition.values[0];
                items.splice(i, 1, item);
            }
        }

        model.setProperty(pathPrefix + itemPath, items);
    }
};

export default GQLMultiValueFieldDelegate;