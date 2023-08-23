const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
const isValid = require("date-fns/isValid");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

// Return ResponseObj
const dbObjToResponseObj = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    category: dbObject.category,
    priority: dbObject.priority,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  };
};

// All Scenarios of API:1
// 1. Status
const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};
// 2.priority
const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
//3. priority&status
const hasPriorityStatusProperty = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
//4.search_q
const hasSearchProperty = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};
//5. category&status
const hasCategoryStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};
// 6.category
const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};
// 7.category&priority
const hasCategoryPriority = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

// API: 1
app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodoQuery = "";
  const { search_q = "", status, priority, category } = request.query;
  //console.log(status);

  switch (true) {
    // Scenario 1
    case hasStatusProperty(request.query):
      // TO DO, IN PROGRESS, and DONE.
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodoQuery = `SELECT * FROM todo 
                                WHERE status = "${status}";`;
        data = await db.all(getTodoQuery);
        response.send(data.map((eachObj) => dbObjToResponseObj(eachObj)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    // Scenario 2
    case hasPriorityProperty(request.query):
      //HIGH, MEDIUM, and LOW.
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodoQuery = `SELECT * FROM todo WHERE priority = "${priority}";`;
        data = await db.all(getTodoQuery);
        response.send(data.map((eachObj) => dbObjToResponseObj(eachObj)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    // Scenario 3
    case hasPriorityStatusProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodoQuery = `SELECT * FROM todo WHERE priority = "${priority}" AND
                  status = "${status}";`;
          data = await db.all(getTodoQuery);
          response.send(data.map((eachObj) => dbObjToResponseObj(eachObj)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    // Scenario 4
    case hasSearchProperty(request.query):
      getTodoQuery = `SELECT * FROM todo WHERE todo LIKE "%${search_q}%";`;
      data = await db.all(getTodoQuery);
      response.send(data.map((eachObj) => dbObjToResponseObj(eachObj)));

      break;

    // Scenario 5
    case hasCategoryStatus(request.query):
      // WORK, HOME, and LEARNING.
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        // TO DO, IN PROGRESS, and DONE.
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodoQuery = `SELECT * FROM todo WHERE category = "${category}" AND
                  status = "${status}";`;
          data = await db.all(getTodoQuery);
          response.send(data.map((eachObj) => dbObjToResponseObj(eachObj)));
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    // Scenario 6
    case hasCategoryProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodoQuery = `SELECT * FROM todo WHERE category = "${category}";`;
        data = await db.all(getTodoQuery);
        response.send(data.map((eachObj) => dbObjToResponseObj(eachObj)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

      break;
    //Scenario 7
    case hasCategoryPriority(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          getTodoQuery = `SELECT * FROM todo WHERE category = "${category}" AND
                priority = "${priority}"
                ;`;
          data = await db.all(getTodoQuery);
          response.send(data.map((eachObj) => dbObjToResponseObj(eachObj)));
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    default:
      getTodoQuery = `SELECT * FROM todo;`;
      data = await db.all(getTodoQuery);
      response.send(data.map((eachObj) => dbObjToResponseObj(eachObj)));

      break;
  }
});

// API 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const todoList = await db.get(getTodoQuery);
  response.send({
    id: todoList.id,
    todo: todoList.todo,
    category: todoList.category,
    priority: todoList.priority,
    status: todoList.status,
    dueDate: todoList.due_date,
  });
});

// API 3
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  //console.log(isMatch(date, "yyyy-MM-dd"));
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    //console.log(newDate);
    const dueDateQuery = `SELECT * FROM todo WHERE due_date = "${newDate}";`;
    const todoList = await db.all(dueDateQuery);
    response.send(todoList.map((eachObj) => dbObjToResponseObj(eachObj)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

// API 4
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
    if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const postNewDate = format(new Date(dueDate), "yyyy-MM-dd");
          const postTodoQuery = `INSERT INTO todo 
                                (id,todo,priority,status,category,due_date)

                                VALUES (
                                    ${id},
                                    "${todo}",
                                    "${priority}",
                                    "${status}",
                                    "${category}",
                                    "${postNewDate}"
                                );`;
          await db.run(postTodoQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Status");
  }
});

// API 5
app.put("/todos/:todoId/", async (request, response) => {
  let putTodoQuery = "";
  const { todoId } = request.params;
  const todoDetails = request.body;
  const { status, priority, todo, category, dueDate } = todoDetails;

  switch (true) {
    case todoDetails.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        putTodoQuery = `UPDATE todo
                                SET 
                                  status = "${status}"
                                  WHERE id = ${todoId};`;
        await db.run(putTodoQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }

      break;
    case todoDetails.priority !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        putTodoQuery = `UPDATE todo
                                SET 
                                    priority = "${priority}"
                                    WHERE id = ${todoId};`;
        await db.run(putTodoQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case todoDetails.todo !== undefined:
      putTodoQuery = `UPDATE todo
                                SET 
                                    todo = "${todo}"
                                    WHERE id = ${todoId};`;
      await db.run(putTodoQuery);
      response.send("Todo Updated");
      break;
    case todoDetails.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        putTodoQuery = `UPDATE todo
                                SET 
                                    category = "${category}"
                                    WHERE id = ${todoId};`;
        await db.run(putTodoQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case todoDetails.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
        putTodoQuery = `UPDATE todo
                                SET 
                                    due_date = "${newDueDate}"
                                    WHERE id = ${todoId};`;
        await db.run(putTodoQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }
});
// API 6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `DELETE FROM todo
                        WHERE id = ${todoId};`;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
