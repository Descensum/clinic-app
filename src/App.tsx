import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import {
  Card,
  CardContent,
  CardHeader,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

const client = generateClient<Schema>();

function createData(
  product: string,
  amount: number,
  cost: number,
  sold: number
) {
  return { product, amount, cost, sold };
}

const rows = [
  createData("Product A", 100, 29.99, 50),
  createData("Product B", 200, 19.99, 150),
  createData("Product C", 150, 39.99, 75),
];

function App() {
  const [suppliers, setSuppliers] = useState<Array<Schema["supplier"]["type"]>>(
    []
  );

  // useEffect(() => {
  //   client.models.Todo.observeQuery().subscribe({
  //     next: (data) => setTodos([...data.items]),
  //   });
  // }, []);

  // function createTodo() {
  //   client.models.Todo.create({ content: window.prompt("Todo content") });
  // }

  // function deleteTodo(id: string) {
  //   client.models.Todo.delete({ id });
  // }

  useEffect(() => {
    client.models.supplier.list().then((result) => {
      setSuppliers(result.data ?? []);
    });
  }, []);

  return (
    <>
      <Grid container spacing={4}>
        <Card>
          <CardHeader title="Manufacturer 1"></CardHeader>
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Cost</TableCell>
                    <TableCell># Sold</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.product}>
                      <TableCell>{row.product}</TableCell>
                      <TableCell>{row.amount}</TableCell>
                      <TableCell>{row.cost}</TableCell>
                      <TableCell>{row.sold}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="Manufacturer 2"></CardHeader>
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Cost</TableCell>
                    <TableCell># Sold</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.product}>
                      <TableCell>{row.product}</TableCell>
                      <TableCell>{row.amount}</TableCell>
                      <TableCell>{row.cost}</TableCell>
                      <TableCell>{row.sold}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="Manufacturer 3"></CardHeader>
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Cost</TableCell>
                    <TableCell># Sold</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.product}>
                      <TableCell>{row.product}</TableCell>
                      <TableCell>{row.amount}</TableCell>
                      <TableCell>{row.cost}</TableCell>
                      <TableCell>{row.sold}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
      <div>
        <h2>Suppliers</h2>
        <ul>
          {suppliers.map((supplier) => (
            <li key={supplier.id}>{supplier.name}</li>
          ))}
        </ul>
      </div>
    </>
    // <main>
    //   <h1>My todos</h1>
    //   <button onClick={createTodo}>+ new</button>
    //   <ul>
    //     {todos.map((todo) => (
    //       <li onClick={() => deleteTodo(todo.id)} key={todo.id}>
    //         {todo.content}
    //       </li>
    //     ))}
    //   </ul>
    //   <div>
    //     🥳 App successfully hosted. Try creating a new todo.
    //     <br />
    //     <a href="https://docs.amplify.aws/react/start/quickstart/#make-frontend-updates">
    //       Review next step of this tutorial.
    //     </a>
    //   </div>
    // </main>
  );
}

export default App;
