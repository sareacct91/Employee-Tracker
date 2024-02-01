import inquirer from "inquirer";
import Table from "cli-table3";

import db from "../config/connection.js";

export class Cli {

  #questions = {
    mainMenu: [
      {
        type: "list",
        name: "userInput",
        message: "What would you like to do?",
        choices: [
          "View All Departments",
          "View All Roles",
          "View All Employees",
          "View Employees by Department",
          "View Employees by Manager",
          "View Total Utilized Budget",
          "Add Department",
          "Add Role",
          "Add Employee",
          "Update Employee Role",
          "Update Employee Managers",
          "DELETE Departments",
          "DELETE Roles",
          "DELETE Employees",
          "Quit"
        ]
      }
    ],
    addDept: [
      {
        type: "input",
        name: "deptName",
        message: "What is the name of the department?",
        validate: (input) => {
          if (!input || input.length === 0) {
            return false;
          }
          return true;
        }
      }
    ],
    addRole: [
      {
        type: "input",
        name: "role",
        message: "What is the name of the role?",
        validate: (input) => {
          if (!input || input.length === 0) {
            return false;
          }
          return true;
        }
      },
      {
        type: "number",
        name: "salary",
        message: "What is the salary of the role?",
      },
      {
        type: "list",
        name: "roleDept",
        message: "Which department does the role belong to?",
        choices: []
      },
    ],
    addEmp: [
      {
        type: "input",
        name: "firstName",
        messagee: "What is the employee's first name?",
        validate: (input) => {
          if (!input || input.length === 0) {
            return 'Please provide a first name';
          }
          return true;
        }
      },
      {
        type: "input",
        name: "lastName",
        message: "What is the employee's last name?",
        validate: (input) => {
          if (!input || input.length === 0) {
            return 'Please provide a last name';
          }
          return true;
        }
      },
      {
        type: "list",
        name: "role",
        message: "What is the employee's role?",
        choices: []
      },
      {
        type: "list",
        name: "manager",
        message: "Who is the employee's manager?",
        choices: []
      },
    ],
    updateEmp: [
      {
        type: "list",
        name: "employee",
        message: "Which employee's role do you want to update?",
        choices: []
      },
      {
        type: "list",
        name: "role",
        message: "Which role do you want to assign the selected employee?",
        choices: []
      },
    ],
    selectDept: [{
      type: "list",
      name: "dept",
      message: "Select the department",
      choices: []
    }],
    selectEmp: [{
      type: "list",
      name: "employee",
      message: "Select the employee",
      choices: []
    }],
    selectRole: [{
      type: "list",
      name: "role",
      message: "Select the role",
      choices: []
    }],
  };

  #deptQ = {
    viewAll: `SELECT * FROM department;`,
    viewName: `SELECT name FROM department`,
    add: `INSERT INTO department(name) VALUES (?)`,
    delete: `DELETE FROM department WHERE name = ?`
  };

  #roleQ = {
    viewAll: `
      SELECT
        r.id, r.title, d.name AS department, salary
      FROM
        role as r
      JOIN
        department as d
        ON r.department_id = d.id;`,
    add: `INSERT INTO role(title, salary, department_id) VALUES (?, ?, ?)`,
    viewRoles: `SELECT id, title FROM role`,
    delete: `DELETE FROM role WHERE title = ?`,
  };

  #empQ = {
    viewAll: `
      SELECT
        e.id, e.first_name, e.last_name, r.title, d.name AS department, r.salary, CONCAT(m.first_name, " ", m.last_name) AS manager
      FROM
        employee AS e
      LEFT JOIN
        role AS r ON e.role_id = r.id
      LEFT JOIN
        department AS d ON r.department_id = d.id
      LEFT JOIN
        employee AS m ON e.manager_id = m.id
      ORDER BY
        e.id;`,
    viewEmployees: `
      SELECT id, CONCAT(first_name, " ", last_name) as name
      FROM employee`,
    viewManagers: `
      SELECT DISTINCT CONCAT(m.first_name, " ", m.last_name) AS name
      FROM employee as e
      JOIN employee as m ON e.manager_id = m.id;`,
    viewBudget: `
      SELECT sum(r.salary) as Total
      FROM employee AS e
      JOIN role AS r ON e.role_id = r.id
      JOIN department AS d ON r.department_id = d.id
      WHERE d.name = ?`,
    add: `
      INSERT INTO employee(first_name, last_name, role_id, manager_id)
        VALUES (?, ?, ?, ?)`,
    updateRole: `UPDATE employee SET role_id = ? WHERE id = ?`,
    updateManager: `UPDATE employee SET manager_id = ? WHERE id = ?`,
    delete: `DELETE FROM employee WHERE id = ?`,


  };


  async run() {
    const { userInput } = await inquirer.prompt(this.#questions.mainMenu);

    switch (userInput) {
      case "View All Departments": {
        const results = await this.#sqlQuery(this.#deptQ.viewAll);
        this.#renderTable(results);
        break;
      }

      case "View All Roles": {
        const results = await this.#sqlQuery(this.#roleQ.viewAll);
        this.#renderTable(results);
        break;
      }

      case "View All Employees":{
        const results = await this.#sqlQuery(this.#empQ.viewAll);
        this.#renderTable(results);
        break;
      }

      case "View Employees by Department": {
        const p1 = this.#sqlQuery(this.#deptQ.viewName);
        const p2 = this.#sqlQuery(this.#empQ.viewAll);
        const [depts, allEmp] = await Promise.all([p1, p2]);

        this.#questions.selectDept[0].choices = depts;
        const { dept } = await inquirer.prompt(this.#questions.selectDept);

        const results = allEmp.filter((e) => e.department === dept);
        results.length !== 0 ? this.#renderTable(results) : console.log(`\n No employee in ${dept} department\n`);
        break;
      }

      case "View Employees by Manager": {
        const p1 = this.#sqlQuery(this.#empQ.viewAll);
        const p2 = this.#sqlQuery(this.#empQ.viewManagers);
        const [allEmp, managers] = await Promise.all([p1, p2]);

        const { manager } = await inquirer.prompt([{
          type: "list",
          name: "manager",
          message: "Select the manager",
          choices: managers
        }]);

        const results = allEmp.filter((e) => e.manager === manager);
        this.#renderTable(results);
        break;
      }

      case "View Total Utilized Budget": {
        const depts = await this.#sqlQuery(this.#deptQ.viewName);

        this.#questions.selectDept[0].choices = depts;
        const { dept } = await inquirer.prompt(this.#questions.selectDept);

        const results = await this.#sqlQuery(this.#empQ.viewBudget, [dept]);

        if (results) {
          console.log(`\nThe combined salaries of all employees in ${dept} department is $${results[0].Total}\n`);
        }
        break;
      }

      case "Add Department":{
        const { deptName } = await inquirer.prompt(this.#questions.addDept);
        const results = await this.#sqlQuery(this.#deptQ.add, deptName);
        if (results) {
          console.log(`\nAdded ${deptName} to the database\n`);
        }
        break;
      }

      case "Add Role":{
        const tmpDept = await this.#sqlQuery(this.#deptQ.viewAll);
        this.#questions.addRole[2].choices = tmpDept.map((e) => e.name);

        const { role, salary, roleDept } = await inquirer.prompt(this.#questions.addRole);
        const deptId = tmpDept.find((e) => e.name === roleDept).id;

        const results = await this.#sqlQuery(this.#roleQ.add, [role, salary, deptId]);

        if (results) {
          console.log(`\nAdded ${role} to the database\n`);
        }
        break;
      }

      case "Add Employee": {
        let p1 = this.#sqlQuery(this.#roleQ.viewRoles);
        let p2 = this.#sqlQuery(this.#empQ.viewEmployees);
        const [tmpRole, tmpEmp] = await Promise.all([p1, p2]);

        this.#questions.addEmp[2].choices = tmpRole.map((e) => e.title);
        this.#questions.addEmp[3].choices = tmpEmp.map((e) => e.name);

        const { firstName, lastName, role, manager } = await inquirer.prompt(this.#questions.addEmp);

        const roleId = tmpRole.find((e) => e.title === role).id;
        const managerId = tmpEmp.find((e) => e.name === manager).id;

        const results = await this.#sqlQuery(this.#empQ.add, [firstName, lastName, roleId, managerId]);

        if (results) {
          console.log(`\nAdded ${firstName} ${lastName} to the database\n`);
        }
        break;
      }

      case "Update Employee Role": {
        let p1 = this.#sqlQuery(this.#roleQ.viewRoles);
        let p2 = this.#sqlQuery(this.#empQ.viewEmployees);
        const [tmpRole, tmpEmp] = await Promise.all([p1, p2]);

        this.#questions.updateEmp[0].choices = tmpEmp.map((e) => e.name);
        this.#questions.updateEmp[1].choices = tmpRole.map((e) => e.title);

        const { employee, role } = await inquirer.prompt(this.#questions.updateEmp);

        const roleId = tmpRole.find((e) => e.title === role).id;
        const empId = tmpEmp.find((e) => e.name === employee).id;

        const results = await this.#sqlQuery(this.#empQ.updateRole, [roleId, empId]);

        if (results) {
          console.log(`\nUpdated ${employee}'s roleto ${role}\n`);
        }
        break;
      }

      case "Update Employee Managers":{
        const tmpEmp = await this.#sqlQuery(this.#empQ.viewEmployees);
        const names = tmpEmp.map((e) => e.name);

        const { employee } = await inquirer.prompt([{
          type: "list",
          name: "employee",
          message: "Which employee do you want to update?",
          choices: names
        }]);

        const { manager } = await inquirer.prompt([{
          type: "list",
          name: "manager",
          message: `Select the new manager for ${employee}`,
          choices: names.filter((e) => e !== employee)
        }]);

        const mgrId = tmpEmp.find((e) => e.name === manager).id;
        const empId = tmpEmp.find((e) => e.name === employee).id;
        const results = this.#sqlQuery(this.#empQ.updateManager, [mgrId, empId]);

        if (results) {
          console.log(`\nUpdated ${employee}'s manager to ${manager}\n`);
        }
        break;
      }

      case "DELETE Departments": {
        const depts = await this.#sqlQuery(this.#deptQ.viewName);
        this.#questions.selectDept[0].choices = depts;

        const { dept } = await inquirer.prompt(this.#questions.selectDept);

        const results = await this.#sqlQuery(this.#deptQ.delete, [dept]);

        if (results) {
          console.log(`\nDepartment: ${dept} has been deleted from the database\n`);
        }
        break;
      }

      case "DELETE Roles": {
        const roles = await this.#sqlQuery(this.#roleQ.viewRoles);
        this.#questions.selectRole[0].choices = roles.map((e) => e.title);

        const { role } = await inquirer.prompt(this.#questions.selectRole);

        const results = await this.#sqlQuery(this.#roleQ.delete, role);

        if (results) {
          console.log(`\nRole: ${role} has been deleted from the database\n`);
        }
        break;
      }

      case "DELETE Employees":{
        const emp = await this.#sqlQuery(this.#empQ.viewEmployees);
        this.#questions.selectEmp[0].choices = emp.map((e) => e.name)

        const { employee } = await inquirer.prompt(this.#questions.selectEmp);
        const empId = emp.find((e) => e.name === employee).id;

        const results = await this.#sqlQuery(this.#empQ.delete, [empId]);

        if (results) {
          console.log(`\nEmployee: ${employee} has been deleted from the database\n`);
        }
        break;
      }
    }

    if (userInput !== 'Quit') {
      return this.run();

    } else {
      db.end();
      return process.exit(0);
    }
  };

  async #sqlQuery(sql, v) {
    // console.log(sql, v);

    try {
      const [rows] = await db.query(sql, v);
      return rows

    } catch (error) {
      console.log('sql query error\n', error);
      return null;
    }
  };

  async #renderTable(results) {
    const table = new Table({
      head: Object.keys(results[0])
    });

    for (const row of results) {
      table.push(Object.values(row));
    }

    console.log(table.toString());
  };
};