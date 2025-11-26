import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import {
  Alert,
  Badge,
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
import DeleteIcon from "@mui/icons-material/Delete";
import hazmo from "./assets/hazmo.png";

const client = generateClient<Schema>();

function App() {
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [message, setMessage] = useState("");
  const [updating, setUpdating] = useState(false);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [suppliers, setSuppliers] = useState<Array<Schema["supplier"]["type"]>>(
    []
  );

  const [selectedSupplier, setSelectedSupplier] = useState<
    Schema["supplier"]["type"] | null
  >(null);

  const [productsBySupplier, setProductsBySupplier] = useState<
    Record<string, Array<Schema["product"]["type"]>>
  >({});

  const handleClick = (
    event: React.MouseEvent<unknown>,
    supplierId: string,
    productId: string
  ) => {
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement
    ) {
      return;
    }

    const currentSelected = selected[supplierId] || [];
    const selectedIndex = currentSelected.indexOf(productId);

    let newSelected: string[] = [];

    if (selectedIndex === -1) {
      newSelected = [...currentSelected, productId];
    } else {
      newSelected = currentSelected.filter((id) => id !== productId);
    }

    setSelected({
      ...selected,
      [supplierId]: newSelected,
    });
  };

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
      if (!created) return;
      setProductsBySupplier((prev) => {
        const key = String(selectedSupplier?.id);
        const existing = prev[key] ?? [];
        return {
          ...prev,
          [key]: [...existing, created],
        };
      });
    } catch (error) {
      console.error("Failed to create product:", error);
      setMessage("Failed to create product.");
    } finally {
      setMessage("Product created successfully!");
      setOpenAddDialog(false);
    }
  }

  async function handleDelete(id: Record<string, string[]>) {
    for (const [supplierId, productIds] of Object.entries(id)) {
      try {
        for (const productId of productIds) {
          await client.models.product.delete({ id: productId });
          setProductsBySupplier((prev) => {
            const updatedProducts = { ...prev };
            updatedProducts[supplierId] = updatedProducts[supplierId].filter(
              (product) => product.id !== productId
            );
            return updatedProducts;
          });
        }
      } catch (error) {
        console.error("Error deleting product", error);
        setMessage("Failed to delete product.");
        return;
      }
    }
    setMessage("Products deleted successfully!");
  }

  async function updateProduct(
    id: string,
    field: keyof Schema["product"]["type"],
    value: number | string
  ) {
    try {
      setUpdating(true);
      const updatedProduct = await client.models.product.update({
        id: id,
        [field]: value,
      });
      const updated = updatedProduct.data;
      if (!updated) return;
      setProductsBySupplier((prev) => {
        const supplierId = String(updated.supplierId);
        const existing = prev[supplierId] ?? [];
        const updatedList = existing.map((p) =>
          p.id === updated.id ? updated : p
        );
        return {
          ...prev,
          [supplierId]: updatedList,
        };
      });
    } catch (error) {
      console.error("Failed to update product:", error);
      setMessage("Failed to update product.");
    } finally {
      setMessage(`Updated ${field} successfully!`);
      setUpdating(false);
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
          variant="filled"
          severity="success"
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
          {suppliers?.map((supplier) => {
            const selectedForSupplier = supplier.id
              ? selected[supplier.id] || []
              : [];
            const numSelected = selectedForSupplier.length;

            return (
              <Grid
                sx={{
                  display: "flex",
                  justifyContent: "center",
                }}
                size={12}
                key={supplier.id}
              >
                <Card raised>
                  <CardContent>
                    <TableContainer>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell align="center" colSpan={8}>
                              <Typography variant="h6">
                                {supplier.name}
                              </Typography>
                              <ButtonGroup>
                                <Tooltip arrow title="Add product">
                                  <IconButton
                                    aria-label="add"
                                    onClick={() => {
                                      setOpenAddDialog(true);
                                      setSelectedSupplier(supplier);
                                    }}
                                  >
                                    <AddBoxIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip arrow title="Delete products">
                                  <IconButton
                                    disabled={numSelected === 0}
                                    aria-label="delete"
                                    onClick={() => {
                                      handleDelete(selected);
                                    }}
                                  >
                                    <Badge
                                      badgeContent={numSelected}
                                      color="primary"
                                    >
                                      <DeleteIcon />
                                    </Badge>
                                  </IconButton>
                                </Tooltip>
                              </ButtonGroup>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell></TableCell>
                            <TableCell>Product</TableCell>
                            <TableCell>Quantity</TableCell>
                            <TableCell>Expiration</TableCell>
                            <TableCell>Cost</TableCell>
                            <TableCell>Retail</TableCell>
                            <TableCell># Sold</TableCell>
                            <TableCell>Notes</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {supplier.id
                            ? productsBySupplier[supplier.id]?.map(
                                (product) => {
                                  const isItemSelected =
                                    selectedForSupplier.includes(product.id!);
                                  return (
                                    <TableRow
                                      hover
                                      onClick={(e) =>
                                        handleClick(
                                          e,
                                          supplier.id!,
                                          product.id!
                                        )
                                      }
                                      key={product.id}
                                      selected={isItemSelected}
                                      sx={{ cursor: "pointer" }}
                                    >
                                      <TableCell></TableCell>
                                      <TableCell>
                                        <Typography>{product.name}</Typography>
                                        <Typography variant="subtitle2">
                                          {product.dose
                                            ? ` ${product.dose}mL`
                                            : ""}
                                        </Typography>
                                      </TableCell>
                                      <TableCell>
                                        <OutlinedInput
                                          type="number"
                                          size="small"
                                          defaultValue={product.quantity}
                                          disabled={updating ? true : false}
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                              const newValue = Number(
                                                e.currentTarget.value
                                              );
                                              if (
                                                newValue !== product.quantity
                                              ) {
                                                updateProduct(
                                                  product.id!,
                                                  "quantity",
                                                  newValue
                                                );
                                              }
                                              e.currentTarget.blur();
                                            }
                                          }}
                                          onBlur={(e) => {
                                            const newValue = Number(
                                              e.currentTarget.value
                                            );
                                            if (newValue !== product.quantity) {
                                              updateProduct(
                                                product.id!,
                                                "quantity",
                                                newValue
                                              );
                                            }
                                          }}
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <OutlinedInput
                                          type="date"
                                          size="small"
                                          defaultValue={product.expiration}
                                          disabled={updating ? true : false}
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                              const newValue =
                                                e.currentTarget.value;

                                              if (
                                                newValue !== product.expiration
                                              ) {
                                                updateProduct(
                                                  product.id!,
                                                  "expiration",
                                                  newValue
                                                );
                                              }
                                              e.currentTarget.blur();
                                            }
                                          }}
                                          onBlur={(e) => {
                                            const newValue =
                                              e.currentTarget.value;

                                            if (
                                              newValue !== product.expiration
                                            ) {
                                              updateProduct(
                                                product.id!,
                                                "expiration",
                                                newValue
                                              );
                                            }
                                          }}
                                        ></OutlinedInput>
                                      </TableCell>
                                      <TableCell>
                                        <OutlinedInput
                                          startAdornment={
                                            <InputAdornment position="start">
                                              $
                                            </InputAdornment>
                                          }
                                          type="number"
                                          size="small"
                                          defaultValue={product.cost}
                                          disabled={updating ? true : false}
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                              const newValue = Number(
                                                e.currentTarget.value
                                              );
                                              if (newValue !== product.cost) {
                                                updateProduct(
                                                  product.id!,
                                                  "cost",
                                                  newValue
                                                );
                                              }
                                              e.currentTarget.blur();
                                            }
                                          }}
                                          onBlur={(e) => {
                                            const newValue = Number(
                                              e.currentTarget.value
                                            );
                                            if (newValue !== product.cost) {
                                              updateProduct(
                                                product.id!,
                                                "cost",
                                                newValue
                                              );
                                            }
                                          }}
                                        ></OutlinedInput>
                                      </TableCell>
                                      <TableCell>
                                        <OutlinedInput
                                          startAdornment={
                                            <InputAdornment position="start">
                                              $
                                            </InputAdornment>
                                          }
                                          type="number"
                                          size="small"
                                          defaultValue={product.retail}
                                          disabled={updating ? true : false}
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                              const newValue = Number(
                                                e.currentTarget.value
                                              );
                                              if (newValue !== product.retail) {
                                                updateProduct(
                                                  product.id!,
                                                  "retail",
                                                  newValue
                                                );
                                              }
                                              e.currentTarget.blur();
                                            }
                                          }}
                                          onBlur={(e) => {
                                            const newValue = Number(
                                              e.currentTarget.value
                                            );
                                            if (newValue !== product.retail) {
                                              updateProduct(
                                                product.id!,
                                                "retail",
                                                newValue
                                              );
                                            }
                                          }}
                                        ></OutlinedInput>
                                      </TableCell>
                                      <TableCell>
                                        <OutlinedInput
                                          type="number"
                                          size="small"
                                          defaultValue={product.numSold}
                                          disabled={updating ? true : false}
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                              const newValue = Number(
                                                e.currentTarget.value
                                              );
                                              if (
                                                newValue !== product.numSold
                                              ) {
                                                updateProduct(
                                                  product.id!,
                                                  "numSold",
                                                  newValue
                                                );
                                              }
                                              e.currentTarget.blur();
                                            }
                                          }}
                                          onBlur={(e) => {
                                            const newValue = Number(
                                              e.currentTarget.value
                                            );
                                            if (newValue !== product.numSold) {
                                              updateProduct(
                                                product.id!,
                                                "numSold",
                                                newValue
                                              );
                                            }
                                          }}
                                        ></OutlinedInput>
                                      </TableCell>
                                      <TableCell>
                                        <OutlinedInput
                                          multiline
                                          size="small"
                                          defaultValue={product.notes}
                                          disabled={updating ? true : false}
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                              const newValue =
                                                e.currentTarget.value;
                                              if (newValue !== product.notes) {
                                                updateProduct(
                                                  product.id!,
                                                  "notes",
                                                  newValue
                                                );
                                              }
                                              e.currentTarget.blur();
                                            }
                                          }}
                                          onBlur={(e) => {
                                            const newValue =
                                              e.currentTarget.value;
                                            if (newValue !== product.notes) {
                                              updateProduct(
                                                product.id!,
                                                "notes",
                                                newValue
                                              );
                                            }
                                          }}
                                        ></OutlinedInput>
                                      </TableCell>
                                    </TableRow>
                                  );
                                }
                              )
                            : null}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Grid>
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)}>
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
                  notched
                  required
                  name="expiration"
                  label="Expiration"
                  type="date"
                />
              </FormControl>
              <FormControl fullWidth margin="dense">
                <InputLabel>Cost</InputLabel>
                <OutlinedInput
                  startAdornment={
                    <InputAdornment position="start">$</InputAdornment>
                  }
                  type="number"
                  name="cost"
                  label="Cost"
                />
              </FormControl>
              <FormControl fullWidth margin="dense">
                <InputLabel>Retail</InputLabel>
                <OutlinedInput
                  startAdornment={
                    <InputAdornment position="start">$</InputAdornment>
                  }
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
