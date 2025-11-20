import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import {
  Alert,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import AddBoxIcon from "@mui/icons-material/AddBox";
import EditIcon from "@mui/icons-material/Edit";
import hazmo from "./assets/hazmo.png";

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
      <Grid
        container
        sx={{
          minHeight: "100vh",
          backgroundImage: `url(${hazmo})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "300px",
          backgroundPosition: "bottom right",
          p: 2,
        }}
      >
        <Grid container spacing={2}>
          {suppliers?.map((supplier) => (
            <Grid
              sx={{
                display: "flex",
                justifyContent: "center",
              }}
              size={12}
            >
              <Card raised>
                <CardContent>
                  <TableContainer>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell align="center" colSpan={6}>
                            <Typography variant="h6">
                              {supplier.name}
                            </Typography>
                            <ButtonGroup>
                              <Tooltip arrow title="Add product">
                                <IconButton
                                  aria-label="add"
                                  onClick={() => {
                                    setOpen(true);
                                    setSelectedSupplier(supplier);
                                  }}
                                >
                                  <AddBoxIcon></AddBoxIcon>
                                </IconButton>
                              </Tooltip>
                              <Tooltip arrow title="Edit products">
                                <IconButton aria-label="edit">
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                            </ButtonGroup>
                          </TableCell>
                        </TableRow>
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
            </Grid>
          ))}
        </Grid>
      </Grid>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>{selectedSupplier?.name}</DialogTitle>
        <DialogContent>
          <DialogActions>
            <form onSubmit={handleSubmit} id="add-product-form">
              <FormControl fullWidth margin="dense">
                <InputLabel>Product</InputLabel>
                <OutlinedInput
                  required
                  name="product"
                  label="Product"
                  autoFocus
                />
              </FormControl>
              <FormControl fullWidth margin="dense">
                <InputLabel>Dose</InputLabel>
                <OutlinedInput
                  endAdornment={
                    <InputAdornment position="end">mL</InputAdornment>
                  }
                  name="dose"
                  label="Dose"
                  type="number"
                />
              </FormControl>
              <FormControl fullWidth margin="dense">
                <InputLabel>Quantity</InputLabel>
                <OutlinedInput
                  required
                  name="quantity"
                  label="Quantity"
                  type="number"
                />
              </FormControl>
              <FormControl fullWidth margin="dense">
                <InputLabel shrink>Expiration</InputLabel>
                <OutlinedInput
                  required
                  name="expiration"
                  label="Expiration"
                  type="date"
                />
              </FormControl>
              <FormControl fullWidth margin="dense">
                <InputLabel>Cost</InputLabel>
                <OutlinedInput
                  required
                  type="number"
                  name="cost"
                  label="Cost"
                />
              </FormControl>
              <FormControl fullWidth margin="dense">
                <InputLabel>Retail</InputLabel>
                <OutlinedInput
                  required
                  type="number"
                  name="retail"
                  label="Retail"
                />
              </FormControl>
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
