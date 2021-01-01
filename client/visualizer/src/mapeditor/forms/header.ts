import * as cst from '../../constants';

export default class HeaderForm {

  // The public div
  readonly div: HTMLDivElement;

  // HTML elements
  private readonly name: HTMLInputElement;
  private readonly width: HTMLInputElement;
  private readonly height: HTMLInputElement;

  // Callback on input change to reset canvas dimensions
  private readonly cb: () => void;

  // Constants
  private readonly DEFAULT_DIM: string = "50";

  constructor(cb: () => void) {

    // Store the callback
    this.cb = cb;

    // Create HTML elements
    this.div = document.createElement("div");
    this.name =  document.createElement("input");
    this.width = document.createElement("input");
    this.height = document.createElement("input");

    // Create the form
    this.loadInputs();
    this.div.appendChild(this.createForm());
    this.loadCallbacks();
  }

  /**
   * Initializes input fields
   */
  private loadInputs(): void {
    this.name.type = "text";
    this.name.value = "DefaultMap";
    this.name.maxLength = 50;

    this.width.type = "text";
    this.width.value = this.DEFAULT_DIM;

    this.height.type = "text";
    this.height.value = this.DEFAULT_DIM;
  }

  /**
   * Creates the form that collects match header information: name, width, height.
   */
  private createForm(): HTMLFormElement {
    // HTML structure
    const form: HTMLFormElement = document.createElement("form");
    const name: HTMLDivElement = document.createElement("div");
    const width: HTMLDivElement = document.createElement("div");
    const height: HTMLDivElement = document.createElement("div");
    form.appendChild(name);
    form.appendChild(width);
    form.appendChild(height);

    // Map name
    let nameLabel = document.createElement("label");
    nameLabel.innerHTML = "Map name: ";
    name.appendChild(nameLabel);
    name.appendChild(this.name);

    // Map width
    let widthLabel = document.createElement("label");
    widthLabel.innerHTML = "Width: ";
    width.appendChild(widthLabel);
    width.appendChild(this.width);

    // Map height
    let heightLabel = document.createElement("label");
    heightLabel.innerHTML = "Height: ";
    height.appendChild(heightLabel);
    height.appendChild(this.height);

    form.appendChild(document.createElement("br"));
    return form;
  }

  /**
   * Add callbacks to the form elements.
   */
  private loadCallbacks(): void {
    this.width.onchange = () => {
      // Input validation
      let value: number = this.getWidth();
      value = Math.max(value, cst.MIN_DIMENSION);
      value = Math.min(value, cst.MAX_DIMENSION);
      this.width.value = isNaN(value) ? this.DEFAULT_DIM : String(value);

      // Redraw the canvas
      this.cb();
      
      // Trigger a resize event for the splash screen
      window.dispatchEvent(new Event('resize'));
      
    };

    this.height.onchange = () => {
      // Input validation
      let value: number = this.getHeight();
      value = Math.max(value, cst.MIN_DIMENSION);
      value = Math.min(value, cst.MAX_DIMENSION);
      this.height.value = isNaN(value) ? this.DEFAULT_DIM : String(value);

      // Redraw the canvas
      this.cb();
      
      // Trigger a resize event for the splash screen
      window.dispatchEvent(new Event('resize'));
      
    };
  }

  getName(): string {
    return this.name.value;
  }

  getWidth(): number {
    return parseFloat(this.width.value);
  }

  getHeight(): number {
    return parseFloat(this.height.value);
  }
}