import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactNode } from "react";
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
  useUpdateBrand,
  useUpdateCategory,
  useUpdateProduct,
  useUpdateVariant,
} from "@/features/products/api";
import type {
  BrandResponse,
  CategoryResponse,
  ProductResponse,
  ProductVariantResponse,
  UnitOfMeasure,
} from "@/types/product";

function ManageListDialog({
  label,
  triggerLabel,
  items,
  onCreate,
  onUpdate,
}: {
  label: string;
  triggerLabel: string;
  items: { id: string; name: string; active: boolean }[] | undefined;
  onCreate: (name: string) => Promise<unknown>;
  onUpdate: (id: string, input: { name: string; active: boolean }) => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  async function handleCreate() {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onCreate(name.trim());
      setName("");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveEdit(item: { id: string; active: boolean }) {
    if (!editingName.trim()) return;
    await onUpdate(item.id, { name: editingName.trim(), active: item.active });
    setEditingId(null);
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
          <DialogTitle>Manage {label}s</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder={`New ${label} name`}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Button className="h-10" disabled={submitting} onClick={handleCreate}>
              Add
            </Button>
          </div>
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {items?.map((item) => (
              <div key={item.id} className="flex items-center gap-2 rounded-md border p-2">
                {editingId === item.id ? (
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="h-8"
                    autoFocus
                  />
                ) : (
                  <span className={`flex-1 text-sm ${!item.active ? "text-muted-foreground" : ""}`}>
                    {item.name}
                  </span>
                )}
                <Badge variant={item.active ? "default" : "secondary"}>
                  {item.active ? "Active" : "Inactive"}
                </Badge>
                {editingId === item.id ? (
                  <Button size="sm" onClick={() => handleSaveEdit(item)}>
                    Save
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingId(item.id);
                      setEditingName(item.name);
                    }}
                  >
                    Edit
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onUpdate(item.id, { name: item.name, active: !item.active })}
                >
                  {item.active ? "Deactivate" : "Activate"}
                </Button>
              </div>
            ))}
            {items?.length === 0 && (
              <p className="text-sm text-muted-foreground">No {label}s yet.</p>
            )}
          </div>
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

function ProductFormDialog({
  product,
  trigger,
}: {
  product?: ProductResponse;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { data: brands } = useBrands();
  const { data: categories } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          name: product.name,
          brandId: product.brandId ?? undefined,
          categoryId: product.categoryId ?? undefined,
          unitOfMeasure: product.unitOfMeasure,
          description: product.description ?? "",
        }
      : { unitOfMeasure: "PIECE" },
  });

  function defaults(): ProductForm {
    return product
      ? {
          name: product.name,
          brandId: product.brandId ?? undefined,
          categoryId: product.categoryId ?? undefined,
          unitOfMeasure: product.unitOfMeasure,
          description: product.description ?? "",
        }
      : { name: "", unitOfMeasure: "PIECE", brandId: undefined, categoryId: undefined, description: "" };
  }

  async function onSubmit(values: ProductForm) {
    if (product) {
      await updateProduct.mutateAsync({ id: product.id, ...values, active: product.active });
    } else {
      await createProduct.mutateAsync(values);
    }
    reset(defaults());
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) reset(defaults());
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{product ? "Edit product" : "Add product"}</DialogTitle>
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
              <Select
                value={watch("brandId")}
                onValueChange={(value) => setValue("brandId", value)}
              >
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
              <Select
                value={watch("categoryId")}
                onValueChange={(value) => setValue("categoryId", value)}
              >
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
            {isSubmitting ? "Saving..." : product ? "Save changes" : "Create product"}
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

function VariantFormDialog({
  variant,
  trigger,
}: {
  variant?: ProductVariantResponse;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { data: products } = useProducts();
  const createVariant = useCreateVariant();
  const updateVariant = useUpdateVariant();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VariantFormInput, unknown, VariantForm>({
    resolver: zodResolver(variantSchema),
  });

  function defaults(): VariantFormInput {
    return variant
      ? {
          productId: variant.productId,
          sku: variant.sku,
          colorName: variant.colorName,
          shadeCode: variant.shadeCode ?? "",
          defaultSalePrice: variant.defaultSalePrice,
          reorderLevel: variant.reorderLevel,
        }
      : { productId: "", sku: "", colorName: "", shadeCode: "", defaultSalePrice: 0, reorderLevel: 0 };
  }

  async function onSubmit(values: VariantForm) {
    if (variant) {
      await updateVariant.mutateAsync({
        id: variant.id,
        sku: values.sku,
        colorName: values.colorName,
        shadeCode: values.shadeCode,
        defaultSalePrice: values.defaultSalePrice,
        reorderLevel: values.reorderLevel,
        active: variant.active,
      });
    } else {
      await createVariant.mutateAsync(values);
    }
    reset(defaults());
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) reset(defaults());
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{variant ? "Edit color variant" : "Add color variant"}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label>Product</Label>
            <Select
              value={watch("productId")}
              onValueChange={(value) => setValue("productId", value)}
              disabled={!!variant}
            >
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
            {isSubmitting ? "Saving..." : variant ? "Save changes" : "Create variant"}
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
  const { data: brands } = useBrands();
  const { data: categories } = useCategories();
  const createBrand = useCreateBrand();
  const updateBrand = useUpdateBrand();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const updateProduct = useUpdateProduct();
  const updateVariant = useUpdateVariant();

  function toggleProductActive(product: ProductResponse) {
    updateProduct.mutate({
      id: product.id,
      name: product.name,
      brandId: product.brandId ?? undefined,
      categoryId: product.categoryId ?? undefined,
      unitOfMeasure: product.unitOfMeasure,
      description: product.description ?? undefined,
      active: !product.active,
    });
  }

  function toggleVariantActive(variant: ProductVariantResponse) {
    updateVariant.mutate({
      id: variant.id,
      sku: variant.sku,
      colorName: variant.colorName,
      shadeCode: variant.shadeCode ?? undefined,
      defaultSalePrice: variant.defaultSalePrice,
      reorderLevel: variant.reorderLevel,
      active: !variant.active,
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Products</CardTitle>
          <div className="flex flex-wrap gap-2">
            <ManageListDialog
              label="brand"
              triggerLabel="Manage brands"
              items={brands as BrandResponse[] | undefined}
              onCreate={(name) => createBrand.mutateAsync(name)}
              onUpdate={(id, input) => updateBrand.mutateAsync({ id, ...input })}
            />
            <ManageListDialog
              label="category"
              triggerLabel="Manage categories"
              items={categories as CategoryResponse[] | undefined}
              onCreate={(name) => createCategory.mutateAsync(name)}
              onUpdate={(id, input) =>
                updateCategory.mutateAsync({
                  id,
                  name: input.name,
                  active: input.active,
                  parentCategoryId: categories?.find((c) => c.id === id)?.parentCategoryId,
                })
              }
            />
            <ProductFormDialog trigger={<Button>Add product</Button>} />
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productsLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
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
                  <TableCell className="flex justify-end gap-2">
                    <ProductFormDialog
                      product={product}
                      trigger={
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      }
                    />
                    <Button variant="outline" size="sm" onClick={() => toggleProductActive(product)}>
                      {product.active ? "Deactivate" : "Activate"}
                    </Button>
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
            <VariantFormDialog trigger={<Button variant="outline">Add color/variant</Button>} />
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
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variantsLoading && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
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
                  <TableCell>
                    <Badge variant={variant.active ? "default" : "secondary"}>
                      {variant.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex justify-end gap-2">
                    <VariantFormDialog
                      variant={variant}
                      trigger={
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      }
                    />
                    <Button variant="outline" size="sm" onClick={() => toggleVariantActive(variant)}>
                      {variant.active ? "Deactivate" : "Activate"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
