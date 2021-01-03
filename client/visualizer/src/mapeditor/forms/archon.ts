// import * as cst from '../../constants';

// import Victor = require('victor');

// import {UnitForm, MapUnit} from '../index';

// export default class ArchonForm implements UnitForm {

//   // The public div
//   readonly div: HTMLDivElement;

//   // Form elements for archon settings
//   readonly id: HTMLLabelElement;
//   readonly x: HTMLInputElement;
//   readonly y: HTMLInputElement;
//   readonly radius: HTMLInputElement;

//   // Callbacks on input change
//   readonly width: () => number;
//   readonly height: () => number;
//   readonly maxRadius: (x: number, y: number, ignoreID?: number) => number;

//   // Constant
//   private readonly ARCHON_RADIUS: number = cst.radiusFromBodyType(cst.ARCHON);

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
//     this.radius.disabled = true;
//     this.radius.value = String(cst.radiusFromBodyType(cst.ARCHON));
//   }

//   /**
//    * Creates the HTML form that collects archon information.
//    */
//   private createForm(): HTMLFormElement {
//     // HTML structure
//     const form: HTMLFormElement = document.createElement("form");
//     const id: HTMLDivElement = document.createElement("div");
//     const x: HTMLDivElement = document.createElement("div");
//     const y: HTMLDivElement = document.createElement("div");
//     const radius: HTMLDivElement = document.createElement("div");
//     form.appendChild(id);
//     form.appendChild(x);
//     form.appendChild(y);
//     form.appendChild(radius);
//     form.appendChild(document.createElement("br"));

//     // Archon ID
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
//   }

//   /**
//    * Updates the radius to reflect a valid radius for the given coordinates.
//    */
//   private updateRadius(): void {
//     const id = this.getID();
//     const x = this.getX();
//     const y = this.getY();

//     // If either x or y is blank, default to the archon radius
//     if (isNaN(x) || isNaN(y)) {
//       this.radius.value = String(this.ARCHON_RADIUS);
//     }

//     // Otherwise, the radius is 0 if invalid, or the radius of an archon
//     const maxRadius = this.maxRadius(x, y, id);
//     if (maxRadius < this.ARCHON_RADIUS) {
//       this.radius.value = "0";
//     } else {
//       this.radius.value = String(this.ARCHON_RADIUS);
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

//   getID(): number | undefined {
//     const id = parseInt(this.id.textContent || "NaN");
//     return isNaN(id) ? undefined : id;
//   }

//   resetForm(): void {
//     this.x.value = "";
//     this.y.value = "";
//     this.radius.value = String(this.ARCHON_RADIUS);
//   }

//   setForm(loc: Victor, body?: MapUnit, id?: number): void {
//     this.x.value = String(loc.x);
//     this.y.value = String(loc.y);
//     this.id.textContent = id === undefined ? "" : String(id);
//     this.updateRadius();
//   }

//   isValid(): boolean {
//     const x = this.getX();
//     const y = this.getY();
//     const radius = this.getRadius();

//     return !(isNaN(x) || isNaN(y) || isNaN(radius) || radius === 0);
//   }

//   getUnit(teamID?): MapUnit | undefined {
//     if (!this.isValid()) {
//       return undefined;
//     }

//     return {
//       loc: new Victor(this.getX(), this.getY()),
//       radius: this.getRadius(),
//       type: cst.ARCHON,
//       containedBullets: 0,
//       containedBody: cst.NONE,
//       teamID: teamID || 1
//     }
//   }
// }
