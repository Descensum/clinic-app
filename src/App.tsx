import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";
import AddBoxIcon from "@mui/icons-material/AddBox";
import EditIcon from "@mui/icons-material/Edit";

const client = generateClient<Schema>();

function App() {
  const [open, setOpen] = useState(false);
  const [suppliers, setSuppliers] = useState<Array<Schema["supplier"]["type"]>>(
    []
  );
  const [selectedSupplier, setSelectedSupplier] = useState<
    Schema["supplier"]["type"] | null
  >(null);
  const [productsBySupplier, setProductsBySupplier] = useState<
    Record<string, Array<Schema["product"]["type"]>>
  >({});

  useEffect(() => {
    client.models.supplier.list().then((result) => {
      const supplierList = result.data ?? [];
      setSuppliers(supplierList);
      supplierList.forEach((supplier) => {
        client.models.product
          .list({ filter: { supplierId: { eq: supplier.id ?? undefined } } })
          .then((prodResult) => {
            setProductsBySupplier((prev) => ({
              ...prev,
              [String(supplier.id)]: prodResult.data ?? [],
            }));
          });
      });
    });
  }, []);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    return client.models.product.create({
      name: formData.get("Product") as string,
      dose: Number(formData.get("Dose")),
      quantity: Number(formData.get("Quantity")),
      cost: Number(formData.get("Cost")),
      retail: Number(formData.get("Retail")),
    });
  }

  return (
    <>
      {suppliers?.map((supplier) => (
        <Card key={supplier.id}>
          <CardHeader title={supplier.name} />
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Cost</TableCell>
                    <TableCell>Retail</TableCell>
                    <TableCell># Sold</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {supplier.id
                    ? productsBySupplier[supplier.id]?.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>{product.name}</TableCell>
                          <TableCell>{product.quantity}</TableCell>
                          <TableCell>{product.cost}</TableCell>
                          <TableCell>{product.retail}</TableCell>
                          <TableCell>{product.numSold}</TableCell>
                          <IconButton aria-label="edit">
                            <EditIcon />
                          </IconButton>
                        </TableRow>
                      ))
                    : null}
                  <IconButton
                    aria-label="add"
                    onClick={() => {
                      setOpen(!open);
                      setSelectedSupplier(supplier);
                    }}
                  >
                    <AddBoxIcon />
                  </IconButton>
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      ))}
      <Dialog open={open} onClose={() => setOpen(!open)}>
        <DialogTitle>
          Add a new product for {selectedSupplier?.name}
        </DialogTitle>
        <DialogContent>
          <DialogActions>
            <form onSubmit={handleSubmit} id="add-product-form">
              <TextField
                autoFocus
                required
                label="Product"
                fullWidth
                variant="standard"
              />
              <TextField autoFocus label="Dose" fullWidth variant="standard" />
              <TextField
                autoFocus
                required
                label="Quantity"
                fullWidth
                variant="standard"
              />
              <TextField
                autoFocus
                required
                label="Cost"
                fullWidth
                variant="standard"
              />
              <TextField
                autoFocus
                required
                label="Retail"
                fullWidth
                variant="standard"
              />
            </form>
            <Button type="submit" form="add-product-form">
              Submit
            </Button>
          </DialogActions>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default App;
