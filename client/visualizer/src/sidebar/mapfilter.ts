import ScaffoldCommunicator from '../main/scaffold';
import * as cst from '../constants';
import {MapType} from '../constants';


export type MapSchema = {
  name: string,
  type: MapType,
  optionElement: HTMLOptionElement;
};

export default class MapFilter {

  // The public div and other HTML containers
  readonly div: HTMLDivElement;
  private readonly filterDiv: HTMLDivElement;
  private readonly mapsDiv: HTMLSelectElement;

  // Input to filter maps by name
  private readonly filterName: HTMLInputElement;
  private readonly filterType: Map<MapType, HTMLInputElement>;

  // Map types available (NOTE: Update after each tournament)
  private readonly types: MapType[] = [MapType.DEFAULT, MapType.CUSTOM, MapType.SPRINT, MapType.SEEDING, MapType.INTL_QUALIFYING];

  // All the maps displayed on the client
  private maps: Array<MapSchema>;

  // The scaffold
  private scaffold: ScaffoldCommunicator;
  private cb = (err: Error | null, maps?: Set<string>) => {
    // There was an error
    if (err) {
      console.log(err);
      return;
    }

    // Found the maps
    if (maps) {
      // Re-index the maps
      this.indexMaps(maps);
      this.maps.forEach((map: MapSchema) => {
        this.mapsDiv.appendChild(map.optionElement);
      });

      // Refresh the UI
      this.applyFilter();
    }
  }

  constructor() {
    this.div = document.createElement("div");

    // Create the HTML elements
    this.filterDiv = document.createElement("div");
    this.mapsDiv = document.createElement("select");
    this.mapsDiv.multiple = true;
    this.mapsDiv.id = "mapsDiv";
    this.filterName = document.createElement("input");
    this.filterType = new Map<MapType, HTMLInputElement>();
    this.maps = new Array<MapSchema>();

    // Add the HTML elements to the UI
    this.div.appendChild(this.filterDiv);
    this.div.appendChild(this.mapsDiv);
    this.loadFilters();
    this.addHTMLElements();
  }

  /**
   * Indexes maps internally by alphabetical order.
   */
  private indexMaps(maps: Set<string>): void {
    this.maps = new Array();
    maps.forEach((map: string) => {
      const optionElement = document.createElement("option");

      // add an option element for this map
      optionElement.value = map;
      optionElement.innerHTML = map;

      // ...and store it internally.
      this.maps.push({
        name: map,
        type: this.mapNameToMapType(map),
        optionElement: optionElement
      });
    });

    // Sort the maps in alphabetical order
    this.maps.sort(function(a: MapSchema, b: MapSchema) {
      const aName: string = a.name.toLowerCase();
      const bName: string = b.name.toLowerCase();
      if (aName < bName) {
        return -1;
      } else if (aName > bName) {
        return 1;
      } else {
        return 0;
      }
    });
  }

  /**
   * Creates the input elements for selecting filters
   */
  private loadFilters(): void {
    // Filter for map name
    this.filterName.type = "text";
    this.filterName.onkeyup = () => { this.applyFilter() };
    this.filterName.onchange = () => { this.applyFilter() };

    // Filter for map type
    for (let type of this.types) {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = String(type);
      checkbox.checked = true;
      checkbox.onchange = () => {
        this.applyFilter();
      }
      this.filterType.set(type, checkbox);
    }
  }

  /**
   * Adds the input elements to the UI
   */
  private addHTMLElements(): void {
    this.filterDiv.appendChild(document.createTextNode("Search: "));
    this.filterDiv.appendChild(this.filterName);
    this.filterDiv.appendChild(document.createElement("br"));

    this.filterType.forEach((checkbox: HTMLInputElement, type: MapType) => {
      const span = document.createElement("span");
      span.style.display = "inline-block";
      span.appendChild(checkbox);
      span.appendChild(document.createTextNode(this.mapTypeToString(type)));
      this.filterDiv.appendChild(span);
    });
  }

  /**
   * Helper method.
   */
  private mapTypeToString(type: MapType): string {
    switch(type) {
      case MapType.DEFAULT: return "Default";
      case MapType.SPRINT: return "Sprint";
      case MapType.SEEDING: return "Seeding";
      case MapType.INTL_QUALIFYING: return "Intl Quals";
      case MapType.US_QUALIFYING: return "US Quals";
      case MapType.HS: return "HS";
      case MapType.NEWBIE: return "Newbie";
      case MapType.FINAL: return "Final";
      default: return "Custom";
    }
  }

  /**
   * Helper method.
   */
  private mapNameToMapType(name: string): MapType {
    if (cst.SERVER_MAPS.has(name)) {
      return cst.SERVER_MAPS.get(name)!;
    }
    return MapType.CUSTOM;
  }

  /**
   * Helper method that returns the map name being searched for, or undefined
   * if the search field is empty.
   */
  private getSearchedRegex(): RegExp | undefined {
    const value = this.filterName.value.trim().toLowerCase();
    return value === "" ? undefined : new RegExp(`^${value}`);
  }

  /**
   * Helper method that returns the list of selected map types.
   */
  private getTypes(): MapType[] {
    const types: MapType[] = new Array();
    this.filterType.forEach((checkbox: HTMLInputElement, type: MapType) => {
      if (checkbox.checked) {
        types.push(type);
      }
    });
    return types;
  }

  /**
   * Displays maps based on the current filter.
   */
  private applyFilter(): void {
    const regex: RegExp | undefined = this.getSearchedRegex();
    const types: MapType[] = this.getTypes();

    this.maps.forEach((map: MapSchema) => {
      const matchedType: boolean = types.includes(map.type);
      const matchedName: boolean = regex === undefined ||
        map.name.toLowerCase().search(regex) !== -1;
      map.optionElement.style.display = matchedType && matchedName ? "block" : "none";
    });
  }

  /**
   * Adds a scaffold and loads all the maps internally.
   */
  addScaffold(scaffold: ScaffoldCommunicator): void {
    this.scaffold = scaffold;
  }

  /**
   * Removes and reloads the maps displayed in the client.
   * (Can only be called after the scaffold is added)
   */
  refresh(): void {
    while (this.mapsDiv.firstChild) {
      this.mapsDiv.removeChild(this.mapsDiv.firstChild);
    }
    this.scaffold.getMaps(this.cb);
  }

  /**
   * @return the selected maps
   */
  getMaps(): string[] {
    const maps: string[] = new Array();
    this.maps.forEach((map: MapSchema) => {
      if (map.optionElement.selected) {
        maps.push(map.name);
      }
    });
    return maps;
  }
}
