/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call,
  @typescript-eslint/no-unsafe-assignment */

import ApolloController from "./ApolloController";
import Button from "sap/m/Button";
import Dialog from "sap/m/Dialog";
import { gql } from "@apollo/client/core";
import JSONModel from "sap/ui/model/json/JSONModel";
import UIComponent from "sap/ui/core/UIComponent";
import { Button$PressEvent } from "sap/m/Button";
import { ButtonType } from "sap/m/library";
import { RowActionItem$PressEvent } from "sap/ui/mdc/table/RowActionItem";
import { Route$BeforeMatchedEvent } from "sap/ui/core/routing/Route";
import FilterBar from "sap/ui/mdc/FilterBar";
import StateUtil from "sap/ui/mdc/p13n/StateUtil";

export interface UIModelData {
  mountain: Mountain;
}

export type Mountain = {
  name: string,
  height: number,
  prominence: number,
  range: string,
  coordinates: string,
  parent_mountain: string,
  first_ascent: number,
  countries: string,
}

/**
 * @namespace mdc.graphql.app.controller
 */
export default class MountainsController extends ApolloController {
  apollo = {
    mountains: {
      binding: "{apollo>/mountains}",
      query: gql`
        query GetMountains {
          getMountains {
            id
            id_range
            id_parent
            description
            name
            height
            prominence
            range {
              id
              name
            }
            coordinates
            parent_mountain {
              id
              name
            }
            first_ascent
            countries {
              code
              descr
            }
          }
        }
      `,
    },
    ranges: {
      binding: "{apollo>/ranges}",
      query: gql`
          query GetRanges {
            getRanges {
              id
              name
            }
          }`
    },
    countries: {
      binding: "{apollo>/countries}",
      query: gql`
          query GetCountries {
            getCountries {
              code
              descr
            }
          }`
    },
  };

  private createDialog: Dialog;

  public onInit(): void {
    super.onInit();

    const updateOnEvent = {
      next: (/* data: any */) => {
        // @ts-ignore - TODO: apollo object doesn't know about generated functions!
        this.apollo.mountains.invoke();
      },
      error: (error: any) => {
        console.log(error)
      },
    };

    this.$subscribe({
      query: gql`
        subscription Subscription {
          mountainsUpdated {
            name
          }
        }
      `,
    }).subscribe(updateOnEvent);

    UIComponent.getRouterFor(this).getRoute("mountainList").attachMatched(this._onRouteMatched, this);
  }

  private _onRouteMatched(event: Route$BeforeMatchedEvent) {
    const range = event.getParameter("arguments")["?range"]?.range
    if (range) {
      let filterBar = this.byId("filterbar") as FilterBar
      StateUtil.applyExternalState(filterBar, {
        filter: {
          "id_range": [{
            operator: "EQ",
            validated: 'Validated',
            values: [range]
          }]
        }
      })
      filterBar.triggerSearch()
    }
  }

  private getInputModel(): JSONModel {
    return this.getView().getModel("input") as JSONModel;
  }

  public async createMountain(): Promise<void> {
    const uiData = this.getInputModel().getData()
    const mountain = uiData.mountain

    // create the new todo item via mutate call
    await this.$mutate({
      mutation: gql`
        mutation CreateMountain($input: NewMountainInput) {
          createMountain(mountain: $input) {
            id_range
            id_parent
            name
            height
            prominence
            coordinates
            first_ascent
            country_codes
            description
          }
        }
      `,
      variables: {
        input: {
          ...mountain,
          height: +mountain.height,
          prominence: +mountain.prominence,
          first_ascent: +mountain.first_ascent
        }
      },
    });
  }

  public async onCreate(event: Button$PressEvent): Promise<void> {
    if (!this.createDialog) {
      this.createDialog = await this.buildCreateDialog()
      // to get access to the controller's model
      this.getView().addDependent(this.createDialog);
    }
    this.getInputModel().setData({ editMode: true, mountain: {} })
    this.createDialog.open()
  }

  public onRowPress(event: RowActionItem$PressEvent): void {
    // does not work
    // var oContext = event.getParameter("bindingContext") || event.getSource().getBindingContext("mountains");

    UIComponent.getRouterFor(this).navTo("mountainDetails", {
      mountainId: "d7c9e820-8aa0-46bc-96b4-525811428530"
    });
  }

  private async buildCreateDialog(): Promise<Dialog> {
    return new Dialog({
      contentWidth: "50vh",
      title: "Add Mountain",
      content: await this.loadFragment({
        name: "mdc.graphql.view.fragment.MountainForm"
      }),
      beginButton: new Button({
        type: ButtonType.Emphasized,
        text: "Submit",
        press: () => {
          this.createMountain().then(() => {
            this.createDialog.close()
          })
        }
      }),
      endButton: new Button({
        text: "Cancel",
        press: () => {
          this.createDialog.close();
        }
      }),
      afterClose: () => {
        this.getInputModel().setData({ editMode: false, mountain: {} })
      }

    })
  }
}
