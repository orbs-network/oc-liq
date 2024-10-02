import { Bnnc } from './cex/bnnc';

export class CexAgg {
  private bnnc: Bnnc;

  constructor() {
    this.bnnc = new Bnnc();
  }

  // Add methods to interact with the Bnnc instance as needed
  // For example:

  async init() {
    // Initialize the Bnnc instance
    this.bnnc.start();
    // This might involve fetching the initial snapshot and setting up WebSocket connection
  }

  getBook() {
    return this.bnnc.getBook(5);
  }

  // Add more methods as required to manage the Bnnc instance and other potential CEX integrations
}
