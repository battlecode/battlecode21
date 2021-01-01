// import * as cst from '../../constants';

// import {schema} from 'battlecode-playback';
// import Victor = require('victor');

// import {UnitForm, MapUnit} from '../index';

// export default class TreeForm implements UnitForm {

//   // The public div
//   readonly div: HTMLDivElement;

//   // Neutral tree settings
//   readonly id: HTMLLabelElement;
//   readonly x: HTMLInputElement;
//   readonly y: HTMLInputElement;
//   readonly radius: HTMLInputElement;
//   readonly bullets: HTMLInputElement;
//   readonly body: HTMLSelectElement;

//   // Callbacks on input change
//   readonly width: () => number;
//   readonly height: () => number;
//   readonly maxRadius: (x: number, y: number, ignoreID?: number) => number;

//   // Constants
//   private readonly TREE_TYPES = [
//     cst.NONE, cst.ARCHON, cst.GARDENER, cst.LUMBERJACK, cst.SOLDIER, cst.TANK, cst.SCOUT
//   ];
//   private readonly DEFAULT_TREE_RADIUS: string = "2";

//   constructor(width: () => number, height: () => number,
//     maxRadius: (x: number, y: number, ignoreID?: number) => number) {

//     // Store the callbacks
//     this.width = width;
//     this.height = height;
//     this.maxRadius = maxRadius;

//     // Create HTML elements
//     this.div = document.createElement("div");
//     this.id = document.createElement("label");
//     this.x = document.createElement("input");
//     this.y = document.createElement("input");
//     this.radius = document.createElement("input");
//     this.bullets = document.createElement("input");
//     this.body = document.createElement("select");

//     // Create the form
//     this.loadInputs();
//     this.div.appendChild(this.createForm());
//     this.loadCallbacks();
//   }

//   /**
//    * Initializes input fields.
//    */
//   private loadInputs(): void {
//     this.x.type = "text";
//     this.y.type = "text";
//     this.radius.type = "text";
//     this.radius.value = this.DEFAULT_TREE_RADIUS;
//     this.bullets.type = "text";
//     this.bullets.value = "0";
//     this.TREE_TYPES.forEach((type: schema.BodyType) => {
//       const option = document.createElement("option");
//       option.value = String(type);
//       option.appendChild(document.createTextNode(cst.bodyTypeToString(type)));
//       this.body.appendChild(option);
//     });
//   }

//   /**
//    * Creates the HTML form that collects tree information.
//    */
//   private createForm(): HTMLFormElement {
//     // HTML structure
//     const form: HTMLFormElement = document.createElement("form");
//     const id: HTMLDivElement = document.createElement("div");
//     const x: HTMLDivElement = document.createElement("div");
//     const y: HTMLDivElement = document.createElement("div");
//     const radius: HTMLDivElement = document.createElement("div");
//     const bullets: HTMLDivElement = document.createElement("div");
//     const body: HTMLDivElement = document.createElement("div");
//     form.appendChild(id);
//     form.appendChild(x);
//     form.appendChild(y);
//     form.appendChild(radius);
//     form.appendChild(bullets);
//     form.appendChild(body);
//     form.appendChild(document.createElement("br"));

//     // Tree ID
//     id.appendChild(document.createTextNode("ID:"));
//     id.appendChild(this.id);

//     // X coordinate
//     x.appendChild(document.createTextNode("X:"));
//     x.appendChild(this.x);

//     // Y coordinate
//     y.appendChild(document.createTextNode("Y:"));
//     y.appendChild(this.y);

//     // Radius
//     radius.appendChild(document.createTextNode("Radius:"));
//     radius.appendChild(this.radius);

//     // Bullets
//     bullets.appendChild(document.createTextNode("Bullets:"));
//     bullets.appendChild(this.bullets);

//     // Tree body
//     body.appendChild(document.createTextNode("Body:"));
//     body.appendChild(this.body);

//     return form;
//   }

//   /**
//    * Add callbacks to the form elements.
//    */
//   private loadCallbacks(): void {

