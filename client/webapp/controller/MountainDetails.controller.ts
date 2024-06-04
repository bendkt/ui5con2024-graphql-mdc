/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any,
    @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call,
    @typescript-eslint/no-unsafe-assignment */
import ApolloController from "./ApolloController";
import { gql } from "@apollo/client/core";
import { Link$PressEvent } from "sap/m/Link";
import UIComponent from "sap/ui/core/UIComponent";
import { Route$MatchedEvent } from "sap/ui/core/routing/Route";
import JSONModel from "sap/ui/model/json/JSONModel";

interface RouteMatchedArguments {
  mountainId: string
}

/**
 * @namespace mdc.graphql.app.controller
 */
export default class MountainDetailsController extends ApolloController {
  apollo = {
    ranges: {
      binding: "{apollo>/ranges}",
      query: gql`
        query GetRanges {
          getRanges {
            id
            name
          }
        }
      `
    },
    countries: {
      binding: "{apollo>/countries}",
      query: gql`
        query GetCountries {
          getCountries {
            code
            descr
          }
        }
      `
    },
    mountain: {
      skip: true,
      binding: "{apollo>/mountain}",
      query: gql`
        query GetMountain($mountainId: String!) {
          getMountain(mountainId: $mountainId) {
            id
            id_parent
            id_range
            country_codes
            name
            height
            prominence
            coordinates
            first_ascent
            description
            countries {
              code
              descr
            }
            range {
              id
              name
            }
            parent_mountain {
              id
              name
            }
          }
        }
      `,
      variables: {
        mountainId: null
      }
    },
    mountains: {
      binding: "{apollo>/mountains}",
      query: gql`
            query GetMountains {
              getMountains {
                id
                name
              }
            }
          `,
    }
  };

  public onInit(): void {
    super.onInit();

    UIComponent.getRouterFor(this).getRoute("mountainDetails").attachMatched(this.onRouteMatched, this);

    this.$subscribe({
      query: gql`
        subscription Subscription {
          mountainsUpdated {
            name
          }
        }
          `,
    }).subscribe(this.updateOnEvent);
  }

  private updateOnEvent = {
    next: (/* data: any */) => {
      // @ts-ignore - TODO: apollo object doesn't know about generated functions!
      this.apollo.mountain.invoke();
    },
    error: (error: any) => {
      console.log(error)
    },
  };

  private onRouteMatched(event: Route$MatchedEvent): void {
    this.apollo.mountain.variables.mountainId = (event.getParameter("arguments") as RouteMatchedArguments)?.mountainId
    // @ts-ignore - TODO: apollo object doesn't know about generated functions!
    this.apollo.mountain.invoke();
  }

  public onEditButtonPress(event): void {
    const view = this.getView();
    const apolloModel = view.getModel("apollo") as JSONModel;
    const apolloData = apolloModel.getData();
    const inputModel = this.getView().getModel("input") as JSONModel;
    const { __typename, ...mountainProps } = apolloData.mountain;
    inputModel.setData({ editMode: true, mountain: { ...mountainProps } })
  }

  public async onSaveButtonPress(event): Promise<void> {
    const view = this.getView();
    const inputModel = view.getModel("input") as JSONModel;
    const inputData = inputModel.getData();

    const { parent_mountain, range, countries, ...mountainProperties } = inputData.mountain;

    // create the new todo item via mutate call
    await this.$mutate({
      mutation: gql`
            mutation UpdateMountain($mountain: UpdateMountainInput) {
              updateMountain(mountain: $mountain) {
                id
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
      variables: { mountain: mountainProperties },
    });

    inputModel.setData({ editMode: false })
  }

  public onCancelButtonPress(event): void {
    const inputModel = this.getView().getModel("input") as JSONModel;
    inputModel.setData({ editMode: false })
  }

  public navToMountains(event: Link$PressEvent) {
    UIComponent.getRouterFor(this).navTo("mountainList");
  }

  public navToMountainsWithRange(event: Link$PressEvent) {
    const selectedRange = event.getSource().getText()
    UIComponent.getRouterFor(this).navTo("mountainList", { "?range": { range: selectedRange } });
  }

  public coordinatesToGoogleMapsLink(coordinates: string): string {
    if (coordinates) {
      const [lat, long] = coordinates.split(' ');
      const latNum = lat.slice(0, -1);
      const longNum = long.slice(0, -1);
      return `https://www.google.com/maps?q=${latNum},${longNum}`;
    }
  }

}