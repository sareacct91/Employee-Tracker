import inquirer from "inquirer";
import { mainMenu } from "./prompts.js";
import db from "../db/connectDB.js";

export class Cli {
  async run() {
    const { userInput } = await inquirer.prompt(mainMenu);
    console.log(`userInput: ${userInput}`);

    switch (userInput) {
      case "View All Departments":
        const sql = `SELECT * FROM department;`;

        const [rows, fields] = await db.query(sql);
        console.log(rows);
        break;
    }

    if (userInput !== 'Quit') {
      return this.run();
    } else {
      db.end();
      return;
    }
  }

  renderTable() {

  }

}