//     // X must be in the range [0, this.width]
//     this.x.onchange = () => {
//       let value: number = this.getX();
//       value = Math.max(value, 0);
//       value = Math.min(value, this.width());
//       this.x.value = isNaN(value) ? "" : String(value);
//       this.updateRadius();
//     };

//     // Y must be in the range [0, this.height]
//     this.y.onchange = () => {
//       let value: number = this.getY();
//       value = Math.max(value, 0);
//       value = Math.min(value, this.height());
//       this.y.value = isNaN(value) ? "" : String(value);
//       this.updateRadius();
//     };

//     // Tree of this radius must not overlap with other units
//     this.radius.onchange = () => {
//       this.updateRadius();
//     };

//     // Bullets must be a number >= 0
//     this.bullets.onchange = () => {
//       let value: number = this.getBullets();
//       value = Math.max(value, 0);
//       this.bullets.value = isNaN(value) ? "0" : String(value);
//     };
//   }

//   /**
//    * Updates the radius to reflect a valid radius for the given coordinates.
//    */
//   private updateRadius(): void {
//     const id = this.getID();
//     const x = this.getX();
//     const y = this.getY();
//     const radius = this.getRadius();

//     // If either x or y is blank, the radius must be between cst.MIN_TREE_RADIUS
//     // and cst.MAX_TREE_RADIUS
//     if (isNaN(x) || isNaN(y)) {
//       this.radius.value = String(
//         Math.max(Math.min(cst.MAX_TREE_RADIUS, radius), cst.MIN_TREE_RADIUS)
//       );
//       return;
//     }

//     // Otherwise, the radius is 0 if invalid, the maximum valid radius if
//     // previously invalid, or the minimum of the current radius and the maximum
//     // valid radius otheriwse
//     const maxRadius = Math.min(this.maxRadius(x, y, id), cst.MAX_TREE_RADIUS);
//     if (maxRadius < cst.MIN_TREE_RADIUS) {
//       this.radius.value = "0";
//     } else if (isNaN(radius) || radius === 0) {
//       this.radius.value = String(maxRadius);
//     } else {
//       this.radius.value = String(Math.min(maxRadius, radius));
//     }
//   }

//   private getX(): number {
//     return parseFloat(this.x.value);
//   }

//   private getY(): number {
//     return parseFloat(this.y.value);
//   }

//   private getRadius(): number {
//     return parseFloat(this.radius.value);
//   }

//   private getBullets(): number {
//     return parseFloat(this.bullets.value);
//   }

//   private getBody(): schema.BodyType {
//     return parseInt(this.body.options[this.body.selectedIndex].value);
//   }

//   getID(): number | undefined {
//     const id = parseInt(this.id.textContent || "NaN");
//     return isNaN(id) ? undefined : id;
//   }

//   resetForm(): void {
//     this.x.value = "";
//     this.y.value = "";
//   }

//   setForm(loc: Victor, unit?: MapUnit, id?: number): void {

//     this.x.value = String(loc.x);
//     this.y.value = String(loc.y);

//     if (unit && id) {
//       this.id.textContent = String(id);
//       this.radius.value = String(unit.radius);
//       this.bullets.value = String(unit.containedBullets);
//       this.body.value = String(unit.containedBody);
//     } else {
//       this.id.textContent = "";
//       this.updateRadius();
//     }
//   }

//   isValid(): boolean {
//     const x = this.getX();
//     const y = this.getY();
//     const radius = this.getRadius();
//     const bullets = this.getBullets();

//     return !(isNaN(x) || isNaN(y) || isNaN(radius) || isNaN(bullets) || radius === 0);
//   }

//   getUnit(): MapUnit | undefined {
//     if (!this.isValid()) {
//       return undefined;
//     }

//     return {
//       loc: new Victor(this.getX(), this.getY()),
//       radius: this.getRadius(),
//       type: cst.TREE_NEUTRAL,
//       containedBullets: this.getBullets(),
//       containedBody: this.getBody(),
//       teamID: 0
//     }
//   }
// }