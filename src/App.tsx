import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";
import AddBoxIcon from "@mui/icons-material/AddBox";

const client = generateClient<Schema>();

function App() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const formJson = Object.fromEntries(formData.entries());

    try {
      console.log(formJson);
      const newProduct = await client.models.product.create({
        supplierId: selectedSupplier?.id || "",
        name: formJson.product as string,
        dose: Number(formJson.dose),
        quantity: Number(formJson.quantity),
        expiration: formJson.expiration as string,
        cost: Number(formJson.cost),
        retail: Number(formJson.retail),
      });
      const created = newProduct.data;
      if (!created) {
        console.error("Product creation returned null");
        return;
      }
      setProductsBySupplier((prev) => {
        const key = String(selectedSupplier?.id);
        const existing = prev[key] ?? [];
        return {
          ...prev,
          [key]: [...existing, created],
        };
      });
      setMessage("Product created successfully!");
    } catch (error) {
      console.error("Failed to create product:", error);
      setMessage("Failed to create product.");
    } finally {
      setOpen(false);
    }
  }

  return (
    <>
      <Snackbar
        open={!!message}
        autoHideDuration={3000}
        onClose={() => setMessage("")}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={
            message === "Product created successfully!" ? "success" : "error"
          }
          onClose={() => setMessage("")}
        >
          {message}
        </Alert>
      </Snackbar>
      {suppliers?.map((supplier) => (
        <Card key={supplier.id}>
          <CardHeader
            title={supplier.name}
            action={
              <IconButton
                aria-label="add"
                onClick={() => {
                  setOpen(true);
                  setSelectedSupplier(supplier);
                }}
              >
                <AddBoxIcon />
              </IconButton>
            }
          />
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Expiration</TableCell>
                    <TableCell>Cost</TableCell>
                    <TableCell>Retail</TableCell>
                    <TableCell># Sold</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {supplier.id
                    ? productsBySupplier[supplier.id]?.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            {product.name}
                            {product.dose ? ` (${product.dose}mL)` : ""}
                          </TableCell>
                          <TableCell>{product.quantity}</TableCell>
                          <TableCell>{product.expiration}</TableCell>
                          <TableCell>{product.cost}</TableCell>
                          <TableCell>{product.retail}</TableCell>
                          <TableCell>{product.numSold}</TableCell>
                        </TableRow>
                      ))
                    : null}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      ))}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>
          Add a new product for {selectedSupplier?.name}
        </DialogTitle>
        <DialogContent>
          <DialogActions>
            <form onSubmit={handleSubmit} id="add-product-form">
              <TextField
                autoFocus
                required
                name="product"
                label="Product"
                fullWidth
                variant="standard"
              />
              <TextField
                autoFocus
                type="number"
                name="dose"
                label="Dose"
                fullWidth
                variant="standard"
              />
              <TextField
                autoFocus
                required
                type="number"
                name="quantity"
                label="Quantity"
                fullWidth
                variant="standard"
              />
              <TextField
                autoFocus
                type="date"
                name="expiration"
                label="Expiration"
                fullWidth
                variant="standard"
              />
              <TextField
                autoFocus
                required
                type="number"
                name="cost"
                label="Cost"
                fullWidth
                variant="standard"
              />
              <TextField
                autoFocus
                required
                type="number"
                name="retail"
                label="Retail"
                fullWidth
                variant="standard"
              />
              <Button fullWidth type="submit" form="add-product-form">
                Submit
              </Button>
            </form>
          </DialogActions>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default App;
