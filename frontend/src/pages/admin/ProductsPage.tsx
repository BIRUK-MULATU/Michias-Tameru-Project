import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useBrands,
  useCategories,
  useCreateBrand,
  useCreateCategory,
  useCreateProduct,
  useCreateVariant,
  useProducts,
  useProductVariants,
} from "@/features/products/api";
import type { UnitOfMeasure } from "@/types/product";

function QuickAddDialog({
  label,
  triggerLabel,
  onCreate,
}: {
  label: string;
  triggerLabel: string;
  onCreate: (name: string) => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onCreate(name.trim());
      setName("");
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add {label}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quick-add-name">Name</Label>
            <Input id="quick-add-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <Button className="w-full" disabled={submitting} onClick={handleCreate}>
            {submitting ? "Saving..." : `Add ${label}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const productSchema = z.object({
  name: z.string().min(1, "Required"),
  brandId: z.string().optional(),
  categoryId: z.string().optional(),
  unitOfMeasure: z.enum(["PIECE", "METER"]),
  description: z.string().optional(),
});

type ProductForm = z.infer<typeof productSchema>;

function CreateProductDialog() {
  const [open, setOpen] = useState(false);
  const { data: brands } = useBrands();
  const { data: categories } = useCategories();
  const createProduct = useCreateProduct();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: { unitOfMeasure: "PIECE" },
  });

  async function onSubmit(values: ProductForm) {
    await createProduct.mutateAsync(values);
    reset({ unitOfMeasure: "PIECE" });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add product</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add product</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="product-name">Name</Label>
            <Input id="product-name" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Brand</Label>
              <Select onValueChange={(value) => setValue("brandId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  {brands?.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select onValueChange={(value) => setValue("categoryId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Unit of measure</Label>
            <Select
              value={watch("unitOfMeasure")}
              onValueChange={(value) => setValue("unitOfMeasure", value as UnitOfMeasure)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PIECE">Piece (cone/spool/roll)</SelectItem>
                <SelectItem value="METER">Meter (length)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="product-description">Description (optional)</Label>
            <Input id="product-description" {...register("description")} />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create product"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const variantSchema = z.object({
  productId: z.string().min(1, "Required"),
  sku: z.string().min(1, "Required"),
  colorName: z.string().min(1, "Required"),
  shadeCode: z.string().optional(),
  defaultSalePrice: z.coerce.number().min(0),
  reorderLevel: z.coerce.number().min(0).optional(),
});

type VariantFormInput = z.input<typeof variantSchema>;
type VariantForm = z.output<typeof variantSchema>;

function CreateVariantDialog() {
  const [open, setOpen] = useState(false);
  const { data: products } = useProducts();
  const createVariant = useCreateVariant();
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VariantFormInput, unknown, VariantForm>({
    resolver: zodResolver(variantSchema),
  });

  async function onSubmit(values: VariantForm) {
    await createVariant.mutateAsync(values);
    reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Add color/variant</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add color variant</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label>Product</Label>
            <Select onValueChange={(value) => setValue("productId", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {products?.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.productId && (
              <p className="text-sm text-destructive">{errors.productId.message}</p>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="variant-sku">SKU</Label>
              <Input id="variant-sku" {...register("sku")} />
              {errors.sku && <p className="text-sm text-destructive">{errors.sku.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="variant-color">Color name</Label>
              <Input id="variant-color" {...register("colorName")} />
              {errors.colorName && (
                <p className="text-sm text-destructive">{errors.colorName.message}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="variant-shade">Shade code</Label>
              <Input id="variant-shade" {...register("shadeCode")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="variant-price">Sale price</Label>
              <Input id="variant-price" type="number" step="0.01" {...register("defaultSalePrice")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="variant-reorder">Reorder level</Label>
              <Input id="variant-reorder" type="number" step="1" {...register("reorderLevel")} />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create variant"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ProductsPage() {
  const [search, setSearch] = useState("");
  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: variants, isLoading: variantsLoading } = useProductVariants(search);
  const createBrand = useCreateBrand();
  const createCategory = useCreateCategory();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Products</CardTitle>
          <div className="flex flex-wrap gap-2">
            <QuickAddDialog
              label="brand"
              triggerLabel="Add brand"
              onCreate={(name) => createBrand.mutateAsync(name)}
            />
            <QuickAddDialog
              label="category"
              triggerLabel="Add category"
              onCreate={(name) => createCategory.mutateAsync(name)}
            />
            <CreateProductDialog />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productsLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              )}
              {products?.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.brandName ?? "—"}</TableCell>
                  <TableCell>{product.categoryName ?? "—"}</TableCell>
                  <TableCell>{product.unitOfMeasure}</TableCell>
                  <TableCell>
                    <Badge variant={product.active ? "default" : "secondary"}>
                      {product.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Color variants (sellable SKUs)</CardTitle>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <Input
              placeholder="Search by product, SKU, or color"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64"
            />
            <CreateVariantDialog />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Shade</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Reorder level</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variantsLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              )}
              {variants?.map((variant) => (
                <TableRow key={variant.id}>
                  <TableCell className="font-mono text-sm">{variant.sku}</TableCell>
                  <TableCell>{variant.productName}</TableCell>
                  <TableCell>{variant.colorName}</TableCell>
                  <TableCell>{variant.shadeCode ?? "—"}</TableCell>
                  <TableCell>{variant.defaultSalePrice.toFixed(2)}</TableCell>
                  <TableCell>{variant.reorderLevel}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
